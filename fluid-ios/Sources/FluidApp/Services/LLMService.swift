import Foundation
import MLX
import MLXLLM
import MLXLMCommon

@Observable
class LLMService {
    var model: LLMModel?
    var tokenizer: Tokenizer?
    var isLoading = false
    var loadProgress: Double = 0.0
    var modelId = "mlx-community/Llama-3.2-3B-Instruct-4bit"
    
    // Chat history
    var history: [Message] = []
    
    enum ServiceError: Error {
        case modelNotLoaded
        case generationFailed
    }
    
    func loadModel() async throws {
        guard model == nil else { return }
        
        isLoading = true
        defer { isLoading = false }
        
        let modelConfiguration = ModelConfiguration.configuration(id: modelId)
        
        // Load model
        let (loadedModel, loadedTokenizer) = try await MLXLLM.load(configuration: modelConfiguration) { progress in
            Task { @MainActor in
                self.loadProgress = progress.fractionCompleted
            }
        }
        
        self.model = loadedModel
        self.tokenizer = loadedTokenizer
    }
    
    func generateResponse(prompt: String, systemPrompt: String) async throws -> String {
        guard let model = model, let tokenizer = tokenizer else {
            throw ServiceError.modelNotLoaded
        }
        
        // Construct messages
        var messages: [[String: String]] = [
            ["role": "system", "content": systemPrompt]
        ]
        
        // Add history
        for msg in history {
            messages.append(["role": msg.role, "content": msg.content])
        }
        
        // Add current user prompt
        messages.append(["role": "user", "content": prompt])
        
        // Apply chat template
        let promptTokens = try tokenizer.applyChatTemplate(messages: messages)
        let promptText = tokenizer.decode(tokens: promptTokens)
        
        // Generate
        let result = try await MLXLLM.generate(
            prompt: promptText,
            model: model,
            tokenizer: tokenizer,
            extraEOSTokens: ["<|eot_id|>"], // Llama 3 specific
            maxTokens: 1024,
            temp: 0.7
        )
        
        let responseText = result.output
        
        // Update history
        history.append(Message(role: "user", content: prompt))
        history.append(Message(role: "assistant", content: responseText))
        
        return responseText
    }
    
    func clearHistory() {
        history.removeAll()
    }
}

struct Message: Identifiable, Equatable {
    let id = UUID()
    let role: String
    let content: String
}
