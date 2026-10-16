'use client';

import React, { useState, useMemo } from 'react';
import { DEFAULT_KEYBINDS } from '@/lib/valorantConfigParser';
import { CANONICAL_KEYBINDS_ORDER, renderKeyBadge } from '@/components/PlayerProfileClient';

export interface ValorantKeybindsEditorProps {
  keybinds: Record<string, Record<string, string>>;
  onChange: (keybinds: Record<string, Record<string, string>>) => void;
}

const COMMON_PRESETS: Record<string, string[]> = {
  Mouse: ['L-Click', 'R-Click', 'Middle Mouse Button', 'Mouse 4', 'Mouse 5', 'Mouse Wheel Up', 'Mouse Wheel Down'],
  Special: ['Space', 'L-Shift', 'L-Ctrl', 'Tab', 'Toggle', 'Hold', 'Cycle', 'Off', 'On'],
  Alphabet: ['W', 'A', 'S', 'D', 'C', 'Q', 'E', 'X', 'Z', 'V', 'U', 'M', 'R', 'F', 'G', 'Y', '1', '2', '3', '4']
};

export default function ValorantKeybindsEditor({
  keybinds,
  onChange
}: ValorantKeybindsEditorProps) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeEditingAction, setActiveEditingAction] = useState<string | null>(null);

  // Safely resolve categories from CANONICAL_KEYBINDS_ORDER
  const categories = useMemo(() => Object.keys(CANONICAL_KEYBINDS_ORDER), []);

  // Update a single keybind value
  const handleKeybindChange = (category: string, action: string, value: string) => {
    const updated = { ...keybinds };
    if (!updated[category]) {
      updated[category] = {};
    } else {
      updated[category] = { ...updated[category] };
    }
    updated[category][action] = value;
    onChange(updated);
  };

  // Reset all to default canonical binds
  const handleResetToDefault = () => {
    onChange(JSON.parse(JSON.stringify(DEFAULT_KEYBINDS)));
  };

  // Clear all keybinds
  const handleClearAll = () => {
    const cleared: Record<string, Record<string, string>> = {};
    for (const cat of categories) {
      cleared[cat] = {};
      for (const act of CANONICAL_KEYBINDS_ORDER[cat] || []) {
        cleared[cat][act] = '';
      }
    }
    onChange(cleared);
  };

  // Filtered categories and actions
  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result: { category: string; actions: { action: string; value: string; isDefault: boolean }[] }[] = [];

    for (const cat of categories) {
      if (activeTab !== 'All' && activeTab.toLowerCase() !== cat.toLowerCase()) {
        continue;
      }

      const actionsList = CANONICAL_KEYBINDS_ORDER[cat] || [];
      const catKeybinds = keybinds[cat] || {};
      const catDefaults = DEFAULT_KEYBINDS[cat] || {};

      const matchedActions = actionsList
        .filter(action => {
          if (!query) return true;
          const val = catKeybinds[action] || '';
          return action.toLowerCase().includes(query) || val.toLowerCase().includes(query);
        })
        .map(action => {
          const val = catKeybinds[action] ?? catDefaults[action] ?? '';
          const def = catDefaults[action] ?? '';
          return {
            action,
            value: val,
            isDefault: val === def
          };
        });

      if (matchedActions.length > 0) {
        result.push({
          category: cat,
          actions: matchedActions
        });
      }
    }

    return result;
  }, [categories, keybinds, activeTab, searchQuery]);

  // Total bound keys count
  const totalBindsCount = useMemo(() => {
    let count = 0;
    for (const cat of categories) {
      const catObj = keybinds[cat];
      if (catObj) {
        for (const val of Object.values(catObj)) {
          if (val && val.trim() !== '' && val.trim().toLowerCase() !== 'none') {
            count++;
          }
        }
      }
    }
    return count;
  }, [categories, keybinds]);

  return (
    <div className="border border-red-500/20 bg-black/40 rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h4 className="text-xs font-bold text-red-400 font-sans uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <rect x="2" y="6" width="20" height="12" rx="3" />
              <path d="M6 12h4M8 10v4M15 11h.01M18 13h.01" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Controls / Keybinds Management
            <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
              {totalBindsCount} Assigned
            </span>
          </h4>
          <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
            Configure keybindings per action or reset to official default layout.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCollapsed(prev => !prev)}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-750 text-zinc-300 hover:text-white border border-zinc-700/80 text-[10px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            title={isCollapsed ? 'Show Keybinds Management' : 'Hide Keybinds Management'}
          >
            <span>{isCollapsed ? 'Show' : 'Hide'}</span>
            <span className="text-[8px] text-zinc-400">{isCollapsed ? '▼' : '▲'}</span>
          </button>
          {!isCollapsed && (
            <>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/80 text-[10px] font-sans font-semibold transition-colors cursor-pointer"
                title="Reset all bindings to default VALORANT keys"
              >
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-sans font-semibold transition-colors cursor-pointer"
                title="Clear all keybindings"
              >
                Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-black/40 border border-zinc-800/80 rounded-xl">
          {['All', ...categories].map(tab => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-lg text-[11px] font-sans transition-all cursor-pointer ${
                  isActive
                    ? 'bg-red-500/20 text-red-300 font-bold border border-red-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search action or key..."
            className="w-full h-8 bg-black/50 border border-zinc-800 rounded-lg pl-8 pr-7 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/40 font-sans"
          />
          <svg className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300 text-xs font-mono"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Preset Quick Chips Bar */}
      <div className="p-3 bg-zinc-900/40 border border-zinc-800/60 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-zinc-400 font-sans uppercase tracking-wider">
            Quick Insert Keybind Presets:
          </span>
          {activeEditingAction && (
            <span className="text-[10px] font-sans text-red-400 font-medium">
              Editing: <strong className="font-mono text-white">{activeEditingAction}</strong>
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {COMMON_PRESETS.Mouse.map(k => (
            <button
              key={k}
              type="button"
              onClick={() => {
                if (activeEditingAction) {
                  const [cat, act] = activeEditingAction.split('::');
                  handleKeybindChange(cat, act, k);
                }
              }}
              className="px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-[10px] font-mono transition-colors cursor-pointer"
            >
              {k}
            </button>
          ))}
          <span className="h-3 w-px bg-zinc-700 mx-1" />
          {COMMON_PRESETS.Special.map(k => (
            <button
              key={k}
              type="button"
              onClick={() => {
                if (activeEditingAction) {
                  const [cat, act] = activeEditingAction.split('::');
                  handleKeybindChange(cat, act, k);
                }
              }}
              className="px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-[10px] font-mono transition-colors cursor-pointer"
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Categories & Actions List */}
      <div className="space-y-6">
        {filteredData.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-zinc-800 rounded-xl bg-black/20">
            <p className="text-xs text-zinc-500 font-sans">No keybindings match "{searchQuery}"</p>
          </div>
        ) : (
          filteredData.map(({ category, actions }) => (
            <div key={category} className="space-y-2.5">
              {/* Category Header */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-400/90 border-l-2 border-red-500 pl-2 font-sans">
                  {category}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {actions.length} {actions.length === 1 ? 'action' : 'actions'}
                </span>
              </div>

              {/* Action Rows Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {actions.map(({ action, value, isDefault }) => {
                  const actionKey = `${category}::${action}`;
                  const isCurrentlyActive = activeEditingAction === actionKey;

                  return (
                    <div
                      key={action}
                      onClick={() => setActiveEditingAction(actionKey)}
                      className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                        isCurrentlyActive
                          ? 'bg-red-500/[0.06] border-red-500/40 shadow-sm'
                          : 'bg-black/30 hover:bg-black/50 border-zinc-850'
                      }`}
                    >
                      {/* Left: Action label */}
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <span className="text-xs text-zinc-300 font-sans font-medium truncate" title={action}>
                          {action}
                        </span>
                        {!isDefault && value && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Customized bind" />
                        )}
                      </div>

                      {/* Right: Live preview badge & input */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Live badge preview */}
                        {value && value.trim() !== '' ? (
                          <div className="shrink-0">{renderKeyBadge(action, value)}</div>
                        ) : (
                          <span className="text-[10px] text-zinc-600 font-mono italic shrink-0">None</span>
                        )}

                        {/* Input */}
                        <div className="relative">
                          <input
                            type="text"
                            value={value}
                            onFocus={() => setActiveEditingAction(actionKey)}
                            onChange={e => handleKeybindChange(category, action, e.target.value)}
                            placeholder="Key..."
                            className="w-24 sm:w-28 h-7 bg-[#0F0F15] border border-zinc-800 rounded-lg px-2 text-xs font-mono font-bold text-center text-white focus:outline-none focus:border-red-500/60 transition-all uppercase placeholder-zinc-600"
                          />
                          {value && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleKeybindChange(category, action, '');
                              }}
                              className="absolute right-1 top-1 text-zinc-500 hover:text-red-400 text-[10px] font-mono p-0.5 leading-none"
                              title="Clear binding"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
        </>
      )}
    </div>
  );
}
