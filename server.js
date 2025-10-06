// ================== IMPORTS ==================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// ================== CORS SETUP ==================
const allowedOrigins = [
  "http://localhost:3000",                  // Local React dev
  "https://mystore-frontend.vercel.app",    // Your Vercel frontend
  "http://localhost:3001",                  // Additional local port
  "https://stylehub-frontend.vercel.app"    // Your actual frontend domain
];

// Simple CORS configuration
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// ================== MIDDLEWARE ==================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================== DATABASE CONNECTION ==================
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/stylehub";

console.log("🔧 Environment Check:");
console.log("   PORT:", PORT);
console.log("   MONGODB_URI:", MONGODB_URI ? "✅ Loaded" : "❌ Not found");

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000 // 10 sec timeout
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => {
  console.error("❌ MongoDB connection error:", err);
  console.log("💡 Tip: Make sure your MONGODB_URI is set in .env file");
});

// ================== ENHANCED SCHEMAS & MODELS ==================
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number }, // For discounts
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

const orderSchema = new mongoose.Schema({
  customerInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    image: { type: String },
    size: { type: String },
    color: { type: String }
  }],
  totalAmount: { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], 
    default: "pending" 
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  orderNumber: { type: String, unique: true }
}, { timestamps: true });

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await Order.countDocuments();
    this.orderNumber = `SH${Date.now()}${count + 1}`;
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);

// Contact schema
const contactSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  subject: { type: String },
  message: { type: String, required: true },
  status: { type: String, enum: ['new', 'read', 'replied'], default: 'new' }
}, { timestamps: true });

const Contact = mongoose.model("Contact", contactSchema);

// ================== ENHANCED ROUTES ==================

// Health check with more details
app.get("/api/health", (req, res) => {
  res.json({
    status: "Server is running! 🚀",
    port: PORT,
    database: mongoose.connection.readyState === 1 ? "Connected ✅" : "Disconnected ❌",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ================== PRODUCT ROUTES ==================
app.get("/api/products", async (req, res) => {
  try {
    const { category, gender, search, sort, limit } = req.query;
    let query = {};
    
    // Filter by category
    if (category) query.category = new RegExp(category, 'i');
    
    // Filter by gender
    if (gender) query.gender = gender;
    
    // Search by name
    if (search) query.name = new RegExp(search, 'i');
    
    let sortOption = {};
    if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };
    else if (sort === 'rating') sortOption = { rating: -1 };
    else sortOption = { createdAt: -1 }; // Default sort
    
    const productsLimit = limit ? parseInt(limit) : 0;
    
    const products = await Product.find(query)
      .sort(sortOption)
      .limit(productsLimit);
    
    res.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

app.get("/api/products/featured", async (req, res) => {
  try {
    const featuredProducts = await Product.find({ 
      $or: [{ isNew: true }, { isHot: true }] 
    }).limit(6);
    
    res.json({
      success: true,
      products: featuredProducts
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

app.get("/api/products/bestsellers", async (req, res) => {
  try {
    const bestsellers = await Product.find()
      .sort({ rating: -1, reviews: -1 })
      .limit(8);
    
    res.json({
      success: true,
      products: bestsellers
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: "Product not found" 
      });
    }
    res.json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

// ================== ORDER ROUTES ==================
app.post("/api/orders", async (req, res) => {
  try {
    const order = new Order(req.body);
    const savedOrder = await order.save();
    
    // Populate product details for response
    await savedOrder.populate('products.productId');
    
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: savedOrder
    });
  } catch (error) {
    res.status(400).json({ 
      success: false,
      message: "Bad request", 
      error: error.message 
    });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const { email } = req.query;
    let query = {};
    
    if (email) {
      query['customerInfo.email'] = email;
    }
    
    const orders = await Order.find(query)
      .populate("products.productId")
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

app.get("/api/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("products.productId");
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

// ================== CONTACT ROUTES ==================
app.post("/api/contact", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, subject, message } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }
    
    const contact = new Contact({
      firstName,
      lastName,
      email,
      phone,
      subject,
      message
    });
    
    await contact.save();
    
    console.log("📧 Contact form submission received:", { 
      name: `${firstName} ${lastName}`, 
      email, 
      subject 
    });
    
    res.status(200).json({ 
      success: true, 
      message: "Message received successfully. We'll get back to you soon!" 
    });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
});

// ================== SEED DATA ROUTE (for development) ==================
app.post("/api/seed-products", async (req, res) => {
  try {
    // Sample products data that matches your frontend
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
        quantity: 50,
        isNew: true,
        isHot: false,
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
        quantity: 35,
        isNew: false,
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
        quantity: 25,
        isNew: false,
        isHot: false,
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
        quantity: 15,
        isNew: true,
        isHot: false,
        sizes: ["One Size"],
        colors: ["Black", "Brown", "Tan"],
        features: ["Genuine Leather", "Multiple Compartments", "Adjustable Strap"]
      }
    ];

    await Product.deleteMany({}); // Clear existing products
    const products = await Product.insertMany(sampleProducts);
    
    res.json({
      success: true,
      message: "Sample products added successfully",
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

// ================== ERROR HANDLING ==================
app.use((err, req, res, next) => {
  console.error("❌ Global error handler:", err.stack);
  res.status(500).json({ 
    success: false,
    message: "Something went wrong!", 
    error: process.env.NODE_ENV === 'production' ? {} : err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: "Route not found" 
  });
});

// ================== START SERVER ==================
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🛍️  Products API: http://localhost:${PORT}/api/products`);
  console.log(`📦 Orders API: http://localhost:${PORT}/api/orders`);
  console.log(`📧 Contact API: http://localhost:${PORT}/api/contact`);
  console.log(`\n💡 To seed sample data: POST http://localhost:${PORT}/api/seed-products`);
});