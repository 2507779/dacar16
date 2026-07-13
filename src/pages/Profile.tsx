/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { triggerHaptic } from '../utils/haptics';
import { MessageSquare, Phone, MapPin, ShieldAlert, BadgeCheck, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AdminPanel } from '../components/AdminPanel';

export default function Profile() {
  const { orders } = useStore();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [activeConsultation, setActiveConsultation] = useState(false);

  const [consultationChat, setConsultationChat] = useState<Array<{ sender: 'manager' | 'user'; text: string }>>([
    { 
      sender: 'manager', 
      text: 'Приветствуем! Я дежурный менеджер отдела логистики DA!CAR. Выберите интересующий вас вопрос ниже, и я подробно отвечу вам.' 
    }
  ]);

  const faqData = [
    {
      q: 'Как рассчитывается таможенная пошлина?',
      a: 'Пошлина зависит от возраста авто, типа двигателя (ДВС, гибрид, электро) и объема двигателя. Для физлиц выгоднее всего везти машины в возрасте от 3 до 5 лет. Электромобили облагаются 15% пошлиной от стоимости инвойса. Мы берем все расчеты и таможенное оформление под свой полный контроль.'
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
      a: 'Наш главный филиал выдачи находится в Казани на Спартаковской 6. Мы проводим полную предпродажную подготовку, детейлинг и передаем авто на закрытой площадке. Также отправляем закрытыми автовозами в Москву, СПб, Екатеринбург и любой другой город РФ.'
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
    <div className="flex flex-col text-[#111827] pb-12 select-none">
      
      {/* Профиль Пользователя */}
      <div className="px-4 pt-6 pb-4 bg-white border-b border-[#E5E7EB]/40 flex items-center space-x-4">
        <div className="w-16 h-16 bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] rounded-full flex items-center justify-center font-display font-black text-white text-xl shadow-md relative shrink-0">
          U
          <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-black">✓</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-black text-base text-[#111827] flex items-center space-x-1.5 tracking-tight">
            <span>Premium Клиент</span>
          </h2>
          <p className="text-xs text-[#64748B] truncate font-mono">tg_user_id: 841b57fe</p>
          <div className="flex space-x-2 mt-1.5">
            <span className="bg-[#2563EB]/10 text-[#2563EB] text-[9px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider border border-[#2563EB]/15 font-mono">
              Активных заказов: {orders.length}
            </span>
          </div>
        </div>
      </div>

      {/* Быстрые Кнопки Контактов */}
      <div className="grid grid-cols-2 gap-3 px-4 mt-4">
        <button
          onClick={() => {
            triggerHaptic('medium');
            setActiveConsultation(true);
          }}
          className="bg-white border border-[#E5E7EB] hover:border-[#2563EB]/45 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-md active:scale-95 transition cursor-pointer"
        >
          <MessageSquare className="w-6 h-6 text-[#2563EB]" />
          <span className="text-xs font-bold text-[#111827] mt-2">Чат с менеджером</span>
          <span className="text-[8px] text-[#64748B] mt-0.5 font-mono">Консультация онлайн</span>
        </button>

        <a
          href="tel:+78432220099"
          onClick={() => triggerHaptic('light')}
          className="bg-white border border-[#E5E7EB] hover:border-[#2563EB]/45 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-md active:scale-95 transition cursor-pointer col-span-1"
        >
          <Phone className="w-6 h-6 text-emerald-600" />
          <span className="text-xs font-bold text-[#111827] mt-2">Позвонить в офис</span>
          <span className="text-[8px] text-[#64748B] mt-0.5 font-mono">+7 (843) 222-00-99</span>
        </a>
      </div>

      {/* ПАНЕЛЬ УПРАВЛЕНИЯ / АДМИНКА (Добавление новых авто, изменение текстов) */}
      <div className="px-4 mt-4">
        <AdminPanel />
      </div>

      {/* Гарантии и Юр. Информация */}
      <div className="px-4 mt-6">
        <h3 className="font-display text-[11px] font-bold uppercase tracking-widest text-[#64748B] mb-2.5 font-mono">Надежность & Гарантии</h3>
        <div className="bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden p-4 space-y-3.5 shadow-md">
          <div className="flex items-start space-x-3 text-xs">
            <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#111827]">Официальное юрлицо РФ</h4>
              <p className="text-[10px] text-[#64748B] leading-normal mt-0.5 font-sans font-medium">
                Договор заключается с ООО «ДА!КАР ИМПОРТ» (ИНН 1655489022). Все платежи принимаются на расчетный счет в Альфа-Банке.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-xs border-t border-[#E5E7EB]/40 pt-3.5">
            <ShieldAlert className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#111827]">100% Возврат депозита</h4>
              <p className="text-[10px] text-[#64748B] leading-normal mt-0.5 font-sans font-medium">
                Если в течение 14 дней мы не подберем подходящий вам автомобиль на аукционе, обеспечим полный возврат залоговой суммы.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-xs border-t border-[#E5E7EB]/40 pt-3.5">
            <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-[#111827]">Шоурум в Казани</h4>
              <p className="text-[10px] text-[#64748B] leading-normal mt-0.5 font-sans font-medium">
                Приезжайте знакомиться лично! г. Казань, ул. Серова, д. 48, к. 2. Рады видеть вас каждый день с 10:00 до 20:00.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="px-4 mt-6">
        <h3 className="font-display text-[11px] font-bold uppercase tracking-widest text-[#64748B] mb-2.5 font-mono">Часто задаваемые вопросы</h3>
        <div className="space-y-2.5">
          {faqData.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-md"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-4 py-3.5 flex justify-between items-center text-left text-xs font-bold text-[#111827] hover:bg-[#F5F7FA]"
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#64748B] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 border-t border-[#E5E7EB]/40 text-[10px] text-[#64748B] leading-relaxed pt-2.5 bg-[#F5F7FA]/50 font-sans font-medium"
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
              className="fixed bottom-0 left-0 right-0 max-w-[440px] mx-auto bg-[#F5F7FA] border-t border-[#E5E7EB] rounded-t-[32px] z-50 p-5 flex flex-col h-[75%] shadow-2xl select-none"
            >
              <div className="w-12 h-1 bg-[#E5E7EB] rounded-full mx-auto mb-4 shrink-0"></div>

              {/* Шапка чата */}
              <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB]/65 shrink-0 text-[#111827]">
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 bg-[#2563EB] rounded-full flex items-center justify-center font-bold text-white text-xs shadow-md">
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
                  className="text-xs font-black text-[#64748B] hover:text-[#111827]"
                >
                  Закрыть
                </button>
              </div>

              {/* Область Сообщений чата */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3.5 flex flex-col text-xs text-[#111827] scrollbar-none">
                {consultationChat.map((msg, index) => (
                  <div
                    key={index}
                    className={`max-w-[85%] rounded-2xl p-3 flex flex-col shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-[#2563EB] text-white self-end rounded-tr-none font-semibold'
                        : 'bg-white border border-[#E5E7EB]/60 text-[#111827] self-start rounded-tl-none font-medium'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>

              {/* Предустановленные Кнопки-Вопросы */}
              <div className="border-t border-[#E5E7EB]/65 pt-3.5 shrink-0 space-y-2">
                <p className="text-[9px] text-[#64748B] font-bold uppercase tracking-widest px-1 font-mono">
                  Частые вопросы менеджеру:
                </p>
                <div className="flex flex-col space-y-2">
                  {consultantQuestions.map((cq, index) => (
                    <button
                      key={index}
                      onClick={() => handleAskQuestion(cq.q, cq.a)}
                      className="bg-white hover:bg-[#F5F7FA] text-[#111827] text-left px-3.5 py-2 rounded-xl text-[10px] font-bold transition-bezier cursor-pointer border border-[#E5E7EB] shadow-sm"
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
