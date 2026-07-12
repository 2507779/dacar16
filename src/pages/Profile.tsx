/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { triggerHaptic } from '../utils/haptics';
import { User, MessageSquare, Phone, MapPin, ShieldAlert, BadgeCheck, HelpCircle, ChevronDown, Send, ArrowUpRight, Settings, Plus, Trash2, Copy, Check, Car, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Profile() {
  const { cars, addCar, deleteCar, orders } = useStore();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [activeConsultation, setActiveConsultation] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Поля формы нового авто
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newGen, setNewGen] = useState('I');
  const [newYear, setNewYear] = useState(2024);
  const [newMileage, setNewMileage] = useState(0);
  const [newCond, setNewCond] = useState<'new' | 'used'>('new');
  const [newCountry, setNewCountry] = useState<'China' | 'South Korea' | 'Kyrgyzstan'>('China');
  const [newBody, setNewBody] = useState('Внедорожник');
  const [newEngine, setNewEngine] = useState<'gasoline' | 'diesel' | 'hybrid' | 'electric'>('gasoline');
  const [newEngineVol, setNewEngineVol] = useState('2.0T');
  const [newPower, setNewPower] = useState(220);
  const [newDrive, setNewDrive] = useState<'AWD' | 'FWD' | 'RWD'>('AWD');
  const [newTrans, setNewTrans] = useState<'Automatic' | 'Manual' | 'Robotic' | 'Single-speed'>('Automatic');
  const [newColor, setNewColor] = useState('Черный металлик');
  const [newPriceUSD, setNewPriceUSD] = useState(28000);
  const [newCustomsEUR, setNewCustomsEUR] = useState(4500);
  const [newRecyclingRUB, setNewRecyclingRUB] = useState(3400);
  const [newImgUrl, setNewImgUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newFeatures, setNewFeatures] = useState('Светодиодные фары, Панорамная крыша, Адаптивный круиз-контроль, Вентиляция сидений');

  const [consultationChat, setConsultationChat] = useState<Array<{ sender: 'manager' | 'user'; text: string }>>([
    { sender: 'manager', text: 'Приветствуем! Я дежурный менеджер отдела логистики DA!CAR. Выберите интересующий вас вопрос ниже, и я подробно отвечу вам.' }
  ]);

  const faqData = [
    {
      q: 'Как рассчитывается таможенная пошлина?',
      a: 'Пошлина зависит от возраста авто, типа двигателя (ДВС, гибрид, электро) и объема двигателя. Для физлиц выгоднее всего везти машины в возрасте от 3 до 5 лет. Электромобили облагаются 15% пошлиной от стоимости инвойса. Мы берем все расчеты и таможенное оформление под свой полный контроль.'
    },
    {
      q: 'Можно ли привезти авто в лизинг или кредит?',
      a: 'Да! Мы работаем со всеми крупными лизинговыми компаниями РФ и банками-партнерами. Вы можете приобрести автомобиль с НДС для юрлиц или оформить стандартный автокредит для физлиц.'
    },
    {
      q: 'Какая процедура оплаты?',
      a: 'Оплата производится поэтапно: 1) Депозит 100 000 руб. при подписании договора на подбор, 2) Оплата стоимости авто на аукционе банковским SWIFT-переводом, 3) Оплата таможни и доставки по прибытии авто во Владивосток или на границу.'
    },
    {
      q: 'Где забирать готовый автомобиль?',
      a: 'Наш главный филиал выдачи находится в Казани на Спартаковской 6. Мы проводим полную предпродажную подготовку, детейлинг и передаем авто на закрытой площадке. Также отправляем закрытыми автовозами в Москву, СПб, Екатеринбург и любой другой город РФ.'
    }
  ];

  const consultantQuestions = [
    {
      q: 'Какие документы нужны для договора?',
      a: 'Для заключения договора на импорт потребуется ваш паспорт РФ (для физлица) или реквизиты компании (для юрлица), а также ИНН для таможенного декларирования.'
    },
    {
      q: 'Включен ли утильсбор в стоимость?',
      a: 'В наших расчетах мы всегда указываем льготный утильсбор для личного пользования (3 400 руб. за новое авто, 5 200 руб. за б/у). Если вам нужен коммерческий утиль для перепродажи в течение 12 месяцев, мы пересчитаем тариф.'
    },
    {
      q: 'Как отслеживать статус машины?',
      a: 'Статус обновляется автоматически в разделе «Заказы» вашего Mini App. При каждом прохождении рубежа (граница, лаборатория, автовоз) вам также приходит Telegram-уведомление.'
    }
  ];

  const handleAskQuestion = (q: string, a: string) => {
    triggerHaptic('medium');
    setConsultationChat(prev => [
      ...prev,
      { sender: 'user', text: q }
    ]);

    // Эмуляция ответа менеджера
    setTimeout(() => {
      triggerHaptic('success');
      setConsultationChat(prev => [
        ...prev,
        { sender: 'manager', text: a }
      ]);
    }, 800);
  };

  const handleAddCarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand || !newModel) {
      triggerHaptic('error');
      alert('Пожалуйста, укажите марку и модель автомобиля!');
      return;
    }

    const defaultImages = [
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80'
    ];
    const finalImg = newImgUrl.trim() || defaultImages[Math.floor(Math.random() * defaultImages.length)];
    const finalCarId = `${newBrand.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${newModel.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${newYear}`;

    const newCar = {
      id: `${finalCarId}-${Date.now()}`,
      brand: newBrand,
      model: newModel,
      generation: newGen,
      year: Number(newYear),
      mileage: Number(newMileage),
      condition: newCond,
      country: newCountry,
      bodyType: newBody,
      engineType: newEngine,
      engineVolume: newEngineVol,
      power: Number(newPower),
      driveType: newDrive,
      transmission: newTrans,
      color: newColor,
      priceUSD: Number(newPriceUSD),
      customsEUR: Number(newCustomsEUR),
      recyclingRUB: Number(newRecyclingRUB),
      images: [finalImg],
      description: newDesc.trim() || `Премиальный автомобиль ${newBrand} ${newModel} напрямую из ${newCountry === 'China' ? 'Китая' : newCountry === 'South Korea' ? 'Южной Кореи' : 'Киргизии'} под заказ. Полный комплект документов, утилизационный сбор включен. Доставка под ключ.`,
      features: newFeatures.split(',').map(f => f.trim()).filter(Boolean),
      deliveryDays: newCountry === 'China' ? 25 : newCountry === 'South Korea' ? 35 : 12
    };

    addCar(newCar as any);
    triggerHaptic('success');
    
    // Сбросить поля кроме базовых
    setNewBrand('');
    setNewModel('');
    setNewImgUrl('');
    setNewDesc('');
    
    alert('✅ Автомобиль успешно добавлен в базу каталога!');
  };

  const handleCopyCode = () => {
    triggerHaptic('medium');
    const formattedCars = JSON.stringify(cars, null, 2);
    const tsCode = `import { Car } from '../types';

export const EXCHANGE_RATES = {
  USD_TO_RUB: 92.5,
  EUR_TO_RUB: 100.5
};

export const BASE_DELIVERY_KAZAN_RUB = 150000;
export const BROKER_FEE_RUB = 45000;
export const COMPANY_COMMISSION = 100000;

export const DELIVERY_CITIES = [
  'Казань (Главный филиал)',
  'Москва',
  'Санкт-Петербург',
  'Набережные Челны',
  'Самара',
  'Екатеринбург',
  'Уфа'
];

export function calculateFullCarPrice(car: Car, city: string = 'Казань (Главный филиал)') {
  const usdToRub = EXCHANGE_RATES.USD_TO_RUB;
  const eurToRub = EXCHANGE_RATES.EUR_TO_RUB;
  const carCostRUB = car.priceUSD * usdToRub;
  const customsRUB = car.customsEUR * eurToRub;
  const baseDelivery = BASE_DELIVERY_KAZAN_RUB;
  let cityDeliveryExtra = 0;
  if (city === 'Москва') cityDeliveryExtra = 25000;
  else if (city === 'Санкт-Петербург') cityDeliveryExtra = 40000;
  else if (city === 'Екатеринбург') cityDeliveryExtra = 35000;
  else if (city !== 'Казань (Главный филиал)') cityDeliveryExtra = 15000;
  const totalDeliveryRUB = baseDelivery + cityDeliveryExtra;
  const finalPriceRUB = carCostRUB + customsRUB + car.recyclingRUB + totalDeliveryRUB + BROKER_FEE_RUB + COMPANY_COMMISSION;
  return {
    carCostRUB,
    customsRUB,
    recyclingRUB: car.recyclingRUB,
    totalDeliveryRUB,
    brokerFeeRUB: BROKER_FEE_RUB,
    commissionRUB: COMPANY_COMMISSION,
    finalPriceRUB
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  }).format(value);
}

export const CARS_DATA: Car[] = ${formattedCars};
`;

    navigator.clipboard.writeText(tsCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const toggleFaq = (index: number) => {
    triggerHaptic('light');
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col text-neutral-900 pb-12 select-none">
      
      {/* Профиль Пользователя */}
      <div className="px-4 pt-6 pb-4 bg-white border-b border-neutral-100 flex items-center space-x-4">
        <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-amber-600 rounded-full flex items-center justify-center font-display font-black text-white text-xl shadow-lg relative shrink-0">
          U
          <span className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white">✓</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-extrabold text-base text-neutral-950 flex items-center space-x-1.5">
            <span>Premium Клиент</span>
          </h2>
          <p className="text-xs text-gray-400 truncate">tg_user_id: 841b57fe</p>
          <div className="flex space-x-2 mt-1.5">
            <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
              Активных заказов: {orders.length}
            </span>
          </div>
        </div>
      </div>

      {/* Быстрые Кнопки Контактов */}
      <div className="grid grid-cols-2 gap-3 px-4 mt-4">
        <button
          onClick={() => {
            triggerHaptic('medium');
            setActiveConsultation(true);
          }}
          className="bg-white border border-neutral-200/80 hover:border-amber-400 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.01)] active:scale-95 transition cursor-pointer"
        >
          <MessageSquare className="w-6 h-6 text-amber-500" />
          <span className="text-xs font-bold text-neutral-950 mt-2">Чат с менеджером</span>
          <span className="text-[8px] text-gray-400 mt-0.5">Консультация онлайн</span>
        </button>

        <a
          href="tel:+78432220099"
          onClick={() => triggerHaptic('light')}
          className="bg-white border border-neutral-200/80 hover:border-amber-400 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-[0_2px_8px_rgba(0,0,0,0.01)] active:scale-95 transition cursor-pointer"
        >
          <Phone className="w-6 h-6 text-emerald-500" />
          <span className="text-xs font-bold text-neutral-950 mt-2">Позвонить в офис</span>
          <span className="text-[8px] text-gray-400 mt-0.5">+7 (843) 222-00-99</span>
        </a>
      </div>

      {/* ПАНЕЛЬ УПРАВЛЕНИЯ / АДМИНКА (Добавление новых авто, изменение текстов) */}
      <div className="px-4 mt-6">
        <button
          onClick={() => {
            triggerHaptic('medium');
            setIsAdminOpen(!isAdminOpen);
          }}
          className="w-full bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-800 text-white rounded-3xl p-4 flex items-center justify-between shadow-lg border border-neutral-800 hover:border-amber-400/50 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-neutral-950 shadow-inner">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-xs uppercase tracking-wide">Панель администратора</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">Добавление авто, удаление & экспорт кода</p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isAdminOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isAdminOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-neutral-900 text-white border border-neutral-800 rounded-3xl p-5 mt-3 space-y-5 shadow-inner">
                
                {/* 1. Блок копирования TS-кода */}
                <div className="border-b border-neutral-800 pb-4">
                  <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <Copy className="w-4 h-4" />
                    <span>Сохранение изменений навсегда</span>
                  </h5>
                  <p className="text-[10px] text-neutral-300 leading-relaxed mb-3">
                    Чтобы добавленные вами автомобили сохранились в файлах проекта навсегда (и были видны в Telegram), нажмите кнопку ниже, скопируйте сформированный TypeScript-код и полностью замените им содержимое файла <code className="text-amber-300 bg-neutral-950 px-1 py-0.5 rounded font-mono">/src/data/cars.ts</code>.
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer active:scale-95 ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-400 hover:bg-amber-500 text-neutral-950'
                    }`}
                  >
                    {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopied ? 'Код скопирован в буфер!' : 'Скопировать TS-код для cars.ts'}</span>
                  </button>
                </div>

                {/* 2. Форма добавления нового автомобиля */}
                <form onSubmit={handleAddCarSubmit} className="space-y-4">
                  <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <Plus className="w-4.5 h-4.5" />
                    <span>Добавить новый автомобиль</span>
                  </h5>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Марка *</label>
                      <input
                        type="text"
                        value={newBrand}
                        onChange={(e) => setNewBrand(e.target.value)}
                        placeholder="Напр. Lixiang"
                        required
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:border-amber-400 outline-none text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Модель *</label>
                      <input
                        type="text"
                        value={newModel}
                        onChange={(e) => setNewModel(e.target.value)}
                        placeholder="Напр. L9 Ultra"
                        required
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:border-amber-400 outline-none text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Поколение</label>
                      <input
                        type="text"
                        value={newGen}
                        onChange={(e) => setNewGen(e.target.value)}
                        placeholder="Напр. I Restyling"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs focus:border-amber-400 outline-none text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Год выпуска</label>
                      <input
                        type="number"
                        value={newYear}
                        onChange={(e) => setNewYear(Number(e.target.value))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs focus:border-amber-400 outline-none text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Пробег (км)</label>
                      <input
                        type="number"
                        value={newMileage}
                        onChange={(e) => setNewMileage(Number(e.target.value))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs focus:border-amber-400 outline-none text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Состояние</label>
                      <select
                        value={newCond}
                        onChange={(e: any) => setNewCond(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2 text-xs focus:border-amber-400 outline-none text-white"
                      >
                        <option value="new">Новый</option>
                        <option value="used">С пробегом</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Страна экспорта</label>
                      <select
                        value={newCountry}
                        onChange={(e: any) => setNewCountry(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2 text-xs focus:border-amber-400 outline-none text-white"
                      >
                        <option value="China">Китай 🇨🇳</option>
                        <option value="South Korea">Корея 🇰🇷</option>
                        <option value="Kyrgyzstan">Киргизия 🇰🇬</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Кузов</label>
                      <input
                        type="text"
                        value={newBody}
                        onChange={(e) => setNewBody(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs focus:border-amber-400 outline-none text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Двигатель</label>
                      <select
                        value={newEngine}
                        onChange={(e: any) => setNewEngine(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:border-amber-400 outline-none text-white"
                      >
                        <option value="gasoline">Бензин ⛽</option>
                        <option value="diesel">Дизель ⚙️</option>
                        <option value="hybrid">Гибрид 🔋</option>
                        <option value="electric">Электро ⚡</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Объем (напр. 1.5T / Dual Motor)</label>
                      <input
                        type="text"
                        value={newEngineVol}
                        onChange={(e) => setNewEngineVol(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:border-amber-400 outline-none text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Мощность (л.с.)</label>
                      <input
                        type="number"
                        value={newPower}
                        onChange={(e) => setNewPower(Number(e.target.value))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs focus:border-amber-400 outline-none text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Привод</label>
                      <select
                        value={newDrive}
                        onChange={(e: any) => setNewDrive(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2 text-xs focus:border-amber-400 outline-none text-white"
                      >
                        <option value="AWD">Полный (AWD)</option>
                        <option value="FWD">Передний (FWD)</option>
                        <option value="RWD">Задний (RWD)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Трансмиссия</label>
                      <select
                        value={newTrans}
                        onChange={(e: any) => setNewTrans(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2 py-2 text-xs focus:border-amber-400 outline-none text-white"
                      >
                        <option value="Automatic">Автомат</option>
                        <option value="Robotic">Робот</option>
                        <option value="Manual">Механика</option>
                        <option value="Single-speed">Редуктор</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Цвет кузова</label>
                      <input
                        type="text"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs focus:border-amber-400 outline-none text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Цена закупа ($ USD)</label>
                      <input
                        type="number"
                        value={newPriceUSD}
                        onChange={(e) => setNewPriceUSD(Number(e.target.value))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs focus:border-amber-400 outline-none text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Таможня (€ EUR)</label>
                      <input
                        type="number"
                        value={newCustomsEUR}
                        onChange={(e) => setNewCustomsEUR(Number(e.target.value))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-2 text-xs focus:border-amber-400 outline-none text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Утильсбор (₽ RUB)</label>
                    <input
                      type="number"
                      value={newRecyclingRUB}
                      onChange={(e) => setNewRecyclingRUB(Number(e.target.value))}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:border-amber-400 outline-none text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Ссылка на изображение (Опционально)</label>
                    <input
                      type="url"
                      value={newImgUrl}
                      onChange={(e) => setNewImgUrl(e.target.value)}
                      placeholder="Напр. https://images.unsplash.com/..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:border-amber-400 outline-none text-white font-mono text-[10px]"
                    />
                    <p className="text-[8px] text-gray-400 mt-1">Оставьте пустым для автоподбора красивого фото машины с Unsplash.</p>
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Краткое описание автомобиля</label>
                    <textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Расскажите об особенностях этой машины (состояние кузова, опции...)"
                      rows={2}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:border-amber-400 outline-none text-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">Опции премиум-комфорта (через запятую)</label>
                    <input
                      type="text"
                      value={newFeatures}
                      onChange={(e) => setNewFeatures(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs focus:border-amber-400 outline-none text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добавить автомобиль в каталог</span>
                  </button>
                </form>

                {/* 3. Список текущих авто с возможностью удаления */}
                <div className="border-t border-neutral-800 pt-4">
                  <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                    <Car className="w-4.5 h-4.5" />
                    <span>Управление текущим каталогом ({cars.length})</span>
                  </h5>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-800">
                    {cars.map((carItem) => {
                      return (
                        <div
                          key={carItem.id}
                          className="flex items-center justify-between bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/60 text-left"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <img
                              src={carItem.images[0]}
                              alt=""
                              className="w-10 h-8 object-cover rounded-md shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-white truncate">
                                {carItem.brand} {carItem.model}
                              </p>
                              <p className="text-[9px] text-gray-400 font-mono">
                                {carItem.year} г. • {carItem.country === 'China' ? '🇨🇳 КНР' : carItem.country === 'South Korea' ? '🇰🇷 Корея' : '🇰🇬 КР'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Вы уверены, что хотите удалить ${carItem.brand} ${carItem.model} из списка?`)) {
                                triggerHaptic('medium');
                                deleteCar(carItem.id);
                              }
                            }}
                            className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition active:scale-90 cursor-pointer"
                            title="Удалить авто"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Гарантии и Юр. Информация */}
      <div className="px-4 mt-6">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-neutral-400">Надежность & Гарантии</h3>
        <div className="bg-white rounded-3xl border border-neutral-200/80 overflow-hidden mt-2.5 p-4 space-y-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
          <div className="flex items-start space-x-3 text-xs">
            <BadgeCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-neutral-900">Официальное юрлицо РФ</h4>
              <p className="text-[10px] text-gray-400 leading-normal mt-0.5">
                Договор заключается с ООО «ДА!КАР ИМПОРТ» (ИНН 1655489022). Все платежи принимаются на расчетный счет в Альфа-Банке.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-xs border-t border-neutral-50 pt-3.5">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-neutral-900">100% Возврат депозита</h4>
              <p className="text-[10px] text-gray-400 leading-normal mt-0.5">
                Если в течение 14 дней мы не подберем подходящий вам автомобиль на аукционе, обеспечим полный возврат залоговой суммы.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-xs border-t border-neutral-50 pt-3.5">
            <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-neutral-900">Шоурум в Казани</h4>
              <p className="text-[10px] text-gray-400 leading-normal mt-0.5">
                Приезжайте знакомиться лично! г. Казань, ул. Серова, д. 48, к. 2. Рады видеть вас каждый день с 10:00 до 20:00.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="px-4 mt-6">
        <h3 className="font-display text-sm font-bold uppercase tracking-wider text-neutral-400">Часто задаваемые вопросы</h3>
        <div className="space-y-2.5 mt-2.5">
          {faqData.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.01)]"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-4 py-3.5 flex justify-between items-center text-left text-xs font-bold text-neutral-900 hover:bg-neutral-50"
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 border-t border-neutral-50 text-[10px] text-gray-400 leading-relaxed pt-2.5 bg-neutral-50/50"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Симулятор диалога с менеджером */}
      <AnimatePresence>
        {activeConsultation && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveConsultation(false)}
              className="fixed inset-0 bg-black z-40"
            ></motion.div>

            {/* Окно чата */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 max-w-[440px] mx-auto bg-[#0e1621] rounded-t-[32px] z-50 p-5 flex flex-col h-[75%] shadow-2xl select-none"
            >
              <div className="w-12 h-1 bg-neutral-700 rounded-full mx-auto mb-4 shrink-0"></div>

              {/* Шапка чата */}
              <div className="flex justify-between items-center pb-3 border-b border-neutral-800 shrink-0 text-white">
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 bg-amber-500 rounded-full flex items-center justify-center font-bold text-neutral-950 text-xs">
                    DA
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Дежурный Менеджер</h4>
                    <span className="text-[9px] text-emerald-500">в сети • DA!CAR</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveConsultation(false)}
                  className="text-xs font-semibold text-gray-400 hover:text-white"
                >
                  Закрыть
                </button>
              </div>

              {/* Область Сообщений чата */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3.5 flex flex-col text-xs text-white">
                {consultationChat.map((msg, index) => (
                  <div
                    key={index}
                    className={`max-w-[85%] rounded-2xl p-3 flex flex-col shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-[#2b5278] self-end rounded-tr-none'
                        : 'bg-[#182533] self-start rounded-tl-none'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>

              {/* Предустановленные Кнопки-Вопросы */}
              <div className="border-t border-neutral-800 pt-3.5 shrink-0 space-y-2">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider px-1">
                  Частые вопросы менеджеру:
                </p>
                <div className="flex flex-col space-y-2">
                  {consultantQuestions.map((cq, index) => (
                    <button
                      key={index}
                      onClick={() => handleAskQuestion(cq.q, cq.a)}
                      className="bg-[#1e2c3a] hover:bg-[#253648] text-white/90 text-left px-3.5 py-2 rounded-xl text-[10px] font-medium transition cursor-pointer"
                    >
                      {cq.q}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
