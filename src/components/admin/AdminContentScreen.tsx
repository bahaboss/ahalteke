import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Edit3,
  Plus,
  Search,
  Trash2,
  Trophy,
} from 'lucide-react';
import {
  deleteBookAdmin,
  deleteCompetitionAdmin,
  fetchBooks,
  fetchCompetitions,
  fetchComplexes,
  saveBookAdmin,
  saveCompetitionAdmin,
} from '../../services';
import type { BookItem, Competition, EquestrianComplex } from '../../types';
import { Button, Card, Modal } from '../common';

type ContentTab = 'competitions' | 'books';

const COMP_CATEGORY_LABELS: Record<Competition['category'], string> = {
  çapyşyk: 'At çapyşygy',
  gözellik: 'Gözellik bäsleşigi',
  marafon: 'Eko-Marafon',
  konkur: 'Konkur',
};

const COMP_STATUS_LABELS: Record<Competition['status'], string> = {
  öňde: 'Öňde duran',
  dowam_edýär: 'Dowam edýär',
  tamamlandy: 'Tamamlandy',
};

const BOOK_CATEGORY_LABELS: Record<BookItem['category'], string> = {
  taryh: 'Taryh we Miras',
  seýisçilik: 'Seýisçilik',
  weterinariýa: 'Weterinariýa',
  ekologiýa: 'Ekologiýa',
};

export const AdminContentScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ContentTab>('competitions');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [books, setBooks] = useState<BookItem[]>([]);
  const [complexes, setComplexes] = useState<EquestrianComplex[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Ýaryş modaly
  const [compModalOpen, setCompModalOpen] = useState(false);
  const [editingCompId, setEditingCompId] = useState<string | undefined>(undefined);
  const [compTitle, setCompTitle] = useState('');
  const [compCategory, setCompCategory] = useState<Competition['category']>('çapyşyk');
  const [compDate, setCompDate] = useState('2027-04-25');
  const [compComplexId, setCompComplexId] = useState('');
  const [compLocation, setCompLocation] = useState('');
  const [compPrize, setCompPrize] = useState('');
  const [compStatus, setCompStatus] = useState<Competition['status']>('öňde');
  const [compDesc, setCompDesc] = useState('');
  const [compSaving, setCompSaving] = useState(false);
  const [compError, setCompError] = useState<string | null>(null);

  // Kitap modaly
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | undefined>(undefined);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookYear, setBookYear] = useState('2026');
  const [bookCategory, setBookCategory] = useState<BookItem['category']>('taryh');
  const [bookPages, setBookPages] = useState('240');
  const [bookLanguage, setBookLanguage] = useState<BookItem['language']>('Türkmençe');
  const [bookSummary, setBookSummary] = useState('');
  const [bookFeatured, setBookFeatured] = useState(true);
  const [bookSaving, setBookSaving] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);

  // Pozmak tassyklamasy
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: ContentTab;
    id: string;
    title: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [compRes, bookRes, cmpRes] = await Promise.all([
          fetchCompetitions(),
          fetchBooks(),
          fetchComplexes(),
        ]);
        if (!active) return;
        setCompetitions(compRes.data);
        setBooks(bookRes.data);
        setComplexes(cmpRes.data);
        if (cmpRes.data.length > 0) {
          setCompComplexId(cmpRes.data[0].id);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    window.setTimeout(() => {
      setFeedbackMsg((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  const filteredCompetitions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return competitions;
    return competitions.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.prizePoolLabel.toLowerCase().includes(q)
    );
  }, [competitions, searchQuery]);

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.summary.toLowerCase().includes(q)
    );
  }, [books, searchQuery]);

  const openCompetitionModal = (item?: Competition) => {
    setCompError(null);
    if (item) {
      setEditingCompId(item.id);
      setCompTitle(item.title);
      setCompCategory(item.category);
      setCompDate(item.date);
      setCompComplexId(item.complexId);
      setCompLocation(item.location);
      setCompPrize(item.prizePoolLabel);
      setCompStatus(item.status);
      setCompDesc(item.description);
    } else {
      const firstComplex = complexes[0];
      setEditingCompId(undefined);
      setCompTitle('');
      setCompCategory('çapyşyk');
      setCompDate('2027-04-25');
      setCompComplexId(firstComplex?.id ?? '');
      setCompLocation(firstComplex?.name ?? '');
      setCompPrize('Altyn Kubok we Ýörite Baýraklar');
      setCompStatus('öňde');
      setCompDesc('');
    }
    setCompModalOpen(true);
  };

  const handleSaveCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompError(null);
    setCompSaving(true);
    try {
      const res = await saveCompetitionAdmin({
        id: editingCompId,
        title: compTitle,
        category: compCategory,
        date: compDate,
        location: compLocation,
        complexId: compComplexId,
        prizePoolLabel: compPrize,
        status: compStatus,
        description: compDesc,
      });
      setCompetitions(res.data);
      setCompModalOpen(false);
      showToast(
        editingCompId
          ? 'Ýaryş maglumatlary täzelendi — Ulanyjy panelinde derrew görünýär.'
          : 'Täze ýaryş goşuldy — Ulanyjy paneliniň «Geçiriljek ýaryşlar» bölüminde elýeterli.'
      );
    } catch (err) {
      setCompError(err instanceof Error ? err.message : 'Ýaryşy saklamakda säwlik ýüze çykdy.');
    } finally {
      setCompSaving(false);
    }
  };

  const openBookModal = (item?: BookItem) => {
    setBookError(null);
    if (item) {
      setEditingBookId(item.id);
      setBookTitle(item.title);
      setBookAuthor(item.author);
      setBookYear(String(item.publishYear));
      setBookCategory(item.category);
      setBookPages(String(item.pages));
      setBookLanguage(item.language);
      setBookSummary(item.summary);
      setBookFeatured(item.isFeatured);
    } else {
      setEditingBookId(undefined);
      setBookTitle('');
      setBookAuthor('');
      setBookYear('2026');
      setBookCategory('taryh');
      setBookPages('240');
      setBookLanguage('Türkmençe');
      setBookSummary('');
      setBookFeatured(true);
    }
    setBookModalOpen(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookError(null);
    setBookSaving(true);
    try {
      const res = await saveBookAdmin({
        id: editingBookId,
        title: bookTitle,
        author: bookAuthor,
        publishYear: Number(bookYear),
        category: bookCategory,
        pages: Number(bookPages),
        language: bookLanguage,
        summary: bookSummary,
        availableFormats: ['PDF', 'EPUB'],
        isFeatured: bookFeatured,
      });
      setBooks(res.data);
      setBookModalOpen(false);
      showToast(
        editingBookId
          ? 'Kitaphana neşiri täzelendi — Ulanyjy panelinde derrew görünýär.'
          : 'Täze kitap goşuldy — Ulanyjy paneliniň «Kitaphana» bölüminde elýeterli.'
      );
    } catch (err) {
      setBookError(err instanceof Error ? err.message : 'Kitaby saklamakda säwlik ýüze çykdy.');
    } finally {
      setBookSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      if (deleteConfirm.type === 'competitions') {
        const res = await deleteCompetitionAdmin(deleteConfirm.id);
        setCompetitions(res.data);
        showToast(`«${deleteConfirm.title}» ýaryşy aýryldy.`);
      } else {
        const res = await deleteBookAdmin(deleteConfirm.id);
        setBooks(res.data);
        showToast(`«${deleteConfirm.title}» kitaby aýryldy.`);
      }
      setDeleteConfirm(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
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
            Ulanyjy Paneli Kontenti · Göni Sinhronizasiýa
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F241D] leading-tight text-balance">
            Ýaryşlar we Kitaphana Dolandyryşy
          </h1>
          <p className="text-sm text-[#415850] max-w-2xl">
            Bu ýerde goşulan ýa-da üýtgedilen ýaryşlar we kitaplar «Ýönekeý Ulanyjy» panelinde şol
            pursatda täzelenýär.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() =>
            activeTab === 'competitions' ? openCompetitionModal() : openBookModal()
          }
        >
          {activeTab === 'competitions' ? 'Täze ýaryş goş' : 'Täze kitap goş'}
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

      {/* Bölüm geçişi we gözleg */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Kontent bölümleri"
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#EEF3F1] self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'competitions'}
            onClick={() => {
              setActiveTab('competitions');
              setSearchQuery('');
            }}
            className={[
              'min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap',
              activeTab === 'competitions'
                ? 'bg-white text-[#064E3B] shadow-xs'
                : 'text-[#415850] hover:text-[#0F241D]',
            ].join(' ')}
          >
            <Trophy className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
            <span>Ýaryşlar ({competitions.length})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'books'}
            onClick={() => {
              setActiveTab('books');
              setSearchQuery('');
            }}
            className={[
              'min-h-[40px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap',
              activeTab === 'books'
                ? 'bg-white text-[#064E3B] shadow-xs'
                : 'text-[#415850] hover:text-[#0F241D]',
            ].join(' ')}
          >
            <BookOpen className="w-4 h-4 text-[#059669]" aria-hidden="true" />
            <span>Kitaphana ({books.length})</span>
          </button>
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
            placeholder={
              activeTab === 'competitions' ? 'Ýaryş ýa-da toplum gözle...' : 'Kitap ýa-da awtor gözle...'
            }
            aria-label="Kontent gözlegi"
            className="w-full sm:w-64 min-h-[42px] pl-9 pr-3 rounded-xl bg-white border border-[#DCE6E1] text-xs sm:text-sm text-[#0F241D] placeholder:text-[#647A72] focus:outline-2 focus:outline-[#10B981]"
          />
        </div>
      </div>

      {/* TAB 1: ÝARYŞLAR */}
      {activeTab === 'competitions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCompetitions.length === 0 ? (
            <Card padding="lg" className="lg:col-span-2 bg-white text-center space-y-3">
              <Trophy className="w-8 h-8 text-[#647A72] mx-auto" aria-hidden="true" />
              <p className="text-sm font-semibold text-[#0F241D]">Ýaryş tapylmady</p>
              <Button variant="primary" size="sm" onClick={() => openCompetitionModal()}>
                Täze ýaryş goş
              </Button>
            </Card>
          ) : (
            filteredCompetitions.map((comp) => (
              <Card key={comp.id} padding="md" className="bg-white flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#647A72]">
                    <span className="font-semibold text-[#059669]">
                      {COMP_CATEGORY_LABELS[comp.category]}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums inline-flex items-center gap-1 text-[#0F241D]">
                      <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" aria-hidden="true" />
                      {comp.date}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{COMP_STATUS_LABELS[comp.status]}</span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-[#0F241D] leading-snug">
                    {comp.title}
                  </h3>
                  <p className="text-xs font-medium text-[#064E3B]">{comp.location}</p>
                  <p className="text-xs sm:text-sm text-[#415850] leading-relaxed">
                    {comp.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#EEF3F1] flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[#647A72]">{comp.prizePoolLabel}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openCompetitionModal(comp)}
                      className="min-h-[38px] px-3 rounded-lg text-xs font-semibold text-[#064E3B] hover:bg-[#ECFDF5] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                      Üýtget
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteConfirm({ type: 'competitions', id: comp.id, title: comp.title })
                      }
                      className="min-h-[38px] px-3 rounded-lg text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Poz
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* TAB 2: KITAPHANA */}
      {activeTab === 'books' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredBooks.length === 0 ? (
            <Card padding="lg" className="lg:col-span-2 bg-white text-center space-y-3">
              <BookOpen className="w-8 h-8 text-[#647A72] mx-auto" aria-hidden="true" />
              <p className="text-sm font-semibold text-[#0F241D]">Kitap tapylmady</p>
              <Button variant="primary" size="sm" onClick={() => openBookModal()}>
                Täze kitap goş
              </Button>
            </Card>
          ) : (
            filteredBooks.map((book) => (
              <Card key={book.id} padding="md" className="bg-white flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#647A72]">
                    <span className="font-semibold text-[#059669]">
                      {BOOK_CATEGORY_LABELS[book.category]}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{book.publishYear}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{book.pages} sahypa</span>
                    <span aria-hidden="true">·</span>
                    <span>{book.language}</span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-[#0F241D] leading-snug">
                    {book.title}
                  </h3>
                  <p className="text-xs font-semibold text-[#064E3B]">{book.author}</p>
                  <p className="text-xs sm:text-sm text-[#415850] leading-relaxed">
                    {book.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#EEF3F1] flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-[#647A72]">
                    {book.isFeatured ? 'Saýlanan neşir' : 'Umumy katalog'} ·{' '}
                    {book.availableFormats.join(' / ')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openBookModal(book)}
                      className="min-h-[38px] px-3 rounded-lg text-xs font-semibold text-[#064E3B] hover:bg-[#ECFDF5] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                      Üýtget
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteConfirm({ type: 'books', id: book.id, title: book.title })
                      }
                      className="min-h-[38px] px-3 rounded-lg text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Poz
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* MODAL: Ýaryş Goşmak / Üýtgetmek */}
      <Modal
        isOpen={compModalOpen}
        onClose={() => setCompModalOpen(false)}
        title={editingCompId ? 'Ýaryşy Redaktirlemek' : 'Täze Ýaryş Goşmak'}
        subtitle="Saklanan maglumat Ulanyjy paneliniň «Geçiriljek ýaryşlar» ekranynda görkeziler."
        size="md"
      >
        <form onSubmit={handleSaveCompetition} className="space-y-4">
          {compError && (
            <div
              role="alert"
              className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-3.5 py-2.5 flex items-start gap-2 text-xs text-[#991B1B]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{compError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="comp-title" className="block text-xs font-semibold text-[#415850]">
              Ýaryşyň ady
            </label>
            <input
              id="comp-title"
              type="text"
              value={compTitle}
              onChange={(e) => setCompTitle(e.target.value)}
              placeholder="Mysal: «Arkadag Kubogy» Güýz At Çapyşygy"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <label htmlFor="comp-category" className="block text-xs font-semibold text-[#415850]">
                Görnüşi
              </label>
              <select
                id="comp-category"
                value={compCategory}
                onChange={(e) => setCompCategory(e.target.value as Competition['category'])}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              >
                <option value="çapyşyk">At çapyşygy</option>
                <option value="gözellik">Gözellik bäsleşigi</option>
                <option value="marafon">Eko-Marafon</option>
                <option value="konkur">Konkur</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="comp-date" className="block text-xs font-semibold text-[#415850]">
                Senesi
              </label>
              <input
                id="comp-date"
                type="date"
                value={compDate}
                onChange={(e) => setCompDate(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm font-mono text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="comp-status" className="block text-xs font-semibold text-[#415850]">
                Statusy
              </label>
              <select
                id="comp-status"
                value={compStatus}
                onChange={(e) => setCompStatus(e.target.value as Competition['status'])}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              >
                <option value="öňde">Öňde duran</option>
                <option value="dowam_edýär">Dowam edýär</option>
                <option value="tamamlandy">Tamamlandy</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label htmlFor="comp-complex" className="block text-xs font-semibold text-[#415850]">
                Atçylyk toplumy
              </label>
              <select
                id="comp-complex"
                value={compComplexId}
                onChange={(e) => {
                  setCompComplexId(e.target.value);
                  const found = complexes.find((c) => c.id === e.target.value);
                  if (found) setCompLocation(`${found.name}, ${found.region}`);
                }}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              >
                {complexes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="comp-prize" className="block text-xs font-semibold text-[#415850]">
                Baýrak gaznasy
              </label>
              <input
                id="comp-prize"
                type="text"
                value={compPrize}
                onChange={(e) => setCompPrize(e.target.value)}
                placeholder="Altyn Kubok we Baýraklar"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="comp-location" className="block text-xs font-semibold text-[#415850]">
              Geçiriljek ýeri
            </label>
            <input
              id="comp-location"
              type="text"
              value={compLocation}
              onChange={(e) => setCompLocation(e.target.value)}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="comp-desc" className="block text-xs font-semibold text-[#415850]">
              Gysgaça düşündiriş
            </label>
            <textarea
              id="comp-desc"
              rows={3}
              value={compDesc}
              onChange={(e) => setCompDesc(e.target.value)}
              placeholder="Ýaryşyň tertibi, aralygy we ekologik talaplary barada maglumat..."
              className="w-full p-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              required
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#EEF3F1]">
            <Button type="button" variant="ghost" onClick={() => setCompModalOpen(false)}>
              Ýatyr
            </Button>
            <Button type="submit" variant="primary" loading={compSaving}>
              {editingCompId ? 'Ýaryşy täzele' : 'Ýaryşy goş'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Kitap Goşmak / Üýtgetmek */}
      <Modal
        isOpen={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        title={editingBookId ? 'Kitaphana Neşirini Üýtgetmek' : 'Täze Kitap Goşmak'}
        subtitle="Saklanan kitap Ulanyjy paneliniň «Kitaphana» ekranynda görkeziler."
        size="md"
      >
        <form onSubmit={handleSaveBook} className="space-y-4">
          {bookError && (
            <div
              role="alert"
              className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-3.5 py-2.5 flex items-start gap-2 text-xs text-[#991B1B]"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{bookError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="book-title" className="block text-xs font-semibold text-[#415850]">
              Kitabyň ady
            </label>
            <input
              id="book-title"
              type="text"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="Mysal: Ahalteke bedewiniň sanly taryhy"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label htmlFor="book-author" className="block text-xs font-semibold text-[#415850]">
                Awtory
              </label>
              <input
                id="book-author"
                type="text"
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
                placeholder="Awtoryň ady ýa-da edara"
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="book-cat" className="block text-xs font-semibold text-[#415850]">
                Bölüm
              </label>
              <select
                id="book-cat"
                value={bookCategory}
                onChange={(e) => setBookCategory(e.target.value as BookItem['category'])}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              >
                <option value="taryh">Taryh we Miras</option>
                <option value="seýisçilik">Seýisçilik</option>
                <option value="weterinariýa">Weterinariýa</option>
                <option value="ekologiýa">Ekologiýa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <label htmlFor="book-year" className="block text-xs font-semibold text-[#415850]">
                Neşir ýyly
              </label>
              <input
                id="book-year"
                type="number"
                min={1990}
                max={2035}
                value={bookYear}
                onChange={(e) => setBookYear(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm font-mono tabular-nums text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="book-pages" className="block text-xs font-semibold text-[#415850]">
                Sahypa sany
              </label>
              <input
                id="book-pages"
                type="number"
                min={16}
                max={2000}
                value={bookPages}
                onChange={(e) => setBookPages(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm font-mono tabular-nums text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="book-lang" className="block text-xs font-semibold text-[#415850]">
                Dili
              </label>
              <select
                id="book-lang"
                value={bookLanguage}
                onChange={(e) => setBookLanguage(e.target.value as BookItem['language'])}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              >
                <option value="Türkmençe">Türkmençe</option>
                <option value="Türkmençe / Iňlisçe">Türkmençe / Iňlisçe</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="book-summary" className="block text-xs font-semibold text-[#415850]">
              Gysgaça mazmuny
            </label>
            <textarea
              id="book-summary"
              rows={3}
              value={bookSummary}
              onChange={(e) => setBookSummary(e.target.value)}
              placeholder="Kitabyň esasy temasy we ylmy-medeni ähmiýeti..."
              className="w-full p-3.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-sm text-[#0F241D] focus:bg-white focus:outline-2 focus:outline-[#10B981]"
              required
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={bookFeatured}
              onChange={(e) => setBookFeatured(e.target.checked)}
              className="w-4 h-4 accent-[#064E3B] rounded cursor-pointer"
            />
            <span className="text-xs sm:text-sm text-[#0F241D]">
              Esasy saýlanan neşirler hatarynda görkez
            </span>
          </label>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#EEF3F1]">
            <Button type="button" variant="ghost" onClick={() => setBookModalOpen(false)}>
              Ýatyr
            </Button>
            <Button type="submit" variant="primary" loading={bookSaving}>
              {editingBookId ? 'Kitaby täzele' : 'Kitaby goş'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Pozmak tassyklamasy */}
      <Modal
        isOpen={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        title="Ýazgyny pozmak"
        size="sm"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setDeleteConfirm(null)}>
              Ýatyr
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={deleting}
              onClick={handleConfirmDelete}
              className="bg-[#DC2626] hover:bg-[#B91C1C]"
            >
              Poz
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#415850]">
          <strong>«{deleteConfirm?.title}»</strong> ýazgysyny sanawdan hemişelik aýyrmak
          isleýärsiňizmi?
        </p>
      </Modal>
    </div>
  );
};
