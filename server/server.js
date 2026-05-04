const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = {};

function generateRoomCode() {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

function computeScore(student) {
  return student.answers.filter((answer) => answer.isCorrect).length;
}

function buildLeaderboard(room) {
  return [...room.students]
    .map((student) => ({
      id: student.id,
      name: student.name,
      score: student.score,
    }))
    .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
}

function serializeRoom(room) {
  const currentQuestion =
    room.currentQuestionIndex >= 0 && room.currentQuestionIndex < room.questions.length
      ? room.questions[room.currentQuestionIndex]
      : null;

  return {
    roomCode: room.roomCode,
    quizTitle: room.quizTitle,
    teacherName: room.teacherName,
    questionDurationSeconds: room.questionDurationSeconds,
    status: room.status,
    questions: room.questions,
    currentQuestionIndex: room.currentQuestionIndex,
    currentQuestion,
    questionStartedAt: room.questionStartedAt,
    questionEndsAt: room.questionEndsAt,
    createdAt: room.createdAt,
    startedAt: room.startedAt,
    finishedAt: room.finishedAt,
    students: room.students.map((student) => ({
      id: student.id,
      name: student.name,
      joinedAt: student.joinedAt,
      submittedAt: student.submittedAt,
      score: student.score,
      answers: student.answers,
    })),
    leaderboard: buildLeaderboard(room),
  };
}

function emitRoom(room) {
  io.to(room.roomCode).emit("room_state", serializeRoom(room));
}

function clearRoomTimer(room) {
  if (room.timerHandle) {
    clearTimeout(room.timerHandle);
    room.timerHandle = null;
  }
}

function finishRoom(room) {
  clearRoomTimer(room);
  room.status = "finished";
  room.currentQuestionIndex = room.questions.length;
  room.questionStartedAt = null;
  room.questionEndsAt = null;
  room.finishedAt = new Date().toISOString();

  room.students.forEach((student) => {
    student.score = computeScore(student);
    if (!student.submittedAt) {
      student.submittedAt = room.finishedAt;
    }
  });

  const payload = serializeRoom(room);
  io.to(room.roomCode).emit("quiz_finished", payload);
  emitRoom(room);
}

function startNextQuestion(room) {
  clearRoomTimer(room);

  const nextIndex = room.currentQuestionIndex + 1;
  if (nextIndex >= room.questions.length) {
    finishRoom(room);
    return;
  }

  room.status = "live";
  room.currentQuestionIndex = nextIndex;

  const now = new Date();
  room.questionStartedAt = now.toISOString();
  room.questionEndsAt = new Date(
    now.getTime() + room.questionDurationSeconds * 1000
  ).toISOString();

  emitRoom(room);

  room.timerHandle = setTimeout(() => {
    startNextQuestion(room);
  }, room.questionDurationSeconds * 1000);
}

app.get("/", (_req, res) => {
  res.json({ ok: true, message: "Quiz server is running" });
});

io.on("connection", (socket) => {
  socket.on("create_room", ({ teacherName, quizTitle, questionDurationSeconds, questions }) => {
    if (!teacherName || !quizTitle || !Array.isArray(questions) || !questions.length) {
      socket.emit("server_error", "Teacher name, quiz title, and questions are required.");
      return;
    }

    const normalizedDuration = Number(questionDurationSeconds);
    if (Number.isNaN(normalizedDuration) || normalizedDuration < 5 || normalizedDuration > 600) {
      socket.emit("server_error", "Enter one shared timer between 5 and 600 seconds.");
      return;
    }

    const normalizedQuestions = questions.map((question, index) => ({
      id: question.id || `q-${index + 1}`,
      prompt: String(question.prompt || "").trim(),
      options: Array.isArray(question.options) ? question.options.map(String) : [],
      correctOptionIndex: Number(question.correctOptionIndex),
    }));

    const invalidQuestion = normalizedQuestions.find(
      (question) =>
        !question.prompt ||
        question.options.length < 2 ||
        question.options.some((option) => !option.trim()) ||
        Number.isNaN(question.correctOptionIndex) ||
        question.correctOptionIndex < 0 ||
        question.correctOptionIndex >= question.options.length
    );

    if (invalidQuestion) {
      socket.emit("server_error", "Every question needs text, filled options, and a valid correct answer.");
      return;
    }

    let roomCode = generateRoomCode();
    while (rooms[roomCode]) {
      roomCode = generateRoomCode();
    }

    rooms[roomCode] = {
      roomCode,
      quizTitle: String(quizTitle).trim(),
      teacherName: String(teacherName).trim(),
      questionDurationSeconds: normalizedDuration,
      questions: normalizedQuestions,
      students: [],
      status: "waiting",
      currentQuestionIndex: -1,
      questionStartedAt: null,
      questionEndsAt: null,
      timerHandle: null,
      createdAt: new Date().toISOString(),
      startedAt: null,
      finishedAt: null,
      teacherSocketId: socket.id,
    };

    socket.data.roomCode = roomCode;
    socket.data.role = "teacher";
    socket.join(roomCode);
    socket.emit("room_created", serializeRoom(rooms[roomCode]));
  });

  socket.on("join_room", ({ roomCode, studentName }) => {
    const room = rooms[String(roomCode || "").toUpperCase()];

    if (!room) {
      socket.emit("server_error", "Room not found.");
      return;
    }

    if (room.status !== "waiting") {
      socket.emit("server_error", "The exam has already started. Joining is closed.");
      return;
    }

    if (!studentName || !String(studentName).trim()) {
      socket.emit("server_error", "Student name is required.");
      return;
    }

    const normalizedName = String(studentName).trim();
    const existingStudent = room.students.find(
      (student) => student.name.toLowerCase() === normalizedName.toLowerCase()
    );

    if (existingStudent) {
      socket.emit("server_error", "That student name is already in this room.");
      return;
    }

    const student = {
      id: socket.id,
      name: normalizedName,
      joinedAt: new Date().toISOString(),
      submittedAt: null,
      score: 0,
      answers: [],
    };

    room.students.push(student);
    socket.data.roomCode = room.roomCode;
    socket.data.role = "student";
    socket.data.studentName = normalizedName;
    socket.join(room.roomCode);

    socket.emit("joined_room", serializeRoom(room));
    emitRoom(room);
  });

  socket.on("start_quiz", ({ roomCode }) => {
    const room = rooms[String(roomCode || "").toUpperCase()];

    if (!room) {
      socket.emit("server_error", "Room not found.");
      return;
    }

    if (room.status !== "waiting") {
      socket.emit("server_error", "This exam has already been started.");
      return;
    }

    room.startedAt = new Date().toISOString();
    startNextQuestion(room);
  });

  socket.on("submit_answer", ({ roomCode, questionId, selectedOptionIndex }) => {
    const room = rooms[String(roomCode || "").toUpperCase()];

    if (!room) {
      socket.emit("server_error", "Room not found.");
      return;
    }

    if (room.status !== "live") {
      socket.emit("server_error", "The exam is not accepting answers right now.");
      return;
    }

    const currentQuestion = room.questions[room.currentQuestionIndex];
    if (!currentQuestion || currentQuestion.id !== questionId) {
      socket.emit("server_error", "This question is no longer active.");
      return;
    }

    const student = room.students.find((entry) => entry.id === socket.id);
    if (!student) {
      socket.emit("server_error", "Student not found in this room.");
      return;
    }

    const alreadyAnswered = student.answers.find((answer) => answer.questionId === questionId);
    if (alreadyAnswered) {
      socket.emit("server_error", "You can answer each question only once.");
      return;
    }

    const normalizedIndex = Number(selectedOptionIndex);
    if (
      Number.isNaN(normalizedIndex) ||
      normalizedIndex < 0 ||
      normalizedIndex >= currentQuestion.options.length
    ) {
      socket.emit("server_error", "Selected option is invalid.");
      return;
    }

    student.answers.push({
      questionId,
      selectedOptionIndex: normalizedIndex,
      isCorrect: normalizedIndex === currentQuestion.correctOptionIndex,
      answeredAt: new Date().toISOString(),
    });
    student.score = computeScore(student);

    if (student.answers.length === room.questions.length) {
      student.submittedAt = new Date().toISOString();
    }

    socket.emit("answer_accepted", "Answer saved. It is now locked for this question.");
    emitRoom(room);
  });

  socket.on("disconnect", () => {
    const roomCode = socket.data.roomCode;
    const role = socket.data.role;
    const room = rooms[roomCode];

    if (!room) {
      return;
    }

    if (role === "student") {
      room.students = room.students.filter((student) => student.id !== socket.id);
      emitRoom(room);
      return;
    }

    if (role === "teacher") {
      room.teacherSocketId = null;
    }
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
