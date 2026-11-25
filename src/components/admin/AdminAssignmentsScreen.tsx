import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Edit3,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
  Warehouse,
} from 'lucide-react';
import { STAFF_POSITIONS } from '../../mockData';
import {
  createStableAdmin,
  deleteStaffAssignment,
  fetchComplexes,
  fetchStables,
  fetchStaffAssignments,
  saveStaffAssignment,
} from '../../services';
import type {
  EquestrianComplex,
  Stable,
  StaffAssignment,
  StaffPosition,
} from '../../types';
import { Button, Card, Modal } from '../common';

export const AdminAssignmentsScreen: React.FC = () => {
  const [complexes, setComplexes] = useState<EquestrianComplex[]>([]);
  const [stables, setStables] = useState<Stable[]>([]);
  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const [complexFilter, setComplexFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Täze athana goşmak modaly
  const [stableModalOpen, setStableModalOpen] = useState(false);
  const [stableComplexId, setStableComplexId] = useState('');
  const [stableName, setStableName] = useState('');
  const [stableCode, setStableCode] = useState('');
  const [stableBoxCount, setStableBoxCount] = useState('20');
  const [stableOccupiedBoxes, setStableOccupiedBoxes] = useState('14');
  const [stableRainwater, setStableRainwater] = useState('11500');
  const [stableHeadSeis, setStableHeadSeis] = useState('');
  const [stableSolarEnabled, setStableSolarEnabled] = useState(true);
  const [stableSaving, setStableSaving] = useState(false);
  const [stableError, setStableError] = useState<string | null>(null);

  // Işgär bellemek / redaktirlemek modaly
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | undefined>(undefined);
  const [staffName, setStaffName] = useState('');
  const [staffPosition, setStaffPosition] = useState<StaffPosition>('Baş Seýis / Seýis');
  const [staffContact, setStaffContact] = useState('');
  const [staffComplexId, setStaffComplexId] = useState('');
  const [staffStableId, setStaffStableId] = useState('');
  const [staffStatus, setStaffStatus] = useState<'işjeň' | 'dynç_alyşda'>('işjeň');
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);

  // Pozmak tassyklama modaly
  const [deleteTarget, setDeleteTarget] = useState<StaffAssignment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cmpRes, stbRes, asgRes] = await Promise.all([
        fetchComplexes(),
        fetchStables(),
        fetchStaffAssignments(),
      ]);
      setComplexes(cmpRes.data);
      setStables(stbRes.data);
      setAssignments(asgRes.data);
      if (cmpRes.data.length > 0) {
        setStableComplexId((prev) => prev || cmpRes.data[0].id);
        setStaffComplexId((prev) => prev || cmpRes.data[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    window.setTimeout(() => {
      setFeedbackMsg((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  const complexMap = useMemo(
    () => new Map(complexes.map((c) => [c.id, c])),
    [complexes]
  );

  const stableMap = useMemo(
    () => new Map(stables.map((s) => [s.id, s])),
    [stables]
  );

  const stablesForStaffForm = useMemo(
    () => stables.filter((s) => s.complexId === staffComplexId),
    [stables, staffComplexId]
  );

  useEffect(() => {
    if (!staffModalOpen) return;
    if (stablesForStaffForm.length > 0 && !stablesForStaffForm.some((s) => s.id === staffStableId)) {
      setStaffStableId(stablesForStaffForm[0].id);
    }
  }, [staffComplexId, stablesForStaffForm, staffStableId, staffModalOpen]);

  const filteredStables = useMemo(() => {
    return stables.filter(
      (s) => complexFilter === 'all' || s.complexId === complexFilter
    );
  }, [stables, complexFilter]);

  const filteredAssignments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return assignments.filter((item) => {
      if (complexFilter !== 'all' && item.complexId !== complexFilter) return false;
      if (!q) return true;
      const complexName = complexMap.get(item.complexId)?.name.toLowerCase() ?? '';
      const stableName = stableMap.get(item.stableId)?.name.toLowerCase() ?? '';
      return (
        item.fullName.toLowerCase().includes(q) ||
        item.position.toLowerCase().includes(q) ||
        item.emailOrPhone.toLowerCase().includes(q) ||
        complexName.includes(q) ||
        stableName.includes(q)
      );
    });
  }, [assignments, complexFilter, searchQuery, complexMap, stableMap]);

  const openNewStableModal = () => {
    const defaultComplex = complexFilter !== 'all' ? complexFilter : complexes[0]?.id ?? '';
    setStableComplexId(defaultComplex);
    setStableName('');
    setStableCode('');
    setStableBoxCount('20');
    setStableOccupiedBoxes('14');
    setStableRainwater('11500');
    setStableHeadSeis('');
    setStableSolarEnabled(true);
    setStableError(null);
    setStableModalOpen(true);
  };

  const handleCreateStableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStableError(null);
    setStableSaving(true);
    try {
      const res = await createStableAdmin({
        complexId: stableComplexId,
        name: stableName,
        code: stableCode,
        boxCount: Number(stableBoxCount),
        occupiedBoxes: Number(stableOccupiedBoxes),
        solarRoofEnabled: stableSolarEnabled,
        rainwaterHarvestingLiters: Number(stableRainwater),
        headSeisName: stableHeadSeis,
      });
      const [cmpRes, stbRes] = await Promise.all([fetchComplexes(), fetchStables()]);
      setComplexes(cmpRes.data);
      setStables(stbRes.data);
      setStableModalOpen(false);
      showToast(
        `«${res.data.name}» goşuldy — Işgär girişinde we Umumy Gözegçilikde derrew elýeterli.`
      );
    } catch (err) {
      setStableError(err instanceof Error ? err.message : 'Athana goşmakda säwlik ýüze çykdy.');
    } finally {
      setStableSaving(false);
    }
  };

  const openStaffModal = (assignment?: StaffAssignment) => {
    setStaffError(null);
    if (assignment) {
      setEditingStaffId(assignment.id);
      setStaffName(assignment.fullName);
      setStaffPosition(assignment.position);
      setStaffContact(assignment.emailOrPhone);
      setStaffComplexId(assignment.complexId);
      setStaffStableId(assignment.stableId);
      setStaffStatus(assignment.status);
    } else {
      const defaultComplexId =
        complexFilter !== 'all' ? complexFilter : complexes[0]?.id ?? '';
      const matchingStables = stables.filter((s) => s.complexId === defaultComplexId);
      setEditingStaffId(undefined);
      setStaffName('');
      setStaffPosition('Baş Seýis / Seýis');
      setStaffContact('');
      setStaffComplexId(defaultComplexId);
      setStaffStableId(matchingStables[0]?.id ?? '');
      setStaffStatus('işjeň');
    }
    setStaffModalOpen(true);
  };

  const handleSaveStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError(null);
    setStaffSaving(true);
    try {
      const res = await saveStaffAssignment({
        id: editingStaffId,
        fullName: staffName,
        position: staffPosition,
        emailOrPhone: staffContact,
        complexId: staffComplexId,
        stableId: staffStableId,
        status: staffStatus,
      });
      setAssignments(res.data);
      setStaffModalOpen(false);
      showToast(
        editingStaffId
          ? 'Işgäriň toplum we athana jogapkärçiligi täzelendi.'
          : 'Täze işgär üstünlikli berkidildi.'
      );
    } catch (err) {
      setStaffError(err instanceof Error ? err.message : 'Işgäri saklamakda säwlik ýüze çykdy.');
    } finally {
      setStaffSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await deleteStaffAssignment(deleteTarget.id);
      setAssignments(res.data);
      showToast(`${deleteTarget.fullName} sanawdan aýryldy.`);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-9 w-80 rounded-xl bg-[#E6EFEA] animate-pulse" />
        <div className="h-44 rounded-2xl bg-white border border-[#DCE6E1] animate-pulse" />
        <div className="h-72 rounded-2xl bg-white border border-[#DCE6E1] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sözbaşy we Esasy Hereketler */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#059669]">
            Infrastruktura we Kadrlar · CRUD Dolandyryş
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F241D] leading-tight text-balance">
            Toplumlar, Athanalar we Işgärler
          </h1>
          <p className="text-sm text-[#415850] max-w-2xl">
            Täze «Ýaşyl Athana» bloklaryny goşuň hem-de seýis, weterinar we eko-inženerleri degişli
            atçylyk sport toplumyna jogapkär edip belläň.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openNewStableModal}
          >
            Täze athana goş
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => openStaffModal()}
          >
            Işgär belle
          </Button>
        </div>
      </div>

      {/* Üstünlik habarnamasy */}
      {feedbackMsg && (
        <div
          role="status"
          className="rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] px-4 py-3 flex items-center gap-2.5 text-sm text-[#064E3B]"
        >
          <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" aria-hidden="true" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Toplum Süzgüji */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setComplexFilter('all')}
          className={[
            'min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
            complexFilter === 'all'
              ? 'bg-[#064E3B] text-white'
              : 'bg-white border border-[#DCE6E1] text-[#415850] hover:border-[#064E3B]/40',
          ].join(' ')}
        >
          Ähli toplumlar ({complexes.length})
        </button>
        {complexes.map((cmp) => {
          const isSelected = complexFilter === cmp.id;
          return (
            <button
              key={cmp.id}
              type="button"
              onClick={() => setComplexFilter(cmp.id)}
              className={[
                'min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                isSelected
                  ? 'bg-[#064E3B] text-white'
                  : 'bg-white border border-[#DCE6E1] text-[#415850] hover:border-[#064E3B]/40',
              ].join(' ')}
            >
              {cmp.region.split('/')[0].trim()}
            </button>
          );
        })}
      </div>

      {/* Athanalar Sanawy */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-[#0F241D] flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-[#064E3B]" aria-hidden="true" />
            <span>Hasaba Alnan Athanalar</span>
            <span className="font-mono text-xs font-medium text-[#647A72] tabular-nums">
              ({filteredStables.length})
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStables.map((stable) => {
            const complex = complexMap.get(stable.complexId);
            const occupancyPct = Math.round((stable.occupiedBoxes / Math.max(stable.boxCount, 1)) * 100);
            return (
              <Card key={stable.id} padding="md" className="bg-white space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-[#647A72]">
                      {stable.code} · {stable.solarRoofEnabled ? 'Gün üçekli' : 'Adaty'}
                    </p>
                    <h3 className="font-display text-base font-bold text-[#0F241D] truncate mt-0.5">
                      {stable.name}
                    </h3>
                  </div>
                  <span className="font-mono tabular-nums text-xs font-semibold text-[#064E3B] shrink-0">
                    {stable.occupiedBoxes}/{stable.boxCount} boks
                  </span>
                </div>

                <p className="text-xs text-[#415850] flex items-center gap-1.5 truncate">
                  <Building2 className="w-3.5 h-3.5 text-[#059669] shrink-0" aria-hidden="true" />
                  <span className="truncate">{complex?.name ?? 'Atçylyk Toplumy'}</span>
                </p>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#647A72]">
                    <span>Baş jogapkär: {stable.headSeisName}</span>
                    <span className="font-mono tabular-nums">{occupancyPct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#E6EFEA] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#10B981]"
                      style={{ width: `${Math.min(100, occupancyPct)}%` }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Işgär Bellemeleri Tablisasy (CRUD) */}
      <Card padding="none" className="bg-white overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#DCE6E1] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[#0F241D] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#064E3B]" aria-hidden="true" />
              <span>Işgär Jogapkärçilik Sanawy</span>
            </h2>
            <p className="text-xs text-[#647A72] mt-0.5 tabular-nums">
              Jemi {filteredAssignments.length} işgär · Toplum, athana we wezipe boýunça dolandyryş
            </p>
          </div>

          <div className="relative">
            <Search
              className="w-4 h-4 text-[#647A72] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Işgär, wezipe ýa-da athana gözle..."
              aria-label="Işgär gözlegi"
              className="w-full sm:w-64 min-h-[42px] pl-9 pr-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-xs sm:text-sm text-[#0F241D] placeholder:text-[#647A72] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
            />
          </div>
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Users className="w-8 h-8 text-[#647A72] mx-auto" aria-hidden="true" />
            <p className="text-sm font-semibold text-[#0F241D]">
              Saýlanan şertlere gabat gelýän işgär tapylmady
            </p>
            <Button variant="primary" size="sm" onClick={() => openStaffModal()}>
              Täze işgär belle
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-[#F8FAF9] border-b border-[#DCE6E1] text-[11px] font-semibold text-[#647A72]">
                  <th className="py-3 pl-6 pr-3">Işgär we Aragtnaşyk</th>
                  <th className="py-3 px-3">Wezipe</th>
                  <th className="py-3 px-3">Atçylyk Sport Toplumy</th>
                  <th className="py-3 px-3">Jogapkär Athana</th>
                  <th className="py-3 px-3">Ýagdaýy</th>
                  <th className="py-3 pl-3 pr-6 text-right">Hereketler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF3F1] text-sm">
                {filteredAssignments.map((item) => {
                  const complex = complexMap.get(item.complexId);
                  const stable = stableMap.get(item.stableId);
                  return (
                    <tr key={item.id} className="hover:bg-[#F8FAF9] transition-colors">
                      <td className="py-3.5 pl-6 pr-3">
                        <p className="font-semibold text-[#0F241D]">{item.fullName}</p>
                        <p className="text-xs text-[#647A72] font-mono">{item.emailOrPhone}</p>
                      </td>
                      <td className="py-3.5 px-3 text-xs sm:text-sm text-[#415850]">
                        {item.position}
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="text-xs sm:text-sm font-medium text-[#0F241D]">
                          {complex?.name ?? 'Toplum'}
                        </p>
                        <p className="text-xs text-[#647A72]">{complex?.region}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="text-xs sm:text-sm font-semibold text-[#064E3B]">
                          {stable?.name ?? 'Athana'}
                        </p>
                        <p className="text-xs text-[#647A72] font-mono">{stable?.code}</p>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={[
                            'text-xs font-semibold',
                            item.status === 'işjeň' ? 'text-[#059669]' : 'text-[#B45309]',
                          ].join(' ')}
                        >
                          {item.status === 'işjeň' ? 'Işjeň' : 'Dynç alyşda'}
                        </span>
                      </td>
                      <td className="py-3.5 pl-3 pr-6 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openStaffModal(item)}
                            aria-label={`${item.fullName} bellemäni üýtget`}
                            className="min-h-[38px] px-2.5 rounded-lg text-xs font-semibold text-[#064E3B] hover:bg-[#ECFDF5] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Üýtget</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            aria-label={`${item.fullName} sanawdan aýyr`}
                            className="min-h-[38px] px-2.5 rounded-lg text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Aýyr</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* MODAL 1: Täze Athana Goşmak */}
      <Modal
        isOpen={stableModalOpen}
        onClose={() => setStableModalOpen(false)}
        title="Täze Athana Goşmak"
        subtitle="Goşulan athana derrew Işgär girişinde we Umumy Gözegçilik reýtinginde peýda bolýar."
        size="md"
      >
        <form onSubmit={handleCreateStableSubmit} className="space-y-4">
          {stableError && (
            <div
              role="alert"
              className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-3.5 py-2.5 flex items-start gap-2 text-xs text-[#991B1B]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{stableError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="new-stable-complex" className="block text-xs font-semibold text-[#415850]">
              Atçylyk sport toplumy
            </label>
            <select
              id="new-stable-complex"
              value={stableComplexId}
              onChange={(e) => setStableComplexId(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              required
            >
              {complexes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.region})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2 space-y-1.5">
              <label htmlFor="new-stable-name" className="block text-xs font-semibold text-[#415850]">
                Athananyň ady
              </label>
              <input
                id="new-stable-name"
                type="text"
                value={stableName}
                onChange={(e) => setStableName(e.target.value)}
                placeholder="Athana №3 — «Ýaşyl Bedew»"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="new-stable-code" className="block text-xs font-semibold text-[#415850]">
                Athana kody
              </label>
              <input
                id="new-stable-code"
                type="text"
                value={stableCode}
                onChange={(e) => setStableCode(e.target.value)}
                placeholder="ATH-AG-03"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm font-mono text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <label htmlFor="new-stable-boxes" className="block text-xs font-semibold text-[#415850]">
                Jemi boks sany
              </label>
              <input
                id="new-stable-boxes"
                type="number"
                min={4}
                max={80}
                value={stableBoxCount}
                onChange={(e) => setStableBoxCount(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm font-mono tabular-nums text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="new-stable-occ" className="block text-xs font-semibold text-[#415850]">
                Eýelenen bokslar
              </label>
              <input
                id="new-stable-occ"
                type="number"
                min={0}
                max={80}
                value={stableOccupiedBoxes}
                onChange={(e) => setStableOccupiedBoxes(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm font-mono tabular-nums text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="new-stable-rain" className="block text-xs font-semibold text-[#415850]">
                Ýagyş suwy (L)
              </label>
              <input
                id="new-stable-rain"
                type="number"
                min={1000}
                step={500}
                value={stableRainwater}
                onChange={(e) => setStableRainwater(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm font-mono tabular-nums text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="new-stable-seis" className="block text-xs font-semibold text-[#415850]">
              Jogapkär Baş Seýis
            </label>
            <input
              id="new-stable-seis"
              type="text"
              value={stableHeadSeis}
              onChange={(e) => setStableHeadSeis(e.target.value)}
              placeholder="Seýis Kakamyrat Geldiýew"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              required
            />
          </div>

          <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={stableSolarEnabled}
              onChange={(e) => setStableSolarEnabled(e.target.checked)}
              className="w-4 h-4 accent-[#064E3B] rounded cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-[#0F241D]">
              Gün panelli üçek we akylly LED ulgamy bar («Ýaşyl Athana» standarty)
            </span>
          </label>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#EEF3F1]">
            <Button type="button" variant="ghost" onClick={() => setStableModalOpen(false)}>
              Ýatyr
            </Button>
            <Button type="submit" variant="primary" loading={stableSaving}>
              Athanany goş
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Işgäri Toplum we Athana Bellemek / Üýtgetmek */}
      <Modal
        isOpen={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        title={editingStaffId ? 'Işgär Jogapkärçiligini Üýtgetmek' : 'Täze Işgär Bellemek'}
        subtitle="Işgäri degişli sport toplumyna we athana jogapkär edip berkidiň."
        size="md"
      >
        <form onSubmit={handleSaveStaffSubmit} className="space-y-4">
          {staffError && (
            <div
              role="alert"
              className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-3.5 py-2.5 flex items-start gap-2 text-xs text-[#991B1B]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{staffError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label htmlFor="asg-name" className="block text-xs font-semibold text-[#415850]">
                Doly ady we familiýasy
              </label>
              <input
                id="asg-name"
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Mysal: Serdar Myradow"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="asg-contact" className="block text-xs font-semibold text-[#415850]">
                Gulluk e-poçtasy ýa-da telefon
              </label>
              <input
                id="asg-contact"
                type="text"
                value={staffContact}
                onChange={(e) => setStaffContact(e.target.value)}
                placeholder="s.myradow@ahalteke.tm"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label htmlFor="asg-position" className="block text-xs font-semibold text-[#415850]">
                Wezipe
              </label>
              <select
                id="asg-position"
                value={staffPosition}
                onChange={(e) => setStaffPosition(e.target.value as StaffPosition)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              >
                {STAFF_POSITIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.value}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="asg-status" className="block text-xs font-semibold text-[#415850]">
                Iş ýagdaýy
              </label>
              <select
                id="asg-status"
                value={staffStatus}
                onChange={(e) => setStaffStatus(e.target.value as 'işjeň' | 'dynç_alyşda')}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              >
                <option value="işjeň">Işjeň</option>
                <option value="dynç_alyşda">Dynç alyşda</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="asg-complex" className="block text-xs font-semibold text-[#415850]">
              Atçylyk sport toplumy
            </label>
            <select
              id="asg-complex"
              value={staffComplexId}
              onChange={(e) => setStaffComplexId(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              required
            >
              {complexes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="asg-stable" className="block text-xs font-semibold text-[#415850]">
              Jogapkär athana
            </label>
            <select
              id="asg-stable"
              value={staffStableId}
              onChange={(e) => setStaffStableId(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              required
            >
              {stablesForStaffForm.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#EEF3F1]">
            <Button type="button" variant="ghost" onClick={() => setStaffModalOpen(false)}>
              Ýatyr
            </Button>
            <Button type="submit" variant="primary" loading={staffSaving}>
              {editingStaffId ? 'Üýtgeşmeleri sakla' : 'Işgäri belle'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Işgär pozmak tassyklamasy */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Işgär bellemesini aýyrmak"
        size="sm"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)}>
              Ýatyr
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={deleting}
              onClick={handleConfirmDelete}
              className="bg-[#DC2626] hover:bg-[#B91C1C]"
            >
              Aýyr
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#415850]">
          <strong>{deleteTarget?.fullName}</strong> atly işgäri jogapkärçilik sanawyndan aýyrmak
          isleýärsiňizmi?
        </p>
      </Modal>
    </div>
  );
};
