# Getting Started with Your iOS App (Novice Guide)

Welcome! This guide is designed to take you from "zero" to running your own AI-powered Spanish practice app on an iPhone. We will cover how to open the code, understand what you're looking at, run it, and eventually submit it to the App Store.

## Part 1: The Setup (Before we begin)

To build iPhone apps, you need a few specific tools.

### 1. A Mac
You are already on a Mac, which is perfect. iOS development requires macOS.

### 2. Xcode
**What is it?** Xcode is Apple's official Integrated Development Environment (IDE). It's the workshop where you write code, design interfaces, and build your app.
**Action**:
1.  Open the **App Store** on your Mac.
2.  Search for "Xcode".
3.  Install it. (Warning: It is very large, often 10GB+, so this may take a while).
4.  Once installed, open it once to agree to the license terms and let it install additional components.

### 3. Apple ID
You likely already have one. You will need it to "sign" your app so it can run on your device.

---

## Part 2: Opening Your Project

We have built your app using **Swift Package Manager (SPM)** structure. This is a modern way to organize code that makes it easy to handle dependencies (like the AI engine, MLX).

**Action**:
1.  Launch **Xcode**.
2.  On the welcome screen, click **"Open Existing Project..."** (or go to File > Open).
3.  Navigate to the `fluid-ios` folder we created.
4.  **Important**: Select the **folder** `fluid-ios` itself, not a specific file inside it. Click **Open**.

**What just happened?**
Xcode will open and start "indexing". You might see a progress bar at the top. It is reading the `Package.swift` file to understand what libraries your app needs (like MLX for the AI). It will automatically start downloading these libraries from the internet. This might take a few minutes because AI libraries are large.

---

## Part 3: Understanding the Landscape

On the left side of Xcode is the **Navigator**. It shows your files.

-   **Package.swift**: This is the "recipe" for your project. It tells Xcode "I am building an app called FluidApp, and I need these ingredients (MLX, SQLite, etc)."
-   **Sources/FluidApp**: This is where your actual code lives.
    -   **App.swift**: The entry point. The "front door" of your app.
    -   **Views/**: The User Interface (UI). `ChatView.swift` describes how the chat screen looks.
    -   **ViewModels/**: The "Brain". `ChatViewModel.swift` handles the logic (sending messages to AI, recording speech).
    -   **Services/**: The "Workers". `LLMService.swift` talks to the AI model. `SpeechService.swift` handles the microphone.

---

## Part 4: Configuration & Signing

Before an app can run on a real iPhone, Apple requires it to be "signed" by a developer. This proves who made it.

**Action**:
1.  In the file navigator on the left, click on the blue icon at the very top (it might say `fluid-ios` or `FluidApp`).
2.  In the main center view, look for a tab called **"Signing & Capabilities"**.
3.  You will see a "Team" dropdown. It is likely red or empty.
4.  Click **"Add an Account..."** if you haven't added your Apple ID to Xcode yet. Enter your credentials.
5.  Once added, select your **Personal Team (Your Name)** from the dropdown.
6.  Xcode will "repair" the provisioning profiles. The red errors should disappear.

**Why?** Apple is strict about security. This digital signature ensures that the app on your phone hasn't been tampered with.

---

## Part 5: Running the App

### Simulator vs. Real Device
Xcode comes with "Simulators" (virtual iPhones on your screen).
-   **Pros**: Easy, no cables.
-   **Cons**: They use your Mac's CPU/GPU. For **AI/ML apps** like this one, Simulators can be slow or incompatible with certain hardware features (like the Neural Engine).
-   **Recommendation**: Since we are using **MLX (Machine Learning)**, it is **highly recommended** to run on a real iPhone or iPad.

**Action (Running on iPhone)**:
1.  Connect your iPhone to your Mac with a cable.
2.  On your iPhone, if asked, click "Trust this Computer".
3.  In Xcode, at the very top center, you will see a bar that says something like `FluidApp > iPhone 15 Pro Simulator`. Click the device name.
4.  Select your **real iPhone** from the list.
5.  Press the **Play Button** (Run) in the top left corner (or press `Cmd + R`).

**Troubleshooting First Run**:
-   If your phone says "Untrusted Developer":
    -   Go to your iPhone Settings > General > VPN & Device Management.
    -   Tap your email address under "Developer App".
    -   Tap "Trust".
-   **Model Download**: When the app first launches, it needs to download the AI model (Llama 3). This is about 2GB. **Keep the app open** and give it time. We haven't built a complex progress bar yet, so be patient on the first run.

---

## Part 6: Testing

Once the app is running:
1.  **Permissions**: Accept the prompts for Microphone and Speech Recognition.
2.  **Setup**: You should see the "Soltura" setup screen. Pick a difficulty.
3.  **Chat**: Click "Start".
4.  **Speak**: Tap the microphone icon. Speak Spanish. Tap it again to stop.
5.  **Listen**: The AI should reply in text and speak back to you.

---

## Part 7: The Road to the App Store

Submitting to the App Store is a formal process. Here is the roadmap:

### 1. Apple Developer Program ($99/year)
To distribute apps to others (even for free), you must join the [Apple Developer Program](https://developer.apple.com/programs/).
-   **Why?** It verifies your identity and gives you access to App Store Connect.

### 2. App Store Connect
This is a website where you manage your app's listing (Description, Screenshots, Age Rating, Pricing).

### 3. Archiving
In Xcode, instead of "Running", you will eventually choose **Product > Archive**.
-   This bundles your app into a final package.
-   Xcode will then check it for errors and let you "Upload to App Store Connect".

### 4. TestFlight
Before releasing to the world, you can invite friends to test it using "TestFlight".
-   You upload the build.
-   You send an email invite.
-   They download the "TestFlight" app and install your app from there.

### 5. App Review
When you are ready, you click "Submit for Review" on the website.
-   A real human at Apple will download your app and test it to make sure it follows their guidelines (no crashes, no offensive content, privacy policy included).
-   This usually takes 24-48 hours.

### 6. Release
Once approved, your app is live!

---

## Next Steps for You
1.  **Install Xcode**.
2.  **Open the `fluid-ios` folder**.
3.  **Sign in** with your Apple ID in Xcode.
4.  **Run** it on your phone.

Good luck! You are now an iOS developer.
