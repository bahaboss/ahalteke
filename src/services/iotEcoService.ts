// TODO: [BACKEND_API] GET /api/v1/iot/telemetry — IoT datçik maglumatlaryny, iýmitlendiriş tertibini, türgenleşikleri, weterinar senenamasyny we arassaçylyk çek-listini dolandyrmak.

import {
  mockEcoMetrics,
  mockEcoMonthlySeries,
  mockEcoRecommendations,
  mockEcoWeeklySeries,
  mockFeedingPlans,
  mockHygieneTasks,
  mockIoTSensors,
  mockTrainingLogs,
  mockVetSchedule,
} from '../mockData';
import type {
  ApiResponse,
  EcoDashboardPayload,
  EcoMetrics,
  EcoRecommendation,
  FeedingPeriod,
  FeedingPlan,
  FeedingPlanUpsertInput,
  HygieneTask,
  IoTAlertLogItem,
  IoTSensorData,
  IoTStreamSnapshot,
  StaffHorseNote,
  StaffHorseNoteInput,
  TrainingLoadLevel,
  TrainingLog,
  TrainingLogInput,
  VetScheduleInput,
  VetScheduleItem,
  WasteToGreenLog,
  WasteToGreenLogInput,
} from '../types';
import { mockRequest } from './apiClient';

const FEEDING_STATE_KEY = 'smart_green_ahalteke_feeding_state_v1';
const FEEDING_PLANS_CUSTOM_KEY = 'smart_green_ahalteke_feeding_plans_v1';
const HYGIENE_STATE_KEY = 'smart_green_ahalteke_hygiene_state_v1';
const HYGIENE_CONFIRM_KEY = 'smart_green_ahalteke_hygiene_confirm_v2';
const TRAINING_LOGS_KEY = 'smart_green_ahalteke_training_logs_v1';
const VET_SCHEDULE_KEY = 'smart_green_ahalteke_vet_schedule_v1';
const WASTE_LOGS_KEY = 'smart_green_ahalteke_waste_logs_v1';
const HORSE_NOTES_KEY = 'smart_green_ahalteke_staff_horse_notes_v1';
const IOT_ALERT_LOGS_KEY = 'smart_green_ahalteke_iot_alert_logs_v1';

function readBooleanMap(key: string): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const clean: Record<string, boolean> = {};
    Object.entries(parsed as Record<string, unknown>).forEach(([k, v]) => {
      if (typeof v === 'boolean') clean[k] = v;
    });
    return clean;
  } catch {
    return {};
  }
}

function writeBooleanMap(key: string, map: Record<string, boolean>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

function readStoredTrainingLogs(): TrainingLog[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(TRAINING_LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is TrainingLog =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.horseId === 'string' &&
        typeof item.durationMinutes === 'number'
    );
  } catch {
    return [];
  }
}

export async function fetchIoTSensors(horseId?: string): Promise<ApiResponse<IoTSensorData[]>> {
  return mockRequest(() =>
    horseId ? mockIoTSensors.filter((sensor) => sensor.horseId === horseId) : [...mockIoTSensors]
  );
}

// TODO: [BACKEND_API] WSS /ws/v1/stables/:id/iot-stream — Athananyň we saýlanan bedewiň real-wagt IoT datçik akymy (her 3–5 sekuntda täzelenýär).
export function createIoTSnapshot(
  stableId: string,
  horseId: string,
  isAlertMode: boolean
): IoTStreamSnapshot {
  const base =
    mockIoTSensors.find((s) => s.horseId === horseId) ??
    mockIoTSensors.find((s) => s.stableId === stableId) ??
    mockIoTSensors[0];

  const jitter = (range: number) => (Math.random() * 2 - 1) * range;
  const round1 = (val: number) => Math.round(val * 10) / 10;

  let stableTempC = round1(base.stableTempC + jitter(0.7));
  let stableHumidityPercent = Math.round(
    Math.min(62, Math.max(38, base.stableHumidityPercent + jitter(3)))
  );
  let ammoniaPpm = round1(Math.max(1.8, base.ammoniaPpm + jitter(0.9)));
  let waterLevelPercent = Math.round(
    Math.min(98, Math.max(60, base.waterLevelPercent + jitter(2.5)))
  );
  let solarPowerKw = round1(Math.max(12.5, Math.min(34.0, 24.6 + jitter(2.1))));
  let heartRateBpm = Math.round(Math.max(28, base.heartRateBpm + jitter(3)));
  let bodyTemperatureC = round1(Math.max(37.4, base.bodyTemperatureC + jitter(0.15)));

  const activityCycle: IoTSensorData['activityLevel'][] = [
    'dynç',
    'ýöriş',
    'türgenleşik',
    'ýöriş',
  ];
  let activityLevel = base.activityLevel;

  if (isAlertMode) {
    stableTempC = round1(29.8 + Math.random() * 1.6);
    stableHumidityPercent = Math.round(74 + Math.random() * 6);
    ammoniaPpm = round1(14.2 + Math.random() * 2.8);
    waterLevelPercent = Math.round(18 + Math.random() * 6);
    solarPowerKw = round1(7.4 + Math.random() * 2.2);
    heartRateBpm = Math.round(58 + Math.random() * 9);
    bodyTemperatureC = round1(39.1 + Math.random() * 0.4);
    activityLevel = 'çapyşyk';
  } else if (Math.random() > 0.72) {
    activityLevel = activityCycle[Math.floor(Math.random() * activityCycle.length)];
  }

  const alerts: string[] = [];
  if (stableTempC > 26.5) {
    alerts.push(`Athana temperaturasy kadadan ýokary (${stableTempC.toFixed(1)} °C > 26.5 °C).`);
  }
  if (stableHumidityPercent > 68) {
    alerts.push(`Çyglylyk derejesi ýokarlandy (${stableHumidityPercent}% > 68%).`);
  }
  if (ammoniaPpm > 10) {
    alerts.push(`Ammiak (NH₃) derejesi howply çäkde (${ammoniaPpm.toFixed(1)} ppm > 10 ppm).`);
  }
  if (waterLevelPercent < 30) {
    alerts.push(`Suw howdanynyň derejesi pes (${waterLevelPercent}% < 30%).`);
  }
  if (solarPowerKw < 10) {
    alerts.push(`Gün paneli kuwwaty peseldi (${solarPowerKw.toFixed(1)} kWt < 10 kWt).`);
  }
  if (heartRateBpm > 52) {
    alerts.push(`Saýlanan bedewiň ýürek urşy ýokary (${heartRateBpm} ur/min > 52 ur/min).`);
  }
  if (bodyTemperatureC > 38.6) {
    alerts.push(`Bedewiň beden gyzgyny ýokarlandy (${bodyTemperatureC.toFixed(1)} °C > 38.6 °C).`);
  }

  return {
    stableId,
    horseId,
    timestamp: new Date().toISOString(),
    stableTempC,
    stableHumidityPercent,
    ammoniaPpm,
    waterLevelPercent,
    solarPowerKw,
    heartRateBpm,
    bodyTemperatureC,
    activityLevel,
    dailySteps: base.dailySteps + Math.floor(Math.random() * 45),
    batteryPercent: base.batteryPercent,
    isAlertMode,
    alerts,
  };
}

// TODO: [BACKEND_API] WSS /ws/v1/stables/:id/iot-stream — Real-wagt IoT akymyna ýazylyşygy açmak (her 3 sekuntda täzelenme).
export function subscribeStableIoTStream(
  stableId: string,
  horseId: string,
  isAlertMode: boolean,
  onTick: (snapshot: IoTStreamSnapshot) => void,
  intervalMs = 3000
): () => void {
  onTick(createIoTSnapshot(stableId, horseId, isAlertMode));
  const timerId = window.setInterval(() => {
    onTick(createIoTSnapshot(stableId, horseId, isAlertMode));
  }, intervalMs);

  return () => {
    window.clearInterval(timerId);
  };
}

function readStoredFeedingPlans(): FeedingPlan[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(FEEDING_PLANS_CUSTOM_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const valid = parsed.filter(
      (item): item is FeedingPlan =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.horseId === 'string' &&
        typeof item.quantityKg === 'number'
    );
    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}

function writeStoredFeedingPlans(plans: FeedingPlan[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FEEDING_PLANS_CUSTOM_KEY, JSON.stringify(plans));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

/** Ahalteke bedewiniň boýuna we ýaşyna görä takmynan agramyny (kg) kesgitleýär */
export function estimateHorseWeightKg(heightCm: number, ageYears: number): number {
  const base = Math.round(415 + Math.max(0, heightCm - 150) * 5.2 + Math.min(ageYears, 8) * 3.2);
  return Math.min(540, Math.max(380, base));
}

/** Bedewiň agramyna we türgenleşik ýüküne görä maslahat berilýän günlük hem nahar ot-iým mukdaryny hasaplaýar */
export function calculateRecommendedFeedingKg(
  weightKg: number,
  load: TrainingLoadLevel,
  period: FeedingPeriod
): { dailyKg: number; mealKg: number; recommendedWaterL: number } {
  const safeWeight = Math.min(700, Math.max(250, Number.isFinite(weightKg) ? weightKg : 465));
  const dailyRate = load === 'ýokary' ? 0.026 : load === 'orta' ? 0.023 : 0.02;
  const periodShare = period === 'günortan' ? 0.3 : 0.35;
  const dailyKg = Math.round(safeWeight * dailyRate * 10) / 10;
  const mealKg = Math.round(dailyKg * periodShare * 10) / 10;
  const waterRate = load === 'ýokary' ? 0.095 : load === 'orta' ? 0.085 : 0.075;
  const recommendedWaterL = Math.max(8, Math.round((safeWeight * waterRate) / 3));
  return { dailyKg, mealKg, recommendedWaterL };
}

/** Takyk ölçegli rasion arkaly adaty isripli berlişe garanyňda tygşytlanýan kilogramy hasaplaýar */
export function calculateSavedForageKg(
  quantityKg: number,
  recommendedMealKg: number,
  organicCertified: boolean
): number {
  const safeQty = Math.max(0.2, Number.isFinite(quantityKg) ? quantityKg : 3.5);
  const diffRatio =
    recommendedMealKg > 0 ? Math.abs(safeQty - recommendedMealKg) / recommendedMealKg : 0;
  const precisionRate = diffRatio <= 0.12 ? 0.175 : diffRatio <= 0.25 ? 0.145 : 0.11;
  const organicBonus = organicCertified ? 0.05 : 0;
  const saved = safeQty * precisionRate + organicBonus;
  return Math.max(0.15, Math.round(saved * 100) / 100);
}

function getMergedFeedingPlans(): FeedingPlan[] {
  const overrides = readBooleanMap(FEEDING_STATE_KEY);
  const baseList = readStoredFeedingPlans() ?? mockFeedingPlans.map((p) => ({ ...p }));
  return baseList.map((plan) =>
    typeof overrides[plan.id] === 'boolean'
      ? { ...plan, completedToday: overrides[plan.id] }
      : { ...plan }
  );
}

// TODO: [BACKEND_API] GET /api/v1/feeding-plans?horseId=:id — Gündelik isripsiz iýmitlendiriş meýilnamasyny almak.
export async function fetchFeedingPlans(horseId?: string): Promise<ApiResponse<FeedingPlan[]>> {
  return mockRequest(() => {
    const merged = getMergedFeedingPlans();
    return horseId ? merged.filter((plan) => plan.horseId === horseId) : merged;
  }, 120);
}

// TODO: [BACKEND_API] PATCH /api/v1/feeding-plans/:id/complete — Nahar tapgyrynyň ýerine ýetirilendigini bellemek.
export async function toggleFeedingPlanCompletion(
  planId: string,
  completed: boolean
): Promise<ApiResponse<{ planId: string; completedToday: boolean }>> {
  return mockRequest(() => {
    const current = readBooleanMap(FEEDING_STATE_KEY);
    current[planId] = completed;
    writeBooleanMap(FEEDING_STATE_KEY, current);

    const custom = readStoredFeedingPlans();
    if (custom) {
      writeStoredFeedingPlans(
        custom.map((plan) => (plan.id === planId ? { ...plan, completedToday: completed } : plan))
      );
    }
    return { planId, completedToday: completed };
  }, 100);
}

// TODO: [BACKEND_API] PUT /api/v1/stables/:id/feeding — Rasion meýilnamasyny täzelemek ýa-da goşmak hem-de isripçilikden tygşytlanan ot-iým mukdaryny (kg) hasaplamak.
export async function upsertFeedingPlan(
  stableId: string,
  input: FeedingPlanUpsertInput
): Promise<ApiResponse<FeedingPlan[]>> {
  void stableId;
  const mealName = input.mealName.trim().replace(/\s+/g, ' ').slice(0, 120);
  const forageType = input.forageType.trim().replace(/\s+/g, ' ').slice(0, 160);
  const notes = input.notes.trim().replace(/\s+/g, ' ').slice(0, 300);
  const quantityKg = Math.round(Number(input.quantityKg) * 10) / 10;
  const waterLiters = Math.round(Number(input.waterLiters));
  const horseWeightKg = Math.round(Number(input.horseWeightKg));

  if (!input.horseId) {
    throw new Error('Rasion üçin bedewi saýlaň.');
  }
  if (mealName.length < 2) {
    throw new Error('Naharyň ady azyndan 2 harpdan ybarat bolmaly.');
  }
  if (forageType.length < 2) {
    throw new Error('Ot-iým görnüşini giriziň.');
  }
  if (!Number.isFinite(horseWeightKg) || horseWeightKg < 250 || horseWeightKg > 700) {
    throw new Error('Bedewiň agramy 250–700 kg aralygynda bolmaly.');
  }
  if (!Number.isFinite(quantityKg) || quantityKg < 0.2 || quantityKg > 25) {
    throw new Error('Ot-iým mukdary 0.2–25 kg aralygynda bolmaly.');
  }
  if (!Number.isFinite(waterLiters) || waterLiters < 1 || waterLiters > 60) {
    throw new Error('Suw mukdary 1–60 L aralygynda bolmaly.');
  }

  const { mealKg } = calculateRecommendedFeedingKg(
    horseWeightKg,
    input.trainingLoad,
    input.mealPeriod
  );
  const savedForageKg = calculateSavedForageKg(quantityKg, mealKg, input.organicCertified);

  return mockRequest(() => {
    const currentList = getMergedFeedingPlans();
    const supplements = input.supplements
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8);

    let nextList: FeedingPlan[];
    if (input.id && currentList.some((item) => item.id === input.id)) {
      nextList = currentList.map((item) =>
        item.id === input.id
          ? {
              ...item,
              horseId: input.horseId,
              mealPeriod: input.mealPeriod,
              mealTime: input.mealTime || item.mealTime,
              mealName,
              forageType,
              quantityKg,
              savedForageKg,
              waterLiters,
              supplements: supplements.length > 0 ? supplements : ['Tebigy duz daşy'],
              organicCertified: input.organicCertified,
              notes: notes || 'Takyk dozator ölçegi bilen sazlandy.',
              horseWeightKg,
              trainingLoad: input.trainingLoad,
            }
          : item
      );
    } else {
      const created: FeedingPlan = {
        id: `feed-custom-${Date.now()}`,
        horseId: input.horseId,
        mealPeriod: input.mealPeriod,
        mealTime:
          input.mealTime ||
          (input.mealPeriod === 'irden'
            ? '06:30'
            : input.mealPeriod === 'günortan'
              ? '13:00'
              : '18:30'),
        mealName,
        forageType,
        quantityKg,
        savedForageKg,
        waterLiters,
        supplements: supplements.length > 0 ? supplements : ['Tebigy duz daşy'],
        organicCertified: input.organicCertified,
        completedToday: false,
        notes: notes || 'Takyk dozator ölçegi bilen goşuldy.',
        horseWeightKg,
        trainingLoad: input.trainingLoad,
      };
      nextList = [created, ...currentList];
    }

    writeStoredFeedingPlans(nextList);
    return nextList;
  }, 140);
}

// TODO: [BACKEND_API] GET /api/v1/training-logs?horseId=:id — Sport türgenleşik hasabatlaryny almak.
export async function fetchTrainingLogs(horseId?: string): Promise<ApiResponse<TrainingLog[]>> {
  return mockRequest(() => {
    const userLogs = readStoredTrainingLogs();
    const combined = [...userLogs, ...mockTrainingLogs];
    return horseId ? combined.filter((log) => log.horseId === horseId) : combined;
  }, 120);
}

// TODO: [BACKEND_API] POST /api/v1/stables/:id/logs — Täze sport türgenleşik ýazgysyny athananyň žurnalyna goşmak.
export async function createTrainingLog(
  input: TrainingLogInput,
  stableId?: string
): Promise<ApiResponse<TrainingLog>> {
  void stableId;
  const durationMinutes = Number(input.durationMinutes);
  const distanceKm = Number(input.distanceKm);
  const notes = input.notes.trim().replace(/\s+/g, ' ').slice(0, 400);

  if (!input.horseId) {
    throw new Error('Türgenleşik üçin bedewi saýlaň.');
  }
  if (!Number.isFinite(durationMinutes) || durationMinutes < 5 || durationMinutes > 240) {
    throw new Error('Türgenleşik wagty 5 bilen 240 minut aralygynda bolmaly.');
  }
  if (!Number.isFinite(distanceKm) || distanceKm <= 0 || distanceKm > 60) {
    throw new Error('Geçilen aralyk 0.5 bilen 60 km aralygynda bolmaly.');
  }
  if (notes.length < 5) {
    throw new Error('Seýis belligi azyndan 5 nyşandan ybarat bolmaly.');
  }

  return mockRequest(() => {
    const avgSpeedKmh = Math.round((distanceKm / (durationMinutes / 60)) * 10) / 10;
    const hrByLoad = { ýeňil: 108, orta: 132, ýokary: 162 };
    const recoveryByLoad = { ýeňil: 6, orta: 10, ýokary: 15 };

    const newLog: TrainingLog = {
      id: `trn-${Date.now().toString(36)}`,
      horseId: input.horseId,
      date: input.date || new Date().toISOString().slice(0, 10),
      trainerName: input.trainerName.trim() || 'Baş Seýis',
      sessionType: input.sessionType,
      durationMinutes,
      distanceKm: Math.round(distanceKm * 10) / 10,
      loadLevel: input.loadLevel,
      avgSpeedKmh,
      maxHeartRateBpm: hrByLoad[input.loadLevel],
      recoveryMinutes: recoveryByLoad[input.loadLevel],
      notes,
    };

    const existing = readStoredTrainingLogs();
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(TRAINING_LOGS_KEY, JSON.stringify([newLog, ...existing]));
      } catch {
        // Ignore quota errors
      }
    }

    return newLog;
  }, 180);
}

interface HygieneConfirmEntry {
  completedToday: boolean;
  confirmedBy?: string;
  confirmedAt?: string;
}

function readStoredVetSchedule(): VetScheduleItem[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(VET_SCHEDULE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const valid = parsed.filter(
      (item): item is VetScheduleItem =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        typeof item.horseId === 'string'
    );
    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}

function writeStoredVetSchedule(items: VetScheduleItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(VET_SCHEDULE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

function readHygieneConfirmMap(): Record<string, HygieneConfirmEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(HYGIENE_CONFIRM_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const clean: Record<string, HygieneConfirmEntry> = {};
    Object.entries(parsed as Record<string, unknown>).forEach(([k, v]) => {
      if (v && typeof v === 'object' && typeof (v as HygieneConfirmEntry).completedToday === 'boolean') {
        const entry = v as HygieneConfirmEntry;
        clean[k] = {
          completedToday: entry.completedToday,
          confirmedBy: typeof entry.confirmedBy === 'string' ? entry.confirmedBy : undefined,
          confirmedAt: typeof entry.confirmedAt === 'string' ? entry.confirmedAt : undefined,
        };
      }
    });
    return clean;
  } catch {
    return {};
  }
}

function writeHygieneConfirmMap(map: Record<string, HygieneConfirmEntry>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HYGIENE_CONFIRM_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

function formatNowTimestamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

// TODO: [BACKEND_API] GET /api/v1/health/vet-schedule — Weterinar barlaglarynyň we waksina senenamasynyň sanawyny almak.
export async function fetchVetSchedule(): Promise<ApiResponse<VetScheduleItem[]>> {
  return mockRequest(() => {
    const stored = readStoredVetSchedule();
    return stored ? [...stored] : mockVetSchedule.map((item) => ({ ...item }));
  }, 120);
}

// TODO: [BACKEND_API] POST /api/v1/stables/:id/logs — Weterinar we waksina senenamasyna täze saglyk ýazgysyny goşmak.
export async function createVetScheduleItem(
  stableId: string,
  input: VetScheduleInput
): Promise<ApiResponse<VetScheduleItem>> {
  void stableId;
  const title = input.title.trim().replace(/\s+/g, ' ').slice(0, 140);
  const veterinarian = input.veterinarian.trim().replace(/\s+/g, ' ').slice(0, 100);
  const notes = input.notes.trim().replace(/\s+/g, ' ').slice(0, 400);

  if (!input.horseId) {
    throw new Error('Weterinar belligi üçin bedewi saýlaň.');
  }
  if (title.length < 3) {
    throw new Error('Barlag ýa-da waksina ady azyndan 3 harpdan ybarat bolmaly.');
  }
  if (!input.scheduledDate) {
    throw new Error('Senäni görkeziň.');
  }
  if (veterinarian.length < 3) {
    throw new Error('Weterinar lukmanyň adyny giriziň.');
  }
  if (notes.length < 4) {
    throw new Error('Gysgaça lukman belligini ýa-da görkezmesini ýazyň.');
  }

  return mockRequest(() => {
    const existing = readStoredVetSchedule() ?? mockVetSchedule.map((item) => ({ ...item }));
    const created: VetScheduleItem = {
      id: `vet-${Date.now().toString(36)}`,
      horseId: input.horseId,
      horseName: input.horseName,
      title,
      category: input.category,
      scheduledDate: input.scheduledDate,
      veterinarian,
      status: input.status,
      notes,
    };
    writeStoredVetSchedule([created, ...existing]);
    return created;
  }, 140);
}

// TODO: [BACKEND_API] POST /api/v1/stables/:id/logs — Weterinar barlagynyň ýagdaýyny täzelemek.
export async function updateVetScheduleStatus(
  stableId: string,
  recordId: string,
  status: VetScheduleItem['status']
): Promise<ApiResponse<VetScheduleItem[]>> {
  void stableId;
  return mockRequest(() => {
    const existing = readStoredVetSchedule() ?? mockVetSchedule.map((item) => ({ ...item }));
    const updated = existing.map((item) =>
      item.id === recordId ? { ...item, status } : item
    );
    writeStoredVetSchedule(updated);
    return updated;
  }, 110);
}

// TODO: [BACKEND_API] GET /api/v1/stables/hygiene — Athananyň gündelik arassaçylyk çek-listini almak.
export async function fetchHygieneTasks(): Promise<ApiResponse<HygieneTask[]>> {
  return mockRequest(() => {
    const legacyOverrides = readBooleanMap(HYGIENE_STATE_KEY);
    const confirmOverrides = readHygieneConfirmMap();
    return mockHygieneTasks.map((task) => {
      const confirm = confirmOverrides[task.id];
      if (confirm) {
        return {
          ...task,
          completedToday: confirm.completedToday,
          confirmedBy: confirm.completedToday ? confirm.confirmedBy : undefined,
          confirmedAt: confirm.completedToday ? confirm.confirmedAt : undefined,
        };
      }
      if (typeof legacyOverrides[task.id] === 'boolean') {
        const done = legacyOverrides[task.id];
        return {
          ...task,
          completedToday: done,
          confirmedBy: done ? task.confirmedBy : undefined,
          confirmedAt: done ? task.confirmedAt : undefined,
        };
      }
      return { ...task };
    });
  }, 120);
}

// TODO: [BACKEND_API] POST /api/v1/stables/:id/logs — Athananyň arassaçylyk çek-listini jogapkär işgäriň tassyklama wagty bilen ýazmak.
export async function toggleHygieneTaskCompletion(
  taskId: string,
  completed: boolean,
  confirmedBy?: string,
  stableId?: string
): Promise<
  ApiResponse<{
    taskId: string;
    completedToday: boolean;
    confirmedBy?: string;
    confirmedAt?: string;
  }>
> {
  void stableId;
  return mockRequest(() => {
    const legacy = readBooleanMap(HYGIENE_STATE_KEY);
    legacy[taskId] = completed;
    writeBooleanMap(HYGIENE_STATE_KEY, legacy);

    const confirmMap = readHygieneConfirmMap();
    const resolvedBy = completed ? confirmedBy?.trim() || 'Jogapkär Işgär' : undefined;
    const resolvedAt = completed ? formatNowTimestamp() : undefined;

    confirmMap[taskId] = {
      completedToday: completed,
      confirmedBy: resolvedBy,
      confirmedAt: resolvedAt,
    };
    writeHygieneConfirmMap(confirmMap);

    return {
      taskId,
      completedToday: completed,
      confirmedBy: resolvedBy,
      confirmedAt: resolvedAt,
    };
  }, 100);
}

// TODO: [BACKEND_API] GET /api/v1/eco-metrics — «Ýaşyl Athana» gün energiýasy, suw we CO2 görkezijilerini almak.
export async function fetchEcoMetrics(complexId?: string): Promise<ApiResponse<EcoMetrics[]>> {
  return mockRequest(() =>
    complexId ? mockEcoMetrics.filter((eco) => eco.complexId === complexId) : [...mockEcoMetrics]
  );
}

const ECO_RECOMMENDATIONS_KEY = 'smart_green_ahalteke_eco_recommendations_v1';

// TODO: [BACKEND_API] GET /api/v1/eco/dashboard?complexId=:id — «Ýaşyl Athana» Eco-Score (0–100), 4 KPI, hepdelik/aýlyk grafikler we AI Eko-Maslahatçy maglumatlaryny almak.
export async function fetchEcoDashboard(
  complexId?: string,
  stableLabel?: string
): Promise<ApiResponse<EcoDashboardPayload>> {
  return mockRequest(() => {
    const baseMetric =
      mockEcoMetrics.find((m) => m.complexId === complexId) ?? mockEcoMetrics[0];
    const appliedMap = readBooleanMap(ECO_RECOMMENDATIONS_KEY);
    const feedingOverrides = readBooleanMap(FEEDING_STATE_KEY);

    const completedMeals = mockFeedingPlans.filter((plan) =>
      typeof feedingOverrides[plan.id] === 'boolean'
        ? feedingOverrides[plan.id]
        : plan.completedToday
    );
    const dailyFeedSavedKg = completedMeals.reduce((sum, p) => sum + p.savedForageKg, 0);
    const monthlyFeedSavedKg = Math.round(580 + dailyFeedSavedKg * 6);

    const recommendations = mockEcoRecommendations.map((rec) => ({
      ...rec,
      applied: typeof appliedMap[rec.id] === 'boolean' ? appliedMap[rec.id] : rec.applied,
    }));

    const appliedBoost = recommendations
      .filter((r) => r.applied)
      .reduce((sum, r) => sum + r.scoreBoost, 0);

    const waterExtraLiters = recommendations.find((r) => r.id === 'eco-rec-01')?.applied ? 420 : 0;
    const energyExtraKwh = recommendations.find((r) => r.id === 'eco-rec-02')?.applied ? 64 : 0;
    const wasteExtraKg = recommendations.find((r) => r.id === 'eco-rec-03')?.applied ? 135 : 0;

    const waterScore = Math.min(100, 88 + (waterExtraLiters > 0 ? 6 : 0));
    const energyScore = Math.min(100, baseMetric.solarSharePercent + 8 + (energyExtraKwh > 0 ? 4 : 0));
    const feedingScore = Math.min(100, Math.round(84 + (completedMeals.length / mockFeedingPlans.length) * 14));
    const wasteScore = Math.min(100, 90 + (wasteExtraKg > 0 ? 6 : 0));

    const baseEcoScore = Math.min(96, baseMetric.ecoRatingScore);
    const ecoScore = Math.min(100, baseEcoScore + appliedBoost);

    const certificationLabel =
      ecoScore >= 95
        ? 'Zümrüt-Altyn Ýaşyl Standart (A+)'
        : ecoScore >= 88
          ? 'Altyn Ýaşyl Standart (A)'
          : 'Kümüş Ýaşyl Standart (B+)';

    return {
      stableLabel: stableLabel ?? 'Athana №1 — «Altyn Ganat»',
      ecoScore,
      baseEcoScore,
      certificationLabel,
      scoreComponents: [
        {
          key: 'water',
          label: 'Suw tygşytlylygy',
          weightPercent: 25,
          score: waterScore,
          detail: 'Syzma datçikleri we awtomat damjalaýyn suwaryş',
        },
        {
          key: 'energy',
          label: 'Ýaşyl energiýa',
          weightPercent: 30,
          score: energyScore,
          detail: 'Gün panelleri we hereket/ýagtylyk LED ulgamy',
        },
        {
          key: 'feeding',
          label: 'Isripsiz iýmitlendiriş',
          weightPercent: 25,
          score: feedingScore,
          detail: 'Takyk ölçeglenen 3 wagtlyk organiki rasion',
        },
        {
          key: 'waste',
          label: 'Waste-to-Green',
          weightPercent: 20,
          score: wasteScore,
          detail: 'Organiki galyndydan bio-dökün we biogaz öndürmek',
        },
      ],
      kpis: {
        waterSavedLiters: baseMetric.waterSavedLiters + waterExtraLiters,
        waterSavedPercent: Math.min(96, baseMetric.waterRecycledPercent + (waterExtraLiters > 0 ? 4 : 0)),
        solarEnergyKwh: baseMetric.solarEnergyGeneratedKwh + energyExtraKwh,
        solarSharePercent: Math.min(98, baseMetric.solarSharePercent + (energyExtraKwh > 0 ? 3 : 0)),
        feedSavedKg: monthlyFeedSavedKg,
        feedSavedPercent: 18,
        wasteToGreenKg: baseMetric.compostProducedKg + wasteExtraKg,
        biogasM3: Math.round((baseMetric.compostProducedKg + wasteExtraKg) * 0.14),
        co2ReducedKg: baseMetric.co2ReducedKg + (appliedBoost * 180),
      },
      weeklySeries: [...mockEcoWeeklySeries],
      monthlySeries: [...mockEcoMonthlySeries],
      recommendations,
    };
  }, 140);
}

// TODO: [BACKEND_API] POST /api/v1/eco/ai-recommendations/:id/apply — AI Eko-Maslahatçynyň maslahatyny ýerine ýetirilen hökmünde bellemek.
export async function toggleEcoRecommendationApplied(
  recommendationId: string,
  applied: boolean
): Promise<ApiResponse<{ recommendationId: string; applied: boolean }>> {
  return mockRequest(() => {
    const current = readBooleanMap(ECO_RECOMMENDATIONS_KEY);
    current[recommendationId] = applied;
    writeBooleanMap(ECO_RECOMMENDATIONS_KEY, current);
    return { recommendationId, applied };
  }, 110);
}

// TODO: [BACKEND_API] GET /api/v1/stables/:id/eco-dashboard — Eko-Maslahatçy sanawyny we ýerine ýetiriliş ýagdaýyny almak.
export async function fetchEcoRecommendations(): Promise<ApiResponse<EcoRecommendation[]>> {
  return mockRequest(() => {
    const appliedMap = readBooleanMap(ECO_RECOMMENDATIONS_KEY);
    return mockEcoRecommendations.map((rec) => ({
      ...rec,
      applied: typeof appliedMap[rec.id] === 'boolean' ? appliedMap[rec.id] : rec.applied,
    }));
  }, 90);
}

const SEED_WASTE_TO_GREEN_LOGS: WasteToGreenLog[] = [
  {
    id: 'wst-seed-01',
    stableId: 'stb-01',
    date: '2026-11-24',
    organicWasteKg: 185,
    compostKg: 126,
    biogasM3: 26,
    destination: 'oba_hojalyk',
    recordedBy: 'Eko-Inžener Baýramgeldi Ataýew',
    notes: 'Bokslardan ýygnalan organiki saman we ders bio-kompost kamerasyna geçirildi.',
  },
  {
    id: 'wst-seed-02',
    stableId: 'stb-01',
    date: '2026-11-23',
    organicWasteKg: 170,
    compostKg: 116,
    biogasM3: 24,
    destination: 'ýyladyşhana',
    recordedBy: 'Halypa seýis Merdan Berdiýew',
    notes: 'Taýýarlanan organiki dökün ýorunja meýdany we ýyladyşhana üçin ugradyldy.',
  },
  {
    id: 'wst-seed-03',
    stableId: 'stb-01',
    date: '2026-11-21',
    organicWasteKg: 210,
    compostKg: 142,
    biogasM3: 30,
    destination: 'biogaz_stansiýasy',
    recordedBy: 'Eko-Inžener Baýramgeldi Ataýew',
    notes: 'Biogaz reaktoryndan alnan energiýa gijeki suw gyzdyryş ulgamyna berildi.',
  },
  {
    id: 'wst-seed-04',
    stableId: 'stb-01',
    date: '2026-11-19',
    organicWasteKg: 160,
    compostKg: 109,
    biogasM3: 22,
    destination: 'oba_hojalyk',
    recordedBy: 'Halypa seýis Merdan Berdiýew',
    notes: 'Nol zyňyndy (Zero-Waste) hepdelik hasabaty doly ýapyldy.',
  },
];

function readStoredWasteLogs(): WasteToGreenLog[] {
  if (typeof window === 'undefined') return [...SEED_WASTE_TO_GREEN_LOGS];
  try {
    const raw = window.localStorage.getItem(WASTE_LOGS_KEY);
    if (!raw) return [...SEED_WASTE_TO_GREEN_LOGS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...SEED_WASTE_TO_GREEN_LOGS];
    const valid = parsed.filter(
      (item): item is WasteToGreenLog =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.compostKg === 'number'
    );
    return valid.length > 0 ? valid : [...SEED_WASTE_TO_GREEN_LOGS];
  } catch {
    return [...SEED_WASTE_TO_GREEN_LOGS];
  }
}

function writeStoredWasteLogs(logs: WasteToGreenLog[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(WASTE_LOGS_KEY, JSON.stringify(logs.slice(0, 60)));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

// TODO: [BACKEND_API] GET /api/v1/stables/:id/eco/waste-logs — Organiki galyndydan bio-dökün we biogaz hasabatlaryny almak.
export async function fetchWasteToGreenLogs(): Promise<ApiResponse<WasteToGreenLog[]>> {
  return mockRequest(() => readStoredWasteLogs(), 90);
}

// TODO: [BACKEND_API] POST /api/v1/stables/:id/eco/waste-logs — Täze Waste-to-Green gündelik hasabatyny goşmak.
export async function createWasteToGreenLog(
  stableId: string,
  input: WasteToGreenLogInput
): Promise<ApiResponse<WasteToGreenLog>> {
  const organicWasteKg = Math.round(Number(input.organicWasteKg));
  const compostKg = Math.round(Number(input.compostKg));
  const biogasM3 = Math.round(Number(input.biogasM3) * 10) / 10;
  const notes = input.notes.trim().replace(/\s+/g, ' ').slice(0, 320);

  if (!input.date) {
    throw new Error('Hasabat senesini görkeziň.');
  }
  if (!Number.isFinite(organicWasteKg) || organicWasteKg < 5 || organicWasteKg > 5000) {
    throw new Error('Organiki galyndy mukdary 5–5000 kg aralygynda bolmaly.');
  }
  if (!Number.isFinite(compostKg) || compostKg < 1 || compostKg > 4000) {
    throw new Error('Bio-dökün mukdary 1–4000 kg aralygynda bolmaly.');
  }
  if (!Number.isFinite(biogasM3) || biogasM3 < 0 || biogasM3 > 600) {
    throw new Error('Biogaz mukdary 0–600 m³ aralygynda bolmaly.');
  }
  if (notes.length < 4) {
    throw new Error('Gysgaça hasabat belligini ýazyň.');
  }

  return mockRequest(() => {
    const created: WasteToGreenLog = {
      id: `wst-${Date.now().toString(36)}`,
      stableId: stableId || 'stb-01',
      date: input.date,
      organicWasteKg,
      compostKg,
      biogasM3,
      destination: input.destination,
      recordedBy: input.recordedBy.trim() || 'Jogapkär Işgär',
      notes,
    };
    const next = [created, ...readStoredWasteLogs()];
    writeStoredWasteLogs(next);
    return created;
  }, 130);
}

export interface DynamicEcoInputs {
  complexId?: string;
  stableLabel?: string;
  ecoMetrics: EcoMetrics[];
  feedingPlans: FeedingPlan[];
  hygieneTasks: HygieneTask[];
  iotAlertLogs: IoTAlertLogItem[];
  wasteLogs: WasteToGreenLog[];
  recommendations: EcoRecommendation[];
}

/**
 * IoT duýduryşlary, /staff/feeding isripsiz rasion, /staff/health-training arassaçylyk
 * çek-listi, Waste-to-Green ýazgylary we Eko-Maslahatçy ädimleri esasynda Eco-Score (0–100)
 * bahasyny real wagtda dinamiki hasaplaýar (hem /staff/green-eco, hem /staff/overview üçin).
 */
export function computeDynamicEcoDashboard(inputs: DynamicEcoInputs): EcoDashboardPayload {
  const {
    complexId,
    stableLabel,
    ecoMetrics,
    feedingPlans,
    hygieneTasks,
    iotAlertLogs,
    wasteLogs,
    recommendations,
  } = inputs;

  const baseMetric =
    ecoMetrics.find((m) => m.complexId === complexId) ?? ecoMetrics[0] ?? mockEcoMetrics[0];

  const activeRecs = recommendations.length > 0 ? recommendations : mockEcoRecommendations;
  const waterExtraLiters = activeRecs.find((r) => r.id === 'eco-rec-01')?.applied ? 420 : 0;
  const energyExtraKwh = activeRecs.find((r) => r.id === 'eco-rec-02')?.applied ? 64 : 0;
  const wasteRecExtraKg = activeRecs.find((r) => r.id === 'eco-rec-03')?.applied ? 135 : 0;

  // 1. IoT we Suw tygşytlylygy (25%)
  const unresolvedIoTCount = iotAlertLogs.filter((a) => !a.resolved).length;
  const iotPenalty = Math.min(18, unresolvedIoTCount * 5);
  const waterSavedPercent = Math.min(
    98,
    baseMetric.waterRecycledPercent + (waterExtraLiters > 0 ? 4 : 0)
  );
  const waterScore = Math.max(
    55,
    Math.min(100, Math.round(waterSavedPercent + 7 + (waterExtraLiters > 0 ? 4 : 0) - iotPenalty))
  );

  // 2. Ýaşyl energiýa (25%)
  const solarSharePercent = Math.min(
    98,
    baseMetric.solarSharePercent + (energyExtraKwh > 0 ? 3 : 0)
  );
  const energyScore = Math.max(
    55,
    Math.min(100, Math.round(solarSharePercent + 8 + (energyExtraKwh > 0 ? 4 : 0)))
  );

  // 3. Isripsiz iýmitlendiriş — /staff/feeding bilen göni bagly (25%)
  const totalPlans = Math.max(1, feedingPlans.length);
  const completedPlans = feedingPlans.filter((p) => p.completedToday);
  const feedingCompletionRatio = completedPlans.length / totalPlans;
  const totalSavedTodayKg = feedingPlans.reduce((sum, p) => sum + (p.savedForageKg || 0), 0);
  const completedSavedTodayKg = completedPlans.reduce((sum, p) => sum + (p.savedForageKg || 0), 0);
  const monthlyFeedSavedKg = Math.round(480 + totalSavedTodayKg * 16 + completedSavedTodayKg * 10);
  const feedSavedPercent = Math.min(
    28,
    Math.max(10, Math.round(13 + feedingCompletionRatio * 8 + Math.min(4, totalSavedTodayKg * 0.4)))
  );
  const feedingScore = Math.max(
    55,
    Math.min(100, Math.round(74 + feedingCompletionRatio * 20 + Math.min(6, totalSavedTodayKg * 0.8)))
  );

  // 4. Waste-to-Green we Arassaçylyk — /staff/health-training + Waste hasabatlary (25%)
  const totalHygiene = Math.max(1, hygieneTasks.length);
  const completedHygieneCount = hygieneTasks.filter((t) => t.completedToday).length;
  const hygieneRatio = completedHygieneCount / totalHygiene;

  const userAddedWasteLogs = wasteLogs.filter((l) => !l.id.startsWith('wst-seed-'));
  const addedCompostKg = userAddedWasteLogs.reduce((sum, l) => sum + l.compostKg, 0);
  const addedBiogasM3 = userAddedWasteLogs.reduce((sum, l) => sum + l.biogasM3, 0);

  const wasteToGreenKg = baseMetric.compostProducedKg + wasteRecExtraKg + addedCompostKg;
  const biogasM3 = Math.round(
    (baseMetric.compostProducedKg + wasteRecExtraKg) * 0.14 + addedBiogasM3
  );
  const wasteScore = Math.max(
    55,
    Math.min(
      100,
      Math.round(
        72 +
          hygieneRatio * 18 +
          (wasteRecExtraKg > 0 ? 5 : 0) +
          Math.min(6, userAddedWasteLogs.length * 3)
      )
    )
  );

  const ecoScore = Math.min(
    100,
    Math.max(0, Math.round((waterScore + energyScore + feedingScore + wasteScore) / 4))
  );

  const appliedBoost = activeRecs
    .filter((r) => r.applied)
    .reduce((sum, r) => sum + r.scoreBoost, 0);

  const co2ReducedKg =
    baseMetric.co2ReducedKg +
    appliedBoost * 180 +
    Math.round(addedCompostKg * 0.65) +
    Math.round(completedSavedTodayKg * 8);

  const certificationLabel =
    ecoScore >= 94
      ? 'Zümrüt-Altyn Ýaşyl Standart (A+)'
      : ecoScore >= 86
        ? 'Altyn Ýaşyl Standart (A)'
        : ecoScore >= 76
          ? 'Kümüş Ýaşyl Standart (B+)'
          : 'Gözegçilikde — Ekologik Ösüş (B)';

  // Soňky hepdelik we aýlyk nokatlary janly täzeläp görkezmek
  const weeklySeries = mockEcoWeeklySeries.map((pt, idx) =>
    idx === mockEcoWeeklySeries.length - 1
      ? {
          ...pt,
          waterSavedLiters: pt.waterSavedLiters + Math.round(waterExtraLiters * 0.25),
          solarEnergyKwh: pt.solarEnergyKwh + Math.round(energyExtraKwh * 0.25),
          feedSavedKg: Math.round(pt.feedSavedKg + completedSavedTodayKg),
          wasteToGreenKg: Math.round(pt.wasteToGreenKg + addedCompostKg + Math.round(wasteRecExtraKg * 0.2)),
          co2ReducedKg: Math.round(pt.co2ReducedKg + Math.round(addedCompostKg * 0.65)),
        }
      : { ...pt }
  );

  const monthlySeries = mockEcoMonthlySeries.map((pt, idx) =>
    idx === mockEcoMonthlySeries.length - 1
      ? {
          ...pt,
          waterSavedLiters: pt.waterSavedLiters + waterExtraLiters,
          solarEnergyKwh: pt.solarEnergyKwh + energyExtraKwh,
          feedSavedKg: monthlyFeedSavedKg,
          wasteToGreenKg,
          co2ReducedKg: pt.co2ReducedKg + appliedBoost * 180 + Math.round(addedCompostKg * 0.65),
        }
      : { ...pt }
  );

  return {
    stableLabel: stableLabel ?? 'Athana №1 — «Altyn Ganat»',
    ecoScore,
    baseEcoScore: Math.min(96, baseMetric.ecoRatingScore),
    certificationLabel,
    scoreComponents: [
      {
        key: 'water',
        label: 'Suw we IoT gözegçiligi',
        weightPercent: 25,
        score: waterScore,
        detail:
          unresolvedIoTCount > 0
            ? `${unresolvedIoTCount} çözülmedik IoT duýduryşy (-${iotPenalty} bal) · Syzma we damjalaýyn ulgam`
            : 'Ähli IoT datçikleri kadaly · Awtomat suwaryş we syzma goragy',
      },
      {
        key: 'energy',
        label: 'Ýaşyl energiýa',
        weightPercent: 25,
        score: energyScore,
        detail: `${solarSharePercent}% gün paneli paýy we akylly LED yşyklandyryş`,
      },
      {
        key: 'feeding',
        label: 'Isripsiz iýmitlendiriş',
        weightPercent: 25,
        score: feedingScore,
        detail: `${completedPlans.length}/${feedingPlans.length} rasion berildi · ${totalSavedTodayKg.toFixed(1)} kg gündelik tygşyt`,
      },
      {
        key: 'waste',
        label: 'Waste-to-Green we Arassaçylyk',
        weightPercent: 25,
        score: wasteScore,
        detail: `Arassaçylyk ${Math.round(hygieneRatio * 100)}% (${completedHygieneCount}/${hygieneTasks.length}) · ${wasteLogs.length} bio-dökün hasabaty`,
      },
    ],
    kpis: {
      waterSavedLiters: baseMetric.waterSavedLiters + waterExtraLiters,
      waterSavedPercent,
      solarEnergyKwh: baseMetric.solarEnergyGeneratedKwh + energyExtraKwh,
      solarSharePercent,
      feedSavedKg: monthlyFeedSavedKg,
      feedSavedPercent,
      wasteToGreenKg,
      biogasM3,
      co2ReducedKg,
    },
    weeklySeries,
    monthlySeries,
    recommendations: activeRecs,
  };
}

const SEED_HORSE_NOTES: StaffHorseNote[] = [
  {
    id: 'nt-seed-01',
    horseId: 'hrs-001',
    authorName: 'Halypa seýis Merdan Berdiýew',
    category: 'türgenleşik',
    note: 'Irki 1500 m ýeňil ýöriş üstünlikli tamamlandy, dikeldiliş ýürek urşy 7 minutda 38 bpm-e düşdi.',
    createdAt: '2026-11-24 08:15',
  },
  {
    id: 'nt-seed-02',
    horseId: 'hrs-003',
    authorName: 'Weterinar lukman Aýna Durdyýewa',
    category: 'saglyk',
    note: 'Güýçli türgenleşikden soň elektrolitli suw goşuldy, agşamky gyzgyn barlagy meýilleşdirildi.',
    createdAt: '2026-11-24 11:40',
  },
  {
    id: 'nt-seed-03',
    horseId: 'hrs-002',
    authorName: 'Baş seýis Döwletmyrat Saparow',
    category: 'ideg',
    note: 'Toýnak arassaçylygy we organiki ýorunja ölçegi kadaly ýerine ýetirildi.',
    createdAt: '2026-11-23 17:20',
  },
];

function readStoredHorseNotes(): StaffHorseNote[] {
  if (typeof window === 'undefined') return [...SEED_HORSE_NOTES];
  try {
    const raw = window.localStorage.getItem(HORSE_NOTES_KEY);
    if (!raw) return [...SEED_HORSE_NOTES];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...SEED_HORSE_NOTES];
    const valid = parsed.filter(
      (item): item is StaffHorseNote =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.horseId === 'string' &&
        typeof item.note === 'string'
    );
    return valid.length > 0 ? valid : [...SEED_HORSE_NOTES];
  } catch {
    return [...SEED_HORSE_NOTES];
  }
}

function writeStoredHorseNotes(notes: StaffHorseNote[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HORSE_NOTES_KEY, JSON.stringify(notes));
  } catch {
    // Ignore quota errors cleanly
  }
}

// TODO: [BACKEND_API] GET /api/v1/horses/notes — Işgär tarapyndan atlara goşulan gözegçilik we ideg belliklerini almak.
export async function fetchHorseNotes(): Promise<ApiResponse<StaffHorseNote[]>> {
  return mockRequest(() => readStoredHorseNotes(), 90);
}

// TODO: [BACKEND_API] POST /api/v1/horses/:id/notes — Belli bir bedew üçin täze işgär gözegçilik belligini goşmak.
export async function createHorseNote(
  input: StaffHorseNoteInput
): Promise<ApiResponse<StaffHorseNote>> {
  const noteText = input.note.trim().replace(/\s+/g, ' ').slice(0, 400);
  const authorName = input.authorName.trim() || 'Jogapkär Işgär';

  if (!input.horseId) {
    throw new Error('Bedewi saýlaň.');
  }
  if (noteText.length < 5) {
    throw new Error('Bellik azyndan 5 nyşan bolmaly.');
  }

  return mockRequest(() => {
    const now = new Date();
    const formatted = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
    const created: StaffHorseNote = {
      id: `nt-${Date.now().toString(36)}`,
      horseId: input.horseId,
      authorName,
      category: input.category,
      note: noteText,
      createdAt: formatted,
    };
    const next = [created, ...readStoredHorseNotes()];
    writeStoredHorseNotes(next);
    return created;
  }, 120);
}

const SEED_IOT_ALERT_LOGS: IoTAlertLogItem[] = [
  {
    id: 'alrt-seed-01',
    stableId: 'stb-01',
    horseId: 'hrs-003',
    sensorLabel: 'Suw derejesi (%)',
    severity: 'warning',
    message: '3-nji boksyň suw howdany 34%-e düşdi — agşamky iýmitlendirişden öň doldurylmaly.',
    recommendation: 'Awtomatiki suw klapanyny barlaň we süzülen ýagyş suwy ulgamyndan dolduryň.',
    measuredValue: '34%',
    createdAt: '2026-11-24 14:20',
    resolved: false,
  },
  {
    id: 'alrt-seed-02',
    stableId: 'stb-01',
    sensorLabel: 'Ammiak / Howa (NH₃)',
    severity: 'warning',
    message: 'Irki arassaçylykdan öň 2-nji ganatda NH₃ gysga wagtlaýyn 9.4 ppm-e ýetdi.',
    recommendation: 'Gün energiýaly wentilýasiýany 15 minut ýokary tizlige geçiriň we ýer düşegini täzeläň.',
    measuredValue: '9.4 ppm',
    createdAt: '2026-11-24 06:45',
    resolved: true,
    resolvedAt: '2026-11-24 07:05',
    resolvedBy: 'Halypa seýis Merdan Berdiýew',
  },
];

function readStoredIoTAlertLogs(): IoTAlertLogItem[] {
  if (typeof window === 'undefined') return [...SEED_IOT_ALERT_LOGS];
  try {
    const raw = window.localStorage.getItem(IOT_ALERT_LOGS_KEY);
    if (!raw) return [...SEED_IOT_ALERT_LOGS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...SEED_IOT_ALERT_LOGS];
    const valid = parsed.filter(
      (item): item is IoTAlertLogItem =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.message === 'string'
    );
    return valid.length > 0 ? valid : [...SEED_IOT_ALERT_LOGS];
  } catch {
    return [...SEED_IOT_ALERT_LOGS];
  }
}

function writeStoredIoTAlertLogs(logs: IoTAlertLogItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(IOT_ALERT_LOGS_KEY, JSON.stringify(logs.slice(0, 40)));
  } catch {
    // Ignore quota errors cleanly
  }
}

// TODO: [BACKEND_API] GET /api/v1/iot/alerts — Athananyň IoT duýduryş žurnalyny almak.
export async function fetchIoTAlertLogs(): Promise<ApiResponse<IoTAlertLogItem[]>> {
  return mockRequest(() => readStoredIoTAlertLogs(), 90);
}

// TODO: [BACKEND_API] POST /api/v1/iot/alerts — Täze IoT anomaliýa duýduryşlaryny žurnala ýazmak.
export async function saveIoTAlertLogs(
  newAlerts: IoTAlertLogItem[]
): Promise<ApiResponse<IoTAlertLogItem[]>> {
  return mockRequest(() => {
    const existing = readStoredIoTAlertLogs();
    const next = [...newAlerts, ...existing].slice(0, 40);
    writeStoredIoTAlertLogs(next);
    return next;
  }, 60);
}

// TODO: [BACKEND_API] PATCH /api/v1/iot/alerts/:id/resolve — IoT duýduryşyny «Çözüldi» diýip bellemek.
export async function resolveIoTAlertLog(
  alertId: string,
  resolvedBy: string
): Promise<ApiResponse<IoTAlertLogItem[]>> {
  return mockRequest(() => {
    const now = new Date();
    const resolvedAt = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
    const updated = readStoredIoTAlertLogs().map((item) =>
      item.id === alertId
        ? {
            ...item,
            resolved: true,
            resolvedAt,
            resolvedBy: resolvedBy || 'Jogapkär Işgär',
          }
        : item
    );
    writeStoredIoTAlertLogs(updated);
    return updated;
  }, 100);
}
