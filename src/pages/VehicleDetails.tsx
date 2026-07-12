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
    <div className="flex flex-col text-white pb-16 select-none relative bg-[#070709]">
      
      {/* 1. Слайдер Изображений */}
      <div className="relative h-64 bg-neutral-950 overflow-hidden">
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
              className={`h-1.5 rounded-full transition-all duration-300 ${activeImageIndex === idx ? 'w-6 bg-amber-400' : 'w-1.5 bg-white/30'}`}
            ></button>
          ))}
        </div>

        {/* Избранное прямо на фото */}
        <button
          onClick={handleToggleFav}
          className="absolute top-4 right-4 p-3 rounded-full bg-[#121215]/60 border border-white/[0.04] backdrop-blur-md hover:bg-[#121215]/80 text-white transition active:scale-90 z-10"
        >
          <Heart className={`w-5 h-5 ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`} />
        </button>

        {/* Страна и состояние */}
        <div className="absolute top-4 left-4 flex space-x-2 z-10">
          <span className="bg-[#070709]/80 border border-white/[0.04] backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider">
            {car.country === 'China' ? 'Китай 🇨🇳' : car.country === 'South Korea' ? 'Корея 🇰🇷' : 'Киргизия 🇰🇬'}
          </span>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider border ${
            car.condition === 'new' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' : 'bg-amber-400/15 text-amber-400 border-amber-400/10'
          }`}>
            {car.condition === 'new' ? 'Новый' : 'С пробегом'}
          </span>
        </div>
      </div>

      {/* 2. Заголовок и Базовая Спецификация */}
      <div className="px-4 pt-5">
        <span className="text-amber-400 font-bold uppercase text-[10px] tracking-widest font-mono">Официальный импорт</span>
        <h1 className="font-display font-black text-xl text-white mt-1 leading-tight tracking-tight">
          {car.brand} {car.model}
        </h1>
        <p className="text-xs text-gray-500 mt-1 font-sans">Поколение: {car.generation} • {car.year} г.</p>

        {/* Главные ТТХ */}
        <div className="grid grid-cols-3 gap-2 mt-4.5">
          <div className="bg-[#121215] border border-white/[0.03] rounded-2xl p-3 flex flex-col justify-between shadow-xl text-center">
            <Gauge className="w-4 h-4 text-amber-400 mx-auto" />
            <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-1.5 font-mono">Пробег</span>
            <span className="text-xs font-bold text-gray-200 mt-0.5">
              {car.condition === 'new' ? '0 км' : `${car.mileage.toLocaleString()} км`}
            </span>
          </div>

          <div className="bg-[#121215] border border-white/[0.03] rounded-2xl p-3 flex flex-col justify-between shadow-xl text-center">
            <Settings className="w-4 h-4 text-blue-400 mx-auto" />
            <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-1.5 font-mono">Двигатель</span>
            <span className="text-xs font-bold text-gray-200 mt-0.5 truncate capitalize">
              {car.engineType}
            </span>
          </div>

          <div className="bg-[#121215] border border-white/[0.03] rounded-2xl p-3 flex flex-col justify-between shadow-xl text-center">
            <Award className="w-4 h-4 text-emerald-400 mx-auto" />
            <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-1.5 font-mono">Мощность</span>
            <span className="text-xs font-bold text-gray-200 mt-0.5">
              {car.power} л.с.
            </span>
          </div>
        </div>
      </div>

      {/* 3. Описание автомобиля */}
      <div className="px-4 mt-6">
        <h3 className="font-display text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 font-mono">Описание модели</h3>
        <p className="text-xs text-gray-300 leading-relaxed bg-[#121215] border border-white/[0.03] rounded-2xl p-4 shadow-xl">
          {car.description}
        </p>
      </div>

      {/* 4. Оснащение и Преимущества */}
      <div className="px-4 mt-6">
        <h3 className="font-display text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2.5 font-mono">Оснащение премиум-класса</h3>
        <div className="flex flex-wrap gap-2">
          {car.features.map((feat, index) => (
            <span
              key={index}
              className="bg-[#121215] text-amber-400 text-[10px] font-semibold px-3 py-1.5 rounded-xl border border-white/[0.04]"
            >
              {feat}
            </span>
          ))}
        </div>
      </div>

      {/* 5. ИНТЕРАКТИВНЫЙ РАСЧЕТ СТОИМОСТИ ПОД КЛЮЧ */}
      <div className="px-4 mt-6">
        <div className="bg-[#121215] border border-white/[0.03] rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-white/[0.03] pb-3">
            <div>
              <h3 className="font-display font-black text-sm text-white flex items-center space-x-1.5 tracking-tight uppercase">
                <Truck className="w-4 h-4 text-amber-400" />
                <span>Калькулятор под ключ</span>
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5 font-sans">Все пошлины, доставка и СБКТС включены</p>
            </div>
          </div>

          {/* Селектор города доставки */}
          <div>
            <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1.5 font-mono">Город доставки в РФ</label>
            <div className="relative">
              <select
                value={selectedCity}
                onChange={(e) => {
                  triggerHaptic('medium');
                  setSelectedCity(e.target.value);
                }}
                className="w-full bg-[#070709] border border-white/[0.06] text-xs font-semibold text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-amber-400/50 cursor-pointer appearance-none transition-all"
              >
                {DELIVERY_CITIES.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name} {city.adjustmentRUB !== 0 ? `(${city.adjustmentRUB > 0 ? '+' : ''}${city.adjustmentRUB.toLocaleString()} ₽)` : ''}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>

          {/* Табличная Детализация пошлин */}
          <div className="space-y-2.5 text-xs pt-2">
            <div className="flex justify-between text-gray-400">
              <span>Стоимость авто ({car.country})</span>
              <span className="font-mono font-medium text-gray-200">
                ${car.priceUSD.toLocaleString()} (~{formatCurrency(calculated.carBasePriceRUB)})
              </span>
            </div>
            
            <div className="flex justify-between text-gray-400">
              <span>Таможенная пошлина РФ</span>
              <span className="font-mono font-medium text-gray-200">
                €{car.customsDutyEUR.toLocaleString()} (~{formatCurrency(calculated.customsDutyRUB)})
              </span>
            </div>

            <div className="flex justify-between text-gray-400">
              <span>Льготный утильсбор</span>
              <span className="font-mono font-medium text-gray-200">{formatCurrency(calculated.recyclingFeeRUB)}</span>
            </div>

            <div className="flex justify-between text-gray-400">
              <span>СБКТС, ЭПТС & Услуги брокера</span>
              <span className="font-mono font-medium text-gray-200">{formatCurrency(BROKER_FEE_RUB)}</span>
            </div>

            <div className="flex justify-between text-gray-400">
              <span>Доставка и страхование</span>
              <span className="font-mono font-medium text-gray-200">{formatCurrency(calculated.deliveryFeeRUB)}</span>
            </div>

            <div className="flex justify-between text-gray-400">
              <span>Комиссия компании DA!CAR</span>
              <span className="font-mono font-medium text-gray-200">{formatCurrency(COMPANY_COMMISSION)}</span>
            </div>

            {/* Итоговая жирная строка */}
            <div className="border-t border-dashed border-white/[0.06] pt-4 flex justify-between items-end">
              <div>
                <span className="text-[10px] uppercase text-gray-500 font-bold block font-mono">Полная цена под ключ</span>
                <span className="text-[9px] text-emerald-400 font-semibold flex items-center space-x-0.5 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Фиксация цены в договоре</span>
                </span>
              </div>
              <div className="text-right">
                <span className="font-display font-black text-amber-400 text-lg block leading-none">
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
          className="w-full py-4 bg-amber-400 hover:bg-amber-500 active:scale-[0.98] transition-bezier text-neutral-950 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
        >
          <Send className="w-4 h-4 fill-neutral-950" />
          <span>Заказать этот авто под ключ</span>
        </button>
        <p className="text-[9px] text-gray-500 text-center mt-2 font-mono">
          Нажатие открывает форму резерва. Все цены актуальны на {new Date().toLocaleDateString('ru-RU')}.
        </p>
      </div>

      {/* 7. Выдвижной Bottom Sheet с формой заказа */}
      <AnimatePresence>
        {isOrderSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseOrderSheet}
              className="fixed inset-0 bg-[#000000]/95 z-40 backdrop-blur-sm"
            ></motion.div>

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-[440px] mx-auto bg-[#121215] border-t border-white/[0.08] rounded-t-[32px] z-50 p-6 flex flex-col shadow-2xl select-none"
            >
              <div className="w-12 h-1 bg-white/[0.08] rounded-full mx-auto mb-6 shrink-0"></div>

              <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                  <h3 className="font-display font-black text-base text-white uppercase tracking-tight">Оформить заказ</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-sans">Куратор свяжется для сверки деталей</p>
                </div>
                <button
                  onClick={handleCloseOrderSheet}
                  className="p-1.5 hover:bg-white/5 rounded-full transition"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Детали авто в заказе */}
              <div className="bg-[#070709] rounded-2xl p-3 flex items-center space-x-3 mb-5 border border-white/[0.03]">
                <img
                  src={car.images[0]}
                  alt={`${car.brand} ${car.model}`}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/[0.03]"
                />
                <div>
                  <h4 className="font-display font-bold text-xs text-gray-100">{car.brand} {car.model}</h4>
                  <p className="text-[10px] text-amber-400 font-bold mt-0.5">{formatCurrency(calculated.finalPriceRUB)}</p>
                </div>
              </div>

              <form onSubmit={handleSubmitOrder} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1.5 font-mono">Ваше ФИО / Имя</label>
                  <input
                     type="text"
                     required
                     value={userName}
                     onChange={(e) => setUserName(e.target.value)}
                     placeholder="Константин Константинопольский"
                     className="w-full bg-[#070709] border border-white/[0.06] text-xs font-semibold text-gray-100 rounded-xl px-4 py-3.5 outline-none focus:border-amber-400/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1.5 font-mono">Контактный телефон</label>
                  <input
                    type="tel"
                    required
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="+7 (999) 000-00-00"
                    className="w-full bg-[#070709] border border-white/[0.06] text-xs font-semibold text-gray-100 rounded-xl px-4 py-3.5 outline-none focus:border-amber-400/50"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1.5 font-mono">Город получения</label>
                  <input
                    type="text"
                    disabled
                    value={selectedCity}
                    className="w-full bg-[#070709]/50 border border-white/[0.03] text-xs font-bold text-gray-500 rounded-xl px-4 py-3.5 outline-none cursor-not-allowed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isFormValid}
                  className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-wider transition-bezier mt-6 cursor-pointer ${
                    isFormValid
                      ? 'bg-amber-400 text-black hover:bg-amber-500 active:scale-95'
                      : 'bg-white/5 text-gray-600 border border-white/[0.03] cursor-not-allowed'
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
            className="fixed inset-0 bg-[#070709]/95 backdrop-blur-md z-50 flex flex-col justify-center items-center text-center p-6 select-none"
          >
            <div className="w-20 h-20 bg-amber-400 rounded-full flex items-center justify-center text-neutral-950 shadow-[0_0_30px_rgba(245,158,11,0.25)] mb-6 animate-bounce">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>
            
            <h2 className="font-display font-black text-2xl text-white tracking-tight">Заказ создан!</h2>
            
            <p className="text-xs text-gray-400 mt-3 max-w-sm leading-relaxed">
              Поздравляем! Ваша заявка зарегистрирована в CRM-системе DA!CAR. Вы будете перенаправлены на экран статусов, где сможете увидеть интерактивный 11-шаговый таймлайн транспортировки!
            </p>

            <div className="mt-8 flex items-center space-x-2 text-[10px] text-amber-400 font-mono">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-ping"></span>
              <span>Переход на вкладку «Заказы»...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
