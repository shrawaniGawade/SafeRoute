# SafeRoute – Project Structure

## 1. Overview
SafeRoute is organized into three main parts: frontend, backend, and AI service.

## 2. Folder Structure

```text
SafeRoute/
├── frontend/
├── backend/
├── ai/
├── docs/
│   ├── PROJECT_OVERVIEW.md
│   ├── PROJECT_STRUCTURE.md
│   ├── SETUP_GUIDE.md
│   └── API_DOCUMENTATION.md
└── README.md
```

## 3. Folder Description

### Frontend
The frontend is developed using React, TypeScript, and Vite. It provides the user interface for entering route details and viewing the safety score.

### Backend
The backend uses Node.js, Express, and TypeScript. It handles API requests from the frontend and communicates with the AI service.

### AI
The AI service uses Python, FastAPI, and a Random Forest machine learning model to calculate a demonstration safety score.

### Docs
The docs folder contains Markdown files explaining the project, folder structure, setup instructions, and API endpoints.

## 4. Current Status
The frontend, backend, and AI service have been connected to generate and display a demonstration safety score. Map-based routing and real-world safety data are future improvements.