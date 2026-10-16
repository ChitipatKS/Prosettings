'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { normalizeDiscordAvatar } from '@/lib/avatar';

export type MentionUser = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  type: 'community' | 'pro' | 'commenter';
  is_admin?: boolean;
};

interface MentionTextareaProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  currentPageCommenters?: Array<{
    username: string;
    display_name?: string;
    avatar_url?: string | null;
    is_community_member?: boolean;
    is_admin?: boolean;
  }>;
  currentPlayer?: string;
  onSubmitShortcut?: () => void;
}

export default function MentionTextarea({
  id,
  value,
  onChange,
  placeholder = 'Write a comment...',
  rows = 3,
  maxLength = 1000,
  required = false,
  disabled = false,
  autoFocus = false,
  className = '',
  currentPageCommenters = [],
  currentPlayer,
  onSubmitShortcut,
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStartPos, setMentionStartPos] = useState<number>(-1);
  const [suggestions, setSuggestions] = useState<MentionUser[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Check cursor position on keyup / click / change to see if currently typing an @mention
  const checkMentionTrigger = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart;
    const textBefore = value.slice(0, cursor);

    // Matches @query where @ is preceded by start of string or whitespace
    const match = textBefore.match(/(?:^|\s)@([a-zA-Z0-9_\-\.]*)$/);

    if (match) {
      const fullMatch = match[0];
      const query = match[1];
      // Index in `value` where `@` actually sits
      const atIndex = cursor - query.length - 1;
      setMentionQuery(query);
      setMentionStartPos(atIndex);
      setSelectedIndex(0);
    } else {
      setMentionQuery(null);
      setMentionStartPos(-1);
    }
  }, [value]);

  // Fetch or construct suggestions when mentionQuery changes
  useEffect(() => {
    if (mentionQuery === null) {
      setSuggestions([]);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const queryLower = mentionQuery.toLowerCase();

    // 1. Build local suggestions first (current page commenters & current player)
    const localUsers: MentionUser[] = [];
    const seenUsernames = new Set<string>();

    if (currentPlayer && currentPlayer.toLowerCase().includes(queryLower)) {
      seenUsernames.add(currentPlayer.toLowerCase());
      localUsers.push({
        id: `player-${currentPlayer}`,
        username: currentPlayer,
        display_name: `${currentPlayer} (Pro Player)`,
        avatar_url: null,
        type: 'pro',
      });
    }

    currentPageCommenters.forEach(c => {
      const uLower = c.username.toLowerCase();
      if (!seenUsernames.has(uLower) && (uLower.includes(queryLower) || (c.display_name && c.display_name.toLowerCase().includes(queryLower)))) {
        seenUsernames.add(uLower);
        localUsers.push({
          id: `commenter-${c.username}`,
          username: c.username,
          display_name: c.display_name || c.username,
          avatar_url: c.avatar_url || null,
          type: c.is_community_member ? 'community' : 'commenter',
          is_admin: c.is_admin,
        });
      }
    });

    // 2. Query API with debouncing for database users
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/mentions?q=${encodeURIComponent(mentionQuery)}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          const apiUsers: MentionUser[] = (data.users || []).map((u: any) => ({
            id: u.id,
            username: u.username,
            display_name: u.display_name,
            avatar_url: u.avatar_url,
            type: u.type,
            is_admin: u.is_admin,
          }));

          // Merge local and API users without duplicates
          const merged: MentionUser[] = [...localUsers];
          apiUsers.forEach(au => {
            if (!seenUsernames.has(au.username.toLowerCase())) {
              seenUsernames.add(au.username.toLowerCase());
              merged.push(au);
            }
          });

          setSuggestions(merged.slice(0, 8));
        } else if (isMounted) {
          setSuggestions(localUsers.slice(0, 8));
        }
      } catch {
        if (isMounted) setSuggestions(localUsers.slice(0, 8));
      } finally {
        if (isMounted) setLoading(false);
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [mentionQuery, currentPageCommenters, currentPlayer]);

  // Insert chosen mention
  const insertMention = useCallback((userToInsert: MentionUser) => {
    const textarea = textareaRef.current;
    if (!textarea || mentionStartPos < 0) return;

    const cursor = textarea.selectionStart;
    const beforeAt = value.slice(0, mentionStartPos);
    const afterCursor = value.slice(cursor);

    const insertion = `@${userToInsert.username} `;
    const updatedValue = `${beforeAt}${insertion}${afterCursor}`;

    onChange(updatedValue);
    setMentionQuery(null);
    setMentionStartPos(-1);
    setSuggestions([]);

    // Focus and place cursor after inserted username
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const newPos = beforeAt.length + insertion.length;
        textarea.setSelectionRange(newPos, newPos);
      }
    }, 10);
  }, [value, mentionStartPos, onChange]);

  // Handle keyboard events (Up, Down, Enter, Tab, Esc)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          insertMention(suggestions[selectedIndex]);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    // Ctrl+Enter or Cmd+Enter to quickly submit comment
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && onSubmitShortcut) {
      e.preventDefault();
      onSubmitShortcut();
    }
  };

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setMentionQuery(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        onKeyUp={checkMentionTrigger}
        onClick={checkMentionTrigger}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        className={className}
      />

      {/* Mention Suggestions Dropdown */}
      {mentionQuery !== null && (
        <div
          ref={dropdownRef}
          className="absolute left-0 bottom-full mb-2 w-full max-w-sm bg-white dark:bg-[#0D0D14] border border-border-custom rounded-xl shadow-2xl p-1.5 z-50 max-h-60 overflow-y-auto divide-y divide-zinc-100 dark:divide-white/5 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="px-2.5 py-1 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center justify-between">
            <span>Mention User</span>
            {loading && <span className="text-[10px] text-accent animate-pulse">Searching...</span>}
          </div>

          {suggestions.length === 0 && !loading ? (
            <div className="p-3 text-xs text-zinc-500 font-sans text-center">
              No matching users found for &ldquo;@{mentionQuery}&rdquo;
            </div>
          ) : (
            suggestions.map((user, idx) => {
              const isSelected = idx === selectedIndex;
              const avatar = normalizeDiscordAvatar(user.avatar_url);

              return (
                <button
                  key={user.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent losing textarea focus
                    insertMention(user);
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-accent/15 border border-accent/30 text-zinc-900 dark:text-white'
                      : 'hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-zinc-300 border border-transparent'
                  }`}
                >
                  {/* Avatar */}
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={user.username}
                      className="w-6 h-6 rounded-full object-cover shrink-0 border border-zinc-300 dark:border-zinc-700 shadow-xs"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[10px] font-bold font-mono text-accent shrink-0">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* Username & Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold text-accent truncate">
                        @{user.username}
                      </span>
                      {user.is_admin ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-sans font-bold px-1.5 py-0.2 rounded bg-red-500/15 text-red-500 dark:text-red-400 border border-red-500/40 shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                          <span className="w-1 h-1 rounded-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.9)] animate-pulse"></span>
                          Admin
                        </span>
                      ) : user.type === 'community' ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-sans px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                          <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                          Member
                        </span>
                      ) : null}
                      {user.type === 'pro' && !user.is_admin && (
                        <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20 font-semibold">
                          PRO
                        </span>
                      )}
                    </div>
                    {user.display_name && user.display_name !== user.username && (
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-sans truncate">
                        {user.display_name}
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
