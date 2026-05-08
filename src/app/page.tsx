'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { 
  LayoutDashboard, 
  Play, 
  Settings, 
  BarChart3, 
  Clock, 
  Target, 
  Zap,
  TrendingUp,
  BrainCircuit,
  Volume2,
  Trophy,
  Layers,
  Grid3x3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PracticeGenerator from '@/components/Practice/PracticeGenerator';
import LiveSpeedMode from '@/components/Practice/LiveSpeedMode';
import AnalyticsDashboard from '@/components/Analytics/AnalyticsDashboard';
import LadderMode from '@/components/Practice/LadderMode';
import ConcentrationGridMode from '@/components/Practice/ConcentrationGridMode';
import { BENCHMARK_TARGET_QPM, buildGuidedRecommendation, computeDifficultyWeightedMetrics } from '@/lib/adaptive';
import { ConcentrationSession, GameSession, ThemeType } from '@/store/useGameStore';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'practice' | 'settings' | 'game' | 'analytics' | 'ladder' | 'concentration'>('dashboard');
  const { history, bestScore, totalQuestionsSolved, concentrationHistory, theme, setTheme, configs } = useGameStore();

  // Apply theme class to body
  useEffect(() => {
    if (theme === 'bloomberg-light') {
      document.body.classList.add('bloomberg-light');
      document.body.classList.remove('terminal-dark');
    } else {
      document.body.classList.add('terminal-dark');
      document.body.classList.remove('bloomberg-light');
    }
  }, [theme]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard history={history} bestScore={bestScore} totalQuestionsSolved={totalQuestionsSolved} concentrationHistory={concentrationHistory} configs={configs} onStart={() => setActiveTab('practice')} />;
      case 'practice':
        return <PracticeGenerator onStart={() => setActiveTab('game')} />;
      case 'game':
        return <LiveSpeedMode onExit={() => setActiveTab('dashboard')} />;
      case 'ladder':
        return <LadderMode onExit={() => setActiveTab('dashboard')} />;
      case 'concentration':
        return <ConcentrationGridMode onExit={() => setActiveTab('dashboard')} />;
      case 'settings':
        return <SettingsPanel theme={theme} setTheme={setTheme} />;
      case 'analytics':
        return (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold">Performance Analytics</h2>
            <AnalyticsDashboard />
          </div>
        );
      default:
        return <Dashboard history={history} bestScore={bestScore} totalQuestionsSolved={totalQuestionsSolved} concentrationHistory={concentrationHistory} configs={configs} onStart={() => setActiveTab('practice')} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      {(
        activeTab === 'dashboard' ||
        activeTab === 'practice' ||
        activeTab === 'settings' ||
        activeTab === 'analytics' ||
        activeTab === 'concentration'
      ) && (
        <aside className="w-64 border-r border-border flex flex-col p-4 bg-sidebar">
          <div className="mb-8 px-2 flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center shadow-sm">
              <Zap className="text-white fill-white" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight neon-text uppercase">TraderMath</h1>
          </div>

          <nav className="flex-1 space-y-1">
            <SidebarItem 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
            />
            <SidebarItem 
              icon={<Play size={20} />} 
              label="Practice" 
              active={activeTab === 'practice'} 
              onClick={() => setActiveTab('practice')} 
            />
            <SidebarItem 
              icon={<Layers size={20} />} 
              label="Multi Ladder" 
              active={false} 
              onClick={() => setActiveTab('ladder')} 
            />
            <SidebarItem 
              icon={<BarChart3 size={20} />} 
              label="Analytics" 
              active={activeTab === 'analytics'} 
              onClick={() => setActiveTab('analytics')} 
            />
            <SidebarItem 
              icon={<Grid3x3 size={20} />} 
              label="Concentration" 
              active={activeTab === 'concentration'} 
              onClick={() => setActiveTab('concentration')} 
            />
            <SidebarItem 
              icon={<Settings size={20} />} 
              label="Settings" 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')} 
            />
          </nav>

          <div className="mt-auto p-4 border border-border rounded-sm bg-background/50">
            <p className="text-[10px] text-muted uppercase tracking-widest mb-1 font-bold">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-tight">
                {theme === 'terminal-dark' ? 'Terminal Link Active' : 'Market Stream Live'}
              </p>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto bg-background p-8 ${(activeTab === 'game' || activeTab === 'ladder') ? 'flex items-center justify-center' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-6xl mx-auto"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all text-sm font-bold ${
        active 
          ? 'bg-primary/10 text-primary border-r-2 border-primary shadow-sm' 
          : 'text-muted hover:text-foreground hover:bg-foreground/5'
      }`}
    >
      <span className={active ? 'text-primary' : 'text-muted'}>{icon}</span>
      {label}
    </button>
  );
}

function Dashboard({
  history,
  bestScore,
  totalQuestionsSolved,
  concentrationHistory,
  onStart,
  configs,
}: {
  history: GameSession[];
  bestScore: number;
  totalQuestionsSolved: number;
  concentrationHistory: ConcentrationSession[];
  onStart: () => void;
  configs: ReturnType<typeof useGameStore.getState>['configs'];
}) {
  const { recommendation } = buildGuidedRecommendation(history, configs);
  const avgAccuracy = history.length > 0 
    ? (history.reduce((acc: number, s) => acc + (s.firstPassPrecision ?? s.accuracy), 0) / history.length).toFixed(1) 
    : 0;

  const calculateBenchmark = () => {
    if (history.length === 0) return 0;
    const latest = history[0];
    const durationSeconds = Math.max((latest.endTime - latest.startTime) / 1000, 1);
    return computeDifficultyWeightedMetrics(latest.questions, durationSeconds).weightedBenchmark;
  };

  const benchmark = calculateBenchmark();

  const getImprovementTip = () => {
    if (history.length === 0) return "Launch your first session to receive tactical advice.";
    const latest = history[0];
    const durationMins = (latest.endTime - latest.startTime) / 60000;
    const qpm = latest.totalQuestions / durationMins;
    const weighted = computeDifficultyWeightedMetrics(
      latest.questions,
      Math.max((latest.endTime - latest.startTime) / 1000, 1)
    );
    
    const firstPass = latest.firstPassPrecision ?? latest.accuracy;

    if (firstPass < 85) {
      return "Priority: First-pass precision. Too many items are being corrected after an initial miss. Slow down slightly and target clean first submissions.";
    }
    if (qpm < 25) {
      return "Priority: Latency. Accuracy is solid, but hesitation is high. Trust your first computation; don't double-check simple operations. Aim for a faster rhythm.";
    }
    if (weighted.avgDifficulty < 1.1) {
      return "Priority: Difficulty. Increase operand ranges and operation mix; your weighted benchmark is being capped by low challenge level.";
    }
    if (benchmark < 85) {
      return "Priority: Endurance. Your metrics are good, but session volume or difficulty is low. Increase operand ranges to 2-digit multiplications to push your cognitive ceiling.";
    }
    return "Status: Elite. You are meeting the junior trader benchmark. Maintain this level by introducing Fatigue Mode distractors to simulate floor pressure.";
  };

  const improvementTip = getImprovementTip();
  const bestConcentration = concentrationHistory.length > 0
    ? Math.min(...concentrationHistory.map((s) => s.totalMs))
    : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-1">Command Dashboard</h2>
          <p className="text-muted font-medium">Real-time performance telemetry and benchmarks.</p>
        </div>
        <button 
          onClick={onStart}
          className="bg-primary text-white px-6 py-2 rounded-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Play size={18} fill="currentColor" />
          LAUNCH TERMINAL
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Personal Best" value={bestScore} icon={<TrendingUp className="text-primary" />} />
        <StatCard label="First-Pass %" value={`${avgAccuracy}%`} icon={<Target className="text-secondary" />} />
        <StatCard label="Elite Benchmark" value={`${benchmark}%`} icon={<Trophy className={benchmark > 80 ? "text-primary" : "text-muted"} />} />
        <StatCard label="Total Vol" value={totalQuestionsSolved} icon={<Zap className="text-accent" />} />
      </div>

      <div className="terminal-card">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <Grid3x3 size={14} className="text-secondary" />
            Concentration Grid
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Best time: {bestConcentration ? `${(bestConcentration / 1000).toFixed(2)}s` : 'No runs yet'}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 terminal-card">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" />
            Performance Analytics
          </h3>
          <AnalyticsDashboard />
        </div>

        <div className="terminal-card">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BrainCircuit size={20} className="text-secondary" />
            Elite Junior Trader Target
          </h3>
          <div className="space-y-6">
            <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-sm">
              <h4 className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-1">Tactical Advisory</h4>
              <p className="text-xs leading-relaxed italic font-medium">{improvementTip}</p>
            </div>
            <div className="relative h-4 bg-background border border-border rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${benchmark}%` }}
                className={`absolute top-0 left-0 h-full ${benchmark > 70 ? 'bg-primary' : 'bg-secondary'}`}
              />
            </div>
            <div className="flex justify-between text-[10px] uppercase font-bold text-muted">
              <span>Novice</span>
              <span>Target (Elite)</span>
            </div>
            
            <div className="pt-4 border-t border-border space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted">Required QPM</span>
                <span className="font-mono font-bold">{BENCHMARK_TARGET_QPM.toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-muted">Target Accuracy</span>
                <span className="font-mono font-bold text-primary">98%</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2">{recommendation.title}</h4>
              <p className="text-xs text-muted leading-relaxed mb-2">{recommendation.summary}</p>
              <p className="text-[11px] font-mono text-secondary">{recommendation.targetMetric}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="terminal-card flex items-center justify-between">
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted mb-1 font-bold">{label}</p>
        <p className="text-2xl font-bold font-mono">{value}</p>
      </div>
      <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}

function SettingsPanel({ theme, setTheme }: { theme: ThemeType; setTheme: (theme: ThemeType) => void }) {
  return (
    <div className="terminal-card max-w-2xl mx-auto">
      <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
        <Settings size={24} className="text-primary" />
        System Configuration
      </h3>
      <div className="space-y-8">
        <div>
          <label className="text-sm font-bold mb-4 block uppercase tracking-widest text-muted">Interface Theme</label>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setTheme('terminal-dark')}
              className={`px-4 py-3 text-xs font-bold rounded-sm border transition-all tracking-widest ${
                theme === 'terminal-dark' ? 'bg-primary text-white border-primary shadow-sm' : 'border-border hover:bg-foreground/5 text-muted'
              }`}
            >
              TERMINAL DARK
            </button>
            <button 
              onClick={() => setTheme('bloomberg-light')}
              className={`px-4 py-3 text-xs font-bold rounded-sm border transition-all tracking-widest ${
                theme === 'bloomberg-light' ? 'bg-primary text-white border-primary shadow-sm' : 'border-border hover:bg-foreground/5 text-muted'
              }`}
            >
              BLOOMBERG LIGHT
            </button>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border">
          <label className="text-sm font-bold mb-4 block uppercase tracking-widest text-muted">Audio Telemetry</label>
          <div className="flex items-center justify-between p-4 bg-background/50 border border-border/50 rounded-sm">
            <div className="flex items-center gap-3">
              <Volume2 size={20} className="text-primary" />
              <div>
                <p className="text-sm font-bold">Haptic Feedback</p>
                <p className="text-[10px] text-muted font-bold uppercase tracking-tight">Vibrate on incorrect submission</p>
              </div>
            </div>
            <div className="w-10 h-5 bg-muted/20 rounded-full relative cursor-pointer">
              <div className="absolute left-1 top-1 w-3 h-3 bg-muted rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
