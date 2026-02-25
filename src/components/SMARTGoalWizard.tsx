import React, { useState } from 'react';
import { Target, Sparkles, ArrowRight, CheckCircle2, Calendar, ListChecks, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateCoachResponse } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { Goal } from '../types';
import { cn } from '../utils';

interface SMARTGoalWizardProps {
  onClose: () => void;
  onSave: (goal: Goal) => void;
  userContext: string;
}

export const SMARTGoalWizard: React.FC<SMARTGoalWizardProps> = ({ onClose, onSave, userContext }) => {
  const [step, setStep] = useState(1);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [category, setCategory] = useState<Goal['category']>('fitness');

  const handleAnalyze = async () => {
    if (!userInput.trim()) return;
    setIsLoading(true);
    
    const prompt = `Help me turn this rough idea into a SMART goal: "${userInput}". 
    Category: ${category}.
    Please provide:
    1. A SMART version of the goal.
    2. 3-5 actionable steps.
    3. A suggested flexible daily/weekly schedule.
    Format the response clearly with headers.`;

    const response = await generateCoachResponse(prompt, userContext);
    setAiSuggestion(response);
    setIsLoading(false);
    setStep(2);
  };

  const handleFinalize = () => {
    // In a real app, we'd parse the AI response more robustly.
    // For this demo, we'll create a goal object from the input.
    const newGoal: Goal = {
      id: Math.random().toString(36).substr(2, 9),
      title: userInput.length > 30 ? userInput.substring(0, 27) + '...' : userInput,
      category: category,
      current: 0,
      target: 100, // Default target
      unit: 'progress',
      smartDetails: {
        specific: userInput,
        measurable: "Tracked via NGrow",
        achievable: "Yes",
        relevant: "Personal Growth",
        timeBound: "30 Days",
        steps: aiSuggestion?.split('\n').filter(l => l.includes('-') || l.includes('*')).slice(0, 5) || [],
        schedule: "Daily routine"
      }
    };
    onSave(newGoal);
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card w-full max-w-2xl overflow-hidden shadow-2xl border-brand-primary/20"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-brand-primary/5">
          <div className="flex items-center gap-2">
            <Target className="text-brand-primary w-6 h-6" />
            <h2 className="text-xl font-bold uppercase tracking-tight">SMART Mission Designer</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div 
                key="step1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Goal Category</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['fitness', 'discipline', 'growth', 'mindfulness', 'eating'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat as any)}
                        className={cn(
                          "py-2 px-3 rounded-xl text-xs font-bold border transition-all uppercase tracking-tighter",
                          category === cat ? "bg-brand-primary text-brand-dark border-brand-primary" : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">What do you want to achieve?</label>
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="e.g., I want to get better at math and start working out more..."
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-brand-primary transition-colors resize-none"
                  />
                </div>

                <button
                  disabled={!userInput.trim() || isLoading}
                  onClick={handleAnalyze}
                  className="w-full bg-brand-primary text-brand-dark py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-brand-dark border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Analyze with NGrow
                    </>
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl p-6 max-h-[400px] overflow-y-auto scrollbar-hide">
                  <div className="flex items-center gap-2 mb-4 text-brand-primary">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold uppercase tracking-widest text-xs">NGrow Suggestion</span>
                  </div>
                  <div className="markdown-body">
                    <ReactMarkdown>{aiSuggestion || ""}</ReactMarkdown>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 border border-white/10 rounded-2xl text-sm font-bold hover:bg-white/5 transition-colors"
                  >
                    REVISE INPUT
                  </button>
                  <button
                    onClick={handleFinalize}
                    className="flex-1 bg-brand-primary text-brand-dark py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    SAVE MISSION
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 bg-brand-surface border-t border-white/10 flex justify-center gap-8">
          <WizardStep active={step === 1} label="Input" />
          <WizardStep active={step === 2} label="SMART Plan" />
        </div>
      </motion.div>
    </motion.div>
  );
};

const WizardStep: React.FC<{ active: boolean; label: string }> = ({ active, label }) => (
  <div className="flex items-center gap-2">
    <div className={cn(
      "w-2 h-2 rounded-full transition-all duration-500",
      active ? "bg-brand-primary scale-125 shadow-[0_0_8px_rgba(14,165,233,0.8)]" : "bg-white/20"
    )} />
    <span className={cn("text-[10px] font-bold uppercase tracking-widest", active ? "text-white" : "text-gray-500")}>{label}</span>
  </div>
);
