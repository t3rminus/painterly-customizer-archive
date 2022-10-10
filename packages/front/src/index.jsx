import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App/App';
import AppSettingsProvider from './contexts/AppSettingsContext';
import './index.scss';

ReactDOM.render(
  <React.StrictMode>
    <AppSettingsProvider>
      <App />
    </AppSettingsProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
