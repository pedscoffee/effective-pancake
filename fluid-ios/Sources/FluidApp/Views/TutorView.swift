import SwiftUI

struct TutorView: View {
    @State var viewModel: ChatViewModel
    @State private var question = ""
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            VStack {
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 12) {
                        if viewModel.tutorMessages.isEmpty {
                            Text("Ask the tutor for help with grammar, vocabulary, or corrections.")
                                .foregroundColor(.gray)
                                .padding()
                        }
                        
                        ForEach(viewModel.tutorMessages) { msg in
                            if msg.role == "user" {
                                Text(msg.content)
                                    .padding()
                                    .background(Color.gray.opacity(0.1))
                                    .cornerRadius(8)
                                    .frame(maxWidth: .infinity, alignment: .trailing)
                            } else {
                                Text(msg.content)
                                    .padding()
                                    .background(Color(hex: "E0F2F1")) // Light teal
                                    .cornerRadius(8)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }
                    }
                    .padding()
                }
                
                Divider()
                
                HStack {
                    TextField("Ask a question...", text: $question)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    Button("Ask") {
                        guard !question.isEmpty else { return }
                        viewModel.askTutor(question: question)
                        question = ""
                    }
                    .disabled(question.isEmpty)
                }
                .padding()
            }
            .navigationTitle("AI Tutor")
            .navigationBarItems(trailing: Button("Done") { dismiss() })
        }
    }
}
