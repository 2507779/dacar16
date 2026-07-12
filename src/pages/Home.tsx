/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useStore } from '../store/useStore';
import { formatCurrency, calculateFullCarPrice } from '../data/cars';
import { triggerHaptic } from '../utils/haptics';
import { ShieldCheck, Truck, Percent, Coins, MessageSquare, ArrowRight, Zap, Flame, Award } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const { cars, setCurrentTab, setFilters, setActiveCarId, orders } = useStore();

  const handleCountrySelect = (country: 'China' | 'South Korea' | 'Kyrgyzstan') => {
    triggerHaptic('medium');
    setFilters({ country });
    setCurrentTab('catalog');
  };

  const handleCategorySelect = (key: string, value: string) => {
    triggerHaptic('light');
    if (key === 'engineType') {
      setFilters({ fuel: value });
    } else if (key === 'bodyType') {
      // Ищем по кузову
      setFilters({ brand: null, country: null, condition: null, fuel: null });
    }
    setCurrentTab('catalog');
  };

  const handleOpenCar = (id: string) => {
    triggerHaptic('medium');
    setActiveCarId(id);
  };

  // Рекомендованные авто (первые 3)
  const hotCars = cars.slice(0, 3);

  return (
    <div className="flex flex-col text-neutral-900 pb-10">
      
      {/* 1. Премиум Баннер-Слайдер */}
      <div className="relative px-4 pt-4 select-none">
        <div className="h-56 bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-800 rounded-3xl p-6 flex flex-col justify-between text-white overflow-hidden relative shadow-lg">
          {/* Декоративная подсветка */}
          <div className="absolute top-[-50%] right-[-10%] w-72 h-72 bg-amber-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-30%] left-[-10%] w-48 h-48 bg-amber-500/20 rounded-full blur-2xl"></div>

          <div className="flex justify-between items-start z-10">
            <div>
              <span className="bg-amber-400 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-widest">
                Премиум Импорт
              </span>
              <h2 className="font-display text-2xl font-bold mt-2.5 tracking-tight leading-tight">
                Автомобили из Азии <br />
                <span className="text-amber-400">под ключ в РФ</span>
              </h2>
            </div>
            <Award className="w-8 h-8 text-amber-400 shrink-0" />
          </div>

          <div className="flex justify-between items-end z-10 border-t border-white/10 pt-4 mt-3">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Главный офис</p>
              <p className="text-sm font-semibold text-white">г. Казань, ул. Серова, д. 48, к. 2</p>
            </div>
            <button
              onClick={() => {
                triggerHaptic('medium');
                setCurrentTab('catalog');
              }}
              className="bg-white hover:bg-amber-400 hover:text-neutral-950 transition-colors duration-200 text-black px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer active:scale-95"
            >
              <span>В каталог</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Выбор стран происхождения */}
      <div className="px-4 mt-6">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-neutral-400">
          Страна экспорта
        </h3>
        <div className="grid grid-cols-3 gap-2.5 mt-2.5">
          {[
            { id: 'China', label: 'Китай 🇨🇳', desc: 'Электро & Гибриды' },
            { id: 'South Korea', label: 'Корея 🇰🇷', desc: 'Дизель & Бензин' },
            { id: 'Kyrgyzstan', label: 'Киргизия 🇰🇬', desc: 'Быстрый транзит' }
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => handleCountrySelect(c.id as any)}
              className="bg-white border border-neutral-200/80 hover:border-amber-400 active:scale-95 transition-all p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer"
            >
              <span className="font-semibold text-xs text-neutral-900">{c.label}</span>
              <span className="text-[8px] text-gray-400 mt-1">{c.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Категории по типу двигателя */}
      <div className="px-4 mt-6">
        <div className="flex justify-between items-center">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-neutral-400">
            Популярные категории
          </h3>
        </div>
        <div className="flex space-x-2 overflow-x-auto pt-2 pb-1 scrollbar-none">
          {[
            { id: 'electric', label: 'Электрокары ⚡', key: 'engineType' },
            { id: 'hybrid', label: 'Гибриды 🔋', key: 'engineType' },
            { id: 'diesel', label: 'Дизельные ⚙️', key: 'engineType' },
            { id: 'gasoline', label: 'Бензиновые ⛽', key: 'engineType' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.key, cat.id)}
              className="bg-white border border-neutral-200/80 hover:border-amber-400 shrink-0 px-4 py-2 rounded-xl text-xs font-medium text-neutral-800 transition active:scale-95 cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.01)]"
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Горячие Предложения (Сетка) */}
      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-1.5">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Горячие авто под заказ</span>
          </h3>
          <button
            onClick={() => {
              triggerHaptic('light');
              setFilters({});
              setCurrentTab('catalog');
            }}
            className="text-xs text-amber-600 font-bold hover:underline"
          >
            Все авто
          </button>
        </div>

        <div className="space-y-4">
          {hotCars.map((car) => {
            const calculated = calculateFullCarPrice(car);
            return (
              <div
                key={car.id}
                onClick={() => handleOpenCar(car.id)}
                className="bg-white border border-neutral-200/80 rounded-3xl overflow-hidden flex flex-col shadow-[0_4px_16px_rgba(0,0,0,0.02)] hover:border-neutral-300 transition-all cursor-pointer group"
              >
                <div className="h-44 overflow-hidden relative">
                  <img
                    src={car.images[0]}
                    alt={`${car.brand} ${car.model}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Страна и Состояние */}
                  <div className="absolute top-3 left-3 flex space-x-1.5">
                    <span className="bg-neutral-900/80 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {car.country === 'China' ? 'КНР 🇨🇳' : car.country === 'South Korea' ? 'Корея 🇰🇷' : 'Киргизия 🇰🇬'}
                    </span>
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      car.condition === 'new' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-neutral-900'
                    }`}>
                      {car.condition === 'new' ? 'Новый' : `С пробегом`}
                    </span>
                  </div>
                  {/* Срок доставки */}
                  <div className="absolute bottom-3 right-3 bg-neutral-900/80 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-lg flex items-center space-x-1">
                    <Truck className="w-3.5 h-3.5 text-amber-400" />
                    <span>~{car.deliveryDays} дней</span>
                  </div>
                </div>

                <div className="p-4 flex flex-col">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display font-bold text-base text-neutral-950">
                        {car.brand} {car.model}
                      </h4>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                        {car.year} г. • {car.engineVolume} • {car.power} л.с.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Под ключ в Казани</span>
                      <span className="font-display font-black text-amber-600 text-base">
                        {formatCurrency(calculated.finalPriceRUB)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Преимущества Компании */}
      <div className="px-4 mt-8">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-neutral-400">
          Почему выбирают DA!CAR
        </h3>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-white p-4 rounded-2xl border border-neutral-100 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
            <div className="mt-2.5">
              <h4 className="text-xs font-bold text-neutral-900">100% Страховка</h4>
              <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                Полное страхование авто на всех этапах логистики.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-100 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <Coins className="w-6 h-6 text-amber-500" />
            <div className="mt-2.5">
              <h4 className="text-xs font-bold text-neutral-900">Официальный договор</h4>
              <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                Оплата через банк на расчетный счет юрлица.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-100 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <Truck className="w-6 h-6 text-blue-500" />
            <div className="mt-2.5">
              <h4 className="text-xs font-bold text-neutral-900">Собственные автовозы</h4>
              <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                Свои терминалы в Китае и Корее, регулярные рейсы в Казань.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-100 flex flex-col justify-between shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <Percent className="w-6 h-6 text-purple-500" />
            <div className="mt-2.5">
              <h4 className="text-xs font-bold text-neutral-900">Без скрытых пошлин</h4>
              <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                Честная калькуляция утильсбора и таможни на берегу.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Быстрый Коннект с Менеджером */}
      <div className="px-4 mt-8">
        <div className="bg-amber-400 rounded-3xl p-5 flex items-center justify-between shadow-lg">
          <div className="max-w-[70%]">
            <h4 className="font-display font-bold text-sm text-neutral-950 uppercase tracking-wide">
              Нужна консультация?
            </h4>
            <p className="text-xs text-neutral-900 font-medium mt-1 leading-tight">
              Индивидуальный подбор авто по вашему бюджету и параметрам
            </p>
          </div>
          <button
            onClick={() => {
              triggerHaptic('success');
              // Перенаправляем на вкладку Профиль, где находится чат с менеджером
              setCurrentTab('profile');
            }}
            className="w-12 h-12 bg-neutral-950 hover:bg-neutral-800 transition active:scale-95 rounded-full flex items-center justify-center text-white cursor-pointer"
          >
            <MessageSquare className="w-5 h-5 text-amber-400" />
          </button>
        </div>
      </div>

    </div>
  );
}
