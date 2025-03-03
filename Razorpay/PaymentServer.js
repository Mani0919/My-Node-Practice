require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Razorpay with API Keys
const razorpay = new Razorpay({
  key_id: "rzp_test_HsQvSfQkRqaNWN", // Store keys in .env
  key_secret: "DmJEesW997kI4EuRR0Rtdh30",
});

// Create an order
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;
    console.log(amount);
    const options = {
      amount: amount * 100, // Razorpay accepts amount in paise (INR 100 = 10000 paise)
      currency: "INR",
      receipt: `order_rcptid_${Math.floor(Math.random() * 1000)}`,
      payment_capture: 1, // Auto-captures the payment
    };

    const order = await razorpay.orders.create(options);
    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify Payment Signature
app.post("/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      res.json({ success: true, message: "Payment Verified Successfully" });
    } else {
      res.status(400).json({ success: false, message: "Payment Verification Failed" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
