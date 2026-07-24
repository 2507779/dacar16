/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Phone, MessageCircle, X, Send, Check, PhoneCall, Clock, ShieldCheck, UserCheck, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../utils/haptics';
import { useStore } from '../store/useStore';

export default function FloatingContactButton() {
  const { appTexts, managerContacts } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'callback' | 'instant'>('callback');
  
  // Поля формы обратного звонка
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredTime, setPreferredTime] = useState<'now' | '15min' | 'evening'>('now');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleOpen = () => {
    triggerHaptic('medium');
    setIsOpen(true);
    setIsSuccess(false);
  };

  const handleClose = () => {
    triggerHaptic('light');
    setIsOpen(false);
  };

  const handleSubmitCallback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || phone.trim().length < 6 || isSubmitting) return;

    triggerHaptic('success');
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 600);
  };

  const handlePhoneChange = (val: string) => {
    let cleaned = val.replace(/[^\d+]/g, '');
    if (cleaned.length === 1 && cleaned !== '+') {
      if (cleaned === '7' || cleaned === '8') {
        cleaned = '+7 (';
      } else {
        cleaned = '+7 (' + cleaned;
      }
    } else if (cleaned.length === 2 && cleaned.startsWith('7')) {
      cleaned = '+7 (';
    } else if (cleaned.length === 5 && !cleaned.includes(')')) {
      cleaned = cleaned.slice(0, 4) + ') ' + cleaned.slice(4);
    }
    setPhone(cleaned);
  };

  const phoneNumberFormatted = appTexts?.officePhone || '+7 (800) 555-35-35';
  const cleanTelNumber = phoneNumberFormatted.replace(/[^\d+]/g, '');

  return (
    <>
      {/* Плавющая кнопка FAB */}
      <div className="absolute bottom-[84px] right-4 z-40">
        <div className="relative">
          {/* Pulsing Outer Ring */}
          <span className="absolute -inset-1 rounded-full bg-[#C5A880]/30 animate-ping pointer-events-none opacity-75" />
          
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleOpen}
            className="relative w-13 h-13 bg-[#1C1917] hover:bg-black text-[#C5A880] rounded-full flex items-center justify-center shadow-[0_8px_25px_rgba(0,0,0,0.3)] border border-[#C5A880]/40 cursor-pointer group"
            aria-label="Связаться с нами"
          >
            {/* Green Online Status Dot */}
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#1C1917] rounded-full shadow-sm" />
            
            <PhoneCall className="w-5 h-5 text-[#C5A880] group-hover:rotate-12 transition-transform duration-300" />
          </motion.button>
        </div>
      </div>

      {/* Модальное окно обратного звонка и чата */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black z-50 cursor-pointer backdrop-blur-xs"
            />

            {/* Bottom Sheet Modal */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              className="absolute bottom-0 left-0 right-0 bg-[#F0EEEC] rounded-t-[32px] border-t border-[#EFEBE4] p-5 pb-8 z-50 shadow-[0_-12px_40px_rgba(0,0,0,0.25)] select-none max-h-[90%] overflow-y-auto scrollbar-none"
            >
              {/* Grabber */}
              <div className="w-12 h-1 bg-[#EFEBE4] rounded-full mx-auto mb-4" />

              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#1C1917] text-[#C5A880] flex items-center justify-center shadow-md border border-[#C5A880]/30 shrink-0">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-black text-sm text-[#1C1917] uppercase tracking-wide flex items-center space-x-1.5">
                      <span>Связаться с экспертом</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </h3>
                    <p className="text-[10px] text-[#78716C]">Консультация по подбору и импорту авто</p>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-[#EFEBE4] rounded-full transition text-[#78716C] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Переключатель вкладок: Звонок / Чат */}
              <div className="flex bg-[#EFEBE4]/80 p-1 rounded-2xl mb-5 border border-[#EFEBE4]">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveTab('callback');
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                    activeTab === 'callback'
                      ? 'bg-[#1C1917] text-[#C5A880] shadow-sm'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Обратный звонок</span>
                </button>

                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveTab('instant');
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                    activeTab === 'instant'
                      ? 'bg-[#1C1917] text-[#C5A880] shadow-sm'
                      : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Прямой чат</span>
                </button>
              </div>

              {/* Содержимое вкладок */}
              {activeTab === 'callback' ? (
                <div>
                  {isSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-2xl p-6 text-center border border-[#EFEBE4] shadow-sm my-2 space-y-3"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                        <Check className="w-6 h-6 stroke-[3]" />
                      </div>
                      <h4 className="font-display font-black text-sm text-[#1C1917] uppercase tracking-wide">
                        Заявка на звонок принята!
                      </h4>
                      <p className="text-[11px] text-[#78716C] leading-relaxed">
                        Наш старший эксперт по импорту перезвонит вам по номеру <strong className="text-[#1C1917]">{phone}</strong>{' '}
                        {preferredTime === 'now' && 'прямо сейчас.'}
                        {preferredTime === '15min' && 'в течение 15 минут.'}
                        {preferredTime === 'evening' && 'сегодня вечером.'}
                      </p>
                      <button
                        onClick={handleClose}
                        className="w-full py-3 bg-[#1C1917] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-black transition active:scale-95 cursor-pointer mt-2"
                      >
                        Отлично, спасибо
                      </button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmitCallback} className="space-y-4">
                      {/* Варианты времени */}
                      <div>
                        <label className="block text-[10px] font-bold text-[#78716C] uppercase tracking-wider mb-2 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-[#C5A880]" />
                          <span>Когда вам перезвонить?</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('light');
                              setPreferredTime('now');
                            }}
                            className={`py-2 px-1 rounded-xl text-[9px] font-bold border text-center transition cursor-pointer ${
                              preferredTime === 'now'
                                ? 'bg-[#C5A880]/15 border-[#C5A880] text-[#1C1917]'
                                : 'bg-white border-[#EFEBE4] text-[#78716C] hover:border-gray-300'
                            }`}
                          >
                            Прямо сейчас
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('light');
                              setPreferredTime('15min');
                            }}
                            className={`py-2 px-1 rounded-xl text-[9px] font-bold border text-center transition cursor-pointer ${
                              preferredTime === '15min'
                                ? 'bg-[#C5A880]/15 border-[#C5A880] text-[#1C1917]'
                                : 'bg-white border-[#EFEBE4] text-[#78716C] hover:border-gray-300'
                            }`}
                          >
                            За 15 минут
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('light');
                              setPreferredTime('evening');
                            }}
                            className={`py-2 px-1 rounded-xl text-[9px] font-bold border text-center transition cursor-pointer ${
                              preferredTime === 'evening'
                                ? 'bg-[#C5A880]/15 border-[#C5A880] text-[#1C1917]'
                                : 'bg-white border-[#EFEBE4] text-[#78716C] hover:border-gray-300'
                            }`}
                          >
                            Вечером
                          </button>
                        </div>
                      </div>

                      {/* Имя */}
                      <div>
                        <label className="block text-[10px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                          Ваше имя
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Например, Александр"
                          className="w-full bg-white border border-[#EFEBE4] focus:border-[#C5A880] rounded-xl p-3 text-xs text-[#1C1917] outline-none transition"
                        />
                      </div>

                      {/* Телефон */}
                      <div>
                        <label className="block text-[10px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
                          Номер телефона
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => handlePhoneChange(e.target.value)}
                          placeholder="+7 (999) 000-00-00"
                          className="w-full bg-white border border-[#EFEBE4] focus:border-[#C5A880] rounded-xl p-3 text-xs text-[#1C1917] outline-none font-mono transition"
                        />
                      </div>

                      {/* Пояснение по гарантии */}
                      <div className="flex items-center space-x-2 text-[9px] text-[#78716C] bg-white/60 p-2.5 rounded-xl border border-[#EFEBE4]">
                        <ShieldCheck className="w-4 h-4 text-[#C5A880] shrink-0" />
                        <span>Бесплатная консультация. Никакого спама и навязчивых звонков.</span>
                      </div>

                      <button
                        type="submit"
                        disabled={!name.trim() || phone.trim().length < 6 || isSubmitting}
                        className={`w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition active:scale-95 cursor-pointer shadow-md flex items-center justify-center space-x-2 ${
                          name.trim() && phone.trim().length >= 6 && !isSubmitting
                            ? 'bg-[#C5A880] hover:bg-[#B0936B] text-white btn-shine-gold gold-glow-button'
                            : 'bg-[#EFEBE4] text-[#78716C]/50 cursor-not-allowed'
                        }`}
                      >
                        {isSubmitting ? (
                          <span>Отправка...</span>
                        ) : (
                          <>
                            <PhoneCall className="w-4 h-4" />
                            <span>Заказать бесплатный звонок</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Telegram Manager Link */}
                  <a
                    href="https://t.me/dacar_official_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => triggerHaptic('medium')}
                    className="w-full bg-[#229ED9] text-white p-3.5 rounded-2xl flex items-center justify-between shadow-md hover:opacity-95 transition active:scale-[0.98] cursor-pointer"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <Send className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold uppercase tracking-wider">Чат в Telegram</div>
                        <div className="text-[9px] text-white/80">Мгновенный ответ старшего менеджера</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded-lg">Онлайн</span>
                  </a>

                  {/* Direct Phone Call */}
                  <a
                    href={`tel:${cleanTelNumber}`}
                    onClick={() => triggerHaptic('medium')}
                    className="w-full bg-[#1C1917] text-[#C5A880] p-3.5 rounded-2xl flex items-center justify-between shadow-md hover:bg-black transition active:scale-[0.98] cursor-pointer border border-[#C5A880]/30"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-[#C5A880]/20 flex items-center justify-center shrink-0 text-[#C5A880]">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold uppercase tracking-wider text-white">Прямой вызов</div>
                        <div className="text-[9px] text-[#A8A29E] font-mono">{phoneNumberFormatted}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-white bg-white/10 px-2.5 py-1 rounded-lg">Звонок</span>
                  </a>

                  {/* Список доступных контактов / менеджеров */}
                  {managerContacts && managerContacts.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#EFEBE4]">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] mb-2 flex items-center space-x-1">
                        <UserCheck className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>Персональные контакты:</span>
                      </div>
                      <div className="space-y-1.5">
                        {managerContacts.map((mgr) => (
                          <a
                            key={mgr.id}
                            href={mgr.type === 'telegram' ? `https://t.me/${mgr.value.replace('@', '')}` : `tel:${mgr.value.replace(/[^\d+]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => triggerHaptic('light')}
                            className="bg-white p-2.5 rounded-xl border border-[#EFEBE4] flex items-center justify-between hover:border-[#C5A880]/40 transition text-xs"
                          >
                            <span className="font-bold text-[#1C1917]">{mgr.name}</span>
                            <span className="text-[10px] text-[#C5A880] font-mono font-semibold">{mgr.value}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
