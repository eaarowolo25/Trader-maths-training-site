'use client';

import React, { useState } from 'react';
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
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PracticeGenerator from '@/components/Practice/PracticeGenerator';
import LiveSpeedMode from '@/components/Practice/LiveSpeedMode';
import AnalyticsDashboard from '@/components/Analytics/AnalyticsDashboard';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'practice' | 'settings' | 'game'>('dashboard');
  const { history, bestScore, totalQuestionsSolved } = useGameStore();

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard history={history} bestScore={bestScore} totalQuestionsSolved={totalQuestionsSolved} onStart={() => setActiveTab('practice')} />;
      case 'practice':
        return <PracticeGenerator onStart={() => setActiveTab('game')} />;
      case 'game':
        return <LiveSpeedMode onExit={() => setActiveTab('dashboard')} />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <Dashboard history={history} bestScore={bestScore} totalQuestionsSolved={totalQuestionsSolved} onStart={() => setActiveTab('practice')} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      {activeTab !== 'game' && (
        <aside className="w-64 border-r border-border flex flex-col p-4 bg-card">
          <div className="mb-8 px-2 flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center">
              <Zap className="text-background fill-background" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight neon-text">TRADERMATH</h1>
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
              icon={<BarChart3 size={20} />} 
              label="Analytics" 
              active={false} 
              onClick={() => {}} 
            />
            <SidebarItem 
              icon={<Settings size={20} />} 
              label="Settings" 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')} 
            />
          </nav>

          <div className="mt-auto p-4 border border-border rounded-sm bg-background/50">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <p className="text-sm font-medium">Terminal Online</p>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-6xl mx-auto"
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
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all text-sm font-medium ${
        active 
          ? 'bg-primary/10 text-primary border-r-2 border-primary' 
          : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Dashboard({ history, bestScore, totalQuestionsSolved, onStart }: any) {
  const avgAccuracy = history.length > 0 
    ? (history.reduce((acc: number, s: any) => acc + s.accuracy, 0) / history.length).toFixed(1) 
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-1">Terminal Overview</h2>
          <p className="text-muted-foreground">Monitor your trading-cognition performance metrics.</p>
        </div>
        <button 
          onClick={onStart}
          className="bg-primary text-background px-6 py-2 rounded-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
        >
          <Play size={18} fill="currentColor" />
          LAUNCH SESSION
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Personal Best" value={bestScore} icon={<TrendingUp className="text-primary" />} />
        <StatCard label="Accuracy" value={`${avgAccuracy}%`} icon={<Target className="text-secondary" />} />
        <StatCard label="Total Solved" value={totalQuestionsSolved} icon={<Zap className="text-accent" />} />
        <StatCard label="Avg Response" value="1.2s" icon={<Clock className="text-blue-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 terminal-card">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" />
            Performance Trend
          </h3>
          <AnalyticsDashboard />
        </div>

        <div className="terminal-card">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <BrainCircuit size={20} className="text-secondary" />
            Active Modes
          </h3>
          <div className="space-y-4">
            <ModeStatus label="Speed Mode" active={true} />
            <ModeStatus label="Auditory Mode" active={false} />
            <ModeStatus label="Fatigue Simulation" active={false} />
            <ModeStatus label="Interview Simulation" active={false} />
          </div>
        </div>
      </div>

      <div className="terminal-card">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Clock size={20} className="text-accent" />
          Recent Session History
        </h3>
        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                  <th className="pb-3 px-2">Date</th>
                  <th className="pb-3 px-2">Score</th>
                  <th className="pb-3 px-2">Accuracy</th>
                  <th className="pb-3 px-2">Mode</th>
                </tr>
              </thead>
              <tbody>
                {history.map((session: any) => (
                  <tr key={session.id} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-2 font-mono">{new Date(session.startTime).toLocaleDateString()}</td>
                    <td className="py-3 px-2 text-primary font-bold">{session.score}</td>
                    <td className="py-3 px-2">{session.accuracy}%</td>
                    <td className="py-3 px-2 text-xs uppercase tracking-tight text-muted-foreground">Standard</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No session telemetry recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="terminal-card flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold font-mono">{value}</p>
      </div>
      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
        {icon}
      </div>
    </div>
  );
}

function ModeStatus({ label, active }: { label: string, active: boolean }) {
  return (
    <div className="flex items-center justify-between p-3 border border-border/50 rounded-sm bg-background/50">
      <span className="text-sm">{label}</span>
      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
        active ? 'bg-primary/20 text-primary' : 'bg-muted/20 text-muted-foreground'
      }`}>
        {active ? 'Ready' : 'Disabled'}
      </span>
    </div>
  );
}

function SettingsPanel() {
  return (
    <div className="terminal-card max-w-2xl mx-auto">
      <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
        <Settings size={24} className="text-primary" />
        System Configuration
      </h3>
      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium mb-2 block">Theme</label>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-primary text-background text-sm font-bold rounded-sm">TERMINAL DARK</button>
            <button className="px-4 py-2 border border-border text-sm font-bold rounded-sm hover:bg-white/5">BLOOMBERG LIGHT</button>
          </div>
        </div>
        
        <div className="pt-6 border-t border-border">
          <label className="text-sm font-medium mb-4 block">Audio Feedback</label>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 size={20} className="text-muted-foreground" />
              <span className="text-sm">Response Success Chime</span>
            </div>
            <div className="w-10 h-5 bg-primary/20 rounded-full relative">
              <div className="absolute right-0 w-5 h-5 bg-primary rounded-full shadow-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
