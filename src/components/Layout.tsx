/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Home, Car, Heart, Package, User, X, MoreVertical, Send, ArrowLeft, Check, MapPin, ChevronDown } from 'lucide-react';
import { useStore } from '../store/useStore';
import { DELIVERY_CITIES } from '../data/cars';
import { triggerHaptic } from '../utils/haptics';
import { playInterfaceClickSound } from '../utils/engineSound';
import { AnimatePresence, motion } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { currentTab, setCurrentTab, orders, activeCarId, setActiveCarId, selectedCity, setSelectedCity } = useStore();
  const [isAppClosed, setIsAppClosed] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string }>>([
    { sender: 'bot', text: 'Добро пожаловать в DA!CAR — премиальный сервис импорта автомобилей из Китая, Южной Кореи и Киргизии под ключ! 🚘✨', time: '12:00' },
    { sender: 'bot', text: 'Здесь вы можете выбрать любой автомобиль, рассчитать полную стоимость с учетом доставки, пошлин и утильсбора в РФ, а также отслеживать статус доставки в реальном времени.', time: '12:01' }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  // Автоматическая прокрутка наверх при переключении вкладок или открытии деталей автомобиля
  useEffect(() => {
    const contentEl = document.getElementById('applet-content');
    if (contentEl) {
      contentEl.scrollTop = 0;
    }
  }, [currentTab, activeCarId]);

  const handleTabChange = (tab: typeof currentTab) => {
    triggerHaptic('light');
    playInterfaceClickSound();
    setCurrentTab(tab);
    // Если мы переключаем таб, сбрасываем открытую карточку авто
    setActiveCarId(null);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    triggerHaptic('medium');
    const now = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const userMsg = inputMessage;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg, time: now }]);
    setInputMessage('');

    // Авто-ответ бота через 1 сек
    setTimeout(() => {
      triggerHaptic('success');
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `Здравствуйте! Мы получили ваше сообщение: "${userMsg}". Менеджер DA!CAR ответит вам в ближайшие 5-10 минут. Вы также можете запустить наше официальное Mini App, нажав на кнопку «Открыть Салон» внизу! 👇`,
          time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1000);
  };

  return (
    <div className="flex justify-center items-center h-full sm:h-auto sm:min-h-screen bg-[#F0EEEC] p-0 sm:p-4 font-sans selection:bg-[#C5A880]/20 selection:text-[#1C1917] w-full">
      {/* Контейнер смартфона/Mini App */}
      <div className="w-full max-w-[440px] h-full sm:h-[880px] bg-[#F0EEEC] sm:rounded-[40px] shadow-[0_24px_64px_rgba(197,168,128,0.04)] overflow-hidden flex flex-col border border-[#EFEBE4] relative">
        
        {/* Анимация закрытого приложения (эмуляция чата Telegram) */}
        <AnimatePresence>
          {isAppClosed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-50 bg-[#F0EEEC] flex flex-col text-[#1C1917]"
            >
              {/* Шапка чата Telegram */}
              <div className="bg-white p-3 flex items-center justify-between border-b border-[#EFEBE4]/40 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#C5A880] rounded-full flex items-center justify-center font-display font-black text-white shadow-md">
                    DC
                  </div>
                  <div>
                    <div className="font-semibold flex items-center text-sm font-display tracking-wide text-[#1C1917]">
                      DA!CAR | Импорт Авто 🚘
                      <span className="ml-1 w-4 h-4 bg-[#C5A880] rounded-full flex items-center justify-center text-[8px] text-white">✓</span>
                    </div>
                    <div className="text-xs text-[#C5A880] font-semibold">бот</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-[#78716C]">
                  <MoreVertical className="w-5 h-5 cursor-pointer" />
                </div>
              </div>

              {/* Область сообщений чата */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F0EEEC] text-sm flex flex-col justify-end">
                <div className="text-center text-xs text-[#78716C] my-4 bg-white/80 border border-[#EFEBE4]/50 py-1 px-3 rounded-full self-center">
                  Чат с официальным ботом DA!CAR
                </div>
                
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`max-w-[80%] rounded-2xl p-3 flex flex-col relative shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-[#EFEBE4] text-[#1C1917] self-end rounded-tr-none'
                        : 'bg-white text-[#1C1917] border border-[#EFEBE4]/30 self-start rounded-tl-none'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                    <span className="text-[10px] text-[#78716C] self-end mt-1">{msg.time}</span>
                  </div>
                ))}
              </div>

              {/* Кнопка запуска Mini App и панель ввода */}
              <div className="p-3 bg-white border-t border-[#EFEBE4]/50 space-y-3">
                <button
                  onClick={() => {
                    triggerHaptic('success');
                    setIsAppClosed(false);
                  }}
                  className="w-full py-3.5 bg-[#C5A880] hover:bg-[#B0936B] active:scale-[0.98] transition duration-200 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                >
                  <Car className="w-4 h-4 text-white fill-white" />
                  <span>Открыть Салон DA!CAR</span>
                </button>

                <div className="flex items-center space-x-2 bg-[#F0EEEC] border border-[#EFEBE4]/60 rounded-xl px-3 py-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Написать боту..."
                    className="flex-1 bg-transparent text-[#1C1917] outline-none placeholder-gray-400 text-sm"
                  />
                  <button onClick={handleSendMessage} className="text-[#C5A880] hover:opacity-85">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2. Шапка Telegram WebApp */}
        <div className="bg-[#F0EEEC] text-[#1C1917] px-4 py-3 flex justify-between items-center border-b border-[#EFEBE4] shadow-sm relative z-20 select-none">
          <div className="flex items-center space-x-2.5">
            {activeCarId ? (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setActiveCarId(null);
                }}
                className="p-1.5 hover:bg-[#EFEBE4] rounded-full transition"
              >
                <ArrowLeft className="w-4 h-4 text-[#1C1917]" />
              </button>
            ) : (
              <div className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center bg-white border border-[#EFEBE4] shadow-sm shrink-0">
                <img src="/logo.png" className="w-full h-full object-contain scale-110" alt="D" />
              </div>
            )}
            <div>
              <div className="font-display font-bold text-xs tracking-wide flex items-center text-[#1C1917]">
                DA!CAR — Салон Премиум Импорта
                <span className="ml-1 w-3.5 h-3.5 bg-[#C5A880] rounded-full flex items-center justify-center text-[7px] text-white font-black">
                  ✓
                </span>
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[9px] font-mono text-[#78716C] font-semibold">dacar_official_bot</span>
                <span className="text-[8px] text-gray-300">•</span>
                <button 
                  onClick={() => {
                    triggerHaptic('light');
                    setIsCityDropdownOpen(true);
                  }}
                  className="flex items-center space-x-0.5 text-[9px] font-black text-[#C5A880] hover:opacity-80 active:scale-95 transition cursor-pointer"
                >
                  <MapPin className="w-2.5 h-2.5" />
                  <span className="max-w-[80px] truncate">{selectedCity.replace(' (Главный филиал)', '')}</span>
                  <ChevronDown className="w-2.5 h-2.5 shrink-0" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-[#78716C]">
            <MoreVertical className="w-4 h-4 cursor-pointer hover:text-[#1C1917]" />
            <button
              onClick={() => {
                triggerHaptic('heavy');
                setIsAppClosed(true);
              }}
              className="p-1.5 bg-[#EFEBE4]/60 hover:bg-[#EFEBE4]/90 active:scale-95 rounded-full transition cursor-pointer border border-black/[0.03]"
              title="Закрыть Mini App"
            >
              <X className="w-3.5 h-3.5 text-red-500 font-bold" />
            </button>
          </div>
        </div>

        {/* City Selection Bottom Sheet */}
        <AnimatePresence>
          {isCityDropdownOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsCityDropdownOpen(false)}
                className="absolute inset-0 bg-black/60 z-50 cursor-pointer"
              />
              
              {/* Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="absolute bottom-0 left-0 right-0 bg-[#F0EEEC] rounded-t-[32px] border-t border-[#EFEBE4] p-5 pb-8 z-50 shadow-[0_-10px_35px_rgba(0,0,0,0.15)] select-none flex flex-col space-y-4"
              >
                {/* Grabber */}
                <div className="w-12 h-1 bg-[#EFEBE4] rounded-full mx-auto" />
                
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-bold text-sm text-[#1C1917] flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-[#C5A880]" />
                    <span>Выберите город доставки</span>
                  </h3>
                  <button 
                    onClick={() => setIsCityDropdownOpen(false)}
                    className="p-1.5 hover:bg-[#EFEBE4] rounded-full transition text-[#78716C]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-[10px] text-[#78716C] leading-normal">
                  Цена доставки и сроки под ключ изменятся автоматически для выбранного региона.
                </p>
                
                <div className="max-h-60 overflow-y-auto space-y-1.5 scrollbar-none pr-1">
                  {DELIVERY_CITIES.map((city) => {
                    const isSelected = selectedCity === city.name;
                    return (
                      <button
                        key={city.name}
                        onClick={() => {
                          triggerHaptic('medium');
                          setSelectedCity(city.name);
                          setIsCityDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between transition cursor-pointer ${
                          isSelected 
                            ? 'bg-[#C5A880]/10 text-[#C5A880] border border-[#C5A880]/20 font-bold' 
                            : 'bg-white text-[#1C1917] border border-[#EFEBE4] hover:bg-[#F0EEEC]'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs">{city.name}</span>
                          {city.adjustmentRUB !== 0 && (
                            <span className="text-[9px] text-[#78716C] font-mono mt-0.5">
                              {city.adjustmentRUB > 0 ? '+' : ''}{city.adjustmentRUB.toLocaleString()} ₽ к стоимости
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#C5A880] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* 3. Основная контентная область */}
        <div id="applet-content" className="flex-1 overflow-y-auto bg-[#F0EEEC] flex flex-col pb-24 relative scrollbar-none">
          {children}
        </div>

        {/* 4. Навигация Bottom Navigation (Premium Obsidian Dark & Gold) */}
        <div className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:bottom-4 left-4 right-4 h-16 bg-[#1C1917] border border-[#2D2A26] rounded-2xl px-2 flex justify-around items-center z-30 shadow-[0_16px_40px_rgba(0,0,0,0.3)] select-none">
          
          <button
            id="nav-home"
            onClick={() => handleTabChange('home')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 relative cursor-pointer transition-colors duration-300 ${
              currentTab === 'home' ? 'text-[#C5A880]' : 'text-[#8C847E] hover:text-[#C5A880]'
            }`}
          >
            <div className="relative flex flex-col items-center justify-center">
              <Home className={`w-4 h-4 transition-all duration-300 ${currentTab === 'home' ? 'scale-110 text-[#C5A880]' : ''}`} />
              <span className="text-[9px] mt-1 font-bold tracking-tight">Главная</span>
              {currentTab === 'home' && (
                <motion.div 
                  layoutId="active-dot"
                  className="absolute -bottom-1.5 w-1 h-1 bg-[#C5A880] rounded-full"
                />
              )}
            </div>
          </button>

          <button
            id="nav-catalog"
            onClick={() => handleTabChange('catalog')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 relative cursor-pointer transition-colors duration-300 ${
              currentTab === 'catalog' ? 'text-[#C5A880]' : 'text-[#8C847E] hover:text-[#C5A880]'
            }`}
          >
            <div className="relative flex flex-col items-center justify-center">
              <Car className={`w-4 h-4 transition-all duration-300 ${currentTab === 'catalog' ? 'scale-110 text-[#C5A880]' : ''}`} />
              <span className="text-[9px] mt-1 font-bold tracking-tight">Каталог</span>
              {currentTab === 'catalog' && (
                <motion.div 
                  layoutId="active-dot"
                  className="absolute -bottom-1.5 w-1 h-1 bg-[#C5A880] rounded-full"
                />
              )}
            </div>
          </button>

          <button
            id="nav-favorites"
            onClick={() => handleTabChange('favorites')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 relative cursor-pointer transition-colors duration-300 ${
              currentTab === 'favorites' ? 'text-[#C5A880]' : 'text-[#8C847E] hover:text-[#C5A880]'
            }`}
          >
            <div className="relative flex flex-col items-center justify-center">
              <Heart className={`w-4 h-4 transition-all duration-300 ${currentTab === 'favorites' ? 'scale-110 text-[#C5A880]' : ''}`} />
              <span className="text-[9px] mt-1 font-bold tracking-tight">Избранное</span>
              {currentTab === 'favorites' && (
                <motion.div 
                  layoutId="active-dot"
                  className="absolute -bottom-1.5 w-1 h-1 bg-[#C5A880] rounded-full"
                />
              )}
            </div>
          </button>

          <button
            id="nav-orders"
            onClick={() => handleTabChange('orders')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 relative cursor-pointer transition-colors duration-300 ${
              currentTab === 'orders' ? 'text-[#C5A880]' : 'text-[#8C847E] hover:text-[#C5A880]'
            }`}
          >
            <div className="relative flex flex-col items-center justify-center">
              <Package className={`w-4 h-4 transition-all duration-300 ${currentTab === 'orders' ? 'scale-110 text-[#C5A880]' : ''}`} />
              {orders.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#C5A880] text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-md border border-[#1C1917] animate-pulse">
                  {orders.length}
                </span>
              )}
              <span className="text-[9px] mt-1 font-bold tracking-tight">Подбор</span>
              {currentTab === 'orders' && (
                <motion.div 
                  layoutId="active-dot"
                  className="absolute -bottom-1.5 w-1 h-1 bg-[#C5A880] rounded-full"
                />
              )}
            </div>
          </button>

          <button
            id="nav-profile"
            onClick={() => handleTabChange('profile')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 relative cursor-pointer transition-colors duration-300 ${
              currentTab === 'profile' ? 'text-[#C5A880]' : 'text-[#8C847E] hover:text-[#C5A880]'
            }`}
          >
            <div className="relative flex flex-col items-center justify-center">
              <User className={`w-4 h-4 transition-all duration-300 ${currentTab === 'profile' ? 'scale-110 text-[#C5A880]' : ''}`} />
              <span className="text-[9px] mt-1 font-bold tracking-tight">Профиль</span>
              {currentTab === 'profile' && (
                <motion.div 
                  layoutId="active-dot"
                  className="absolute -bottom-1.5 w-1 h-1 bg-[#C5A880] rounded-full"
                />
              )}
            </div>
          </button>

        </div>

      </div>
    </div>
  );
}
