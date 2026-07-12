/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, calculateFullCarPrice, EXCHANGE_RATES } from '../data/cars';
import { triggerHaptic } from '../utils/haptics';
import { Search, SlidersHorizontal, Grid, List, ArrowUpDown, X, Heart, Sparkles, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Catalog() {
  const {
    cars,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    resetFilters,
    setActiveCarId,
    setActiveStoryCarId,
    favorites,
    toggleFavorite
  } = useStore();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOption, setSortOption] = useState<'price_asc' | 'price_desc' | 'year_desc'>('year_desc');

  // Уникальные бренды в нашем каталоге
  const allBrands = Array.from(new Set(cars.map(c => c.brand)));

  // Фильтрация данных
  const filteredCars = cars.filter((car) => {
    // 1. Поиск по строке (бренд или модель)
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const matchBrand = car.brand.toLowerCase().includes(query);
      const matchModel = car.model.toLowerCase().includes(query);
      if (!matchBrand && !matchModel) return false;
    }

    // 2. Фильтр по стране
    if (filters.country && car.country !== filters.country) return false;

    // 3. Фильтр по состоянию (новые / с пробегом)
    if (filters.condition && car.condition !== filters.condition) return false;

    // 4. Фильтр по типу двигателя
    if (filters.fuel && car.engineType !== filters.fuel) return false;

    // 5. Фильтр по марке
    if (filters.brand && car.brand !== filters.brand) return false;

    // 6. Фильтр по максимальной цене в USD
    if (filters.priceMax && car.priceUSD > filters.priceMax) return false;

    return true;
  });

  // Сортировка данных
  const sortedCars = [...filteredCars].sort((a, b) => {
    const aPrice = calculateFullCarPrice(a).finalPriceRUB;
    const bPrice = calculateFullCarPrice(b).finalPriceRUB;

    if (sortOption === 'price_asc') return aPrice - bPrice;
    if (sortOption === 'price_desc') return bPrice - aPrice;
    if (sortOption === 'year_desc') return b.year - a.year;
    return 0;
  });

  const handleOpenFilters = () => {
    triggerHaptic('light');
    setIsFilterOpen(true);
  };

  const handleCloseFilters = () => {
    triggerHaptic('light');
    setIsFilterOpen(false);
  };

  const toggleSort = () => {
    triggerHaptic('light');
    if (sortOption === 'year_desc') {
      setSortOption('price_asc');
    } else if (sortOption === 'price_asc') {
      setSortOption('price_desc');
    } else {
      setSortOption('year_desc');
    }
  };

  const handleToggleFav = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    triggerHaptic('medium');
    toggleFavorite(id);
  };

  return (
    <div className="flex flex-col text-neutral-900 pb-12 select-none">
      
      {/* 1. Поисковая строка и Настройки вида */}
      <div className="px-4 pt-4 sticky top-0 bg-neutral-50/95 backdrop-blur-md z-10 pb-3 border-b border-neutral-100 flex flex-col space-y-3">
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-white border border-neutral-200 rounded-xl px-3 py-2 flex items-center space-x-2 shadow-sm focus-within:border-amber-400 transition-colors">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Марка, модель авто..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-neutral-900 outline-none w-full placeholder-gray-400 font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setSearchQuery('');
                }}
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          <button
            onClick={handleOpenFilters}
            className={`p-2.5 rounded-xl border flex items-center justify-center cursor-pointer transition ${
              Object.values(filters).some(v => v !== null)
                ? 'bg-amber-400 border-amber-400 text-neutral-950'
                : 'bg-white border-neutral-200 text-neutral-700'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Сортировка и вид */}
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center space-x-2 text-neutral-500">
            <span>Найдено: <b>{sortedCars.length}</b></span>
            <span>•</span>
            <button
              onClick={toggleSort}
              className="font-semibold text-neutral-800 flex items-center space-x-1 hover:text-amber-600"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>
                {sortOption === 'year_desc' && 'Сначала новые'}
                {sortOption === 'price_asc' && 'Подешевле'}
                {sortOption === 'price_desc' && 'Понасыщеннее'}
              </span>
            </button>
          </div>

          <div className="flex bg-white border border-neutral-200 rounded-lg p-0.5 shadow-sm">
            <button
              onClick={() => {
                triggerHaptic('light');
                setViewMode('grid');
              }}
              className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-amber-400 text-neutral-950' : 'text-gray-400'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setViewMode('list');
              }}
              className={`p-1.5 rounded-md transition ${viewMode === 'list' ? 'bg-amber-400 text-neutral-950' : 'text-gray-400'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Быстрые выбранные фильтры */}
        {Object.values(filters).some(v => v !== null) && (
          <div className="flex space-x-1.5 overflow-x-auto py-1 scrollbar-none">
            {filters.country && (
              <span className="bg-amber-500/15 text-amber-800 text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1 border border-amber-400/30">
                <span>{filters.country}</span>
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ country: null })} />
              </span>
            )}
            {filters.fuel && (
              <span className="bg-amber-500/15 text-amber-800 text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1 border border-amber-400/30">
                <span>{filters.fuel}</span>
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ fuel: null })} />
              </span>
            )}
            {filters.condition && (
              <span className="bg-amber-500/15 text-amber-800 text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1 border border-amber-400/30">
                <span>{filters.condition === 'new' ? 'Новые' : 'С пробегом'}</span>
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ condition: null })} />
              </span>
            )}
            {filters.brand && (
              <span className="bg-amber-500/15 text-amber-800 text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1 border border-amber-400/30">
                <span>{filters.brand}</span>
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters({ brand: null })} />
              </span>
            )}
            <button onClick={resetFilters} className="text-red-500 text-[10px] font-bold px-2.5 py-1">
              Сбросить все
            </button>
          </div>
        )}
      </div>

      {/* 2. Сетка или список автомобилей */}
      <div className="px-4 mt-4">
        {sortedCars.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-neutral-100 text-center flex flex-col items-center justify-center space-y-4 shadow-sm my-6">
            <Sparkles className="w-10 h-10 text-gray-300" />
            <div>
              <h4 className="font-display font-bold text-base text-neutral-800">Машины не найдены</h4>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                Попробуйте изменить критерии поиска или сбросить фильтры. Мы можем привезти любой автомобиль под заказ!
              </p>
            </div>
            <button
              onClick={() => {
                triggerHaptic('medium');
                resetFilters();
              }}
              className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3.5">
            {sortedCars.map((car) => {
              const calculated = calculateFullCarPrice(car);
              const isFav = favorites.includes(car.id);
              return (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveCarId(car.id);
                  }}
                  className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden flex flex-col shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-neutral-300 transition-all cursor-pointer group relative"
                >
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('medium');
                      setActiveStoryCarId(car.id);
                    }}
                    className="h-28 overflow-hidden relative cursor-zoom-in"
                    title="Смотреть Stories"
                  >
                    <img
                      src={car.images[0]}
                      alt={`${car.brand} ${car.model}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Кнопка "Сторис" */}
                    <div className="absolute top-2 left-2 bg-amber-400 text-neutral-950 text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm flex items-center space-x-1 z-10">
                      <span className="w-1.5 h-1.5 bg-neutral-950 rounded-full animate-ping"></span>
                      <span>STORIES</span>
                    </div>

                    <button
                      onClick={(e) => handleToggleFav(e, car.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-neutral-900/50 backdrop-blur-sm hover:bg-neutral-900/70 text-white transition active:scale-90 z-10"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    </button>
                    <span className="absolute bottom-1.5 left-2 bg-neutral-900/80 backdrop-blur-md text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase z-10">
                      {car.country === 'China' ? 'Китай' : car.country === 'South Korea' ? 'Корея' : 'КР'}
                    </span>
                  </div>

                  <div className="p-3 flex flex-col flex-1 justify-between">
                    <div>
                      <h4 className="font-display font-bold text-xs text-neutral-950 truncate">
                        {car.brand} {car.model}
                      </h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {car.year} г. • {car.power} л.с.
                      </p>
                    </div>
                    <div className="mt-3.5 pt-2 border-t border-neutral-50 flex flex-col">
                      <span className="text-[8px] text-gray-400 uppercase tracking-wider block">Итого под ключ</span>
                      <span className="font-display font-bold text-amber-600 text-xs">
                        {formatCurrency(calculated.finalPriceRUB)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedCars.map((car) => {
              const calculated = calculateFullCarPrice(car);
              const isFav = favorites.includes(car.id);
              return (
                <motion.div
                  key={car.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveCarId(car.id);
                  }}
                  className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden flex shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-neutral-300 transition-all cursor-pointer group relative"
                >
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic('medium');
                      setActiveStoryCarId(car.id);
                    }}
                    className="w-28 h-24 shrink-0 overflow-hidden relative cursor-zoom-in"
                    title="Смотреть Stories"
                  >
                    <img
                      src={car.images[0]}
                      alt={`${car.brand} ${car.model}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Кнопка "Сторис" */}
                    <div className="absolute top-2 left-2 bg-amber-400 text-neutral-950 text-[7px] font-black px-1 py-0.5 rounded shadow-sm flex items-center space-x-0.5 z-10">
                      <span className="w-1 h-1 bg-neutral-950 rounded-full animate-ping"></span>
                      <span>STORIES</span>
                    </div>

                    <button
                      onClick={(e) => handleToggleFav(e, car.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-neutral-900/50 backdrop-blur-sm hover:bg-neutral-900/70 text-white transition active:scale-90 z-10"
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                    </button>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <h4 className="font-display font-bold text-sm text-neutral-950 truncate">
                          {car.brand} {car.model}
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {car.year} г. • {car.engineVolume} • {car.power} л.с.
                        </p>
                      </div>
                      <span className="bg-neutral-100 text-neutral-600 text-[8px] font-bold px-2 py-0.5 rounded-md shrink-0 uppercase tracking-wider ml-1">
                        {car.country === 'China' ? 'Китай 🇨🇳' : car.country === 'South Korea' ? 'Корея 🇰🇷' : 'Киргизия 🇰🇬'}
                      </span>
                    </div>

                    <div className="flex justify-between items-end border-t border-neutral-50 pt-1.5 mt-1.5">
                      <span className="text-[9px] text-emerald-600 font-semibold flex items-center space-x-0.5">
                        <CheckCircle className="w-3 h-3 shrink-0" />
                        <span>Доставка ~{car.deliveryDays} дней</span>
                      </span>
                      <div className="text-right">
                        <span className="font-display font-extrabold text-amber-600 text-sm">
                          {formatCurrency(calculated.finalPriceRUB)}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Выдвижной Bottom Sheet с фильтрами */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseFilters}
              className="fixed inset-0 bg-black z-40"
            ></motion.div>

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-[440px] mx-auto bg-white rounded-t-[32px] z-50 p-6 flex flex-col max-h-[85%] overflow-y-auto shadow-2xl border-t border-neutral-100 select-none"
            >
              <div className="w-12 h-1 bg-neutral-300 rounded-full mx-auto mb-6 shrink-0"></div>

              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="font-display font-bold text-lg text-neutral-950">Фильтры подбора</h3>
                <button
                  onClick={handleCloseFilters}
                  className="p-1 hover:bg-neutral-100 rounded-full transition"
                >
                  <X className="w-5 h-5 text-neutral-600" />
                </button>
              </div>

              <div className="space-y-6 overflow-y-auto pr-1">
                {/* 1. Выбор бренда */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5">Марка авто</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {allBrands.map((brand) => (
                      <button
                        key={brand}
                        onClick={() => {
                          triggerHaptic('light');
                          setFilters({ brand: filters.brand === brand ? null : brand });
                        }}
                        className={`text-xs px-3.5 py-1.5 rounded-xl border font-medium transition cursor-pointer ${
                          filters.brand === brand
                            ? 'bg-amber-400 border-amber-400 text-neutral-950'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300'
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Выбор страны */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5">Страна импорта</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'China', label: 'Китай 🇨🇳' },
                      { id: 'South Korea', label: 'Юж. Корея 🇰🇷' },
                      { id: 'Kyrgyzstan', label: 'Киргизия 🇰🇬' }
                    ].map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          triggerHaptic('light');
                          setFilters({ country: filters.country === c.id ? null : (c.id as any) });
                        }}
                        className={`text-xs py-2 rounded-xl border font-medium transition text-center cursor-pointer ${
                          filters.country === c.id
                            ? 'bg-amber-400 border-amber-400 text-neutral-950'
                            : 'bg-white border-neutral-200 text-neutral-700'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Тип топлива */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5">Двигатель</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'gasoline', label: 'Бензиновый ⛽' },
                      { id: 'diesel', label: 'Дизельный ⚙️' },
                      { id: 'hybrid', label: 'Гибридный 🔋' },
                      { id: 'electric', label: 'Электромобиль ⚡' }
                    ].map((fuel) => (
                      <button
                        key={fuel.id}
                        onClick={() => {
                          triggerHaptic('light');
                          setFilters({ fuel: filters.fuel === fuel.id ? null : (fuel.id as any) });
                        }}
                        className={`text-xs py-2 rounded-xl border font-medium transition cursor-pointer ${
                          filters.fuel === fuel.id
                            ? 'bg-amber-400 border-amber-400 text-neutral-950'
                            : 'bg-white border-neutral-200 text-neutral-700'
                        }`}
                      >
                        {fuel.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Состояние */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5">Состояние</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'new', label: 'Новый автомобиль' },
                      { id: 'used', label: 'С пробегом' }
                    ].map((cond) => (
                      <button
                        key={cond.id}
                        onClick={() => {
                          triggerHaptic('light');
                          setFilters({ condition: filters.condition === cond.id ? null : (cond.id as any) });
                        }}
                        className={`text-xs py-2.5 rounded-xl border font-medium transition cursor-pointer ${
                          filters.condition === cond.id
                            ? 'bg-amber-400 border-amber-400 text-neutral-950'
                            : 'bg-white border-neutral-200 text-neutral-700'
                        }`}
                      >
                        {cond.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Максимальный бюджет (USD) */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2.5">Максимальный бюджет</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[25000, 35000, 50000].map((budget) => (
                      <button
                        key={budget}
                        onClick={() => {
                          triggerHaptic('light');
                          setFilters({ priceMax: filters.priceMax === budget ? null : budget });
                        }}
                        className={`text-xs py-2 rounded-xl border font-medium transition cursor-pointer ${
                          filters.priceMax === budget
                            ? 'bg-amber-400 border-amber-400 text-neutral-950'
                            : 'bg-white border-neutral-200 text-neutral-700'
                        }`}
                      >
                        до ${budget.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 font-mono text-center">
                    Курс ЦБ РФ: $1 = {EXCHANGE_RATES.USD_to_RUB} ₽
                  </p>
                </div>
              </div>

              {/* Кнопки Действия */}
              <div className="flex space-x-3.5 mt-8 shrink-0">
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    resetFilters();
                  }}
                  className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-50 font-semibold text-xs rounded-xl text-neutral-700 cursor-pointer active:scale-95 transition"
                >
                  Сбросить все
                </button>
                <button
                  onClick={handleCloseFilters}
                  className="flex-1 py-3 bg-neutral-950 hover:bg-neutral-800 font-semibold text-xs rounded-xl text-white cursor-pointer active:scale-95 transition"
                >
                  Применить ({filteredCars.length})
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
