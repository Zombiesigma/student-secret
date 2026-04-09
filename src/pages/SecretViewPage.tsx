/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Clock, 
  Send, 
  Ghost, 
  Flag, 
  Share2,
  Sparkles,
  ArrowUpDown,
  AlertCircle,
  Check
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  increment,
  addDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Secret, Comment } from '../types';
import ConfirmModal from '../components/ConfirmModal';
import { useTheme } from '../context/ThemeContext';

export default function SecretViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const [secret, setSecret] = useState<Secret | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  useEffect(() => {
    if (!id) return;

    // Fetch Secret
    const unsubSecret = onSnapshot(doc(db, 'secrets', id), (snap) => {
      if (snap.exists()) {
        setSecret({ id: snap.id, ...snap.data() } as Secret);
      } else {
        setError('Secret not found');
      }
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError('Failed to load secret');
      setLoading(false);
    });

    // Fetch Comments
    const q = query(
      collection(db, 'secrets', id, 'comments'),
      orderBy('timestamp', 'asc')
    );

    const unsubComments = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Comment[]);
    });

    return () => {
      unsubSecret();
      unsubComments();
    };
  }, [id]);

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      const likesA = a.likes || 0;
      const likesB = b.likes || 0;
      return sortOrder === 'desc' ? likesB - likesA : likesA - likesB;
    });
  }, [comments, sortOrder]);

  const handleLikeSecret = async () => {
    if (!secret) return;
    try {
      await updateDoc(doc(db, 'secrets', secret.id), {
        likes: increment(1)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!id) return;
    try {
      await updateDoc(doc(db, 'secrets', id, 'comments', commentId), {
        likes: increment(1)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async () => {
    if (!id || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'secrets', id, 'comments'), {
        content: newComment,
        timestamp: Date.now(),
        likes: 0
      });
      
      await updateDoc(doc(db, 'secrets', id), {
        commentCount: increment(1)
      });

      setNewComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportSecret = () => {
    if (!secret) return;
    setConfirmModal({
      isOpen: true,
      title: 'Report Secret',
      message: 'Report this secret for inappropriate content?',
      onConfirm: async () => {
        try {
          await addDoc(collection(db, 'reports'), {
            targetId: secret.id,
            targetType: 'secret',
            content: secret.content,
            timestamp: Date.now(),
            status: 'pending'
          });
          alert('Thank you. The secret has been reported.');
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleReportComment = (commentId: string, content: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Report Comment',
      message: 'Report this comment for inappropriate content?',
      onConfirm: async () => {
        try {
          await addDoc(collection(db, 'reports'), {
            targetId: commentId,
            targetType: 'comment',
            content: content,
            timestamp: Date.now(),
            status: 'pending',
            secretId: id
          });
          alert('Thank you. The comment has been reported.');
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !secret) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">{error || 'Secret not found'}</h2>
        <button 
          onClick={() => navigate('/')}
          className="text-purple-500 font-bold hover:underline"
        >
          Back to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <nav className="glass border-b border-glass-border px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-text/40 hover:text-text transition-colors font-bold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Feed
          </button>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleReportSecret}
              className="p-2 text-text/20 hover:text-rose-500 transition-colors"
              title="Report"
            >
              <Flag className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showToast('Link copied to clipboard!');
              }}
              className="p-2 text-muted hover:text-purple-500 transition-colors"
              title="Share"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="space-y-12">
          {/* Secret Content Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass rounded-[3rem] p-10 sm:p-16 relative overflow-hidden shadow-2xl border-2 border-glass-border`}
          >
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${secret.color} opacity-10 blur-[80px] -mr-32 -mt-32`} />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-gradient-to-r ${secret.color} text-white shadow-lg`}>
                  {secret.category}
                </span>
                <div className="flex items-center gap-2 text-muted text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  {new Date(secret.timestamp).toLocaleDateString()} at {new Date(secret.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold leading-tight mb-12">
                "{secret.content}"
              </h2>

              <div className="flex items-center justify-between pt-8 border-t border-glass-border">
                <div className="flex items-center gap-8">
                  <button 
                    onClick={handleLikeSecret}
                    className="flex items-center gap-3 text-text/60 hover:text-rose-500 transition-all group"
                  >
                    <div className="p-3 rounded-2xl bg-rose-500/5 group-hover:bg-rose-500/10 transition-colors">
                      <Heart className={`w-6 h-6 ${secret.likes > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </div>
                    <span className="text-lg font-bold">{secret.likes}</span>
                  </button>
                  <div className="flex items-center gap-3 text-text/60">
                    <div className="p-3 rounded-2xl bg-blue-500/5">
                      <MessageCircle className="w-6 h-6 text-blue-500" />
                    </div>
                    <span className="text-lg font-bold">{secret.commentCount || 0}</span>
                  </div>
                </div>
                <Sparkles className="w-6 h-6 text-text/10" />
              </div>
            </div>
          </motion.div>

          {/* Comments Section */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-display font-bold flex items-center gap-3">
                Comments
                <span className="text-sm font-sans font-normal text-muted bg-glass-bg px-3 py-1 rounded-full">
                  {comments.length}
                </span>
              </h3>
              {comments.length > 1 && (
                <button 
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="flex items-center gap-2 px-4 py-2 bg-glass-bg hover:bg-text/5 rounded-xl text-xs font-bold uppercase tracking-widest text-muted transition-all"
                >
                  <ArrowUpDown className="w-4 h-4" />
                  {sortOrder === 'desc' ? 'Top' : 'Newest'}
                </button>
              )}
            </div>

            {/* Comment Input */}
            <div className="glass rounded-[2rem] p-6 focus-within:ring-2 focus-within:ring-purple-500/30 transition-all border border-glass-border">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-text/5 flex-shrink-0 flex items-center justify-center">
                  <Ghost className="w-5 h-5 text-muted" />
                </div>
                <div className="flex-1 flex flex-col gap-4">
                  <textarea 
                    placeholder="Add a comment anonymously..."
                    className="w-full bg-transparent border-none focus:ring-0 text-lg resize-none h-24 placeholder:text-muted"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={handlePostComment}
                      disabled={!newComment.trim() || isSubmitting}
                      className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-purple-900/20 flex items-center gap-2 text-white"
                    >
                      {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {sortedComments.map((comment) => (
                  <motion.div 
                    key={comment.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-text/5 flex-shrink-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-muted">ANON</span>
                    </div>
                    <div className="flex-1">
                      <div className="glass rounded-3xl rounded-tl-none p-6 mb-3 relative border border-glass-border">
                        <p className="text-text/90 text-lg leading-relaxed pr-12">{comment.content}</p>
                        <button 
                          onClick={() => handleLikeComment(comment.id)}
                          className="absolute right-6 top-6 flex flex-col items-center gap-1 text-muted hover:text-rose-500 transition-colors"
                        >
                          <Heart className={`w-5 h-5 ${(comment.likes || 0) > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span className="text-xs font-bold">{comment.likes || 0}</span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4 text-[10px] text-muted font-bold uppercase tracking-widest">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleReportComment(comment.id, comment.content)}
                          className="text-[10px] text-muted hover:text-rose-500 transition-colors flex items-center gap-1 font-bold uppercase opacity-0 group-hover:opacity-100"
                        >
                          <Flag className="w-3 h-3" />
                          Report
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {comments.length === 0 && (
                <div className="py-20 text-center glass rounded-[2.5rem] border-dashed border-2 border-glass-border">
                  <Ghost className="w-12 h-12 text-muted mx-auto mb-4" />
                  <p className="text-muted font-display">No whispers here yet. Be the first to break the silence.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-purple-600 text-white rounded-2xl shadow-2xl flex items-center gap-3 font-bold"
          >
            <Check className="w-5 h-5" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
