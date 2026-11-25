import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  GraduationCap,
  Mail,
  Phone,
  School,
  Send,
  Sparkles,
} from 'lucide-react';
import {
  ACADEMY_ADMISSION_REQUIREMENTS,
  ACADEMY_OFFICIAL_URL,
  ACADEMY_SPECIALTIES,
  TURKMEN_REGIONS,
} from '../../mockData';
import { useAppStore } from '../../store';
import type { AcademyApplication, AuthSession } from '../../types';
import { Button, Card } from '../common';

export interface AcademyApplyScreenProps {
  session: AuthSession;
}

const STATUS_META: Record<
  AcademyApplication['status'],
  { label: string; textColor: string; dotColor: string }
> = {
  garalýar: {
    label: 'Garaşylýar',
    textColor: 'text-[#92400E]',
    dotColor: 'bg-[#D4AF37]',
  },
  söhbetdeşlik: {
    label: 'Söhbetdeşlik',
    textColor: 'text-[#0369A1]',
    dotColor: 'bg-[#0369A1]',
  },
  tassyklandy: {
    label: 'Kabul edildi',
    textColor: 'text-[#065F46]',
    dotColor: 'bg-[#10B981]',
  },
};

const EXPERIENCE_OPTIONS: { value: AcademyApplication['experienceLevel']; label: string }[] = [
  { value: 'başlangyç', label: 'Başlangyç (atçylyga täze höwesjeň)' },
  { value: 'orta', label: 'Orta (atlara ideg we türgenleşik tejribesi bar)' },
  { value: 'ýokary', label: 'Ýokary (seýisçilik ýa-da sport tejribesi bar)' },
];

type FieldErrors = Partial<
  Record<'applicantName' | 'age' | 'schoolName' | 'phone' | 'email' | 'motivationNote', string>
>;

export const AcademyApplyScreen: React.FC<AcademyApplyScreenProps> = ({ session }) => {
  const { complexes, academyApplications, submitApplication, isHydrating } = useAppStore();

  const initialIsEmail = session.emailOrPhone?.includes('@') ?? false;

  const [applicantName, setApplicantName] = useState(session.fullName || '');
  const [age, setAge] = useState('19');
  const [schoolName, setSchoolName] = useState('');
  const [phone, setPhone] = useState(initialIsEmail ? '+993 ' : session.emailOrPhone || '+993 ');
  const [email, setEmail] = useState(initialIsEmail ? session.emailOrPhone : '');
  const [region, setRegion] = useState(session.region || TURKMEN_REGIONS[0]);
  const [programName, setProgramName] = useState(ACADEMY_SPECIALTIES[0].name);
  const [experienceLevel, setExperienceLevel] =
    useState<AcademyApplication['experienceLevel']>('başlangyç');
  const [preferredComplexId, setPreferredComplexId] = useState('cmp-academy-04');
  const [motivationNote, setMotivationNote] = useState('');

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (complexes.length > 0 && !complexes.some((c) => c.id === preferredComplexId)) {
      const academyComplex = complexes.find((c) => c.id === 'cmp-academy-04');
      setPreferredComplexId(academyComplex ? academyComplex.id : complexes[0].id);
    }
  }, [complexes, preferredComplexId]);

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateFields = (): FieldErrors => {
    const errors: FieldErrors = {};
    const cleanName = applicantName.trim();
    const numericAge = Number(age);
    const cleanSchool = schoolName.trim();
    const cleanPhoneDigits = phone.replace(/\D/g, '');
    const cleanEmail = email.trim();
    const cleanNote = motivationNote.trim();

    if (cleanName.length < 3 || !cleanName.includes(' ')) {
      errors.applicantName = 'Doly familiýaňyzy we adyňyzy (meselem: Merdan Amanow) giriziň.';
    }
    if (!Number.isFinite(numericAge) || numericAge < 16 || numericAge > 35) {
      errors.age = 'Ýaş 16 bilen 35 aralygynda bolmaly.';
    }
    if (cleanSchool.length < 3) {
      errors.schoolName = 'Okan mekdebiňizi ýa-da okuw jaýyňyzy görkeziň.';
    }
    if (cleanPhoneDigits.length < 8 || cleanPhoneDigits.length > 15) {
      errors.phone = 'Dogry telefon belgisini giriziň (meselem: +993 65 12 34 56).';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      errors.email = 'Dogry e-poçta (email) salgysyny giriziň.';
    }
    if (cleanNote.length < 15) {
      errors.motivationNote = `Düşündiriş azyndan 15 nyşan bolmaly (häzir ${cleanNote.length}/15).`;
    }
    return errors;
  };

  const handleSelectSpecialty = (specialtyName: string) => {
    setProgramName(specialtyName);
    const formEl = document.getElementById('academy-application-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError('Anketany ugratmazdan öň gyzyl bilen bellenen meýdançalary dogry dolduryň.');
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      // TODO: [BACKEND_API] POST /api/v1/academy/applications — submitApplication() arkaly merkezi Store-a we backend-e ugratmak.
      const created = await submitApplication({
        applicantName,
        age: Number(age),
        region,
        schoolName,
        phone,
        email,
        programName,
        experienceLevel,
        preferredComplexId,
        motivationNote,
      });

      setSchoolName('');
      setMotivationNote('');
      setFormSuccess(
        `Dalaşgärlik anketasy üstünlikli kabul edildi (Arza belgisi: ${created.id.toUpperCase()}). Arzaňyz Admin paneline ugradyldy we ýagdaýyny aşakdan yzarlap bilersiňiz.`
      );
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Anketany ugratmakda säwlik ýüze çykdy.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    [
      'w-full min-h-[44px] px-3.5 py-2.5 text-sm rounded-xl text-[#0F172A] transition-colors focus:outline-none focus:bg-white',
      hasError
        ? 'bg-[#FEF2F2] border border-[#EF4444] focus:border-[#EF4444]'
        : 'bg-[#F8FAF9] border border-[#DCE6E1] focus:border-[#064E3B]',
    ].join(' ');

  return (
    <div className="space-y-6">
      {/* Akademiýa tanyşdyryş kartoçkasy */}
      <Card variant="emerald" padding="lg" className="relative overflow-hidden">
        <div
          className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-[#D4AF37]/12 pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#D4AF37]">
              Arkadag Şäheri · Ýokary Bilim Oçagy
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
              Aba Annaýew adyndaky Halkara atçylyk akademiýasyna dalaşgärlik
            </h1>
            <p className="text-sm text-white/85 leading-relaxed">
              Milli seýisçilik sungatyny, weterinar lukmançylygyny, «Ýaşyl Athana»
              eko-inženerçiligini we atçylyk sportuny döwrebap bilim standartlarynda öwrenmek
              isleýän ýaşlar üçin onlaýn dalaşgärlik portaly.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <a
              href={ACADEMY_OFFICIAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 py-2.5 rounded-xl bg-[#D4AF37] text-[#0F172A] font-semibold text-sm hover:bg-[#C39D27] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span>Resmi web saýtyna geçmek</span>
              <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
            </a>
            <span className="text-xs text-white/75 text-center font-mono">
              ihba.edu.tm · Arkadag şäheri
            </span>
          </div>
        </div>
      </Card>

      {/* Hünärler we Kabul ediş şertleri */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.45fr_1fr] gap-5">
        <div className="space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-xl font-bold text-[#0F172A] flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#064E3B]" aria-hidden="true" />
              Akademiýanyň esasy hünärleri
            </h2>
            <span className="text-xs text-[#647A72]">Saýlamak üçin üstüne basyň</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ACADEMY_SPECIALTIES.map((spec) => {
              const isSelected = programName === spec.name;
              return (
                <Card
                  key={spec.id}
                  padding="md"
                  interactive
                  onClick={() => handleSelectSpecialty(spec.name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSelectSpecialty(spec.name);
                    }
                  }}
                  className={[
                    'flex flex-col justify-between gap-3 bg-white',
                    isSelected ? 'ring-2 ring-[#064E3B] border-[#064E3B] bg-[#F8FAF9]' : '',
                  ].join(' ')}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-[#647A72]">
                      <span className="font-semibold text-[#059669]">{spec.duration}</span>
                      <span className="font-mono tabular-nums">{spec.seats} orun</span>
                    </div>
                    <h3 className="font-display mt-1.5 text-base font-bold text-[#0F172A] leading-snug">
                      {spec.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-[#647A72]">{spec.faculty}</p>
                    <p className="mt-2.5 text-sm text-[#415850] leading-relaxed">{spec.summary}</p>
                  </div>

                  <div className="pt-2 border-t border-[#EEF3F1] text-xs font-semibold text-[#064E3B]">
                    {isSelected ? '✓ Anketada saýlandy' : 'Bu hünäri saýla →'}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Kabul ediş şertleri */}
        <Card padding="md" className="bg-white flex flex-col justify-between gap-5">
          <div>
            <h2 className="font-display text-xl font-bold text-[#0F172A] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D4AF37]" aria-hidden="true" />
              Kabul ediş şertleri
            </h2>
            <p className="mt-1 text-xs text-[#647A72]">
              2026–2027-nji okuw ýyly üçin dalaşgärlere bildirilýän esasy talaplar
            </p>

            <ul className="mt-4 space-y-3">
              {ACADEMY_ADMISSION_REQUIREMENTS.map((req, index) => (
                <li key={req} className="flex items-start gap-3 text-sm text-[#0F172A]">
                  <span className="w-6 h-6 rounded-lg bg-[#EEF3F1] text-[#064E3B] font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed text-[#415850]">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] text-xs text-[#415850] leading-relaxed">
            <strong className="text-[#064E3B]">Bellik:</strong> Onlaýn anketany tabşyranyňyzdan
            soň, kabul ediş topary siziň telefon belgiňiz we e-poçtaňyz arkaly söhbetdeşlik senesini
            tassyklar.
          </div>
        </Card>
      </div>

      {/* Onlaýn dalaşgärlik anketasy we Tabşyrylan arzalarym */}
      <div
        id="academy-application-form"
        className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-5 items-start"
      >
        <Card padding="lg" className="bg-white">
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#EEF3F1]">
            <div>
              <h2 className="font-display text-xl font-bold text-[#0F172A]">
                Onlaýn dalaşgärlik anketasy
              </h2>
              <p className="mt-1 text-sm text-[#415850]">
                Ähli hökmany meýdançalary dolduryň — arzaňyz derrew kabul ediş ulgamyna düşer.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            {formError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-sm text-[#991B1B]"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div
                role="status"
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#ECFDF5] border border-[#10B981]/40 text-sm text-[#065F46]"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* F.A.A. we Ýaşy */}
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-4">
              <div>
                <label
                  htmlFor="aca-fullname"
                  className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                >
                  F.A.A. (Doly familiýaňyz we adyňyz) <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  id="aca-fullname"
                  type="text"
                  required
                  aria-invalid={Boolean(fieldErrors.applicantName)}
                  value={applicantName}
                  onChange={(e) => {
                    setApplicantName(e.target.value);
                    clearFieldError('applicantName');
                  }}
                  placeholder="Meselem: Merdan Amanow"
                  className={inputClass(Boolean(fieldErrors.applicantName))}
                />
                {fieldErrors.applicantName && (
                  <p className="mt-1 text-xs text-[#EF4444]">{fieldErrors.applicantName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="aca-age"
                  className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                >
                  Ýaşy (16–35) <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  id="aca-age"
                  type="number"
                  min={16}
                  max={35}
                  required
                  aria-invalid={Boolean(fieldErrors.age)}
                  value={age}
                  onChange={(e) => {
                    setAge(e.target.value);
                    clearFieldError('age');
                  }}
                  className={`${inputClass(Boolean(fieldErrors.age))} font-mono tabular-nums`}
                />
                {fieldErrors.age && (
                  <p className="mt-1 text-xs text-[#EF4444]">{fieldErrors.age}</p>
                )}
              </div>
            </div>

            {/* Mekdebi / Okuw jaýy */}
            <div>
              <label
                htmlFor="aca-school"
                className="block text-xs font-semibold text-[#0F172A] mb-1.5"
              >
                Mekdebi ýa-da gutaran okuw jaýy <span className="text-[#EF4444]">*</span>
              </label>
              <div className="relative">
                <School
                  className="w-4 h-4 text-[#647A72] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="aca-school"
                  type="text"
                  required
                  aria-invalid={Boolean(fieldErrors.schoolName)}
                  value={schoolName}
                  onChange={(e) => {
                    setSchoolName(e.target.value);
                    clearFieldError('schoolName');
                  }}
                  placeholder="Meselem: Arkadag şäheriniň 3-nji orta mekdebi"
                  className={`${inputClass(Boolean(fieldErrors.schoolName))} pl-10`}
                />
              </div>
              {fieldErrors.schoolName && (
                <p className="mt-1 text-xs text-[#EF4444]">{fieldErrors.schoolName}</p>
              )}
            </div>

            {/* Telefon we Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="aca-phone"
                  className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                >
                  Telefon belgisi <span className="text-[#EF4444]">*</span>
                </label>
                <div className="relative">
                  <Phone
                    className="w-4 h-4 text-[#647A72] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="aca-phone"
                    type="tel"
                    required
                    aria-invalid={Boolean(fieldErrors.phone)}
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      clearFieldError('phone');
                    }}
                    placeholder="+993 65 12 34 56"
                    className={`${inputClass(Boolean(fieldErrors.phone))} pl-10 font-mono tabular-nums`}
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="mt-1 text-xs text-[#EF4444]">{fieldErrors.phone}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="aca-email"
                  className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                >
                  Email salgysy <span className="text-[#EF4444]">*</span>
                </label>
                <div className="relative">
                  <Mail
                    className="w-4 h-4 text-[#647A72] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="aca-email"
                    type="email"
                    required
                    aria-invalid={Boolean(fieldErrors.email)}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearFieldError('email');
                    }}
                    placeholder="ady.familiyasy@sanly.tm"
                    className={`${inputClass(Boolean(fieldErrors.email))} pl-10`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-[#EF4444]">{fieldErrors.email}</p>
                )}
              </div>
            </div>

            {/* Welaýat we Atçylyk tejribesi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="aca-region"
                  className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                >
                  Welaýat / Şäher
                </label>
                <select
                  id="aca-region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className={inputClass(false)}
                >
                  {TURKMEN_REGIONS.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="aca-experience"
                  className="block text-xs font-semibold text-[#0F172A] mb-1.5"
                >
                  Atçylyk tejribesi
                </label>
                <select
                  id="aca-experience"
                  value={experienceLevel}
                  onChange={(e) =>
                    setExperienceLevel(e.target.value as AcademyApplication['experienceLevel'])
                  }
                  className={inputClass(false)}
                >
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Saýlaýan hünäri */}
            <div>
              <label
                htmlFor="aca-program"
                className="block text-xs font-semibold text-[#0F172A] mb-1.5"
              >
                Saýlaýan hünäriňiz <span className="text-[#EF4444]">*</span>
              </label>
              <select
                id="aca-program"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                className={inputClass(false)}
              >
                {ACADEMY_SPECIALTIES.map((spec) => (
                  <option key={spec.id} value={spec.name}>
                    {spec.name} ({spec.duration})
                  </option>
                ))}
              </select>
            </div>

            {/* Amaly okuw toplumy */}
            <div>
              <label
                htmlFor="aca-complex"
                className="block text-xs font-semibold text-[#0F172A] mb-1.5"
              >
                Amaly okuw üçin isleýän atçylyk toplumyňyz
              </label>
              <select
                id="aca-complex"
                value={preferredComplexId}
                onChange={(e) => setPreferredComplexId(e.target.value)}
                className={inputClass(false)}
              >
                {complexes.map((complex) => (
                  <option key={complex.id} value={complex.id}>
                    {complex.name} ({complex.region})
                  </option>
                ))}
              </select>
            </div>

            {/* Düşündiriş / Höwes haty */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="aca-motivation"
                  className="block text-xs font-semibold text-[#0F172A]"
                >
                  Düşündiriş / Höwes haty <span className="text-[#EF4444]">*</span>
                </label>
                <span className="text-[11px] font-mono tabular-nums text-[#647A72]">
                  {motivationNote.trim().length} / 600
                </span>
              </div>
              <textarea
                id="aca-motivation"
                rows={4}
                required
                maxLength={600}
                aria-invalid={Boolean(fieldErrors.motivationNote)}
                value={motivationNote}
                onChange={(e) => {
                  setMotivationNote(e.target.value);
                  clearFieldError('motivationNote');
                }}
                placeholder="Ahalteke atçylygyna bolan söýgiňiz, geljekki maksatlaryňyz we näme üçin bu hünäri saýlaýandygyňyz barada ýazyň..."
                className={[
                  'w-full px-3.5 py-2.5 text-sm rounded-xl text-[#0F172A] placeholder:text-[#647A72] focus:outline-none focus:bg-white transition-colors resize-y',
                  fieldErrors.motivationNote
                    ? 'bg-[#FEF2F2] border border-[#EF4444] focus:border-[#EF4444]'
                    : 'bg-[#F8FAF9] border border-[#DCE6E1] focus:border-[#064E3B]',
                ].join(' ')}
              />
              {fieldErrors.motivationNote && (
                <p className="mt-1 text-xs text-[#EF4444]">{fieldErrors.motivationNote}</p>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={submitting}
                leftIcon={<Send className="w-4 h-4" aria-hidden="true" />}
              >
                Dalaşgärlik anketasyny ugratmak
              </Button>
            </div>
          </form>
        </Card>

        {/* Tabşyrylan arzalarym (AppStoreContext bilen sinhron) */}
        <Card padding="lg" className="bg-white space-y-4">
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#EEF3F1]">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#064E3B]" aria-hidden="true" />
                Tabşyrylan arzalarym
              </h2>
              <p className="mt-0.5 text-xs text-[#647A72]">
                Ugradylan arzalaryň sanawy we kabul ediş statusy
              </p>
            </div>
            <span className="text-sm font-bold font-mono text-[#064E3B] tabular-nums">
              {academyApplications.length}
            </span>
          </div>

          {isHydrating && academyApplications.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-xl bg-[#F8FAF9] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {academyApplications.map((app) => {
                const statusInfo = STATUS_META[app.status];
                return (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl bg-[#F8FAF9] border border-[#DCE6E1] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#0F172A] truncate">
                          {app.applicantName}
                        </p>
                        <p className="text-xs text-[#647A72] tabular-nums">
                          {app.region} · {app.age} ýaş · {app.submittedAt}
                        </p>
                      </div>
                      <span
                        className={[
                          'inline-flex items-center gap-1.5 text-xs font-semibold shrink-0',
                          statusInfo.textColor,
                        ].join(' ')}
                      >
                        <span
                          className={['w-2 h-2 rounded-full', statusInfo.dotColor].join(' ')}
                          aria-hidden="true"
                        />
                        {statusInfo.label}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-[#064E3B]">{app.programName}</p>

                    {(app.schoolName || app.phone || app.email) && (
                      <div className="text-[11px] text-[#647A72] space-y-0.5">
                        {app.schoolName && <p className="truncate">{app.schoolName}</p>}
                        {(app.phone || app.email) && (
                          <p className="font-mono tabular-nums truncate">
                            {[app.phone, app.email].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-[#415850] leading-relaxed line-clamp-2">
                      {app.motivationNote}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
