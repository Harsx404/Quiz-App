# Quiz App

A teacher-led real-time quiz app built with React, Express, and Socket.IO.

## Features

- Teachers create a room with a full question set before the exam starts.
- Teachers choose the number of questions, enter options, mark the correct option, and set one shared timer for the whole exam.
- Students join with a room code and wait in the lobby until the teacher starts the exam.
- The server pushes one question at a time to every student on the same timer.
- Each student can answer each question only once.
- Teachers can download:
  - a CSV score card for the whole room
  - a JSON detailed report for the whole room
  - a JSON report for any individual student

## Project Structure

- `client/`: React frontend
- `server/`: Express and Socket.IO backend

## Local Setup

### 1. Install dependencies

```bash
cd client
npm install

cd ../server
npm install
```

### 2. Start the backend

```bash
cd server
npm start
```

### 3. Start the frontend

```bash
cd client
npm start
```

## Default URLs

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## GitHub Ready Notes

- `node_modules`, build artifacts, and log files are ignored through the root `.gitignore`.
- The repo is organized as a simple `client` + `server` project for straightforward GitHub pushes.
