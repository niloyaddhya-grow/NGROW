import React, { useState } from 'react';
import { Trophy, Shield, Zap, Star, Lock, CheckCircle2, Users } from 'lucide-react';
import { Challenge, Badge, UserState } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';

interface ChallengesProps {
  user: UserState;
  onCompleteChallenge: (id: string) => void;
}

export const Challenges: React.FC<ChallengesProps> = ({ user, onCompleteChallenge }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'badges' | 'leaderboard'>('active');

  return (
    <div className="space-y-8">
      <div className="flex gap-4 border-b border-white/10 pb-4">
        <TabButton active={activeTab === 'active'} onClick={() => setActiveTab('active')} label="Weekly Challenges" />
        <TabButton active={activeTab === 'badges'} onClick={() => setActiveTab('badges')} label="My Badges" />
        <TabButton active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} label="Leaderboard" />
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'active' && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {(user.challenges || []).map((challenge) => (
              <div key={challenge.id} className="glass-card p-6 space-y-4 group relative overflow-hidden">
                {challenge.status === 'completed' && (
                  <div className="absolute top-0 right-0 bg-brand-primary text-brand-dark px-4 py-1 text-[10px] font-bold uppercase tracking-widest transform rotate-45 translate-x-4 translate-y-2">
                    Completed
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                    {challenge.type === 'digital-detox' && <Zap className="text-brand-primary" />}
                    {challenge.type === 'early-bird' && <Star className="text-brand-primary" />}
                    {challenge.type === 'healthy-eats' && <Shield className="text-brand-primary" />}
                    {challenge.type === 'focus' && <Trophy className="text-brand-primary" />}
                  </div>
                  <div className="text-right">
                    <div className="text-brand-primary font-bold">+{challenge.points} PTS</div>
                    <div className="text-[10px] text-gray-500 uppercase font-mono">Difficulty: Hard</div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">{challenge.title}</h3>
                  <p className="text-sm text-gray-400">{challenge.description}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-gray-500">PROGRESS</span>
                    <span className="text-brand-primary">{challenge.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-primary" style={{ width: `${challenge.progress}%` }} />
                  </div>
                </div>
                <button
                  disabled={challenge.status === 'completed'}
                  onClick={() => onCompleteChallenge(challenge.id)}
                  className={cn(
                    "w-full py-2 rounded-xl text-sm font-bold transition-all",
                    challenge.status === 'completed'
                      ? "bg-brand-primary/10 text-brand-primary cursor-default"
                      : "bg-brand-primary text-brand-dark hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  {challenge.status === 'completed' ? 'CHALLENGE ACED' : 'COMMIT TO CHALLENGE'}
                </button>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'badges' && (
          <motion.div
            key="badges"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            {(user.badges || []).map((badge) => (
              <div key={badge.id} className="glass-card p-4 flex flex-col items-center text-center gap-3 group">
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500",
                  badge.unlockedAt 
                    ? "bg-brand-primary/20 shadow-[0_0_20px_rgba(14,165,233,0.2)] scale-110" 
                    : "bg-white/5 grayscale opacity-40"
                )}>
                   <div className="text-3xl">{badge.icon}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-tighter">{badge.name}</div>
                  {badge.unlockedAt ? (
                    <div className="text-[8px] text-brand-primary font-mono mt-1">UNLOCKED {badge.unlockedAt}</div>
                  ) : (
                    <div className="text-[8px] text-gray-500 font-mono mt-1 flex items-center justify-center gap-1">
                      <Lock className="w-2 h-2" /> LOCKED
                    </div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card overflow-hidden"
          >
            <div className="p-4 bg-brand-primary/10 border-b border-white/10 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Global Vanguard Leaderboard</span>
            </div>
            <div className="divide-y divide-white/5">
              {LEADERBOARD_DATA.map((entry, i) => (
                <div key={i} className={cn(
                  "flex items-center gap-4 p-4 transition-colors",
                  entry.name === user.name ? "bg-brand-primary/5" : "hover:bg-white/5"
                )}>
                  <div className="w-8 text-center font-mono font-bold text-gray-500">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </div>
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10">
                    <img src={`https://picsum.photos/seed/${entry.name}/100/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold flex items-center gap-2">
                      {entry.name}
                      {entry.name === user.name && <span className="text-[8px] bg-brand-primary text-brand-dark px-1 rounded">YOU</span>}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest">Level {entry.level} • {entry.streak} Day Streak</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-brand-primary">{entry.points.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500 font-mono uppercase">Points</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-2 text-sm font-bold transition-all relative",
      active ? "text-brand-primary" : "text-gray-500 hover:text-white"
    )}
  >
    {label}
    {active && (
      <motion.div layoutId="challenge-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
    )}
  </button>
);

const LEADERBOARD_DATA = [
  { name: "IronWill_99", level: 42, points: 12500, streak: 120 },
  { name: "ZenMaster_X", level: 38, points: 10200, streak: 45 },
  { name: "Recruit", level: 1, points: 450, streak: 5 }, // This is the user
  { name: "StudyGrind", level: 25, points: 8900, streak: 32 },
  { name: "FitTeen_Sarah", level: 31, points: 7500, streak: 15 },
];

