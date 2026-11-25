import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Bell,
  BellRing,
  Building2,
  Calendar,
  CheckCircle2,
  MapPin,
  SlidersHorizontal,
  Trophy,
  Users,
} from 'lucide-react';
import { useAppStore } from '../../store';
import type { Competition, EquestrianComplex, Horse } from '../../types';
import { Button, Card } from '../common';

type CategoryFilter = 'all' | Competition['category'];
type ViewMode = 'all' | 'reminders';

const CATEGORY_OPTIONS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'Ählisi' },
  { id: 'çapyşyk', label: 'At çapyşygy' },
  { id: 'gözellik', label: 'Gözellik bäsleşigi' },
  { id: 'marafon', label: 'Eko-Marafon' },
  { id: 'konkur', label: 'Konkur' },
];

const CATEGORY_LABELS: Record<Competition['category'], string> = {
  çapyşyk: 'At çapyşygy',
  gözellik: 'Gözellik bäsleşigi',
  marafon: 'Eko-Marafon',
  konkur: 'Konkur bäsleşigi',
};

const TURKMEN_MONTHS = [
  'Ýanwar',
  'Fewral',
  'Mart',
  'Aprel',
  'Maý',
  'Iýun',
  'Iýul',
  'Awgust',
  'Sentýabr',
  'Oktýabr',
  'Noýabr',
  'Dekabr',
];

function parseDateParts(isoDate: string): { day: string; month: string; year: string; full: string } {
  const [y, m, d] = isoDate.split('-').map((n) => Number(n));
  if (!y || !m || !d) {
    return { day: '--', month: '', year: '', full: isoDate };
  }
  const monthName = TURKMEN_MONTHS[m - 1] ?? '';
  const dayStr = String(d).padStart(2, '0');
  return {
    day: dayStr,
    month: monthName,
    year: String(y),
    full: `${d} ${monthName} ${y}`,
  };
}

export const CompetitionsScreen: React.FC = () => {
  const {
    competitions,
    complexes,
    horses,
    competitionReminderIds,
    toggleReminder,
    isHydrating,
  } = useAppStore();

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedComplexId, setSelectedComplexId] = useState<string>('all');
  const [notice, setNotice] = useState<string | null>(null);

  const complexMap = useMemo(() => {
    const map = new Map<string, EquestrianComplex>();
    complexes.forEach((c) => map.set(c.id, c));
    return map;
  }, [complexes]);

  const horseMap = useMemo(() => {
    const map = new Map<string, Horse>();
    horses.forEach((h) => map.set(h.id, h));
    return map;
  }, [horses]);

  const sortedCompetitions = useMemo(
    () => [...competitions].sort((a, b) => a.date.localeCompare(b.date)),
    [competitions]
  );

  /** Welaýat we şäherleriň dinamiki sanawy */
  const regionOptions = useMemo(() => {
    const regions = new Set<string>();
    complexes.forEach((c) => regions.add(c.region));
    return Array.from(regions).sort((a, b) => a.localeCompare(b));
  }, [complexes]);

  /** Saýlanan welaýata görä elýeterli atçylyk sport toplumlary */
  const availableComplexes = useMemo(() => {
    if (selectedRegion === 'all') return complexes;
    return complexes.filter((c) => c.region === selectedRegion);
  }, [complexes, selectedRegion]);

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    if (region !== 'all' && selectedComplexId !== 'all') {
      const currentComplex = complexMap.get(selectedComplexId);
      if (currentComplex && currentComplex.region !== region) {
        setSelectedComplexId('all');
      }
    }
  };

  const handleToggleReminder = async (competition: Competition) => {
    setTogglingId(competition.id);
    try {
      const result = await toggleReminder(competition.id);
      setNotice(
        result.added
          ? `«${competition.title}» ýatlatmalaryňyzyň sanawyna goşuldy.`
          : `«${competition.title}» ýatlatmalardan aýryldy.`
      );
    } finally {
      setTogglingId(null);
    }
  };

  const filteredCompetitions = useMemo(() => {
    return sortedCompetitions.filter((comp) => {
      if (viewMode === 'reminders' && !competitionReminderIds.includes(comp.id)) return false;
      if (selectedCategory !== 'all' && comp.category !== selectedCategory) return false;
      if (selectedComplexId !== 'all' && comp.complexId !== selectedComplexId) return false;
      if (selectedRegion !== 'all') {
        const compComplex = complexMap.get(comp.complexId);
        const matchesRegion =
          compComplex?.region === selectedRegion ||
          comp.location.toLowerCase().includes(selectedRegion.split(' ')[0].toLowerCase());
        if (!matchesRegion) return false;
      }
      return true;
    });
  }, [
    sortedCompetitions,
    viewMode,
    competitionReminderIds,
    selectedCategory,
    selectedComplexId,
    selectedRegion,
    complexMap,
  ]);

  const hasActiveFilters =
    viewMode !== 'all' ||
    selectedCategory !== 'all' ||
    selectedRegion !== 'all' ||
    selectedComplexId !== 'all';

  const resetFilters = () => {
    setViewMode('all');
    setSelectedCategory('all');
    setSelectedRegion('all');
    setSelectedComplexId('all');
  };

  const nextCompetitionDate = sortedCompetitions[0]
    ? parseDateParts(sortedCompetitions[0].date).full
    : '—';

  return (
    <div className="space-y-6">
      {/* Ekran başlygy */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#059669]">
            Atçylyk Sport Senenamasy
          </p>
          <h1 className="font-display mt-1 text-2xl sm:text-3xl font-bold text-[#0F172A]">
            Geçiriljek ýaryşlar
          </h1>
          <p className="mt-1.5 text-sm text-[#415850] max-w-2xl leading-relaxed">
            Öňde duran milli at çapyşyklary, halkara gözellik bäsleşikleri, konkur we eko-marafonlar.
            Welaýat we sport toplumy boýunça saýlap, gyzyklanýan ýaryşlaryňyz üçin ýatlatma goşuň.
          </p>
        </div>

        <div className="flex items-center gap-5 text-sm text-[#415850] shrink-0">
          <div>
            <span className="text-xs text-[#647A72] block">Ýakyn ýaryş</span>
            <span className="text-sm font-bold text-[#064E3B] tabular-nums">
              {nextCompetitionDate}
            </span>
          </div>
          <div className="h-8 w-px bg-[#DCE6E1]" aria-hidden="true" />
          <div>
            <span className="text-xs text-[#647A72] block">Ýatlatmalarym</span>
            <span className="text-xl font-bold text-[#064E3B] font-mono tabular-nums">
              {competitionReminderIds.length}
            </span>
          </div>
        </div>
      </div>

      {/* Habarnama zolagy */}
      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#EEF3F1] border border-[#10B981]/40 text-sm text-[#064E3B]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" aria-hidden="true" />
            <span className="font-medium">{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs font-semibold text-[#064E3B] hover:underline shrink-0 cursor-pointer"
          >
            Ýap
          </button>
        </div>
      )}

      {/* Süzgüçler paneli: Görkezme tertibi, Welaýat/Toplum we Kategoriýa */}
      <div className="bg-white border border-[#DCE6E1] rounded-2xl p-4 space-y-3.5">
        {/* 1-nji hatar: Ähli / Ýatlatmalarym + Welaýat we Toplum süzgüçleri */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_1fr] gap-3 items-center">
          <div
            className="inline-flex p-1 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] self-start"
            role="tablist"
            aria-label="Ýaryş sanawyny saýla"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'all'}
              onClick={() => setViewMode('all')}
              className={[
                'min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                viewMode === 'all'
                  ? 'bg-[#064E3B] text-white'
                  : 'text-[#415850] hover:text-[#064E3B]',
              ].join(' ')}
            >
              Ähli ýaryşlar ({sortedCompetitions.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'reminders'}
              onClick={() => setViewMode('reminders')}
              className={[
                'min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap',
                viewMode === 'reminders'
                  ? 'bg-[#064E3B] text-white'
                  : 'text-[#415850] hover:text-[#064E3B]',
              ].join(' ')}
            >
              <BellRing className="w-3.5 h-3.5" aria-hidden="true" />
              Ýatlatmalarym ({competitionReminderIds.length})
            </button>
          </div>

          <div className="relative">
            <MapPin
              className="w-4 h-4 text-[#059669] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <select
              value={selectedRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
              aria-label="Welaýat boýunça süzgüç"
              className="w-full min-h-[44px] pl-10 pr-4 py-2 text-sm bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#064E3B] focus:bg-white transition-colors cursor-pointer"
            >
              <option value="all">Ähli welaýatlar we şäherler</option>
              {regionOptions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Building2
              className="w-4 h-4 text-[#059669] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <select
              value={selectedComplexId}
              onChange={(e) => setSelectedComplexId(e.target.value)}
              aria-label="Atçylyk sport toplumy boýunça süzgüç"
              className="w-full min-h-[44px] pl-10 pr-4 py-2 text-sm bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#064E3B] focus:bg-white transition-colors cursor-pointer"
            >
              <option value="all">Ähli atçylyk sport toplumlary</option>
              {availableComplexes.map((complex) => (
                <option key={complex.id} value={complex.id}>
                  {complex.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2-nji hatar: Kategoriýa süzgüji we arassalamak */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Ýaryş görnüşi">
            {CATEGORY_OPTIONS.map((option) => {
              const active = selectedCategory === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedCategory(option.id)}
                  className={[
                    'min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer',
                    active
                      ? 'bg-[#D4AF37] text-[#0F172A]'
                      : 'bg-[#F8FAF9] text-[#415850] border border-[#DCE6E1] hover:border-[#064E3B]/40 hover:text-[#064E3B]',
                  ].join(' ')}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#064E3B] hover:underline cursor-pointer shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
              Süzgüçleri arassala ({filteredCompetitions.length}/{sortedCompetitions.length})
            </button>
          )}
        </div>
      </div>

      {/* Ýaryşlaryň sanawy */}
      {isHydrating && sortedCompetitions.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-36 rounded-2xl bg-white border border-[#DCE6E1] animate-pulse"
            />
          ))}
        </div>
      ) : filteredCompetitions.length === 0 ? (
        <Card padding="lg" className="text-center bg-white">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#EEF3F1] flex items-center justify-center text-[#064E3B]">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="font-display mt-4 text-lg font-bold text-[#0F172A]">
            {viewMode === 'reminders'
              ? 'Saýlanan şertlerde ýatlatmaňyz ýok'
              : 'Saýlanan süzgüç boýunça ýaryş tapylmady'}
          </h2>
          <p className="mt-1.5 text-sm text-[#415850] max-w-md mx-auto">
            {viewMode === 'reminders'
              ? '«Ähli ýaryşlar» sanawyna geçip, gyzyklanýan çapyşygyňyz üçin «Ýatlatma goş» düwmesine basyň.'
              : 'Beýleki welaýatlardaky ýa-da toplumlardaky ýaryşlary görmek üçin süzgüji arassalaň.'}
          </p>
          <div className="mt-5">
            <Button variant="outline" onClick={resetFilters}>
              Ähli ýaryşlary görkez
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCompetitions.map((comp) => {
            const dateParts = parseDateParts(comp.date);
            const isReminded = competitionReminderIds.includes(comp.id);
            const isBusy = togglingId === comp.id;
            const complex = complexMap.get(comp.complexId);
            const registeredHorses = comp.registeredHorseIds
              .map((horseId) => horseMap.get(horseId))
              .filter((h): h is Horse => Boolean(h));

            return (
              <Card
                key={comp.id}
                padding="md"
                className="bg-white flex flex-col md:flex-row md:items-center gap-5"
              >
                {/* Senenama güni blogy */}
                <div className="flex md:flex-col items-center justify-between md:justify-center gap-2 md:w-24 md:h-24 px-4 py-3 md:p-2 rounded-2xl bg-[#064E3B] text-white shrink-0">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D4AF37]">
                    {dateParts.month}
                  </span>
                  <span className="text-2xl md:text-3xl font-bold font-mono tabular-nums leading-none">
                    {dateParts.day}
                  </span>
                  <span className="text-xs font-mono tabular-nums text-white/75">
                    {dateParts.year}
                  </span>
                </div>

                {/* Esasy maglumat */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold text-[#059669]">
                    <span>{CATEGORY_LABELS[comp.category]}</span>
                    <span className="text-[#DCE6E1]" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-[#415850] tabular-nums">{dateParts.full}</span>
                    {complex && (
                      <>
                        <span className="text-[#DCE6E1]" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-[#064E3B]">{complex.region}</span>
                      </>
                    )}
                    <span className="text-[#DCE6E1]" aria-hidden="true">
                      ·
                    </span>
                    <span className="text-[#856510] inline-flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" aria-hidden="true" />
                      {comp.prizePoolLabel}
                    </span>
                  </div>

                  <h2 className="font-display text-lg sm:text-xl font-bold text-[#0F172A] leading-snug">
                    {comp.title}
                  </h2>

                  <p className="text-sm text-[#415850] leading-relaxed">{comp.description}</p>

                  <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#647A72]">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#064E3B] shrink-0" aria-hidden="true" />
                      {comp.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                      <Users className="w-3.5 h-3.5 text-[#064E3B] shrink-0" aria-hidden="true" />
                      Hasaba alnan bedew: {comp.registeredHorseIds.length}
                    </span>
                  </div>

                  {/* Gatnaşýan bedewlere göni baglanyşyk */}
                  {registeredHorses.length > 0 && (
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold text-[#647A72]">
                        Gatnaşýan bedewler:
                      </span>
                      {registeredHorses.map((horse) => (
                        <Link
                          key={horse.id}
                          to={`/user/horses/${horse.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F8FAF9] border border-[#DCE6E1] text-xs font-semibold text-[#064E3B] hover:border-[#064E3B] hover:bg-white transition-colors"
                        >
                          {horse.name}
                          <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ýatlatma düwmesi */}
                <div className="md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#EEF3F1]">
                  <Button
                    variant={isReminded ? 'gold' : 'outline'}
                    size="md"
                    loading={isBusy}
                    onClick={() => handleToggleReminder(comp)}
                    leftIcon={
                      isReminded ? (
                        <BellRing className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Bell className="w-4 h-4" aria-hidden="true" />
                      )
                    }
                    className="w-full md:w-auto"
                  >
                    {isReminded ? 'Ýatlatma goşuldy' : 'Ýatlatma goş'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
