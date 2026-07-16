/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, calculateFullCarPrice, EXCHANGE_RATES } from '../data/cars';
import { triggerHaptic } from '../utils/haptics';
import { Search, SlidersHorizontal, Grid, List, ArrowUpDown, X, Heart, Sparkles, CheckCircle, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SkeletonCard = () => (
  <div className="bg-white border border-[#EFEBE4] rounded-3xl overflow-hidden flex flex-col p-3.5 space-y-3.5 shadow-md select-none animate-pulse">
    <div className="h-28 w-full bg-[#EFEBE4]/50 rounded-2xl" />
    <div className="space-y-2">
      <div className="h-3 w-1/3 bg-[#EFEBE4]/60 rounded" />
      <div className="h-4 w-3/4 bg-[#EFEBE4]/85 rounded" />
    </div>
    <div className="flex space-x-2 pt-1">
      <div className="h-2.5 w-1/4 bg-[#EFEBE4]/50 rounded" />
      <div className="h-2.5 w-1/4 bg-[#EFEBE4]/50 rounded" />
    </div>
    <div className="h-px bg-[#EFEBE4]/40 w-full" />
    <div className="flex justify-between items-center pt-1">
      <div className="space-y-1.5 flex-1">
        <div className="h-2.5 w-1/2 bg-[#EFEBE4]/50 rounded" />
        <div className="h-4 w-5/6 bg-[#EFEBE4]/85 rounded" />
      </div>
    </div>
  </div>
);

const SkeletonRow = () => (
  <div className="bg-white border border-[#EFEBE4] rounded-3xl overflow-hidden flex p-3.5 space-x-4 shadow-md select-none animate-pulse">
    <div className="w-28 h-24 bg-[#EFEBE4]/50 rounded-2xl shrink-0" />
    <div className="flex-1 flex flex-col justify-between py-1">
      <div className="space-y-2">
        <div className="h-4 w-2/3 bg-[#EFEBE4]/85 rounded" />
        <div className="h-3 w-1/2 bg-[#EFEBE4]/50 rounded" />
      </div>
      <div className="flex justify-between items-end border-t border-[#EFEBE4]/40 pt-2">
        <div className="h-3 w-1/4 bg-[#EFEBE4]/50 rounded" />
        <div className="h-4 w-1/3 bg-[#EFEBE4]/85 rounded" />
      </div>
    </div>
  </div>
);

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
    toggleFavorite,
    selectedCity
  } = useStore();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOption, setSortOption] = useState<'price_asc' | 'price_desc' | 'year_desc'>('year_desc');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, JSON.stringify(filters), sortOption]);

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
    const aPrice = calculateFullCarPrice(a, selectedCity).finalPriceRUB;
    const bPrice = calculateFullCarPrice(b, selectedCity).finalPriceRUB;

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
    <div className="flex flex-col text-[#1C1917] pb-12 select-none bg-[#F0EEEC]">
      
      {/* 1. Поисковая строка и Настройки вида */}
      <div className="px-4 pt-4 sticky top-0 bg-[#F0EEEC]/95 backdrop-blur-md z-10 pb-3 border-b border-[#EFEBE4] flex flex-col space-y-3">
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-white border border-[#EFEBE4] rounded-2xl px-3.5 py-2.5 flex items-center space-x-2 shadow-sm focus-within:border-[#C5A880]/70 transition-colors">
            <Search className="w-4 h-4 text-[#78716C]/70" />
            <input
              type="text"
              placeholder="Марка, модель авто..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-[#1C1917] outline-none w-full placeholder-[#78716C]/60 font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setSearchQuery('');
                }}
              >
                <X className="w-4 h-4 text-[#78716C]" />
              </button>
            )}
          </div>
  
          <button
            onClick={handleOpenFilters}
            className={`p-3 rounded-2xl border flex items-center justify-center cursor-pointer transition-bezier shadow-sm ${
              Object.values(filters).some(v => v !== null)
                ? 'bg-[#C5A880] border-[#C5A880] text-white font-bold'
                : 'bg-white border-[#EFEBE4] text-[#78716C] hover:border-[#C5A880]/40'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
  
        {/* Сортировка и вид */}
        <div className="flex justify-between items-center text-[11px]">
          <div className="flex items-center space-x-2 text-[#78716C]">
            <span>Найдено: <b className="text-[#1C1917] font-bold">{sortedCars.length}</b></span>
            <span>•</span>
            <button
              onClick={toggleSort}
              className="font-bold text-[#1C1917] flex items-center space-x-1.5 hover:text-[#C5A880] transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[#78716C]" />
              <span>
                {sortOption === 'year_desc' && 'Сначала новые'}
                {sortOption === 'price_asc' && 'Подешевле'}
                {sortOption === 'price_desc' && 'Понасыщеннее'}
              </span>
            </button>
          </div>
  
          <div className="flex bg-white border border-[#EFEBE4] rounded-xl p-0.5 shadow-sm">
            <button
              onClick={() => {
                triggerHaptic('light');
                setViewMode('grid');
              }}
              className={`p-1.5 rounded-lg transition-bezier ${viewMode === 'grid' ? 'bg-[#C5A880] text-white font-black shadow-sm' : 'text-[#78716C]/70'}`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setViewMode('list');
              }}
              className={`p-1.5 rounded-lg transition-bezier ${viewMode === 'list' ? 'bg-[#C5A880] text-white font-black shadow-sm' : 'text-[#78716C]/70'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
  
        {/* Быстрые выбранные фильтры */}
        {Object.values(filters).some(v => v !== null) && (
          <div className="flex space-x-1.5 overflow-x-auto py-1 scrollbar-none">
            {filters.country && (
              <span className="bg-white text-[#C5A880] text-[10px] font-bold px-3 py-1 rounded-full flex items-center space-x-1 border border-[#EFEBE4] shadow-sm">
                <span>{filters.country === 'China' ? 'Китай 🇨🇳' : filters.country === 'South Korea' ? 'Корея 🇰🇷' : 'Киргизия 🇰🇬'}</span>
                <X className="w-3 h-3 cursor-pointer text-[#C5A880]" onClick={() => setFilters({ country: null })} />
              </span>
            )}
            {filters.fuel && (
              <span className="bg-white text-[#C5A880] text-[10px] font-bold px-3 py-1 rounded-full flex items-center space-x-1 border border-[#EFEBE4] shadow-sm">
                <span className="capitalize">{filters.fuel}</span>
                <X className="w-3 h-3 cursor-pointer text-[#C5A880]" onClick={() => setFilters({ fuel: null })} />
              </span>
            )}
            {filters.condition && (
              <span className="bg-white text-[#C5A880] text-[10px] font-bold px-3 py-1 rounded-full flex items-center space-x-1 border border-[#EFEBE4] shadow-sm">
                <span>{filters.condition === 'new' ? 'Новые' : 'С пробегом'}</span>
                <X className="w-3 h-3 cursor-pointer text-[#C5A880]" onClick={() => setFilters({ condition: null })} />
              </span>
            )}
            {filters.brand && (
              <span className="bg-white text-[#C5A880] text-[10px] font-bold px-3 py-1 rounded-full flex items-center space-x-1 border border-[#EFEBE4] shadow-sm">
                <span>{filters.brand}</span>
                <X className="w-3 h-3 cursor-pointer text-[#C5A880]" onClick={() => setFilters({ brand: null })} />
              </span>
            )}
            <button onClick={resetFilters} className="text-amber-700 hover:text-amber-800 text-[10px] font-extrabold px-2 py-1">
              Сбросить все
            </button>
          </div>
        )}
      </div>

      {/* 2. Сетка или список автомобилей */}
      <div className="px-4 mt-4">
        {sortedCars.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-[#EFEBE4] text-center flex flex-col items-center justify-center space-y-4 shadow-md my-6">
            <Sparkles className="w-10 h-10 text-[#C5A880]/60" />
            <div>
              <h4 className="font-display font-bold text-base text-[#1C1917]">Машины не найдены</h4>
              <p className="text-xs text-[#78716C] mt-1.5 leading-relaxed">
                Попробуйте изменить критерии поиска или сбросить фильтры. Мы можем привезти любой автомобиль под ваш индивидуальный заказ!
              </p>
            </div>
            <button
              onClick={() => {
                triggerHaptic('medium');
                resetFilters();
              }}
              className="px-6 py-3 bg-[#C5A880] text-white rounded-xl text-xs font-black cursor-pointer active:scale-95 transition-bezier shadow-md"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => <SkeletonCard key={idx} />)
            ) : (
              sortedCars.map((car) => {
                const calculated = calculateFullCarPrice(car, selectedCity);
                const isFav = favorites.includes(car.id);
                return (
                  <motion.div
                    key={car.id}
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => {
                      triggerHaptic('light');
                      setActiveCarId(car.id);
                    }}
                    className="bg-white border border-[#EFEBE4] hover:border-[#C5A880]/25 rounded-3xl overflow-hidden flex flex-col shadow-md cursor-pointer group relative"
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
                      <div className="absolute top-2 left-2 bg-[#C5A880] text-white text-[7px] font-black px-1.5 py-0.5 rounded shadow-md flex items-center space-x-1 z-10">
                        <span className="w-1 h-1 bg-white rounded-full animate-ping"></span>
                        <span>STORIES</span>
                      </div>

                      <button
                        onClick={(e) => handleToggleFav(e, car.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-[#1C1917] transition active:scale-90 z-10 shadow-sm border border-black/[0.03]"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : 'text-[#78716C]'}`} />
                      </button>
                      <span className="absolute bottom-1.5 left-2 bg-white/90 backdrop-blur-md text-[#1C1917] text-[8px] font-bold px-1.5 py-0.5 rounded uppercase z-10 border border-black/[0.03]">
                        {car.country === 'China' ? 'КНР 🇨🇳' : car.country === 'South Korea' ? 'Корея 🇰🇷' : 'КР 🇰🇬'}
                      </span>
                    </div>

                    <div className="p-3 flex flex-col flex-1 justify-between bg-white">
                      <div>
                        <h4 className="font-display font-bold text-xs text-[#1C1917] group-hover:text-[#C5A880] transition-colors truncate">
                          {car.brand} {car.model}
                        </h4>
                        <p className="text-[10px] text-[#78716C] mt-0.5">
                          {car.year} г. • {car.power} л.с.
                        </p>
                      </div>
                      <div className="mt-3.5 pt-2 border-t border-[#EFEBE4]/40 flex flex-col">
                        <span className="text-[8px] text-[#78716C] uppercase tracking-widest block font-mono">Итого под ключ</span>
                        <span className="font-display font-bold text-[#C5A880] text-xs mt-0.5">
                          {formatCurrency(calculated.finalPriceRUB)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, idx) => <SkeletonRow key={idx} />)
) : (
              sortedCars.map((car) => {
                const calculated = calculateFullCarPrice(car, selectedCity);
                const isFav = favorites.includes(car.id);
                return (
                  <motion.div
                    key={car.id}
                    initial={{ opacity: 0, y: 24, scale: 0.97 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => {
                      triggerHaptic('light');
                      setActiveCarId(car.id);
                    }}
                    className="bg-white border border-[#EFEBE4] hover:border-[#C5A880]/25 rounded-3xl overflow-hidden flex shadow-md cursor-pointer group relative"
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
                      <div className="absolute top-2 left-2 bg-[#C5A880] text-white text-[7px] font-black px-1.5 py-0.5 rounded shadow-md flex items-center space-x-1 z-10">
                        <span className="w-1 h-1 bg-white rounded-full animate-ping"></span>
                        <span>STORIES</span>
                      </div>

                      <button
                        onClick={(e) => handleToggleFav(e, car.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-[#1C1917] transition active:scale-90 z-10 shadow-sm border border-black/[0.03]"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : 'text-[#78716C]'}`} />
                      </button>
                    </div>

                    <div className="p-3.5 flex-1 flex flex-col justify-between min-w-0 bg-white">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <h4 className="font-display font-bold text-xs text-[#1C1917] group-hover:text-[#C5A880] transition-colors truncate">
                            {car.brand} {car.model}
                          </h4>
                          <p className="text-[10px] text-[#78716C] mt-0.5">
                            {car.year} г. • {car.engineVolume} • {car.power} л.с.
                          </p>
                        </div>
                        <span className="bg-[#F0EEEC] border border-[#EFEBE4] text-[#1C1917] text-[8px] font-bold px-2 py-0.5 rounded-md shrink-0 uppercase tracking-wider ml-1">
                          {car.country === 'China' ? 'КНР 🇨🇳' : car.country === 'South Korea' ? 'Корея 🇰🇷' : 'КР 🇰🇬'}
                        </span>
                      </div>

                      <div className="flex justify-between items-end border-t border-[#EFEBE4]/40 pt-2 mt-1.5">
                        <span className="text-[9px] text-[#C5A880] font-bold flex items-center space-x-0.5">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                          <span>~{car.deliveryDays} дней</span>
                        </span>
                        <div className="text-right">
                          <span className="font-display font-black text-[#C5A880] text-xs">
                            {formatCurrency(calculated.finalPriceRUB)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
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
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseFilters}
              className="fixed inset-0 bg-black/60 z-40"
            ></motion.div>

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-[440px] mx-auto bg-[#F0EEEC] rounded-t-[32px] z-50 p-6 flex flex-col max-h-[85%] overflow-y-auto shadow-2xl border-t border-[#EFEBE4] select-none"
            >
              <div className="w-12 h-1 bg-[#EFEBE4] rounded-full mx-auto mb-6 shrink-0"></div>

              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="font-display font-bold text-base text-[#1C1917]">Фильтры подбора</h3>
                <button
                  onClick={handleCloseFilters}
                  className="p-1 hover:bg-[#EFEBE4]/50 rounded-full transition"
                >
                  <X className="w-5 h-5 text-[#78716C]" />
                </button>
              </div>

              <div className="space-y-6 overflow-y-auto pr-1">
                {/* 1. Выбор бренда */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] mb-2.5">Марка авто</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {allBrands.map((brand) => (
                      <button
                        key={brand}
                        onClick={() => {
                          triggerHaptic('light');
                          setFilters({ brand: filters.brand === brand ? null : brand });
                        }}
                        className={`text-xs px-3.5 py-1.5 rounded-xl border font-semibold transition cursor-pointer ${
                          filters.brand === brand
                            ? 'bg-[#C5A880] border-[#C5A880] text-white shadow-md'
                            : 'bg-white border-[#EFEBE4] text-[#1C1917] hover:border-[#C5A880]/40'
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Выбор страны */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] mb-2.5">Страна импорта</h4>
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
                        className={`text-xs py-2 rounded-xl border font-semibold transition text-center cursor-pointer ${
                          filters.country === c.id
                            ? 'bg-[#C5A880] border-[#C5A880] text-white shadow-md'
                            : 'bg-white border-[#EFEBE4] text-[#1C1917]'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Тип топлива */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] mb-2.5">Двигатель</h4>
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
                        className={`text-xs py-2 rounded-xl border font-semibold transition cursor-pointer ${
                          filters.fuel === fuel.id
                            ? 'bg-[#C5A880] border-[#C5A880] text-white shadow-md'
                            : 'bg-white border-[#EFEBE4] text-[#1C1917]'
                        }`}
                      >
                        {fuel.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Состояние */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] mb-2.5">Состояние</h4>
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
                        className={`text-xs py-2.5 rounded-xl border font-semibold transition cursor-pointer ${
                          filters.condition === cond.id
                            ? 'bg-[#C5A880] border-[#C5A880] text-white shadow-md'
                            : 'bg-white border-[#EFEBE4] text-[#1C1917]'
                        }`}
                      >
                        {cond.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Максимальный бюджет (USD) */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] mb-2.5">Максимальный бюджет</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[25000, 35000, 50000].map((budget) => (
                      <button
                        key={budget}
                        onClick={() => {
                          triggerHaptic('light');
                          setFilters({ priceMax: filters.priceMax === budget ? null : budget });
                        }}
                        className={`text-xs py-2 rounded-xl border font-semibold transition cursor-pointer ${
                          filters.priceMax === budget
                            ? 'bg-[#C5A880] border-[#C5A880] text-white shadow-md'
                            : 'bg-white border-[#EFEBE4] text-[#1C1917]'
                        }`}
                      >
                        до ${budget.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#78716C] mt-2 font-mono text-center">
                    Курс ЦБ РФ: $1 = {EXCHANGE_RATES.USD_to_RUB} ₽
                  </p>
                </div>
              </div>

              {/* Кнопки Действия */}
              <div className="flex space-x-3 mt-8 shrink-0">
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    resetFilters();
                  }}
                  className="flex-1 py-3 border border-[#EFEBE4] hover:bg-[#F0EEEC] font-semibold text-xs rounded-xl text-[#78716C] cursor-pointer active:scale-95 transition-bezier"
                >
                  Сбросить все
                </button>
                <button
                  onClick={handleCloseFilters}
                  className="flex-1 py-3 bg-[#C5A880] hover:bg-[#B0936B] font-bold text-xs rounded-xl text-white cursor-pointer active:scale-95 transition-bezier shadow-md"
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
