/**
 * Google Calendar Integration Service
 * Handles calendar events creation, management, and synchronization
 */

// Calendar event creation and management
export const CALENDAR_COLORS = {
  surgery: '11',      // Red
  procedure: '6',     // Orange  
  appointment: '7',   // Blue
  follow_up: '2',     // Green
  test: '5',          // Yellow
  medication: '4',    // Purple
  reminder: '8'       // Gray
};

export const REMINDER_PRESETS = {
  surgery: [
    { method: 'popup', minutes: 60 * 24 },     // 1 day before
    { method: 'popup', minutes: 60 * 2 },      // 2 hours before
    { method: 'email', minutes: 60 * 24 }      // 1 day before email
  ],
  procedure: [
    { method: 'popup', minutes: 60 * 12 },     // 12 hours before
    { method: 'popup', minutes: 60 }           // 1 hour before
  ],
  test: [
    { method: 'popup', minutes: 60 * 12 },     // 12 hours before (for fasting)
    { method: 'popup', minutes: 30 }           // 30 minutes before
  ],
  appointment: [
    { method: 'popup', minutes: 60 },          // 1 hour before
    { method: 'popup', minutes: 15 }           // 15 minutes before
  ],
  follow_up: [
    { method: 'popup', minutes: 60 }           // 1 hour before
  ],
  medication: [
    { method: 'popup', minutes: 5 }            // 5 minutes before
  ]
};

/**
 * Create Google Calendar event from medical event
 * @param {object} medicalEvent - The medical event object
 * @returns {object} Google Calendar event object
 */
export function createCalendarEvent(medicalEvent) {
  const startDateTime = combineDateAndTime(medicalEvent.date, medicalEvent.time || '09:00 AM');
  const endDateTime = new Date(startDateTime);
  endDateTime.setMinutes(endDateTime.getMinutes() + getDurationForEventType(medicalEvent.type));

  return {
    summary: medicalEvent.title,
    description: buildEventDescription(medicalEvent),
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    location: medicalEvent.location || '',
    colorId: CALENDAR_COLORS[medicalEvent.type] || CALENDAR_COLORS.appointment,
    reminders: {
      useDefault: false,
      overrides: REMINDER_PRESETS[medicalEvent.type] || REMINDER_PRESETS.appointment
    },
    extendedProperties: {
      private: {
        revado_event_id: medicalEvent.id,
        revado_type: medicalEvent.type,
        revado_priority: medicalEvent.priority,
        revado_provider: medicalEvent.provider || '',
        revado_source: 'voice_conversation',
        revado_confidence: (medicalEvent.confidence || 0.9).toString()
      }
    }
  };
}

/**
 * Create medication reminder event
 * @param {object} medication - Medication object
 * @param {Date} reminderDate - When to remind
 * @returns {object} Google Calendar event object
 */
export function createMedicationReminder(medication, reminderDate) {
  const startDateTime = new Date(reminderDate);
  const endDateTime = new Date(startDateTime);
  endDateTime.setMinutes(endDateTime.getMinutes() + 15); // 15 minute duration

  return {
    summary: `Take ${medication.name}`,
    description: buildMedicationDescription(medication),
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    colorId: CALENDAR_COLORS.medication,
    reminders: {
      useDefault: false,
      overrides: REMINDER_PRESETS.medication
    },
    extendedProperties: {
      private: {
        revado_medication_id: medication.id,
        revado_type: 'medication_reminder',
        revado_dosage: medication.dosage || '',
        revado_frequency: medication.frequency || '',
        revado_source: 'voice_conversation'
      }
    }
  };
}

/**
 * Generate recurring medication reminders
 * @param {object} medication - Medication object
 * @param {Date} startDate - When to start reminders
 * @param {Date} endDate - When to stop reminders (optional)
 * @returns {Array} Array of calendar events
 */
export function generateMedicationSchedule(medication, startDate, endDate) {
  const events = [];
  const frequency = medication.frequency?.toLowerCase() || 'once daily';
  
  let current = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days default

  // Parse frequency and create appropriate schedule
  if (frequency.includes('once daily') || frequency.includes('1 time per day')) {
    const reminderTime = parseTimeString(medication.reminderTime || '09:00');
    
    while (current <= end) {
      const reminderDateTime = new Date(current);
      reminderDateTime.setHours(reminderTime.hours, reminderTime.minutes, 0, 0);
      
      events.push(createMedicationReminder(medication, reminderDateTime));
      
      current.setDate(current.getDate() + 1);
    }
  } else if (frequency.includes('twice daily') || frequency.includes('2 times per day')) {
    const times = ['09:00', '21:00']; // 9 AM and 9 PM
    
    while (current <= end) {
      times.forEach(timeStr => {
        const time = parseTimeString(timeStr);
        const reminderDateTime = new Date(current);
        reminderDateTime.setHours(time.hours, time.minutes, 0, 0);
        
        events.push(createMedicationReminder(medication, reminderDateTime));
      });
      
      current.setDate(current.getDate() + 1);
    }
  } else if (frequency.includes('three times daily') || frequency.includes('3 times per day')) {
    const times = ['08:00', '14:00', '20:00']; // 8 AM, 2 PM, 8 PM
    
    while (current <= end) {
      times.forEach(timeStr => {
        const time = parseTimeString(timeStr);
        const reminderDateTime = new Date(current);
        reminderDateTime.setHours(time.hours, time.minutes, 0, 0);
        
        events.push(createMedicationReminder(medication, reminderDateTime));
      });
      
      current.setDate(current.getDate() + 1);
    }
  } else if (frequency.includes('weekly')) {
    while (current <= end) {
      const reminderTime = parseTimeString(medication.reminderTime || '09:00');
      const reminderDateTime = new Date(current);
      reminderDateTime.setHours(reminderTime.hours, reminderTime.minutes, 0, 0);
      
      events.push(createMedicationReminder(medication, reminderDateTime));
      
      current.setDate(current.getDate() + 7);
    }
  }

  return events;
}

/**
 * Simulate Google Calendar API integration
 * In a real app, this would use the actual Google Calendar API
 * @param {Array} events - Array of calendar events to create
 * @returns {Promise<object>} Result of calendar operations
 */
export async function syncToGoogleCalendar(events) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // In a real implementation, this would:
  // 1. Authenticate with Google Calendar API
  // 2. Create or update events
  // 3. Handle conflicts and duplicates
  // 4. Return actual event IDs and URLs
  
  console.log('[Calendar] Simulating Google Calendar sync for events:', events);
  
  const results = events.map((event, index) => ({
    localId: event.extendedProperties?.private?.revado_event_id || `temp_${index}`,
    googleEventId: `google_event_${Date.now()}_${index}`,
    status: 'created',
    htmlLink: `https://calendar.google.com/calendar/event?eid=${btoa(`event_${index}`)}`,
    created: new Date().toISOString(),
    summary: event.summary,
    start: event.start,
    end: event.end
  }));
  
  // Store sync results in localStorage for demo
  const syncHistory = JSON.parse(localStorage.getItem('calendarSyncHistory') || '[]');
  const syncRecord = {
    id: Date.now().toString(),
    syncedAt: new Date().toISOString(),
    eventsCount: events.length,
    results: results,
    success: true
  };
  syncHistory.push(syncRecord);
  localStorage.setItem('calendarSyncHistory', JSON.stringify(syncHistory));
  
  return {
    success: true,
    eventsCreated: results.length,
    results: results,
    syncId: syncRecord.id,
    message: `Successfully created ${results.length} calendar events`
  };
}

/**
 * Get calendar sync history
 * @returns {Array} Array of past sync operations
 */
export function getCalendarSyncHistory() {
  return JSON.parse(localStorage.getItem('calendarSyncHistory') || '[]');
}

/**
 * Remove calendar event (simulate)
 * @param {string} googleEventId - Google Calendar event ID
 * @returns {Promise<object>} Result of deletion
 */
export async function removeCalendarEvent(googleEventId) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('[Calendar] Simulating removal of event:', googleEventId);
  
  // Update sync history to mark as deleted
  const syncHistory = getCalendarSyncHistory();
  syncHistory.forEach(sync => {
    sync.results.forEach(result => {
      if (result.googleEventId === googleEventId) {
        result.status = 'deleted';
        result.deletedAt = new Date().toISOString();
      }
    });
  });
  localStorage.setItem('calendarSyncHistory', JSON.stringify(syncHistory));
  
  return {
    success: true,
    eventId: googleEventId,
    status: 'deleted'
  };
}

// Helper functions
function combineDateAndTime(dateString, timeString) {
  const date = new Date(dateString);
  const time = parseTimeString(timeString);
  
  date.setHours(time.hours, time.minutes, 0, 0);
  return date;
}

function parseTimeString(timeStr) {
  const [time, period] = timeStr.split(' ');
  const [hoursStr, minutesStr] = time.split(':');
  let hours = parseInt(hoursStr);
  const minutes = parseInt(minutesStr) || 0;
  
  if (period && period.toLowerCase() === 'pm' && hours !== 12) {
    hours += 12;
  } else if (period && period.toLowerCase() === 'am' && hours === 12) {
    hours = 0;
  }
  
  return { hours, minutes };
}

function getDurationForEventType(type) {
  const durations = {
    surgery: 180,      // 3 hours
    procedure: 90,     // 1.5 hours
    appointment: 60,   // 1 hour
    follow_up: 30,     // 30 minutes
    test: 30,          // 30 minutes
    medication: 15     // 15 minutes
  };
  return durations[type] || 60;
}

function buildEventDescription(event) {
  let description = event.description || '';
  
  if (event.provider) {
    description += `\n\nProvider: ${event.provider}`;
  }
  
  if (event.location) {
    description += `\nLocation: ${event.location}`;
  }
  
  if (event.needsPrep && event.prepInstructions) {
    description += '\n\n🚨 PREPARATION REQUIRED:\n';
    event.prepInstructions.forEach(instruction => {
      description += `• ${instruction}\n`;
    });
  }
  
  if (event.priority) {
    description += `\n\nPriority: ${event.priority.toUpperCase()}`;
  }
  
  if (event.confidence) {
    description += `\n\n🤖 AI Confidence: ${Math.round(event.confidence * 100)}%`;
  }
  
  description += '\n\n📱 Created by Revado Voice AI';
  return description;
}

function buildMedicationDescription(medication) {
  let description = `Medication: ${medication.name}`;
  
  if (medication.dosage) {
    description += `\nDosage: ${medication.dosage}`;
  }
  
  if (medication.instructions) {
    description += `\nInstructions: ${medication.instructions}`;
  }
  
  if (medication.prescriber) {
    description += `\nPrescribed by: ${medication.prescriber}`;
  }
  
  if (medication.reason) {
    description += `\nReason: ${medication.reason}`;
  }
  
  if (medication.sideEffects && medication.sideEffects.length > 0) {
    description += `\n\n⚠️ Possible Side Effects:\n• ${medication.sideEffects.join('\n• ')}`;
  }
  
  if (medication.interactions && medication.interactions.length > 0) {
    description += `\n\n🚨 Drug Interactions:\n• ${medication.interactions.join('\n• ')}`;
  }
  
  description += '\n\n📱 Created by Revado Voice AI';
  return description;
}

export default {
  createCalendarEvent,
  createMedicationReminder,
  generateMedicationSchedule,
  syncToGoogleCalendar,
  getCalendarSyncHistory,
  removeCalendarEvent,
  CALENDAR_COLORS,
  REMINDER_PRESETS
};