import SwiftUI

struct ChatView: View {
    @State var viewModel: ChatViewModel
    @Environment(\.dismiss) var dismiss
    @State private var showTutor = false
    
    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Button(action: { dismiss() }) {
                    Image(systemName: "chevron.left")
                        .foregroundColor(.white)
                        .padding()
                }
                Spacer()
                Text("Soltura")
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
                Button(action: { showTutor = true }) {
                    Image(systemName: "graduationcap.fill")
                        .foregroundColor(.white)
                        .padding()
                }
            }
            .background(Color(hex: "2D6A6A"))
            .sheet(isPresented: $showTutor) {
                TutorView(viewModel: viewModel)
            }
            
            // Chat Area
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(viewModel.messages) { msg in
                            MessageBubble(message: msg)
                        }
                    }
                    .padding()
                }
                .onChange(of: viewModel.messages) { _ in
                    if let last = viewModel.messages.last {
                        withAnimation {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }
            }
            .background(Color(hex: "F5F5F5"))
            
            // Input Area
            VStack(spacing: 0) {
                Divider()
                HStack(spacing: 12) {
                    TextField("Type a message...", text: $viewModel.inputText)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .padding(.vertical, 8)
                    
                    Button(action: {
                        viewModel.toggleRecording()
                    }) {
                        Image(systemName: viewModel.isRecording ? "stop.circle.fill" : "mic.circle.fill")
                            .font(.system(size: 32))
                            .foregroundColor(viewModel.isRecording ? .red : Color(hex: "2D6A6A"))
                    }
                    
                    Button(action: {
                        viewModel.sendMessage()
                    }) {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.system(size: 32))
                            .foregroundColor(Color(hex: "2D6A6A"))
                    }
                }
                .padding()
                .background(Color.white)
            }
        }
        .onAppear {
            Task {
                await viewModel.loadModel()
            }
        }
    }
}

struct MessageBubble: View {
    let message: Message
    
    var body: some View {
        HStack {
            if message.role == "user" {
                Spacer()
                Text(message.content)
                    .padding()
                    .background(Color(hex: "2D6A6A"))
                    .foregroundColor(.white)
                    .cornerRadius(16)
                    .frame(maxWidth: 280, alignment: .trailing)
            } else if message.role == "assistant" {
                Text(message.content)
                    .padding()
                    .background(Color.white)
                    .foregroundColor(.black)
                    .cornerRadius(16)
                    .shadow(radius: 1)
                    .frame(maxWidth: 280, alignment: .leading)
                Spacer()
            } else {
                // System message
                Text(message.content)
                    .font(.caption)
                    .foregroundColor(.gray)
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .center)
            }
        }
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
