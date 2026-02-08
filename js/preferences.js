export class UserPreferences {
    constructor() {
        this.storageKey = 'aether_scribe_preferences';
        this.preferences = this.load();
    }

    load() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            return JSON.parse(stored);
        }
        return {
            noteStyle: 'SOAP',
            specialty: 'internal_medicine',
            customInstructions: '',
            muted: false,
            selectedVoice: '',
            darkMode: false,
            tutorInstruction: 'pediatrics', // Repurposing as specialty context
            tutorLanguage: 'english'
        };
    }

    save() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
    }

    update(newPrefs) {
        this.preferences = { ...this.preferences, ...newPrefs };
        this.save();
    }

    get() {
        return this.preferences;
    }

    reset() {
        localStorage.removeItem(this.storageKey);
        this.preferences = this.load();
    }
}
