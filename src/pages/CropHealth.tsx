import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Leaf, Droplets, Bug, AlertTriangle, CheckCircle, Navigation, RadioTower, Zap } from 'lucide-react';
import type { ZoneId, CropDetection } from '../types';

const ZONE_LABELS = { A: 'Zone A — North Field', B: 'Zone B — East Orchard', C: 'Zone C — South Paddy', D: 'Zone D — West Boundary' };

const DETECT_COLORS = {
  wilting: '#fbbf24', // Amber
  pest: '#f97316',    // Orange
  disease: '#ef4444', // Red
  default: '#3b82f6', // Blue
};

function getCategoryFromDamage(damage: string) {
  const d = damage.toLowerCase();
  if (d.includes('water') || d.includes('wilt') || d.includes('irriga')) return 'wilting';
  if (d.includes('pest') || d.includes('locust') || d.includes('aphid')) return 'pest';
  if (d.includes('disease') || d.includes('rust') || d.includes('blight') || d.includes('fungal')) return 'disease';
  return 'default';
}

function getIconFromCategory(category: string) {
  if (category === 'wilting') return <Droplets size={16} />;
  if (category === 'pest') return <Bug size={16} />;
  if (category === 'disease') return <AlertTriangle size={16} />;
  return <Leaf size={16} />;
}

export default function CropHealth() {
  const { state } = useApp();
  const [activeZone, setActiveZone] = useState<ZoneId>('B');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const tickRef = useRef(0);

  // Animated Scan Layer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    const draw = () => {
      tickRef.current++;
      const t = tickRef.current;

      // Base background (Soil/Ground)
      ctx.fillStyle = '#2d4a2d';
      ctx.fillRect(0, 0, W, H);

      // Draw Grid / Crop Rows (Top-Down)
      ctx.lineWidth = 2;
      for (let i = 0; i < 20; i++) {
        ctx.strokeStyle = '#3d6a3d';
        ctx.beginPath();
        ctx.moveTo(i * (W / 18), 0);
        ctx.lineTo(i * (W / 18), H);
        ctx.stroke();
      }

      // Simulate Zones (4 Quadrants roughly)
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

      // Zone Labels
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = 'bold 24px monospace';
      ctx.fillText('ZONE A', W / 4 - 40, H / 4);
      ctx.fillText('ZONE B', 3 * W / 4 - 40, H / 4);
      ctx.fillText('ZONE C', W / 4 - 40, 3 * H / 4);
      ctx.fillText('ZONE D', 3 * W / 4 - 40, 3 * H / 4);

      // Draw Detections as Heatmap/Bounding Boxes
      state.cropDetections.forEach((det, i) => {
        const cat = getCategoryFromDamage(det.damageType);
        const color = DETECT_COLORS[cat as keyof typeof DETECT_COLORS] || DETECT_COLORS.default;
        
        let cx = 0, cy = 0;
        if (det.zone === 'A') { cx = W / 4; cy = H / 4; }
        if (det.zone === 'B') { cx = 3 * W / 4; cy = H / 4; }
        if (det.zone === 'C') { cx = W / 4; cy = 3 * H / 4; }
        if (det.zone === 'D') { cx = 3 * W / 4; cy = 3 * H / 4; }

        // Add some faux-random offset based on ID so they don't stack directly on center
        const offset = (parseInt(det.id.replace('cd', '')) * 30) % 80 - 40;
        cx += offset;
        cy += offset;

        const pulse = Math.sin(t * 0.05 + i) * 10;
        const radius = 40 + pulse;

        // Bounding Box
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - radius, cy - radius, radius * 2, radius * 2);

        // Heat Overlay
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, `${color}60`); // 60 is alpha hex roughly
        grad.addColorStop(1, `${color}00`);
        ctx.fillStyle = grad;
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);

        // Label
        ctx.fillStyle = color;
        ctx.fillRect(cx - radius, cy - radius - 20, 160, 20);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`AI: ${det.damageType.substring(0, 20)}`, cx - radius + 4, cy - radius - 6);
      });

      // Active Zone Highlight Overlay
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      if (activeZone === 'A') { ctx.fillRect(W/2, 0, W/2, H); ctx.fillRect(0, H/2, W/2, H/2); }
      if (activeZone === 'B') { ctx.fillRect(0, 0, W/2, H); ctx.fillRect(W/2, H/2, W/2, H/2); }
      if (activeZone === 'C') { ctx.fillRect(0, 0, W, H/2); ctx.fillRect(W/2, H/2, W/2, H/2); }
      if (activeZone === 'D') { ctx.fillRect(0, 0, W, H/2); ctx.fillRect(0, H/2, W/2, H/2); }

      // Drone HUD (Scan Line)
      const scanY = (t * 2) % H;
      const scanGrad = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
      scanGrad.addColorStop(0, 'rgba(52,211,153,0)');
      scanGrad.addColorStop(0.5, 'rgba(52,211,153,0.3)');
      scanGrad.addColorStop(1, 'rgba(52,211,153,0)');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 40, W, 80);
      
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, scanY); ctx.lineTo(W, scanY); ctx.stroke();

      // Drone Viewfinder UI
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 2;
      const cl = 20; // corner length
      // Top Left
      ctx.beginPath(); ctx.moveTo(10, 10 + cl); ctx.lineTo(10, 10); ctx.lineTo(10 + cl, 10); ctx.stroke();
      // Top Right
      ctx.beginPath(); ctx.moveTo(W - 10 - cl, 10); ctx.lineTo(W - 10, 10); ctx.lineTo(W - 10, 10 + cl); ctx.stroke();
      // Bottom Left
      ctx.beginPath(); ctx.moveTo(10, H - 10 - cl); ctx.lineTo(10, H - 10); ctx.lineTo(10 + cl, H - 10); ctx.stroke();
      // Bottom Right
      ctx.beginPath(); ctx.moveTo(W - 10 - cl, H - 10); ctx.lineTo(W - 10, H - 10); ctx.lineTo(W - 10, H - 10 - cl); ctx.stroke();

      // HUD Text
      ctx.fillStyle = '#34d399';
      ctx.font = '12px monospace';
      ctx.fillText(`ALT: 45m | VEL: 12km/h | LAT/LON: 18.52°N 73.85°E`, 20, 25);
      ctx.fillText(`CROP SCAN MODE: ACTIVE`, 20, H - 15);

      animFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [state.cropDetections, activeZone]);

  const activeDetections = state.cropDetections.filter(d => d.zone === activeZone);
  const activeZoneData = state.zones.find(z => z.id === activeZone)!;

  return (
    <div className="p-6 space-y-6">
      {/* Header and Zone Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold gradient-text flex items-center gap-2">
            <Leaf className="text-green-500" />
            AI Crop Health & Disease Detection
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Drone aerial scans powered by Gemini AI detecting wilting, pest damage, and irrigation needs.
          </p>
        </div>

        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
          {(['A', 'B', 'C', 'D'] as ZoneId[]).map(zone => {
            const hasIssue = state.cropDetections.some(d => d.zone === zone);
            return (
              <button
                key={zone}
                onClick={() => setActiveZone(zone)}
                className="px-4 py-2 text-sm font-medium transition-all flex items-center gap-2"
                style={{
                  background: activeZone === zone ? 'rgba(34,197,94,0.15)' : 'var(--bg-secondary)',
                  color: activeZone === zone ? '#4ade80' : 'var(--text-secondary)',
                  borderRight: zone !== 'D' ? '1px solid var(--border-color)' : 'none',
                }}
              >
                <span>Zone {zone}</span>
                {hasIssue && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT/MAIN: Drone Scan Canvas (Takes 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Navigation size={16} className="text-green-400" />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Live Aerial Multispectral Scan</span>
                <span className="badge-green px-2 py-0.5 rounded-full text-xs animate-blink">● LIVE</span>
              </div>
              <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                UAV-04 • Alt 45m • Multispectral + NDVI RGB
              </div>
            </div>
            
            <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(52,211,153,0.3)', backgroundColor: '#111' }}>
              <canvas
                ref={canvasRef}
                width={800}
                height={460}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10 border border-blue-500/30">
                <Droplets size={18} className="text-blue-400" />
              </div>
              <div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Moisture</div>
                <div className="text-lg font-bold text-blue-400">42%</div>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/10 border border-green-500/30">
                <Leaf size={18} className="text-green-400" />
              </div>
              <div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Health Grade</div>
                <div className="text-lg font-bold text-green-400">{activeZoneData.cropHealth > 80 ? 'A-' : activeZoneData.cropHealth > 60 ? 'B+' : 'C'}</div>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/10 border border-red-500/30">
                <Bug size={18} className="text-red-400" />
              </div>
              <div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Pest Risk</div>
                <div className="text-lg font-bold text-red-400">High</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Analysis Panel */}
        <div className="space-y-4">
          <div className="glass-card p-4 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-700/50">
              <Zap size={18} className="text-amber-400" />
              <span className="text-md font-bold" style={{ color: 'var(--text-primary)' }}>
                {ZONE_LABELS[activeZone]} Analysis
              </span>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: 'var(--text-muted)' }}>Overall Crop Health</span>
                <span className="font-bold text-green-400">{activeZoneData.cropHealth}%</span>
              </div>
              <div className="progress-bar mb-2">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${activeZoneData.cropHealth}%`, 
                    background: activeZoneData.cropHealth > 75 ? '#4ade80' : activeZoneData.cropHealth > 55 ? '#fbbf24' : '#ef4444' 
                  }} 
                />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Based on NDVI (Normalized Difference Vegetation Index) and thermal imaging algorithms.
              </p>
            </div>

            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Detected Issues ({activeDetections.length})
            </h3>

            <div className="flex-1 space-y-3 overflow-y-auto pr-2">
              {activeDetections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-black/20 rounded-xl border border-gray-800">
                  <CheckCircle size={32} className="text-green-500 mx-auto mb-2 opacity-80" />
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Zone is Clear</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>No diseases, wilting, or pests detected.</div>
                </div>
              ) : (
                activeDetections.map(det => {
                  const cat = getCategoryFromDamage(det.damageType);
                  const color = DETECT_COLORS[cat as keyof typeof DETECT_COLORS] || DETECT_COLORS.default;
                  const bg = `${color}15`;
                  const border = `${color}40`;

                  return (
                    <div key={det.id} className="p-3 rounded-xl transform transition-transform hover:scale-[1.02]" 
                      style={{ background: bg, border: `1px solid ${border}` }}>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" 
                          style={{ background: `${color}25`, color: color }}>
                          {getIconFromCategory(cat)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm" style={{ color }}>{det.damageType}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" 
                              style={{ background: `${color}20`, color }}>
                              {det.severity}
                            </span>
                          </div>
                          <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                            <span className="opacity-70">Affected Area:</span> <span className="font-semibold">{det.affectedArea}%</span>
                          </div>
                          <div className="text-xs p-2 rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                            💡 {det.recommendation}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 flex items-center justify-center gap-2"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
              <RadioTower size={16} className="text-blue-400" />
              Request New Aerial Scan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
