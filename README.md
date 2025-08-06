# 💞 LoveConnect

LoveConnect is a **private relationship companion platform** for couples, blending real-time chat, shared notes, collaborative to-dos, reminders, and a unique gallery of memories. Designed with privacy at its core, it leverages modern tech to help couples connect, communicate, and cherish special moments together.

---

## 🌟 Project Highlights

* 💬 Secure, real-time chat powered by WebSockets (Django ASGI + Daphne)
* 📝 Shared note-taking with favorites, colors, and edit history
* 📸 Collaborative gallery for uploading, liking, and captioning photos
* ⏰ Smart reminders with priority, recurrence, and notifications
* 🍬 “Love Jar” for surprise notes and to-do lists for shared goals
* 🔑 Privacy-first: All data scoped to a unique couple code
* 🛡 Authentication via JWT tokens across API and chat
* 🎨 Modern React TypeScript front-end with dark mode

---

## 🎯 Objective

To help couples deepen connection and seamlessly manage shared memories, conversations, and tasks in a secure, joyful digital space.

---

## ⚙️ Core Features

### 1. Real-Time Chat

* **WebSocket-based chat** using Django ASGI and Daphne for instant messaging.
* Private channels per couple (scoped by partner code).
* Typing indicators, live message delivery, and extensible for media/emoji.
* JWT-authenticated connections for privacy.

### 2. Notes & Memories

* Create, update, color, and favorite notes.
* Notes linked to both partners and visible in real time.
* Secure CRUD operations via REST API.

### 3. Shared Gallery

* Upload photos to a collaborative gallery, stored on R2/S3.
* Like, edit captions, and delete images.
* Like status is visible per user; JWT required for all actions.

### 4. Reminders

* One-time and recurring reminders with priorities.
* Notification-ready (via email or push, extensible).
* Edit, delete, and color-code reminders.

### 5. Love Jar & To-Do

* “Love Jar” for surprise notes (add, reveal, delete).
* Collaborative to-do list for shared tasks.
* All extras scoped to couple’s code for privacy.

---

## 🧰 Tech Stack

| Layer         | Tools Used                     |
| ------------- | ------------------------------ |
| UI/Frontend   | React (TypeScript), Lucide     |
| Backend       | Django, Django REST, Daphne ASGI|
| Database      | MongoDB                        |
| Realtime      | WebSockets (Daphne, Channels)  |
| Auth          | JWT tokens                     |
| Storage       | Cloudflare R2 (S3-compatible)  |
| Lint/Test     | ESLint, TypeScript             |

---

## 🔁 Workflow

### Step 1: Onboarding

* Couples register, set unique partner code, and authenticate via JWT.

### Step 2: Chat

* Couples connect to `/ws/chat/` for real-time messaging (WebSocket).
* Messages delivered instantly; typing updates possible.

### Step 3: Notes & Gallery

* Add/edit notes and photos; all changes sync in real time.
* Gallery shows uploaded images, likes, and captions.

### Step 4: Reminders & Extras

* Set, update, and receive reminders.
* Add surprise Love Jar notes and manage shared to-do lists.

---

## 🔗 API & WebSocket Endpoints

* **Notes:** `/loveconnect/api/notes/` (CRUD, favorite)
* **Gallery:** `/loveconnect/api/gallery/` (CRUD, like, caption)
* **Reminders:** `/loveconnect/api/reminders/` (CRUD, recurrence)
* **Extras:** `/loveconnect/api/extras/` (Love Jar, To-Dos)
* **Chat:** `/ws/chat/` (WebSocket real-time messaging)
* **User:** `/loveconnect/api/get-user/` (profile info)
git config core.hooksPath .githooks

---

## 🛡️ Security

* All endpoints and chat require JWT authentication.
* Data and channels are strictly scoped to couple’s partner code.
* CSRF protection and secure credential storage.

---

## ✨ Domain

🎯 **Live Demo:** _(update with URL)_

---

## 🙌 Team & Credits

Team: HAAKA-org core contributors  
Special thanks to Django ASGI, Daphne, MongoDB, Cloudflare R2, and React community.

---

## 🚀 Submission Plan

* ✅ **Demo video**: Covers onboarding, chat, notes, gallery, reminders
* ✅ **Live site**: Hosted (_update URL_)
* ✅ **Docs**: API, WebSocket, and system architecture

---

## 🏆 Bonus Integrations

| Sponsor        | Usage                        |
| -------------- | --------------------------- |
| Cloudflare R2  | Secure gallery storage      |
| Daphne         | ASGI real-time chat         |
| Lucide         | Iconography                 |
| ESLint         | Code quality                |

---

## 🤝 Contributing

* Fork, branch, and PR with code linting and tests.

---

## 📞 Contact

For questions, reach out on [HAAKA-org GitHub](https://github.com/HAAKA-org).
