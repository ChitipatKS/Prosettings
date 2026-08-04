'use client';

import { useState, useEffect } from 'react';
import { getTeamLogo, loadCustomTeamLogos, getCustomLogoMap } from '@/lib/teamLogos';

type Props = {
  teamName: string | null | undefined;
  dbLogoUrl?: string | null;
  className?: string;
  imgClassName?: string;
};

export default function TeamLogoImg({
  teamName,
  dbLogoUrl,
  className = "w-4 h-4",
  imgClassName = "max-w-full max-h-full object-contain"
}: Props) {
  const [hasError, setHasError] = useState(false);
  const [customLogoUrl, setCustomLogoUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!dbLogoUrl && teamName) {
      const map = getCustomLogoMap();
      const norm = teamName.toLowerCase().trim();
      if (map[norm]) {
        setCustomLogoUrl(map[norm]);
      } else {
        loadCustomTeamLogos().then(loadedMap => {
          if (loadedMap[norm]) {
            setCustomLogoUrl(loadedMap[norm]);
          }
        });
      }
    }
  }, [teamName, dbLogoUrl]);

  if (!teamName) return null;

  const logoUrl = getTeamLogo(teamName, dbLogoUrl || customLogoUrl);
  const initial = teamName.trim()[0]?.toUpperCase() || '?';

  if (!logoUrl || logoUrl === 'none' || hasError) {
    return (
      <div className={`${className} rounded-md bg-white/10 text-[10px] font-bold text-accent flex items-center justify-center font-mono shrink-0 border border-accent/20`}>
        {initial}
      </div>
    );
  }

  return (
    <div className={`${className} shrink-0 flex items-center justify-center overflow-hidden`}>
      <img
        src={logoUrl}
        alt={teamName}
        className={imgClassName}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
