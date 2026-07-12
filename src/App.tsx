/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

export default function App() {
  const { currentTab, activeCarId } = useStore();

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
    <Layout>
      <AnimatePresence mode="wait">
        {renderActiveTab()}
      </AnimatePresence>
      <VehicleStories />
    </Layout>
  );
}
