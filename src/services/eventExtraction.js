/**
 * Event Extraction Service
 * AI-powered extraction of important medical events from voice conversations
 */

// Event types that can be extracted
export const EVENT_TYPES = {
  APPOINTMENT: 'appointment',
  SURGERY: 'surgery', 
  PROCEDURE: 'procedure',
  TEST: 'test',
  FOLLOW_UP: 'follow_up',
  MEDICATION_CHANGE: 'medication_change',
  MEDICATION_START: 'medication_start',
  MEDICATION_STOP: 'medication_stop',
  SYMPTOM_ONSET: 'symptom_onset',
  TREATMENT_START: 'treatment_start',
  TREATMENT_END: 'treatment_end',
  REMINDER: 'reminder',
  LIFESTYLE_CHANGE: 'lifestyle_change'
};

// Priority levels for events
export const PRIORITY_LEVELS = {
  URGENT: 'urgent',
  HIGH: 'high', 
  MEDIUM: 'medium',
  LOW: 'low'
};

/**
 * Extract important medical events from conversation transcript
 * @param {string} transcript - The conversation transcript
 * @param {object} analysis - Existing AI analysis
 * @returns {Promise<object>} Extracted events and medications
 */
export async function extractMedicalEvents(transcript, analysis = {}) {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Demo extraction based on transcript content
  const events = [];
  const medications = [];
  const reminders = [];

  // Extract appointments and procedures
  if (transcript.toLowerCase().includes('surgery') || transcript.toLowerCase().includes('operation')) {
    events.push({
      id: generateEventId(),
      type: EVENT_TYPES.SURGERY,
      title: 'Knee Surgery',
      description: 'Arthroscopic knee surgery as discussed with Dr. Johnson',
      date: getNextWeekDate(7), // 1 week from now
      time: '09:00 AM',
      location: 'City Medical Center - Surgery Wing',
      priority: PRIORITY_LEVELS.HIGH,
      provider: 'Dr. Johnson - Orthopedic Surgery',
      needsPrep: true,
      prepInstructions: [
        'Stop eating 12 hours before surgery',
        'Take prescribed antibiotics starting 3 days before',
        'Arrange transportation (cannot drive after procedure)'
      ],
      calendarReady: true,
      extracted_from: 'Voice conversation',
      confidence: 0.95
    });
  }

  if (transcript.toLowerCase().includes('appointment') || transcript.toLowerCase().includes('follow up')) {
    events.push({
      id: generateEventId(),
      type: EVENT_TYPES.FOLLOW_UP,
      title: 'Follow-up Appointment',
      description: 'Follow-up to discuss test results and treatment progress',
      date: getNextWeekDate(14), // 2 weeks from now
      time: '02:30 PM',
      location: 'Main Clinic - Room 205',
      priority: PRIORITY_LEVELS.MEDIUM,
      provider: 'Dr. Smith - Primary Care',
      needsPrep: false,
      calendarReady: true,
      extracted_from: 'Voice conversation',
      confidence: 0.88
    });
  }

  // Extract medication changes
  if (transcript.toLowerCase().includes('medication') || transcript.toLowerCase().includes('prescription')) {
    medications.push({
      id: generateMedicationId(),
      action: 'start',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'once daily',
      instructions: 'Take in the morning with food',
      startDate: new Date().toISOString().split('T')[0],
      endDate: null, // Ongoing
      prescriber: 'Dr. Smith',
      reason: 'Blood pressure management',
      sideEffects: ['Dizziness', 'Dry cough', 'Fatigue'],
      interactions: ['Potassium supplements', 'NSAIDs'],
      priority: PRIORITY_LEVELS.HIGH,
      needsMonitoring: true,
      monitoringSchedule: 'Check blood pressure weekly for first month',
      extracted_from: 'Voice conversation',
      confidence: 0.92
    });

    if (transcript.toLowerCase().includes('stop') || transcript.toLowerCase().includes('discontinue')) {
      medications.push({
        id: generateMedicationId(),
        action: 'stop',
        name: 'Ibuprofen',
        reason: 'Switching to prescription pain management',
        stopDate: new Date().toISOString().split('T')[0],
        prescriber: 'Dr. Johnson',
        priority: PRIORITY_LEVELS.MEDIUM,
        extracted_from: 'Voice conversation',
        confidence: 0.87
      });
    }
  }

  // Extract test/lab work
  if (transcript.toLowerCase().includes('blood work') || transcript.toLowerCase().includes('lab') || transcript.toLowerCase().includes('test')) {
    events.push({
      id: generateEventId(),
      type: EVENT_TYPES.TEST,
      title: 'Blood Work - Comprehensive Metabolic Panel',
      description: 'Routine blood work to monitor treatment progress',
      date: getNextWeekDate(3), // 3 days from now
      time: '08:00 AM',
      location: 'City Lab Services - Fasting Required',
      priority: PRIORITY_LEVELS.MEDIUM,
      provider: 'City Lab Services',
      needsPrep: true,
      prepInstructions: [
        'Fast for 12 hours before test',
        'Bring insurance card and ID',
        'Drink plenty of water (helps with blood draw)'
      ],
      calendarReady: true,
      extracted_from: 'Voice conversation',
      confidence: 0.91
    });
  }

  // Extract reminders and lifestyle changes
  if (transcript.toLowerCase().includes('exercise') || transcript.toLowerCase().includes('diet')) {
    reminders.push({
      id: generateReminderId(),
      type: EVENT_TYPES.LIFESTYLE_CHANGE,
      title: 'Start Physical Therapy Exercises',
      description: 'Begin prescribed knee exercises 3x daily',
      frequency: 'daily',
      startDate: new Date().toISOString().split('T')[0],
      instructions: [
        'Perform exercises 3 times per day',
        'Hold each stretch for 30 seconds',
        'Ice knee for 15 minutes after exercises'
      ],
      priority: PRIORITY_LEVELS.MEDIUM,
      extracted_from: 'Voice conversation',
      confidence: 0.83
    });
  }

  // Extract symptom monitoring
  if (transcript.toLowerCase().includes('pain') || transcript.toLowerCase().includes('symptom')) {
    reminders.push({
      id: generateReminderId(),
      type: EVENT_TYPES.SYMPTOM_ONSET,
      title: 'Track Pain Levels',
      description: 'Monitor and log daily pain levels (1-10 scale)',
      frequency: 'daily',
      startDate: new Date().toISOString().split('T')[0],
      endDate: getNextWeekDate(30), // 30 days
      instructions: [
        'Rate pain level 1-10 each morning and evening',
        'Note any triggers or patterns',
        'Record in pain diary or health app'
      ],
      priority: PRIORITY_LEVELS.LOW,
      extracted_from: 'Voice conversation',
      confidence: 0.79
    });
  }

  return {
    events: events.sort((a, b) => new Date(a.date) - new Date(b.date)),
    medications: medications.sort((a, b) => priorityOrder(b.priority) - priorityOrder(a.priority)),
    reminders: reminders.sort((a, b) => priorityOrder(b.priority) - priorityOrder(a.priority)),
    summary: {
      totalEvents: events.length,
      totalMedications: medications.length,
      totalReminders: reminders.length,
      urgentItems: [...events, ...medications, ...reminders].filter(item => item.priority === PRIORITY_LEVELS.URGENT).length,
      nextUpcomingEvent: events.length > 0 ? events[0] : null
    }
  };
}

/**
 * Generate medication tracking data
 * @param {Array} medications - Extracted medications
 * @returns {object} Medication tracking structure
 */
export function generateMedicationTracking(medications) {
  const activeMedications = medications.filter(med => med.action !== 'stop');
  const stoppedMedications = medications.filter(med => med.action === 'stop');

  return {
    active: activeMedications.map(med => ({
      ...med,
      adherenceTracking: true,
      nextDose: calculateNextDose(med),
      refillReminder: calculateRefillDate(med),
      interactionChecks: med.interactions || []
    })),
    stopped: stoppedMedications,
    changes: medications.filter(med => med.action === 'change' || med.action === 'adjust'),
    adherenceScore: calculateAdherenceScore(activeMedications),
    totalActive: activeMedications.length,
    recentChanges: medications.filter(med => 
      new Date(med.startDate || med.stopDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length
  };
}

/**
 * Create calendar events from extracted medical events
 * @param {Array} events - Extracted events
 * @returns {Array} Google Calendar compatible events
 */
export function createCalendarEvents(events) {
  return events.map(event => ({
    id: event.id,
    summary: event.title,
    description: buildCalendarDescription(event),
    start: {
      dateTime: combineDateAndTime(event.date, event.time),
      timeZone: 'America/New_York' // Should be user's timezone
    },
    end: {
      dateTime: combineDateAndTime(event.date, event.time, getDurationForEventType(event.type)),
      timeZone: 'America/New_York'
    },
    location: event.location,
    reminders: {
      useDefault: false,
      overrides: getRemindersForEventType(event.type)
    },
    colorId: getColorForEventType(event.type),
    extendedProperties: {
      private: {
        revado_event_id: event.id,
        revado_type: event.type,
        revado_priority: event.priority,
        revado_provider: event.provider,
        revado_source: 'voice_conversation'
      }
    }
  }));
}

// Helper functions
function generateEventId() {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateMedicationId() {
  return `med_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateReminderId() {
  return `rem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getNextWeekDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

function priorityOrder(priority) {
  const order = {
    [PRIORITY_LEVELS.URGENT]: 4,
    [PRIORITY_LEVELS.HIGH]: 3,
    [PRIORITY_LEVELS.MEDIUM]: 2,
    [PRIORITY_LEVELS.LOW]: 1
  };
  return order[priority] || 0;
}

function calculateNextDose(medication) {
  // Simple calculation - in real app would be more sophisticated
  const now = new Date();
  if (medication.frequency === 'once daily') {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9 AM default
    return tomorrow.toISOString();
  }
  return now.toISOString();
}

function calculateRefillDate(medication) {
  // Assume 30-day supply
  const start = new Date(medication.startDate);
  start.setDate(start.getDate() + 30);
  return start.toISOString().split('T')[0];
}

function calculateAdherenceScore(medications) {
  // Simplified calculation - would integrate with actual tracking
  return Math.floor(Math.random() * 15) + 85; // 85-100%
}

function buildCalendarDescription(event) {
  let description = event.description || '';
  
  if (event.provider) {
    description += `\n\nProvider: ${event.provider}`;
  }
  
  if (event.needsPrep && event.prepInstructions) {
    description += '\n\nPreparation Required:\n';
    event.prepInstructions.forEach(instruction => {
      description += `• ${instruction}\n`;
    });
  }
  
  description += '\n\n📱 Created by Revado Voice AI';
  return description;
}

function combineDateAndTime(date, time, durationMinutes = 60) {
  const [hours, minutes] = time.split(/[: ]/);
  const isPM = time.toLowerCase().includes('pm');
  let hour24 = parseInt(hours);
  
  if (isPM && hour24 !== 12) hour24 += 12;
  if (!isPM && hour24 === 12) hour24 = 0;
  
  const datetime = new Date(`${date}T${hour24.toString().padStart(2, '0')}:${minutes.padStart(2, '0')}:00`);
  
  if (durationMinutes) {
    datetime.setMinutes(datetime.getMinutes() + durationMinutes);
  }
  
  return datetime.toISOString();
}

function getDurationForEventType(type) {
  const durations = {
    [EVENT_TYPES.SURGERY]: 180, // 3 hours
    [EVENT_TYPES.PROCEDURE]: 90, // 1.5 hours
    [EVENT_TYPES.APPOINTMENT]: 60, // 1 hour
    [EVENT_TYPES.FOLLOW_UP]: 30, // 30 minutes
    [EVENT_TYPES.TEST]: 30 // 30 minutes
  };
  return durations[type] || 60;
}

function getRemindersForEventType(type) {
  const reminders = {
    [EVENT_TYPES.SURGERY]: [
      { method: 'popup', minutes: 60 * 24 }, // 1 day before
      { method: 'popup', minutes: 60 * 2 }   // 2 hours before
    ],
    [EVENT_TYPES.TEST]: [
      { method: 'popup', minutes: 60 * 12 } // 12 hours before (for fasting)
    ]
  };
  return reminders[type] || [{ method: 'popup', minutes: 15 }];
}

function getColorForEventType(type) {
  const colors = {
    [EVENT_TYPES.SURGERY]: '11', // Red
    [EVENT_TYPES.PROCEDURE]: '6', // Orange
    [EVENT_TYPES.APPOINTMENT]: '7', // Blue
    [EVENT_TYPES.FOLLOW_UP]: '2', // Green
    [EVENT_TYPES.TEST]: '5' // Yellow
  };
  return colors[type] || '1';
}

export default {
  extractMedicalEvents,
  generateMedicationTracking,
  createCalendarEvents,
  EVENT_TYPES,
  PRIORITY_LEVELS
};