/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Favorites from './pages/Favorites';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import VehicleDetails from './pages/VehicleDetails';
import VehicleStories from './components/VehicleStories';
import { AnimatePresence, motion } from 'motion/react';
import { Car, Power } from 'lucide-react';
import { playEngineStartupSound } from './utils/engineSound';
import { triggerHaptic } from './utils/haptics';

export default function App() {
  const { currentTab, activeCarId } = useStore();
  const [isSplash, setIsSplash] = useState(true);
  const [loadingDone, setLoadingDone] = useState(false);

  useEffect(() => {
    // Инициализация Telegram WebApp API
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      
      // Closing confirmation is supported in Telegram WebApp API 6.2+
      if (tg.isVersionAtLeast?.('6.2') && tg.enableClosingConfirmation) {
        tg.enableClosingConfirmation();
      }
      
      // Header and Background colors are supported in Telegram WebApp API 6.1+
      if (tg.isVersionAtLeast?.('6.1')) {
        tg.setHeaderColor?.('#FAF8F5'); // Warm Linen
        tg.setBackgroundColor?.('#FAF8F5');
      }
    }

    // Симуляция загрузки каталога (2.2 секунды)
    const timer = setTimeout(() => {
      setLoadingDone(true);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const handleStartApp = () => {
    triggerHaptic('heavy');
    playEngineStartupSound('v12');
    setIsSplash(false);
  };

  const renderActiveTab = () => {
    // Если открыта конкретная карточка машины, рендерим её детали поверх любой вкладки
    if (activeCarId) {
      return (
        <motion.div
          key="car-details"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <VehicleDetails />
        </motion.div>
      );
    }

    switch (currentTab) {
      case 'home':
        return (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Home />
          </motion.div>
        );
      case 'catalog':
        return (
          <motion.div
            key="catalog"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Catalog />
          </motion.div>
        );
      case 'favorites':
        return (
          <motion.div
            key="favorites"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Favorites />
          </motion.div>
        );
      case 'orders':
        return (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Orders />
          </motion.div>
        );
      case 'profile':
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Profile />
          </motion.div>
        );
      default:
        return <Home />;
    }
  };

  return (
    <>
      <AnimatePresence>
        {isSplash && (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 bg-[#FAF8F5] z-50 flex flex-col items-center justify-between py-12 px-6 select-none overflow-hidden"
          >
            {/* Top glowing ambient background effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#C5A880]/8 blur-[120px] rounded-full pointer-events-none" />

            {/* Middle Logo & Title */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="w-56 h-56 flex items-center justify-center relative z-10"
              >
                <img 
                  src="/logo.png" 
                  alt="DA!CAR Logo" 
                  className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(28,25,23,0.08)]"
                />
              </motion.div>
              
              {/* Title with letter-spacing & fade-in-up */}
              <div className="text-center space-y-1 relative z-10">
                <motion.h1
                  initial={{ letterSpacing: "0.15em", opacity: 0, y: 10 }}
                  animate={{ letterSpacing: "0.25em", opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
                  className="text-2xl font-display font-black text-[#1C1917] pl-[0.25em] tracking-[0.25em] uppercase"
                >
                  DA!CAR
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 0.6, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                  className="text-[9px] font-mono tracking-[0.25em] uppercase text-[#78716C]"
                >
                  Автомобильный консьерж-сервис
                </motion.p>
              </div>
            </div>

            {/* Bottom Elegant Progress Loader or tactile START button */}
            <div className="w-full max-w-[260px] flex flex-col items-center justify-center min-h-[140px] relative z-10">
              <AnimatePresence mode="wait">
                {!loadingDone ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="w-full flex flex-col items-center space-y-4"
                  >
                    <div className="w-full h-[2px] bg-[#C5A880]/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 2.0, ease: "easeInOut" }}
                        className="h-full bg-gradient-to-r from-[#C5A880] via-[#EFEBE4] to-[#C5A880] rounded-full"
                      />
                    </div>
                    <span className="text-[9px] font-mono tracking-wider text-[#78716C] uppercase">
                      Загрузка каталога...
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="start-btn"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="flex flex-col items-center space-y-4"
                  >
                    {/* Glowing outer ring */}
                    <div className="relative">
                      <div className="absolute -inset-2 bg-gradient-to-r from-[#C5A880] to-[#E5C494] rounded-full blur-md opacity-45 animate-pulse" />
                      <button
                        onClick={handleStartApp}
                        className="relative w-24 h-24 rounded-full bg-gradient-to-b from-[#292524] to-[#1C1917] border-2 border-[#C5A880] flex flex-col items-center justify-center shadow-[0_8px_20px_rgba(197,168,128,0.25)] active:scale-95 transition-transform group cursor-pointer"
                      >
                        {/* Red ignition light */}
                        <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444] mb-1.5 animate-ping absolute top-5" />
                        <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-[0_0_8px_#EF4444] mb-1.5 absolute top-5" />
                        
                        <Power className="w-6 h-6 text-[#C5A880] group-hover:text-[#FAF8F5] transition-colors mt-2" />
                        
                        <span className="text-[8px] font-display font-black tracking-widest text-[#C5A880] mt-1.5 pl-[0.1em]">
                          START
                        </span>
                      </button>
                    </div>
                    
                    <span className="text-[10px] font-display font-bold tracking-wider text-[#1C1917] uppercase animate-pulse">
                      Запустить двигатель
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Layout>
        <AnimatePresence mode="wait">
          {renderActiveTab()}
        </AnimatePresence>
        <VehicleStories />
      </Layout>
    </>
  );
}
