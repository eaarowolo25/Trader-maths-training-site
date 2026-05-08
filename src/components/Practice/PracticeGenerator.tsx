'use client';

import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { ArithmeticType } from '@/lib/arithmetic';
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
  Zap
} from 'lucide-react';

const TYPE_ICONS: Record<string, any> = {
  addition: Plus,
  subtraction: Minus,
  multiplication: X,
  division: Divide,
  percentage: Percent,
  decimal: CircleDot,
  fraction: Hash,
};

export default function PracticeGenerator({ onStart }: { onStart: () => void }) {
  const { 
    configs, 
    activeTypes, 
    toggleType, 
    updateConfig, 
    sessionDuration, 
    setSessionDuration,
    isAuditory,
    toggleAuditory,
    isFatigue,
    toggleFatigue
  } = useGameStore();

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-1">Custom Generator</h2>
          <p className="text-muted-foreground">Configure your training parameters.</p>
        </div>
        <button 
          onClick={onStart}
          disabled={activeTypes.length === 0}
          className="bg-primary text-background px-8 py-3 rounded-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play size={20} fill="currentColor" />
          START TRAINING
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
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
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'bg-background border-border text-muted-foreground hover:border-muted-foreground'
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
            <h3 className="text-lg font-bold mb-6">Granular Configuration</h3>
            <div className="space-y-8">
              {activeTypes.map((type) => (
                <div key={type} className="p-4 border border-border/50 rounded-sm bg-background/50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold uppercase text-sm text-primary">{type}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs text-muted-foreground uppercase mb-2 block tracking-widest">Left Digits</label>
                      <input 
                        type="range" min="1" max="5" 
                        value={configs[type].leftDigits || 1}
                        onChange={(e) => updateConfig(type, { leftDigits: parseInt(e.target.value) })}
                        className="w-full accent-primary"
                      />
                      <div className="flex justify-between text-[10px] mt-1 font-mono">
                        <span>1</span>
                        <span className="text-primary font-bold">{configs[type].leftDigits || 1} DIGITS</span>
                        <span>5</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground uppercase mb-2 block tracking-widest">Right Digits</label>
                      <input 
                        type="range" min="1" max="5" 
                        value={configs[type].rightDigits || 1}
                        onChange={(e) => updateConfig(type, { rightDigits: parseInt(e.target.value) })}
                        className="w-full accent-primary"
                      />
                      <div className="flex justify-between text-[10px] mt-1 font-mono">
                        <span>1</span>
                        <span className="text-primary font-bold">{configs[type].rightDigits || 1} DIGITS</span>
                        <span>5</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {activeTypes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground italic">
                  Select a category above to configure digit lengths.
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
                  className={`py-2 rounded-sm border text-xs font-bold transition-all ${
                    sessionDuration === d 
                      ? 'bg-secondary/10 border-secondary text-secondary' 
                      : 'border-border text-muted-foreground hover:border-muted-foreground'
                  }`}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          <div className="terminal-card">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-accent">
              <Volume2 size={20} />
              Audio & Modes
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">Auditory Mode</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Spoken questions only</p>
                </div>
                <button 
                  onClick={toggleAuditory}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isAuditory ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isAuditory ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">Fatigue Simulation</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Screen flashes & pressure</p>
                </div>
                <button 
                  onClick={toggleFatigue}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isFatigue ? 'bg-primary' : 'bg-muted'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isFatigue ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
