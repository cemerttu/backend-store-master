// ================== IMPORTS ==================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();  // Load environment variables from .env

const app = express();
const PORT = process.env.PORT || 5000;

// ================== CORS SETUP ==================
const allowedOrigins = [
  "http://localhost:3000",                  // Local React dev
  "https://mystore-frontend.vercel.app"     // Replace with your actual Vercel frontend domain
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));

// ================== MIDDLEWARE ==================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================== DATABASE CONNECTION ==================
const MONGODB_URI = process.env.MONGODB_URI;

console.log("🔧 Environment Check:");
console.log("   PORT:", process.env.PORT);
console.log("   MONGODB_URI:", process.env.MONGODB_URI ? "✅ Loaded" : "❌ Not found");

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// ================== SCHEMAS & MODELS ==================
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  inStock: { type: Boolean, default: true },
  quantity: { type: Number, default: 0 }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

const orderSchema = new mongoose.Schema({
  customerInfo: {
    name: String,
    email: String,
    address: String,
    phone: String
  },
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,
  status: { type: String, default: "pending" }
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);

// ================== ROUTES ==================

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "Server is running!",
    port: process.env.PORT,
    database: process.env.MONGODB_URI ? "Configured" : "Not configured",
    timestamp: new Date().toISOString()
  });
});

// Products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const product = new Product(req.body);
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: "Bad request", error: error.message });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: "Bad request", error: error.message });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Orders
app.post("/api/orders", async (req, res) => {
  try {
    const order = new Order(req.body);
    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ message: "Bad request", error: error.message });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().populate("products.productId");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Contact form
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, message } = req.body;
    console.log("📧 Contact form submission:", { name, email, message });
    res.status(200).json({ success: true, message: "Message received successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ================== ERROR HANDLING ==================
app.use((err, req, res, next) => {
  console.error("❌ Global error handler:", err.stack);
  res.status(500).json({ message: "Something went wrong!", error: err.message });
});

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ================== START SERVER ==================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check at http://localhost:${PORT}/api/health`);
});
