'use client';

import { useState, useEffect } from 'react';

type Comment = {
  id: number;
  author_name: string;
  mouse_model: string | null;
  content: string;
  created_at: string;
};

type CommentSectionProps = {
  username: string;
};

export default function CommentSection({ username }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch comments
  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/players/${username}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      } else {
        console.error('Failed to fetch comments');
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [username]);

  // Submit comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) {
      setError('Please enter your name and comment content.');
      return;
    }

    setError('');
    setSuccess(false);
    setSubmitting(true);

    try {
      const response = await fetch(`/api/players/${username}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author_name: authorName,
          content,
        }),
      });

      if (response.ok) {
        setAuthorName('');
        setContent('');
        setSuccess(true);
        fetchComments(); // Refresh comments list
        
        // Hide success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Could not connect to the server.');
    } finally {
      setSubmitting(false);
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
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="w-full space-y-8">
      <div className="border-t border-border-custom pt-8">
        <h3 className="text-lg font-bold text-white mb-6 flex items-baseline gap-2 font-display">
          <span>Comments & Discussions</span>
          <span className="text-xs font-normal text-zinc-500 font-mono">({comments.length} comments)</span>
        </h3>

        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="bg-card backdrop-blur-[8px] border border-border-custom p-6 rounded-2xl space-y-4 mb-8">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">Leave a Comment</h4>
          
          {error && (
            <div className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl font-mono">
              Error: {error}
            </div>
          )}

          {success && (
            <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl font-mono">
              Comment submitted successfully!
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="author_name" className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Your Name *</label>
            <input
              id="author_name"
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Nickname / Alias"
              maxLength={50}
              required
              className="h-11 bg-black/40 border border-border-custom rounded-xl py-2 px-3 text-sm text-[#FAFAFA] placeholder-zinc-500 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 focus:shadow-[0_0_20px_rgba(245,158,11,0.1)] focus:bg-black/60 transition-all duration-200"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="comment_content" className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Your Comment *</label>
            <textarea
              id="comment_content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your comment here..."
              rows={4}
              maxLength={1000}
              required
              className="bg-black/40 border border-border-custom rounded-xl py-3 px-3 text-sm text-[#FAFAFA] placeholder-zinc-500 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 focus:shadow-[0_0_20px_rgba(245,158,11,0.1)] focus:bg-black/60 transition-all duration-200 resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-accent text-accent-fg font-display font-semibold text-xs py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-[1.02] active:scale-[0.98]"
            >
              {submitting ? 'Sending...' : 'Submit Comment'}
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-zinc-500 text-xs font-mono">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border-custom rounded-2xl text-zinc-500 text-xs font-mono">
              No comments yet. Be the first to share your thoughts!
            </div>
          ) : (
            comments.map((comment) => (
              <div 
                key={comment.id} 
                className="bg-[#12121A]/30 border border-border-custom p-5 rounded-2xl space-y-2 hover:border-border-hover transition-all duration-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-200 text-sm">{comment.author_name}</span>
                    {comment.mouse_model && (
                      <span className="text-[9px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded font-mono border border-accent/10">
                        {comment.mouse_model}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">{formatDate(comment.created_at)}</span>
                </div>
                <p className="text-xs text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed pt-1">
                  {comment.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
