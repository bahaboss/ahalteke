// TODO: [BACKEND_API] GET /api/v1/admin/overview — Merkezi Admin paneli üçin jemleýji statistika, işgär bellemeleri, kontent we akademiýa anketalary serwisi.

import { mockEcoMetrics, mockStaffAssignments } from '../mockData';
import type {
  AcademyApplication,
  AcademyApplicationStatus,
  AdminOverviewData,
  ApiResponse,
  BookItem,
  BookUpsertInput,
  Competition,
  CompetitionUpsertInput,
  ComplexEcoSummaryPoint,
  ComplexUpsertInput,
  EcoMetrics,
  EquestrianComplex,
  Stable,
  StableCreateInput,
  StableEcoRankingItem,
  StaffAssignment,
  StaffAssignmentInput,
} from '../types';
import { mockRequest } from './apiClient';
import {
  getAllAcademyApplicationsSync,
  getAllBooksSync,
  getAllCompetitionsSync,
  saveBooksToStore,
  saveCompetitionsToStore,
  updateAcademyApplicationStatusInStore,
} from './communityService';
import {
  addCustomStableToStore,
  getAllComplexesSync,
  getAllStablesSync,
  upsertComplexInStore,
  upsertStableInStore,
} from './complexService';

const ADMIN_ASSIGNMENTS_STORAGE_KEY = 'smart_green_ahalteke_admin_assignments_v1';

function readStoredAssignments(): StaffAssignment[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(ADMIN_ASSIGNMENTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item): item is StaffAssignment =>
              Boolean(item) && typeof item === 'object' && typeof item.id === 'string'
          );
        }
      }
    } catch {
      // Fallback to mock seed
    }
  }
  return [...mockStaffAssignments];
}

function writeStoredAssignments(items: StaffAssignment[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ADMIN_ASSIGNMENTS_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage quota fallback ignored cleanly
  }
}

function shortenComplexName(name: string): string {
  if (name.includes('Halkara Ahalteke')) return 'Aşgabat / Ahal';
  if (name.includes('Aba Annaýew')) return 'Akademiýa';
  if (name.includes('Arkadag')) return 'Arkadag Eko';
  if (name.includes('Mary')) return 'Mary';
  if (name.includes('Balkan')) return 'Balkan';
  if (name.includes('Daşoguz')) return 'Daşoguz';
  if (name.includes('Lebap')) return 'Lebap';
  return name.slice(0, 14);
}

function computeStableEcoScore(stable: Stable, complexBaseScore: number): number {
  const solarBonus = stable.solarRoofEnabled ? 4 : -8;
  const airBonus = Math.max(0, Math.round((24 - stable.airQualityIndex) * 0.55));
  const rainBonus = Math.min(4, Math.round(stable.rainwaterHarvestingLiters / 4500));
  const raw = complexBaseScore - 4 + solarBonus + airBonus + rainBonus;
  return Math.max(68, Math.min(99, raw));
}

export interface AdminOverviewComputeParams {
  complexes: EquestrianComplex[];
  stables: Stable[];
  staffAssignments: StaffAssignment[];
  academyApplications: AcademyApplication[];
  ecoMetrics?: EcoMetrics[];
}

export function computeAdminOverviewData({
  complexes,
  stables,
  staffAssignments,
  academyApplications,
  ecoMetrics = mockEcoMetrics,
}: AdminOverviewComputeParams): AdminOverviewData {
  const ecoByComplex = new Map(ecoMetrics.map((m) => [m.complexId, m]));

  const stableRankings: StableEcoRankingItem[] = stables
    .map((stable) => {
      const complex = complexes.find((c) => c.id === stable.complexId);
      const complexEco = ecoByComplex.get(stable.complexId);
      const baseScore =
        complexEco?.ecoRatingScore ??
        (complex?.ecoCertificationLevel === 'Altyn Ýaşyl'
          ? 94
          : complex?.ecoCertificationLevel === 'Zümrüt Ýaşyl'
            ? 92
            : 86);
      const ecoScore = computeStableEcoScore(stable, baseScore);
      const solarEnergyKwh = stable.solarRoofEnabled
        ? Math.round((complex?.solarCapacityKw ?? 180) * 1.42 + stable.boxCount * 14)
        : Math.round(stable.boxCount * 6);
      const waterSavedLiters = Math.round(
        stable.rainwaterHarvestingLiters + stable.occupiedBoxes * 280
      );

      return {
        stableId: stable.id,
        stableName: stable.name,
        stableCode: stable.code,
        complexId: stable.complexId,
        complexName: complex?.name ?? 'Atçylyk Sport Toplumy',
        region: complex?.region ?? 'Türkmenistan',
        headSeisName: stable.headSeisName,
        occupiedBoxes: stable.occupiedBoxes,
        boxCount: stable.boxCount,
        solarRoofEnabled: stable.solarRoofEnabled,
        ecoScore,
        waterSavedLiters,
        solarEnergyKwh,
        airQualityIndex: stable.airQualityIndex,
      };
    })
    .sort((a, b) => b.ecoScore - a.ecoScore);

  const complexSeries: ComplexEcoSummaryPoint[] = complexes.map((complex) => {
    const relatedStables = stableRankings.filter((s) => s.complexId === complex.id);
    const waterSavedLiters =
      relatedStables.reduce((sum, s) => sum + s.waterSavedLiters, 0) || 12000;
    const solarEnergyKwh =
      relatedStables.reduce((sum, s) => sum + s.solarEnergyKwh, 0) ||
      Math.round(complex.solarCapacityKw * 3.1);
    const avgEcoScore = relatedStables.length
      ? Math.round(
          relatedStables.reduce((sum, s) => sum + s.ecoScore, 0) / relatedStables.length
        )
      : complex.ecoCertificationLevel === 'Altyn Ýaşyl'
        ? 94
        : complex.ecoCertificationLevel === 'Zümrüt Ýaşyl'
          ? 91
          : 86;

    return {
      complexId: complex.id,
      complexName: complex.name,
      shortName: shortenComplexName(complex.name),
      region: complex.region,
      stableCount: relatedStables.length,
      horseCount: complex.totalHorses,
      avgEcoScore,
      waterSavedLiters,
      solarEnergyKwh,
      certificationLevel: complex.ecoCertificationLevel,
    };
  });

  const avgEcoScore = stableRankings.length
    ? Math.round(
        stableRankings.reduce((sum, s) => sum + s.ecoScore, 0) / stableRankings.length
      )
    : 90;

  return {
    totals: {
      complexCount: complexes.length,
      stableCount: stables.length,
      horseCount: complexes.reduce((sum, c) => sum + c.totalHorses, 0),
      staffCount: staffAssignments.filter((a) => a.status === 'işjeň').length,
      avgEcoScore,
      totalWaterSavedLiters: stableRankings.reduce((sum, s) => sum + s.waterSavedLiters, 0),
      totalSolarEnergyKwh: stableRankings.reduce((sum, s) => sum + s.solarEnergyKwh, 0),
      pendingApplicationsCount: academyApplications.filter((a) => a.status === 'garalýar').length,
    },
    stableRankings,
    complexSeries,
  };
}

// TODO: [BACKEND_API] GET /api/v1/admin/overview — Ähli toplumlaryň we athanalaryň jemleýji statistikasyny we Ýaşyl Reýtingini almak.
export async function fetchAdminOverview(): Promise<ApiResponse<AdminOverviewData>> {
  return mockRequest(
    () =>
      computeAdminOverviewData({
        complexes: getAllComplexesSync(),
        stables: getAllStablesSync(),
        staffAssignments: readStoredAssignments(),
        academyApplications: getAllAcademyApplicationsSync(),
        ecoMetrics: mockEcoMetrics,
      }),
    160
  );
}

// TODO: [BACKEND_API] GET /api/v1/admin/assignments — Işgärleriň toplum we athana jogapkärçilik sanawyny almak.
export async function fetchStaffAssignments(): Promise<ApiResponse<StaffAssignment[]>> {
  return mockRequest(() => readStoredAssignments(), 130);
}

// TODO: [BACKEND_API] POST /api/v1/admin/complexes — Täze atçylyk sport toplumyny goşmak ýa-da bar bolan toplumy täzelemek.
export async function saveComplexAdmin(
  input: ComplexUpsertInput
): Promise<ApiResponse<EquestrianComplex[]>> {
  const name = input.name.trim().replace(/\s+/g, ' ').slice(0, 120);
  const region = input.region.trim().replace(/\s+/g, ' ').slice(0, 60);
  const address = input.address.trim().replace(/\s+/g, ' ').slice(0, 160);
  const description = input.description.trim().replace(/\s+/g, ' ').slice(0, 400);
  const solarCapacityKw = Number(input.solarCapacityKw);

  if (name.length < 4) {
    throw new Error('Atçylyk sport toplumynyň ady azyndan 4 nyşan bolmaly.');
  }
  if (region.length < 2) {
    throw new Error('Welaýaty ýa-da şäheri saýlaň.');
  }
  if (address.length < 4) {
    throw new Error('Toplumyň salgysyny giriziň.');
  }
  if (!Number.isFinite(solarCapacityKw) || solarCapacityKw < 20 || solarCapacityKw > 2000) {
    throw new Error('Gün energiýasy kuwwaty 20 bilen 2000 kWt aralygynda bolmaly.');
  }

  return mockRequest(() => {
    const existing = input.id
      ? getAllComplexesSync().find((c) => c.id === input.id)
      : undefined;

    const record: EquestrianComplex = existing
      ? {
          ...existing,
          name,
          region,
          address,
          solarCapacityKw,
          ecoCertificationLevel: input.ecoCertificationLevel,
          description: description || existing.description,
        }
      : {
          id: `cmp-${Date.now().toString(36)}`,
          name,
          region,
          address,
          totalStables: 0,
          totalHorses: 0,
          solarCapacityKw,
          ecoCertificationLevel: input.ecoCertificationLevel,
          coordinates: { lat: 37.9601, lng: 58.3261 },
          description:
            description ||
            'Smart & Green Ahalteke standartlaryna laýyk döwrebap atçylyk sport toplumy.',
        };

    return upsertComplexInStore(record);
  }, 180);
}

// TODO: [BACKEND_API] PUT /api/v1/admin/stables/:id — Täze athana goşmak ýa-da bar bolan athanany täzelemek.
export async function saveStableAdmin(input: StableCreateInput): Promise<ApiResponse<Stable[]>> {
  const name = input.name.trim().replace(/\s+/g, ' ').slice(0, 80);
  const code = input.code.trim().toUpperCase().slice(0, 20);
  const headSeisName = input.headSeisName.trim().replace(/\s+/g, ' ').slice(0, 80);
  const boxCount = Number(input.boxCount);
  const occupiedBoxes = Number(input.occupiedBoxes);
  const rainwaterHarvestingLiters = Number(input.rainwaterHarvestingLiters);

  if (!input.complexId) {
    throw new Error('Atçylyk sport toplumyny saýlaň.');
  }
  if (name.length < 3) {
    throw new Error('Athananyň ady azyndan 3 nyşan bolmaly.');
  }
  if (code.length < 3) {
    throw new Error('Athana kody (mysal: ATH-AG-03) girizilmeli.');
  }
  if (!Number.isFinite(boxCount) || boxCount < 4 || boxCount > 80) {
    throw new Error('Bokslaryň sany 4 bilen 80 aralygynda bolmaly.');
  }
  if (!Number.isFinite(occupiedBoxes) || occupiedBoxes < 0 || occupiedBoxes > boxCount) {
    throw new Error('Eýelenen bokslaryň sany umumy boks sanyndan köp bolmaly däl.');
  }
  if (headSeisName.length < 3) {
    throw new Error('Jogapkär baş seýisiň adyny giriziň.');
  }

  return mockRequest(() => {
    const existing = input.id ? getAllStablesSync().find((s) => s.id === input.id) : undefined;
    const record: Stable = existing
      ? {
          ...existing,
          complexId: input.complexId,
          name,
          code,
          boxCount,
          occupiedBoxes,
          solarRoofEnabled: Boolean(input.solarRoofEnabled),
          rainwaterHarvestingLiters: Number.isFinite(rainwaterHarvestingLiters)
            ? Math.max(1000, rainwaterHarvestingLiters)
            : existing.rainwaterHarvestingLiters,
          headSeisName,
        }
      : {
          id: `stb-${Date.now().toString(36)}`,
          complexId: input.complexId,
          name,
          code,
          boxCount,
          occupiedBoxes,
          solarRoofEnabled: Boolean(input.solarRoofEnabled),
          rainwaterHarvestingLiters: Number.isFinite(rainwaterHarvestingLiters)
            ? Math.max(1000, rainwaterHarvestingLiters)
            : 9500,
          airQualityIndex: input.solarRoofEnabled ? 16 : 22,
          temperatureC: 20.2,
          humidityPercent: 46,
          headSeisName,
        };

    return upsertStableInStore(record);
  }, 190);
}

// TODO: [BACKEND_API] POST /api/v1/admin/stables — Täze athana döretmek we degişli atçylyk toplumyna birikdirmek.
export async function createStableAdmin(input: StableCreateInput): Promise<ApiResponse<Stable>> {
  const name = input.name.trim().replace(/\s+/g, ' ').slice(0, 80);
  const code = input.code.trim().toUpperCase().slice(0, 20);
  const headSeisName = input.headSeisName.trim().replace(/\s+/g, ' ').slice(0, 80);
  const boxCount = Number(input.boxCount);
  const occupiedBoxes = Number(input.occupiedBoxes);
  const rainwaterHarvestingLiters = Number(input.rainwaterHarvestingLiters);

  if (!input.complexId) {
    throw new Error('Atçylyk sport toplumyny saýlaň.');
  }
  if (name.length < 3) {
    throw new Error('Athananyň ady azyndan 3 nyşan bolmaly.');
  }
  if (code.length < 3) {
    throw new Error('Athana kody (mysal: ATH-AG-03) girizilmeli.');
  }
  if (!Number.isFinite(boxCount) || boxCount < 4 || boxCount > 80) {
    throw new Error('Bokslaryň sany 4 bilen 80 aralygynda bolmaly.');
  }
  if (!Number.isFinite(occupiedBoxes) || occupiedBoxes < 0 || occupiedBoxes > boxCount) {
    throw new Error('Eýelenen bokslaryň sany umumy boks sanyndan köp bolmaly däl.');
  }
  if (headSeisName.length < 3) {
    throw new Error('Jogapkär baş seýisiň adyny giriziň.');
  }

  return mockRequest(() => {
    const created: Stable = {
      id: `stb-${Date.now().toString(36)}`,
      complexId: input.complexId,
      name,
      code,
      boxCount,
      occupiedBoxes,
      solarRoofEnabled: Boolean(input.solarRoofEnabled),
      rainwaterHarvestingLiters: Number.isFinite(rainwaterHarvestingLiters)
        ? Math.max(1000, rainwaterHarvestingLiters)
        : 9500,
      airQualityIndex: input.solarRoofEnabled ? 16 : 22,
      temperatureC: 20.2,
      humidityPercent: 46,
      headSeisName,
    };

    addCustomStableToStore(created);
    return created;
  }, 200);
}

// TODO: [BACKEND_API] POST /api/v1/admin/assignments — Işgäri sport toplumyna we athana jogapkär edip bellemek ýa-da üýtgetmek.
export async function saveStaffAssignment(
  input: StaffAssignmentInput
): Promise<ApiResponse<StaffAssignment[]>> {
  const fullName = input.fullName.trim().replace(/\s+/g, ' ').slice(0, 80);
  const emailOrPhone = input.emailOrPhone.trim().slice(0, 90);

  if (fullName.length < 3) {
    throw new Error('Işgäriň doly adyny we familiýasyny giriziň.');
  }
  if (emailOrPhone.length < 5) {
    throw new Error('Işgäriň e-poçta ýa-da telefon belgisini giriziň.');
  }
  if (!input.complexId || !input.stableId) {
    throw new Error('Sport toplumyny we jogapkär athanany saýlaň.');
  }

  return mockRequest(() => {
    const current = readStoredAssignments();
    let updated: StaffAssignment[];

    if (input.id) {
      updated = current.map((item) =>
        item.id === input.id
          ? {
              ...item,
              fullName,
              position: input.position,
              emailOrPhone,
              complexId: input.complexId,
              stableId: input.stableId,
              status: input.status,
            }
          : item
      );
    } else {
      const created: StaffAssignment = {
        id: `asg-${Date.now().toString(36)}`,
        fullName,
        position: input.position,
        emailOrPhone,
        complexId: input.complexId,
        stableId: input.stableId,
        status: input.status,
        assignedAt: new Date().toISOString().slice(0, 10),
      };
      updated = [created, ...current];
    }

    writeStoredAssignments(updated);
    return updated;
  }, 180);
}

// TODO: [BACKEND_API] DELETE /api/v1/admin/assignments/:id — Işgär bellemesini sanawdan aýyrmak.
export async function deleteStaffAssignment(
  assignmentId: string
): Promise<ApiResponse<StaffAssignment[]>> {
  return mockRequest(() => {
    const updated = readStoredAssignments().filter((item) => item.id !== assignmentId);
    writeStoredAssignments(updated);
    return updated;
  }, 140);
}

// TODO: [BACKEND_API] POST /api/v1/admin/content — Ulanyjy panelinde görünýän ýaryşlary goşmak ýa-da üýtgetmek.
export async function saveCompetitionAdmin(
  input: CompetitionUpsertInput
): Promise<ApiResponse<Competition[]>> {
  const title = input.title.trim().replace(/\s+/g, ' ').slice(0, 140);
  const location = input.location.trim().replace(/\s+/g, ' ').slice(0, 140);
  const prizePoolLabel = input.prizePoolLabel.trim().replace(/\s+/g, ' ').slice(0, 100);
  const description = input.description.trim().replace(/\s+/g, ' ').slice(0, 500);

  if (title.length < 4) {
    throw new Error('Ýaryşyň ady azyndan 4 nyşan bolmaly.');
  }
  if (!input.date.trim()) {
    throw new Error('Ýaryşyň geçiriljek senesini saýlaň.');
  }
  if (location.length < 3) {
    throw new Error('Ýaryşyň geçiriljek ýerini giriziň.');
  }
  if (description.length < 10) {
    throw new Error('Gysgaça düşündiriş azyndan 10 nyşan bolmaly.');
  }

  return mockRequest(() => {
    const current = getAllCompetitionsSync();
    let updated: Competition[];

    if (input.id) {
      updated = current.map((item) =>
        item.id === input.id
          ? {
              ...item,
              title,
              category: input.category,
              date: input.date,
              location,
              complexId: input.complexId,
              prizePoolLabel: prizePoolLabel || 'Baýrak Gaznasy',
              status: input.status,
              description,
            }
          : item
      );
    } else {
      const created: Competition = {
        id: `comp-${Date.now().toString(36)}`,
        title,
        category: input.category,
        date: input.date,
        location,
        complexId: input.complexId,
        prizePoolLabel: prizePoolLabel || 'Altyn Kubok we Baýraklar',
        status: input.status,
        registeredHorseIds: ['hrs-001', 'hrs-002'],
        description,
      };
      updated = [created, ...current];
    }

    return saveCompetitionsToStore(updated);
  }, 180);
}

// TODO: [BACKEND_API] DELETE /api/v1/admin/content/competitions/:id — Ýaryşy sanawdan aýyrmak.
export async function deleteCompetitionAdmin(
  competitionId: string
): Promise<ApiResponse<Competition[]>> {
  return mockRequest(() => {
    const updated = getAllCompetitionsSync().filter((item) => item.id !== competitionId);
    return saveCompetitionsToStore(updated);
  }, 140);
}

// TODO: [BACKEND_API] POST /api/v1/admin/content — Ulanyjy panelindäki kitaphana neşirini goşmak ýa-da üýtgetmek.
export async function saveBookAdmin(input: BookUpsertInput): Promise<ApiResponse<BookItem[]>> {
  const title = input.title.trim().replace(/\s+/g, ' ').slice(0, 140);
  const author = input.author.trim().replace(/\s+/g, ' ').slice(0, 100);
  const summary = input.summary.trim().replace(/\s+/g, ' ').slice(0, 600);
  const publishYear = Number(input.publishYear);
  const pages = Number(input.pages);

  if (title.length < 3) {
    throw new Error('Kitabyň ady azyndan 3 nyşan bolmaly.');
  }
  if (author.length < 3) {
    throw new Error('Awtoryň adyny giriziň.');
  }
  if (!Number.isFinite(publishYear) || publishYear < 1990 || publishYear > 2035) {
    throw new Error('Neşir edilen ýyly dogry giriziň (1990–2035).');
  }
  if (!Number.isFinite(pages) || pages < 16 || pages > 2000) {
    throw new Error('Sahypa sany 16 bilen 2000 aralygynda bolmaly.');
  }
  if (summary.length < 12) {
    throw new Error('Kitabyň mazmuny azyndan 12 nyşan bolmaly.');
  }

  return mockRequest(() => {
    const current = getAllBooksSync();
    const formats: BookItem['availableFormats'] =
      input.availableFormats.length > 0 ? input.availableFormats : ['PDF'];
    let updated: BookItem[];

    if (input.id) {
      updated = current.map((item) =>
        item.id === input.id
          ? {
              ...item,
              title,
              author,
              publishYear,
              category: input.category,
              pages,
              language: input.language,
              summary,
              availableFormats: formats,
              isFeatured: input.isFeatured,
            }
          : item
      );
    } else {
      const created: BookItem = {
        id: `bk-${Date.now().toString(36)}`,
        title,
        author,
        publishYear,
        category: input.category,
        pages,
        language: input.language,
        summary,
        availableFormats: formats,
        isFeatured: input.isFeatured,
        accentColor: '#064E3B',
        chapters: [
          {
            title: '1-nji bölüm · Giriş we Esasy Mazmun',
            content: summary,
          },
        ],
      };
      updated = [created, ...current];
    }

    return saveBooksToStore(updated);
  }, 180);
}

// TODO: [BACKEND_API] DELETE /api/v1/admin/content/books/:id — Kitaphana neşirini aýyrmak.
export async function deleteBookAdmin(bookId: string): Promise<ApiResponse<BookItem[]>> {
  return mockRequest(() => {
    const updated = getAllBooksSync().filter((item) => item.id !== bookId);
    return saveBooksToStore(updated);
  }, 140);
}

// TODO: [BACKEND_API] PATCH /api/v1/admin/applications/:id — Akademiýa dalaşgärlik anketasynyň statusyny üýtgetmek.
export async function updateAcademyApplicationStatusAdmin(
  applicationId: string,
  status: AcademyApplicationStatus
): Promise<ApiResponse<AcademyApplication[]>> {
  return mockRequest(() => updateAcademyApplicationStatusInStore(applicationId, status), 150);
}

function escapeCsvCell(rawValue: string | number): string {
  const str = String(rawValue ?? '');
  // Excel formula injection goragy
  const safe = /^[=+\-@]/.test(str) ? `'${str}` : str;
  const escaped = safe.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function getApplicationStatusLabelTk(status: AcademyApplicationStatus): string {
  switch (status) {
    case 'tassyklandy':
      return 'Kabul edildi';
    case 'söhbetdeşlik':
      return 'Söhbetdeşlik';
    case 'ret_edildi':
      return 'Ret edildi';
    default:
      return 'Garaşylýar';
  }
}

// TODO: [BACKEND_API] GET /api/v1/admin/applications/export — Akademiýa anketalaryny Excel üçin UTF-8 BOM CSV görnüşinde eksport etmek.
export function exportAcademyApplicationsCsv(
  applications: AcademyApplication[],
  complexNameById: Record<string, string>
): string {
  const headers = [
    'ID',
    'Dalaşgäriň F.A.A.',
    'Ýaşy',
    'Welaýat / Şäher',
    'Mekdebi / Okuw jaýy',
    'Telefon belgisi',
    'Email salgysy',
    'Saýlanan hünär',
    'Tejribe derejesi',
    'Saýlanan toplum',
    'Tabşyrylan sene',
    'Status',
    'Düşündiriş / Höwes haty',
  ];

  const rows = applications.map((app) => [
    app.id,
    app.applicantName,
    app.age,
    app.region,
    app.schoolName ?? '—',
    app.phone ?? '—',
    app.email ?? '—',
    app.programName,
    app.experienceLevel,
    complexNameById[app.preferredComplexId] ?? app.preferredComplexId,
    app.submittedAt,
    getApplicationStatusLabelTk(app.status),
    app.motivationNote,
  ]);

  const csvBody = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\r\n');

  // UTF-8 BOM Excel-de türkmen harplaryny (ä, ň, ö, ş, ü, ý, ž) dogry açmak üçin
  const csvWithBom = `\uFEFF${csvBody}`;
  const fileName = `aba-annayew-akademiya-anketalar-${new Date().toISOString().slice(0, 10)}.csv`;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return fileName;
}

// TODO: [BACKEND_API] GET /api/v1/admin/overview/export — Athanalaryň «Ýaşyl Reýting» (Eco-Score) tablisasyny Excel üçin UTF-8 BOM CSV görnüşinde eksport etmek.
export function exportEcoRankingsCsv(rankings: StableEcoRankingItem[]): string {
  const headers = [
    'Orny',
    'Athana ady',
    'Athana kody',
    'Atçylyk Sport Toplumy',
    'Welaýat / Şäher',
    'Jogapkär Baş Seýis',
    'Eýelenen bokslar',
    'Jemi bokslar',
    'Gün üçekli',
    'Suw tygşytlylygy (L)',
    'Gün energiýasy (kWt)',
    'Howa hili indeksi (AQI)',
    'Ýaşyl Reýting (Eco-Score / 100)',
  ];

  const rows = rankings.map((row, idx) => [
    idx + 1,
    row.stableName,
    row.stableCode,
    row.complexName,
    row.region,
    row.headSeisName,
    row.occupiedBoxes,
    row.boxCount,
    row.solarRoofEnabled ? 'Hawa' : 'Ýok',
    row.waterSavedLiters,
    row.solarEnergyKwh,
    row.airQualityIndex,
    row.ecoScore,
  ]);

  const csvBody = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ].join('\r\n');

  const csvWithBom = `\uFEFF${csvBody}`;
  const fileName = `smart-green-ahalteke-yasyl-reyting-${new Date().toISOString().slice(0, 10)}.csv`;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return fileName;
}
