// server.js - BACKEND ONLY (remove all React code)
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;

// ================== SIMPLE CORS ==================
// Use simple CORS to avoid errors
app.use(cors());

// ================== MIDDLEWARE ==================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================== DATABASE CONNECTION ==================
const MONGODB_URI = process.env.MONGODB_URI;

console.log("🔧 Server Configuration:");
console.log("   PORT:", PORT);
console.log("   NODE_ENV:", process.env.NODE_ENV || 'development');
console.log("   MONGODB_URI:", MONGODB_URI ? "✅ Set" : "❌ Not set");

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  image: { type: String, required: true },
  category: { type: String, required: true },
  gender: { type: String, enum: ['men', 'women', 'unisex'], default: 'unisex' },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  inStock: { type: Boolean, default: true },
  quantity: { type: Number, default: 0 },
  isNew: { type: Boolean, default: false },
  isHot: { type: Boolean, default: false },
  sizes: [{ type: String }],
  colors: [{ type: String }],
  features: [{ type: String }]
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (MONGODB_URI) {
      await mongoose.connect(MONGODB_URI);
      console.log("✅ Connected to MongoDB");
    } else {
      console.log("⚠️  Running without database - using sample data");
    }
  } catch (error) {
    console.log("⚠️  MongoDB connection failed - using sample data");
  }
};
connectDB();

// ================== ROUTES ==================

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "🚀 StyleHub Backend Server is Running!",
    status: "SUCCESS",
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "Connected ✅" : "Disconnected ⚠️",
    endpoints: [
      "GET  /",
      "GET  /api/health",
      "GET  /api/products",
      "GET  /api/products/:id",
      "POST /api/seed-products",
      "POST /api/contact",
      "POST /api/orders"
    ]
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "Healthy ✅",
    server: "Express.js",
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    timestamp: new Date().toISOString()
  });
});

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    // If DB is connected, try to get products from database
    if (mongoose.connection.readyState === 1) {
      const products = await Product.find();
      if (products.length > 0) {
        return res.json({
          success: true,
          count: products.length,
          source: "database",
          products
        });
      }
    }

    // Fallback: Sample products data
    const sampleProducts = [
      {
        _id: "1",
        name: "Men's Premium Blazer",
        description: "Elevate your professional wardrobe with this premium blazer featuring superior tailoring and premium fabric.",
        price: 89.99,
        originalPrice: 119.99,
        image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop",
        category: "Men's Fashion",
        gender: "men",
        rating: 4.8,
        reviews: 124,
        inStock: true,
        isNew: true,
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["Navy", "Black", "Charcoal"],
        features: ["Premium Wool Blend", "Perfect Tailoring", "Wrinkle Resistant"]
      },
      {
        _id: "2",
        name: "Women's Summer Dress",
        description: "Embrace summer elegance with this flowing dress featuring floral patterns and comfortable fabric.",
        price: 59.99,
        originalPrice: 79.99,
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop",
        category: "Women's Fashion",
        gender: "women",
        rating: 4.6,
        reviews: 89,
        inStock: true,
        isHot: true,
        sizes: ["XS", "S", "M", "L"],
        colors: ["Floral Red", "Floral Blue", "Solid White"],
        features: ["Breathable Fabric", "Floral Pattern", "Comfort Fit"]
      }
    ];

    res.json({
      success: true,
      count: sampleProducts.length,
      source: "sample data",
      message: mongoose.connection.readyState === 1 ? "Database empty - using sample data" : "Database not connected - using sample data",
      products: sampleProducts
    });

  } catch (error) {
    console.error("Error in /api/products:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

// Other routes (keep your existing routes for products/:id, contact, orders, etc.)
app.get("/api/products/:id", async (req, res) => {
  // ... your existing code
});

app.post("/api/contact", (req, res) => {
  // ... your existing code
});

app.post("/api/orders", (req, res) => {
  // ... your existing code
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    requestedUrl: req.originalUrl,
    availableEndpoints: [
      "GET  /",
      "GET  /api/health",
      "GET  /api/products",
      "GET  /api/products/:id",
      "POST /api/seed-products",
      "POST /api/contact",
      "POST /api/orders"
    ]
  });
});

// ================== START SERVER ==================
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 STYLEHUB BACKEND SERVER STARTED!');
  console.log('='.repeat(50));
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌐 Render: https://backend-store-master.onrender.com`);
  console.log(`⚡ Port: ${PORT}`);
  console.log(`🗄️  Database: ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Disconnected ⚠️'}`);
  console.log('='.repeat(50));
});