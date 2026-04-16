const Prescription = require("../models/Prescription");
const ConsultationNote = require("../models/ConsultationNote");
const {
  validateAppointment,
  sendNotification,
  getUserContacts,
} = require("../utils/serviceCaller");

exports.createPrescription = async (req, res) => {
  try {
    const { appointmentId, medicines, instructions, diagnosis, validUntil, refillCount, maxRefills } = req.body;

    if (!appointmentId || !medicines || !medicines.length) {
      return res
        .status(400)
        .json({ message: "appointmentId and medicines array are required" });
    }

    const token = req.headers.authorization.split(" ")[1];
    const appointment = await validateAppointment(
      appointmentId,
      req.user.id,
      token
    );

    const existingPrescription = await Prescription.findOne({ appointmentId });
    if (existingPrescription) {
      return res
        .status(400)
        .json({ message: "Prescription already exists for this appointment" });
    }

    // Get doctor and patient names
    const doctorContact = await getUserContacts(req.user.id, token);
    const patientContact = await getUserContacts(appointment.patientId, token);

    const prescription = await Prescription.create({
      appointmentId,
      doctorId: req.user.id,
      patientId: appointment.patientId,
      patientName: patientContact?.fullName || null,
      doctorName: doctorContact?.fullName || null,
      medicines,
      instructions: instructions || null,
      diagnosis: diagnosis || null,
      validUntil: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      refillCount: refillCount || 0,
      maxRefills: maxRefills || 0,
    });

    await sendNotification(
      appointment.patientId,
      "PRESCRIPTION_ISSUED",
      { prescriptionId: prescription._id, appointmentId },
      token
    );

    res
      .status(201)
      .json({ success: true, message: "Prescription created successfully", prescription });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getPrescriptionsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    if (req.user.role === "Doctor" && String(doctorId) !== String(req.user.id)) {
      return res
        .status(403)
        .json({ message: "You can only view your own prescriptions" });
    }

    const query = { doctorId };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const prescriptions = await Prescription.find(query)
      .sort({ issuedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Prescription.countDocuments(query);

    res.status(200).json({
      success: true,
      count: prescriptions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      prescriptions,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getPrescriptionsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    const query = { patientId };
    if (status) query.status = status;

    if (userRole === "Patient") {
      if (String(userId) !== String(patientId)) {
        return res
          .status(403)
          .json({ message: "You can only view your own prescriptions" });
      }
    }

    if (userRole === "Doctor") {
      query.doctorId = userId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const prescriptions = await Prescription.find(query)
      .sort({ issuedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Prescription.countDocuments(query);

    return res.status(200).json({
      success: true,
      count: prescriptions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      prescriptions,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const prescription = await Prescription.findById(id);

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    const userRole = req.user.role;
    const userId = req.user.id;

    const isAuthorized =
      userRole === "Admin" ||
      (userRole === "Doctor" &&
        String(prescription.doctorId) === String(userId)) ||
      (userRole === "Patient" &&
        String(prescription.patientId) === String(userId));

    if (!isAuthorized) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json({ success: true, prescription });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getPrescriptionByAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const prescription = await Prescription.findOne({ appointmentId });

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    const userRole = req.user.role;
    const userId = req.user.id;

    const isAuthorized =
      userRole === "Admin" ||
      (userRole === "Doctor" &&
        String(prescription.doctorId) === String(userId)) ||
      (userRole === "Patient" &&
        String(prescription.patientId) === String(userId));

    if (!isAuthorized) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({ success: true, prescription });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { medicines, instructions, diagnosis, validUntil, refillCount, maxRefills, status } =
      req.body;

    const prescription = await Prescription.findById(id);

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    if (String(prescription.doctorId) !== String(req.user.id)) {
      return res
        .status(403)
        .json({ message: "You can only update your own prescriptions" });
    }

    if (medicines !== undefined) {
      if (!Array.isArray(medicines) || medicines.length === 0) {
        return res.status(400).json({ message: "medicines must be a non-empty array" });
      }
      prescription.medicines = medicines;
    }

    if (instructions !== undefined) prescription.instructions = instructions || null;
    if (diagnosis !== undefined) prescription.diagnosis = diagnosis || null;
    if (validUntil !== undefined) prescription.validUntil = validUntil;
    if (refillCount !== undefined) prescription.refillCount = refillCount;
    if (maxRefills !== undefined) prescription.maxRefills = maxRefills;
    if (status !== undefined) prescription.status = status;

    await prescription.save();

    return res.status(200).json({
      success: true,
      message: "Prescription updated successfully",
      prescription,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const prescription = await Prescription.findById(id);

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    if (String(prescription.doctorId) !== String(req.user.id)) {
      return res
        .status(403)
        .json({ message: "You can only delete your own prescriptions" });
    }

    await Prescription.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Prescription deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updatePrescriptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const prescription = await Prescription.findById(id);

    if (!prescription) {
      return res.status(404).json({ message: "Prescription not found" });
    }

    if (String(prescription.doctorId) !== String(req.user.id)) {
      return res
        .status(403)
        .json({ message: "You can only update your own prescriptions" });
    }

    prescription.status = status;
    await prescription.save();

    res.status(200).json({
      success: true,
      message: "Prescription status updated",
      prescription,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getPatientPrescriptionsSummary = async (req, res) => {
  try {
    const { patientId } = req.params;

    const prescriptions = await Prescription.find({ patientId })
      .sort({ issuedDate: -1 })
      .limit(10);

    const activeCount = await Prescription.countDocuments({
      patientId,
      status: "active",
      validUntil: { $gt: new Date() },
    });

    const totalCount = await Prescription.countDocuments({ patientId });

    res.status(200).json({
      success: true,
      activePrescriptions: activeCount,
      totalPrescriptions: totalCount,
      recentPrescriptions: prescriptions,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};