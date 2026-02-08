# Soltura iOS App

This is a native iOS application for Soltura, rebuilt from scratch using Swift and MLX.

## Prerequisites

- macOS 14.0+
- Xcode 15.0+
- iOS 17.0+ (Target)

## Project Structure

- `Sources/FluidApp`: Contains all the Swift source code.
- `Package.swift`: Defines the project dependencies (MLX, ZIPFoundation, SQLite.swift).

## How to Build and Run

Since this project uses Swift Package Manager dependencies but targets iOS App Store, the best way to open it is:

1.  **Open the Folder in Xcode**:
    - Launch Xcode.
    - Select "Open Existing Project...".
    - Select the `fluid-ios` folder.

2.  **Configure Signing**:
    - Click on the "FluidApp" target in the project navigator.
    - Go to "Signing & Capabilities".
    - Select your Development Team.

3.  **Run on Device**:
    - Connect your iPhone (iOS 17+).
    - Select your device in the scheme selector.
    - Press Run (Cmd+R).

## Dependencies

The project relies on the following Swift Packages:
- **MLX Swift LM**: For running the Llama 3 model locally.
- **ZIPFoundation**: For unzipping Anki `.apkg` files.
- **SQLite.swift**: For reading Anki databases.

These are defined in `Package.swift` and Xcode should resolve them automatically.

## Model Download

The app is configured to use `mlx-community/Llama-3.2-3B-Instruct-4bit`. On the first launch, it will attempt to download this model from Hugging Face. This requires an internet connection and may take a few minutes (approx 2GB).

## Permissions

The app requires:
- **Microphone Usage**: For speech recognition.
- **Speech Recognition**: For converting speech to text.

These keys are configured in `Sources/FluidApp/Resources/Info.plist`.
