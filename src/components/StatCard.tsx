import { ReactNode } from 'react';

type StatCardProps = {
  label: string;
  value: string | number | null | undefined;
  subValue?: string | number | null;
  icon?: ReactNode;
};

export default function StatCard({ label, value, subValue, icon }: StatCardProps) {
  const displayValue = value !== undefined && value !== null && value !== '' ? value : '—';

  return (
    <div className="bg-card backdrop-blur-[8px] border border-border-custom p-5 rounded-lg flex flex-col justify-between hover:border-border-hover hover:bg-[#1A1A24]/40 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
          {label}
        </span>
        {icon && (
          <div className="text-zinc-600 group-hover:text-accent transition-colors duration-300">
            {icon}
          </div>
        )}
      </div>
      <div>
        <div className="text-xl font-bold tracking-tight text-[#FAFAFA] font-display group-hover:text-accent transition-colors duration-300">
          {displayValue}
        </div>
        {subValue && (
          <div className="text-[11px] text-zinc-600 mt-1 font-mono">
            {subValue}
          </div>
        )}
      </div>
    </div>
  );
}
