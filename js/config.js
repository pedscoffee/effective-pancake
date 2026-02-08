export const config = {
    // WebLLM Model ID
    // Using Llama 3.2 3B Instruct - good balance of size/quality for browser
    modelId: "Llama-3.2-3B-Instruct-q4f16_1-MLC",

    // Whisper Model ID
    // Using whisper-base for better accuracy than tiny, but still manageable size
    whisperModel: "Xenova/whisper-base",

    // TTS Settings
    ttsLang: "en-US", // Default to English for medical scribe
    ttsRate: 1.0,
    ttsPitch: 1.0
};

