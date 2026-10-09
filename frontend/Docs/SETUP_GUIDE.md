# SafeRoute – Setup Guide

## 1. Prerequisites
Install the following software before running the project:

- Node.js and npm
- Python
- Visual Studio Code
- Git (optional, for version control)

## 2. Project Folder
Open the SafeRoute project folder in Visual Studio Code.

The project contains three main folders:

- `frontend/`
- `backend/`
- `ai/`

## 3. Run the AI Service
Open a terminal in VS Code and run:

```powershell
cd ai
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

The AI service should run at:

http://127.0.0.1:8000

## 4. Run the Backend
Open a second terminal and run:

```powershell
cd backend
npm.cmd run dev
```

The backend should run at:

http://localhost:5000

## 5. Run the Frontend
Open a third terminal and run:

```powershell
cd frontend
npm.cmd run dev
```

Open the local URL displayed in the terminal, usually:

http://localhost:5173

## 6. Testing
Open the frontend in your browser and try requesting a safety score.

Ensure that all three services are running.

## 7. Troubleshooting
- If a command fails, check that you are in the correct folder.
- If a port is already in use, check whether another service is running.
- On Windows PowerShell, use `npm.cmd` if `npm` is blocked by the execution policy.

## 8. Important Note
The current machine learning model uses synthetic demonstration data. Its scores are not validated real-world safety predictions.