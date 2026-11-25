import React, { useEffect, useState } from 'react';
import {
  Box,
  CheckCircle2,
  GraduationCap,
  Lock,
  ShieldCheck,
  Stethoscope,
  UserCheck,
} from 'lucide-react';
import { Button, Modal } from '../common';

export type AccessRoleChoice = 'user' | 'staff' | 'academy' | 'admin';

export interface RoleAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFocus?: AccessRoleChoice;
  onOpenDesignSystem: () => void;
}

interface RoleOption {
  id: AccessRoleChoice;
  title: string;
  subtitle: string;
  statusText: string;
  availableInNextPhase: boolean;
  isAdminPlaceholder?: boolean;
  icon: React.ReactNode;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'user',
    title: 'Ulanyjy / At Eýesi',
    subtitle: 'Bedewleriň QR pasporty, bäsleşikler, kitaphana we şahsy kabinet.',
    statusText: 'Indiki tapgyrda doly işjeňleşdiriler',
    availableInNextPhase: true,
    icon: <UserCheck className="w-5 h-5 text-[#064E3B]" aria-hidden="true" />,
  },
  {
    id: 'staff',
    title: 'Işgär / Seýis / Weterinar',
    subtitle: 'IoT datçik gözegçiligi, gündelik iýmitlendiriş, türgenleşik we eko-hasabatlar.',
    statusText: 'Indiki tapgyrda doly işjeňleşdiriler',
    availableInNextPhase: true,
    icon: <Stethoscope className="w-5 h-5 text-[#064E3B]" aria-hidden="true" />,
  },
  {
    id: 'academy',
    title: 'Ýaş Seýis Dalaşgärligi',
    subtitle: 'Aba Annaýew adyndaky Halkara atçylyk akademiýasyna sanly arza tabşyrmak.',
    statusText: 'Indiki tapgyrda doly işjeňleşdiriler',
    availableInNextPhase: true,
    icon: <GraduationCap className="w-5 h-5 text-[#064E3B]" aria-hidden="true" />,
  },
  {
    id: 'admin',
    title: 'Admin Dolandyryş Paneli',
    subtitle: 'Ulgam derejesinde rollar, atçylyk toplumlary we bitewi audit gözegçiligi.',
    statusText: 'Geljekki tapgyr üçin meýilleşdirilen (Placeholder)',
    availableInNextPhase: false,
    isAdminPlaceholder: true,
    icon: <Lock className="w-5 h-5 text-[#647A72]" aria-hidden="true" />,
  },
];

export const RoleAccessModal: React.FC<RoleAccessModalProps> = ({
  isOpen,
  onClose,
  initialFocus = 'user',
  onOpenDesignSystem,
}) => {
  const [selectedRole, setSelectedRole] = useState<AccessRoleChoice>(initialFocus);
  const [confirmedMessage, setConfirmedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedRole(initialFocus);
      setConfirmedMessage(null);
    }
  }, [isOpen, initialFocus]);

  const activeOption = ROLE_OPTIONS.find((item) => item.id === selectedRole) ?? ROLE_OPTIONS[0];

  const handleConfirmSelection = () => {
    if (activeOption.isAdminPlaceholder) {
      setConfirmedMessage(
        'Admin paneli häzirki hakaton tapgyrynda gurulmaýar — diňe ulgam arhitekturasynda geljekki tapgyr üçin kesgitlenendir.'
      );
      return;
    }
    setConfirmedMessage(
      `«${activeOption.title}» ugry saýlandy. Doly giriş we rol kabineti indiki tapgyrda açylar (häzirki 2-nji ädim — Baş sahypa we 3D Hekaýa).`
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setConfirmedMessage(null);
        onClose();
      }}
      title="Giriş / Hasap açmak — Rol Saýlawy"
      subtitle="«Smart & Green Ahalteke» platformasynda işlemek isleýän ugruňyzy saýlaň."
      size="lg"
      footer={
        <div className="w-full flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Box className="w-4 h-4" />}
            onClick={() => {
              setConfirmedMessage(null);
              onClose();
              onOpenDesignSystem();
            }}
          >
            1-nji ädim: 3D Athana we Dizaýn Sergisi
          </Button>
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setConfirmedMessage(null);
                onClose();
              }}
            >
              Ýapmak
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmSelection}>
              Saýlawy tassykla
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {ROLE_OPTIONS.map((option) => {
            const isSelected = selectedRole === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setSelectedRole(option.id);
                  setConfirmedMessage(null);
                }}
                className={[
                  'text-left rounded-2xl p-4 border transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#10B981]',
                  option.isAdminPlaceholder
                    ? isSelected
                      ? 'bg-[#F8FAF9] border-[#647A72] ring-1 ring-[#647A72]/30'
                      : 'bg-[#F8FAF9]/80 border-[#DCE6E1] opacity-85 hover:opacity-100'
                    : isSelected
                    ? 'bg-[#ECFDF5]/60 border-[#064E3B] ring-1 ring-[#064E3B]/20'
                    : 'bg-white border-[#DCE6E1] hover:border-[#064E3B]/45',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={[
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      option.isAdminPlaceholder ? 'bg-[#EEF3F1]' : 'bg-[#ECFDF5]',
                    ].join(' ')}
                  >
                    {option.icon}
                  </span>
                  {isSelected && (
                    <CheckCircle2
                      className={option.isAdminPlaceholder ? 'w-5 h-5 text-[#647A72]' : 'w-5 h-5 text-[#064E3B]'}
                      aria-hidden="true"
                    />
                  )}
                </div>

                <h4 className="mt-3 font-semibold text-base text-[#0F241D]">{option.title}</h4>
                <p className="mt-1 text-xs text-[#415850] leading-relaxed">{option.subtitle}</p>
                <p className="mt-2.5 text-[11px] font-medium text-[#647A72]">{option.statusText}</p>
              </button>
            );
          })}
        </div>

        {confirmedMessage && (
          <div className="rounded-xl bg-[#ECFDF5] border border-[#10B981]/35 p-4 flex items-start gap-3 text-sm text-[#064E3B]">
            <ShieldCheck className="w-5 h-5 text-[#059669] shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-relaxed">{confirmedMessage}</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
