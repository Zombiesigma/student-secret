/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import AdminAuth from '../AdminAuth';
import AdminDashboard from '../AdminDashboard';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          const role = userDoc.data()?.role;
          const isDefaultAdmin = u.email === 'gunturfadilah140@gmail.com';
          setIsAdmin(role === 'admin' || isDefaultAdmin);
        } catch (err) {
          console.error(err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-white/40">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-purple-500" />
        <p className="font-display">Verifying admin credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <AdminAuth onBack={() => window.location.href = '/feed'} />;
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-rose-500" />
        </div>
        <h1 className="text-3xl font-display font-bold text-white mb-2">Access Denied</h1>
        <p className="text-white/40 max-w-md mb-8">
          You do not have the required permissions to access the admin panel. 
          Please contact the system administrator if you believe this is an error.
        </p>
        <button 
          onClick={() => window.location.href = '/feed'}
          className="bg-white text-black px-8 py-3 rounded-2xl font-bold hover:bg-white/90 transition-all"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return <AdminDashboard />;
}
