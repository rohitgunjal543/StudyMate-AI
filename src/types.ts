export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  title: string;
  questions: QuizQuestion[];
}

export interface RoadmapPhase {
  name: string;
  duration: string;
  tasks: string[];
  keyConcepts: string[];
  recommendedResources?: string[];
}

export interface Roadmap {
  title: string;
  description: string;
  timeframe: string;
  phases: RoadmapPhase[];
}

export interface Task {
  id: string;
  title: string;
  category: "urgent-important" | "not-urgent-important" | "urgent-not-important" | "not-urgent-not-important";
  completed: boolean;
  notes?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  topic: string;
  box: number; // For Leitner System (1 to 5) or master tracker
}

export type TabType = "chat" | "summarizer" | "quiz" | "roadmap" | "pomodoro" | "flashcards";
