const DoctorProfile = require("../models/DoctorProfile");
const ConsultationNote = require("../models/ConsultationNote");
const Prescription = require("../models/Prescription");
const Availability = require("../models/Availability");

const { getUserContacts } = require("../utils/serviceCaller.js");

exports.getDoctorProfile = async (req, res) => {
  try {
    let profile = await DoctorProfile.findOne({ userId: req.user.id });

    if (!profile) {
      // Create default profile if not exists
      profile = await DoctorProfile.create({
        userId: req.user.id,
        specialization: req.user.specialization || "General Medicine",
        qualifications: [],
        experience: 0,
        consultationFee: 0,
      });
    }

    res.status(200).json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateDoctorProfile = async (req, res) => {
  try {
    const { specialization, qualifications, experience, consultationFee, languages, about, profileImage } = req.body;

    let profile = await DoctorProfile.findOne({ userId: req.user.id });

    if (!profile) {
      profile = new DoctorProfile({ userId: req.user.id });
    }

    if (specialization) profile.specialization = specialization;
    if (qualifications) profile.qualifications = qualifications;
    if (experience !== undefined) profile.experience = experience;
    if (consultationFee !== undefined) profile.consultationFee = consultationFee;
    if (languages) profile.languages = languages;
    if (about) profile.about = about;
    if (profileImage) profile.profileImage = profileImage;

    await profile.save();

    res.status(200).json({ success: true, message: "Profile updated successfully", profile });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getDoctorStats = async (req, res) => {
  try {
    const totalPatients = await ConsultationNote.distinct("patientId", { doctorId: req.user.id });
    const totalPrescriptions = await Prescription.countDocuments({ doctorId: req.user.id });
    const totalConsultations = await ConsultationNote.countDocuments({ doctorId: req.user.id });
    const availabilitySlots = await Availability.countDocuments({ doctorId: req.user.id, isAvailable: true });

    res.status(200).json({
      success: true,
      stats: {
        totalPatients: totalPatients.length,
        totalPrescriptions,
        totalConsultations,
        availabilitySlots,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getDoctorPatients = async (req, res) => {
  try {
    const patientIds = await ConsultationNote.distinct("patientId", { doctorId: req.user.id });
    
    // This would typically fetch patient details from patient service
    // For now, return just the IDs
    res.status(200).json({
      success: true,
      count: patientIds.length,
      patients: patientIds.map(id => ({ patientId: id })),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getDoctorDetailsById = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const token = req.headers.authorization?.split(" ")[1];

    if (!doctorId) {
      return res.status(400).json({ message: "doctorId is required" });
    }

    const contact = token ? await getUserContacts(doctorId, token) : null;
    const profile = await DoctorProfile.findOne({ userId: doctorId });

    return res.status(200).json({
      success: true,
      doctor: {
        id: doctorId,
        fullName: contact?.fullName || "Doctor Name Unavailable",
        email: contact?.email || null,
        phone: contact?.phone || null,
        specialization: profile?.specialization || null,
        qualifications: profile?.qualifications || [],
        experience: profile?.experience ?? 0,
        consultationFee: profile?.consultationFee ?? 0,
        languages: profile?.languages || [],
        about: profile?.about || null,
        profileImage: profile?.profileImage || null,
        ratings: profile?.ratings || { average: 0, count: 0 },
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};