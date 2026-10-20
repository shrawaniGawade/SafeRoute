import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { SafetyInput, SafetyResult } from '../services/api';

export interface RoutePredictionRecord {
  id: string;
  source: string;
  destination: string;
  departureTime: string;
  travelMode: 'walking' | 'driving' | 'transit';
  profile: string;
  factors: SafetyInput;
  result: SafetyResult;
  timestamp: string;
}

export interface PredictionStats {
  totalEvaluated: number;
  averageScore: number;
  safeCount: number;
  cautionCount: number;
  highRiskCount: number;
}

interface PredictionContextType {
  currentPrediction: RoutePredictionRecord | null;
  history: RoutePredictionRecord[];
  stats: PredictionStats;
  setCurrentPrediction: (prediction: RoutePredictionRecord | null) => void;
  recordPrediction: (record: Omit<RoutePredictionRecord, 'id' | 'timestamp'>) => RoutePredictionRecord;
  clearHistory: () => void;
  deletePrediction: (id: string) => void;
}

const STORAGE_KEY = 'saferoute_prediction_history';

const PredictionContext = createContext<PredictionContextType | undefined>(undefined);

export const PredictionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<RoutePredictionRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore JSON parse errors
    }
    return [];
  });

  const [currentPrediction, setCurrentPrediction] = useState<RoutePredictionRecord | null>(() => {
    return history.length > 0 ? history[0] : null;
  });

  // Persist history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Storage quota or privacy mode
    }
  }, [history]);

  // Compute actual stats from real stored history
  const stats: PredictionStats = {
    totalEvaluated: history.length,
    averageScore:
      history.length > 0
        ? Math.round(
            history.reduce((acc, curr) => acc + curr.result.safety_score, 0) / history.length
          )
        : 0,
    safeCount: history.filter((h) => h.result.safety_score >= 80).length,
    cautionCount: history.filter(
      (h) => h.result.safety_score >= 50 && h.result.safety_score < 80
    ).length,
    highRiskCount: history.filter((h) => h.result.safety_score < 50).length,
  };

  const recordPrediction = (
    data: Omit<RoutePredictionRecord, 'id' | 'timestamp'>
  ): RoutePredictionRecord => {
    const newRecord: RoutePredictionRecord = {
      ...data,
      id: `pred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    setHistory((prev) => [newRecord, ...prev.slice(0, 49)]); // Keep latest 50
    setCurrentPrediction(newRecord);
    return newRecord;
  };

  const clearHistory = () => {
    setHistory([]);
    setCurrentPrediction(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  const deletePrediction = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (currentPrediction?.id === id) {
      setCurrentPrediction(history.find((item) => item.id !== id) || null);
    }
  };

  return (
    <PredictionContext.Provider
      value={{
        currentPrediction,
        history,
        stats,
        setCurrentPrediction,
        recordPrediction,
        clearHistory,
        deletePrediction,
      }}
    >
      {children}
    </PredictionContext.Provider>
  );
};

export const usePredictions = (): PredictionContextType => {
  const context = useContext(PredictionContext);
  if (!context) {
    throw new Error('usePredictions must be used within a PredictionProvider');
  }
  return context;
};
