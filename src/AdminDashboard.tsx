/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, 
  Shield, 
  LogOut, 
  Users, 
  MessageSquare, 
  TrendingUp,
  Search,
  ChevronRight,
  AlertTriangle,
  ClipboardList,
  Flag,
  CheckCircle,
  AlertCircle,
  Bell,
  UserPlus,
  Settings,
  Mail,
  Clock
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc, 
  doc,
  getDocs,
  updateDoc,
  increment,
  limit,
  setDoc,
  addDoc
} from 'firebase/firestore';
import { signOut, getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { db, auth, firebaseConfig } from './firebase';
import { Secret, Report, UserProfile, AdminNotification } from './types';
import SurveyManager from './components/SurveyManager';
import ConfirmModal from './components/ConfirmModal';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'secrets' | 'surveys' | 'reports' | 'users' | 'notifications'>('secrets');
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'primary';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'primary'
  });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 3000);
  };

  useEffect(() => {
    const q = query(collection(db, 'secrets'), orderBy('timestamp', 'desc'));
    const unsubSecrets = onSnapshot(q, (snapshot) => {
      setSecrets(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Secret[]);
    });

    const qReports = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
    const unsubReports = onSnapshot(qReports, (snapshot) => {
      setReports(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Report[]);
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as UserProfile[]);
      setUserCount(snapshot.size);
    });

    const qNotifications = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(50));
    const unsubNotifications = onSnapshot(qNotifications, (snapshot) => {
      setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as AdminNotification[]);
    });

    return () => {
      unsubSecrets();
      unsubReports();
      unsubUsers();
      unsubNotifications();
    };
  }, []);

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Secret',
      message: 'Are you sure you want to delete this secret? This action cannot be undone.',
      variant: 'danger',
      onConfirm: async () => {
        setIsDeleting(id);
        try {
          await deleteDoc(doc(db, 'secrets', id));
        } catch (err) {
          console.error(err);
          alert('Failed to delete secret.');
        } finally {
          setIsDeleting(null);
        }
      }
    });
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), {
        status: 'resolved'
      });
    } catch (err) {
      console.error(err);
      alert('Failed to resolve report.');
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
    } catch (err) {
      console.error(err);
      alert('Failed to update user role.');
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReportedContent = async (report: Report) => {
    setConfirmModal({
      isOpen: true,
      title: `Delete ${report.targetType}`,
      message: `Are you sure you want to delete this ${report.targetType}?`,
      variant: 'danger',
      onConfirm: async () => {
        try {
          if (report.targetType === 'secret') {
            await deleteDoc(doc(db, 'secrets', report.targetId));
          } else {
            if (report.secretId) {
              await deleteDoc(doc(db, 'secrets', report.secretId, 'comments', report.targetId));
              await updateDoc(doc(db, 'secrets', report.secretId), {
                commentCount: increment(-1)
              });
            } else {
              alert('Missing secret ID for this comment report.');
              return;
            }
          }
          await handleResolveReport(report.id);
          alert('Content deleted and report resolved.');
        } catch (err) {
          console.error(err);
          alert('Failed to delete content.');
        }
      }
    });
  };

  const filteredSecrets = secrets.filter(s => 
    s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffLoading(true);
    try {
      // Use a secondary app instance to create the user without logging out the current admin
      const secondaryApp = initializeApp(firebaseConfig, "SecondaryRegistration");
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, staffEmail, staffPassword);
      const newUser = userCredential.user;

      // Create user doc with admin role
      await setDoc(doc(db, 'users', newUser.uid), {
        email: staffEmail,
        role: 'admin',
        lastActive: Date.now()
      });

      // Log out the secondary instance immediately
      await signOut(secondaryAuth);
      
      showToast('Staff member registered successfully!');
      setShowAddStaff(false);
      setStaffEmail('');
      setStaffPassword('');
    } catch (err: any) {
      console.error(err);
      showToast('Error: ' + err.message);
    } finally {
      setStaffLoading(false);
    }
  };

  const totalLikes = secrets.reduce((acc, s) => acc + s.likes, 0);

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Sidebar / Topbar */}
      <nav className="glass border-b border-glass-border px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">Admin Panel</h1>
              <p className="text-[10px] text-purple-400 uppercase tracking-widest font-bold">Control Center</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-sm font-medium">{auth.currentUser?.displayName || 'Admin'}</span>
              <span className="text-[10px] text-muted">{auth.currentUser?.email}</span>
            </div>
            <button 
              onClick={() => {
                setConfirmModal({
                  isOpen: true,
                  title: 'Log Out',
                  message: 'Are you sure you want to log out of the admin panel?',
                  variant: 'primary',
                  onConfirm: () => signOut(auth)
                });
              }}
              className="p-3 hover:bg-rose-500/10 hover:text-rose-500 rounded-2xl transition-all text-muted"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {[
            { label: 'Total Secrets', value: secrets.length, icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Total Likes', value: totalLikes, icon: TrendingUp, color: 'text-rose-500', bg: 'bg-rose-500/10' },
            { label: 'Total Users', value: userCount, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { label: 'Active Now', value: 'Live', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-glass-border"
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.bg} ${stat.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4`}>
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <p className="text-muted text-[10px] sm:text-sm mb-1">{stat.label}</p>
              <h3 className="text-xl sm:text-3xl font-display font-bold">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 sm:gap-4 mb-8 overflow-x-auto no-scrollbar pb-2">
          <button 
            onClick={() => setActiveTab('secrets')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'secrets' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'bg-text/5 text-muted hover:bg-text/10'}`}
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            Secrets
          </button>
          <button 
            onClick={() => setActiveTab('surveys')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'surveys' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'bg-text/5 text-muted hover:bg-text/10'}`}
          >
            <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
            Surveys
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'reports' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'bg-text/5 text-muted hover:bg-text/10'}`}
          >
            <div className="relative">
              <Flag className="w-4 h-4 sm:w-5 sm:h-5" />
              {reports.filter(r => r.status === 'pending').length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-rose-500 rounded-full border-2 border-bg" />
              )}
            </div>
            Reports
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'users' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'bg-text/5 text-muted hover:bg-text/10'}`}
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            Users
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'notifications' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'bg-text/5 text-muted hover:bg-text/10'}`}
          >
            <div className="relative">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-rose-500 rounded-full border-2 border-bg" />
              )}
            </div>
            Alerts
          </button>
        </div>

        {activeTab === 'secrets' ? (
          <div className="glass rounded-2xl sm:rounded-[2.5rem] overflow-hidden border-glass-border">
            <div className="p-6 sm:p-8 border-b border-glass-border flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-bold">Manage Secrets</h2>
                <p className="text-muted text-xs sm:text-sm">Monitor and moderate user confessions</p>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-text/5 border border-glass-border rounded-xl sm:rounded-2xl py-2 sm:py-3 pl-12 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all w-full md:w-80"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="text-muted text-[10px] uppercase tracking-widest font-bold border-b border-glass-border">
                    <th className="px-8 py-4">Secret Content</th>
                    <th className="px-8 py-4">Category</th>
                    <th className="px-8 py-4">Likes</th>
                    <th className="px-8 py-4">Comments</th>
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  <AnimatePresence>
                    {filteredSecrets.map((secret) => (
                      <motion.tr 
                        key={secret.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="hover:bg-white/5 transition-colors group"
                      >
                        <td className="px-8 py-6">
                          <p className="text-sm font-medium line-clamp-2 max-w-md">"{secret.content}"</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[10px] font-bold px-2 py-1 rounded bg-text/10 text-text/60">
                            {secret.category}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-1.5 text-sm">
                            <TrendingUp className="w-3 h-3 text-rose-500" />
                            {secret.likes}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-1.5 text-sm text-text/60">
                            <MessageSquare className="w-3 h-3" />
                            {secret.commentCount || 0}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs text-muted">{new Date(secret.timestamp).toLocaleDateString()}</p>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button 
                            onClick={() => handleDelete(secret.id)}
                            disabled={isDeleting === secret.id}
                            className="p-3 hover:bg-rose-500/20 text-rose-500/60 hover:text-rose-500 rounded-xl transition-all disabled:opacity-50"
                          >
                            {isDeleting === secret.id ? (
                              <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-5 h-5" />
                            )}
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {filteredSecrets.length === 0 && (
              <div className="py-20 text-center text-muted/20">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-display text-lg">No secrets found to manage.</p>
              </div>
            )}
          </div>
        ) : activeTab === 'surveys' ? (
          <SurveyManager />
        ) : activeTab === 'reports' ? (
          <div className="glass rounded-2xl sm:rounded-[2.5rem] overflow-hidden border-glass-border">
            <div className="p-6 sm:p-8 border-b border-glass-border">
              <h2 className="text-xl sm:text-2xl font-display font-bold">Content Reports</h2>
              <p className="text-muted text-xs sm:text-sm">Review and moderate reported content</p>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="text-muted text-[10px] uppercase tracking-widest font-bold border-b border-glass-border">
                    <th className="px-8 py-4">Type</th>
                    <th className="px-8 py-4">Reported Content</th>
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  <AnimatePresence>
                    {reports.map((report) => (
                      <motion.tr 
                        key={report.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`hover:bg-text/5 transition-colors group ${report.status === 'resolved' ? 'opacity-40' : ''}`}
                      >
                        <td className="px-8 py-6">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded ${report.targetType === 'secret' ? 'bg-blue-500/20 text-blue-500' : 'bg-purple-500/20 text-purple-500'}`}>
                            {report.targetType.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm font-medium line-clamp-2 max-w-md">"{report.content}"</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs text-muted">{new Date(report.timestamp).toLocaleDateString()}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded ${report.status === 'pending' ? 'bg-rose-500/20 text-rose-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                            {report.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {report.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => handleResolveReport(report.id)}
                                  className="p-2 hover:bg-emerald-500/20 text-emerald-500/60 hover:text-emerald-500 rounded-xl transition-all"
                                  title="Mark as Resolved"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteReportedContent(report)}
                                  className="p-2 hover:bg-rose-500/20 text-rose-500/60 hover:text-rose-500 rounded-xl transition-all"
                                  title="Delete Content"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {reports.length === 0 && (
              <div className="py-20 text-center text-white/20">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-display text-lg">No reports to review.</p>
              </div>
            )}
          </div>
        ) : activeTab === 'users' ? (
          <div className="glass rounded-2xl sm:rounded-[2.5rem] overflow-hidden border-glass-border">
          <div className="p-6 sm:p-8 border-b border-glass-border flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-display font-bold">User Management</h2>
              <p className="text-muted text-xs sm:text-sm">Manage user accounts and permissions</p>
            </div>
            <button 
              onClick={() => setShowAddStaff(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-900/20"
            >
              <UserPlus className="w-4 h-4" />
              Add Staff
            </button>
          </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="text-muted text-[10px] uppercase tracking-widest font-bold border-b border-glass-border">
                    <th className="px-8 py-4">User</th>
                    <th className="px-8 py-4">Role</th>
                    <th className="px-8 py-4">Last Active</th>
                    <th className="px-8 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border">
                  <AnimatePresence>
                    {users.map((user) => (
                      <motion.tr 
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-text/5 transition-colors group"
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 font-bold">
                              {user.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{user.email}</p>
                              <p className="text-[10px] text-muted font-mono">{user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-500' : 'bg-text/10 text-text/60'}`}>
                            {user.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-xs text-muted">
                            {user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never'}
                          </p>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleUpdateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                              className="p-2 hover:bg-purple-500/20 text-purple-500/60 hover:text-purple-500 rounded-xl transition-all"
                              title={user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                            >
                              <Shield className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl sm:rounded-[2.5rem] overflow-hidden border-glass-border">
            <div className="p-6 sm:p-8 border-b border-glass-border flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-display font-bold">Admin Alerts</h2>
                <p className="text-muted text-xs sm:text-sm">System notifications and report alerts</p>
              </div>
              <button 
                onClick={() => notifications.forEach(n => !n.read && handleMarkNotificationRead(n.id))}
                className="text-xs font-bold text-purple-500 hover:text-purple-400 transition-colors"
              >
                Mark all as read
              </button>
            </div>

            <div className="divide-y divide-glass-border">
              <AnimatePresence>
                {notifications.map((notification) => (
                  <motion.div 
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={`p-6 flex items-start gap-4 transition-colors ${notification.read ? 'opacity-60' : 'bg-purple-500/5'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notification.type === 'report' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                      {notification.type === 'report' ? <Flag className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-sm">{notification.title}</h4>
                        <span className="text-[10px] text-muted font-bold uppercase tracking-widest">
                          {new Date(notification.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted mb-3">{notification.message}</p>
                      <div className="flex items-center gap-4">
                        {!notification.read && (
                          <button 
                            onClick={() => handleMarkNotificationRead(notification.id)}
                            className="text-[10px] font-bold text-purple-500 uppercase tracking-widest hover:text-purple-400"
                          >
                            Mark as read
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:text-rose-400"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {notifications.length === 0 && (
                <div className="py-20 text-center text-white/20">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-display text-lg">No notifications yet.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
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
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-purple-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-purple-900/40 flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showAddStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddStaff(false)}
              className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass rounded-[2.5rem] p-8 border-glass-border"
            >
              <h3 className="text-2xl font-display font-bold mb-2">Register New Staff</h3>
              <p className="text-muted text-sm mb-8">Create a new administrator account</p>

              <form onSubmit={handleAddStaff} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2 ml-1">Email Address</label>
                  <input 
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    className="w-full bg-text/5 border border-glass-border rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                    placeholder="staff@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-muted mb-2 ml-1">Password</label>
                  <input 
                    type="password"
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="w-full bg-text/5 border border-glass-border rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddStaff(false)}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold text-muted hover:bg-text/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={staffLoading}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20"
                  >
                    {staffLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Register'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
