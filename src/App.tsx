/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Heart, 
  MessageCircle, 
  Search, 
  Sparkles, 
  Clock,
  Send,
  X,
  Ghost,
  AlertCircle,
  Shield,
  Flag,
  Moon,
  Sun,
  Share2,
  Check
} from 'lucide-react';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  doc, 
  increment,
  getDocFromServer
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from './firebase';
import { Category, Secret, CATEGORIES, CATEGORY_COLORS } from './types';
import AdminPage from './pages/AdminPage';
import WelcomePage from './pages/WelcomePage';
import SurveyEditor from './pages/SurveyEditor';
import SurveyResults from './pages/SurveyResults';
import SecretViewPage from './pages/SecretViewPage';
import SurveyUserView from './components/SurveyUserView';
import ConfirmModal from './components/ConfirmModal';
import { ThemeProvider, useTheme } from './context/ThemeContext';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function Feed() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [filter, setFilter] = useState<Category | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSecret, setNewSecret] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Confession');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: auth.currentUser?.uid,
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    setError(error instanceof Error ? error.message : 'An unknown error occurred');
  };

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  const handleShare = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/secret/${id}`;
    navigator.clipboard.writeText(url);
    showToast('Link copied to clipboard!');
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));

    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (err) {
        if (err instanceof Error && err.message.includes('the client is offline')) {
          setError("Firebase is offline. Check your configuration.");
        }
      }
    };
    testConnection();

    const q = query(collection(db, 'secrets'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSecrets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Secret[];
      setSecrets(fetchedSecrets);
      setIsLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'secrets');
      setIsLoading(false);
    });

    return () => {
      unsubAuth();
      unsubscribe();
    };
  }, []);

  const filteredSecrets = useMemo(() => {
    return secrets
      .filter(s => filter === 'All' || s.category === filter)
      .filter(s => s.content.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [secrets, filter, searchQuery]);

  const handlePostSecret = async () => {
    if (!newSecret.trim()) return;

    const secretData = {
      content: newSecret,
      category: selectedCategory,
      timestamp: Date.now(),
      likes: 0,
      commentCount: 0,
      color: CATEGORY_COLORS[selectedCategory]
    };

    try {
      await addDoc(collection(db, 'secrets'), secretData);
      setNewSecret('');
      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'secrets');
    }
  };

  const handleLike = async (id: string) => {
    try {
      const secretRef = doc(db, 'secrets', id);
      await updateDoc(secretRef, {
        likes: increment(1)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `secrets/${id}`);
    }
  };

  const handleReportSecret = async (secret: Secret) => {
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
          alert('Thank you. The secret has been reported to moderators.');
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'reports');
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-bg text-text font-sans selection:bg-purple-500/30">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-glass-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center neon-glow">
              <Ghost className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-display font-bold tracking-tight">
              Student<span className="text-purple-500">Secret</span>
            </h1>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={toggleTheme}
              className="p-2 text-muted hover:text-text transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input 
                type="text" 
                placeholder="Search secrets..." 
                className="bg-text/5 border border-glass-border rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-full font-medium transition-all flex items-center gap-2 shadow-lg shadow-purple-900/20"
            >
              <Plus className="w-4 h-4" />
              Post Secret
            </button>
            <button 
              onClick={() => navigate('/admin')}
              className="p-2 text-muted hover:text-text transition-colors"
              title="Admin Panel"
            >
              <Shield className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button 
              onClick={toggleTheme}
              className="p-2 text-muted"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => navigate('/admin')}
              className="p-2 text-muted"
            >
              <Shield className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="p-2 bg-purple-600 rounded-full text-white"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
          </div>
        )}

        {/* Surveys Section */}
        <SurveyUserView />

        {/* Filters */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
          <button 
            onClick={() => setFilter('All')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filter === 'All' ? 'bg-text text-bg' : 'bg-text/5 text-muted hover:bg-text/10'}`}
          >
            All Secrets
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filter === cat ? 'bg-purple-600 text-white' : 'bg-text/5 text-muted hover:bg-text/10'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredSecrets.map((secret) => (
              <motion.div
                key={secret.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => navigate(`/secret/${secret.id}`)}
                className="group relative glass rounded-3xl p-6 hover:border-glass-border transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md bg-gradient-to-r ${secret.color} text-white`}>
                    {secret.category}
                  </span>
                  <div className="flex items-center gap-1 text-muted text-xs">
                    <Clock className="w-3 h-3" />
                    {new Date(secret.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                
                <p className="text-lg leading-relaxed text-text/90 mb-6 font-medium">
                  "{secret.content}"
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-glass-border">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(secret.id);
                      }}
                      className="flex items-center gap-1.5 text-muted hover:text-rose-500 transition-colors group/btn"
                    >
                      <Heart className={`w-5 h-5 ${secret.likes > 50 ? 'fill-rose-500 text-rose-500' : 'group-hover/btn:fill-rose-500'}`} />
                      <span className="text-sm">{secret.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-muted hover:text-blue-500 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">{secret.commentCount || 0}</span>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReportSecret(secret);
                      }}
                      className="flex items-center gap-1.5 text-muted/30 hover:text-rose-500 transition-colors"
                      title="Report Secret"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleShare(e, secret.id)}
                      className="flex items-center gap-1.5 text-muted/30 hover:text-purple-500 transition-colors"
                      title="Share Secret"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                  <Sparkles className="w-4 h-4 text-muted/20 group-hover:text-purple-500/50 transition-colors" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p>Summoning secrets...</p>
          </div>
        )}

        {!isLoading && filteredSecrets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <Ghost className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-xl font-display">No secrets found in this shadows...</p>
          </div>
        )}
      </main>

      {/* Post Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass rounded-[2rem] p-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-display font-bold">Share a Secret</h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-text/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-muted mb-3">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat ? `bg-gradient-to-r ${CATEGORY_COLORS[cat]} text-white` : 'bg-text/5 text-muted hover:bg-text/10'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest font-bold text-muted mb-3">Your Secret</label>
                  <textarea 
                    autoFocus
                    placeholder="What's on your mind? Don't worry, it's anonymous..."
                    className="w-full h-40 bg-text/5 border border-glass-border rounded-2xl p-4 text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
                    value={newSecret}
                    onChange={(e) => setNewSecret(e.target.value)}
                  />
                </div>

                <button 
                  onClick={handlePostSecret}
                  disabled={!newSecret.trim()}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-xl shadow-purple-900/40"
                >
                  <Send className="w-5 h-5" />
                  Whisper into the Void
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-glass-border text-center text-muted text-sm">
        <p>© 2026 Student Secret. All whispers are anonymous.</p>
      </footer>

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

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const hasVisited = localStorage.getItem('hasVisited');
  const location = useLocation();

  if (!hasVisited && location.pathname !== '/welcome') {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        } />
        <Route path="/secret/:id" element={
          <ProtectedRoute>
            <SecretViewPage />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/survey/new" element={
          <ProtectedRoute>
            <SurveyEditor />
          </ProtectedRoute>
        } />
        <Route path="/admin/survey/edit/:id" element={
          <ProtectedRoute>
            <SurveyEditor />
          </ProtectedRoute>
        } />
        <Route path="/admin/survey/results/:id" element={
          <ProtectedRoute>
            <SurveyResults />
          </ProtectedRoute>
        } />
      </Routes>
    </ThemeProvider>
  );
}
