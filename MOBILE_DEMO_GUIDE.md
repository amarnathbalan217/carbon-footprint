# Mobile App Demo Instructions

This guide provides step-by-step instructions to run the Carbon Footprint Tracker on a mobile device (Android/iOS) for project demos.

## Prerequisites

1.  **Node.js & npm**: Installed on your development machine.
2.  **Android Studio** (for Android) or **Xcode** (for iOS).
3.  **Local Network**: Your computer and mobile phone **MUST** be on the same Wi-Fi network.
4.  **Hardware**: A physical mobile device and a USB cable.

---

## Step 1: Configuration

To ensure the mobile app can communicate with your local server, you need to use your computer's local IP address instead of `localhost`.

1.  Find your Local IP Address:
    *   Open Terminal/PowerShell and run `ipconfig`.
    *   Look for `IPv4 Address` (e.g., `192.168.1.15`).
2.  Update `src/lib/api.ts` (if applicable) to point to `http://<YOUR_IP>:3000`.

---

## Step 2: Build the Web App

First, generate the production build of the React application:

```bash
npm run build
```

---

## Step 3: Sync with Capacitor

Capacitor bridges the web app into a native mobile project. Sync the build files:

```bash
npx cap sync
```

---

## Step 4: Run on Mobile Device

### Option A: Android (Recommended)

1.  Open the project in Android Studio:
    ```bash
    npx cap open android
    ```
2.  Connect your physical Android phone via USB.
3.  Enable **USB Debugging** in "Developer Options" on your phone.
4.  In Android Studio, select your device from the toolbar and click the **Run** (Green Play) button.

### Option B: iOS (Requires macOS)

1.  Open the project in Xcode:
    ```bash
    npx cap open ios
    ```
2.  Connect your iPhone via USB.
3.  In Xcode, select your iPhone as the build destination.
4.  Select the "App" target, go to "Signing & Capabilities", and select your Development Team.
5.  Click the **Run** button.

---

## Step 5: Live Reload (Optional for Demos)

If you want to make changes and see them instantly on the phone without rebuilt:

1.  Ensure your `capacitor.config.ts` has the `server` property:
    ```typescript
    server: {
      url: "http://<YOUR_IP>:5173",
      cleartext: true
    }
    ```
2.  Run the dev server: `npm run dev -- --host`
3.  Sync and open the app as shown in Step 4.

---

## Troubleshooting

*   **Connection Failed**: Double-check that your phone and computer are on the same Wi-Fi and that your computer's firewall is not blocking port 3000 (backend) or 5173 (frontend).
*   **White Screen**: Run `npm run build` again and ensure `npx cap sync` completes without errors.
*   **Android Build Error**: Ensure you have the latest Android SDK and Build Tools installed via Android Studio.
