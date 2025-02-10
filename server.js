require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bodyParser = require("body-parser");
const generateHash = require("./test");
const app = express();
const PORT = 5000;
const mongoose = require("mongoose");
// Middleware
app.use(express.json()); // Parses incoming JSON requests
app.use(cors()); // Enables CORS


// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Define a User Model
const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
});
const User = mongoose.model("User", UserSchema);

// Secret Key for JWT (Use environment variables in production)
const SECRET_KEY = process.env.JWT_SECRET || "mysecretkey";

// **Login API**
app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
  
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found" });
  
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });
  
    const token = jwt.sign({ id: user._id, username: user.username }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ message: "Login successful", token });
  });

app.post("/api/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "All fields are required" });

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // Hash password
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save(); // Save user to MongoDB

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
});
// **Protected Route Example**
app.get("/api/profile", verifyToken, (req, res) => {
  res.json({ message: "Welcome to your profile!", user: req.user });
});

// Middleware to verify JWT
function verifyToken(req, res, next) {
  const token = req.header("Authorization");
  console.log(token);
  if (!token) return res.status(403).json({ message: "Access denied" });

  try {
    console.log("---", token.split(" ")[1]);
    const verified = jwt.verify(token.split(" ")[1], SECRET_KEY);
    console.log(verified);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
}

// Start Server
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
