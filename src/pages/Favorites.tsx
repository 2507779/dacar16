/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, calculateFullCarPrice } from '../data/cars';
import { triggerHaptic } from '../utils/haptics';
import { Heart, Sparkles, Plus, Scale, Trash2, ArrowRight, Check, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Favorites() {
  const { cars, favorites, toggleFavorite, setCurrentTab, setActiveCarId } = useStore();
  const [isCompareMode, setIsCompareMode] = useState(false);

  // Получаем массив объектов Car, которые находятся в избранном
  const favoriteCars = cars.filter(car => favorites.includes(car.id));

  const handleRemoveFavorite = (e: React.MouseEvent, carId: string) => {
    e.stopPropagation();
    triggerHaptic('medium');
    toggleFavorite(carId);
  };

  const handleOpenCar = (carId: string) => {
    triggerHaptic('light');
    setActiveCarId(carId);
  };

  return (
    <div className="flex flex-col text-[#111827] pb-12 select-none">
      
      {/* Шапка Избранного */}
      <div className="px-4 pt-4 pb-3 border-b border-[#E5E7EB] flex justify-between items-center bg-[#F5F7FA]/95 sticky top-0 backdrop-blur-md z-10">
        <div>
          <h2 className="font-display font-black text-base text-[#111827] tracking-tight">Избранные авто</h2>
          <p className="text-[10px] text-[#64748B] mt-0.5 font-mono">В списке: {favoriteCars.length}</p>
        </div>
        
        {favoriteCars.length >= 2 && (
          <button
            onClick={() => {
              triggerHaptic('medium');
              setIsCompareMode(!isCompareMode);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition active:scale-95 cursor-pointer border shadow-sm ${
              isCompareMode
                ? 'bg-[#2563EB] border-[#2563EB] text-white'
                : 'bg-white border-[#E5E7EB] text-[#111827] hover:border-[#2563EB]/40 hover:bg-[#F5F7FA]'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>{isCompareMode ? 'Показать список' : 'Сравнить авто'}</span>
          </button>
        )}
      </div>

      {/* Контентная область */}
      <div className="px-4 mt-4">
        {favoriteCars.length === 0 ? (
          /* Пустое состояние */
          <div className="bg-white rounded-3xl p-8 border border-[#E5E7EB] text-center flex flex-col items-center justify-center space-y-4 shadow-md my-10">
            <div className="w-16 h-16 bg-[#F5F7FA] rounded-full flex items-center justify-center text-[#2563EB] border border-[#E5E7EB] shadow-inner animate-pulse">
              <Heart className="w-7 h-7 fill-[#2563EB]/20" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-[#111827]">Список пуст</h4>
              <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                Добавляйте понравившиеся автомобили из каталога в избранное, чтобы рассчитать финальную цену или сравнить их характеристики между собой.
              </p>
            </div>
            <button
              onClick={() => {
                triggerHaptic('medium');
                setCurrentTab('catalog');
              }}
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition flex items-center space-x-1.5 shadow-md"
            >
              <span>Открыть каталог</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : isCompareMode && favoriteCars.length >= 2 ? (
          /* Экран детального сравнения */
          <div className="bg-white rounded-3xl border border-[#E5E7EB] overflow-hidden shadow-lg p-4">
            <h4 className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-4 flex items-center space-x-1.5 font-mono">
              <Scale className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Таблица характеристик</span>
            </h4>
 
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="py-2.5 font-bold text-[#64748B] uppercase text-[9px] w-[100px] shrink-0 font-mono">Параметр</th>
                    {favoriteCars.map(car => (
                      <th key={car.id} className="py-2.5 px-3 font-display font-bold text-[#111827] text-center min-w-[120px]">
                        {car.brand} <span className="text-[#2563EB] block text-[10px] font-medium mt-0.5">{car.model}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]/50">
                  <tr>
                    <td className="py-2.5 font-medium text-[#64748B] font-sans">Страна импорта</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-2.5 px-3 text-center font-semibold text-[#111827]">
                        {car.country === 'China' ? 'Китай 🇨🇳' : car.country === 'South Korea' ? 'Корея 🇰🇷' : 'Киргизия 🇰🇬'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-[#64748B]">Двигатель</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-2.5 px-3 text-center text-[#111827] font-mono capitalize">
                        {car.engineType} ({car.engineVolume})
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-[#64748B]">Мощность</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-2.5 px-3 text-center font-bold text-[#2563EB]">
                        {car.power} л.с.
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-[#64748B]">Привод</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-2.5 px-3 text-center text-[#111827]">
                        {car.driveType}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-[#64748B]">Трансмиссия</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-2.5 px-3 text-center text-[#64748B] text-[10px]">
                        {car.transmission}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-[#64748B]">Состояние / Год</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-2.5 px-3 text-center font-semibold">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md border ${
                          car.condition === 'new' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20'
                        }`}>
                          {car.condition === 'new' ? 'Новый' : `${car.mileage.toLocaleString()} км`}
                        </span>
                        <span className="block text-[9px] text-[#64748B] mt-1 font-mono">{car.year} г.</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-[#64748B]">Доставка</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-2.5 px-3 text-center text-emerald-600 font-bold">
                        ~{car.deliveryDays} дней
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-[#F5F7FA]">
                    <td className="py-3 font-bold text-[#111827]">Цена под ключ</td>
                    {favoriteCars.map(car => {
                      const calculated = calculateFullCarPrice(car);
                      return (
                        <td key={car.id} className="py-3 px-3 text-center">
                          <span className="font-display font-black text-[#2563EB] text-xs block">
                            {formatCurrency(calculated.finalPriceRUB)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-[#64748B] font-mono">Действие</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleOpenCar(car.id)}
                          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3 py-1.5 rounded-lg text-[9px] font-bold active:scale-95 transition-bezier cursor-pointer shadow-sm"
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
              const calculated = calculateFullCarPrice(car);
              return (
                <div
                  key={car.id}
                  onClick={() => handleOpenCar(car.id)}
                  className="bg-white border border-[#E5E7EB] hover:border-[#2563EB]/25 rounded-3xl overflow-hidden flex shadow-md cursor-pointer group relative"
                >
                  <div className="w-28 h-24 shrink-0 overflow-hidden relative">
                    <img
                      src={car.images[0]}
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
                        <h4 className="font-display font-bold text-xs text-[#111827] group-hover:text-[#2563EB] transition-colors truncate">
                          {car.brand} {car.model}
                        </h4>
                        <p className="text-[10px] text-[#64748B] mt-0.5">
                          {car.year} г. • {car.power} л.с.
                        </p>
                      </div>
                      <span className="bg-[#F5F7FA] border border-[#E5E7EB] text-[#111827] text-[8px] font-bold px-2 py-0.5 rounded-md shrink-0 uppercase tracking-wider ml-1">
                        {car.country === 'China' ? 'КНР 🇨🇳' : car.country === 'South Korea' ? 'Корея 🇰🇷' : 'КР 🇰🇬'}
                      </span>
                    </div>

                    <div className="flex justify-between items-end border-t border-[#E5E7EB]/40 pt-1.5 mt-1.5">
                      <span className="text-[9px] text-[#2563EB] font-bold flex items-center space-x-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>~{car.deliveryDays} дней</span>
                      </span>
                      <div className="text-right">
                        <span className="font-display font-black text-[#2563EB] text-xs">
                          {formatCurrency(calculated.finalPriceRUB)}
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
    </div>
  );
}
