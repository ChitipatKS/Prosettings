'use client';

import { useState, useEffect, useMemo, FormEvent, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { normalizeDiscordAvatar } from '@/lib/avatar';
import MentionTextarea from '@/components/MentionTextarea';

export type Comment = {
  id: number;
  author_name: string;
  content: string;
  created_at: string;
  parent_id?: number | null;
  likes_count?: number;
  profile_img_url?: string | null;
  is_community_member?: boolean;
  is_admin?: boolean;
  game?: string | null;
  game_role?: string | null;
};

type CommentThread = Comment & {
  replies: Comment[];
};

type ReplyState = {
  rootId: number;
  targetId: number;
  targetAuthor: string;
};

type CommentSectionProps = {
  username: string;
};

// Helper component to render comment text with highlighted & clickable @username mentions
function RenderCommentContent({ content }: { content: string }) {
  const parts: React.ReactNode[] = [];
  const regex = /@([a-zA-Z0-9_\-\.]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.substring(lastIndex, match.index));
    }

    const mentionedUser = match[1];
    parts.push(
      <Link
        key={`${match.index}-${mentionedUser}`}
        href={`/players/${encodeURIComponent(mentionedUser)}`}
        className="inline-flex items-center gap-0.5 text-accent font-mono font-medium hover:underline bg-accent/10 hover:bg-accent/20 px-1.5 py-0.5 rounded border border-accent/25 transition-colors mx-0.5 text-[11px]"
      >
        <span>@{mentionedUser}</span>
      </Link>
    );

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return (
    <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed pt-0.5">
      {parts}
    </p>
  );
}

export default function CommentSection({ username }: CommentSectionProps) {
  const { user, profile, isAdmin } = useAuth();
  const canDelete = Boolean(isAdmin || profile?.is_admin);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  // Likes state: set of comment IDs liked by this user/browser & like counts map
  const [likedCommentIds, setLikedCommentIds] = useState<Set<number>>(new Set());
  const [likesMap, setLikesMap] = useState<Record<number, number>>({});

  // Inline reply state
  const [replyState, setReplyState] = useState<ReplyState | null>(null);
  const [replyAuthorName, setReplyAuthorName] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState('');

  // Auto-populate author name from profile when logged in
  useEffect(() => {
    if (user) {
      const resolvedName =
        profile?.username ||
        profile?.real_name ||
        user.user_metadata?.custom_claims?.global_name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.preferred_username ||
        (user.email ? user.email.split('@')[0] : '');

      if (resolvedName) {
        setAuthorName(resolvedName);
        setReplyAuthorName(resolvedName);
      }
    }
  }, [user, profile]);

  // Load liked comments from localStorage
  useEffect(() => {
    try {
      const storageKey = user ? `liked_comments_${user.id}` : 'liked_comments_guest';
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const ids = JSON.parse(saved);
        if (Array.isArray(ids)) {
          setLikedCommentIds(new Set(ids));
        }
      }
    } catch {}
  }, [user]);

  // Fetch comments (isInitial to show loading only on first mount)
  const fetchComments = async (isInitial = false) => {
    if (!username || username === 'User') {
      setLoading(false);
      return;
    }
    try {
      if (isInitial) {
        setLoading(true);
      }
      const response = await fetch(`/api/players/${encodeURIComponent(username)}/comments`);
      if (response.ok) {
        const data = await response.json();
        const loadedComments: Comment[] = data.comments || [];
        setComments(loadedComments);

        // Update likesMap
        const newLikes: Record<number, number> = {};
        loadedComments.forEach((c) => {
          newLikes[c.id] = c.likes_count ?? 0;
        });
        setLikesMap((prev) => ({ ...newLikes, ...prev }));
      } else if (isInitial) {
        setComments([]);
      }
    } catch {
      if (isInitial) setComments([]);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchComments(true);
  }, [username]);

  // Handle heart / like toggle
  const handleToggleLike = useCallback(
    async (commentId: number) => {
      const isCurrentlyLiked = likedCommentIds.has(commentId);
      const updatedSet = new Set(likedCommentIds);
      const delta = isCurrentlyLiked ? -1 : 1;

      if (isCurrentlyLiked) {
        updatedSet.delete(commentId);
      } else {
        updatedSet.add(commentId);
      }

      setLikedCommentIds(updatedSet);

      try {
        const storageKey = user ? `liked_comments_${user.id}` : 'liked_comments_guest';
        localStorage.setItem(storageKey, JSON.stringify(Array.from(updatedSet)));
      } catch {}

      setLikesMap((prev) => ({
        ...prev,
        [commentId]: Math.max(0, (prev[commentId] ?? 0) + delta),
      }));

      try {
        await fetch(`/api/players/${encodeURIComponent(username)}/comments`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comment_id: commentId,
            delta,
          }),
        });
      } catch {}
    },
    [likedCommentIds, user, username]
  );

  // Build threaded comments hierarchy (Root comments -> nested replies)
  const threads: CommentThread[] = useMemo(() => {
    const commentMap = new Map<number, CommentThread>();
    const rootThreads: CommentThread[] = [];

    // Initialize all comments as potential threads
    comments.forEach((c) => {
      commentMap.set(c.id, { ...c, replies: [] });
    });

    // Find the ultimate root comment for any parent_id
    const findRoot = (parentId: number): CommentThread | undefined => {
      let curr = commentMap.get(parentId);
      while (curr && curr.parent_id && commentMap.has(curr.parent_id)) {
        curr = commentMap.get(curr.parent_id);
      }
      return curr;
    };

    // Attach replies to root parent
    comments.forEach((c) => {
      const item = commentMap.get(c.id)!;
      if (c.parent_id) {
        const root = findRoot(c.parent_id);
        if (root) {
          root.replies.push(item);
        } else {
          rootThreads.push(item);
        }
      } else {
        rootThreads.push(item);
      }
    });

    // Root comments: newest first
    rootThreads.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Replies under root: chronological (oldest first)
    rootThreads.forEach((t) => {
      t.replies.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

    return rootThreads;
  }, [comments]);

  // List of unique commenters on this page for mention autocompletion
  const pageCommenters = useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{
      username: string;
      display_name?: string;
      avatar_url?: string | null;
      is_community_member?: boolean;
      is_admin?: boolean;
    }> = [];

    comments.forEach((c) => {
      const lower = c.author_name.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        list.push({
          username: c.author_name,
          display_name: c.author_name,
          avatar_url: c.profile_img_url || null,
          is_community_member: c.is_community_member,
          is_admin: c.is_admin,
        });
      }
    });

    return list;
  }, [comments]);

  // Submit main comment with instant optimistic update
  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const finalAuthor = (authorName || '').trim();
    if (!finalAuthor || !content.trim()) {
      setError('Please provide a name and comment content.');
      return;
    }

    const submittedContent = content;
    const tempId = Date.now();
    const optimisticComment: Comment = {
      id: tempId,
      author_name: finalAuthor,
      content: submittedContent,
      created_at: new Date().toISOString(),
      parent_id: null,
      likes_count: 0,
      profile_img_url: userAvatar,
      is_community_member: !!(user || profile),
      is_admin: Boolean(isAdmin || profile?.is_admin),
    };

    // 1. Instantly update UI (Realtime!)
    setError('');
    setContent('');
    if (!user) setAuthorName('');
    setComments((prev) => [optimisticComment, ...prev]);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/players/${encodeURIComponent(username)}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author_name: finalAuthor,
          content: submittedContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.comment) {
          // Replace temp comment with server confirmed comment
          setComments((prev) =>
            prev.map((c) =>
              c.id === tempId
                ? {
                    ...c,
                    id: data.comment.id,
                    created_at: data.comment.created_at || c.created_at,
                  }
                : c
            )
          );
        }
        // Background silent sync without loading state
        fetchComments(false);
      } else {
        const data = await response.json();
        // Rollback optimistic comment on error
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        setContent(submittedContent);
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      // Rollback optimistic comment on error
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setContent(submittedContent);
      setError('Could not connect to the server.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open inline reply box
  const handleOpenReply = (targetComment: Comment, rootId: number) => {
    const isTargetRoot = targetComment.id === rootId;
    setReplyState({
      rootId,
      targetId: targetComment.id,
      targetAuthor: targetComment.author_name,
    });
    setReplyError('');

    // If replying to a nested reply, automatically prefill @username
    if (!isTargetRoot) {
      setReplyContent(`@${targetComment.author_name} `);
    } else {
      setReplyContent('');
    }
  };

  const handleCancelReply = () => {
    setReplyState(null);
    setReplyContent('');
    setReplyError('');
  };

  // Submit reply with instant optimistic update
  const handleSubmitReply = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!replyState) return;

    const finalAuthor = (replyAuthorName || authorName || '').trim();
    if (!finalAuthor || !replyContent.trim()) {
      setReplyError('Please provide a name and reply message.');
      return;
    }

    const submittedReply = replyContent;
    const targetParentId = replyState.targetId;
    const rootThreadId = replyState.rootId;
    const targetAuthor = replyState.targetAuthor;
    const tempId = Date.now();

    const optimisticReply: Comment = {
      id: tempId,
      author_name: finalAuthor,
      content: submittedReply,
      created_at: new Date().toISOString(),
      parent_id: targetParentId,
      likes_count: 0,
      profile_img_url: userAvatar,
      is_community_member: !!(user || profile),
      is_admin: Boolean(isAdmin || profile?.is_admin),
    };

    // 1. Instantly update UI & close reply box (Realtime!)
    setReplyError('');
    setReplyContent('');
    setReplyState(null);
    setComments((prev) => [...prev, optimisticReply]);
    setReplySubmitting(true);

    try {
      const response = await fetch(`/api/players/${encodeURIComponent(username)}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author_name: finalAuthor,
          content: submittedReply,
          parent_id: targetParentId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.comment) {
          setComments((prev) =>
            prev.map((c) =>
              c.id === tempId
                ? {
                    ...c,
                    id: data.comment.id,
                    created_at: data.comment.created_at || c.created_at,
                  }
                : c
            )
          );
        }
        // Background silent sync without loading state
        fetchComments(false);
      } else {
        const data = await response.json();
        // Rollback optimistic reply & restore reply form
        setComments((prev) => prev.filter((c) => c.id !== tempId));
        setReplyState({ rootId: rootThreadId, targetId: targetParentId, targetAuthor });
        setReplyContent(submittedReply);
        setReplyError(data.error || 'Could not submit reply. Please try again.');
      }
    } catch {
      // Rollback optimistic reply & restore reply form
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setReplyState({ rootId: rootThreadId, targetId: targetParentId, targetAuthor });
      setReplyContent(submittedReply);
      setReplyError('Could not connect to the server.');
    } finally {
      setReplySubmitting(false);
    }
  };

  // Handle comment deletion (Admin only)
  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    // Optimistic removal: remove comment and any nested replies immediately
    const previousComments = [...comments];
    setComments((prev) =>
      prev.filter((c) => c.id !== commentId && c.parent_id !== commentId)
    );

    try {
      const response = await fetch(
        `/api/players/${encodeURIComponent(username)}/comments?id=${commentId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        setComments(previousComments);
        const data = await response.json();
        alert(data.error || 'Failed to delete comment.');
      } else {
        fetchComments(false);
      }
    } catch {
      setComments(previousComments);
      alert('Could not connect to the server.');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const rawAvatar = profile?.profile_img_url || user?.user_metadata?.avatar_url || null;
  const userAvatar = normalizeDiscordAvatar(rawAvatar);

  return (
    <div className="w-full space-y-8">
      <div className="border-t border-border-custom pt-8">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-baseline gap-2 font-sans">
          <span>Comments</span>
          <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 font-sans">
            <span className="text-accent font-bold font-mono text-base">{comments.length}</span>{' '}
            <span>{comments.length === 1 ? 'comment' : 'comments'}</span>
          </span>
        </h3>

        {/* Main Comment Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-card backdrop-blur-[8px] border border-border-custom p-6 rounded-2xl space-y-4 mb-8 shadow-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 dark:border-white/5 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
              Leave a Comment
            </h4>
            {user ? (
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Posting as</span>
                <span className="text-accent font-semibold">{authorName}</span>
              </div>
            ) : (
              <Link
                href={`/login?redirect=/players/${encodeURIComponent(username)}`}
                className="text-[11px] font-mono text-accent hover:underline flex items-center gap-1"
              >
                <span>Sign in to comment with your profile</span>
                <span>→</span>
              </Link>
            )}
          </div>

          {error && (
            <div className="text-xs bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 p-3 rounded-xl font-mono">
              Error: {error}
            </div>
          )}

          {/* User Identity Display or Guest Name Input */}
          {user ? (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-100/70 dark:bg-black/40 border border-border-custom">
              {userAvatar ? (
                <img
                  src={userAvatar}
                  alt={authorName}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-full object-cover border border-zinc-300 dark:border-zinc-750 shadow-sm shrink-0"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.includes('cdn.discordapp.com/avatars/') && !target.src.includes('.webp')) {
                      target.src = normalizeDiscordAvatar(target.src);
                    }
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-xs font-bold font-mono text-accent shrink-0">
                  {authorName ? authorName.slice(0, 2).toUpperCase() : 'ME'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white font-sans truncate">{authorName}</span>
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md font-sans tracking-wide border bg-red-500/15 border-red-500/40 text-red-500 dark:text-red-400 leading-none shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)] animate-pulse"></span>
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md font-sans tracking-wide border bg-zinc-100 dark:bg-zinc-800/60 border-zinc-300 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 leading-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      Community Member
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 font-sans mt-0.5 truncate">
                  Your comment will be posted using your authenticated account
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="author_name"
                className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider font-mono"
              >
                Your Name *
              </label>
              <input
                id="author_name"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Nickname / Alias"
                maxLength={50}
                required
                className="h-11 bg-white dark:bg-black/40 border border-border-custom rounded-xl py-2 px-3 text-sm text-zinc-900 dark:text-[#FAFAFA] placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 focus:shadow-[0_0_20px_rgba(245,158,11,0.1)] focus:bg-white dark:focus:bg-black/60 transition-all duration-200 font-sans shadow-xs"
              />
            </div>
          )}

          {/* Comment input with @mention autocomplete */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="comment_content"
              className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider font-mono"
            >
              Your Comment *
            </label>
            <MentionTextarea
              id="comment_content"
              value={content}
              onChange={setContent}
              placeholder="Write your comment here..."
              rows={4}
              maxLength={1000}
              required
              currentPageCommenters={pageCommenters}
              currentPlayer={username}
              onSubmitShortcut={handleSubmit}
              className="w-full bg-white dark:bg-black/40 border border-border-custom rounded-xl py-3 px-3 text-sm text-zinc-900 dark:text-[#FAFAFA] placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 focus:shadow-[0_0_20px_rgba(245,158,11,0.1)] focus:bg-white dark:focus:bg-black/60 transition-all duration-200 resize-none font-sans shadow-xs"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-accent text-accent-fg font-sans font-bold text-xs py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {submitting ? 'Sending...' : 'Submit Comment'}
            </button>
          </div>
        </form>

        {/* Comments & Replies List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-zinc-500 text-xs font-mono">
              Loading comments...
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border-custom rounded-2xl text-zinc-500 text-xs font-mono">
              No comments yet. Be the first to share your thoughts!
            </div>
          ) : (
            threads.map((thread) => {
              const isCurrentUser = !!(
                user &&
                authorName &&
                thread.author_name.toLowerCase() === authorName.toLowerCase()
              );
              const rawCommentAvatar =
                thread.profile_img_url || (isCurrentUser ? userAvatar : null);
              const avatar = normalizeDiscordAvatar(rawCommentAvatar);
              const isCommunityMember = !!(thread.is_community_member || isCurrentUser);
              const isReplyingThisThread = replyState?.rootId === thread.id;
              const isLiked = likedCommentIds.has(thread.id);
              const likeCount = likesMap[thread.id] ?? (thread.likes_count ?? 0);

              return (
                <div
                  key={thread.id}
                  className="bg-card border border-border-custom p-5 rounded-2xl space-y-3 hover:border-border-hover transition-all duration-200 shadow-xs"
                >
                  {/* Root Comment Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/80 dark:border-white/5 pb-3">
                    <div className="flex items-center gap-2.5">
                      {/* Avatar */}
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={thread.author_name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-zinc-300 dark:border-zinc-700 shadow-sm shrink-0"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (
                              target.src.includes('cdn.discordapp.com/avatars/') &&
                              !target.src.includes('.webp')
                            ) {
                              target.src = normalizeDiscordAvatar(target.src);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[10px] font-bold font-mono text-zinc-700 dark:text-zinc-300 shrink-0">
                          {thread.author_name ? thread.author_name.slice(0, 2).toUpperCase() : '?'}
                        </div>
                      )}

                      {/* Author Name */}
                      <span className="font-bold text-zinc-900 dark:text-zinc-200 text-sm font-sans">
                        {thread.author_name}
                      </span>

                      {/* Admin or Community Member Badge */}
                      {thread.is_admin || (isCurrentUser && isAdmin) ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md font-sans tracking-wide border bg-red-500/15 border-red-500/40 text-red-500 dark:text-red-400 leading-none shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)] animate-pulse"></span>
                          Admin
                        </span>
                      ) : isCommunityMember ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md font-sans tracking-wide border bg-zinc-100 dark:bg-zinc-800/60 border-zinc-300 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 leading-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          Community Member
                        </span>
                      ) : null}
                    </div>

                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                      {formatDate(thread.created_at)}
                    </span>
                  </div>

                  {/* Comment Content with @mention rendering */}
                  <RenderCommentContent content={thread.content} />

                  {/* Comment Actions (Like and Reply buttons) */}
                  <div className="flex items-center gap-3 pt-1">
                    {/* Heart / Like Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleLike(thread.id)}
                      className={`text-xs font-sans px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer font-medium active:scale-95 group ${
                        isLiked
                          ? 'text-rose-500 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
                          : 'text-zinc-500 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10'
                      }`}
                      title={isLiked ? 'Unlike' : 'Like'}
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 ${
                          isLiked
                            ? 'scale-110 fill-rose-500 text-rose-500'
                            : 'fill-none text-zinc-400 group-hover:text-rose-400'
                        }`}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      {likeCount > 0 && (
                        <span className="font-mono text-xs font-semibold">{likeCount}</span>
                      )}
                    </button>

                    {/* Reply Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenReply(thread, thread.id)}
                      className="text-xs font-sans text-zinc-500 dark:text-zinc-400 hover:text-accent hover:bg-accent/10 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 10h10a5 5 0 0 1 5 5v5" />
                        <path d="m7 6-4 4 4 4" />
                      </svg>
                      <span>Reply</span>
                    </button>

                    {thread.replies.length > 0 && (
                      <span className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                        • {thread.replies.length} {thread.replies.length === 1 ? 'reply' : 'replies'}
                      </span>
                    )}

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(thread.id)}
                        className="text-xs font-sans text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer font-medium ml-auto"
                        title="Delete Comment (Admin)"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                        <span>Delete</span>
                      </button>
                    )}
                  </div>

                  {/* Nested Replies Section */}
                  {thread.replies.length > 0 && (
                    <div className="mt-3 ml-2 sm:ml-6 pl-3 sm:pl-4 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-3">
                      {thread.replies.map((reply) => {
                        const isReplyCurrentUser = !!(
                          user &&
                          authorName &&
                          reply.author_name.toLowerCase() === authorName.toLowerCase()
                        );
                        const rawReplyAvatar =
                          reply.profile_img_url || (isReplyCurrentUser ? userAvatar : null);
                        const replyAvatar = normalizeDiscordAvatar(rawReplyAvatar);
                        const isReplyMember = !!(
                          reply.is_community_member || isReplyCurrentUser
                        );
                        const isReplyLiked = likedCommentIds.has(reply.id);
                        const replyLikeCount = likesMap[reply.id] ?? (reply.likes_count ?? 0);

                        return (
                          <div
                            key={reply.id}
                            className="bg-zinc-50/80 dark:bg-black/30 border border-zinc-200/80 dark:border-white/5 p-4 rounded-xl space-y-2 hover:border-zinc-300 dark:hover:border-white/10 transition-colors shadow-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200/80 dark:border-white/5 pb-2">
                              <div className="flex items-center gap-2">
                                {replyAvatar ? (
                                  <img
                                    src={replyAvatar}
                                    alt={reply.author_name}
                                    referrerPolicy="no-referrer"
                                    className="w-6 h-6 rounded-full object-cover border border-zinc-300 dark:border-zinc-700 shadow-sm shrink-0"
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      if (
                                        target.src.includes('cdn.discordapp.com/avatars/') &&
                                        !target.src.includes('.webp')
                                      ) {
                                        target.src = normalizeDiscordAvatar(target.src);
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[9px] font-bold font-mono text-zinc-700 dark:text-zinc-300 shrink-0">
                                    {reply.author_name
                                      ? reply.author_name.slice(0, 2).toUpperCase()
                                      : '?'}
                                  </div>
                                )}

                                <span className="font-bold text-zinc-900 dark:text-zinc-200 text-xs font-sans">
                                  {reply.author_name}
                                </span>

                                {reply.is_admin || (isReplyCurrentUser && isAdmin) ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded font-sans tracking-wide border bg-red-500/15 border-red-500/40 text-red-500 dark:text-red-400 leading-none shadow-[0_0_8px_rgba(239,68,68,0.2)]">
                                    <span className="w-1 h-1 rounded-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.9)] animate-pulse"></span>
                                    Admin
                                  </span>
                                ) : isReplyMember ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded font-sans tracking-wide border bg-zinc-100 dark:bg-zinc-800/60 border-zinc-300 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 leading-none">
                                    <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                                    Member
                                  </span>
                                ) : null}
                              </div>

                              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                                {formatDate(reply.created_at)}
                              </span>
                            </div>

                            {/* Reply content with @mention rendering */}
                            <RenderCommentContent content={reply.content} />

                            {/* Reply Actions (Like and Reply) */}
                            <div className="flex items-center gap-2 pt-0.5">
                              {/* Reply Heart Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleLike(reply.id)}
                                className={`text-[11px] font-sans px-2 py-0.5 rounded transition-all flex items-center gap-1 cursor-pointer font-medium active:scale-95 group ${
                                  isReplyLiked
                                    ? 'text-rose-500 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10'
                                }`}
                                title={isReplyLiked ? 'Unlike' : 'Like'}
                              >
                                <svg
                                  className={`w-3 h-3 transition-transform duration-200 group-hover:scale-110 ${
                                    isReplyLiked
                                      ? 'scale-110 fill-rose-500 text-rose-500'
                                      : 'fill-none text-zinc-400 group-hover:text-rose-400'
                                  }`}
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                                {replyLikeCount > 0 && (
                                  <span className="font-mono text-[11px] font-semibold">{replyLikeCount}</span>
                                )}
                              </button>

                              {/* Reply to this reply */}
                              <button
                                type="button"
                                onClick={() => handleOpenReply(reply, thread.id)}
                                className="text-[11px] font-sans text-zinc-500 dark:text-zinc-400 hover:text-accent hover:bg-accent/10 px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer font-medium"
                              >
                                <svg
                                  className="w-3 h-3"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M3 10h10a5 5 0 0 1 5 5v5" />
                                  <path d="m7 6-4 4 4 4" />
                                </svg>
                                <span>Reply</span>
                              </button>

                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(reply.id)}
                                  className="text-[11px] font-sans text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer font-medium ml-auto"
                                  title="Delete Reply (Admin)"
                                >
                                  <svg
                                    className="w-3 h-3"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                    <line x1="10" y1="11" x2="10" y2="17" />
                                    <line x1="14" y1="11" x2="14" y2="17" />
                                  </svg>
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Inline Reply Box for this thread */}
                  {isReplyingThisThread && (
                    <div className="mt-4 pt-3 border-t border-zinc-200/80 dark:border-white/5 animate-in fade-in duration-200">
                      <div className="bg-zinc-50 dark:bg-black/40 border border-accent/40 p-4 rounded-xl space-y-3 shadow-lg">
                        <div className="flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400 border-b border-zinc-200/80 dark:border-white/5 pb-2">
                          <div className="flex items-center gap-1.5">
                            <svg
                              className="w-3.5 h-3.5 text-accent"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 10h10a5 5 0 0 1 5 5v5" />
                              <path d="m7 6-4 4 4 4" />
                            </svg>
                            <span>Replying to </span>
                            <span className="text-accent font-semibold">
                              @{replyState.targetAuthor}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCancelReply}
                            className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300 p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-white/5 transition-colors"
                            title="Cancel reply"
                          >
                            ✕
                          </button>
                        </div>

                        {replyError && (
                          <div className="text-xs bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 p-2.5 rounded-lg font-mono">
                            {replyError}
                          </div>
                        )}

                        {!user && (
                          <div className="flex flex-col gap-1">
                            <label
                              htmlFor={`reply_author_${thread.id}`}
                              className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider font-mono"
                            >
                              Your Name *
                            </label>
                            <input
                              id={`reply_author_${thread.id}`}
                              type="text"
                              value={replyAuthorName}
                              onChange={(e) => setReplyAuthorName(e.target.value)}
                              placeholder="Nickname / Alias"
                              maxLength={50}
                              required
                              className="h-9 bg-white dark:bg-black/50 border border-border-custom rounded-lg py-1 px-3 text-xs text-zinc-900 dark:text-[#FAFAFA] placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all font-sans shadow-xs"
                            />
                          </div>
                        )}

                        <div className="flex flex-col gap-1">
                          <MentionTextarea
                            id={`reply_content_${thread.id}`}
                            value={replyContent}
                            onChange={setReplyContent}
                            placeholder={`Reply to @${replyState.targetAuthor}...`}
                            rows={3}
                            maxLength={1000}
                            required
                            autoFocus
                            currentPageCommenters={pageCommenters}
                            currentPlayer={username}
                            onSubmitShortcut={handleSubmitReply}
                            className="w-full bg-white dark:bg-black/50 border border-border-custom rounded-lg py-2 px-3 text-xs text-zinc-900 dark:text-[#FAFAFA] placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all resize-none font-sans shadow-xs"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleCancelReply}
                            className="text-xs font-sans text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white px-3 py-1.5 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSubmitReply}
                            disabled={replySubmitting}
                            className="bg-accent text-accent-fg font-sans font-bold text-xs py-1.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] active:scale-[0.98] cursor-pointer"
                          >
                            {replySubmitting ? 'Replying...' : 'Send Reply'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
