// TODO: [BACKEND_API] GET /api/v1/community — Bäsleşikler, milli atçylyk kitaphanasy we ýaş seýisler akademiýasy ýüz tutmalaryny dolandyrmak.

import { mockAcademyApplications, mockBooks, mockCompetitions } from '../mockData';
import type {
  AcademyApplication,
  AcademyApplicationInput,
  AcademyApplicationStatus,
  ApiResponse,
  BookItem,
  Competition,
} from '../types';
import { mockRequest } from './apiClient';

const REMINDERS_STORAGE_KEY = 'smart_green_ahalteke_competition_reminders_v1';
const ACADEMY_APPS_STORAGE_KEY = 'smart_green_ahalteke_academy_applications_v1';
const ADMIN_COMPETITIONS_STORAGE_KEY = 'smart_green_ahalteke_admin_competitions_v1';
const ADMIN_BOOKS_STORAGE_KEY = 'smart_green_ahalteke_admin_books_v1';
const ADMIN_APP_STATUSES_STORAGE_KEY = 'smart_green_ahalteke_admin_app_statuses_v1';

const VALID_APP_STATUSES: ReadonlySet<AcademyApplicationStatus> = new Set([
  'garalýar',
  'söhbetdeşlik',
  'tassyklandy',
  'ret_edildi',
]);

function readStoredStringArray(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function readStoredApplications(): AcademyApplication[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ACADEMY_APPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is AcademyApplication =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.applicantName === 'string' &&
        typeof item.programName === 'string'
    );
  } catch {
    return [];
  }
}

function readStoredStatusOverrides(): Record<string, AcademyApplicationStatus> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(ADMIN_APP_STATUSES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return {};
    const clean: Record<string, AcademyApplicationStatus> = {};
    for (const [id, status] of Object.entries(parsed)) {
      if (typeof status === 'string' && VALID_APP_STATUSES.has(status as AcademyApplicationStatus)) {
        clean[id] = status as AcademyApplicationStatus;
      }
    }
    return clean;
  } catch {
    return {};
  }
}

export function getAllCompetitionsSync(): Competition[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(ADMIN_COMPETITIONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item): item is Competition =>
              Boolean(item) && typeof item === 'object' && typeof item.id === 'string'
          );
        }
      }
    } catch {
      // Fallback to mock seed
    }
  }
  return [...mockCompetitions];
}

export function saveCompetitionsToStore(items: Competition[]): Competition[] {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(ADMIN_COMPETITIONS_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage quota fallback ignored cleanly
    }
  }
  return items;
}

export function getAllBooksSync(): BookItem[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(ADMIN_BOOKS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item): item is BookItem =>
              Boolean(item) && typeof item === 'object' && typeof item.id === 'string'
          );
        }
      }
    } catch {
      // Fallback to mock seed
    }
  }
  return [...mockBooks];
}

export function saveBooksToStore(items: BookItem[]): BookItem[] {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(ADMIN_BOOKS_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage quota fallback ignored cleanly
    }
  }
  return items;
}

export function getAllAcademyApplicationsSync(): AcademyApplication[] {
  const userSubmitted = readStoredApplications();
  const overrides = readStoredStatusOverrides();
  const merged = [...userSubmitted, ...mockAcademyApplications];
  return merged.map((app) =>
    overrides[app.id] ? { ...app, status: overrides[app.id] } : app
  );
}

export function updateAcademyApplicationStatusInStore(
  applicationId: string,
  status: AcademyApplicationStatus
): AcademyApplication[] {
  const overrides = readStoredStatusOverrides();
  overrides[applicationId] = status;

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(ADMIN_APP_STATUSES_STORAGE_KEY, JSON.stringify(overrides));
    } catch {
      // Storage quota fallback ignored cleanly
    }
  }

  return getAllAcademyApplicationsSync();
}

// TODO: [BACKEND_API] GET /api/v1/competitions — Bäsleşikleriň senenamasyny almak.
export async function fetchCompetitions(): Promise<ApiResponse<Competition[]>> {
  return mockRequest(() => getAllCompetitionsSync());
}

// TODO: [BACKEND_API] GET /api/v1/competitions/reminders — Ulanyjynyň goşan ýaryş ýatlatmalaryny almak.
export async function fetchCompetitionReminderIds(): Promise<ApiResponse<string[]>> {
  return mockRequest(() => readStoredStringArray(REMINDERS_STORAGE_KEY), 90);
}

// TODO: [BACKEND_API] POST /api/v1/competitions/:id/reminders — Ýaryş üçin ýatlatma goşmak ýa-da aýyrmak.
export async function toggleCompetitionReminder(
  competitionId: string
): Promise<ApiResponse<{ reminderIds: string[]; added: boolean }>> {
  return mockRequest(() => {
    const current = readStoredStringArray(REMINDERS_STORAGE_KEY);
    const exists = current.includes(competitionId);
    const next = exists
      ? current.filter((id) => id !== competitionId)
      : [...current, competitionId];

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage quota fallback ignored cleanly
      }
    }

    return { reminderIds: next, added: !exists };
  }, 140);
}

// TODO: [BACKEND_API] GET /api/v1/library/books — Milli atçylyk kitaphanasynyň neşirlerini almak.
export async function fetchBooks(): Promise<ApiResponse<BookItem[]>> {
  return mockRequest(() => getAllBooksSync());
}

// TODO: [BACKEND_API] GET /api/v1/academy/applications — Ýaş seýisler akademiýasyna ýüz tutmalary almak.
export async function fetchAcademyApplications(): Promise<ApiResponse<AcademyApplication[]>> {
  return mockRequest(() => getAllAcademyApplicationsSync());
}

// TODO: [BACKEND_API] POST /api/v1/academy/applications — Aba Annaýew Akademiýasyna täze dalaşgärlik anketasyny tabşyrmak.
export async function submitAcademyApplication(
  input: AcademyApplicationInput
): Promise<ApiResponse<AcademyApplication>> {
  const applicantName = input.applicantName.trim().replace(/\s+/g, ' ').slice(0, 80);
  const schoolName = (input.schoolName ?? '').trim().replace(/\s+/g, ' ').slice(0, 120);
  const phone = (input.phone ?? '').trim().replace(/\s+/g, ' ').slice(0, 30);
  const email = (input.email ?? '').trim().toLowerCase().slice(0, 100);
  const motivationNote = input.motivationNote.trim().replace(/\s+/g, ' ').slice(0, 600);
  const age = Number(input.age);

  if (applicantName.length < 3) {
    throw new Error('Doly adyňyzy we familiýaňyzy (azyndan 3 harp) giriziň.');
  }
  if (!Number.isFinite(age) || age < 16 || age > 35) {
    throw new Error('Dalaşgäriň ýaşy 16 bilen 35 aralygynda bolmaly.');
  }
  if (schoolName.length < 3) {
    throw new Error('Okan mekdebiňizi ýa-da okuw jaýyňyzy (azyndan 3 nyşan) giriziň.');
  }
  const phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length < 8 || phoneDigits.length > 15) {
    throw new Error('Dogry telefon belgisini giriziň (meselem: +993 65 12 34 56).');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new Error('Dogry e-poçta (email) salgysyny giriziň.');
  }
  if (!input.region.trim()) {
    throw new Error('Welaýatyňyzy ýa-da şäheriňizi saýlaň.');
  }
  if (!input.programName.trim()) {
    throw new Error('Saýlanýan hünäri görkeziň.');
  }
  if (motivationNote.length < 15) {
    throw new Error('Düşündiriş (höwes haty) azyndan 15 nyşandan ybarat bolmaly.');
  }

  return mockRequest(() => {
    const newApplication: AcademyApplication = {
      id: `aca-${Date.now().toString(36)}`,
      applicantName,
      age,
      region: input.region.trim(),
      schoolName,
      phone,
      email,
      programName: input.programName.trim(),
      experienceLevel: input.experienceLevel,
      preferredComplexId: input.preferredComplexId,
      motivationNote,
      submittedAt: new Date().toISOString().slice(0, 10),
      status: 'garalýar',
    };

    const existing = readStoredApplications();
    const updated = [newApplication, ...existing];

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(ACADEMY_APPS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Storage quota fallback ignored cleanly
      }
    }

    return newApplication;
  }, 240);
}
