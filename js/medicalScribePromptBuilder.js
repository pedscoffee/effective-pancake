import { scribeTemplates, noteStyles, baseScribeRole } from './templates.js';

export class MedicalScribePromptBuilder {
    constructor(userPreferences) {
        this.preferences = userPreferences;
    }

    build() {
        let prompt = baseScribeRole + "\n\n";

        // 1. Patient Context (Required)
        const context = this.preferences.customInstructions || 'No specific patient context provided.';
        prompt += `PATIENT & ENCOUNTER CONTEXT:\n${context}\n\n`;

        // 2. Note Style
        const style = this.preferences.noteStyle || 'SOAP';
        const styleDescription = noteStyles[style] || noteStyles['SOAP'];
        prompt += `NOTE FORMATTING STYLE: ${style}\n`;
        prompt += `${styleDescription}\n\n`;

        // 3. Specialty Context
        if (this.preferences.specialty && scribeTemplates[this.preferences.specialty]) {
            prompt += "SPECIALTY GUIDANCE:\n";
            prompt += `${scribeTemplates[this.preferences.specialty]}\n\n`;
        }

        // General Rules
        prompt += "IMPORTANT SCRIBING RULES:\n";
        prompt += "1. Extract ALL clinically relevant information from the transcript.\n";
        prompt += "2. Use professional medical terminology (e.g., 'erythematous' instead of 'red').\n";
        prompt += "3. Organise the note logically based on the chosen style.\n";
        prompt += "4. If information is missing (e.g., specific vitals), do not hallucinate them; leave placeholders or omit.\n";
        prompt += "5. Ignore irrelevant conversational filler.\n";

        return prompt;
    }
}
