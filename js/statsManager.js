import { saveToStorageAsync, loadFromStorage } from './asyncStorage.js';

export class StatsManager {
    constructor() {
        this.storageKey = 'aether_scribe_stats';
        this.sessions = this.loadSessions();
        this.currentSession = null;
    }

    loadSessions() {
        const data = loadFromStorage(this.storageKey);
        return data ? data.sessions || [] : [];
    }

    async saveSessions() {
        await saveToStorageAsync(this.storageKey, {
            sessions: this.sessions,
            lastUpdated: Date.now()
        });
    }

    startSession(preferences) {
        this.currentSession = {
            sessionId: this.generateId(),
            date: new Date().toISOString().split('T')[0],
            startTime: Date.now(),
            endTime: null,
            duration: 0,
            messageCount: 0,
            userMessageCount: 0,
            aiMessageCount: 0,
            noteStyle: preferences.noteStyle || 'SOAP',
            specialty: preferences.specialty || 'General',
            customGoal: preferences.customInstructions || '',
        };
        console.log('Stats: Encounter started', this.currentSession.sessionId);
    }

    trackMessage(sender, message) {
        if (!this.currentSession) return;
        this.currentSession.messageCount++;
        if (sender === 'user') {
            this.currentSession.userMessageCount++;
        } else {
            this.currentSession.aiMessageCount++;
        }
    }

    async endSession() {
        if (!this.currentSession) return;
        this.currentSession.endTime = Date.now();
        this.currentSession.duration = Math.floor((this.currentSession.endTime - this.currentSession.startTime) / 1000);
        this.sessions.push({ ...this.currentSession });
        await this.saveSessions();
        this.currentSession = null;
    }

    isSessionActive() {
        return this.currentSession !== null;
    }

    getStatsSummary() {
        const summary = {
            totalSessions: this.sessions.length,
            totalMessages: 0,
            totalMinutes: 0,
            currentStreak: 0,
            longestStreak: 0,
            last7Days: this.getLast7DaysActivity(),
            uniqueVocabCount: 0, // Placeholder
            grammarPracticed: [], // Placeholder
            difficultiesUsed: []  // Placeholder
        };

        this.sessions.forEach(session => {
            summary.totalMessages += session.messageCount;
            summary.totalMinutes += Math.floor(session.duration / 60);
        });

        const streaks = this.calculateStreaks();
        summary.currentStreak = streaks.current;
        summary.longestStreak = streaks.longest;

        return summary;
    }

    calculateStreaks() {
        if (this.sessions.length === 0) return { current: 0, longest: 0 };
        const dates = [...new Set(this.sessions.map(s => s.date))].sort();
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 1;
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const hasRecentActivity = dates.includes(today) || dates.includes(yesterday);

        if (hasRecentActivity) {
            currentStreak = 1;
            for (let i = dates.length - 2; i >= 0; i--) {
                const current = new Date(dates[i + 1]);
                const previous = new Date(dates[i]);
                if (Math.floor((current - previous) / 86400000) === 1) currentStreak++;
                else break;
            }
        }
        for (let i = 1; i < dates.length; i++) {
            const current = new Date(dates[i]);
            const previous = new Date(dates[i - 1]);
            if (Math.floor((current - previous) / 86400000) === 1) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else tempStreak = 1;
        }
        return { current: currentStreak, longest: Math.max(longestStreak, currentStreak) };
    }

    getLast7DaysActivity() {
        const last7Days = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const sessionsOnDay = this.sessions.filter(s => s.date === dateStr);
            last7Days.push({
                date: dateStr,
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                sessionCount: sessionsOnDay.length,
                minutes: sessionsOnDay.reduce((sum, s) => sum + Math.floor(s.duration / 60), 0),
                messages: sessionsOnDay.reduce((sum, s) => sum + s.messageCount, 0)
            });
        }
        return last7Days;
    }

    exportData() {
        const data = { exportDate: new Date().toISOString(), sessions: this.sessions };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `aether-scribe-stats-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async clearAllStats() {
        this.sessions = [];
        this.currentSession = null;
        await this.saveSessions();
    }

    generateId() {
        return `encounter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

let statsManager = null;
export function initStatsManager() {
    if (!statsManager) statsManager = new StatsManager();
    return statsManager;
}
export function getStatsManager() { return statsManager; }
