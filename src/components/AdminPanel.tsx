/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { triggerHaptic } from '../utils/haptics';
import { 
  Settings, Key, ChevronDown, Plus, Trash2, Copy, Check, Car, 
  Bot, Image as ImageIcon, Loader2, RefreshCw, AlertCircle, 
  MessageSquare, Sliders, Play, CheckCircle, Database, HelpCircle, 
  Share2, ArrowRight, Eye, ShieldAlert, BadgeCheck, FileCode, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function AdminPanel() {
  const { 
    cars, 
    addCar, 
    editCar,
    deleteCar,
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
  const [adminTab, setAdminTab] = useState<'add' | 'edit' | 'design' | 'funnel'>('edit');
  const [editingCarId, setEditingCarId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Кастомизация галереи фотографий по авто
  const [activeCarPhotoEditorId, setActiveCarPhotoEditorId] = useState<string | null>(null);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');

  // Настройки Воронки и Ботов
  const [tgBotToken, setTgBotToken] = useState(() => localStorage.getItem('tg_bot_token') || '');
  const [tgChannelId, setTgChannelId] = useState(() => localStorage.getItem('tg_channel_id') || '');
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
    setNewImgUrl(car.images[0] || '');
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
    const finalImg = newImgUrl.trim() || defaultImages[0];
    const finalCarId = `${newBrand.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${newModel.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${newYear}`;

    const updatedImages = editingCarId
      ? (cars.find(c => c.id === editingCarId)?.images || [finalImg])
      : [finalImg];

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
      images: updatedImages,
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
                      Баннер главной
                    </button>
                    <button
                      onClick={() => setAdminTab('funnel')}
                      className={`flex-1 py-1.5 px-2 text-center text-[10px] font-bold rounded-lg transition shrink-0 ${
                        adminTab === 'funnel' ? 'bg-[#2563EB] text-white' : 'text-[#64748B] hover:text-[#111827]'
                      }`}
                    >
                      Воронка & Боты
                    </button>
                  </div>

                  {/* СОДЕРЖИМОЕ ТАБОВ */}
                  <div className="space-y-4 pt-1">
                    
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

                        <div className="grid grid-cols-2 gap-2.5">
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
                            <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Главная картинка URL</label>
                            <input
                              type="text"
                              value={newImgUrl}
                              onChange={(e) => setNewImgUrl(e.target.value)}
                              placeholder="https://..."
                              className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-xs outline-none text-[#111827] font-mono text-[9px]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[8px] text-[#64748B] uppercase font-bold font-mono mb-1">Описание авто</label>
                          <textarea
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            rows={2}
                            placeholder="Оставьте пустым для автогенерации..."
                            className="w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl px-2.5 py-1.5 text-xs outline-none text-[#111827] resize-none"
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
