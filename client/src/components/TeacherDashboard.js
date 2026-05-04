import React, { useEffect, useState } from "react";

function getCountdown(room) {
  if (!room.questionEndsAt) {
    return null;
  }

  const difference = new Date(room.questionEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(difference / 1000));
}

const panelStyles = {
  display: "grid",
  gap: "24px",
};

const heroStyles = {
  border: "1px solid #dbeafe",
  borderRadius: "24px",
  backgroundColor: "#f8fbff",
  padding: "24px",
  display: "grid",
  gap: "18px",
};

const buttonRowStyles = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const primaryButtonStyles = {
  border: "none",
  borderRadius: "12px",
  backgroundColor: "#0f172a",
  color: "#ffffff",
  padding: "14px 18px",
  fontSize: "1rem",
  fontWeight: 700,
  cursor: "pointer",
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

const cardStyles = {
  border: "1px solid #dbeafe",
  borderRadius: "20px",
  backgroundColor: "#ffffff",
  padding: "20px",
  display: "grid",
  gap: "14px",
};

const tableStyles = {
  width: "100%",
  borderCollapse: "collapse",
};

const cellStyles = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #dbeafe",
  verticalAlign: "top",
};

function TeacherDashboard({
  error,
  room,
  teacherName,
  onBackHome,
  onDownloadDetailedReport,
  onDownloadScorecard,
  onDownloadStudentReport,
  onStartQuiz,
}) {
  const [secondsLeft, setSecondsLeft] = useState(getCountdown(room));

  useEffect(() => {
    setSecondsLeft(getCountdown(room));

    if (!room.questionEndsAt || room.status !== "live") {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft(getCountdown(room));
    }, 500);

    return () => window.clearInterval(timer);
  }, [room.questionEndsAt, room.status, room.currentQuestionIndex]);

  const submittedStudents = room.students.filter((student) => student.submittedAt);
  const currentQuestion = room.currentQuestion;

  return (
    <section style={panelStyles}>
      <div style={heroStyles}>
        <div>
          <h1 style={{ marginTop: 0, marginBottom: "8px" }}>{room.quizTitle}</h1>
          <p style={{ margin: 0, color: "#475569" }}>
            Teacher {teacherName} is managing room {room.roomCode}. The same timer
            runs for every question, students receive one question at a time, and
            all score and report details stay visible here.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: "12px",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          }}
        >
          <div style={cardStyles}>
            <span style={{ color: "#64748b", fontWeight: 700 }}>Status</span>
            <strong>{room.status}</strong>
          </div>
          <div style={cardStyles}>
            <span style={{ color: "#64748b", fontWeight: 700 }}>Students joined</span>
            <strong>{room.students.length}</strong>
          </div>
          <div style={cardStyles}>
            <span style={{ color: "#64748b", fontWeight: 700 }}>Submitted</span>
            <strong>{submittedStudents.length}</strong>
          </div>
          <div style={cardStyles}>
            <span style={{ color: "#64748b", fontWeight: 700 }}>Questions</span>
            <strong>{room.questions.length}</strong>
          </div>
          <div style={cardStyles}>
            <span style={{ color: "#64748b", fontWeight: 700 }}>Shared timer</span>
            <strong>{room.questionDurationSeconds}s each</strong>
          </div>
        </div>

        <div style={buttonRowStyles}>
          <button
            type="button"
            style={primaryButtonStyles}
            onClick={onStartQuiz}
            disabled={room.status !== "waiting"}
          >
            Start Exam
          </button>
          <button type="button" style={secondaryButtonStyles} onClick={onDownloadScorecard}>
            Download Score Card
          </button>
          <button type="button" style={secondaryButtonStyles} onClick={onDownloadDetailedReport}>
            Download Full Report
          </button>
          <button type="button" style={secondaryButtonStyles} onClick={onBackHome}>
            Back Home
          </button>
        </div>

        {error ? <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p> : null}
      </div>

      {currentQuestion ? (
        <div style={cardStyles}>
          <h2 style={{ marginTop: 0, marginBottom: "6px" }}>
            Live Question {room.currentQuestionIndex + 1}
          </h2>
          <p style={{ margin: 0, fontWeight: 700 }}>{currentQuestion.prompt}</p>
          <p style={{ margin: 0, color: "#475569" }}>
            Time left for everyone: {secondsLeft ?? room.questionDurationSeconds}s
          </p>
          <ol style={{ margin: 0, paddingLeft: "20px", color: "#334155" }}>
            {currentQuestion.options.map((option, index) => (
              <li key={`${currentQuestion.id}-${option}`}>
                {option}
                {index === currentQuestion.correctOptionIndex ? " (Correct)" : ""}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div style={cardStyles}>
        <h2 style={{ marginTop: 0 }}>Question Bank</h2>
        <div style={{ display: "grid", gap: "12px" }}>
          {room.questions.map((question, index) => (
            <article
              key={question.id}
              style={{
                border: "1px solid #dbeafe",
                borderRadius: "16px",
                padding: "16px",
                display: "grid",
                gap: "8px",
              }}
            >
              <p style={{ margin: 0, fontWeight: 700 }}>
                {index + 1}. {question.prompt}
              </p>
              <p style={{ margin: 0, color: "#475569" }}>
                Shared timer: {room.questionDurationSeconds}s
              </p>
              <ul style={{ margin: 0, paddingLeft: "20px", color: "#334155" }}>
                {question.options.map((option, optionIndex) => (
                  <li key={`${question.id}-review-${optionIndex}`}>
                    {option}
                    {optionIndex === question.correctOptionIndex ? " (Correct)" : ""}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>

      <div style={cardStyles}>
        <h2 style={{ marginTop: 0 }}>Live Score Card</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyles}>
            <thead>
              <tr>
                <th style={cellStyles}>Student</th>
                <th style={cellStyles}>Joined</th>
                <th style={cellStyles}>Current Score</th>
                <th style={cellStyles}>Answered</th>
                <th style={cellStyles}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {room.students.length ? (
                room.students.map((student) => (
                  <tr key={student.id}>
                    <td style={cellStyles}>{student.name}</td>
                    <td style={cellStyles}>
                      {student.joinedAt ? new Date(student.joinedAt).toLocaleString() : ""}
                    </td>
                    <td style={cellStyles}>
                      {student.score} / {room.questions.length}
                    </td>
                    <td style={cellStyles}>{student.answers.length}</td>
                    <td style={cellStyles}>
                      {student.submittedAt
                        ? new Date(student.submittedAt).toLocaleString()
                        : "Waiting"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td style={cellStyles} colSpan="5">
                    No students have joined yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={cardStyles}>
        <h2 style={{ marginTop: 0 }}>Per Student Report</h2>
        <div style={{ display: "grid", gap: "16px" }}>
          {room.students.length ? (
            room.students.map((student) => (
              <article
                key={`report-${student.id}`}
                style={{
                  border: "1px solid #dbeafe",
                  borderRadius: "16px",
                  padding: "16px",
                  display: "grid",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h3 style={{ marginTop: 0, marginBottom: "6px" }}>{student.name}</h3>
                    <p style={{ margin: 0, color: "#475569" }}>
                      Score {student.score} / {room.questions.length}
                    </p>
                  </div>
                  <button
                    type="button"
                    style={secondaryButtonStyles}
                    onClick={() => onDownloadStudentReport(student.id)}
                  >
                    Download {student.name} Report
                  </button>
                </div>
                <div
                  style={{
                    display: "grid",
                    gap: "12px",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  }}
                >
                  {room.questions.map((question, index) => {
                    const answer = student.answers.find((entry) => entry.questionId === question.id);
                    return (
                      <div
                        key={`${student.id}-${question.id}`}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: "14px",
                          padding: "12px",
                        }}
                      >
                        <p style={{ marginTop: 0, marginBottom: "8px", fontWeight: 700 }}>
                          {index + 1}. {question.prompt}
                        </p>
                        <p style={{ margin: "4px 0" }}>
                          Selected:{" "}
                          <strong>
                            {answer
                              ? question.options[answer.selectedOptionIndex]
                              : "Not answered"}
                          </strong>
                        </p>
                        <p style={{ margin: "4px 0" }}>
                          Correct: <strong>{question.options[question.correctOptionIndex]}</strong>
                        </p>
                        <p
                          style={{
                            marginBottom: 0,
                            color: answer?.isCorrect ? "#166534" : "#b91c1c",
                            fontWeight: 700,
                          }}
                        >
                          {answer ? (answer.isCorrect ? "Correct" : "Wrong") : "No answer"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))
          ) : (
            <p style={{ margin: 0, color: "#64748b" }}>
              Student reports will appear here after people join the room.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default TeacherDashboard;
