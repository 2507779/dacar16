import { useStore } from '../store/useStore';
import { formatCurrency, calculateFullCarPrice } from '../data/cars';
import { triggerHaptic } from '../utils/haptics';
import { ShieldCheck, Truck, Percent, Coins, MessageSquare, ArrowRight, Zap, Flame, Award, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const { cars, setCurrentTab, setFilters, setActiveCarId, setActiveStoryCarId, orders } = useStore();

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
      setFilters({ brand: null, country: null, condition: null, fuel: null });
    }
    setCurrentTab('catalog');
  };

  const handleOpenCar = (id: string) => {
    triggerHaptic('medium');
    setActiveCarId(id);
  };

  // Популярные авто (первые 3)
  const hotCars = cars.slice(0, 3);

  return (
    <div className="flex flex-col text-white pb-10 select-none">
      
      {/* 1. Премиум Баннер-Слайдер */}
      <div className="relative px-4 pt-4 select-none">
        <div className="h-60 bg-gradient-to-br from-[#121215] via-[#16161c] to-[#0c0c0e] rounded-3xl p-6 flex flex-col justify-between text-white overflow-hidden relative border border-white/[0.04] shadow-2xl">
          {/* Декоративная подсветка */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]"></div>
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/15 rounded-full blur-[60px]"></div>

          <div className="flex justify-between items-start z-10">
            <div>
              <span className="bg-amber-400 text-black text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md tracking-wider shadow-sm">
                Консьерж-сервис по заказу и покупке автомобилей
              </span>
              <h2 className="font-display text-2xl font-bold mt-3 tracking-tight leading-tight">
                Автомобили из Азии <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500">под ключ в РФ</span>
              </h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 shadow-inner">
              <Award className="w-5 h-5" />
            </div>
          </div>

          <div className="flex justify-between items-end z-10 border-t border-white/[0.04] pt-4 mt-3">
            <div>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">Главный офис</p>
              <p className="text-xs font-semibold text-gray-200 mt-0.5">г. Казань, ул. Серова, 48</p>
            </div>
            <button
              onClick={() => {
                triggerHaptic('medium');
                setCurrentTab('catalog');
              }}
              className="bg-amber-400 hover:bg-amber-500 text-black px-4.5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer active:scale-95 transition-bezier shadow-md shadow-amber-400/10"
            >
              <span>В каталог</span>
              <ArrowRight className="w-3.5 h-3.5 text-black" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Выбор стран происхождения */}
      <div className="px-4 mt-6">
        <h3 className="font-display text-[10px] font-bold uppercase tracking-widest text-neutral-500 flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Страна экспорта</span>
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
              className="bg-[#121215]/80 border border-white/[0.03] hover:border-amber-400/40 hover:bg-[#16161a] active:scale-95 transition-bezier p-3.5 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg cursor-pointer group"
            >
              <span className="font-bold text-xs text-gray-100 group-hover:text-amber-400 transition-colors">{c.label}</span>
              <span className="text-[8px] text-neutral-400 mt-1 leading-snug">{c.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Категории по типу двигателя */}
      <div className="px-4 mt-6">
        <div className="flex justify-between items-center">
          <h3 className="font-display text-[10px] font-bold uppercase tracking-widest text-neutral-500">
            Двигатели под заказ
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
              className="bg-[#121215]/90 border border-white/[0.03] hover:border-amber-400/40 hover:bg-[#16161a] shrink-0 px-4.5 py-2.5 rounded-xl text-xs font-semibold text-gray-200 transition-bezier active:scale-95 cursor-pointer shadow-md"
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Горячие Предложения (Сетка) */}
      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-3.5">
          <h3 className="font-display text-[10px] font-bold uppercase tracking-widest text-neutral-500 flex items-center space-x-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
            <span>Горячие авто под заказ</span>
          </h3>
          <button
            onClick={() => {
              triggerHaptic('light');
              setFilters({});
              setCurrentTab('catalog');
            }}
            className="text-xs text-amber-400 font-bold hover:text-amber-300 transition-colors"
          >
            Все авто
          </button>
        </div>

        <div className="space-y-4">
          {hotCars.map((car) => {
            const calculated = calculateFullCarPrice(car);
            return (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10px' }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                onClick={() => handleOpenCar(car.id)}
                className="bg-[#121215] border border-white/[0.03] hover:border-white/[0.08] rounded-3xl overflow-hidden flex flex-col shadow-xl cursor-pointer group"
              >
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('medium');
                    setActiveStoryCarId(car.id);
                  }}
                  className="h-48 overflow-hidden relative cursor-zoom-in"
                  title="Смотреть Stories"
                >
                  <img
                    src={car.images[0]}
                    alt={`${car.brand} ${car.model}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Кнопка "Сторис" */}
                  <div className="absolute top-3 left-3 bg-amber-400 text-neutral-950 text-[8px] font-black px-2 py-0.5 rounded shadow-lg flex items-center space-x-1 z-10">
                    <span className="w-1.5 h-1.5 bg-neutral-950 rounded-full animate-ping"></span>
                    <span>STORIES</span>
                  </div>

                  {/* Страна и Состояние */}
                  <div className="absolute top-3 right-3 flex space-x-1.5 z-10">
                    <span className="bg-neutral-950/80 backdrop-blur-md text-white text-[8px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                      {car.country === 'China' ? 'КНР 🇨🇳' : car.country === 'South Korea' ? 'Корея 🇰🇷' : 'Киргизия 🇰🇬'}
                    </span>
                    <span className={`text-[8px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                      car.condition === 'new' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-neutral-950'
                    }`}>
                      {car.condition === 'new' ? 'Новый' : `С пробегом`}
                    </span>
                  </div>
                  {/* Срок доставки */}
                  <div className="absolute bottom-3 right-3 bg-neutral-950/80 backdrop-blur-md text-white text-[8px] font-bold px-2 py-1 rounded-md flex items-center space-x-1 z-10">
                    <Truck className="w-3 h-3 text-amber-400" />
                    <span>~{car.deliveryDays} дней</span>
                  </div>
                </div>

                <div className="p-4 flex flex-col bg-gradient-to-b from-[#121215] to-[#0d0d10]">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display font-bold text-sm text-gray-100 group-hover:text-amber-400 transition-colors">
                        {car.brand} {car.model}
                      </h4>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                        {car.year} г. • {car.engineVolume} • {car.power} л.с.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] text-gray-500 block uppercase tracking-widest font-mono">Итого под ключ</span>
                      <span className="font-display font-black text-amber-400 text-sm mt-0.5 block">
                        {formatCurrency(calculated.finalPriceRUB)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 5. Преимущества Компании */}
      <div className="px-4 mt-8">
        <h3 className="font-display text-[10px] font-bold uppercase tracking-widest text-neutral-500">
          Преимущества сервиса DA!CAR
        </h3>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-[#121215] p-4 rounded-2xl border border-white/[0.03] flex flex-col justify-between shadow-lg">
            <div className="w-9 h-9 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h4 className="text-xs font-bold text-gray-200">100% Страховка</h4>
              <p className="text-[9px] text-neutral-400 mt-1 leading-normal">
                Полная финансовая защита на всех этапах доставки.
              </p>
            </div>
          </div>

          <div className="bg-[#121215] p-4 rounded-2xl border border-white/[0.03] flex flex-col justify-between shadow-lg">
            <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h4 className="text-xs font-bold text-gray-200">Честный договор</h4>
              <p className="text-[9px] text-neutral-400 mt-1 leading-normal">
                Фиксированная сумма по счету без доплат по приезде.
              </p>
            </div>
          </div>

          <div className="bg-[#121215] p-4 rounded-2xl border border-white/[0.03] flex flex-col justify-between shadow-lg">
            <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h4 className="text-xs font-bold text-gray-200">Личные автовозы</h4>
              <p className="text-[9px] text-neutral-400 mt-1 leading-normal">
                Регулярное отправление из Азии прямиком в РФ.
              </p>
            </div>
          </div>

          <div className="bg-[#121215] p-4 rounded-2xl border border-white/[0.03] flex flex-col justify-between shadow-lg">
            <div className="w-9 h-9 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
              <Percent className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h4 className="text-xs font-bold text-gray-200">Таможенный расчет</h4>
              <p className="text-[9px] text-neutral-400 mt-1 leading-normal">
                Оптимальные маршруты растаможки без переплат.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Быстрый Коннект с Менеджером */}
      <div className="px-4 mt-8">
        <div className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-3xl p-5 flex items-center justify-between shadow-xl">
          <div className="max-w-[70%]">
            <h4 className="font-display font-black text-xs text-neutral-950 uppercase tracking-wide">
              Нужен особый подбор?
            </h4>
            <p className="text-[11px] text-neutral-900 font-semibold mt-1 leading-snug">
              Подберем автомобиль индивидуально под ваши критерии и бюджет
            </p>
          </div>
          <button
            onClick={() => {
              triggerHaptic('success');
              setCurrentTab('profile');
            }}
            className="w-11 h-11 bg-neutral-950 hover:bg-neutral-900 transition active:scale-95 rounded-full flex items-center justify-center text-white cursor-pointer shadow-md"
          >
            <MessageSquare className="w-4 h-4 text-amber-400 fill-amber-400" />
          </button>
        </div>
      </div>

    </div>
  );
}
