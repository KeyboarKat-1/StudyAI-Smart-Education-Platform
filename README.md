# 📚 StudyAI — Smart Education Platform

> **A production-ready, full-stack AI Study Companion powered by React, Flask, Firebase & Groq (Llama 3.3 70B)**

[![CI](https://github.com/your-username/StudyAI-Smart-Education-Platform/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/StudyAI-Smart-Education-Platform/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.11](https://img.shields.io/badge/Python-3.11-green.svg)](https://python.org)
[![React 18](https://img.shields.io/badge/React-18-61dafb.svg)](https://reactjs.org)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | Firebase Auth (email/password) with protected routes |
| 📁 **File Upload** | PDF, DOCX, TXT with automatic text extraction |
| 🤖 **AI Summaries** | Structured bullet-point summaries via Llama 3.3 70B |
| 🃏 **Flashcards** | Auto-generated Q&A decks with flip animation + JSON download |
| 📝 **Quizzes** | MCQ, True/False & Short Answer with instant scoring |
| 📅 **Study Schedule** | Personalized 7-day study plan + PDF/print export |
| 💬 **AI Chat** | Context-aware Socratic tutor mode |
| 🔍 **Weak Topics** | Identifies knowledge gaps and suggests next steps |
| 📊 **Analytics** | Progress charts, quiz history, study streaks |
| 🌙 **Dark / Light Mode** | Full theme toggle persisted in localStorage |
| 🔍 **Search & Filter** | Search library by name, filter by file type |
| 🔔 **Toast Notifications** | Animated feedback for uploads, deletes, theme changes |

---

## 🏗️ Architecture

```
StudyAI-Smart-Education-Platform/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI pipeline
├── frontend/                   # React 18 + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/      # UploadZone, MaterialList, StudyArea
│   │   │   └── StudyTabs/      # Summary, Flashcards, Quiz, Schedule, Chat, WeakTopics
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Firebase auth state management
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx    # Login / Register
│   │   │   └── DashboardPage.jsx # Main app with modals, search, themes
│   │   ├── services/
│   │   │   └── api.js          # Axios REST client
│   │   ├── firebase.js         # Firebase SDK config
│   │   └── index.css           # Premium design system (1900+ lines)
│   └── vercel.json             # Vercel SPA routing config
├── backend/                    # Python Flask REST API
│   ├── routes/
│   │   ├── materials.py        # Upload, list, retrieve, delete endpoints
│   │   ├── ai.py               # AI generation endpoints
│   │   └── analytics.py        # Dashboard stats, quiz history
│   ├── services/
│   │   ├── text_extractor.py   # PDF, DOCX, TXT extraction
│   │   ├── firebase_service.py # Firestore + local JSON fallback
│   │   └── groq_service.py     # Llama 3.3 + mock fallback
│   ├── data/                   # Local JSON storage (fallback)
│   ├── uploads/                # Temporary file storage
│   ├── app.py                  # Flask factory with logging & error handlers
│   ├── config.py               # Environment config
│   ├── requirements.txt        # Python deps
│   ├── render.yaml             # Render.com deployment spec
│   └── API.md                  # REST API documentation
├── .env.example                # Environment variable template
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 18 & npm ≥ 9
- **Python** ≥ 3.10
- A **Groq API key** (free at [console.groq.com](https://console.groq.com))
- (Optional) A **Firebase** project for cloud storage

### 1. Clone the repository
```bash
git clone https://github.com/your-username/StudyAI-Smart-Education-Platform.git
cd StudyAI-Smart-Education-Platform
```

### 2. Backend Setup
```bash
cd backend

# Create & activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp ../.env.example .env
# Edit .env with your GROQ_API_KEY and Firebase credentials
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Firebase web config values
```

### 4. Run Locally

**Backend** (from project root):
```bash
backend\venv\Scripts\python backend\app.py
# Server starts at http://localhost:5000
```

**Frontend** (from `frontend/` directory):
```bash
npm run dev
# App opens at http://localhost:5173
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
# Groq AI (required for AI features)
GROQ_API_KEY=gsk_your_groq_api_key_here

# Firebase Admin SDK (optional — uses local JSON fallback if omitted)
FIREBASE_CREDENTIALS_PATH=path/to/serviceAccountKey.json
FIREBASE_PROJECT_ID=your-project-id

# Server
PORT=5000
DEBUG=False
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

> **No Firebase? No problem!** The backend automatically falls back to local JSON file storage (`backend/data/`) and the AI falls back to realistic mock responses if no Groq key is present.

---

## 🌐 Deployment

### Frontend → Vercel
1. Import the repository in [Vercel](https://vercel.com/new)
2. Set **Root Directory** to `frontend`
3. Add all `VITE_*` environment variables in the Vercel dashboard
4. Deploy — `vercel.json` handles SPA routing automatically

### Backend → Render
1. Create a new **Web Service** in [Render](https://render.com)
2. Connect your repository
3. Set **Root Directory** to `.` (project root)
4. `render.yaml` will configure the build & start commands automatically
5. Add secret environment variables (`GROQ_API_KEY`, `FIREBASE_CREDENTIALS_PATH`) in Render's environment panel

---

## 🧪 Testing

### Backend Tests
```bash
# From project root
backend\venv\Scripts\python backend\test_backend.py
# Expected: all tests pass (upload, text extraction, AI mocks, routes)
```

### Frontend Build Validation
```bash
cd frontend && npm run build
# Ensure no TypeScript/ESLint errors
```

### Manual Testing Checklist
- [ ] Register a new account → redirects to dashboard
- [ ] Upload a PDF → text extracted, card appears in library
- [ ] Open material → click each tab (Summary, Flashcards, Quiz, Schedule, Chat, Weak Topics)
- [ ] Take a quiz → score recorded, appears in Quiz Performance Log
- [ ] Toggle dark/light mode via sun/moon icon
- [ ] Click profile avatar → Profile modal opens
- [ ] Click ⚙️ Settings → theme switcher works
- [ ] In Flashcards tab → click "Download JSON"
- [ ] In Schedule tab → click "Export PDF" → print dialog opens
- [ ] Search library by file name → filter updates in real-time
- [ ] Filter by file type (PDF, DOCX, TXT)

---

## 📖 API Reference

See [backend/API.md](backend/API.md) for the full REST API documentation, including:
- `POST /api/materials/upload`
- `GET /api/materials/`
- `GET /api/ai/summary`
- `GET /api/ai/flashcards`
- `POST /api/ai/quiz`
- `GET /api/ai/schedule`
- `POST /api/ai/chat`
- `GET /api/analytics/dashboard`
- `GET /api/health`

---

## 🎨 Design System

The app uses a custom **Cyber Dark** design system defined in `frontend/src/index.css`:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#8b5cf6` (Violet) | Buttons, accents |
| `--color-secondary` | `#06b6d4` (Cyan) | Highlights, charts |
| `--color-accent` | `#f43f5e` (Rose) | Errors, warnings |
| `--color-success` | `#10b981` (Emerald) | Success states |
| `--font-heading` | Outfit | All headings |
| `--font-body` | Plus Jakarta Sans | Body text |

Supports full **dark and light mode** via `[data-theme="light"]` CSS variables.

---

## 📋 Sample Data

To test without uploading files, create `backend/data/materials.json`:
```json
[
  {
    "id": "sample-001",
    "name": "Machine Learning Basics.txt",
    "fileType": "txt",
    "fileSize": 1234,
    "extractedText": "Machine learning is a subset of artificial intelligence...",
    "createdAt": "2026-01-01T00:00:00Z"
  }
]
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m "feat: add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  Built with ❤️ using React, Flask, Firebase & Groq AI
</div>
