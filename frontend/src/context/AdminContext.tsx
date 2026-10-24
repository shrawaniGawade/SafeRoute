import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { fetchAdminStats, deleteAdminUser, type AdminStatsResponse } from '../services/api';

interface AdminContextType {
  data: AdminStatsResponse | null;
  loading: boolean;
  actionMessage: string | null;
  loadStats: () => Promise<void>;
  handleDeleteUser: (userId: string, email: string) => Promise<boolean>;
  setActionMessage: (message: string | null) => void;
  formatUptime: (seconds?: number) => string;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchAdminStats();
      setData(res);
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    const interval = setInterval(() => {
      loadStats();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadStats]);

  const handleDeleteUser = async (userId: string, email: string): Promise<boolean> => {
    if (!window.confirm(`Are you sure you want to permanently delete user account: ${email}?`)) {
      return false;
    }
    try {
      await deleteAdminUser(userId);
      setActionMessage(`User account ${email} successfully deleted.`);
      setTimeout(() => setActionMessage(null), 4000);
      await loadStats();
      return true;
    } catch (err: any) {
      setActionMessage(err.message || 'Failed to delete user account');
      setTimeout(() => setActionMessage(null), 4500);
      return false;
    }
  };

  const formatUptime = (seconds?: number): string => {
    if (!seconds && seconds !== 0) return '1m 20s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs}s`;
  };

  return (
    <AdminContext.Provider
      value={{
        data,
        loading,
        actionMessage,
        loadStats,
        handleDeleteUser,
        setActionMessage,
        formatUptime,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = (): AdminContextType => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
