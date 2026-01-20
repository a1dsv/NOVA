import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { Map, Radio, User, MessageCircle, Plus, Zap, Moon, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Wait for authentication handshake
        const isAuthenticated = await base44.auth.isAuthenticated();
        
        if (!isAuthenticated) {
          // Not authenticated and not on special pages
          if (currentPageName !== 'Application' && currentPageName !== 'Onboarding') {
            base44.auth.redirectToLogin();
          }
          setLoading(false);
          return;
        }

        // Small delay to allow session cookie to settle
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        if (!currentUser) {
          base44.auth.redirectToLogin();
          return;
        }

        // Identity Gate: Check if username exists
        if ((!currentUser.username || currentUser.username.trim() === '') && currentPageName !== 'Onboarding') {
          navigate(createPageUrl('Onboarding'));
          return;
        }

        // Prevent redirect loop on Onboarding page
        if (currentPageName === 'Onboarding') {
          setLoading(false);
          return;
        }

        // Redirect unapproved users to application
        if (currentPageName !== 'Application' &&
        currentUser.application_status !== 'approved') {
          navigate(createPageUrl('Application'));
          return;
        }

        // Redirect to Dashboard on initial load/refresh
        if (!currentPageName || currentPageName === 'Home' ||
        window.location.pathname === '/') {
          navigate(createPageUrl('Dashboard'));
        }
      } catch (e) {
        console.error('Auth error:', e);
        // Only redirect to login if not already on special pages
        if (currentPageName !== 'Onboarding' && currentPageName !== 'Application') {
          base44.auth.redirectToLogin();
        }
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [currentPageName, navigate]);

  const navItems = [
    { name: 'Signals', icon: Radio, page: 'Transmission' },
    { name: 'Challenges', icon: Zap, page: 'Challenges' },
    { name: 'Dashboard', icon: null, page: 'Dashboard', isCenter: true },
    { name: 'Circles', icon: MessageCircle, page: 'Circles' },
    { name: 'Profile', icon: User, page: 'Account' }];


  // Hide nav on application and onboarding pages
  const hideNav = currentPageName === 'Application' || currentPageName === 'Onboarding';

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-600 to-cyan-400" />

      </div>);

  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <style>{`
        :root {
          --nova-violet: #8F00FF;
          --nova-cyan: #00F2FF;
          --nova-black: #000000;
          --nova-dark: #0A0A0A;
          --nova-gray: #1A1A1A;
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        body {
          background: #000000;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .nova-gradient {
          background: linear-gradient(135deg, var(--nova-violet) 0%, var(--nova-cyan) 100%);
        }
        
        .nova-gradient-text {
          background: linear-gradient(135deg, var(--nova-violet) 0%, var(--nova-cyan) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .nova-glow-violet {
          box-shadow: 0 0 30px rgba(143, 0, 255, 0.4);
        }
        
        .nova-glow-cyan {
          box-shadow: 0 0 30px rgba(0, 242, 255, 0.4);
        }
        
        .pulse-animation {
          animation: pulse-ring 2s ease-out infinite;
        }
        
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      
      <main className="">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageName}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="pb-safe">

            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      {!hideNav &&
      <nav className="fixed bottom-0 left-0 right-0 z-[10000] bg-black/90 backdrop-blur-xl border-t border-white/5">
          <div className="max-w-lg mx-auto">
            <div className="grid grid-cols-5 items-end py-3 relative px-4">
              {navItems.map((item, index) => {
              const isActive = currentPageName === item.page;
              const Icon = item.icon;

              if (item.isCenter) {
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className="col-start-3 flex justify-center -mt-8">

                      <motion.div
                      whileTap={{ scale: 0.95 }}
                      className="w-16 h-16 rounded-full nova-gradient nova-glow-violet flex items-center justify-center shadow-xl">

                        <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69587c2e9dd9113c4d857e1d/e314d2a42_Nova2_01-03.png"
                        alt="NOVA"
                        className="w-10 h-10" />

                      </motion.div>
                    </Link>);

              }

              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className="relative flex flex-col items-center gap-1 py-2">

                    <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={`relative ${isActive ? 'text-white' : 'text-white/40'}`}>

                      <Icon className="w-6 h-6" />
                    </motion.div>
                    <span className={`text-[10px] uppercase tracking-wider ${isActive ? 'text-white' : 'text-white/40'}`}>
                      {item.name}
                    </span>
                  </Link>);

            })}
            </div>
          </div>
        </nav>
      }


    </div>);

}