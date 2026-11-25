import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Check,
  Copy,
  GitBranch,
  MapPin,
  QrCode,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useAppStore } from '../../store';
import type { EquestrianComplex, Horse, HorseCoatColor } from '../../types';
import { Button, Card, Modal } from '../common';
import { AnimatedHorseAvatar } from './AnimatedHorseAvatar';
import {
  extractLineageLine,
  GENDER_LABELS,
  HEALTH_STATUS_META,
  HorsePortrait,
  QrCodeGraphic,
} from './HorseSharedParts';

type CoatFilter = 'all' | HorseCoatColor;

const COAT_FILTER_OPTIONS: { id: CoatFilter; label: string }[] = [
  { id: 'all', label: 'Ähli reňkler' },
  { id: 'altyn_dor', label: 'Altyn dor' },
  { id: 'ak_gyr', label: 'Ak gyr' },
  { id: 'gara', label: 'Gara' },
  { id: 'sary_gula', label: 'Sary gula' },
  { id: 'dor', label: 'Dor' },
];

export const HorsesWorldScreen: React.FC = () => {
  const navigate = useNavigate();
  const { horses, complexes, stables, isHydrating } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoat, setSelectedCoat] = useState<CoatFilter>('all');
  const [selectedLine, setSelectedLine] = useState<string>('all');
  const [quickQrHorse, setQuickQrHorse] = useState<Horse | null>(null);
  const [copiedQuickCode, setCopiedQuickCode] = useState(false);

  const complexMap = useMemo(() => {
    const map = new Map<string, EquestrianComplex>();
    complexes.forEach((c) => map.set(c.id, c));
    return map;
  }, [complexes]);

  const stableMap = useMemo(() => {
    const map = new Map<string, string>();
    stables.forEach((s) => map.set(s.id, `${s.name} (${s.code})`));
    return map;
  }, [stables]);

  /** Tohum / nesil liniýalarynyň dinamiki sanawy */
  const lineageOptions = useMemo(() => {
    const unique = new Set<string>();
    horses.forEach((h) => unique.add(extractLineageLine(h.lineage)));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [horses]);

  const filteredHorses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return horses.filter((horse) => {
      if (selectedCoat !== 'all' && horse.coatColor !== selectedCoat) return false;
      if (selectedLine !== 'all' && extractLineageLine(horse.lineage) !== selectedLine) {
        return false;
      }
      if (!q) return true;
      return (
        horse.name.toLowerCase().includes(q) ||
        horse.breed.toLowerCase().includes(q) ||
        horse.coatLabel.toLowerCase().includes(q) ||
        horse.lineage.toLowerCase().includes(q) ||
        horse.seisName.toLowerCase().includes(q) ||
        horse.qrCodeId.toLowerCase().includes(q) ||
        (horse.story ?? '').toLowerCase().includes(q)
      );
    });
  }, [horses, searchQuery, selectedCoat, selectedLine]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 || selectedCoat !== 'all' || selectedLine !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCoat('all');
    setSelectedLine('all');
  };

  const openQuickQr = (e: React.MouseEvent, horse: Horse) => {
    e.stopPropagation();
    setCopiedQuickCode(false);
    setQuickQrHorse(horse);
  };

  const handleCopyQuickCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard fallback ignored
    }
    setCopiedQuickCode(true);
    window.setTimeout(() => setCopiedQuickCode(false), 2200);
  };

  const quickQrComplex = quickQrHorse ? complexMap.get(quickQrHorse.complexId) : undefined;
  const quickQrStableLabel = quickQrHorse ? stableMap.get(quickQrHorse.stableId) : undefined;

  return (
    <div className="space-y-6">
      {/* Ekran başlygy we gysgaça maglumat */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#059669]">
            Behişdi Bedewler Katalogy
          </p>
          <h1 className="font-display mt-1 text-2xl sm:text-3xl font-bold text-[#0F172A]">
            Atlar dünýäsi
          </h1>
          <p className="mt-1.5 text-sm text-[#415850] max-w-2xl leading-relaxed">
            Arassa ganly ahalteke bedewleriniň tohum liniýalary, reňkleri, animasiýaly awatarlary we
            taryhy maglumatlary. Doly nesil daragty we QR-pasporty görmek üçin bedew kartoçkasyna
            basyň.
          </p>
        </div>

        <div className="flex items-center gap-5 text-sm text-[#415850] shrink-0">
          <div>
            <span className="text-xs text-[#647A72] block">Jemi bedew</span>
            <span className="text-xl font-bold text-[#064E3B] font-mono tabular-nums">
              {horses.length}
            </span>
          </div>
          <div className="h-8 w-px bg-[#DCE6E1]" aria-hidden="true" />
          <div>
            <span className="text-xs text-[#647A72] block">Tohum liniýasy</span>
            <span className="text-xl font-bold text-[#064E3B] font-mono tabular-nums">
              {lineageOptions.length}
            </span>
          </div>
        </div>
      </div>

      {/* Gözleg, Tohum liniýasy we Reňk süzgüji */}
      <div className="bg-white border border-[#DCE6E1] rounded-2xl p-4 space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-3">
          <div className="relative">
            <Search
              className="w-4 h-4 text-[#647A72] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Bedewiň ady, seýisi, şejeresi ýa-da QR kody boýunça gözle..."
              aria-label="Bedew gözlegi"
              className="w-full min-h-[44px] pl-10 pr-10 py-2.5 text-sm bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F172A] placeholder:text-[#647A72] focus:outline-none focus:border-[#064E3B] focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Gözlegi arassalamak"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg text-[#647A72] hover:bg-[#EEF3F1] hover:text-[#064E3B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative">
            <GitBranch
              className="w-4 h-4 text-[#059669] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <select
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              aria-label="Tohum we nesil liniýasy boýunça süzgüç"
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 text-sm bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#064E3B] focus:bg-white transition-colors cursor-pointer"
            >
              <option value="all">Ähli tohum liniýalary (Arassa ganly Ahalteke)</option>
              {lineageOptions.map((line) => (
                <option key={line} value={line}>
                  {line}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Reňk süzgüji">
            {COAT_FILTER_OPTIONS.map((option) => {
              const isSelected = selectedCoat === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedCoat(option.id)}
                  className={[
                    'min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-[#064E3B] text-white'
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
              Süzgüji arassala ({filteredHorses.length}/{horses.length})
            </button>
          )}
        </div>
      </div>

      {/* Ýükleniş ýagdaýy */}
      {isHydrating && horses.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="bg-white border border-[#DCE6E1] rounded-2xl overflow-hidden animate-pulse"
            >
              <div className="h-52 bg-[#EEF3F1]" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-2/3 bg-[#EEF3F1] rounded" />
                <div className="h-3.5 w-1/2 bg-[#EEF3F1] rounded" />
                <div className="h-12 w-full bg-[#EEF3F1] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredHorses.length === 0 ? (
        <Card padding="lg" className="text-center bg-white">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#EEF3F1] flex items-center justify-center text-[#064E3B]">
            <Search className="w-6 h-6" />
          </div>
          <h2 className="font-display mt-4 text-lg font-bold text-[#0F172A]">
            Gözlegiňize laýyk bedew tapylmady
          </h2>
          <p className="mt-1.5 text-sm text-[#415850] max-w-md mx-auto">
            Saýlanan tohum liniýasyny, reňk süzgüjini ýa-da gözleg sözüni üýtgedip täzeden
            synanyşyň.
          </p>
          <div className="mt-5">
            <Button variant="outline" onClick={resetFilters}>
              Süzgüji arassala
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredHorses.map((horse) => {
            const healthMeta = HEALTH_STATUS_META[horse.healthStatus];
            const complex = complexMap.get(horse.complexId);
            const lineLabel = extractLineageLine(horse.lineage);

            return (
              <Card
                key={horse.id}
                padding="none"
                interactive
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/user/horses/${horse.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/user/horses/${horse.id}`);
                  }
                }}
                aria-label={`${horse.name} — Doly sahypany we nesil daragtyny açmak`}
                className="overflow-hidden flex flex-col group bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10B981]"
              >
                {/* Portret we animasiýaly awatar */}
                <div className="relative h-52 bg-[#064E3B] overflow-hidden">
                  <HorsePortrait
                    src={horse.portraitUrl}
                    alt={`${horse.name} — ${horse.breed}`}
                    className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-[#064E3B]/85 via-[#064E3B]/15 to-transparent"
                    aria-hidden="true"
                  />

                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-white/92 text-[#064E3B] text-[11px] font-semibold">
                    {lineLabel}
                  </div>

                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-[#064E3B]/88 text-[#D4AF37] text-[11px] font-mono tabular-nums tracking-wide">
                    {horse.qrCodeId}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-end gap-3">
                    <AnimatedHorseAvatar
                      src={horse.animatedAvatarUrl}
                      alt={`${horse.name} animasiýaly awatary`}
                      size="md"
                    />
                    <div className="min-w-0 flex-1 pb-0.5">
                      <h2 className="font-display text-lg font-bold text-white truncate leading-tight">
                        {horse.name}
                      </h2>
                      <p className="text-xs text-white/85 truncate mt-0.5">{horse.breed}</p>
                    </div>
                  </div>
                </div>

                {/* Maglumat mazmuny */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#415850]">
                    <span className="font-semibold text-[#064E3B]">{horse.coatLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{horse.ageYears} ýaş</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{horse.heightCm} sm</span>
                    <span aria-hidden="true">·</span>
                    <span>{GENDER_LABELS[horse.gender]}</span>
                  </div>

                  <p className="mt-3 text-sm text-[#415850] leading-relaxed line-clamp-3">
                    {horse.story ?? horse.healthSummary}
                  </p>

                  {complex && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-[#647A72]">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-[#059669]" aria-hidden="true" />
                      <span className="truncate">{complex.name}</span>
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-[#EEF3F1] flex items-center justify-between gap-2">
                    <span
                      className={[
                        'inline-flex items-center gap-1.5 text-xs font-semibold',
                        healthMeta.textColor,
                      ].join(' ')}
                    >
                      <span
                        className={['w-2 h-2 rounded-full shrink-0', healthMeta.dotColor].join(' ')}
                        aria-hidden="true"
                      />
                      <span className="truncate">{healthMeta.label}</span>
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => openQuickQr(e, horse)}
                        aria-label={`${horse.name} üçin çalt QR-pasporty açmak`}
                        className="inline-flex items-center gap-1 min-h-[34px] px-2.5 py-1 rounded-lg border border-[#DCE6E1] bg-[#F8FAF9] text-xs font-semibold text-[#064E3B] hover:border-[#064E3B] hover:bg-white transition-colors cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
                        Çalt QR
                      </button>

                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#064E3B] group-hover:text-[#059669] transition-colors">
                        Doly sahypa
                        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Çalt QR-Pasport Modaly */}
      <Modal
        isOpen={Boolean(quickQrHorse)}
        onClose={() => setQuickQrHorse(null)}
        title={quickQrHorse ? `${quickQrHorse.name} — Çalt QR-Pasport` : ''}
        subtitle={
          quickQrHorse
            ? `${quickQrHorse.breed} · ${quickQrHorse.coatLabel} · ${quickQrHorse.birthYear} ý.`
            : undefined
        }
        size="md"
        footer={
          quickQrHorse ? (
            <div className="flex flex-wrap items-center justify-end gap-2.5 w-full">
              <Button variant="outline" onClick={() => setQuickQrHorse(null)}>
                Ýap
              </Button>
              <Link
                to={`/user/horses/${quickQrHorse.id}`}
                onClick={() => setQuickQrHorse(null)}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#064E3B] text-white text-sm font-semibold hover:bg-[#04392B] transition-colors"
              >
                Doly sahypany we şejeräni aç
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          ) : undefined
        }
      >
        {quickQrHorse && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-[#F8FAF9] border border-[#DCE6E1]">
              <QrCodeGraphic code={quickQrHorse.qrCodeId} size="lg" />
              <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                <div className="flex items-center justify-center sm:justify-start gap-2.5">
                  <AnimatedHorseAvatar
                    src={quickQrHorse.animatedAvatarUrl}
                    alt={quickQrHorse.name}
                    size="sm"
                  />
                  <div className="min-w-0 text-left">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#059669]">
                      Sanly Pasport Kody
                    </p>
                    <p className="text-base font-bold font-mono tabular-nums text-[#064E3B]">
                      {quickQrHorse.qrCodeId}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[#415850]">
                  <strong className="text-[#0F172A]">Şejeresi:</strong> {quickQrHorse.lineage}
                </p>
                <p className="text-xs text-[#415850]">
                  <strong className="text-[#0F172A]">Seýis:</strong> {quickQrHorse.seisName}
                </p>

                <div className="pt-1">
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => handleCopyQuickCode(quickQrHorse.qrCodeId)}
                    leftIcon={
                      copiedQuickCode ? (
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      )
                    }
                  >
                    {copiedQuickCode ? 'Kod göçürildi' : 'Pasport koduny göçür'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-[#DCE6E1]">
                <p className="text-[#647A72] font-medium">Atçylyk sport toplumy</p>
                <p className="mt-1 font-semibold text-[#0F172A]">
                  {quickQrComplex?.name ?? quickQrHorse.ownerName}
                </p>
                {quickQrComplex && (
                  <p className="text-[#647A72] mt-0.5">{quickQrComplex.region}</p>
                )}
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-[#DCE6E1]">
                <p className="text-[#647A72] font-medium">Athana we saglyk</p>
                <p className="mt-1 font-semibold text-[#0F172A]">
                  {quickQrStableLabel ?? quickQrHorse.stableId}
                </p>
                <p className="text-[#059669] mt-0.5 font-medium">
                  {HEALTH_STATUS_META[quickQrHorse.healthStatus].label}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
