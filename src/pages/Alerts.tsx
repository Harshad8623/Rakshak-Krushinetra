import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Filter, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Send, Smartphone } from 'lucide-react';
import type { Alert, AlertType, ZoneId } from '../types';

const TYPE_LABELS: Record<AlertType, string> = {
  intrusion_human: '👤 Human Intrusion',
  intrusion_animal: '🐗 Animal Intrusion',
  intrusion_vehicle: '🚗 Vehicle Intrusion',
  crop_damage: '🌾 Crop Damage',
  fence_breach: '🔧 Fence Breach',
  pest_activity: '🐛 Pest Activity',
  crop_stress: '🌱 Crop Stress',
  system: '⚙️ System',
};

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'badge-red',
  High: 'badge-amber',
  Medium: 'badge-blue',
  Low: 'badge-green',
};

function MobileCompanionPanel({ alert }: { alert: Alert | null }) {
  const channels = ['SMS', 'Telegram', 'Push'];

  if (!alert) {
    return (
      <div className="glass-card p-5 flex flex-col items-center justify-center text-center" style={{ minHeight: '280px' }}>
        <Smartphone size={36} className="mb-3" style={{ color: 'var(--text-muted)' }} />
        <div className="text-sm" style={{ color: 'var(--text-muted)' }}>No active alert</div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Trigger a simulation to see the Farmer Mobile Companion</div>
      </div>
    );
  }

  const typeIcon = TYPE_LABELS[alert.type]?.split(' ')[0] || '⚠️';
  const actionLabel = alert.type.includes('intrusion_human') ? 'Drone deployed automatically'
    : alert.type.includes('intrusion_animal') ? 'Deterrent activated'
    : alert.type.includes('crop') || alert.type.includes('pest') ? 'Scan result logged'
    : 'Response logged';

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Smartphone size={16} className="text-blue-400" />
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Farmer Mobile Companion</span>
        <span className="ml-auto text-xs badge-green px-2 py-0.5 rounded-full">Sent ✓</span>
      </div>

      {/* Phone mockup */}
      <div className="phone-mockup p-4 mb-4">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b" style={{ borderColor: 'rgba(71,85,105,0.4)' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(34,197,94,0.2)' }}>🛡️</div>
          <div>
            <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Rakshak KrishiNet</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Farm Alert System</div>
          </div>
          <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>now</span>
        </div>
        <div className="p-3 rounded-xl text-xs space-y-1.5"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <div className="font-bold" style={{ color: '#f87171' }}>
            {typeIcon} Farm Alert — {alert.severity} Severity
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            {TYPE_LABELS[alert.type]} detected in Zone {alert.zone}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            Confidence: <span className="font-bold text-green-400">{alert.confidence}%</span>
          </div>
          <div style={{ color: '#60a5fa' }}>{actionLabel}</div>
          <div style={{ color: 'var(--text-muted)' }}>📍 Zone {alert.zone} | {alert.timestamp}</div>
        </div>
        <div className="flex gap-2 mt-3">
          <button className="flex-1 py-1.5 rounded-lg text-xs text-center font-medium"
            style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>View Map</button>
          <button className="flex-1 py-1.5 rounded-lg text-xs text-center font-medium"
            style={{ background: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>Dismiss</button>
        </div>
      </div>

      {/* Channel status */}
      <div className="space-y-2">
        {channels.map((ch, i) => (
          <div key={ch} className="flex items-center justify-between text-xs py-1.5 border-b"
            style={{ borderColor: 'rgba(51,65,85,0.4)' }}>
            <div className="flex items-center gap-2">
              <span>{ch === 'SMS' ? '📱' : ch === 'Telegram' ? '✈️' : '🔔'}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{ch}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-green-400">✓ Delivered</span>
              <span style={{ color: 'var(--text-muted)' }}>0:{String(i * 3 + 1).padStart(2, '0')}</span>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium"
        style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
        <Send size={12} /> Resend Notification
      </button>
    </div>
  );
}

export default function Alerts() {
  const { state, dispatch } = useApp();
  const [typeFilter, setTypeFilter] = useState<'all' | 'intrusion' | 'crop' | 'system'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'Critical' | 'High' | 'Medium' | 'Low'>('all');
  const [zoneFilter, setZoneFilter] = useState<'all' | ZoneId>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = state.alerts.filter(a => {
    const matchType = typeFilter === 'all'
      ? true
      : typeFilter === 'intrusion' ? a.type.startsWith('intrusion')
      : typeFilter === 'crop' ? ['crop_damage', 'crop_stress', 'pest_activity', 'fence_breach'].includes(a.type)
      : a.type === 'system';
    const matchSeverity = severityFilter === 'all' || a.severity === severityFilter;
    const matchZone = zoneFilter === 'all' || a.zone === zoneFilter;
    return matchType && matchSeverity && matchZone;
  });

  const stats = {
    total: state.alerts.length,
    critical: state.alerts.filter(a => a.severity === 'Critical').length,
    unresolved: state.alerts.filter(a => !a.resolved).length,
    intrusions: state.alerts.filter(a => a.type.startsWith('intrusion')).length,
    cropAlerts: state.alerts.filter(a => ['crop_damage', 'crop_stress', 'pest_activity'].includes(a.type)).length,
  };

  const latestAlert = state.currentThreat || state.alerts[0] || null;

  return (
    <div className="p-6 space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Alerts', value: stats.total, color: '#3b82f6' },
          { label: 'Critical', value: stats.critical, color: '#ef4444' },
          { label: 'Unresolved', value: stats.unresolved, color: '#f59e0b' },
          { label: 'Intrusions', value: stats.intrusions, color: '#8b5cf6' },
          { label: 'Crop Alerts', value: stats.cropAlerts, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} className="glass-card glass-card-hover p-4 text-center">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert table */}
        <div className="lg:col-span-2 glass-card p-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            {/* Type filter */}
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
              {(['all', 'intrusion', 'crop', 'system'] as const).map(f => (
                <button key={f} onClick={() => setTypeFilter(f)}
                  className="px-2.5 py-1.5 text-xs capitalize transition-all"
                  style={{
                    background: typeFilter === f ? 'rgba(59,130,246,0.2)' : 'transparent',
                    color: typeFilter === f ? '#60a5fa' : 'var(--text-muted)',
                  }}>
                  {f === 'all' ? 'All Types' : f === 'intrusion' ? '🔒 Intrusion' : f === 'crop' ? '🌾 Crop' : '⚙️ System'}
                </button>
              ))}
            </div>
            {/* Severity */}
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value as typeof severityFilter)}
              className="px-2 py-1.5 rounded-lg text-xs"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            {/* Zone */}
            <select
              value={zoneFilter}
              onChange={e => setZoneFilter(e.target.value as typeof zoneFilter)}
              className="px-2 py-1.5 rounded-lg text-xs"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
              <option value="all">All Zones</option>
              {(['A', 'B', 'C', 'D'] as ZoneId[]).map(z => <option key={z} value={z}>Zone {z}</option>)}
            </select>
            <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>{filtered.length} alerts</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th><th>Type</th><th>Zone</th><th>Severity</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(alert => (
                  <>
                    <tr key={alert.id} onClick={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
                      style={{ cursor: 'pointer' }}>
                      <td className="font-mono text-xs">{alert.timestamp}</td>
                      <td>{TYPE_LABELS[alert.type] || alert.type}</td>
                      <td><span className="badge-blue px-2 py-0.5 rounded-full text-xs">Zone {alert.zone}</span></td>
                      <td><span className={`${SEVERITY_COLORS[alert.severity]} px-2 py-0.5 rounded-full text-xs`}>{alert.severity}</span></td>
                      <td>
                        {alert.resolved
                          ? <span className="text-green-400 text-xs flex items-center gap-1"><CheckCircle size={10} /> Resolved</span>
                          : <span className="text-amber-400 text-xs flex items-center gap-1 animate-blink"><AlertTriangle size={10} /> Active</span>}
                      </td>
                      <td>
                        {expandedId === alert.id ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
                      </td>
                    </tr>
                    {expandedId === alert.id && (
                      <tr key={`${alert.id}-exp`}>
                        <td colSpan={6} style={{ background: 'rgba(30,41,59,0.5)', padding: '12px 16px' }}>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <div className="text-green-400 font-medium mb-1">Detection Details</div>
                              <div style={{ color: 'var(--text-secondary)' }}>📌 {alert.description}</div>
                              <div style={{ color: 'var(--text-muted)' }}>Confidence: {alert.confidence}%</div>
                            </div>
                            <div>
                              <div className="text-blue-400 font-medium mb-1">System Response</div>
                              <div style={{ color: 'var(--text-secondary)' }}>⚡ {alert.response}</div>
                              <div style={{ color: 'var(--text-muted)' }}>Auto-action: {alert.autoAction}</div>
                            </div>
                          </div>
                          {!alert.resolved && (
                            <button onClick={() => dispatch({ type: 'RESOLVE_ALERT', payload: alert.id })}
                              className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium badge-green">
                              Mark Resolved
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Mobile companion + notification settings */}
        <div className="space-y-4">
          <MobileCompanionPanel alert={latestAlert} />

          {/* Notification settings */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={16} className="text-amber-400" />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notification Channels</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'SMS Alerts', checked: true, detail: '+91 98765 43210' },
                { label: 'Telegram Bot', checked: true, detail: '@rakshak_bot' },
                { label: 'Push Notifications', checked: true, detail: 'Farmer App' },
                { label: 'Email Reports', checked: false, detail: 'Daily digest' },
              ].map(ch => (
                <div key={ch.label} className="flex items-center justify-between py-1.5">
                  <div>
                    <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{ch.label}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{ch.detail}</div>
                  </div>
                  <div className="w-8 h-4 rounded-full relative cursor-pointer"
                    style={{ background: ch.checked ? 'rgba(34,197,94,0.3)' : 'rgba(71,85,105,0.3)' }}>
                    <div className="w-3 h-3 rounded-full absolute top-0.5 transition-all"
                      style={{ left: ch.checked ? '18px' : '2px', background: ch.checked ? '#22c55e' : '#64748b' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Smart response effectiveness */}
            <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Response Effectiveness</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 progress-bar">
                  <div className="progress-fill" style={{ width: '88%', background: '#22c55e' }} />
                </div>
                <span className="text-xs font-bold text-green-400">88%</span>
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Threats deterred without escalation</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
