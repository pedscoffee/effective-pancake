import Foundation
import Speech
import AVFoundation

@Observable
class SpeechService: NSObject, SFSpeechRecognizerDelegate, AVSpeechSynthesizerDelegate {
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "es-ES")) // Spanish
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()
    private let synthesizer = AVSpeechSynthesizer()
    
    var isRecording = false
    var transcript = ""
    var permissionGranted = false
    
    override init() {
        super.init()
        speechRecognizer?.delegate = self
        synthesizer.delegate = self
        requestPermissions()
    }
    
    func requestPermissions() {
        SFSpeechRecognizer.requestAuthorization { authStatus in
            DispatchQueue.main.async {
                self.permissionGranted = authStatus == .authorized
            }
        }
    }
    
    func startRecording() throws {
        guard !audioEngine.isRunning else { return }
        
        // Cancel previous task
        recognitionTask?.cancel()
        recognitionTask = nil
        
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else { return }
        recognitionRequest.shouldReportPartialResults = true
        
        let inputNode = audioEngine.inputNode
        
        recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { result, error in
            if let result = result {
                DispatchQueue.main.async {
                    self.transcript = result.bestTranscription.formattedString
                }
            }
            
            if error != nil || (result?.isFinal ?? false) {
                self.audioEngine.stop()
                inputNode.removeTap(onBus: 0)
                self.recognitionRequest = nil
                self.recognitionTask = nil
                DispatchQueue.main.async {
                    self.isRecording = false
                }
            }
        }
        
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            self.recognitionRequest?.append(buffer)
        }
        
        audioEngine.prepare()
        try audioEngine.start()
        isRecording = true
    }
    
    func stopRecording() {
        audioEngine.stop()
        recognitionRequest?.endAudio()
        isRecording = false
    }
    
    func speak(_ text: String) {
        // Stop any current speech
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
        
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "es-ES")
        utterance.rate = 0.5
        utterance.pitchMultiplier = 1.0
        
        // Configure audio session for playback
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Failed to set audio session for playback: \(error)")
        }
        
        synthesizer.speak(utterance)
    }
}
