import { UserPreferences } from './preferences.js';
import { MedicalScribePromptBuilder } from './medicalScribePromptBuilder.js';
import { getConversationManager, initConversation } from './conversation.js';
import { getSpeechService } from './speech.js';
import { initScribeNoteManager, getScribeNoteManager } from './scribeNoteManager.js';
import { initStatsManager, getStatsManager } from './statsManager.js';

export function initUI() {
    const preferences = new UserPreferences();
    const prefs = preferences.get();

    // DOM Elements
    const setupScreen = document.getElementById('setup-screen');
    const conversationScreen = document.getElementById('conversation-screen');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');
    const loadingDetail = document.getElementById('loading-detail');
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');

    const startBtn = document.getElementById('start-btn');
    const backBtn = document.getElementById('back-btn');
    const micBtn = document.getElementById('mic-btn');
    const chatContainer = document.getElementById('chat-container');
    const practiceGoalInput = document.getElementById('practice-goal');

    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const settingsModal = document.getElementById('settings-modal');
    const muteToggle = document.getElementById('mute-toggle');
    const voiceSelect = document.getElementById('voice-select');
    const closeSettingsBtn = document.getElementById('close-settings-btn');

    // Scribe Panel Elements
    const tutorPanel = document.getElementById('tutor-panel');
    const tutorChat = document.getElementById('tutor-chat');
    const toggleTutorBtn = document.getElementById('toggle-tutor-btn');
    const tutorInput = document.getElementById('tutor-input');
    const tutorSendBtn = document.getElementById('tutor-send-btn');
    const generateNoteBtn = document.getElementById('generate-note-btn');
    const tutorPreset = document.getElementById('tutor-preset');
    const tutorInstructions = document.getElementById('tutor-instructions');

    // Debug Modal Elements
    const debugPromptBtn = document.getElementById('debug-prompt-btn');
    const debugPromptModal = document.getElementById('debug-prompt-modal');
    const debugPromptContent = document.getElementById('debug-prompt-content');
    const closeDebugPromptBtn = document.getElementById('close-debug-prompt-btn');
    const copyPromptBtn = document.getElementById('copy-prompt-btn');

    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('dark-mode-toggle');

    // Initialize inputs with saved prefs
    if (prefs.noteStyle) {
        const el = document.querySelector(`input[name="note-style"][value="${prefs.noteStyle}"]`);
        if (el) el.checked = true;
    }
    if (prefs.customInstructions) {
        practiceGoalInput.value = prefs.customInstructions;
    }
    if (prefs.specialty) {
        tutorPreset.value = prefs.specialty;
    }
    if (prefs.muted !== undefined) {
        muteToggle.checked = prefs.muted;
    }
    if (prefs.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        darkModeToggle.checked = true;
    }

    // Populate voice dropdown when voices are loaded
    function populateVoices() {
        const voices = window.speechSynthesis.getVoices();
        const enVoices = voices.filter(v => v.lang.includes('en'));

        voiceSelect.innerHTML = '<option value="">Default</option>';
        enVoices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });

        if (prefs.selectedVoice !== undefined) {
            voiceSelect.value = prefs.selectedVoice;
        }
    }

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = populateVoices;
    }
    populateVoices();

    initOnboarding();
    initPWAInstall();
    initStatsManager();
    checkForSavedSession();

    // Event Listeners
    startBtn.addEventListener('click', async () => {
        const selectedStyle = document.querySelector('input[name="note-style"]:checked').value;
        const newPrefs = {
            noteStyle: selectedStyle,
            specialty: tutorPreset.value,
            customInstructions: practiceGoalInput.value.trim(),
            muted: muteToggle.checked
        };

        preferences.update(newPrefs);
        loadingOverlay.classList.remove('hidden');
        progressContainer.classList.remove('hidden');

        try {
            const conversationManager = await getConversationManager();
            const speechService = await getSpeechService();

            document.addEventListener('model-progress', (e) => {
                const { model, status, progress } = e.detail;
                if (status === 'progress') {
                    loadingDetail.textContent = `Loading ${model}... ${Math.round(progress)}%`;
                    progressBar.style.width = `${progress}%`;
                }
            });

            loadingText.textContent = "Loading AI Scribe...";
            await conversationManager.init((report) => {
                loadingDetail.textContent = report.text;
            });

            loadingText.textContent = "Loading Speech Engine...";
            await speechService.init();

            loadingText.textContent = "Initializing Note Manager...";
            await initScribeNoteManager(conversationManager);

            conversationManager.startConversation(newPrefs);
            const statsManager = getStatsManager();
            statsManager.startSession(newPrefs);

            loadingOverlay.classList.add('hidden');
            setupScreen.classList.remove('active');
            setupScreen.classList.add('hidden');
            conversationScreen.classList.remove('hidden');
            conversationScreen.classList.add('active');

            // Save initial state
            conversationManager.saveToStorage();

        } catch (error) {
            console.error(error);
            alert("Error initializing: " + error.message);
            loadingOverlay.classList.add('hidden');
        }
    });

    backBtn.addEventListener('click', () => {
        conversationScreen.classList.remove('active');
        conversationScreen.classList.add('hidden');
        setupScreen.classList.remove('hidden');
        setupScreen.classList.add('active');
        const statsManager = getStatsManager();
        if (statsManager.isSessionActive()) {
            statsManager.endSession();
        }
    });

    // Push to Talk Logic
    let isListening = false;
    const startListening = async () => {
        if (isListening) return;
        isListening = true;
        micBtn.classList.add('listening');
        const speechService = await getSpeechService();
        await speechService.startRecording();
    };

    const stopListening = async () => {
        if (!isListening) return;
        isListening = false;
        micBtn.classList.remove('listening');
        const speechService = await getSpeechService();
        const text = await speechService.stopRecording();
        if (text) {
            handleUserMessage(text);
        }
    };

    micBtn.addEventListener('mousedown', startListening);
    micBtn.addEventListener('mouseup', stopListening);
    micBtn.addEventListener('mouseleave', stopListening);
    micBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startListening(); });
    micBtn.addEventListener('touchend', (e) => { e.preventDefault(); stopListening(); });

    sendBtn.addEventListener('click', () => {
        const text = chatInput.value.trim();
        if (text) { handleUserMessage(text); chatInput.value = ''; }
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (text) { handleUserMessage(text); chatInput.value = ''; }
        }
    });

    clearChatBtn.addEventListener('click', async () => {
        if (confirm('Clear encounter history and start fresh?')) {
            const systemGreeting = chatContainer.querySelector('.message.system');
            chatContainer.innerHTML = '';
            if (systemGreeting) { chatContainer.appendChild(systemGreeting.cloneNode(true)); }
            const conversationManager = await getConversationManager();
            conversationManager.reset();
            conversationManager.startConversation(preferences.get());
        }
    });

    // Generate Note Button
    generateNoteBtn.addEventListener('click', async () => {
        const scribeNoteManager = getScribeNoteManager();
        if (!scribeNoteManager) return;

        addTutorMessage("Generating medical note...", 'system');

        // Show typing indicator in tutor chat
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'tutor-message system typing-indicator';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        tutorChat.appendChild(typingIndicator);

        const note = await scribeNoteManager.generateNote(preferences.get());
        typingIndicator.remove();

        if (note) {
            addTutorMessage(note, 'tutor');
        } else {
            addTutorMessage("Failed to generate note. Ensure some conversation has occurred.", 'system');
        }
    });

    // Refinement Logic
    tutorSendBtn.addEventListener('click', handleNoteRefinement);
    tutorInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleNoteRefinement();
        }
    });

    async function handleNoteRefinement() {
        const text = tutorInput.value.trim();
        if (!text) return;

        const scribeNoteManager = getScribeNoteManager();
        if (!scribeNoteManager) return;

        tutorInput.value = '';
        addTutorMessage(text, 'user');

        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'tutor-message system typing-indicator';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        tutorChat.appendChild(typingIndicator);

        // Get the last note as context
        const history = scribeNoteManager.noteHistory;
        const lastNote = history.filter(h => h.type === 'note' || h.type === 'refinement').slice(-1)[0]?.content || "";

        const refined = await scribeNoteManager.refineNote(text, lastNote);
        typingIndicator.remove();

        if (refined) {
            addTutorMessage(refined, 'tutor');
        }
    }

    // Settings & Debug Modals
    const settingsBtn = document.getElementById('settings-btn');
    settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

    debugPromptBtn.addEventListener('click', () => {
        const conversationManager = getConversationManager();
        debugPromptContent.textContent = conversationManager?.getSystemPrompt() || "No prompt available.";
        debugPromptModal.classList.remove('hidden');
    });
    closeDebugPromptBtn.addEventListener('click', () => debugPromptModal.classList.add('hidden'));

    copyPromptBtn.addEventListener('click', async () => {
        await navigator.clipboard.writeText(debugPromptContent.textContent);
        copyPromptBtn.textContent = 'Copied!';
        setTimeout(() => copyPromptBtn.textContent = 'Copy to Clipboard', 2000);
    });

    darkModeToggle.addEventListener('change', () => {
        const isDark = darkModeToggle.checked;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        preferences.update({ darkMode: isDark });
    });

    function addMessage(text, sender) {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        div.textContent = text;
        chatContainer.appendChild(div);
        requestAnimationFrame(() => chatContainer.scrollTop = chatContainer.scrollHeight);
    }

    function addTutorMessage(text, sender) {
        if (!text) return;
        const placeholder = tutorChat.querySelector('.tutor-placeholder');
        if (placeholder) placeholder.remove();
        const div = document.createElement('div');
        div.className = `tutor-message ${sender}`;
        if (sender === 'user' || sender === 'system') {
            div.textContent = text;
        } else {
            div.innerHTML = typeof marked !== 'undefined' ? marked.parse(text) : text;
        }
        tutorChat.appendChild(div);
        requestAnimationFrame(() => tutorChat.scrollTop = tutorChat.scrollHeight);
    }

    async function handleUserMessage(text) {
        addMessage(text, 'user');
        const statsManager = getStatsManager();
        statsManager.trackMessage('user', text);

        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message system typing-indicator';
        typingIndicator.innerHTML = '<span></span><span></span><span></span>';
        chatContainer.appendChild(typingIndicator);

        const conversationManager = await getConversationManager();
        try {
            const responseObj = await conversationManager.generateResponse(text);
            typingIndicator.remove();
            addMessage(responseObj.spanish, 'system');
            statsManager.trackMessage('ai', responseObj.spanish);
            conversationManager.saveToStorage();
        } catch (e) {
            typingIndicator.remove();
            addMessage("System: AI Scribe acknowledgment failed.", 'system');
        }
    }

    async function checkForSavedSession() {
        const conversationManager = await getConversationManager();
        const savedData = conversationManager.loadFromStorage();
        if (savedData && confirm('Resume previous encounter?')) {
            await resumeSession(savedData);
        }
    }

    async function resumeSession(savedData) {
        loadingOverlay.classList.remove('hidden');
        const conversationManager = await getConversationManager();
        await conversationManager.init();
        await getSpeechService().then(s => s.init());
        await initScribeNoteManager(conversationManager);
        conversationManager.restoreFromData(savedData);
        chatContainer.innerHTML = '';
        for (const msg of savedData.messages) {
            if (msg.role === 'user') addMessage(msg.content, 'user');
            else if (msg.role === 'assistant') addMessage(msg.content, 'system');
        }
        loadingOverlay.classList.add('hidden');
        setupScreen.classList.remove('active'); setupScreen.classList.add('hidden');
        conversationScreen.classList.remove('hidden'); conversationScreen.classList.add('active');
    }
}

// Reuse onboarding/PWA from earlier script but simplified for aether scribe context
function initOnboarding() {
    const welcomeOverlay = document.getElementById('welcome-overlay');
    const skipOnboardingCheckbox = document.getElementById('skip-onboarding-checkbox');
    const onboardingSkipBtn = document.getElementById('onboarding-skip');
    const onboardingNextBtn = document.getElementById('onboarding-next');
    const onboardingStartBtn = document.getElementById('onboarding-start');
    let currentStep = 1;
    if (!localStorage.getItem('aether_scribe_onboarding')) {
        setTimeout(() => welcomeOverlay.classList.remove('hidden'), 500);
    }
    onboardingNextBtn.addEventListener('click', () => {
        if (currentStep < 3) {
            document.getElementById(`onboarding-step-${currentStep}`).classList.remove('active');
            currentStep++;
            document.getElementById(`onboarding-step-${currentStep}`).classList.add('active');
            if (currentStep === 3) { onboardingNextBtn.classList.add('hidden'); onboardingStartBtn.classList.remove('hidden'); }
        }
    });
    const close = () => {
        if (skipOnboardingCheckbox.checked) localStorage.setItem('aether_scribe_onboarding', 'true');
        welcomeOverlay.classList.add('hidden');
    };
    onboardingSkipBtn.addEventListener('click', close);
    onboardingStartBtn.addEventListener('click', close);
}

function initPWAInstall() {
    const pwaBanner = document.getElementById('pwa-install-banner');
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        if (!localStorage.getItem('aether_scribe_pwa_dismissed')) {
            setTimeout(() => pwaBanner.classList.remove('hidden'), 5000);
        }
    });
    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
        pwaBanner.classList.add('hidden');
        localStorage.setItem('aether_scribe_pwa_dismissed', 'true');
    });
}
