/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { triggerHaptic } from '../utils/haptics';
import { User, MessageSquare, Phone, MapPin, ShieldAlert, BadgeCheck, HelpCircle, ChevronDown, Send, ArrowUpRight, Settings, Plus, Trash2, Copy, Check, Car, Sliders, Bot, Image as ImageIcon, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
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

  // Интеграция с закрытым Telegram-каналом
  const [tgBotToken, setTgBotToken] = useState(() => localStorage.getItem('tg_bot_token') || '');
  const [tgChannelId, setTgChannelId] = useState(() => localStorage.getItem('tg_channel_id') || '');
  const [tgPosts, setTgPosts] = useState<any[]>([]);
  const [isLoadingTg, setIsLoadingTg] = useState(false);
  const [tgError, setTgError] = useState<string | null>(null);
  const [showTgImporter, setShowTgImporter] = useState(false);
  const [resolvingFiles, setResolvingFiles] = useState<Record<string, boolean>>({});

  const fetchTgUpdates = async () => {
    if (!tgBotToken) {
      setTgError('Пожалуйста, укажите токен вашего Telegram-бота!');
      triggerHaptic('error');
      return;
    }
    setIsLoadingTg(true);
    setTgError(null);
    localStorage.setItem('tg_bot_token', tgBotToken);
    if (tgChannelId) {
      localStorage.setItem('tg_channel_id', tgChannelId);
    } else {
      localStorage.removeItem('tg_channel_id');
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${tgBotToken}/getUpdates?offset=-20&limit=50`);
      if (!res.ok) {
        throw new Error(`Ошибка API: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.description || 'Неизвестная ошибка Telegram API');
      }

      const updates = data.result || [];
      const photoPosts: any[] = [];

      for (const update of updates) {
        const msg = update.message || update.channel_post;
        if (msg) {
          if (msg.photo && msg.photo.length > 0) {
            const photo = msg.photo[msg.photo.length - 1]; // Берем максимальный размер
            const caption = msg.caption || '';
            const messageId = msg.message_id;
            const chatTitle = msg.chat?.title || msg.chat?.username || msg.chat?.first_name || 'Канал/Чат';
            const chatId = msg.chat?.id;

            // Фильтр по ID канала, если он указан
            if (tgChannelId && String(chatId) !== String(tgChannelId) && !String(msg.chat?.username).includes(tgChannelId)) {
              continue;
            }

            photoPosts.push({
              messageId,
              fileId: photo.file_id,
              caption,
              chatTitle,
              chatId,
              date: msg.date,
              fileUrl: null
            });
          }
        }
      }

      if (photoPosts.length === 0) {
        setTgError('Фотографии в последних обновлениях бота не найдены. Убедитесь, что бот является администратором в канале и вы опубликовали новый пост с фото.');
        triggerHaptic('error');
      } else {
        // Убираем дубликаты file_id
        const uniquePosts = Array.from(new Map(photoPosts.map(p => [p.fileId, p])).values());
        setTgPosts(uniquePosts.reverse());
        triggerHaptic('success');
      }
    } catch (err: any) {
      setTgError(err.message || 'Не удалось связаться с Telegram. Проверьте правильность токена бота.');
      triggerHaptic('error');
    } finally {
      setIsLoadingTg(false);
    }
  };

  const loadDemoTgPosts = () => {
    triggerHaptic('medium');
    setIsLoadingTg(true);
    setTgError(null);
    setTimeout(() => {
      const demoData = [
        {
          messageId: 101,
          fileId: 'demo_lixiang',
          caption: `Lixiang L9 Ultra\n2024 год, 0 км\nДВС + электро (Гибрид 🔋), 1.5T (449 л.с.)\nПривод: Полный AWD\nЦвет: Серый матовый\nЦена: 68500 $ (под ключ во Владивостоке)\nОпции комфорта: Светодиодные фары, Панорама, Холодильник, Массаж, Вентиляция, Подножки. Идеальный семейный кроссовер премиум-класса!`,
          chatTitle: 'DA!CAR Private Channel (Демо)',
          chatId: -10012345678,
          date: Math.floor(Date.now() / 1000) - 3600,
          fileUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80'
        },
        {
          messageId: 102,
          fileId: 'demo_zeekr',
          caption: `Zeekr 001 YOU\n2024 год, 0 км\nЭлектрический ⚡, Dual Motor (789 л.с.)\nПривод: Полный AWD\nЦвет: Черный премиум\nЦена: 59000 $\nПремиальный электрокар с безумной динамикой 3.3с до 100 км/ч. Пневмоподвеска, автоматические двери, аудиосистема Yamaha.`,
          chatTitle: 'DA!CAR Private Channel (Демо)',
          chatId: -10012345678,
          date: Math.floor(Date.now() / 1000) - 7200,
          fileUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80'
        },
        {
          messageId: 103,
          fileId: 'demo_monjaro',
          caption: `Geely Monjaro Exclusive\n2023 год, 18500 км\nБензин ⛽, 2.0T (238 л.с.)\nТрансмиссия: Автомат\nПривод: Полный AWD\nЦена: 32500 $\nОдин владелец, идеальное состояние. Родной окрас, обслуживание у дилера, бесключевой доступ, проекция на лобовое стекло.`,
          chatTitle: 'DA!CAR Private Channel (Демо)',
          chatId: -10012345678,
          date: Math.floor(Date.now() / 1000) - 86400,
          fileUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80'
        }
      ];
      setTgPosts(demoData);
      setIsLoadingTg(false);
      triggerHaptic('success');
    }, 600);
  };

  const parseTelegramCaption = (caption: string) => {
    if (!caption) return;
    
    // Описание автомобиля
    setNewDesc(caption.trim());

    // Разбор марки и модели (первая строчка поста)
    const firstLine = caption.split('\n')[0].trim();
    if (firstLine) {
      const words = firstLine.split(/\s+/);
      if (words.length > 0) {
        // Убираем лишние спецсимволы
        const cleanBrand = words[0].replace(/[^\wа-яА-ЯёЁ-]/g, '');
        if (cleanBrand) setNewBrand(cleanBrand);
      }
      if (words.length > 1) {
        setNewModel(words.slice(1).join(' ').trim());
      }
    }

    // Разбор года (ищем 4-значное число от 2018 до 2026)
    const yearMatch = caption.match(/\b(201[8-9]|202[0-6])\b/);
    if (yearMatch) {
      setNewYear(Number(yearMatch[1]));
    }

    // Разбор пробега (ищем числа перед "км" или "km")
    const mileageMatch = caption.match(/(\d+[\s\d]*)\s*(км|km)/i);
    if (mileageMatch) {
      const cleanMileage = Number(mileageMatch[1].replace(/\s/g, ''));
      setNewMileage(cleanMileage);
    }

    // Разбор цены в USD (ищем числа перед или после $)
    const priceMatch = caption.match(/(\d+[\s\d]*)\s*(\$|usd|доллар)/i);
    if (priceMatch) {
      const cleanPrice = Number(priceMatch[1].replace(/\s/g, ''));
      setNewPriceUSD(cleanPrice);
    }

    // Разбор привода
    if (caption.toLowerCase().includes('полный') || caption.toLowerCase().includes('awd') || caption.toLowerCase().includes('4wd')) {
      setNewDrive('AWD');
    } else if (caption.toLowerCase().includes('задний') || caption.toLowerCase().includes('rwd')) {
      setNewDrive('RWD');
    } else if (caption.toLowerCase().includes('передний') || caption.toLowerCase().includes('fwd')) {
      setNewDrive('FWD');
    }

    // Разбор двигателя
    if (caption.toLowerCase().includes('гибрид') || caption.toLowerCase().includes('hybrid') || caption.toLowerCase().includes('двс + электро')) {
      setNewEngine('hybrid');
    } else if (caption.toLowerCase().includes('электро') || caption.toLowerCase().includes('electric') || caption.toLowerCase().includes('ev')) {
      setNewEngine('electric');
    } else if (caption.toLowerCase().includes('дизель') || caption.toLowerCase().includes('diesel')) {
      setNewEngine('diesel');
    } else {
      setNewEngine('gasoline');
    }
  };

  const handleImportPost = async (post: any) => {
    triggerHaptic('success');
    setIsLoadingTg(true);

    let finalUrl = post.fileUrl;

    if (!finalUrl && post.fileId) {
      setResolvingFiles(prev => ({ ...prev, [post.fileId]: true }));
      try {
        const res = await fetch(`https://api.telegram.org/bot${tgBotToken}/getFile?file_id=${post.fileId}`);
        const data = await res.json();
        if (data.ok && data.result?.file_path) {
          finalUrl = `https://api.telegram.org/file/bot${tgBotToken}/${data.result.file_path}`;
        }
      } catch (e) {
        console.error('Error resolving file', e);
      } finally {
        setResolvingFiles(prev => ({ ...prev, [post.fileId]: false }));
      }
    }

    if (finalUrl) {
      setNewImgUrl(finalUrl);
    } else {
      alert('⚠️ Не удалось получить ссылку на фото из Telegram API. Скопированы только текстовые параметры!');
    }

    if (post.caption) {
      parseTelegramCaption(post.caption);
    }

    setIsLoadingTg(false);
    alert('🤖 Текст и изображение успешно импортированы в форму! Основные поля заполнены автоматически.');
  };

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
    <div className="flex flex-col text-white pb-12 select-none">
      
      {/* Профиль Пользователя */}
      <div className="px-4 pt-6 pb-4 bg-[#121215] border-b border-white/[0.03] flex items-center space-x-4">
        <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-amber-600 rounded-full flex items-center justify-center font-display font-black text-white text-xl shadow-lg relative shrink-0">
          U
          <span className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full border-2 border-[#121215] flex items-center justify-center text-[8px] text-white">✓</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display font-black text-base text-white flex items-center space-x-1.5 tracking-tight">
            <span>Premium Клиент</span>
          </h2>
          <p className="text-xs text-gray-500 truncate font-mono">tg_user_id: 841b57fe</p>
          <div className="flex space-x-2 mt-1.5">
            <span className="bg-amber-400/10 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-400/10 font-mono">
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
          className="bg-[#121215] border border-white/[0.03] hover:border-amber-400/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-xl active:scale-95 transition cursor-pointer"
        >
          <MessageSquare className="w-6 h-6 text-amber-400" />
          <span className="text-xs font-bold text-gray-200 mt-2">Чат с менеджером</span>
          <span className="text-[8px] text-gray-500 mt-0.5 font-mono">Консультация онлайн</span>
        </button>

        <a
          href="tel:+78432220099"
          onClick={() => triggerHaptic('light')}
          className="bg-[#121215] border border-white/[0.03] hover:border-amber-400/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-xl active:scale-95 transition cursor-pointer"
        >
          <Phone className="w-6 h-6 text-emerald-400" />
          <span className="text-xs font-bold text-gray-200 mt-2">Позвонить в офис</span>
          <span className="text-[8px] text-gray-500 mt-0.5 font-mono">+7 (843) 222-00-99</span>
        </a>
      </div>

      {/* ПАНЕЛЬ УПРАВЛЕНИЯ / АДМИНКА (Добавление новых авто, изменение текстов) */}
      <div className="px-4 mt-6">
        <button
          onClick={() => {
            triggerHaptic('medium');
            setIsAdminOpen(!isAdminOpen);
          }}
          className="w-full bg-gradient-to-r from-[#121215] via-[#15151a] to-[#0e0e11] text-white rounded-3xl p-4 flex items-center justify-between shadow-lg border border-white/[0.04] hover:border-amber-400/30 transition-all cursor-pointer text-left"
        >
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 bg-amber-400 rounded-2xl flex items-center justify-center text-[#121215] shadow-inner">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-display font-black text-xs uppercase tracking-wider">Панель администратора</h4>
              <p className="text-[10px] text-gray-500 mt-0.5">Добавление авто, удаление & экспорт кода</p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isAdminOpen ? 'rotate-180' : ''}`} />
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
              <div className="bg-[#121215] text-white border border-white/[0.05] rounded-3xl p-5 mt-3 space-y-5 shadow-2xl">
                
                {/* 1. Блок копирования TS-кода */}
                <div className="border-b border-white/[0.04] pb-4">
                  <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5 font-mono">
                    <Copy className="w-4 h-4" />
                    <span>Сохранение изменений навсегда</span>
                  </h5>
                  <p className="text-[10px] text-neutral-400 leading-relaxed mb-3">
                    Чтобы добавленные вами автомобили сохранились в файлах проекта навсегда (и были видны в Telegram), нажмите кнопку ниже, скопируйте сформированный TypeScript-код и полностью замените им содержимое файла <code className="text-amber-400 bg-black/45 px-1 py-0.5 rounded font-mono">/src/data/cars.ts</code>.
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className={`w-full py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center space-x-2 cursor-pointer active:scale-95 ${
                      isCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-400 hover:bg-amber-500 text-black font-black'
                    }`}
                  >
                    {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopied ? 'Код скопирован в буфер!' : 'Скопировать TS-код для cars.ts'}</span>
                  </button>
                </div>

                {/* 2. Форма добавления нового автомобиля */}
                <form onSubmit={handleAddCarSubmit} className="space-y-4">
                  <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5 font-mono">
                    <Plus className="w-4.5 h-4.5" />
                    <span>Добавить новый автомобиль</span>
                  </h5>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] text-gray-500 font-bold uppercase mb-1 font-mono">Марка *</label>
                      <input
                        type="text"
                        value={newBrand}
                        onChange={(e) => setNewBrand(e.target.value)}
                        placeholder="Напр. Lixiang"
                        required
                        className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-3 py-2 text-xs focus:border-amber-400 outline-none text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 font-bold uppercase mb-1 font-mono">Модель *</label>
                      <input
                        type="text"
                        value={newModel}
                        onChange={(e) => setNewModel(e.target.value)}
                        placeholder="Напр. L9 Ultra"
                        required
                        className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-3 py-2 text-xs focus:border-amber-400 outline-none text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-500 font-bold uppercase mb-1 font-mono">Поколение</label>
                      <input
                        type="text"
                        value={newGen}
                        onChange={(e) => setNewGen(e.target.value)}
                        placeholder="Напр. I Restyling"
                        className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-2.5 py-2 text-xs focus:border-amber-400/50 outline-none text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 font-bold uppercase mb-1 font-mono">Год выпуска</label>
                      <input
                        type="number"
                        value={newYear}
                        onChange={(e) => setNewYear(Number(e.target.value))}
                        className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-2.5 py-2 text-xs focus:border-amber-400/50 outline-none text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 font-bold uppercase mb-1 font-mono">Пробег (км)</label>
                      <input
                        type="number"
                        value={newMileage}
                        onChange={(e) => setNewMileage(Number(e.target.value))}
                        className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-2.5 py-2 text-xs focus:border-amber-400/50 outline-none text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-500 font-bold uppercase mb-1 font-mono">Состояние</label>
                      <select
                        value={newCond}
                        onChange={(e: any) => setNewCond(e.target.value)}
                        className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-2 py-2 text-xs focus:border-amber-400/50 outline-none text-white"
                      >
                        <option value="new">Новый</option>
                        <option value="used">С пробегом</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 font-bold uppercase mb-1 font-mono">Страна экспорта</label>
                      <select
                        value={newCountry}
                        onChange={(e: any) => setNewCountry(e.target.value)}
                        className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-2 py-2 text-xs focus:border-amber-400/50 outline-none text-white"
                      >
                        <option value="China">Китай 🇨🇳</option>
                        <option value="South Korea">Корея 🇰🇷</option>
                        <option value="Kyrgyzstan">Киргизия 🇰🇬</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 font-bold uppercase mb-1 font-mono">Кузов</label>
                      <input
                        type="text"
                        value={newBody}
                        onChange={(e) => setNewBody(e.target.value)}
                        className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-2.5 py-2 text-xs focus:border-amber-400/50 outline-none text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] text-gray-500 font-bold uppercase mb-1 font-mono">Двигатель</label>
                      <select
                        value={newEngine}
                        onChange={(e: any) => setNewEngine(e.target.value)}
                        className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-3 py-2 text-xs focus:border-amber-400/50 outline-none text-white"
                      >
                        <option value="gasoline">Бензин ⛽</option>
                        <option value="diesel">Дизель ⚙️</option>
                        <option value="hybrid">Гибрид 🔋</option>
                        <option value="electric">Электро ⚡</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 font-bold uppercase mb-1 font-mono">Объем (напр. 1.5T / Dual Motor)</label>
                      <input
                        type="text"
                        value={newEngineVol}
                        onChange={(e) => setNewEngineVol(e.target.value)}
                        className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-3 py-2 text-xs focus:border-amber-400/50 outline-none text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-500 font-bold uppercase mb-1 font-mono">Мощность (л.с.)</label>
                      <input
                        type="number"
                        value={newPower}
                        onChange={(e) => setNewPower(Number(e.target.value))}
                        className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-2.5 py-2 text-xs focus:border-amber-400/50 outline-none text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 font-bold uppercase mb-1 font-mono">Привод</label>
                      <select
                        value={newDrive}
                        onChange={(e: any) => setNewDrive(e.target.value)}
                        className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-2 py-2 text-xs focus:border-amber-400/50 outline-none text-white"
                      >
                        <option value="AWD">Полный (AWD)</option>
                        <option value="FWD">Передний (FWD)</option>
                        <option value="RWD">Задний (RWD)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 font-bold uppercase mb-1 font-mono">Трансмиссия</label>
                      <select
                        value={newTrans}
                        onChange={(e: any) => setNewTrans(e.target.value)}
                        className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-2 py-2 text-xs focus:border-amber-400/50 outline-none text-white"
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
                      <label className="block text-[9px] text-gray-500 font-bold uppercase mb-1 font-mono">Цвет кузова</label>
                      <input
                        type="text"
                        value={newColor}
                        onChange={(e) => setNewColor(e.target.value)}
                        className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-2.5 py-2 text-xs focus:border-amber-400/50 outline-none text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 font-bold uppercase mb-1 font-mono">Цена закупа ($ USD)</label>
                      <input
                        type="number"
                        value={newPriceUSD}
                        onChange={(e) => setNewPriceUSD(Number(e.target.value))}
                        className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-2.5 py-2 text-xs focus:border-amber-400/50 outline-none text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 font-bold uppercase mb-1 font-mono">Таможня (€ EUR)</label>
                      <input
                        type="number"
                        value={newCustomsEUR}
                        onChange={(e) => setNewCustomsEUR(Number(e.target.value))}
                        className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-2.5 py-2 text-xs focus:border-amber-400/50 outline-none text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-500 font-bold uppercase mb-1 font-mono">Утильсбор (₽ RUB)</label>
                    <input
                      type="number"
                      value={newRecyclingRUB}
                      onChange={(e) => setNewRecyclingRUB(Number(e.target.value))}
                      className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-3 py-2 text-xs focus:border-amber-400/50 outline-none text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-500 font-bold uppercase mb-1 font-mono">Ссылка на изображение (Опционально)</label>
                    <input
                      type="url"
                      value={newImgUrl}
                      onChange={(e) => setNewImgUrl(e.target.value)}
                      placeholder="Напр. https://images.unsplash.com/..."
                      className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-3 py-2 text-xs focus:border-amber-400/50 outline-none text-white font-mono text-[10px]"
                    />
                    <p className="text-[8px] text-gray-500 mt-1">Оставьте пустым для автоподбора красивого фото машины с Unsplash.</p>
                  </div>

                  {/* Импорт из закрытого Telegram-канала */}
                  <div className="bg-[#0b0b0e] border border-white/[0.04] rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-amber-400" />
                        <span className="text-[10px] font-bold text-gray-200 uppercase tracking-wide">Импорт фото из Telegram-канала</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setShowTgImporter(!showTgImporter);
                        }}
                        className="text-[10px] text-amber-400 font-bold hover:underline cursor-pointer"
                      >
                        {showTgImporter ? 'Скрыть' : 'Настроить / Импортировать'}
                      </button>
                    </div>

                    <AnimatePresence>
                      {showTgImporter && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden space-y-3.5 pt-1.5"
                        >
                          <div className="text-[9px] text-neutral-400 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/[0.02]">
                            <p className="font-bold text-gray-300 mb-1">Как подключить закрытый канал:</p>
                            <ol className="list-decimal list-inside space-y-1">
                              <li>Создайте бота в <span className="text-amber-400">@BotFather</span> и скопируйте его токен.</li>
                              <li>Добавьте бота в ваш закрытый канал как <span className="text-amber-400">Администратора</span> (с правами на чтение/публикации).</li>
                              <li>Опубликуйте новый пост с фотографией и описанием машины в канале.</li>
                              <li>Укажите токен бота ниже и нажмите <span className="text-amber-400">«Обновить публикации»</span>.</li>
                            </ol>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="block text-[8px] text-gray-500 font-bold uppercase mb-1 font-mono">Токен Telegram-бота (Bot Token)</label>
                              <input
                                type="text"
                                value={tgBotToken}
                                onChange={(e) => setTgBotToken(e.target.value)}
                                placeholder="Напр. 123456789:ABCDefGhIJK..."
                                className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-3 py-2 text-[11px] focus:border-amber-400 outline-none text-white font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-[8px] text-gray-500 font-bold uppercase mb-1 font-mono">ID или Юзернейм канала (Опционально)</label>
                              <input
                                type="text"
                                value={tgChannelId}
                                onChange={(e) => setTgChannelId(e.target.value)}
                                placeholder="Напр. -100123456789 или @my_channel"
                                className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-3 py-2 text-[11px] focus:border-amber-400 outline-none text-white font-mono"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={fetchTgUpdates}
                                disabled={isLoadingTg}
                                className="py-2 px-3 bg-amber-400 hover:bg-amber-500 text-black font-black text-[10px] rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
                              >
                                {isLoadingTg ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-3.5 h-3.5" />
                                )}
                                <span>Обновить публикации</span>
                              </button>
                              <button
                                type="button"
                                onClick={loadDemoTgPosts}
                                disabled={isLoadingTg}
                                className="py-2 px-3 bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer border border-white/[0.03]"
                              >
                                <span>Режим демо ✨</span>
                              </button>
                            </div>
                          </div>

                          {tgError && (
                            <div className="bg-red-950/20 border border-red-500/20 text-red-400 text-[10px] p-3 rounded-xl flex items-start space-x-2">
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                              <p>{tgError}</p>
                            </div>
                          )}

                          {tgPosts.length > 0 && (
                            <div className="space-y-2.5 pt-1">
                              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Найденные публикации ({tgPosts.length})</p>
                              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                {tgPosts.map((post, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-[#070709] border border-white/[0.03] p-2.5 rounded-xl flex items-start space-x-2.5 hover:border-amber-400/20 transition text-left"
                                  >
                                    {post.fileUrl ? (
                                      <img
                                        src={post.fileUrl}
                                        alt=""
                                        className="w-14 h-14 object-cover rounded-lg shrink-0 border border-white/[0.04]"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <div className="w-14 h-14 bg-white/5 rounded-lg shrink-0 border border-white/[0.04] flex flex-col items-center justify-center">
                                        <ImageIcon className="w-5 h-5 text-gray-500" />
                                        <span className="text-[7px] text-gray-600 font-mono mt-1">TG фото</span>
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between h-14">
                                      <p className="text-[10px] text-gray-300 line-clamp-2 leading-relaxed font-sans">
                                        {post.caption || 'Пустое описание'}
                                      </p>
                                      <div className="flex items-center justify-between mt-1">
                                        <span className="text-[8px] text-gray-500 font-mono truncate max-w-[100px]">
                                          {post.chatTitle}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleImportPost(post)}
                                          className="text-[9px] font-bold text-amber-400 hover:text-amber-500 flex items-center space-x-1 cursor-pointer shrink-0"
                                        >
                                          {resolvingFiles[post.fileId] ? (
                                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                          ) : (
                                            <span>Импортировать →</span>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-500 font-bold uppercase mb-1 font-mono">Краткое описание автомобиля</label>
                    <textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Расскажите об особенностях этой машины (состояние кузова, опции...)"
                      rows={2}
                      className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-3 py-2 text-xs focus:border-amber-400/50 outline-none text-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-500 font-bold uppercase mb-1 font-mono">Опции премиум-комфорта (через запятую)</label>
                    <input
                      type="text"
                      value={newFeatures}
                      onChange={(e) => setNewFeatures(e.target.value)}
                      className="w-full bg-[#070709] border border-white/[0.06] rounded-xl px-3 py-2 text-xs focus:border-amber-400/50 outline-none text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-black font-black text-xs rounded-xl transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добавить автомобиль в каталог</span>
                  </button>
                </form>

                {/* 3. Список текущих авто с возможностью удаления */}
                <div className="border-t border-white/[0.04] pt-4">
                  <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5 font-mono">
                    <Car className="w-4.5 h-4.5" />
                    <span>Управление текущим каталогом ({cars.length})</span>
                  </h5>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-none">
                    {cars.map((carItem) => {
                      return (
                        <div
                          key={carItem.id}
                          className="flex items-center justify-between bg-[#070709] p-2.5 rounded-xl border border-white/[0.03] text-left"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <img
                              src={carItem.images[0]}
                              alt=""
                              className="w-10 h-8 object-cover rounded-md shrink-0 border border-white/[0.03]"
                            />
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-white truncate">
                                {carItem.brand} {carItem.model}
                              </p>
                              <p className="text-[9px] text-gray-500 font-mono">
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
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition active:scale-90 cursor-pointer"
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
        <h3 className="font-display text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2.5 font-mono">Надежность & Гарантии</h3>
        <div className="bg-[#121215] rounded-3xl border border-white/[0.03] overflow-hidden p-4 space-y-3.5 shadow-xl">
          <div className="flex items-start space-x-3 text-xs">
            <BadgeCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-gray-100">Официальное юрлицо РФ</h4>
              <p className="text-[10px] text-neutral-400 leading-normal mt-0.5 font-sans">
                Договор заключается с ООО «ДА!КАР ИМПОРТ» (ИНН 1655489022). Все платежи принимаются на расчетный счет в Альфа-Банке.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-xs border-t border-white/[0.03] pt-3.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-gray-100">100% Возврат депозита</h4>
              <p className="text-[10px] text-neutral-400 leading-normal mt-0.5 font-sans">
                Если в течение 14 дней мы не подберем подходящий вам автомобиль на аукционе, обеспечим полный возврат залоговой суммы.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-xs border-t border-white/[0.03] pt-3.5">
            <MapPin className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-gray-100">Шоурум в Казани</h4>
              <p className="text-[10px] text-neutral-400 leading-normal mt-0.5 font-sans">
                Приезжайте знакомиться лично! г. Казань, ул. Серова, д. 48, к. 2. Рады видеть вас каждый день с 10:00 до 20:00.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="px-4 mt-6">
        <h3 className="font-display text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2.5 font-mono">Часто задаваемые вопросы</h3>
        <div className="space-y-2.5">
          {faqData.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-[#121215] border border-white/[0.03] rounded-2xl overflow-hidden shadow-xl"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-4 py-3.5 flex justify-between items-center text-left text-xs font-bold text-gray-200 hover:bg-white/[0.01]"
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4 border-t border-white/[0.03] text-[10px] text-gray-400 leading-relaxed pt-2.5 bg-[#070709]/20 font-sans"
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
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveConsultation(false)}
              className="fixed inset-0 bg-[#000000]/95 z-40 backdrop-blur-sm"
            ></motion.div>

            {/* Окно чата */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 max-w-[440px] mx-auto bg-[#121215] border-t border-white/[0.08] rounded-t-[32px] z-50 p-5 flex flex-col h-[75%] shadow-2xl select-none"
            >
              <div className="w-12 h-1 bg-white/[0.08] rounded-full mx-auto mb-4 shrink-0"></div>

              {/* Шапка чата */}
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.04] shrink-0 text-white">
                <div className="flex items-center space-x-3.5">
                  <div className="w-9 h-9 bg-amber-400 rounded-full flex items-center justify-center font-bold text-[#121215] text-xs shadow-md">
                    DA
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wide">Дежурный Менеджер</h4>
                    <span className="text-[9px] text-emerald-400 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block"></span>
                      <span>в сети • DA!CAR</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveConsultation(false)}
                  className="text-xs font-bold text-gray-400 hover:text-white"
                >
                  Закрыть
                </button>
              </div>

              {/* Область Сообщений чата */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3.5 flex flex-col text-xs text-white scrollbar-none">
                {consultationChat.map((msg, index) => (
                  <div
                    key={index}
                    className={`max-w-[85%] rounded-2xl p-3 flex flex-col shadow-lg ${
                      msg.sender === 'user'
                        ? 'bg-amber-400 text-black self-end rounded-tr-none font-medium'
                        : 'bg-white/5 border border-white/[0.03] text-gray-200 self-start rounded-tl-none'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>

              {/* Предустановленные Кнопки-Вопросы */}
              <div className="border-t border-white/[0.04] pt-3.5 shrink-0 space-y-2">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest px-1 font-mono">
                  Частые вопросы менеджеру:
                </p>
                <div className="flex flex-col space-y-2">
                  {consultantQuestions.map((cq, index) => (
                    <button
                      key={index}
                      onClick={() => handleAskQuestion(cq.q, cq.a)}
                      className="bg-white/5 hover:bg-white/10 text-gray-300 text-left px-3.5 py-2 rounded-xl text-[10px] font-medium transition-bezier cursor-pointer border border-white/[0.04]"
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
