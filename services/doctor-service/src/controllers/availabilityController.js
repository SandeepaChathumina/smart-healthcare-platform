const Availability = require("../models/Availability");

exports.createAvailability = async (req, res) => {
  try {
    const { dayOfWeek, specificDate, startTime, endTime, consultationType, maxAppointments } = req.body;
    const doctorId = req.user.id;

    if (!dayOfWeek && !specificDate) {
      return res.status(400).json({ message: "Either dayOfWeek or specificDate must be provided" });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({ message: "startTime and endTime are required" });
    }

    const availability = await Availability.create({
      doctorId,
      dayOfWeek: dayOfWeek || null,
      specificDate: specificDate || null,
      startTime,
      endTime,
      consultationType: consultationType || "both",
      maxAppointments: maxAppointments || 1,
    });

    res.status(201).json({ success: true, message: "Availability slot created", availability });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getMyAvailability = async (req, res) => {
  try {
    const slots = await Availability.find({ doctorId: req.user.id, isAvailable: true })
      .sort({ dayOfWeek: 1, startTime: 1 });
    res.status(200).json({ success: true, count: slots.length, availability: slots });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const availability = await Availability.findById(id);

    if (!availability) return res.status(404).json({ message: "Availability slot not found" });
    if (availability.doctorId !== req.user.id) {
      return res.status(403).json({ message: "You can only update your own slots" });
    }

    const { startTime, endTime, consultationType, maxAppointments, isAvailable } = req.body;
    if (startTime) availability.startTime = startTime;
    if (endTime) availability.endTime = endTime;
    if (consultationType) availability.consultationType = consultationType;
    if (maxAppointments) availability.maxAppointments = maxAppointments;
    if (isAvailable !== undefined) availability.isAvailable = isAvailable;

    await availability.save();
    res.status(200).json({ success: true, message: "Availability updated", availability });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const availability = await Availability.findById(id);

    if (!availability) return res.status(404).json({ message: "Availability slot not found" });
    if (availability.doctorId !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own slots" });
    }

    await availability.deleteOne();
    res.status(200).json({ success: true, message: "Availability deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.checkAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, time } = req.query;

    if (!date || !time) {
      return res.status(400).json({ message: "date and time query parameters are required" });
    }

    const queryDate = new Date(date);
    const dayOfWeek = queryDate.getDay();

    const slots = await Availability.find({
      doctorId,
      isAvailable: true,
      $or: [{ dayOfWeek, specificDate: null }, { specificDate: queryDate }],
    });

    const isAvailable = slots.some(slot => time >= slot.startTime && time < slot.endTime);
    res.status(200).json({ success: true, doctorId, date, time, isAvailable });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};