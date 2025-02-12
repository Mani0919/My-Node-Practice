require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const app = express();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const PORT = 5000;
const mongoose = require("mongoose");
const verifyToken = require("./middleware/verifyToken");
// Middleware
app.use(express.json()); // Parses incoming JSON requests
app.use(cors()); // Enables CORS
app.use(express.urlencoded({ extended: true }));
app.use("/upload", express.static("upload"));

if (!fs.existsSync("./upload")) {
  fs.mkdirSync("./upload");
}

const store = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./upload");
  },
  filename: function (req, file, cd) {
    cd(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  },
});
const upload = multer({ storage: store });
// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
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

const ProfileSchema = new mongoose.Schema({
  profilepic: String,
  name: String,
  age: String,
});
const Profile = mongoose.model("Profile", ProfileSchema);
// Secret Key for JWT (Use environment variables in production)
const SECRET_KEY = process.env.JWT_SECRET || "mysecretkey";

// **Login API**
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: "User not found" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, username: user.username },
    SECRET_KEY,
    { expiresIn: "1h" }
  );
  res.json({ message: "Login successful", token });
});

app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  console.log(req.body);
  if (!username || !password)
    return res.status(400).json({ message: "All fields are required" });

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
app.post(
  "/api/upload",
  verifyToken,
  upload.single("profilepic"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "File is missing" });
      }

      const { name, age } = req.body;

      // File size check (Max 10MB)
      if (req.file.size > 10 * 1024 * 1024) {
        fs.unlinkSync(req.file.path); // Delete large file
        return res
          .status(400)
          .json({ message: "File should be less than 10MB" });
      }

      // Validate fields
      if (!name || !age) {
        fs.unlinkSync(req.file.path); // Delete file if fields are missing
        return res.status(400).json({ message: "Fields are missing" });
      }

      // Save to MongoDB
      const profile = new Profile({
        profilepic: req.file.path.replace(/\\/g, "/"), // Store file path
        name,
        age,
      });

      await profile.save();
      res.json({ message: "Profile saved successfully", profile });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

app.get("/api/all", verifyToken, async (req, res) => {
  try {
    const profiles = await Profile.find();
    res
      .status(200)
      .json({ message: "Data retrieved successfully", data: profiles });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/single/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }

    const profile = await Profile.findById(id);

    if (!profile) {
      return res.status(404).json({ message: "Invalid ID" });
    }

    res
      .status(200)
      .json({ message: "Profile fetched successfully", data: profile });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.put(
  "/api/update/:id",
  verifyToken,
  upload.single("profilepic"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { profilepic, name, age } = req.body;

      console.log(profilepic, name, age);
      // Validate ID format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      // Ensure request body is not empty
      if (!profilepic && !name && !age) {
        return res
          .status(400)
          .json({ message: "At least one field is required to update" });
      }

      // Find and update the profile
      const profile = await Profile.findByIdAndUpdate(
        id,
        { $set: req.body }, // Use `$set` to update only provided fields
        { new: true, runValidators: true }
      );

      // If profile does not exist
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      res
        .status(200)
        .json({ message: "Profile updated successfully", data: profile });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

app.delete("/api/delete/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    const profile = await Profile.findByIdAndDelete(id);
    if (!profile) {
      return res.status(400).json({ message: "Id Invalid" });
    }
    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: "internal server error" });
  }
});

// Start Server
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
