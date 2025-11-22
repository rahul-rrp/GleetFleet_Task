# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

# GetFleet React Native Demo

This is a small **React Native** app that showcases:

- Session validation with a saved token (works after app restarts)  
- Protected navigation: **Login → Dashboard (tabbed)**  
- Fetching `/devices` and `/positions` from a backend  
- Displaying each device as a **marker on a map** and a list of vehicles  
- Clear folder structure with **services**, **navigation**, **screens**, and **reusable components**

> This project focuses on clarity and reusability rather than complete feature perfection.

---

## Tech Stack

- **React Native** (Expo or bare React Native)
- **React Navigation v6**
  - `@react-navigation/native`
  - `@react-navigation/native-stack`
  - `@react-navigation/bottom-tabs`
- **react-native-paper** (UI components)
- **react-native-maps** (map and markers)
- **AsyncStorage** (`@react-native-async-storage/async-storage`) for token and user storage

---

## Features

### Authentication & Session Validation

- The `Auth` screen simulates an admin login using a **demo token**.
- After a successful login:
  - The **token** saves in AsyncStorage.
  - A session validation request (`/api/session?token=...`) is sent.
  - If valid, the returned user data saves as well.
  - The app moves to the **protected dashboard** (`DashboardStack` with `TabNavigator`).

- Upon app start:
  - The app checks for the stored token.
  - If it finds one, it validates the session again.
  - If valid, it goes straight to the Dashboard.  
  - If invalid or not found, it shows the Auth screen.

### Dashboard & Tabs

- **DashboardStack** contains:
  - A single screen: `Tabs` → `TabNavigator`.

- **TabNavigator** includes bottom tabs:
  - `Live` → **Home** screen (map + devices)
  - `Trips` → placeholder
  - `Reports` → placeholder
  - `Reminders` → placeholder
  - `More` → placeholder

### Live Map & Devices

- The `Home` screen:
  - Validates the session again to check if the user is authorized.
  - Fetches **devices** from `/api/devices` and **positions** from `/api/positions`.
  - Combines each device with its **latest position**.
  - Displays:
    - A **map** (using `react-native-maps`) with a marker for each device.
    - A **bottom sheet** style list of devices shown with `FlatList`.
  - Supports:
    - Status chips: All / Moving / Idling / Parking / No Signal
    - Search box to filter by device name
    - Pagination (using `page` + `limit` query params)
    - Pull-to-refresh
    - Periodic refresh (every 30 seconds)

### Reusable Components

- `VehicleCard`
  - Shows device name, last seen, status badge, speed, and address.
  - Has action icons (inspect/edit) for additional interactions (currently logs to console).

---

## Folder Structure

```bash
.
├── App.js                 # Root component that checks session status and manages navigation
├── navigation
│   ├── DashboardStack.js  # Stack navigator for the protected section
│   └── TabNavigator.js    # Bottom tab navigation (Live/Trips/Reports/Reminders/More)
├── screens
│   ├── Auth.jsx           # Login screen (admin/drivers tabs, currently using demo token)
│   ├── Home.jsx           # Live screen: map + devices + filters + list
│   └── Placeholder.jsx    # Simple placeholder screen for other tabs
├── components
│   └── VehicleCard.jsx    # Reusable card for each device in the list
├── services
│   ├── authService.js     # validateSession(token) talks to /api/session
│   └── storageService.js  # AsyncStorage helpers for token and user
└── assets
    └── images
        └── icon.png       # App logo shown on the Auth screen
```