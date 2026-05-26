import React, { useState, useEffect, useRef } from "react";
import { Task } from "../types";
import { Play, Pause, RotateCcw, Plus, Trash2, CheckCircle, Clock, AlertTriangle, ListTodo, ShieldAlert, BookCheck } from "lucide-react";

export function PomodoroDesk() {
  // --- Pomodoro State ---
  const [timerMode, setTimerMode] = useState<"focus" | "short" | "long">("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [isRunning, setIsRunning] = useState(false);
  const [totalSessions, setTotalSessions] = useState(0);

  // Map modes to starting seconds
  const modeTimes = {
    focus: 25 * 60,
    short: 5 * 60,
    long: 15 * 60,
  };

  // Synthesize chime beep using HTML5 Audio element context (completely offline and robust)
  const synthBell = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Chime frequency progression (A5 -> C#6 -> E6 in rapid succession)
      const playTone = (freq: number, startDelay: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);
        gain.gain.setValueAtTime(0, ctx.currentTime + startDelay);
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + startDelay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startDelay + duration);
        osc.start(ctx.currentTime + startDelay);
        osc.stop(ctx.currentTime + startDelay + duration);
      };

      playTone(880, 0, 0.4);
      playTone(1109, 0.15, 0.4);
      playTone(1318, 0.3, 0.6);
    } catch (e) {
      console.warn("AudioContext failed to start synth: ", e);
    }
  };

  // Handle countdown effects safely following primitive variables in dependency array
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Alarm sounds upon timer zero
            synthBell();
            setIsRunning(false);
            
            if (timerMode === "focus") {
              setTotalSessions((s) => s + 1);
              alert("Great focus! Time for a short break. 🎉");
              setTimerMode("short");
              return 5 * 60;
            } else {
              alert("Break's over! Let's get focused. 📚");
              setTimerMode("focus");
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timerMode]);

  const handleModeSelection = (newMode: "focus" | "short" | "long") => {
    setIsRunning(false);
    setTimerMode(newMode);
    setTimeLeft(modeTimes[newMode]);
  };

  const handleStartPauseToggle = () => {
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setTimeLeft(modeTimes[timerMode]);
  };

  const formatTimerValue = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // SVG Progress circle calculations
  const maxTime = modeTimes[timerMode];
  const progressPercent = (timeLeft / maxTime) * 100;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // --- Eisenhower Priority Matrix Tasks State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskQuadrant, setNewTaskQuadrant] = useState<Task["category"]>("urgent-important");

  // Load priority tasks from localStorage on startup
  useEffect(() => {
    const savedTasks = localStorage.getItem("studymate_matrix_tasks");
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error("Failed to parse saved grid tasks", e);
      }
    }
  }, []);

  const saveTasks = (updated: Task[]) => {
    setTasks(updated);
    localStorage.setItem("studymate_matrix_tasks", JSON.stringify(updated));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const added: Task = {
      id: Math.random().toString(36).substring(7),
      title: newTaskTitle.trim(),
      category: newTaskQuadrant,
      completed: false,
    };

    saveTasks([added, ...tasks]);
    setNewTaskTitle("");
  };

  const handleToggleTaskStatus = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    saveTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const filtered = tasks.filter((t) => t.id !== id);
    saveTasks(filtered);
  };

  const clearCompletedTasks = () => {
    const filtered = tasks.filter((t) => !t.completed);
    saveTasks(filtered);
  };

  // Group tasks by category
  const urgentImportant = tasks.filter((t) => t.category === "urgent-important");
  const importantNotUrgent = tasks.filter((t) => t.category === "not-urgent-important");
  const urgentNotImportant = tasks.filter((t) => t.category === "urgent-not-important");
  const defaultQuadrant = tasks.filter((t) => t.category === "not-urgent-not-important");

  return (
    <div id="pomodoro-desk-root" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
      {/* 1. Left Pomodoro Timer Pane (4 Cols) */}
      <div className="lg:col-span-4 bg-white border border-slate-205 px-6 py-8 rounded-2xl flex flex-col items-center shadow-xs select-none">
        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-slate-150 flex items-center gap-1">
          <Clock size={12} className="text-indigo-650" /> Focus Engine
        </span>

        {/* Big visual progress circle clock */}
        <div className="relative my-7 w-48 h-48 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="96"
              cy="96"
              r={radius}
              className="stroke-slate-105"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="96"
              cy="96"
              r={radius}
              className="stroke-indigo-600 transition-all duration-300"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Time text centered */}
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-extrabold font-mono tracking-tight text-slate-850">
              {formatTimerValue(timeLeft)}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 mt-1 tracking-wider">
              {timerMode === "focus" ? "Study Focus" : timerMode === "short" ? "Short Break" : "Long Break"}
            </span>
          </div>
        </div>

        {/* Selection mode controls */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-55 shadow-inner p-1 rounded-lg w-full mb-6">
          {(["focus", "short", "long"] as const).map((m) => (
            <button
              key={m}
              onClick={() => handleModeSelection(m)}
              className={`text-[9px] sm:text-[10px] font-bold py-1.5 rounded-md uppercase tracking-wider transition-all cursor-pointer ${
                timerMode === m
                  ? "bg-indigo-600 text-white shadow-md font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Timers triggers */}
        <div className="flex items-center gap-3 w-full">
          <button
            onClick={handleStartPauseToggle}
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider transition-all select-none shadow hover:scale-[1.01] active:scale-95 cursor-pointer ${
              isRunning ? "bg-rose-50 hover:bg-rose-100 text-rose-700" : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {isRunning ? (
              <>
                <Pause size={13} /> <span>Pause Session</span>
              </>
            ) : (
              <>
                <Play size={13} /> <span>Get Focused</span>
              </>
            )}
          </button>

          <button
            onClick={handleResetTimer}
            className="p-3 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl transition-all hover:text-slate-700 active:scale-95 cursor-pointer"
            title="Reset timer clock"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {totalSessions > 0 && (
          <p className="mt-4 text-[10px] text-emerald-600 font-bold tracking-tight">
            🎉 Completed {totalSessions} Study Sessions today! Keep up!
          </p>
        )}
      </div>

      {/* 2. Eisenhower Prioritization Matrix Task Desk (8 Cols) */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4 select-none">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 text-purple-650 rounded-lg">
                <ListTodo size={18} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Eisenhower Priority Matrix</h2>
                <p className="text-xs text-slate-500">Categorize tasks based on academic impact & urgency</p>
              </div>
            </div>

            {tasks.some((t) => t.completed) && (
              <button
                onClick={clearCompletedTasks}
                className="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100/60 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                Clear Completed
              </button>
            )}
          </div>

          <hr className="border-slate-100 mb-4" />

          {/* Quick task addition form */}
          <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g., Draw mitochondria chart, Revise section 4.2..."
              className="md:col-span-6 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 outline-hidden focus:bg-white focus:border-indigo-500 transition-colors"
            />
            <select
              value={newTaskQuadrant}
              onChange={(e) => setNewTaskQuadrant(e.target.value as Task["category"])}
              className="md:col-span-4 bg-slate-50 border border-slate-250 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 outline-hidden focus:bg-white"
            >
              <option value="urgent-important">🔥 Urgent & Important (Do first)</option>
              <option value="not-urgent-important">📅 Not Urgent but Important (Schedule)</option>
              <option value="urgent-not-important">⚡ Urgent but Not Important (Delegate/Quick)</option>
              <option value="not-urgent-not-important">☕ Not Urgent & Not Important (Backlog)</option>
            </select>
            <button
              type="submit"
              disabled={!newTaskTitle.trim()}
              className={`md:col-span-2 py-2 rounded-lg text-xs font-bold transition-all tracking-wider uppercase flex items-center justify-center gap-1 cursor-pointer ${
                newTaskTitle.trim()
                  ? "bg-slate-800 hover:bg-slate-900 text-white shadow"
                  : "bg-slate-150 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Plus size={13} /> Add
            </button>
          </form>

          {/* Core Eisenhower Quad Grid Panels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Q1: Do First (Urgent & Important) */}
            <div className="border border-rose-100 bg-rose-50/10 rounded-xl p-4 min-h-[140px]">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1 mb-2 select-none">
                <ShieldAlert size={12} /> 🔥 Q1: Do First (Urgent & Important)
              </span>
              <TaskSubList
                items={urgentImportant}
                onToggle={handleToggleTaskStatus}
                onDelete={handleDeleteTask}
              />
            </div>

            {/* Q2: Schedule (Important but Not Urgent) */}
            <div className="border border-indigo-100 bg-indigo-50/10 rounded-xl p-4 min-h-[140px]">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1 mb-2 select-none">
                <BookCheck size={12} /> 📅 Q2: Plan (Important but Not Urgent)
              </span>
              <TaskSubList
                items={importantNotUrgent}
                onToggle={handleToggleTaskStatus}
                onDelete={handleDeleteTask}
              />
            </div>

            {/* Q3: Delegate/Automate (Urgent but Not Important) */}
            <div className="border border-purple-100 bg-purple-50/10 rounded-xl p-4 min-h-[140px]">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1 mb-2 select-none">
                <AlertTriangle size={12} /> ⚡ Q3: delegate (Urgent but Not Important)
              </span>
              <TaskSubList
                items={urgentNotImportant}
                onToggle={handleToggleTaskStatus}
                onDelete={handleDeleteTask}
              />
            </div>

            {/* Q4: Eliminate (Not Urgent & Not Important) */}
            <div className="border border-slate-200 bg-slate-50/10 rounded-xl p-4 min-h-[140px]">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-2 select-none">
                💤 Q4: eliminate (Not Urgent & Not Important)
              </span>
              <TaskSubList
                items={defaultQuadrant}
                onToggle={handleToggleTaskStatus}
                onDelete={handleDeleteTask}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponent to list individual quadrants neatly
interface TaskSubListProps {
  items: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

function TaskSubList({ items, onToggle, onDelete }: TaskSubListProps) {
  if (items.length === 0) {
    return <span className="text-[10px] text-slate-400 select-none block italic mt-4">Empty block</span>;
  }

  return (
    <div className="space-y-1.5 mt-2">
      {items.map((task) => (
        <div
          key={task.id}
          className="flex items-center justify-between gap-2 p-1.5 bg-white border border-slate-150 rounded-lg hover:border-slate-250 transition-colors shadow-2xs group"
        >
          <div
            onClick={() => onToggle(task.id)}
            className="flex-1 flex items-start gap-2 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={task.completed}
              readOnly
              className="mt-0.5 rounded-xs text-indigo-650"
            />
            <span
              className={`text-xs font-semibold leading-tight break-all ${
                task.completed ? "line-through text-slate-400 font-medium" : "text-slate-700"
              }`}
            >
              {task.title}
            </span>
          </div>

          <button
            onClick={() => onDelete(task.id)}
            className="text-slate-350 hover:text-rose-600 md:opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
            title="Delete task item"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
