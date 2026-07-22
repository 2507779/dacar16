/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { triggerHaptic } from '../utils/haptics';
import { APP_CONFIG } from '../config';
import { MessageSquare, Phone, MapPin, ShieldAlert, BadgeCheck, ChevronDown, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminPanel } from '../components/AdminPanel';

export default function Profile() {
  const { orders, managerContacts, appTexts } = useStore();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [activeConsultation, setActiveConsultation] = useState(false);
  const [avatarClicks, setAvatarClicks] = useState(0);
  const [isCallbackSubmitting, setIsCallbackSubmitting] = useState(false);

  // Настройки комфорта интерфейса
  const [hapticsEnabled, setHapticsEnabled] = useState(() => localStorage.getItem('dacar_settings_haptics') !== 'false');
  const [clicksEnabled, setClicksEnabled] = useState(() => localStorage.getItem('dacar_settings_clicks') !== 'false');

  const [isAdminPanelVisible, setIsAdminPanelVisible] = useState(() => {
    if (localStorage.getItem('dacar_admin_authorized') === 'true') return true;
    if (localStorage.getItem('dacar_admin_visible') === 'true') return true;
    
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('admin') === 'true' || window.location.hash.includes('admin')) {
        localStorage.setItem('dacar_admin_visible', 'true');
        return true;
      }
    }
    return false;
  });

  const handleAvatarClick = () => {
    const nextClicks = avatarClicks + 1;
    setAvatarClicks(nextClicks);
    if (nextClicks >= 5) {
      triggerHaptic('success');
      setIsAdminPanelVisible(true);
      localStorage.setItem('dacar_admin_visible', 'true');
      alert('🔒 Панель администратора разблокирована! Теперь вы можете открыть её.');
      setAvatarClicks(0);
    } else {
      triggerHaptic('light');
    }
  };

  const [consultationChat, setConsultationChat] = useState<Array<{ sender: 'manager' | 'user'; text: string }>>([
    { 
      sender: 'manager', 
      text: 'Приветствуем! Я дежурный менеджер отдела логистики DA!CAR. Выберите интересующий вас вопрос ниже, и я подробно отвечу вам.' 
    }
  ]);

  // Данные о пользователе Telegram WebApp
  const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
  const userName = tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || tgUser.username : 'Premium Клиент';
  const userId = tgUser?.id ? `tg_user_id: ${tgUser.id}` : 'tg_user_id: 841b57fe';
  const userAvatarChar = userName.charAt(0).toUpperCase();

  const faqData = [
    {
      q: 'Как рассчитывается и оплачивается таможенная пошлина?',
      a: 'Оплата таможенной пошлины производится исключительно в рублях РФ по официальному курсу ЦБ РФ на день подачи таможенной декларации. Ставки пошлин в Таможенном кодексе ЕАЭС зафиксированы в ЕВРО (€ за 1 куб. см объема или в % от стоимости), поэтому таможенные органы РФ рассчитывают пошлину в евро и пересчитывают ее в рубли по курсу ЦБ РФ для итоговой оплаты.'
    },
    {
      q: 'Можно ли привезти авто в лизинг или кредит?',
      a: 'Да! Мы работаем со всеми крупными лизинговыми компаниями РФ и банками-партнерами. Вы можете приобрести автомобиль с НДС для юрлиц или оформить стандартный автокредит для физлиц.'
    },
    {
      q: 'Какая процедура оплаты?',
      a: 'Оплата производится поэтапно: 1) Депозит 100 000 руб. при подписании договора на подбор, 2) Оплата стоимости авто на аукционе банковским SWIFT-переводом, 3) Оплата таможни и доставки по прибытии авто во Владивосток или на границу.'
    },
    {
      q: 'Где забирать готовый автомобиль?',
      a: `Наш главный филиал выдачи находится по адресу: ${appTexts.showroomAddress}. Мы проводим полную предпродажную подготовку, детейлинг и передаем авто на закрытой площадке. Также отправляем закрытыми автовозами в Москву, СПб, Екатеринбург и любой другой город РФ.`
    }
  ];

  const consultantQuestions = [
    {
      q: 'Какие документы нужны для договора?',
      a: 'Для заключения договора на импорт потребуется ваш паспорт РФ (для физлица) или реквизиты компании (для юрлица), а также ИНН для таможенного декларирования.'
    },
    {
      q: 'Включен ли утильсбор в стоимость?',
      a: 'В наших расчетах мы всегда указываем льготный утильсбор для личного пользования (3 400 руб. за новое авто, 5 200 руб. за б/у). Если вам нужен коммерческий утиль для перепродажи в течение 12 месяцев, мы пересчитаем тариф.'
    },
    {
      q: 'Как отслеживать статус машины?',
      a: 'Статус обновляется автоматически в разделе «Заказы» вашего Mini App. При каждом прохождении рубежа (граница, лаборатория, автовоз) вам также приходит Telegram-уведомление.'
    }
  ];

  const handleAskQuestion = (q: string, a: string) => {
    triggerHaptic('medium');
    setConsultationChat(prev => [
      ...prev,
      { sender: 'user', text: q }
    ]);

    // Эмуляция ответа менеджера
    setTimeout(() => {
      triggerHaptic('success');
      setConsultationChat(prev => [
        ...prev,
        { sender: 'manager', text: a }
      ]);
    }, 800);
  };

  const toggleFaq = (index: number) => {
    triggerHaptic('light');
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col text-[#1C1917] pb-12 select-none bg-[#F0EEEC]">
      
      {/* Профиль Пользователя */}
      <div className="px-4 pt-6 pb-4 bg-[#F0EEEC] border-b border-[#EFEBE4]/40 flex items-center space-x-4">
        <div 
          onClick={handleAvatarClick}
          className="w-16 h-16 bg-[#C5A880] rounded-full flex items-center justify-center font-display font-black text-white text-xl shadow-md relative shrink-0 cursor-pointer active:scale-95 transition-transform"
        >
          {userAvatarChar}
          <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-black">✓</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-black text-base text-[#1C1917] flex items-center space-x-1.5 tracking-tight">
            <span>{userName}</span>
          </h2>
          <p className="text-xs text-[#78716C] truncate font-mono">{userId}</p>
          <div className="flex space-x-2 mt-1.5">
            <span className="bg-[#C5A880]/15 text-[#C5A880] text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider border border-[#C5A880]/20 font-mono">
              Активных заявок: {orders.length}
            </span>
          </div>
        </div>
      </div>

      {/* Быстрые Кнопки Контактов */}
      <div className="px-4 mt-4 space-y-3">
        <h3 className="font-display text-[11px] font-bold uppercase tracking-widest text-[#78716C] mb-1 font-mono">Связаться с нами</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              triggerHaptic('medium');
              setActiveConsultation(true);
            }}
            className="bg-white border border-[#EFEBE4] hover:border-[#C5A880]/45 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-md active:scale-95 transition cursor-pointer"
          >
            <MessageSquare className="w-6 h-6 text-[#C5A880]" />
            <span className="text-xs font-bold text-[#1C1917] mt-2">Чат с менеджером</span>
            <span className="text-[8px] text-[#78716C] mt-0.5 font-mono">Консультация онлайн</span>
          </button>

          {/* Правая кнопка: Телефонный звонок в офис (чтобы не дублировать чаты) */}
          {(() => {
            const phoneContact = managerContacts?.find(c => c.type === 'phone');
            if (phoneContact) {
              return (
                <a
                  key={phoneContact.id}
                  href={`tel:${phoneContact.value}`}
                  onClick={() => triggerHaptic('light')}
                  className="bg-white border border-[#EFEBE4] hover:border-[#C5A880]/45 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-md active:scale-95 transition cursor-pointer"
                >
                  <Phone className="w-6 h-6 text-emerald-600" />
                  <span className="text-xs font-bold text-[#1C1917] mt-2 truncate max-w-full">{phoneContact.name}</span>
                  <span className="text-[8px] text-[#78716C] mt-0.5 font-mono truncate max-w-full">
                    {phoneContact.value}
                  </span>
                </a>
              );
            } else {
              return (
                <a
                  href="tel:+78432220099"
                  onClick={() => triggerHaptic('light')}
                  className="bg-white border border-[#EFEBE4] hover:border-[#C5A880]/45 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-md active:scale-95 transition cursor-pointer col-span-1"
                >
                  <Phone className="w-6 h-6 text-emerald-600" />
                  <span className="text-xs font-bold text-[#1C1917] mt-2">Позвонить в офис</span>
                  <span className="text-[8px] text-[#78716C] mt-0.5 font-mono">+7 (843) 222-00-99</span>
                </a>
              );
            }
          })()}
        </div>

        {/* Если контактов больше одного, выведем их элегантным списком */}
        {managerContacts && managerContacts.filter(c => c.type !== 'telegram').length > 1 && (
          <div className="bg-white rounded-2xl border border-[#EFEBE4] p-3 shadow-md space-y-2">
            <p className="text-[9px] font-black uppercase tracking-wider text-[#78716C] border-b border-[#EFEBE4]/55 pb-1 mb-1 font-mono">Дополнительные контакты:</p>
            <div className="grid grid-cols-1 gap-2">
              {managerContacts.filter(c => c.type !== 'telegram').slice(1).map((c) => (
                <a
                  key={c.id}
                  href={`tel:${c.value}`}
                  onClick={() => triggerHaptic('light')}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#F0EEEC] border border-[#EFEBE4]/60 active:scale-[0.99] transition hover:border-[#C5A880]/30 cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-7 h-7 bg-[#C5A880]/10 rounded-full flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[#1C1917] truncate">{c.name}</p>
                      <p className="text-[8px] text-[#78716C] font-mono truncate">
                        Тел: {c.value}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#78716C] -rotate-90 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Центр управления комфортом */}
      <div className="px-4 mt-6">
        <h3 className="font-display text-[11px] font-bold uppercase tracking-widest text-[#78716C] mb-2.5 font-mono">Центр управления комфортом</h3>
        <div className="bg-white rounded-3xl border border-[#EFEBE4] p-4.5 space-y-4 shadow-md">
          {/* Тактильная отдача */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-[#1C1917]">Тактильная отдача (Haptic)</h4>
              <p className="text-[10px] text-[#78716C] mt-0.5 font-medium leading-tight">Премиум-вибрация при кликах и действиях</p>
            </div>
            <button
              onClick={() => {
                const newValue = hapticsEnabled ? 'false' : 'true';
                setHapticsEnabled(!hapticsEnabled);
                localStorage.setItem('dacar_settings_haptics', newValue);
                if (newValue === 'true') {
                  setTimeout(() => {
                    const tg = (window as any).Telegram?.WebApp;
                    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
                  }, 100);
                }
              }}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${hapticsEnabled ? 'bg-[#C5A880]' : 'bg-[#EFEBE4]'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${hapticsEnabled ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          {/* Интерфейсные щелчки */}
          <div className="flex items-center justify-between border-t border-[#EFEBE4]/50 pt-3.5">
            <div>
              <h4 className="text-xs font-bold text-[#1C1917]">Звуковые клики</h4>
              <p className="text-[10px] text-[#78716C] mt-0.5 font-medium leading-tight">Приятный щелчок при переключении меню</p>
            </div>
            <button
              onClick={() => {
                const newValue = clicksEnabled ? 'false' : 'true';
                setClicksEnabled(!clicksEnabled);
                localStorage.setItem('dacar_settings_clicks', newValue);
                triggerHaptic('light');
              }}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${clicksEnabled ? 'bg-[#C5A880]' : 'bg-[#EFEBE4]'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${clicksEnabled ? 'right-1' : 'left-1'}`} />
            </button>
          </div>


          {/* Очистка кэша изображений */}
          <div className="flex flex-col border-t border-[#EFEBE4]/50 pt-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#1C1917]">Сброс кэша изображений</h4>
                <p className="text-[10px] text-[#78716C] mt-0.5 font-medium leading-tight">Принудительно обновляет все фото автомобилей из репозитория GitHub</p>
              </div>
              <button
                onClick={async () => {
                  triggerHaptic('success');
                  try {
                    // Устанавливаем новый таймстамп кэш-бастера
                    const newBuster = Date.now().toString();
                    localStorage.setItem('dacar_cache_buster', newBuster);
                    
                    // Удаляем локальный кэш автомобилей
                    localStorage.removeItem('dacar_all_cars');
                    
                    // Показываем индикатор загрузки / оповещение
                    alert('⏳ Запрос на синхронизацию отправлен на сервер...');
                    
                    // Делаем pull с сервера
                    const res = await fetch('/api/cars/pull', { method: 'POST' });
                    if (res.ok) {
                      // Загружаем заново в стор
                      await useStore.getState().loadCarsFromServer();
                      alert('✅ Кэш очищен, база данных успешно обновлена с GitHub!');
                      // Перезагрузим окно для полной перезагрузки картинок браузером
                      window.location.reload();
                    } else {
                      let errMsg = 'Неизвестная ошибка на сервере';
                      try {
                        const errData = await res.json();
                        if (errData && errData.error) {
                          errMsg = errData.error;
                        }
                      } catch (_) {}
                      alert(`⚠️ Ошибка синхронизации с сервером: ${errMsg}`);
                    }
                  } catch (err) {
                    console.error(err);
                    alert('⚠️ Ошибка при сбросе кэша.');
                  }
                }}
                className="px-3.5 py-2 bg-[#C5A880] hover:bg-[#B0936B] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition active:scale-95 cursor-pointer shadow-sm flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Очистить кэш</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ПАНЕЛЬ УПРАВЛЕНИЯ / АДМИНКА (Добавление новых авто, изменение текстов) */}
      {isAdminPanelVisible && (
        <div className="px-4 mt-4">
          <AdminPanel />
        </div>
      )}

      {/* Гарантии и Юр. Информация */}
      <div className="px-4 mt-6">
        <h3 className="font-display text-[11px] font-bold uppercase tracking-widest text-[#78716C] mb-2.5 font-mono">Надежность & Гарантии</h3>
        <div className="bg-white rounded-3xl border border-[#EFEBE4] overflow-hidden p-4 space-y-3.5 shadow-md">
          <div className="flex items-start space-x-3 text-xs">
            <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#1C1917]">Официальное юрлицо РФ</h4>
              <p className="text-[10px] text-[#78716C] leading-normal mt-0.5 font-sans font-medium">
                {appTexts.legalInfo}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-xs border-t border-[#EFEBE4]/40 pt-3.5">
            <ShieldAlert className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#1C1917]">100% Возврат депозита</h4>
              <p className="text-[10px] text-[#78716C] leading-normal mt-0.5 font-sans font-medium">
                Если в течение 14 дней мы не подберем подходящий вам автомобиль на аукционе, обеспечим полный возврат залоговой суммы.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-xs border-t border-[#EFEBE4]/40 pt-3.5">
            <MapPin className="w-5 h-5 text-[#C5A880] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#1C1917]">Офис выдачи</h4>
              <p className="text-[10px] text-[#78716C] leading-normal mt-0.5 font-sans font-medium">
                Приезжайте знакомиться лично! {appTexts.showroomAddress}. Рады видеть вас каждый день с 10:00 до 20:00.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="px-4 mt-6">
        <h3 className="font-display text-[11px] font-bold uppercase tracking-widest text-[#78716C] mb-2.5 font-mono">Часто задаваемые вопросы</h3>
        <div className="space-y-2.5">
          {faqData.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-white border border-[#EFEBE4] rounded-2xl overflow-hidden shadow-md"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-4 py-3.5 flex justify-between items-center text-left text-xs font-bold text-[#1C1917] hover:bg-[#F0EEEC]"
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#78716C] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 border-t border-[#EFEBE4]/40 text-[10px] text-[#78716C] leading-relaxed pt-2.5 bg-[#F0EEEC]/50 font-sans font-medium"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Симулятор диалога с менеджером */}
      <AnimatePresence>
        {activeConsultation && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveConsultation(false)}
              className="fixed inset-0 bg-black/60 z-40"
            ></motion.div>

            {/* Окно чата */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 max-w-[440px] mx-auto bg-[#F0EEEC] border-t border-[#EFEBE4] rounded-t-[32px] z-50 p-5 flex flex-col h-[75%] shadow-2xl select-none"
            >
              <div className="w-12 h-1 bg-[#EFEBE4] rounded-full mx-auto mb-4 shrink-0"></div>

              {/* Шапка чата */}
              <div className="flex justify-between items-center pb-3 border-b border-[#EFEBE4]/65 shrink-0 text-[#1C1917]">
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 bg-[#C5A880] rounded-full flex items-center justify-center font-black text-white text-xs shadow-md">
                    DA
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wide">Дежурный Менеджер</h4>
                    <span className="text-[9px] text-emerald-600 flex items-center space-x-1 font-bold">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse inline-block"></span>
                      <span>в сети • DA!CAR</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveConsultation(false)}
                  className="text-xs font-black text-[#78716C] hover:text-[#1C1917]"
                >
                  Закрыть
                </button>
              </div>

              {/* Область Сообщений чата */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3.5 flex flex-col text-xs text-[#1C1917] scrollbar-none">
                {consultationChat.map((msg, index) => (
                  <div
                    key={index}
                    className={`max-w-[85%] rounded-2xl p-3 flex flex-col shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-[#C5A880] text-white self-end rounded-tr-none font-black'
                        : 'bg-white border border-[#EFEBE4]/60 text-[#1C1917] self-start rounded-tl-none font-medium'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>

              {/* Форма заявки на подбор и обратный звонок */}
              <div className="bg-[#C5A880]/10 border border-[#C5A880]/30 rounded-2xl p-3.5 mb-2.5 space-y-2 shrink-0">
                <p className="text-[10px] font-black uppercase text-[#1C1917] font-mono flex items-center space-x-1">
                  <span>🎯 Подбор под ваш бюджет</span>
                </p>
                <p className="text-[8.5px] text-[#78716C] leading-normal font-medium">
                  Оставьте ваш телефон, чтобы получить детальный подбор и расчет моделей под ваш персональный бюджет в течение 10 минут!
                </p>
                
                <div className="flex space-x-2">
                  <input
                    type="tel"
                    id="callback-phone-input"
                    disabled={isCallbackSubmitting}
                    placeholder="+7 (999) 000-00-00"
                    className="flex-1 bg-white border border-[#EFEBE4] text-xs rounded-xl px-3 py-2 outline-none focus:border-[#C5A880]/50 disabled:opacity-50"
                  />
                  <button
                    disabled={isCallbackSubmitting}
                    onClick={() => {
                      const inp = document.getElementById('callback-phone-input') as HTMLInputElement;
                      if (!inp || !inp.value.trim()) {
                        alert('⚠️ Введите корректный номер телефона!');
                        return;
                      }
                      
                      const phone = inp.value.trim();
                      triggerHaptic('success');
                      setIsCallbackSubmitting(true);
                      
                      // Добавим в чат сообщение пользователя и ответ менеджера
                      setConsultationChat(prev => [
                        ...prev,
                        { sender: 'user', text: `Заявка на подбор под бюджет. Телефон: ${phone}` },
                        { sender: 'manager', text: `Спасибо! Ваша заявка принята. Менеджер уже анализирует рынок и готовит лучшие варианты подбора под ваш бюджет для номера ${phone}!` }
                      ]);
                      inp.value = '';

                      // SECURE TELEGRAM NOTIFICATION DISPATCH (VIA BACKEND)
                      try {
                        const tgMessage = `📞 **ЗАКАЗ ОБРАТНОГО ЗВОНКА**\n\n` +
                          `👤 **Пользователь:** Premium Клиент\n` +
                          `📞 **Телефон:** ${phone}\n\n` +
                          `⚡ *Срочно перезвоните клиенту!*`;

                        const channelId = localStorage.getItem('tg_channel_id') || APP_CONFIG.DEFAULT_TG_CHANNEL_ID;

                        fetch('/api/telegram/notify', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            text: tgMessage,
                            chatId: channelId || undefined
                          })
                        })
                        .then(async (res) => {
                          setIsCallbackSubmitting(false);
                          if (!res.ok) {
                            console.warn('Secure Telegram notification proxy returned error, attempting direct client fallback...');
                            const botToken = localStorage.getItem('tg_bot_token') || APP_CONFIG.DEFAULT_TG_BOT_TOKEN;
                            if (botToken && channelId) {
                              fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  chat_id: channelId,
                                  text: tgMessage,
                                  parse_mode: 'Markdown'
                                })
                              });
                            }
                          }
                        })
                        .catch(err => {
                          setIsCallbackSubmitting(false);
                          console.error('Secure notification failed, attempting direct client fallback...', err);
                          const botToken = localStorage.getItem('tg_bot_token') || APP_CONFIG.DEFAULT_TG_BOT_TOKEN;
                          if (botToken && channelId) {
                            fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                chat_id: channelId,
                                  text: tgMessage,
                                  parse_mode: 'Markdown'
                              })
                            });
                          }
                        });
                      } catch (e) {
                        setIsCallbackSubmitting(false);
                        console.error('Callback TG error:', e);
                      }
                    }}
                    className="bg-[#1C1917] hover:bg-[#2E2A27] text-white text-[10px] font-black uppercase px-3 rounded-xl transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isCallbackSubmitting ? 'Отправка...' : 'Перезвонить'}
                  </button>
                </div>
              </div>

              {/* Предустановленные Кнопки-Вопросы */}
              <div className="border-t border-[#EFEBE4]/65 pt-3.5 shrink-0 space-y-2">
                <p className="text-[9px] text-[#78716C] font-bold uppercase tracking-widest px-1 font-mono">
                  Частые вопросы менеджеру:
                </p>
                <div className="flex flex-col space-y-2">
                  {consultantQuestions.map((cq, index) => (
                    <button
                      key={index}
                      onClick={() => handleAskQuestion(cq.q, cq.a)}
                      className="bg-white hover:bg-[#F0EEEC] text-[#1C1917] text-left px-3.5 py-2 rounded-xl text-[10px] font-bold transition-bezier cursor-pointer border border-[#EFEBE4] shadow-sm"
                    >
                      {cq.q}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
