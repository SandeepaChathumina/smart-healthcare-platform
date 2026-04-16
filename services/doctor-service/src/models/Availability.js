// doctor-service/models/Availability.js

const mongoose = require("mongoose");

const breakTimeSchema = new mongoose.Schema({
  start: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  },
  end: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  },
});

const availabilitySchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Doctor ID is required"],
      ref: "User",
      index: true,
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      default: null,
    },
    specificDate: {
      type: Date,
      default: null,
    },
    startTime: {
      type: String,
      required: [true, "Start time is required"],
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    endTime: {
      type: String,
      required: [true, "End time is required"],
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    consultationType: {
      type: String,
      enum: ["telemedicine", "in_person", "both"],
      default: "both",
    },
    maxAppointments: {
      type: Number,
      default: 6,
      min: 1,
    },
    bookedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    breakTime: [breakTimeSchema],
  },
  {
    timestamps: true,
  }
);

// Calculate total minutes
availabilitySchema.methods.getTotalMinutes = function() {
  const [startHour, startMinute] = this.startTime.split(':').map(Number);
  const [endHour, endMinute] = this.endTime.split(':').map(Number);
  return (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
};

// Calculate total break minutes
availabilitySchema.methods.getBreakMinutes = function() {
  if (!this.breakTime || this.breakTime.length === 0) return 0;
  
  return this.breakTime.reduce((total, breakSlot) => {
    const [breakStartHour, breakStartMinute] = breakSlot.start.split(':').map(Number);
    const [breakEndHour, breakEndMinute] = breakSlot.end.split(':').map(Number);
    return total + ((breakEndHour * 60 + breakEndMinute) - (breakStartHour * 60 + breakStartMinute));
  }, 0);
};

// Calculate working minutes
availabilitySchema.methods.getWorkingMinutes = function() {
  return this.getTotalMinutes() - this.getBreakMinutes();
};

// Calculate max appointments (6 per hour)
availabilitySchema.methods.calculateMaxAppointments = function() {
  const workingHours = this.getWorkingMinutes() / 60;
  return Math.floor(workingHours * 6);
};

// Calculate required breaks (1 per 4 hours)
availabilitySchema.methods.getRequiredBreakCount = function() {
  const totalHours = this.getTotalMinutes() / 60;
  return Math.floor(totalHours / 4);
};

// Validate breaks
availabilitySchema.methods.validateBreaks = function() {
  try {
    const errors = [];
    const requiredBreaks = this.getRequiredBreakCount();
    const actualBreaks = this.breakTime?.length || 0;
    
    console.log("Break validation details:", {
      requiredBreaks,
      actualBreaks,
      startTime: this.startTime,
      endTime: this.endTime
    });
    
    if (requiredBreaks > 0 && actualBreaks < requiredBreaks) {
      errors.push(`This availability requires ${requiredBreaks} break(s) (1 break per 4 hours). You have added ${actualBreaks} break(s).`);
    }
    
    for (let i = 0; i < (this.breakTime || []).length; i++) {
      const bt = this.breakTime[i];
      
      if (bt.start >= bt.end) {
        errors.push(`Break ${i + 1}: End time must be after start time`);
      }
      
      if (bt.start < this.startTime || bt.end > this.endTime) {
        errors.push(`Break ${i + 1}: Break time must be within working hours`);
      }
      
      const [bsh, bsm] = bt.start.split(':').map(Number);
      const [beh, bem] = bt.end.split(':').map(Number);
      const breakMinutes = (beh * 60 + bem) - (bsh * 60 + bsm);
      
      if (breakMinutes < 10) {
        errors.push(`Break ${i + 1}: Minimum break is 10 minutes (current: ${breakMinutes} min)`);
      }
      if (breakMinutes > 60) {
        errors.push(`Break ${i + 1}: Maximum break is 1 hour (current: ${breakMinutes} min)`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors,
      requiredBreaks,
      actualBreaks,
      breaksNeeded: Math.max(0, requiredBreaks - actualBreaks)
    };
  } catch (error) {
    console.error("Error in validateBreaks:", error);
    return {
      valid: false,
      errors: [`Error validating breaks: ${error.message}`],
      requiredBreaks: 0,
      actualBreaks: 0,
      breaksNeeded: 0
    };
  }
};

// IMPORTANT: Static method to check time conflict
availabilitySchema.statics.checkTimeConflict = async function(doctorId, dayOfWeek, specificDate, startTime, endTime, excludeId = null) {
  try {
    let query = { doctorId };

    // Exclude current document at query level (avoids false positives when comparing in-memory)
    let excludeOid = null;
    if (excludeId != null && mongoose.Types.ObjectId.isValid(String(excludeId).trim())) {
      excludeOid = new mongoose.Types.ObjectId(String(excludeId).trim());
      query._id = { $ne: excludeOid };
    }

    let weeklyDay = dayOfWeek;
    if (typeof weeklyDay === 'string' && weeklyDay.trim() !== '') {
      weeklyDay = parseInt(weeklyDay, 10);
    }
    
    // Build query based on type of availability
    if (typeof weeklyDay === 'number' && !Number.isNaN(weeklyDay) && weeklyDay >= 0 && weeklyDay <= 6) {
      // Weekly recurring availability
      query.dayOfWeek = weeklyDay;
      query.specificDate = null;
    } else if (specificDate) {
      // Specific date availability
      const queryDate = new Date(specificDate);
      queryDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.specificDate = { $gte: queryDate, $lt: nextDay };
    } else {
      // No valid date/day provided - no conflict check needed
      return { conflict: false };
    }
    
    console.log("Checking time conflict with query:", JSON.stringify(query));
    const existingAvailabilities = await this.find(query);
    console.log("Found existing availabilities:", existingAvailabilities.length);
    console.log("Exclude ID:", excludeId?.toString(), "Type:", typeof excludeId);
    
    // Check for time overlaps (also skip excluded id if $ne was not applied — invalid id)
    const excludeStr = excludeOid ? excludeOid.toString() : excludeId != null ? String(excludeId).trim() : '';

    for (const availability of existingAvailabilities) {
      if (excludeStr && availability._id.toString() === excludeStr) {
        continue;
      }
      
      const existingStart = availability.startTime;
      const existingEnd = availability.endTime;
      
      // Check for time overlap
      if ((startTime >= existingStart && startTime < existingEnd) ||
          (endTime > existingStart && endTime <= existingEnd) ||
          (startTime <= existingStart && endTime >= existingEnd)) {
        console.log("Time conflict found with:", { existingStart, existingEnd, startTime, endTime });
        return {
          conflict: true,
          conflictingAvailability: availability
        };
      }
    }
    
    return { conflict: false };
  } catch (error) {
    console.error("Error in checkTimeConflict:", error.message);
    throw error;
  }
};

availabilitySchema.pre('save', async function() {
  try {
    console.log("=== PRE-SAVE HOOK START ===");
    console.log("Is new document:", this.isNew);
    console.log("Saving document:", {
      doctorId: this.doctorId,
      dayOfWeek: this.dayOfWeek,
      specificDate: this.specificDate,
      startTime: this.startTime,
      endTime: this.endTime
    });
    
    // Auto-calculate max appointments
    console.log("Calculating max appointments...");
    const calculatedMax = this.calculateMaxAppointments();
    console.log("Calculated max:", calculatedMax);
    
    if (!this.maxAppointments || this.maxAppointments > calculatedMax) {
      this.maxAppointments = Math.max(1, calculatedMax);
    }
    
    // Only check for time conflicts during creation (not during updates)
    // Updates are already validated in the controller
    if (this.isNew) {
      console.log("Checking for time conflicts (new document)...");
      const conflictCheck = await this.constructor.checkTimeConflict(
        this.doctorId,
        this.dayOfWeek,
        this.specificDate,
        this.startTime,
        this.endTime,
        null
      );
      console.log("Conflict check result:", conflictCheck);
      
      if (conflictCheck.conflict) {
        console.log("Conflict found!");
        throw new Error('Time conflict: This time overlaps with an existing availability');
      }
    } else {
      console.log("Skipping conflict check (updating existing document)");
    }
    
    // Validate breaks
    console.log("Validating breaks...");
    const breakValidation = this.validateBreaks();
    console.log("Break validation result:", breakValidation);
    
    if (!breakValidation.valid) {
      console.log("Break validation failed!");
      throw new Error(breakValidation.errors.join('. '));
    }
    
    console.log("=== PRE-SAVE HOOK COMPLETE ===");
  } catch (error) {
    console.error("=== PRE-SAVE HOOK ERROR ===");
    console.error("Error in pre-save hook:", error);
    throw error;
  }
});

availabilitySchema.index({ doctorId: 1, isAvailable: 1 });
availabilitySchema.index({ doctorId: 1, dayOfWeek: 1 });
availabilitySchema.index({ doctorId: 1, specificDate: 1 });

module.exports = mongoose.model("Availability", availabilitySchema);