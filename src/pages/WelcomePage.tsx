/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Ghost, 
  ShieldCheck, 
  MessageSquare, 
  ArrowRight, 
  Heart, 
  Lock, 
  EyeOff,
  Users
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 20 }
  }
};

const floatingVariants = {
  animate: {
    y: [0, -15, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export default function WelcomePage() {
  const navigate = useNavigate();

  const handleEnter = () => {
    localStorage.setItem('hasVisited', 'true');
    navigate('/feed');
  };

  const handleLearnMore = () => {
    const target = document.getElementById('about');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30 overflow-x-hidden">
      {/* Immersive Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-900/15 blur-[160px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-900/15 blur-[160px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-900/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '4s' }} />
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative z-10">
        {/* Navigation / Header */}
        <nav className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Ghost className="w-6 h-6 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">Student<span className="text-purple-500">Secret</span></span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden sm:flex items-center gap-8 text-sm font-medium text-white/40"
          >
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <button 
              onClick={handleEnter}
              className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white transition-all"
            >
              Launch App
            </button>
          </motion.div>
        </nav>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl"
          >
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest mb-8"
            >
              <span className="inline-flex w-3 h-3 rounded-full bg-purple-400/40" />
              The Shadows are Calling
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-6xl md:text-8xl lg:text-9xl font-display font-bold mb-8 leading-[0.9] tracking-tighter"
            >
              Share your <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400">
                Untold Stories.
              </span>
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="text-xl md:text-2xl text-white/50 mb-12 max-w-2xl mx-auto font-medium leading-relaxed"
            >
              A safe, anonymous sanctuary for students to express, confess, and connect without the weight of identity.
            </motion.p>

            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEnter}
                className="w-full sm:w-auto bg-white text-black px-10 py-5 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 shadow-2xl shadow-white/10 hover:shadow-white/20 transition-all"
              >
                Enter the Shadows
                <ArrowRight className="w-6 h-6" />
              </motion.button>
              
              <button
                type="button"
                onClick={handleLearnMore}
                className="w-full sm:w-auto px-10 py-5 rounded-2xl font-bold text-xl border border-white/10 hover:bg-white/5 transition-all"
              >
                Learn More
              </button>
            </motion.div>
          </motion.div>

          {/* Floating Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none -z-10 overflow-hidden">
            <motion.div 
              variants={floatingVariants}
              animate="animate"
              className="absolute top-[20%] left-[15%] p-4 glass rounded-2xl border-white/10 rotate-[-12deg] opacity-20 md:opacity-100"
            >
              <Heart className="w-8 h-8 text-rose-500" />
            </motion.div>
            <motion.div 
              variants={floatingVariants}
              animate="animate"
              style={{ animationDelay: '1.5s' }}
              className="absolute bottom-[25%] right-[15%] p-4 glass rounded-2xl border-white/10 rotate-[15deg] opacity-20 md:opacity-100"
            >
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </motion.div>
            <motion.div 
              variants={floatingVariants}
              animate="animate"
              style={{ animationDelay: '3s' }}
              className="absolute top-[30%] right-[20%] p-4 glass rounded-2xl border-white/10 rotate-[-5deg] opacity-10 md:opacity-100"
            >
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-32 border-t border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: EyeOff, 
                title: 'Total Anonymity', 
                desc: 'No accounts, no tracking, no footprints. Your identity remains yours alone.',
                color: 'text-purple-500',
                bg: 'bg-purple-500/10'
              },
              { 
                icon: Lock, 
                title: 'Secure Space', 
                desc: 'Moderated by the community to ensure a safe and respectful environment for everyone.',
                color: 'text-blue-500',
                bg: 'bg-blue-500/10'
              },
              { 
                icon: Users, 
                title: 'Community Driven', 
                desc: 'Connect with fellow students through shared experiences and mutual support.',
                color: 'text-emerald-500',
                bg: 'bg-emerald-500/10'
              }
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                className="glass p-10 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all group"
              >
                <div className={`w-14 h-14 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-4">{feature.title}</h3>
                <p className="text-white/40 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="max-w-7xl mx-auto px-6 py-32">
          <div className="glass rounded-[3rem] p-12 md:p-20 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
            <div className="max-w-md">
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">A growing community of voices.</h2>
              <p className="text-white/40 text-lg">Join thousands of students who have already found their voice in the shadows.</p>
            </div>
            <div className="grid grid-cols-2 gap-8 md:gap-16">
              <div>
                <h4 className="text-5xl md:text-6xl font-display font-bold text-purple-500 mb-2">10k+</h4>
                <p className="text-xs uppercase tracking-widest font-bold text-white/20">Secrets Shared</p>
              </div>
              <div>
                <h4 className="text-5xl md:text-6xl font-display font-bold text-blue-500 mb-2">50k+</h4>
                <p className="text-xs uppercase tracking-widest font-bold text-white/20">Reactions</p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="max-w-7xl mx-auto px-6 py-32 border-t border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-sm uppercase tracking-[0.4em] text-purple-400 font-bold">About Student Secret</p>
              <h2 className="text-5xl font-display font-bold max-w-xl">A safe, anonymous space for students to share honestly.</h2>
              <p className="text-white/60 leading-relaxed text-lg max-w-xl">
                Here, your voice matters more than your name. Students can share their stories, questions, and support without fear or judgment.
                Everything is anonymous, moderated, and built to help the community feel heard.
              </p>
              <button
                type="button"
                onClick={handleEnter}
                className="inline-flex items-center gap-3 bg-purple-500 hover:bg-purple-400 text-black px-8 py-4 rounded-3xl font-bold transition-all"
              >
                Start Sharing
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <div className="glass rounded-[2.5rem] border border-white/5 p-10 text-white/70 bg-white/5">
              <h3 className="text-2xl font-semibold mb-4">How it works</h3>
              <ul className="space-y-4 text-white/50">
                <li className="flex gap-4">
                  <span className="font-bold text-purple-400">1.</span>
                  Share confidential thoughts without logging in.
                </li>
                <li className="flex gap-4">
                  <span className="font-bold text-purple-400">2.</span>
                  Read and react to anonymous posts from other students.
                </li>
                <li className="flex gap-4">
                  <span className="font-bold text-purple-400">3.</span>
                  Report anything inappropriate and keep the space safe.
                </li>
                <li className="flex gap-4">
                  <span className="font-bold text-purple-400">4.</span>
                  Return anytime, because your story is always welcome.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <Ghost className="w-5 h-5" />
            <span className="font-display font-bold text-sm tracking-tight uppercase">Student Secret</span>
          </div>
          
          <div className="flex gap-8 text-xs font-bold uppercase tracking-widest text-white/20">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          
          <p className="text-[10px] text-white/10 uppercase tracking-[0.2em] font-bold">
            © 2026 Whisper Responsibly
          </p>
        </footer>
      </div>
    </div>
  );
}
