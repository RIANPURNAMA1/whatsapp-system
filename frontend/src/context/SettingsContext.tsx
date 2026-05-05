import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export interface GeneralSettings {
  sessionTimeout: string;
  theme: "light" | "dark";
  language: string;
  timezone: string;
  notificationSound: boolean;
  desktopNotification: boolean;
  autoRefresh: boolean;
  refreshInterval: string;
}

interface SettingsContextType {
  settings: GeneralSettings;
  updateSetting: <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: GeneralSettings = {
  sessionTimeout: "60",
  theme: "light",
  language: "id",
  timezone: "Asia/Jakarta",
  notificationSound: true,
  desktopNotification: true,
  autoRefresh: true,
  refreshInterval: "30",
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<GeneralSettings>(defaultSettings);

  const loadSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_URL}/settings/general`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success && data.data) {
        setSettings(prev => ({ ...prev, ...data.data }));
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  }, []);

  const updateSetting = useCallback(async <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/settings/general`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings: { [key]: value } }),
      });
    } catch (err) {
      console.error("Failed to save setting:", err);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.theme]);

  useEffect(() => {
    if (settings.desktopNotification && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [settings.desktopNotification]);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
};
