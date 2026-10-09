import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './i18n';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('GlobalX Uncaught UI Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', color: '#f8fafc', padding: '24px', fontFamily: 'sans-serif' }}>
          <div style={{ maxWidth: '480px', width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '24px', padding: '32px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>GX</div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px' }}>GlobalX Platform Initializing</h2>
            <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 20px', lineHeight: 1.5 }}>A component encountered an issue loading. Click below to reload.</p>
            <button onClick={() => window.location.reload()} style={{ padding: '10px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Reload Platform</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
