import { useState, useEffect } from "react";
import { TabType, Flashcard } from "./types";
import { AIChat } from "./components/AIChat";
import { NoteSummarizer } from "./components/NoteSummarizer";
import { QuizDesk } from "./components/QuizDesk";
import { RoadmapPlanner } from "./components/RoadmapPlanner";
import { PomodoroDesk } from "./components/PomodoroDesk";
import { FlashcardDesk } from "./components/FlashcardDesk";
import { 
  Sparkles, 
  FileText, 
  FileQuestion, 
  Clock, 
  Compass, 
  Layers, 
  GraduationCap, 
  BookOpen, 
  Heart,
  User,
  Coffee,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Menu,
  X
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Random motivational quotes for student encouragement
  const quotes = [
    "The secret to getting ahead is getting started.",
    "Active recall is 10x more effective than passive reading. Test yourself often!",
    "Remember to drink water and take 5-minute stretching breaks.",
    "Progress is progress, no matter how small. Keep pushing!",
    "Focus is a muscle. The more you use it, the stronger it gets."
  ];
  const [quoteIdx, setQuoteIdx] = useState(0);

  // Rotate motivation quote every 20 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIdx((prev) => (prev + 1) % quotes.length);
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  // Initialize saved flashcards or load standard tutorial decks
  useEffect(() => {
    const saved = localStorage.getItem("studymate_saved_flashcards");
    if (saved) {
      try {
        setFlashcards(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved flashcards", e);
      }
    } else {
      const defaultDecks: Flashcard[] = [
        {
          id: "tip-1",
          front: "What is Active Recall?",
          back: "Triggering our memory to retrieve learned information without cues. It forces neural pathways to strengthen, making flashcards or self-quizzing 10x more effective than passive textbook reading.",
          topic: "Study Skills",
          box: 1
        },
        {
          id: "tip-2",
          front: "What is Spaced Repetition?",
          back: "Reviewing concepts at increasingly spaced intervals (e.g. 1 day, 3 days, 7 days) to intercept the 'Forgetting Curve' and lock core facts into long-term memory.",
          topic: "Study Skills",
          box: 1
        },
        {
          id: "tip-3",
          front: "How does the Leitner Leitner System optimize study?",
          back: "It divides flashcards into boxes. Cards you get correct move to higher boxes (studied less frequent), while incorrect cards reset to Box 1 (studied every day).",
          topic: "Methodology",
          box: 1
        }
      ];
      setFlashcards(defaultDecks);
      localStorage.setItem("studymate_saved_flashcards", JSON.stringify(defaultDecks));
    }
  }, []);

  const handleAddFlashcardsFromNotes = (newCards: Flashcard[]) => {
    const updated = [...newCards, ...flashcards];
    setFlashcards(updated);
    localStorage.setItem("studymate_saved_flashcards", JSON.stringify(updated));
  };

  const navItems = [
    { id: "chat" as TabType, label: "AI Tutor Chat", desc: "Guided learning & concept breakdowns", icon: Sparkles, color: "text-indigo-650 bg-indigo-50" },
    { id: "summarizer" as TabType, label: "Review Notes Summarizer", desc: "Squeeze textbooks into key matrices", icon: FileText, color: "text-emerald-600 bg-emerald-50" },
    { id: "roadmap" as TabType, label: "Syllabus Roadmaps", desc: "Milestone schedule planners", icon: Compass, color: "text-amber-605 bg-amber-50" },
    { id: "quiz" as TabType, label: "Practice Quiz Playground", desc: "Generate educational MCQs & TF sets", icon: FileQuestion, color: "text-sky-600 bg-sky-50" },
    { id: "flashcards" as TabType, label: "Active Recall Decks", desc: "Flippable active memory trainers", icon: Layers, color: "text-purple-600 bg-purple-50" },
    { id: "pomodoro" as TabType, label: "Focus Work Desk", desc: "Pomodoro clock & Eisenhower grid", icon: Clock, color: "text-rose-600 bg-rose-50" },
  ];

  return (
    <div id="studymate-root" className="h-screen w-full overflow-hidden bg-slate-50 flex flex-col md:flex-row antialiased text-slate-800">
      
      {/* A. Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 text-slate-100 px-5 py-3 shrink-0 select-none border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-650 rounded-lg">
            <GraduationCap size={18} className="animate-pulse" />
          </div>
          <span className="text-sm font-extrabold tracking-tight">StudyMate AI</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Toggle nav menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* B. Dark mobile background overlay */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)} 
          className="md:hidden fixed inset-0 bg-black/50 z-20 transition-opacity" 
        />
      )}

      {/* 1. Left Nav Sidebar Pane (Responsive Drawer + Collapsible Desktop Sidebar) */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-30 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 p-4 shadow-xl shrink-0 h-screen overflow-hidden transition-all duration-300 ease-in-out ${
        mobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0 md:flex"
      } ${
        isSidebarExpanded ? "md:w-72" : "md:w-20"
      }`}>
        {/* Section 1: Brand / Logo section with desktop toggle */}
        <div className={`flex select-none mb-6 shrink-0 ${
          isSidebarExpanded || mobileMenuOpen ? "flex-row items-center justify-between" : "flex-col items-center justify-center gap-4"
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-650 text-white rounded-xl shadow-md flex items-center justify-center shrink-0">
              <GraduationCap size={20} className="animate-pulse" />
            </div>
            {(isSidebarExpanded || mobileMenuOpen) && (
              <div className="transition-opacity duration-300 whitespace-nowrap">
                <h1 className="text-sm font-extrabold text-white tracking-tight leading-none">
                  StudyMate AI
                </h1>
                <p className="text-[9px] text-slate-405 font-bold tracking-widest uppercase mt-1">
                  Refined Tutor Suite
                </p>
              </div>
            )}
          </div>
          
          {/* Desktop Expansion Toggle Icon */}
          <button 
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="hidden md:flex items-center justify-center p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/60 border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
            title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarExpanded ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
          </button>
        </div>

        {/* Section 2: Workspaces list navigation (scrolls if content overflows) */}
        <nav className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-1.5 pr-1 select-none">
          {/* Short motivational sentence badge - shown only in expanded states */}
          {(isSidebarExpanded || mobileMenuOpen) && (
            <div className="bg-indigo-950/45 border border-indigo-900/30 p-3 rounded-xl text-[10px] text-indigo-350 leading-normal flex gap-2 items-start mb-4 select-none font-medium text-left">
              <Heart size={13} className="shrink-0 mt-0.5 text-indigo-400 animate-pulse" />
              <p className="line-clamp-3">{quotes[quoteIdx]}</p>
            </div>
          )}

          {(isSidebarExpanded || mobileMenuOpen) && (
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 mb-2 block select-none px-2 shrink-0">
              Workspaces
            </span>
          )}
          {navItems.map((item) => {
            const isSelected = activeTab === item.id;
            const IconComp = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`relative w-full transition-all flex items-center group cursor-pointer ${
                  isSidebarExpanded || mobileMenuOpen ? "px-3 py-2.5 gap-3 rounded-xl justify-start" : "px-1 py-1.5 rounded-lg justify-center"
                } ${
                  isSelected
                    ? "bg-slate-800 text-white font-bold border border-slate-700/60 shadow-lg scale-[1.01]"
                    : "hover:bg-slate-800/40 hover:text-slate-200 text-slate-400 border border-transparent"
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 flex items-center justify-center ${
                  isSelected ? "bg-indigo-650 text-white" : "bg-slate-800 text-slate-450 group-hover:bg-slate-600"
                }`}>
                  <IconComp size={15} />
                </div>
                {(isSidebarExpanded || mobileMenuOpen) && (
                  <div className="leading-tight transition-all duration-300">
                    <span className="text-xs font-semibold block text-slate-200">{item.label}</span>
                    <span className="text-[9px] text-slate-500 font-medium block truncate max-w-[170px]">{item.desc}</span>
                  </div>
                )}

                {/* Collapsed state item tooltip */}
                {!isSidebarExpanded && !mobileMenuOpen && (
                  <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-950 text-white text-[10px] font-bold rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-slate-800">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Section 3: Quick status bar credit & profile */}
        <div className={`pt-4 border-t border-slate-800 flex flex-col gap-3 font-medium shrink-0 ${
          isSidebarExpanded || mobileMenuOpen ? "items-start w-full" : "items-center justify-center w-full"
        }`}>
          <div className="flex items-center gap-2 text-xs select-none max-w-full">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-705 flex items-center justify-center text-slate-300 shrink-0 font-bold" title="rohitgunjal543@gmail.com">
              <User size={14} className="text-indigo-400" />
            </div>
            {(isSidebarExpanded || mobileMenuOpen) && (
              <span className="text-slate-300 font-semibold truncate text-[11px] transition-opacity duration-300" title="rohitgunjal543@gmail.com">
                rohitgunjal543@gmail.com
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[10px] select-none text-emerald-450 font-bold tracking-tight max-w-full">
            <div className="relative flex h-1.5 w-1.5 shrink-0 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </div>
            {(isSidebarExpanded || mobileMenuOpen) && (
              <span className="transition-opacity duration-300 truncate">BACKEND LIVE</span>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Main Workspace layout Frame */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top welcome status bar */}
        <div className="bg-white border-b border-slate-200 px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-indigo-600" />
            <span className="text-xs font-semibold text-slate-500">
              {activeTab === "chat" && "Concept Lesson Sandbox"}
              {activeTab === "summarizer" && "Takeaway Synthesizer"}
              {activeTab === "quiz" && "Knowledge Diagnostic Game"}
              {activeTab === "roadmap" && "Dynamic Curriculum Builder"}
              {activeTab === "pomodoro" && "Focus Desk & Eisenhower Matrix"}
              {activeTab === "flashcards" && "Leitner Active Recall System"}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400 font-bold">
            <span className="flex items-center gap-1 text-slate-450 font-sans">
              <Coffee size={13} className="text-indigo-550 animate-bounce" /> Learn Smarter. Stay Productive.
            </span>
          </div>
        </div>

        {/* Core dynamic body mount area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          {activeTab === "chat" && <AIChat />}
          {activeTab === "summarizer" && (
            <NoteSummarizer
              onAddFlashcards={handleAddFlashcardsFromNotes}
              onNavigateToFlashcards={() => setActiveTab("flashcards")}
            />
          )}
          {activeTab === "quiz" && <QuizDesk />}
          {activeTab === "roadmap" && <RoadmapPlanner />}
          {activeTab === "pomodoro" && <PomodoroDesk />}
          {activeTab === "flashcards" && (
            <FlashcardDesk flashcards={flashcards} onSetFlashcards={setFlashcards} />
          )}
        </div>
      </main>
    </div>
  );
}
