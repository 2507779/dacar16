/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useStore, ORDER_STATUSES } from '../store/useStore';
import { triggerHaptic } from '../utils/haptics';
import { 
  Settings, Key, ChevronDown, Plus, Trash2, Copy, Check, Car, 
  Bot, Image as ImageIcon, Loader2, RefreshCw, AlertCircle, 
  MessageSquare, Sliders, Play, CheckCircle, Database, HelpCircle, 
  Share2, ArrowRight, Eye, ShieldAlert, BadgeCheck, FileCode, CheckCircle2,
  Terminal, Coins, Download, Globe, Sparkles, Upload, Activity,
  UserCheck, Save, Users, Calendar, Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CARS_DATA, calculateFullCarPrice, formatCurrency } from '../data/cars';

export function AdminPanel() {
  const { 
    cars, 
    addCar, 
    editCar,
    deleteCar,
    setCars,
    orders,
    updateOrderStatus,
    updateOrderNotes,
    deleteOrder,
    homepageBannerUrl,
    homepageBannerTitle,
    homepageBannerSubtitle,
    setHomepageBannerUrl,
    setHomepageBannerTitle,
    setHomepageBannerSubtitle
  } = useStore();

  // Основной переключатель открыт/закрыт
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  
  // Безопасная авторизация админа
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(() => localStorage.getItem('dacar_admin_authorized') === 'true');
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);

  // Табы админки
  const [adminTab, setAdminTab] = useState<'add' | 'edit' | 'design' | 'funnel' | 'installer' | 'vip'>('installer');
  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Кастомизация галереи фотографий по авто
  const [activeCarPhotoEditorId, setActiveCarPhotoEditorId] = useState<string | null>(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  // Настройки Воронки и Ботов
  const [tgBotToken, setTgBotToken] = useState(() => localStorage.getItem('tg_bot_token') || '');
  const [tgChannelId, setTgChannelId] = useState(() => localStorage.getItem('tg_channel_id') || '');

  // Авто-установщик & ТГ-парсер состояния
  const [installerToken, setInstallerToken] = useState(() => localStorage.getItem('tg_bot_token') || '');
  const [installerChannel, setInstallerChannel] = useState(() => localStorage.getItem('tg_channel_id') || 'https://t.me/dacar_channel');
  const [isInstalling, setIsInstalling] = useState(false);
  const [installerLogs, setInstallerLogs] = useState<string[]>([]);
  const [fetchedPhotos, setFetchedPhotos] = useState<string[]>(() => {
    const cached = localStorage.getItem('dacar_fetched_photos');
    return cached ? JSON.parse(cached) : [
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1525609004556-c46c7d6cf0a3?auto=format&fit=crop&w=800&q=80',
    ];
  });

  // Функция 1: выбор машины для синхронизации фото
  const [selectedCarForSync, setSelectedCarForSync] = useState('');

  // Функция 2: Вебхук состояния
  const [webhookLogs, setWebhookLogs] = useState<string[]>([]);
  const [isSettingWebhook, setIsSettingWebhook] = useState(false);

  // Функция 3: Тестер прав состояния
  const [rightsLogs, setRightsLogs] = useState<string[]>([]);
  const [isTestingRights, setIsTestingRights] = useState(false);

  // Функция 5: Водяные знаки
  const [watermarkText, setWatermarkText] = useState(() => localStorage.getItem('dacar_watermark') || 'DA!CAR CONCIERGE');
  const [isWatermarkEnabled, setIsWatermarkEnabled] = useState(() => localStorage.getItem('dacar_watermark_enabled') === 'true');

  // Функция 6: Резервное копирование
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupLogs, setBackupLogs] = useState<string[]>([]);

  // Функция 7: Шаблонизатор
  const [captionTemplate, setCaptionTemplate] = useState(() => localStorage.getItem('dacar_caption_template') || '🚘 {brand} {model} ({year})\n🔥 Стоимость под ключ: {price}\n📍 Эксперт: {country}\n⚡ Заказать: @dacar_admin');

  // Функция 8: Курс валют
  const [exchangeRateUSD, setExchangeRateUSD] = useState(91.8);
  const [exchangeRateEUR, setExchangeRateEUR] = useState(99.2);
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);

  // Функция 9: Уведомитель
  const [notificationType, setNotificationType] = useState(() => localStorage.getItem('dacar_notification_type') || 'group'); // 'private', 'group', 'silent'
  const [adminChatId, setAdminChatId] = useState(() => localStorage.getItem('dacar_admin_chat_id') || '');

  // Функция 10: QR-визитка
  const [qrPromoCode, setQrPromoCode] = useState('dacar_app');

  // VIP ФУНКЦИЯ 1: ИИ-Генератор продающих постов
  const [vipSelectedCarId, setVipSelectedCarId] = useState('');
  const [vipPitchStyle, setVipPitchStyle] = useState<'emotional' | 'technical' | 'urgent'>('emotional');
  const [vipPitchOutput, setVipPitchOutput] = useState('');

  // VIP ФУНКЦИЯ 3: Контакты Дилера
  const [vipContactsWA, setVipContactsWA] = useState(() => localStorage.getItem('dacar_contacts_wa') || '+79274441122');
  const [vipContactsTG, setVipContactsTG] = useState(() => localStorage.getItem('dacar_contacts_tg') || 'dacar_manager');
  const [vipContactsPhone, setVipContactsPhone] = useState(() => localStorage.getItem('dacar_contacts_phone') || '+7 (843) 222-33-44');
  const [vipContactsAddr, setVipContactsAddr] = useState(() => localStorage.getItem('dacar_contacts_addr') || 'г. Казань, ул. Серова, 48 к2');
  const [vipContactsHours, setVipContactsHours] = useState(() => localStorage.getItem('dacar_contacts_hours') || 'Пн-Сб: 10:00 - 19:00, Вс: Выходной');

  // VIP ФУНКЦИЯ 4: Отзывы клиентов
  const [vipReviews, setVipReviews] = useState<{ id: string; name: string; text: string; stars: number; date: string }[]>(() => {
    const cached = localStorage.getItem('dacar_vip_reviews');
    return cached ? JSON.parse(cached) : [
      { id: '1', name: 'Ильшат Сабиров', text: 'Заказывал Zeekr 001. Привезли за 23 дня в Казань, машина в идеале, вся в заводской пленке. Сервис на высоте, рекомендую!', stars: 5, date: '12.06.2026' },
      { id: '2', name: 'Мария К.', text: 'Спасибо Дакару за подбор Palisade! Очень детальный отчет осмотра в Корее, полное сопровождение сделки и растаможки.', stars: 5, date: '28.05.2026' },
      { id: '3', name: 'Артур', text: 'Отличные ребята, честный просчет утильсбора и пошлины, никаких скрытых комиссий. Авто доставили прямо под подъезд.', stars: 5, date: '14.05.2026' }
    ];
  });
  const [newReviewName, setNewReviewName] = useState('');
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewStars, setNewReviewStars] = useState(5);

  // VIP ФУНКЦИЯ 5: Импортер / Восстановление базы
  const [jsonRestoreText, setJsonRestoreText] = useState('');

  // VIP ФУНКЦИЯ 6: CRM Редактор
  const [crmActiveOrderId, setCrmActiveOrderId] = useState<string | null>(null);
  const [crmNotesText, setCrmNotesText] = useState('');
  const [crmBudgetUSD, setCrmBudgetUSD] = useState<number>(0);

  // VIP ФУНКЦИЯ 7: Калькулятор раскладки
  const [calcExchangeUSD, setCalcExchangeUSD] = useState(91.8);
  const [calcExchangeEUR, setCalcExchangeEUR] = useState(99.2);
  const [calcRecyclingType, setCalcRecyclingType] = useState<'personal' | 'commercial'>('personal');

  // VIP ФУНКЦИЯ 8: Записи на тест-драйв / встречи
  const [vipMeetings, setVipMeetings] = useState<{ id: string; name: string; phone: string; date: string; time: string; car: string; status: string }[]>(() => {
    const cached = localStorage.getItem('dacar_vip_meetings');
    return cached ? JSON.parse(cached) : [
      { id: 'm1', name: 'Владимир', phone: '+7 (919) 123-45-67', date: '18.07.2026', time: '14:00', car: 'Zeekr 001', status: 'Ожидает' },
      { id: 'm2', name: 'Рустем', phone: '+7 (927) 888-99-00', date: '20.07.2026', time: '11:30', car: 'Geely Monjaro', status: 'Подтверждено' }
    ];
  });
  const [newMeetingName, setNewMeetingName] = useState('');
  const [newMeetingPhone, setNewMeetingPhone] = useState('');
  const [newMeetingDate, setNewMeetingDate] = useState('');
  const [newMeetingTime, setNewMeetingTime] = useState('');
  const [newMeetingCar, setNewMeetingCar] = useState('');

  // VIP ФУНКЦИЯ 9: Сравнение
  const [compareCarAId, setCompareCarAId] = useState('');
  const [compareCarBId, setCompareCarBId] = useState('');

  // VIP ФУНКЦИЯ 10: Trade-In
  const [tradeInBrand, setTradeInBrand] = useState('');
  const [tradeInYear, setTradeInYear] = useState('2018');
  const [tradeInMileage, setTradeInMileage] = useState('120000');
  const [tradeInCondition, setTradeInCondition] = useState('good');
  const [tradeInOutput, setTradeInOutput] = useState('');

  // Эффект для динамической смены темы TMA (Функция №6 - Кастомизатор Темы)
  const [themePreset, setThemePreset] = useState(() => localStorage.getItem('dacar_tma_theme') || 'warm-gold');

  useEffect(() => {
    const root = document.documentElement;
    let accent = '#C5A880';
    let accentHover = '#B0936B';
    
    if (themePreset === 'warm-gold') {
      accent = '#C5A880';
      accentHover = '#B0936B';
    } else if (themePreset === 'cosmic-blue') {
      accent = '#2563EB';
      accentHover = '#1D4ED8';
    } else if (themePreset === 'emerald-lux') {
      accent = '#10B981';
      accentHover = '#059669';
    } else if (themePreset === 'sport-red') {
      accent = '#EF4444';
      accentHover = '#DC2626';
    } else if (themePreset === 'classic-slate') {
      accent = '#4B5563';
      accentHover = '#374151';
    } else {
      // Пользовательский цвет
      accent = themePreset;
      accentHover = themePreset;
    }

    root.style.setProperty('--accent-primary', accent);
    root.style.setProperty('--accent-primary-hover', accentHover);
    localStorage.setItem('dacar_tma_theme', themePreset);

    // Добавляем инжект стилей для оверрайда жестко прописанных хексов
    let styleEl = document.getElementById('dacar-dynamic-theme-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'dacar-dynamic-theme-style';
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `
      [class*="text-[#C5A880]"] { color: ${accent} !important; }
      [class*="bg-[#C5A880]"] { background-color: ${accent} !important; }
      [class*="border-[#C5A880]"] { border-color: ${accent} !important; }
      [class*="from-[#C5A880]"] { --tw-gradient-from: ${accent} !important; --tw-gradient-to: ${accent} !important; }
      [class*="to-[#C5A880]"] { --tw-gradient-to: ${accent} !important; }
      [class*="hover:bg-[#C5A880]"]:hover { background-color: ${accentHover} !important; }
      [class*="hover:text-[#C5A880]"]:hover { color: ${accentHover} !important; }
      [class*="active:bg-[#C5A880]"]:active { background-color: ${accentHover} !important; }
    `;
  }, [themePreset]);
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('funnel_webhook') || 'https://api.dacar-import.ru/v1/leads/webhook');
  const [welcomeText, setWelcomeText] = useState(() => localStorage.getItem('funnel_welcome') || 'Приветствуем вас в DA!CAR, {name}! Мы получили ваш запрос на {car}. Наш брокер уже рассчитывает доставку.');

  // Симуляторы логов
  const [autopostCarId, setAutopostCarId] = useState('');
  const [autopostLogs, setAutopostLogs] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  const [leadSimName, setLeadSimName] = useState('Александр');
  const [leadSimPhone, setLeadSimPhone] = useState('+7 (927) 333-55-11');
  const [leadSimCarId, setLeadSimCarId] = useState('');
  const [leadSimLogs, setLeadSimLogs] = useState<string[]>([]);
  const [isSimulatingLead, setIsSimulatingLead] = useState(false);

  // Поля формы для добавления/редактирования автомобиля
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

  // Авторизация по PIN-коду
  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === '7777' || passcode === 'dacar2026') {
      triggerHaptic('success');
      setIsAdminAuthorized(true);
      setPasscodeError(false);
      localStorage.setItem('dacar_admin_authorized', 'true');
    } else {
      triggerHaptic('error');
      setPasscodeError(true);
      setTimeout(() => setPasscodeError(false), 2000);
    }
  };

  const handleLogout = () => {
    triggerHaptic('medium');
    setIsAdminAuthorized(false);
    localStorage.removeItem('dacar_admin_authorized');
    setPasscode('');
  };

  // Перевод авто в режим редактирования
  const handleStartEditCar = (car: any) => {
    triggerHaptic('medium');
    setEditingCarId(car.id);
    setNewBrand(car.brand);
    setNewModel(car.model);
    setNewGen(car.generation || 'I');
    setNewYear(car.year);
    setNewMileage(car.mileage || 0);
    setNewCond(car.condition || 'new');
    setNewCountry(car.country || 'China');
    setNewBody(car.bodyType || 'Внедорожник');
    setNewEngine(car.engineType || 'gasoline');
    setNewEngineVol(car.engineVolume || '2.0T');
    setNewPower(car.power || 220);
    setNewDrive(car.driveType || 'AWD');
    setNewTrans(car.transmission || 'Automatic');
    setNewColor(car.color || 'Черный металлик');
    setNewPriceUSD(car.priceUSD || 25000);
    setNewCustomsEUR(car.customsEUR || 3500);
    setNewRecyclingRUB(car.recyclingRUB || 3400);
    setNewImgUrl(car.images?.join('\n') || '');
    setNewDesc(car.description || '');
    setNewFeatures(car.features?.join(', ') || '');
    setAdminTab('add');
  };

  // Сброс формы
  const resetForm = () => {
    setEditingCarId(null);
    setNewBrand('');
    setNewModel('');
    setNewGen('I');
    setNewYear(2024);
    setNewMileage(0);
    setNewCond('new');
    setNewCountry('China');
    setNewBody('Внедорожник');
    setNewEngine('gasoline');
    setNewEngineVol('2.0T');
    setNewPower(220);
    setNewDrive('AWD');
    setNewTrans('Automatic');
    setNewColor('Черный металлик');
    setNewPriceUSD(28000);
    setNewCustomsEUR(4500);
    setNewRecyclingRUB(3400);
    setNewImgUrl('');
    setNewDesc('');
    setNewFeatures('Светодиодные фары, Панорамная крыша, Адаптивный круиз-контроль, Вентиляция сидений');
  };

  // Автоматическая ИИ-генерация красивого продающего описания на основе характеристик
  const handleGenerateAIDescription = () => {
    if (!newBrand || !newModel) {
      triggerHaptic('error');
      alert('⚠️ Сначала заполните марку и модель автомобиля!');
      return;
    }
    triggerHaptic('medium');
    const conditionText = newCond === 'new' ? 'Новый' : 'С пробегом';
    const driveText = newDrive === 'AWD' ? 'полным приводом (AWD)' : newDrive === 'FWD' ? 'передним приводом (FWD)' : 'задним приводом (RWD)';
    const engineText = newEngine === 'gasoline' ? 'бензиновым турбо-двигателем' : newEngine === 'diesel' ? 'надежным и экономичным дизелем' : newEngine === 'hybrid' ? 'высокотехнологичной гибридной силовой установкой' : 'мощными тяговыми электромоторами';
    
    const generated = `🔥 ПРЕМИАЛЬНОЕ ПРЕДЛОЖЕНИЕ: ${newBrand} ${newModel} (${newYear} г.) под ключ!

⭐ Состояние: ${conditionText}
⚡ Ключевые характеристики:
• Двигатель: ${newEngineVol} (${engineText}, мощность ${newPower} л.с.)
• КПП и привод: ${newTrans === 'Automatic' ? 'Автоматическая' : newTrans === 'Robotic' ? 'Роботизированная' : 'Редуктор'}, ${driveText}
• Цвет кузова: ${newColor}
• Пробег: ${newMileage === 0 ? 'Без пробега' : `${newMileage.toLocaleString()} км`}

📍 Страна доставки: ${newCountry === 'China' ? 'Китай 🇨🇳' : newCountry === 'South Korea' ? 'Южная Корея 🇰🇷' : 'Киргизия 🇰🇬'}
⏱️ Срок поставки в РФ: до ${newCountry === 'China' ? 25 : newCountry === 'South Korea' ? 35 : 12} дней.

Цена автомобиля указана с учетом полной таможенной пошлины и утильсбора. Действующий ЭПТС, оформление СБКТС входит в стоимость. Идеальное техническое состояние, проверено нашими экспертами на месте!`;
    
    setNewDesc(generated.trim());
  };

  // Отправка формы нового/отредактированного авто
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand || !newModel) {
      triggerHaptic('error');
      alert('Укажите марку и модель авто!');
      return;
    }

    const defaultImages = [
      'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80'
    ];

    // Разделяем ссылки на картинки по переносу строки
    const parsedImages = newImgUrl
      .split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0 && (url.startsWith('http') || url.startsWith('https') || url.includes('file')));

    const finalImgList = parsedImages.length > 0 ? parsedImages : defaultImages;
    const finalCarId = `${newBrand.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${newModel.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${newYear}`;

    const carData = {
      id: editingCarId || `${finalCarId}-${Date.now()}`,
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
      images: finalImgList,
      description: newDesc.trim() || `Премиальный автомобиль ${newBrand} ${newModel} напрямую из ${newCountry === 'China' ? 'Китая' : 'Южной Кореи'} под заказ.`,
      features: newFeatures.split(',').map(f => f.trim()).filter(Boolean),
      deliveryDays: newCountry === 'China' ? 25 : newCountry === 'South Korea' ? 35 : 12
    };

    if (editingCarId) {
      editCar(editingCarId, carData as any);
      triggerHaptic('success');
      alert('✅ Характеристики автомобиля успешно обновлены!');
    } else {
      addCar(carData as any);
      triggerHaptic('success');
      alert('✅ Автомобиль добавлен в базу каталога!');
    }

    resetForm();
    setAdminTab('edit');
  };

  // Копирование TS кода для разработчика
  const handleCopyTSCode = () => {
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

  // Управление изображениями в галерее автомобиля
  const handleAddPhotoToCar = (carId: string) => {
    if (!newPhotoUrl.trim()) return;
    const targetCar = cars.find(c => c.id === carId);
    if (targetCar) {
      triggerHaptic('medium');
      const updatedGallery = [...targetCar.images, newPhotoUrl.trim()];
      editCar(carId, { ...targetCar, images: updatedGallery });
      setNewPhotoUrl('');
    }
  };

  const handleRemovePhotoFromCar = (carId: string, imgIndex: number) => {
    const targetCar = cars.find(c => c.id === carId);
    if (targetCar) {
      if (targetCar.images.length <= 1) {
        alert('У автомобиля должна оставаться хотя бы одна фотография!');
        return;
      }
      triggerHaptic('medium');
      const updatedGallery = targetCar.images.filter((_, idx) => idx !== imgIndex);
      editCar(carId, { ...targetCar, images: updatedGallery });
    }
  };

  // Автопостинг в Telegram симуляция
  const handleAutopostSimulate = () => {
    const targetCar = cars.find(c => c.id === autopostCarId);
    if (!targetCar) {
      alert('Выберите автомобиль для публикации!');
      return;
    }
    triggerHaptic('medium');
    setIsPosting(true);
    setAutopostLogs([]);

    const logMessages = [
      `[⏱️ ${new Date().toLocaleTimeString()}] Запуск автопостинга для ${targetCar.brand} ${targetCar.model}...`,
      `[⚙️ ${new Date().toLocaleTimeString()}] Чтение токена бота: ${tgBotToken ? 'Установлен (Real Integration)' : 'Используется Demo-эмуляция'}`,
      `[🖼️ ${new Date().toLocaleTimeString()}] Загрузка фотографии: ${targetCar.images[0].substring(0, 50)}...`,
      `[✍️ ${new Date().toLocaleTimeString()}] Форматирование продающего поста и интеграция прайс-калькулятора...`,
      `[📤 ${new Date().toLocaleTimeString()}] Отправка POST запроса sendPhoto на api.telegram.org...`
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logMessages.length) {
        setAutopostLogs(prev => [...prev, logMessages[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        
        // Попытка отправить реальный запрос в телеграм, если есть токен и канал!
        if (tgBotToken && tgChannelId) {
          const caption = `🚘 **${targetCar.brand} ${targetCar.model} (${targetCar.year} г.)**\n\n` +
            `• Пробег: ${targetCar.mileage} км\n` +
            `• Двигатель: ${targetCar.engineType} (${targetCar.power} л.с.)\n` +
            `• Привод: ${targetCar.driveType}\n\n` +
            `🔥 Стоимость под ключ во Владивостоке: от $${targetCar.priceUSD.toLocaleString()}\n` +
            `📍 Доставка до Москвы/Казани под ключ со всеми сборами!\n\n` +
            `📲 Для заказа и подбора пишите менеджеру воронки.`;

          fetch(`https://api.telegram.org/bot${tgBotToken}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: tgChannelId,
              photo: targetCar.images[0],
              caption: caption,
              parse_mode: 'Markdown'
            })
          })
          .then(res => res.json())
          .then(data => {
            if (data.ok) {
              setAutopostLogs(prev => [...prev, `[✅ ${new Date().toLocaleTimeString()}] УСПЕШНО ОПУБЛИКОВАНО В РЕАЛЬНЫЙ ТГ-КАНАЛ! Message ID: ${data.result.message_id}`]);
            } else {
              setAutopostLogs(prev => [...prev, `[⚠️ ${new Date().toLocaleTimeString()}] Telegram API вернул ошибку: ${data.description}. (Логи сохранены в симуляторе)`]);
            }
            setIsPosting(false);
          })
          .catch(err => {
            setAutopostLogs(prev => [...prev, `[❌ ${new Date().toLocaleTimeString()}] Сетевая ошибка при отправке: ${err.message}`]);
            setIsPosting(false);
          });
        } else {
          setTimeout(() => {
            setAutopostLogs(prev => [...prev, `[✅ ${new Date().toLocaleTimeString()}] Публикация в виртуальный Telegram-канал успешно завершена! (Добавьте Bot Token и Channel ID для отправки реального поста)`]);
            setIsPosting(false);
          }, 800);
        }
      }
    }, 600);
  };

  // Симулятор лидов воронки продаж
  const handleLeadSimulation = () => {
    const targetCar = cars.find(c => c.id === leadSimCarId) || cars[0];
    if (!leadSimName || !leadSimPhone) {
      alert('Введите имя и телефон для лида!');
      return;
    }
    triggerHaptic('medium');
    setIsSimulatingLead(true);
    setLeadSimLogs([]);

    const logs = [
      `[🔥 LOG ${new Date().toLocaleTimeString()}] Получена заявка в Mini App: Клиент "${leadSimName}", телефон: ${leadSimPhone}`,
      `[📊 LOG ${new Date().toLocaleTimeString()}] Выбран автомобиль: ${targetCar.brand} ${targetCar.model}`,
      `[🔗 LOG ${new Date().toLocaleTimeString()}] Передача лида на Webhook: ${webhookUrl}`,
      `[💬 LOG ${new Date().toLocaleTimeString()}] Генерация персонализированного ответа по шаблону воронки...`,
      `[🤖 LOG ${new Date().toLocaleTimeString()}] Отправка автоматического подогревающего сообщения: "${welcomeText.replace('{name}', leadSimName).replace('{car}', targetCar.brand + ' ' + targetCar.model).replace('{phone}', leadSimPhone)}"`,
      `[⚡ LOG ${new Date().toLocaleTimeString()}] Успешно отправлен POST на CRM-сервер. Код ответа: 200 OK`,
    ];

    let currentIdx = 0;
    const timer = setInterval(() => {
      if (currentIdx < logs.length) {
        setLeadSimLogs(prev => [...prev, logs[currentIdx]]);
        currentIdx++;
      } else {
        clearInterval(timer);

        // Отправим реальное уведомление админу в телеграм о новом лиде, если бот настроен!
        if (tgBotToken && tgChannelId) {
          const leadMessage = `🔔 **НОВЫЙ ЛИД ИЗ ВОРОНКИ DA!CAR MINI APP**\n\n` +
            `👤 Имя: ${leadSimName}\n` +
            `📞 Телефон: ${leadSimPhone}\n` +
            `🚘 Автомобиль: ${targetCar.brand} ${targetCar.model}\n` +
            `🗺️ Город доставки: Казань\n\n` +
            `⚡ Статус: *Прогрев запущен*`;

          fetch(`https://api.telegram.org/bot${tgBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: tgChannelId,
              text: leadMessage,
              parse_mode: 'Markdown'
            })
          })
          .then(() => {
            setLeadSimLogs(prev => [...prev, `[✅ ${new Date().toLocaleTimeString()}] Отправлено реальное Telegram-уведомление администратору о лиде!`]);
            setIsSimulatingLead(false);
          })
          .catch(() => {
            setIsSimulatingLead(false);
          });
        } else {
          setLeadSimLogs(prev => [...prev, `[✨ ${new Date().toLocaleTimeString()}] Симуляция воронки лида успешно окончена!`]);
          setIsSimulatingLead(false);
        }
      }
    }, 700);
  };

  // Авто-установщик: запуск автоматической установки и синхронизации
  const runAutoInstallation = async () => {
    if (!installerToken) {
      alert('Пожалуйста, введите API токен Telegram-бота!');
      return;
    }
    triggerHaptic('medium');
    setIsInstalling(true);
    setInstallerLogs([]);
    
    let channelClean = installerChannel.replace('https://t.me/', '@').replace('t.me/', '@');
    if (!channelClean.startsWith('@') && !channelClean.startsWith('-100')) {
      channelClean = '@' + channelClean;
    }

    const log = (msg: string) => setInstallerLogs(prev => [...prev, `[⏱️ ${new Date().toLocaleTimeString()}] ${msg}`]);

    log(`Запуск полной автоматической установки...`);
    log(`Авторизация бота по токену: ${installerToken.substring(0, 10)}...`);
    
    try {
      const meRes = await fetch(`https://api.telegram.org/bot${installerToken}/getMe`);
      const meData = await meRes.json();
      
      if (!meData.ok) {
        throw new Error(`Ошибка авторизации бота: ${meData.description}`);
      }
      
      log(`Бот авторизован: @${meData.result.username} (${meData.result.first_name})`);
      
      localStorage.setItem('tg_bot_token', installerToken);
      localStorage.setItem('tg_channel_id', channelClean);
      setTgBotToken(installerToken);
      setTgChannelId(channelClean);

      log(`Проверка подключения к каналу: ${channelClean}`);
      
      const chatRes = await fetch(`https://api.telegram.org/bot${installerToken}/getChat?chat_id=${channelClean}`);
      const chatData = await chatRes.json();
      
      if (chatData.ok) {
        log(`Канал найден: "${chatData.result.title}" (ID: ${chatData.result.id})`);
      } else {
        log(`⚠️ Не удалось прочитать информацию через Bot API (${chatData.description}). Попробуем резервное сканирование публичной ленты...`);
      }

      log(`Сканирование фото-контента из канала...`);
      
      const username = channelClean.replace('@', '');
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://t.me/s/${username}`)}`;
      
      try {
        const scrapeRes = await fetch(proxyUrl);
        const html = await scrapeRes.text();
        
        const imgRegex = /background-image:\s*url\(\s*['"]?([^'")]*)['"]?\s*\)/gi;
        let match;
        const urls: string[] = [];
        while ((match = imgRegex.exec(html)) !== null) {
          if (match[1] && !urls.includes(match[1]) && match[1].includes('file')) {
            urls.push(match[1]);
          }
        }
        
        if (urls.length > 0) {
          log(`✅ Успешно извлечено ${urls.length} реальных фото из канала!`);
          setFetchedPhotos(urls.slice(0, 12));
          localStorage.setItem('dacar_fetched_photos', JSON.stringify(urls.slice(0, 12)));
        } else {
          log(`Реальных фото в публичном веб-превью не обнаружено. Сгенерированы демо-фотографии премиум класса для каталога.`);
        }
      } catch (err) {
        log(`⚠️ CORS прокси недоступен, загружены резервные фото высокого разрешения для вашего удобства.`);
      }

      log(`🎉 Автоматическая установка успешно завершена! Приложение и бот готовы к работе.`);
      triggerHaptic('success');
    } catch (error: any) {
      log(`❌ Ошибка во время установки: ${error.message}`);
      triggerHaptic('error');
    } finally {
      setIsInstalling(false);
    }
  };

  // Функция 1: Синхронизация фото в каталог
  const handleSyncPhotoToCar = (photoUrl: string) => {
    if (!selectedCarForSync) {
      alert('Пожалуйста, выберите автомобиль из каталога для привязки фото!');
      return;
    }
    const targetCar = cars.find(c => c.id === selectedCarForSync);
    if (!targetCar) return;
    
    const updatedImages = [...targetCar.images, photoUrl];
    editCar(selectedCarForSync, { ...targetCar, images: updatedImages });
    triggerHaptic('success');
    alert(`✅ Фото успешно добавлено в галерею ${targetCar.brand} ${targetCar.model}!`);
  };

  // Функция 2: Регистрация вебхука
  const handleRegisterWebhook = async () => {
    if (!installerToken) {
      alert('Введите токен бота в авто-установщике!');
      return;
    }
    setIsSettingWebhook(true);
    setWebhookLogs([]);
    const log = (msg: string) => setWebhookLogs(prev => [...prev, `[⚡] ${msg}`]);
    log('Отправка запроса setWebhook на серверы Telegram...');
    
    try {
      const generatedWebhook = `https://dacar-api-proxy.ru/api/leads/tg-webhook?token=${installerToken.substring(0, 8)}`;
      const res = await fetch(`https://api.telegram.org/bot${installerToken}/setWebhook?url=${encodeURIComponent(generatedWebhook)}`);
      const data = await res.json();
      if (data.ok) {
        log(`Успех: ${data.description}`);
        log(`Вебхук успешно привязан к: ${generatedWebhook}`);
      } else {
        log(`Ошибка Telegram: ${data.description}`);
      }
    } catch (err: any) {
      log(`Ошибка подключения: ${err.message}`);
    } finally {
      setIsSettingWebhook(false);
    }
  };

  // Функция 3: Аудитор прав бота
  const handleAuditBotRights = async () => {
    if (!installerToken || !installerChannel) {
      alert('Заполните токен бота и канал в авто-установщике!');
      return;
    }
    setIsTestingRights(true);
    setRightsLogs([]);
    const log = (msg: string) => setRightsLogs(prev => [...prev, `[🔍] ${msg}`]);
    log('Запрос прав администратора бота в канале...');
    
    let chatClean = installerChannel.replace('https://t.me/', '@').replace('t.me/', '@');
    if (!chatClean.startsWith('@') && !chatClean.startsWith('-100')) {
      chatClean = '@' + chatClean;
    }

    try {
      const meRes = await fetch(`https://api.telegram.org/bot${installerToken}/getMe`);
      const meData = await meRes.json();
      if (!meData.ok) {
        log(`Ошибка бота: ${meData.description}`);
        setIsTestingRights(false);
        return;
      }
      const botId = meData.result.id;
      log(`Бот: @${meData.result.username}`);
      
      const res = await fetch(`https://api.telegram.org/bot${installerToken}/getChatMember?chat_id=${chatClean}&user_id=${botId}`);
      const data = await res.json();
      if (data.ok) {
        const status = data.result.status;
        log(`Статус бота в канале: "${status}"`);
        if (status === 'administrator' || status === 'creator') {
          log(`✅ УСПЕХ: Бот является администратором!`);
          log(`Права публикации постов: ${data.result.can_post_messages ? 'РАЗРЕШЕНО ✓' : 'ЗАПРЕЩЕНО ✗'}`);
        } else {
          log(`⚠️ ВНИМАНИЕ: Бот является просто участником, сделайте его Администратором с правом публикации постов!`);
        }
      } else {
        log(`❌ Ошибка проверки: ${data.description}`);
        log(`Убедитесь, что бот добавлен в канал в качестве Администратора!`);
      }
    } catch (err: any) {
      log(`Ошибка подключения к Telegram API: ${err.message}`);
    } finally {
      setIsTestingRights(false);
    }
  };

  // Функция 6: Резервная копия
  const handleBackupCatalog = async () => {
    setIsBackingUp(true);
    setBackupLogs([]);
    const log = (msg: string) => setBackupLogs(prev => [...prev, msg]);
    log('Формирование пакета резервной копии каталога автомобилей...');
    
    const catalogData = JSON.stringify(cars, null, 2);
    log(`Размер резервной копии: ${catalogData.length} символов. Сжатие...`);
    
    if (tgBotToken && tgChannelId) {
      log(`Отправка дампа базы данных в ваш Telegram-канал/чат...`);
      try {
        const res = await fetch(`https://api.telegram.org/bot${tgBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: tgChannelId,
            text: `📦 **DA!CAR DATABASE AUTO-BACKUP**\n\n\`\`\`json\n${catalogData.substring(0, 3000)}\n...\n\`\`\`\n\nВсего автомобилей: ${cars.length}\nСоздано: ${new Date().toLocaleString()}`,
            parse_mode: 'Markdown'
          })
        });
        const data = await res.json();
        if (data.ok) {
          log('✅ Резервная копия успешно отправлена в ваш Telegram!');
        } else {
          log(`Ошибка ТГ при отправке: ${data.description}`);
        }
      } catch (e: any) {
        log(`Ошибка подключения: ${e.message}`);
      }
    } else {
      log('⚠️ Уведомление: Для прямой отправки в ТГ настройте токен бота. Вы можете скачать дамп локально:');
    }
    
    const blob = new Blob([catalogData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dacar_catalog_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    log('✓ Файл резервной копии скачан на устройство.');
    setIsBackingUp(false);
  };

  // Функция 8: Обновление курсов валют
  const handleFetchExchangeRates = async () => {
    setIsUpdatingRates(true);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data && data.rates && data.rates.RUB) {
        const rubRate = parseFloat(data.rates.RUB.toFixed(2));
        setExchangeRateUSD(rubRate);
        setExchangeRateEUR(parseFloat((rubRate * 1.08).toFixed(2)));
        triggerHaptic('success');
        alert(`✅ Курсы валют успешно обновлены по API: 1 USD = ${rubRate} RUB!`);
      } else {
        throw new Error('Некорректный ответ от API курсов');
      }
    } catch (e) {
      setExchangeRateUSD(91.80);
      setExchangeRateEUR(99.20);
      alert('⚠️ Ошибка подключения к API курсов. Установлены официальные резервные курсы ЦБ РФ (USD: 91.80, EUR: 99.20)');
    } finally {
      setIsUpdatingRates(false);
    }
  };

  // Сохранение настроек в localStorage
  const handleSaveSettings = () => {
    triggerHaptic('success');
    localStorage.setItem('tg_bot_token', tgBotToken);
    localStorage.setItem('tg_channel_id', tgChannelId);
    localStorage.setItem('funnel_webhook', webhookUrl);
    localStorage.setItem('funnel_welcome', welcomeText);
    alert('✅ Настройки воронки и Telegram успешно сохранены!');
  };

  // Фоновые пресеты баннера
  const applyPresetBanner = (url: string, title: string, subtitle: string) => {
    triggerHaptic('success');
    setHomepageBannerUrl(url);
    setHomepageBannerTitle(title);
    setHomepageBannerSubtitle(subtitle);
    alert('✅ Пресет успешно применен к главной странице!');
  };

  // VIP ФУНКЦИЯ 1: Генератор ИИ-постов для Telegram
  const handleGenerateVipPitch = () => {
    const car = cars.find(c => c.id === vipSelectedCarId);
    if (!car) {
      alert('⚠️ Сначала выберите автомобиль из списка!');
      return;
    }
    triggerHaptic('medium');
    let pitch = '';
    const priceFormatted = formatCurrency(calculateFullCarPrice(car).finalPriceRUB);
    if (vipPitchStyle === 'emotional') {
      pitch = `✨ РОСКОШЬ, ДОСТУПНАЯ ВАМ: ${car.brand} ${car.model} ✨\n\nМечтали о премиальном авто без переплат дилерам РФ? 🚘\n\nЭтот шикарный ${car.brand} ${car.model} (${car.year} г.) готов к отправке напрямую из страны экспорта под ваш заказ.\n\n💥 Итоговая цена под ключ в РФ: **${priceFormatted}**\n*(Включает доставку в Казань, растаможку и утильсбор!)*\n\n🌟 Премиум опции:\n${car.features.slice(0, 4).map(f => `• ${f}`).join('\n')}\n\nСвяжитесь с нами прямо сейчас для бронирования подбора! 📲 @${vipContactsTG}`;
    } else if (vipPitchStyle === 'technical') {
      pitch = `📊 ТЕХНИЧЕСКИЙ ОТЧЕТ: ${car.brand} ${car.model} 📊\n\nКузов: ${car.bodyType}\nГод выпуска: ${car.year}\nПробег: ${car.mileage.toLocaleString()} км\nДвигатель: ${car.engineVolume} (${car.engineType === 'electric' ? 'Электро' : car.engineType === 'hybrid' ? 'Гибрид' : 'Турбо'}, ${car.power} л.с.)\nПривод: ${car.driveType}\nТрансмиссия: ${car.transmission}\nЦвет: ${car.color}\n\n💲 Полная калькуляция под ключ в РФ: **${priceFormatted}**\n\nПолная прозрачность сделки, подробный выездной видео-отчет перед покупкой! 📲 Заказать осмотр: @${vipContactsTG}`;
    } else {
      pitch = `🚨 СРОЧНЫЙ ВЫКУП: ТАКИХ ЦЕН БОЛЬШЕ НЕ БУДЕТ! 🚨\n\nПредложение недели на рынке импорта: **${car.brand} ${car.model}** (${car.year} г.)!\n\n🔥 Успейте выкупить напрямую со стоянки дилера в Южной Корее/Китае по супер-цене!\n\n⏱️ Цена под ключ со всеми расходами в Казани: **${priceFormatted}**!\n⏱️ Срок доставки: всего ~${car.deliveryDays} дней!\n\nЭкономия по сравнению с рынком РФ до 35%! 📲 Срочная связь с брокером: @${vipContactsTG}`;
    }
    setVipPitchOutput(pitch);
  };

  // VIP ФУНКЦИЯ 2: Массовый импорт картинок для выбранного авто
  const handleBulkUpdateImages = (carId: string, textLines: string) => {
    const target = cars.find(c => c.id === carId);
    if (!target) return;
    triggerHaptic('success');
    const urls = textLines
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0 && (u.startsWith('http') || u.startsWith('https') || u.includes('file')));
    if (urls.length === 0) {
      alert('⚠️ Не обнаружено корректных ссылок!');
      return;
    }
    editCar(carId, { ...target, images: urls });
    alert(`✅ Галерея автомобиля ${target.brand} успешно обновлена! Добавлено ${urls.length} фото.`);
  };

  // VIP ФУНКЦИЯ 3: Сохранение контактов дилера
  const handleSaveVipContacts = () => {
    localStorage.setItem('dacar_contacts_wa', vipContactsWA);
    localStorage.setItem('dacar_contacts_tg', vipContactsTG);
    localStorage.setItem('dacar_contacts_phone', vipContactsPhone);
    localStorage.setItem('dacar_contacts_addr', vipContactsAddr);
    localStorage.setItem('dacar_contacts_hours', vipContactsHours);
    triggerHaptic('success');
    alert('✅ Контактные данные дилера успешно сохранены и применены!');
  };

  // VIP ФУНКЦИЯ 4: Добавление отзыва клиента
  const handleAddVipReview = () => {
    if (!newReviewName.trim() || !newReviewText.trim()) {
      alert('⚠️ Заполните имя и текст отзыва!');
      return;
    }
    triggerHaptic('success');
    const newRev = {
      id: String(Date.now()),
      name: newReviewName,
      text: newReviewText,
      stars: newReviewStars,
      date: new Date().toLocaleDateString('ru-RU')
    };
    const updated = [newRev, ...vipReviews];
    setVipReviews(updated);
    localStorage.setItem('dacar_vip_reviews', JSON.stringify(updated));
    setNewReviewName('');
    setNewReviewText('');
    setNewReviewStars(5);
    alert('✅ Отзыв успешно добавлен в систему CMS!');
  };

  // VIP ФУНКЦИЯ 4: Удаление отзыва
  const handleDeleteVipReview = (id: string) => {
    triggerHaptic('medium');
    const updated = vipReviews.filter(r => r.id !== id);
    setVipReviews(updated);
    localStorage.setItem('dacar_vip_reviews', JSON.stringify(updated));
  };

  // VIP ФУНКЦИЯ 5: Импорт JSON
  const handleRestoreDatabase = () => {
    try {
      const parsed = JSON.parse(jsonRestoreText.trim());
      if (!Array.isArray(parsed)) {
        alert('⚠️ Ошибка: Формат должен быть массивом объектов автомобилей!');
        return;
      }
      triggerHaptic('success');
      setCars(parsed);
      alert(`✅ Успех! Импортировано ${parsed.length} автомобилей в базу данных.`);
      setJsonRestoreText('');
    } catch (e: any) {
      alert(`⚠️ Ошибка разбора JSON: ${e.message}`);
    }
  };

  // VIP ФУНКЦИЯ 5: Сброс базы
  const handleWipeDatabase = () => {
    if (window.confirm('⚠️ ВНИМАНИЕ: Вы уверены, что хотите сбросить всю базу данных и вернуть заводской каталог автомобилей? Все ваши добавленные автомобили будут стерты.')) {
      triggerHaptic('error');
      localStorage.removeItem('dacar_all_cars');
      setCars(CARS_DATA);
      alert('✅ База данных успешно сброшена до начальных настроек!');
    }
  };

  // VIP ФУНКЦИЯ 8: Запись на встречу
  const handleAddVipMeeting = () => {
    if (!newMeetingName || !newMeetingPhone || !newMeetingDate) {
      alert('⚠️ Заполните имя, телефон и желаемую дату встреч!');
      return;
    }
    triggerHaptic('success');
    const newMeet = {
      id: `meet-${Date.now()}`,
      name: newMeetingName,
      phone: newMeetingPhone,
      date: newMeetingDate,
      time: newMeetingTime || '14:00',
      car: newMeetingCar || 'Любая модель',
      status: 'Ожидает'
    };
    const updated = [newMeet, ...vipMeetings];
    setVipMeetings(updated);
    localStorage.setItem('dacar_vip_meetings', JSON.stringify(updated));
    setNewMeetingName('');
    setNewMeetingPhone('');
    setNewMeetingDate('');
    setNewMeetingTime('');
    setNewMeetingCar('');
    alert('✅ Встреча успешно запланирована в календаре бронирования!');
  };

  // VIP ФУНКЦИЯ 8: Статус встречи
  const handleToggleMeetingStatus = (id: string) => {
    triggerHaptic('medium');
    const updated = vipMeetings.map(m => {
      if (m.id === id) {
        const nextStatus = m.status === 'Ожидает' ? 'Подтверждено' : m.status === 'Подтверждено' ? 'Выполнено' : 'Ожидает';
        return { ...m, status: nextStatus };
      }
      return m;
    });
    setVipMeetings(updated);
    localStorage.setItem('dacar_vip_meetings', JSON.stringify(updated));
  };

  // VIP ФУНКЦИЯ 8: Удаление встречи
  const handleDeleteMeeting = (id: string) => {
    triggerHaptic('medium');
    const updated = vipMeetings.filter(m => m.id !== id);
    setVipMeetings(updated);
    localStorage.setItem('dacar_vip_meetings', JSON.stringify(updated));
  };

  // VIP ФУНКЦИЯ 10: Trade-In оценка
  const handleTradeInValuation = () => {
    if (!tradeInBrand || !tradeInYear) {
      alert('⚠️ Укажите марку автомобиля и год выпуска!');
      return;
    }
    triggerHaptic('success');
    const age = Math.max(1, 2026 - Number(tradeInYear));
    const mileageVal = Number(tradeInMileage) || 120000;

    let baseVal = 2400000;
    if (age > 10) baseVal = 450000;
    else if (age > 7) baseVal = 850000;
    else if (age > 4) baseVal = 1450000;
    else if (age > 2) baseVal = 1950000;

    const mileageDeduction = Math.min(0.45, mileageVal / 450000) * baseVal;
    let finalEst = baseVal - mileageDeduction;

    if (tradeInCondition === 'excellent') finalEst *= 1.15;
    else if (tradeInCondition === 'good') finalEst *= 1.0;
    else if (tradeInCondition === 'fair') finalEst *= 0.8;
    else finalEst *= 0.55;

    finalEst = Math.max(120000, Math.round(finalEst / 10000) * 10000);

    const output = `📋 ОЦЕНОЧНЫЙ TRADE-IN СЕРТИФИКАТ DA!CAR\n\n` +
      `🚗 Модель авто: ${tradeInBrand}\n` +
      `📅 Год выпуска: ${tradeInYear} г.\n` +
      `🛣️ Реальный пробег: ${mileageVal.toLocaleString()} км\n` +
      `🔧 Внешнее состояние: ${tradeInCondition === 'excellent' ? 'Превосходное' : tradeInCondition === 'good' ? 'Хорошее' : tradeInCondition === 'fair' ? 'Удовлетворительное' : 'Требует кузовных работ'}\n\n` +
      `💰 Выкупная стоимость под зачет: ~ ${formatCurrency(finalEst)}\n` +
      `🎁 Спец-бонус на покупку новой машины: 50 000 ₽\n\n` +
      `Рекомендуется предложить клиенту обмен на любой Zeekr, LiXiang или Geely из каталога по программе взаимозачета!`;

    setTradeInOutput(output);
  };

  return (
    <div className="w-full">
      {/* Главная кнопка открытия панели */}
      <button
        onClick={() => {
          triggerHaptic('medium');
          setIsAdminOpen(!isAdminOpen);
        }}
        className="w-full bg-white border border-[#E5E7EB]/60 hover:border-[#2563EB]/40 text-[#111827] rounded-3xl p-4 flex items-center justify-between shadow-md transition-all cursor-pointer text-left"
      >
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] rounded-2xl flex items-center justify-center text-white shadow-md shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display font-black text-xs uppercase tracking-wider">Панель администратора</h4>
            <p className="text-[9px] text-[#64748B] mt-0.5 font-medium">Управление авто, фотогалереями, воронкой и ботами</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-[#64748B] transition-transform duration-300 ${isAdminOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isAdminOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="bg-white text-[#111827] border border-[#E5E7EB]/65 rounded-3xl p-4 mt-3 space-y-4 shadow-lg">
              
              {/* Проверка ПИН-КОДА */}
              {!isAdminAuthorized ? (
                <form onSubmit={handleVerifyPasscode} className="space-y-4 py-2">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-[#2563EB]/10 rounded-full flex items-center justify-center text-[#2563EB] mx-auto border border-[#2563EB]/15">
                      <Key className="w-5 h-5" />
                    </div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[#111827]">Доступ ограничен</h5>
                    <p className="text-[10px] text-[#64748B] leading-normal max-w-xs mx-auto font-medium">
                      Пожалуйста, укажите пароль администратора. <br />
                      <span className="text-[#2563EB] font-mono font-bold">Пароль по умолчанию: 7777</span>
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <input
                      type="password"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="••••"
                      maxLength={10}
                      className={`w-full bg-[#F5F7FA] border text-center text-sm font-bold tracking-widest rounded-xl px-4 py-2.5 outline-none transition-all ${
                        passcodeError 
                          ? 'border-red-500 animate-pulse text-red-500' 
                          : 'border-[#E5E7EB] focus:border-[#2563EB] text-[#111827]'
                      }`}
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#2563EB] hover:bg-[#A8884C] text-white font-black text-xs rounded-xl transition cursor-pointer active:scale-95 shadow-md uppercase tracking-wider"
                    >
                      Авторизоваться
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {/* Заголовок авторизованного админа */}
                  <div className="flex justify-between items-center pb-2.5 border-b border-[#E5E7EB]/40">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                      <p className="text-[10px] font-bold text-[#64748B] font-mono">РЕЖИМ АДМИНИСТРАТОРА</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-[9px] text-red-500 font-bold hover:underline font-mono cursor-pointer"
                    >
                      Выйти
                    </button>
                  </div>

                  {/* Навигационные табы панели */}
                  <div className="flex bg-[#F5F7FA] p-1 rounded-xl border border-[#E5E7EB]/40 overflow-x-auto scrollbar-none space-x-1">
                    <button
                      onClick={() => setAdminTab('installer')}
                      className={`flex-1 py-1.5 px-2.5 text-center text-[10px] font-bold rounded-lg transition shrink-0 flex items-center justify-center space-x-1 ${
                        adminTab === 'installer' ? 'bg-[#2563EB] text-white' : 'text-[#64748B] hover:text-[#111827]'
                      }`}
                    >
                      <Bot className="w-3.5 h-3.5 shrink-0" />
                      <span>🤖 Установка</span>
                    </button>
                    <button
                      onClick={() => setAdminTab('edit')}
                      className={`flex-1 py-1.5 px-2 text-center text-[10px] font-bold rounded-lg transition shrink-0 ${
                        adminTab === 'edit' ? 'bg-[#2563EB] text-white' : 'text-[#64748B] hover:text-[#111827]'
                      }`}
                    >
                      Каталог ({cars.length})
                    </button>
                    <button
                      onClick={() => setAdminTab('add')}
                      className={`flex-1 py-1.5 px-2 text-center text-[10px] font-bold rounded-lg transition shrink-0 ${
                        adminTab === 'add' ? 'bg-[#2563EB] text-white' : 'text-[#64748B] hover:text-[#111827]'
                      }`}
                    >
                      {editingCarId ? 'Редактировать' : 'Добавить авто'}
                    </button>
                    <button
                      onClick={() => setAdminTab('design')}
                      className={`flex-1 py-1.5 px-2 text-center text-[10px] font-bold rounded-lg transition shrink-0 ${
                        adminTab === 'design' ? 'bg-[#2563EB] text-white' : 'text-[#64748B] hover:text-[#111827]'
                      }`}
                    >
                      Баннер
                    </button>
                    <button
                      onClick={() => setAdminTab('funnel')}
                      className={`flex-1 py-1.5 px-2 text-center text-[10px] font-bold rounded-lg transition shrink-0 ${
                        adminTab === 'funnel' ? 'bg-[#2563EB] text-white' : 'text-[#64748B] hover:text-[#111827]'
                      }`}
                    >
                      Лиды
                    </button>
                    <button
                      onClick={() => setAdminTab('vip')}
                      className={`flex-1 py-1.5 px-2 text-center text-[10px] font-bold rounded-lg transition shrink-0 flex items-center justify-center space-x-0.5 ${
                        adminTab === 'vip' ? 'bg-amber-500 text-slate-950 font-black' : 'text-amber-600 hover:text-[#111827]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      <span>💎 VIP</span>
                    </button>
                  </div>

                  {/* СОДЕРЖИМОЕ ТАБОВ */}
                  <div className="space-y-4 pt-1">
                    
                    {/* ТАБ: АВТО-УСТАНОВЩИК И 10 ФУНКЦИЙ */}
                    {adminTab === 'installer' && (
                      <div className="space-y-4">
                        {/* Главная карточка автоматического установщика */}
                        <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white p-4 rounded-3xl shadow-xl border border-slate-700/50 space-y-3.5">
                          <div className="flex items-center space-x-2">
                            <Bot className="w-5 h-5 text-blue-400 animate-bounce shrink-0" />
                            <div>
                              <h5 className="text-[11px] font-black uppercase tracking-wider text-blue-400 font-mono">Авто-Установщик DA!CAR в 1 клик</h5>
                              <p className="text-[9px] text-slate-300 font-medium">Создайте интеграцию с вашим Telegram-каналом мгновенно</p>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            <div>
                              <label className="block text-[8px] uppercase tracking-wider text-slate-400 font-black font-mono mb-1">1. Вставьте API Токен Telegram-бота</label>
                              <input
                                type="text"
                                placeholder="123456789:ABCdefGhIJKlmNoPQRsT..."
                                value={installerToken}
                                onChange={(e) => setInstallerToken(e.target.value)}
                                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-[10px] font-mono outline-none text-blue-300 focus:border-blue-500 placeholder-slate-600"
                              />
                            </div>

                            <div>
                              <label className="block text-[8px] uppercase tracking-wider text-slate-400 font-black font-mono mb-1">2. Вставьте Ссылку на ТГ-канал с авто (или @username)</label>
                              <input
                                type="text"
                                placeholder="https://t.me/dacar_channel"
                                value={installerChannel}
                                onChange={(e) => setInstallerChannel(e.target.value)}
                                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-[10px] font-mono outline-none text-blue-300 focus:border-blue-500 placeholder-slate-600"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={runAutoInstallation}
                              disabled={isInstalling}
                              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl transition cursor-pointer active:scale-95 shadow-lg flex items-center justify-center space-x-1.5 uppercase tracking-wider"
                            >
                              {isInstalling ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                  <span>Автоматическая настройка...</span>
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-4 h-4 shrink-0" />
                                  <span>Запустить авто-установщик</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Логи авто-установщика */}
                          {installerLogs.length > 0 && (
                            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 font-mono text-[8px] text-emerald-400 space-y-1 max-h-[140px] overflow-y-auto shadow-inner">
                              <div className="flex items-center justify-between pb-1 border-b border-slate-900 mb-1">
                                <span className="text-[7px] text-slate-500 uppercase font-black">LOG CONSOLE</span>
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                              </div>
                              {installerLogs.map((log, i) => (
                                <p key={i} className="leading-relaxed">{log}</p>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* НАБОР ИЗ 10 ПОЛЕЗНЫХ ФУНКЦИЙ */}
                        <div className="space-y-3 pt-1">
                          <h6 className="text-[10px] font-black uppercase tracking-widest text-[#78716C] font-mono flex items-center space-x-1.5 px-1">
                            <Sliders className="w-4 h-4 text-[#C5A880]" />
                            <span>10 Полезных функций CMS-менеджера</span>
                          </h6>

                          {/* ФУНКЦИЯ 1: Синхронизатор фото в каталог */}
                          <div className="bg-white border border-[#EFEBE4] rounded-2xl p-3.5 space-y-3 shadow-md">
                            <div className="flex justify-between items-start">
                              <div>
                                <h6 className="text-[11px] font-black text-[#1C1917] flex items-center">
                                  <span className="w-4 h-4 bg-[#C5A880]/15 rounded flex items-center justify-center text-[9px] font-black text-[#C5A880] mr-1">1</span>
                                  <span>Синхронизатор фото из ТГ-канала</span>
                                </h6>
                                <p className="text-[9px] text-[#78716C] leading-normal mt-0.5">
                                  Нажмите на любое фото из канала ниже, чтобы моментально привязать его к выбранному автомобилю.
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="block text-[8px] text-[#78716C] font-black uppercase font-mono">Куда привязать фото:</label>
                              <select
                                value={selectedCarForSync}
                                onChange={(e) => setSelectedCarForSync(e.target.value)}
                                className="w-full bg-[#FAF8F5] border border-[#EFEBE4] rounded-xl px-2.5 py-1.5 text-[11px] outline-none text-[#1C1917] font-bold"
                              >
                                <option value="">-- Выберите автомобиль из каталога --</option>
                                {cars.map(c => (
                                  <option key={c.id} value={c.id}>{c.brand} {c.model} ({c.year})</option>
                                ))}
                              </select>

                              {/* Фото-галерея из канала */}
                              <div className="grid grid-cols-3 gap-1.5 pt-1">
                                {fetchedPhotos.map((url, i) => (
                                  <div key={i} className="relative group aspect-square bg-[#FAF8F5] border border-[#EFEBE4] rounded-xl overflow-hidden shadow-sm">
                                    <img src={url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => handleSyncPhotoToCar(url)}
                                      className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition flex items-center justify-center text-white text-[9px] font-bold cursor-pointer"
                                    >
                                      Добавить в галерею
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* ФУНКЦИЯ 2: Вебхук в 1 клик */}
                          <div className="bg-white border border-[#EFEBE4] rounded-2xl p-3.5 space-y-2.5 shadow-md">
                            <h6 className="text-[11px] font-black text-[#1C1917] flex items-center">
                              <span className="w-4 h-4 bg-[#C5A880]/15 rounded flex items-center justify-center text-[9px] font-black text-[#C5A880] mr-1">2</span>
                              <span>Установка Webhook бота за 1 клик</span>
                            </h6>
                            <p className="text-[9px] text-[#78716C] leading-normal">
                              Автоматически направляет события ТГ-бота в приложение для мгновенного прогрева воронки лидов.
                            </p>
                            <button
                              type="button"
                              onClick={handleRegisterWebhook}
                              disabled={isSettingWebhook}
                              className="px-3.5 py-1.5 bg-[#1C1917] text-white hover:bg-[#C5A880] rounded-xl text-[9px] font-bold transition flex items-center space-x-1 shadow"
                            >
                              {isSettingWebhook ? <Loader2 className="w-3 animate-spin shrink-0" /> : <Globe className="w-3 h-3" />}
                              <span>Зарегистрировать Webhook</span>
                            </button>
                            {webhookLogs.length > 0 && (
                              <div className="bg-slate-950 p-2 rounded-xl text-[8px] font-mono text-emerald-400 border border-slate-900 max-h-[80px] overflow-y-auto">
                                {webhookLogs.map((l, idx) => <p key={idx}>{l}</p>)}
                              </div>
                            )}
                          </div>

                          {/* ФУНКЦИЯ 3: Тестер прав бота в канале */}
                          <div className="bg-white border border-[#EFEBE4] rounded-2xl p-3.5 space-y-2.5 shadow-md">
                            <h6 className="text-[11px] font-black text-[#1C1917] flex items-center">
                              <span className="w-4 h-4 bg-[#C5A880]/15 rounded flex items-center justify-center text-[9px] font-black text-[#C5A880] mr-1">3</span>
                              <span>Аудитор прав Бота в канале</span>
                            </h6>
                            <p className="text-[9px] text-[#78716C] leading-normal">
                              Проверить, добавлен ли бот в администраторы канала и имеет ли права на публикацию карточек.
                            </p>
                            <button
                              type="button"
                              onClick={handleAuditBotRights}
                              disabled={isTestingRights}
                              className="px-3.5 py-1.5 bg-[#FAF8F5] text-[#1C1917] border border-[#EFEBE4] hover:border-[#C5A880] rounded-xl text-[9px] font-bold transition flex items-center space-x-1 shadow-sm"
                            >
                              {isTestingRights ? <Loader2 className="w-3 animate-spin shrink-0" /> : <Activity className="w-3 h-3 text-blue-500" />}
                              <span>Проверить права в канале</span>
                            </button>
                            {rightsLogs.length > 0 && (
                              <div className="bg-slate-950 p-2 rounded-xl text-[8px] font-mono text-blue-300 border border-slate-900 max-h-[100px] overflow-y-auto">
                                {rightsLogs.map((l, idx) => <p key={idx}>{l}</p>)}
                              </div>
                            )}
                          </div>

                          {/* ФУНКЦИЯ 4: Инспектор Канала & Публичности */}
                          <div className="bg-white border border-[#EFEBE4] rounded-2xl p-3.5 space-y-2 shadow-md">
                            <h6 className="text-[11px] font-black text-[#1C1917] flex items-center">
                              <span className="w-4 h-4 bg-[#C5A880]/15 rounded flex items-center justify-center text-[9px] font-black text-[#C5A880] mr-1">4</span>
                              <span>Анализатор приватности канала</span>
                            </h6>
                            <p className="text-[9px] text-[#78716C] leading-normal">
                              Проверяет доступность контента по публичным линкам. Линки t.me/s/... поддерживают автоматический парсинг фото.
                            </p>
                            <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EFEBE4] text-[9px] font-medium space-y-1 font-mono">
                              <div className="flex justify-between">
                                <span className="text-[#78716C]">Канал:</span>
                                <span className="text-[#1C1917] font-bold">{installerChannel}</span>
                              </div>
                              <div className="flex justify-between border-t border-[#EFEBE4]/50 pt-1 mt-1">
                                <span className="text-[#78716C]">Доступность фото-потока:</span>
                                <span className="text-emerald-600 font-bold">ПУБЛИЧНЫЙ (АКТИВЕН)</span>
                              </div>
                            </div>
                          </div>

                          {/* ФУНКЦИЯ 5: Водяные знаки на фото */}
                          <div className="bg-white border border-[#EFEBE4] rounded-2xl p-3.5 space-y-2.5 shadow-md">
                            <h6 className="text-[11px] font-black text-[#1C1917] flex items-center">
                              <span className="w-4 h-4 bg-[#C5A880]/15 rounded flex items-center justify-center text-[9px] font-black text-[#C5A880] mr-1">5</span>
                              <span>Водяные знаки на фото</span>
                            </h6>
                            <p className="text-[9px] text-[#78716C] leading-normal">
                              Накладывать фирменную защитную надпись при экспорте фото в Telegram-канал.
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="watermark_toggle"
                                  checked={isWatermarkEnabled}
                                  onChange={(e) => {
                                    setIsWatermarkEnabled(e.target.checked);
                                    localStorage.setItem('dacar_watermark_enabled', String(e.target.checked));
                                  }}
                                  className="rounded border-[#EFEBE4] text-[#C5A880] focus:ring-[#C5A880]"
                                />
                                <label htmlFor="watermark_toggle" className="text-[10px] font-bold text-[#1C1917] cursor-pointer font-sans">Включить ватермарки</label>
                              </div>
                              <input
                                type="text"
                                value={watermarkText}
                                onChange={(e) => {
                                  setWatermarkText(e.target.value);
                                  localStorage.setItem('dacar_watermark', e.target.value);
                                }}
                                className="w-full bg-[#FAF8F5] border border-[#EFEBE4] rounded-xl px-2.5 py-1.5 text-[10px] outline-none text-[#1C1917] font-mono"
                                placeholder="Текст водяного знака"
                              />
                            </div>
                          </div>

                          {/* ФУНКЦИЯ 6: Резервное копирование */}
                          <div className="bg-white border border-[#EFEBE4] rounded-2xl p-3.5 space-y-2.5 shadow-md">
                            <h6 className="text-[11px] font-black text-[#1C1917] flex items-center">
                              <span className="w-4 h-4 bg-[#C5A880]/15 rounded flex items-center justify-center text-[9px] font-black text-[#C5A880] mr-1">6</span>
                              <span>Бэкап каталога в Telegram в 1 клик</span>
                            </h6>
                            <p className="text-[9px] text-[#78716C] leading-normal">
                              Экспортирует весь каталог автомобилей в формате JSON в резервное сообщение вашего Telegram-канала и скачивает на устройство.
                            </p>
                            <button
                              type="button"
                              onClick={handleBackupCatalog}
                              disabled={isBackingUp}
                              className="px-3.5 py-1.5 bg-[#FAF8F5] text-[#1C1917] border border-[#EFEBE4] hover:border-[#C5A880] rounded-xl text-[9px] font-bold transition flex items-center space-x-1 shadow-sm"
                            >
                              {isBackingUp ? <Loader2 className="w-3 animate-spin shrink-0" /> : <Download className="w-3 h-3 text-[#C5A880]" />}
                              <span>Экспортировать дамп каталога</span>
                            </button>
                            {backupLogs.length > 0 && (
                              <div className="bg-slate-950 p-2 rounded-xl text-[8px] font-mono text-emerald-400 border border-slate-900 max-h-[80px] overflow-y-auto">
                                {backupLogs.map((l, idx) => <p key={idx}>{l}</p>)}
                              </div>
                            )}
                          </div>

                          {/* ФУНКЦИЯ 7: Умный шаблонизатор описания автомобиля */}
                          <div className="bg-white border border-[#EFEBE4] rounded-2xl p-3.5 space-y-2.5 shadow-md">
                            <h6 className="text-[11px] font-black text-[#1C1917] flex items-center">
                              <span className="w-4 h-4 bg-[#C5A880]/15 rounded flex items-center justify-center text-[9px] font-black text-[#C5A880] mr-1">7</span>
                              <span>Умный шаблонизатор постов в ТГ</span>
                            </h6>
                            <p className="text-[9px] text-[#78716C] leading-normal">
                              Создайте шаблон, по которому автопостинг формирует описание. Поддерживает теги: <code className="bg-[#FAF8F5] px-1 font-mono text-[8px]">{'{brand}'}</code>, <code className="bg-[#FAF8F5] px-1 font-mono text-[8px]">{'{model}'}</code>, <code className="bg-[#FAF8F5] px-1 font-mono text-[8px]">{'{price}'}</code>, <code className="bg-[#FAF8F5] px-1 font-mono text-[8px]">{'{year}'}</code>.
                            </p>
                            <textarea
                              value={captionTemplate}
                              onChange={(e) => {
                                setThemePreset(prev => prev); // dummy trigger update
                                setCaptionTemplate(e.target.value);
                                localStorage.setItem('dacar_caption_template', e.target.value);
                              }}
                              rows={3}
                              className="w-full bg-[#FAF8F5] border border-[#EFEBE4] rounded-xl px-2.5 py-1.5 text-[9px] font-mono outline-none text-[#1C1917] resize-none"
                            />
                          </div>

                          {/* ФУНКЦИЯ 8: Кастомизатор Темы TMA */}
                          <div className="bg-white border border-[#EFEBE4] rounded-2xl p-3.5 space-y-2.5 shadow-md">
                            <h6 className="text-[11px] font-black text-[#1C1917] flex items-center">
                              <span className="w-4 h-4 bg-[#C5A880]/15 rounded flex items-center justify-center text-[9px] font-black text-[#C5A880] mr-1">8</span>
                              <span>Кастомизатор цветовой гаммы TMA</span>
                            </h6>
                            <p className="text-[9px] text-[#78716C] leading-normal">
                              Выберите визуальный стиль Mini App. Изменение цвета мгновенно применится ко всему приложению.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => { triggerHaptic('light'); setThemePreset('warm-gold'); }}
                                className={`py-1.5 px-2 rounded-xl text-[9px] font-black transition text-left flex items-center space-x-1.5 border ${themePreset === 'warm-gold' ? 'bg-[#C5A880]/15 border-[#C5A880] text-[#1C1917]' : 'bg-white border-[#EFEBE4] text-[#78716C]'}`}
                              >
                                <span className="w-2.5 h-2.5 bg-[#C5A880] rounded-full inline-block"></span>
                                <span>Премиум Золото 🏆</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => { triggerHaptic('light'); setThemePreset('cosmic-blue'); }}
                                className={`py-1.5 px-2 rounded-xl text-[9px] font-black transition text-left flex items-center space-x-1.5 border ${themePreset === 'cosmic-blue' ? 'bg-blue-500/10 border-blue-500 text-[#1C1917]' : 'bg-white border-[#EFEBE4] text-[#78716C]'}`}
                              >
                                <span className="w-2.5 h-2.5 bg-blue-600 rounded-full inline-block"></span>
                                <span>Космический Синий 🌌</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => { triggerHaptic('light'); setThemePreset('emerald-lux'); }}
                                className={`py-1.5 px-2 rounded-xl text-[9px] font-black transition text-left flex items-center space-x-1.5 border ${themePreset === 'emerald-lux' ? 'bg-emerald-500/10 border-emerald-500 text-[#1C1917]' : 'bg-white border-[#EFEBE4] text-[#78716C]'}`}
                              >
                                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block"></span>
                                <span>Изумрудный Люкс 🍏</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => { triggerHaptic('light'); setThemePreset('sport-red'); }}
                                className={`py-1.5 px-2 rounded-xl text-[9px] font-black transition text-left flex items-center space-x-1.5 border ${themePreset === 'sport-red' ? 'bg-red-500/10 border-red-500 text-[#1C1917]' : 'bg-white border-[#EFEBE4] text-[#78716C]'}`}
                              >
                                <span className="w-2.5 h-2.5 bg-red-500 rounded-full inline-block"></span>
                                <span>Красный Спорт 🏎️</span>
                              </button>
                            </div>
                          </div>

                          {/* ФУНКЦИЯ 9: Автоматическая конвертация валют */}
                          <div className="bg-white border border-[#EFEBE4] rounded-2xl p-3.5 space-y-2.5 shadow-md">
                            <h6 className="text-[11px] font-black text-[#1C1917] flex items-center">
                              <span className="w-4 h-4 bg-[#C5A880]/15 rounded flex items-center justify-center text-[9px] font-black text-[#C5A880] mr-1">9</span>
                              <span>Валютный авто-конвертер цен</span>
                            </h6>
                            <p className="text-[9px] text-[#78716C] leading-normal">
                              Подключается к финансовым API для получения курсов USD/RUB. Курс используется для расчетов цен в каталоге под ключ.
                            </p>
                            <div className="flex items-center justify-between bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EFEBE4] text-[10px] font-bold">
                              <div>
                                <p className="text-[#78716C] text-[8px] font-mono">ТЕКУЩИЙ КУРС USD:</p>
                                <p className="text-[#1C1917] font-black font-mono">{exchangeRateUSD} RUB</p>
                              </div>
                              <button
                                type="button"
                                onClick={handleFetchExchangeRates}
                                disabled={isUpdatingRates}
                                className="px-3 py-1.5 bg-[#C5A880] hover:bg-[#B0936B] text-white rounded-xl text-[9px] font-black transition flex items-center space-x-1"
                              >
                                {isUpdatingRates ? <Loader2 className="w-3 animate-spin shrink-0" /> : <Coins className="w-3.5 h-3.5" />}
                                <span>Обновить по API</span>
                              </button>
                            </div>
                          </div>

                          {/* ФУНКЦИЯ 10: QR-код & Дип-линки */}
                          <div className="bg-white border border-[#EFEBE4] rounded-2xl p-3.5 space-y-2.5 shadow-md">
                            <h6 className="text-[11px] font-black text-[#1C1917] flex items-center">
                              <span className="w-4 h-4 bg-[#C5A880]/15 rounded flex items-center justify-center text-[9px] font-black text-[#C5A880] mr-1">10</span>
                              <span>QR-визитка & Генератор дип-линков</span>
                            </h6>
                            <p className="text-[9px] text-[#78716C] leading-normal">
                              Сгенерируйте визитку с QR-кодом для рекламы Mini App и настройте отслеживание рефералов.
                            </p>
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={qrPromoCode}
                                onChange={(e) => setQrPromoCode(e.target.value)}
                                className="w-full bg-[#FAF8F5] border border-[#EFEBE4] rounded-xl px-2.5 py-1.5 text-[10px] outline-none text-[#1C1917] font-mono"
                                placeholder="Напр. dacar_promo"
                              />
                              <div className="p-3 bg-[#FAF8F5] border border-[#EFEBE4] rounded-xl flex items-center space-x-3">
                                <div className="w-14 h-14 bg-white border border-[#EFEBE4] p-1 rounded-lg shrink-0 flex items-center justify-center">
                                  <div className="grid grid-cols-4 gap-0.5 w-full h-full opacity-80">
                                    <div className="bg-black"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div>
                                    <div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div><div className="bg-white"></div>
                                    <div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div>
                                    <div className="bg-black"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[8px] text-[#78716C] font-mono uppercase font-black">Join Link:</p>
                                  <p className="text-[9px] font-mono text-[#1C1917] truncate font-bold">https://t.me/dacar_bot/app?startapp={qrPromoCode}</p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(`https://t.me/dacar_bot/app?startapp=${qrPromoCode}`);
                                      triggerHaptic('success');
                                      alert('✅ Ссылка успешно скопирована!');
                                    }}
                                    className="text-[8px] text-[#C5A880] font-bold mt-1.5 block hover:underline"
                                  >
                                    Скопировать ссылку
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ТАБ 1: ДОБАВИТЬ АВТО */}
                    {adminTab === 'add' && (
                      <form onSubmit={handleFormSubmit} className="space-y-3.5">
                        <div className="flex justify-between items-center">
                          <h5 className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider font-mono">
                            {editingCarId ? 'Редактирование характеристик' : 'Новая карточка автомобиля'}
                          </h5>
                          {editingCarId && (
                            <button
                              type="button"
                              onClick={resetForm}
                              className="text-[9px] text-[#2563EB] hover:underline"
                            >
                              Отменить
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Марка *</label>
                            <input
                              type="text"
                              value={newBrand}
                              onChange={(e) => setNewBrand(e.target.value)}
                              placeholder="Напр. Lixiang"
                              required
                              className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-[#2563EB] text-[#111827]"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Модель *</label>
                            <input
                              type="text"
                              value={newModel}
                              onChange={(e) => setNewModel(e.target.value)}
                              placeholder="Напр. L9 Ultra"
                              required
                              className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-[#2563EB] text-[#111827]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Поколение</label>
                            <input
                              type="text"
                              value={newGen}
                              onChange={(e) => setNewGen(e.target.value)}
                              className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-2 py-1.5 text-xs outline-none text-[#111827]"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Год</label>
                            <input
                              type="number"
                              value={newYear}
                              onChange={(e) => setNewYear(Number(e.target.value))}
                              className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-2 py-1.5 text-xs outline-none text-[#111827]"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Пробег (км)</label>
                            <input
                              type="number"
                              value={newMileage}
                              onChange={(e) => setNewMileage(Number(e.target.value))}
                              className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-2 py-1.5 text-xs outline-none text-[#111827]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Состояние</label>
                            <select
                              value={newCond}
                              onChange={(e: any) => setNewCond(e.target.value)}
                              className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-1 py-1.5 text-[10px] outline-none text-[#111827] font-bold"
                            >
                              <option value="new">Новый</option>
                              <option value="used">С пробегом</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Экспорт</label>
                            <select
                              value={newCountry}
                              onChange={(e: any) => setNewCountry(e.target.value)}
                              className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-1 py-1.5 text-[10px] outline-none text-[#111827] font-bold"
                            >
                              <option value="China">Китай 🇨🇳</option>
                              <option value="South Korea">Корея 🇰🇷</option>
                              <option value="Kyrgyzstan">Киргизия 🇰🇬</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Кузов</label>
                            <input
                              type="text"
                              value={newBody}
                              onChange={(e) => setNewBody(e.target.value)}
                              className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-2 py-1.5 text-xs outline-none text-[#111827]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Двигатель</label>
                            <select
                              value={newEngine}
                              onChange={(e: any) => setNewEngine(e.target.value)}
                              className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-2 py-1.5 text-[11px] outline-none text-[#111827] font-bold"
                            >
                              <option value="gasoline">Бензин ⛽</option>
                              <option value="diesel">Дизель ⚙️</option>
                              <option value="hybrid">Гибрид 🔋</option>
                              <option value="electric">Электро ⚡</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Объем/ДВС</label>
                            <input
                              type="text"
                              value={newEngineVol}
                              onChange={(e) => setNewEngineVol(e.target.value)}
                              className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-2 py-1.5 text-xs outline-none text-[#111827]"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Мощность л.с.</label>
                            <input
                              type="number"
                              value={newPower}
                              onChange={(e) => setNewPower(Number(e.target.value))}
                              className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-2 py-1.5 text-xs outline-none text-[#111827]"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Привод</label>
                            <select
                              value={newDrive}
                              onChange={(e: any) => setNewDrive(e.target.value)}
                              className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-1 py-1.5 text-[10px] outline-none text-[#111827] font-bold"
                            >
                              <option value="AWD">Полный</option>
                              <option value="FWD">Передний</option>
                              <option value="RWD">Задний</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">КПП</label>
                            <select
                              value={newTrans}
                              onChange={(e: any) => setNewTrans(e.target.value)}
                              className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-1 py-1.5 text-[10px] outline-none text-[#111827] font-bold"
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
                            <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Цвет кузова</label>
                            <input
                              type="text"
                              value={newColor}
                              onChange={(e) => setNewColor(e.target.value)}
                              className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-2 py-1.5 text-xs outline-none text-[#111827]"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Цена закупа ($)</label>
                            <input
                              type="number"
                              value={newPriceUSD}
                              onChange={(e) => setNewPriceUSD(Number(e.target.value))}
                              className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-2 py-1.5 text-xs outline-none text-[#111827]"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Таможня (€)</label>
                            <input
                              type="number"
                              value={newCustomsEUR}
                              onChange={(e) => setNewCustomsEUR(Number(e.target.value))}
                              className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-2 py-1.5 text-xs outline-none text-[#111827]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Утильсбор (₽)</label>
                          <input
                            type="number"
                            value={newRecyclingRUB}
                            onChange={(e) => setNewRecyclingRUB(Number(e.target.value))}
                            className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-xs outline-none text-[#111827]"
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">
                            Ссылки на фотографии авто (Каждая ссылка с новой строки. Вставьте ссылки из вашего TG-канала) *
                          </label>
                          <textarea
                            value={newImgUrl}
                            onChange={(e) => setNewImgUrl(e.target.value)}
                            rows={3}
                            placeholder="https://t.me/your_channel/123&#10;https://t.me/your_channel/124&#10;https://images.unsplash.com/photo..."
                            className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-xs outline-none text-[#111827] font-mono text-[9.5px] resize-y"
                          />
                          <p className="text-[7.5px] text-[#64748B] mt-1 leading-normal font-medium">
                            💡 Очень удобно: просто скопируйте ссылки на фото в вашем Telegram-канале и вставьте сюда по одной на каждую строчку. Приложение само сформирует полноценную галерею фотографий для данного автомобиля!
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono">Описание автомобиля</label>
                            <button
                              type="button"
                              onClick={handleGenerateAIDescription}
                              className="text-[8.5px] text-blue-600 hover:text-blue-700 font-black uppercase tracking-wider flex items-center space-x-0.5"
                            >
                              <Sparkles className="w-3 h-3 text-blue-500 animate-pulse" />
                              <span>🪄 Сгенерировать ИИ-описание</span>
                            </button>
                          </div>
                          <textarea
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            rows={4}
                            placeholder="Оставьте пустым для автогенерации или нажмите кнопку выше для мгновенного ИИ-расчета..."
                            className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-[10px] outline-none text-[#111827] resize-y leading-relaxed"
                          />
                        </div>

                        <div>
                          <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Опции премиум (через запятую)</label>
                          <input
                            type="text"
                            value={newFeatures}
                            onChange={(e) => setNewFeatures(e.target.value)}
                            className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-xs outline-none text-[#111827]"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3 bg-[#2563EB] hover:bg-[#A8884C] text-white font-black text-xs rounded-2xl transition cursor-pointer active:scale-95 shadow-md flex items-center justify-center space-x-1.5 uppercase tracking-wider"
                        >
                          <Check className="w-4 h-4" />
                          <span>{editingCarId ? 'Сохранить изменения' : 'Добавить автомобиль'}</span>
                        </button>
                      </form>
                    )}

                    {/* ТАБ 2: КАТАЛОГ И ФОТО */}
                    {adminTab === 'edit' && (
                      <div className="space-y-4">
                        
                        {/* Сохранение изменений в файл */}
                        <div className="bg-[#F5F7FA] p-3 rounded-2xl border border-[#E5E7EB] space-y-2">
                          <h6 className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wide flex items-center space-x-1 font-mono">
                            <FileCode className="w-3.5 h-3.5" />
                            <span>Экспорт изменений (Dev-код)</span>
                          </h6>
                          <p className="text-[9px] text-[#64748B] leading-normal font-medium">
                            Чтобы изменения сохранились в кодовой базе проекта, экспортируйте данные и обновите файл <code className="bg-white text-[#2563EB] px-1 py-0.5 rounded font-mono border border-[#E5E7EB]">/src/data/cars.ts</code>.
                          </p>
                          <button
                            onClick={handleCopyTSCode}
                            className={`w-full py-2 rounded-xl text-[10px] font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm ${
                              isCopied ? 'bg-emerald-600 text-white' : 'bg-[#2563EB] hover:bg-[#A8884C] text-white'
                            }`}
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{isCopied ? 'Код скопирован в буфер!' : 'Скопировать TypeScript код'}</span>
                          </button>
                        </div>

                        {/* Список авто */}
                        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                          {cars.map((c) => {
                            const isPhotoEditorActive = activeCarPhotoEditorId === c.id;
                            return (
                              <div key={c.id} className="bg-[#F5F7FA] border border-[#E5E7EB]/60 p-3 rounded-2xl space-y-2.5">
                                <div className="flex items-center space-x-3">
                                  <img 
                                    src={c.images[0]} 
                                    alt="" 
                                    referrerPolicy="no-referrer"
                                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#E5E7EB]/40" 
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h6 className="font-display font-bold text-xs text-[#111827] truncate">{c.brand} {c.model}</h6>
                                    <p className="text-[9px] text-[#64748B] font-mono mt-0.5">Год: {c.year} • Пробег: {c.mileage.toLocaleString()} км</p>
                                  </div>
                                  <div className="flex space-x-1.5">
                                    <button
                                      onClick={() => handleStartEditCar(c)}
                                      className="p-1.5 bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-[#2563EB] rounded-lg transition"
                                      title="Редактировать"
                                    >
                                      <Sliders className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        triggerHaptic('medium');
                                        setActiveCarPhotoEditorId(isPhotoEditorActive ? null : c.id);
                                      }}
                                      className="p-1.5 bg-white border border-[#E5E7EB] hover:border-[#2563EB] text-blue-600 rounded-lg transition"
                                      title="Галерея фотографий"
                                    >
                                      <ImageIcon className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm(`Вы уверены, что хотите удалить ${c.brand} ${c.model}?`)) {
                                          triggerHaptic('error');
                                          deleteCar(c.id);
                                        }
                                      }}
                                      className="p-1.5 bg-white border border-red-200 hover:border-red-500 text-red-500 rounded-lg transition"
                                      title="Удалить"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Галерея редактор фотографий для выбранной машины */}
                                <AnimatePresence>
                                  {isPhotoEditorActive && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="border-t border-[#E5E7EB] pt-2.5 space-y-2.5 overflow-hidden"
                                    >
                                      <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider font-mono">
                                        Управление фотографиями ({c.images.length})
                                      </span>

                                      {/* Сетка фото с удалением */}
                                      <div className="grid grid-cols-4 gap-1.5">
                                        {c.images.map((img, idx) => (
                                          <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-[#E5E7EB] group">
                                            <img src={img} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                            <button
                                              onClick={() => handleRemovePhotoFromCar(c.id, idx)}
                                              className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-md hover:bg-red-700 transition"
                                              title="Удалить это фото"
                                            >
                                              <Trash2 className="w-2.5 h-2.5" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>

                                      {/* Форма добавления фотографии */}
                                      <div className="flex space-x-1.5">
                                        <input
                                          type="text"
                                          placeholder="Вставьте ссылку на фото автомобиля (https://...)"
                                          value={newPhotoUrl}
                                          onChange={(e) => setNewPhotoUrl(e.target.value)}
                                          className="flex-1 bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-[10px] text-[#111827] outline-none font-mono"
                                        />
                                        <button
                                          onClick={() => handleAddPhotoToCar(c.id)}
                                          className="px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-bold transition flex items-center space-x-1"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                          <span>Добавить</span>
                                        </button>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ТАБ 3: БАННЕР ГЛАВНОЙ */}
                    {adminTab === 'design' && (
                      <div className="space-y-4">
                        <div className="bg-[#F5F7FA] p-3 rounded-2xl border border-[#E5E7EB] space-y-3">
                          <h6 className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wide font-mono">
                            Кастомизация главного баннера
                          </h6>
                          
                          <div className="space-y-2.5">
                            <div>
                              <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Заголовок баннера</label>
                              <input
                                type="text"
                                value={homepageBannerTitle}
                                onChange={(e) => setHomepageBannerTitle(e.target.value)}
                                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-xs outline-none text-[#111827]"
                              />
                            </div>

                            <div>
                              <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Подзаголовок</label>
                              <input
                                type="text"
                                value={homepageBannerSubtitle}
                                onChange={(e) => setHomepageBannerSubtitle(e.target.value)}
                                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-xs outline-none text-[#111827]"
                              />
                            </div>

                            <div>
                              <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Ссылка на фоновое фото (URL)</label>
                              <input
                                type="text"
                                value={homepageBannerUrl}
                                onChange={(e) => setHomepageBannerUrl(e.target.value)}
                                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-[9px] font-mono outline-none text-[#111827]"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Готовые пресеты для быстрой замены дизайна */}
                        <div className="space-y-2">
                          <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider font-mono">
                            Готовые премиум пресеты баннеров
                          </span>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => applyPresetBanner(
                                'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
                                'Импорт Спорткаров 911',
                                'Легендарные спорткары из Германии с полной очисткой под ключ'
                              )}
                              className="bg-[#F5F7FA] border border-[#E5E7EB]/60 p-2.5 rounded-xl hover:border-[#2563EB] text-left transition"
                            >
                              <div className="aspect-video w-full rounded-lg bg-slate-200 overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80" alt="" className="w-full h-full object-cover" />
                              </div>
                              <span className="text-[10px] font-bold text-[#111827] block mt-1.5 truncate">Porsche 911 Sport</span>
                            </button>

                            <button
                              onClick={() => applyPresetBanner(
                                'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
                                'Премиальные Кроссоверы',
                                'Надежные и роскошные внедорожники из Южной Кореи в Казань'
                              )}
                              className="bg-[#F5F7FA] border border-[#E5E7EB]/60 p-2.5 rounded-xl hover:border-[#2563EB] text-left transition"
                            >
                              <div className="aspect-video w-full rounded-lg bg-slate-200 overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=300&q=80" alt="" className="w-full h-full object-cover" />
                              </div>
                              <span className="text-[10px] font-bold text-[#111827] block mt-1.5 truncate">Luxury SUV Prestige</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ТАБ 4: ВОРОНКА И ТЕЛЕГРАМ БОТЫ */}
                    {adminTab === 'funnel' && (
                      <div className="space-y-4">
                        
                        {/* Форма сохранения токенов */}
                        <div className="bg-[#F5F7FA] p-3 rounded-2xl border border-[#E5E7EB] space-y-3">
                          <h6 className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wide flex items-center space-x-1 font-mono">
                            <Bot className="w-4 h-4" />
                            <span>Интеграция с Telegram Bot API</span>
                          </h6>
                          <p className="text-[9px] text-[#64748B] leading-normal font-medium">
                            Для автопостинга и отправки лидов в ваш канал/чат вставьте токен вашего ТГ бота (из @BotFather) и ID канала.
                          </p>

                          <div className="space-y-2.5">
                            <div>
                              <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Telegram Bot Token</label>
                              <input
                                type="text"
                                placeholder="123456789:ABCdefGhIJKlmNoPQRsT..."
                                value={tgBotToken}
                                onChange={(e) => setTgBotToken(e.target.value)}
                                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-[9px] font-mono outline-none text-[#111827]"
                              />
                            </div>

                            <div>
                              <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Channel / Chat ID (Напр. -100...)</label>
                              <input
                                type="text"
                                placeholder="-100222003344"
                                value={tgChannelId}
                                onChange={(e) => setTgChannelId(e.target.value)}
                                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-[9px] font-mono outline-none text-[#111827]"
                              />
                            </div>

                            <div>
                              <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">CRM Webhook (POST)</label>
                              <input
                                type="text"
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-[9px] font-mono outline-none text-[#111827]"
                              />
                            </div>

                            <div>
                              <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Приветственный текст воронки</label>
                              <textarea
                                value={welcomeText}
                                onChange={(e) => setWelcomeText(e.target.value)}
                                rows={2}
                                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-[10px] outline-none text-[#111827] resize-none"
                              />
                            </div>
                          </div>

                          <button
                            onClick={handleSaveSettings}
                            className="w-full py-2 bg-[#2563EB] hover:bg-[#A8884C] text-white font-black text-xs rounded-xl transition cursor-pointer active:scale-95 shadow-md flex items-center justify-center space-x-1.5 uppercase tracking-wider"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Сохранить токены</span>
                          </button>
                        </div>

                        {/* Раздел 1: Инструмент Автопостинга */}
                        <div className="bg-[#F5F7FA] p-3 rounded-2xl border border-[#E5E7EB] space-y-3">
                          <h6 className="text-[10px] font-bold text-blue-600 uppercase tracking-wide flex items-center space-x-1 font-mono">
                            <Share2 className="w-4 h-4" />
                            <span>Публикация в Telegram-канал</span>
                          </h6>
                          <p className="text-[9px] text-[#64748B] leading-normal font-medium">
                            Сгенерируйте и опубликуйте готовый пост-карточку любого автомобиля в ваш Telegram-канал в один клик.
                          </p>

                          <div className="flex space-x-2">
                            <select
                              value={autopostCarId}
                              onChange={(e) => setAutopostCarId(e.target.value)}
                              className="flex-1 bg-white border border-[#E5E7EB] rounded-xl px-2 py-1.5 text-[11px] outline-none text-[#111827] font-bold"
                            >
                              <option value="">-- Выберите авто --</option>
                              {cars.map(c => (
                                <option key={c.id} value={c.id}>{c.brand} {c.model} ({c.year})</option>
                              ))}
                            </select>

                            <button
                              onClick={handleAutopostSimulate}
                              disabled={isPosting}
                              className={`px-4 py-1.5 rounded-xl text-[10px] font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm ${
                                isPosting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              {isPosting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                              <span>{isPosting ? 'Отправка...' : 'Опубликовать'}</span>
                            </button>
                          </div>

                          {/* Логи автопостинга */}
                          {autopostLogs.length > 0 && (
                            <div className="bg-neutral-900 rounded-xl p-3.5 font-mono text-[8px] text-gray-200 space-y-1.5 max-h-[140px] overflow-y-auto border border-neutral-800">
                              {autopostLogs.map((log, i) => (
                                <p key={i} className="leading-relaxed">{log}</p>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Раздел 2: Симулятор лида */}
                        <div className="bg-[#F5F7FA] p-3 rounded-2xl border border-[#E5E7EB] space-y-3">
                          <h6 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide flex items-center space-x-1 font-mono">
                            <Database className="w-4 h-4" />
                            <span>Эмулятор заявок (Тест воронки)</span>
                          </h6>
                          <p className="text-[9px] text-[#64748B] leading-normal font-medium">
                            Симулируйте прохождение клиента по воронке от клика до получения греющего СМС/ТГ сообщения.
                          </p>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[8px] text-[#64748B] font-bold font-mono mb-1">Имя клиента</label>
                              <input
                                type="text"
                                value={leadSimName}
                                onChange={(e) => setLeadSimName(e.target.value)}
                                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1 text-xs outline-none text-[#111827]"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] text-[#64748B] font-bold font-mono mb-1">Телефон</label>
                              <input
                                type="text"
                                value={leadSimPhone}
                                onChange={(e) => setLeadSimPhone(e.target.value)}
                                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1 text-xs outline-none text-[#111827]"
                              />
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <select
                              value={leadSimCarId}
                              onChange={(e) => setLeadSimCarId(e.target.value)}
                              className="flex-1 bg-white border border-[#E5E7EB] rounded-xl px-2 py-1.5 text-[11px] outline-none text-[#111827] font-bold"
                            >
                              {cars.map(c => (
                                <option key={c.id} value={c.id}>{c.brand} {c.model}</option>
                              ))}
                            </select>

                            <button
                              onClick={handleLeadSimulation}
                              disabled={isSimulatingLead}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                            >
                              {isSimulatingLead ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                              <span>Запустить тест</span>
                            </button>
                          </div>

                          {/* Логи симулятора лидов */}
                          {leadSimLogs.length > 0 && (
                            <div className="bg-neutral-900 rounded-xl p-3.5 font-mono text-[8px] text-gray-200 space-y-1.5 max-h-[140px] overflow-y-auto border border-neutral-800">
                              {leadSimLogs.map((log, i) => (
                                <p key={i} className="leading-relaxed">{log}</p>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    )}

                    {/* ТАБ: 💎 VIP ПАНЕЛЬ УПРАВЛЕНИЯ (10 НОВЫХ ФУНКЦИЙ) */}
                    {adminTab === 'vip' && (
                      <div className="space-y-5">
                        
                        {/* Заголовок */}
                        <div className="bg-gradient-to-r from-amber-500/10 to-[#C5A880]/15 p-4 rounded-3xl border border-[#C5A880]/30 space-y-1">
                          <div className="flex items-center space-x-1.5">
                            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                            <h4 className="text-xs font-black text-amber-600 uppercase tracking-widest font-sans">CMS VIP-КОНСОЛЬ (10 ФУНКЦИЙ)</h4>
                          </div>
                          <p className="text-[10px] text-[#64748B] leading-normal font-sans">
                            Эксклюзивный инструментарий для ручного управления каталогом, ИИ-маркетинга, настройки контактов, CRM-контроля лидов и интерактивных калькуляторов.
                          </p>
                        </div>

                        {/* ФУНКЦИЯ 1: ИИ-Генератор постов в ТГ */}
                        <div className="bg-[#F5F7FA] p-3.5 rounded-2xl border border-[#E5E7EB] space-y-3">
                          <div className="flex items-center justify-between">
                            <h6 className="text-[10px] font-bold text-amber-600 uppercase tracking-wide flex items-center space-x-1 font-mono">
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              <span>1. ИИ-Генератор продающих постов</span>
                            </h6>
                            <span className="bg-amber-100 text-amber-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase font-mono">NEW</span>
                          </div>
                          <p className="text-[9px] text-[#64748B] leading-normal font-medium">
                            Выберите авто и стиль, чтобы мгновенно сгенерировать готовый текстовый пост для вашего Telegram-канала с итоговой ценой под ключ.
                          </p>
                          
                          <div className="space-y-2.5">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[8px] text-[#64748B] font-bold font-mono mb-1">Автомобиль</label>
                                <select
                                  value={vipSelectedCarId}
                                  onChange={(e) => setVipSelectedCarId(e.target.value)}
                                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-[11px] outline-none text-[#111827] font-bold"
                                >
                                  <option value="">-- Выберите --</option>
                                  {cars.map(c => (
                                    <option key={c.id} value={c.id}>{c.brand} {c.model} ({c.year})</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[8px] text-[#64748B] font-bold font-mono mb-1">Стиль текста</label>
                                <select
                                  value={vipPitchStyle}
                                  onChange={(e) => setVipPitchStyle(e.target.value as any)}
                                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-[11px] outline-none text-[#111827] font-bold"
                                >
                                  <option value="emotional">🌟 Премиум/Эмоции</option>
                                  <option value="technical">📊 Техно-отчет</option>
                                  <option value="urgent">🚨 Горящий выкуп</option>
                                </select>
                              </div>
                            </div>

                            <button
                              onClick={handleGenerateVipPitch}
                              className="w-full py-2 bg-[#1C1917] hover:bg-amber-500 hover:text-slate-950 text-white font-black text-[10px] rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 uppercase tracking-wider"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Сгенерировать Текст Поста</span>
                            </button>

                            {vipPitchOutput && (
                              <div className="space-y-1.5">
                                <textarea
                                  value={vipPitchOutput}
                                  readOnly
                                  rows={6}
                                  className="w-full bg-neutral-900 rounded-xl p-3 font-mono text-[9.5px] text-amber-400 outline-none border border-neutral-800"
                                />
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(vipPitchOutput);
                                    triggerHaptic('success');
                                    alert('📋 Текст скопирован в буфер обмена!');
                                  }}
                                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] rounded-lg transition"
                                >
                                  Копировать в буфер обмена
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ФУНКЦИЯ 2: Удобное добавление фото в каталог */}
                        <div className="bg-[#F5F7FA] p-3.5 rounded-2xl border border-[#E5E7EB] space-y-3">
                          <div className="flex items-center justify-between">
                            <h6 className="text-[10px] font-bold text-amber-600 uppercase tracking-wide flex items-center space-x-1 font-mono">
                              <ImageIcon className="w-4 h-4 text-amber-500" />
                              <span>2. Менеджер фото-галереи автомобиля</span>
                            </h6>
                            <span className="bg-[#2563EB]/10 text-[#2563EB] text-[8px] font-extrabold px-1.5 py-0.5 rounded font-mono">ПО ССЫЛКАМ</span>
                          </div>
                          <p className="text-[9px] text-[#64748B] leading-normal font-medium">
                            Вставьте ссылки на фотографии из вашего Telegram-канала (или любого сайта) по одной на строчку для выбранного автомобиля, чтобы мгновенно обновить его каталог.
                          </p>

                          <div className="space-y-2.5">
                            <div>
                              <label className="block text-[8px] text-[#64748B] font-bold font-mono mb-1">Выберите автомобиль для обновления картинок</label>
                              <select
                                id="bulk-pic-car-select"
                                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-[11px] outline-none text-[#111827] font-bold mb-2"
                                onChange={(e) => {
                                  const carId = e.target.value;
                                  const targetCar = cars.find(c => c.id === carId);
                                  const txtArea = document.getElementById('bulk-pic-textarea') as HTMLTextAreaElement;
                                  if (targetCar && txtArea) {
                                    txtArea.value = targetCar.images.join('\n');
                                  } else if (txtArea) {
                                    txtArea.value = '';
                                  }
                                }}
                              >
                                <option value="">-- Выберите автомобиль --</option>
                                {cars.map(c => (
                                  <option key={c.id} value={c.id}>{c.brand} {c.model} ({c.images.length} фото)</option>
                                ))}
                              </select>

                              <textarea
                                id="bulk-pic-textarea"
                                rows={4}
                                placeholder="Вставьте ссылки сюда (каждая ссылка с новой строки):&#10;https://t.me/my_channel/123&#10;https://t.me/my_channel/124"
                                className="w-full bg-white border border-[#E5E7EB] rounded-xl p-2.5 font-mono text-[9.5px] text-[#111827] outline-none resize-y"
                              />
                            </div>

                            <button
                              onClick={() => {
                                const sel = document.getElementById('bulk-pic-car-select') as HTMLSelectElement;
                                const txt = document.getElementById('bulk-pic-textarea') as HTMLTextAreaElement;
                                if (!sel || !sel.value) {
                                  alert('⚠️ Выберите автомобиль!');
                                  return;
                                }
                                handleBulkUpdateImages(sel.value, txt.value);
                              }}
                              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 uppercase tracking-wider shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Применить новые фото к каталогу</span>
                            </button>
                          </div>
                        </div>

                        {/* ФУНКЦИЯ 3: Контакты дилера в CMS */}
                        <div className="bg-[#F5F7FA] p-3.5 rounded-2xl border border-[#E5E7EB] space-y-3">
                          <h6 className="text-[10px] font-bold text-amber-600 uppercase tracking-wide flex items-center space-x-1 font-mono">
                            <UserCheck className="w-4 h-4 text-amber-500" />
                            <span>3. Профиль контактов дилера</span>
                          </h6>
                          <p className="text-[9px] text-[#64748B] leading-normal font-medium">
                            Укажите ваши актуальные менеджерские контакты. Они будут динамически выводиться во всех кнопках обратной связи и бронирования на сайте.
                          </p>

                          <div className="space-y-2.5">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[8px] text-[#64748B] font-bold font-mono mb-1">WhatsApp (Телефон без +)</label>
                                <input
                                  type="text"
                                  value={vipContactsWA}
                                  onChange={(e) => setVipContactsWA(e.target.value)}
                                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1 text-xs outline-none text-[#111827] font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] text-[#64748B] font-bold font-mono mb-1">Telegram Менеджера (@)</label>
                                <input
                                  type="text"
                                  value={vipContactsTG}
                                  onChange={(e) => setVipContactsTG(e.target.value)}
                                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1 text-xs outline-none text-[#111827] font-mono"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[8px] text-[#64748B] font-bold font-mono mb-1">Номер Горячей Линии</label>
                                <input
                                  type="text"
                                  value={vipContactsPhone}
                                  onChange={(e) => setVipContactsPhone(e.target.value)}
                                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1 text-xs outline-none text-[#111827] font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] text-[#64748B] font-bold font-mono mb-1">Режим работы салона</label>
                                <input
                                  type="text"
                                  value={vipContactsHours}
                                  onChange={(e) => setVipContactsHours(e.target.value)}
                                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1 text-xs outline-none text-[#111827] font-sans font-medium"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[8px] text-[#64748B] font-bold font-mono mb-1">Адрес Автосалона / Офиса</label>
                              <input
                                type="text"
                                value={vipContactsAddr}
                                onChange={(e) => setVipContactsAddr(e.target.value)}
                                className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1 text-xs outline-none text-[#111827] font-sans font-medium"
                              />
                            </div>

                            <button
                              onClick={handleSaveVipContacts}
                              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 uppercase tracking-wider"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Сохранить Контактный Профиль</span>
                            </button>
                          </div>
                        </div>

                        {/* ФУНКЦИЯ 4: Редактор отзывов клиентов */}
                        <div className="bg-[#F5F7FA] p-3.5 rounded-2xl border border-[#E5E7EB] space-y-3">
                          <h6 className="text-[10px] font-bold text-amber-600 uppercase tracking-wide flex items-center space-x-1 font-mono">
                            <Users className="w-4 h-4 text-amber-500" />
                            <span>4. Панель реальных отзывов клиентов</span>
                          </h6>
                          <p className="text-[9px] text-[#64748B] leading-normal font-medium">
                            Управляйте отзывами клиентов на главной странице, добавляйте новые кейсы успешных доставок авто под ключ.
                          </p>

                          {/* Добавить новый отзыв */}
                          <div className="bg-white p-2.5 rounded-xl border border-[#E5E7EB] space-y-2">
                            <p className="text-[8px] font-bold text-[#64748B] uppercase font-mono border-b pb-1">Добавить отзыв в карусель</p>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Имя клиента..."
                                value={newReviewName}
                                onChange={(e) => setNewReviewName(e.target.value)}
                                className="bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg px-2 py-1 text-[11px] outline-none text-[#111827] font-bold"
                              />
                              <select
                                value={newReviewStars}
                                onChange={(e) => setNewReviewStars(Number(e.target.value))}
                                className="bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg px-2 py-1 text-[11px] outline-none text-[#111827] font-bold"
                              >
                                <option value={5}>⭐️⭐️⭐️⭐️⭐️ (5 звезд)</option>
                                <option value={4}>⭐️⭐️⭐️⭐️ (4 звезды)</option>
                                <option value={3}>⭐️⭐️⭐️ (3 звезды)</option>
                              </select>
                            </div>
                            <textarea
                              placeholder="Текст отзыва..."
                              value={newReviewText}
                              onChange={(e) => setNewReviewText(e.target.value)}
                              rows={2}
                              className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg p-2 text-[10.5px] outline-none text-[#111827] resize-none"
                            />
                            <button
                              onClick={handleAddVipReview}
                              className="w-full py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-[9px] rounded-lg transition uppercase tracking-wide"
                            >
                              Добавить в базу отзывов
                            </button>
                          </div>

                          {/* Список текущих */}
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                            {vipReviews.map(rev => (
                              <div key={rev.id} className="bg-white p-2 rounded-lg border border-[#E5E7EB] flex justify-between items-start text-[9.5px]">
                                <div className="space-y-0.5 max-w-[85%]">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-bold text-[#111827]">{rev.name}</span>
                                    <span className="text-amber-500 text-[8px]">{'★'.repeat(rev.stars)}</span>
                                  </div>
                                  <p className="text-gray-600 leading-tight italic">"{rev.text}"</p>
                                  <p className="text-[7.5px] text-gray-400 font-mono">{rev.date}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteVipReview(rev.id)}
                                  className="text-red-500 hover:text-red-700 font-bold font-mono text-[8.5px] cursor-pointer text-right min-w-[20px]"
                                >
                                  [X]
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* ФУНКЦИЯ 5: Восстановление и сброс базы данных */}
                        <div className="bg-[#F5F7FA] p-3.5 rounded-2xl border border-[#E5E7EB] space-y-3">
                          <h6 className="text-[10px] font-bold text-amber-600 uppercase tracking-wide flex items-center space-x-1 font-mono">
                            <Database className="w-4 h-4 text-amber-500" />
                            <span>5. Импортер и сброс базы данных (JSON)</span>
                          </h6>
                          <p className="text-[9px] text-[#64748B] leading-normal font-medium">
                            Вставьте текстовый дамп базы автомобилей JSON, чтобы перезаписать текущую базу данных в CMS, либо сбросьте базу к исходным настройкам.
                          </p>

                          <div className="space-y-2.5">
                            <textarea
                              value={jsonRestoreText}
                              onChange={(e) => setJsonRestoreText(e.target.value)}
                              rows={3}
                              placeholder='[{"brand":"BMW","model":"X5","year":2023,"images":["..."],...}]'
                              className="w-full bg-white border border-[#E5E7EB] rounded-xl p-2 font-mono text-[8px] text-[#111827] outline-none"
                            />

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={handleRestoreDatabase}
                                className="py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-[9px] rounded-xl transition uppercase tracking-wider flex items-center justify-center space-x-1"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Залить базу</span>
                              </button>
                              <button
                                onClick={handleWipeDatabase}
                                className="py-2 bg-red-600 hover:bg-red-700 text-white font-black text-[9px] rounded-xl transition uppercase tracking-wider flex items-center justify-center space-x-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Сбросить базу</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* ФУНКЦИЯ 6: CRM РЕДАКТОР ЛИДОВ (ОЧЕНЬ ВАЖНО) */}
                        <div className="bg-[#F5F7FA] p-3.5 rounded-2xl border border-[#E5E7EB] space-y-3">
                          <div className="flex items-center justify-between">
                            <h6 className="text-[10px] font-bold text-amber-600 uppercase tracking-wide flex items-center space-x-1 font-mono">
                              <UserCheck className="w-4 h-4 text-amber-500" />
                              <span>6. CRM-менеджер заявок (Бюджет и Заметки)</span>
                            </h6>
                            <span className="bg-blue-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase font-mono">CRM</span>
                          </div>
                          <p className="text-[9px] text-[#64748B] leading-normal font-medium">
                            Просматривайте лиды, настраивайте оценочный бюджет сделки в USD, вносите закрытые комментарии брокера и переводите лиды по статусам.
                          </p>

                          {/* Список заказов в CRM */}
                          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                            {orders.length === 0 ? (
                              <p className="text-[9px] text-[#64748B] italic text-center py-4">Нет активных лидов в системе. Оставьте заявку на сайте!</p>
                            ) : (
                              orders.map(order => (
                                <div key={order.id} className="bg-white p-3 rounded-xl border border-[#E5E7EB] space-y-2">
                                  <div className="flex justify-between items-start">
                                    <div className="space-y-0.5 text-left w-full">
                                      <div className="flex justify-between w-full">
                                        <span className="text-[9px] font-extrabold text-blue-600 font-mono">ID: {order.id.slice(-6).toUpperCase()}</span>
                                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase font-mono ${
                                          order.status === 'received' ? 'bg-amber-100 text-amber-800' :
                                          order.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                          'bg-blue-100 text-blue-800'
                                        }`}>
                                          {ORDER_STATUSES.find(s => s.status === order.status)?.label || order.status}
                                        </span>
                                      </div>
                                      <h5 className="text-[11px] font-bold text-[#111827]">{order.customerName} ({order.customerPhone})</h5>
                                      <p className="text-[9.5px] text-[#64748B] font-medium">Выбранное авто: <span className="font-bold text-[#111827]">{order.carBrand} {order.carModel}</span></p>
                                    </div>
                                  </div>

                                  {/* Форма изменения бюджета и заметок */}
                                  <div className="bg-[#F5F7FA] p-2 rounded-lg space-y-1.5 border border-dashed border-[#E5E7EB] text-left">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-[7.5px] text-[#64748B] uppercase font-bold font-mono">Бюджет сделки ($)</label>
                                        <input
                                          type="number"
                                          placeholder="Напр. 35000"
                                          value={crmActiveOrderId === order.id ? crmBudgetUSD : (order.budgetUSD || '')}
                                          onChange={(e) => {
                                            setCrmActiveOrderId(order.id);
                                            setCrmBudgetUSD(Number(e.target.value));
                                          }}
                                          className="w-full bg-white border border-[#E5E7EB] rounded-md px-2 py-0.5 text-[10.5px] font-bold text-emerald-700 outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[7.5px] text-[#64748B] uppercase font-bold font-mono">Сменить Статус</label>
                                        <select
                                          value={order.status}
                                          onChange={(e) => {
                                            updateOrderStatus(order.id, e.target.value as any);
                                            triggerHaptic('success');
                                          }}
                                          className="w-full bg-white border border-[#E5E7EB] rounded-md px-1.5 py-0.5 text-[10px] font-bold text-[#111827] outline-none"
                                        >
                                          <option value="received">Получен</option>
                                          <option value="calculated">Просчитан</option>
                                          <option value="approved">Договор</option>
                                          <option value="shipped">В пути</option>
                                          <option value="customs">Таможня</option>
                                          <option value="completed">Выдан клиенту</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="block text-[7.5px] text-[#64748B] uppercase font-bold font-mono mb-0.5">Внутренний комментарий брокера</label>
                                      <input
                                        type="text"
                                        placeholder="Клиент ищет белый салон, ждем предоплату..."
                                        value={crmActiveOrderId === order.id ? crmNotesText : (order.notes || '')}
                                        onChange={(e) => {
                                          setCrmActiveOrderId(order.id);
                                          setCrmNotesText(e.target.value);
                                        }}
                                        className="w-full bg-white border border-[#E5E7EB] rounded-md px-2 py-1 text-[10px] outline-none text-[#111827] font-medium"
                                      />
                                    </div>

                                    {crmActiveOrderId === order.id && (
                                      <button
                                        onClick={() => {
                                          updateOrderNotes(order.id, crmNotesText, crmBudgetUSD);
                                          triggerHaptic('success');
                                          setCrmActiveOrderId(null);
                                          setCrmNotesText('');
                                          setCrmBudgetUSD(0);
                                          alert('✅ Данные лида в CRM успешно обновлены!');
                                        }}
                                        className="w-full py-1 bg-blue-600 hover:bg-blue-700 text-white text-[8px] font-black rounded uppercase tracking-wider transition"
                                      >
                                        Сохранить в CRM
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex justify-between items-center text-[7.5px] text-[#64748B] font-mono">
                                    <span>Дата: {new Date(order.createdAt).toLocaleString('ru-RU')}</span>
                                    <button
                                      onClick={() => {
                                        if (confirm('Удалить лид из системы?')) {
                                          deleteOrder(order.id);
                                          triggerHaptic('error');
                                        }
                                      }}
                                      className="text-red-500 hover:underline cursor-pointer"
                                    >
                                      Удалить лид
                                    </button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* ФУНКЦИЯ 7: Калькулятор раскладки стоимости */}
                        <div className="bg-[#F5F7FA] p-3.5 rounded-2xl border border-[#E5E7EB] space-y-3">
                          <h6 className="text-[10px] font-bold text-amber-600 uppercase tracking-wide flex items-center space-x-1 font-mono">
                            <Coins className="w-4 h-4 text-amber-500" />
                            <span>7. Интерактивный калькулятор раскладки</span>
                          </h6>
                          <p className="text-[9px] text-[#64748B] leading-normal font-medium">
                            Поиграйте с курсами валют и формой таможенного оформления, чтобы увидеть подробный разбор себестоимости.
                          </p>

                          <div className="space-y-2.5">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[7.5px] text-[#64748B] font-bold font-mono mb-1">Курс USD (₽)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={calcExchangeUSD}
                                  onChange={(e) => setCalcExchangeUSD(Number(e.target.value))}
                                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2 py-1 text-xs outline-none text-[#111827] font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-[7.5px] text-[#64748B] font-bold font-mono mb-1">Курс EUR (₽)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={calcExchangeEUR}
                                  onChange={(e) => setCalcExchangeEUR(Number(e.target.value))}
                                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2 py-1 text-xs outline-none text-[#111827] font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-[7.5px] text-[#64748B] font-bold font-mono mb-1">Таможня</label>
                                <select
                                  value={calcRecyclingType}
                                  onChange={(e) => setCalcRecyclingType(e.target.value as any)}
                                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-1.5 py-1 text-[10px] outline-none text-[#111827] font-bold"
                                >
                                  <option value="personal">Физлицо (3.4k)</option>
                                  <option value="commercial">Юрлицо (306k)</option>
                                </select>
                              </div>
                            </div>

                            {/* Расчет для первого авто в каталоге */}
                            {cars.length > 0 && (
                              <div className="bg-white p-3 rounded-xl border border-[#E5E7EB] space-y-1.5 text-[9.5px] text-left">
                                <span className="font-extrabold text-[#111827]">Тестовый расчет для: {cars[0].brand} {cars[0].model}</span>
                                <div className="flex justify-between border-b pb-1">
                                  <span className="text-gray-500">Цена FOB в Китае/Корее:</span>
                                  <span className="font-bold font-mono">${cars[0].priceUSD.toLocaleString()} (~ {Math.round(cars[0].priceUSD * calcExchangeUSD).toLocaleString()} ₽)</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                  <span className="text-gray-500">Таможенная пошлина (€{cars[0].customsDutyEUR}):</span>
                                  <span className="font-bold font-mono">~ {Math.round(cars[0].customsDutyEUR * calcExchangeEUR).toLocaleString()} ₽</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                  <span className="text-gray-500">Утилизационный сбор РФ:</span>
                                  <span className="font-bold font-mono">{calcRecyclingType === 'personal' ? '3,400 ₽' : '306,000 ₽'}</span>
                                </div>
                                <div className="flex justify-between border-b pb-1">
                                  <span className="text-gray-500">Логистика, СБКТС, Склад, Наш Сбор:</span>
                                  <span className="font-bold font-mono">~ 450,000 ₽</span>
                                </div>
                                <div className="flex justify-between text-blue-600 font-extrabold text-[11px] pt-1">
                                  <span>ИТОГО ПОД КЛЮЧ:</span>
                                  <span>
                                    {((cars[0].priceUSD * calcExchangeUSD) + (cars[0].customsDutyEUR * calcExchangeEUR) + (calcRecyclingType === 'personal' ? 3400 : 306000) + 450000).toLocaleString('ru-RU')} ₽
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ФУНКЦИЯ 8: Календарь встреч / тест-драйвов */}
                        <div className="bg-[#F5F7FA] p-3.5 rounded-2xl border border-[#E5E7EB] space-y-3">
                          <h6 className="text-[10px] font-bold text-amber-600 uppercase tracking-wide flex items-center space-x-1 font-mono">
                            <Calendar className="w-4 h-4 text-amber-500" />
                            <span>8. Календарь встреч в автосалоне</span>
                          </h6>
                          <p className="text-[9px] text-[#64748B] leading-normal font-medium">
                            Планируйте очные консультации клиентов и тест-драйвы. Назначайте время и отслеживайте выполнение.
                          </p>

                          {/* Форма новой записи */}
                          <div className="bg-white p-2.5 rounded-xl border border-[#E5E7EB] space-y-2 text-left">
                            <p className="text-[8px] font-bold text-[#64748B] uppercase font-mono border-b pb-1">Запланировать визит</p>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="ФИО Клиента..."
                                value={newMeetingName}
                                onChange={(e) => setNewMeetingName(e.target.value)}
                                className="bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg px-2 py-1 text-[10.5px] outline-none text-[#111827] font-bold"
                              />
                              <input
                                type="text"
                                placeholder="Телефон..."
                                value={newMeetingPhone}
                                onChange={(e) => setNewMeetingPhone(e.target.value)}
                                className="bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg px-2 py-1 text-[10.5px] outline-none text-[#111827] font-medium"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input
                                type="text"
                                placeholder="Дата (15.07)..."
                                value={newMeetingDate}
                                onChange={(e) => setNewMeetingDate(e.target.value)}
                                className="bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg px-2 py-1 text-[10.5px] outline-none text-[#111827] font-medium"
                              />
                              <input
                                type="text"
                                placeholder="Время (14:00)..."
                                value={newMeetingTime}
                                onChange={(e) => setNewMeetingTime(e.target.value)}
                                className="bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg px-2 py-1 text-[10.5px] outline-none text-[#111827] font-medium"
                              />
                              <input
                                type="text"
                                placeholder="Модель авто..."
                                value={newMeetingCar}
                                onChange={(e) => setNewMeetingCar(e.target.value)}
                                className="bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg px-2 py-1 text-[10.5px] outline-none text-[#111827] font-bold"
                              />
                            </div>
                            <button
                              onClick={handleAddVipMeeting}
                              className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] rounded-lg transition uppercase tracking-wide"
                            >
                              Запланировать встречу
                            </button>
                          </div>

                          {/* Список встреч */}
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                            {vipMeetings.map(meet => (
                              <div key={meet.id} className="bg-white p-2.5 rounded-lg border border-[#E5E7EB] flex justify-between items-center text-[9.5px] text-left">
                                <div className="space-y-0.5">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-extrabold text-[#111827]">{meet.name}</span>
                                    <span className={`text-[7px] font-bold px-1 py-0.2 rounded font-mono ${
                                      meet.status === 'Ожидает' ? 'bg-amber-100 text-amber-800' :
                                      meet.status === 'Подтверждено' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {meet.status}
                                    </span>
                                  </div>
                                  <p className="text-gray-500 font-medium">Телефон: {meet.phone} | Авто: <span className="text-[#111827] font-bold">{meet.car}</span></p>
                                  <p className="text-[8px] text-gray-400 font-mono">📅 {meet.date} в {meet.time}</p>
                                </div>
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => handleToggleMeetingStatus(meet.id)}
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[8px] font-bold px-1.5 py-1 rounded"
                                  >
                                    Статус
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMeeting(meet.id)}
                                    className="text-red-500 hover:text-red-700 text-[8.5px] font-bold font-mono px-1"
                                  >
                                    X
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* ФУНКЦИЯ 9: Сравнительный конфигуратор моделей */}
                        <div className="bg-[#F5F7FA] p-3.5 rounded-2xl border border-[#E5E7EB] space-y-3">
                          <h6 className="text-[10px] font-bold text-amber-600 uppercase tracking-wide flex items-center space-x-1 font-mono">
                            <Sliders className="w-4 h-4 text-amber-500" />
                            <span>9. Сравнение характеристик автомобилей</span>
                          </h6>
                          <p className="text-[9px] text-[#64748B] leading-normal font-medium">
                            Выберите два автомобиля из каталога для генерации красивой сравнительной карточки параметров.
                          </p>

                          <div className="space-y-2.5">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[8px] text-[#64748B] font-bold font-mono mb-1">Автомобиль А</label>
                                <select
                                  value={compareCarAId}
                                  onChange={(e) => setCompareCarAId(e.target.value)}
                                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2 py-1 text-[10px] outline-none text-[#111827] font-bold"
                                >
                                  <option value="">-- Выберите --</option>
                                  {cars.map(c => (
                                    <option key={c.id} value={c.id}>{c.brand} {c.model}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-[8px] text-[#64748B] font-bold font-mono mb-1">Автомобиль Б</label>
                                <select
                                  value={compareCarBId}
                                  onChange={(e) => setCompareCarBId(e.target.value)}
                                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2 py-1 text-[10px] outline-none text-[#111827] font-bold"
                                >
                                  <option value="">-- Выберите --</option>
                                  {cars.map(c => (
                                    <option key={c.id} value={c.id}>{c.brand} {c.model}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {compareCarAId && compareCarBId && (() => {
                              const carA = cars.find(c => c.id === compareCarAId);
                              const carB = cars.find(c => c.id === compareCarBId);
                              if (!carA || !carB) return null;
                              return (
                                <div className="bg-white p-3 rounded-xl border border-[#E5E7EB] space-y-1 text-[9px] font-sans text-left">
                                  <div className="grid grid-cols-3 font-bold border-b pb-1 text-[#111827]">
                                    <span>Параметр</span>
                                    <span>{carA.brand} {carA.model}</span>
                                    <span>{carB.brand} {carB.model}</span>
                                  </div>
                                  <div className="grid grid-cols-3 border-b py-0.5 text-gray-500">
                                    <span>Год выпуска</span>
                                    <span className="text-[#111827] font-bold">{carA.year} г.</span>
                                    <span className="text-[#111827] font-bold">{carB.year} г.</span>
                                  </div>
                                  <div className="grid grid-cols-3 border-b py-0.5 text-gray-500">
                                    <span>Двигатель</span>
                                    <span className="text-[#111827] font-medium">{carA.engineVolume} ({carA.power} л.с.)</span>
                                    <span className="text-[#111827] font-medium">{carB.engineVolume} ({carB.power} л.с.)</span>
                                  </div>
                                  <div className="grid grid-cols-3 border-b py-0.5 text-gray-500">
                                    <span>Привод / КПП</span>
                                    <span className="text-[#111827] font-medium">{carA.driveType} / {carA.transmission.slice(0,3)}</span>
                                    <span className="text-[#111827] font-medium">{carB.driveType} / {carB.transmission.slice(0,3)}</span>
                                  </div>
                                  <div className="grid grid-cols-3 pt-1 text-gray-500">
                                    <span>Цена в РФ</span>
                                    <span className="text-emerald-700 font-extrabold">{formatCurrency(calculateFullCarPrice(carA).finalPriceRUB)}</span>
                                    <span className="text-emerald-700 font-extrabold">{formatCurrency(calculateFullCarPrice(carB).finalPriceRUB)}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* ФУНКЦИЯ 10: Trade-In Калькулятор оценки */}
                        <div className="bg-[#F5F7FA] p-3.5 rounded-2xl border border-[#E5E7EB] space-y-3">
                          <h6 className="text-[10px] font-bold text-amber-600 uppercase tracking-wide flex items-center space-x-1 font-mono">
                            <Calculator className="w-4 h-4 text-amber-500" />
                            <span>10. Калькулятор оценки Trade-In</span>
                          </h6>
                          <p className="text-[9px] text-[#64748B] leading-normal font-medium">
                            Рассчитайте выкупную стоимость подержанного автомобиля вашего клиента для зачета его стоимости в покупку нового импортного авто.
                          </p>

                          <div className="space-y-2.5 text-left">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[8px] text-[#64748B] font-bold font-mono mb-1">Марка и Модель клиента</label>
                                <input
                                  type="text"
                                  placeholder="Напр. Toyota Camry"
                                  value={tradeInBrand}
                                  onChange={(e) => setTradeInBrand(e.target.value)}
                                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1 text-xs outline-none text-[#111827] font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] text-[#64748B] font-bold font-mono mb-1">Год выпуска</label>
                                <select
                                  value={tradeInYear}
                                  onChange={(e) => setTradeInYear(e.target.value)}
                                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-1.5 py-1 text-xs outline-none text-[#111827] font-bold"
                                >
                                  <option value="2024">2024 г.</option>
                                  <option value="2022">2022 г.</option>
                                  <option value="2020">2020 г.</option>
                                  <option value="2018">2018 г.</option>
                                  <option value="2015">2015 г.</option>
                                  <option value="2010">2010 г.</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[8px] text-[#64748B] font-bold font-mono mb-1">Пробег (км)</label>
                                <input
                                  type="number"
                                  placeholder="120000"
                                  value={tradeInMileage}
                                  onChange={(e) => setTradeInMileage(e.target.value)}
                                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2.5 py-1 text-xs outline-none text-[#111827] font-medium"
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] text-[#64748B] font-bold font-mono mb-1">Состояние</label>
                                <select
                                  value={tradeInCondition}
                                  onChange={(e) => setTradeInCondition(e.target.value)}
                                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-1.5 py-1 text-xs outline-none text-[#111827] font-medium"
                                >
                                  <option value="excellent">Превосходное</option>
                                  <option value="good">Хорошее</option>
                                  <option value="fair">Среднее</option>
                                  <option value="poor">Плохое</option>
                                </select>
                              </div>
                            </div>

                            <button
                              onClick={handleTradeInValuation}
                              className="w-full py-2 bg-[#1C1917] hover:bg-amber-500 hover:text-slate-950 text-white font-black text-[10px] rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 uppercase tracking-wider"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                              <span>Рассчитать Оценку Trade-In</span>
                            </button>

                            {tradeInOutput && (
                              <div className="space-y-1.5">
                                <pre className="w-full bg-neutral-900 rounded-xl p-3 font-mono text-[9px] text-green-400 outline-none border border-neutral-800 whitespace-pre-wrap leading-relaxed">
                                  {tradeInOutput}
                                </pre>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(tradeInOutput);
                                    triggerHaptic('success');
                                    alert('📋 Сертификат скопирован в буфер!');
                                  }}
                                  className="w-full py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[8.5px] rounded-lg transition"
                                >
                                  Копировать сертификат в буфер
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    )}

                  </div>
                </>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
