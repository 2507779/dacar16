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
    <div className="flex flex-col text-neutral-900 pb-12 select-none">
      
      {/* Шапка Избранного */}
      <div className="px-4 pt-4 pb-3 border-b border-neutral-100 flex justify-between items-center bg-white/80 sticky top-0 backdrop-blur-md z-10">
        <div>
          <h2 className="font-display font-extrabold text-lg text-neutral-950">Избранные авто</h2>
          <p className="text-[10px] text-gray-400 mt-0.5">В списке: {favoriteCars.length}</p>
        </div>
        
        {favoriteCars.length >= 2 && (
          <button
            onClick={() => {
              triggerHaptic('medium');
              setIsCompareMode(!isCompareMode);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition active:scale-95 cursor-pointer ${
              isCompareMode
                ? 'bg-amber-400 text-neutral-950'
                : 'bg-neutral-950 text-white hover:bg-neutral-800'
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
          <div className="bg-white rounded-3xl p-8 border border-neutral-100 text-center flex flex-col items-center justify-center space-y-4 shadow-sm my-10">
            <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center text-amber-500 shadow-inner">
              <Heart className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-neutral-800">Список пуст</h4>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                Добавляйте понравившиеся автомобили из каталога в избранное, чтобы рассчитать финальную цену или сравнить их между собой.
              </p>
            </div>
            <button
              onClick={() => {
                triggerHaptic('medium');
                setCurrentTab('catalog');
              }}
              className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition flex items-center space-x-1.5"
            >
              <span>Открыть каталог</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : isCompareMode && favoriteCars.length >= 2 ? (
          /* Экран детального сравнения */
          <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm p-4">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4 flex items-center space-x-1">
              <Scale className="w-3.5 h-3.5 text-amber-500" />
              <span>Таблица сравнения характеристик</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="py-2.5 font-bold text-gray-400 uppercase text-[9px] w-[100px] shrink-0">Параметр</th>
                    {favoriteCars.map(car => (
                      <th key={car.id} className="py-2.5 px-3 font-display font-bold text-neutral-950 text-center min-w-[120px]">
                        {car.brand} <span className="text-amber-600 block">{car.model}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  <tr>
                    <td className="py-2.5 font-medium text-gray-500">Страна импорта</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-2.5 px-3 text-center font-semibold text-neutral-800">
                        {car.country === 'China' ? 'Китай 🇨🇳' : car.country === 'South Korea' ? 'Корея 🇰🇷' : 'Киргизия 🇰🇬'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-gray-500">Двигатель</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-2.5 px-3 text-center text-neutral-800 font-mono capitalize">
                        {car.engineType} ({car.engineVolume})
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-gray-500">Мощность</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-2.5 px-3 text-center font-bold text-neutral-900">
                        {car.power} л.с.
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-gray-500">Привод</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-2.5 px-3 text-center text-neutral-800">
                        {car.driveType}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-gray-500">Трансмиссия</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-2.5 px-3 text-center text-gray-600 text-[11px]">
                        {car.transmission}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-gray-500">Состояние / Год</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-2.5 px-3 text-center font-semibold">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                          car.condition === 'new' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {car.condition === 'new' ? 'Новый' : `${car.mileage.toLocaleString()} км`}
                        </span>
                        <span className="block text-[10px] text-gray-400 mt-1">{car.year} г.</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 font-medium text-gray-500">Доставка</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-2.5 px-3 text-center text-emerald-600 font-medium">
                        ~{car.deliveryDays} дней
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-amber-50/40">
                    <td className="py-3 font-bold text-neutral-950">Цена под ключ</td>
                    {favoriteCars.map(car => {
                      const calculated = calculateFullCarPrice(car);
                      return (
                        <td key={car.id} className="py-3 px-3 text-center">
                          <span className="font-display font-black text-amber-600 text-sm block">
                            {formatCurrency(calculated.finalPriceRUB)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-gray-500">Действие</td>
                    {favoriteCars.map(car => (
                      <td key={car.id} className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleOpenCar(car.id)}
                          className="bg-neutral-900 hover:bg-neutral-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold active:scale-95 transition cursor-pointer"
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
                  className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden flex shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-neutral-300 transition-all cursor-pointer group relative"
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
                      className="absolute top-2 left-2 p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition active:scale-90"
                      title="Удалить из избранного"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <h4 className="font-display font-bold text-sm text-neutral-950 truncate">
                          {car.brand} {car.model}
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {car.year} г. • {car.power} л.с.
                        </p>
                      </div>
                      <span className="bg-neutral-100 text-neutral-600 text-[8px] font-bold px-2 py-0.5 rounded-md shrink-0 uppercase tracking-wider ml-1">
                        {car.country === 'China' ? 'КНР 🇨🇳' : car.country === 'South Korea' ? 'Корея 🇰🇷' : 'КР 🇰🇬'}
                      </span>
                    </div>

                    <div className="flex justify-between items-end border-t border-neutral-50 pt-1.5 mt-1.5">
                      <span className="text-[9px] text-emerald-600 font-semibold flex items-center space-x-0.5">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>Доставка ~{car.deliveryDays} дней</span>
                      </span>
                      <div className="text-right">
                        <span className="font-display font-extrabold text-amber-600 text-sm">
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
