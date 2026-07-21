import React, { createContext, useContext, useEffect, useState } from 'react';

interface BrandingConfig {
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  app_title: string;
}

interface ThemeContextType {
  config: BrandingConfig;
  loading: boolean;
}

const defaultConfig: BrandingConfig = {
  primary_color: '#3B82F6',
  secondary_color: '#1E293B',
  logo_url: 'https://assets.app.com/default-logo.png',
  app_title: 'Enterprise App',
};

const ThemeContext = createContext<ThemeContextType>({
  config: defaultConfig,
  loading: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<BrandingConfig>(defaultConfig);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/v1/tenant/config')
      .then((res) => res.json())
      .then((data: BrandingConfig) => {
        if (data.primary_color) {
          setConfig(data);
          document.documentElement.style.setProperty('--color-primary', data.primary_color);
          document.documentElement.style.setProperty('--color-secondary', data.secondary_color);
          document.documentElement.style.setProperty('--primary-color', data.primary_color);
          document.documentElement.style.setProperty('--secondary-color', data.secondary_color);
          document.title = data.app_title || 'Enterprise App';
        }
      })
      .catch((err) => console.error('Failed to load branding config:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ThemeContext.Provider value={{ config, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
