import React, { useEffect, useMemo, useState } from "react";

function getCountdown(room) {
  if (!room.questionEndsAt) {
    return null;
  }

  const difference = new Date(room.questionEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(difference / 1000));
}

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

const optionButtonStyles = {
  width: "100%",
  textAlign: "left",
  border: "1px solid #cbd5e1",
  borderRadius: "14px",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  padding: "14px 16px",
  fontSize: "1rem",
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

function QuizRoom({ answerFeedback, error, room, student, studentName, onBackHome, onSubmitAnswer }) {
  const [secondsLeft, setSecondsLeft] = useState(getCountdown(room));
  const currentQuestion = room.currentQuestion;

  useEffect(() => {
    setSecondsLeft(getCountdown(room));

    if (!room.questionEndsAt) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft(getCountdown(room));
    }, 500);

    return () => window.clearInterval(timer);
  }, [room.questionEndsAt, room.currentQuestionIndex]);

  const existingAnswer = useMemo(() => {
    if (!student || !currentQuestion) {
      return null;
    }

    return student.answers.find((answer) => answer.questionId === currentQuestion.id) || null;
  }, [currentQuestion, student]);

  if (!currentQuestion) {
    return (
      <section style={cardStyles}>
        <h1 style={{ margin: 0 }}>Exam is loading</h1>
        <p style={{ margin: 0, color: "#475569" }}>
          Stay on this screen. The teacher has started the room and the next
          question will appear automatically.
        </p>
      </section>
    );
  }

  return (
    <section style={pageStyles}>
      <div style={cardStyles}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ marginTop: 0, marginBottom: "8px" }}>{room.quizTitle}</h1>
            <p style={{ margin: 0, color: "#475569" }}>
              {studentName} | Question {room.currentQuestionIndex + 1} of {room.questions.length}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: "0 0 6px", fontWeight: 700 }}>Time Left</p>
            <strong style={{ fontSize: "1.8rem" }}>
              {secondsLeft ?? room.questionDurationSeconds}s
            </strong>
          </div>
        </div>

        <article
          style={{
            border: "1px solid #dbeafe",
            borderRadius: "18px",
            backgroundColor: "#ffffff",
            padding: "20px",
            display: "grid",
            gap: "14px",
          }}
        >
          <h2 style={{ margin: 0 }}>{currentQuestion.prompt}</h2>
          <div style={{ display: "grid", gap: "12px" }}>
            {currentQuestion.options.map((option, optionIndex) => {
              const isSelected = existingAnswer?.selectedOptionIndex === optionIndex;
              return (
                <button
                  key={`${currentQuestion.id}-${optionIndex}`}
                  type="button"
                  style={{
                    ...optionButtonStyles,
                    borderColor: isSelected ? "#0284c7" : "#cbd5e1",
                    backgroundColor: isSelected ? "#e0f2fe" : "#ffffff",
                    cursor: existingAnswer ? "default" : "pointer",
                  }}
                  disabled={Boolean(existingAnswer)}
                  onClick={() =>
                    onSubmitAnswer({
                      questionId: currentQuestion.id,
                      selectedOptionIndex: optionIndex,
                    })
                  }
                >
                  {option}
                </button>
              );
            })}
          </div>
          <p style={{ margin: 0, color: "#475569" }}>
            Each question can be answered only once. After you choose an option,
            your answer is locked for this question.
          </p>
        </article>

        {existingAnswer ? (
          <p style={{ margin: 0, color: "#166534", fontWeight: 700 }}>
            Your answer is submitted for this question. Wait for the next one.
          </p>
        ) : null}

        {answerFeedback ? <p style={{ margin: 0, color: "#166534" }}>{answerFeedback}</p> : null}
        {error ? <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p> : null}

        <div>
          <button type="button" style={secondaryButtonStyles} onClick={onBackHome}>
            Leave Room
          </button>
        </div>
      </div>

      {student ? (
        <div style={cardStyles}>
          <h2 style={{ marginTop: 0 }}>Your Progress</h2>
          <p style={{ margin: 0, color: "#475569" }}>
            Answered {student.answers.length} of {room.questions.length} questions.
          </p>
          <p style={{ margin: 0, color: "#475569" }}>
            Current score so far: {student.score} / {room.questions.length}
          </p>
          <p style={{ margin: 0, color: "#475569" }}>
            Shared timer for each question: {room.questionDurationSeconds}s
          </p>
        </div>
      ) : null}
    </section>
  );
}

export default QuizRoom;
