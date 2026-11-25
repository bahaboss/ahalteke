/**
 * Smart & Green Ahalteke — Esasy Domain TypeScript Görnüşleri
 *
 * Ähli görnüşler DOM-a garaşsyz bolup, geljekde React Native
 * goşundysy we REST/GraphQL backend bilen umumy şertnama hökmünde ulanylar.
 */

export type UserRole = 'guest' | 'user' | 'staff' | 'admin';

export type HorseHealthStatus = 'healthy' | 'monitoring' | 'attention';

export type HorseCoatColor = 'altyn_dor' | 'ak_gyr' | 'gara' | 'dor' | 'sary_gula';

export interface EquestrianComplex {
  id: string;
  name: string;
  region: string;
  address: string;
  totalStables: number;
  totalHorses: number;
  solarCapacityKw: number;
  ecoCertificationLevel: 'Altyn Ýaşyl' | 'Zümrüt Ýaşyl' | 'Kümüş Ýaşyl';
  coordinates: {
    lat: number;
    lng: number;
  };
  description: string;
}

export interface Stable {
  id: string;
  complexId: string;
  name: string;
  code: string;
  boxCount: number;
  occupiedBoxes: number;
  solarRoofEnabled: boolean;
  rainwaterHarvestingLiters: number;
  airQualityIndex: number; // 0-50: Örän arassa
  temperatureC: number;
  humidityPercent: number;
  headSeisName: string;
}

export interface Horse {
  id: string;
  qrCodeId: string;
  name: string;
  breed: string; // Meselem: "Arassa ganly Ahalteke"
  lineage: string; // Tohum şejeresi (Atasy × Enesi)
  coatColor: HorseCoatColor;
  coatLabel: string;
  ageYears: number;
  birthYear: number;
  gender: 'aýgyr' | 'baýtal' | 'taý';
  heightCm: number;
  healthStatus: HorseHealthStatus;
  healthSummary: string;
  /** Ýeňil animasiýaly awatar salgysy (SVG/GIF) */
  animatedAvatarUrl: string;
  /** Ýokary hilli portret suraty */
  portraitUrl: string;
  stableId: string;
  complexId: string;
  ownerName: string;
  seisName: string;
  achievements: string[];
  /** «Atlar dünýäsi» ekrany üçin gysgaça taryhy beýan */
  story?: string;
}

export interface IoTSensorData {
  id: string;
  horseId: string;
  stableId: string;
  timestamp: string;
  heartRateBpm: number; // Kadaly dynçlykda: 28-42
  bodyTemperatureC: number; // Kadaly: 37.5 - 38.3 °C
  activityLevel: 'dynç' | 'ýöriş' | 'türgenleşik' | 'çapyşyk';
  dailySteps: number;
  stableTempC: number;
  stableHumidityPercent: number;
  ammoniaPpm: number; // < 10 ppm kadaly
  waterLevelPercent: number; // > 35% kadaly
  batteryPercent: number;
  status: HorseHealthStatus;
}

export interface IoTStreamSnapshot {
  stableId: string;
  horseId: string;
  timestamp: string;
  stableTempC: number;
  stableHumidityPercent: number;
  ammoniaPpm: number;
  waterLevelPercent: number;
  solarPowerKw: number;
  heartRateBpm: number;
  bodyTemperatureC: number;
  activityLevel: IoTSensorData['activityLevel'];
  dailySteps: number;
  batteryPercent: number;
  isAlertMode: boolean;
  alerts: string[];
}

export type StaffHorseNoteCategory = 'saglyk' | 'ideg' | 'türgenleşik' | 'iýmit';

export interface StaffHorseNote {
  id: string;
  horseId: string;
  authorName: string;
  category: StaffHorseNoteCategory;
  note: string;
  createdAt: string;
}

export interface StaffHorseNoteInput {
  horseId: string;
  authorName: string;
  category: StaffHorseNoteCategory;
  note: string;
}

export interface IoTAlertLogItem {
  id: string;
  stableId: string;
  horseId?: string;
  sensorLabel: string;
  severity: 'warning' | 'critical';
  message: string;
  recommendation: string;
  measuredValue: string;
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type FeedingPeriod = 'irden' | 'günortan' | 'agşam';

export type TrainingLoadLevel = 'ýeňil' | 'orta' | 'ýokary';

export interface FeedingPlan {
  id: string;
  horseId: string;
  mealPeriod: FeedingPeriod;
  mealTime: string; // "06:30", "13:00", "18:30"
  mealName: string;
  forageType: string; // Ýorunja, arpa, süle
  quantityKg: number;
  savedForageKg: number; // Isripsiz ölçeg arkaly tygşytlanan ot-iým (kg)
  waterLiters: number;
  supplements: string[];
  organicCertified: boolean;
  completedToday: boolean;
  notes: string;
  horseWeightKg?: number;
  trainingLoad?: TrainingLoadLevel;
}

export interface FeedingPlanUpsertInput {
  id?: string;
  horseId: string;
  mealPeriod: FeedingPeriod;
  mealTime: string;
  mealName: string;
  forageType: string;
  quantityKg: number;
  waterLiters: number;
  supplements: string[];
  organicCertified: boolean;
  notes: string;
  horseWeightKg: number;
  trainingLoad: TrainingLoadLevel;
}

export interface TrainingLog {
  id: string;
  horseId: string;
  date: string;
  trainerName: string;
  sessionType: 'ýöriş' | 'çapyşyk' | 'gözellik_türgenleşigi' | 'dikeldiliş';
  durationMinutes: number;
  distanceKm: number;
  loadLevel: TrainingLoadLevel;
  avgSpeedKmh: number;
  maxHeartRateBpm: number;
  recoveryMinutes: number;
  notes: string;
}

export interface TrainingLogInput {
  horseId: string;
  date: string;
  trainerName: string;
  sessionType: TrainingLog['sessionType'];
  durationMinutes: number;
  distanceKm: number;
  loadLevel: TrainingLoadLevel;
  notes: string;
}

export interface VetScheduleItem {
  id: string;
  horseId: string;
  horseName: string;
  title: string;
  category: 'waksina' | 'barlag' | 'diş_idegi' | 'toýnak_idegi';
  scheduledDate: string;
  veterinarian: string;
  status: 'meýilleşdirilen' | 'ýakynlaşýar' | 'tamamlandy';
  notes: string;
}

export interface VetScheduleInput {
  horseId: string;
  horseName: string;
  title: string;
  category: VetScheduleItem['category'];
  scheduledDate: string;
  veterinarian: string;
  status: VetScheduleItem['status'];
  notes: string;
}

export interface HygieneTask {
  id: string;
  title: string;
  area: string;
  scheduledTime: string;
  responsibleRole: string;
  ecoNote: string;
  completedToday: boolean;
  confirmedBy?: string;
  confirmedAt?: string;
}

/** «Ýaşyl Athana» ekologik netijelilik görkezijileri */
export interface EcoMetrics {
  id: string;
  complexId: string;
  periodLabel: string;
  solarEnergyGeneratedKwh: number;
  solarSharePercent: number;
  waterSavedLiters: number;
  waterRecycledPercent: number;
  compostProducedKg: number;
  co2ReducedKg: number;
  ecoRatingScore: number; // 0-100
  greenBadges: string[];
}

export type EcoKpiKey = 'water' | 'energy' | 'feeding' | 'waste';

export interface EcoTimeSeriesPoint {
  label: string;
  waterSavedLiters: number;
  solarEnergyKwh: number;
  feedSavedKg: number;
  wasteToGreenKg: number;
  co2ReducedKg: number;
}

export interface EcoRecommendation {
  id: string;
  category: EcoKpiKey;
  title: string;
  description: string;
  sourceSignal: string;
  impactLabel: string;
  scoreBoost: number;
  applied: boolean;
}

export interface EcoScoreComponent {
  key: EcoKpiKey;
  label: string;
  weightPercent: number;
  score: number; // 0-100
  detail: string;
}

export interface EcoDashboardPayload {
  stableLabel: string;
  ecoScore: number; // 0-100
  baseEcoScore: number;
  certificationLabel: string;
  scoreComponents: EcoScoreComponent[];
  kpis: {
    waterSavedLiters: number;
    waterSavedPercent: number;
    solarEnergyKwh: number;
    solarSharePercent: number;
    feedSavedKg: number;
    feedSavedPercent: number;
    wasteToGreenKg: number;
    biogasM3: number;
    co2ReducedKg: number;
  };
  weeklySeries: EcoTimeSeriesPoint[];
  monthlySeries: EcoTimeSeriesPoint[];
  recommendations: EcoRecommendation[];
}

export type WasteDestination = 'oba_hojalyk' | 'ýyladyşhana' | 'biogaz_stansiýasy';

export interface WasteToGreenLog {
  id: string;
  stableId: string;
  date: string;
  organicWasteKg: number;
  compostKg: number;
  biogasM3: number;
  destination: WasteDestination;
  recordedBy: string;
  notes: string;
}

export interface WasteToGreenLogInput {
  date: string;
  organicWasteKg: number;
  compostKg: number;
  biogasM3: number;
  destination: WasteDestination;
  recordedBy: string;
  notes: string;
}

export interface Competition {
  id: string;
  title: string;
  category: 'çapyşyk' | 'gözellik' | 'marafon' | 'konkur';
  date: string;
  location: string;
  complexId: string;
  prizePoolLabel: string;
  status: 'öňde' | 'dowam_edýär' | 'tamamlandy';
  registeredHorseIds: string[];
  description: string;
}

export interface BookChapter {
  title: string;
  content: string;
}

export interface BookItem {
  id: string;
  title: string;
  author: string;
  publishYear: number;
  category: 'taryh' | 'seýisçilik' | 'weterinariýa' | 'ekologiýa';
  pages: number;
  language: 'Türkmençe' | 'Türkmençe / Iňlisçe';
  summary: string;
  availableFormats: ('PDF' | 'EPUB' | 'Audio')[];
  isFeatured: boolean;
  accentColor?: string;
  chapters?: BookChapter[];
  keyQuotes?: string[];
}

export interface AcademyApplication {
  id: string;
  applicantName: string;
  age: number;
  region: string;
  schoolName?: string;
  phone?: string;
  email?: string;
  programName: string;
  experienceLevel: 'başlangyç' | 'orta' | 'ýokary';
  submittedAt: string;
  status: 'garalýar' | 'tassyklandy' | 'söhbetdeşlik' | 'ret_edildi';
  preferredComplexId: string;
  motivationNote: string;
}

export interface AcademyApplicationInput {
  applicantName: string;
  age: number;
  region: string;
  schoolName?: string;
  phone?: string;
  email?: string;
  programName: string;
  experienceLevel: 'başlangyç' | 'orta' | 'ýokary';
  preferredComplexId: string;
  motivationNote: string;
}

export interface RoleDefinition {
  role: UserRole;
  titleTk: string;
  subtitleTk: string;
  availability: 'elýeterli' | 'geljekki_tapgyr';
  permissions: string[];
}

export interface ApiResponse<T> {
  data: T;
  timestamp: string;
  source: 'mock-service' | 'backend-api';
  latencyMs: number;
}

export type StaffPosition =
  | 'Baş Seýis / Seýis'
  | 'Weterinar lukman'
  | '«Ýaşyl Athana» Eko-Inžener';

export type AuthenticatedRole = Exclude<UserRole, 'guest'>;

/** Brauzeriň localStorage ýadynda saklanýan arassa (parolsyz) sessiýa profili */
export interface AuthSession {
  userId: string;
  fullName: string;
  emailOrPhone: string;
  role: AuthenticatedRole;
  region?: string;
  staffPosition?: StaffPosition;
  complexId?: string;
  complexName?: string;
  stableId?: string;
  stableName?: string;
  isDemo: boolean;
  loggedInAt: string;
}

export interface AuthUserLoginInput {
  emailOrPhone: string;
  password: string;
}

export interface AuthUserRegisterInput {
  fullName: string;
  region: string;
  emailOrPhone: string;
  password: string;
  confirmPassword: string;
}

export interface AuthStaffLoginInput {
  complexId: string;
  stableId: string;
  staffPosition: StaffPosition;
  staffIdentifier: string;
  password: string;
}

/** 7-nji ädim — Merkezi Admin Paneli domain görnüşleri */
export type AcademyApplicationStatus = AcademyApplication['status'];

export interface StaffAssignment {
  id: string;
  fullName: string;
  position: StaffPosition;
  emailOrPhone: string;
  complexId: string;
  stableId: string;
  status: 'işjeň' | 'dynç_alyşda';
  assignedAt: string;
}

export interface StaffAssignmentInput {
  id?: string;
  fullName: string;
  position: StaffPosition;
  emailOrPhone: string;
  complexId: string;
  stableId: string;
  status: 'işjeň' | 'dynç_alyşda';
}

export interface ComplexUpsertInput {
  id?: string;
  name: string;
  region: string;
  address: string;
  solarCapacityKw: number;
  ecoCertificationLevel: EquestrianComplex['ecoCertificationLevel'];
  description: string;
}

export interface StableCreateInput {
  id?: string;
  complexId: string;
  name: string;
  code: string;
  boxCount: number;
  occupiedBoxes: number;
  solarRoofEnabled: boolean;
  rainwaterHarvestingLiters: number;
  headSeisName: string;
}

export type StableUpsertInput = StableCreateInput;

export interface CompetitionUpsertInput {
  id?: string;
  title: string;
  category: Competition['category'];
  date: string;
  location: string;
  complexId: string;
  prizePoolLabel: string;
  status: Competition['status'];
  description: string;
}

export interface BookUpsertInput {
  id?: string;
  title: string;
  author: string;
  publishYear: number;
  category: BookItem['category'];
  pages: number;
  language: BookItem['language'];
  summary: string;
  availableFormats: BookItem['availableFormats'];
  isFeatured: boolean;
}

export interface StableEcoRankingItem {
  stableId: string;
  stableName: string;
  stableCode: string;
  complexId: string;
  complexName: string;
  region: string;
  headSeisName: string;
  occupiedBoxes: number;
  boxCount: number;
  solarRoofEnabled: boolean;
  ecoScore: number; // 0-100
  waterSavedLiters: number;
  solarEnergyKwh: number;
  airQualityIndex: number;
}

export interface ComplexEcoSummaryPoint {
  complexId: string;
  complexName: string;
  shortName: string;
  region: string;
  stableCount: number;
  horseCount: number;
  avgEcoScore: number;
  waterSavedLiters: number;
  solarEnergyKwh: number;
  certificationLevel: EquestrianComplex['ecoCertificationLevel'];
}

export interface AdminOverviewData {
  totals: {
    complexCount: number;
    stableCount: number;
    horseCount: number;
    staffCount: number;
    avgEcoScore: number;
    totalWaterSavedLiters: number;
    totalSolarEnergyKwh: number;
    pendingApplicationsCount: number;
  };
  stableRankings: StableEcoRankingItem[];
  complexSeries: ComplexEcoSummaryPoint[];
}


