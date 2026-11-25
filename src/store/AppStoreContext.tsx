import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  createHorseNote,
  createStableAdmin,
  createTrainingLog,
  deleteBookAdmin,
  deleteCompetitionAdmin,
  deleteStaffAssignment,
  fetchAcademyApplications,
  fetchBooks,
  fetchCompetitionReminderIds,
  fetchCompetitions,
  fetchComplexes,
  fetchEcoMetrics,
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
  getStoredAuthSession,
  logoutSession,
  resolveIoTAlertLog,
  saveBookAdmin,
  saveCompetitionAdmin,
  saveIoTAlertLogs,
  saveStaffAssignment,
  submitAcademyApplication,
  toggleCompetitionReminder,
  toggleFeedingPlanCompletion,
  toggleHygieneTaskCompletion,
  updateAcademyApplicationStatusAdmin,
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
  EcoMetrics,
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
  VetScheduleItem,
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
  toggleHygieneComplete: (taskId: string, completed: boolean) => Promise<void>;
  addTrainingLog: (input: TrainingLogInput) => Promise<TrainingLog>;
  addHorseNote: (input: StaffHorseNoteInput) => Promise<StaffHorseNote>;
  appendIoTAlertLogs: (entries: IoTAlertLogItem[]) => Promise<IoTAlertLogItem[]>;
  resolveIoTAlert: (alertId: string, resolvedBy: string) => Promise<IoTAlertLogItem[]>;
  addStable: (input: StableCreateInput) => Promise<Stable>;
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

  const toggleHygieneComplete = useCallback(async (taskId: string, completed: boolean) => {
    await toggleHygieneTaskCompletion(taskId, completed);
    setHygieneTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, completedToday: completed } : task))
    );
  }, []);

  const addTrainingLog = useCallback(async (input: TrainingLogInput) => {
    const res = await createTrainingLog(input);
    setTrainingLogs((prev) => [res.data, ...prev]);
    return res.data;
  }, []);

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
      addHorseNote,
      appendIoTAlertLogs,
      resolveIoTAlert,
      addStable,
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
      addHorseNote,
      appendIoTAlertLogs,
      resolveIoTAlert,
      addStable,
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
