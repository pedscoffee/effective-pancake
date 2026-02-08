import Foundation

struct Message: Identifiable, Equatable, Hashable {
    let id = UUID()
    let role: String // "user", "assistant", "system"
    let content: String
    let timestamp = Date()
}
