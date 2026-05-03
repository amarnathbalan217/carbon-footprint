# Testing Documentation

This document outlines the various testing methodologies applied to the Carbon Footprint Tracker project to ensure reliability, security, and a seamless user experience.

## 1. Unit Testing
We tested individual modules separately to ensure each function works correctly in isolation.

*   **Login Authentication (`Auth.tsx`, `AuthContext.tsx`, `routes.ts`):** Verified correct handling of valid credentials, error handling for invalid logins, JWT token generation, password hashing using bcrypt, and role-based access control (differentiating standard users from admins).
*   **API Routes (`routes.ts`):** Tested individual endpoint responses. For instance, testing `POST /auth/register` to ensure it successfully creates a user and handles duplicate email constraints.
*   **AI Assistant (`Chatbot.tsx`):** Tested the integration with the Google Gemini API, ensuring the system can process user inputs, send them to the API with correct system instructions (English/Malayalam), and gracefully handle rate-limit or invalid API key errors.
*   **Emission Calculation Logic (`ActivityLogger.tsx`, `api.ts`):** Validated the mathematical formulas mapping activity inputs (e.g., fuel type, distance, food type, quantity) to CO₂ emissions using standard conversion factors.

## 2. Integration Testing
We verified the interaction between different layers of the application to ensure smooth data flow.

*   **Frontend-Backend Integration:** Tested that the React frontend (`api.ts` module) correctly sends HTTP requests (GET, POST, PUT, DELETE) to the Express backend and correctly handles the returned JSON data or error messages.
*   **Database Integration (`db.ts`):** Ensured the Express server correctly executes SQLite queries for user creation, activity logging, and retrieving insights. Tested that transaction rollbacks occur correctly on failure.
*   **Gemini AI Integration:** Verified that the API keys stored in `localStorage` are correctly retrieved and utilized by the `@google/genai` library to fetch contextual responses in the `Chatbot` component.
*   **Geolocation & Storage:** Ensured the `useGeolocation` hook correctly reads GPS coordinates and stores calculated travel segments securely in local storage before eventual syncing.

## 3. System Testing
We tested complete, end-to-end workflows from the perspective of an end-user.

*   **Complete User Journey:** Tested the flow of a user registering for an account, logging in, manually logging a transport activity via the `ActivityLogger`, viewing the updated emission statistics on the `Dashboard`, and logging out.
*   **Admin Workflow:** Validated the admin role's ability to log in, view the list of all users, update emission factors in the database, and manage global recommendations.
*   **Automated Travel Tracking:** Tested the background flow where the app automatically detects movement, calculates distance using the Haversine formula, determines the transport mode based on speed, and automatically logs the emission segment.

## 4. Performance Testing
We evaluated how the system performs under load and its general responsiveness.

*   **Concurrent Users:** Simulated multiple users accessing the dashboard and logging activities simultaneously to ensure the SQLite backend (configured with WAL mode for performance) handles concurrent read/write operations without locking issues.
*   **API Response Times:** Monitored the time taken by the Express backend to return insights and dashboard data, ensuring it meets the specified < 2 seconds page load requirement.
*   **Resource Usage:** Checked the client-side memory and CPU usage, specifically ensuring the background GPS polling (`useGeolocation` hook at 30-second intervals) doesn't cause excessive battery drain on mobile devices.

## 5. User Acceptance Testing (UAT)
We allowed real users to test the system to collect feedback on usability.

*   **Usability Feedback:** Gathered feedback on the UI/UX design, such as the clarity of the emission charts (`EmissionsChart.tsx`), the ease of manually entering food/transport data, and the intuitiveness of the Chatbot interface.
*   **Language Support:** Tested the application with native Malayalam speakers to ensure the localized text (handled via `LanguageContext` and `translations.ts`) is accurate and renders correctly across all screens.
*   **Mobile App Demonstration:** Followed the `MOBILE_DEMO_GUIDE.md` to run the Capacitor-wrapped app on actual Android devices, collecting feedback on touch responsiveness and native-feel.
