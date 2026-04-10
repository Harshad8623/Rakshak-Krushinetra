import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Camera, Plane, AlertTriangle, Shield, Wifi, WifiOff,
  TrendingUp, TrendingDown, Minus, Zap, Activity, RefreshCw,
  CheckCircle, Cpu, Play
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { TREND_DATA, ACTIVITY_FEED } from '../data/mockData';

const ZONE_COORDS = {
  A: { x: 40, y: 40, w: 160, h: 120 },
  B: { x: 240, y: 40, w: 160, h: 120 },
  C: { x: 40, y: 200, w: 160, h: 120 },
  D: { x: 240, y: 200, w: 160, h: 120 },
};

function FarmDigitalTwin() {
  const { state } = useApp();
  const patrolWaypointZone = state.patrolRoute.isActive
    ? state.patrolRoute.waypoints[state.patrolRoute.currentWaypoint]?.zone
    : null;

  const zoneColor = (threat: string, isScan: boolean) => {
    if (isScan) return { fill: 'rgba(14,165,233,0.1)', stroke: 'rgba(14,165,233,0.7)' };
    if (threat === 'critical' || threat === 'high') return { fill: 'rgba(244,63,94,0.18)', stroke: 'rgba(244,63,94,0.8)' };
    if (threat === 'medium') return { fill: 'rgba(245,158,11,0.18)', stroke: 'rgba(245,158,11,0.7)' };
    return { fill: 'rgba(16,185,129,0.12)', stroke: 'rgba(16,185,129,0.5)' };
  };

  const cropHealthColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 65) return '#f59e0b';
    return '#ef4444';
  };

  // Patrol route SVG path
  const patrolPath = state.patrolRoute.waypoints.map(wp => {
    const c = ZONE_COORDS[wp.zone];
    return `${c.x + c.w / 2},${c.y + c.h / 2}`;
  }).join(' L ');

  return (
    <div className="relative" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', overflow: 'hidden' }}>
      <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-green-400" />
          <span className="text-xs font-semibold text-green-400">Farm Digital Twin</span>
        </div>
        <div className="flex items-center gap-3">
          {state.patrolRoute.isActive && (
            <span className="text-xs badge-blue px-2 py-0.5 rounded-full animate-blink">PATROL ACTIVE</span>
          )}
          {state.cropscanMode && (
            <span className="text-xs badge-cyan px-2 py-0.5 rounded-full animate-blink">CROP SCAN</span>
          )}
          {state.currentThreat && (
            <span className="text-xs badge-red px-2 py-0.5 rounded-full animate-blink">THREAT DETECTED</span>
          )}
        </div>
      </div>
      <svg viewBox="0 0 440 360" className="w-full" style={{ maxHeight: '280px' }}>
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(71,85,105,0.2)" strokeWidth="0.5" />
          </pattern>
          <radialGradient id="droneGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <rect width="440" height="360" fill="url(#grid)" />

        {/* Zones */}
        {state.zones.map(zone => {
          const c = ZONE_COORDS[zone.id];
          const isCurrentPatrol = patrolWaypointZone === zone.id;
          const colors = zoneColor(zone.threatLevel, isCurrentPatrol);
          const isActive = state.currentThreat?.zone === zone.id;
          return (
            <g key={zone.id}>
              <rect
                x={c.x} y={c.y} width={c.w} height={c.h}
                fill={colors.fill} stroke={colors.stroke} strokeWidth={isActive ? 2.5 : 1.5}
                rx={8} strokeDasharray={isCurrentPatrol ? '6 3' : undefined}
                filter={isActive ? 'url(#glow)' : undefined}
              />
              {/* Zone label */}
              <text x={c.x + 10} y={c.y + 20} fill={colors.stroke} fontSize="13" fontWeight="bold"
                fontFamily="monospace">Zone {zone.id}</text>
              {/* Crop health bar */}
              <rect x={c.x + 8} y={c.y + c.h - 18} width={c.w - 16} height={4} fill="rgba(71,85,105,0.4)" rx="2" />
              <rect x={c.x + 8} y={c.y + c.h - 18} width={(c.w - 16) * zone.cropHealth / 100} height={4}
                fill={cropHealthColor(zone.cropHealth)} rx="2" />
              <text x={c.x + c.w - 8} y={c.y + c.h - 20} fill={cropHealthColor(zone.cropHealth)}
                fontSize="9" textAnchor="end">🌾 {zone.cropHealth}%</text>
              {/* Camera indicator */}
              {zone.cameraActive && (
                <circle cx={c.x + c.w - 14} cy={c.y + 14} r={5} fill="rgba(34,197,94,0.3)" stroke="#22c55e" strokeWidth={1} />
              )}
              {!zone.cameraActive && (
                <circle cx={c.x + c.w - 14} cy={c.y + 14} r={5} fill="rgba(239,68,68,0.3)" stroke="#ef4444" strokeWidth={1} />
              )}
              {/* Threat marker */}
              {isActive && (
                <>
                  <circle cx={c.x + c.w / 2} cy={c.y + c.h / 2} r={20} fill="none" stroke="#ef4444" strokeWidth={2} opacity={0.7}>
                    <animate attributeName="r" values="15;30;15" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.7;0;0.7" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={c.x + c.w / 2} cy={c.y + c.h / 2} r={6} fill="#ef4444" />
                  <text x={c.x + c.w / 2} y={c.y + c.h / 2 - 16} fill="#ef4444" fontSize="16" textAnchor="middle">⚠</text>
                </>
              )}
              {/* Patrol waypoint number */}
              {state.patrolRoute.isActive && (() => {
                const wp = state.patrolRoute.waypoints.find(w => w.zone === zone.id);
                if (!wp) return null;
                return (
                  <g>
                    <circle cx={c.x + 22} cy={c.y + 40} r={10}
                      fill={isCurrentPatrol ? '#3b82f6' : 'rgba(59,130,246,0.3)'}
                      stroke="#3b82f6" strokeWidth={1.5} />
                    <text x={c.x + 22} y={c.y + 44} fill="white" fontSize="9" textAnchor="middle" fontWeight="bold">
                      {wp.order}
                    </text>
                  </g>
                );
              })()}
            </g>
          );
        })}

        {/* Patrol route lines */}
        {state.patrolRoute.isActive && (
          <polyline
            points={patrolPath + ` L ${ZONE_COORDS[state.patrolRoute.waypoints[0].zone].x + ZONE_COORDS[state.patrolRoute.waypoints[0].zone].w / 2},${ZONE_COORDS[state.patrolRoute.waypoints[0].zone].y + ZONE_COORDS[state.patrolRoute.waypoints[0].zone].h / 2}`}
            fill="none" stroke="rgba(59,130,246,0.6)" strokeWidth={2} strokeDasharray="8 4"
          />
        )}

        {/* Drone indicator */}
        {(state.droneStatus === 'Active' || state.droneStatus === 'PatrolMode' || state.droneStatus === 'Deploying') && (() => {
          const currentZone = state.patrolRoute.isActive
            ? ZONE_COORDS[state.patrolRoute.waypoints[state.patrolRoute.currentWaypoint]?.zone || 'A']
            : ZONE_COORDS[state.currentThreat?.zone || 'A'];
          const dx = currentZone.x + currentZone.w / 2;
          const dy = currentZone.y + currentZone.h / 2 - 30;
          return (
            <g>
              <circle cx={dx} cy={dy} r={12} fill="url(#droneGlow)" />
              <circle cx={dx} cy={dy} r={5} fill="#06b6d4" stroke="white" strokeWidth={1.5} />
              <text x={dx} y={dy - 14} fontSize="16" textAnchor="middle">🚁</text>
              <text x={dx} y={dy + 22} fill="#06b6d4" fontSize="8" textAnchor="middle">DRONE</text>
            </g>
          );
        })()}

        {/* Legend */}
        <g transform="translate(10, 325)">
          <rect width={6} height={6} fill="rgba(34,197,94,0.5)" rx={1} /><text x={10} y={6} fill="#64748b" fontSize="8">Safe</text>
          <rect x={45} width={6} height={6} fill="rgba(245,158,11,0.5)" rx={1} /><text x={55} y={6} fill="#64748b" fontSize="8">Warning</text>
          <rect x={100} width={6} height={6} fill="rgba(239,68,68,0.5)" rx={1} /><text x={110} y={6} fill="#64748b" fontSize="8">Threat</text>
          <circle cx={148} cy={3} r={3} fill="#22c55e" /><text x={154} y={6} fill="#64748b" fontSize="8">Camera On</text>
          <circle cx={202} cy={3} r={3} fill="#ef4444" /><text x={208} y={6} fill="#64748b" fontSize="8">Camera Off</text>
        </g>
      </svg>
    </div>
  );
}

function KPICard({ title, value, sub, icon: Icon, color, trend }: {
  title: string; value: string; sub: string; icon: React.ElementType; color: string; trend?: 'up' | 'down' | 'flat';
}) {
  return (
    <div className="glass-card glass-card-hover p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon size={18} style={{ color }} />
        </div>
        {trend && (
          trend === 'up' ? <TrendingUp size={14} className="text-green-400" /> :
          trend === 'down' ? <TrendingDown size={14} className="text-red-400" /> :
          <Minus size={14} style={{ color: 'var(--text-muted)' }} />
        )}
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-secondary)' }}>{title}</div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}

function SecurityScoreCard() {
  const { state } = useApp();
  const { securityScore } = state;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let frame = 0;
    const target = securityScore.overall;
    const interval = setInterval(() => {
      frame++;
      setDisplayed(Math.min(Math.round(target * frame / 40), target));
      if (frame >= 40) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [securityScore.overall]);

  const factors = [
    { label: 'Camera Coverage', value: securityScore.coverage, color: '#3b82f6' },
    { label: 'Response Time', value: securityScore.responseTime, color: '#22c55e' },
    { label: 'Zone Risk (inv.)', value: securityScore.zoneRisk, color: '#f59e0b' },
    { label: 'Deterrent Rate', value: securityScore.deterrentEffectiveness, color: '#8b5cf6' },
    { label: 'Patrol Coverage', value: securityScore.patrolCoverage, color: '#06b6d4' },
  ];

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={16} className="text-green-400" />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Farm Security Score</span>
        <span className={`ml-auto text-xs ${securityScore.trend === 'increasing' ? 'text-green-400' : securityScore.trend === 'decreasing' ? 'text-red-400' : 'text-gray-400'}`}>
          {securityScore.trend === 'increasing' ? '↑' : securityScore.trend === 'decreasing' ? '↓' : '→'} {securityScore.trend}
        </span>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(71,85,105,0.4)" strokeWidth="6" />
            <circle cx="40" cy="40" r="32" fill="none" stroke="#22c55e" strokeWidth="6"
              strokeDasharray={`${(displayed / 100) * 201} 201`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold gradient-text">{displayed}</span>
            <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>/100</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {factors.map(f => (
            <div key={f.label}>
              <div className="flex justify-between text-xs mb-0.5">
                <span style={{ color: 'var(--text-muted)' }}>{f.label}</span>
                <span style={{ color: f.color }}>{f.value}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${f.value}%`, background: f.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={TREND_DATA.slice(-14)}>
            <Line type="monotone" dataKey="securityScore" stroke="#22c55e" strokeWidth={1.5} dot={false} />
            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '10px' }}
              formatter={(v: any) => [`${v}`, 'Score']} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EdgeAICard() {
  const { state } = useApp();
  const [storageUsed] = useState(47);

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        {state.isOnline ? <Wifi size={16} className="text-green-400" /> : <WifiOff size={16} className="text-amber-400 animate-blink" />}
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {state.edgeMode ? 'Edge AI Mode' : 'Cloud Connected'}
        </span>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${state.isOnline ? 'badge-green' : 'badge-amber'}`}>
          {state.isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-muted)' }}>Mode</span>
          <span style={{ color: state.edgeMode ? '#fbbf24' : '#4ade80' }}>
            {state.edgeMode ? '🔌 Edge AI (Local)' : '☁️ Cloud Connected'}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-muted)' }}>Last Sync</span>
          <span style={{ color: 'var(--text-secondary)' }}>{state.lastSync}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-muted)' }}>Edge Storage</span>
          <span style={{ color: '#60a5fa' }}>{storageUsed}% used</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-muted)' }}>Offline Queue</span>
          <span style={{ color: state.offlineQueueCount > 0 ? '#fbbf24' : '#4ade80' }}>
            {state.offlineQueueCount} alerts{state.offlineQueueCount > 0 ? ' pending sync' : ''}
          </span>
        </div>
      </div>
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span style={{ color: 'var(--text-muted)' }}>Storage</span>
          <span style={{ color: '#60a5fa' }}>{storageUsed}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${storageUsed}%`, background: '#3b82f6' }} />
        </div>
      </div>
      {state.offlineQueueCount > 0 && state.isOnline && (
        <div className="mt-2 text-xs flex items-center gap-1.5" style={{ color: '#fbbf24' }}>
          <RefreshCw size={10} className="animate-spin" />
          Syncing {state.offlineQueueCount} queued alerts...
        </div>
      )}
    </div>
  );
}

function ReliabilityCard() {
  const { state } = useApp();
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Cpu size={16} className="text-violet-400" />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>System Reliability</span>
        <span className="ml-auto text-xs badge-green px-2 py-0.5 rounded-full">Operational</span>
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span style={{ color: 'var(--text-muted)' }}>Uptime</span>
          <span className="font-bold text-sm text-green-400">{state.systemUptime}%</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-muted)' }}>Last Failure</span>
          <span style={{ color: '#4ade80' }}>None ✓</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-muted)' }}>Camera Health</span>
          <span style={{ color: state.camerasOnline === 4 ? '#4ade80' : '#fbbf24' }}>
            {state.camerasOnline}/4 online
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-muted)' }}>AI Model</span>
          <span style={{ color: '#4ade80' }}>✅ COCO-SSD v2.2</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-muted)' }}>Network Latency</span>
          <span style={{ color: state.isOnline ? '#4ade80' : '#fbbf24' }}>
            {state.isOnline ? '12ms' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );
}

function WeatherCard() {
  const { state } = useApp();
  const { weather } = state;
  const WeatherIcons: Record<string, string> = { Clear: '☀️', Cloudy: '⛅', Rain: '🌧️', Storm: '⛈️' };
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{WeatherIcons[weather.condition]}</span>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Weather Conditions</span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{weather.temperature}°C</div>
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          <div>Humidity: {weather.humidity}%</div>
          <div>Wind: {weather.windSpeed} km/h</div>
        </div>
      </div>
      {weather.riskTag && (
        <div className="text-xs px-3 py-2 rounded-lg mb-2" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>
          {weather.riskTag}
        </div>
      )}
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>📅 {weather.forecast}</div>
      {weather.affectsPatrol && (
        <div className="mt-2 text-xs" style={{ color: '#60a5fa' }}>
          🛰️ Auto-increasing patrol frequency tonight
        </div>
      )}
    </div>
  );
}

function IncidentReplayPanel() {
  const { state } = useApp();
  const [visibleSteps, setVisibleSteps] = useState<number>(0);

  useEffect(() => {
    if (!state.incidentReplay) { setVisibleSteps(0); return; }
    setVisibleSteps(0);
    state.incidentReplay.forEach((step, i) => {
      setTimeout(() => setVisibleSteps(i + 1), step.delay);
    });
  }, [state.incidentReplay]);

  if (!state.incidentReplay) return null;

  return (
    <div className="glass-card p-4 animate-fadeInUp" style={{ border: '1px solid rgba(14,165,233,0.3)', background: 'var(--bg-card)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Play size={16} className="text-blue-400" />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>🎬 Autonomous Incident Replay</span>
        <span className="ml-auto text-xs badge-blue px-2 py-0.5 rounded-full animate-blink">LIVE</span>
      </div>
      <div className="relative pl-6">
        {/* Timeline line */}
        <div className="absolute left-2 top-0 bottom-0 w-0.5" style={{ background: 'linear-gradient(to bottom, #3b82f6, rgba(59,130,246,0.1))' }} />
        <div className="space-y-3">
          {state.incidentReplay.map((step, i) => (
            <div key={i} className={`flex items-start gap-3 transition-all duration-500 ${i < visibleSteps ? 'opacity-100' : 'opacity-0'}`}
              style={{ transform: i < visibleSteps ? 'translateX(0)' : 'translateX(-8px)' }}>
              <div className="absolute left-0 w-4 h-4 rounded-full flex items-center justify-center text-xs"
                style={{ top: `${i * 52 + 2}px`, background: `${step.color}20`, border: `2px solid ${step.color}` }}>
                {i < visibleSteps ? '✓' : ''}
              </div>
              <div className="ml-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{step.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: step.color }}>{step.event}</span>
                </div>
                <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{step.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 pt-3 border-t text-xs" style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
        ⚡ AI Confidence: <span className="font-bold text-violet-400">{state.currentThreat?.confidence ?? 90}%</span> • Response time: <span className="font-bold text-green-400">&lt; 3 seconds</span>
      </div>
    </div>
  );
}

export default function Overview() {
  const { state, simulateThreat, clearThreat } = useApp();

  return (
    <div className="p-6 space-y-6">
      {/* Status Banner */}
      <div className="rounded-2xl p-4 flex items-center gap-4 transition-all duration-500"
        style={{
          background: state.status === 'Alert'
            ? 'linear-gradient(135deg, rgba(244,63,94,0.15), rgba(244,63,94,0.05))'
            : state.status === 'Patrol'
            ? 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(14,165,233,0.05))'
            : 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))',
          border: `1px solid ${state.status === 'Alert' ? 'rgba(244,63,94,0.4)' : state.status === 'Patrol' ? 'rgba(14,165,233,0.4)' : 'rgba(16,185,129,0.3)'}`,
        }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0">
          {state.status === 'Alert' ? '⚠️' : state.status === 'Patrol' ? '🛰️' : '🛡️'}
        </div>
        <div className="flex-1">
          <div className="font-bold text-lg" style={{
            color: state.status === 'Alert' ? '#f87171' : state.status === 'Patrol' ? '#22d3ee' : '#4ade80',
          }}>
            System {state.status} — {state.threatLevel.toUpperCase()} Risk
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {state.currentThreat
              ? `🚨 ${state.currentThreat.description} | Zone ${state.currentThreat.zone} | Confidence: ${state.currentThreat.confidence}%`
              : state.status === 'Patrol'
              ? `🛰️ Autonomous patrol active — Waypoint ${state.patrolRoute.currentWaypoint + 1}/4`
              : '✅ All zones clear — Monitoring active across 4 perimeter zones'
            }
          </div>
        </div>
        {state.currentThreat && (
          <button onClick={clearThreat} className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'rgba(71,85,105,0.4)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
            Dismiss
          </button>
        )}
        <div>
          <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Adaptive Security</div>
          <div className={`text-sm font-bold ${state.securityMode === 'high' ? 'text-red-400' : state.securityMode === 'medium' ? 'text-blue-400' : 'text-green-400'}`}>
            {state.securityMode === 'high' ? '🔴 HIGH' : state.securityMode === 'medium' ? '🟡 MEDIUM' : '🟢 LOW'}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Active Cameras" value={`${state.camerasOnline}/4`} sub="3 HD · 1 offline" icon={Camera} color="#3b82f6" trend="flat" />
        <KPICard title="Threats Today" value={String(state.totalThreatsToday)} sub="6 resolved • 1 active" icon={AlertTriangle} color="#ef4444" trend="down" />
        <KPICard title="Drone Status" value={state.droneStatus} sub={state.patrolRoute.isActive ? 'Autonomous patrol' : 'Ready to deploy'} icon={Plane} color="#06b6d4" />
        <KPICard title="Deterrents Fired" value={String(state.deterrentsFired)} sub="Today • 100% effective" icon={Zap} color="#22c55e" trend="up" />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Digital Twin map — spans 2 cols */}
        <div className="lg:col-span-2 glass-card p-4">
          <FarmDigitalTwin />
          {/* Simulation buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button id="sim-human" onClick={() => simulateThreat('human')}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-all badge-red hover:opacity-80">
              👤 Simulate Human
            </button>
            <button id="sim-animal" onClick={() => simulateThreat('animal')}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-all badge-amber hover:opacity-80">
              🐗 Simulate Animal
            </button>
            <button id="sim-vehicle" onClick={() => simulateThreat('vehicle')}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-all badge-violet hover:opacity-80">
              🚗 Simulate Vehicle
            </button>
            <button id="sim-crop" onClick={() => simulateThreat('crop')}
              className="px-3 py-2 rounded-lg text-xs font-semibold transition-all badge-green hover:opacity-80">
              🌾 Simulate Crop Damage
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <SecurityScoreCard />
          <EdgeAICard />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} className="text-green-400" />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Activity</span>
          </div>
          <div className="space-y-2">
            {[...(state.currentThreat ? [{
              time: 'Now', event: state.currentThreat.description, icon: '🚨', color: '#ef4444'
            }] : []), ...ACTIVITY_FEED.slice(0, 6)].map((item, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b" style={{ borderColor: 'rgba(51,65,85,0.4)' }}>
                <span className="text-sm">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{item.event}</div>
                </div>
                <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weather & Reliability */}
        <WeatherCard />
        <ReliabilityCard />
      </div>

      {/* Incident Replay */}
      <IncidentReplayPanel />

      {/* Smart Response Panel */}
      {(state.deterrentActive || state.droneStatus !== 'Idle') && (
        <div className="glass-card p-4 animate-fadeInUp" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-sm font-semibold text-green-400">Active Response</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {state.deterrentActive && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg badge-green text-xs font-medium">
                🔊 Ultrasonic Deterrent Active
              </div>
            )}
            {state.droneStatus !== 'Idle' && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg badge-cyan text-xs font-medium">
                🚁 Drone {state.droneStatus}
              </div>
            )}
            {state.currentThreat && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg badge-blue text-xs font-medium">
                📱 Farmer Notified via SMS + Telegram
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
