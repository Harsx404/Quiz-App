import React, { useMemo, useState } from "react";

function createEmptyQuestion(index) {
  return {
    id: `q-${index + 1}`,
    prompt: "",
    options: ["", "", "", ""],
    correctOptionIndex: 0,
  };
}

function resizeQuestions(nextCount, currentQuestions) {
  const safeCount = Math.max(1, nextCount);
  const nextQuestions = currentQuestions.slice(0, safeCount);

  while (nextQuestions.length < safeCount) {
    nextQuestions.push(createEmptyQuestion(nextQuestions.length));
  }

  return nextQuestions.map((question, index) => ({
    ...question,
    id: `q-${index + 1}`,
  }));
}

const pageStyles = {
  display: "grid",
  gap: "28px",
};

const heroStyles = {
  display: "grid",
  gap: "12px",
};

const switcherStyles = {
  display: "inline-flex",
  border: "1px solid #cbd5e1",
  borderRadius: "999px",
  backgroundColor: "#ffffff",
  padding: "6px",
  gap: "6px",
};

const activeTabStyles = {
  border: "none",
  borderRadius: "999px",
  backgroundColor: "#0f172a",
  color: "#ffffff",
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const inactiveTabStyles = {
  border: "none",
  borderRadius: "999px",
  backgroundColor: "transparent",
  color: "#334155",
  padding: "12px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const layoutStyles = {
  display: "grid",
  gap: "22px",
  gridTemplateColumns: "1.5fr 1fr",
};

const cardStyles = {
  border: "1px solid #dbeafe",
  borderRadius: "24px",
  backgroundColor: "#f8fbff",
  padding: "24px",
  display: "grid",
  gap: "18px",
};

const inputStyles = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  boxSizing: "border-box",
  fontSize: "1rem",
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
  border: "1px solid #0f172a",
  borderRadius: "12px",
  backgroundColor: "#ffffff",
  color: "#0f172a",
  padding: "14px 18px",
  fontSize: "1rem",
  fontWeight: 700,
  cursor: "pointer",
};

function Lobby({ error, onCreateRoom, onJoinRoom }) {
  const [activeSection, setActiveSection] = useState("create");
  const [teacherName, setTeacherName] = useState("");
  const [quizTitle, setQuizTitle] = useState("Classroom Quiz");
  const [questionCount, setQuestionCount] = useState(3);
  const [questionDurationSeconds, setQuestionDurationSeconds] = useState(30);
  const [questions, setQuestions] = useState([
    createEmptyQuestion(0),
    createEmptyQuestion(1),
    createEmptyQuestion(2),
  ]);
  const [studentName, setStudentName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const updateQuestion = (questionIndex, updater) => {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question, index) =>
        index === questionIndex ? updater(question) : question
      )
    );
  };

  const questionCompletion = useMemo(() => {
    return questions.filter(
      (question) =>
        question.prompt.trim() &&
        question.options.every((option) => option.trim())
    ).length;
  }, [questions]);

  const handleQuestionCountChange = (value) => {
    const numericValue = Number(value);
    setQuestionCount(numericValue);
    setQuestions((currentQuestions) => resizeQuestions(numericValue, currentQuestions));
  };

  const handleCreateRoom = () => {
    const normalizedQuestions = questions.map((question, index) => ({
      id: `q-${index + 1}`,
      prompt: question.prompt.trim(),
      options: question.options.map((option) => option.trim()),
      correctOptionIndex: Number(question.correctOptionIndex),
    }));

    const invalidQuestion = normalizedQuestions.some(
      (question) =>
        !question.prompt ||
        question.options.some((option) => !option) ||
        question.correctOptionIndex < 0 ||
        question.correctOptionIndex >= question.options.length
    );

    if (
      !teacherName.trim() ||
      !quizTitle.trim() ||
      invalidQuestion ||
      Number(questionDurationSeconds) < 5 ||
      Number(questionDurationSeconds) > 600
    ) {
      return;
    }

    onCreateRoom({
      teacherName: teacherName.trim(),
      quizTitle: quizTitle.trim(),
      questionDurationSeconds: Number(questionDurationSeconds),
      questions: normalizedQuestions,
    });
  };

  const handleJoinRoom = () => {
    if (!studentName.trim() || !roomCode.trim()) {
      return;
    }

    onJoinRoom({
      studentName: studentName.trim(),
      roomCode: roomCode.trim(),
    });
  };

  return (
    <section style={pageStyles}>
      <div style={heroStyles}>
        <h1 style={{ margin: 0, fontSize: "2.5rem" }}>Create or Join a Live Quiz Room</h1>
        <p style={{ margin: 0, color: "#475569", maxWidth: "72ch" }}>
          Teachers create the exam first and students join after that with the room
          code. The timer is entered once and the same timing is followed for every
          question while the quiz moves one question at a time automatically.
        </p>
      </div>

      <div style={switcherStyles}>
        <button
          type="button"
          style={activeSection === "create" ? activeTabStyles : inactiveTabStyles}
          onClick={() => setActiveSection("create")}
        >
          Create Quiz
        </button>
        <button
          type="button"
          style={activeSection === "join" ? activeTabStyles : inactiveTabStyles}
          onClick={() => setActiveSection("join")}
        >
          Join Quiz
        </button>
      </div>

      <div style={layoutStyles}>
        {activeSection === "create" ? (
          <div style={cardStyles}>
            <div>
              <h2 style={{ marginTop: 0, marginBottom: "8px" }}>Teacher Setup</h2>
              <p style={{ margin: 0, color: "#475569" }}>
                Decide the number of questions first, set one shared timer, then fill
                in the question bank clearly before creating the room.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gap: "12px",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              }}
            >
              <input
                style={inputStyles}
                placeholder="Teacher name"
                value={teacherName}
                onChange={(event) => setTeacherName(event.target.value)}
              />
              <input
                style={inputStyles}
                placeholder="Quiz title"
                value={quizTitle}
                onChange={(event) => setQuizTitle(event.target.value)}
              />
              <input
                style={inputStyles}
                min="1"
                type="number"
                value={questionCount}
                onChange={(event) => handleQuestionCountChange(event.target.value)}
                placeholder="Number of questions"
              />
              <input
                style={inputStyles}
                min="5"
                max="600"
                type="number"
                value={questionDurationSeconds}
                onChange={(event) => setQuestionDurationSeconds(event.target.value)}
                placeholder="Shared timer in seconds"
              />
            </div>

            <div
              style={{
                display: "grid",
                gap: "12px",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              }}
            >
              <div style={{ ...cardStyles, padding: "18px", gap: "8px", backgroundColor: "#ffffff" }}>
                <span style={{ color: "#64748b", fontWeight: 700 }}>Question count</span>
                <strong>{questions.length}</strong>
              </div>
              <div style={{ ...cardStyles, padding: "18px", gap: "8px", backgroundColor: "#ffffff" }}>
                <span style={{ color: "#64748b", fontWeight: 700 }}>Shared timer</span>
                <strong>{questionDurationSeconds}s for each question</strong>
              </div>
              <div style={{ ...cardStyles, padding: "18px", gap: "8px", backgroundColor: "#ffffff" }}>
                <span style={{ color: "#64748b", fontWeight: 700 }}>Completed questions</span>
                <strong>
                  {questionCompletion} / {questions.length}
                </strong>
              </div>
            </div>

            <div style={{ display: "grid", gap: "16px" }}>
              {questions.map((question, questionIndex) => (
                <article
                  key={question.id}
                  style={{
                    border: "1px solid #dbeafe",
                    borderRadius: "18px",
                    padding: "18px",
                    display: "grid",
                    gap: "14px",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <div>
                    <h3 style={{ marginTop: 0, marginBottom: "8px" }}>
                      Question {questionIndex + 1}
                    </h3>
                    <input
                      style={inputStyles}
                      placeholder={`Enter question ${questionIndex + 1}`}
                      value={question.prompt}
                      onChange={(event) =>
                        updateQuestion(questionIndex, (current) => ({
                          ...current,
                          prompt: event.target.value,
                        }))
                      }
                    />
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gap: "12px",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    }}
                  >
                    {question.options.map((option, optionIndex) => (
                      <label key={`${question.id}-option-${optionIndex}`} style={{ fontWeight: 700 }}>
                        Option {optionIndex + 1}
                        <input
                          style={{ ...inputStyles, marginTop: "8px" }}
                          placeholder={`Enter option ${optionIndex + 1}`}
                          value={option}
                          onChange={(event) =>
                            updateQuestion(questionIndex, (current) => ({
                              ...current,
                              options: current.options.map((entry, index) =>
                                index === optionIndex ? event.target.value : entry
                              ),
                            }))
                          }
                        />
                      </label>
                    ))}
                  </div>

                  <select
                    style={inputStyles}
                    value={question.correctOptionIndex}
                    onChange={(event) =>
                      updateQuestion(questionIndex, (current) => ({
                        ...current,
                        correctOptionIndex: Number(event.target.value),
                      }))
                    }
                  >
                    {question.options.map((_option, optionIndex) => (
                      <option key={`${question.id}-correct-${optionIndex}`} value={optionIndex}>
                        Correct answer: option {optionIndex + 1}
                      </option>
                    ))}
                  </select>
                </article>
              ))}
            </div>

            <button type="button" style={primaryButtonStyles} onClick={handleCreateRoom}>
              Create Room
            </button>
          </div>
        ) : (
          <div style={cardStyles}>
            <div>
              <h2 style={{ marginTop: 0, marginBottom: "8px" }}>Student Join Page</h2>
              <p style={{ margin: 0, color: "#475569" }}>
                Enter your name and the room code shared by the teacher. You will
                stay in the waiting lobby until the teacher starts the quiz.
              </p>
            </div>
            <input
              style={inputStyles}
              placeholder="Student name"
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
            />
            <input
              style={inputStyles}
              placeholder="Room code"
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            />
            <button type="button" style={secondaryButtonStyles} onClick={handleJoinRoom}>
              Join Room
            </button>
          </div>
        )}

        <div style={{ display: "grid", gap: "20px" }}>
          <div style={cardStyles}>
            <h2 style={{ margin: 0 }}>How The Exam Runs</h2>
            <ol
              style={{
                margin: 0,
                paddingLeft: "20px",
                color: "#334155",
                display: "grid",
                gap: "8px",
              }}
            >
              <li>Teacher prepares the full question bank first.</li>
              <li>Teacher enters one timer and it applies to every question.</li>
              <li>Students join using the room code.</li>
              <li>Teacher starts the exam manually from the dashboard.</li>
              <li>Only one question is shown at a time for all students.</li>
              <li>When the timer ends, the app moves to the next question automatically.</li>
              <li>When all questions are over, the exam auto-finishes and reports are ready.</li>
            </ol>
          </div>

          <div style={cardStyles}>
            <h2 style={{ margin: 0 }}>Reports Available</h2>
            <ul style={{ margin: 0, paddingLeft: "20px", color: "#334155", display: "grid", gap: "8px" }}>
              <li>overall room score card download</li>
              <li>detailed room-wide report download</li>
              <li>individual student report download from the dashboard</li>
            </ul>
          </div>
        </div>
      </div>

      {error ? <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p> : null}
    </section>
  );
}

export default Lobby;
