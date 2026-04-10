import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Camera, ZoomIn, ZoomOut, Circle, Square, AlertTriangle, CheckCircle, Sun, Moon } from 'lucide-react';

const ZONE_LABELS = { A: 'Zone A — North Field', B: 'Zone B — East Orchard', C: 'Zone C — South Paddy', D: 'Zone D — West Boundary' };

const SIMULATED_DETECTIONS = {
  human: [
    { label: 'person', confidence: 0.92, x: 180, y: 120, w: 80, h: 160, color: '#ef4444' },
  ],
  animal: [
    { label: 'boar/animal', confidence: 0.87, x: 240, y: 200, w: 120, h: 90, color: '#f59e0b' },
    { label: 'animal', confidence: 0.71, x: 380, y: 180, w: 90, h: 70, color: '#f59e0b' },
  ],
  vehicle: [
    { label: 'vehicle', confidence: 0.95, x: 100, y: 250, w: 180, h: 100, color: '#8b5cf6' },
  ],
  none: [],
};

type ZoneId = 'A' | 'B' | 'C' | 'D';

export default function CameraFeed() {
  const { state } = useApp();
  const [activeZone, setActiveZone] = useState<ZoneId>('A');
  const [brightness, setBrightness] = useState(100);
  const [zoom, setZoom] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [nightVision, setNightVision] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const tickRef = useRef(0);

  const currentThreatType = state.currentThreat?.type;
  const threatZone = state.currentThreat?.zone;

  const getDetections = useCallback(() => {
    if (!state.currentThreat || threatZone !== activeZone) return SIMULATED_DETECTIONS.none;
    if (currentThreatType === 'intrusion_human') return SIMULATED_DETECTIONS.human;
    if (currentThreatType === 'intrusion_animal') return SIMULATED_DETECTIONS.animal;
    if (currentThreatType === 'intrusion_vehicle') return SIMULATED_DETECTIONS.vehicle;
    return SIMULATED_DETECTIONS.none;
  }, [state.currentThreat, activeZone, threatZone, currentThreatType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;

    const draw = () => {
      tickRef.current++;

      // Background - simulated camera feed
      const gradient = ctx.createLinearGradient(0, 0, W, H);
      if (nightVision) {
        gradient.addColorStop(0, '#0a1a0a');
        gradient.addColorStop(1, '#061206');
      } else {
        gradient.addColorStop(0, '#1a2a1a');
        gradient.addColorStop(1, '#0f1a0f');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);

      // Farm background elements (simulated scene)
      ctx.save();
      ctx.globalAlpha = nightVision ? 0.15 : 0.25;
      // Ground / field
      ctx.fillStyle = nightVision ? '#1a3a1a' : '#2d4a2d';
      ctx.fillRect(0, H * 0.6, W, H * 0.4);
      // Crop rows
      for (let i = 0; i < 8; i++) {
        ctx.strokeStyle = nightVision ? '#0f5a0f' : '#3d6a3d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(i * W / 7, H * 0.65);
        ctx.lineTo(i * W / 7 - 20, H);
        ctx.stroke();
      }
      // Sky
      ctx.fillStyle = nightVision ? '#040c04' : '#1a2a3a';
      ctx.fillRect(0, 0, W, H * 0.6);
      // Trees / fence
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = nightVision ? '#0f2a0f' : '#1f3a1f';
        ctx.fillRect(i * W / 4 + 10, H * 0.35, 20, H * 0.25);
      }
      ctx.restore();

      // Scan line animation
      if (state.currentThreat?.zone === activeZone) {
        const scanY = (tickRef.current * 3) % H;
        const scanGrad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
        scanGrad.addColorStop(0, 'rgba(239,68,68,0)');
        scanGrad.addColorStop(0.5, 'rgba(239,68,68,0.3)');
        scanGrad.addColorStop(1, 'rgba(239,68,68,0)');
        ctx.fillStyle = scanGrad;
        ctx.fillRect(0, scanY - 20, W, 40);
      }

      // Night vision green overlay
      if (nightVision) {
        const nvGrad = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) / 1.5);
        nvGrad.addColorStop(0, 'rgba(0,255,0,0.05)');
        nvGrad.addColorStop(1, 'rgba(0,255,0,0.15)');
        ctx.fillStyle = nvGrad;
        ctx.fillRect(0, 0, W, H);
      }

      // Bounding boxes
      const detections = getDetections();
      detections.forEach(det => {
        const alpha = 0.7 + 0.3 * Math.sin(tickRef.current * 0.1);
        ctx.strokeStyle = `${det.color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(det.x, det.y, det.w, det.h);

        // Corner marks
        const cs = 15;
        ctx.lineWidth = 3;
        ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'].forEach(corner => {
          const [bx, by] = corner.includes('Right') ? [det.x + det.w, det.y] : [det.x, det.y];
          const ay = corner.includes('bottom') ? det.y + det.h : by;
          ctx.beginPath();
          ctx.moveTo(bx + (corner.includes('Right') ? -cs : cs), ay);
          ctx.lineTo(bx, ay);
          ctx.lineTo(bx, ay + (corner.includes('bottom') ? -cs : cs));
          ctx.stroke();
        });

        // Label
        ctx.fillStyle = det.color;
        ctx.fillRect(det.x, det.y - 22, `${det.label} ${Math.round(det.confidence * 100)}%`.length * 7.5, 20);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`${det.label} ${Math.round(det.confidence * 100)}%`, det.x + 4, det.y - 7);
      });

      // Timestamp / HUD
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(8, 8, 230, 22);
      ctx.fillStyle = nightVision ? '#00ff00' : '#ffffff';
      ctx.font = '11px monospace';
      ctx.fillText(`REC ${isRecording ? '●' : '○'} | ${ZONE_LABELS[activeZone]} | ${new Date().toLocaleTimeString()}`, 14, 23);

      // Grid overlay
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Center crosshair
      const cx = W / 2, cy = H / 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - 20, cy); ctx.lineTo(cx + 20, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - 20); ctx.lineTo(cx, cy + 20); ctx.stroke();

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [activeZone, nightVision, isRecording, getDetections, state.currentThreat]);

  const detections = getDetections();
  const detHistory = [
    { time: '15:42:18', label: 'Animal (boar)', zone: 'B', conf: '88%', action: 'Deterrent fired' },
    { time: '14:15:02', label: 'Crop stress', zone: 'A', conf: '91%', action: 'Alert sent' },
    { time: '12:30:44', label: 'Fence breach', zone: 'C', conf: '96%', action: 'Drone deployed' },
    { time: '10:05:11', label: 'Person', zone: 'D', conf: '94%', action: 'Police alert' },
    { time: '08:20:33', label: 'Vehicle', zone: 'A', conf: '97%', action: 'Spotlight on' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Zone tabs */}
      <div className="flex gap-2">
        {(['A', 'B', 'C', 'D'] as ZoneId[]).map(zone => {
          const z = state.zones.find(z => z.id === zone)!;
          const hasThreat = state.currentThreat?.zone === zone;
          return (
            <button
              key={zone}
              id={`zone-tab-${zone}`}
              onClick={() => setActiveZone(zone)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: activeZone === zone ? 'rgba(34,197,94,0.15)' : 'var(--bg-secondary)',
                border: `1px solid ${activeZone === zone ? 'rgba(34,197,94,0.4)' : hasThreat ? 'rgba(239,68,68,0.5)' : 'var(--border-color)'}`,
                color: activeZone === zone ? '#4ade80' : hasThreat ? '#f87171' : 'var(--text-secondary)',
              }}
            >
              {hasThreat && <AlertTriangle size={12} className="text-red-400 animate-blink" />}
              <span>Zone {zone}</span>
              <span className={`w-2 h-2 rounded-full ${z.cameraActive ? 'bg-green-400' : 'bg-red-400'}`} />
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera feed */}
        <div className="lg:col-span-2 glass-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera size={16} className="text-blue-400" />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {ZONE_LABELS[activeZone]}
              </span>
              {isRecording && <span className="animate-blink text-xs badge-red px-2 py-0.5 rounded-full">● REC</span>}
            </div>
            {detections.length > 0 && (
              <span className="text-xs badge-red px-2 py-1 rounded-lg font-semibold animate-blink">
                ⚠ {detections.length} Detection{detections.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="relative rounded-xl overflow-hidden" style={{ filter: `brightness(${brightness / 100})` }}>
            <canvas
              ref={canvasRef}
              width={640}
              height={380}
              className="w-full"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.3s' }}
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <button id="cam-record" onClick={() => setIsRecording(!isRecording)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isRecording ? 'badge-red' : 'badge-blue'}`}>
              {isRecording ? <Square size={12} /> : <Circle size={12} />}
              {isRecording ? 'Stop Rec' : 'Record'}
            </button>
            <button id="cam-zoom-in" onClick={() => setZoom(z => Math.min(2, z + 0.25))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium badge-blue">
              <ZoomIn size={12} /> Zoom In
            </button>
            <button id="cam-zoom-out" onClick={() => setZoom(z => Math.max(0.75, z - 0.25))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
              <ZoomOut size={12} /> Zoom Out
            </button>
            <button id="cam-night" onClick={() => setNightVision(!nightVision)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${nightVision ? 'badge-green' : ''}`}
              style={!nightVision ? { background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' } : {}}>
              {nightVision ? <Sun size={12} /> : <Moon size={12} />}
              {nightVision ? 'Day Mode' : 'Night Vision'}
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <Sun size={12} style={{ color: 'var(--text-muted)' }} />
              <input type="range" min={50} max={150} value={brightness} onChange={e => setBrightness(+e.target.value)}
                className="w-24 h-1 rounded-full appearance-none" style={{ accentColor: '#22c55e' }} />
            </div>
          </div>
        </div>

        {/* Detections panel */}
        <div className="space-y-4">
          <div className="glass-card p-4">
            <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
              AI Detection Status
            </div>
            {detections.length > 0 ? (
              <div className="space-y-2">
                {detections.map((d, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: `${d.color}15`, border: `1px solid ${d.color}40` }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm" style={{ color: d.color }}>{d.label}</span>
                      <span className="text-xs font-bold" style={{ color: d.color }}>{Math.round(d.confidence * 100)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${d.confidence * 100}%`, background: d.color }} />
                    </div>
                    <div className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                      Bounding box: ({d.x},{d.y}) {d.w}×{d.h}px
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>Zone {activeZone} Clear</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>COCO-SSD v2.2 active</div>
              </div>
            )}
          </div>

          {/* Zone info */}
          <div className="glass-card p-4">
            <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Zone Info</div>
            {(() => {
              const z = state.zones.find(z => z.id === activeZone)!;
              return (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Threat Level</span>
                    <span className={`badge-${z.threatLevel === 'low' ? 'green' : z.threatLevel === 'medium' ? 'amber' : 'red'} px-2 py-0.5 rounded-full`}>
                      {z.threatLevel.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Crop Health</span>
                    <span style={{ color: z.cropHealth > 75 ? '#4ade80' : z.cropHealth > 55 ? '#fbbf24' : '#f87171' }}>
                      {z.cropHealth}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Camera</span>
                    <span style={{ color: z.cameraActive ? '#4ade80' : '#f87171' }}>
                      {z.cameraActive ? '✅ Online' : '❌ Offline'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Last Scan</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{z.lastScan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>Risk Score</span>
                    <span style={{ color: z.riskScore > 40 ? '#f87171' : '#fbbf24' }}>{z.riskScore}/100</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Detection history table */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Camera size={16} className="text-blue-400" />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Detection History</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th><th>Detection</th><th>Zone</th><th>Confidence</th><th>Action Taken</th>
            </tr>
          </thead>
          <tbody>
            {[...(state.currentThreat ? [{
              time: new Date().toLocaleTimeString(),
              label: state.currentThreat.type.replace('_', ' '),
              zone: state.currentThreat.zone,
              conf: `${state.currentThreat.confidence}%`,
              action: state.currentThreat.response,
            }] : []), ...detHistory].map((d, i) => (
              <tr key={i}>
                <td className="font-mono text-xs">{d.time}</td>
                <td className="capitalize">{d.label}</td>
                <td><span className="badge-blue px-2 py-0.5 rounded-full text-xs">Zone {d.zone}</span></td>
                <td><span className="text-green-400 font-mono">{d.conf}</span></td>
                <td style={{ color: 'var(--text-muted)' }}>{d.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
