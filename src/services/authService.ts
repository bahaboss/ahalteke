// TODO: [BACKEND_API] POST /api/v1/auth/* — Ulanyjy, Işgär we Admin üçin awtorizasiýa, hasaba alyş we sessiýa dolandyryşy.

import {
  DEMO_ADMIN_SESSION_TEMPLATE,
  DEMO_STAFF_SESSION_TEMPLATE,
  DEMO_USER_SESSION_TEMPLATE,
} from '../mockData';
import type {
  ApiResponse,
  AuthSession,
  AuthStaffLoginInput,
  AuthUserLoginInput,
  AuthUserRegisterInput,
  AuthenticatedRole,
  StaffPosition,
} from '../types';
import { mockRequest } from './apiClient';
import { getAllComplexesSync, getAllStablesSync } from './complexService';

const AUTH_SESSION_STORAGE_KEY = 'smart_green_ahalteke_auth_session_v1';

const VALID_ROLES: ReadonlySet<AuthenticatedRole> = new Set(['user', 'staff', 'admin']);

function isValidEmailOrPhone(value: string): boolean {
  const trimmed = value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const phoneRegex = /^\+?[\d\s()-]{8,16}$/;
  return emailRegex.test(trimmed) || phoneRegex.test(trimmed);
}

function sanitizeText(value: string, maxLen = 100): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLen);
}

/**
 * Brauzeriň localStorage ýadyndan sessiýany howpsuz okaýar (parol hiç haçan saklanmaýar).
 * Nädogry ýa-da bozulan maglumat bolsa awtomatik arassalanýar.
 */
export function getStoredAuthSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.userId !== 'string' ||
      typeof parsed.fullName !== 'string' ||
      typeof parsed.emailOrPhone !== 'string' ||
      !parsed.role ||
      !VALID_ROLES.has(parsed.role)
    ) {
      window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      return null;
    }

    return {
      userId: parsed.userId,
      fullName: parsed.fullName,
      emailOrPhone: parsed.emailOrPhone,
      role: parsed.role,
      region: typeof parsed.region === 'string' ? parsed.region : undefined,
      staffPosition: typeof parsed.staffPosition === 'string' ? (parsed.staffPosition as StaffPosition) : undefined,
      complexId: typeof parsed.complexId === 'string' ? parsed.complexId : undefined,
      complexName: typeof parsed.complexName === 'string' ? parsed.complexName : undefined,
      stableId: typeof parsed.stableId === 'string' ? parsed.stableId : undefined,
      stableName: typeof parsed.stableName === 'string' ? parsed.stableName : undefined,
      isDemo: Boolean(parsed.isDemo),
      loggedInAt: typeof parsed.loggedInAt === 'string' ? parsed.loggedInAt : new Date().toISOString(),
    };
  } catch {
    try {
      window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    } catch {
      // Storage unavailable
    }
    return null;
  }
}

export function saveAuthSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Quota or private mode fallback ignored safely
  }
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage error
  }
}

// TODO: [BACKEND_API] POST /api/v1/auth/login — Ýönekeý ulanyjynyň e-poçta/telefon we parol arkaly ulgama girmegi.
export async function loginUser(input: AuthUserLoginInput): Promise<ApiResponse<AuthSession>> {
  const emailOrPhone = sanitizeText(input.emailOrPhone, 120);
  const password = input.password;

  if (!isValidEmailOrPhone(emailOrPhone)) {
    throw new Error('Dogry e-poçta salgysyny ýa-da telefon belgisini (+993 ...) giriziň.');
  }
  if (!password || password.length < 6) {
    throw new Error('Parol azyndan 6 nyşandan ybarat bolmaly.');
  }

  return mockRequest(() => {
    const derivedName = emailOrPhone.includes('@')
      ? emailOrPhone
          .split('@')[0]
          .replace(/[._-]+/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase())
      : 'At Eýesi (Ulanyjy)';

    const session: AuthSession = {
      userId: `usr-${Date.now().toString(36)}`,
      fullName: derivedName,
      emailOrPhone,
      role: 'user',
      region: 'Aşgabat şäheri',
      isDemo: false,
      loggedInAt: new Date().toISOString(),
    };
    saveAuthSession(session);
    return session;
  }, 240);
}

// TODO: [BACKEND_API] POST /api/v1/auth/register — Täze ýönekeý ulanyjy hasabyny döretmek we sessiýany açmak.
export async function registerUser(
  input: AuthUserRegisterInput
): Promise<ApiResponse<AuthSession>> {
  const fullName = sanitizeText(input.fullName, 80);
  const region = sanitizeText(input.region, 60);
  const emailOrPhone = sanitizeText(input.emailOrPhone, 120);

  if (fullName.length < 3) {
    throw new Error('Doly adyňyzy we familiýaňyzy (azyndan 3 harp) giriziň.');
  }
  if (!region) {
    throw new Error('Welaýatyňyzy ýa-da şäheriňizi saýlaň.');
  }
  if (!isValidEmailOrPhone(emailOrPhone)) {
    throw new Error('Dogry e-poçta salgysyny ýa-da telefon belgisini giriziň.');
  }
  if (!input.password || input.password.length < 6) {
    throw new Error('Parol azyndan 6 nyşandan ybarat bolmaly.');
  }
  if (input.password !== input.confirmPassword) {
    throw new Error('Girizilen parollar biri-birine gabat gelenok.');
  }

  return mockRequest(() => {
    const session: AuthSession = {
      userId: `usr-${Date.now().toString(36)}`,
      fullName,
      emailOrPhone,
      role: 'user',
      region,
      isDemo: false,
      loggedInAt: new Date().toISOString(),
    };
    saveAuthSession(session);
    return session;
  }, 280);
}

// TODO: [BACKEND_API] POST /api/v1/auth/staff/login — Atçylyk sport toplumynyň işgärini toplum, athana we wezipe boýunça tassyklap girizmek.
export async function loginStaff(input: AuthStaffLoginInput): Promise<ApiResponse<AuthSession>> {
  const allComplexes = getAllComplexesSync();
  const allStables = getAllStablesSync();
  const complex = allComplexes.find((c) => c.id === input.complexId);
  const stable = allStables.find(
    (s) => s.id === input.stableId && s.complexId === input.complexId
  );
  const staffIdentifier = sanitizeText(input.staffIdentifier, 120);

  if (!complex) {
    throw new Error('Atçylyk sport toplumyny ýa-da edarany saýlaň.');
  }
  if (!stable) {
    throw new Error('Saýlanan topluma degişli jogapkär athanany saýlaň.');
  }
  if (!staffIdentifier || staffIdentifier.length < 3) {
    throw new Error('Işgär şahsyýet koduny ýa-da gulluk e-poçtasyny giriziň.');
  }
  if (!input.password || input.password.length < 6) {
    throw new Error('Parol azyndan 6 nyşandan ybarat bolmaly.');
  }

  return mockRequest(() => {
    const derivedName = staffIdentifier.includes('@')
      ? staffIdentifier
          .split('@')[0]
          .replace(/[._-]+/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase())
      : stable.headSeisName;

    const session: AuthSession = {
      userId: `stf-${Date.now().toString(36)}`,
      fullName: derivedName,
      emailOrPhone: staffIdentifier,
      role: 'staff',
      region: complex.region,
      staffPosition: input.staffPosition,
      complexId: complex.id,
      complexName: complex.name,
      stableId: stable.id,
      stableName: stable.name,
      isDemo: false,
      loggedInAt: new Date().toISOString(),
    };
    saveAuthSession(session);
    return session;
  }, 260);
}

// TODO: [BACKEND_API] POST /api/v1/auth/demo-login — Synag (Demo) Ulanyjy, Işgär ýa-da Admin hökmünde çalt sessiýa açmak.
export async function loginDemoRole(
  role: AuthenticatedRole,
  staffSelection?: {
    complexId?: string;
    stableId?: string;
    staffPosition?: StaffPosition;
  }
): Promise<ApiResponse<AuthSession>> {
  return mockRequest(() => {
    const now = new Date().toISOString();

    if (role === 'user') {
      const session: AuthSession = { ...DEMO_USER_SESSION_TEMPLATE, loggedInAt: now };
      saveAuthSession(session);
      return session;
    }

    if (role === 'admin') {
      const session: AuthSession = { ...DEMO_ADMIN_SESSION_TEMPLATE, loggedInAt: now };
      saveAuthSession(session);
      return session;
    }

    const allComplexes = getAllComplexesSync();
    const allStables = getAllStablesSync();
    const chosenComplex =
      allComplexes.find((c) => c.id === staffSelection?.complexId) ?? allComplexes[0];
    const chosenStable =
      allStables.find(
        (s) => s.id === staffSelection?.stableId && s.complexId === chosenComplex.id
      ) ??
      allStables.find((s) => s.complexId === chosenComplex.id) ??
      allStables[0];

    const session: AuthSession = {
      ...DEMO_STAFF_SESSION_TEMPLATE,
      region: chosenComplex.region,
      staffPosition: staffSelection?.staffPosition ?? DEMO_STAFF_SESSION_TEMPLATE.staffPosition,
      complexId: chosenComplex.id,
      complexName: chosenComplex.name,
      stableId: chosenStable.id,
      stableName: chosenStable.name,
      loggedInAt: now,
    };
    saveAuthSession(session);
    return session;
  }, 180);
}

// TODO: [BACKEND_API] POST /api/v1/auth/admin/login — Merkezi Admin dolandyryjysyny gulluk e-poçtasy we paroly bilen tassyklap girizmek.
export async function loginAdmin(input: {
  emailOrPhone: string;
  password: string;
}): Promise<ApiResponse<AuthSession>> {
  const emailOrPhone = sanitizeText(input.emailOrPhone, 120);
  if (!isValidEmailOrPhone(emailOrPhone)) {
    throw new Error('Dogry admin gulluk e-poçtasyny ýa-da telefon belgisini giriziň.');
  }
  if (!input.password || input.password.length < 6) {
    throw new Error('Parol azyndan 6 nyşandan ybarat bolmaly.');
  }

  return mockRequest(() => {
    const derivedName = emailOrPhone.includes('@')
      ? emailOrPhone
          .split('@')[0]
          .replace(/[._-]+/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase())
      : DEMO_ADMIN_SESSION_TEMPLATE.fullName;

    const session: AuthSession = {
      ...DEMO_ADMIN_SESSION_TEMPLATE,
      userId: `adm-${Date.now().toString(36)}`,
      fullName: derivedName,
      emailOrPhone,
      isDemo: false,
      loggedInAt: new Date().toISOString(),
    };
    saveAuthSession(session);
    return session;
  }, 240);
}

// TODO: [BACKEND_API] POST /api/v1/auth/logout — Işjeň sessiýany ýapmak we ýatdan aýyrmak.
export async function logoutSession(): Promise<ApiResponse<{ loggedOut: true }>> {
  return mockRequest(() => {
    clearAuthSession();
    return { loggedOut: true };
  }, 120);
}
