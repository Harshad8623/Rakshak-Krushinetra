import { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Plane, Battery, Signal, MapPin, Clock, Play, Square, RotateCcw, RadioTower,
  Leaf, ChevronRight, Navigation
} from 'lucide-react';

const ZONE_COORDS_PATROL = {
  A: { x: 60, y: 55, cx: 140, cy: 115 },
  B: { x: 220, y: 55, cx: 300, cy: 115 },
  C: { x: 60, y: 195, cx: 140, cy: 255 },
  D: { x: 220, y: 195, cx: 300, cy: 255 },
};

type ZoneId = 'A' | 'B' | 'C' | 'D';

function PatrolMapSVG() {
  const { state } = useApp();
  const { patrolRoute } = state;
  const currentWp = patrolRoute.waypoints[patrolRoute.currentWaypoint];

  const wpCenters = patrolRoute.waypoints.map(wp => ({
    ...ZONE_COORDS_PATROL[wp.zone],
    zone: wp.zone,
    order: wp.order,
  }));

  return (
    <svg viewBox="0 0 380 320" className="w-full" style={{ maxHeight: '260px' }}>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="rgba(59,130,246,0.8)" />
        </marker>
      </defs>
      <rect width="380" height="320" fill="rgba(15,23,42,0.6)" />
      {/* Grid */}
      <pattern id="pg" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M20 0L0 0 0 20" fill="none" stroke="rgba(71,85,105,0.15)" strokeWidth="0.5" />
      </pattern>
      <rect width="380" height="320" fill="url(#pg)" />

      {/* Zone boxes */}
      {(['A', 'B', 'C', 'D'] as ZoneId[]).map(zid => {
        const c = ZONE_COORDS_PATROL[zid];
        const zone = state.zones.find(z => z.id === zid)!;
        const isCurrentWp = patrolRoute.isActive && currentWp?.zone === zid;
        const stroke = isCurrentWp ? '#3b82f6' : '#334155';
        const fill = isCurrentWp ? 'rgba(59,130,246,0.1)' : 'rgba(34,197,94,0.06)';
        return (
          <g key={zid}>
            <rect x={c.x} y={c.y} width={155} height={120} fill={fill} stroke={stroke} strokeWidth={isCurrentWp ? 2 : 1} rx={8}
              strokeDasharray={isCurrentWp ? '6 3' : undefined} />
            <text x={c.x + 10} y={c.y + 18} fill={isCurrentWp ? '#60a5fa' : '#4ade80'} fontSize="12" fontWeight="bold">Zone {zid}</text>
            <text x={c.x + 10} y={c.y + 32} fill="#64748b" fontSize="9">🌾 {zone.cropHealth}%</text>
          </g>
        );
      })}

      {/* Route lines */}
      {wpCenters.map((wp, i) => {
        if (i === wpCenters.length - 1) return null;
        const next = wpCenters[i + 1];
        return (
          <line key={i} x1={wp.cx} y1={wp.cy} x2={next.cx} y2={next.cy}
            stroke="rgba(59,130,246,0.5)" strokeWidth={2} strokeDasharray="8 4"
            markerEnd="url(#arrow)" />
        );
      })}
      {/* Close route */}
      {wpCenters.length > 0 && (
        <line x1={wpCenters[wpCenters.length - 1].cx} y1={wpCenters[wpCenters.length - 1].cy}
          x2={wpCenters[0].cx} y2={wpCenters[0].cy}
          stroke="rgba(59,130,246,0.3)" strokeWidth={1.5} strokeDasharray="4 6" markerEnd="url(#arrow)" />
      )}

      {/* Waypoint markers */}
      {wpCenters.map(wp => {
        const isActive = patrolRoute.isActive && currentWp?.zone === wp.zone;
        return (
          <g key={wp.zone}>
            <circle cx={wp.cx} cy={wp.cy} r={isActive ? 14 : 11}
              fill={isActive ? '#3b82f6' : 'rgba(59,130,246,0.3)'}
              stroke="#3b82f6" strokeWidth={isActive ? 2 : 1.5} />
            <text x={wp.cx} y={wp.cy + 4} fill="white" fontSize="10" textAnchor="middle" fontWeight="bold">{wp.order}</text>
            {isActive && (
              <circle cx={wp.cx} cy={wp.cy} r={20} fill="none" stroke="#3b82f6" strokeWidth={1.5} opacity={0.5}>
                <animate attributeName="r" values="14;26;14" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}

      {/* Drone marker */}
      {patrolRoute.isActive && currentWp && (
        <g transform={`translate(${ZONE_COORDS_PATROL[currentWp.zone].cx - 10}, ${ZONE_COORDS_PATROL[currentWp.zone].cy - 38})`}>
          <text fontSize="20">🚁</text>
        </g>
      )}

      {/* Legend */}
      <text x={10} y={310} fill="#3b82f6" fontSize="9" fontWeight="bold">● Waypoints</text>
      <text x={80} y={310} fill="#64748b" fontSize="9">--- Route path</text>
    </svg>
  );
}

function CropHealthCard() {
  const { state, dispatch } = useApp();
  const avgHealth = Math.round(state.zones.reduce((a, z) => a + z.cropHealth, 0) / state.zones.length);
  const grade = avgHealth >= 85 ? 'A' : avgHealth >= 75 ? 'B' : avgHealth >= 60 ? 'C' : avgHealth >= 45 ? 'D' : 'F';
  const gradeColor = avgHealth >= 85 ? '#22c55e' : avgHealth >= 75 ? '#4ade80' : avgHealth >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Leaf size={16} className="text-green-400" />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Crop Health Scan</span>
        </div>
        <button
          id="cropscan-toggle"
          onClick={() => dispatch({ type: 'TOGGLE_CROPSCAN' })}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: state.cropscanMode ? 'rgba(34,197,94,0.2)' : 'rgba(71,85,105,0.2)',
            border: `1px solid ${state.cropscanMode ? 'rgba(34,197,94,0.4)' : 'var(--border-color)'}`,
            color: state.cropscanMode ? '#4ade80' : 'var(--text-muted)',
          }}
        >
          <div className={`w-2 h-2 rounded-full ${state.cropscanMode ? 'bg-green-400' : 'bg-gray-500'}`} />
          {state.cropscanMode ? 'Scanning Active' : 'Enable Scan'}
        </button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold border-2"
          style={{ background: `${gradeColor}15`, borderColor: `${gradeColor}40`, color: gradeColor }}>
          {grade}
        </div>
        <div>
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{avgHealth}%</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Average crop health</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Last scan: {state.cropscanMode ? '1 min ago' : '18 min ago'}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {state.zones.map(z => {
          const hColor = z.cropHealth >= 80 ? '#22c55e' : z.cropHealth >= 65 ? '#f59e0b' : '#ef4444';
          return (
            <div key={z.id} className="flex items-center gap-2">
              <span className="text-xs w-10 font-medium" style={{ color: 'var(--text-muted)' }}>Zone {z.id}</span>
              <div className="flex-1 progress-bar">
                <div className="progress-fill" style={{ width: `${z.cropHealth}%`, background: hColor }} />
              </div>
              <span className="text-xs w-8 text-right font-mono" style={{ color: hColor }}>{z.cropHealth}%</span>
            </div>
          );
        })}
      </div>

      {state.cropscanMode && (
        <div className="mt-3 space-y-2">
          {state.cropDetections.map(cd => (
            <div key={cd.id} className="p-2 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div className="flex justify-between mb-1">
                <span className="font-medium" style={{ color: '#f87171' }}>Zone {cd.zone} — {cd.damageType}</span>
                <span style={{ color: 'var(--text-muted)' }}>{cd.affectedArea}% affected</span>
              </div>
              <div style={{ color: 'var(--text-muted)' }}>💡 {cd.recommendation}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DroneControl() {
  const { state, dispatch, deployDrone, startPatrol, stopPatrol } = useApp();
  const { patrolRoute, droneStatus } = state;
  const [scheduleTimes] = useState(['10:00 PM', '1:00 AM', '4:00 AM']);
  const [activeSchedule, setActiveSchedule] = useState([true, true, true]);

  const batteryPct = state.securityMode === 'high' ? 34 : patrolRoute.isActive ? 18 : 82;
  const signalStrength = state.isOnline ? 94 : 0;

  const statusColor = droneStatus === 'Idle' ? '#64748b'
    : droneStatus === 'Deploying' ? '#f59e0b'
    : droneStatus === 'Active' ? '#22c55e'
    : droneStatus === 'PatrolMode' ? '#3b82f6'
    : droneStatus === 'Returning' ? '#8b5cf6'
    : '#06b6d4';

  const totalBattery = scheduleTimes.filter((_, i) => activeSchedule[i]).length * patrolRoute.batteryPerPatrol;

  const activityLog = [
    { time: '15:30', event: 'Returned to base — patrol complete', icon: '✅' },
    { time: '13:45', event: 'Deployed to Zone C — fence breach', icon: '🚁' },
    { time: '13:47', event: 'Target confirmed — RTH issued', icon: '📹' },
    { time: '10:00', event: 'Scheduled patrol #1 complete', icon: '🛰️' },
    { time: '04:00', event: 'Night patrol — all zones clear', icon: '🌙' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Status Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Battery', value: `${batteryPct}%`, icon: Battery, color: batteryPct > 50 ? '#22c55e' : batteryPct > 25 ? '#f59e0b' : '#ef4444', sub: batteryPct > 20 ? 'Sufficient' : 'Low battery' },
          { label: 'Signal', value: `${signalStrength}%`, icon: Signal, color: signalStrength > 70 ? '#22c55e' : signalStrength > 30 ? '#f59e0b' : '#ef4444', sub: state.isOnline ? '5.8GHz' : 'No signal' },
          { label: 'Location', value: droneStatus === 'Idle' ? 'Base' : `Zone ${state.currentThreat?.zone || patrolRoute.waypoints[patrolRoute.currentWaypoint]?.zone || 'A'}`, icon: MapPin, color: '#3b82f6', sub: droneStatus },
          { label: 'Flight Hours', value: '47.3h', icon: Clock, color: '#8b5cf6', sub: 'This season' },
        ].map(card => (
          <div key={card.label} className="glass-card glass-card-hover p-4">
            <div className="flex items-center gap-2 mb-2">
              <card.icon size={16} style={{ color: card.color }} />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{card.label}</span>
            </div>
            <div className="text-xl font-bold" style={{ color: card.color }}>{card.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Map + controls */}
        <div className="lg:col-span-2 space-y-4">
          {/* Patrol Route Planner */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Navigation size={16} className="text-blue-400" />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Autonomous Patrol Route Planner</span>
              {patrolRoute.isActive && <span className="ml-auto text-xs badge-blue px-2 py-0.5 rounded-full animate-blink">ACTIVE</span>}
            </div>

            <PatrolMapSVG />

            {/* Waypoint sequence */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {patrolRoute.waypoints.map((wp, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                    style={{
                      background: patrolRoute.isActive && patrolRoute.currentWaypoint === i ? 'rgba(59,130,246,0.2)' : 'rgba(71,85,105,0.2)',
                      border: `1px solid ${patrolRoute.isActive && patrolRoute.currentWaypoint === i ? '#3b82f6' : 'var(--border-color)'}`,
                      color: patrolRoute.isActive && patrolRoute.currentWaypoint === i ? '#60a5fa' : 'var(--text-secondary)',
                    }}>
                    <span className="font-bold">{wp.order}</span> Zone {wp.zone}
                    <span style={{ color: 'var(--text-muted)' }}> ~{wp.estimatedMinutes}m</span>
                  </div>
                  {i < patrolRoute.waypoints.length - 1 && <ChevronRight size={12} style={{ color: 'var(--text-muted)' }} />}
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="text-sm font-bold text-blue-400">{patrolRoute.estimatedDuration}m</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Est. Duration</div>
              </div>
              <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="text-sm font-bold text-amber-400">{totalBattery}%</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Battery/day</div>
              </div>
              <div className="p-2 rounded-lg text-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="text-sm font-bold text-green-400">{activeSchedule.filter(Boolean).length}/3</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Patrols/day</div>
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex gap-3 mt-4">
              {patrolRoute.isActive ? (
                <button id="stop-patrol-btn" onClick={stopPatrol}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all badge-red">
                  <Square size={14} /> Stop Patrol
                </button>
              ) : (
                <button id="start-patrol-btn" onClick={startPatrol}
                  disabled={droneStatus !== 'Idle'}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all badge-blue"
                  style={{ opacity: droneStatus !== 'Idle' ? 0.5 : 1 }}>
                  <Play size={14} /> Start Autonomous Patrol
                </button>
              )}
              <button id="deploy-drone-btn" onClick={deployDrone}
                disabled={droneStatus !== 'Idle' || patrolRoute.isActive}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                  color: '#4ade80', opacity: droneStatus !== 'Idle' || patrolRoute.isActive ? 0.5 : 1,
                }}>
                <Plane size={14} /> Quick Deploy
              </button>
              <button id="rth-btn" onClick={() => dispatch({ type: 'STOP_PATROL' })}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
                style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' }}>
                <RotateCcw size={14} /> RTH
              </button>
            </div>
          </div>

          {/* Schedule table */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-amber-400" />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Patrol Schedule</span>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>Patrol Time</th><th>Duration</th><th>Battery Use</th><th>Status</th><th>Toggle</th></tr>
              </thead>
              <tbody>
                {scheduleTimes.map((time, i) => (
                  <tr key={i}>
                    <td className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      <Clock size={12} className="inline mr-1.5 text-blue-400" />{time}
                    </td>
                    <td>{patrolRoute.estimatedDuration} min</td>
                    <td className="text-amber-400">{patrolRoute.batteryPerPatrol}%</td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${activeSchedule[i] ? 'badge-green' : 'badge-amber'}`}>
                        {activeSchedule[i] ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => setActiveSchedule(prev => { const n = [...prev]; n[i] = !n[i]; return n; })}
                        className="text-xs px-2 py-1 rounded-lg transition-all"
                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                        {activeSchedule[i] ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              ⏱ Next patrol in: <span className="font-medium text-blue-400">2h 15m</span> &nbsp;|&nbsp;
              📊 1/3 patrols completed today
            </div>
          </div>
        </div>

        {/* Right: Crop health + activity */}
        <div className="space-y-4">
          <CropHealthCard />
          {/* Drone status */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <RadioTower size={16} style={{ color: statusColor }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Drone Status</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{ background: `${statusColor}15`, border: `2px solid ${statusColor}40` }}>
                🚁
              </div>
              <div>
                <div className="font-bold" style={{ color: statusColor }}>{droneStatus}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {droneStatus === 'Idle' ? 'Ready on pad' : droneStatus === 'PatrolMode' ? `Waypoint ${patrolRoute.currentWaypoint + 1}/4` : 'In flight'}
                </div>
              </div>
            </div>
            <div className="progress-bar mb-1">
              <div className="progress-fill" style={{
                width: `${batteryPct}%`,
                background: batteryPct > 50 ? '#22c55e' : batteryPct > 25 ? '#f59e0b' : '#ef4444'
              }} />
            </div>
            <div className="text-xs text-right mb-3" style={{ color: 'var(--text-muted)' }}>Battery: {batteryPct}%</div>
            {state.cropscanMode && <div className="text-xs badge-green px-2 py-1 rounded-lg">🌿 Crop Health Scan: Active</div>}
          </div>

          {/* Activity log */}
          <div className="glass-card p-4">
            <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Activity Log</div>
            <div className="space-y-2">
              {activityLog.map((log, i) => (
                <div key={i} className="flex items-start gap-2 text-xs py-1.5 border-b"
                  style={{ borderColor: 'rgba(51,65,85,0.4)' }}>
                  <span>{log.icon}</span>
                  <div className="flex-1">
                    <div style={{ color: 'var(--text-secondary)' }}>{log.event}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{log.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
