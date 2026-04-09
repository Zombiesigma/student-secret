/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Ghost, Sparkles, ShieldCheck, MessageSquare, ArrowRight } from 'lucide-react';

export default function WelcomePage() {
  const navigate = useNavigate();

  const handleEnter = () => {
    localStorage.setItem('hasVisited', 'true');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-2xl w-full text-center"
      >
        <motion.div 
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12 }}
          className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-purple-500/20 neon-glow"
        >
          <Ghost className="w-12 h-12 text-white" />
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight">
          Welcome to <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Student Secret
          </span>
        </h1>

        <p className="text-xl text-white/40 mb-12 font-medium leading-relaxed">
          A safe, anonymous space to share your whispers, confessions, and stories without judgment.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            { icon: ShieldCheck, title: 'Anonymous', desc: 'No accounts needed to post' },
            { icon: MessageSquare, title: 'Connect', desc: 'Share and listen to others' },
            { icon: Sparkles, title: 'Safe Space', desc: 'Moderated by the community' }
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="glass p-6 rounded-3xl border border-white/5"
            >
              <item.icon className="w-6 h-6 text-purple-500 mx-auto mb-3" />
              <h3 className="font-bold text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-white/40">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleEnter}
          className="group bg-white text-black px-10 py-5 rounded-[2rem] font-bold text-xl flex items-center gap-3 mx-auto shadow-xl hover:shadow-white/10 transition-all"
        >
          Enter the Shadows
          <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </motion.div>

      <footer className="absolute bottom-8 text-white/20 text-xs uppercase tracking-widest font-bold">
        Whisper responsibly
      </footer>
    </div>
  );
}
