from __future__ import annotations

import asyncio
import re
from typing import Optional

import aiohttp
import ssl
import certifi
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from typing import List, Dict, Any, Optional, Tuple
import os
import json

from models import ProductInfo
from settings import settings
from utils import parse_price, parse_weight_kg, parse_dimensions_cm, clean_text


HEADERS_BASE = {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "upgrade-insecure-requests": "1",
}


async def fetch_html(url: str) -> str:
    headers = dict(HEADERS_BASE)
    if settings.USER_AGENT:
        headers["user-agent"] = settings.USER_AGENT
    else:
        headers["user-agent"] = (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
        )

    timeout = aiohttp.ClientTimeout(total=settings.REQUEST_TIMEOUT)

    # Try multiple strategies: direct, relaxed SSL, and optional scraper API
    async def _try(session: aiohttp.ClientSession, target_url: str, ssl_ctx):
        async with session.get(target_url, allow_redirects=True, ssl=ssl_ctx) as resp:
            resp.raise_for_status()
            return await resp.text()

    async with aiohttp.ClientSession(timeout=timeout, headers=headers) as session:
        # 1) Direct with proper SSL
        try:
            ssl_ctx = ssl.create_default_context(cafile=certifi.where())
            return await _try(session, url, ssl_ctx)
        except Exception:
            pass

        # 2) Direct with less strict SSL (fallback)
        try:
            insecure_ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
            insecure_ctx.check_hostname = False
            insecure_ctx.verify_mode = ssl.CERT_NONE
            return await _try(session, url, insecure_ctx)
        except Exception:
            pass

        # 3) Try mobile user-agent (some Amazon pages are laxer on m-dot)
        if settings.SCRAPE_TRY_MOBILE:
            try:
                m_headers = dict(headers)
                m_headers["user-agent"] = (
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 "
                    "(KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
                )
                async with aiohttp.ClientSession(timeout=timeout, headers=m_headers) as m_session:
                    ssl_ctx = ssl.create_default_context(cafile=certifi.where())
                    return await _try(m_session, url.replace("www.amazon.", "m.amazon."), ssl_ctx)
            except Exception:
                pass

        # 4) curl_cffi (optional) to better mimic a browser without headless overhead
        if settings.SCRAPE_TRY_CURL_CFFI:
            try:
                from curl_cffi import requests as cffi_requests  # type: ignore
                resp = cffi_requests.get(
                    url,
                    headers=headers,
                    impersonate=settings.CURL_CFFI_IMPERSONATE,
                    timeout=settings.REQUEST_TIMEOUT,
                    allow_redirects=True,
                    verify=True,
                )
                resp.raise_for_status()
                return resp.text
            except Exception:
                pass

        # 5) Playwright headless browser (optional), can render and bypass lightweight bot checks
        if settings.SCRAPE_TRY_PLAYWRIGHT:
            try:
                from playwright.async_api import async_playwright  # type: ignore
                async with async_playwright() as p:
                    browser = await p.chromium.launch(headless=True)
                    context = await browser.new_context(
                        user_agent=headers.get("user-agent"),
                        viewport={"width": 1366, "height": 900},
                    )
                    page = await context.new_page()
                    await page.goto(url, wait_until="domcontentloaded")
                    # Try scrolling a bit then wait network idle
                    await page.wait_for_timeout(500)
                    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                    await page.wait_for_load_state("networkidle")
                    content = await page.content()
                    await context.close()
                    await browser.close()
                    if content:
                        return content
            except Exception:
                pass

        # 6) Use optional scraper API if configured
        if settings.SCRAPER_API_KEY:
            # Ensure url is a string before encoding
            url_str = str(url) if url is not None else ""
            scraper_url = (
                f"{settings.SCRAPER_API_URL}/?api_key={settings.SCRAPER_API_KEY}&url={aiohttp.helpers.quote(url_str, safe='')}"
            )
            try:
                ssl_ctx = ssl.create_default_context(cafile=certifi.where())
                return await _try(session, scraper_url, ssl_ctx)
            except Exception:
                pass

        # 7) Jina Reader proxy (free, text-oriented) as a last resort
        try:
            url_str = str(url) if url is not None else ""
            alt = "https://r.jina.ai/http/" + url_str.replace("https://", "").replace("http://", "")
            async with aiohttp.ClientSession(timeout=timeout, headers=headers) as s2:
                ssl_ctx = ssl.create_default_context(cafile=certifi.where())
                return await _try(s2, alt, ssl_ctx)
        except Exception:
            pass

        # If all fail, raise the last exception generically
        raise RuntimeError(
            "Failed to fetch URL via all strategies (direct, insecure, mobile, curl_cffi, playwright, scraper API, jina reader)"
        )


def _extract_asin(soup: BeautifulSoup) -> Optional[str]:
    # Try from data-asin
    tag = soup.find(attrs={"data-asin": True})
    if tag and tag.get("data-asin"):
        return tag.get("data-asin")
    # From product details table
    for th in soup.select("#productDetails_detailBullets_sections1 th"):
        if "ASIN" in th.get_text(strip=True):
            td = th.find_next("td")
            if td:
                return td.get_text(strip=True)
    # From bullets list
    for li in soup.select("#detailBullets_feature_div li"):
        text = li.get_text(" ", strip=True)
        if text.lower().startswith("asin"):
            parts = text.split(":", 1)
            if len(parts) == 2:
                return parts[1].strip()
    return None


def _extract_price_currency(soup: BeautifulSoup):
    # Try buybox price
    sel = [
        "#corePrice_feature_div span.a-offscreen",
        "#price_inside_buybox",
        "#tp_price_block_total_price_ww span.a-offscreen",
        "#tp_price_block_total_price span.a-offscreen",
    ]
    for s in sel:
        el = soup.select_one(s)
        if el:
            return parse_price(el.get_text(" ", strip=True))
    # Fallback search anywhere
    txt = soup.get_text(" ", strip=True)
    return parse_price(txt)


def _extract_weight(soup: BeautifulSoup) -> Optional[float]:
    # Look in product details bullets
    for li in soup.select("#detailBullets_feature_div li"):
        text = li.get_text(" ", strip=True)
        if any(k in text.lower() for k in ["weight", "item weight", "shipping weight"]):
            w = parse_weight_kg(text)
            if w:
                return w
    # Details table
    for th in soup.select("#productDetails_detailBullets_sections1 th"):
        label = th.get_text(strip=True).lower()
        if "weight" in label:
            td = th.find_next("td")
            if td:
                w = parse_weight_kg(td.get_text(" ", strip=True))
                if w:
                    return w
    # Generic search text
    txt = soup.get_text(" ", strip=True)
    return parse_weight_kg(txt)


def _extract_shipping_weight(soup: BeautifulSoup) -> Optional[float]:
    # Amazon often lists Shipping Weight separately
    for li in soup.select("#detailBullets_feature_div li"):
        text = li.get_text(" ", strip=True)
        if "shipping weight" in text.lower():
            w = parse_weight_kg(text)
            if w:
                return w
    for th in soup.select("#productDetails_detailBullets_sections1 th"):
        label = th.get_text(strip=True).lower()
        if "shipping weight" in label:
            td = th.find_next("td")
            if td:
                w = parse_weight_kg(td.get_text(" ", strip=True))
                if w:
                    return w
    return None


def _extract_dimensions(soup: BeautifulSoup):
    for li in soup.select("#detailBullets_feature_div li"):
        text = li.get_text(" ", strip=True)
        if any(k in text.lower() for k in ["dimension", "product dimensions"]):
            d = parse_dimensions_cm(text)
            if d:
                return d
    for th in soup.select("#productDetails_detailBullets_sections1 th"):
        if "dimension" in th.get_text(strip=True).lower():
            td = th.find_next("td")
            if td:
                d = parse_dimensions_cm(td.get_text(" ", strip=True))
                if d:
                    return d
    return None


def _extract_materials(soup: BeautifulSoup):
    materials = []
    for li in soup.select("#detailBullets_feature_div li"):
        t = li.get_text(" ", strip=True)
        if any(k in t.lower() for k in ["material", "materials", "fabric"]):
            materials.append(t)
    return materials[:5]


def _extract_category(soup: BeautifulSoup) -> Optional[str]:
    crumbs = soup.select("#wayfinding-breadcrumbs_container ul li a")
    if crumbs:
        return " > ".join([clean_text(c.get_text()) or "" for c in crumbs if clean_text(c.get_text())])
    return None


def _extract_bullets(soup: BeautifulSoup):
    bullets = []
    for li in soup.select("#feature-bullets li"):
        t = clean_text(li.get_text())
        if t:
            bullets.append(t)
    return bullets[:10]


def _extract_product_info_from_url(url: str) -> ProductInfo:
    """Extract basic product information from Amazon URL when scraping fails"""
    # Extract ASIN from URL
    asin_match = re.search(r'/dp/([A-Z0-9]{10})', url)
    asin = asin_match.group(1) if asin_match else None
    
    # Try to extract product keywords from URL path
    title_hints = []
    path_parts = urlparse(url).path.split('/')
    for part in path_parts:
        if part and part not in ['dp', 'gp', 'product', 'ref'] and not part.startswith('B0'):
            # Clean up URL-encoded parts and extract meaningful words
            decoded = part.replace('-', ' ').replace('_', ' ')
            if len(decoded) > 2 and not decoded.isdigit():
                title_hints.append(decoded)
    
    # Create basic product info with URL-derived data
    return ProductInfo(
        url=url,
        title=' '.join(title_hints[:3]) if title_hints else None,  # Use first few meaningful parts
        asin=asin,
        brand=None,
        price=None,
        currency=None,
        weight_kg=None,
        shipping_weight_kg=None,
        dimensions_cm=None,
        category=None,
        materials=None,
        bullets=None,
        images=None,
        raw={"text": "", "html": ""}
    )


def _extract_images(soup: BeautifulSoup):
    imgs = []
    for img in soup.select("#altImages img, #imgTagWrapperId img"):
        src = img.get("src") or img.get("data-old-hires") or img.get("data-a-dynamic-image")
        if src:
            imgs.append(src)
    return list(dict.fromkeys(imgs))[:5]


async def scrape_amazon_product_claude(html: str, url: str) -> ProductInfo:
    """Use Claude to extract product information from HTML"""
    from llm_extract import extract_facts_claude
    from settings import settings
    
    if not settings.ANTHROPIC_API_KEY:
        raise Exception("ANTHROPIC_API_KEY required for Claude-based scraping")
    
    # Create a prompt for Claude to extract product information
    prompt = f"""
    You are extracting product information from an Amazon product page HTML. 

    Return ONLY a valid JSON object with these exact fields (use null for missing data):

    {{
        "title": "Product title",
        "brand": "Brand name", 
        "asin": "10-character ASIN",
        "price": 0.0,
        "currency": "USD",
        "weight_kg": 0.0,
        "shipping_weight_kg": 0.0,
        "dimensions_cm": [0.0, 0.0, 0.0],
        "category": "Product category",
        "bullets": ["feature1", "feature2"],
        "materials": ["material1", "material2"],
        "images": ["url1", "url2"]
    }}

    Extract from this HTML (first 30000 chars):
    {html[:30000]}
    """
    
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        
        response = client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}]
        )
        
        import json
        import re
        
        # Extract JSON from Claude's response
        response_text = response.content[0].text
        
        # Try to find JSON in the response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
        else:
            json_str = response_text
            
        extracted_data = json.loads(json_str)
        
        return ProductInfo(
            url=url,
            title=extracted_data.get("title"),
            brand=extracted_data.get("brand"),
            asin=extracted_data.get("asin"),
            price=extracted_data.get("price"),
            currency=extracted_data.get("currency"),
            weight_kg=extracted_data.get("weight_kg"),
            shipping_weight_kg=extracted_data.get("shipping_weight_kg"),
            dimensions_cm=extracted_data.get("dimensions_cm"),
            category=extracted_data.get("category"),
            materials=extracted_data.get("materials", []),
            bullets=extracted_data.get("bullets", []),
            images=extracted_data.get("images", []),
            raw={"text": html[:100000]},
        )
        
    except Exception as e:
        print(f"Claude extraction failed: {e}")
        # Fallback to basic extraction
        return await scrape_amazon_product_fallback(html, url)


async def scrape_amazon_product_fallback(html: str, url: str) -> ProductInfo:
    """Fallback scraping using BeautifulSoup"""
    soup = BeautifulSoup(html, "html.parser")

    title_el = soup.select_one("#productTitle")
    brand_el = soup.select_one("#bylineInfo")

    price, currency = _extract_price_currency(soup)
    weight_kg = _extract_weight(soup)
    shipping_weight_kg = _extract_shipping_weight(soup)
    dimensions_cm = _extract_dimensions(soup)
    asin = _extract_asin(soup)
    category = _extract_category(soup)
    bullets = _extract_bullets(soup)
    materials = _extract_materials(soup)
    images = _extract_images(soup)

    return ProductInfo(
        url=url,
        title=title_el.get_text(strip=True) if title_el else None,
        brand=brand_el.get_text(strip=True) if brand_el else None,
        asin=asin,
        price=price,
        currency=currency,
        weight_kg=weight_kg,
        shipping_weight_kg=shipping_weight_kg,
        dimensions_cm=dimensions_cm,
        category=category,
        materials=materials,
        bullets=bullets,
        images=images,
        raw={"text": soup.get_text(" ", strip=True)[:100000]},
    )


async def scrape_amazon_product(url: str, html: str | None = None) -> ProductInfo:
    if html is None:
        try:
            html = await fetch_html(url)
            print(f"   Fetched HTML length: {len(html)} characters")
        except Exception as e:
            print(f"   AMAZON SCRAPING ERROR: Failed to fetch HTML: {e}")
            raise
    
    # Use fallback extraction (more reliable than Claude for scraping)
    try:
        result = await scrape_amazon_product_fallback(html, url)
        print(f"   Extraction result: title='{result.title}', asin='{result.asin}'")
        return result
    except Exception as e:
        print(f"   Fallback extraction failed: {e}")
        raise
