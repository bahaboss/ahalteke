import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  GraduationCap,
  MessageSquare,
  Search,
  XCircle,
} from 'lucide-react';
import {
  exportAcademyApplicationsCsv,
  getApplicationStatusLabelTk,
} from '../../services';
import { useAppStore } from '../../store';
import type { AcademyApplication, AcademyApplicationStatus } from '../../types';
import { Button, Card, Modal } from '../common';

type StatusFilter = 'all' | AcademyApplicationStatus;

const ALL_STATUSES: { status: AcademyApplicationStatus; label: string }[] = [
  { status: 'garalýar', label: 'Garaşylýar' },
  { status: 'söhbetdeşlik', label: 'Söhbetdeşlik' },
  { status: 'tassyklandy', label: 'Kabul edildi' },
  { status: 'ret_edildi', label: 'Ret edildi' },
];

export const AdminApplicationsScreen: React.FC = () => {
  const {
    academyApplications: applications,
    complexes,
    updateApplicationStatus,
    isHydrating,
  } = useAppStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<AcademyApplication | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    window.setTimeout(() => {
      setFeedbackMsg((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  const complexNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of complexes) {
      map[c.id] = c.name;
    }
    return map;
  }, [complexes]);

  const counts = useMemo(
    () => ({
      total: applications.length,
      garalýar: applications.filter((a) => a.status === 'garalýar').length,
      söhbetdeşlik: applications.filter((a) => a.status === 'söhbetdeşlik').length,
      tassyklandy: applications.filter((a) => a.status === 'tassyklandy').length,
      ret_edildi: applications.filter((a) => a.status === 'ret_edildi').length,
    }),
    [applications]
  );

  const filteredApplications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return applications.filter((app) => {
      if (statusFilter !== 'all' && app.status !== statusFilter) return false;
      if (!q) return true;
      return (
        app.applicantName.toLowerCase().includes(q) ||
        app.region.toLowerCase().includes(q) ||
        app.programName.toLowerCase().includes(q) ||
        (app.schoolName ?? '').toLowerCase().includes(q) ||
        (app.phone ?? '').toLowerCase().includes(q) ||
        (app.email ?? '').toLowerCase().includes(q)
      );
    });
  }, [applications, statusFilter, searchQuery]);

  const handleChangeStatus = async (
    applicationId: string,
    nextStatus: AcademyApplicationStatus
  ) => {
    setUpdatingId(applicationId);
    try {
      await updateApplicationStatus(applicationId, nextStatus);
      if (selectedApp?.id === applicationId) {
        setSelectedApp((prev) => (prev ? { ...prev, status: nextStatus } : null));
      }
      showToast(
        `Anketa statusy «${getApplicationStatusLabelTk(nextStatus)}» hökmünde täzelendi.`
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportCsv = () => {
    const targetList = filteredApplications.length > 0 ? filteredApplications : applications;
    const fileName = exportAcademyApplicationsCsv(targetList, complexNameById);
    showToast(`${targetList.length} anketa Excel üçin CSV görnüşinde göçürildi (${fileName}).`);
  };

  if (isHydrating && applications.length === 0) {
    return (
      <div className="space-y-6" aria-busy="true">
        <div className="h-9 w-80 rounded-xl bg-[#E6EFEA] animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-white border border-[#DCE6E1] animate-pulse" />
          ))}
        </div>
        <div className="h-72 rounded-2xl bg-white border border-[#DCE6E1] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sözbaşy we CSV Eksport düwmesi */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#059669]">
            Aba Annaýew Adyndaky Halkara Atçylyk Akademiýasy · Kabul Ediş
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F172A] leading-tight text-balance">
            Akademiýa Dalaşgärlik Anketalary
          </h1>
          <p className="text-sm text-[#415850] max-w-2xl">
            /user/academy sahypasyndan ugradylan onlaýn anketalary gözden geçiriň, statusyny
            «Garaşylýar / Söhbetdeşlik / Kabul edildi / Ret edildi» görnüşinde täzeläň we Excel üçin
            UTF-8 CSV faýlyna eksport ediň.
          </p>
        </div>

        <Button
          variant="gold"
          size="md"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={handleExportCsv}
          disabled={applications.length === 0}
        >
          CSV Eksport (Excel)
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

      {/* 5 Status KPI Kartoçkasy */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Card padding="md" className="bg-white space-y-1">
          <p className="text-xs text-[#647A72] font-medium">Jemi anketalar</p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#0F172A]">{counts.total}</p>
        </Card>
        <Card padding="md" className="bg-white space-y-1">
          <p className="text-xs text-[#B45309] font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            Garaşylýar
          </p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#0F172A]">
            {counts.garalýar}
          </p>
        </Card>
        <Card padding="md" className="bg-white space-y-1">
          <p className="text-xs text-[#0369A1] font-medium flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
            Söhbetdeşlik
          </p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#0F172A]">
            {counts.söhbetdeşlik}
          </p>
        </Card>
        <Card padding="md" className="bg-white space-y-1">
          <p className="text-xs text-[#059669] font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            Kabul edildi
          </p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#064E3B]">
            {counts.tassyklandy}
          </p>
        </Card>
        <Card padding="md" className="bg-white space-y-1">
          <p className="text-xs text-[#EF4444] font-medium flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
            Ret edildi
          </p>
          <p className="font-mono tabular-nums text-2xl font-bold text-[#991B1B]">
            {counts.ret_edildi}
          </p>
        </Card>
      </div>

      {/* Süzgüç we Gözleg Zoly */}
      <Card padding="none" className="bg-white overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#DCE6E1] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div
            role="tablist"
            aria-label="Status süzgüji"
            className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#EEF3F1] self-start"
          >
            {(
              [
                { id: 'all' as StatusFilter, label: `Ählisi (${counts.total})` },
                { id: 'garalýar' as StatusFilter, label: `Garaşylýar (${counts.garalýar})` },
                {
                  id: 'söhbetdeşlik' as StatusFilter,
                  label: `Söhbetdeşlik (${counts.söhbetdeşlik})`,
                },
                {
                  id: 'tassyklandy' as StatusFilter,
                  label: `Kabul edildi (${counts.tassyklandy})`,
                },
                {
                  id: 'ret_edildi' as StatusFilter,
                  label: `Ret edildi (${counts.ret_edildi})`,
                },
              ]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={[
                  'min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap tabular-nums',
                  statusFilter === tab.id
                    ? 'bg-white text-[#064E3B] shadow-xs'
                    : 'text-[#415850] hover:text-[#0F172A]',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
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
              placeholder="Dalaşgär, mekdep, telefon ýa-da hünär gözle..."
              aria-label="Dalaşgär gözlegi"
              className="w-full sm:w-72 min-h-[42px] pl-9 pr-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-xs sm:text-sm text-[#0F172A] placeholder:text-[#647A72] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
            />
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <GraduationCap className="w-8 h-8 text-[#647A72] mx-auto" aria-hidden="true" />
            <p className="text-sm font-semibold text-[#0F172A]">
              Saýlanan status boýunça anketa tapylmady
            </p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#ECFDF5] text-[#064E3B] text-xs font-semibold hover:bg-[#D1FAE5] cursor-pointer"
            >
              Ähli anketalary görkez
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[940px]">
              <thead>
                <tr className="bg-[#F8FAF9] border-b border-[#DCE6E1] text-[11px] font-semibold text-[#647A72]">
                  <th className="py-3 pl-6 pr-3">Dalaşgär we Mekdebi</th>
                  <th className="py-3 px-3">Aragatnaşyk</th>
                  <th className="py-3 px-3">Saýlanan Hünär we Tejribe</th>
                  <th className="py-3 px-3">Sene</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 pl-3 pr-6 text-right">Status Dolandyryşy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF3F1] text-sm">
                {filteredApplications.map((app) => {
                  const isBusy = updatingId === app.id;
                  const statusColor =
                    app.status === 'tassyklandy'
                      ? 'text-[#059669]'
                      : app.status === 'söhbetdeşlik'
                        ? 'text-[#0369A1]'
                        : app.status === 'ret_edildi'
                          ? 'text-[#EF4444]'
                          : 'text-[#B45309]';

                  return (
                    <tr key={app.id} className="hover:bg-[#F8FAF9] transition-colors">
                      <td className="py-3.5 pl-6 pr-3">
                        <p className="font-semibold text-[#0F172A]">{app.applicantName}</p>
                        <p className="text-xs text-[#647A72] tabular-nums">
                          {app.age} ýaş · {app.region}
                        </p>
                        {app.schoolName && (
                          <p className="text-[11px] text-[#415850] mt-0.5 truncate max-w-[230px]">
                            {app.schoolName}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="text-xs font-mono tabular-nums text-[#0F172A]">
                          {app.phone ?? '—'}
                        </p>
                        <p className="text-[11px] text-[#647A72] truncate max-w-[190px]">
                          {app.email ?? '—'}
                        </p>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="text-xs sm:text-sm font-medium text-[#0F172A]">
                          {app.programName}
                        </p>
                        <p className="text-xs text-[#647A72]">
                          Tejribe: {app.experienceLevel} ·{' '}
                          {complexNameById[app.preferredComplexId] ?? app.preferredComplexId}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 font-mono tabular-nums text-xs text-[#415850]">
                        {app.submittedAt}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`text-xs font-bold inline-flex items-center gap-1.5 ${statusColor}`}>
                          {app.status === 'tassyklandy' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : app.status === 'söhbetdeşlik' ? (
                            <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : app.status === 'ret_edildi' ? (
                            <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                          {getApplicationStatusLabelTk(app.status)}
                        </span>
                      </td>
                      <td className="py-3.5 pl-3 pr-6 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <select
                            aria-label={`${app.applicantName} statusyny saýla`}
                            disabled={isBusy}
                            value={app.status}
                            onChange={(e) =>
                              handleChangeStatus(
                                app.id,
                                e.target.value as AcademyApplicationStatus
                              )
                            }
                            className="min-h-[38px] px-2.5 rounded-lg bg-[#F8FAF9] border border-[#DCE6E1] text-xs font-semibold text-[#0F172A] focus:bg-white focus:outline-2 focus:outline-[#10B981] cursor-pointer disabled:opacity-50"
                          >
                            {ALL_STATUSES.map((opt) => (
                              <option key={opt.status} value={opt.status}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setSelectedApp(app)}
                            aria-label={`${app.applicantName} anketasyny jikme-jik gör`}
                            className="min-h-[38px] px-2.5 rounded-lg text-xs font-semibold text-[#064E3B] hover:bg-[#ECFDF5] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Gör</span>
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

      {/* MODAL: Anketa jikme-jik maglumaty we doly 4 status saýlawy */}
      <Modal
        isOpen={Boolean(selectedApp)}
        onClose={() => setSelectedApp(null)}
        title={selectedApp?.applicantName ?? 'Dalaşgärlik Anketasy'}
        subtitle={
          selectedApp
            ? `${selectedApp.age} ýaş · ${selectedApp.region} · Tabşyrylan sene: ${selectedApp.submittedAt}`
            : undefined
        }
        size="md"
      >
        {selectedApp && (
          <div className="space-y-4">
            <div className="divide-y divide-[#EEF3F1] border-y border-[#EEF3F1] text-sm">
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-[#647A72]">Mekdebi / Okuw jaýy</span>
                <span className="font-medium text-[#0F172A] text-right">
                  {selectedApp.schoolName ?? '—'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-[#647A72]">Telefon belgisi</span>
                <span className="font-mono tabular-nums font-medium text-[#0F172A] text-right">
                  {selectedApp.phone ?? '—'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-[#647A72]">Email salgysy</span>
                <span className="font-medium text-[#0F172A] text-right break-all">
                  {selectedApp.email ?? '—'}
                </span>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-[#647A72]">Saýlanan hünär</span>
                <span className="font-semibold text-[#0F172A] text-right">
                  {selectedApp.programName}
                </span>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-[#647A72]">Tejribe derejesi</span>
                <span className="font-medium text-[#0F172A] capitalize">
                  {selectedApp.experienceLevel}
                </span>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-[#647A72]">Saýlanan toplum</span>
                <span className="font-medium text-[#0F172A] text-right">
                  {complexNameById[selectedApp.preferredComplexId] ??
                    selectedApp.preferredComplexId}
                </span>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-[#647A72]">Häzirki status</span>
                <span
                  className={[
                    'font-bold',
                    selectedApp.status === 'ret_edildi' ? 'text-[#EF4444]' : 'text-[#064E3B]',
                  ].join(' ')}
                >
                  {getApplicationStatusLabelTk(selectedApp.status)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-[#647A72]">Düşündiriş / Höwes haty</p>
              <p className="p-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F172A] leading-relaxed">
                {selectedApp.motivationNote}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <p className="text-xs font-semibold text-[#647A72]">Statusy üýtgetmek</p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_STATUSES.map((opt) => {
                  const isCurrent = selectedApp.status === opt.status;
                  const isReject = opt.status === 'ret_edildi';
                  return (
                    <button
                      key={opt.status}
                      type="button"
                      disabled={updatingId === selectedApp.id}
                      onClick={() => handleChangeStatus(selectedApp.id, opt.status)}
                      className={[
                        'min-h-[42px] px-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer',
                        isCurrent
                          ? isReject
                            ? 'bg-[#EF4444] text-white'
                            : 'bg-[#064E3B] text-white'
                          : isReject
                            ? 'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] hover:bg-[#FEE2E2]'
                            : 'bg-[#F8FAF9] border border-[#DCE6E1] text-[#0F172A] hover:bg-[#ECFDF5]',
                      ].join(' ')}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
