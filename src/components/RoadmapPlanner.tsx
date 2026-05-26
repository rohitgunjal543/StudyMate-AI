import { useState, useEffect } from "react";
import { Roadmap, RoadmapPhase } from "../types";
import { CalendarRange, Sparkles, RefreshCw, CheckSquare, Compass, AlertCircle, BookOpen, ChevronDown, ChevronUp, BookMarked, ToggleLeft } from "lucide-react";

export function RoadmapPlanner() {
  const [topic, setTopic] = useState("");
  const [timeframe, setTimeframe] = useState("4 weeks");
  const [userContext, setUserContext] = useState("intermediate student");
  
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Maintain active completed checklist items across generated roadmap sessions in local state
  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});
  const [expandedPhaseIdx, setExpandedPhaseIdx] = useState<number>(0);

  // Load roadmap from localStorage
  useEffect(() => {
    const savedRoadmap = localStorage.getItem("studymate_saved_roadmap");
    const savedChecks = localStorage.getItem("studymate_roadmap_checks");
    
    if (savedRoadmap) {
      try {
        setRoadmap(JSON.parse(savedRoadmap));
      } catch (e) {
        console.error("Failed to parse saved roadmap", e);
      }
    }
    if (savedChecks) {
      try {
        setCheckedTasks(JSON.parse(savedChecks));
      } catch (e) {
        console.error("Failed to parse saved checks", e);
      }
    }
  }, []);

  const handleGenerateRoadmap = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setRoadmap(null);
    setCheckedTasks({});

    try {
      const response = await fetch("/api/study/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          timeframe,
          userContext,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create roadmap.");
      }

      setRoadmap(data);
      setExpandedPhaseIdx(0);
      localStorage.setItem("studymate_saved_roadmap", JSON.stringify(data));
      localStorage.setItem("studymate_roadmap_checks", JSON.stringify({}));
    } catch (err: any) {
      setError(err.message || "Failed to communicate with roadmap architect service.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = (taskKey: string) => {
    const updated = {
      ...checkedTasks,
      [taskKey]: !checkedTasks[taskKey],
    };
    setCheckedTasks(updated);
    localStorage.setItem("studymate_roadmap_checks", JSON.stringify(updated));
  };

  const handleTogglePhase = (idx: number) => {
    setExpandedPhaseIdx(expandedPhaseIdx === idx ? -1 : idx);
  };

  const handleResetRoadmap = () => {
    if (window.confirm("Are you sure you want to reset this roadmap plan?")) {
      setRoadmap(null);
      setTopic("");
      setCheckedTasks({});
      localStorage.removeItem("studymate_saved_roadmap");
      localStorage.removeItem("studymate_roadmap_checks");
    }
  };

  return (
    <div id="roadmap-planner-root" className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full items-start">
      {/* Settings Input Left Side Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 xl:col-span-1">
        <div className="flex items-center gap-2 select-none">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Compass size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Syllabus Roadmaps</h2>
            <p className="text-xs text-slate-500">Formulate day-by-day learning curricula</p>
          </div>
        </div>

        <hr className="border-slate-100" />

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Goal or Exam Focus
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Master Linear Algebra, Prepare SAT Math..."
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Preparation Timeframe
            </label>
            <input
              type="text"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              placeholder="e.g., 10 days, 4 weeks, 2 months..."
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Student Level or Daily Hours
            </label>
            <input
              type="text"
              value={userContext}
              onChange={(e) => setUserContext(e.target.value)}
              placeholder="e.g., absolute beginner, 2 hours a day, busy schedule..."
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-slate-700 outline-hidden"
            />
          </div>

          <button
            onClick={handleGenerateRoadmap}
            disabled={!topic.trim() || loading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              topic.trim() && !loading
                ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-98"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Architecting Roadmap...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Build Study Roadmap</span>
              </>
            )}
          </button>

          {roadmap && (
            <button
              onClick={handleResetRoadmap}
              className="w-full py-2 bg-rose-50 hover:bg-rose-100/55 text-rose-700 border border-rose-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Reset Roadmap & Start New
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 select-none shadow-sm">
            <AlertCircle size={15} className="text-rose-600 mt-0.5" />
            <p className="text-[10px] text-rose-700 leading-normal">{error}</p>
          </div>
        )}
      </div>

      {/* Main Roadmap Output / Checklist Area (Right 2-column) */}
      <div className="xl:col-span-2 space-y-6">
        {loading && (
          <div className="bg-white border border-slate-250 p-12 rounded-2xl flex flex-col items-center justify-center text-center select-none shadow-xs">
            <CalendarRange size={40} className="text-indigo-600 animate-pulse mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">Custom Curriculum synthesis</h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs leading-relaxed">
              Using **gemini-3.5-flash** to partition milestones into actionable check tasks and recommended textbook study concepts.
            </p>
          </div>
        )}

        {roadmap && !loading && (
          <div className="space-y-6">
            {/* Top Banner Overview Card */}
            <div className="bg-slate-900 text-slate-50 p-6 rounded-2xl border border-slate-800 shadow-md">
              <span className="inline-block bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3">
                Classroom Syllabus Roadmap
              </span>
              <h3 className="text-lg font-bold leading-tight">{roadmap.title}</h3>
              <p className="text-xs text-slate-300 mt-2 font-medium leading-relaxed">{roadmap.description}</p>
              
              <div className="flex gap-4 mt-4 text-[11px] text-slate-400 font-medium">
                <span>Duration Timeframe: <strong className="text-indigo-300">{roadmap.timeframe}</strong></span>
                <span>•</span>
                <span>Active Milestones: <strong className="text-indigo-300">{roadmap.phases.length} Phases</strong></span>
              </div>
            </div>

            {/* List of Roadmap Checklist Phases */}
            <div className="space-y-3">
              {roadmap.phases.map((phase, idx) => {
                const isExpanded = expandedPhaseIdx === idx;
                const phaseKey = `phase-${idx}`;

                // Calculate completed items for this phase
                const phaseTasks = phase.tasks || [];
                const completedCount = phaseTasks.filter((_, taskIdx) => checkedTasks[`${phaseKey}-${taskIdx}`]).length;
                const progressPercentage = phaseTasks.length > 0 ? Math.round((completedCount / phaseTasks.length) * 100) : 0;

                return (
                  <div
                    key={idx}
                    className={`bg-white border rounded-xl overflow-hidden transition-all shadow-xs ${
                      isExpanded ? "border-indigo-400" : "border-slate-150 hover:bg-slate-50/20"
                    }`}
                  >
                    {/* Header trigger bar */}
                    <div
                      onClick={() => handleTogglePhase(idx)}
                      className="px-5 py-4 flex items-center justify-between gap-4 cursor-pointer select-none"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 font-mono font-medium px-2 py-0.5 rounded-full inline-block">
                            {phase.duration || `Phase ${idx + 1}`}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800">{phase.name}</h4>
                        </div>
                        {/* Progress visual */}
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-slate-100 h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full transition-all"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-450 font-semibold font-mono">
                            {completedCount}/{phaseTasks.length} Checked
                          </span>
                        </div>
                      </div>

                      <div className="text-slate-450">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* Exploded Workspace content details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-slate-100 pt-4 bg-slate-50/30 space-y-5">
                        {/* 1. Actionable student checkbox items */}
                        <div>
                          <span className="text-[10px] font-bold text-indigo-750 uppercase tracking-wider block mb-2.5 flex items-center gap-1">
                            <CheckSquare size={12} /> Milestone Actions Checklist
                          </span>
                          <div className="space-y-2">
                            {phaseTasks.map((task, taskIdx) => {
                              const taskKeyStr = `${phaseKey}-${taskIdx}`;
                              const isChecked = !!checkedTasks[taskKeyStr];
                              return (
                                <div
                                  key={taskIdx}
                                  onClick={() => handleToggleTask(taskKeyStr)}
                                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all cursor-pointer ${
                                    isChecked
                                      ? "bg-emerald-50/20 border-emerald-150 text-slate-500"
                                      : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    readOnly
                                    className="mt-0.5 rounded-sm border-slate-300 text-indigo-650 focus:ring-indigo-500"
                                  />
                                  <span className={`text-xs font-semibold ${isChecked ? "line-through text-slate-400" : ""}`}>
                                    {task}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Core terms to digest thoroughly */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white border border-slate-150 p-4 rounded-xl">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5 flex items-center gap-1">
                              <BookMarked size={12} className="text-purple-600" /> Key Concepts to Comprehend
                            </span>
                            <div className="space-y-1.5">
                              {(phase.keyConcepts || []).map((term, tIdx) => (
                                <p key={tIdx} className="text-xs font-medium text-slate-600 flex items-start">
                                  <span className="mr-1.5 text-purple-600 font-bold">•</span>
                                  <span>{term}</span>
                                </p>
                              ))}
                            </div>
                          </div>

                          {/* 3. Resources recommended details */}
                          {phase.recommendedResources && phase.recommendedResources.length > 0 && (
                            <div className="bg-white border border-slate-150 p-4 rounded-xl">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5 flex items-center gap-1">
                                <BookOpen size={12} className="text-amber-600" /> Study Resources Suggested
                              </span>
                              <div className="space-y-1.5">
                                {phase.recommendedResources.map((res, rIdx) => (
                                  <p key={rIdx} className="text-xs font-semibold text-slate-650 flex items-start">
                                    <span className="mr-1.5 text-amber-500 font-bold">#</span>
                                    <span>{res}</span>
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!roadmap && !loading && (
          <div className="h-full bg-white border border-slate-200 p-8 rounded-2xl flex flex-col items-center justify-center text-center select-none shadow-xs">
            <Compass size={40} className="text-slate-300 mb-2.5 animate-pulse" />
            <p className="text-xs font-semibold text-slate-600">Pending Syllabus Coursework</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              Complete the study target specifications in the settings panel to formulate your master timeline map here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
