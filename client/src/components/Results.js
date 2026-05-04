import React from "react";

const pageStyles = {
  display: "grid",
  gap: "24px",
};

const cardStyles = {
  border: "1px solid #dbeafe",
  borderRadius: "24px",
  backgroundColor: "#f8fbff",
  padding: "24px",
  display: "grid",
  gap: "18px",
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

function Results({ error, onBackHome, room, student }) {
  return (
    <section style={pageStyles}>
      <div style={cardStyles}>
        <h1 style={{ marginTop: 0, marginBottom: "8px" }}>Exam Completed</h1>
        <p style={{ margin: 0, color: "#475569" }}>
          {room.quizTitle} in room {room.roomCode} is finished.
        </p>
        <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
          Your score: {student ? `${student.score} / ${room.questions.length}` : "Waiting"}
        </p>
        {error ? <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p> : null}
      </div>

      <div style={cardStyles}>
        <h2 style={{ marginTop: 0 }}>Question Review</h2>
        <div style={{ display: "grid", gap: "14px" }}>
          {room.questions.map((question, index) => {
            const answer = student?.answers.find((entry) => entry.questionId === question.id);
            return (
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
                <p style={{ marginTop: 0, marginBottom: "4px", fontWeight: 700 }}>
                  {index + 1}. {question.prompt}
                </p>
                <p style={{ margin: 0 }}>
                  Your answer:{" "}
                  <strong>
                    {answer
                      ? question.options[answer.selectedOptionIndex]
                      : "Not answered"}
                  </strong>
                </p>
                <p style={{ margin: 0 }}>
                  Correct answer:{" "}
                  <strong>{question.options[question.correctOptionIndex]}</strong>
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
              </article>
            );
          })}
        </div>
      </div>

      <div style={cardStyles}>
        <h2 style={{ marginTop: 0 }}>Leaderboard</h2>
        <ol style={{ margin: 0, paddingLeft: "20px", display: "grid", gap: "8px" }}>
          {room.leaderboard.map((entry) => (
            <li key={entry.id}>
              {entry.name}: {entry.score} / {room.questions.length}
            </li>
          ))}
        </ol>
      </div>

      <div>
        <button type="button" style={primaryButtonStyles} onClick={onBackHome}>
          Back Home
        </button>
      </div>
    </section>
  );
}

export default Results;
