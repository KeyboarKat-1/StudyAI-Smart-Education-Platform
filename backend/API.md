# StudyAI Backend REST API Documentation

This document describes the REST API endpoints provided by the StudyAI Flask server.

## Authentication
All endpoints under `/api/` (except `/api/health`) expect an `Authorization` header containing a Bearer token.
```http
Authorization: Bearer <firebase_id_token_or_mock_uid_string>
```
*In Local Mock Mode, the frontend passes `mock-uid:your_email@studyai.edu` which is accepted deterministically by the backend.*

---

## 🏥 Health Endpoint

### `GET /api/health`
Checks the server running status and active credentials detection flags.
- **Request Headers**: None
- **Response (200 OK)**:
  ```json
  {
    "status": "healthy",
    "firebaseEnabled": false,
    "groqEnabled": false,
    "mode": "local-fallback"
  }
  ```

---

## 📚 Study Materials Library

### `POST /api/materials/upload`
Uploads a document for text ingestion. Supports PDF, DOCX, and TXT files up to 10MB.
- **Request Content-Type**: `multipart/form-data`
- **Request Body**:
  - `file`: Binary file upload
- **Response (201 Created)**:
  ```json
  {
    "id": "e30e668b-ca59-4a94-82ea-b94fefea3d31",
    "name": "physics_notes.txt",
    "size": 1284,
    "type": "TXT",
    "wordCount": 242,
    "text": "Extracted text content from the file...",
    "status": "processed",
    "error": null,
    "generations": {},
    "userId": "local-user-9f4a3e2d",
    "createdAt": "2026-06-28T11:00:00.000000"
  }
  ```

### `GET /api/materials`
Retrieves a list of all uploaded materials for the user. Excludes the heavy document text field for optimization.
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "e30e668b-ca59-4a94-82ea-b94fefea3d31",
      "name": "physics_notes.txt",
      "size": 1284,
      "type": "TXT",
      "wordCount": 242,
      "status": "processed",
      "createdAt": "2026-06-28T11:00:00.000000",
      "hasSummary": true,
      "hasFlashcards": false,
      "hasQuiz": false
    }
  ]
  ```

### `GET /api/materials/<material_id>`
Retrieves full details of a specific material, including its complete extracted text content.
- **Response (200 OK)**: Full study material object.

### `DELETE /api/materials/<material_id>`
Deletes a study material from the database.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Material deleted successfully"
  }
  ```

---

## 🤖 AI Features

### `POST /api/ai/summary`
Retrieves or generates a structured Markdown summary of the document.
- **Request Body**:
  ```json
  {
    "materialId": "e30e668b-ca59-4a94-82ea-b94fefea3d31"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "summary": "# Study Summary: physics_notes.txt\n## 1. Overview\n..."
  }
  ```

### `POST /api/ai/flashcards`
Retrieves or generates interactive Q&A flashcards based on the document.
- **Request Body**:
  ```json
  {
    "materialId": "e30e668b-ca59-4a94-82ea-b94fefea3d31"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "flashcards": [
      {
        "question": "What is Newton's First Law?",
        "answer": "An object at rest stays at rest unless acted upon by an external force."
      }
    ]
  }
  ```

### `POST /api/ai/quiz`
Retrieves or generates a practice quiz.
- **Request Body**:
  ```json
  {
    "materialId": "e30e668b-ca59-4a94-82ea-b94fefea3d31",
    "quizType": "mcq" // Options: 'mcq' (Multiple Choice), 'tf' (True/False), 'short_answer'
  }
  ```
- **Response (200 OK)** (for `mcq`/`tf`):
  ```json
  {
    "quiz": [
      {
        "question": "True or False: Acceleration is a vector quantity.",
        "options": ["True", "False"],
        "correctIndex": 0,
        "explanation": "Acceleration has both magnitude and direction, defining it as a vector."
      }
    ]
  }
  ```
- **Response (200 OK)** (for `short_answer`):
  ```json
  {
    "quiz": [
      {
        "question": "Describe the conservation of energy.",
        "sampleAnswer": "Energy cannot be created or destroyed, only transformed from one form to another.",
        "keyPoints": ["created", "destroyed", "transformed", "conserved"],
        "explanation": "This is the first law of thermodynamics."
      }
    ]
  }
  ```

### `POST /api/ai/quiz/evaluate`
Uses AI to grade a student's short answer response.
- **Request Body**:
  ```json
  {
    "question": "Describe the conservation of energy.",
    "sampleAnswer": "Energy cannot be created or destroyed...",
    "userAnswer": "Energy is saved and just changes forms."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "score": 7, // Out of 10
    "feedback": "Good core understanding. However, you should emphasize that energy can neither be created nor destroyed.",
    "missingPoints": ["created", "destroyed"],
    "corrections": ""
  }
  ```

### `POST /api/ai/schedule`
Retrieves or generates a personalized 7-day study plan.
- **Request Body**:
  ```json
  {
    "materialId": "e30e668b-ca59-4a94-82ea-b94fefea3d31"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "schedule": [
      {
        "day": 1,
        "topic": "Mastering Kinematics",
        "description": "Read overview sections and study definitions relating to velocity and displacement.",
        "checklist": [
          "Complete practice quiz on vectors",
          "Formulate summary definitions sheet"
        ]
      }
    ]
  }
  ```

### `POST /api/ai/weak-topics`
Retrieves or generates a diagnostic weak topic analysis report.
- **Request Body**:
  ```json
  {
    "materialId": "e30e668b-ca59-4a94-82ea-b94fefea3d31"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "weakTopics": [
      {
        "topicName": "Vector Calculations",
        "percentageScore": 40,
        "recommendedReview": "Review the flashcards and definitions in the summary tab."
      }
    ],
    "summary": "You show strong core understanding, but require detail reviews on mathematical calculations."
  }
  ```

### `POST /api/ai/chat`
Posts a message to the chatbot.
- **Request Body**:
  ```json
  {
    "materialId": "e30e668b-ca59-4a94-82ea-b94fefea3d31",
    "message": "Can you explain formula X?",
    "history": [
      {"role": "user", "content": "Hi"},
      {"role": "assistant", "content": "Hello!"}
    ]
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "reply": "Formula X represents..."
  }
  ```

---

## 📈 Analytics & Streaks

### `GET /api/analytics/dashboard`
Compiles all statistics, SVG coordinate logs, and recommendations for the Dashboard Home.
- **Response (200 OK)**:
  ```json
  {
    "streakCount": 3,
    "averageScore": 85,
    "totalQuizzes": 6,
    "totalDocuments": 2,
    "recentActivity": [
      {
        "id": "e3da-e0c3-...",
        "description": "Completed a MCQ quiz on 'physics_notes.txt' scoring 80%",
        "timestamp": "2026-06-28T11:00:00.000000"
      }
    ],
    "progressChartData": [
      {
        "index": 1,
        "label": "Jun 28",
        "score": 80,
        "type": "MCQ",
        "docName": "physics_notes.txt"
      }
    ],
    "adaptiveRecommendations": [
      {
        "title": "Maintain your Streak!",
        "desc": "You are on a 3-day streak! Study flashcards to keep it burning.",
        "action": "flashcards",
        "materialId": "e30e668b-ca59-4a94-82ea-b94fefea3d31"
      }
    ]
  }
  ```

### `POST /api/analytics/quiz-history`
Records a completed quiz performance record.
- **Request Body**:
  ```json
  {
    "materialId": "e30e668b-ca59-4a94-82ea-b94fefea3d31",
    "materialName": "physics_notes.txt",
    "score": 4,
    "totalQuestions": 5,
    "quizType": "mcq"
  }
  ```
- **Response (201 Created)**: The saved quiz record object.

### `POST /api/analytics/activity`
Logs a custom study milestone.
- **Request Body**:
  ```json
  {
    "description": "Finished reviewing physics schedule plan."
  }
  ```
- **Response (200 OK)**: User stats profile object.
