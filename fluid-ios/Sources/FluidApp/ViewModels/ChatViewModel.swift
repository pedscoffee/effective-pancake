import SwiftUI
import Combine

@Observable
class ChatViewModel {
    var messages: [Message] = []
    var inputText: String = ""
    var isRecording = false
    var isLoading = false
    var errorMessage: String?
    
    // Dependencies
    private let llmService = LLMService()
    private let speechService = SpeechService()
    
    // Settings
    var difficulty: String = "Auto" // Auto, A1, A2, etc.
    var targetVocabulary: String = ""
    
    init() {
        // Initial system message
        messages.append(Message(role: "system", content: "¡Hola! Estoy listo para practicar contigo. ¿De qué quieres hablar hoy?"))
    }
    
    func loadModel() async {
        do {
            try await llmService.loadModel()
        } catch {
            errorMessage = "Failed to load model: \(error.localizedDescription)"
        }
    }
    
    func sendMessage() {
        guard !inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        
        let userText = inputText
        inputText = ""
        
        // Add user message
        let userMsg = Message(role: "user", content: userText)
        messages.append(userMsg)
        
        // Generate response
        Task {
            isLoading = true
            defer { isLoading = false }
            
            do {
                let systemPrompt = buildSystemPrompt()
                let response = try await llmService.generateResponse(prompt: userText, systemPrompt: systemPrompt)
                
                await MainActor.run {
                    let aiMsg = Message(role: "assistant", content: response)
                    messages.append(aiMsg)
                    speechService.speak(response)
                }
            } catch {
                await MainActor.run {
                    errorMessage = "Error generating response: \(error.localizedDescription)"
                }
            }
        }
    }
    
    func toggleRecording() {
        if speechService.isRecording {
            speechService.stopRecording()
            inputText = speechService.transcript
            isRecording = false
        } else {
            do {
                try speechService.startRecording()
                isRecording = true
            } catch {
                errorMessage = "Failed to start recording: \(error.localizedDescription)"
            }
        }
    }
    
    // Tutor
    var tutorMessages: [Message] = []
    
    func askTutor(question: String) {
        let context = messages.suffix(4).map { "\($0.role): \($0.content)" }.joined(separator: "\n")
        let prompt = "Context:\n\(context)\n\nUser Question: \(question)\n\nProvide a helpful explanation as a Spanish tutor."
        
        tutorMessages.append(Message(role: "user", content: question))
        
        Task {
            do {
                // We use the same model for tutor for now
                // In a real app, might want a separate system prompt context
                let response = try await llmService.generateResponse(prompt: prompt, systemPrompt: "You are a helpful Spanish tutor explaining grammar and vocabulary.")
                
                await MainActor.run {
                    tutorMessages.append(Message(role: "assistant", content: response))
                }
            } catch {
                print("Tutor error: \(error)")
            }
        }
    }
    
    private func buildSystemPrompt() -> String {
        var prompt = "You are a helpful Spanish language tutor. Converse naturally with the user in Spanish."
        
        if difficulty != "Auto" {
            prompt += " The user's proficiency level is \(difficulty). Adjust your vocabulary and grammar to match this level."
        } else {
            prompt += " Adapt to the user's proficiency level dynamically."
        }
        
        if !targetVocabulary.isEmpty {
            prompt += " Try to incorporate the following vocabulary words into the conversation naturally: \(targetVocabulary)."
        }
        
        prompt += " Correct any major mistakes gently, but prioritize keeping the conversation flowing."
        
        return prompt
    }
}
