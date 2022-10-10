import React, { createContext, useState, useEffect } from 'react';
import { get } from '../helpers/fetch';

export const AppSettingsContext = createContext();

const AppSettingsProvider = ({ children }) => {
  const [appSettings, setAppSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const settings = await get('/api/settings');
      console.log(settings);
      if (settings) {
        setAppSettings(settings);
        setLoading(false);
      }
      setLoading(false);
    })();
  }, []);

  return <AppSettingsContext.Provider value={{ appSettings: appSettings, appSettingsLoading: loading }}>{children}</AppSettingsContext.Provider>;
};

AppSettingsProvider.displayName = 'AppSettingsProvider';
export default AppSettingsProvider;
