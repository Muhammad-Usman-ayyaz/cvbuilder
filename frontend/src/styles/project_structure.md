# Resume Builder Project Architecture

This document outlines the entire file and component structure of the Resume Builder MVP. You can copy/paste this document to other AI tools (like Claude or Gemini) so they understand exactly how the project is organized.

---

## 🏗️ Core Architecture Overview

This project uses a **Feature-Based Architecture**. Instead of grouping files by type (e.g., putting all components in one folder and all pages in another), files are grouped by the **feature** they belong to. 

This makes the project highly scalable. 

### The Root Directory: `src/`
- **`app/`**: Contains the main entry points (`main.jsx`) and the central Router (`App.jsx`).
- **`components/`**: Contains **global/shared** UI components used across multiple features (like Buttons, Layouts, Inputs).
- **`context/`**: Contains global state management (like `UIContext.jsx` for modals).
- **`features/`**: The heart of the app. Every distinct feature (Auth, Dashboard, Resume, Settings) gets its own folder here containing its specific pages, components, and services.
- **`styles/`**: Global CSS (`globals.css`), configuring Tailwind v4 tokens.

---

## 📂 Detailed File Structure

```text
src/
├── app/
│   ├── App.jsx                 # Central router. Maps URLs to Pages.
│   └── main.jsx                # React mount point. Imports CSS.
│
├── components/                 # 🌎 SHARED / GLOBAL COMPONENTS
│   ├── common/                 # Reusable UI atoms
│   │   ├── Button.jsx          # Standardized button
│   │   ├── Card.jsx            # White container with shadow
│   │   ├── Input.jsx           # Form input field
│   │   ├── EmptyState.jsx      # Used when lists have 0 items
│   │   └── ... (Badge, Loader, etc)
│   │
│   └── layout/                 # Structural shell components
│       ├── AppLayout.jsx       # The main dashboard wrapper (sidebar + navbar)
│       ├── AuthLayout.jsx      # Split-screen wrapper for login/signup
│       ├── Sidebar.jsx         # Left navigation menu
│       ├── TopNavbar.jsx       # Top header with profile dropdown
│       ├── ProtectedRoute.jsx  # Security wrapper for authenticated routes
│       └── PageHeader.jsx      # Standard title/description for pages
│
├── context/
│   └── UIContext.jsx           # Global state for opening/closing modals (e.g., Settings)
│
├── features/                   # 🚀 FEATURE MODULES
│   │
│   ├── auth/                   # Authentication (Login, Signup, User State)
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Provides `user`, `login()`, `logout()`, `updateUser()`
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx   
│   │   │   └── SignupPage.jsx
│   │   └── services/
│   │       └── authService.js  # Mock API calls for auth
│   │
│   ├── dashboard/              # The main landing page after login
│   │   ├── components/
│   │   │   └── QuickActionCard.jsx
│   │   └── pages/
│   │       └── DashboardPage.jsx
│   │
│   ├── onboarding/             # First-time login experience
│   │   └── pages/
│   │       └── ProfileSetupPage.jsx
│   │
│   ├── settings/               # Account management
│   │   └── components/
│   │       └── SettingsModal.jsx # The floating "mini screen" settings popup
│   │
│   ├── resume/                 # Core Resume feature (Resumes List & Builder)
│   │   └── pages/
│   │       └── MyResumesPage.jsx
│   │
│   ├── ats/                    # ATS Checker feature
│   │   └── pages/
│   │       └── ATSCheckerPage.jsx
│   │
│   ├── ai-tailoring/           # AI Tailoring feature
│   │   └── pages/
│   │       └── AITailoringPage.jsx
│   │
│   └── templates/              # Resume Template Gallery
│       └── pages/
│           └── TemplateGalleryPage.jsx
│
└── styles/
    └── globals.css             # Tailwind v4 theme variables and global overrides
```

---

## 🛠️ How to Update Features

If you want to ask another AI to add or modify a feature, here is exactly where you tell them to look:

### 1. Adding a New Route/Page
- **File to Edit:** `src/app/App.jsx`
- **Action:** Add a new `<Route path="/your-path" element={<YourPage />} />` inside the `<AppLayout>` wrapper.

### 2. Modifying the Sidebar Navigation
- **File to Edit:** `src/components/layout/Sidebar.jsx`
- **Action:** Add or edit an object in the `menuItems` array at the top of the file.

### 3. Updating the Top Navbar or Profile Dropdown
- **File to Edit:** `src/components/layout/TopNavbar.jsx`
- **Action:** Edit the dropdown menu HTML. *Note: The Settings button triggers `openSettings()` from `UIContext` rather than navigating to a route.*

### 4. Updating Global User State (Name, Email)
- **File to Edit:** `src/features/auth/context/AuthContext.jsx`
- **Action:** Use the `updateUser(updates)` function exposed by the context.

### 5. Editing the Settings Popup
- **File to Edit:** `src/features/settings/components/SettingsModal.jsx`
- **Action:** Add new tabs to the `tabs` array and add the corresponding UI inside the `{activeTab === 'your-tab' && (...)}` block.

### 6. Adding a New Shared UI Component (e.g., a Toggle Switch)
- **Folder:** Create `src/components/common/Toggle.jsx`
- **Action:** Build it as a generic, reusable component that accepts Tailwind `className` props.

### 7. Editing the Dashboard Layout
- **File to Edit:** `src/features/dashboard/pages/DashboardPage.jsx`
- **Action:** Edit the grid layout. Note that empty states are handled by the `<EmptyState />` common component.
