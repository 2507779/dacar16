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
import { Car } from 'lucide-react';

export default function App() {
  const { currentTab, activeCarId } = useStore();
  const [isSplash, setIsSplash] = useState(true);

  useEffect(() => {
    // Инициализация Telegram WebApp API
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      if (tg.enableClosingConfirmation) {
        tg.enableClosingConfirmation();
      }
      // Установим премиальные светлые цвета шапки и фона для соответствия дизайну 2026 года
      tg.setHeaderColor?.('#FAF9F5'); // Alabaster
      tg.setBackgroundColor?.('#FAF9F5');
    }

    // Скрыть заставку через 2.8 секунды
    const timer = setTimeout(() => {
      setIsSplash(false);
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

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
            className="fixed inset-0 bg-[#FAF9F5] z-50 flex flex-col items-center justify-between py-12 px-6 select-none overflow-hidden"
          >
            {/* Top glowing ambient background effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-[#C2A265]/8 blur-[120px] rounded-full pointer-events-none" />

            {/* Middle Title */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              {/* Title with letter-spacing & fade-in-up */}
              <div className="text-center space-y-2 relative z-10">
                <motion.h1
                  initial={{ letterSpacing: "0.2em", opacity: 0, y: 15 }}
                  animate={{ letterSpacing: "0.4em", opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 1, ease: "easeOut" }}
                  className="text-3xl font-display font-black text-[#1A1A1E] pl-[0.4em] tracking-[0.4em] uppercase"
                >
                  DA!CAR
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.5, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="text-[10px] font-mono tracking-[0.25em] uppercase text-[#6B6A66]"
                >
                  Premium Auto Import
                </motion.p>
              </div>
            </div>

            {/* Bottom Elegant Progress Loader */}
            <div className="w-full max-w-[200px] flex flex-col items-center space-y-4 relative z-10">
              <div className="w-full h-[2px] bg-[#1A1A1E]/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.6, ease: "easeInOut" }}
                  className="h-full bg-gradient-to-r from-[#C2A265] via-[#D4B880] to-[#C2A265] rounded-full"
                />
              </div>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 0.8 }}
                className="text-[9px] font-mono tracking-wider text-[#1A1A1E] uppercase"
              >
                Загрузка каталога...
              </motion.span>
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
