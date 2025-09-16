# Offset - Carbon Footprint Tracker

A web app + browser extension for HackMIT 2025 that helps users track and reduce their delivery carbon footprint through smart shopping recommendations.

## Live Demo

- **Web App**: [https://hackmit25.vercel.app/](https://hackmit25.vercel.app/)
- **HackMIT Project**: [https://plume.hackmit.org/project/smoyj-isteg-lvkpn-nldyh](https://plume.hackmit.org/project/smoyj-isteg-lvkpn-nldyh)

## Features

- **Product Carbon Footprint Calculator**: Estimates CO2 emissions for product deliveries
- **Smart Alternatives**: Recommends greener shipping options (slower delivery, local pickup, consolidation)
- **Purchase Tracking**: Dashboard showing carbon footprint trends over time
- **Rewards System**: Points, streaks, and badges for choosing eco-friendly options
- **Browser Extension**: Automatically detects product pages and shows carbon impact

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Python FastAPI, SQLAlchemy
- **Extension**: Chrome Extension (Manifest V3)
- **Charts**: Recharts for data visualization

## Quick Start

### 1. Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
pip install -r requirements.txt
```

### 2. Start the Backend

```bash
cd backend
python main.py
```

The API will be available at `http://localhost:8000`

### 3. Start the Frontend

```bash
npm run dev
```

The web app will be available at `http://localhost:3000`

### 4. Load the Browser Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `extension` folder
4. The Offset extension will appear in your toolbar

## How It Works

1. **CO2 Estimation**: Uses product weight, shipping distance, and delivery mode to calculate carbon footprint
2. **Alternative Generation**: Suggests greener options like slower shipping, local pickup, or consolidated orders
3. **Tracking**: Logs purchases and tracks carbon savings over time
4. **Rewards**: Awards points for choosing eco-friendly alternatives

## Demo Flow

1. Visit a product page on Amazon, Target, or Walmart
2. The browser extension detects the product and shows estimated CO2
3. Click "View Details" to see full breakdown and alternatives
4. Choose a greener option to earn points and reduce footprint
5. Track progress on the dashboard

## API Endpoints

- `POST /estimate` - Calculate carbon footprint for a product
- `GET /health` - Health check endpoint

## Future Integrations

- **Knot TransactionLink**: Purchase verification and rewards
- **Claude**: LLM-powered product analysis
- **Rox**: Data cleaning and confidence scoring

Built for HackMIT 2025 Sustainability Track 🌱
