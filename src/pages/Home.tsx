import { useStore } from '../store/useStore';
import { formatCurrency, calculateFullCarPrice } from '../data/cars';
import { triggerHaptic } from '../utils/haptics';
import { ShieldCheck, Truck, Percent, Coins, MessageSquare, ArrowRight, Zap, Flame, Award, Sparkles, Globe, Crown, Shield, FileText, Check, HelpCircle, MapPin, Search } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const { 
    cars, 
    setCurrentTab, 
    setFilters, 
    setActiveCarId, 
    setActiveStoryCarId, 
    orders,
    homepageBannerUrl,
    homepageBannerTitle,
    homepageBannerSubtitle
  } = useStore();

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

  // Рекомендованные авто (первые 3)
  const hotCars = cars.slice(0, 3);

  return (
    <div className="flex flex-col text-[#1C1917] pb-12 select-none bg-[#FAF8F5]">
      
      {/* Имиджевый баннер шапки из брошюры-флаера */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full relative overflow-hidden border-b border-[#EFEBE4] bg-white shadow-sm"
      >
        <img 
          src="/banner-header.jpg" 
          alt="DA!CAR — Автомобильный консьерж-сервис" 
          className="w-full h-auto object-cover select-none"
        />
      </motion.div>

      {/* Премиум Баннер */}
      <div className="relative px-4 pt-4 select-none">
        <div 
          className="h-56 rounded-3xl p-5 flex flex-col justify-between text-white overflow-hidden relative border border-[#EFEBE4] shadow-md bg-cover bg-center transition-all duration-500"
          style={{ 
            backgroundImage: homepageBannerUrl ? `url(${homepageBannerUrl})` : undefined,
            backgroundColor: '#1C1917'
          }}
        >
          {/* Overlay to ensure ultra-premium look */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917] via-[#1C1917]/40 to-black/20 z-0" />
          {/* Premium blue glow background effect if no image */}
          {!homepageBannerUrl && (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-[#2D2A26] via-[#1C1917] to-[#0E0C0A] z-0" />
              <div className="absolute -top-12 -right-12 w-60 h-60 bg-[#C5A880]/15 rounded-full blur-[80px] z-0" />
            </>
          )}

          <div className="flex justify-between items-start z-10">
            <div>
              <span className="bg-[#C5A880] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-wider shadow-sm">
                Luxury Concierge
              </span>
              <h2 className="font-display text-xl font-black mt-2 leading-tight tracking-tight text-white uppercase">
                {homepageBannerTitle || "Автомобили под заказ"} <br />
                <span className="text-[#C5A880]">
                  {homepageBannerSubtitle || "без лишних хлопот"}
                </span>
              </h2>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-[#C5A880] shadow-sm">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div className="flex justify-between items-end z-10 border-t border-white/10 pt-3 mt-2">
            <div>
              <p className="text-[8px] text-slate-400 uppercase tracking-widest font-mono">Главный шоурум</p>
              <p className="text-[11px] font-bold text-white mt-0.5">г. Казань, ул. Серова, 48 к2</p>
            </div>
            <button
              onClick={() => {
                triggerHaptic('medium');
                setCurrentTab('catalog');
              }}
              className="bg-white hover:bg-[#FAF8F5] text-[#1C1917] px-4 py-2 rounded-xl text-[10px] font-black flex items-center space-x-1.5 cursor-pointer active:scale-95 transition-bezier shadow-md"
            >
              <span>Подобрать</span>
              <ArrowRight className="w-3 h-3 text-[#1C1917]" />
            </button>
          </div>
        </div>
      </div>

      {/* Быстрый выбор стран */}
      <div className="px-4 mt-6">
        <h3 className="font-display text-[9px] font-black uppercase tracking-widest text-[#78716C] flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-[#C5A880]" />
          <span>Страны импорта под ключ</span>
        </h3>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {[
            { id: 'China', label: 'Китай 🇨🇳', desc: 'Электро / Гибриды' },
            { id: 'South Korea', label: 'Корея 🇰🇷', desc: 'Дизель / Бензин' },
            { id: 'Kyrgyzstan', label: 'Киргизия 🇰🇬', desc: 'Мгновенный транзит' }
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => handleCountrySelect(c.id as any)}
              className="bg-white border border-[#EFEBE4] hover:border-[#C5A880]/40 hover:bg-[#FAF8F5]/50 active:scale-95 transition-bezier p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm cursor-pointer group"
            >
              <span className="font-black text-xs text-[#1C1917] group-hover:text-[#C5A880] transition-colors">{c.label}</span>
              <span className="text-[7.5px] font-bold text-[#78716C] mt-0.5 leading-none">{c.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Интерактивный таймлайн: ПОЛНЫЙ СПЕКТР УСЛУГ */}
      <div className="px-4 mt-6 select-none">
        <div className="bg-white border border-[#EFEBE4] rounded-3xl p-5 shadow-sm">
          <div className="text-center pb-3 border-b border-[#EFEBE4]">
            <h3 className="font-display text-[10px] font-black uppercase tracking-widest text-[#1C1917]">
              Полный спектр услуг
            </h3>
            <p className="text-[8px] text-[#78716C] font-bold uppercase tracking-widest mt-1">
              Этапы Вашей безопасности с DA!CAR
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 text-center">
            {[
              { num: '1', name: 'ПОДБОР', desc: 'Подбор идеального авто под ваши пожелания.', icon: Search },
              { num: '2', name: 'ПРОВЕРКА', desc: 'Тщательная проверка и диагностика кузова.', icon: Check },
              { num: '3', name: 'ПОКУПКА', desc: 'Безопасная сделка, юридический договор.', icon: ShieldCheck },
              { num: '4', name: 'ДОСТАВКА', desc: 'Бережная международная логистика.', icon: Truck },
              { num: '5', name: 'ТАМОЖНЯ', desc: 'Беспроблемное оформление всех документов.', icon: FileText },
              { num: '6', name: 'ВРУЧЕНИЕ', desc: 'Доставка прямо к вашему дому.', icon: Award }
            ].map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <div key={idx} className="flex flex-col items-center group">
                  <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#EFEBE4] flex items-center justify-center text-[#C5A880] relative mb-1.5 shadow-sm">
                    <StepIcon className="w-3.5 h-3.5" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1C1917] border border-white text-white text-[7px] font-black flex items-center justify-center">
                      {step.num}
                    </span>
                  </div>
                  <h4 className="text-[9px] font-black text-[#1C1917] tracking-wider uppercase">{step.name}</h4>
                  <p className="text-[7px] text-[#78716C] leading-tight mt-0.5 font-medium max-w-[85px]">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Горячие предложения */}
      <div className="px-4 mt-6">
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="font-display text-[9px] font-black uppercase tracking-widest text-[#78716C] flex items-center space-x-1">
            <Flame className="w-3 h-3 text-[#C5A880] fill-[#C5A880]" />
            <span>Горячие предложения каталога</span>
          </h3>
          <button
            onClick={() => {
              triggerHaptic('light');
              setFilters({});
              setCurrentTab('catalog');
            }}
            className="text-[10px] text-[#C5A880] font-black uppercase tracking-wider hover:text-[#B0936B] transition-colors"
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
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10px' }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                onClick={() => handleOpenCar(car.id)}
                className="bg-white border border-[#EFEBE4] hover:border-[#C5A880]/25 rounded-3xl overflow-hidden flex flex-col shadow-sm cursor-pointer group animate-fade-in"
              >
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerHaptic('medium');
                    setActiveStoryCarId(car.id);
                  }}
                  className="h-44 overflow-hidden relative cursor-zoom-in"
                  title="Смотреть Stories"
                >
                  <img
                    src={car.images[0]}
                    alt={`${car.brand} ${car.model}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Stories badge */}
                  <div className="absolute top-3 left-3 bg-[#C5A880] text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg flex items-center space-x-0.5 z-10">
                    <span className="w-1 h-1 bg-white rounded-full animate-ping"></span>
                    <span>STORIES</span>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-3 right-3 flex space-x-1 z-10">
                    <span className="bg-white/90 backdrop-blur-md text-[#1C1917] text-[7.5px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider border border-black/[0.03]">
                      {car.country === 'China' ? 'КНР 🇨🇳' : car.country === 'South Korea' ? 'Корея 🇰🇷' : 'КР 🇰🇬'}
                    </span>
                    <span className={`text-[7.5px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider text-white ${
                      car.condition === 'new' ? 'bg-emerald-600' : 'bg-[#C5A880]'
                    }`}>
                      {car.condition === 'new' ? 'Новый' : `С пробегом`}
                    </span>
                  </div>
                  {/* Delivery Days */}
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md text-[#1C1917] text-[7.5px] font-black px-1.5 py-0.5 rounded flex items-center space-x-0.5 z-10 border border-black/[0.03]">
                    <Truck className="w-2.5 h-2.5 text-[#C5A880]" />
                    <span>~{car.deliveryDays} дней</span>
                  </div>
                </div>

                <div className="p-3.5 flex flex-col bg-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display font-black text-xs text-[#1C1917] group-hover:text-[#C5A880] transition-colors">
                        {car.brand} {car.model}
                      </h4>
                      <p className="text-[9px] text-[#78716C] font-mono mt-0.5">
                        {car.year} г. • {car.engineVolume} • {car.power} л.с.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] text-[#78716C] block uppercase tracking-widest font-mono">Итого под ключ</span>
                      <span className="font-display font-black text-[#C5A880] text-xs mt-0.5 block">
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

      {/* Двигатели под заказ */}
      <div className="px-4 mt-6">
        <h3 className="font-display text-[9px] font-black uppercase tracking-widest text-[#78716C]">
          Классификация по силовым установкам
        </h3>
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
              className="bg-white border border-[#EFEBE4] hover:border-[#C5A880]/40 hover:bg-[#FAF8F5]/50 text-[#1C1917] shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-bezier active:scale-95 cursor-pointer shadow-sm"
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Спецификация Офиса из Брошюры */}
      <div className="px-4 mt-6">
        <div className="bg-gradient-to-br from-[#FAF8F5] to-white border border-[#EFEBE4] rounded-3xl p-5 shadow-sm text-center">
          <h4 className="text-[9px] font-black text-[#1C1917] uppercase tracking-widest mb-3">Официальное представительство</h4>
          
          <div className="grid grid-cols-2 gap-4 text-left border-y border-[#EFEBE4] py-3 mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white border border-[#EFEBE4] flex items-center justify-center text-stone-700 shrink-0">
                <Globe className="w-3.5 h-3.5 text-[#C5A880]" />
              </div>
              <div>
                <p className="text-[7.5px] text-[#78716C] font-mono uppercase tracking-wider">Сайт</p>
                <p className="text-[11px] font-black text-[#1C1917] font-sans">dacar16.ru</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white border border-[#EFEBE4] flex items-center justify-center text-stone-700 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-[#C5A880]" />
              </div>
              <div>
                <p className="text-[7.5px] text-[#78716C] font-mono uppercase tracking-wider">Адрес</p>
                <p className="text-[9.5px] font-black text-[#1C1917] leading-tight">г.Казань, ул.Серова, д.48 к2</p>
              </div>
            </div>
          </div>

          <p className="text-[7.5px] text-[#78716C] font-black uppercase tracking-wider">
            Мировой опыт • Местное доверие • Индивидуальный подход
          </p>
        </div>
      </div>

      {/* Кнопка заказа особого подбора */}
      <div className="px-4 mt-6">
        <div className="bg-[#1C1917] rounded-3xl p-5 flex items-center justify-between shadow-lg relative overflow-hidden border border-[#EFEBE4]/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(197,168,128,0.15),transparent)] pointer-events-none" />
          <div className="max-w-[70%] z-10">
            <h4 className="font-display font-black text-[11px] text-white uppercase tracking-wider">
              Индивидуальный консьерж-подбор
            </h4>
            <p className="text-[10px] text-slate-300 font-bold mt-1 leading-tight">
              Оставьте заявку — куратор свяжется с вами для детального согласования
            </p>
          </div>
          <button
            onClick={() => {
              triggerHaptic('success');
              setCurrentTab('profile');
            }}
            className="w-10 h-10 bg-[#C5A880] hover:bg-[#B0936B] transition active:scale-95 rounded-full flex items-center justify-center text-white cursor-pointer shadow-md z-10"
          >
            <MessageSquare className="w-4 h-4 text-white fill-white" />
          </button>
        </div>
      </div>

    </div>
  );
}
