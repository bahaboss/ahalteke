import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Compass } from 'lucide-react';
import { Card } from './Card';

export interface RoutePlaceholderProps {
  sectionLabel: string;
  title: string;
  description: string;
  routePath: string;
  plannedItems?: string[];
  primaryAction?: {
    label: string;
    to: string;
  };
  secondaryAction?: {
    label: string;
    to: string;
  };
}

export const RoutePlaceholder: React.FC<RoutePlaceholderProps> = ({
  sectionLabel,
  title,
  description,
  routePath,
  plannedItems = [],
  primaryAction,
  secondaryAction,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-[#059669]">
          {sectionLabel} · <span className="font-mono text-[#647A72]">{routePath}</span>
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0F241D] leading-tight text-balance">
          {title}
        </h1>
        <p className="text-sm text-[#415850] max-w-2xl leading-relaxed">{description}</p>
      </div>

      <Card padding="lg" className="bg-white space-y-5">
        <div className="flex items-start gap-4">
          <span className="w-12 h-12 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#064E3B] flex items-center justify-center shrink-0">
            <Compass className="w-6 h-6" aria-hidden="true" />
          </span>
          <div className="space-y-1.5">
            <h2 className="font-display text-lg font-bold text-[#0F241D]">
              Ýakorsyz Arassa URL Marşruty Taýýar
            </h2>
            <p className="text-sm text-[#415850] leading-relaxed">
              Bu ekran umumy Design System, merkezi Global Store we goragly React Router binýadyna
              birikdirildi. Indiki modul täzelenmelerinde göni şu marşrutda giňeldiler.
            </p>
          </div>
        </div>

        {plannedItems.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#EEF3F1]">
            {plannedItems.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-[#0F241D]">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {(primaryAction || secondaryAction) && (
          <div className="pt-3 border-t border-[#EEF3F1] flex flex-wrap items-center gap-3">
            {primaryAction && (
              <Link
                to={primaryAction.to}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#064E3B] text-white text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#04392B] transition-colors whitespace-nowrap"
              >
                <span>{primaryAction.label}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            )}
            {secondaryAction && (
              <Link
                to={secondaryAction.to}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#EEF3F1] text-[#064E3B] text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#DCE6E1] transition-colors whitespace-nowrap"
              >
                <span>{secondaryAction.label}</span>
              </Link>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
