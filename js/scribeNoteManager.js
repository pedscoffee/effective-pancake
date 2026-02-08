import { noteStyles, scribeTemplates, baseScribeRole } from './templates.js';
import { getConversationManager } from './conversation.js';

export class ScribeNoteManager {
    constructor(conversationManager) {
        this.conversationManager = conversationManager;
        this.noteHistory = [];
        this.isInitialized = false;
    }

    async init() {
        this.isInitialized = true;
        console.log("ScribeNoteManager initialized");
    }

    async generateNote(preferences) {
        if (!this.isInitialized || !this.conversationManager.engine) return null;

        try {
            const transcript = this._getFullTranscript();
            const style = preferences.noteStyle || 'SOAP';
            const stylePrompt = noteStyles[style] || noteStyles['SOAP'];
            const specialtyPrompt = scribeTemplates[preferences.specialty] || '';
            const contextPrompt = preferences.customInstructions || '';

            const systemPrompt = `${baseScribeRole}
            Your task is to generate a comprehensive medical note based on the provided transcript.
            
            FORMATTING STYLE:
            ${stylePrompt}
            
            SPECIALTY CONTEXT:
            ${specialtyPrompt}
            
            ENCOUNTER CONTEXT:
            ${contextPrompt}
            
            TRANSCRIPT:
            ${transcript}
            
            Generate the note now. If details are missing, omit them. Do not hallucinate.`;

            const note = await this._generateResponse(systemPrompt, "Please generate the note based on the transcript above.");

            this.noteHistory.push({
                type: 'note',
                content: note,
                timestamp: Date.now()
            });

            return note;
        } catch (error) {
            console.error("Note generation error:", error);
            return null;
        }
    }

    async refineNote(userRefinement, currentNote) {
        if (!this.isInitialized || !this.conversationManager.engine) return null;

        try {
            const systemPrompt = `${baseScribeRole}
            You have already generated a medical note. The user wants to refine it.
            
            CURRENT NOTE:
            ${currentNote}
            
            USER REFINEMENT REQUEST:
            "${userRefinement}"
            
            Update the note according to the user's request while maintaining professional standards.`;

            const refinedNote = await this._generateResponse(systemPrompt, "Apply the refinement to the note.");

            this.noteHistory.push({
                type: 'refinement',
                content: refinedNote,
                timestamp: Date.now()
            });

            return refinedNote;
        } catch (error) {
            console.error("Note refinement error:", error);
            return null;
        }
    }

    async _generateResponse(systemPrompt, userPrompt) {
        const engine = this.conversationManager.engine;

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ];

        const completion = await engine.chat.completions.create({
            messages: messages,
            temperature: 0.3, // Lower temperature for medical documentation
            max_tokens: 1024,
        });

        return completion.choices[0].message.content.trim();
    }

    _getFullTranscript() {
        const mainHistory = this.conversationManager.getHistory();
        return mainHistory.map(m => {
            const role = m.role === 'assistant' ? 'AI Scribe' : 'Speaker';
            return `${role}: ${m.content}`;
        }).join('\n');
    }

    reset() {
        this.noteHistory = [];
    }
}

let scribeNoteManager = null;

export async function initScribeNoteManager(conversationManager) {
    if (!scribeNoteManager) {
        scribeNoteManager = new ScribeNoteManager(conversationManager);
        await scribeNoteManager.init();
    }
    return scribeNoteManager;
}

export function getScribeNoteManager(conversationManager) {
    if (!scribeNoteManager) {
        const mgr = conversationManager || getConversationManager();
        if (mgr) {
            scribeNoteManager = new ScribeNoteManager(mgr);
            scribeNoteManager.init();
        }
    }
    return scribeNoteManager;
}
