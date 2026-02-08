import { initUI } from './ui.js';
import { initConversation } from './conversation.js';
import { initSpeech } from './speech.js';
import { checkWebGPUSupport } from './webgpu-check.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('App initializing...');

    // Check WebGPU support early
    const gpuCheck = checkWebGPUSupport();
    if (!gpuCheck.supported) {
        showError('Browser Not Supported', gpuCheck.error + '\n\nRecommended browsers:\n• Chrome 113+\n• Edge 113+');
        return;
    }

    try {
        // 1. Initialize Conversation Manager (Object only, no model loading yet)
        await initConversation();

        // 2. Initialize UI handlers
        initUI();

        // 3. Initialize Speech (Whisper + TTS)
        await initSpeech();

        console.log('App initialized');
    } catch (error) {
        console.error('App initialization failed:', error);
        let errorMsg = error.message;
        if (errorMsg.includes('Cache') || errorMsg.includes('NetworkError')) {
            errorMsg += '\n\nPossible fix: Clear your browser cache or ensure you are not in private/incognito mode.';
        }
        showError('Initialization Error', 'Failed to initialize the app. Please refresh and try again.\n\nError: ' + errorMsg);
    }
});

function showError(title, message) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.innerHTML = `
            <div class="loader-content" style="max-width: 400px;">
                <h2 style="color: var(--error);">${title}</h2>
                <p style="white-space: pre-line; line-height: 1.6;">${message}</p>
                <button onclick="location.reload()" class="btn-primary" style="margin-top: 20px;">Refresh Page</button>
            </div>
        `;
    }
}

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('[PWA] Service Worker registered:', registration);
            })
            .catch((error) => {
                console.log('[PWA] Service Worker registration failed:', error);
            });
    });
}
