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
    <div className="bg-card backdrop-blur-[8px] border border-border-custom py-2.5 px-3.5 rounded-xl flex flex-col justify-between hover:border-border-hover hover:bg-[#1A1A24]/40 transition-all duration-300 group overflow-hidden">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono truncate mr-2">
          {label}
        </span>
        {icon && (
          <div className="text-zinc-600 group-hover:text-accent transition-colors duration-300 shrink-0">
            {icon}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div 
          className={`font-bold tracking-tight text-[#FAFAFA] font-display group-hover:text-accent transition-colors duration-300 truncate w-full ${
            displayValue.toString().length > 8 
              ? 'text-xs sm:text-sm' 
              : 'text-base sm:text-lg'
          }`}
          title={displayValue.toString()}
        >
          {displayValue}
        </div>
        {subValue && (
          <div className="text-[10px] text-zinc-600 mt-0.5 font-mono truncate">
            {subValue}
          </div>
        )}
      </div>
    </div>
  );
}
