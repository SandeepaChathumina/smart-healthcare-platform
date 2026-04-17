// doctor-service/controllers/availabilityController.js

const Availability = require("../models/Availability");
const { getUsersContactsBulk } = require("../utils/serviceCaller");

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Human-readable label for a weekly or one-off availability document */
function formatAvailabilityDayLabel(av) {
  if (av == null) return "";
  if (av.dayOfWeek !== null && av.dayOfWeek !== undefined) {
    const d = Number(av.dayOfWeek);
    if (!Number.isNaN(d) && d >= 0 && d <= 6) {
      return WEEKDAY_NAMES[d];
    }
  }
  if (av.specificDate) {
    try {
      return new Date(av.specificDate).toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return new Date(av.specificDate).toLocaleDateString();
    }
  }
  return "";
}

function normalizeBreaksForCompare(arr) {
  if (!arr || arr.length === 0) return "[]";
  const list = [...arr].map((b) => ({
    start: String(b.start),
    end: String(b.end),
  }));
  list.sort((x, y) => x.start.localeCompare(y.start) || x.end.localeCompare(y.end));
  return JSON.stringify(list);
}

/** Same start/end/breaks as stored — cannot create a new overlap vs other slots */
function isWorkingWindowUnchanged(availability, newStartTime, newEndTime, newBreakTime) {
  if (newStartTime !== availability.startTime || newEndTime !== availability.endTime) {
    return false;
  }
  return (
    normalizeBreaksForCompare(newBreakTime) ===
    normalizeBreaksForCompare(availability.breakTime)
  );
}

exports.createAvailability = async (req, res) => {
  try {
    const { 
      dayOfWeek, 
      specificDate, 
      startTime, 
      endTime, 
      consultationType, 
      breakTime,
      maxAppointments
    } = req.body;
    
    // Debug logging
    console.log("Creating availability - req.user:", req.user);
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("dayOfWeek:", dayOfWeek, "type:", typeof dayOfWeek);
    console.log("specificDate:", specificDate, "type:", typeof specificDate);
    
    const doctorId = req.user?.id;
    
    if (!doctorId) {
      console.error("Doctor ID missing from token");
      return res.status(400).json({ message: "Doctor ID not found in token" });
    }

    // Fix: dayOfWeek can be 0 (Sunday), so check for undefined/null instead of falsy
    const hasDayOfWeek = typeof dayOfWeek === 'number' && dayOfWeek >= 0 && dayOfWeek <= 6;
    const hasSpecificDate = specificDate && specificDate.trim() !== '';
    
    console.log("Validation checks:", {
      dayOfWeek,
      dayOfWeekType: typeof dayOfWeek,
      hasDayOfWeek,
      specificDate,
      specificDateType: typeof specificDate,
      hasSpecificDate
    });
    
    if (!hasDayOfWeek && !hasSpecificDate) {
      console.error("Neither dayOfWeek nor specificDate provided", { dayOfWeek, specificDate });
      return res.status(400).json({ 
        message: "Either dayOfWeek (0-6) or specificDate must be provided",
        received: { dayOfWeek, specificDate, dayOfWeekType: typeof dayOfWeek, specificDateType: typeof specificDate }
      });
    }

    if (!startTime || !endTime) {
      console.error("Validation failed: missing times", { startTime, endTime });
      return res.status(400).json({ message: "startTime and endTime are required" });
    }

    // Check for time conflict
    const conflictCheck = await Availability.checkTimeConflict(
      doctorId,
      dayOfWeek,
      specificDate,
      startTime,
      endTime
    );

    if (conflictCheck.conflict) {
      const conflicting = conflictCheck.conflictingAvailability;
      const conflictDay = formatAvailabilityDayLabel(conflicting);

      return res.status(409).json({ 
        message: `Time conflict! You already have availability on ${conflictDay} from ${conflicting.startTime} to ${conflicting.endTime}.`,
        conflict: {
          day: conflictDay,
          startTime: conflicting.startTime,
          endTime: conflicting.endTime
        }
      });
    }

    // Calculate total minutes
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    const totalHours = totalMinutes / 60;
    
    // Calculate break minutes
    let totalBreakMinutes = 0;
    if (breakTime && breakTime.length > 0) {
      for (const bt of breakTime) {
        if (bt.start && bt.end) {
          const [bsh, bsm] = bt.start.split(':').map(Number);
          const [beh, bem] = bt.end.split(':').map(Number);
          totalBreakMinutes += (beh * 60 + bem) - (bsh * 60 + bsm);
        }
      }
    }
    
    const workingMinutes = totalMinutes - totalBreakMinutes;
    const workingHours = workingMinutes / 60;
    const calculatedMaxAppointments = Math.floor(workingHours * 6);
    
    // Validate breaks
    const requiredBreaks = Math.floor(totalHours / 4);
    const actualBreaks = breakTime?.length || 0;
    
    console.log("Break validation:", { totalHours, requiredBreaks, actualBreaks });
    
    if (requiredBreaks > 0 && actualBreaks < requiredBreaks) {
      console.error("Break validation failed", { requiredBreaks, actualBreaks });
      return res.status(400).json({ 
        message: `This ${totalHours} hour availability requires at least ${requiredBreaks} break(s). You have added ${actualBreaks} break(s). Please add ${requiredBreaks - actualBreaks} more break(s).`,
        requiredBreaks,
        actualBreaks,
        breaksNeeded: requiredBreaks - actualBreaks
      });
    }
    
    // Validate each break
    if (breakTime && breakTime.length > 0) {
      console.log("Validating breaks:", breakTime);
      for (let i = 0; i < breakTime.length; i++) {
        const bt = breakTime[i];
        
        if (bt.start >= bt.end) {
          console.error(`Break ${i + 1} validation failed: end time must be after start time`);
          return res.status(400).json({ message: `Break ${i + 1}: End time must be after start time` });
        }
        
        if (bt.start < startTime || bt.end > endTime) {
          console.error(`Break ${i + 1} validation failed: outside working hours`);
          return res.status(400).json({ message: `Break ${i + 1}: Break time must be within working hours (${startTime} - ${endTime})` });
        }
        
        const [bsh, bsm] = bt.start.split(':').map(Number);
        const [beh, bem] = bt.end.split(':').map(Number);
        const breakMinutes = (beh * 60 + bem) - (bsh * 60 + bsm);
        
        if (breakMinutes < 10) {
          console.error(`Break ${i + 1} validation failed: too short (${breakMinutes} minutes)`);
          return res.status(400).json({ message: `Break ${i + 1}: Minimum break is 10 minutes (current: ${breakMinutes} minutes)` });
        }
        
        if (breakMinutes > 60) {
          console.error(`Break ${i + 1} validation failed: too long (${breakMinutes} minutes)`);
          return res.status(400).json({ message: `Break ${i + 1}: Maximum break is 1 hour (60 minutes) (current: ${breakMinutes} minutes)` });
        }
      }
    }
    
    // Validate max appointments
    const requestedMax = maxAppointments || calculatedMaxAppointments;
    console.log("Max appointments validation:", { 
      requestedMax, 
      calculatedMaxAppointments, 
      totalMinutes,
      workingMinutes,
      workingHours
    });
    
    if (requestedMax > calculatedMaxAppointments) {
      console.error("Max appointments validation failed:", { requestedMax, calculatedMaxAppointments });
      return res.status(400).json({ 
        message: `Maximum appointments cannot exceed ${calculatedMaxAppointments} for ${workingHours.toFixed(1)} hours working time (6 per hour)`,
        maxAllowed: calculatedMaxAppointments,
        workingHours: workingHours.toFixed(1)
      });
    }

    console.log("All validations passed. Creating availability...");
    console.log("Creating with data:", {
      doctorId,
      dayOfWeek: typeof dayOfWeek === 'number' ? dayOfWeek : null,
      specificDate: specificDate || null,
      startTime,
      endTime,
      consultationType: consultationType || "both",
      maxAppointments: requestedMax,
      breakTime: breakTime || [],
    });
    
    let availability;
    try {
      availability = await Availability.create({
        doctorId,
        dayOfWeek: typeof dayOfWeek === 'number' ? dayOfWeek : null,
        specificDate: specificDate || null,
        startTime,
        endTime,
        consultationType: consultationType || "both",
        maxAppointments: requestedMax,
        breakTime: breakTime || [],
      });
      console.log("Availability created successfully:", availability);
    } catch (createError) {
      console.error("Error during Availability.create:", createError.message);
      console.error("Full error:", createError);
      throw createError;
    }

    res.status(201).json({ 
      success: true, 
      message: "Availability created successfully", 
      availability,
      metrics: {
        totalHours: totalHours.toFixed(1),
        workingHours: workingHours.toFixed(1),
        maxAppointments: calculatedMaxAppointments,
        appointmentsPerHour: 6
      }
    });
  } catch (error) {
    console.error("Error creating availability:", error);
    
    if (error.code === 11000) {
      return res.status(409).json({ message: "Availability already exists for this day/date" });
    }
    
    if (error.message && error.message.includes("Time conflict")) {
      return res.status(409).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: "Server error", 
      error: error.message,
      details: error.name
    });
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const availability = await Availability.findById(id);

    if (!availability) return res.status(404).json({ message: "Availability not found" });
    if (String(availability.doctorId) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only update your own availability" });
    }

    const { startTime, endTime, consultationType, isAvailable, breakTime, maxAppointments } = req.body;
    
    const newStartTime = startTime || availability.startTime;
    const newEndTime = endTime || availability.endTime;
    const newBreakTime = breakTime !== undefined ? breakTime : availability.breakTime;
    
    // Only when start/end/breaks change can this slot newly overlap another
    if (!isWorkingWindowUnchanged(availability, newStartTime, newEndTime, newBreakTime)) {
      const conflictCheck = await Availability.checkTimeConflict(
        availability.doctorId,
        availability.dayOfWeek,
        availability.specificDate,
        newStartTime,
        newEndTime,
        id
      );

      if (conflictCheck.conflict) {
        const conflicting = conflictCheck.conflictingAvailability;
        const conflictDay = formatAvailabilityDayLabel(conflicting);
        return res.status(409).json({
          message: `Time conflict! Overlaps with ${conflictDay} (${conflicting.startTime} – ${conflicting.endTime}).`,
          conflict: {
            day: conflictDay,
            startTime: conflicting.startTime,
            endTime: conflicting.endTime,
          },
        });
      }
    }
    
    // Calculate total minutes
    const [startHour, startMinute] = newStartTime.split(':').map(Number);
    const [endHour, endMinute] = newEndTime.split(':').map(Number);
    const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    const totalHours = totalMinutes / 60;
    
    // Calculate break minutes
    let totalBreakMinutes = 0;
    if (newBreakTime && newBreakTime.length > 0) {
      for (const bt of newBreakTime) {
        if (bt.start && bt.end) {
          const [bsh, bsm] = bt.start.split(':').map(Number);
          const [beh, bem] = bt.end.split(':').map(Number);
          totalBreakMinutes += (beh * 60 + bem) - (bsh * 60 + bsm);
        }
      }
    }

    // These must be calculated BEFORE the validation checks that use them
    const workingMinutes = totalMinutes - totalBreakMinutes;
    const workingHours = workingMinutes / 60;
    const calculatedMaxAppointments = Math.floor(workingHours * 6);
    const requestedMaxAppointments =
      maxAppointments !== undefined ? Number(maxAppointments) : availability.maxAppointments;

    if (!Number.isFinite(requestedMaxAppointments)) {
      return res.status(400).json({
        message: "maxAppointments must be a valid number",
      });
    }

    if (
      requestedMaxAppointments > calculatedMaxAppointments ||
      requestedMaxAppointments < 1
    ) {
      return res.status(400).json({
        message: `Maximum appointments must be between 1 and ${calculatedMaxAppointments} for ${workingHours.toFixed(
          1
        )} hours working time (6 per hour)`,
      });
    }

    if (requestedMaxAppointments < availability.bookedCount) {
      return res.status(400).json({
        message: `Maximum appointments cannot be lower than booked appointments (${availability.bookedCount})`,
      });
    }
    
    // Validate breaks
    const requiredBreaks = Math.floor(totalHours / 4);
    const actualBreaks = newBreakTime?.length || 0;
    
    if (requiredBreaks > 0 && actualBreaks < requiredBreaks) {
      return res.status(400).json({ 
        message: `This ${totalHours} hour availability requires at least ${requiredBreaks} break(s). You have added ${actualBreaks} break(s). Please add ${requiredBreaks - actualBreaks} more break(s).`
      });
    }
    
    // Validate break times
    if (newBreakTime && newBreakTime.length > 0) {
      for (let i = 0; i < newBreakTime.length; i++) {
        const bt = newBreakTime[i];
        
        if (bt.start >= bt.end) {
          return res.status(400).json({ message: `Break ${i + 1}: End time must be after start time` });
        }
        
        if (bt.start < newStartTime || bt.end > newEndTime) {
          return res.status(400).json({ message: `Break ${i + 1}: Break time must be within working hours (${newStartTime} - ${newEndTime})` });
        }
        
        const [bsh, bsm] = bt.start.split(':').map(Number);
        const [beh, bem] = bt.end.split(':').map(Number);
        const breakMinutes = (beh * 60 + bem) - (bsh * 60 + bsm);
        
        if (breakMinutes < 10) {
          return res.status(400).json({ message: `Break ${i + 1}: Minimum break is 10 minutes (current: ${breakMinutes} minutes)` });
        }
        
        if (breakMinutes > 60) {
          return res.status(400).json({ message: `Break ${i + 1}: Maximum break is 1 hour (60 minutes) (current: ${breakMinutes} minutes)` });
        }
      }
      
      // Check for overlapping breaks
      const sortedBreaks = [...newBreakTime].sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 0; i < sortedBreaks.length - 1; i++) {
        if (sortedBreaks[i].end > sortedBreaks[i + 1].start) {
          return res.status(400).json({ message: `Break ${i + 1} and Break ${i + 2} overlap. Breaks should not overlap.` });
        }
      }
    }
    
    if (startTime) availability.startTime = startTime;
    if (endTime) availability.endTime = endTime;
    if (consultationType) availability.consultationType = consultationType;
    if (isAvailable !== undefined) availability.isAvailable = isAvailable;
    if (breakTime !== undefined) availability.breakTime = breakTime;
    if (maxAppointments !== undefined) availability.maxAppointments = requestedMaxAppointments;

    await availability.save();
    
    res.status(200).json({ 
      success: true, 
      message: "Availability updated successfully", 
      availability
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getMyAvailability = async (req, res) => {
  try {
    const availabilities = await Availability.find({ doctorId: req.user.id })
      .sort({ dayOfWeek: 1, startTime: 1 });
    
    const availabilitiesWithMetrics = availabilities.map(availability => {
      const totalMinutes = availability.getTotalMinutes();
      const breakMinutes = availability.getBreakMinutes();
      const workingMinutes = availability.getWorkingMinutes();
      const totalHours = totalMinutes / 60;
      const workingHours = workingMinutes / 60;
      const maxApps = Math.floor(workingHours * 6);
      const effectiveMaxAppointments = availability.maxAppointments || maxApps || 1;
      const bookedPercentage = availability.bookedCount > 0 
        ? (availability.bookedCount / effectiveMaxAppointments) * 100 
        : 0;
      const remainingAppointments = effectiveMaxAppointments - availability.bookedCount;
      
      return {
        ...availability.toObject(),
        metrics: {
          totalHours: totalHours.toFixed(1),
          workingHours: workingHours.toFixed(1),
          maxAppointments: effectiveMaxAppointments,
          calculatedMaxAppointments: maxApps,
          breakHours: (breakMinutes / 60).toFixed(1),
          bookedPercentage: bookedPercentage.toFixed(1),
          remainingAppointments: Math.max(0, remainingAppointments),
          isFullyBooked: remainingAppointments <= 0
        }
      };
    });
    
    res.status(200).json({ 
      success: true, 
      count: availabilitiesWithMetrics.length, 
      availability: availabilitiesWithMetrics 
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const availability = await Availability.findById(id);

    if (!availability) return res.status(404).json({ message: "Availability not found" });
    if (String(availability.doctorId) !== String(req.user.id)) {
      return res.status(403).json({ message: "You can only delete your own availability" });
    }

    if (availability.bookedCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete availability with ${availability.bookedCount} booked appointment(s). Please contact patients to reschedule first.`,
        bookedCount: availability.bookedCount
      });
    }

    await availability.deleteOne();
    res.status(200).json({ success: true, message: "Availability deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// THIS IS THE CRITICAL FUNCTION - Make sure it's exported
exports.calculateAvailabilityMetrics = async (req, res) => {
  console.log("calculateAvailabilityMetrics called with body:", req.body);
  
  try {
    const { startTime, endTime, breakTimes = [] } = req.body;
    
    if (!startTime || !endTime) {
      return res.status(400).json({ 
        success: false, 
        message: "startTime and endTime are required" 
      });
    }
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    
    if (totalMinutes <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "End time must be after start time" 
      });
    }
    
    const totalHours = totalMinutes / 60;
    let totalBreakMinutes = 0;
    const breakValidations = [];
    
    for (let i = 0; i < breakTimes.length; i++) {
      const bt = breakTimes[i];
      const breakErrors = [];
      
      if (!bt.start || !bt.end) {
        breakErrors.push(`Break ${i + 1}: Start time and end time are required`);
      } else {
        if (bt.start >= bt.end) {
          breakErrors.push(`Break ${i + 1}: End time must be after start time`);
        }
        if (bt.start < startTime || bt.end > endTime) {
          breakErrors.push(`Break ${i + 1}: Break time must be within working hours (${startTime} - ${endTime})`);
        }
        
        const [bsh, bsm] = bt.start.split(':').map(Number);
        const [beh, bem] = bt.end.split(':').map(Number);
        const breakMinutes = (beh * 60 + bem) - (bsh * 60 + bsm);
        totalBreakMinutes += breakMinutes;
        
        if (breakMinutes < 10) {
          breakErrors.push(`Break ${i + 1}: Minimum break is 10 minutes (current: ${breakMinutes} minutes)`);
        }
        if (breakMinutes > 60) {
          breakErrors.push(`Break ${i + 1}: Maximum break is 1 hour (60 minutes) (current: ${breakMinutes} minutes)`);
        }
      }
      
      breakValidations.push({
        index: i,
        start: bt.start,
        end: bt.end,
        isValid: breakErrors.length === 0,
        errors: breakErrors
      });
    }
    
    // Check for overlapping breaks
    const sortedBreaks = [...breakTimes].sort((a, b) => a.start.localeCompare(b.start));
    for (let i = 0; i < sortedBreaks.length - 1; i++) {
      if (sortedBreaks[i].end > sortedBreaks[i + 1].start) {
        breakValidations.push({
          index: -1,
          isValid: false,
          errors: [`Break ${i + 1} and Break ${i + 2} overlap. Breaks should not overlap.`]
        });
      }
    }
    
    const workingMinutes = totalMinutes - totalBreakMinutes;
    const workingHours = workingMinutes / 60;
    const maxAppointments = Math.max(1, Math.floor(workingHours * 6));
    const requiredBreaks = Math.floor(totalHours / 4);
    const currentBreaks = breakTimes.length;
    const breaksNeeded = Math.max(0, requiredBreaks - currentBreaks);
    const isValid = requiredBreaks <= currentBreaks && 
                    breakValidations.every(v => v.isValid) &&
                    workingMinutes > 0;
    
    const response = {
      success: true,
      totalHours: totalHours,
      totalMinutes: totalMinutes,
      breakMinutes: totalBreakMinutes,
      breakHours: totalBreakMinutes / 60,
      workingHours: workingHours,
      workingMinutes: workingMinutes,
      maxAppointments: maxAppointments,
      appointmentsPerHour: 6,
      requiredBreaks: requiredBreaks,
      currentBreaks: currentBreaks,
      breaksNeeded: breaksNeeded,
      isValid: isValid,
      breakValidations: breakValidations,
      message: isValid ? "Valid configuration" : "Please fix the issues above"
    };
    
    console.log("Sending response:", response);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error in calculateAvailabilityMetrics:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

exports.checkTimeAvailability = async (req, res) => {
  try {
    const { dayOfWeek, specificDate, startTime, endTime } = req.body;
    const excludeId =
      req.body.excludeId != null && req.body.excludeId !== ""
        ? String(req.body.excludeId).trim()
        : null;
    const doctorId = req.user.id;
    
    const conflictCheck = await Availability.checkTimeConflict(
      doctorId,
      dayOfWeek,
      specificDate,
      startTime,
      endTime,
      excludeId
    );
    
    if (conflictCheck.conflict) {
      const conflicting = conflictCheck.conflictingAvailability;
      const conflictDay = formatAvailabilityDayLabel(conflicting);
      return res.status(200).json({
        available: false,
        message: `Time slot conflicts with existing availability (${conflictDay}, ${conflicting.startTime} – ${conflicting.endTime}).`,
        conflict: {
          startTime: conflicting.startTime,
          endTime: conflicting.endTime,
          day: conflictDay,
        },
      });
    }
    
    res.status(200).json({
      available: true,
      message: "Time slot is available"
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// These are for public routes
exports.getAllAvailabilitySlots = async (req, res) => {
  try {
    const slots = await Availability.find({ isAvailable: true })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: slots.length, availability: slots });
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

exports.getAvailableSlotsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, consultationType } = req.query;

    const query = { 
      doctorId, 
      isAvailable: true,
      $expr: { $lt: ["$bookedCount", "$maxAppointments"] } // Only slots with available capacity
    };

    // Filter by consultation type if provided
    if (consultationType && ["telemedicine", "in_person"].includes(consultationType)) {
      query.$or = [
        { consultationType: consultationType },
        { consultationType: "both" }
      ];
    }

    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.$or = query.$or || [];
      query.$or.push(
        { dayOfWeek: queryDate.getDay(), specificDate: null },
        { specificDate: { $gte: queryDate, $lt: nextDay } }
      );
    }

    const slots = await Availability.find(query).sort({ startTime: 1 });
    
    // Add remaining capacity info
    const slotsWithCapacity = slots.map(slot => ({
      ...slot.toObject(),
      remainingCapacity: slot.maxAppointments - slot.bookedCount
    }));
    
    res.status(200).json({ success: true, count: slotsWithCapacity.length, slots: slotsWithCapacity });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Internal endpoints for appointment service to sync bookedCount
exports.incrementBookedCount = async (req, res) => {
  try {
    const { availabilityId } = req.params;
    const { increment = 1 } = req.body;
    
    const availability = await Availability.findById(availabilityId);
    
    if (!availability) {
      return res.status(404).json({ message: "Availability not found" });
    }
    
    const newBookedCount = availability.bookedCount + increment;
    
    if (newBookedCount > availability.maxAppointments) {
      return res.status(400).json({ 
        message: `Cannot exceed maximum appointments (${availability.maxAppointments})`,
        maxAppointments: availability.maxAppointments,
        currentBooked: availability.bookedCount
      });
    }
    
    availability.bookedCount = newBookedCount;
    await availability.save();
    
    res.status(200).json({
      success: true,
      message: "Booked count incremented",
      availability,
      metrics: {
        bookedCount: availability.bookedCount,
        maxAppointments: availability.maxAppointments,
        remaining: availability.maxAppointments - availability.bookedCount,
        isFull: availability.bookedCount >= availability.maxAppointments
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.decrementBookedCount = async (req, res) => {
  try {
    const { availabilityId } = req.params;
    const { decrement = 1 } = req.body;
    
    const availability = await Availability.findById(availabilityId);
    
    if (!availability) {
      return res.status(404).json({ message: "Availability not found" });
    }
    
    const newBookedCount = Math.max(0, availability.bookedCount - decrement);
    availability.bookedCount = newBookedCount;
    await availability.save();
    
    res.status(200).json({
      success: true,
      message: "Booked count decremented",
      availability,
      metrics: {
        bookedCount: availability.bookedCount,
        maxAppointments: availability.maxAppointments,
        remaining: availability.maxAppointments - availability.bookedCount,
        isFull: availability.bookedCount >= availability.maxAppointments
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllAvailabilitySlotsEnriched = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    const slots = await Availability.find({ isAvailable: true }).sort({ createdAt: -1 });

    const doctorIds = [...new Set(slots.map((slot) => String(slot.doctorId)))];

    let contacts = [];
    if (token && doctorIds.length > 0) {
      contacts = await getUsersContactsBulk(doctorIds, token);
    }

    const contactMap = new Map(
      contacts.map((contact) => [String(contact.userId || contact._id), contact])
    );

    const enrichedSlots = slots.map((slot) => {
      const doctorContact = contactMap.get(String(slot.doctorId));

      return {
        ...slot.toObject(),
        remainingCapacity: Math.max(0, (slot.maxAppointments || 0) - (slot.bookedCount || 0)),
        doctor: {
          id: slot.doctorId,
          fullName: doctorContact?.fullName || "Doctor Name Unavailable",
          email: doctorContact?.email || null,
          phone: doctorContact?.phone || null,
        },
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedSlots.length,
      availability: enrichedSlots,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};