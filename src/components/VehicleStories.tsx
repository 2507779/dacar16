/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { calculateFullCarPrice, formatCurrency, DELIVERY_CITIES } from '../data/cars';
import { triggerHaptic } from '../utils/haptics';
import { 
  X, Check, ChevronLeft, ChevronRight, Truck, Info, 
  MapPin, ShieldCheck, Sparkles, Calendar, BadgeCheck, Zap,
  Wrench, Activity, ChevronRight as ChevronRightIcon, Award, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function VehicleStories() {
  const { 
    activeStoryCarId, 
    setActiveStoryCarId, 
    cars, 
    addOrder 
  } = useStore();

  const car = cars.find(c => c.id === activeStoryCarId);

  // Стейт текущего слайда изображения внутри истории
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Казань (Главный филиал)');
  const [showOrderForm, setShowOrderForm] = useState(false);

  // Поля формы заказа в 1 клик
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Реф для отслеживания таймера
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Общий список авто в сторис (для перелистывания между машинами)
  const carIndex = car ? cars.findIndex(c => c.id === car.id) : -1;

  useEffect(() => {
    if (!car) return;
    // При смене машины сбрасываем индекс слайда и прогресс
    setCurrentSlideIndex(0);
    setProgress(0);
    setIsPaused(false);
    setShowOrderForm(false);
    setOrderSuccess(false);
  }, [activeStoryCarId]);

  // Эффект для анимации прогресс-бара
  useEffect(() => {
    if (!car || isPaused || showOrderForm) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const duration = 5000; // 5 секунд на слайд
    const step = 50; // обновление каждые 50мс
    const progressStep = (step / duration) * 100;

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Время вышло, переходим на следующий слайд
          handleNextSlide();
          return 0;
        }
        return prev + progressStep;
      });
    }, step);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [car, currentSlideIndex, isPaused, showOrderForm]);

  if (!car) return null;

  const calculated = calculateFullCarPrice(car, selectedCity);

  const handlePrevSlide = () => {
    triggerHaptic('light');
    setProgress(0);
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    } else {
      // Переходим к предыдущей машине
      const prevIndex = carIndex - 1;
      if (prevIndex >= 0) {
        setActiveStoryCarId(cars[prevIndex].id);
      } else {
        // Если это первая машина, перезапускаем текущую историю с начала
        setCurrentSlideIndex(0);
      }
    }
  };

  const handleNextSlide = () => {
    triggerHaptic('light');
    setProgress(0);
    if (currentSlideIndex < car.images.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    } else {
      // Переходим к следующей машине
      const nextIndex = carIndex + 1;
      if (nextIndex < cars.length) {
        setActiveStoryCarId(cars[nextIndex].id);
      } else {
        // Если это последняя машина, закрываем истории
        setActiveStoryCarId(null);
      }
    }
  };

  const handleClose = () => {
    triggerHaptic('medium');
    setActiveStoryCarId(null);
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      triggerHaptic('error');
      alert('Пожалуйста, заполните имя и телефон!');
      return;
    }

    addOrder(car, name, phone, selectedCity);
    triggerHaptic('success');
    setOrderSuccess(true);
    setName('');
    setPhone('');
    
    setTimeout(() => {
      setShowOrderForm(false);
      setOrderSuccess(false);
    }, 2500);
  };

  // Кастомные фичи в левом столбце (чтобы сочетались с картинкой справа)
  const defaultFeatures = [
    { title: 'Стильный дизайн', desc: 'и премиальный комфорт' },
    { title: 'Комфорт', desc: 'бизнес-класса на любых дорогах' },
    { title: 'Надёжность', desc: `и безупречное качество ${car.brand}` },
    { title: 'Отличная', desc: 'управляемость и энергоемкая подвеска' },
    { title: 'Экономия', desc: car.engineType === 'electric' ? 'на зарядке и бесплатный проезд' : 'топлива с современным мотором' }
  ];

  const getEngineLabel = () => {
    if (car.engineType === 'electric') return 'Электро';
    if (car.engineType === 'hybrid') return 'Гибрид';
    if (car.engineType === 'diesel') return 'Дизель';
    return 'Бензин';
  };

  return (
    <div className="fixed inset-0 bg-neutral-950 z-50 flex items-center justify-center select-none overflow-hidden">
      {/* Контейнер сторис (эмулирует мобильный телефон на десктопе, на мобилке на весь экран) */}
      <div className="w-full h-full max-w-[440px] bg-neutral-900 flex flex-col justify-between relative shadow-2xl overflow-y-auto scrollbar-none">
        
        {/* ФОНОВЫЕ СВЕЧЕНИЯ */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[50%] bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* ШАПКА: Прогресс-бары и Кнопки управления */}
        <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 flex flex-col space-y-3 shrink-0">
          
          {/* Индикаторы прогресса */}
          <div className="flex space-x-1 w-full">
            {car.images.map((_, idx) => (
              <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400 transition-all duration-[50ms]" 
                  style={{ 
                    width: idx < currentSlideIndex 
                      ? '100%' 
                      : idx === currentSlideIndex 
                        ? `${progress}%` 
                        : '0%' 
                  }}
                />
              </div>
            ))}
          </div>

          {/* Бренд, статус и кнопка Закрыть */}
          <div className="flex justify-between items-center text-white">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 bg-neutral-900 border border-amber-400/40 rounded-xl flex items-center justify-center shadow-lg">
                <span className="font-display font-black text-[13px] text-amber-400">DA</span>
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  <span className="font-display font-bold text-xs uppercase tracking-wider text-neutral-100">DA!CAR Premium</span>
                  <BadgeCheck className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>
                <span className="text-[9px] text-gray-400">АВТО ПОД ЗАКАЗ • КОРЕЯ & КИТАЙ</span>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setIsPaused(p => !p)} 
                className="p-1.5 hover:bg-white/10 rounded-full text-white/80 active:scale-95 transition"
                title={isPaused ? 'Возобновить' : 'Пауза'}
              >
                <span className="text-[10px] bg-neutral-800/80 px-2 py-0.5 rounded-md border border-neutral-700 font-bold tracking-wide uppercase text-amber-400">
                  {isPaused ? 'Пауза ⏸' : 'Эфир ⏺'}
                </span>
              </button>
              <button 
                onClick={handleClose} 
                className="p-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-black/60 active:scale-90 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* КЛИК-ЗОНЫ ДЛЯ НАВИГАЦИИ (ЛЕВАЯ И ПРАВАЯ 1/3 ЭКРАНА) */}
        <div className="absolute inset-x-0 top-20 bottom-32 z-30 flex pointer-events-none">
          <div 
            className="w-[30%] h-full pointer-events-auto cursor-w-resize" 
            onClick={handlePrevSlide}
          />
          <div 
            className="w-[40%] h-full pointer-events-none" 
            onMouseDown={() => setIsPaused(true)}
            onMouseUp={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
          />
          <div 
            className="w-[30%] h-full pointer-events-auto cursor-e-resize" 
            onClick={handleNextSlide}
          />
        </div>

        {/* ГЛАВНЫЙ СЛАЙД С КАРТОЧКОЙ В СТИЛЕ ПЛАКАТА (ИЗ ВЛОЖЕНИЯ) */}
        <div className="flex-1 w-full bg-neutral-50 px-4 pt-16 pb-4 flex flex-col justify-between overflow-y-auto scrollbar-none relative z-10">
          
          {/* 1. ШАПКА КАРТОЧКИ (DA!CAR АВТО ПОД ЗАКАЗ) */}
          <div className="flex justify-between items-center border-b border-neutral-200/80 pb-2.5 mt-3 shrink-0">
            <div className="flex flex-col">
              <span className="font-display font-black text-xl text-neutral-950 tracking-tight flex items-center">
                DA<span className="text-amber-500">!</span>CAR
              </span>
              <span className="text-[7.5px] uppercase tracking-[0.12em] text-neutral-500 font-bold">
                АВТО ПОД ЗАКАЗ ИЗ КОРЕИ И КИТАЯ
              </span>
            </div>
            <div className="bg-amber-400/10 border border-amber-500/30 px-2 py-1 rounded flex items-center space-x-1 shrink-0 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[7.5px] font-black uppercase text-neutral-900 tracking-wide">
                Проверенные авто с гарантией
              </span>
            </div>
          </div>

          {/* 2. БОЛЬШОЙ ЗАГОЛОВОК И ДИНАМИЧНЫЕ ФИЧИ */}
          <div className="mt-4 flex flex-col shrink-0">
            <div className="flex flex-col">
              <h1 className="font-display font-black text-3xl text-neutral-950 uppercase leading-none tracking-tight">
                {car.brand}
              </h1>
              <h2 className="font-display font-bold text-2xl text-amber-600 uppercase leading-none tracking-tight mt-0.5">
                {car.model}
              </h2>
            </div>
            
            <p className="text-[9.5px] font-semibold text-neutral-500 uppercase tracking-wider mt-2 bg-neutral-100 py-1 px-2.5 rounded-lg border border-neutral-200/40 inline-block self-start">
              {car.engineVolume} {getEngineLabel()} • {car.power} л.с. • {car.transmission} • {car.driveType}
            </p>
          </div>

          {/* 3. ОСНОВНОЙ РАЗДЕЛ: ФИЧИ СЛЕВА + КАРТИНКА СПРАВА */}
          <div className="mt-4 flex items-center justify-between min-h-[170px] shrink-0">
            {/* Описание и фичи слева с красивыми золотыми иконками */}
            <div className="w-[45%] flex flex-col space-y-3.5 z-10">
              {defaultFeatures.map((feat, i) => (
                <div key={i} className="flex items-start space-x-1.5">
                  <div className="w-4 h-4 bg-amber-400/20 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-amber-400/40">
                    <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8.5px] font-bold text-neutral-900 leading-tight">
                      {feat.title}
                    </span>
                    <span className="text-[8px] text-neutral-500 leading-tight">
                      {feat.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Картинка автомобиля справа - крупная и красивая с эффектом наклона и тени */}
            <div className="w-[53%] h-44 relative flex items-center justify-center">
              {/* Фоновая декоративная плашка */}
              <div className="absolute inset-0 bg-neutral-200/50 rounded-2xl transform rotate-3 scale-95 pointer-events-none"></div>
              
              <motion.div 
                key={currentSlideIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full h-40 rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-white z-10 relative"
              >
                <img 
                  src={car.images[currentSlideIndex]} 
                  alt={`${car.brand} ${car.model}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-[8px] font-bold text-white px-1.5 py-0.5 rounded">
                  Фото {currentSlideIndex + 1}/{car.images.length}
                </span>
              </motion.div>
            </div>
          </div>

          {/* 4. СЕТКА ИНДИКАТОРОВ ТЕХНИЧЕСКИХ ДАННЫХ (6 БЛОКОВ КАК В ПРИЛОЖЕННОМ ИЗОБРАЖЕНИИ) */}
          <div className="mt-4 grid grid-cols-3 gap-2 shrink-0">
            {/* ПРОБЕГ */}
            <div className="bg-white border border-neutral-200/60 p-2 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
              <Activity className="w-4 h-4 text-amber-600 mb-1" />
              <span className="text-[7.5px] font-bold text-neutral-400 uppercase tracking-wider">Пробег</span>
              <span className="text-[9.5px] font-black text-neutral-900 mt-0.5">
                {car.condition === 'new' ? '0 км (Новый)' : `${car.mileage.toLocaleString('ru-RU')} км`}
              </span>
            </div>

            {/* ОКРАС */}
            <div className="bg-white border border-neutral-200/60 p-2 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
              <Award className="w-4 h-4 text-amber-600 mb-1" />
              <span className="text-[7.5px] font-bold text-neutral-400 uppercase tracking-wider">Окрас</span>
              <span className="text-[9.5px] font-black text-neutral-900 mt-0.5">Заводской</span>
            </div>

            {/* ГОД ВЫПУСКА */}
            <div className="bg-white border border-neutral-200/60 p-2 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
              <Calendar className="w-4 h-4 text-amber-600 mb-1" />
              <span className="text-[7.5px] font-bold text-neutral-400 uppercase tracking-wider">Год выпуска</span>
              <span className="text-[9.5px] font-black text-neutral-900 mt-0.5">{car.year}</span>
            </div>

            {/* ДВИГАТЕЛЬ */}
            <div className="bg-white border border-neutral-200/60 p-2 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
              <Wrench className="w-4 h-4 text-amber-600 mb-1" />
              <span className="text-[7.5px] font-bold text-neutral-400 uppercase tracking-wider">Двигатель</span>
              <span className="text-[9.5px] font-black text-neutral-900 mt-0.5 truncate max-w-full">
                {car.engineVolume} ({car.power} лс)
              </span>
            </div>

            {/* КОРОБКА ПЕРЕДАЧ */}
            <div className="bg-white border border-neutral-200/60 p-2 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
              <Zap className="w-4 h-4 text-amber-600 mb-1" />
              <span className="text-[7.5px] font-bold text-neutral-400 uppercase tracking-wider">Коробка</span>
              <span className="text-[9.5px] font-black text-neutral-900 mt-0.5">
                {car.transmission === 'Automatic' ? 'АКПП' : car.transmission === 'Robotic' ? 'Робот' : car.transmission === 'Single-speed' ? 'Редуктор' : 'МКПП'}
              </span>
            </div>

            {/* ПРИВОД */}
            <div className="bg-white border border-neutral-200/60 p-2 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
              <Info className="w-4 h-4 text-amber-600 mb-1" />
              <span className="text-[7.5px] font-bold text-neutral-400 uppercase tracking-wider">Привод</span>
              <span className="text-[9.5px] font-black text-neutral-900 mt-0.5">{car.driveType}</span>
            </div>
          </div>

          {/* 5. ИНТЕРАКТИВНЫЙ РАСЧЕТ СТОИМОСТИ ПОД КЛЮЧ */}
          <div className="mt-4 bg-gradient-to-br from-neutral-900 to-neutral-950 text-white rounded-2xl p-3.5 border border-neutral-800 shrink-0 shadow-lg relative">
            <div className="flex justify-between items-center">
              <span className="text-[8px] uppercase tracking-[0.12em] font-black text-amber-400">
                Стоимость под ключ в город:
              </span>
              
              {/* Селектор городов внутри Stories */}
              <div className="relative">
                <select 
                  value={selectedCity} 
                  onChange={(e) => {
                    triggerHaptic('light');
                    setSelectedCity(e.target.value);
                  }}
                  className="bg-neutral-800 text-white text-[9px] font-bold px-2 py-1 rounded border border-neutral-700 outline-none cursor-pointer pr-1"
                >
                  {DELIVERY_CITIES.map(c => (
                    <option key={c.name} value={c.name} className="bg-neutral-900 text-white text-[9px]">
                      {c.name.split(' ')[0]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Крупный ценник */}
            <div className="flex items-baseline space-x-1.5 mt-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase">ОТ</span>
              <span className="font-display font-black text-2xl text-amber-400 leading-none">
                {formatCurrency(calculated.finalPriceRUB).replace('₽', '')}
              </span>
              <span className="text-xs font-bold text-amber-400">РУБ.</span>
            </div>

            {/* Описание "включено всё" */}
            <div className="mt-2 bg-neutral-800/40 border border-neutral-800 px-2 py-1 rounded text-center">
              <span className="text-[7px] uppercase tracking-wider text-gray-300 font-bold block">
                Включено всё: Автомобиль + Доставка + Таможня + ЭПТС + Утильсбор РФ
              </span>
            </div>
          </div>

          {/* 6. ТЕЗИСЫ ЛОГИСТИКИ И ФУТЕР */}
          <div className="mt-4 border-t border-neutral-200 pt-3.5 flex flex-col shrink-0">
            {/* Тезные полосы */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mb-3">
              <div className="flex items-center space-x-1">
                <Check className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="text-[7.5px] font-bold text-neutral-600 uppercase">Проверка перед покупкой</span>
              </div>
              <div className="flex items-center space-x-1">
                <Check className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="text-[7.5px] font-bold text-neutral-600 uppercase">Таможня & ЭПТС под ключ</span>
              </div>
              <div className="flex items-center space-x-1">
                <Check className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="text-[7.5px] font-bold text-neutral-600 uppercase">Доставка до {selectedCity.split(' ')[0]}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Check className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="text-[7.5px] font-bold text-neutral-600 uppercase">Полное сопровождение</span>
              </div>
            </div>

            {/* Текстовый адресный футер */}
            <div className="flex justify-between items-center text-[7.5px] font-bold text-neutral-400 uppercase tracking-wide border-t border-neutral-100 pt-2.5">
              <span>dacar-import.ru</span>
              <span className="flex items-center space-x-0.5">
                <MapPin className="w-2.5 h-2.5 text-neutral-400" />
                <span>г. Казань, ул. Серова, д. 48</span>
              </span>
            </div>
          </div>

        </div>

        {/* СЕГМЕНТ 7: КНОПКА ЗАКАЗА (ОСТАВИТЬ ЗАЯВКУ) ВНИЗУ */}
        <div className="bg-neutral-900 border-t border-neutral-800 p-4 shrink-0 relative z-40">
          <button 
            onClick={() => {
              triggerHaptic('medium');
              setShowOrderForm(true);
            }}
            className="w-full bg-amber-400 hover:bg-amber-300 text-neutral-950 font-display font-black text-xs uppercase py-3.5 px-4 rounded-xl shadow-lg transition active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-neutral-950" />
            <span>Оставить заявку в 1 клик</span>
          </button>
        </div>

      </div>

      {/* ШИТ ДЛЯ ПОЛУЧЕНИЯ ЗАЯВКИ (БЫСТРАЯ ФОРМА В 1 КЛИК С АНИМАЦИЕЙ) */}
      <AnimatePresence>
        {showOrderForm && (
          <>
            {/* Затемнение */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOrderForm(false)}
              className="fixed inset-0 bg-black z-50"
            />

            {/* Выдвижная панелька формы */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-[440px] mx-auto bg-neutral-900 border-t border-neutral-800 rounded-t-[32px] p-6 z-50 select-none text-white"
            >
              <div className="w-12 h-1 bg-neutral-700 rounded-full mx-auto mb-5"></div>

              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="font-display font-black text-base text-amber-400 uppercase">Быстрый заказ</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Оставьте контакты, менеджер перезвонит через 5 минут</p>
                </div>
                <button 
                  onClick={() => setShowOrderForm(false)}
                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-full text-gray-400 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {orderSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center flex flex-col items-center justify-center space-y-3 my-4"
                >
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-emerald-400">Заявка принята!</h4>
                    <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                      Автомобиль {car.brand} {car.model} забронирован за вами. Менеджер свяжется с вами по номеру в ближайшее время.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleOrderSubmit} className="space-y-4">
                  
                  {/* Описание выбранного авто */}
                  <div className="bg-neutral-800/50 border border-neutral-800 p-3 rounded-xl flex items-center space-x-3">
                    <img 
                      src={car.images[0]} 
                      alt="" 
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-neutral-100">{car.brand} {car.model}</h4>
                      <p className="text-[9px] text-amber-400 font-bold mt-0.5">
                        {formatCurrency(calculated.finalPriceRUB)} • дост. до {selectedCity.split(' ')[0]}
                      </p>
                    </div>
                  </div>

                  {/* Поле имени */}
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Ваше имя</label>
                    <input 
                      type="text" 
                      placeholder="Иван Иванов"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-amber-400 font-sans transition"
                      required
                    />
                  </div>

                  {/* Поле телефона */}
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Телефон для связи</label>
                    <input 
                      type="tel" 
                      placeholder="+7 (999) 123-45-67"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-amber-400 font-sans transition"
                      required
                    />
                  </div>

                  {/* Кнопка отправки */}
                  <button 
                    type="submit"
                    className="w-full bg-amber-400 hover:bg-amber-300 text-neutral-950 font-display font-black text-xs uppercase py-3.5 px-4 rounded-xl shadow-lg transition active:scale-[0.98] flex items-center justify-center space-x-1.5 cursor-pointer mt-4"
                  >
                    <span>Отправить заявку менеджеру</span>
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
