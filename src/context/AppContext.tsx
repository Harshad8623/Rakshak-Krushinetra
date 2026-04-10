import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import type { SystemState, Alert, AlertType, AlertSeverity, ZoneId, ControlMode, SecurityMode, Language, IncidentStep } from '../types';
import {
  INITIAL_ZONES, INITIAL_ALERTS, INITIAL_NETWORKS,
  INITIAL_RECOMMENDATIONS, INITIAL_CROP_DETECTIONS,
} from '../data/mockData';

const INITIAL_STATE: SystemState = {
  status: 'Active',
  threatLevel: 'low',
  currentThreat: null,
  droneStatus: 'Idle',
  deterrentActive: false,
  cropscanMode: false,
  edgeMode: false,
  isOnline: true,
  lastSync: new Date().toLocaleTimeString(),
  offlineQueueCount: 0,
  lastSimulation: '',
  controlMode: 'autonomous',
  securityMode: 'medium',
  patrolRoute: {
    id: 'pr1',
    waypoints: [
      { zone: 'A', order: 1, estimatedMinutes: 4 },
      { zone: 'B', order: 2, estimatedMinutes: 5 },
      { zone: 'D', order: 3, estimatedMinutes: 4 },
      { zone: 'C', order: 4, estimatedMinutes: 4 },
    ],
    scheduledTimes: ['10:00 PM', '1:00 AM', '4:00 AM'],
    estimatedDuration: 17,
    isActive: false,
    currentWaypoint: 0,
    batteryPerPatrol: 6,
  },
  securityScore: {
    overall: 82,
    coverage: 90,
    responseTime: 85,
    zoneRisk: 78,
    deterrentEffectiveness: 81,
    patrolCoverage: 79,
    trend: 'increasing',
  },
  zones: INITIAL_ZONES,
  alerts: INITIAL_ALERTS,
  pendingAction: null,
  weather: {
    condition: 'Cloudy',
    temperature: 22,
    humidity: 68,
    windSpeed: 12,
    forecast: 'Storm expected tonight after 9 PM',
    riskTag: '⚠️ Storm tonight — high animal activity expected',
    affectsPatrol: true,
  },
  cropDetections: INITIAL_CROP_DETECTIONS,
  recommendations: INITIAL_RECOMMENDATIONS,
  networkFarms: INITIAL_NETWORKS,
  systemUptime: 98.2,
  camerasOnline: 3,
  totalThreatsToday: 7,
  deterrentsFired: 4,
  aiModelLoaded: true,
  // Phase 4
  lockdownMode: false,
  demoRunning: false,
  incidentReplay: null,
  replayStep: 0,
  language: 'en',
  geminiInsight: null,
  selfLearning: {
    efficiency: 87,
    patrolsCompleted: 23,
    falsePositivesReduced: 41,
    learningSummary: 'System learned that Zone B has 3× higher night-time intrusion probability. Patrol frequency auto-adjusted.',
  },
};

type Action =
  | { type: 'SET_DRONE_STATUS'; payload: SystemState['droneStatus'] }
  | { type: 'SET_CONTROL_MODE'; payload: ControlMode }
  | { type: 'SET_SECURITY_MODE'; payload: SecurityMode }
  | { type: 'TOGGLE_CROPSCAN' }
  | { type: 'TOGGLE_EDGE_MODE' }
  | { type: 'TOGGLE_ONLINE' }
  | { type: 'ADD_ALERT'; payload: Alert }
  | { type: 'RESOLVE_ALERT'; payload: string }
  | { type: 'SET_PENDING_ACTION'; payload: SystemState['pendingAction'] }
  | { type: 'APPROVE_ACTION' }
  | { type: 'DISMISS_ACTION' }
  | { type: 'CLEAR_THREAT' }
  | { type: 'SIMULATE_THREAT'; payload: { alertType: AlertType; zone: ZoneId; severity: AlertSeverity; description: string; confidence: number } }
  | { type: 'START_PATROL' }
  | { type: 'STOP_PATROL' }
  | { type: 'NEXT_WAYPOINT' }
  | { type: 'DISMISS_RECOMMENDATION'; payload: string }
  | { type: 'ACCEPT_RECOMMENDATION'; payload: string }
  | { type: 'NETWORK_ALERT'; payload: string }
  | { type: 'SYNC_OFFLINE_QUEUE' }
  | { type: 'INCREMENT_OFFLINE_QUEUE' }
  | { type: 'TRIGGER_LOCKDOWN' }
  | { type: 'CANCEL_LOCKDOWN' }
  | { type: 'SET_DEMO_RUNNING'; payload: boolean }
  | { type: 'SET_INCIDENT_REPLAY'; payload: IncidentStep[] | null }
  | { type: 'ADVANCE_REPLAY_STEP' }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'SET_GEMINI_INSIGHT'; payload: string };

function reducer(state: SystemState, action: Action): SystemState {
  switch (action.type) {
    case 'SET_DRONE_STATUS':
      return { ...state, droneStatus: action.payload };
    case 'SET_CONTROL_MODE':
      return { ...state, controlMode: action.payload };
    case 'SET_SECURITY_MODE':
      return { ...state, securityMode: action.payload };
    case 'TOGGLE_CROPSCAN':
      return { ...state, cropscanMode: !state.cropscanMode };
    case 'TOGGLE_EDGE_MODE':
      return { ...state, edgeMode: !state.edgeMode, isOnline: !state.edgeMode ? false : true };
    case 'TOGGLE_ONLINE':
      return { ...state, isOnline: !state.isOnline };
    case 'ADD_ALERT':
      return {
        ...state,
        alerts: [action.payload, ...state.alerts],
        totalThreatsToday: state.totalThreatsToday + 1,
        currentThreat: action.payload,
        status: 'Alert',
        threatLevel: action.payload.severity === 'Critical' ? 'critical'
          : action.payload.severity === 'High' ? 'high'
          : action.payload.severity === 'Medium' ? 'medium' : 'low',
      };
    case 'RESOLVE_ALERT':
      return {
        ...state,
        alerts: state.alerts.map(a => a.id === action.payload ? { ...a, resolved: true } : a),
      };
    case 'SET_PENDING_ACTION':
      return { ...state, pendingAction: action.payload };
    case 'APPROVE_ACTION':
      return { ...state, pendingAction: null, deterrentActive: true, deterrentsFired: state.deterrentsFired + 1 };
    case 'DISMISS_ACTION':
      return { ...state, pendingAction: null };
    case 'CLEAR_THREAT':
      return { ...state, currentThreat: null, status: 'Active', threatLevel: 'low', deterrentActive: false, droneStatus: 'Idle', lockdownMode: false };

    case 'SIMULATE_THREAT': {
      const { alertType, zone, severity, description, confidence } = action.payload;
      const newAlert: Alert = {
        id: `sim-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        type: alertType,
        severity,
        zone,
        confidence,
        description,
        response: 'Processing...',
        resolved: false,
        autoAction: '',
        notificationSent: true,
      };
      const isCropAlert = alertType === 'crop_damage' || alertType === 'crop_stress' || alertType === 'pest_activity';
      const isHumanThreat = alertType === 'intrusion_human';

      const updatedZones = state.zones.map(z => {
        if (z.id === zone) {
          return {
            ...z,
            threatLevel: severity === 'Critical' ? 'critical' as const : severity === 'High' ? 'high' as const : 'medium' as const,
            cropHealth: isCropAlert ? Math.max(0, z.cropHealth - 15) : z.cropHealth,
          };
        }
        return z;
      });

      const updatedNetworks = state.networkFarms.map((f, i) => ({
        ...f,
        status: i > 0 && i < 3 ? 'elevated' as const : f.status,
        lastAlert: i > 0 && i < 3 ? `Shared alert: ${description.substring(0, 30)}...` : f.lastAlert,
      }));

      // Build incident replay steps
      const now = new Date();
      const fmt = (d: Date) => d.toLocaleTimeString();
      const replay = [
        { time: fmt(now), event: `${description}`, icon: '⚠️', color: '#ef4444', delay: 0 },
        { time: fmt(new Date(now.getTime() + 5000)), event: isHumanThreat ? 'Police alert sent' : isCropAlert ? 'Irrigation alert dispatched' : 'Ultrasonic deterrent activated', icon: isCropAlert ? '💧' : '🔊', color: '#f59e0b', delay: 1500 },
        { time: fmt(new Date(now.getTime() + 10000)), event: 'Drone deployed to Zone ' + zone, icon: '🚁', color: '#3b82f6', delay: 3000 },
        { time: fmt(new Date(now.getTime() + 25000)), event: 'Farmer notified via SMS & Telegram', icon: '📱', color: '#22c55e', delay: 4500 },
      ];

      if (state.controlMode === 'manual') {
        return {
          ...state,
          alerts: [newAlert, ...state.alerts],
          totalThreatsToday: state.totalThreatsToday + 1,
          currentThreat: newAlert,
          status: 'Alert',
          threatLevel: severity === 'Critical' ? 'critical' : severity === 'High' ? 'high' : 'medium',
          zones: updatedZones,
          networkFarms: updatedNetworks,
          pendingAction: { description: `Threat detected in Zone ${zone}: ${description}. Deploy deterrent?`, type: alertType },
          lastSimulation: description,
          incidentReplay: replay,
          replayStep: 0,
        };
      }

      return {
        ...state,
        alerts: [{ ...newAlert, response: 'Auto-deterrent activated', autoAction: 'Deterrent + Drone' }, ...state.alerts],
        totalThreatsToday: state.totalThreatsToday + 1,
        currentThreat: { ...newAlert, response: 'Auto-deterrent activated' },
        status: 'Alert',
        threatLevel: severity === 'Critical' ? 'critical' : severity === 'High' ? 'high' : 'medium',
        droneStatus: 'Deploying',
        deterrentActive: !isCropAlert,
        deterrentsFired: isCropAlert ? state.deterrentsFired : state.deterrentsFired + 1,
        zones: updatedZones,
        networkFarms: updatedNetworks,
        lastSimulation: description,
        offlineQueueCount: state.isOnline ? state.offlineQueueCount : state.offlineQueueCount + 1,
        lockdownMode: isHumanThreat && severity === 'High' || severity === 'Critical',
        incidentReplay: replay,
        replayStep: 0,
      };
    }

    case 'START_PATROL':
      return {
        ...state,
        droneStatus: 'PatrolMode',
        status: 'Patrol',
        patrolRoute: { ...state.patrolRoute, isActive: true, currentWaypoint: 0 },
      };
    case 'STOP_PATROL':
      return {
        ...state,
        droneStatus: 'Returning',
        status: 'Active',
        patrolRoute: { ...state.patrolRoute, isActive: false, currentWaypoint: 0 },
      };
    case 'NEXT_WAYPOINT':
      return {
        ...state,
        patrolRoute: {
          ...state.patrolRoute,
          currentWaypoint: (state.patrolRoute.currentWaypoint + 1) % state.patrolRoute.waypoints.length,
        },
      };
    case 'DISMISS_RECOMMENDATION':
      return {
        ...state,
        recommendations: state.recommendations.map(r => r.id === action.payload ? { ...r, dismissed: true } : r),
      };
    case 'ACCEPT_RECOMMENDATION':
      return {
        ...state,
        recommendations: state.recommendations.map(r => r.id === action.payload ? { ...r, accepted: true, dismissed: true } : r),
      };
    case 'NETWORK_ALERT':
      return {
        ...state,
        networkFarms: state.networkFarms.map(f => ({
          ...f,
          status: f.id !== 'f1' ? 'elevated' as const : f.status,
        })),
      };
    case 'SYNC_OFFLINE_QUEUE':
      return { ...state, offlineQueueCount: 0, lastSync: new Date().toLocaleTimeString() };
    case 'INCREMENT_OFFLINE_QUEUE':
      return { ...state, offlineQueueCount: state.offlineQueueCount + 1 };
    case 'TRIGGER_LOCKDOWN':
      return { ...state, lockdownMode: true, securityMode: 'high', status: 'Alert' };
    case 'CANCEL_LOCKDOWN':
      return { ...state, lockdownMode: false };
    case 'SET_DEMO_RUNNING':
      return { ...state, demoRunning: action.payload };
    case 'SET_INCIDENT_REPLAY':
      return { ...state, incidentReplay: action.payload, replayStep: 0 };
    case 'ADVANCE_REPLAY_STEP':
      return { ...state, replayStep: state.replayStep + 1 };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_GEMINI_INSIGHT':
      return { ...state, geminiInsight: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: SystemState;
  dispatch: React.Dispatch<Action>;
  simulateThreat: (type: 'human' | 'animal' | 'vehicle' | 'crop') => void;
  clearThreat: () => void;
  deployDrone: () => void;
  startPatrol: () => void;
  stopPatrol: () => void;
  runDemo: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const patrolTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const simulateThreat = useCallback((type: 'human' | 'animal' | 'vehicle' | 'crop') => {
    const configs = {
      human: { alertType: 'intrusion_human' as const, zone: 'B' as const, severity: 'High' as const, description: 'Human intruder detected near crop boundary', confidence: Math.round(88 + Math.random() * 9) },
      animal: { alertType: 'intrusion_animal' as const, zone: 'A' as const, severity: 'Medium' as const, description: 'Wild boar herd detected in Zone A', confidence: Math.round(82 + Math.random() * 12) },
      vehicle: { alertType: 'intrusion_vehicle' as const, zone: 'D' as const, severity: 'High' as const, description: 'Unknown vehicle approaching north gate', confidence: Math.round(91 + Math.random() * 7) },
      crop: { alertType: 'crop_damage' as const, zone: 'B' as const, severity: 'High' as const, description: 'Significant crop damage detected — pest activity Zone B', confidence: Math.round(85 + Math.random() * 10) },
    };
    dispatch({ type: 'SIMULATE_THREAT', payload: configs[type] });

    if (state.controlMode === 'autonomous') {
      setTimeout(() => {
        dispatch({ type: 'SET_DRONE_STATUS', payload: 'Returning' });
        setTimeout(() => dispatch({ type: 'CLEAR_THREAT' }), 4000);
      }, 12000);
    }
  }, [state.controlMode]);

  const clearThreat = useCallback(() => dispatch({ type: 'CLEAR_THREAT' }), []);

  const deployDrone = useCallback(() => {
    dispatch({ type: 'SET_DRONE_STATUS', payload: 'Deploying' });
    setTimeout(() => dispatch({ type: 'SET_DRONE_STATUS', payload: 'Active' }), 3000);
  }, []);

  const startPatrol = useCallback(() => {
    dispatch({ type: 'START_PATROL' });
    patrolTimerRef.current = setInterval(() => {
      dispatch({ type: 'NEXT_WAYPOINT' });
    }, 5000);
  }, []);

  const stopPatrol = useCallback(() => {
    if (patrolTimerRef.current) clearInterval(patrolTimerRef.current);
    dispatch({ type: 'STOP_PATROL' });
    setTimeout(() => dispatch({ type: 'SET_DRONE_STATUS', payload: 'Idle' }), 3000);
  }, []);

  const runDemo = useCallback(() => {
    dispatch({ type: 'SET_DEMO_RUNNING', payload: true });
    // Step 1: Animal intrusion
    setTimeout(() => {
      dispatch({ type: 'SIMULATE_THREAT', payload: { alertType: 'intrusion_animal', zone: 'B', severity: 'Medium', description: '🎬 DEMO: Wild boar herd detected — Zone B perimeter', confidence: 91 } });
    }, 500);
    // Step 2: Start patrol
    setTimeout(() => {
      dispatch({ type: 'START_PATROL' });
    }, 3000);
    // Step 3: Crop alert
    setTimeout(() => {
      dispatch({ type: 'SIMULATE_THREAT', payload: { alertType: 'crop_stress', zone: 'A', severity: 'High', description: '🎬 DEMO: 23% crop wilting detected — irrigation needed', confidence: 89 } });
    }, 8000);
    // Step 4: Show recommendation was updated
    setTimeout(() => {
      dispatch({ type: 'ACCEPT_RECOMMENDATION', payload: 'r2' });
    }, 11000);
    // Step 5: Clear & stop
    setTimeout(() => {
      dispatch({ type: 'STOP_PATROL' });
      dispatch({ type: 'CLEAR_THREAT' });
      dispatch({ type: 'SET_DEMO_RUNNING', payload: false });
    }, 16000);
  }, []);

  // Edge AI: auto-sync when coming back online
  useEffect(() => {
    if (state.isOnline && state.offlineQueueCount > 0) {
      setTimeout(() => dispatch({ type: 'SYNC_OFFLINE_QUEUE' }), 2000);
    }
  }, [state.isOnline, state.offlineQueueCount]);

  return (
    <AppContext.Provider value={{ state, dispatch, simulateThreat, clearThreat, deployDrone, startPatrol, stopPatrol, runDemo }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
