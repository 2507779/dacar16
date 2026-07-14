/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { calculateFullCarPrice, formatCurrency, DELIVERY_CITIES, COMPANY_COMMISSION, BROKER_FEE_RUB, BASE_DELIVERY_KAZAN_RUB, EXCHANGE_RATES } from '../data/cars';
import { triggerHaptic } from '../utils/haptics';
import { Heart, ChevronRight, MapPin, Truck, ShieldCheck, FileText, Send, X, Check, CheckCircle2, Award, Settings, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function VehicleDetails() {
  const { cars, activeCarId, setActiveCarId, favorites, toggleFavorite, addOrder, setCurrentTab } = useStore();
  const [selectedCity, setSelectedCity] = useState('Казань (Главный филиал)');
  const [isOrderSheetOpen, setIsOrderSheetOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Форма заказа
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Валидация телефона
  const isFormValid = userName.trim().length >= 2 && userPhone.trim().length >= 6;

  const car = cars.find(c => c.id === activeCarId);
  if (!car) return null;

  const calculated = calculateFullCarPrice(car, selectedCity);
  const isFav = favorites.includes(car.id);

  const handleToggleFav = () => {
    triggerHaptic('medium');
    toggleFavorite(car.id);
  };

  const handleOpenOrderSheet = () => {
    triggerHaptic('medium');
    setIsOrderSheetOpen(true);
  };

  const handleCloseOrderSheet = () => {
    triggerHaptic('light');
    setIsOrderSheetOpen(false);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    triggerHaptic('success');
    addOrder(car, userName, userPhone, selectedCity);
    setOrderSuccess(true);
    setIsOrderSheetOpen(false);

    // Сброс формы
    setUserName('');
    setUserPhone('');

    // Редирект на экран заказов через 2.5 секунды
    setTimeout(() => {
      setOrderSuccess(false);
      setActiveCarId(null); // Закрываем детальный вид
      setCurrentTab('orders'); // Переключаем на заказы
    }, 2500);
  };

  return (
    <div className="flex flex-col text-[#1C1917] pb-16 select-none relative bg-[#FAF8F5]">
      
      {/* 1. Слайдер Изображений */}
      <div className="relative h-64 bg-[#1C1917] overflow-hidden">
        <img
          src={car.images[activeImageIndex]}
          alt={`${car.brand} ${car.model}`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />

        {/* Индикаторы слайдов */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
          {car.images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                triggerHaptic('light');
                setActiveImageIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${activeImageIndex === idx ? 'w-6 bg-[#C5A880]' : 'w-1.5 bg-white/40'}`}
            ></button>
          ))}
        </div>

        {/* Избранное прямо на фото */}
        <button
          onClick={handleToggleFav}
          className="absolute top-4 right-4 p-3 rounded-full bg-white/80 border border-black/[0.03] backdrop-blur-md hover:bg-white text-[#1C1917] transition active:scale-90 z-10 shadow-md"
        >
          <Heart className={`w-5 h-5 transition-all ${isFav ? 'fill-red-500 text-red-500' : 'text-[#78716C]'}`} />
        </button>

        {/* Страна и состояние */}
        <div className="absolute top-4 left-4 flex space-x-2 z-10">
          <span className="bg-white/95 border border-black/[0.03] backdrop-blur-md text-[#1C1917] text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider shadow-sm">
            {car.country === 'China' ? 'Китай 🇨🇳' : car.country === 'South Korea' ? 'Корея 🇰🇷' : 'Киргизия 🇰🇬'}
          </span>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider border ${
            car.condition === 'new' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-[#C5A880] text-[#1C1917] border-[#C5A880] shadow-sm'
          }`}>
            {car.condition === 'new' ? 'Новый' : 'С пробегом'}
          </span>
        </div>
      </div>

      {/* 2. Заголовок и Базовая Спецификация */}
      <div className="px-4 pt-5">
        <span className="text-[#C5A880] font-black uppercase text-[10px] tracking-widest font-mono">Официальный импорт</span>
        <h1 className="font-display font-black text-xl text-[#1C1917] mt-1 leading-tight tracking-tight">
          {car.brand} {car.model}
        </h1>
        <p className="text-xs text-[#78716C] mt-1 font-sans font-medium">Поколение: {car.generation} • {car.year} г.</p>

        {/* Главные ТТХ */}
        <div className="grid grid-cols-3 gap-2 mt-4.5">
          <div className="bg-white border border-[#EFEBE4] rounded-2xl p-3 flex flex-col justify-between shadow-sm text-center">
            <Gauge className="w-4 h-4 text-[#C5A880] mx-auto" />
            <span className="text-[9px] text-[#78716C] uppercase tracking-wider mt-1.5 font-mono">Пробег</span>
            <span className="text-xs font-bold text-[#1C1917] mt-0.5">
              {car.condition === 'new' ? '0 км' : `${car.mileage.toLocaleString()} км`}
            </span>
          </div>

          <div className="bg-white border border-[#EFEBE4] rounded-2xl p-3 flex flex-col justify-between shadow-sm text-center">
            <Settings className="w-4 h-4 text-[#C5A880] mx-auto" />
            <span className="text-[9px] text-[#78716C] uppercase tracking-wider mt-1.5 font-mono">Двигатель</span>
            <span className="text-xs font-bold text-[#1C1917] mt-0.5 truncate capitalize">
              {car.engineType}
            </span>
          </div>

          <div className="bg-white border border-[#EFEBE4] rounded-2xl p-3 flex flex-col justify-between shadow-sm text-center">
            <Award className="w-4 h-4 text-emerald-600 mx-auto" />
            <span className="text-[9px] text-[#78716C] uppercase tracking-wider mt-1.5 font-mono">Мощность</span>
            <span className="text-xs font-bold text-[#1C1917] mt-0.5">
              {car.power} л.с.
            </span>
          </div>
        </div>
      </div>

      {/* 3. Описание автомобиля */}
      <div className="px-4 mt-6">
        <h3 className="font-display text-[10px] font-bold uppercase tracking-widest text-[#78716C] mb-2 font-mono">Описание модели</h3>
        <p className="text-xs text-[#1C1917] leading-relaxed bg-white border border-[#EFEBE4] rounded-2xl p-4 shadow-sm font-medium">
          {car.description}
        </p>
      </div>

      {/* 4. Оснащение и Преимущества */}
      <div className="px-4 mt-6">
        <h3 className="font-display text-[10px] font-bold uppercase tracking-widest text-[#78716C] mb-2.5 font-mono">Оснащение премиум-класса</h3>
        <div className="flex flex-wrap gap-2">
          {car.features.map((feat, index) => (
            <span
              key={index}
              className="bg-white text-[#C5A880] text-[10px] font-black px-3 py-1.5 rounded-xl border border-[#EFEBE4] shadow-sm hover:border-[#C5A880]/30 transition duration-300"
            >
              {feat}
            </span>
          ))}
        </div>
      </div>

      {/* 5. ИНТЕРАКТИВНЫЙ РАСЧЕТ СТОИМОСТИ ПОД КЛЮЧ */}
      <div className="px-4 mt-6">
        <div className="bg-white border border-[#EFEBE4] rounded-3xl p-5 shadow-md space-y-4">
          <div className="flex justify-between items-center border-b border-[#EFEBE4]/50 pb-3">
            <div>
              <h3 className="font-display font-black text-sm text-[#1C1917] flex items-center space-x-1.5 tracking-tight uppercase">
                <Truck className="w-4 h-4 text-[#C5A880]" />
                <span>Калькулятор под ключ</span>
              </h3>
              <p className="text-[10px] text-[#78716C] mt-0.5 font-sans font-medium">Все пошлины, доставка и СБКТС включены</p>
            </div>
          </div>

          {/* Селектор города доставки */}
          <div>
            <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1.5 font-mono">Город доставки в РФ</label>
            <div className="relative">
              <select
                value={selectedCity}
                onChange={(e) => {
                  triggerHaptic('medium');
                  setSelectedCity(e.target.value);
                }}
                className="w-full bg-[#FAF8F5] border border-[#EFEBE4] text-xs font-bold text-[#1C1917] rounded-xl px-4 py-3 outline-none focus:border-[#C5A880]/50 cursor-pointer appearance-none transition-all"
              >
                {DELIVERY_CITIES.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name} {city.adjustmentRUB !== 0 ? `(${city.adjustmentRUB > 0 ? '+' : ''}${city.adjustmentRUB.toLocaleString()} ₽)` : ''}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#78716C]">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>

          {/* Табличная Детализация пошлин */}
          <div className="space-y-2.5 text-xs pt-2">
            <div className="flex justify-between text-[#78716C] font-medium">
              <span>Стоимость авто ({car.country})</span>
              <span className="font-mono font-bold text-[#1C1917]">
                ${car.priceUSD.toLocaleString()} (~{formatCurrency(calculated.carBasePriceRUB)})
              </span>
            </div>
            
            <div className="flex justify-between text-[#78716C] font-medium">
              <span>Таможенная пошлина РФ</span>
              <span className="font-mono font-bold text-[#1C1917]">
                €{car.customsDutyEUR.toLocaleString()} (~{formatCurrency(calculated.customsDutyRUB)})
              </span>
            </div>

            <div className="flex justify-between text-[#78716C] font-medium">
              <span>Льготный утильсбор</span>
              <span className="font-mono font-bold text-[#1C1917]">{formatCurrency(calculated.recyclingFeeRUB)}</span>
            </div>

            <div className="flex justify-between text-[#78716C] font-medium">
              <span>СБКТС, ЭПТС & Услуги брокера</span>
              <span className="font-mono font-bold text-[#1C1917]">{formatCurrency(BROKER_FEE_RUB)}</span>
            </div>

            <div className="flex justify-between text-[#78716C] font-medium">
              <span>Доставка и страхование</span>
              <span className="font-mono font-bold text-[#1C1917]">{formatCurrency(calculated.deliveryFeeRUB)}</span>
            </div>

            <div className="flex justify-between text-[#78716C] font-medium">
              <span>Комиссия компании DA!CAR</span>
              <span className="font-mono font-bold text-[#1C1917]">{formatCurrency(COMPANY_COMMISSION)}</span>
            </div>

            {/* Итоговая жирная строка */}
            <div className="border-t border-dashed border-[#EFEBE4] pt-4 flex justify-between items-end">
              <div>
                <span className="text-[10px] uppercase text-[#78716C] font-bold block font-mono">Полная цена под ключ</span>
                <span className="text-[9px] text-[#C5A880] font-bold flex items-center space-x-0.5 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Фиксация цены в договоре</span>
                </span>
              </div>
              <div className="text-right">
                <span className="font-display font-black text-[#C5A880] text-lg block leading-none">
                  {formatCurrency(calculated.finalPriceRUB)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Закрепленная кнопка заказа (CTA) */}
      <div className="px-4 mt-6">
        <button
          onClick={handleOpenOrderSheet}
          className="w-full py-4 bg-[#C5A880] hover:bg-[#B0936B] active:scale-[0.98] transition-bezier text-[#1C1917] font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center space-x-2 shadow-md cursor-pointer"
        >
          <Send className="w-4 h-4 fill-[#1C1917]" />
          <span>Заказать этот авто под ключ</span>
        </button>
        <p className="text-[9px] text-[#78716C] text-center mt-2 font-mono">
          Нажатие открывает форму резерва. Все цены актуальны на {new Date().toLocaleDateString('ru-RU')}.
        </p>
      </div>

      {/* 7. Выдвижной Bottom Sheet с формой заказа */}
      <AnimatePresence>
        {isOrderSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseOrderSheet}
              className="fixed inset-0 bg-black/60 z-40"
            ></motion.div>

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-[440px] mx-auto bg-[#FAF8F5] border-t border-[#EFEBE4] rounded-t-[32px] z-50 p-6 flex flex-col shadow-2xl select-none"
            >
              <div className="w-12 h-1 bg-[#EFEBE4] rounded-full mx-auto mb-6 shrink-0"></div>

              <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                  <h3 className="font-display font-black text-base text-[#1C1917] uppercase tracking-tight">Оформить заказ</h3>
                  <p className="text-[10px] text-[#78716C] mt-0.5 font-sans font-medium">Куратор свяжется для сверки деталей</p>
                </div>
                <button
                  onClick={handleCloseOrderSheet}
                  className="p-1.5 hover:bg-[#FAF8F5] rounded-full transition"
                >
                  <X className="w-5 h-5 text-[#78716C]" />
                </button>
              </div>

              {/* Детали авто в заказе */}
              <div className="bg-[#FAF8F5] rounded-2xl p-3 flex items-center space-x-3 mb-5 border border-[#EFEBE4]/60 shadow-sm">
                <img
                  src={car.images[0]}
                  alt={`${car.brand} ${car.model}`}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#EFEBE4]/40"
                />
                <div>
                  <h4 className="font-display font-bold text-xs text-[#1C1917]">{car.brand} {car.model}</h4>
                  <p className="text-[10px] text-[#C5A880] font-black mt-0.5">{formatCurrency(calculated.finalPriceRUB)}</p>
                </div>
              </div>

              <form onSubmit={handleSubmitOrder} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1.5 font-mono">Ваше ФИО / Имя</label>
                  <input
                     type="text"
                     required
                     value={userName}
                     onChange={(e) => setUserName(e.target.value)}
                     placeholder="Константин Konstantinopolsky"
                     className="w-full bg-[#FAF8F5] border border-[#EFEBE4] text-xs font-semibold text-[#1C1917] rounded-xl px-4 py-3.5 outline-none focus:border-[#C5A880]/50 transition duration-300"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1.5 font-mono">Контактный телефон</label>
                  <input
                     type="tel"
                     required
                     value={userPhone}
                     onChange={(e) => setUserPhone(e.target.value)}
                     placeholder="+7 (999) 000-00-00"
                     className="w-full bg-[#FAF8F5] border border-[#EFEBE4] text-xs font-semibold text-[#1C1917] rounded-xl px-4 py-3.5 outline-none focus:border-[#C5A880]/50 transition duration-300"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#78716C] block mb-1.5 font-mono">Город получения</label>
                  <input
                    type="text"
                    disabled
                    value={selectedCity}
                    className="w-full bg-[#FAF8F5] border border-[#EFEBE4]/60 text-xs font-bold text-[#78716C]/70 rounded-xl px-4 py-3.5 outline-none cursor-not-allowed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid}
                  className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-wider transition-bezier mt-6 cursor-pointer shadow-md ${
                    isFormValid
                      ? 'bg-[#C5A880] text-[#1C1917] hover:bg-[#B0936B] active:scale-95'
                      : 'bg-[#EFEBE4]/40 text-[#78716C]/50 border border-[#EFEBE4]/50 cursor-not-allowed'
                  }`}
                >
                  Отправить заявку в DA!CAR
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 8. Оверлей Успеха Оформления */}
      <AnimatePresence>
        {orderSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#FAF8F5] z-50 flex flex-col justify-center items-center text-center p-6 select-none"
          >
            <div className="w-20 h-20 bg-[#C5A880] rounded-full flex items-center justify-center text-[#1C1917] shadow-lg mb-6 animate-bounce">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>
            
            <h2 className="font-display font-black text-2xl text-[#1C1917] tracking-tight">Заказ создан!</h2>
            
            <p className="text-xs text-[#78716C] mt-3 max-w-sm leading-relaxed font-medium">
              Поздравляем! Ваша заявка зарегистрирована в CRM-системе DA!CAR. Вы будете перенаправлены на экран статусов, где сможете увидеть интерактивный 11-шаговый таймлайн транспортировки!
            </p>

            <div className="mt-8 flex items-center space-x-2 text-[10px] text-[#C5A880] font-mono font-bold">
              <span className="w-2 h-2 bg-[#C5A880] rounded-full animate-ping"></span>
              <span>Переход на вкладку «Заказы»...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
