import Foundation
import ZIPFoundation
import SQLite

class AnkiService {
    struct AnkiCard {
        let front: String
        let back: String
        let interval: Int
    }
    
    func importPackage(url: URL) throws -> [AnkiCard] {
        let fileManager = FileManager.default
        let tempDir = fileManager.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try fileManager.createDirectory(at: tempDir, withIntermediateDirectories: true)
        
        defer {
            try? fileManager.removeItem(at: tempDir)
        }
        
        // Unzip
        try fileManager.unzipItem(at: url, to: tempDir)
        
        // Find collection.anki2
        let dbPath = tempDir.appendingPathComponent("collection.anki2")
        guard fileManager.fileExists(atPath: dbPath.path) else {
            throw NSError(domain: "AnkiService", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid APKG: collection.anki2 not found"])
        }
        
        // Connect to DB
        let db = try Connection(dbPath.path)
        
        // Query cards and notes
        // This is a simplified query. Real Anki schema is complex.
        // We assume 'flds' in 'notes' table contains the content separated by \x1f
        
        let notes = Table("notes")
        let flds = Expression<String>("flds")
        let id = Expression<Int64>("id")
        
        var cards: [AnkiCard] = []
        
        for note in try db.prepare(notes) {
            let fields = note[flds].components(separatedBy: "\u{1f}")
            if fields.count >= 2 {
                let front = fields[0]
                let back = fields[1]
                // We'd need to join with 'cards' table to get intervals, but for now we just extract vocab
                cards.append(AnkiCard(front: cleanText(front), back: cleanText(back), interval: 0))
            }
        }
        
        return cards
    }
    
    private func cleanText(_ text: String) -> String {
        // Remove HTML tags
        return text.replacingOccurrences(of: "<[^>]+>", with: "", options: .regularExpression, range: nil)
    }
}
