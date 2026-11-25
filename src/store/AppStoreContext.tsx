import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createHorseNote,
  createStableAdmin,
  createTrainingLog,
  createVetScheduleItem,
  createWasteToGreenLog,
  deleteBookAdmin,
  deleteCompetitionAdmin,
  deleteStaffAssignment,
  fetchAcademyApplications,
  fetchBooks,
  fetchCompetitionReminderIds,
  fetchCompetitions,
  fetchComplexes,
  fetchEcoMetrics,
  fetchEcoRecommendations,
  fetchFeedingPlans,
  fetchHorseNotes,
  fetchHorses,
  fetchHygieneTasks,
  fetchIoTAlertLogs,
  fetchIoTSensors,
  fetchStables,
  fetchStaffAssignments,
  fetchTrainingLogs,
  fetchVetSchedule,
  fetchWasteToGreenLogs,
  getStoredAuthSession,
  logoutSession,
  resolveIoTAlertLog,
  saveBookAdmin,
  saveCompetitionAdmin,
  saveComplexAdmin,
  saveIoTAlertLogs,
  saveStableAdmin,
  saveStaffAssignment,
  submitAcademyApplication,
  toggleCompetitionReminder,
  toggleEcoRecommendationApplied,
  toggleFeedingPlanCompletion,
  toggleHygieneTaskCompletion,
  updateAcademyApplicationStatusAdmin,
  updateVetScheduleStatus,
  upsertFeedingPlan,
} from '../services';
import type {
  AcademyApplication,
  AcademyApplicationInput,
  AcademyApplicationStatus,
  AuthSession,
  BookItem,
  BookUpsertInput,
  Competition,
  CompetitionUpsertInput,
  ComplexUpsertInput,
  EcoMetrics,
  EcoRecommendation,
  EquestrianComplex,
  FeedingPlan,
  FeedingPlanUpsertInput,
  Horse,
  HygieneTask,
  IoTAlertLogItem,
  IoTSensorData,
  Stable,
  StableCreateInput,
  StaffAssignment,
  StaffAssignmentInput,
  StaffHorseNote,
  StaffHorseNoteInput,
  TrainingLog,
  TrainingLogInput,
  VetScheduleInput,
  VetScheduleItem,
  WasteToGreenLog,
  WasteToGreenLogInput,
} from '../types';

export interface AppStoreValue {
  // Auth & Session
  session: AuthSession | null;
  setSession: (next: AuthSession | null) => void;
  logout: () => Promise<void>;

  // Centralized Domain State
  isHydrating: boolean;
  complexes: EquestrianComplex[];
  stables: Stable[];
  horses: Horse[];
  iotTelemetry: IoTSensorData[];
  feedingPlans: FeedingPlan[];
  trainingLogs: TrainingLog[];
  vetSchedule: VetScheduleItem[];
  hygieneTasks: HygieneTask[];
  ecoMetrics: EcoMetrics[];
  ecoRecommendations: EcoRecommendation[];
  wasteToGreenLogs: WasteToGreenLog[];
  competitions: Competition[];
  competitionReminderIds: string[];
  books: BookItem[];
  academyApplications: AcademyApplication[];
  staffAssignments: StaffAssignment[];
  horseNotes: StaffHorseNote[];
  iotAlertLogs: IoTAlertLogItem[];

  // Store Actions (delegating to src/services/)
  refreshStore: () => Promise<void>;
  toggleReminder: (competitionId: string) => Promise<{ reminderIds: string[]; added: boolean }>;
  submitApplication: (input: AcademyApplicationInput) => Promise<AcademyApplication>;
  updateApplicationStatus: (
    applicationId: string,
    status: AcademyApplicationStatus
  ) => Promise<AcademyApplication[]>;
  toggleFeedingComplete: (planId: string, completed: boolean) => Promise<void>;
  saveFeedingPlan: (stableId: string, input: FeedingPlanUpsertInput) => Promise<FeedingPlan[]>;
  toggleHygieneComplete: (
    taskId: string,
    completed: boolean,
    confirmedBy?: string,
    stableId?: string
  ) => Promise<void>;
  addTrainingLog: (input: TrainingLogInput, stableId?: string) => Promise<TrainingLog>;
  addVetScheduleItem: (stableId: string, input: VetScheduleInput) => Promise<VetScheduleItem>;
  updateVetStatus: (
    stableId: string,
    recordId: string,
    status: VetScheduleItem['status']
  ) => Promise<VetScheduleItem[]>;
  addWasteToGreenLog: (
    stableId: string,
    input: WasteToGreenLogInput
  ) => Promise<WasteToGreenLog>;
  toggleEcoRecommendation: (recommendationId: string, applied: boolean) => Promise<void>;
  addHorseNote: (input: StaffHorseNoteInput) => Promise<StaffHorseNote>;
  appendIoTAlertLogs: (entries: IoTAlertLogItem[]) => Promise<IoTAlertLogItem[]>;
  resolveIoTAlert: (alertId: string, resolvedBy: string) => Promise<IoTAlertLogItem[]>;
  addStable: (input: StableCreateInput) => Promise<Stable>;
  upsertComplex: (input: ComplexUpsertInput) => Promise<EquestrianComplex[]>;
  upsertStable: (input: StableCreateInput) => Promise<Stable[]>;
  upsertStaffAssignment: (input: StaffAssignmentInput) => Promise<StaffAssignment[]>;
  removeStaffAssignment: (assignmentId: string) => Promise<StaffAssignment[]>;
  upsertCompetition: (input: CompetitionUpsertInput) => Promise<Competition[]>;
  removeCompetition: (competitionId: string) => Promise<Competition[]>;
  upsertBook: (input: BookUpsertInput) => Promise<BookItem[]>;
  removeBook: (bookId: string) => Promise<BookItem[]>;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

export const AppStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSessionState] = useState<AuthSession | null>(() => getStoredAuthSession());
  const [isHydrating, setIsHydrating] = useState(true);

  const [complexes, setComplexes] = useState<EquestrianComplex[]>([]);
  const [stables, setStables] = useState<Stable[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [iotTelemetry, setIotTelemetry] = useState<IoTSensorData[]>([]);
  const [feedingPlans, setFeedingPlans] = useState<FeedingPlan[]>([]);
  const [trainingLogs, setTrainingLogs] = useState<TrainingLog[]>([]);
  const [vetSchedule, setVetSchedule] = useState<VetScheduleItem[]>([]);
  const [hygieneTasks, setHygieneTasks] = useState<HygieneTask[]>([]);
  const [ecoMetrics, setEcoMetrics] = useState<EcoMetrics[]>([]);
  const [ecoRecommendations, setEcoRecommendations] = useState<EcoRecommendation[]>([]);
  const [wasteToGreenLogs, setWasteToGreenLogs] = useState<WasteToGreenLog[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [competitionReminderIds, setCompetitionReminderIds] = useState<string[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [academyApplications, setAcademyApplications] = useState<AcademyApplication[]>([]);
  const [staffAssignments, setStaffAssignments] = useState<StaffAssignment[]>([]);
  const [horseNotes, setHorseNotes] = useState<StaffHorseNote[]>([]);
  const [iotAlertLogs, setIotAlertLogs] = useState<IoTAlertLogItem[]>([]);

  const refreshStore = useCallback(async () => {
    setIsHydrating(true);
    try {
      const [
        complexRes,
        stableRes,
        horseRes,
        iotRes,
        feedingRes,
        trainingRes,
        vetRes,
        hygieneRes,
        ecoRes,
        ecoRecRes,
        wasteRes,
        compRes,
        reminderRes,
        bookRes,
        appRes,
        assignRes,
        notesRes,
        alertLogsRes,
      ] = await Promise.all([
        fetchComplexes(),
        fetchStables(),
        fetchHorses(),
        fetchIoTSensors(),
        fetchFeedingPlans(),
        fetchTrainingLogs(),
        fetchVetSchedule(),
        fetchHygieneTasks(),
        fetchEcoMetrics(),
        fetchEcoRecommendations(),
        fetchWasteToGreenLogs(),
        fetchCompetitions(),
        fetchCompetitionReminderIds(),
        fetchBooks(),
        fetchAcademyApplications(),
        fetchStaffAssignments(),
        fetchHorseNotes(),
        fetchIoTAlertLogs(),
      ]);

      setComplexes(complexRes.data);
      setStables(stableRes.data);
      setHorses(horseRes.data);
      setIotTelemetry(iotRes.data);
      setFeedingPlans(feedingRes.data);
      setTrainingLogs(trainingRes.data);
      setVetSchedule(vetRes.data);
      setHygieneTasks(hygieneRes.data);
      setEcoMetrics(ecoRes.data);
      setEcoRecommendations(ecoRecRes.data);
      setWasteToGreenLogs(wasteRes.data);
      setCompetitions(compRes.data);
      setCompetitionReminderIds(reminderRes.data);
      setBooks(bookRes.data);
      setAcademyApplications(appRes.data);
      setStaffAssignments(assignRes.data);
      setHorseNotes(notesRes.data);
      setIotAlertLogs(alertLogsRes.data);
    } finally {
      setIsHydrating(false);
    }
  }, []);

  useEffect(() => {
    refreshStore();
  }, [refreshStore]);

  const setSession = useCallback((next: AuthSession | null) => {
    setSessionState(next);
  }, []);

  const logout = useCallback(async () => {
    await logoutSession();
    setSessionState(null);
  }, []);

  const toggleReminder = useCallback(async (competitionId: string) => {
    const res = await toggleCompetitionReminder(competitionId);
    setCompetitionReminderIds(res.data.reminderIds);
    return res.data;
  }, []);

  const submitApplication = useCallback(async (input: AcademyApplicationInput) => {
    const res = await submitAcademyApplication(input);
    setAcademyApplications((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

  const updateApplicationStatus = useCallback(
    async (applicationId: string, status: AcademyApplicationStatus) => {
      const res = await updateAcademyApplicationStatusAdmin(applicationId, status);
      setAcademyApplications(res.data);
      return res.data;
    },
    []
  );

  const toggleFeedingComplete = useCallback(async (planId: string, completed: boolean) => {
    await toggleFeedingPlanCompletion(planId, completed);
    setFeedingPlans((prev) =>
      prev.map((plan) => (plan.id === planId ? { ...plan, completedToday: completed } : plan))
    );
  }, []);

  const saveFeedingPlan = useCallback(
    async (stableId: string, input: FeedingPlanUpsertInput) => {
      const res = await upsertFeedingPlan(stableId, input);
      setFeedingPlans(res.data);
      return res.data;
    },
    []
  );

  const toggleHygieneComplete = useCallback(
    async (taskId: string, completed: boolean, confirmedBy?: string, stableId?: string) => {
      const res = await toggleHygieneTaskCompletion(taskId, completed, confirmedBy, stableId);
      setHygieneTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                completedToday: res.data.completedToday,
                confirmedBy: res.data.confirmedBy,
                confirmedAt: res.data.confirmedAt,
              }
            : task
        )
      );
    },
    []
  );

  const addTrainingLog = useCallback(async (input: TrainingLogInput, stableId?: string) => {
    const res = await createTrainingLog(input, stableId);
    setTrainingLogs((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

  const addVetScheduleItem = useCallback(async (stableId: string, input: VetScheduleInput) => {
    const res = await createVetScheduleItem(stableId, input);
    setVetSchedule((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

  const updateVetStatus = useCallback(
    async (stableId: string, recordId: string, status: VetScheduleItem['status']) => {
      const res = await updateVetScheduleStatus(stableId, recordId, status);
      setVetSchedule(res.data);
      return res.data;
    },
    []
  );

  const addWasteToGreenLog = useCallback(
    async (stableId: string, input: WasteToGreenLogInput) => {
      const res = await createWasteToGreenLog(stableId, input);
      setWasteToGreenLogs((prev) => [res.data, ...prev]);
      return res.data;
    },
    []
  );

  const toggleEcoRecommendation = useCallback(
    async (recommendationId: string, applied: boolean) => {
      await toggleEcoRecommendationApplied(recommendationId, applied);
      setEcoRecommendations((prev) =>
        prev.map((rec) => (rec.id === recommendationId ? { ...rec, applied } : rec))
      );
    },
    []
  );

  const addHorseNote = useCallback(async (input: StaffHorseNoteInput) => {
    const res = await createHorseNote(input);
    setHorseNotes((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

  const appendIoTAlertLogs = useCallback(async (entries: IoTAlertLogItem[]) => {
    const res = await saveIoTAlertLogs(entries);
    setIotAlertLogs(res.data);
    return res.data;
  }, []);

  const resolveIoTAlert = useCallback(async (alertId: string, resolvedBy: string) => {
    const res = await resolveIoTAlertLog(alertId, resolvedBy);
    setIotAlertLogs(res.data);
    return res.data;
  }, []);

  const addStable = useCallback(async (input: StableCreateInput) => {
    const res = await createStableAdmin(input);
    const [cmpRes, stbRes] = await Promise.all([fetchComplexes(), fetchStables()]);
    setComplexes(cmpRes.data);
    setStables(stbRes.data);
    return res.data;
  }, []);

  const upsertComplex = useCallback(async (input: ComplexUpsertInput) => {
    const res = await saveComplexAdmin(input);
    setComplexes(res.data);
    return res.data;
  }, []);

  const upsertStable = useCallback(async (input: StableCreateInput) => {
    const res = await saveStableAdmin(input);
    const cmpRes = await fetchComplexes();
    setStables(res.data);
    setComplexes(cmpRes.data);
    return res.data;
  }, []);

  const upsertStaffAssignment = useCallback(async (input: StaffAssignmentInput) => {
    const res = await saveStaffAssignment(input);
    setStaffAssignments(res.data);
    return res.data;
  }, []);

  const removeStaffAssignment = useCallback(async (assignmentId: string) => {
    const res = await deleteStaffAssignment(assignmentId);
    setStaffAssignments(res.data);
    return res.data;
  }, []);

  const upsertCompetition = useCallback(async (input: CompetitionUpsertInput) => {
    const res = await saveCompetitionAdmin(input);
    setCompetitions(res.data);
    return res.data;
  }, []);

  const removeCompetition = useCallback(async (competitionId: string) => {
    const res = await deleteCompetitionAdmin(competitionId);
    setCompetitions(res.data);
    return res.data;
  }, []);

  const upsertBook = useCallback(async (input: BookUpsertInput) => {
    const res = await saveBookAdmin(input);
    setBooks(res.data);
    return res.data;
  }, []);

  const removeBook = useCallback(async (bookId: string) => {
    const res = await deleteBookAdmin(bookId);
    setBooks(res.data);
    return res.data;
  }, []);

  const value = useMemo<AppStoreValue>(
    () => ({
      session,
      setSession,
      logout,
      isHydrating,
      complexes,
      stables,
      horses,
      iotTelemetry,
      feedingPlans,
      trainingLogs,
      vetSchedule,
      hygieneTasks,
      ecoMetrics,
      ecoRecommendations,
      wasteToGreenLogs,
      competitions,
      competitionReminderIds,
      books,
      academyApplications,
      staffAssignments,
      horseNotes,
      iotAlertLogs,
      refreshStore,
      toggleReminder,
      submitApplication,
      updateApplicationStatus,
      toggleFeedingComplete,
      saveFeedingPlan,
      toggleHygieneComplete,
      addTrainingLog,
      addVetScheduleItem,
      updateVetStatus,
      addWasteToGreenLog,
      toggleEcoRecommendation,
      addHorseNote,
      appendIoTAlertLogs,
      resolveIoTAlert,
      addStable,
      upsertComplex,
      upsertStable,
      upsertStaffAssignment,
      removeStaffAssignment,
      upsertCompetition,
      removeCompetition,
      upsertBook,
      removeBook,
    }),
    [
      session,
      setSession,
      logout,
      isHydrating,
      complexes,
      stables,
      horses,
      iotTelemetry,
      feedingPlans,
      trainingLogs,
      vetSchedule,
      hygieneTasks,
      ecoMetrics,
      ecoRecommendations,
      wasteToGreenLogs,
      competitions,
      competitionReminderIds,
      books,
      academyApplications,
      staffAssignments,
      horseNotes,
      iotAlertLogs,
      refreshStore,
      toggleReminder,
      submitApplication,
      updateApplicationStatus,
      toggleFeedingComplete,
      saveFeedingPlan,
      toggleHygieneComplete,
      addTrainingLog,
      addVetScheduleItem,
      updateVetStatus,
      addWasteToGreenLog,
      toggleEcoRecommendation,
      addHorseNote,
      appendIoTAlertLogs,
      resolveIoTAlert,
      addStable,
      upsertComplex,
      upsertStable,
      upsertStaffAssignment,
      removeStaffAssignment,
      upsertCompetition,
      removeCompetition,
      upsertBook,
      removeBook,
    ]
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
};

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error('useAppStore diňe AppStoreProvider içinde ulanylmalydyr.');
  }
  return ctx;
}
