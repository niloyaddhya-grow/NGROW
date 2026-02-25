import React from 'react';
import { CheckCircle2, Circle, Plus, Trophy, Flame, Target, Dumbbell, Brain, TrendingUp, Trash2 } from 'lucide-react';
import { UserState, Task, Goal } from '../types';
import { motion } from 'motion/react';
import { cn } from '../utils';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  user: UserState;
  onToggleTask: (id: string) => void;
  onAddTask: (title: string) => void;
  onRemoveGoal: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onToggleTask, onAddTask, onRemoveGoal }) => {
  const [newTaskTitle, setNewTaskTitle] = React.useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim());
      setNewTaskTitle('');
    }
  };

  const completedTasks = (user.dailyTasks || []).filter(t => t.completed).length;
  const progress = (completedTasks / (user.dailyTasks || []).length) * 100 || 0;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<Flame className="text-orange-500" />} 
          label="Streak" 
          value={`${user.streak} Days`} 
          subValue="Keep it going!"
        />
        <StatCard 
          icon={<Trophy className="text-yellow-500" />} 
          label="Level" 
          value={user.level.toString()} 
          subValue={`${user.xp}/1000 XP`}
        />
        <StatCard 
          icon={<Target className="text-brand-primary" />} 
          label="Daily Progress" 
          value={`${Math.round(progress)}%`} 
          subValue={`${completedTasks}/${user.dailyTasks.length} Tasks`}
        />
        <StatCard 
          icon={<TrendingUp className="text-blue-500" />} 
          label="Best Life" 
          value="A+" 
          subValue="Top 5% this week"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Tasks */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="text-brand-primary" />
              Daily Discipline
            </h2>
            <span className="text-xs text-gray-400 font-mono">RESETS IN 14H</span>
          </div>

          <div className="glass-card p-4 space-y-3">
            <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add a new habit or task..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-primary transition-colors"
              />
              <button type="submit" className="bg-brand-primary/20 text-brand-primary p-2 rounded-xl hover:bg-brand-primary/30 transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </form>

            <div className="space-y-2">
              {(user.dailyTasks || []).map((task) => (
                <motion.div
                  layout
                  key={task.id}
                  onClick={() => onToggleTask(task.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                    task.completed ? "bg-brand-primary/10 opacity-60" : "bg-white/5 hover:bg-white/10"
                  )}
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-brand-primary" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-500" />
                  )}
                  <span className={cn("text-sm font-medium", task.completed && "line-through")}>
                    {task.title}
                  </span>
                  {task.time && <span className="ml-auto text-[10px] font-mono text-gray-500">{task.time}</span>}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Goals & Stats */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Dumbbell className="text-brand-primary" />
              Active Goals
            </h2>
            <div className="glass-card p-4 space-y-4">
              {(user.goals || []).map((goal) => (
                <div key={goal.id} className="space-y-2 group relative">
                  <button 
                    onClick={() => onRemoveGoal(goal.id)}
                    className="absolute -right-2 -top-2 p-1 bg-red-500/20 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="uppercase tracking-wider text-gray-400">{goal.title}</span>
                    <span className="text-brand-primary">{goal.current}/{goal.target} {goal.unit}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(goal.current / goal.target) * 100}%` }}
                      className="h-full bg-brand-primary shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Brain className="text-brand-primary" />
              Weekly Focus
            </h2>
            <div className="glass-card p-4 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" hide />
                  <YAxis hide />
                  <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 3 ? '#0ea5e9' : '#ffffff20'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-between mt-2 text-[10px] font-mono text-gray-500">
                <span>MON</span>
                <span>TUE</span>
                <span>WED</span>
                <span>THU</span>
                <span>FRI</span>
                <span>SAT</span>
                <span>SUN</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; subValue: string }> = ({ icon, label, value, subValue }) => (
  <div className="glass-card p-4 flex flex-col gap-1">
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
    </div>
    <div className="text-xl font-bold">{value}</div>
    <div className="text-[10px] text-gray-400">{subValue}</div>
  </div>
);

const chartData = [
  { name: 'M', val: 40 },
  { name: 'T', val: 30 },
  { name: 'W', val: 60 },
  { name: 'T', val: 80 },
  { name: 'F', val: 50 },
  { name: 'S', val: 20 },
  { name: 'S', val: 10 },
];
