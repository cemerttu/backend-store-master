// server.js - FIXED VERSION
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;

// ================== MIDDLEWARE ==================
app.use(cors());
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
      },
      {
        _id: "3",
        name: "Men's Running Shoes",
        description: "High-performance running shoes with advanced cushioning and breathable mesh upper.",
        price: 79.99,
        originalPrice: 99.99,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
        category: "Men's Footwear",
        gender: "men",
        rating: 4.5,
        reviews: 156,
        inStock: true,
        sizes: ["8", "9", "10", "11", "12"],
        colors: ["Black", "Blue", "White"],
        features: ["Advanced Cushioning", "Breathable Mesh", "Durable Sole"]
      },
      {
        _id: "4",
        name: "Women's Designer Handbag",
        description: "Elegant leather handbag with multiple compartments and adjustable strap.",
        price: 69.99,
        originalPrice: 89.99,
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",
        category: "Women's Accessories",
        gender: "women",
        rating: 4.9,
        reviews: 67,
        inStock: true,
        isNew: true,
        sizes: ["One Size"],
        colors: ["Black", "Brown", "Tan"],
        features: ["Genuine Leather", "Multiple Compartments", "Adjustable Strap"]
      },
      {
        _id: "5",
        name: "Men's Casual T-Shirt",
        description: "Comfortable and stylish casual t-shirt made from 100% cotton.",
        price: 24.99,
        originalPrice: 34.99,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
        category: "Men's Casual",
        gender: "men",
        rating: 4.3,
        reviews: 203,
        inStock: true,
        sizes: ["S", "M", "L", "XL"],
        colors: ["White", "Black", "Gray", "Navy"],
        features: ["100% Cotton", "Premium Fit", "Machine Washable"]
      },
      {
        _id: "6",
        name: "Women's Elegant Skirt",
        description: "Flowy and elegant skirt perfect for both casual and formal occasions.",
        price: 45.99,
        originalPrice: 59.99,
        image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop",
        category: "Women's Fashion",
        gender: "women",
        rating: 4.7,
        reviews: 94,
        inStock: true,
        isHot: true,
        sizes: ["XS", "S", "M", "L"],
        colors: ["Black", "Navy", "Burgundy"],
        features: ["Flowy Design", "Comfortable Waistband", "Easy Care"]
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

// Get single product
app.get("/api/products/:id", async (req, res) => {
  try {
    const productId = req.params.id;

    // If DB is connected, try to find product
    if (mongoose.connection.readyState === 1) {
      const product = await Product.findById(productId);
      if (product) {
        return res.json({
          success: true,
          product
        });
      }
    }

    // Fallback: Find in sample data
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

    const product = sampleProducts.find(p => p._id === productId);
    if (product) {
      return res.json({
        success: true,
        product,
        source: "sample data"
      });
    }

    res.status(404).json({
      success: false,
      message: "Product not found"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product",
      error: error.message
    });
  }
});

// Seed products into database
app.post("/api/seed-products", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database not connected. Please set MONGODB_URI environment variable."
      });
    }

    const sampleProducts = [
      {
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
      },
      {
        name: "Men's Running Shoes",
        description: "High-performance running shoes with advanced cushioning and breathable mesh upper.",
        price: 79.99,
        originalPrice: 99.99,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
        category: "Men's Footwear",
        gender: "men",
        rating: 4.5,
        reviews: 156,
        inStock: true,
        sizes: ["8", "9", "10", "11", "12"],
        colors: ["Black", "Blue", "White"],
        features: ["Advanced Cushioning", "Breathable Mesh", "Durable Sole"]
      },
      {
        name: "Women's Designer Handbag",
        description: "Elegant leather handbag with multiple compartments and adjustable strap.",
        price: 69.99,
        originalPrice: 89.99,
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",
        category: "Women's Accessories",
        gender: "women",
        rating: 4.9,
        reviews: 67,
        inStock: true,
        isNew: true,
        sizes: ["One Size"],
        colors: ["Black", "Brown", "Tan"],
        features: ["Genuine Leather", "Multiple Compartments", "Adjustable Strap"]
      }
    ];

    await Product.deleteMany({});
    const products = await Product.insertMany(sampleProducts);

    res.json({
      success: true,
      message: "Sample products added to database successfully!",
      count: products.length,
      products
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error seeding products",
      error: error.message
    });
  }
});

// Contact form
app.post("/api/contact", (req, res) => {
  try {
    const { name, email, message, subject } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and message"
      });
    }

    console.log("📧 Contact form submission:", { name, email, subject, message });

    res.json({
      success: true,
      message: "Thank you for your message! We will get back to you soon.",
      received: {
        name,
        email,
        subject,
        message
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error processing contact form",
      error: error.message
    });
  }
});

// Create order
app.post("/api/orders", async (req, res) => {
  try {
    const { customerInfo, products, totalAmount } = req.body;

    if (!customerInfo || !products || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Please provide customer info, products, and total amount"
      });
    }

    // In a real app, you would save to database
    // For now, just return success
    const order = {
      orderId: "ORD" + Date.now(),
      customerInfo,
      products,
      totalAmount,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: "Order created successfully!",
      order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error.message
    });
  }
});

// FIXED: 404 handler - Use proper syntax for Express 5
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
  console.log('📋 AVAILABLE ENDPOINTS:');
  console.log('   GET  /                 - Server info');
  console.log('   GET  /api/health       - Health check');
  console.log('   GET  /api/products     - Get all products');
  console.log('   GET  /api/products/:id - Get single product');
  console.log('   POST /api/seed-products- Add sample data to DB');
  console.log('   POST /api/contact      - Contact form');
  console.log('   POST /api/orders       - Create order');
  console.log('='.repeat(50) + '\n');
});