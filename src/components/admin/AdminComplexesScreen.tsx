import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Droplets,
  Edit3,
  MapPin,
  Plus,
  Search,
  Sun,
  Warehouse,
} from 'lucide-react';
import { useAppStore } from '../../store';
import type { EquestrianComplex, Stable } from '../../types';
import { Button, Card, Modal } from '../common';

type ComplexesViewTab = 'complexes' | 'stables';

const REGIONS = [
  'Aşgabat şäheri',
  'Arkadag şäheri',
  'Ahal welaýaty',
  'Balkan welaýaty',
  'Daşoguz welaýaty',
  'Lebap welaýaty',
  'Mary welaýaty',
];

const CERT_LEVELS: EquestrianComplex['ecoCertificationLevel'][] = [
  'Altyn Ýaşyl',
  'Zümrüt Ýaşyl',
  'Kümüş Ýaşyl',
];

export const AdminComplexesScreen: React.FC = () => {
  const { complexes, stables, staffAssignments, upsertComplex, upsertStable, isHydrating } =
    useAppStore();

  const [activeTab, setActiveTab] = useState<ComplexesViewTab>('complexes');
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [complexFilter, setComplexFilter] = useState('all');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Sport Toplumy CRUD Modaly
  const [complexModalOpen, setComplexModalOpen] = useState(false);
  const [editingComplexId, setEditingComplexId] = useState<string | undefined>(undefined);
  const [cmpName, setCmpName] = useState('');
  const [cmpRegion, setCmpRegion] = useState(REGIONS[0]);
  const [cmpAddress, setCmpAddress] = useState('');
  const [cmpSolarKw, setCmpSolarKw] = useState('240');
  const [cmpCert, setCmpCert] = useState<EquestrianComplex['ecoCertificationLevel']>('Zümrüt Ýaşyl');
  const [cmpDesc, setCmpDesc] = useState('');
  const [cmpSaving, setCmpSaving] = useState(false);
  const [cmpError, setCmpError] = useState<string | null>(null);

  // Athana CRUD Modaly
  const [stableModalOpen, setStableModalOpen] = useState(false);
  const [editingStableId, setEditingStableId] = useState<string | undefined>(undefined);
  const [stbComplexId, setStbComplexId] = useState('');
  const [stbName, setStbName] = useState('');
  const [stbCode, setStbCode] = useState('');
  const [stbBoxCount, setStbBoxCount] = useState('24');
  const [stbOccupiedBoxes, setStbOccupiedBoxes] = useState('18');
  const [stbRainwater, setStbRainwater] = useState('12000');
  const [stbHeadSeis, setStbHeadSeis] = useState('');
  const [stbSolarRoof, setStbSolarRoof] = useState(true);
  const [stbSaving, setStbSaving] = useState(false);
  const [stbError, setStbError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    window.setTimeout(() => {
      setFeedbackMsg((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  const complexById = useMemo(
    () => new Map(complexes.map((c) => [c.id, c])),
    [complexes]
  );

  const stablesCountByComplex = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of stables) {
      map.set(s.complexId, (map.get(s.complexId) ?? 0) + 1);
    }
    return map;
  }, [stables]);

  const staffCountByComplex = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of staffAssignments) {
      if (a.status === 'işjeň') {
        map.set(a.complexId, (map.get(a.complexId) ?? 0) + 1);
      }
    }
    return map;
  }, [staffAssignments]);

  const filteredComplexes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return complexes.filter((c) => {
      if (regionFilter !== 'all' && c.region !== regionFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
      );
    });
  }, [complexes, regionFilter, searchQuery]);

  const filteredStables = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return stables.filter((s) => {
      if (complexFilter !== 'all' && s.complexId !== complexFilter) return false;
      if (!q) return true;
      const cmpNameLookup = complexById.get(s.complexId)?.name ?? '';
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.headSeisName.toLowerCase().includes(q) ||
        cmpNameLookup.toLowerCase().includes(q)
      );
    });
  }, [stables, complexFilter, searchQuery, complexById]);

  const openComplexModal = (complex?: EquestrianComplex) => {
    setCmpError(null);
    if (complex) {
      setEditingComplexId(complex.id);
      setCmpName(complex.name);
      setCmpRegion(complex.region);
      setCmpAddress(complex.address);
      setCmpSolarKw(String(complex.solarCapacityKw));
      setCmpCert(complex.ecoCertificationLevel);
      setCmpDesc(complex.description);
    } else {
      setEditingComplexId(undefined);
      setCmpName('');
      setCmpRegion(REGIONS[0]);
      setCmpAddress('');
      setCmpSolarKw('240');
      setCmpCert('Zümrüt Ýaşyl');
      setCmpDesc('');
    }
    setComplexModalOpen(true);
  };

  const handleSaveComplex = async (e: React.FormEvent) => {
    e.preventDefault();
    setCmpError(null);
    setCmpSaving(true);
    try {
      await upsertComplex({
        id: editingComplexId,
        name: cmpName,
        region: cmpRegion,
        address: cmpAddress,
        solarCapacityKw: Number(cmpSolarKw),
        ecoCertificationLevel: cmpCert,
        description: cmpDesc,
      });
      setComplexModalOpen(false);
      showToast(
        editingComplexId
          ? `«${cmpName.trim()}» toplumynyň maglumatlary täzelendi.`
          : `«${cmpName.trim()}» täze atçylyk sport toplumy döredildi.`
      );
    } catch (err) {
      setCmpError(err instanceof Error ? err.message : 'Toplumy saklamakda säwlik ýüze çykdy.');
    } finally {
      setCmpSaving(false);
    }
  };

  const openStableModal = (stable?: Stable, presetComplexId?: string) => {
    setStbError(null);
    if (stable) {
      setEditingStableId(stable.id);
      setStbComplexId(stable.complexId);
      setStbName(stable.name);
      setStbCode(stable.code);
      setStbBoxCount(String(stable.boxCount));
      setStbOccupiedBoxes(String(stable.occupiedBoxes));
      setStbRainwater(String(stable.rainwaterHarvestingLiters));
      setStbHeadSeis(stable.headSeisName);
      setStbSolarRoof(stable.solarRoofEnabled);
    } else {
      setEditingStableId(undefined);
      setStbComplexId(presetComplexId ?? complexes[0]?.id ?? '');
      setStbName('');
      setStbCode('');
      setStbBoxCount('24');
      setStbOccupiedBoxes('16');
      setStbRainwater('12000');
      setStbHeadSeis('');
      setStbSolarRoof(true);
    }
    setStableModalOpen(true);
  };

  const handleSaveStable = async (e: React.FormEvent) => {
    e.preventDefault();
    setStbError(null);
    setStbSaving(true);
    try {
      await upsertStable({
        id: editingStableId,
        complexId: stbComplexId,
        name: stbName,
        code: stbCode,
        boxCount: Number(stbBoxCount),
        occupiedBoxes: Number(stbOccupiedBoxes),
        rainwaterHarvestingLiters: Number(stbRainwater),
        headSeisName: stbHeadSeis,
        solarRoofEnabled: stbSolarRoof,
      });
      setStableModalOpen(false);
      showToast(
        editingStableId
          ? `«${stbName.trim()}» athanasynyň maglumatlary täzelendi.`
          : `«${stbName.trim()}» täze athanasy goşuldy — Ýaşyl Reýtingde we işgär saýlawynda elýeterli.`
      );
    } catch (err) {
      setStbError(err instanceof Error ? err.message : 'Athanany saklamakda säwlik ýüze çykdy.');
    } finally {
      setStbSaving(false);
    }
  };

  const totalBoxes = stables.reduce((sum, s) => sum + s.boxCount, 0);
  const occupiedBoxes = stables.reduce((sum, s) => sum + s.occupiedBoxes, 0);
  const solarStablesCount = stables.filter((s) => s.solarRoofEnabled).length;

  if (isHydrating && complexes.length === 0) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-9 w-80 rounded-xl bg-[#E6EFEA] animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-white border border-[#DCE6E1] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sözbaşy we Çalt Hereketler */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#059669]">
            Infrastruktura Dolandyryşy · Doly CRUD
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A] leading-tight text-balance">
            Atçylyk Sport Toplumlary we Athanalar
          </h1>
          <p className="text-sm text-[#415850] max-w-2xl">
            Täze atçylyk sport toplumlaryny we eko-athanalary goşuň, boks sygymyny, gün panellerini
            hem-de ýagyş suwy howdanlaryny redaktirläň.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Building2 className="w-4 h-4" />}
            onClick={() => openComplexModal()}
          >
            Täze toplum goş
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => openStableModal()}
          >
            Täze athana goş
          </Button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          role="status"
          className="rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] px-4 py-3 flex items-center gap-2.5 text-sm text-[#064E3B]"
        >
          <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" aria-hidden="true" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Jemleýji KPI Kartoçkalary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" className="bg-white space-y-1">
          <p className="text-xs font-medium text-[#647A72]">Sport Toplumlary</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#0F172A]">
            {complexes.length}
          </p>
          <p className="text-xs text-[#415850]">Ähli welaýatlar we şäherler</p>
        </Card>
        <Card padding="md" className="bg-white space-y-1">
          <p className="text-xs font-medium text-[#647A72]">Hasaba alnan Athanalar</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#0F172A]">
            {stables.length}
          </p>
          <p className="text-xs text-[#059669] font-mono tabular-nums">
            {solarStablesCount} gün üçekli athana
          </p>
        </Card>
        <Card padding="md" className="bg-white space-y-1">
          <p className="text-xs font-medium text-[#647A72]">Boks Sygymy / Dolulygy</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#064E3B]">
            {occupiedBoxes} / {totalBoxes}
          </p>
          <p className="text-xs text-[#415850] font-mono tabular-nums">
            {totalBoxes > 0 ? Math.round((occupiedBoxes / totalBoxes) * 100) : 0}% meşgul
          </p>
        </Card>
        <Card padding="md" className="bg-white space-y-1">
          <p className="text-xs font-medium text-[#647A72]">Jemi Gün Kuwwaty</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#0F172A]">
            {complexes.reduce((sum, c) => sum + c.solarCapacityKw, 0)} kWt
          </p>
          <p className="text-xs text-[#415850]">«Ýaşyl Athana» ulgamy</p>
        </Card>
      </div>

      {/* Bölüm Geçişi we Süzgüçler */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Infrastruktura bölümleri"
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#EEF3F1] self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'complexes'}
            onClick={() => {
              setActiveTab('complexes');
              setSearchQuery('');
            }}
            className={[
              'min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap',
              activeTab === 'complexes'
                ? 'bg-white text-[#064E3B] shadow-xs'
                : 'text-[#415850] hover:text-[#0F172A]',
            ].join(' ')}
          >
            <Building2 className="w-4 h-4 text-[#059669]" aria-hidden="true" />
            <span>Sport Toplumlary ({complexes.length})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'stables'}
            onClick={() => {
              setActiveTab('stables');
              setSearchQuery('');
            }}
            className={[
              'min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap',
              activeTab === 'stables'
                ? 'bg-white text-[#064E3B] shadow-xs'
                : 'text-[#415850] hover:text-[#0F172A]',
            ].join(' ')}
          >
            <Warehouse className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
            <span>Athanalar ({stables.length})</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative">
            <Search
              className="w-4 h-4 text-[#647A72] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'complexes'
                  ? 'Toplum ýa-da welaýat gözle...'
                  : 'Athana, kod ýa-da seýis gözle...'
              }
              aria-label="Gözleg"
              className="w-full sm:w-64 min-h-[42px] pl-9 pr-3 rounded-xl bg-white border border-[#DCE6E1] text-xs sm:text-sm text-[#0F172A] placeholder:text-[#647A72] focus:outline-2 focus:outline-[#10B981]"
            />
          </div>

          {activeTab === 'complexes' ? (
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              aria-label="Welaýat süzgüji"
              className="min-h-[42px] px-3 rounded-xl bg-white border border-[#DCE6E1] text-xs sm:text-sm text-[#0F172A] focus:outline-2 focus:outline-[#10B981] cursor-pointer"
            >
              <option value="all">Ähli welaýatlar</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={complexFilter}
              onChange={(e) => setComplexFilter(e.target.value)}
              aria-label="Toplum süzgüji"
              className="min-h-[42px] px-3 rounded-xl bg-white border border-[#DCE6E1] text-xs sm:text-sm text-[#0F172A] focus:outline-2 focus:outline-[#10B981] cursor-pointer"
            >
              <option value="all">Ähli sport toplumlary</option>
              {complexes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* TAB 1: ATÇYLYK SPORT TOPLUMLARY */}
      {activeTab === 'complexes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredComplexes.length === 0 ? (
            <Card padding="lg" className="lg:col-span-2 bg-white text-center space-y-3">
              <Building2 className="w-8 h-8 text-[#647A72] mx-auto" aria-hidden="true" />
              <p className="text-sm font-semibold text-[#0F172A]">
                Süzgüje laýyk sport toplumy tapylmady
              </p>
              <Button variant="primary" size="sm" onClick={() => openComplexModal()}>
                Täze toplum goş
              </Button>
            </Card>
          ) : (
            filteredComplexes.map((complex) => {
              const linkedStables = stablesCountByComplex.get(complex.id) ?? 0;
              const linkedStaff = staffCountByComplex.get(complex.id) ?? 0;
              return (
                <Card
                  key={complex.id}
                  padding="md"
                  className="bg-white flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <p className="text-xs font-semibold text-[#059669] flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>{complex.region}</span>
                        </p>
                        <h2 className="font-display text-lg font-bold text-[#0F172A] leading-snug">
                          {complex.name}
                        </h2>
                      </div>
                      <span className="text-xs font-bold text-[#D4AF37] shrink-0 whitespace-nowrap">
                        {complex.ecoCertificationLevel}
                      </span>
                    </div>

                    <p className="text-xs text-[#647A72]">{complex.address}</p>
                    <p className="text-xs sm:text-sm text-[#415850] leading-relaxed">
                      {complex.description}
                    </p>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#EEF3F1] text-xs">
                      <div>
                        <p className="text-[#647A72]">Athanalar</p>
                        <p className="font-mono tabular-nums font-bold text-[#0F172A]">
                          {linkedStables} (jemi {complex.totalStables})
                        </p>
                      </div>
                      <div>
                        <p className="text-[#647A72]">Gün kuwwaty</p>
                        <p className="font-mono tabular-nums font-bold text-[#064E3B]">
                          {complex.solarCapacityKw} kWt
                        </p>
                      </div>
                      <div>
                        <p className="text-[#647A72]">Işjeň işgär</p>
                        <p className="font-mono tabular-nums font-bold text-[#0F172A]">
                          {linkedStaff}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#EEF3F1] flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setComplexFilter(complex.id);
                        setActiveTab('stables');
                      }}
                      className="min-h-[38px] px-3 rounded-lg text-xs font-semibold text-[#064E3B] bg-[#ECFDF5] hover:bg-[#D1FAE5] transition-colors cursor-pointer"
                    >
                      Athanalary gör ({linkedStables})
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openStableModal(undefined, complex.id)}
                        className="min-h-[38px] px-3 rounded-lg text-xs font-semibold text-[#064E3B] hover:bg-[#EEF3F1] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                        Athana goş
                      </button>
                      <button
                        type="button"
                        onClick={() => openComplexModal(complex)}
                        className="min-h-[38px] px-3 rounded-lg text-xs font-semibold text-[#064E3B] hover:bg-[#ECFDF5] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                        Üýtget
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: ATHANALAR */}
      {activeTab === 'stables' && (
        <Card padding="none" className="bg-white overflow-hidden">
          {filteredStables.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <Warehouse className="w-8 h-8 text-[#647A72] mx-auto" aria-hidden="true" />
              <p className="text-sm font-semibold text-[#0F172A]">
                Saýlanan süzgüç boýunça athana tapylmady
              </p>
              <Button variant="primary" size="sm" onClick={() => openStableModal()}>
                Täze athana goş
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[820px]">
                <thead>
                  <tr className="bg-[#F8FAF9] border-b border-[#DCE6E1] text-[11px] font-semibold text-[#647A72]">
                    <th className="py-3 pl-6 pr-3">Athana we Kod</th>
                    <th className="py-3 px-3">Sport Toplumy</th>
                    <th className="py-3 px-3">Baş Seýis</th>
                    <th className="py-3 px-3 text-right">Boks Dolulygy</th>
                    <th className="py-3 px-3 text-right">Ýagyş suwy (L)</th>
                    <th className="py-3 px-3">Eko-Üpjünçilik</th>
                    <th className="py-3 pl-3 pr-6 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF3F1] text-sm">
                  {filteredStables.map((stable) => {
                    const complex = complexById.get(stable.complexId);
                    return (
                      <tr key={stable.id} className="hover:bg-[#F8FAF9] transition-colors">
                        <td className="py-3.5 pl-6 pr-3">
                          <p className="font-semibold text-[#0F172A]">{stable.name}</p>
                          <p className="text-xs font-mono text-[#647A72]">{stable.code}</p>
                        </td>
                        <td className="py-3.5 px-3">
                          <p className="text-xs sm:text-sm font-medium text-[#0F172A]">
                            {complex?.name ?? 'Atçylyk Toplumy'}
                          </p>
                          <p className="text-xs text-[#647A72]">{complex?.region ?? '—'}</p>
                        </td>
                        <td className="py-3.5 px-3 text-xs sm:text-sm text-[#415850]">
                          {stable.headSeisName}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums text-xs sm:text-sm text-[#0F172A]">
                          {stable.occupiedBoxes} / {stable.boxCount}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono tabular-nums text-xs sm:text-sm text-[#064E3B]">
                          <span className="inline-flex items-center gap-1">
                            <Droplets className="w-3.5 h-3.5 text-[#059669]" aria-hidden="true" />
                            {stable.rainwaterHarvestingLiters.toLocaleString('en-US').replace(/,/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-xs">
                          <span
                            className={[
                              'font-semibold inline-flex items-center gap-1',
                              stable.solarRoofEnabled ? 'text-[#059669]' : 'text-[#647A72]',
                            ].join(' ')}
                          >
                            <Sun className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                            {stable.solarRoofEnabled ? 'Gün panelli' : 'Adaty üçek'}
                          </span>
                        </td>
                        <td className="py-3.5 pl-3 pr-6 text-right">
                          <button
                            type="button"
                            onClick={() => openStableModal(stable)}
                            className="min-h-[38px] px-3 rounded-lg text-xs font-semibold text-[#064E3B] hover:bg-[#ECFDF5] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                            Üýtget
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* MODAL: Sport Toplumy Goşmak / Üýtgetmek */}
      <Modal
        isOpen={complexModalOpen}
        onClose={() => setComplexModalOpen(false)}
        title={
          editingComplexId
            ? 'Atçylyk Sport Toplumyny Redaktirlemek'
            : 'Täze Atçylyk Sport Toplumyny Goşmak'
        }
        subtitle="Täze toplum ähli Admin gözegçilik we Işgär saýlaw ekranlarynda dessine elýeterli bolar."
        size="md"
      >
        <form onSubmit={handleSaveComplex} className="space-y-4">
          {cmpError && (
            <div
              role="alert"
              className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-3.5 py-2.5 flex items-start gap-2 text-xs text-[#991B1B]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{cmpError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="cmp-name" className="block text-xs font-semibold text-[#415850]">
              Sport toplumynyň ady
            </label>
            <input
              id="cmp-name"
              type="text"
              value={cmpName}
              onChange={(e) => setCmpName(e.target.value)}
              placeholder="Mysal: Balkan Eko-Atçylyk Sport Toplumy"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label htmlFor="cmp-region" className="block text-xs font-semibold text-[#415850]">
                Welaýat / Şäher
              </label>
              <select
                id="cmp-region"
                value={cmpRegion}
                onChange={(e) => setCmpRegion(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cmp-cert" className="block text-xs font-semibold text-[#415850]">
                Eko-sertifikat derejesi
              </label>
              <select
                id="cmp-cert"
                value={cmpCert}
                onChange={(e) =>
                  setCmpCert(e.target.value as EquestrianComplex['ecoCertificationLevel'])
                }
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              >
                {CERT_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label htmlFor="cmp-address" className="block text-xs font-semibold text-[#415850]">
                Salgysy
              </label>
              <input
                id="cmp-address"
                type="text"
                value={cmpAddress}
                onChange={(e) => setCmpAddress(e.target.value)}
                placeholder="Arkadag şäheri, Ahalteke şaýoly 14"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cmp-solar" className="block text-xs font-semibold text-[#415850]">
                Gün energiýasy kuwwaty (kWt)
              </label>
              <input
                id="cmp-solar"
                type="number"
                min={20}
                max={2000}
                value={cmpSolarKw}
                onChange={(e) => setCmpSolarKw(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm font-mono tabular-nums text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cmp-desc" className="block text-xs font-semibold text-[#415850]">
              Gysgaça düşündiriş
            </label>
            <textarea
              id="cmp-desc"
              rows={3}
              value={cmpDesc}
              onChange={(e) => setCmpDesc(e.target.value)}
              placeholder="Toplumyň aýratynlyklary, eko-tehnologiýalary we türgenleşik meýdançalary..."
              className="w-full p-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#EEF3F1]">
            <Button type="button" variant="ghost" onClick={() => setComplexModalOpen(false)}>
              Ýatyr
            </Button>
            <Button type="submit" variant="primary" loading={cmpSaving}>
              {editingComplexId ? 'Toplumy täzele' : 'Toplumy döret'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Athana Goşmak / Üýtgetmek */}
      <Modal
        isOpen={stableModalOpen}
        onClose={() => setStableModalOpen(false)}
        title={editingStableId ? 'Athanany Redaktirlemek' : 'Täze Athana Goşmak'}
        subtitle="Goşulan athana Ýaşyl Reýting tablisasynda we işgär bellemelerinde derrew görünýär."
        size="md"
      >
        <form onSubmit={handleSaveStable} className="space-y-4">
          {stbError && (
            <div
              role="alert"
              className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-3.5 py-2.5 flex items-start gap-2 text-xs text-[#991B1B]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{stbError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="stb-complex" className="block text-xs font-semibold text-[#415850]">
              Atçylyk Sport Toplumy
            </label>
            <select
              id="stb-complex"
              value={stbComplexId}
              onChange={(e) => setStbComplexId(e.target.value)}
              className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              required
            >
              {complexes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.region})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label htmlFor="stb-name" className="block text-xs font-semibold text-[#415850]">
                Athananyň ady
              </label>
              <input
                id="stb-name"
                type="text"
                value={stbName}
                onChange={(e) => setStbName(e.target.value)}
                placeholder="Mysal: «Ýaşyl Bedew» 3-nji Athana"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="stb-code" className="block text-xs font-semibold text-[#415850]">
                Athana kody
              </label>
              <input
                id="stb-code"
                type="text"
                value={stbCode}
                onChange={(e) => setStbCode(e.target.value)}
                placeholder="ATH-ARK-03"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm font-mono uppercase text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <label htmlFor="stb-boxes" className="block text-xs font-semibold text-[#415850]">
                Jemi boks
              </label>
              <input
                id="stb-boxes"
                type="number"
                min={4}
                max={80}
                value={stbBoxCount}
                onChange={(e) => setStbBoxCount(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm font-mono tabular-nums text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="stb-occ" className="block text-xs font-semibold text-[#415850]">
                Eýelenen boks
              </label>
              <input
                id="stb-occ"
                type="number"
                min={0}
                max={80}
                value={stbOccupiedBoxes}
                onChange={(e) => setStbOccupiedBoxes(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm font-mono tabular-nums text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="stb-rain" className="block text-xs font-semibold text-[#415850]">
                Ýagyş suwy (L)
              </label>
              <input
                id="stb-rain"
                type="number"
                min={1000}
                max={100000}
                value={stbRainwater}
                onChange={(e) => setStbRainwater(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm font-mono tabular-nums text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="stb-seis" className="block text-xs font-semibold text-[#415850]">
              Jogapkär Baş Seýis
            </label>
            <input
              id="stb-seis"
              type="text"
              value={stbHeadSeis}
              onChange={(e) => setStbHeadSeis(e.target.value)}
              placeholder="Mysal: Berdimyrat Seýisow"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              required
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={stbSolarRoof}
              onChange={(e) => setStbSolarRoof(e.target.checked)}
              className="w-4 h-4 accent-[#064E3B] rounded cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-[#0F172A]">
              Gün panelli üçek we akylly yşyklandyryş enjamlaşdyrylan
            </span>
          </label>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#EEF3F1]">
            <Button type="button" variant="ghost" onClick={() => setStableModalOpen(false)}>
              Ýatyr
            </Button>
            <Button type="submit" variant="primary" loading={stbSaving}>
              {editingStableId ? 'Athanany täzele' : 'Athanany goş'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
