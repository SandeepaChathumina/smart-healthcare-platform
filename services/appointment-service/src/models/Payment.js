import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: [true, "Appointment ID is required"],
      index: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Patient ID is required"],
      index: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Doctor ID is required"],
      index: true,
    },

    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Amount cannot be negative"],
    },

    currency: {
      type: String,
      trim: true,
      default: "LKR",
      uppercase: true,
    },

    method: {
      type: String,
      enum: ["card", "paypal", "payhere", "frimi", "dialog_genie", "cash"],
      required: [true, "Payment method is required"],
      default: "card",
    },

    transactionId: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    gatewayResponse: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ appointmentId: 1, status: 1 });
paymentSchema.index({ patientId: 1, createdAt: -1 });
paymentSchema.index({ doctorId: 1, createdAt: -1 });

paymentSchema.pre("save", function () {
  if (this.status === "paid" && !this.paidAt) {
    this.paidAt = new Date();
  }

  if (this.status === "refunded" && !this.refundedAt) {
    this.refundedAt = new Date();
  }
});

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;