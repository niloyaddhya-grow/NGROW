export interface Goal {
  id: string;
  title: string;
  category: 'fitness' | 'discipline' | 'growth' | 'mindfulness' | 'eating';
  target: number;
  current: number;
  unit: string;
  smartDetails?: {
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: string;
    steps: string[];
    schedule: string;
  };
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  type: 'digital-detox' | 'early-bird' | 'healthy-eats' | 'focus';
  status: 'active' | 'completed' | 'locked';
  progress: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  unlockedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  time?: string;
}

export interface UserState {
  name: string;
  level: number;
  xp: number;
  points: number;
  streak: number;
  goals: Goal[];
  dailyTasks: Task[];
  challenges: Challenge[];
  badges: Badge[];
}
