import React, { useState, useEffect } from "react";
import { Flashcard } from "../types";
import { BookOpen, Plus, Trash2, ArrowRight, BookMarked, Layers, HelpCircle, RefreshCw, Layers3, Check, RotateCcw } from "lucide-react";

interface FlashcardDeskProps {
  flashcards: Flashcard[];
  onSetFlashcards: (cards: Flashcard[]) => void;
}

export function FlashcardDesk({ flashcards, onSetFlashcards }: FlashcardDeskProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filterTopic, setFilterTopic] = useState("all");
  const [filterBox, setFilterBox] = useState<number | "all">("all");

  // New Card State
  const [newFront, setNewFront] = useState("");
  const [newBack, setNewBack] = useState("");
  const [newTopic, setNewTopic] = useState("");

  // Save changes to localStorage helper
  const saveCards = (updated: Flashcard[]) => {
    onSetFlashcards(updated);
    localStorage.setItem("studymate_saved_flashcards", JSON.stringify(updated));
  };


  const handleAddCustomCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    const added: Flashcard = {
      id: Math.random().toString(36).substring(7),
      front: newFront.trim(),
      back: newBack.trim(),
      topic: newTopic.trim() || "General",
      box: 1, // Start in box 1 (Needs Revision)
    };

    saveCards([...flashcards, added]);
    setNewFront("");
    setNewBack("");
    setNewTopic("");
  };

  const handleDeleteCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = flashcards.filter((c) => c.id !== id);
    saveCards(updated);
    if (activeIdx >= updated.length) {
      setActiveIdx(Math.max(0, updated.length - 1));
    }
    setIsFlipped(false);
  };

  const handleLeitnerProgress = (id: string, success: boolean) => {
    const updated = flashcards.map((c) => {
      if (c.id === id) {
        // Leitner Leitner system: success advances cargo boxes, failure drops it to box 1
        let nextBox = c.box;
        if (success) {
          nextBox = Math.min(c.box + 1, 3);
        } else {
          nextBox = 1;
        }
        return { ...c, box: nextBox };
      }
      return c;
    });

    saveCards(updated);
    setIsFlipped(false);

    // Increment index to next card
    if (activeIdx + 1 < filteredCards.length) {
      setActiveIdx(activeIdx + 1);
    } else {
      setActiveIdx(0);
    }
  };

  const handleResetBoxes = () => {
    const updated = flashcards.map((c) => ({ ...c, box: 1 }));
    saveCards(updated);
    setActiveIdx(0);
    setIsFlipped(false);
  };

  // Get distinct topics list for filter
  const topicsList = ["all", ...Array.from(new Set(flashcards.map((c) => c.topic)))];

  // Apply dual Filters
  const filteredCards = flashcards.filter((c) => {
    const matchTopic = filterTopic === "all" || c.topic === filterTopic;
    const matchBox = filterBox === "all" || c.box === Number(filterBox);
    return matchTopic && matchBox;
  });

  const activeCard = filteredCards[activeIdx];

  return (
    <div id="flashcard-desk-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
      {/* Settings Panel & Creator (5 Cols) */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-2 select-none">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Layers size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Leitner Flashcard Desk</h2>
            <p className="text-xs text-slate-500">Add manual decks and test active recall cycles</p>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Dual Filtering controllers */}
        <div className="space-y-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Deck Filters</span>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-slate-500 mb-1 font-semibold">Subject Topic</label>
              <select
                value={filterTopic}
                onChange={(e) => {
                  setFilterTopic(e.target.value);
                  setActiveIdx(0);
                  setIsFlipped(false);
                }}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-205 rounded-lg px-2.5 py-2 text-slate-700 outline-hidden focus:bg-white"
              >
                {topicsList.map((t) => (
                  <option key={t} value={t}>
                    {t === "all" ? "📚 All Subjects" : t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 mb-1 font-semibold">Leitner Box</label>
              <select
                value={filterBox}
                onChange={(e) => {
                  setFilterBox(e.target.value as any);
                  setActiveIdx(0);
                  setIsFlipped(false);
                }}
                className="w-full text-xs font-semibold bg-slate-50 border border-slate-205 rounded-lg px-2.5 py-2 text-slate-700 outline-hidden focus:bg-white"
              >
                <option value="all">📥 All Boxes</option>
                <option value="1">Box 1: Needs Practice</option>
                <option value="2">Box 2: Familiar</option>
                <option value="3">Box 3: Mastered</option>
              </select>
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Add manual card */}
        <form onSubmit={handleAddCustomCard} className="space-y-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Create Custom Card</span>
          
          <input
            type="text"
            value={newFront}
            onChange={(e) => setNewFront(e.target.value)}
            placeholder="Front (Concept/Question)"
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-hidden focus:bg-white"
          />

          <input
            type="text"
            value={newBack}
            onChange={(e) => setNewBack(e.target.value)}
            placeholder="Back (Definition/Chime Answer)"
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-hidden focus:bg-white"
          />

          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            placeholder="Subject Tag (e.g. History, Math)"
            className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 outline-hidden focus:bg-white"
          />

          <button
            type="submit"
            disabled={!newFront.trim() || !newBack.trim()}
            className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all tracking-wider uppercase flex items-center justify-center gap-1 cursor-pointer ${
              newFront.trim() && newBack.trim()
                ? "bg-slate-800 hover:bg-slate-900 text-white shadow"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Plus size={13} /> Inject Flashcard
          </button>
        </form>

        {flashcards.length > 0 && (
          <button
            onClick={handleResetBoxes}
            className="w-full py-2 text-[10px] font-bold text-indigo-750 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100/50 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
          >
            <RotateCcw size={12} /> Reset Leitner boxes back to Box 1
          </button>
        )}
      </div>

      {/* Main Flashcard Interactive Play Panel (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col items-center">
        {filteredCards.length > 0 && activeCard ? (
          <div className="w-full flex flex-col items-center select-none">
            {/* Tag metadata row */}
            <div className="w-full flex justify-between items-center text-xs text-slate-400 font-medium mb-3 px-1">
              <span className="flex items-center gap-1 text-[11px] font-bold">
                <BookMarked size={12} className="text-indigo-600" /> {activeCard.topic}
              </span>
              <span className="font-mono text-slate-500">
                Card {activeIdx + 1} of {filteredCards.length}
              </span>
            </div>

            {/* Leitner Box indicator */}
            <div className="flex items-center gap-1.5 mb-4 bg-slate-100 border border-slate-150 px-3 py-1 rounded-full text-[10px] font-bold">
              <Layers3 size={11} className="text-indigo-650" />
              <span>Box {activeCard.box}: </span>
              <span className={activeCard.box === 3 ? "text-emerald-600" : activeCard.box === 2 ? "text-indigo-650" : "text-rose-600"}>
                {activeCard.box === 1 && "Practice Needed"}
                {activeCard.box === 2 && "Familiar"}
                {activeCard.box === 3 && "Mastered!"}
              </span>
            </div>

            {/* Flippable 3D Visual Card Box */}
            <div
              className="relative w-full h-64 [perspective:1000px] cursor-pointer active:scale-99 transition-all"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div
                className={`relative w-full h-full duration-550 [transform-style:preserve-3d] transition-transform ${
                  isFlipped ? "[transform:rotateY(180deg)]" : ""
                }`}
              >
                {/* 1. FRONT SIDE CARD */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-white border border-slate-205 rounded-2xl flex flex-col p-6 shadow-md shadow-slate-100 border-b-4 border-b-indigo-500">
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      Concept Question
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 text-center leading-relaxed">
                      {activeCard.front}
                    </h3>
                  </div>
                  <div className="text-[10px] text-center font-bold text-slate-400 mt-2 uppercase tracking-wider animate-pulse">
                     💡 Tap to reveal answer
                  </div>
                </div>

                {/* 2. BACK SIDE CARD */}
                <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-linear-to-br from-slate-900 to-indigo-950 text-slate-100 border border-indigo-900 rounded-2xl flex flex-col p-6 shadow-lg [transform:rotateY(180deg)] border-t-4 border-t-emerald-500">
                  <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      Definition Solution
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-center leading-relaxed select-all">
                      {activeCard.back}
                    </p>
                  </div>
                  <div className="text-[10px] text-center font-medium text-indigo-300 mt-2">
                     Tap card again to flip back
                  </div>
                </div>
              </div>
            </div>

            {/* Answer valuation triggers */}
            <div className="w-full grid grid-cols-2 gap-4 mt-6">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLeitnerProgress(activeCard.id, false);
                }}
                className="py-3 px-4 border border-rose-200 hover:border-rose-350 text-rose-700 bg-rose-50/20 hover:bg-rose-50/70 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
              >
                 ❌ I was incorrect
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLeitnerProgress(activeCard.id, true);
                }}
                className="py-3 px-4 bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:scale-[1.01] active:scale-95 cursor-pointer text-center"
              >
                 ✅ Correct Answer!
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6 mt-6">
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setActiveIdx((prev) => (prev > 0 ? prev - 1 : filteredCards.length - 1));
                }}
                className="px-3.5 py-2 text-xs font-bold text-slate-550 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Previous Card
              </button>
              
              <button
                onClick={() => {
                  setIsFlipped(false);
                  setActiveIdx((prev) => (prev + 1 < filteredCards.length ? prev + 1 : 0));
                }}
                className="px-3.5 py-2 text-xs font-bold text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                Next Card
              </button>

              <button
                onClick={(e) => handleDeleteCard(activeCard.id, e)}
                className="p-2 border border-slate-200 text-rose-550 hover:bg-rose-50 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                title="Delete current card"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full bg-white border border-slate-200 p-12 rounded-2xl flex flex-col items-center justify-center text-center select-none shadow-xs my-auto py-16">
            <Layers size={44} className="text-slate-350 mb-3 animate-pulse" />
            <p className="text-xs font-bold text-slate-700">No Flashcards active in this filter</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-normal">
              Go to **Review Notes** and convert note summaries into flashcards instantly, or inject manual questions on the left creator panel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
