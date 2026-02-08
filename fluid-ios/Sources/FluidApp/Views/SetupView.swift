import SwiftUI

struct SetupView: View {
    @State private var difficulty = "Auto"
    @State private var targetVocab = ""
    @State private var showChat = false
    
    let difficulties = ["Auto", "A1", "A2", "B1", "B2", "C1", "C2", "Native"]
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color(hex: "F5F5F5").ignoresSafeArea()
                
                VStack(spacing: 24) {
                    // Hero
                    VStack(spacing: 8) {
                        Image(systemName: "bubble.left.and.bubble.right.fill") // Placeholder for logo
                            .font(.system(size: 60))
                            .foregroundColor(Color(hex: "2D6A6A"))
                        
                        Text("Soltura")
                            .font(.system(size: 40, weight: .bold, design: .serif))
                            .foregroundColor(Color(hex: "2D6A6A"))
                        
                        Text("Practice Spanish naturally.")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }
                    .padding(.top, 40)
                    
                    // Form
                    ScrollView {
                        VStack(alignment: .leading, spacing: 20) {
                            
                            // Difficulty
                            VStack(alignment: .leading) {
                                Text("Proficiency Level")
                                    .font(.headline)
                                    .foregroundColor(Color(hex: "2D6A6A"))
                                
                                LazyVGrid(columns: [GridItem(.adaptive(minimum: 80))], spacing: 10) {
                                    ForEach(difficulties, id: \.self) { level in
                                        Button(action: { difficulty = level }) {
                                            Text(level)
                                                .font(.system(size: 14, weight: .medium))
                                                .padding(.vertical, 8)
                                                .padding(.horizontal, 12)
                                                .background(difficulty == level ? Color(hex: "2D6A6A") : Color.white)
                                                .foregroundColor(difficulty == level ? .white : .black)
                                                .cornerRadius(8)
                                                .overlay(
                                                    RoundedRectangle(cornerRadius: 8)
                                                        .stroke(Color(hex: "2D6A6A"), lineWidth: 1)
                                                )
                                        }
                                    }
                                }
                            }
                            
                            // Vocab
                            VStack(alignment: .leading) {
                                Text("Target Vocabulary (Optional)")
                                    .font(.headline)
                                    .foregroundColor(Color(hex: "2D6A6A"))
                                
                                TextEditor(text: $targetVocab)
                                    .frame(height: 100)
                                    .padding(4)
                                    .background(Color.white)
                                    .cornerRadius(8)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 8)
                                            .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                                    )
                                Text("Enter words separated by commas.")
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                            
                            // Start Button
                            Button(action: { showChat = true }) {
                                Text("Start Conversation")
                                    .font(.headline)
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color(hex: "2D6A6A"))
                                    .cornerRadius(12)
                                    .shadow(radius: 2)
                            }
                            .padding(.top, 10)
                        }
                        .padding()
                    }
                }
            }
            .navigationDestination(isPresented: $showChat) {
                let vm = ChatViewModel()
                // Inject settings
                // In a real app, pass these via init or environment
                ChatView(viewModel: configureViewModel(vm))
                    .navigationBarBackButtonHidden(true)
            }
        }
    }
    
    func configureViewModel(_ vm: ChatViewModel) -> ChatViewModel {
        vm.difficulty = difficulty
        vm.targetVocabulary = targetVocab
        return vm
    }
}
