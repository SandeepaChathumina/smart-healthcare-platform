import mongoose from "mongoose";
import Stripe from "stripe";
import Payment from "../models/Payment.js";
import Appointment from "../models/Appointment.js";
import TelemedicineSession from "../models/TelemedicineSession.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getStripeClient = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return null;
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

const generateTransactionId = () => {
  return `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
};

const generateRoomName = (appointmentId) => {
  return `smart-health-${appointmentId}-${Date.now()}`;
};

const generateMeetingLink = (roomName) => {
  return `https://meet.jit.si/${roomName}`;
};

const ensureTelemedicineSessionForAppointment = async (appointment) => {
  if (appointment.appointmentType !== "telemedicine") {
    return null;
  }

  let existingSession = null;

  if (appointment.telemedicineSessionId) {
    existingSession = await TelemedicineSession.findById(
      appointment.telemedicineSessionId
    );
  }

  if (!existingSession) {
    existingSession = await TelemedicineSession.findOne({
      appointmentId: appointment._id,
    });
  }

  if (existingSession) {
    if (!appointment.telemedicineSessionId) {
      appointment.telemedicineSessionId = existingSession._id;
      appointment.isTelemedicineLinkGenerated = true;
      await appointment.save();
    }
    return existingSession;
  }

  const roomName = generateRoomName(appointment._id);

  const session = await TelemedicineSession.create({
    appointmentId: appointment._id,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    platform: "jitsi",
    roomName,
    meetingLink: generateMeetingLink(roomName),
    scheduledStartTime:
      appointment.scheduledDateTime || appointment.preferredDateTime,
    scheduledEndTime: null,
    sessionNotes: "",
    createdBy: "system",
    status: "scheduled",
  });

  appointment.telemedicineSessionId = session._id;
  appointment.isTelemedicineLinkGenerated = true;
  await appointment.save();

  return session;
};

const finalizeSuccessfulPayment = async ({
  appointment,
  method = "card",
  transactionId = "",
  gatewayResponse = "",
  notes = "",
}) => {
  let payment = await Payment.findOne({
    appointmentId: appointment._id,
    status: "paid",
  });

  if (!payment) {
    payment = await Payment.create({
      appointmentId: appointment._id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      amount: appointment.consultationFee,
      method,
      transactionId: transactionId || generateTransactionId(),
      gatewayResponse: gatewayResponse || "Payment success",
      status: "paid",
      notes,
    });
  }

  appointment.paymentStatus = "paid";
  appointment.status = "confirmed";
  appointment.paidAt = appointment.paidAt || new Date();
  await appointment.save();

  const session = await ensureTelemedicineSessionForAppointment(appointment);

  return { payment, appointment, session };
};

export const createStripeCheckoutSession = async (req, res) => {
  try {
    const stripe = getStripeClient();

    if (!stripe) {
      return res.status(500).json({
        message:
          "Stripe is not configured. Please set STRIPE_SECRET_KEY in appointment-service .env",
      });
    }

    const { appointmentId } = req.params;
    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (!isValidObjectId(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (
      req.user.role !== "Patient" ||
      String(appointment.patientId) !== String(loggedInUserId)
    ) {
      return res
        .status(403)
        .json({ message: "You can only pay for your own appointment" });
    }

    if (appointment.status !== "awaiting_payment") {
      return res
        .status(400)
        .json({ message: "This appointment is not ready for payment" });
    }

    if (appointment.paymentStatus === "paid") {
      return res.status(400).json({ message: "This appointment is already paid" });
    }

    const frontendBaseUrl =
      process.env.FRONTEND_BASE_URL || "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      success_url: `${frontendBaseUrl}/patient/appointments/${appointment._id}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendBaseUrl}/patient/appointments/${appointment._id}/pay`,
      customer_email: req.user?.email || undefined,
      metadata: {
        appointmentId: String(appointment._id),
        patientId: String(appointment.patientId),
        doctorId: String(appointment.doctorId),
      },
      line_items: [
        {
          price_data: {
            currency: "lkr",
            product_data: {
              name: `Healthcare Appointment - ${appointment.appointmentType}`,
              description: appointment.reason || "Doctor consultation",
            },
            unit_amount: Math.round(Number(appointment.consultationFee) * 100),
          },
          quantity: 1,
        },
      ],
    });

    return res.status(200).json({
      message: "Stripe checkout session created successfully",
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create Stripe checkout session",
      error: error.message,
    });
  }
};

export const confirmStripePayment = async (req, res) => {
  try {
    const stripe = getStripeClient();

    if (!stripe) {
      return res.status(500).json({
        message:
          "Stripe is not configured. Please set STRIPE_SECRET_KEY in appointment-service .env",
      });
    }

    const { sessionId, appointmentId } = req.body || {};
    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (!sessionId || !appointmentId) {
      return res.status(400).json({
        message: "sessionId and appointmentId are required",
      });
    }

    if (!isValidObjectId(appointmentId)) {
      return res.status(400).json({
        message: "Invalid appointment ID",
      });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    if (
      req.user.role !== "Patient" ||
      String(appointment.patientId) !== String(loggedInUserId)
    ) {
      return res.status(403).json({
        message: "You can only confirm payment for your own appointment",
      });
    }

    // If already paid, return existing payment and session
    if (appointment.paymentStatus === "paid") {
      const existingPaidPayment = await Payment.findOne({
        appointmentId: appointment._id,
        status: "paid",
      });

      let existingSession = null;
      if (appointment.telemedicineSessionId) {
        existingSession = await TelemedicineSession.findById(
          appointment.telemedicineSessionId
        );
      }

      return res.status(200).json({
        message: "Payment already confirmed",
        payment: existingPaidPayment,
        appointment,
        session: existingSession,
      });
    }

    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (!stripeSession) {
      return res.status(404).json({
        message: "Stripe session not found",
      });
    }

    // Check only payment_status
    if (stripeSession.payment_status !== "paid") {
      return res.status(400).json({
        message: "Stripe payment is not paid yet",
      });
    }

    // Optional metadata validation
    if (
      stripeSession.metadata?.appointmentId &&
      String(stripeSession.metadata.appointmentId) !== String(appointmentId)
    ) {
      return res.status(400).json({
        message: "Stripe session does not belong to this appointment",
      });
    }

    // Avoid duplicate payment creation if session already used
    let existingPayment = await Payment.findOne({
      transactionId: stripeSession.payment_intent || stripeSession.id,
      status: "paid",
    });

    let session = null;

    if (!existingPayment) {
      const result = await finalizeSuccessfulPayment({
        appointment,
        method: "card",
        transactionId: stripeSession.payment_intent || stripeSession.id,
        gatewayResponse: JSON.stringify({
          stripeSessionId: stripeSession.id,
          paymentStatus: stripeSession.payment_status,
          sessionStatus: stripeSession.status,
          customerEmail: stripeSession.customer_details?.email || "",
        }),
        notes: "Stripe checkout payment",
      });

      existingPayment = result.payment;
      session = result.session;
    } else {
      appointment.paymentStatus = "paid";
      appointment.status = "confirmed";
      appointment.paidAt = appointment.paidAt || new Date();
      await appointment.save();

      session = await ensureTelemedicineSessionForAppointment(appointment);
    }

    return res.status(200).json({
      message:
        "Payment confirmed successfully, appointment confirmed, and telemedicine session created if needed",
      payment: existingPayment,
      appointment,
      session,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to confirm Stripe payment",
      error: error.message,
    });
  }
};

export const createPayment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { method, notes, gatewayResponse } = req.body || {};
    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (!isValidObjectId(appointmentId)) {
      return res.status(400).json({
        message: "Invalid appointment ID",
      });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    if (
      req.user.role !== "Patient" ||
      String(appointment.patientId) !== String(loggedInUserId)
    ) {
      return res.status(403).json({
        message: "You can only pay for your own appointment",
      });
    }

    if (appointment.status !== "awaiting_payment") {
      return res.status(400).json({
        message: "This appointment is not ready for payment",
      });
    }

    if (appointment.paymentStatus === "paid") {
      return res.status(400).json({
        message: "This appointment is already paid",
      });
    }

    const existingPaidPayment = await Payment.findOne({
      appointmentId,
      status: "paid",
    });

    if (existingPaidPayment) {
      return res.status(400).json({
        message: "A successful payment already exists for this appointment",
      });
    }

    const { payment, session } = await finalizeSuccessfulPayment({
      appointment,
      method: method || "card",
      transactionId: generateTransactionId(),
      gatewayResponse: gatewayResponse || "Manual payment success",
      notes: notes || "",
    });

    return res.status(201).json({
      message:
        "Payment completed successfully and appointment confirmed. Telemedicine session created if needed.",
      payment,
      appointment,
      session,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid payment ID",
      });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (
      req.user.role !== "Admin" &&
      String(loggedInUserId) !== String(payment.patientId) &&
      String(loggedInUserId) !== String(payment.doctorId)
    ) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getPaymentsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (!isValidObjectId(patientId)) {
      return res.status(400).json({
        message: "Invalid patient ID",
      });
    }

    if (
      req.user.role === "Patient" &&
      String(loggedInUserId) !== String(patientId)
    ) {
      return res.status(403).json({
        message: "You can only view your own payments",
      });
    }

    const payments = await Payment.find({ patientId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const getPaymentsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const loggedInUserId = req.user?.id || req.user?._id || req.user?.userId;

    if (!isValidObjectId(doctorId)) {
      return res.status(400).json({
        message: "Invalid doctor ID",
      });
    }

    if (
      req.user.role === "Doctor" &&
      String(loggedInUserId) !== String(doctorId)
    ) {
      return res.status(403).json({
        message: "You can only view your own payments",
      });
    }

    const payments = await Payment.find({ doctorId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const refundPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid payment ID",
      });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    if (payment.status !== "paid") {
      return res.status(400).json({
        message: "Only paid payments can be refunded",
      });
    }

    payment.status = "refunded";
    payment.notes = notes || payment.notes;
    await payment.save();

    const appointment = await Appointment.findById(payment.appointmentId);

    if (appointment) {
      appointment.paymentStatus = "refunded";
      appointment.status = "cancelled";
      await appointment.save();
    }

    return res.status(200).json({
      message: "Payment refunded successfully",
      payment,
      appointment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};