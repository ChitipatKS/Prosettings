'use client';

import React, { useState, useRef, useEffect } from 'react';

export const VALORANT_ROLES = [
  { value: 'Duelist', label: 'Duelist', icon: '/images/roles/duelist.png' },
  { value: 'Initiator', label: 'Initiator', icon: '/images/roles/initiator.png' },
  { value: 'Controller', label: 'Controller', icon: '/images/roles/controller.png' },
  { value: 'Sentinel', label: 'Sentinel', icon: '/images/roles/sentinel.png' },
  { value: 'Flex', label: 'Flex', icon: '/images/roles/flex.png' },
] as const;

export interface ValorantRoleSelectProps {
  value?: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export default function ValorantRoleSelect({
  value = '',
  onChange,
  placeholder = 'Select Role (Optional)',
  className = ''
}: ValorantRoleSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const cleanValue = value === 'Community Member' ? '' : (value || '').trim();
  const selectedRole = VALORANT_ROLES.find(
    r => r.value.toLowerCase() === cleanValue.toLowerCase()
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-9 bg-black/40 hover:bg-black/60 border border-zinc-800 hover:border-zinc-700 focus:border-red-500/50 rounded-xl px-3 flex items-center justify-between gap-2 text-xs font-mono text-white transition-all cursor-pointer shadow-sm select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedRole ? (
            <>
              <img
                src={selectedRole.icon}
                alt={selectedRole.label}
                className="w-4 h-4 object-contain shrink-0"
              />
              <span className="font-semibold text-white truncate">{selectedRole.label}</span>
            </>
          ) : cleanValue ? (
            <span className="font-semibold text-white truncate">{cleanValue}</span>
          ) : (
            <span className="text-zinc-500 truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {cleanValue && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="text-zinc-500 hover:text-red-400 text-xs px-1 cursor-pointer transition-colors"
              title="Clear role"
            >
              ✕
            </span>
          )}
          <svg
            className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[170px] bg-[#0E0E14] border border-zinc-800/90 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-1.5 z-50 space-y-1 animate-in fade-in duration-150 backdrop-blur-md">
          {/* Option: Clear / None */}
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
            className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors text-left cursor-pointer ${
              !cleanValue
                ? 'bg-zinc-800/60 text-zinc-200 font-semibold'
                : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full shrink-0 border border-zinc-600 border-dashed flex items-center justify-center text-[9px] text-zinc-600">✕</span>
              <span>None (Optional)</span>
            </span>
            {!cleanValue && (
              <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <div className="border-t border-zinc-800/80 my-1" />

          {/* Valorant Roles: Duelist, Initiator, Controller, Sentinel, Flex */}
          {VALORANT_ROLES.map((role) => {
            const isSelected = cleanValue.toLowerCase() === role.value.toLowerCase();
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => {
                  onChange(role.value);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'bg-red-500/15 text-white font-bold border border-red-500/30 shadow-sm'
                    : 'text-zinc-300 hover:bg-zinc-850 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <img
                    src={role.icon}
                    alt={role.label}
                    className="w-4 h-4 object-contain shrink-0"
                  />
                  <span>{role.label}</span>
                </div>
                {isSelected && (
                  <svg className="w-3.5 h-3.5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
