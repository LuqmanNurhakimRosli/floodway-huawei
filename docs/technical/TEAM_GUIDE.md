# FloodWay — Team Development Guide

> **Important:** Each person builds their feature as a **separate standalone project**.  
> Once complete, hand over your finished page files to Luqman for merging into the main FloodWay app.

---

## 🔥 Shared Setup: Firebase Project (Do This Together First)

Before splitting up, **create ONE shared Firebase project** that both of you will use.

### Steps:
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Create a project"** → Name it `floodway-app`
3. Disable Google Analytics (not needed)
4. Once created, click the **Web icon** (</>) to register a web app
5. Name it `floodway-web` → Click **Register**
6. You'll see a config object like this — **copy it and share with both team members**:
   ```
   apiKey: "AIza..."
   authDomain: "floodway-app.firebaseapp.com"
   projectId: "floodway-app"
   storageBucket: "floodway-app.appspot.com"
   messagingSenderId: "123..."
   appId: "1:123..."
   ```

### Enable These Firebase Services:
- **Authentication** → Go to Authentication → Sign-in method → Enable **Anonymous** sign-in
- **Cloud Firestore** → Go to Firestore Database → Create database → Start in **test mode** → Choose closest region (asia-southeast1 for Malaysia)
- **Storage** (for chat photos) → Go to Storage → Get started → Start in **test mode**

### Share These With Each Other:
- The Firebase config object (above)
- The project ID

---

---

# 👤 PERSON A: Profile Page

**Your mission:** Build a user profile page where users can set their name, emergency contact, and view their location.

---

## Phase 1: Project Setup

1. **Install Node.js** (if not already) → Download from [nodejs.org](https://nodejs.org) (LTS version)
2. **Open terminal** (Command Prompt / PowerShell / VS Code terminal)
3. **Create a new Vite + React project:**
   ```
   npm create vite@latest floodway-profile -- --template react-ts
   ```
4. **Enter the project folder:**
   ```
   cd floodway-profile
   ```
5. **Install dependencies:**
   ```
   npm install
   ```
6. **Install Firebase:**
   ```
   npm install firebase
   ```
7. **Install Tailwind CSS** (for styling — same as the main app):
   ```
   npm install tailwindcss @tailwindcss/vite
   ```
8. **Install Lucide React** (for icons):
   ```
   npm install lucide-react
   ```
9. **Run the dev server** to make sure it works:
   ```
   npm run dev
   ```
   → Open `http://localhost:5173` in your browser. You should see the Vite + React starter page.

---

## Phase 2: Firebase Setup

1. Create a file `src/firebase.ts`
2. In this file, initialize Firebase using the shared config object
3. Export the Firestore database instance and the Auth instance
4. Learn about these Firebase functions — Google/YouTube them:
   - `signInAnonymously()` — auto-login without email/password
   - `doc()`, `setDoc()`, `getDoc()` — read/write a single document
   - `onAuthStateChanged()` — detect when user logs in

---

## Phase 3: Build the Profile Page

Create a file called `src/ProfilePage.tsx`. This is the page you'll hand over to Luqman.

### What the Profile Page Should Have:

**Section 1 — User Avatar & Name**
- A circular avatar area (can use initials or a default icon)
- Display the user's name (editable)
- Show anonymous user ID below the name (from Firebase Auth)

**Section 2 — Personal Information Form**
- **Full Name** — text input
- **Phone Number** — text input
- **Emergency Contact Name** — text input
- **Emergency Contact Phone** — text input

**Section 3 — Location Settings**
- Show current selected location (default: "Kuala Lumpur")
- This is display-only for now (read from props, not editable)

**Section 4 — App Preferences**
- A toggle for **Dark Mode** (just visual, can be a placeholder)
- A toggle for **Push Notifications** (placeholder)

**Section 5 — About**
- Show app version: "FloodWay v2.0"
- Show text: "Community Project"
- A "Reset App" button (clears local data)

### Firebase Integration:
- When the page loads → `signInAnonymously()` to get a user ID
- Load the user's profile from Firestore: `users/{userId}`
- When the user edits any field and clicks **Save** → write to Firestore: `users/{userId}`
- The Firestore document structure should be:
  ```
  Collection: users
  Document ID: {firebase-auth-uid}
  Fields:
    - name: string
    - phone: string
    - emergencyContactName: string
    - emergencyContactPhone: string
    - location: string (default "Kuala Lumpur")
    - createdAt: timestamp
    - updatedAt: timestamp
  ```

---

## Phase 4: Design Guidelines

- **Dark theme** — Use dark background (`#0f172a` or similar dark navy)
- **Card-based layout** — Each section in a rounded card
- **Colors** — Use blue (#3b82f6) as primary accent
- **Rounded corners** — Use `border-radius: 16px` for cards
- **Font** — Use 'Inter' from Google Fonts
- **Mobile-first** — Design for 390px width (iPhone size)

---

## Phase 5: What to Hand Over

When you're done, give Luqman these files:
1. `src/ProfilePage.tsx` — Your complete profile page component
2. `src/firebase.ts` — Your Firebase config/initialization file
3. A screenshot of your working page
4. A list of any npm packages you used beyond what's listed above

---

## Helpful Resources to Learn:
- **React basics:** [react.dev/learn](https://react.dev/learn)
- **Firebase + React:** Search YouTube for "Firebase React Tutorial 2024"
- **Firestore CRUD:** [firebase.google.com/docs/firestore/quickstart](https://firebase.google.com/docs/firestore/quickstart)
- **Anonymous Auth:** [firebase.google.com/docs/auth/web/anonymous-auth](https://firebase.google.com/docs/auth/web/anonymous-auth)
- **Tailwind CSS:** [tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Lucide Icons:** [lucide.dev/icons](https://lucide.dev/icons)

---

---

# 💬 PERSON B: Community Chat Page (2km Radius)

**Your mission:** Build a real-time chat page where users within the same area can send messages to each other during flood emergencies.

---

## Phase 1: Project Setup

1. **Install Node.js** (if not already) → Download from [nodejs.org](https://nodejs.org) (LTS version)
2. **Open terminal** (Command Prompt / PowerShell / VS Code terminal)
3. **Create a new Vite + React project:**
   ```
   npm create vite@latest floodway-chat -- --template react-ts
   ```
4. **Enter the project folder:**
   ```
   cd floodway-chat
   ```
5. **Install dependencies:**
   ```
   npm install
   ```
6. **Install Firebase:**
   ```
   npm install firebase
   ```
7. **Install Tailwind CSS** (for styling):
   ```
   npm install tailwindcss @tailwindcss/vite
   ```
8. **Install Lucide React** (for icons):
   ```
   npm install lucide-react
   ```
9. **Run the dev server** to make sure it works:
   ```
   npm run dev
   ```
   → Open `http://localhost:5173` in your browser. You should see the Vite + React starter page.

---

## Phase 2: Firebase Setup

1. Create a file `src/firebase.ts`
2. Initialize Firebase using the shared config object (same as Person A)
3. Export the Firestore database instance and the Auth instance
4. Learn about these Firebase functions — Google/YouTube them:
   - `signInAnonymously()` — auto-login without email/password
   - `collection()`, `addDoc()` — add a new message
   - `query()`, `orderBy()`, `limit()` — get messages sorted by time
   - `onSnapshot()` — **real-time listener** (this is the key one! Messages appear instantly without refreshing)
   - `serverTimestamp()` — let Firebase set the timestamp automatically

---

## Phase 3: Build the Chat Page

Create a file called `src/ChatPage.tsx`. This is the page you'll hand over to Luqman.

### What the Chat Page Should Have:

**Header Area**
- Title: "Community Chat"
- Show a badge with the current area: "📍 Kuala Lumpur"
- Show active user count (number of users who sent messages in last 30 minutes)
- A small subtitle: "Chat with people nearby"

**Messages Area (Scrollable)**
- Shows all messages in chronological order (oldest at top, newest at bottom)
- Auto-scrolls to the latest message when new ones arrive
- Each message bubble should show:
  - Anonymous username (e.g., "User-3F7A" — use first 4 chars of Firebase user ID)
  - Message text
  - Timestamp (e.g., "2:30 PM")
  - If the message is from the current user → align it to the **right** (blue bubble)
  - If from another user → align it to the **left** (gray/dark bubble)

**Message Input Area (Fixed at Bottom)**
- A text input field with placeholder: "Type a message..."
- A send button (arrow icon)
- When pressed → sends the message to Firestore
- Clear the input after sending

**Special Message Types (Bonus — if you have time)**
- 🆘 **SOS Button** — sends a special alert message styled in red
- 📍 **Share Location** — sends a message with coordinates

### Firebase Integration:
- Messages are stored in Firestore under a specific "zone"
- For now, hardcode the zone as "kuala-lumpur" (later Luqman will make it dynamic based on GPS)
- Use `onSnapshot()` for real-time updates — this means when someone sends a message, everyone sees it instantly

- The Firestore structure should be:
  ```
  Collection: chats
  Document: kuala-lumpur
    └── Sub-collection: messages
        Document ID: (auto-generated)
        Fields:
          - text: string (the message content)
          - userId: string (Firebase Auth UID)
          - userName: string (e.g., "User-3F7A")
          - type: string ("text" | "sos" | "location")
          - createdAt: serverTimestamp()
  ```

- Query messages with: `orderBy("createdAt", "asc")` and `limit(100)` (last 100 messages)

---

## Phase 4: Design Guidelines

- **Dark theme** — Same as the main app (`#0f172a` background)
- **Chat bubbles:**
  - Your messages → Blue/gradient, aligned right
  - Others' messages → Dark gray, aligned left
- **Input area** — Fixed at the bottom, dark background with rounded input
- **SOS messages** — Red background, bold text, alert icon
- **Rounded corners** everywhere
- **Font** — Use 'Inter' from Google Fonts
- **Mobile-first** — Design for 390px width

---

## Phase 5: What to Hand Over

When you're done, give Luqman these files:
1. `src/ChatPage.tsx` — Your complete chat page component
2. `src/firebase.ts` — Your Firebase config/initialization file
3. Any helper files you created (e.g., `src/hooks/useChat.ts`)
4. A screenshot of your working chat (ideally with 2 browser windows showing real-time sync)
5. A list of any npm packages you used beyond what's listed above

---

## Helpful Resources to Learn:
- **React basics:** [react.dev/learn](https://react.dev/learn)
- **Firebase + React:** Search YouTube for "Firebase React Chat App Tutorial"
- **Real-time Firestore:** [firebase.google.com/docs/firestore/query-data/listen](https://firebase.google.com/docs/firestore/query-data/listen)
- **onSnapshot (Real-time):** This is the MOST important concept — search "Firestore onSnapshot React tutorial"
- **Anonymous Auth:** [firebase.google.com/docs/auth/web/anonymous-auth](https://firebase.google.com/docs/auth/web/anonymous-auth)
- **Tailwind CSS:** [tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Lucide Icons:** [lucide.dev/icons](https://lucide.dev/icons)

---

---

# 🔗 For Luqman: How to Merge Their Work

When your teammates hand over their files, here's how to integrate:

### Step 1: Install Firebase in FloodWay (if not already)
```
npm install firebase
```

### Step 2: Add Firebase Config
Create `src/lib/firebase.ts` using the shared config.

### Step 3: Copy Their Page Files
- Copy Person A's `ProfilePage.tsx` → `src/pages/ProfilePage.tsx`
- Copy Person B's `ChatPage.tsx` → `src/pages/ChatPage.tsx`

### Step 4: Update Routes in App.tsx
Replace the FutureWorkPage placeholders:
```
// Change these:
<Route path="/chat" element={<FutureWorkPage />} />
<Route path="/profile" element={<FutureWorkPage />} />

// To these:
<Route path="/chat" element={<ChatPage />} />
<Route path="/profile" element={<ProfilePage />} />
```

### Step 5: Update Imports
Add the new page imports at the top of App.tsx.

### Step 6: Test
Run the app and verify both pages work within the FloodWay bottom navigation.

---

*Good luck team! 🚀 Ask Luqman if you get stuck.*
