/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  const handlePrevSlide = useCallback(() => {
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
  }, [currentSlideIndex, carIndex, cars, setActiveStoryCarId]);

  const handleNextSlide = useCallback(() => {
    if (!car) return;
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
  }, [currentSlideIndex, car, carIndex, cars, setActiveStoryCarId]);

  // Эффект для автоматического перехода на следующий слайд при достижении 100% прогресса
  useEffect(() => {
    if (progress >= 100) {
      handleNextSlide();
    }
  }, [progress, handleNextSlide]);

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
          return 100;
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

  const handleClose = () => {
    triggerHaptic('medium');
    setActiveStoryCarId(null);
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      triggerHaptic('error');
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

  // Кастомные фичи в левом столбце
  const defaultFeatures = [
    { title: 'Премиум дизайн', desc: 'и технологичный комфорт' },
    { title: 'Эксклюзивность', desc: 'бизнес-класс в каждой детали' },
    { title: 'Надёжность', desc: `безупречные стандарты ${car.brand}` },
    { title: 'Динамика', desc: 'идеальный отклик и управляемость' },
    { title: 'Инновации', desc: car.engineType === 'electric' ? 'бесшумный драйв и экономия' : 'умные электронные ассистенты' }
  ];

  const getEngineLabel = () => {
    if (car.engineType === 'electric') return 'Электро';
    if (car.engineType === 'hybrid') return 'Гибрид';
    if (car.engineType === 'diesel') return 'Дизель';
    return 'Бензин';
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-md z-50 flex items-center justify-center select-none overflow-hidden">
      {/* Контейнер сторис */}
      <div className="w-full h-full max-w-[440px] bg-[#FAF8F5] flex flex-col justify-between relative shadow-2xl overflow-y-auto scrollbar-none sm:rounded-[40px]">
        
        {/* ФОНОВЫЕ СВЕЧЕНИЯ */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[50%] bg-[#C5A880]/8 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] bg-[#C5A880]/4 rounded-full blur-3xl pointer-events-none"></div>

        {/* ШАПКА: Прогресс-бары и Кнопки управления */}
        <div className="absolute top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/50 via-black/20 to-transparent p-4 flex flex-col space-y-3 shrink-0">
          
          {/* Индикаторы прогресса */}
          <div className="flex space-x-1 w-full">
            {car.images.map((_, idx) => (
              <div key={idx} className="h-1 flex-1 bg-white/35 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-[50ms]" 
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
              <div className="w-9 h-9 bg-white border border-white/20 rounded-xl flex items-center justify-center shadow-lg">
                <span className="font-display font-black text-[13px] text-[#C5A880]">DA</span>
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  <span className="font-display font-bold text-xs uppercase tracking-wider text-white">DA!CAR Premium</span>
                  <BadgeCheck className="w-3.5 h-3.5 text-[#C5A880] fill-white" />
                </div>
                <span className="text-[9px] text-white/85">АВТО ПОД ЗАКАЗ • КОРЕЯ & КИТАЙ</span>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setIsPaused(p => !p)} 
                className="p-1.5 hover:bg-white/10 rounded-full text-white/80 active:scale-95 transition"
                title={isPaused ? 'Возобновить' : 'Пауза'}
              >
                <span className="text-[10px] bg-white/25 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 font-bold tracking-wide uppercase text-white shadow-sm">
                  {isPaused ? 'Пауза ⏸' : 'Активно ⏺'}
                </span>
              </button>
              <button 
                onClick={handleClose} 
                className="p-1.5 bg-black/35 backdrop-blur-md border border-white/25 rounded-full text-white hover:bg-black/50 active:scale-90 transition cursor-pointer"
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

        {/* ГЛАВНЫЙ СЛАЙД С КАРТОЧКОЙ В СТИЛЕ ПЛАКАТА */}
        <div className="flex-1 w-full bg-[#FAF8F5] px-4 pt-16 pb-4 flex flex-col justify-between overflow-y-auto scrollbar-none relative z-10">
          
          {/* 1. ШАПКА КАРТОЧКИ */}
          <div className="flex justify-between items-center border-b border-[#EFEBE4] pb-2.5 mt-3 shrink-0">
            <div className="flex flex-col">
              <span className="font-display font-black text-xl text-[#1C1917] tracking-tight flex items-center">
                DA<span className="text-[#C5A880]">!</span>CAR
              </span>
              <span className="text-[7.5px] uppercase tracking-[0.12em] text-[#78716C] font-bold">
                АВТО ПОД ЗАКАЗ ИЗ КОРЕИ И КИТАЯ
              </span>
            </div>
            <div className="bg-[#C5A880]/10 border border-[#C5A880]/20 px-2 py-1 rounded flex items-center space-x-1 shrink-0 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C5A880]" />
              <span className="text-[7.5px] font-black uppercase text-[#1C1917] tracking-wide">
                Проверенные авто с гарантией
              </span>
            </div>
          </div>

          {/* 2. БОЛЬШОЙ ЗАГОЛОВОК И ДИНАМИЧНЫЕ ФИЧИ */}
          <div className="mt-4 flex flex-col shrink-0">
            <div className="flex flex-col">
              <h1 className="font-display font-black text-3xl text-[#1C1917] uppercase leading-none tracking-tight">
                {car.brand}
              </h1>
              <h2 className="font-display font-bold text-2xl text-[#C5A880] uppercase leading-none tracking-tight mt-0.5">
                {car.model}
              </h2>
            </div>
            
            <p className="text-[9.5px] font-semibold text-[#78716C] uppercase tracking-wider mt-2 bg-white py-1 px-2.5 rounded-lg border border-[#EFEBE4] inline-block self-start shadow-sm">
              {car.engineVolume} {getEngineLabel()} • {car.power} л.с. • {car.transmission} • {car.driveType}
            </p>
          </div>

          {/* 3. ОСНОВНОЙ РАЗДЕЛ: ФИЧИ СЛЕВА + КАРТИНКА СПРАВА */}
          <div className="mt-4 flex items-center justify-between min-h-[170px] shrink-0">
            {/* Описание и фичи слева с красивыми синими иконками */}
            <div className="w-[45%] flex flex-col space-y-3.5 z-10">
              {defaultFeatures.map((feat, i) => (
                <div key={i} className="flex items-start space-x-1.5">
                  <div className="w-4 h-4 bg-[#C5A880]/15 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-[#C5A880]/25">
                    <Sparkles className="w-2.5 h-2.5 text-[#C5A880]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8.5px] font-bold text-[#1C1917] leading-tight">
                      {feat.title}
                    </span>
                    <span className="text-[8px] text-[#78716C] leading-tight">
                      {feat.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Картинка автомобиля справа */}
            <div className="w-[53%] h-44 relative flex items-center justify-center">
              {/* Фоновая декоративная плашка */}
              <div className="absolute inset-0 bg-white/50 rounded-2xl border border-[#EFEBE4] transform rotate-3 scale-95 pointer-events-none"></div>
              
              <motion.div 
                key={currentSlideIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full h-40 rounded-2xl overflow-hidden shadow-lg border border-white z-10 relative"
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

          {/* 4. СЕТКА ИНДИКАТОРОВ ТЕХНИЧЕСКИХ ДАННЫХ */}
          <div className="mt-4 grid grid-cols-3 gap-2 shrink-0">
            {/* ПРОБЕГ */}
            <div className="bg-white border border-[#EFEBE4] p-2 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
              <Activity className="w-4 h-4 text-[#C5A880] mb-1" />
              <span className="text-[7.5px] font-bold text-[#78716C] uppercase tracking-wider">Пробег</span>
              <span className="text-[9.5px] font-black text-[#1C1917] mt-0.5">
                {car.condition === 'new' ? '0 км (Новый)' : `${car.mileage.toLocaleString('ru-RU')} км`}
              </span>
            </div>

            {/* ОКРАС */}
            <div className="bg-white border border-[#EFEBE4] p-2 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
              <Award className="w-4 h-4 text-[#C5A880] mb-1" />
              <span className="text-[7.5px] font-bold text-[#78716C] uppercase tracking-wider">Окрас</span>
              <span className="text-[9.5px] font-black text-[#1C1917] mt-0.5">Заводской</span>
            </div>

            {/* ГОД ВЫПУСКА */}
            <div className="bg-white border border-[#EFEBE4] p-2 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
              <Calendar className="w-4 h-4 text-[#C5A880] mb-1" />
              <span className="text-[7.5px] font-bold text-[#78716C] uppercase tracking-wider">Год выпуска</span>
              <span className="text-[9.5px] font-black text-[#1C1917] mt-0.5">{car.year}</span>
            </div>

            {/* ДВИГАТЕЛЬ */}
            <div className="bg-white border border-[#EFEBE4] p-2 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
              <Wrench className="w-4 h-4 text-[#C5A880] mb-1" />
              <span className="text-[7.5px] font-bold text-[#78716C] uppercase tracking-wider">Двигатель</span>
              <span className="text-[9.5px] font-black text-[#1C1917] mt-0.5 truncate max-w-full">
                {car.engineVolume} ({car.power} лс)
              </span>
            </div>

            {/* КОРОБКА ПЕРЕДАЧ */}
            <div className="bg-white border border-[#EFEBE4] p-2 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
              <Zap className="w-4 h-4 text-[#C5A880] mb-1" />
              <span className="text-[7.5px] font-bold text-[#78716C] uppercase tracking-wider">Коробка</span>
              <span className="text-[9.5px] font-black text-[#1C1917] mt-0.5">
                {car.transmission === 'Automatic' ? 'АКПП' : car.transmission === 'Robotic' ? 'Робот' : car.transmission === 'Single-speed' ? 'Редуктор' : 'МКПП'}
              </span>
            </div>

            {/* ПРИВОД */}
            <div className="bg-white border border-[#EFEBE4] p-2 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
              <Info className="w-4 h-4 text-[#C5A880] mb-1" />
              <span className="text-[7.5px] font-bold text-[#78716C] uppercase tracking-wider">Привод</span>
              <span className="text-[9.5px] font-black text-[#1C1917] mt-0.5">{car.driveType}</span>
            </div>
          </div>

          {/* 5. ИНТЕРАКТИВНЫЙ РАСЧЕТ СТОИМОСТИ ПОД КЛЮЧ */}
          <div className="mt-4 bg-gradient-to-br from-[#C5A880] to-[#B0936B] text-[#1C1917] rounded-2xl p-4 shadow-[0_12px_24px_rgba(197,168,128,0.16)] shrink-0 relative">
            <div className="flex justify-between items-center">
              <span className="text-[8px] uppercase tracking-[0.12em] font-black text-[#1C1917]/90">
                Стоимость под ключ в город:
              </span>
              
              {/* Селектор городов */}
              <div className="relative">
                <select 
                  value={selectedCity} 
                  onChange={(e) => {
                    triggerHaptic('light');
                    setSelectedCity(e.target.value);
                  }}
                  className="bg-black/10 text-[#1C1917] text-[9px] font-black px-2 py-1 rounded border border-[#1C1917]/10 outline-none cursor-pointer pr-1"
                >
                  {DELIVERY_CITIES.map(c => (
                    <option key={c.name} value={c.name} className="bg-[#FAF8F5] text-[#1C1917] text-[9px]">
                      {c.name.split(' ')[0]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Крупный ценник */}
            <div className="flex items-baseline space-x-1.5 mt-2.5">
              <span className="text-[10px] font-bold text-[#1C1917]/75 uppercase">ОТ</span>
              <span className="font-display font-black text-2xl text-[#1C1917] leading-none">
                {formatCurrency(calculated.finalPriceRUB).replace('₽', '')}
              </span>
              <span className="text-xs font-black text-[#1C1917]">РУБ.</span>
            </div>

            {/* Описание "включено всё" */}
            <div className="mt-2.5 bg-[#FAF8F5]/35 border border-[#1C1917]/10 px-2 py-1.5 rounded text-center">
              <span className="text-[7px] uppercase tracking-wider text-[#1C1917] font-black block">
                Включено всё: Автомобиль + Доставка + Таможня + ЭПТС + Утильсбор РФ
              </span>
            </div>
          </div>

          {/* 6. ТЕЗИСЫ ЛОГИСТИКИ И ФУТЕР */}
          <div className="mt-4 border-t border-[#EFEBE4] pt-3.5 flex flex-col shrink-0">
            {/* Тезные полосы */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mb-3">
              <div className="flex items-center space-x-1">
                <Check className="w-3 h-3 text-[#C5A880] shrink-0" />
                <span className="text-[7.5px] font-bold text-[#78716C] uppercase">Проверка перед покупкой</span>
              </div>
              <div className="flex items-center space-x-1">
                <Check className="w-3 h-3 text-[#C5A880] shrink-0" />
                <span className="text-[7.5px] font-bold text-[#78716C] uppercase">Таможня & ЭПТС под ключ</span>
              </div>
              <div className="flex items-center space-x-1">
                <Check className="w-3 h-3 text-[#C5A880] shrink-0" />
                <span className="text-[7.5px] font-bold text-[#78716C] uppercase">Доставка до {selectedCity.split(' ')[0]}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Check className="w-3 h-3 text-[#C5A880] shrink-0" />
                <span className="text-[7.5px] font-bold text-[#78716C] uppercase">Полное сопровождение</span>
              </div>
            </div>

            {/* Текстовый адресный футер */}
            <div className="flex justify-between items-center text-[7.5px] font-bold text-[#78716C] uppercase tracking-wide border-t border-[#EFEBE4] pt-2.5">
              <span>dacar-import.ru</span>
              <span className="flex items-center space-x-0.5">
                <MapPin className="w-2.5 h-2.5 text-[#78716C]" />
                <span>г. Казань, ул. Серова, д. 48</span>
              </span>
            </div>
          </div>

        </div>

        {/* СЕГМЕНТ 7: КНОПКА ЗАКАЗА */}
        <div className="bg-white border-t border-[#EFEBE4] p-4 shrink-0 relative z-40">
          <button 
            onClick={() => {
              triggerHaptic('medium');
              setShowOrderForm(true);
            }}
            className="w-full bg-[#C5A880] hover:bg-[#B0936B] text-[#1C1917] font-display font-black text-xs uppercase py-3.5 px-4 rounded-xl shadow-lg transition active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-[#1C1917]" />
            <span>Оставить заявку в 1 клик</span>
          </button>
        </div>

      </div>

      {/* ШИТ ДЛЯ ПОЛУЧЕНИЯ ЗАЯВКИ */}
      <AnimatePresence>
        {showOrderForm && (
          <>
            {/* Затемнение */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
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
              className="fixed bottom-0 left-0 right-0 max-w-[440px] mx-auto bg-[#FAF8F5] border-t border-[#EFEBE4] rounded-t-[32px] p-6 z-50 select-none text-[#1C1917] shadow-2xl"
            >
              <div className="w-12 h-1 bg-[#EFEBE4] rounded-full mx-auto mb-5"></div>

              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="font-display font-bold text-base text-[#1C1917]">Быстрый заказ</h3>
                  <p className="text-[10px] text-[#78716C] mt-0.5 font-medium">Оставьте контакты, менеджер перезвонит через 5 минут</p>
                </div>
                <button 
                  onClick={() => setShowOrderForm(false)}
                  className="p-1.5 bg-[#FAF8F5] hover:bg-[#EFEBE4] rounded-full text-[#78716C] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {orderSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center flex flex-col items-center justify-center space-y-3 my-4"
                >
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 animate-bounce">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-emerald-600">Заявка принята!</h4>
                    <p className="text-[10px] text-[#78716C] mt-1 leading-relaxed">
                      Автомобиль {car.brand} {car.model} забронирован за вами. Менеджер свяжется с вами по номеру в ближайшее время.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleOrderSubmit} className="space-y-4">
                  
                  {/* Описание выбранного авто */}
                  <div className="bg-[#FAF8F5] border border-[#EFEBE4] p-3 rounded-xl flex items-center space-x-3">
                    <img 
                      src={car.images[0]} 
                      alt="" 
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-[#1C1917]">{car.brand} {car.model}</h4>
                      <p className="text-[9px] text-[#C5A880] font-black mt-0.5">
                        {formatCurrency(calculated.finalPriceRUB)} • дост. до {selectedCity.split(' ')[0]}
                      </p>
                    </div>
                  </div>

                  {/* Поле имени */}
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">Ваше имя</label>
                    <input 
                      type="text" 
                      placeholder="Иван Иванов"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#EFEBE4] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] outline-none focus:border-[#C5A880] font-sans font-semibold transition"
                      required
                    />
                  </div>

                  {/* Поле телефона */}
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#78716C]">Телефон для связи</label>
                    <input 
                      type="tel" 
                      placeholder="+7 (999) 123-45-67"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#EFEBE4] rounded-xl px-3.5 py-2.5 text-xs text-[#1C1917] outline-none focus:border-[#C5A880] font-sans font-semibold transition"
                      required
                    />
                  </div>

                  {/* Кнопка отправки */}
                  <button 
                    type="submit"
                    className="w-full bg-[#C5A880] hover:bg-[#B0936B] text-[#1C1917] font-display font-black text-xs uppercase py-3.5 px-4 rounded-xl shadow-lg transition active:scale-[0.98] flex items-center justify-center space-x-1.5 cursor-pointer mt-4"
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
