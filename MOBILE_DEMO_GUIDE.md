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

## Step 2: Start the Backend Server

Start the Express backend server before building the app:

```bash
npm run server
```

The server will start on `http://0.0.0.0:3002`.

---

## Step 3: Expose Backend with ngrok

Since a mobile device cannot access `localhost`, use **ngrok** to create a public tunnel to your backend server.

1.  **Install ngrok** (if not already installed):
    *   Download from [https://ngrok.com/download](https://ngrok.com/download) and sign up for a free account.
    *   Or install via npm:
        ```bash
        npm install -g ngrok
        ```
    *   Authenticate with your auth token (one-time setup):
        ```bash
        ngrok config add-authtoken <YOUR_AUTH_TOKEN>
        ```

2.  **Start the ngrok tunnel** (in a new terminal):
    ```bash
    ngrok http 3002
    ```

3.  **Copy the Forwarding URL** from the ngrok output. It will look something like:
    ```
    Forwarding  https://abcd-1234.ngrok-free.app -> http://localhost:3002
    ```

4.  **Update the API URL** in `src/lib/api.ts`:
    ```typescript
    const API_URL = 'https://abcd-1234.ngrok-free.app/api';
    ```
    > ⚠️ Replace the URL above with *your* actual ngrok forwarding URL.

---

## Step 4: Build the Web App

Generate the production build of the React application:

```bash
npm run build
```

---

## Step 5: Sync with Capacitor

Capacitor bridges the web app into a native mobile project. Sync the build files:

```bash
npx cap sync
```

---

## Step 6: Run on Mobile Device

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

## Step 7: Live Reload (Optional for Demos)

If you want to make changes and see them instantly on the phone without rebuilding:

1.  Ensure your `capacitor.config.ts` has the `server` property:
    ```typescript
    server: {
      url: "http://<YOUR_IP>:5173",
      cleartext: true
    }
    ```
2.  Run the dev server: `npm run dev -- --host`
3.  Sync and open the app as shown in Step 6.

---

## Troubleshooting

*   **Connection Failed**: Double-check that your ngrok tunnel is running and the URL in `src/lib/api.ts` matches the ngrok forwarding URL.
*   **ngrok Session Expired**: Free ngrok URLs change every time you restart. Re-run `ngrok http 3002`, copy the new URL, update `api.ts`, and rebuild (`npm run build && npx cap sync`).
*   **White Screen**: Run `npm run build` again and ensure `npx cap sync` completes without errors.
*   **Android Build Error**: Ensure you have the latest Android SDK and Build Tools installed via Android Studio.
