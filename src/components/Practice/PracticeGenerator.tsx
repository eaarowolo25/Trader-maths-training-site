'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { ArithmeticType } from '@/lib/arithmetic';
import { buildGuidedRecommendation } from '@/lib/adaptive';
import { 
  Plus, 
  Minus, 
  X, 
  Divide, 
  Percent, 
  CircleDot, 
  Hash,
  Play,
  Clock,
  Volume2,
  Zap,
  Target,
  ArrowUp
} from 'lucide-react';

const TYPE_ICONS: Record<string, any> = {
  addition: Plus,
  subtraction: Minus,
  multiplication: X,
  division: Divide,
  percentage: Percent,
  decimal: CircleDot,
  fraction: Hash,
  indices: ArrowUp,
};

export default function PracticeGenerator({ onStart }: { onStart: () => void }) {
  const { 
    configs, 
    history,
    activeTypes, 
    toggleType, 
    updateConfig, 
    setPracticeSetup,
    sessionDuration, 
    setSessionDuration,
    isAuditory,
    toggleAuditory,
    isFatigue,
    toggleFatigue
  } = useGameStore();
  const [mode, setMode] = React.useState<'manual' | 'guided'>('manual');
  const guided = buildGuidedRecommendation(history, configs);

  const applyGuidedPlan = () => {
    setPracticeSetup({
      activeTypes: guided.recommendation.focusTypes,
      duration: guided.recommendation.duration,
      configOverrides: guided.configOverrides,
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-1">Custom Generator</h2>
          <p className="text-muted-foreground">Configure your training parameters with precise range control.</p>
        </div>
        <button 
          onClick={onStart}
          disabled={activeTypes.length === 0}
          className="bg-primary text-white px-8 py-3 rounded-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Play size={20} fill="currentColor" />
          START TRAINING
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="terminal-card">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-secondary">
              <Target size={20} />
              Training Mode
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => setMode('manual')}
                className={`py-2 rounded-sm border text-xs font-bold transition-all tracking-tight ${
                  mode === 'manual'
                    ? 'bg-secondary/10 border-secondary text-secondary shadow-sm'
                    : 'border-border text-muted hover:border-muted'
                }`}
              >
                MANUAL
              </button>
              <button
                onClick={() => setMode('guided')}
                className={`py-2 rounded-sm border text-xs font-bold transition-all tracking-tight ${
                  mode === 'guided'
                    ? 'bg-secondary/10 border-secondary text-secondary shadow-sm'
                    : 'border-border text-muted hover:border-muted'
                }`}
              >
                GUIDED
              </button>
            </div>
            {mode === 'guided' && (
              <div className="p-3 border border-secondary/20 bg-secondary/5 rounded-sm">
                <p className="text-[10px] uppercase tracking-widest font-bold text-secondary mb-1">{guided.recommendation.title}</p>
                <p className="text-xs text-muted mb-2">{guided.recommendation.summary}</p>
                <p className="text-[11px] font-mono mb-3">Target: {guided.recommendation.targetMetric}</p>
                <button
                  onClick={applyGuidedPlan}
                  className="px-3 py-2 text-xs rounded-sm border border-secondary/40 text-secondary font-bold hover:bg-secondary/10 transition-all"
                >
                  APPLY GUIDED SETUP
                </button>
              </div>
            )}
          </div>

          <div className="terminal-card">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-primary">
              <Zap size={20} />
              Arithmetic Categories
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(Object.keys(configs) as ArithmeticType[]).map((type) => {
                const Icon = TYPE_ICONS[type] || Plus;
                const active = activeTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`flex flex-col items-center justify-center p-4 rounded-sm border transition-all ${
                      active 
                        ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                        : 'bg-background border-border text-muted hover:border-muted'
                    }`}
                  >
                    <Icon size={24} className="mb-2" />
                    <span className="text-xs font-bold uppercase tracking-tighter">{type}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="terminal-card">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Target size={20} className="text-primary" />
              Range Configuration
            </h3>
            <div className="space-y-6">
              {activeTypes.map((type) => (
                <div key={type} className="p-4 border border-border/50 rounded-sm bg-background/50">
                  <div className="flex items-center justify-between mb-4 border-b border-border/30 pb-2">
                    <span className="font-bold uppercase text-sm text-primary tracking-widest">{type}</span>
                    <span className="text-[10px] text-muted uppercase font-bold tracking-tight">Precision Calibration</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] text-muted uppercase tracking-[0.2em] font-bold block">Base Range (Left)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number"
                          value={configs[type].leftMin || 2}
                          onChange={(e) => updateConfig(type, { leftMin: parseInt(e.target.value) })}
                          className="w-full bg-card border border-border p-2 text-center font-mono text-sm rounded-sm focus:ring-1 focus:ring-primary"
                          placeholder="Min"
                        />
                        <span className="text-muted text-xs font-bold">TO</span>
                        <input 
                          type="number"
                          value={configs[type].leftMax || 100}
                          onChange={(e) => updateConfig(type, { leftMax: parseInt(e.target.value) })}
                          className="w-full bg-card border border-border p-2 text-center font-mono text-sm rounded-sm focus:ring-1 focus:ring-primary"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] text-muted uppercase tracking-[0.2em] font-bold block">Exponent/Operand Range (Right)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number"
                          value={configs[type].rightMin || 2}
                          onChange={(e) => updateConfig(type, { rightMin: parseInt(e.target.value) })}
                          className="w-full bg-card border border-border p-2 text-center font-mono text-sm rounded-sm focus:ring-1 focus:ring-primary"
                          placeholder="Min"
                        />
                        <span className="text-muted text-xs font-bold">TO</span>
                        <input 
                          type="number"
                          value={configs[type].rightMax || 100}
                          onChange={(e) => updateConfig(type, { rightMax: parseInt(e.target.value) })}
                          className="w-full bg-card border border-border p-2 text-center font-mono text-sm rounded-sm focus:ring-1 focus:ring-primary"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {activeTypes.length === 0 && (
                <div className="text-center py-12 text-muted italic border border-dashed border-border rounded-sm font-medium">
                  Select arithmetic telemetry channels above to begin calibration.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="terminal-card">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-secondary">
              <Clock size={20} />
              Session Duration
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[60, 120, 300, 600].map((d) => (
                <button
                  key={d}
                  onClick={() => setSessionDuration(d)}
                  className={`py-2 rounded-sm border text-xs font-bold transition-all tracking-tight ${
                    sessionDuration === d 
                      ? 'bg-secondary/10 border-secondary text-secondary shadow-sm' 
                      : 'border-border text-muted hover:border-muted'
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          <div className="terminal-card border-accent/20">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-accent">
              <Volume2 size={20} />
              Tactical Modes
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-border/50 rounded-sm bg-background/30">
                <div>
                  <p className="text-sm font-bold">Auditory Mode</p>
                  <p className="text-[10px] text-muted uppercase tracking-wider font-bold">Audio questions only</p>
                </div>
                <button 
                  onClick={toggleAuditory}
                  className={`w-12 h-6 rounded-full transition-all relative ${isAuditory ? 'bg-primary shadow-sm' : 'bg-muted/20'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAuditory ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 border border-border/50 rounded-sm bg-background/30">
                <div>
                  <p className="text-sm font-bold">Fatigue Simulation</p>
                  <p className="text-[10px] text-muted uppercase tracking-wider font-bold">High-pressure rendering</p>
                </div>
                <button 
                  onClick={toggleFatigue}
                  className={`w-12 h-6 rounded-full transition-all relative ${isFatigue ? 'bg-primary shadow-sm' : 'bg-muted/20'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isFatigue ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-primary/5 border border-primary/20 rounded-sm shadow-sm">
            <h4 className="text-[10px] uppercase tracking-widest text-primary font-bold mb-2">Quant Tip</h4>
            <p className="text-xs text-muted leading-relaxed font-medium">
              Elite traders master indices (up to 20²) for rapid option pricing calculations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
