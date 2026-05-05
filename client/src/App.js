import React, { useEffect, useMemo, useState } from "react";
import io from "socket.io-client";
import Lobby from "./components/Lobby";
import TeacherDashboard from "./components/TeacherDashboard";
import QuizRoom from "./components/QuizRoom";
import Results from "./components/Results";

const socket = io(process.env.REACT_APP_SERVER_URL || "http://localhost:5000", {
  autoConnect: true,
});

const shellStyles = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, #fff7ed 0%, #fefce8 20%, #e0f2fe 60%, #f8fafc 100%)",
  padding: "32px 16px",
  fontFamily: "Segoe UI, sans-serif",
  color: "#0f172a",
};

const frameStyles = {
  maxWidth: "1180px",
  margin: "0 auto",
  backgroundColor: "rgba(255, 255, 255, 0.95)",
  borderRadius: "28px",
  boxShadow: "0 30px 80px rgba(15, 23, 42, 0.12)",
  padding: "28px",
  display: "grid",
  gap: "24px",
};

const badgeRowStyles = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const badgeStyles = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  padding: "10px 14px",
  backgroundColor: "#ecfeff",
  color: "#155e75",
  fontWeight: 700,
};

const waitingCardStyles = {
  border: "1px solid #dbeafe",
  borderRadius: "24px",
  backgroundColor: "#f8fbff",
  padding: "24px",
  display: "grid",
  gap: "18px",
};

const secondaryButtonStyles = {
  border: "1px solid #cbd5e1",
  borderRadius: "12px",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  padding: "14px 18px",
  fontSize: "1rem",
  fontWeight: 700,
  cursor: "pointer",
};

function downloadFile(filename, type, content) {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function buildScorecardCsv(room) {
  const header = ["Student", "Joined At", "Submitted At", "Score", "Total Questions"];
  const questionHeaders = room.questions.flatMap((question, index) => [
    `Q${index + 1} Selected`,
    `Q${index + 1} Correct`,
    `Q${index + 1} Result`,
  ]);

  const rows = room.students.map((student) => {
    const answers = room.questions.flatMap((question) => {
      const answer = student.answers.find((entry) => entry.questionId === question.id);
      const selected =
        typeof answer?.selectedOptionIndex === "number"
          ? question.options[answer.selectedOptionIndex]
          : "Not answered";
      const correct = question.options[question.correctOptionIndex];
      const result = answer ? (answer.isCorrect ? "Correct" : "Wrong") : "Not answered";
      return [selected, correct, result];
    });

    return [
      student.name,
      student.joinedAt ? new Date(student.joinedAt).toLocaleString() : "",
      student.submittedAt ? new Date(student.submittedAt).toLocaleString() : "",
      student.score,
      room.questions.length,
      ...answers,
    ];
  });

  return [header.concat(questionHeaders), ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");
}

function buildSingleStudentReport(room, student) {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      roomCode: room.roomCode,
      quizTitle: room.quizTitle,
      teacherName: room.teacherName,
      questionDurationSeconds: room.questionDurationSeconds,
      student: {
        id: student.id,
        name: student.name,
        joinedAt: student.joinedAt,
        submittedAt: student.submittedAt,
        score: student.score,
        totalQuestions: room.questions.length,
      },
      answers: room.questions.map((question, index) => {
        const answer = student.answers.find((entry) => entry.questionId === question.id);
        return {
          questionNumber: index + 1,
          questionId: question.id,
          prompt: question.prompt,
          options: question.options,
          correctOptionIndex: question.correctOptionIndex,
          correctOption: question.options[question.correctOptionIndex],
          selectedOptionIndex: answer?.selectedOptionIndex ?? null,
          selectedOption:
            typeof answer?.selectedOptionIndex === "number"
              ? question.options[answer.selectedOptionIndex]
              : null,
          isCorrect: answer?.isCorrect ?? false,
          answeredAt: answer?.answeredAt ?? null,
        };
      }),
    },
    null,
    2
  );
}

function App() {
  const [room, setRoom] = useState(null);
  const [session, setSession] = useState({ name: "", role: "" });
  const [connectionText, setConnectionText] = useState("Connecting to server...");
  const [error, setError] = useState("");
  const [answerFeedback, setAnswerFeedback] = useState("");

  useEffect(() => {
    function handleConnect() {
      setConnectionText("Connected");
    }

    function handleDisconnect() {
      setConnectionText("Disconnected");
    }

    function handleRoomCreated(payload) {
      setError("");
      setRoom(payload);
      setAnswerFeedback("");
    }

    function handleJoinedRoom(payload) {
      setError("");
      setRoom(payload);
      setAnswerFeedback("");
    }

    function handleRoomState(payload) {
      setRoom(payload);
    }

    function handleQuizFinished(payload) {
      setRoom(payload);
    }

    function handleServerError(message) {
      setError(message);
    }

    function handleAnswerAccepted(message) {
      setAnswerFeedback(message);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("room_created", handleRoomCreated);
    socket.on("joined_room", handleJoinedRoom);
    socket.on("room_state", handleRoomState);
    socket.on("quiz_finished", handleQuizFinished);
    socket.on("server_error", handleServerError);
    socket.on("answer_accepted", handleAnswerAccepted);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("room_created", handleRoomCreated);
      socket.off("joined_room", handleJoinedRoom);
      socket.off("room_state", handleRoomState);
      socket.off("quiz_finished", handleQuizFinished);
      socket.off("server_error", handleServerError);
      socket.off("answer_accepted", handleAnswerAccepted);
    };
  }, []);

  const myStudentRecord = useMemo(() => {
    if (!room || session.role !== "student") {
      return null;
    }

    return room.students.find(
      (student) => student.name.toLowerCase() === session.name.toLowerCase()
    );
  }, [room, session]);

  const createRoom = ({ teacherName, quizTitle, questionDurationSeconds, questions }) => {
    setSession({ name: teacherName, role: "teacher" });
    setError("");
    socket.emit("create_room", {
      teacherName,
      quizTitle,
      questionDurationSeconds,
      questions,
    });
  };

  const joinRoom = ({ studentName, roomCode }) => {
    setSession({ name: studentName, role: "student" });
    setError("");
    socket.emit("join_room", { roomCode: roomCode.toUpperCase(), studentName });
  };

  const startQuiz = () => {
    if (!room) {
      return;
    }

    socket.emit("start_quiz", { roomCode: room.roomCode });
  };

  const submitAnswer = ({ questionId, selectedOptionIndex }) => {
    if (!room) {
      return;
    }

    setError("");
    setAnswerFeedback("");
    socket.emit("submit_answer", {
      roomCode: room.roomCode,
      questionId,
      selectedOptionIndex,
    });
  };

  const goHome = () => {
    setRoom(null);
    setSession({ name: "", role: "" });
    setError("");
    setAnswerFeedback("");
  };

  const downloadScorecard = () => {
    if (!room) {
      return;
    }

    const csv = buildScorecardCsv(room);
    downloadFile(`${room.roomCode}-scorecard.csv`, "text/csv;charset=utf-8", csv);
  };

  const downloadDetailedReport = () => {
    if (!room) {
      return;
    }

    const report = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        roomCode: room.roomCode,
        quizTitle: room.quizTitle,
        teacherName: room.teacherName,
        questionDurationSeconds: room.questionDurationSeconds,
        status: room.status,
        questions: room.questions,
        students: room.students,
      },
      null,
      2
    );

    downloadFile(
      `${room.roomCode}-student-report.json`,
      "application/json;charset=utf-8",
      report
    );
  };

  const downloadStudentReport = (studentId) => {
    if (!room) {
      return;
    }

    const student = room.students.find((entry) => entry.id === studentId);
    if (!student) {
      return;
    }

    const report = buildSingleStudentReport(room, student);
    downloadFile(
      `${room.roomCode}-${student.name.replaceAll(" ", "-").toLowerCase()}-report.json`,
      "application/json;charset=utf-8",
      report
    );
  };

  return (
    <div style={shellStyles}>
      <main style={frameStyles}>
        <div style={badgeRowStyles}>
          <span style={badgeStyles}>Server: {connectionText}</span>
          {room ? <span style={badgeStyles}>Room: {room.roomCode}</span> : null}
          {session.role ? <span style={badgeStyles}>Mode: {session.role}</span> : null}
        </div>

        {!room ? (
          <Lobby error={error} onCreateRoom={createRoom} onJoinRoom={joinRoom} />
        ) : null}

        {room && session.role === "teacher" ? (
          <TeacherDashboard
            error={error}
            room={room}
            teacherName={session.name}
            onBackHome={goHome}
            onDownloadDetailedReport={downloadDetailedReport}
            onDownloadScorecard={downloadScorecard}
            onDownloadStudentReport={downloadStudentReport}
            onStartQuiz={startQuiz}
          />
        ) : null}

        {room && session.role === "student" && room.status === "waiting" ? (
          <section style={waitingCardStyles}>
            <div>
              <h1 style={{ marginTop: 0, marginBottom: "10px" }}>{room.quizTitle}</h1>
              <p style={{ margin: 0, color: "#475569" }}>
                You are in room {room.roomCode}. Please wait for {room.teacherName} to
                start the exam.
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gap: "12px",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              }}
            >
              <div style={{ border: "1px solid #dbeafe", borderRadius: "16px", padding: "16px" }}>
                <strong>Your name</strong>
                <p style={{ marginBottom: 0 }}>{session.name}</p>
              </div>
              <div style={{ border: "1px solid #dbeafe", borderRadius: "16px", padding: "16px" }}>
                <strong>Questions</strong>
                <p style={{ marginBottom: 0 }}>{room.questions.length}</p>
              </div>
              <div style={{ border: "1px solid #dbeafe", borderRadius: "16px", padding: "16px" }}>
                <strong>Shared timer</strong>
                <p style={{ marginBottom: 0 }}>{room.questionDurationSeconds}s each</p>
              </div>
            </div>
            {error ? <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p> : null}
            <div>
              <button type="button" style={secondaryButtonStyles} onClick={goHome}>
                Leave Room
              </button>
            </div>
          </section>
        ) : null}

        {room && session.role === "student" && room.status === "live" ? (
          <QuizRoom
            answerFeedback={answerFeedback}
            error={error}
            room={room}
            student={myStudentRecord}
            studentName={session.name}
            onBackHome={goHome}
            onSubmitAnswer={submitAnswer}
          />
        ) : null}

        {room && session.role === "student" && room.status === "finished" ? (
          <Results error={error} onBackHome={goHome} room={room} student={myStudentRecord} />
        ) : null}
      </main>
    </div>
  );
}

export default App;
