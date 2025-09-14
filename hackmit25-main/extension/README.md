# 🌱 EcoTrack Chrome Extension

A Honey-like Chrome extension that suggests eco-friendly product alternatives while you shop on Amazon. EcoTrack helps you make more sustainable purchasing decisions by showing products with lower carbon footprints.

## ✨ Features

- **Automatic Product Detection**: Detects when you're viewing products on Amazon
- **Carbon Footprint Display**: Shows the carbon footprint of the current product
- **Eco-Friendly Alternatives**: Suggests similar products with lower carbon emissions
- **Honey-Style Interface**: Beautiful, non-intrusive overlay that slides in from the right
- **One-Click Shopping**: Click any alternative to navigate directly to that product
- **Real-time Updates**: Updates automatically as you browse different products

## 🚀 Installation

### Method 1: Load as Unpacked Extension (Development)

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/` in your Chrome browser
   - Or go to Chrome menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to the `extension` folder in this project
   - Select the folder and click "Open"

4. **Verify Installation**
   - You should see the EcoTrack extension appear in your extensions list
   - The 🌱 icon should appear in your Chrome toolbar

### Method 2: Install from Chrome Web Store (Coming Soon)
*This extension will be available on the Chrome Web Store soon.*

## 📱 How to Use

### 1. Browse Amazon Products
- Navigate to any Amazon product page (e.g., `amazon.com/dp/XXXXXXXXXX`)
- The extension automatically detects supported products

### 2. View Eco-Friendly Alternatives
- If eco-friendly alternatives are available, a widget will slide in from the right
- The widget shows:
  - Current product's carbon footprint
  - List of alternative products with lower emissions
  - Percentage of CO₂ savings for each alternative
  - Price comparison

### 3. Shop Eco-Friendly Options
- Click on any alternative product to view it on Amazon
- Use the "Shop Now" button to navigate directly to the product page
- Close the widget anytime by clicking the ✕ button

### 4. Extension Popup
- Click the 🌱 EcoTrack icon in your toolbar
- View your eco-impact statistics
- See how many alternatives you've discovered
- Quick access to find alternatives for the current page

## 🛍️ Supported Products

Currently supports products in the following categories:
- **Electronics**: Bluetooth earbuds, speakers, headphones
- **Food**: Potato chips and snacks
- **Personal Care**: Shampoos and hair care products

*More product categories coming soon!*

## 🎨 Interface Overview

### Main Widget
- **Header**: Shows EcoTrack branding and close button
- **Current Product**: Displays the carbon footprint of the product you're viewing
- **Alternatives List**: Shows eco-friendly alternatives with:
  - Product name and price
  - Carbon footprint reduction percentage
  - Direct shopping links

### Extension Popup
- **Statistics**: Your total CO₂ savings and alternatives found
- **Product Detection**: Shows if the current page has a supported product
- **Quick Actions**: Find alternatives or open the dashboard

## 🔧 Technical Details

### Architecture
- **Content Script**: Detects product pages and injects the eco-widget
- **Background Script**: Handles extension lifecycle and messaging
- **Popup**: Provides quick access and statistics
- **Hardcoded Database**: Uses curated product data with carbon footprints

### Data Source
The extension uses a curated database of products with calculated carbon footprints based on:
- Manufacturing emissions
- Transportation distance
- Packaging materials
- Product lifecycle analysis

### Browser Compatibility
- **Chrome**: Version 88+ (Manifest V3)
- **Edge**: Version 88+ (Chromium-based)
- **Other Browsers**: Not currently supported

## 🛠️ Development

### File Structure
```
extension/
├── manifest.json          # Extension configuration
├── content.js            # Main detection and widget logic
├── content.css           # Widget styling
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── background.js         # Background service worker
└── README.md            # This file
```

### Key Functions
- `detectProductPage()`: Identifies Amazon product pages
- `extractASIN()`: Extracts product identifier from URLs
- `getEcoFriendlyAlternatives()`: Finds lower-carbon alternatives
- `createEcoWidget()`: Builds and displays the suggestion widget

### Customization
To add more products:
1. Update the `carbonData` object in both `content.js` and `popup.js`
2. Add product information including name, price, carbon footprint, and similar ASINs
3. Ensure ASINs are valid Amazon product identifiers

## 🌍 Environmental Impact

EcoTrack helps reduce your carbon footprint by:
- **Raising Awareness**: Shows the environmental cost of your purchases
- **Providing Alternatives**: Suggests products with lower emissions
- **Tracking Progress**: Monitors your eco-friendly choices over time
- **Encouraging Change**: Makes sustainable shopping easier and more accessible

## 🐛 Troubleshooting

### Extension Not Working
1. **Check Permissions**: Ensure the extension has access to Amazon sites
2. **Reload Extension**: Go to `chrome://extensions/` and click the reload button
3. **Clear Cache**: Clear browser cache and reload the product page
4. **Check Console**: Open Developer Tools (F12) and check for error messages

### Widget Not Appearing
1. **Verify Product Support**: Only certain products have alternatives in our database
2. **Check URL Format**: Ensure you're on a product page (`/dp/` or `/gp/product/`)
3. **Refresh Page**: Sometimes a page refresh helps the extension detect the product

### Performance Issues
1. **Close Other Extensions**: Disable other extensions temporarily to test
2. **Update Chrome**: Ensure you're running the latest version of Chrome
3. **Restart Browser**: Close and reopen Chrome completely

## 📞 Support

For issues, suggestions, or contributions:
- **GitHub Issues**: Report bugs and request features
- **Email**: Contact the development team
- **Documentation**: Check this README for common solutions

## 🔮 Future Features

Coming soon:
- **More Product Categories**: Clothing, home goods, electronics
- **Price Tracking**: Monitor price changes for eco-friendly alternatives
- **Carbon Calculator**: Detailed breakdown of environmental impact
- **Social Features**: Share your eco-friendly finds with friends
- **Retailer Expansion**: Support for Target, Walmart, and other stores

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Carbon footprint data sourced from environmental research databases
- UI design inspired by Honey and other shopping extensions
- Built with modern web technologies and Chrome Extension APIs

---

**Happy Eco-Friendly Shopping! 🌱🛍️**
