// Anthropic Claude API service for generating intelligent questions
const CLAUDE_API_URL = import.meta.env.VITE_CLAUDE_API_URL || 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;

/**
 * Service for generating personalized questions using Anthropic Claude
 */
class ClaudeService {
  constructor() {
    this.apiUrl = CLAUDE_API_URL;
    this.apiKey = CLAUDE_API_KEY;
    this.model = 'claude-3-5-sonnet-20241022';
  }

  /**
   * Generate personalized questions based on health data
   */
  async generateQuestions(healthData) {
    if (!this.apiKey) {
      console.warn('Claude API key not found, falling back to local generation');
      return this.fallbackGeneration(healthData);
    }

    try {
      const prompt = this.buildPrompt(healthData);

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1024,
          temperature: 0.7,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        console.error('Claude API error:', response.status, response.statusText);
        return this.fallbackGeneration(healthData);
      }

      const data = await response.json();
      const generatedText = data.content?.[0]?.text;

      if (!generatedText) {
        console.error('No content in Claude response');
        return this.fallbackGeneration(healthData);
      }

      return this.parseQuestions(generatedText);
    } catch (error) {
      console.error('Error calling Claude API:', error);
      return this.fallbackGeneration(healthData);
    }
  }

  /**
   * Build the prompt for Claude based on health data
   */
  buildPrompt(healthData) {
    const {
      medications = [],
      doctorType = '',
      prescribers = [],
      recentRecords = []
    } = healthData;

    let prompt = `You are a medical assistant helping a patient prepare meaningful, personalized questions for their upcoming doctor appointment.

Based on the patient's health data below, generate exactly 3 thoughtful questions that:
1. Reference specific medications, prescribers, or health records when relevant
2. Are tailored to the type of doctor they're seeing
3. Help the patient get the most value from their appointment
4. Are conversational and natural-sounding

Patient's Health Data:
`;

    // Add medication information
    if (medications.length > 0) {
      prompt += `\nCurrent Medications:\n`;
      medications.forEach(med => {
        const startDate = med.startDate ? ` (started ${new Date(med.startDate).toLocaleDateString()})` : '';
        const prescriber = med.prescribedBy ? ` - prescribed by ${med.prescribedBy}` : '';
        prompt += `- ${med.name} ${med.dosage}, ${med.frequency}${startDate}${prescriber}\n`;
      });
    }

    // Add prescriber information
    if (prescribers.length > 0) {
      prompt += `\nOther Healthcare Providers: ${prescribers.join(', ')}\n`;
    }

    // Add recent health records
    if (recentRecords.length > 0) {
      prompt += `\nRecent Health Records:\n`;
      recentRecords.forEach(record => {
        const date = record.uploadedAt ? new Date(record.uploadedAt).toLocaleDateString() : 'recently';
        prompt += `- ${record.title || record.fileName} (${date})\n`;
      });
    }

    // Add doctor type context
    const doctorContext = this.getDoctorContext(doctorType);
    if (doctorContext) {
      prompt += `\n${doctorContext}\n`;
    }

    prompt += `\nGenerate exactly 3 questions, each on a new line, starting with "Q1:", "Q2:", "Q3:". Make them specific to this patient's situation and helpful for their ${this.getDoctorTypeName(doctorType)} appointment.

Focus on:
- Medication effectiveness and side effects
- Care coordination between providers
- Follow-up on previous test results or treatments
- Preventive care recommendations
- Symptom tracking and management

Questions should be conversational and reference specific details from the patient's data when possible.`;

    return prompt;
  }

  /**
   * Get doctor-specific context
   */
  getDoctorContext(doctorType) {
    switch (doctorType) {
      case 'primary-care':
        return 'This is a PRIMARY CARE appointment. Focus on overall health management, preventive care, medication coordination, and general wellness questions.';
      case 'cardiologist':
        return 'This is a CARDIOLOGY appointment. Focus on heart health, blood pressure medications, cholesterol management, and cardiovascular risk factors.';
      case 'endocrinologist':
        return 'This is an ENDOCRINOLOGY appointment. Focus on hormone levels, diabetes management, thyroid function, and metabolic health.';
      case 'psychiatrist':
        return 'This is a PSYCHIATRY appointment. Focus on mental health medications, therapy effectiveness, side effects, and mood management.';
      case 'dermatologist':
        return 'This is a DERMATOLOGY appointment. Focus on skin conditions, topical medications, sun protection, and skin cancer screening.';
      case 'gastroenterologist':
        return 'This is a GASTROENTEROLOGY appointment. Focus on digestive health, GI medications, dietary concerns, and screening procedures.';
      case 'neurologist':
        return 'This is a NEUROLOGY appointment. Focus on neurological symptoms, brain health, seizure management, and neurological medications.';
      case 'orthopedist':
        return 'This is an ORTHOPEDIC appointment. Focus on joint health, mobility issues, pain management, and musculoskeletal concerns.';
      default:
        return 'This is a general medical appointment. Focus on overall health and wellness based on the patient\'s current conditions and medications.';
    }
  }

  /**
   * Get friendly doctor type name
   */
  getDoctorTypeName(doctorType) {
    const types = {
      'primary-care': 'primary care',
      'cardiologist': 'cardiology',
      'endocrinologist': 'endocrinology',
      'psychiatrist': 'psychiatry',
      'dermatologist': 'dermatology',
      'gastroenterologist': 'gastroenterology',
      'neurologist': 'neurology',
      'orthopedist': 'orthopedic'
    };
    return types[doctorType] || 'medical';
  }

  /**
   * Parse questions from Claude response
   */
  parseQuestions(text) {
    try {
      const lines = text.split('\n').filter(line => line.trim());
      const questions = [];

      for (const line of lines) {
        const match = line.match(/^Q[123]:\s*(.+)/i);
        if (match && match[1]) {
          questions.push({
            id: `q-${questions.length}`,
            text: match[1].trim(),
            recording: null,
            isPlaying: false
          });
        }
      }

      // If we didn't get exactly 3 questions, try a different parsing approach
      if (questions.length !== 3) {
        const allLines = text.split('\n').filter(line => line.trim() && !line.startsWith('#'));
        const fallbackQuestions = allLines.slice(0, 3).map((line, index) => ({
          id: `q-${index}`,
          text: line.replace(/^[Q123\d\-*.\\s]*/, '').trim(),
          recording: null,
          isPlaying: false
        }));

        if (fallbackQuestions.length > 0) {
          return fallbackQuestions;
        }
      }

      return questions.length === 3 ? questions : this.getDefaultQuestions();
    } catch (error) {
      console.error('Error parsing questions:', error);
      return this.getDefaultQuestions();
    }
  }

  /**
   * Fallback question generation when Claude API is unavailable
   */
  fallbackGeneration(healthData) {
    const { medications = [], doctorType = '', prescribers = [], recentRecords = [] } = healthData;

    const activeMeds = medications.filter(m => m.status === 'active');
    const questions = [];

    // Generate doctor-specific questions with real data
    switch (doctorType) {
      case 'primary-care':
        if (prescribers.length > 1) {
          questions.push(`I'm seeing multiple doctors: ${prescribers.join(', ')}. How should we coordinate my care between these providers?`);
        }
        if (activeMeds.length > 0) {
          const recentMed = activeMeds.find(m => m.startDate);
          if (recentMed) {
            const timeSince = this.getTimeSince(recentMed.startDate);
            if (timeSince) {
              questions.push(`It's been ${timeSince} since I started taking ${recentMed.name} ${recentMed.dosage}. How am I responding to this medication?`);
            }
          } else {
            questions.push(`I'm currently taking ${activeMeds.map(m => `${m.name} ${m.dosage}`).join(', ')}. Are there any interactions or adjustments we should consider?`);
          }
        }
        if (recentRecords.length > 0) {
          const lastRecord = recentRecords[recentRecords.length - 1];
          const recordDate = lastRecord.uploadedAt ? new Date(lastRecord.uploadedAt).toLocaleDateString() : 'recently';
          questions.push(`Based on the health records I uploaded ${recordDate}, what areas should we focus on improving?`);
        }
        break;

      case 'cardiologist': {
        const heartMeds = activeMeds.filter(m =>
          m.name.toLowerCase().includes('lisinopril') ||
          m.name.toLowerCase().includes('atorvastatin') ||
          m.name.toLowerCase().includes('aspirin') ||
          m.name.toLowerCase().includes('metoprolol')
        );

        if (heartMeds.length > 0) {
          const med = heartMeds[0];
          const timeSince = this.getTimeSince(med.startDate);
          if (timeSince) {
            questions.push(`I've been on ${med.name} ${med.dosage} for ${timeSince}. How are my cardiovascular markers responding?`);
          }
        }

        if (activeMeds.some(m => m.name.toLowerCase().includes('atorvastatin'))) {
          questions.push(`How are my cholesterol levels responding to the Atorvastatin? Should we adjust the dose or consider dietary changes?`);
        }

        questions.push("Based on my current medications and health history, what cardiovascular risks should I be monitoring?");
        break;
      }

      case 'endocrinologist': {
        const diabetesMeds = activeMeds.filter(m =>
          m.name.toLowerCase().includes('metformin') ||
          m.name.toLowerCase().includes('insulin')
        );

        if (diabetesMeds.length > 0) {
          const med = diabetesMeds[0];
          questions.push(`How is my diabetes control with ${med.name} ${med.dosage}? What should my HbA1c target be?`);
        }
        break;
      }

      default:
        if (activeMeds.length > 0) {
          questions.push(`I'm currently taking ${activeMeds.length} medication${activeMeds.length > 1 ? 's' : ''}. How do these affect what we discuss today?`);
        }
        if (recentRecords.length > 0) {
          questions.push(`Based on my recent health records, what patterns or concerns should we address?`);
        }
        if (prescribers.length > 1) {
          questions.push(`I work with ${prescribers.length} different doctors. How can we best coordinate my care?`);
        }
    }

    // Ensure we have 3 questions
    const fallbackQuestions = [
      "What follow-up appointments or tests should I schedule?",
      "Are there any warning signs I should watch for?",
      "What lifestyle changes would you recommend based on my current condition?"
    ];

    while (questions.length < 3) {
      questions.push(fallbackQuestions[questions.length % fallbackQuestions.length]);
    }

    return questions.slice(0, 3).map((q, index) => ({
      id: `q-${index}`,
      text: q,
      recording: null,
      isPlaying: false
    }));
  }

  /**
   * Calculate time since a date
   */
  getTimeSince(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''}`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  }

  /**
   * Default questions as fallback
   */
  getDefaultQuestions() {
    return [
      {
        id: 'q-0',
        text: "How can I improve my overall health based on my current condition?",
        recording: null,
        isPlaying: false
      },
      {
        id: 'q-1',
        text: "What preventive measures should I be focusing on?",
        recording: null,
        isPlaying: false
      },
      {
        id: 'q-2',
        text: "Are there any health trends I should be monitoring?",
        recording: null,
        isPlaying: false
      }
    ];
  }
}

// Create singleton instance
const claudeService = new ClaudeService();

export { ClaudeService };
export default claudeService;
