import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart2, TrendingUp, Shield, Leaf, Globe, CheckCircle, X,
  AlertCircle, Lightbulb, Brain, Sparkles
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  TREND_DATA, ZONE_VULNERABILITY, THREAT_DISTRIBUTION, CROP_HEALTH_TREND, HEATMAP_DATA
} from '../data/mockData';
import { getGeminiInsight } from '../services/gemini';

const CHART_TOOLTIP_STYLE = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '11px' },
};
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i}:00`);

function HeatCell({ value }: { value: number }) {
  const alpha = value / 100;
  const bg = value > 70 ? `rgba(239,68,68,${alpha})`
    : value > 40 ? `rgba(245,158,11,${alpha * 1.2})`
    : `rgba(34,197,94,${alpha * 0.8})`;
  return (
    <div className="heat-cell" style={{ width: 18, height: 18, background: bg, borderRadius: 3 }}
      title={`Risk: ${value}%`} />
  );
}

function SecurityScoreFullCard() {
  const { state } = useApp();
  const { securityScore } = state;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let frame = 0;
    const target = securityScore.overall;
    const interval = setInterval(() => {
      frame++;
      setDisplayed(Math.min(Math.round(target * frame / 50), target));
      if (frame >= 50) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, [securityScore.overall]);

  const factors = [
    { label: 'Camera Coverage', value: securityScore.coverage, color: '#3b82f6', icon: '📷' },
    { label: 'Response Time', value: securityScore.responseTime, color: '#22c55e', icon: '⚡' },
    { label: 'Zone Risk (inv.)', value: securityScore.zoneRisk, color: '#f59e0b', icon: '🗺️' },
    { label: 'Deterrent Rate', value: securityScore.deterrentEffectiveness, color: '#8b5cf6', icon: '🔊' },
    { label: 'Patrol Coverage', value: securityScore.patrolCoverage, color: '#06b6d4', icon: '🛰️' },
  ];

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={18} className="text-green-400" />
        <span className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Farm Security Score</span>
        <span className="ml-auto text-xs badge-green px-2 py-0.5 rounded-full">
          {securityScore.trend === 'increasing' ? '↑ Improving' : securityScore.trend === 'decreasing' ? '↓ Declining' : '→ Stable'}
        </span>
      </div>

      <div className="flex items-center gap-6 mb-5">
        {/* Gauge */}
        <div className="relative w-28 h-28 shrink-0">
          <svg viewBox="0 0 112 112" className="w-full h-full -rotate-90">
            <circle cx="56" cy="56" r="46" fill="none" stroke="rgba(71,85,105,0.3)" strokeWidth="8" />
            <circle cx="56" cy="56" r="46" fill="none" stroke="url(#scoreGrad)" strokeWidth="8"
              strokeDasharray={`${(displayed / 100) * 289} 289`} strokeLinecap="round" />
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black gradient-text">{displayed}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/100</span>
          </div>
        </div>

        {/* Factor breakdown */}
        <div className="flex-1 space-y-2">
          {factors.map(f => (
            <div key={f.label}>
              <div className="flex justify-between text-xs mb-0.5">
                <span style={{ color: 'var(--text-muted)' }}>{f.icon} {f.label}</span>
                <span className="font-mono font-bold" style={{ color: f.color }}>{f.value}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${f.value}%`, background: f.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 30-day trend */}
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={TREND_DATA}>
            <Line type="monotone" dataKey="securityScore" stroke="#22c55e" strokeWidth={2} dot={false} />
            <XAxis dataKey="day" tick={false} />
            <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [`${v}`, 'Score']} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RecommendationEngine() {
  const { state, dispatch } = useApp();
  const active = state.recommendations.filter(r => !r.dismissed);

  const priorityColor = (p: string) => p === 'high' ? '#ef4444' : p === 'medium' ? '#f59e0b' : '#22c55e';
  const priorityBg = (p: string) => p === 'high' ? 'rgba(239,68,68,0.08)' : p === 'medium' ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)';
  const priorityBorder = (p: string) => p === 'high' ? 'rgba(239,68,68,0.2)' : p === 'medium' ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)';

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb size={16} className="text-amber-400" />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Recommendation Engine</span>
        <span className="ml-auto text-xs badge-amber px-2 py-0.5 rounded-full">{active.length} active</span>
      </div>
      {active.length === 0 ? (
        <div className="text-center py-6">
          <CheckCircle size={28} className="text-green-400 mx-auto mb-2" />
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>All recommendations addressed</div>
        </div>
      ) : (
        <div className="space-y-2">
          {active.map(rec => (
            <div key={rec.id} className="p-3 rounded-xl"
              style={{ background: priorityBg(rec.priority), border: `1px solid ${priorityBorder(rec.priority)}` }}>
              <div className="flex items-start gap-2">
                <span className="text-base shrink-0">{rec.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold mb-0.5" style={{ color: priorityColor(rec.priority) }}>
                    {rec.title}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{rec.description}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button id={`rec-accept-${rec.id}`}
                    onClick={() => dispatch({ type: 'ACCEPT_RECOMMENDATION', payload: rec.id })}
                    className="p-1 rounded-lg transition-all" style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}
                    title="Accept">
                    <CheckCircle size={12} />
                  </button>
                  <button id={`rec-dismiss-${rec.id}`}
                    onClick={() => dispatch({ type: 'DISMISS_RECOMMENDATION', payload: rec.id })}
                    className="p-1 rounded-lg transition-all" style={{ background: 'rgba(71,85,105,0.2)', color: 'var(--text-muted)' }}
                    title="Dismiss">
                    <X size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MultiFarmNetwork() {
  const { state } = useApp();
  const { networkFarms } = state;

  const statusColor: Record<string, string> = { normal: '#22c55e', elevated: '#f59e0b', alert: '#ef4444' };

  const netStats = {
    total: networkFarms.length,
    elevated: networkFarms.filter(f => f.status === 'elevated').length,
    sharedToday: state.totalThreatsToday > 0 ? state.totalThreatsToday - 2 : 0,
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Globe size={16} className="text-cyan-400" />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Multi-Farm Network</span>
        <span className="ml-auto text-xs badge-cyan px-2 py-0.5 rounded-full">
          {netStats.total} Farms Protected
        </span>
      </div>

      {/* Network map */}
      <div className="relative mb-4">
        <svg viewBox="0 0 380 200" className="w-full" style={{ maxHeight: '180px', background: 'rgba(15,23,42,0.4)', borderRadius: '8px' }}>
          <defs>
            <pattern id="net-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M30 0L0 0 0 30" fill="none" stroke="rgba(71,85,105,0.1)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="380" height="200" fill="url(#net-grid)" />

          {/* Connection lines */}
          {networkFarms.slice(1).map(farm => {
            const main = networkFarms[0];
            const color = farm.status === 'normal' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.5)';
            return (
              <line key={farm.id} x1={main.x} y1={main.y} x2={farm.x} y2={farm.y}
                stroke={color} strokeWidth={farm.status === 'elevated' ? 2 : 1} strokeDasharray="5 3" />
            );
          })}

          {/* Alert pulse when threat active */}
          {state.currentThreat && networkFarms.slice(1).filter(f => f.status === 'elevated').map(farm => (
            <circle key={`pulse-${farm.id}`} cx={farm.x} cy={farm.y} r={8} fill="none" stroke="#f59e0b" strokeWidth={1.5}>
              <animate attributeName="r" values="8;20;8" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
            </circle>
          ))}

          {/* Farm nodes */}
          {networkFarms.map(farm => {
            const isMain = farm.id === 'f1';
            const color = statusColor[farm.status];
            return (
              <g key={farm.id}>
                <circle cx={farm.x} cy={farm.y} r={isMain ? 16 : 10}
                  fill={`${color}18`} stroke={color} strokeWidth={isMain ? 2.5 : 1.5} />
                <text x={farm.x} y={farm.y + 4} fill={color} fontSize={isMain ? "8" : "7"}
                  textAnchor="middle" fontWeight="bold">{isMain ? '🏠' : '🌾'}</text>
                <text x={farm.x} y={farm.y + (isMain ? 28 : 22)} fill={color} fontSize="8" textAnchor="middle">
                  {farm.name}
                </text>
                {farm.status === 'elevated' && (
                  <text x={farm.x} y={farm.y - 18} fill="#f59e0b" fontSize="10" textAnchor="middle">⚠️</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
          <div className="text-lg font-bold text-cyan-400">{netStats.total}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Farms</div>
        </div>
        <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
          <div className="text-lg font-bold text-amber-400">{netStats.elevated}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Elevated</div>
        </div>
        <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
          <div className="text-lg font-bold text-green-400">{netStats.sharedToday}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Alerts Shared</div>
        </div>
      </div>

      {state.currentThreat && (
        <div className="text-xs p-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>
          🌐 Alert shared to {netStats.elevated} nearby farms — monitoring elevated across network
        </div>
      )}
      <div className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        Conceptual: Distributed farm protection network via shared detection alerts
      </div>
    </div>
  );
}

function SelfLearningCard() {
  const { state } = useApp();
  const { selfLearning } = state;
  const [eff, setEff] = useState(0);

  useEffect(() => {
    let f = 0;
    const id = setInterval(() => { f++; setEff(Math.min(Math.round(selfLearning.efficiency * f / 40), selfLearning.efficiency)); if (f >= 40) clearInterval(id); }, 20);
    return () => clearInterval(id);
  }, [selfLearning.efficiency]);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Brain size={16} className="text-violet-400" />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Self-Learning Security System</span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full animate-pulse" style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.4)' }}>🧠 Learning Active</span>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(71,85,105,0.4)" strokeWidth="6" />
            <circle cx="40" cy="40" r="32" fill="none" stroke="#8b5cf6" strokeWidth="6"
              strokeDasharray={`${(eff / 100) * 201} 201`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-violet-400">{eff}%</span>
            <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>efficiency</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--text-muted)' }}>🛰️ Patrols completed</span>
            <span className="font-bold text-cyan-400">{selfLearning.patrolsCompleted}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--text-muted)' }}>✅ False positives reduced</span>
            <span className="font-bold text-green-400">−{selfLearning.falsePositivesReduced}%</span>
          </div>
          <div className="flex justify-between text-xs">
            <span style={{ color: 'var(--text-muted)' }}>📈 System improvement</span>
            <span className="font-bold text-violet-400">+{Math.round(selfLearning.efficiency * 0.14)}%</span>
          </div>
        </div>
      </div>
      <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
        <div className="text-violet-400 font-semibold mb-1">🧠 Learning Update</div>
        <div style={{ color: 'var(--text-secondary)' }}>{selfLearning.learningSummary}</div>
      </div>
    </div>
  );
}

function GeminiInsightCard() {
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(false);

  const fetchInsight = async () => {
    setLoading(true);
    const topZone = [...state.zones].sort((a, b) => b.riskScore - a.riskScore)[0];
    const avgHealth = Math.round(state.zones.reduce((a, z) => a + z.cropHealth, 0) / state.zones.length);
    const insight = await getGeminiInsight({
      threatsToday: state.totalThreatsToday,
      topZoneRisk: topZone.id,
      cropHealthAvg: avgHealth,
      weather: state.weather.condition,
      securityScore: state.securityScore.overall,
      droneStatus: state.droneStatus,
    });
    dispatch({ type: 'SET_GEMINI_INSIGHT', payload: insight });
    setLoading(false);
  };

  useEffect(() => { fetchInsight(); }, []);

  return (
    <div className="glass-card p-4" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(59,130,246,0.05))' }}>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-emerald-400" />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Gemini AI Personalized Insight</span>
        <span className="ml-auto text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>Gemini 1.5 Flash</span>
      </div>
      <div className="min-h-16 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-base"
          style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)' }}>🤖</div>
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <div className="w-3 h-3 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
              Analyzing your farm data with Gemini AI...
            </div>
          ) : (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {state.geminiInsight ?? 'Fetching personalized farm insight...'}
            </p>
          )}
        </div>
      </div>
      <button onClick={fetchInsight} disabled={loading}
        className="mt-3 w-full py-2 rounded-lg text-xs font-medium transition-all"
        style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Analyzing...' : '✨ Refresh AI Insight'}
      </button>
    </div>
  );
}

export default function Analytics() {
  const { state } = useApp();
  const [dateRange, setDateRange] = useState('30');

  const trendData = TREND_DATA.slice(-parseInt(dateRange));

  return (
    <div className="p-6 space-y-6">
      {/* Top row: Security Score + filter */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold gradient-text">Farm Analytics Dashboard</h2>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Date Range:</span>
          <select value={dateRange} onChange={e => setDateRange(e.target.value)}
            className="px-2 py-1.5 rounded-lg text-xs"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>
      </div>

      {/* Security Score — full width */}
      <SecurityScoreFullCard />

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Intrusion Trend */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-red-400" />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Intrusion Trend ({dateRange}d)</span>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid stroke="rgba(71,85,105,0.2)" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} interval={6} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip {...CHART_TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="intrusions" stroke="#ef4444" strokeWidth={2} dot={false} name="Intrusions" />
                <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} dot={false} name="Resolved" strokeDasharray="4 2" />
                <Line type="monotone" dataKey="cropAlerts" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="Crop Alerts" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Distribution */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-violet-400" />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Threat Distribution</span>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={THREAT_DISTRIBUTION} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {THREAT_DISTRIBUTION.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip {...CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Vulnerability */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={16} className="text-amber-400" />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Zone Vulnerability Ranking</span>
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ZONE_VULNERABILITY} layout="vertical">
                <CartesianGrid stroke="rgba(71,85,105,0.2)" strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis type="category" dataKey="zone" tick={{ fill: '#94a3b8', fontSize: 11 }} width={55} />
                <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [`${v}/100`, 'Risk Score']} />
                <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                  {ZONE_VULNERABILITY.map(entry => <Cell key={entry.zone} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crop health trends */}
        {state.cropscanMode && (
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Leaf size={16} className="text-green-400" />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Crop Health Trends</span>
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={CROP_HEALTH_TREND}>
                  <CartesianGrid stroke="rgba(71,85,105,0.2)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis domain={[40, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <Tooltip {...CHART_TOOLTIP_STYLE} formatter={(v) => [`${v}%`, 'Health']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="zoneA" stroke="#22c55e" strokeWidth={2} dot={false} name="Zone A" />
                  <Line type="monotone" dataKey="zoneB" stroke="#f59e0b" strokeWidth={2} dot={false} name="Zone B" />
                  <Line type="monotone" dataKey="zoneC" stroke="#3b82f6" strokeWidth={2} dot={false} name="Zone C" />
                  <Line type="monotone" dataKey="zoneD" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Zone D" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {!state.cropscanMode && (
          <div className="glass-card p-4 flex flex-col items-center justify-center text-center">
            <Leaf size={32} style={{ color: 'var(--text-muted)' }} className="mb-3" />
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Crop Health Trends</div>
            <div className="text-xs mt-1 mb-3" style={{ color: 'var(--text-muted)' }}>Enable Crop Health Scan mode in Drone Control to view trends</div>
            <div className="text-xs badge-green px-3 py-1.5 rounded-lg">Go to Drone Control → Enable Crop Scan</div>
          </div>
        )}
      </div>

      {/* Heatmap row */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={16} className="text-blue-400" />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Zone Intelligence Heatmap — Risk by Hour & Day</span>
        </div>
        <div className="overflow-x-auto">
          <div style={{ minWidth: '600px' }}>
            <div className="flex gap-1 mb-1">
              <div style={{ width: 36 }} />
              {HOURS.filter((_, i) => i % 3 === 0).map((h, i) => (
                <div key={i} style={{ width: 54, fontSize: 9, color: '#64748b', textAlign: 'center' }}>{h}</div>
              ))}
            </div>
            {HEATMAP_DATA.map((dayData, dayIdx) => (
              <div key={dayIdx} className="flex items-center gap-1 mb-1">
                <div style={{ width: 36, fontSize: 9, color: '#64748b', textAlign: 'right', paddingRight: 4 }}>{DAYS[dayIdx]}</div>
                {dayData.map((val, hIdx) => (
                  <HeatCell key={hIdx} value={val} />
                ))}
              </div>
            ))}
            <div className="flex items-center gap-2 mt-2">
              <span style={{ fontSize: 9, color: '#64748b' }}>Risk:</span>
              {[0, 25, 50, 75, 100].map(v => (
                <div key={v} className="flex items-center gap-1">
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: v > 70 ? `rgba(239,68,68,${v / 100})` : v > 40 ? `rgba(245,158,11,${v / 100 * 1.2})` : `rgba(34,197,94,${v / 100 * 0.8 + 0.05})` }} />
                  <span style={{ fontSize: 9, color: '#64748b' }}>{v}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row: Self-Learning + Gemini AI + Recommendations + Network */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SelfLearningCard />
        <GeminiInsightCard />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecommendationEngine />
        <MultiFarmNetwork />
      </div>
    </div>
  );
}
