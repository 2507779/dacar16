/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Home, Car, Heart, Package, User, X, MoreVertical, Wifi, Battery, Send, ArrowLeft, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { triggerHaptic } from '../utils/haptics';
import { AnimatePresence, motion } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { currentTab, setCurrentTab, orders, activeCarId, setActiveCarId } = useStore();
  const [isAppClosed, setIsAppClosed] = useState(false);
  const [timeStr, setTimeStr] = useState('09:41');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; time: string }>>([
    { sender: 'bot', text: 'Добро пожаловать в DA!CAR — премиальный сервис импорта автомобилей из Китая, Южной Кореи и Киргизии под ключ! 🚘✨', time: '12:00' },
    { sender: 'bot', text: 'Здесь вы можете выбрать любой автомобиль, рассчитать полную стоимость с учетом доставки, пошлин и утильсбора в РФ, а также отслеживать статус доставки в реальном времени.', time: '12:01' }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  // Обновление системного времени
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (tab: typeof currentTab) => {
    triggerHaptic('light');
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
    <div className="flex justify-center items-center min-h-screen bg-neutral-900 p-0 sm:p-4 font-sans selection:bg-amber-400 selection:text-neutral-900">
      {/* Контейнер смартфона/Mini App */}
      <div className="w-full max-w-[440px] h-[100vh] sm:h-[880px] bg-neutral-50 sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-neutral-800 relative">
        
        {/* Анимация закрытого приложения (эмуляция чата Telegram) */}
        <AnimatePresence>
          {isAppClosed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-50 bg-[#1e2c3a] flex flex-col text-white"
            >
              {/* Шапка чата Telegram */}
              <div className="bg-[#17212b] p-3 flex items-center justify-between border-b border-[#10171d]">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-full flex items-center justify-center font-bold text-white shadow-md">
                    DC
                  </div>
                  <div>
                    <div className="font-semibold flex items-center text-sm">
                      DA!CAR | Импорт Авто 🚘
                      <span className="ml-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[8px] text-white">✓</span>
                    </div>
                    <div className="text-xs text-[#5288c1]">бот</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-gray-400">
                  <MoreVertical className="w-5 h-5 cursor-pointer" />
                </div>
              </div>

              {/* Область сообщений чата */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0e1621] bg-opacity-95 text-sm flex flex-col justify-end">
                <div className="text-center text-xs text-gray-500 my-4 bg-neutral-900/40 py-1 px-3 rounded-full self-center">
                  Чат с официальным ботом DA!CAR
                </div>
                
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`max-w-[80%] rounded-2xl p-3 flex flex-col relative shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-[#2b5278] self-end rounded-tr-none'
                        : 'bg-[#182533] self-start rounded-tl-none'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                    <span className="text-[10px] text-gray-400 self-end mt-1">{msg.time}</span>
                  </div>
                ))}
              </div>

              {/* Кнопка запуска Mini App и панель ввода */}
              <div className="p-3 bg-[#17212b] border-t border-[#10171d] space-y-3">
                <button
                  onClick={() => {
                    triggerHaptic('success');
                    setIsAppClosed(false);
                  }}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] transition text-black font-semibold rounded-xl flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
                >
                  <Car className="w-5 h-5" />
                  <span>Открыть Салон DA!CAR</span>
                </button>

                <div className="flex items-center space-x-2 bg-[#24303f] rounded-xl px-3 py-2">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Написать боту..."
                    className="flex-1 bg-transparent text-white outline-none placeholder-gray-500 text-sm"
                  />
                  <button onClick={handleSendMessage} className="text-[#5288c1] hover:text-[#649bd6]">
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Системный статус-бар смартфона */}
        <div className="bg-[#111111] text-white px-6 pt-3 pb-1 flex justify-between items-center text-xs font-medium tracking-tight select-none">
          <span>{timeStr}</span>
          <div className="flex items-center space-x-1.5">
            <span className="text-[9px] bg-neutral-800 text-gray-300 px-1 py-0.5 rounded font-mono font-bold">5G</span>
            <Wifi className="w-3.5 h-3.5 text-white" />
            <Battery className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* 2. Шапка Telegram WebApp */}
        <div className="bg-[#1a1a1a] text-white px-4 py-3 flex justify-between items-center shadow-md relative z-20 select-none">
          <div className="flex items-center space-x-2.5">
            {activeCarId ? (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setActiveCarId(null);
                }}
                className="p-1 hover:bg-neutral-800 rounded-full transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-300" />
              </button>
            ) : (
              <div className="w-6 h-6 bg-amber-500 rounded-md flex items-center justify-center font-bold text-black text-xs">
                D!
              </div>
            )}
            <div>
              <div className="font-bold text-sm tracking-wide flex items-center">
                Da!Car - Скажи "ДА" своей мечте
                <span className="ml-1 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-[7px] text-white font-black">
                  ✓
                </span>
              </div>
              <div className="text-[10px] text-gray-400">dacar_official_bot</div>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-gray-300">
            <MoreVertical className="w-5 h-5 cursor-pointer hover:text-white" />
            <button
              onClick={() => {
                triggerHaptic('heavy');
                setIsAppClosed(true);
              }}
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 active:scale-95 rounded-full transition cursor-pointer"
              title="Закрыть Mini App"
            >
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>

        {/* 3. Основная контентная область */}
        <div id="applet-content" className="flex-1 overflow-y-auto bg-neutral-50 flex flex-col pb-24 relative">
          {children}
        </div>

        {/* 4. Навигация Bottom Navigation (Frosted Glass) */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white/95 backdrop-blur-md border-t border-neutral-200/80 px-2 flex justify-around items-center z-30 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] select-none">
          
          <button
            id="nav-home"
            onClick={() => handleTabChange('home')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-bezier cursor-pointer ${
              currentTab === 'home' ? 'text-neutral-950 font-semibold' : 'text-neutral-400'
            }`}
          >
            <div className="relative">
              <Home className={`w-5 h-5 transition-transform duration-200 ${currentTab === 'home' ? 'scale-110 text-amber-500' : ''}`} />
            </div>
            <span className="text-[10px] mt-1.5 tracking-tight">Главная</span>
          </button>

          <button
            id="nav-catalog"
            onClick={() => handleTabChange('catalog')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-bezier cursor-pointer ${
              currentTab === 'catalog' ? 'text-neutral-950 font-semibold' : 'text-neutral-400'
            }`}
          >
            <Car className={`w-5 h-5 transition-transform duration-200 ${currentTab === 'catalog' ? 'scale-110 text-amber-500' : ''}`} />
            <span className="text-[10px] mt-1.5 tracking-tight">Каталог</span>
          </button>

          <button
            id="nav-favorites"
            onClick={() => handleTabChange('favorites')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-bezier cursor-pointer ${
              currentTab === 'favorites' ? 'text-neutral-950 font-semibold' : 'text-neutral-400'
            }`}
          >
            <Heart className={`w-5 h-5 transition-transform duration-200 ${currentTab === 'favorites' ? 'scale-110 text-amber-500' : ''}`} />
            <span className="text-[10px] mt-1.5 tracking-tight">Избранное</span>
          </button>

          <button
            id="nav-orders"
            onClick={() => handleTabChange('orders')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-bezier cursor-pointer ${
              currentTab === 'orders' ? 'text-neutral-950 font-semibold' : 'text-neutral-400'
            }`}
          >
            <div className="relative">
              <Package className={`w-5 h-5 transition-transform duration-200 ${currentTab === 'orders' ? 'scale-110 text-amber-500' : ''}`} />
              {orders.length > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-amber-500 text-neutral-950 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {orders.length}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1.5 tracking-tight">Заказы</span>
          </button>

          <button
            id="nav-profile"
            onClick={() => handleTabChange('profile')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-bezier cursor-pointer ${
              currentTab === 'profile' ? 'text-neutral-950 font-semibold' : 'text-neutral-400'
            }`}
          >
            <User className={`w-5 h-5 transition-transform duration-200 ${currentTab === 'profile' ? 'scale-110 text-amber-500' : ''}`} />
            <span className="text-[10px] mt-1.5 tracking-tight">Профиль</span>
          </button>

        </div>

      </div>
    </div>
  );
}
