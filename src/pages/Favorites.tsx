/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, calculateFullCarPrice, getCarImages } from '../data/cars';
import { triggerHaptic } from '../utils/haptics';
import { Heart, Sparkles, Plus, Scale, Trash2, ArrowRight, Check, CheckCircle2, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Favorites() {
  const { cars, favorites, toggleFavorite, setCurrentTab, setActiveCarId, selectedCity } = useStore();
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Получаем массив объектов Car, которые находятся в избранном
  const favoriteCars = cars.filter(car => favorites.includes(car.id));

  // Вычисление лучших показателей для подсветки (Feature 8)
  const maxPower = favoriteCars.length > 0 ? Math.max(...favoriteCars.map(c => c.power)) : 0;
  const lowestPrice = favoriteCars.length > 0 ? Math.min(...favoriteCars.map(c => {
    const calc = calculateFullCarPrice(c, selectedCity);
    return calc.finalPriceRUB;
  })) : 0;

  const handleRemoveFavorite = (e: React.MouseEvent, carId: string) => {
    e.stopPropagation();
    triggerHaptic('medium');
    toggleFavorite(carId);
  };

  const handleOpenCar = (carId: string) => {
    triggerHaptic('light');
    setActiveCarId(carId);
  };

  const handleShareComparison = () => {
    triggerHaptic('success');
    setIsShareModalOpen(true);
    setCopiedLink(false);
  };

  const handleCopyLink = () => {
    triggerHaptic('success');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="flex flex-col text-[#1C1917] pb-12 select-none bg-[#F0EEEC]">
      
      {/* Шапка Избранного */}
      <div className="px-4 pt-4 pb-3 border-b border-[#EFEBE4] flex justify-between items-center bg-[#F0EEEC]/95 sticky top-0 backdrop-blur-md z-10">
        <div>
          <h2 className="font-display font-black text-base text-[#1C1917] tracking-tight">Избранные авто</h2>
          <p className="text-[10px] text-[#78716C] mt-0.5 font-mono">В списке: {favoriteCars.length}</p>
        </div>
        
        <div className="flex space-x-2">
          {isCompareMode && favoriteCars.length >= 2 && (
            <button
              onClick={handleShareComparison}
              className="p-2.5 bg-white border border-[#EFEBE4] text-[#C5A880] rounded-xl active:scale-95 transition cursor-pointer shadow-sm"
              title="Поделиться сравнением"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          {favoriteCars.length >= 2 && (
            <button
              onClick={() => {
                triggerHaptic('medium');
                setIsCompareMode(!isCompareMode);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition active:scale-95 cursor-pointer border shadow-sm ${
                isCompareMode
                  ? 'bg-[#C5A880] border-[#C5A880] text-white shadow-md'
                  : 'bg-white border-[#EFEBE4] text-[#1C1917] hover:border-[#C5A880]/40 hover:bg-[#F0EEEC]'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>{isCompareMode ? 'Показать список' : 'Сравнить авто'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Контентная область */}
      <div className="px-4 mt-4">
        {favoriteCars.length === 0 ? (
          /* Пустое состояние */
          <div className="bg-white rounded-3xl p-8 border border-[#EFEBE4] text-center flex flex-col items-center justify-center space-y-4 shadow-md my-10">
            <div className="w-16 h-16 bg-[#F0EEEC] rounded-full flex items-center justify-center text-[#C5A880] border border-[#EFEBE4] shadow-inner animate-pulse">
              <Heart className="w-7 h-7 fill-[#C5A880]/20" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-[#1C1917]">Список пуст</h4>
              <p className="text-xs text-[#78716C] mt-1.5 leading-relaxed">
                Добавляйте понравившиеся автомобили из каталога в избранное, чтобы рассчитать финальную цену или сравнить их характеристики между собой.
              </p>
            </div>
            <button
              onClick={() => {
                triggerHaptic('medium');
                setCurrentTab('catalog');
              }}
              className="px-5 py-2.5 bg-[#C5A880] hover:bg-[#B0936B] text-white rounded-xl text-xs font-black cursor-pointer active:scale-95 transition flex items-center space-x-1.5 shadow-md"
            >
              <span>Открыть каталог</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : isCompareMode && favoriteCars.length >= 2 ? (
          /* Экран детального сравнения */
          <div className="bg-white rounded-3xl border border-[#EFEBE4] overflow-hidden shadow-lg p-4">
            <h4 className="text-[10px] font-bold text-[#78716C] uppercase tracking-widest mb-4 flex items-center space-x-1.5 font-mono">
              <Scale className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Таблица характеристик</span>
            </h4>
 
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EFEBE4]">
                    <th className="py-2.5 font-bold text-[#78716C] uppercase text-[9px] w-[100px] shrink-0 font-mono">Параметр</th>
                    {favoriteCars.map(car => (
                      <th key={car.id} className="py-2.5 px-3 font-display font-bold text-[#1C1917] text-center min-w-[120px]">
                        {car.brand} <span className="text-[#C5A880] block text-[10px] font-medium mt-0.5">{car.model}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEBE4]/50">
                  <tr>
                    <td className="py-2.5 font-medium text-[#78716C] font-sans">Страна импорта</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-2.5 px-3 text-center font-semibold text-[#1C1917]">
                        {car.country === 'China' ? 'Китай 🇨🇳' : car.country === 'South Korea' ? 'Корея 🇰🇷' : 'Киргизия 🇰🇬'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-[#78716C]">Двигатель</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-2.5 px-3 text-center text-[#1C1917] font-mono capitalize">
                        {car.engineType} ({car.engineVolume})
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-[#78716C]">Мощность</td>
                    {favoriteCars.map(car => {
                      const isBest = car.power === maxPower && favoriteCars.length > 1;
                      return (
                        <td key={car.id} className="py-2.5 px-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isBest ? 'bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/45 font-extrabold shadow-sm' : 'text-[#1C1917]'
                          }`}>
                            {car.power} л.с. {isBest && '🏆'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-[#78716C]">Привод</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-2.5 px-3 text-center text-[#1C1917]">
                        {car.driveType}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-[#78716C]">Трансмиссия</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-2.5 px-3 text-center text-[#78716C] text-[10px]">
                        {car.transmission}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-[#78716C]">Состояние / Год</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-2.5 px-3 text-center font-semibold">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md border ${
                          car.condition === 'new' 
                            ? 'bg-[#C5A880]/10 text-[#C5A880] border-[#C5A880]/20' 
                            : 'bg-[#1C1917]/10 text-[#1C1917] border-[#1C1917]/20'
                        }`}>
                          {car.condition === 'new' ? 'Новый' : `${car.mileage.toLocaleString()} км`}
                        </span>
                        <span className="block text-[9px] text-[#78716C] mt-1 font-mono">{car.year} г.</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-[#78716C]">Доставка</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-2.5 px-3 text-center text-emerald-600 font-bold">
                        ~{car.deliveryDays} дней
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-[#F0EEEC]">
                    <td className="py-3 font-bold text-[#1C1917]">Цена под ключ от</td>
                    {favoriteCars.map(car => {
                      const calculated = calculateFullCarPrice(car, selectedCity);
                      const isBest = calculated.finalPriceRUB === lowestPrice && favoriteCars.length > 1;
                      return (
                        <td key={car.id} className="py-3 px-3 text-center animate-fade-in">
                          <span className={`font-display font-black text-xs block ${
                            isBest ? 'text-emerald-600 font-extrabold text-[12.5px]' : 'text-[#C5A880]'
                          }`}>
                            {formatCurrency(calculated.finalPriceRUB, true)} {isBest && '🔥'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-[#78716C] font-mono">Действие</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleOpenCar(car.id)}
                          className="bg-[#C5A880] hover:bg-[#B0936B] text-white px-3 py-1.5 rounded-lg text-[9px] font-bold active:scale-95 transition-bezier cursor-pointer shadow-sm"
                        >
                          Открыть карточку
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Список избранного */
          <div className="space-y-3">
            {favoriteCars.map((car) => {
              const calculated = calculateFullCarPrice(car, selectedCity);
              return (
                <div
                  key={car.id}
                  onClick={() => handleOpenCar(car.id)}
                  className="bg-white border border-[#EFEBE4] hover:border-[#C5A880]/25 rounded-3xl overflow-hidden flex shadow-md cursor-pointer group relative"
                >
                  <div className="w-28 h-24 shrink-0 overflow-hidden relative">
                    <img
                      src={getCarImages(car)[0]}
                      alt={`${car.brand} ${car.model}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      onClick={(e) => handleRemoveFavorite(e, car.id)}
                      className="absolute top-2 left-2 p-1.5 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition active:scale-90"
                      title="Удалить из избранного"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between min-w-0 bg-white">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <h4 className="font-display font-bold text-xs text-[#1C1917] group-hover:text-[#C5A880] transition-colors truncate">
                          {car.brand} {car.model}
                        </h4>
                        <p className="text-[10px] text-[#78716C] mt-0.5">
                          {car.year} г. • {car.power} л.с.
                        </p>
                      </div>
                      <span className="bg-[#F0EEEC] border border-[#EFEBE4] text-[#1C1917] text-[8px] font-bold px-2 py-0.5 rounded-md shrink-0 uppercase tracking-wider ml-1">
                        {car.country === 'China' ? 'КНР 🇨🇳' : car.country === 'South Korea' ? 'Корея 🇰🇷' : 'КР 🇰🇬'}
                      </span>
                    </div>

                    <div className="flex justify-between items-end border-t border-[#EFEBE4]/40 pt-1.5 mt-1.5">
                      <span className="text-[9px] text-[#C5A880] font-bold flex items-center space-x-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>~{car.deliveryDays} дней</span>
                      </span>
                      <div className="text-right flex flex-col items-end">
                        <span className="text-[7px] text-[#78716C] uppercase tracking-widest font-mono block">Цена под ключ</span>
                        <span className="font-display font-black text-[#C5A880] text-xs block">
                          {formatCurrency(calculated.finalPriceRUB, true)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Feature 8: Попап "Поделиться Сравнением" */}
      <AnimatePresence>
        {isShareModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareModalOpen(false)}
              className="fixed inset-0 bg-black/70 z-50"
            ></motion.div>

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[380px] bg-white text-[#1C1917] border border-[#EFEBE4] rounded-3xl p-5 z-50 shadow-2xl select-none"
            >
              <div className="flex justify-between items-center border-b border-[#EFEBE4]/60 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Share2 className="w-5 h-5 text-[#C5A880]" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#1C1917]">Поделиться сравнением</h4>
                </div>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="text-stone-400 hover:text-stone-700 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] text-[#78716C] leading-relaxed">
                  Мы создали уникальную сводную визитную карточку вашего сравнения. Вы можете отправить её менеджеру или близким в Telegram.
                </p>

                {/* Флайер-сводка */}
                <div className="bg-[#F0EEEC] border border-[#C5A880]/30 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#C5A880]/5 rounded-full -mr-8 -mt-8 blur-md" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#C5A880] bg-[#C5A880]/15 px-2 py-0.5 rounded font-mono">
                      DA!CAR PREMIUM
                    </span>
                    <span className="text-[8.5px] text-[#78716C] font-mono">Сводка сравнения</span>
                  </div>

                  <div className="space-y-2 border-t border-[#EFEBE4] pt-2">
                    {favoriteCars.map((car, idx) => {
                      const calc = calculateFullCarPrice(car, selectedCity);
                      return (
                        <div key={car.id} className="flex justify-between items-center text-[10px] font-medium">
                          <span className="text-[#1C1917]">
                            {idx + 1}. {car.brand} {car.model} ({car.year})
                          </span>
                          <span className="text-[#C5A880] font-bold font-mono">
                            {formatCurrency(calc.finalPriceRUB, true)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-[8px] text-[#78716C] italic font-serif leading-tight pt-1">
                    *Расчет цен включает утильсбор РФ, таможенную декларацию и доставку.
                  </p>
                </div>

                <button
                  onClick={handleCopyLink}
                  className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    copiedLink
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                      : 'bg-[#C5A880] hover:bg-[#B0936B] text-white shadow-md'
                  }`}
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Скопировано в буфер!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Скопировать ссылку</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => setIsShareModalOpen(false)}
                className="w-full py-3 bg-[#1C1917] hover:bg-black text-stone-400 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition mt-3 cursor-pointer"
              >
                Закрыть
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
