import React, { useState } from 'react';
import { Check, Download, Share, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Button } from './Button';
import { Modal } from './Modal';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#059669] whitespace-nowrap shrink-0">
        <Check className="w-4 h-4" aria-hidden="true" />
        Gurnalan
      </span>
    );
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuideModal(true);
  };

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        onClick={handleClick}
        leftIcon={isIOS ? <Smartphone className="w-4 h-4" /> : <Download className="w-4 h-4" />}
      >
        {isInstallable ? 'Goşundyny Gurna' : 'PWA Gurnamak'}
      </Button>

      <Modal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        title="Telefona ýa-da Kompýutere Gurnamak (PWA)"
        subtitle="«Smart & Green Ahalteke» oflaýn goldawly Progressive Web App hökmünde taýýarlandy."
        size="sm"
        footer={
          <Button variant="primary" size="sm" onClick={() => setShowGuideModal(false)}>
            Düşnükli
          </Button>
        }
      >
        {isIOS ? (
          <div className="space-y-3 text-[#415850]">
            <p className="text-[#0F241D] font-medium">iPhone / iPad (Safari) üçin ädimler:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li className="flex items-start gap-1.5">
                <span>
                  Safari panelindäki <strong className="text-[#064E3B]">Paýlaş (Share)</strong>{' '}
                  <Share className="inline w-3.5 h-3.5 text-[#064E3B]" /> düwmesine basyň.
                </span>
              </li>
              <li>
                Aşak süýşürip, <strong className="text-[#064E3B]">«Baş ekrana goş» (Add to Home Screen)</strong>{' '}
                bölümini saýlaň.
              </li>
              <li>
                Ýokarky sag burçdan <strong className="text-[#064E3B]">Goş (Add)</strong> düwmesini tassyklaň.
              </li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3 text-[#415850]">
            <p className="text-[#0F241D] font-medium">Chrome / Edge / Android üçin gurnama:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                Brauzeriň salgy zolagyndaky <strong className="text-[#064E3B]">Gurnamak (Install)</strong> nyşanyna ýa-da
                menýudan <strong className="text-[#064E3B]">«Goşundy hökmünde gurna»</strong> düwmesine basyň.
              </li>
              <li>
                Service Worker oflaýn keşleýiş işjeňdir we tema reňki <code className="font-mono text-xs">#064E3B</code>{' '}
                sazlandy.
              </li>
            </ol>
          </div>
        )}
      </Modal>
    </>
  );
};
