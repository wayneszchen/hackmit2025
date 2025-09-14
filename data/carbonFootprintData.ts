export interface ProductRecommendation {
  currentProduct: {
    name: string;
    carbonFootprint: number;
  };
  recommendedProduct: {
    name: string;
    carbonFootprint: number;
    amazonUrl: string;
    image: string;
  };
}

export const carbonFootprintRecommendations: Record<string, ProductRecommendation> = {
  "Philips Norelco OneBlade Hybrid Electric Trimmer and Shaver": {
    currentProduct: {
      name: "Philips Norelco OneBlade Hybrid Electric Trimmer and Shaver",
      carbonFootprint: 1.165
    },
    recommendedProduct: {
      name: "Philips OneBlade Hybrid Electric Trimmer and Shaver, QP2520",
      carbonFootprint: 0.538,
      amazonUrl: "https://www.amazon.com/d/B01FG2RLOE?th=1",
      image: "/images/oneblade.jpg"
    }
  },
  "Vitamix E310 Explorian Blender, Professional-Grade, 48 oz. Container": {
    currentProduct: {
      name: "Vitamix E310 Explorian Blender, Professional-Grade, 48 oz. Container",
      carbonFootprint: 32.907
    },
    recommendedProduct: {
      name: "Vitamix Explorian Blender, Professional-Grade, 64 oz. Low-Profile Container, Black - 65542 (Renewed Premium)",
      carbonFootprint: 30.062,
      amazonUrl: "https://www.amazon.com/d/B07CX95VRT",
      image: "/images/vitamix.jpg"
    }
  },
  "TP-Link AC1750 Smart WiFi Router - Dual Band Gigabit Wireless Internet Router": {
    currentProduct: {
      name: "TP-Link AC1750 Smart WiFi Router - Dual Band Gigabit Wireless Internet Router",
      carbonFootprint: 3.329
    },
    recommendedProduct: {
      name: "TP-Link AX1800 WiFi 6 Router V4 (Archer AX21) – Dual Band Wireless Internet, Gigabit, Easy Mesh, Works with Alexa - A Certified for Humans Device, Free Expert Support",
      carbonFootprint: 0.796,
      amazonUrl: "https://www.amazon.com/d/B08H8ZLKKK?th=1",
      image: "/images/tplinkwifi6.jpg"
    }
  },
  "AmazonBasics Lightweight Super Soft Easy Care Microfiber Bed Sheet Set": {
    currentProduct: {
      name: "AmazonBasics Lightweight Super Soft Easy Care Microfiber Bed Sheet Set",
      carbonFootprint: 13.596
    },
    recommendedProduct: {
      name: "Amazon Basics 4 Piece Bed Sheet Set, 100% Cotton Jersey, Includes Super Soft, Flat and Fitted Sheets, Pillowcase, Queen, Dark Gray, Solid",
      carbonFootprint: 8.163,
      amazonUrl: "https://www.amazon.com/d/B01BTBRDE4?th=1",
      image: "/images/amazon4piece.jpg"
    }
  },
  "Furbo Dog Camera: Treat Tossing, Full HD Wifi Pet Camera and 2-Way Audio": {
    currentProduct: {
      name: "Furbo Dog Camera: Treat Tossing, Full HD Wifi Pet Camera and 2-Way Audio",
      carbonFootprint: 7.765
    },
    recommendedProduct: {
      name: "2K Pet Camera Treat Dispenser, AI Photo Album, Dog Camera with 360° Auto Tracking & 5G/2.4G WiFi, 2-Way Talk, Remote Treat Tossing, Motion Alerts for Cats Indoor",
      carbonFootprint: 6.234,
      amazonUrl: "https://www.amazon.com/d/B0DZ6NMTY9?th=1",
      image: "/images/tkenpro.jpg"
    }
  }
};
