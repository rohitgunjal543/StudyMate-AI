import { useState, useEffect, useRef } from "react";
import { Message } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { Send, Sparkles, Trash2, ArrowRight, BookOpen, AlertCircle, RefreshCw } from "lucide-react";

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

// Suggested Prompts (Removed as requested)
  
  // Load chat history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("studymate_chat_history");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved chat history", e);
      }
    } else {
      // Set a friendly initial welcome message
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Welcome! I am StudyMate AI, your dedicated personal tutor.",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, []);

  // Save chat history to localStorage
  const saveHistory = (newMessages: Message[]) => {
    setMessages(newMessages);
    localStorage.setItem("studymate_chat_history", JSON.stringify(newMessages));
  };

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setError(null);
    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    saveHistory(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/study/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch response from Express endpoint");
      }

      const assistantMsg: Message = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: data.text || "I was unable to formulate a response. Please try rewriting your request.",
        timestamp: new Date().toISOString(),
      };

      saveHistory([...updatedMessages, assistantMsg]);
    } catch (err: any) {
      setError(err.message || "Network request failed. Is the backend server running?");
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    const initialWelcome: Message[] = [
      {
        id: "welcome",
        role: "assistant",
        content: "Chat history cleared! Welcome back. What are we studying today?",
        timestamp: new Date().toISOString(),
      },
    ];
    saveHistory(initialWelcome);
    setError(null);
  };

  return (
    <div id="ai-chat-root" className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              StudyMate AI Tutor
            </h2>
            <p className="text-xs text-slate-500">Guided concept learning & code explanation</p>
          </div>
        </div>

        {messages.length > 1 && (
          <div className="flex items-center gap-2">
            {showClearConfirm ? (
              <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg animate-fade-in shrink-0">
                <span className="text-[11px] text-rose-700 font-bold select-none">Sure?</span>
                <button
                  onClick={() => {
                    handleClearHistory();
                    setShowClearConfirm(false);
                  }}
                  className="px-2 py-0.5 text-[10px] font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2 py-0.5 text-[10px] font-extrabold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
                >
                  Keep
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-650 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Clear Chat History"
              >
                <Trash2 size={13} />
                <span>Clear History</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Messages Panel */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((msg) => {
          if (msg.id === "welcome") {
            const suggestionPrompts = [
              {
                id: "prompt-explain",
                icon: "🧠",
                label: "Simplify a Concept",
                desc: "Explain photosynthesis like I'm 10 years old",
                prompt: "Can you explain photosynthesis in really simple terms, using an easy-to-understand analogy?"
              },
              {
                id: "prompt-schedule",
                icon: "📅",
                label: "Exam Buddy",
                desc: "5-day study plan for history exam",
                prompt: "Help me create a friendly 5-day study plan for an upcoming history exam."
              },
              {
                id: "prompt-quiz",
                icon: "📝",
                label: "Syllabus Hack",
                desc: "Active recall study cheat-sheet",
                prompt: "What are some highly effective active recall questions or study hacks you recommend for revision?"
              },
              {
                id: "prompt-debug",
                icon: "💻",
                label: "TypeScript Guide",
                desc: "Explain Binary Search cleanly",
                prompt: "Show me a clean implementation of binary search in TypeScript with friendly step-by-step comments."
              }
            ];

            return (
              <div key={msg.id} id="welcome-splash" className="w-full max-w-2xl mx-auto py-6 px-2 select-none">
                {/* Greeting Hero Card */}
                <div id="welcome-card-body" className="bg-white border border-indigo-100 rounded-3xl p-8 shadow-xs text-center relative overflow-hidden mb-8">
                  {/* Subtle decorative background glow */}
                  <div className="absolute top-0 left-1/4 w-48 h-48 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />

                  {/* Icon */}
                  <div className="w-14 h-14 bg-linear-to-tr from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md shadow-indigo-100 animate-bounce">
                    <Sparkles size={24} />
                  </div>

                  {/* Bold Headline */}
                  <h3 className="text-xl font-extrabold text-slate-800 tracking-tight sm:text-2xl">
                    Hey there! Let's learn together. ✨
                  </h3>

                  {/* Warm, Student-Friendly Subtext */}
                  <p className="text-sm text-slate-600 mt-3 max-w-md mx-auto leading-relaxed">
                    I am <span className="font-bold text-indigo-600">StudyMate</span>, your interactive AI learning buddy. Ask me to break down complex topics, write code, plan your school schedule, or test your skills!
                  </p>
                </div>

                {/* Suggestions Label */}
                <div className="flex items-center gap-2 mb-4 px-2">
                  <span className="text-xs uppercase tracking-wider font-extrabold text-slate-450">
                    💡 Tap a quick-start helper to try:
                  </span>
                </div>

                {/* Grid layout of interactive option cards */}
                <div id="welcome-suggestions-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestionPrompts.map((item) => (
                    <button
                      key={item.id}
                      id={item.id}
                      onClick={() => setInput(item.prompt)}
                      className="text-left bg-white hover:bg-indigo-50/30 active:scale-[0.98] border border-slate-200 hover:border-indigo-200 p-4 rounded-2xl shadow-xs transition-all duration-200 group cursor-pointer"
                    >
                      <div className="flex gap-3.5">
                        <span className="text-2xl shrink-0 select-none group-hover:scale-110 transition-transform">
                          {item.icon}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                            {item.label}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          }
          return (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {/* AI Avatar */}
              {msg.role === "assistant" && (
                <div className="flex-none w-8 h-8 rounded-full bg-linear-to-tr from-indigo-500 to-purple-600 font-bold text-white text-xs flex items-center justify-center shadow-sm select-none">
                  SM
                </div>
              )}

              {/* Bubble */}
              <div
                className={`max-w-(--breakpoint-md) rounded-2xl px-5 py-4 shadow-xs border ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white border-indigo-700 rounded-br-none"
                    : "bg-white border-slate-200 rounded-bl-none text-slate-800"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose max-w-none text-slate-800">
                    <MarkdownRenderer text={msg.content} />
                  </div>
                )}
                <span
                  className={`block text-[10px] mt-2.5 ${
                    msg.role === "user" ? "text-indigo-200 text-right" : "text-slate-500"
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              {/* User Avatar */}
              {msg.role === "user" && (
                <div className="flex-none w-8 h-8 rounded-full bg-slate-200 font-bold text-slate-600 text-xs flex items-center justify-center select-none">
                  U
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-4 justify-start">
            <div className="flex-none w-8 h-8 rounded-full bg-linear-to-tr from-indigo-500 to-purple-600 font-bold text-white text-xs flex items-center justify-center animate-bounce">
              ...
            </div>
            <div className="max-w-md rounded-2xl px-5 py-4 bg-white border border-slate-200 rounded-bl-none shadow-xs flex items-center gap-3">
              <RefreshCw size={14} className="animate-spin text-indigo-500" />
              <span className="text-xs text-slate-500 font-medium">StudyMate is drafting response...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-rose-600 flex-none mt-0.5" size={18} />
            <div>
              <h4 className="text-sm font-semibold text-rose-800">Tutoring Service Error</h4>
              <p className="text-xs text-rose-700 mt-1">{error}</p>
              <button
                onClick={() => handleSendMessage(messages[messages.length - 1]?.content || "")}
                className="mt-2 flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
              >
                <RefreshCw size={11} /> Retry prompt
              </button>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(input);
              }
            }}
            placeholder="Ask StudyMate anything (e.g. explain a concept, find bugs in code, plan exam revision)..."
            rows={1}
            className="flex-1 resize-none bg-slate-100 hover:bg-slate-150/50 focus:bg-white text-slate-800 placeholder-slate-400 text-sm rounded-xl px-4 py-3 outline-hidden border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all min-h-[44px] max-h-[120px]"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`p-3 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              input.trim() && !loading
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
