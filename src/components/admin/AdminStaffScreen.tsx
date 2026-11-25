import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAppStore } from '../../store';
import type { StaffAssignment, StaffPosition } from '../../types';
import { Button, Card, Modal } from '../common';

const STAFF_POSITIONS: StaffPosition[] = [
  'Baş Seýis / Seýis',
  'Weterinar lukman',
  '«Ýaşyl Athana» Eko-Inžener',
];

export const AdminStaffScreen: React.FC = () => {
  const {
    complexes,
    stables,
    staffAssignments,
    upsertStaffAssignment,
    removeStaffAssignment,
    isHydrating,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [complexFilter, setComplexFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState<'all' | StaffPosition>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | StaffAssignment['status']>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Işgär goşmak / redaktirlemek modaly
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState<StaffPosition>('Baş Seýis / Seýis');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [complexId, setComplexId] = useState('');
  const [stableId, setStableId] = useState('');
  const [status, setStatus] = useState<StaffAssignment['status']>('işjeň');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Pozmak tassyklamasy
  const [deleteTarget, setDeleteTarget] = useState<StaffAssignment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    window.setTimeout(() => {
      setFeedbackMsg((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  const complexNameById = useMemo(
    () => new Map(complexes.map((c) => [c.id, c.name])),
    [complexes]
  );

  const stableById = useMemo(() => new Map(stables.map((s) => [s.id, s])), [stables]);

  const modalStablesForComplex = useMemo(
    () => stables.filter((s) => s.complexId === complexId),
    [stables, complexId]
  );

  const filteredStaff = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return staffAssignments.filter((item) => {
      if (complexFilter !== 'all' && item.complexId !== complexFilter) return false;
      if (positionFilter !== 'all' && item.position !== positionFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!q) return true;
      const cmp = complexNameById.get(item.complexId) ?? '';
      const stb = stableById.get(item.stableId)?.name ?? '';
      return (
        item.fullName.toLowerCase().includes(q) ||
        item.emailOrPhone.toLowerCase().includes(q) ||
        item.position.toLowerCase().includes(q) ||
        cmp.toLowerCase().includes(q) ||
        stb.toLowerCase().includes(q)
      );
    });
  }, [
    staffAssignments,
    complexFilter,
    positionFilter,
    statusFilter,
    searchQuery,
    complexNameById,
    stableById,
  ]);

  const stats = useMemo(() => {
    const active = staffAssignments.filter((a) => a.status === 'işjeň').length;
    const onLeave = staffAssignments.length - active;
    const coveredStables = new Set(
      staffAssignments.filter((a) => a.status === 'işjeň').map((a) => a.stableId)
    ).size;
    return { total: staffAssignments.length, active, onLeave, coveredStables };
  }, [staffAssignments]);

  const openModal = (assignment?: StaffAssignment) => {
    setFormError(null);
    if (assignment) {
      setEditingId(assignment.id);
      setFullName(assignment.fullName);
      setPosition(assignment.position);
      setEmailOrPhone(assignment.emailOrPhone);
      setComplexId(assignment.complexId);
      setStableId(assignment.stableId);
      setStatus(assignment.status);
    } else {
      const defaultComplexId = complexes[0]?.id ?? '';
      const firstStable = stables.find((s) => s.complexId === defaultComplexId);
      setEditingId(undefined);
      setFullName('');
      setPosition('Baş Seýis / Seýis');
      setEmailOrPhone('');
      setComplexId(defaultComplexId);
      setStableId(firstStable?.id ?? stables[0]?.id ?? '');
      setStatus('işjeň');
    }
    setModalOpen(true);
  };

  const handleComplexChange = (nextComplexId: string) => {
    setComplexId(nextComplexId);
    const matching = stables.filter((s) => s.complexId === nextComplexId);
    setStableId(matching[0]?.id ?? '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      await upsertStaffAssignment({
        id: editingId,
        fullName,
        position,
        emailOrPhone,
        complexId,
        stableId,
        status,
      });
      setModalOpen(false);
      showToast(
        editingId
          ? `«${fullName.trim()}» işgäriniň jogapkärçilik maglumaty täzelendi.`
          : `«${fullName.trim()}» degişli athana jogapkär işgär hökmünde bellenildi.`
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Işgäri saklamakda säwlik ýüze çykdy.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickStatusToggle = async (item: StaffAssignment) => {
    const nextStatus: StaffAssignment['status'] =
      item.status === 'işjeň' ? 'dynç_alyşda' : 'işjeň';
    await upsertStaffAssignment({
      id: item.id,
      fullName: item.fullName,
      position: item.position,
      emailOrPhone: item.emailOrPhone,
      complexId: item.complexId,
      stableId: item.stableId,
      status: nextStatus,
    });
    showToast(
      `«${item.fullName}» statusy «${nextStatus === 'işjeň' ? 'Işjeň' : 'Dynç alyşda'}» hökmünde üýtgedildi.`
    );
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await removeStaffAssignment(deleteTarget.id);
      showToast(`«${deleteTarget.fullName}» işgär bellemesi aýryldy.`);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  if (isHydrating && staffAssignments.length === 0) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-9 w-80 rounded-xl bg-[#E6EFEA] animate-pulse" />
        <div className="h-64 rounded-2xl bg-white border border-[#DCE6E1] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sözbaşy */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#059669]">
            Kadrlar we Jogapkärçilik · Doly CRUD
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A] leading-tight text-balance">
            Işgär Bellemeleri we Athana Jogapkärleri
          </h1>
          <p className="text-sm text-[#415850] max-w-2xl">
            Baş seýisleri, weterinar lukmanlary we «Ýaşyl Athana» eko-inženerlerini belli bir
            atçylyk sport toplumyna we athana jogapkär edip belläň.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<UserPlus className="w-4 h-4" />}
          onClick={() => openModal()}
        >
          Täze işgär belle
        </Button>
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

      {/* KPI Kartoçkalary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="md" className="bg-white space-y-1">
          <p className="text-xs font-medium text-[#647A72]">Jemi Işgärler</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#0F172A]">{stats.total}</p>
        </Card>
        <Card padding="md" className="bg-white space-y-1">
          <p className="text-xs font-medium text-[#059669] flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
            Işjeň Jogapkärler
          </p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#064E3B]">{stats.active}</p>
        </Card>
        <Card padding="md" className="bg-white space-y-1">
          <p className="text-xs font-medium text-[#B45309]">Dynç alyşda</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#0F172A]">{stats.onLeave}</p>
        </Card>
        <Card padding="md" className="bg-white space-y-1">
          <p className="text-xs font-medium text-[#647A72]">Üpjün edilen Athanalar</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#0F172A]">
            {stats.coveredStables} / {stables.length}
          </p>
        </Card>
      </div>

      {/* Süzgüçler we Tablisa */}
      <Card padding="none" className="bg-white overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#DCE6E1] grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search
              className="w-4 h-4 text-[#647A72] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Işgär, telefon ýa-da athana gözle..."
              aria-label="Işgär gözlegi"
              className="w-full min-h-[42px] pl-9 pr-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-xs sm:text-sm text-[#0F172A] placeholder:text-[#647A72] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
            />
          </div>

          <select
            value={complexFilter}
            onChange={(e) => setComplexFilter(e.target.value)}
            aria-label="Toplum süzgüji"
            className="w-full min-h-[42px] px-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-xs sm:text-sm text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981] cursor-pointer"
          >
            <option value="all">Ähli sport toplumlary</option>
            {complexes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value as 'all' | StaffPosition)}
            aria-label="Wezipe süzgüji"
            className="w-full min-h-[42px] px-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-xs sm:text-sm text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981] cursor-pointer"
          >
            <option value="all">Ähli wezipeler</option>
            {STAFF_POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | StaffAssignment['status'])
            }
            aria-label="Status süzgüji"
            className="w-full min-h-[42px] px-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-xs sm:text-sm text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981] cursor-pointer"
          >
            <option value="all">Ähli statuslar</option>
            <option value="işjeň">Işjeň</option>
            <option value="dynç_alyşda">Dynç alyşda</option>
          </select>
        </div>

        {filteredStaff.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Users className="w-8 h-8 text-[#647A72] mx-auto" aria-hidden="true" />
            <p className="text-sm font-semibold text-[#0F172A]">
              Süzgüje gabat gelýän işgär tapylmady
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setComplexFilter('all');
                setPositionFilter('all');
                setStatusFilter('all');
              }}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#ECFDF5] text-[#064E3B] text-xs font-semibold hover:bg-[#D1FAE5] cursor-pointer"
            >
              Süzgüçleri arassala
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[860px]">
              <thead>
                <tr className="bg-[#F8FAF9] border-b border-[#DCE6E1] text-[11px] font-semibold text-[#647A72]">
                  <th className="py-3 pl-6 pr-3">Işgär we Aragatnaşyk</th>
                  <th className="py-3 px-3">Wezipesi</th>
                  <th className="py-3 px-3">Sport Toplumy we Athana</th>
                  <th className="py-3 px-3">Bellenilen Sene</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 pl-3 pr-6 text-right">Dolandyryş</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF3F1] text-sm">
                {filteredStaff.map((item) => {
                  const stable = stableById.get(item.stableId);
                  return (
                    <tr key={item.id} className="hover:bg-[#F8FAF9] transition-colors">
                      <td className="py-3.5 pl-6 pr-3">
                        <p className="font-semibold text-[#0F172A]">{item.fullName}</p>
                        <p className="text-xs font-mono text-[#647A72]">{item.emailOrPhone}</p>
                      </td>
                      <td className="py-3.5 px-3 text-xs sm:text-sm font-medium text-[#064E3B]">
                        {item.position}
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="text-xs sm:text-sm font-medium text-[#0F172A]">
                          {stable?.name ?? item.stableId}
                          {stable?.code ? (
                            <span className="ml-1.5 text-xs font-mono text-[#647A72]">
                              ({stable.code})
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-[#647A72]">
                          {complexNameById.get(item.complexId) ?? item.complexId}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 font-mono tabular-nums text-xs text-[#415850]">
                        {item.assignedAt}
                      </td>
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleQuickStatusToggle(item)}
                          className={[
                            'text-xs font-bold cursor-pointer underline-offset-2 hover:underline',
                            item.status === 'işjeň' ? 'text-[#059669]' : 'text-[#B45309]',
                          ].join(' ')}
                        >
                          {item.status === 'işjeň' ? 'Işjeň' : 'Dynç alyşda'}
                        </button>
                      </td>
                      <td className="py-3.5 pl-3 pr-6 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openModal(item)}
                            className="min-h-[38px] px-3 rounded-lg text-xs font-semibold text-[#064E3B] hover:bg-[#ECFDF5] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                            Üýtget
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="min-h-[38px] px-3 rounded-lg text-xs font-semibold text-[#EF4444] hover:bg-[#FEF2F2] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            Poz
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

      {/* MODAL: Işgär Bellemek / Üýtgetmek */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Işgär Bellemesini Üýtgetmek' : 'Täze Işgär Bellemek'}
        subtitle="Işgäri degişli atçylyk sport toplumyna we athana jogapkär edip berkidiň."
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div
              role="alert"
              className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-3.5 py-2.5 flex items-start gap-2 text-xs text-[#991B1B]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="stf-name" className="block text-xs font-semibold text-[#415850]">
              Işgäriň doly ady we familiýasy
            </label>
            <input
              id="stf-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Mysal: Amanmyrat Gurbanow"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label htmlFor="stf-pos" className="block text-xs font-semibold text-[#415850]">
                Wezipesi
              </label>
              <select
                id="stf-pos"
                value={position}
                onChange={(e) => setPosition(e.target.value as StaffPosition)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              >
                {STAFF_POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="stf-status" className="block text-xs font-semibold text-[#415850]">
                Iş statusy
              </label>
              <select
                id="stf-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as StaffAssignment['status'])}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              >
                <option value="işjeň">Işjeň</option>
                <option value="dynç_alyşda">Dynç alyşda</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="stf-contact" className="block text-xs font-semibold text-[#415850]">
              E-poçta ýa-da telefon belgisi
            </label>
            <input
              id="stf-contact"
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder="+993 65 44 21 09 ýa-da seis@ahalteke.tm"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label htmlFor="stf-complex" className="block text-xs font-semibold text-[#415850]">
                Sport Toplumy
              </label>
              <select
                id="stf-complex"
                value={complexId}
                onChange={(e) => handleComplexChange(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
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
              <label htmlFor="stf-stable" className="block text-xs font-semibold text-[#415850]">
                Jogapkär Athanasy
              </label>
              <select
                id="stf-stable"
                value={stableId}
                onChange={(e) => setStableId(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                required
              >
                {modalStablesForComplex.length === 0 ? (
                  <option value="">Bu toplumda entek athana ýok</option>
                ) : (
                  modalStablesForComplex.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#EEF3F1]">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Ýatyr
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={saving}
              disabled={modalStablesForComplex.length === 0}
            >
              {editingId ? 'Ýazgyny täzele' : 'Işgäri belle'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Pozmak tassyklamasy */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Işgär bellemesini pozmak"
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
              className="bg-[#EF4444] hover:bg-[#DC2626]"
            >
              Poz
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#415850]">
          <strong>«{deleteTarget?.fullName}»</strong> işgäriniň jogapkärçilik bellemesini sanawdan
          aýyrmak isleýärsiňizmi?
        </p>
      </Modal>
    </div>
  );
};
