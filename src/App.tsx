import React, { useState, useEffect, useRef } from 'react';
import { Dashboard } from './components/Dashboard';
import { AICoach } from './components/AICoach';
import { Goal, UserState, Task } from './types';
import { LayoutDashboard, MessageSquare, Target, Settings, Zap, User as UserIcon, Dumbbell, Plus, Trophy, LogOut, LogIn, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './utils';
import { Logo } from './components/Logo';
import { Challenges } from './components/Challenges';
import { SMARTGoalWizard } from './components/SMARTGoalWizard';

const INITIAL_STATE: UserState = {
  name: "Recruit",
  level: 1,
  xp: 450,
  points: 1200,
  streak: 5,
  goals: [
    { id: '1', title: 'Pushups', category: 'fitness', current: 350, target: 1000, unit: 'reps' },
    { id: '2', title: 'Deep Work', category: 'discipline', current: 12, target: 20, unit: 'hrs' },
    { id: '3', title: 'Reading', category: 'growth', current: 4, target: 10, unit: 'books' },
  ],
  dailyTasks: [
    { id: '1', title: 'Wake up at 6:00 AM', completed: true, time: '06:00' },
    { id: '2', title: 'Cold Shower', completed: true, time: '06:15' },
    { id: '3', title: '30 min Workout', completed: false, time: '07:00' },
    { id: '4', title: 'No Junk Food', completed: false },
    { id: '5', title: 'Study for 2 Hours', completed: false },
  ],
  challenges: [
    { id: 'c1', title: 'Digital Detox', description: 'No social media for 4 hours daily.', points: 500, type: 'digital-detox', status: 'active', progress: 40 },
    { id: 'c2', title: 'Early Bird', description: 'Wake up before 6 AM for 5 days.', points: 800, type: 'early-bird', status: 'active', progress: 60 },
  ],
  badges: [
    { id: 'b1', name: 'First Step', icon: '🌱', unlockedAt: '2024-02-20' },
    { id: 'b2', name: 'Cold Warrior', icon: '❄️' },
    { id: 'b3', name: 'Bookworm', icon: '📚' },
    { id: 'b4', name: 'Iron Mind', icon: '🧠' },
    { id: 'b5', name: 'Early Riser', icon: '☀️' },
    { id: 'b6', name: 'Social Ghost', icon: '👻' },
  ]
};

export default function App() {
  const [auth, setAuth] = useState<{ id: string; username: string } | null>(() => {
    const saved = localStorage.getItem('forge_auth');
    return saved ? JSON.parse(saved) : null;
  });
  const [user, setUser] = useState<UserState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'coach' | 'goals' | 'challenges'>('dashboard');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (auth) {
      localStorage.setItem('forge_auth', JSON.stringify(auth));
      fetch(`/api/user/${auth.id}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Failed to fetch user state');
        })
        .then(state => {
          setUser({
            ...INITIAL_STATE,
            ...state,
            challenges: state.challenges || INITIAL_STATE.challenges,
            badges: state.badges || INITIAL_STATE.badges,
            points: state.points ?? INITIAL_STATE.points,
          });
        })
        .catch(console.error);

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const socket = new WebSocket(`${protocol}//${window.location.host}?userId=${auth.id}`);
      socketRef.current = socket;

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "STATE_UPDATED") {
          setUser({
            ...INITIAL_STATE,
            ...data.state,
            challenges: data.state.challenges || INITIAL_STATE.challenges,
            badges: data.state.badges || INITIAL_STATE.badges,
            points: data.state.points ?? INITIAL_STATE.points,
          });
        }
      };

      return () => socket.close();
    } else {
      localStorage.removeItem('forge_auth');
      setUser(INITIAL_STATE);
    }
  }, [auth]);

  const updateState = (newState: UserState) => {
    setUser(newState);
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "UPDATE_STATE", state: newState }));
    }
  };

  const toggleTask = (id: string) => {
    const newState = {
      ...user,
      dailyTasks: user.dailyTasks.map(t => 
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
      xp: user.xp + (user.dailyTasks.find(t => t.id === id)?.completed ? -20 : 20)
    };
    updateState(newState);
  };

  const addTask = (title: string) => {
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      completed: false
    };
    const newState = {
      ...user,
      dailyTasks: [...user.dailyTasks, newTask]
    };
    updateState(newState);
  };

  const saveGoal = (goal: Goal) => {
    const newState = {
      ...user,
      goals: [...user.goals, goal],
      xp: user.xp + 50
    };
    updateState(newState);
  };

  const removeGoal = (id: string) => {
    const newState = {
      ...user,
      goals: user.goals.filter(g => g.id !== id)
    };
    updateState(newState);
  };

  const completeChallenge = (id: string) => {
    const newState: UserState = {
      ...user,
      challenges: user.challenges.map(c => 
        c.id === id ? { ...c, status: 'completed' as const, progress: 100 } : c
      ),
      points: user.points + (user.challenges.find(c => c.id === id)?.points || 0),
      xp: user.xp + 200
    };
    updateState(newState);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        setAuth({ id: data.id, username: data.username });
        if (data.state) {
          setUser({
            ...INITIAL_STATE,
            ...data.state,
            challenges: data.state.challenges || INITIAL_STATE.challenges,
            badges: data.state.badges || INITIAL_STATE.badges,
            points: data.state.points ?? INITIAL_STATE.points,
          });
        }
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setAuthError('Network error. Please try again.');
    }
  };

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark p-4">
        <div className="glass-card w-full max-w-md p-8 space-y-8">
          <div className="flex flex-col items-center gap-4">
            <Logo className="w-16 h-16" />
            <h1 className="text-3xl font-black tracking-tighter">NGROW</h1>
            <p className="text-gray-400 text-sm text-center">Stop being average. Start your evolution.</p>
          </div>
          
          {authError && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-xl text-sm font-medium text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Username</label>
              <input 
                type="text" 
                value={username} 
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-primary transition-colors"
                required
              />
            </div>
            <button className="w-full bg-brand-primary text-brand-dark py-4 rounded-xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all">
              {authMode === 'login' ? 'Enter the Forge' : 'Begin Evolution'}
            </button>
          </form>
          <div className="text-center">
            <button 
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                setAuthError('');
              }}
              className="text-xs font-bold text-gray-500 hover:text-brand-primary transition-colors uppercase tracking-widest"
            >
              {authMode === 'login' ? "Don't have an account? Sign up" : "Already a member? Log in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const contextString = `User is Level ${user.level} with a ${user.streak} day streak. 
  Current goals: ${(user.goals || []).map(g => g.title).join(', ')}. 
  Daily tasks: ${(user.dailyTasks || []).map(t => `${t.title} (${t.completed ? 'done' : 'pending'})`).join(', ')}.
  Active challenges: ${(user.challenges || []).map(c => c.title).join(', ')}.`;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-brand-dark">
      <AnimatePresence>
        {isWizardOpen && (
          <SMARTGoalWizard 
            onClose={() => setIsWizardOpen(false)} 
            onSave={saveGoal}
            userContext={contextString}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <nav className="w-full md:w-20 lg:w-64 border-b md:border-b-0 md:border-r border-white/10 flex flex-col p-4 md:p-6 gap-8 bg-brand-surface/30 backdrop-blur-xl z-50">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="font-black text-2xl tracking-tighter hidden lg:block">NGROW</span>
        </div>

        <div className="flex md:flex-col gap-2 flex-1 justify-around md:justify-start">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard className="w-6 h-6" />} 
            label="Dashboard" 
          />
          <NavButton 
            active={activeTab === 'coach'} 
            onClick={() => setActiveTab('coach')} 
            icon={<MessageSquare className="w-6 h-6" />} 
            label="NGrow AI" 
          />
          <NavButton 
            active={activeTab === 'goals'} 
            onClick={() => setActiveTab('goals')} 
            icon={<Target className="w-6 h-6" />} 
            label="Missions" 
          />
          <NavButton 
            active={activeTab === 'challenges'} 
            onClick={() => setActiveTab('challenges')} 
            icon={<Trophy className="w-6 h-6" />} 
            label="Challenges" 
          />
        </div>

        <div className="hidden md:flex flex-col gap-4 mt-auto">
          <div className="glass-card p-4 hidden lg:block">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Current Rank</div>
            <div className="text-brand-primary font-bold">ELITE VANGUARD</div>
            <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-brand-primary w-3/4" />
            </div>
          </div>
          <button 
            onClick={() => setAuth(null)}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 transition-colors text-gray-400 hover:text-red-500"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium hidden lg:block">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tighter mb-1">
              STAY HARD, <span className="text-brand-primary uppercase">{auth.username}</span>
            </h1>
            <p className="text-gray-400 text-sm font-medium">Consistency is the only shortcut to greatness.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Global Rank</span>
              <span className="font-mono text-brand-primary font-bold">#1,242</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-primary to-emerald-600 p-[1px]">
              <div className="w-full h-full rounded-2xl bg-brand-dark flex items-center justify-center overflow-hidden">
                <img src={`https://picsum.photos/seed/${auth.username}/100/100`} alt="Avatar" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && (
              <Dashboard user={user} onToggleTask={toggleTask} onAddTask={addTask} onRemoveGoal={removeGoal} />
            )}
            {activeTab === 'coach' && (
              <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-2">NGrow AI Coach</h2>
                  <p className="text-gray-400 text-sm">Your personal mentor for fitness, discipline, and building a high-performance life.</p>
                </div>
                <AICoach context={contextString} />
              </div>
            )}
            {activeTab === 'goals' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">Active Missions</h2>
                    <p className="text-gray-400 text-sm">SMART goals designed for maximum growth.</p>
                  </div>
                  <button 
                    onClick={() => setIsWizardOpen(true)}
                    className="bg-brand-primary text-brand-dark px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    <Plus className="w-4 h-4" /> NEW SMART MISSION
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(user.goals || []).map(goal => (
                    <div key={goal.id} className="glass-card p-6 space-y-4 hover:border-brand-primary/50 transition-colors group relative">
                      <button 
                        onClick={() => removeGoal(goal.id)}
                        className="absolute right-4 top-4 p-2 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center group-hover:bg-brand-primary/20 transition-colors">
                          {goal.category === 'fitness' ? <Dumbbell className="text-brand-primary" /> : <Target className="text-brand-primary" />}
                        </div>
                        <span className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 text-gray-400 uppercase tracking-widest">{goal.category}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1">{goal.title}</h3>
                        <p className="text-sm text-gray-400">Current progress: {goal.current} of {goal.target} {goal.unit}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-primary" style={{ width: `${(goal.current / goal.target) * 100}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-gray-500">
                          <span>{Math.round((goal.current / goal.target) * 100)}% COMPLETE</span>
                          <span>{goal.target - goal.current} REMAINING</span>
                        </div>
                      </div>
                      <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition-colors">
                        UPDATE PROGRESS
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === 'challenges' && (
              <Challenges user={user} onCompleteChallenge={completeChallenge} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 p-3 rounded-xl transition-all group relative",
      active ? "bg-brand-primary text-brand-dark" : "text-gray-400 hover:text-white hover:bg-white/5"
    )}
  >
    {icon}
    <span className="text-sm font-bold hidden lg:block">{label}</span>
    {active && (
      <motion.div 
        layoutId="nav-active" 
        className="absolute inset-0 bg-brand-primary rounded-xl -z-10"
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
  </button>
);
