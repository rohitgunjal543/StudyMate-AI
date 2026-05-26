import { useState } from "react";
import { Quiz, QuizQuestion } from "../types";
import { Award, AlertCircle, HelpCircle, ChevronRight, RefreshCw, Layers, ThumbsUp, CheckCircle, XCircle, FileQuestion } from "lucide-react";

export function QuizDesk() {
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [quizType, setQuizType] = useState<"mcq" | "tf" | "short">("mcq");
  
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Active Quiz State
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [userTypedAnswer, setUserTypedAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [answerRecord, setAnswerRecord] = useState<{ id: number; question: string; isCorrect: boolean; selected: string; correct: string; explanation: string }[]>([]);

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setQuiz(null);
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setUserTypedAnswer("");
    setRevealed(false);
    setScore(0);
    setCompleted(false);
    setAnswerRecord([]);

    try {
      const response = await fetch("/api/study/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          count: questionCount,
          type: quizType,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate practice questions.");
      }

      setQuiz(data);
    } catch (err: any) {
      setError(err.message || "Failed to communicate with test generator service.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (opt: string) => {
    if (revealed) return;
    setSelectedAnswer(opt);
  };

  const handleVerifyAnswer = () => {
    if (!quiz || revealed) return;

    const currentQ = quiz.questions[currentIdx];
    let isCorrect = false;

    if (quizType === "mcq") {
      if (!selectedAnswer) return;
      // Match correct answer
      isCorrect = selectedAnswer.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase() ||
                  selectedAnswer.trim().charAt(0).toLowerCase() === currentQ.correctAnswer.trim().charAt(0).toLowerCase();
      
      setAnswerRecord([
        ...answerRecord,
        {
          id: currentQ.id,
          question: currentQ.question,
          isCorrect,
          selected: selectedAnswer,
          correct: currentQ.correctAnswer,
          explanation: currentQ.explanation,
        },
      ]);
    } else if (quizType === "tf") {
      if (!selectedAnswer) return;
      isCorrect = selectedAnswer.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase();
      setAnswerRecord([
        ...answerRecord,
        {
          id: currentQ.id,
          question: currentQ.question,
          isCorrect,
          selected: selectedAnswer,
          correct: currentQ.correctAnswer,
          explanation: currentQ.explanation,
        },
      ]);
    } else {
      // Short answer is descriptive, we let student review and auto-assess or we check keywords
      isCorrect = userTypedAnswer.trim().toLowerCase() === currentQ.correctAnswer.trim().toLowerCase() || 
                  userTypedAnswer.trim().length > 3; // General typing is marked as attempted/reviewed
      
      setAnswerRecord([
        ...answerRecord,
        {
          id: currentQ.id,
          question: currentQ.question,
          isCorrect: true, // Marked as attempted
          selected: userTypedAnswer,
          correct: currentQ.correctAnswer,
          explanation: currentQ.explanation,
        },
      ]);
    }

    if (isCorrect) {
      setScore(score + 1);
    }
    setRevealed(true);
  };

  const handleGoNext = () => {
    if (!quiz) return;
    setSelectedAnswer(null);
    setUserTypedAnswer("");
    setRevealed(false);

    if (currentIdx + 1 < quiz.questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setCompleted(true);
    }
  };

  const handleRestart = () => {
    setQuiz(null);
    setTopic("");
    setCompleted(false);
    setError(null);
  };

  return (
    <div id="quiz-desk-root" className="flex flex-col h-full bg-linear-to-b from-slate-50 to-slate-100/50 p-6 rounded-2xl border border-slate-200">
      {/* Intro Header Options */}
      {!quiz && !loading && (
        <div className="max-w-xl mx-auto w-full my-auto py-8">
          <div className="text-center mb-8 select-none">
            <div className="mx-auto w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3 shadow-xs">
              <FileQuestion size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Practice Quiz Playground</h3>
            <p className="text-xs text-slate-500 mt-1">Challenge yourself with dynamic MCQ, T/F, & Short practice sets</p>
          </div>

          <div className="space-y-4 bg-white border border-slate-150 p-6 rounded-xl shadow-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase tracking-wider">
                Topic or Academic Material
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., DNA replication, SQL Joins, American Revolution..."
                className="w-full text-sm bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-800 rounded-lg px-3.5 py-2.5 outline-hidden border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase tracking-wider">
                  Test Format
                </label>
                <div className="grid grid-cols-3 gap-2 bg-slate-55 shadow-inner p-1 rounded-lg">
                  {(["mcq", "tf", "short"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setQuizType(t)}
                      className={`text-[10px] font-bold py-1.5 rounded-md uppercase tracking-wider transition-all cursor-pointer ${
                        quizType === t
                          ? "bg-white text-slate-850 shadow-xs border border-slate-150"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1.5 uppercase tracking-wider">
                  Question Count
                </label>
                <input
                  type="number"
                  min={3}
                  max={10}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full text-center text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg py-2.5 outline-hidden"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateQuiz}
              disabled={!topic.trim()}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all focus:ring-2 focus:ring-indigo-350 cursor-pointer ${
                topic.trim()
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer active:scale-98"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              <RefreshCw size={14} className="animate-pulse" />
              <span>Generate Practice Quiz (AI)</span>
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 shadow-sm">
              <AlertCircle size={16} className="text-rose-600 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-rose-800">Quiz Generation Failure</h4>
                <p className="text-[10px] text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading set screen */}
      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-inner mb-4 relative">
            <Layers size={36} className="text-indigo-600 animate-bounce" />
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">Synthesizing Smart Questions</h3>
          <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
            Using **gemini-3.5-flash** to compose questions, answers, and detailed revision notes. This may take up to 10 seconds.
          </p>
        </div>
      )}

      {/* Active Question Play Sheet */}
      {quiz && !completed && (
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-between py-2">
          {/* Top tracker bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-2.5">
              <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-bold">
                Topic: {quiz.title || topic}
              </span>
              <span className="font-mono">
                Progress: {currentIdx + 1} of {quiz.questions.length} Questions
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / quiz.questions.length) * 105}%` }}
              />
            </div>
          </div>

          {/* Active Question Box */}
          <div className="bg-white border border-slate-150 p-6 rounded-xl shadow-xs flex-1 flex flex-col justify-center my-2">
            <div className="flex items-start gap-3">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg font-mono text-xs font-bold leading-none select-none">
                Q{currentIdx + 1}
              </span>
              <h4 className="text-base font-semibold text-slate-800 leading-snug">
                {quiz.questions[currentIdx].question}
              </h4>
            </div>

            {/* Answer select block */}
            <div className="mt-8 space-y-3">
              {/* If MCQ */}
              {quizType === "mcq" && (
                <div className="grid grid-cols-1 gap-2.5">
                  {(quiz.questions[currentIdx].options || []).map((opt, i) => {
                    const isSelected = selectedAnswer === opt;
                    const isCorrectOption = opt.trim().toLowerCase() === quiz.questions[currentIdx].correctAnswer.trim().toLowerCase() ||
                                            opt.startsWith(quiz.questions[currentIdx].correctAnswer + " ");
                    const hasRevealedAndCorrect = revealed && isCorrectOption;
                    const hasRevealedAndWrong = revealed && isSelected && !isCorrectOption;

                    let btnClass = "border-slate-200 hover:bg-slate-50 text-slate-700 hover:border-slate-350 bg-slate-50/20";
                    if (isSelected && !revealed) {
                      btnClass = "border-indigo-600 bg-indigo-50/50 text-indigo-800";
                    } else if (hasRevealedAndCorrect) {
                      btnClass = "border-emerald-500 bg-emerald-50/50 text-emerald-800 font-medium";
                    } else if (hasRevealedAndWrong) {
                      btnClass = "border-rose-500 bg-rose-50/40 text-rose-800";
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectOption(opt)}
                        disabled={revealed}
                        className={`text-left px-4 py-3 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between ${btnClass} ${
                          revealed ? "cursor-default" : "cursor-pointer"
                        }`}
                      >
                        <span>{opt}</span>
                        {hasRevealedAndCorrect && <CheckCircle size={14} className="text-emerald-600 flex-none ml-2" />}
                        {hasRevealedAndWrong && <XCircle size={14} className="text-rose-600 flex-none ml-2" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* If True / False */}
              {quizType === "tf" && (
                <div className="grid grid-cols-2 gap-3">
                  {["True", "False"].map((opt) => {
                    const isSelected = selectedAnswer === opt;
                    const isCorrectOption = opt.toLowerCase() === quiz.questions[currentIdx].correctAnswer.trim().toLowerCase();
                    const hasRevealedAndCorrect = revealed && isCorrectOption;
                    const hasRevealedAndWrong = revealed && isSelected && !isCorrectOption;

                    let btnClass = "border-slate-200 hover:bg-slate-50 text-slate-700 bg-slate-50/20";
                    if (isSelected && !revealed) {
                      btnClass = "border-indigo-600 bg-indigo-50/50 text-indigo-800";
                    } else if (hasRevealedAndCorrect) {
                      btnClass = "border-emerald-500 bg-emerald-50/50 text-emerald-800 font-medium";
                    } else if (hasRevealedAndWrong) {
                      btnClass = "border-rose-500 bg-rose-50/40 text-rose-800";
                    }

                    return (
                      <button
                        key={opt}
                        onClick={() => handleSelectOption(opt)}
                        disabled={revealed}
                        className={`text-center py-4 rounded-xl border text-sm transition-all font-semibold flex items-center justify-center gap-1.5 ${btnClass} ${
                          revealed ? "cursor-default" : "cursor-pointer"
                        }`}
                      >
                        {opt}
                        {hasRevealedAndCorrect && <CheckCircle size={14} className="text-emerald-600" />}
                        {hasRevealedAndWrong && <XCircle size={14} className="text-rose-600" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* If Short Answer */}
              {quizType === "short" && (
                <div className="flex flex-col space-y-3">
                  <textarea
                    value={userTypedAnswer}
                    onChange={(e) => setUserTypedAnswer(e.target.value)}
                    disabled={revealed}
                    placeholder="Type your concise guess/definition here. StudyMate will grade your attempt & disclose the model solution immediately."
                    rows={3}
                    className="w-full text-sm hover:bg-slate-50/55 focus:bg-white text-slate-700 rounded-lg p-3 outline-hidden border border-slate-250 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium resize-none leading-relaxed"
                  />
                  {revealed && (
                    <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-xl">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                        Instructor Ideal Answer:
                      </span>
                      <p className="text-xs font-semibold text-emerald-950 font-mono leading-relaxed select-all">
                        {quiz.questions[currentIdx].correctAnswer}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Answer Verification Notes feedback */}
            {revealed && (
              <div className="mt-6 p-4.5 bg-slate-50 border border-slate-150 rounded-xl leading-relaxed">
                <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest flex items-center gap-1 mb-1.5 select-none">
                  <HelpCircle size={11} /> Educational Notes:
                </p>
                <p className="text-xs text-slate-650 font-medium">
                  {quiz.questions[currentIdx].explanation}
                </p>
                <p className="text-[10px] text-slate-400 mt-2 italic font-medium select-none">
                  StudyMate Encouragement: Test and modify your answers often to lock key concepts into memory.
                </p>
              </div>
            )}
          </div>

          {/* Action trigger footer */}
          <div className="mt-4 flex justify-end gap-3 select-none">
            {!revealed ? (
              <button
                onClick={handleVerifyAnswer}
                disabled={quizType !== "short" && !selectedAnswer}
                className={`flex items-center gap-1.5 px-6 py-3 rounded-lg text-xs font-bold uppercase transition-all tracking-wider cursor-pointer ${
                  quizType === "short" || selectedAnswer
                    ? "bg-slate-850 hover:bg-slate-950 text-white shadow hover:scale-[1.02] active:scale-95"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <span>Verify Answer</span>
              </button>
            ) : (
              <button
                onClick={handleGoNext}
                className="flex items-center gap-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <span>
                  {currentIdx + 1 === quiz.questions.length ? "Finish Test / View Grade" : "Next Question"}
                </span>
                <ChevronRight size={13} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Completed Set Scoring Screen */}
      {completed && quiz && (
        <div className="max-w-lg mx-auto w-full my-auto py-8">
          <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xs relative p-6 text-center select-none">
            {/* Background trophy sparkle */}
            <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <Award size={32} className="animate-bounce" />
            </div>

            <h3 className="text-lg font-bold text-slate-850">Quiz Session Complete!</h3>
            <p className="text-xs text-slate-500 mt-1">Outstanding preparation effort. Review your metrics below:</p>

            {/* Scorecard grids */}
            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Final Score</span>
                <span className="block text-3xl font-extrabold text-slate-850 mt-1">
                  {score} / {quiz.questions.length}
                </span>
                <span className="block text-[10px] text-indigo-600 font-semibold mt-1">
                  {Math.round((score / quiz.questions.length) * 100)}% Accuracy
                </span>
              </div>

              <div className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl flex flex-col justify-center">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skill Level Rating</span>
                <span className="block text-sm font-bold text-emerald-700 mt-1.5 flex items-center justify-center gap-1">
                  <ThumbsUp size={13} />
                  {score === quiz.questions.length ? "Prestige Mastery 🌟" : score >= 3 ? "Highly Promising 📈" : "Revision Advised 📚"}
                </span>
              </div>
            </div>

            {/* Questions review sheet */}
            <div className="text-left border border-slate-100 rounded-lg mb-6 overflow-hidden max-h-[220px] overflow-y-auto">
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Interactive Breakdown</span>
              </div>
              <div className="divide-y divide-slate-100">
                {answerRecord.map((item, id) => (
                  <div key={id} className="p-3 text-xs flex items-start gap-2 bg-slate-50/20">
                    <span className="mt-0.5">
                      {item.isCorrect ? <CheckCircle size={12} className="text-emerald-500" /> : <XCircle size={12} className="text-rose-500" />}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-755 leading-tight">{item.question}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">
                        You chose: <span className="text-slate-600 italic font-bold">{item.selected || "descriptive typed answer"}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
            >
              Start New Practice Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
