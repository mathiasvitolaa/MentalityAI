export interface User {
  id: string;
  full_name: string;
  email: string;
  career?: string | null;
  university?: string | null;
  theme_preference: string;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  professor?: string | null;
  credits: number;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  subject_id?: string | null;
  due_date?: string | null;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
  created_at: string;
}

export interface StudySession {
  id: string;
  title: string;
  goal?: string | null;
  subject_id?: string | null;
  scheduled_at?: string | null;
  duration_minutes: number;
  completed: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  mode: string;
  created_at: string;
  messages: ChatMessage[];
}

export interface DocumentSummary {
  id: string;
  title: string;
  summary?: string | null;
  key_points: string[];
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  question_type: "mcq" | "open";
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation?: string | null;
}

export interface Quiz {
  id: string;
  title: string;
  difficulty: string;
  created_at: string;
  questions: QuizQuestion[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  created_at: string;
  cards: Flashcard[];
}

export interface DashboardStats {
  total_subjects: number;
  pending_tasks: number;
  completed_tasks: number;
  upcoming_tasks: Task[];
  study_hours_week: number;
  study_hours_total: number;
  quizzes_completed: number;
  flashcard_decks: number;
  recent_activity: { type: string; title: string; date: string }[];
}
