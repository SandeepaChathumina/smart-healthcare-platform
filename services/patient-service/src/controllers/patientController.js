const PatientReport = require('../models/PatientReport');
const MedicalHistory = require('../models/MedicalHistory');
const mongoose = require('mongoose');

const path = require("path");
// Removed User model dependency to fully decouple patient service
const Appointment = require('../models/Appointment');

// ==================== REPORT HANDLING ====================

// Upload medical report
exports.uploadReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { reportTitle, reportType, appointmentId, description } = req.body;

    if (!reportTitle || !reportType) {
      return res.status(400).json({ message: 'reportTitle and reportType are required' });
    }

    let linkedAppointment = null;
    if (appointmentId) {
      if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        return res.status(400).json({ message: 'Invalid appointment ID format' });
      }

      linkedAppointment = await Appointment.findOne({
        _id: appointmentId,
        patientId: req.user.id
      });

      if (!linkedAppointment) {
        return res.status(404).json({
          message: 'Appointment not found for this patient'
        });
      }
    }

    const report = await PatientReport.create({
      patientId: req.user.id,
      appointmentId: appointmentId || null,
      doctorId: linkedAppointment?.doctorId || null,
      appointmentDetails: linkedAppointment
        ? {
            reason: linkedAppointment.reason || '',
            appointmentType: linkedAppointment.appointmentType || '',
            preferredDateTime: linkedAppointment.preferredDateTime || null,
            scheduledDateTime: linkedAppointment.scheduledDateTime || null,
            status: linkedAppointment.status || ''
          }
        : undefined,
      reportTitle,
      reportType,
      fileName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      description: description || '',
      uploadedAt: new Date()
    });

    if (linkedAppointment) {
      linkedAppointment.uploadedReportIds = linkedAppointment.uploadedReportIds || [];
      linkedAppointment.uploadedReportIds.push(report._id);
      await linkedAppointment.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Report uploaded successfully',
      report
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all reports for logged-in patient
exports.getAllReports = async (req, res) => {
  try {
    const { reportType, page = 1, limit = 10 } = req.query;
    
    const query = { patientId: req.user.id, isDeleted: false };
    
    if (reportType) {
      query.reportType = reportType;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const reports = await PatientReport.find(query)
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await PatientReport.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      count: reports.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      reports
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get single report by ID
exports.getReportById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid report ID' });
    }
    
    const report = await PatientReport.findOne({
      _id: id,
      patientId: req.user.id,
      isDeleted: false
    });
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    return res.status(200).json({
      success: true,
      report
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete report (soft delete)
exports.deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid report ID' });
    }
    
    const report = await PatientReport.findOne({
      _id: id,
      patientId: req.user.id
    });
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    report.isDeleted = true;
    await report.save();
    
    return res.status(200).json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== MEDICAL HISTORY ====================

// Get medical history
exports.getMedicalHistory = async (req, res) => {
  try {
    let medicalHistory = await MedicalHistory.findOne({ patientId: req.user.id });
    
    if (!medicalHistory) {
      // Return empty structure if not exists
      medicalHistory = {
        patientId: req.user.id,
        chronicConditions: [],
        pastSurgeries: [],
        currentMedications: [],
        allergies: [],
        immunizations: [],
        familyHistory: { conditions: [], notes: '' },
        lifestyleFactors: {},
        notes: ''
      };
    }
    
    return res.status(200).json({
      success: true,
      medicalHistory
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Update medical history
exports.updateMedicalHistory = async (req, res) => {
  try {
    const updateData = req.body;
    
    let medicalHistory = await MedicalHistory.findOne({ patientId: req.user.id });
    
    if (!medicalHistory) {
      // Create new if doesn't exist
      medicalHistory = new MedicalHistory({
        patientId: req.user.id,
        ...updateData,
        lastUpdatedBy: req.user.id
      });
    } else {
      // Update existing
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          medicalHistory[key] = updateData[key];
        }
      });
      medicalHistory.lastUpdatedBy = req.user.id;
    }
    
    await medicalHistory.save();
    
    return res.status(200).json({
      success: true,
      message: 'Medical history updated successfully',
      medicalHistory
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== APPOINTMENT HISTORY ====================

// Get patient's appointment history
exports.getAppointmentHistory = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query = { patientId: req.user.id };
    
    if (status) {
      query.status = status;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const appointments = await Appointment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Appointment.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      count: appointments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      appointments
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get single appointment details
exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }
    
    const appointment = await Appointment.findOne({
      _id: id,
      patientId: req.user.id
    });
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    return res.status(200).json({
      success: true,
      appointment
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// ==================== PRESCRIPTION HISTORY ====================

// Get patient's prescriptions (from reports or dedicated Prescription model)
exports.getPrescriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get prescriptions from reports where reportType is 'Prescription'
    const prescriptions = await PatientReport.find({
      patientId: req.user.id,
      reportType: 'Prescription',
      isDeleted: false
    })
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await PatientReport.countDocuments({
      patientId: req.user.id,
      reportType: 'Prescription',
      isDeleted: false
    });
    
    return res.status(200).json({
      success: true,
      count: prescriptions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      prescriptions
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get single prescription by ID
exports.getPrescriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid prescription ID' });
    }
    
    const prescription = await PatientReport.findOne({
      _id: id,
      patientId: req.user.id,
      reportType: 'Prescription',
      isDeleted: false
    });
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    
    return res.status(200).json({
      success: true,
      prescription
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

exports.downloadReport = async (req, res) => {
  try {
    const report = await PatientReport.findOne({
      _id: req.params.id,
      patientId: req.user.id,
      isDeleted: false
    });

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const filePath = path.resolve(report.filePath);
    return res.download(filePath, report.fileName);
  } catch (error) {
    return res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};