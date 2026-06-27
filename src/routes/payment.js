const express = require("express");
const crypto = require("crypto");
const { userAuth } = require("../middlewares/auth");
const paymentRouter = express.Router();
const razorpayInstance = require("../config/razorpay");
const Payment = require("../models/payment");
const { membershipAmount } = require("../utils/constant");
const { validateWebhookSignature } = require("razorpay/dist/utils/razorpay-utils");
const User = require("../models/user");

paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const { membershipType } = req.body;
    const { firstName, lastName, emailId } = req.user;

    const order = await razorpayInstance.orders.create({
      amount: membershipAmount[membershipType],
      currency: "INR",
      receipt: "receipt#1",
      notes: {
        firstName,
        lastName,
        emailId,
        membershipType: membershipType,
      },
    });

    const payment = new Payment({
      userId: req.user._id,
      orderId: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: order.notes,
    });
    const savedPayment = await payment.save();

    res.json({ ...savedPayment.toJSON(), keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

// NEW: frontend handler se direct verify — isPremium yahin se turant true hota hai
paymentRouter.post("/payment/verify", userAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ msg: "Missing payment verification fields" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ msg: "Invalid payment signature" });
    }

    const payment = await Payment.findOne({ orderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({ msg: "Payment record not found" });
    }

    if (payment.status === "captured" && payment.paymentId) {
      return res.json({ isPremium: true, membershipType: payment.notes.membershipType });
    }

    payment.paymentId = razorpay_payment_id;
    payment.status = "captured";
    await payment.save();

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    user.isPremium = true;
    user.membershipType = payment.notes.membershipType;
    await user.save();

    return res.json({
      isPremium: true,
      membershipType: user.membershipType,
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

// Backup path agar user verify call ke beech browser band kar de — yeh background me bhi confirm kar dega
// NOTE: app.js me iss route ke liye express.raw({ type: "application/json" }) lagana zaroori hai,
// JSON parser SE PEHLE, warna signature check fail hoga.
paymentRouter.post("/payment/webhook", async (req, res) => {
  try {
    console.log("WEBHOOK HIT");
    const webhookSignature = req.get("X-Razorpay-Signature");

    const isWebhookValid = validateWebhookSignature(
      req.body, // raw buffer/string -- JSON.stringify mat karo
      webhookSignature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isWebhookValid) {
      return res.status(400).json({ msg: "Webhook signature is invalid" });
    }

    const parsedBody = JSON.parse(req.body); // raw body tha, ab parse karo
    const paymentDetails = parsedBody.payload.payment.entity;

    const payment = await Payment.findOne({ orderId: paymentDetails.order_id });
    if (!payment) {
      return res.status(404).json({ msg: "Payment not found" });
    }

    payment.paymentId = paymentDetails.id;
    payment.status = paymentDetails.status;
    await payment.save();

    const user = await User.findById(payment.userId);
    if (user) {
      user.isPremium = true;
      user.membershipType = payment.notes.membershipType;
      await user.save();
    }

    return res.status(200).json({ msg: "Webhook received successfully" });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
});

paymentRouter.get("/premium/verify", userAuth, async (req, res) => {
  const user = req.user.toJSON();
  return res.json({ ...user });
});

module.exports = paymentRouter;