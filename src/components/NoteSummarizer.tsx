import React, { useState, useRef } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { FileText, ArrowRight, Table, Copy, BookOpen, AlertCircle, RefreshCw, Upload, Sparkles, Check } from "lucide-react";
import { Flashcard } from "../types";

interface NoteSummarizerProps {
  onAddFlashcards: (cards: Flashcard[]) => void;
  onNavigateToFlashcards: () => void;
}

export function NoteSummarizer({ onAddFlashcards, onNavigateToFlashcards }: NoteSummarizerProps) {
  const [inputText, setInputText] = useState("");
  const [summaryFormat, setSummaryFormat] = useState("bullet points");
  const [summaryDepth, setSummaryDepth] = useState("standard review focus");
  const [loading, setLoading] = useState(false);
  const [summarizedText, setSummarizedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [flashCardStatus, setFlashCardStatus] = useState<"idle" | "creating" | "created">("idle");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formats = [
    { value: "bullet points", label: "Bullet Points" },
    { value: "condensed outline", label: "Condensed Outline" },
    { value: "Q&A study guide style", label: "Q&A Study Guide" },
    { value: "concept glossary", label: "Concept Glossary Table" },
  ];

  const depths = [
    { value: "concise short highlight focus", label: "Short & Concentrated" },
    { value: "standard review focus", label: "Standard Review Depth" },
    { value: "extremely detailed comprehensive guide", label: "In-depth Mastery Sheet" },
  ];

  const handleSummarize = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);
    setFlashCardStatus("idle");

    try {
      const response = await fetch("/api/study/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          format: summaryFormat,
          depth: summaryDepth,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate notes summary.");
      }

      setSummarizedText(data.text || "");
    } catch (err: any) {
      setError(err.message || "Something went wrong during note summarization.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopySummary = () => {
    if (!summarizedText) return;
    navigator.clipboard.writeText(summarizedText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Convert Summarized Text to Flashcards using AI endpoint /api/study/quiz
  const handleConvertToFlashcards = async () => {
    if (!summarizedText) return;
    setFlashCardStatus("creating");
    setError(null);

    try {
      // Use the quiz generator backend API to generate cards
      const response = await fetch("/api/study/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: `Generate study flashcards from these summarized notes. Make simple front (term/question) and back (definition/answer) definitions: ${summarizedText.slice(0, 4000)}`,
          count: 5,
          type: "mcq", // We parse MCQ correctAnswers as flashcard answers!
        }),
      });

      const quizData = await response.json();
      if (!response.ok) {
        throw new Error(quizData.error || "Failed to auto-generate flashcards.");
      }

      const generatedCards: Flashcard[] = (quizData.questions || []).map((q: any) => ({
        id: Math.random().toString(36).substring(7),
        front: q.question,
        back: q.correctAnswer + ". " + q.explanation,
        topic: quizData.title || "Note Import",
        box: 1,
      }));

      onAddFlashcards(generatedCards);
      setFlashCardStatus("created");
    } catch (err: any) {
      console.error(err);
      setError("Failed to convert notes to flashcards. You can try again or copy the content.");
      setFlashCardStatus("idle");
    }
  };

  // Drag and Drop files
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    if (file.type !== "text/plain" && !file.name.endsWith(".txt") && !file.name.endsWith(".md")) {
      setError("Only plain text files (.txt or .md) are supported for direct drag upload.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        setInputText(text);
        setError(null);
      }
    };
    reader.onerror = () => {
      setError("Could not read file cleanly.");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div id="note-summarizer-root" className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full items-stretch">
      {/* Input Side panel */}
      <div className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Review Notes Material</h2>
              <p className="text-xs text-slate-500">Paste material or drag file to generate revision outlines</p>
            </div>
          </div>
        </div>

        {/* Input Text Area / Drag and Drop Box */}
        <div className="flex-1 p-6 flex flex-col space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`relative flex-1 rounded-xl border-2 border-dashed flex flex-col p-4 transition-all min-h-[220px] ${
              dragActive
                ? "border-indigo-500 bg-indigo-50/50"
                : inputText
                ? "border-slate-300 bg-slate-50/20"
                : "border-slate-200 bg-slate-50 hover:bg-slate-100/50"
            }`}
          >
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your medical, legal, engineering, history or programming notes here, or drop a textbook .txt file to let StudyMate summarize it cleanly..."
              className="w-full flex-1 resize-none bg-transparent outline-hidden border-0 text-sm text-slate-700 placeholder-slate-400 focus:ring-0 leading-relaxed"
            />

            {!inputText && (
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-center pointer-events-none select-none">
                <Upload size={32} className="text-slate-400 mb-2 animate-bounce" />
                <span className="text-xs font-semibold text-slate-600">Drag & Drop Note File Here</span>
                <span className="text-[10px] text-slate-400 mt-1">Accepts plain text file uploads (.txt / .md)</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="pointer-events-auto mt-3 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium text-xs transition-colors cursor-pointer"
                >
                  Or Select File Manually
                </button>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".txt,.md"
            />
          </div>

          {/* Configuration Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                Summary Format
              </label>
              <div className="relative">
                <select
                  value={summaryFormat}
                  onChange={(e) => setSummaryFormat(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-hidden"
                >
                  {formats.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                Summary Depth
              </label>
              <select
                value={summaryDepth}
                onChange={(e) => setSummaryDepth(e.target.value)}
                className="w-full text-xs font-medium bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-hidden"
              >
                {depths.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSummarize}
            disabled={!inputText.trim() || loading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all focus:ring-2 focus:ring-indigo-300 cursor-pointer ${
              inputText.trim() && !loading
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-98"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Analysing Note Material...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>StudyMate Summarize</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Side panel */}
      <div className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Table size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Generated Revision Sheet</h2>
              <p className="text-xs text-slate-500">Concise takeaways and definition glossary ready for study</p>
            </div>
          </div>

          {summarizedText && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                title="Copy full summary"
              >
                {isCopied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{isCopied ? "Copied" : "Copy"}</span>
              </button>

              <button
                onClick={handleConvertToFlashcards}
                disabled={flashCardStatus === "creating"}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  flashCardStatus === "created"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-250 cursor-default"
                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100"
                }`}
              >
                <BookOpen size={13} />
                <span>
                  {flashCardStatus === "idle" && "Create Flashcards"}
                  {flashCardStatus === "creating" && "Creating... (Gemini)"}
                  {flashCardStatus === "created" && "Cards Saved ✅"}
                </span>
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
          {summarizedText ? (
            <div className="prose max-w-none text-slate-700 bg-white border border-slate-150 p-6 rounded-xl shadow-xs">
              <MarkdownRenderer text={summarizedText} />
              
              {flashCardStatus === "created" && (
                <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                  <Check className="text-emerald-600 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-800">StudyMate Flashcards Ready!</h4>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      We parsed your summary notes and dynamically generated active recall flashcards in the cards desk.
                    </p>
                    <button
                      onClick={onNavigateToFlashcards}
                      className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:underline cursor-pointer"
                    >
                      Go to Flashcard Practice <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <BookOpen size={40} className="text-slate-300 mb-2.5" />
              <p className="text-xs font-semibold text-slate-600">Pending Revision Outline</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                Once notes material is provided in the left panel, StudyMate will construct organized study aids here.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5">
              <AlertCircle size={16} className="text-rose-600 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-rose-800">Outlining Service Error</h4>
                <p className="text-[10px] text-rose-700 mt-0.5">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
