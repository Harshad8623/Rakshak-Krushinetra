export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';
export type SystemStatus = 'Active' | 'Alert' | 'Idle' | 'Patrol';
export type DroneStatus = 'Idle' | 'Deploying' | 'Active' | 'Returning' | 'PatrolMode' | 'Scanning';
export type ControlMode = 'manual' | 'assisted' | 'autonomous';
export type SecurityMode = 'low' | 'medium' | 'high';
export type AlertType = 'intrusion_human' | 'intrusion_animal' | 'intrusion_vehicle' | 'crop_damage' | 'fence_breach' | 'pest_activity' | 'crop_stress' | 'system';
export type AlertSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type WeatherCondition = 'Clear' | 'Cloudy' | 'Rain' | 'Storm';
export type ZoneId = 'A' | 'B' | 'C' | 'D';
export type Language = 'en' | 'hi' | 'mr';

export interface Zone {
  id: ZoneId;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  threatLevel: ThreatLevel;
  cropHealth: number; // 0-100
  cameraActive: boolean;
  lastScan: string;
  riskScore: number;
}

export interface Alert {
  id: string;
  timestamp: string;
  type: AlertType;
  severity: AlertSeverity;
  zone: ZoneId;
  confidence: number;
  description: string;
  response: string;
  resolved: boolean;
  autoAction: string;
  notificationSent: boolean;
}

export interface PatrolWaypoint {
  zone: ZoneId;
  order: number;
  estimatedMinutes: number;
}

export interface PatrolRoute {
  id: string;
  waypoints: PatrolWaypoint[];
  scheduledTimes: string[];
  estimatedDuration: number; // minutes
  isActive: boolean;
  currentWaypoint: number;
  batteryPerPatrol: number; // %
}

export interface CropDetection {
  id: string;
  timestamp: string;
  zone: ZoneId;
  healthScore: number;
  damageType: string;
  severity: AlertSeverity;
  affectedArea: number; // percentage
  recommendation: string;
}

export interface SecurityScore {
  overall: number;
  coverage: number;
  responseTime: number;
  zoneRisk: number;
  deterrentEffectiveness: number;
  patrolCoverage: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface WeatherState {
  condition: WeatherCondition;
  temperature: number;
  humidity: number;
  windSpeed: number;
  forecast: string;
  riskTag: string | null;
  affectsPatrol: boolean;
}

export interface Recommendation {
  id: string;
  icon: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: 'patrol' | 'crop' | 'security' | 'infrastructure' | 'weather';
  dismissed: boolean;
  accepted: boolean;
}

export interface NetworkFarm {
  id: string;
  name: string;
  x: number;
  y: number;
  status: 'normal' | 'elevated' | 'alert';
  lastAlert?: string;
}

export interface IncidentStep {
  time: string;
  event: string;
  icon: string;
  color: string;
  delay: number;
}

export interface SelfLearningStats {
  efficiency: number;
  patrolsCompleted: number;
  falsePositivesReduced: number;
  learningSummary: string;
}

export interface SystemState {
  status: SystemStatus;
  threatLevel: ThreatLevel;
  currentThreat: Alert | null;
  droneStatus: DroneStatus;
  deterrentActive: boolean;
  cropscanMode: boolean;
  edgeMode: boolean;
  isOnline: boolean;
  lastSync: string;
  offlineQueueCount: number;
  lastSimulation: string;
  controlMode: ControlMode;
  securityMode: SecurityMode;
  patrolRoute: PatrolRoute;
  securityScore: SecurityScore;
  zones: Zone[];
  alerts: Alert[];
  pendingAction: { description: string; type: string } | null;
  weather: WeatherState;
  cropDetections: CropDetection[];
  recommendations: Recommendation[];
  networkFarms: NetworkFarm[];
  systemUptime: number; // percentage
  camerasOnline: number;
  totalThreatsToday: number;
  deterrentsFired: number;
  aiModelLoaded: boolean;
  // Phase 4 additions
  lockdownMode: boolean;
  demoRunning: boolean;
  incidentReplay: IncidentStep[] | null;
  replayStep: number;
  language: Language;
  geminiInsight: string | null;
  selfLearning: SelfLearningStats;
}
