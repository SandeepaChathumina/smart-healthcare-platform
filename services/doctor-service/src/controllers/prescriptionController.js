const Prescription = require("../models/Prescription");
const { validateAppointment, sendNotification } = require("../utils/serviceCaller");

exports.createPrescription = async (req, res) => {
  try {
    const { appointmentId, medicines, instructions, validUntil } = req.body;

    if (!appointmentId || !medicines || !medicines.length) {
      return res.status(400).json({ message: "appointmentId and medicines array are required" });
    }

    const token = req.headers.authorization.split(" ")[1];
    const appointment = await validateAppointment(appointmentId, req.user.id, token);

    const existingPrescription = await Prescription.findOne({ appointmentId });
    if (existingPrescription) {
      return res.status(400).json({ message: "Prescription already exists for this appointment" });
    }

    const prescription = await Prescription.create({
      appointmentId,
      doctorId: req.user.id,
      patientId: appointment.patientId,
      medicines,
      instructions,
      validUntil: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await sendNotification(appointment.patientId, "PRESCRIPTION_ISSUED", { prescriptionId: prescription._id }, token);

    res.status(201).json({ success: true, message: "Prescription created", prescription });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getPrescriptionsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    if (req.user.role === "Doctor" && doctorId !== req.user.id) {
      return res.status(403).json({ message: "You can only view your own prescriptions" });
    }

    const prescriptions = await Prescription.find({ doctorId }).sort({ issuedDate: -1 });
    res.status(200).json({ success: true, count: prescriptions.length, prescriptions });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getPrescriptionsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;

    if (userRole === "Patient") {
      if (userId !== patientId) {
        return res.status(403).json({ message: "You can only view your own prescriptions" });
      }
      const prescriptions = await Prescription.find({ patientId }).sort({ issuedDate: -1 });
      return res.status(200).json({ success: true, count: prescriptions.length, prescriptions });
    }

    if (userRole === "Doctor") {
      const prescriptions = await Prescription.find({ patientId, doctorId: userId }).sort({ issuedDate: -1 });
      return res.status(200).json({ success: true, count: prescriptions.length, prescriptions });
    }

    const prescriptions = await Prescription.find({ patientId }).sort({ issuedDate: -1 });
    res.status(200).json({ success: true, count: prescriptions.length, prescriptions });
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
      (userRole === "Doctor" && prescription.doctorId === userId) ||
      (userRole === "Patient" && prescription.patientId === userId);

    if (!isAuthorized) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json({ success: true, prescription });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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
    
    if (prescription.doctorId !== req.user.id) {
      return res.status(403).json({ message: "You can only update your own prescriptions" });
    }

    prescription.status = status;
    await prescription.save();
    
    res.status(200).json({ success: true, message: "Prescription status updated", prescription });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};