import Stripe from "stripe";
import { Class } from "../models/Class.js";
import { Booking } from "../models/Booking.js";
import { Transaction } from "../models/Transaction.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_build");

// POST /api/payments/create-payment-intent
export const createPaymentIntent = async (req, res, next) => {
  try {
    const { classId } = req.body;

    const classData = await Class.findById(classId);
    if (!classData || classData.status !== "approved") {
      return res.status(404).json({ success: false, message: "Valid approved class not found" });
    }

    const existingBooking = await Booking.findOne({ userId: req.user._id, classId });
    if (existingBooking) {
      return res.status(409).json({ success: false, message: "You have already booked this class" });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(classData.price * 100), // convert to cents
      currency: "usd",
      metadata: {
        userId: req.user._id.toString(),
        classId: classId.toString(),
      },
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/payments/confirm-booking
export const confirmBooking = async (req, res, next) => {
  try {
    const { paymentIntentId, classId } = req.body;

    if (!paymentIntentId || !classId) {
      return res.status(400).json({ success: false, message: "paymentIntentId and classId are required" });
    }

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const existingBooking = await Booking.findOne({ userId: req.user._id, classId });
    if (existingBooking) {
      return res.status(409).json({ success: false, message: "You have already booked this class" });
    }

    const existingTransaction = await Transaction.findOne({ paymentIntentId });
    if (existingTransaction) {
      return res.status(409).json({ success: false, message: "Transaction already processed" });
    }

    // Verify Payment Intent via Stripe API
    // Actually, in production, Stripe Webhooks are more reliable.
    // For this project, we'll verify it manually here too.
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid payment intent" });
    }

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ success: false, message: "Payment not successful" });
    }

    // Save transaction
    const transaction = await Transaction.create({
      userId: req.user._id,
      userEmail: req.user.email,
      classId,
      className: classData.className,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      transactionId: paymentIntent.id,
      paymentIntentId: paymentIntent.id,
      status: "succeeded"
    });

    // Save booking
    const booking = await Booking.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      classId,
      className: classData.className,
      trainerId: classData.trainerId,
      trainerName: classData.trainerName,
      schedule: classData.schedule,
      price: classData.price,
      paymentStatus: "paid",
      transactionId: paymentIntent.id
    });

    // Increment class booking count
    classData.bookingCount += 1;
    await classData.save();

    res.status(200).json({ success: true, message: "Booking confirmed", data: booking });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Duplicate processing" });
    }
    next(error);
  }
};

// POST /api/payments/webhook
export const webhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
    // Business logic handled in confirm-booking endpoint to prevent race conditions or missing data,
    // but in a real-world app you'd finalize it here.
  }

  res.status(200).json({ received: true });
};

// GET /api/payments/my-transactions
export const getMyTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
};
