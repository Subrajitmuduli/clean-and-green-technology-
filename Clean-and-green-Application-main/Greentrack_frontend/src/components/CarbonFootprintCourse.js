import React, { useState, useEffect, useMemo } from "react";
import { toast } from 'react-toastify';
import "bootstrap/dist/css/bootstrap.min.css";
import { getUser } from "../utils/safeStorage";
import { BACKEND_URL as API_BASE } from "../config";

const CarbonFootprintCourse = () => {
  const user = useMemo(() => getUser(), []);
  const courseId = 5; // Unique ID
  const courseTitle = "Carbon Footprint Reduction";
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
    document.getElementById("quizForm").reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const checkScore = async (e) => {
    e.preventDefault();
    if (submitting) return;

    let tempScore = 0;

    const answers = {
      q1: "a",
      q2: "b",
      q3: "b",
      q4: "a",
      q5: "c",
      q6: "b",
      q7: "a",
      q8: "d",
      q9: "b",
      q10: "c",
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
    } else if (percentage < 35) {
      toast.error("❌ You failed the quiz. Please revisit the Reading Section and try again.");
      setShowResult(false);
      setShowReading(true);
      document.getElementById("quizForm").reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
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
    document.getElementById("quizForm").reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ backgroundColor: "#f8f9fa", fontFamily: "'Poppins', sans-serif" }}>
      {/* HEADER */}
      <header style={{ backgroundColor: "#198754", color: "white", padding: "15px 0", textAlign: "center" }}>
        <h2>🌍 Clean & Green Technology Portal</h2>
        <p>Learn. Act. Save the Planet!</p>
      </header>

      {/* MAIN CONTENT */}
      <div className="container mt-5">
        <h2 className="text-success text-center mb-4">🌿 Course: Carbon Footprint Reduction</h2>

        {/* READING SECTION */}
        {showReading && (
          <div
            className="reading-section"
            style={{
              backgroundColor: "#e9f7ef",
              padding: "25px",
              borderRadius: "10px",
              marginTop: "30px",
            }}
          >
            <h5 style={{ textAlign: "center", color: "#155d27", marginBottom: "20px" }}>
              📘 Reading Section: Understanding and Reducing Carbon Footprints
            </h5>

            <h6 style={{ color: "#198754", marginTop: "20px" }}>🌎 What is a Carbon Footprint?</h6>
            <p>
              A carbon footprint is the total amount of greenhouse gases, especially carbon dioxide (CO₂),
              that are released into the atmosphere due to our daily activities — such as driving cars,
              using electricity, eating meat, and manufacturing goods.
            </p>

            <h6 style={{ color: "#198754", marginTop: "20px" }}>💡 Why It Matters</h6>
            <p>
              Every ton of CO₂ adds to global warming, melting glaciers, and extreme weather conditions.
              Reducing your carbon footprint helps fight climate change and protect ecosystems.
            </p>

            <h6 style={{ color: "#198754", marginTop: "20px" }}>🚶 Everyday Actions to Reduce Your Carbon Footprint</h6>
            <ul>
              <li>🚲 Walk, bike, or use public transport instead of driving short distances.</li>
              <li>💡 Switch to LED bulbs and energy-efficient appliances.</li>
              <li>🌞 Use renewable energy sources like solar power if possible.</li>
              <li>🥗 Eat more plant-based meals and reduce meat consumption.</li>
              <li>♻️ Reuse and recycle materials to reduce manufacturing emissions.</li>
              <li>🪴 Plant trees — they absorb CO₂ from the air.</li>
            </ul>

            <h6 style={{ color: "#198754", marginTop: "20px" }}>🌍 Real-World Example</h6>
            <p>
              The city of Copenhagen, Denmark, aims to become <strong>carbon neutral by 2025</strong> by using
              wind power, promoting cycling, and investing in sustainable heating systems.
            </p>

            <h6 style={{ color: "#198754", marginTop: "20px" }}>📊 Global Insights</h6>
            <p>
              According to the <strong>Intergovernmental Panel on Climate Change (IPCC, 2023)</strong>,
              an average person’s carbon footprint should be reduced to **2 tons CO₂ per year** to limit global
              warming below 1.5°C.
            </p>

            <h6 style={{ color: "#198754", marginTop: "20px" }}>💚 Tips to Follow at Home</h6>
            <ul>
              <li>Turn off lights when not in use.</li>
              <li>Use energy-efficient air conditioners and fans.</li>
              <li>Unplug chargers and electronics when not needed.</li>
              <li>Buy locally produced food to reduce transport emissions.</li>
            </ul>

            <h6 style={{ color: "#198754", marginTop: "20px" }}>🚨 Common Misconceptions</h6>
            <ul>
              <li>❌ “Electric cars have zero emissions” — they still produce CO₂ during manufacturing.</li>
              <li>❌ “Recycling alone is enough” — real change needs lifestyle changes too.</li>
              <li>❌ “One person can’t make a difference” — collective small actions create massive impact.</li>
            </ul>

            <h6 style={{ color: "#198754", marginTop: "20px" }}>📚 For Further Reading</h6>
            <p>
              Learn more at:{" "}
              <a href="https://www.carbonfootprint.com/" target="_blank" rel="noreferrer">
                CarbonFootprint.com
              </a>
            </p>

            <div className="text-center mt-4">
              <button className="btn btn-primary" onClick={startQuiz}>
                Start Quiz
              </button>
              <button className="btn btn-secondary ms-3" onClick={goBackPage}>
                🔙 Back
              </button>
            </div>
          </div>
        )}

        {/* QUIZ SECTION */}
        {showQuiz && (
          <div className="quiz-section mt-5" style={{ backgroundColor: "#e9f7ef", padding: "30px", borderRadius: "10px" }}>
            <div
              className="quiz-header text-center"
              style={{
                backgroundColor: "#a8e6a2",
                color: "#155d27",
                padding: "15px",
                borderRadius: "10px",
                marginBottom: "25px",
              }}
            >
              <h4>🧩 Carbon Footprint Awareness Quiz</h4>
              <p>Test your knowledge and earn your Green Eco Coins!</p>
            </div>

            <form id="quizForm" onSubmit={checkScore}>
              {[
                { q: "1. What is a carbon footprint?", opts: ["The total greenhouse gases emitted by human activities", "Footprints on the ground", "Amount of oxygen produced", "Waste generated by humans"], name: "q1" },
                { q: "2. Which of these activities increases carbon emissions the most?", opts: ["Walking", "Flying in airplanes", "Cycling", "Recycling paper"], name: "q2" },
                { q: "3. Which energy source produces the least CO₂?", opts: ["Coal", "Solar power", "Oil", "Diesel"], name: "q3" },
                { q: "4. What can reduce your household’s carbon footprint?", opts: ["Using LED bulbs", "Leaving lights on", "Using single-use plastics", "Wasting food"], name: "q4" },
                { q: "5. Eating which type of food helps lower emissions?", opts: ["Beef", "Pork", "Vegetables", "Processed food"], name: "q5" },
                { q: "6. What do trees do to carbon dioxide?", opts: ["Release it", "Absorb it", "Ignore it", "Convert it to methane"], name: "q6" },
                { q: "7. What’s the main goal of reducing carbon footprints?", opts: ["To slow down climate change", "To increase pollution", "To harm the economy", "To burn more fuel"], name: "q7" },
                { q: "8. Which is an example of renewable energy?", opts: ["Diesel", "Coal", "Natural gas", "Wind energy"], name: "q8" },
                { q: "9. What does ‘carbon neutral’ mean?", opts: ["Emitting no net CO₂", "Burning more fossil fuels", "Using more plastic", "Releasing more gas"], name: "q9" },
                { q: "10. Which daily habit helps the environment most?", opts: ["Using public transport", "Driving alone", "Leaving taps open", "Using plastic bags"], name: "q10" },
              ].map((item, index) => (
                <div key={index} className="quiz-card mb-4 p-3" style={{ background: "#fff", border: "1px solid #b7e8d2", borderRadius: "10px" }}>
                  <p><b>{item.q}</b></p>
                  {item.opts.map((opt, i) => (
                    <div key={i}>
                      <label>
                        <input type="radio" name={item.name} value={String.fromCharCode(97 + i)} style={{ marginRight: "8px" }} />
                        {opt}
                      </label>
                    </div>
                  ))}
                </div>
              ))}

              <div className="text-center mt-4">
                <button type="submit" className="btn btn-success">
                  Submit Quiz
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
          <div id="result-section" className="text-center mt-4">
            <h4>Your Score: {score.toFixed(0)}%</h4>
            <p>{feedback}</p>
            {showCoins && (
              <div>
                <div className="coin-box" style={{ background: "#d4edda", border: "2px solid #198754", color: "#155d27", padding: "15px", borderRadius: "10px", display: "inline-block", fontWeight: "bold" }}>
                  💰 You Earned: <b>10 Eco Coins!</b>
                </div>
                <div className="mt-4">
                  <button className="btn btn-primary" onClick={goBackPage}>
                    🔙 Back to Courses
                  </button>
                </div>
              </div>
            )}
            <button className="btn btn-secondary mt-3" onClick={restartQuiz}>
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="mt-5" style={{ backgroundColor: "#198754", color: "white", padding: "15px 0", textAlign: "center" }}>
        <p>© 2025 Clean & Green Technology | Learn to Reduce, Reuse, and Rethink 🌿</p>
      </footer>
    </div>
  );
};

export default CarbonFootprintCourse;
