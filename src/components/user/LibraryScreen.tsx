import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  FileText,
  Headphones,
  Quote,
  Search,
  SlidersHorizontal,
  Type,
  UserPen,
  X,
} from 'lucide-react';
import { useAppStore } from '../../store';
import type { BookItem } from '../../types';
import { Button, Card, Modal } from '../common';

type BookCategoryFilter = 'all' | BookItem['category'];
type ReaderFontSize = 'sm' | 'md' | 'lg';

const BOOK_CATEGORIES: { id: BookCategoryFilter; label: string }[] = [
  { id: 'all', label: 'Ähli kitaplar' },
  { id: 'taryh', label: 'Taryh we Miras' },
  { id: 'seýisçilik', label: 'Seýisçilik' },
  { id: 'weterinariýa', label: 'Weterinariýa' },
  { id: 'ekologiýa', label: 'Ýaşyl we Ösüş' },
];

const CATEGORY_LABELS: Record<BookItem['category'], string> = {
  taryh: 'Taryh we Miras',
  seýisçilik: 'Seýisçilik sungaty',
  weterinariýa: 'Weterinariýa',
  ekologiýa: 'Ýaşyl we Ösüş',
};

const READER_FONT_CLASSES: Record<ReaderFontSize, { body: string; heading: string; label: string }> =
  {
    sm: { body: 'text-sm leading-6', heading: 'text-base', label: 'Kiçi' },
    md: { body: 'text-[15px] leading-7', heading: 'text-lg', label: 'Kadaly' },
    lg: { body: 'text-base sm:text-[17px] leading-8', heading: 'text-xl', label: 'Uly' },
  };

export const LibraryScreen: React.FC = () => {
  const { books, isHydrating } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<BookCategoryFilter>('all');
  const [readingBook, setReadingBook] = useState<BookItem | null>(null);
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [readerFontSize, setReaderFontSize] = useState<ReaderFontSize>('md');

  const authorOptions = useMemo(() => {
    const authors = new Set<string>();
    books.forEach((b) => authors.add(b.author));
    return Array.from(authors);
  }, [books]);

  const openBookModal = (book: BookItem) => {
    setReadingBook(book);
    setActiveChapterIdx(0);
  };

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return books.filter((book) => {
      if (selectedCategory !== 'all' && book.category !== selectedCategory) return false;
      if (selectedAuthor !== 'all' && book.author !== selectedAuthor) return false;
      if (!q) return true;
      return (
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.summary.toLowerCase().includes(q) ||
        (book.chapters ?? []).some(
          (ch) => ch.title.toLowerCase().includes(q) || ch.content.toLowerCase().includes(q)
        )
      );
    });
  }, [books, searchQuery, selectedAuthor, selectedCategory]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 || selectedAuthor !== 'all' || selectedCategory !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedAuthor('all');
    setSelectedCategory('all');
  };

  const activeChapters = readingBook?.chapters ?? [];
  const currentChapter = activeChapters[activeChapterIdx];
  const fontStyle = READER_FONT_CLASSES[readerFontSize];

  return (
    <div className="space-y-6">
      {/* Ekran başlygy */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#059669]">
            Milli Atçylyk Sanly Kitaphanasy
          </p>
          <h1 className="font-display mt-1 text-2xl sm:text-3xl font-bold text-[#0F172A]">
            Kitaphana
          </h1>
          <p className="mt-1.5 text-sm text-[#415850] max-w-2xl leading-relaxed">
            Gahryman Arkadagymyzyň we Hormatly Prezidentimiziň türkmen bedewlerine, milli
            seýisçilige we ýaşyl ösüşe bagyşlanan eserleriniň sanawy, bölümleri we arassa okaýyş
            penjiresi.
          </p>
        </div>

        <div className="flex items-center gap-5 text-sm text-[#415850] shrink-0">
          <div>
            <span className="text-xs text-[#647A72] block">Jemi eser</span>
            <span className="text-xl font-bold text-[#064E3B] font-mono tabular-nums">
              {books.length}
            </span>
          </div>
          <div className="h-8 w-px bg-[#DCE6E1]" aria-hidden="true" />
          <div>
            <span className="text-xs text-[#647A72] block">Formatlar</span>
            <span className="text-sm font-bold text-[#064E3B]">PDF · EPUB · Audio</span>
          </div>
        </div>
      </div>

      {/* Gözleg, Awtor we Ugur süzgüji */}
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
              placeholder="Kitabyň ady, awtory ýa-da bölümi boýunça gözle..."
              aria-label="Kitap gözlegi"
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
            <UserPen
              className="w-4 h-4 text-[#059669] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              aria-label="Awtor boýunça süzgüç"
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 text-sm bg-[#F8FAF9] border border-[#DCE6E1] rounded-xl text-[#0F172A] focus:outline-none focus:border-[#064E3B] focus:bg-white transition-colors cursor-pointer"
            >
              <option value="all">Ähli awtorlar</option>
              {authorOptions.map((author) => (
                <option key={author} value={author}>
                  {author}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Kitap ugry">
            {BOOK_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={[
                    'min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer',
                    active
                      ? 'bg-[#064E3B] text-white'
                      : 'bg-[#F8FAF9] text-[#415850] border border-[#DCE6E1] hover:border-[#064E3B]/40 hover:text-[#064E3B]',
                  ].join(' ')}
                >
                  {cat.label}
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
              Süzgüji arassala ({filteredBooks.length}/{books.length})
            </button>
          )}
        </div>
      </div>

      {/* Kitap kartoçkalary */}
      {isHydrating && books.length === 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-56 rounded-2xl bg-white border border-[#DCE6E1] animate-pulse"
            />
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <Card padding="lg" className="text-center bg-white">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#EEF3F1] flex items-center justify-center text-[#064E3B]">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="font-display mt-4 text-lg font-bold text-[#0F172A]">
            Gözlegiňize laýyk kitap tapylmady
          </h2>
          <p className="mt-1.5 text-sm text-[#415850]">
            Awtor, ugur ýa-da gözleg sözüni arassalap, ähli milli neşirleri görüp bilersiňiz.
          </p>
          <div className="mt-5">
            <Button variant="outline" onClick={resetFilters}>
              Süzgüji arassala
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredBooks.map((book) => {
            const spineColor = book.accentColor ?? '#064E3B';
            const chapterCount = book.chapters?.length ?? 0;

            return (
              <Card
                key={book.id}
                padding="md"
                interactive
                onClick={() => openBookModal(book)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openBookModal(book);
                  }
                }}
                className="bg-white flex flex-col sm:flex-row gap-5 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10B981]"
              >
                {/* Kitap jildiniň 3D stili */}
                <div
                  className="relative w-full sm:w-32 h-40 sm:h-auto sm:min-h-[184px] rounded-xl p-3.5 flex flex-col justify-between text-white shrink-0 overflow-hidden shadow-[4px_6px_18px_rgba(6,78,59,0.16)] transition-transform duration-300 group-hover:-translate-y-0.5"
                  style={{ backgroundColor: spineColor }}
                >
                  <div
                    className="absolute inset-y-0 left-0 w-2 bg-black/20"
                    aria-hidden="true"
                  />
                  <div
                    className="absolute inset-2 rounded-lg border border-[#D4AF37]/40 pointer-events-none"
                    aria-hidden="true"
                  />
                  <div className="relative pl-1.5">
                    <span className="block text-[10px] font-mono tabular-nums uppercase tracking-[0.14em] text-[#D4AF37] font-semibold">
                      {book.publishYear}
                    </span>
                  </div>
                  <div className="relative pl-1.5">
                    <p className="font-display text-sm font-bold leading-snug line-clamp-3">
                      {book.title}
                    </p>
                  </div>
                  <div className="relative pl-1.5 text-[11px] text-white/80 truncate">
                    {book.author}
                  </div>
                </div>

                {/* Kitap mazmuny */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#647A72]">
                    <span className="font-semibold text-[#059669]">
                      {CATEGORY_LABELS[book.category]}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{book.pages} sahypa</span>
                    {chapterCount > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{chapterCount} bölüm</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{book.language}</span>
                  </div>

                  <h2 className="font-display mt-1.5 text-lg font-bold text-[#0F172A] leading-snug group-hover:text-[#064E3B] transition-colors">
                    {book.title}
                  </h2>

                  <p className="mt-0.5 text-xs font-semibold text-[#856510]">{book.author}</p>

                  <p className="mt-2.5 text-sm text-[#415850] leading-relaxed line-clamp-3">
                    {book.summary}
                  </p>

                  <div className="mt-auto pt-4 flex items-center justify-between gap-3 border-t border-[#EEF3F1]">
                    <span className="text-xs font-mono text-[#647A72]">
                      {book.availableFormats.join(' · ')}
                    </span>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openBookModal(book);
                      }}
                      leftIcon={<BookOpen className="w-3.5 h-3.5" aria-hidden="true" />}
                    >
                      Giňişleýin oka
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Giňişleýin Okamak Modaly (Şrift ölçegi we bölüm geçişleri bilen) */}
      <Modal
        isOpen={Boolean(readingBook)}
        onClose={() => setReadingBook(null)}
        title={readingBook?.title ?? ''}
        subtitle={
          readingBook
            ? `${readingBook.author} · ${readingBook.publishYear} ý. · ${readingBook.pages} sahypa`
            : undefined
        }
        size="lg"
        footer={
          <div className="w-full flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-[#647A72]">
              <span className="inline-flex items-center gap-1 font-mono">
                <FileText className="w-3.5 h-3.5 text-[#064E3B]" aria-hidden="true" />
                {readingBook?.availableFormats.join(' · ')}
              </span>
              {readingBook?.availableFormats.includes('Audio') && (
                <span className="inline-flex items-center gap-1 text-[#059669] font-medium">
                  <Headphones className="w-3.5 h-3.5" aria-hidden="true" />
                  Audio wersiýa elýeterli
                </span>
              )}
            </div>
            <Button variant="primary" onClick={() => setReadingBook(null)}>
              Okamagy tamamlamak
            </Button>
          </div>
        }
      >
        {readingBook && (
          <div className="space-y-5">
            {/* Şrift ölçegini sazlamak zolagy */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1]">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#415850]">
                <Type className="w-3.5 h-3.5 text-[#064E3B]" aria-hidden="true" />
                Okaýyş şriftiniň ölçegi: <strong className="text-[#064E3B]">{fontStyle.label}</strong>
              </span>
              <div className="inline-flex items-center gap-1" role="group" aria-label="Şrift ölçegi">
                {(
                  [
                    { id: 'sm' as ReaderFontSize, label: 'A−' },
                    { id: 'md' as ReaderFontSize, label: 'A' },
                    { id: 'lg' as ReaderFontSize, label: 'A+' },
                  ]
                ).map((opt) => {
                  const active = readerFontSize === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setReaderFontSize(opt.id)}
                      aria-pressed={active}
                      className={[
                        'min-w-[36px] min-h-[32px] px-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                        active
                          ? 'bg-[#064E3B] text-white'
                          : 'bg-white border border-[#DCE6E1] text-[#415850] hover:border-[#064E3B]/50',
                      ].join(' ')}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gysgaça mazmun */}
            <div className="p-4 rounded-2xl bg-[#F8FAF9] border border-[#DCE6E1]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#059669]">
                Eseriň gysgaça mazmuny
              </p>
              <p className={`mt-1.5 text-[#0F172A] ${fontStyle.body}`}>{readingBook.summary}</p>
            </div>

            {/* Pähimler / Sitatlar */}
            {readingBook.keyQuotes && readingBook.keyQuotes.length > 0 && (
              <div className="space-y-2.5">
                {readingBook.keyQuotes.map((quoteText) => (
                  <blockquote
                    key={quoteText}
                    className="p-4 rounded-2xl bg-[#064E3B] text-white flex items-start gap-3"
                  >
                    <Quote
                      className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <p className="font-display text-sm sm:text-base italic leading-relaxed text-white/95">
                      «{quoteText}»
                    </p>
                  </blockquote>
                ))}
              </div>
            )}

            {/* Bölümler boýunça okamak */}
            {activeChapters.length > 0 && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Kitap bölümleri">
                  {activeChapters.map((chapter, idx) => {
                    const isSelected = idx === activeChapterIdx;
                    return (
                      <button
                        key={chapter.title}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setActiveChapterIdx(idx)}
                        className={[
                          'min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-[#064E3B] text-white'
                            : 'bg-[#F8FAF9] text-[#415850] border border-[#DCE6E1] hover:border-[#064E3B]/40',
                        ].join(' ')}
                      >
                        {chapter.title}
                      </button>
                    );
                  })}
                </div>

                {currentChapter && (
                  <article className="p-5 rounded-2xl bg-white border border-[#DCE6E1] space-y-3">
                    <h4 className={`font-display font-bold text-[#064E3B] ${fontStyle.heading}`}>
                      {currentChapter.title}
                    </h4>
                    <p className={`text-[#0F172A] ${fontStyle.body}`}>{currentChapter.content}</p>
                  </article>
                )}

                {activeChapters.length > 1 && (
                  <div className="flex items-center justify-between pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={activeChapterIdx === 0}
                      onClick={() => setActiveChapterIdx((prev) => Math.max(0, prev - 1))}
                    >
                      Öňki bölüm
                    </Button>
                    <span className="text-xs font-mono text-[#647A72] tabular-nums">
                      {activeChapterIdx + 1} / {activeChapters.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={activeChapterIdx >= activeChapters.length - 1}
                      onClick={() =>
                        setActiveChapterIdx((prev) =>
                          Math.min(activeChapters.length - 1, prev + 1)
                        )
                      }
                    >
                      Indiki bölüm
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
