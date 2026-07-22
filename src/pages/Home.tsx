import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { formatCurrency, calculateFullCarPrice, EXCHANGE_RATES, getCarImages } from '../data/cars';
import { triggerHaptic } from '../utils/haptics';
import { ShieldCheck, Truck, Percent, Coins, MessageSquare, ArrowRight, Zap, Flame, Award, Sparkles, Globe, Crown, Shield, FileText, Check, HelpCircle, MapPin, Search, Play, HelpCircle as HelpIcon, TrendingUp, TrendingDown, RefreshCw, Heart, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const { 
    cars, 
    setCurrentTab, 
    setFilters, 
    setActiveCarId, 
    setActiveStoryCarId, 
    homepageBannerUrl,
    appTexts,
    favorites,
    toggleFavorite,
    selectedCity,
    cacheBuster
  } = useStore();

  // Feature 9: Onboarding Stories
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [activeServiceStep, setActiveServiceStep] = useState(0);
  const onboardingStories = [
    {
      title: 'Договор и 100% Гарантии',
      image: '/cars/st1.jpg', // Путь к вашему изображению в папке public/cars/
      tag: '💼 Гарантии',
      desc: `Все поставки застрахованы на 100% стоимости. Заключаем официальный юридический договор с ${appTexts.legalInfo.split('.')[0]}.`
    },
    {
      title: 'Детальный Тест-Осмотр',
      image: '/cars/st2.jpg', // Путь к вашему изображению в папке public/cars/
      tag: '🔍 Осмотр',
      desc: 'Наш инспектор в Китае или Корее выезжает на осмотр по 150+ параметрам. Предоставляем полный замер ЛКП, фото и видеоотчет 4K.'
    },
    {
      title: 'Премиум Логистика',
      image: '/cars/st3.jpg', // Путь к вашему изображению в папке public/cars/
      tag: '🚛 Доставка',
      desc: 'Транспортировка осуществляется в закрытых брендированных автовозах премиум-класса. Полная защита от дорожного мусора и камней.'
    },
    {
      title: 'Офис',
      image: '/cars/st4.jpg', // Путь к вашему изображению в папке public/cars/
      tag: '🏢 Офис',
      desc: `Приглашаем вас в наш главный офис по адресу: ${appTexts.showroomAddress}. Проведем полную предпродажную подготовку и выдадим авто!`
    }
  ];

  // Эффект воспроизведения Stories
  useEffect(() => {
    if (activeStoryIndex === null) return;
    setStoryProgress(0);
    const interval = setInterval(() => {
      setStoryProgress((p) => {
        if (p >= 100) {
          if (activeStoryIndex < onboardingStories.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1);
            return 0;
          } else {
            setActiveStoryIndex(null);
            return 0;
          }
        }
        return p + 2.5; // Завершение за 4 секунды
      });
    }, 100);
    return () => clearInterval(interval);
  }, [activeStoryIndex]);

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

  // Рекомендованные авто (первые 6)
  const hotCars = cars.slice(0, 6);

  return (
    <div className="flex flex-col text-[#1C1917] pb-12 select-none bg-[#F0EEEC]">
      
      {/* Премиум Баннер */}
      <div className="relative px-4 pt-4 select-none">
        <div 
          className="h-56 rounded-3xl p-5 flex flex-col justify-between text-white overflow-hidden relative border border-[#EFEBE4] shadow-md bg-cover bg-center transition-all duration-500"
          style={{ 
            backgroundImage: `url(${homepageBannerUrl || '/banner-header.jpg'})`,
            backgroundColor: '#1C1917'
          }}
        >
          {/* Overlay to ensure ultra-premium look */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917] via-[#1C1917]/40 to-black/20 z-0" />

          <div className="flex justify-between items-start z-10">
            <div>
              <span className="bg-[#C5A880] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-wider shadow-sm">
                Luxury Concierge
              </span>
              <h2 className="font-display text-xl font-black mt-2 leading-tight tracking-tight text-white uppercase">
                {appTexts.homeTitle} <br />
                <span className="text-[#C5A880]">
                  {appTexts.homeSubtitle}
                </span>
              </h2>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-[#C5A880] shadow-sm">
              <Award className="w-4 h-4" />
            </div>
          </div>

          <div className="flex justify-between items-end z-10 border-t border-white/10 pt-3 mt-2">
            <div>
              <p className="text-[8px] text-slate-400 uppercase tracking-widest font-mono">Главный офис</p>
              <p className="text-[11px] font-bold text-white mt-0.5">{appTexts.showroomAddress}</p>
            </div>
            <button
              onClick={() => {
                triggerHaptic('medium');
                setCurrentTab('catalog');
              }}
              className="bg-white hover:bg-[#F0EEEC] text-[#1C1917] px-4 py-2 rounded-xl text-[10px] font-black flex items-center space-x-1.5 cursor-pointer active:scale-95 transition-bezier shadow-md"
            >
              <span>Подобрать</span>
              <ArrowRight className="w-3 h-3 text-[#1C1917]" />
            </button>
          </div>
        </div>
      </div>

      {/* Feature 9: Круглые Истории Онбординга */}
      <div className="px-4 mt-6">
        <h3 className="font-display text-[9px] font-black uppercase tracking-widest text-[#78716C] mb-2.5 flex items-center space-x-1">
          <Play className="w-3 h-3 text-[#C5A880] fill-[#C5A880]" />
          <span>Гарантии и Стандарты DA!CAR</span>
        </h3>
        <div className="flex space-x-3.5 overflow-x-auto pb-1.5 scrollbar-none select-none">
          {onboardingStories.map((s, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.08, ease: 'easeOut' }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                triggerHaptic('medium');
                setActiveStoryIndex(idx);
              }}
              className="flex flex-col items-center shrink-0 focus:outline-none cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-full p-[2.5px] bg-gradient-to-tr from-[#C5A880] to-[#EFEBE4] shadow-md transition duration-200">
                <div className="w-full h-full rounded-full border-2 border-white overflow-hidden">
                  <img src={s.image} className="w-full h-full object-cover" alt={s.tag} />
                </div>
              </div>
              <span className="text-[8.5px] font-black text-[#1C1917] mt-1.5 leading-tight text-center truncate w-14">
                {s.tag.split(' ')[1]}
              </span>
            </motion.button>
          ))}
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
            { id: 'South Korea', label: 'Корея 🇰🇷', desc: 'Дизель / Benz' },
            { id: 'Kyrgyzstan', label: 'Киргизия 🇰🇬', desc: 'Мгновенный транзит' }
          ].map((c, idx) => (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1, ease: 'easeOut' }}
              whileHover={{ y: -3, scale: 1.03, borderColor: '#C5A880/50' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleCountrySelect(c.id as any)}
              className="bg-white border border-[#EFEBE4] active:scale-95 transition-bezier p-3 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm cursor-pointer group"
            >
              <span className="font-black text-xs text-[#1C1917] group-hover:text-[#C5A880] transition-colors">{c.label}</span>
              <span className="text-[7.5px] font-bold text-[#78716C] mt-0.5 leading-none">{c.desc}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Интерактивный премиум-таймлайн: ПОЛНЫЙ СПЕКТР УСЛУГ */}
      <div className="px-4 mt-6 select-none">
        <div className="bg-white border border-[#EFEBE4] rounded-3xl p-5 shadow-sm">
          <div className="text-center pb-3 border-b border-[#EFEBE4]/60">
            <h3 className="font-display text-[10px] font-black uppercase tracking-widest text-[#1C1917]">
              Полный спектр услуг
            </h3>
            <p className="text-[8px] text-[#78716C] font-bold uppercase tracking-widest mt-1">
              Этапы Вашей безопасности с DA!CAR
            </p>
          </div>

          {/* Интерактивные шаги (Плитки-табы) */}
          <div className="grid grid-cols-3 gap-2 pt-4">
            {[
              { num: '1', name: 'ПОДБОР', icon: Search, title: 'Подбор под ключ', desc: 'Анализируем аукционы и дилерские базы КНР, Кореи и ОАЭ. Находим идеальные варианты.', bullets: ['Анализ рынков в реальном времени', 'Доступ к закрытым площадкам дилеров', 'Согласование комплектации до мелочей'], outcome: 'Точное попадание в бюджет и параметры без скрытых комиссий.' },
              { num: '2', name: 'ПРОВЕРКА', icon: Check, title: 'Экспертная проверка', desc: 'Наш инспектор выезжает на осмотр по 150+ параметрам с видео 4K и замером ЛКП.', bullets: ['Полный замер толщины ЛКП', 'Компьютерное чтение блоков', 'Проверка батареи электрокаров'], outcome: 'Абсолютно честное понимание состояния перед оплатой.' },
              { num: '3', name: 'ПОКУПКА', icon: ShieldCheck, title: 'Официальный договор', desc: 'Заключаем юридический договор. Оплата напрямую в банк по официальному инвойсу.', bullets: ['Юридический договор с гарантией', 'Оплата через банк по инвойсу', 'Фиксация итоговой цены под ключ'], outcome: '100% юридическая чистота сделки и защита бюджета.' },
              { num: '4', name: 'ДОСТАВКА', icon: Truck, title: 'Премиум логистика', desc: 'Бережная доставка в закрытых автовозах. Страхование на 100% стоимости авто.', bullets: ['Страхование на всех этапах пути', 'Транспортировка в закрытых автовозах', 'GPS-мониторинг местоположения'], outcome: 'Безупречная защита кузова от дорожного мусора.' },
              { num: '5', name: 'ТАМОЖНЯ', icon: FileText, title: 'Оформление документов', desc: 'Быстрое прохождение таможни во Владивостоке или странах ЕАЭС со списанием утильсбора.', bullets: ['Выдача легальных СБКТС и ЭПТС', 'Официальное списание утильсбора', 'Полный пакет для ГИБДД'], outcome: 'Легальный автомобиль, готовый к постановке на учет.' },
              { num: '6', name: 'ВРУЧЕНИЕ', icon: Award, title: 'Торжественная выдача', desc: 'Проводим полный детейлинг авто. Торжественная выдача в офисе или доставка к дому.', bullets: ['Премиальная мойка и детейлинг', 'Вручение в офисе с подарками', 'Доставка эвакуатором прямо к дому'], outcome: 'Незабываемые эмоции и идеальный вид вашей новой машины.' }
            ].map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = activeServiceStep === idx;
              return (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.05, ease: 'easeOut' }}
                  whileHover={{ scale: isActive ? 1.02 : 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveServiceStep(idx);
                  }}
                  className={`relative flex flex-col items-center p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer text-center ${
                    isActive
                      ? 'bg-gradient-to-br from-[#1C1917] to-[#2D2A26] border-[#1C1917] text-white shadow-md scale-[1.02]'
                      : 'bg-[#F0EEEC]/45 border-[#EFEBE4] text-[#1C1917] hover:bg-[#F0EEEC]/70'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center relative mb-1.5 transition-colors ${
                    isActive ? 'bg-[#C5A880] text-white' : 'bg-white border border-[#EFEBE4] text-[#C5A880]'
                  }`}>
                    <StepIcon className="w-3.5 h-3.5" />
                    <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[7.5px] font-black flex items-center justify-center border transition-colors ${
                      isActive ? 'bg-white text-[#1C1917] border-[#1C1917]' : 'bg-[#1C1917] text-white border-white'
                    }`}>
                      {step.num}
                    </span>
                  </div>
                  <h4 className={`text-[8.5px] font-black tracking-wider uppercase transition-colors ${
                    isActive ? 'text-[#C5A880]' : 'text-[#1C1917]'
                  }`}>
                    {step.name}
                  </h4>
                </motion.button>
              );
            })}
          </div>

          {/* Информационный блок активного шага с плавной анимацией */}
          <div className="mt-4 pt-4 border-t border-[#EFEBE4]/60">
            <AnimatePresence mode="wait">
              {[
                { num: '1', name: 'ПОДБОР', icon: Search, title: 'Подбор под ключ', desc: 'Анализируем аукционы и дилерские базы КНР, Кореи и ОАЭ. Находим идеальные варианты.', bullets: ['Анализ рынков в реальном времени', 'Доступ к закрытым площадкам дилеров', 'Согласование комплектации до мелочей'], outcome: 'Точное попадание в бюджет и параметры без скрытых комиссий.' },
                { num: '2', name: 'ПРОВЕРКА', icon: Check, title: 'Экспертная проверка', desc: 'Наш инспектор выезжает на осмотр по 150+ параметрам с видео 4K и замером ЛКП.', bullets: ['Полный замер толщины ЛКП', 'Компьютерное чтение блоков', 'Проверка батареи электрокаров'], outcome: 'Абсолютно честное понимание состояния перед оплатой.' },
                { num: '3', name: 'ПОКУПКА', icon: ShieldCheck, title: 'Официальный договор', desc: 'Заключаем юридический договор. Оплата напрямую в банк по официальному инвойсу.', bullets: ['Юридический договор с гарантией', 'Оплата через банк по инвойсу', 'Фиксация итоговой цены под ключ'], outcome: '100% юридическая чистота сделки и защита бюджета.' },
                { num: '4', name: 'ДОСТАВКА', icon: Truck, title: 'Премиум логистика', desc: 'Бережная доставка в закрытых автовозах. Страхование на 100% стоимости авто.', bullets: ['Страхование на всех этапах пути', 'Транспортировка в закрытых автовозах', 'GPS-мониторинг местоположения'], outcome: 'Безупречная защита кузова от дорожного мусора.' },
                { num: '5', name: 'ТАМОЖНЯ', icon: FileText, title: 'Оформление документов', desc: 'Быстрое прохождение таможни во Владивостоке или странах ЕАЭС со списанием утильсбора.', bullets: ['Выдача легальных СБКТС и ЭПТС', 'Официальное списание утильсбора', 'Полный пакет для ГИБДД'], outcome: 'Легальный автомобиль, готовый к постановке на учет.' },
                { num: '6', name: 'ВРУЧЕНИЕ', icon: Award, title: 'Торжественная выдача', desc: 'Проводим полный детейлинг авто. Торжественная выдача в офисе или доставка к дому.', bullets: ['Премиальная мойка и детейлинг', 'Вручение в офисе с подарками', 'Доставка эвакуатором прямо к дому'], outcome: 'Незабываемые эмоции и идеальный вид вашей новой машины.' }
              ].map((step, idx) => {
                if (activeServiceStep !== idx) return null;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] bg-[#C5A880]/15 text-[#C5A880] font-black px-2 py-0.5 rounded-md font-mono">
                        Этап {step.num}
                      </span>
                      <h5 className="text-[11px] font-black text-[#1C1917] uppercase tracking-wide">
                        {step.title}
                      </h5>
                    </div>

                    <p className="text-[10px] text-[#57534E] leading-relaxed font-medium">
                      {step.desc}
                    </p>

                    <div className="space-y-1.5 bg-[#F0EEEC]/30 p-3 rounded-2xl border border-[#EFEBE4]/40">
                      <p className="text-[8px] font-black uppercase tracking-wider text-[#78716C] font-mono mb-1">Что входит в этап:</p>
                      {step.bullets.map((b, bIdx) => (
                        <div key={bIdx} className="flex items-start space-x-2 text-[9px] text-[#1C1917]">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="font-bold">{b}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-[#1C1917] text-white p-2.5 rounded-xl flex items-center space-x-2 shadow-sm">
                      <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <Sparkles className="w-3 h-3 text-[#C5A880]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[7px] text-stone-400 font-mono uppercase tracking-wider">Результат этапа:</p>
                        <p className="text-[8.5px] font-black text-stone-100 truncate">{step.outcome}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Второй баннер "Автомобили под заказ без лишних хлопот" (header2.jpg) */}
      <div className="px-4 mt-6">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          id="second-custom-banner"
          className="w-full relative overflow-hidden rounded-3xl border border-[#EFEBE4] bg-white shadow-sm cursor-pointer"
          onClick={() => {
            triggerHaptic('medium');
            setCurrentTab('catalog');
          }}
        >
          <img 
            src="/header2.jpg" 
            alt="Автомобили под заказ без лишних хлопот" 
            className="w-full h-auto object-cover select-none"
            onError={() => {
              const bannerEl = document.getElementById('second-custom-banner');
              if (bannerEl) bannerEl.style.display = 'none';
            }}
          />
        </motion.div>
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
            const calculated = calculateFullCarPrice(car, selectedCity);
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
                    src={getCarImages(car)[0]}
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
                      <span className="text-[8px] text-[#78716C] block uppercase tracking-widest font-mono">Цена под ключ от</span>
                      <span className="font-display font-black text-[#C5A880] text-xs mt-0.5 block">
                        {formatCurrency(calculated.finalPriceRUB, true)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(car.id);
                      }}
                      className="p-2 border border-[#EFEBE4] hover:border-[#C5A880]/30 rounded-xl bg-[#F0EEEC] active:scale-95 transition cursor-pointer shrink-0"
                    >
                      <Heart className={`w-4 h-4 ${favorites.includes(car.id) ? 'fill-red-500 text-red-500' : 'text-[#78716C]'}`} />
                    </button>
                    <button
                      onClick={() => handleOpenCar(car.id)}
                      className="flex-1 py-2 bg-[#1C1917] hover:bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition active:scale-95 cursor-pointer flex items-center justify-center space-x-1"
                    >
                      <span>Подробнее об авто</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Спецификация Офиса из Брошюры */}
      <div className="px-4 mt-6">
        <div className="bg-gradient-to-br from-[#F0EEEC] to-white border border-[#EFEBE4] rounded-3xl p-5 shadow-sm text-center">
          <h4 className="text-[9px] font-black text-[#1C1917] uppercase tracking-widest mb-3">Официальное представительство</h4>
          
          <div className="grid grid-cols-2 gap-4 text-left border-y border-[#EFEBE4] py-3 mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white border border-[#EFEBE4] flex items-center justify-center text-stone-700 shrink-0">
                <Globe className="w-3.5 h-3.5 text-[#C5A880]" />
              </div>
              <div>
                <p className="text-[7.5px] text-[#78716C] font-mono uppercase tracking-wider">Сайт</p>
                <p className="text-[11px] font-black text-[#1C1917] font-sans">{appTexts.websiteUrl}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-white border border-[#EFEBE4] flex items-center justify-center text-stone-700 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-[#C5A880]" />
              </div>
              <div>
                <p className="text-[7.5px] text-[#78716C] font-mono uppercase tracking-wider">Адрес</p>
                <p className="text-[9.5px] font-black text-[#1C1917] leading-tight">{appTexts.showroomAddress}</p>
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

      {/* Feature 9: Полноэкранный просмотр Onboarding Stories */}
      <AnimatePresence>
        {activeStoryIndex !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-[#1C1917] text-white z-50 flex flex-col justify-between p-6 select-none"
          >
            {/* Шкала воспроизведения сверху */}
            <div className="flex space-x-1.5 w-full mt-4">
              {onboardingStories.map((_, i) => {
                let progress = 0;
                if (i < activeStoryIndex) progress = 100;
                if (i === activeStoryIndex) progress = storyProgress;
                return (
                  <div key={i} className="flex-1 h-1 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C5A880] transition-all duration-100 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Шапка истории */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full border border-[#C5A880] overflow-hidden">
                  <img src="/logo-icon.jpg" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = onboardingStories[activeStoryIndex].image; }} />
                </div>
                <div>
                  <span className="text-xs font-black text-white block uppercase tracking-wider">DA!CAR Concierge</span>
                  <span className="text-[9px] text-[#78716C] block font-mono leading-none">Стандарты импорта</span>
                </div>
              </div>
              <button
                onClick={() => { triggerHaptic('light'); setActiveStoryIndex(null); }}
                className="w-8 h-8 bg-neutral-800/80 backdrop-blur-md text-neutral-400 rounded-full flex items-center justify-center font-bold hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Изображение и Текст истории */}
            <div className="flex-1 flex flex-col justify-center items-center my-6 space-y-6">
              <div className="w-full max-h-72 aspect-video rounded-3xl overflow-hidden shadow-2xl border border-neutral-800">
                <img
                  src={onboardingStories[activeStoryIndex].image}
                  className="w-full h-full object-cover"
                  alt="Story Visual"
                />
              </div>

              <div className="text-center px-2 space-y-3">
                <span className="text-[9.5px] font-black uppercase tracking-widest text-[#C5A880] bg-[#C5A880]/15 border border-[#C5A880]/30 px-3.5 py-1.5 rounded-full inline-block font-mono">
                  {onboardingStories[activeStoryIndex].tag}
                </span>
                <h2 className="font-display font-black text-xl tracking-tight leading-tight uppercase">
                  {onboardingStories[activeStoryIndex].title}
                </h2>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
                  {onboardingStories[activeStoryIndex].desc}
                </p>
              </div>
            </div>

            {/* Нижняя навигация по историям */}
            <div className="flex justify-between items-center border-t border-neutral-800 pt-4 shrink-0 mb-4">
              <button
                disabled={activeStoryIndex === 0}
                onClick={() => { triggerHaptic('light'); setActiveStoryIndex(activeStoryIndex - 1); }}
                className="text-xs font-bold text-neutral-400 hover:text-white disabled:opacity-20 py-2 cursor-pointer"
              >
                ← Назад
              </button>
              
              <button
                onClick={() => {
                  triggerHaptic('light');
                  if (activeStoryIndex < onboardingStories.length - 1) {
                    setActiveStoryIndex(activeStoryIndex + 1);
                  } else {
                    setActiveStoryIndex(null);
                  }
                }}
                className="py-2.5 px-5 bg-[#C5A880] hover:bg-[#B0936B] text-[#1C1917] text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                {activeStoryIndex === onboardingStories.length - 1 ? 'Завершить' : 'Далее →'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
