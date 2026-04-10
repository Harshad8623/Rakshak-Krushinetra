import type { Alert, Zone, NetworkFarm, Recommendation, CropDetection } from '../types';

export const INITIAL_ZONES: Zone[] = [
  { id: 'A', name: 'Zone A - North Field', x: 40, y: 40, width: 160, height: 120, threatLevel: 'low', cropHealth: 87, cameraActive: true, lastScan: '2 min ago', riskScore: 18 },
  { id: 'B', name: 'Zone B - East Orchard', x: 240, y: 40, width: 160, height: 120, threatLevel: 'medium', cropHealth: 62, cameraActive: true, lastScan: '5 min ago', riskScore: 54 },
  { id: 'C', name: 'Zone C - South Paddy', x: 40, y: 200, width: 160, height: 120, threatLevel: 'low', cropHealth: 91, cameraActive: true, lastScan: '1 min ago', riskScore: 12 },
  { id: 'D', name: 'Zone D - West Boundary', x: 240, y: 200, width: 160, height: 120, threatLevel: 'low', cropHealth: 78, cameraActive: false, lastScan: '18 min ago', riskScore: 31 },
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'a1', timestamp: '2026-03-17 15:42', type: 'intrusion_animal', severity: 'Medium',
    zone: 'B', confidence: 88, description: 'Wild boar detected near crop boundary',
    response: 'Ultrasonic deterrent activated', resolved: true, autoAction: 'Deterrent fired',
    notificationSent: true,
  },
  {
    id: 'a2', timestamp: '2026-03-17 14:15', type: 'crop_stress', severity: 'High',
    zone: 'A', confidence: 91, description: 'Crop stress detected — 23% wilting pattern',
    response: 'Irrigation alert sent to farmer', resolved: false, autoAction: 'Alert sent',
    notificationSent: true,
  },
  {
    id: 'a3', timestamp: '2026-03-17 12:30', type: 'fence_breach', severity: 'Critical',
    zone: 'C', confidence: 96, description: 'Fence breach detected — Section 3 south boundary',
    response: 'Drone deployed, farmer notified', resolved: true, autoAction: 'Drone deployed',
    notificationSent: true,
  },
  {
    id: 'a4', timestamp: '2026-03-17 10:05', type: 'intrusion_human', severity: 'High',
    zone: 'D', confidence: 94, description: 'Human intruder detected — unauthorized entry',
    response: 'Police alert sent, drone deployed', resolved: true, autoAction: 'Police notified',
    notificationSent: true,
  },
  {
    id: 'a5', timestamp: '2026-03-17 08:20', type: 'pest_activity', severity: 'Medium',
    zone: 'B', confidence: 79, description: 'High locust activity detected in east orchard',
    response: 'Pest control notification sent', resolved: false, autoAction: 'Alert queued',
    notificationSent: true,
  },
  {
    id: 'a6', timestamp: '2026-03-16 22:45', type: 'intrusion_vehicle', severity: 'High',
    zone: 'A', confidence: 97, description: 'Unknown vehicle detected near north gate',
    response: 'Spotlight activated, farmer notified', resolved: true, autoAction: 'Spotlight',
    notificationSent: true,
  },
];

export const INITIAL_NETWORKS: NetworkFarm[] = [
  { id: 'f1', name: 'Your Farm', x: 200, y: 160, status: 'normal' },
  { id: 'f2', name: 'Farm B', x: 80, y: 80, status: 'normal' },
  { id: 'f3', name: 'Farm C', x: 320, y: 90, status: 'elevated' },
  { id: 'f4', name: 'Farm D', x: 280, y: 260, status: 'normal' },
];

export const INITIAL_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'r1', icon: '🚨', title: 'Increase Zone B patrol frequency',
    description: '3 intrusions detected this week. Recommend 2x patrol schedule for Zone B.',
    priority: 'high', category: 'patrol', dismissed: false, accepted: false,
  },
  {
    id: 'r2', icon: '💧', title: 'Irrigation recommended — Zone A',
    description: 'Crop stress detected (23% wilting). Irrigate within 24 hours.',
    priority: 'high', category: 'crop', dismissed: false, accepted: false,
  },
  {
    id: 'r3', icon: '🔧', title: 'Fence repair needed — Zone C',
    description: 'Breach detected near south boundary Section 3. Schedule maintenance.',
    priority: 'medium', category: 'infrastructure', dismissed: false, accepted: false,
  },
  {
    id: 'r4', icon: '📅', title: 'Extend patrol to 2 AM time slot',
    description: 'Peak intrusion risk detected 1–3 AM. Current schedule misses window.',
    priority: 'medium', category: 'patrol', dismissed: false, accepted: false,
  },
  {
    id: 'r5', icon: '📷', title: 'Add camera coverage to Zone D',
    description: 'Zone D camera offline. 31% risk score with no visual coverage.',
    priority: 'high', category: 'security', dismissed: false, accepted: false,
  },
];

export const INITIAL_CROP_DETECTIONS: CropDetection[] = [
  {
    id: 'cd1', timestamp: '2026-03-17 14:00', zone: 'A', healthScore: 77,
    damageType: 'Water stress / wilting', severity: 'High', affectedArea: 23,
    recommendation: 'Irrigate Zone A within 24 hours — moisture deficit',
  },
  {
    id: 'cd2', timestamp: '2026-03-17 11:30', zone: 'B', healthScore: 62,
    damageType: 'Pest damage (Locust / Aphids)', severity: 'High', affectedArea: 38,
    recommendation: 'Apply pest control spray. Increase monitoring frequency.',
  },
  {
    id: 'cd3', timestamp: '2026-03-17 09:15', zone: 'D', healthScore: 78,
    damageType: 'Disease (Leaf Rust / Blight)', severity: 'Medium', affectedArea: 14,
    recommendation: 'Apply fungicide to Zone D to prevent further spread.',
  },
  {
    id: 'cd4', timestamp: '2026-03-17 08:00', zone: 'C', healthScore: 89,
    damageType: 'Early Blight Detected', severity: 'Low', affectedArea: 4,
    recommendation: 'Monitor regularly. Minor fungal infection observed.',
  }
];

export const HEATMAP_DATA = Array.from({ length: 7 }, (_, dayIdx) =>
  Array.from({ length: 24 }, (_, hourIdx) => {
    const isPeakHour = hourIdx >= 22 || hourIdx <= 5;
    const isMidHour = (hourIdx >= 12 && hourIdx <= 15);
    const baseRisk = isPeakHour ? 60 : isMidHour ? 30 : 10;
    const dayCycle = [1.5, 0.8, 1.2, 0.6, 1.8, 0.9, 1.1][dayIdx];
    return Math.min(100, Math.round(baseRisk * dayCycle + Math.random() * 20));
  })
);

export const TREND_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: `Mar ${i + 1}`,
  intrusions: Math.round(2 + Math.random() * 6 + (i > 20 ? -1 : 0)),
  resolved: Math.round(1 + Math.random() * 5),
  cropAlerts: Math.round(0 + Math.random() * 3),
  securityScore: Math.round(72 + Math.random() * 15),
}));

export const THREAT_DISTRIBUTION = [
  { name: 'Animal', value: 38, color: '#f59e0b' },
  { name: 'Human', value: 24, color: '#ef4444' },
  { name: 'Crop Damage', value: 21, color: '#22c55e' },
  { name: 'Vehicle', value: 11, color: '#3b82f6' },
  { name: 'Fence Breach', value: 6, color: '#8b5cf6' },
];

export const ZONE_VULNERABILITY = [
  { zone: 'Zone B', score: 54, color: '#f59e0b' },
  { zone: 'Zone D', score: 31, color: '#f59e0b' },
  { zone: 'Zone A', score: 18, color: '#22c55e' },
  { zone: 'Zone C', score: 12, color: '#22c55e' },
];

export const CROP_HEALTH_TREND = Array.from({ length: 14 }, (_, i) => ({
  day: `D-${13 - i}`,
  zoneA: Math.round(82 + Math.random() * 8 - (i > 10 ? 5 : 0)),
  zoneB: Math.round(58 + Math.random() * 10),
  zoneC: Math.round(88 + Math.random() * 6),
  zoneD: Math.round(74 + Math.random() * 8),
}));

export const ACTIVITY_FEED = [
  { time: '15:42', event: 'Wild boar detected — Zone B', icon: '🐗', color: '#f59e0b' },
  { time: '15:43', event: 'Ultrasonic deterrent fired', icon: '🔊', color: '#3b82f6' },
  { time: '14:15', event: 'Crop stress alert — Zone A', icon: '🌾', color: '#22c55e' },
  { time: '12:30', event: 'Fence breach — Zone C S3', icon: '🔧', color: '#ef4444' },
  { time: '12:31', event: 'Drone deployed to Zone C', icon: '🚁', color: '#06b6d4' },
  { time: '10:05', event: 'Human intruder — Zone D', icon: '👤', color: '#ef4444' },
  { time: '08:20', event: 'Vehicle detected — Zone A gate', icon: '🚗', color: '#8b5cf6' },
];
