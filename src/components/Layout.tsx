import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard, Camera, Plane, Bell, BarChart3, Shield,
  Wifi, WifiOff, ChevronLeft, ChevronRight, Zap, Cloud, Sun, CloudRain, CloudLightning,
  AlertTriangle, CheckCircle, Languages, Clapperboard, Leaf
} from 'lucide-react';
import type { Language } from '../types';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Overview', id: 'nav-overview' },
  { path: '/camera', icon: Camera, label: 'Camera Feed', id: 'nav-camera' },
  { path: '/drone', icon: Plane, label: 'Drone Control', id: 'nav-drone' },
  { path: '/alerts', icon: Bell, label: 'Alerts & Events', id: 'nav-alerts' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics', id: 'nav-analytics' },
  { path: '/crop-health', icon: Leaf, label: 'Crop Health', id: 'nav-crop-health' },
];

const LANG_LABELS: Record<Language, string> = { en: 'EN', hi: 'हिंदी', mr: 'मराठी' };

const WeatherIcon = ({ condition }: { condition: string }) => {
  if (condition === 'Storm') return <CloudLightning size={14} className="text-yellow-400" />;
  if (condition === 'Rain') return <CloudRain size={14} className="text-blue-400" />;
  if (condition === 'Cloudy') return <Cloud size={14} className="text-gray-400" />;
  return <Sun size={14} className="text-yellow-300" />;
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const { state, dispatch, runDemo } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const controlModeColors = {
    manual: 'text-amber-400',
    assisted: 'text-blue-400',
    autonomous: 'text-green-400',
  };

  const statusColors = {
    Active: 'badge-green',
    Alert: 'badge-red',
    Idle: 'badge-blue',
    Patrol: 'badge-cyan',
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>

      {/* 🚨 LOCKDOWN OVERLAY */}
      {state.lockdownMode && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* Red pulsing border */}
          <div className="absolute inset-0 border-4 border-red-500 animate-pulse" style={{ boxShadow: '0 0 60px rgba(239,68,68,0.4) inset' }} />
          {/* Top banner */}
          <div className="pointer-events-auto absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3"
            style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0.95), rgba(185,28,28,0.95))' }}>
            <div className="flex items-center gap-3 animate-pulse">
              <AlertTriangle size={20} className="text-white" />
              <span className="text-white font-black text-base tracking-widest">🚨 EMERGENCY LOCKDOWN ACTIVE</span>
              <AlertTriangle size={20} className="text-white" />
            </div>
            <div className="flex items-center gap-4 text-white text-xs">
              <span>🚁 Drone deployed</span>
              <span>📱 Farmer notified</span>
              <span>🌐 Network alerted</span>
              <button
                onClick={() => dispatch({ type: 'CANCEL_LOCKDOWN' })}
                className="ml-2 px-3 py-1 rounded-lg font-semibold text-xs"
                style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)' }}>
                Cancel Lockdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside
        className="flex flex-col transition-all duration-300 shrink-0"
        style={{
          width: collapsed ? '72px' : '240px',
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border-color)',
          zIndex: 40,
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'var(--border-color)', minHeight: '64px' }}>
          <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center animate-glow-green"
            style={{ background: 'linear-gradient(135deg, #10b981, #38bdf8)' }}>
            <Shield size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="font-bold text-sm gradient-text">Rakshak</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>KrishiNet 2.0</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto p-1 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            id="sidebar-toggle"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* System Status */}
        {!collapsed && (
          <div className="px-3 py-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>System Status</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[state.status]}`}>
                {state.status}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {state.isOnline ? (
                <Wifi size={12} className="text-green-400" />
              ) : (
                <WifiOff size={12} className="text-amber-400 animate-blink" />
              )}
              <span className="text-xs" style={{ color: state.isOnline ? '#4ade80' : '#fbbf24' }}>
                {state.isOnline ? 'Cloud Connected' : 'Edge AI Mode'}
              </span>
            </div>
            {/* AI Confidence badge */}
            {state.currentThreat && (
              <div className="mt-2 flex items-center gap-1.5 text-xs" style={{ color: '#a78bfa' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                AI Confidence: <span className="font-bold">{state.currentThreat.confidence}%</span>
              </div>
            )}
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navItems.map(({ path, icon: Icon, label, id }) => (
            <NavLink
              key={path}
              to={path}
              id={id}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              end={path === '/'}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="text-sm">{label}</span>}
              {!collapsed && path === '/alerts' && state.alerts.filter(a => !a.resolved).length > 0 && (
                <span className="ml-auto text-xs badge-red px-1.5 py-0.5 rounded-full">
                  {state.alerts.filter(a => !a.resolved).length}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-3 border-t space-y-2" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-2 px-2">
              <WeatherIcon condition={state.weather.condition} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{state.weather.condition} · {state.weather.temperature}°C</span>
            </div>
            <div className="flex items-center gap-2 px-2">
              <Zap size={12} className={controlModeColors[state.controlMode]} />
              <span className={`text-xs font-medium ${controlModeColors[state.controlMode]}`}>
                {state.controlMode.charAt(0).toUpperCase() + state.controlMode.slice(1)} Mode
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header
          className="shrink-0 flex items-center gap-3 px-4"
          style={{
            height: '64px',
            background: state.lockdownMode ? 'rgba(244,63,94,0.15)' : 'var(--bg-secondary)',
            borderBottom: `1px solid ${state.lockdownMode ? 'rgba(244,63,94,0.5)' : 'var(--border-color)'}`,
            transition: 'background 0.5s',
          }}
        >
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {navItems.find(n => n.path === location.pathname)?.label || 'Overview'}
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Rakshak KrishiNet 2.0 &mdash; AI-Powered Farm Defense
            </p>
          </div>

          {/* Header controls */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Demo Mode button */}
            <button
              id="demo-mode-btn"
              onClick={runDemo}
              disabled={state.demoRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: state.demoRunning ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.15)',
                border: '1px solid rgba(139,92,246,0.5)',
                color: state.demoRunning ? '#c4b5fd' : '#a78bfa',
                opacity: state.demoRunning ? 0.7 : 1,
              }}
            >
              <Clapperboard size={12} />
              {state.demoRunning ? '▶ Running...' : '🎬 Demo'}
            </button>

            {/* Language selector */}
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
              {(['en', 'hi', 'mr'] as Language[]).map(lang => (
                <button
                  key={lang}
                  id={`lang-${lang}`}
                  onClick={() => dispatch({ type: 'SET_LANGUAGE', payload: lang })}
                  className="px-2 py-1.5 text-xs font-medium transition-all flex items-center gap-1"
                  style={{
                    background: state.language === lang ? 'rgba(34,197,94,0.2)' : 'transparent',
                    color: state.language === lang ? '#4ade80' : 'var(--text-muted)',
                  }}
                >
                  {lang === 'en' ? '' : lang === 'hi' ? '🇮🇳' : '🌾'} {LANG_LABELS[lang]}
                </button>
              ))}
            </div>

            {/* Edge AI toggle */}
            <button
              id="edge-ai-toggle"
              onClick={() => dispatch({ type: 'TOGGLE_EDGE_MODE' })}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: state.edgeMode ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.1)',
                border: `1px solid ${state.edgeMode ? 'rgba(245,158,11,0.4)' : 'rgba(34,197,94,0.3)'}`,
                color: state.edgeMode ? '#fbbf24' : '#4ade80',
              }}
            >
              {state.edgeMode ? <WifiOff size={12} /> : <Wifi size={12} />}
              {state.edgeMode ? 'Edge AI' : 'Cloud'}
            </button>

            {/* Control mode selector */}
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
              {(['manual', 'assisted', 'autonomous'] as const).map(mode => (
                <button
                  key={mode}
                  id={`ctrl-mode-${mode}`}
                  onClick={() => dispatch({ type: 'SET_CONTROL_MODE', payload: mode })}
                  className="px-2 py-1.5 text-xs font-medium transition-all capitalize"
                  style={{
                    background: state.controlMode === mode
                      ? mode === 'manual' ? 'rgba(245,158,11,0.2)' : mode === 'assisted' ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.2)'
                      : 'transparent',
                    color: state.controlMode === mode
                      ? mode === 'manual' ? '#fbbf24' : mode === 'assisted' ? '#60a5fa' : '#4ade80'
                      : 'var(--text-muted)',
                  }}
                >
                  {mode === 'manual' ? '✋' : mode === 'assisted' ? '🤝' : '🤖'}
                </button>
              ))}
            </div>

            {/* Language indicator */}
            <Languages size={14} style={{ color: 'var(--text-muted)' }} />

            {/* Threat badge */}
            {state.currentThreat && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg animate-threat" style={{
                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171',
              }}>
                <AlertTriangle size={12} />
                <span className="text-xs font-bold">ALERT</span>
              </div>
            )}

            {/* Security mode */}
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
              {(['low', 'medium', 'high'] as const).map(mode => (
                <button
                  key={mode}
                  id={`sec-mode-${mode}`}
                  onClick={() => dispatch({ type: 'SET_SECURITY_MODE', payload: mode })}
                  className="px-2 py-1.5 text-xs font-medium transition-all capitalize"
                  style={{
                    background: state.securityMode === mode
                      ? mode === 'low' ? 'rgba(34,197,94,0.2)' : mode === 'medium' ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)'
                      : 'transparent',
                    color: state.securityMode === mode
                      ? mode === 'low' ? '#4ade80' : mode === 'medium' ? '#60a5fa' : '#f87171'
                      : 'var(--text-muted)',
                  }}
                >
                  {mode === 'high' ? '🔴' : mode === 'medium' ? '🟡' : '🟢'}
                </button>
              ))}
            </div>

            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{ background: 'linear-gradient(135deg, #10b981, #38bdf8)' }}>
              🧑‍🌾
            </div>
          </div>
        </header>

        {/* Pending Action Modal (Manual Mode) */}
        {state.pendingAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(9,9,11,0.8)', backdropFilter: 'blur(4px)' }}>
            <div className="glass-card p-6 max-w-md w-full mx-4 animate-fadeInUp">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.2)' }}>
                  <AlertTriangle size={20} className="text-amber-400" />
                </div>
                <div>
                  <div className="font-bold" style={{ color: 'var(--text-primary)' }}>Manual Approval Required</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>✋ Manual Mode — Your decision needed</div>
                </div>
              </div>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{state.pendingAction.description}</p>
              <div className="flex gap-3">
                <button
                  id="approve-action-btn"
                  onClick={() => dispatch({ type: 'APPROVE_ACTION' })}
                  className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all"
                  style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.4)' }}
                >
                  <CheckCircle size={14} className="inline mr-2" />Approve & Deploy
                </button>
                <button
                  id="dismiss-action-btn"
                  onClick={() => dispatch({ type: 'DISMISS_ACTION' })}
                  className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
