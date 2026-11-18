import React, { useState, useEffect, useMemo } from "react";
import { toast } from 'react-toastify';
import "bootstrap/dist/css/bootstrap.min.css";
import { getUser } from "../utils/safeStorage";
import { BACKEND_URL as API_BASE } from "../config";

const EWasteAwareness = () => {
    const user = useMemo(() => getUser(), []);
    const courseId = 8; // Unique ID
    const courseTitle = "E-Waste Awareness";
    const rewardCoins = 30;

  const [showReading, setShowReading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [showCoins, setShowCoins] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      checkCompletion();
    }
  }, [user]);

  const checkCompletion = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/courses/user/${user.id}`);
      if (res.ok) {
        const completedIds = await res.json();
        if (completedIds.includes(courseId)) {
          setIsCompleted(true);
          setFeedback("✅ You have already completed this course !");
          setShowReading(false);
          setShowResult(true);
        }
      }
    } catch (err) {
      console.error("Error checking completion:", err);
    }
  };

  const startQuiz = () => {
    if (isCompleted) {
        setShowReading(false);
        setShowResult(true);
        return;
    }
    setShowReading(false);
    setShowQuiz(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setShowQuiz(false);
    setShowReading(true);
    document.getElementById("quizForm")?.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const checkScore = async (e) => {
    e.preventDefault();
    if (submitting) return;

    let tempScore = 0;
    const answers = {
      q1: "a", q2: "a", q3: "a", q4: "a", q5: "a",
    };

    for (let q in answers) {
      const selected = document.querySelector(`input[name="${q}"]:checked`);
      if (selected && selected.value === answers[q]) tempScore++;
    }

    const percentage = (tempScore / 5) * 100;
    setScore(percentage);
    setShowQuiz(false);
    setShowResult(true);

    if (percentage >= 50) {
      setFeedback("🎉 Excellent! You have completed this course successfully!");
      setShowCoins(true);
      
      if (user && !isCompleted) {
          setSubmitting(true);
          try {
              const res = await fetch(`${API_BASE}/api/courses/complete`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                      userId: user.id,
                      courseId: courseId,
                      courseTitle: courseTitle,
                      score: percentage,
                      rewardCoins: rewardCoins
                  })
              });
              const data = await res.json();
              if (data.status === "SUCCESS") {
                  toast.success(`Congratulations! You earned ${rewardCoins} Eco-Coins!`);
                  setIsCompleted(true);
              }
          } catch (err) {
              toast.error("Failed to save progress.");
          } finally {
              setSubmitting(false);
          }
      }
    } else {
      setFeedback("⚠️ You scored below 50%. Try again to improve your score!");
      setShowCoins(false);
    }
  };

  const restartQuiz = () => {
    if (isCompleted) {
        toast.info("You've already earned coins for this course.");
        return;
    }
    setShowResult(false);
    setShowQuiz(true);
    setShowCoins(false);
    document.getElementById("quizForm")?.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBackToCourses = () => {
    window.location.href = "/courses";
  };

  return (
    <div className="container mt-4 mb-5">
      <header className="text-center bg-success text-white py-3 rounded">
        <h2>🌍 Clean & Green Technology Portal</h2>
        <p>Learn. Live. Sustain. Inspire a Greener Tomorrow!</p>
      </header>

      <h2 className="text-success text-center my-4">🚮 E-Waste Awareness</h2>

      {/* READING SECTION */}
      {showReading && (
        <div className="reading-section bg-light p-4 rounded">
          <h5 className="text-center text-success mb-3">
            📘 Reading Section – Learn Before You Quiz!
          </h5>

          <h6>♻️ Introduction</h6>
          <p>
            E-waste or electronic waste refers to discarded electrical or
            electronic devices such as computers, phones, televisions, and
            batteries. As technology advances rapidly, the volume of e-waste is
            increasing every year, posing serious environmental and health
            challenges.
          </p>

          <h6>🌍 Why E-Waste Awareness Matters</h6>
          <ul>
            <li>
              🔋 Prevents toxic substances like lead, mercury, and cadmium from
              polluting soil and water.
            </li>
            <li>
              🌱 Encourages recycling of valuable metals like gold, silver, and
              copper.
            </li>
            <li>🏭 Reduces landfill waste and resource extraction.</li>
            <li>💼 Creates green job opportunities in recycling sectors.</li>
            <li>🌍 Promotes responsible consumption and eco-friendly habits.</li>
          </ul>

          <div className="text-center mt-4">
            <button className="btn btn-primary" onClick={startQuiz}>
              Start Quiz
            </button>
            <button className="btn btn-secondary ms-3" onClick={goBackToCourses}>
              🔙 Back
            </button>
          </div>
        </div>
      )}

      {/* QUIZ SECTION */}
      {showQuiz && (
        <div className="quiz-section bg-light p-4 rounded mt-4">
          <div className="quiz-header text-center mb-3">
            <h4>🧩 E-Waste Awareness Quiz</h4>
            <p>Test your knowledge and become a Responsible Recycler!</p>
          </div>

          <form id="quizForm" onSubmit={checkScore}>
            <div className="quiz-card mb-3">
              <p><b>1.</b> What is e-waste?</p>
              <label><input type="radio" name="q1" value="a" /> Discarded electrical or electronic devices</label><br />
              <label><input type="radio" name="q1" value="b" /> Organic kitchen waste</label>
            </div>

            <div className="quiz-card mb-3">
              <p><b>2.</b> Which of the following is a harmful effect of e-waste?</p>
              <label><input type="radio" name="q2" value="a" /> Soil and water contamination</label><br />
              <label><input type="radio" name="q2" value="b" /> Improved air quality</label>
            </div>

            <div className="text-center mt-4">
              <button type="submit" className="btn btn-success" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Quiz"}
              </button>
              <button type="button" className="btn btn-secondary ms-3" onClick={goBack}>
                🔙 Back
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RESULT SECTION */}
      {showResult && (
        <div className="text-center mt-5">
          <h4>Your Score: {score}%</h4>
          <p className={score >= 50 ? "text-success" : "text-danger"}>{feedback}</p>
          
          {showCoins && (
            <div className="coin-box bg-success text-white p-3 rounded mx-auto" style={{maxWidth: '300px'}}>
              💰 Reward: <b>{rewardCoins} Eco Coins!</b>
            </div>
          )}

          <div className="mt-4">
            {!isCompleted && score < 50 && (
                <button className="btn btn-primary" onClick={restartQuiz}>Try Again</button>
            )}
            <button className="btn btn-secondary ms-3" onClick={goBackToCourses}>
              🔙 Back to Courses
            </button>
          </div>
        </div>
      )}

      <footer className="text-center bg-success text-white mt-5 py-3 rounded">
        © 2025 Clean & Green Technology | Designed for E-Waste Awareness ♻️
      </footer>
    </div>
  );
};

export default EWasteAwareness;
