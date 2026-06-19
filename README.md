# LUNA Events - PPT Presentation Management System

A robust, mobile-responsive web application designed for managing college/departmental PPT presentation events. Built with modern web technologies, this platform streamlines team registration, presentation tracking, and live presentation timers.

## 🚀 Features

### Client Side (Public Facing)
- **Responsive Landing Page:** High-end "tech event" aesthetic featuring deep colors, glassmorphism, and smooth Framer Motion animations.
- **Team Registration:** Students can easily register teams of 2 members.
- **URL-Based Submission:** Due to Firestore size limitations, students submit their presentation files via public Google Drive or OneDrive links, bypassing strict file size limits entirely.
- **Instant Validation:** Form fields are validated instantly, preventing incomplete registrations.

### Admin Side (Password Protected)
- **Secure Authentication:** Protected behind Firebase Email/Password authentication.
- **Real-Time Dashboard:** The admin dashboard listens to Firestore in real-time, instantly reflecting new team registrations without page reloads.
- **Leaderboard System:** A built-in leaderboard automatically ranks teams based on the total time taken for their presentation.
- **Live Presentation Mode (PresentView):** 
  - Embeds Google Slides or PowerPoint links automatically in a distraction-free, fullscreen-capable iframe.
  - Features an integrated countdown timer (configurable from the dashboard) with dynamic color warnings (turns orange at 1m, pulses red at 30s).
  - Automatically records presentation Start Time, End Time, and Final Duration directly to the database.

## 🛠️ Technology Stack

- **Frontend Framework:** React 18 (Vite)
- **Styling:** Tailwind CSS v4
- **Animations:** Framer Motion
- **Routing:** React Router DOM
- **Backend/Database:** Firebase Firestore (Real-time NoSQL Database)
- **Authentication:** Firebase Authentication
- **Notifications:** React Hot Toast

## ⚙️ Setup Instructions

### 1. Firebase Configuration
You must create a Firebase project and configure the following services:
- **Firestore Database:** Create a database and set up security rules.
- **Authentication:** Enable the **Email/Password** sign-in provider and manually create an Admin user in the Firebase Console.

### 2. Environment Variables
Create a `.env` file in the root of your project and populate it with your Firebase configuration keys:

```env
VITE_FIREBASE_API_KEY="your_api_key"
VITE_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your_project_id"
VITE_FIREBASE_STORAGE_BUCKET="your_project_id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
VITE_FIREBASE_APP_ID="your_app_id"
VITE_FIREBASE_MEASUREMENT_ID="your_measurement_id"
```

### 3. Local Development
Run the following commands to start the project locally:

```bash
# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

The application will be accessible at `http://localhost:5173/`.

### 4. Firestore Security Rules
For a production environment, ensure your Firestore rules are set securely. 
- `teams` collection: Anyone can create (`write`), but only authenticated admins can `update` and `delete`.
- `counters` collection: Ensure appropriate transaction read/write permissions.

## 📝 License
This project is for educational and event-management purposes. Feel free to fork and customize!
