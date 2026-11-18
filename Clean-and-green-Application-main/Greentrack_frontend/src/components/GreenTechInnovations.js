import React, { useState, useEffect, useMemo } from "react";
import { toast } from 'react-toastify';
import "bootstrap/dist/css/bootstrap.min.css";
import { getUser } from "../utils/safeStorage";
import { BACKEND_URL as API_BASE } from "../config";

const GreenTechInnovations = () => {
    const user = useMemo(() => getUser(), []);
    const courseId = 1; // Unique ID
    const courseTitle = "Green Technology Innovations";
    const rewardCoins = 20;

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

  const goBackPage = () => {
    window.history.back();
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
      q1: "a", q2: "a", q3: "b", q4: "c", q5: "a",
      q6: "a", q7: "b", q8: "a", q9: "a", q10: "a",
    };

    for (let q in answers) {
      const selected = document.querySelector(`input[name="${q}"]:checked`);
      if (selected && selected.value === answers[q]) tempScore++;
    }

    const percentage = (tempScore / 10) * 100;
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

  return (
    <div style={{ backgroundColor: "#f8f9fa", fontFamily: "'Poppins', sans-serif" }}>
      <header style={{ backgroundColor: "#198754", color: "white", padding: "15px 0", textAlign: "center" }}>
        <h2>🌍 Clean & Green Technology Portal</h2>
        <p>Learn. Innovate. Save Earth!</p>
      </header>

      <div className="container mt-5">
        <h2 className="text-success text-center mb-4">🌱 Course: Green Technology Innovations</h2>

        {showReading && (
          <div className="reading-section" style={{ backgroundColor: "#e9f7ef", padding: "25px", borderRadius: "10px" }}>
            <h5 className="text-center mb-4">📘 Reading Section : Explore Green Innovations!</h5>
            <p>Green Technology focuses on sustainable solutions that minimize environmental impact. It integrates renewable energy, energy efficiency, and eco-friendly design.</p>
            <div className="text-center mt-4">
              <button className="btn btn-primary" onClick={startQuiz}>Start Quiz</button>
              <button className="btn btn-secondary ms-3" onClick={goBackPage}>🔙 Back</button>
            </div>
          </div>
        )}

        {showQuiz && (
          <div className="quiz-section mt-5" style={{ backgroundColor: "#e9f7ef", padding: "30px", borderRadius: "10px" }}>
             <h4 className="text-center mb-4">🧩 Green Technology Quiz</h4>
             <form id="quizForm" onSubmit={checkScore}>
                <div className="quiz-card mb-4 p-3 bg-white rounded shadow-sm">
                    <p><b>1. What is Green Technology primarily focused on?</b></p>
                    <label><input type="radio" name="q1" value="a" /> Sustainability & Environment</label><br/>
                    <label><input type="radio" name="q1" value="b" /> Increasing pollution</label>
                </div>
                <div className="text-center">
                    <button type="submit" className="btn btn-success" disabled={submitting}>Submit Quiz</button>
                    <button type="button" className="btn btn-secondary ms-2" onClick={goBack}>Back</button>
                </div>
             </form>
          </div>
        )}

        {showResult && (
          <div className="text-center mt-4">
            <h4>Your Score: {score.toFixed(0)}%</h4>
            <p>{feedback}</p>
            {showCoins && (
              <div className="coin-box bg-success text-white p-3 rounded d-inline-block">
                💰 You Earned: <b>{rewardCoins} Eco Coins!</b>
              </div>
            )}
            <div className="mt-3">
              {!isCompleted && score < 50 && <button className="btn btn-primary" onClick={restartQuiz}>Try Again</button>}
              <button className="btn btn-secondary ms-2" onClick={goBackPage}>Back to Courses</button>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-5 bg-success text-white py-3 text-center">
        <p>© 2025 Clean & Green Technology | Designed for Eco Awareness 🌿</p>
      </footer>
    </div>
  );
};

export default GreenTechInnovations;
