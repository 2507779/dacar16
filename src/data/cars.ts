/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Car, ExchangeRates } from '../types';
import CARS_DATA_JSON from '../../cars.json';

// Реальные курсы валют на текущую дату для точных расчетов
export const EXCHANGE_RATES: ExchangeRates = {
  USD_to_RUB: 91.80,
  EUR_to_RUB: 99.20,
};

// Фиксированные тарифы DA!CAR
export const COMPANY_COMMISSION = 120000; // Комиссия компании за подбор и импорт под ключ
export const BROKER_FEE_RUB = 45000;      // СБКТС, ЭПТС, услуги таможенного брокера

// Стоимость базовой доставки до Казани по странам-отправителям
export const BASE_DELIVERY_KAZAN_RUB = {
  'China': 180000,
  'South Korea': 220000,
  'Kyrgyzstan': 140000,
};

// Города доставки и их логистическая корректировка к базовому тарифу Казани
export interface DeliveryCity {
  name: string;
  adjustmentRUB: number;
  daysAdjustment: number;
}

export const DELIVERY_CITIES: DeliveryCity[] = [
  { name: 'Казань (Главный филиал)', adjustmentRUB: 0, daysAdjustment: 0 },
  { name: 'Москва', adjustmentRUB: 15000, daysAdjustment: 2 },
  { name: 'Санкт-Петербург', adjustmentRUB: 25000, daysAdjustment: 3 },
  { name: 'Екатеринбург', adjustmentRUB: 20000, daysAdjustment: 1 },
  { name: 'Новосибирск', adjustmentRUB: 45000, daysAdjustment: -2 }, // Ближе к Китаю
  { name: 'Сочи / Краснодар', adjustmentRUB: 35000, daysAdjustment: 4 },
  { name: 'Владивосток', adjustmentRUB: -70000, daysAdjustment: -7 }, // Порт прибытия из Кореи
  { name: 'Нижний Новгород', adjustmentRUB: 10000, daysAdjustment: 1 },
];

// Полный расчет стоимости автомобиля под ключ в RUB
export function calculateFullCarPrice(
  car: Car,
  deliveryCityName: string = 'Казань (Главный филиал)'
): {
  carBasePriceRUB: number;
  customsDutyRUB: number;
  recyclingFeeRUB: number;
  brokerFeeRUB: number;
  deliveryFeeRUB: number;
  companyCommissionRUB: number;
  finalPriceRUB: number;
} {
  const customFinalPriceRUB = car.customFinalPriceRUB || (car as any).customFinalPrice || 0;

  // Если и цена в USD равна 0 (и при этом нет кастомной цены), или кастомная цена явно равна 0, считаем стоимость "По запросу"
  const isRequestOnly = (car.priceUSD === 0 && customFinalPriceRUB === 0) || 
                        (car.customFinalPriceRUB !== undefined && car.customFinalPriceRUB === 0) ||
                        ((car as any).customFinalPrice !== undefined && (car as any).customFinalPrice === 0);

  if (isRequestOnly) {
    return {
      carBasePriceRUB: 0,
      customsDutyRUB: 0,
      recyclingFeeRUB: 0,
      brokerFeeRUB: 0,
      deliveryFeeRUB: 0,
      companyCommissionRUB: 0,
      finalPriceRUB: 0,
    };
  }

  const usdRate = EXCHANGE_RATES.USD_to_RUB;
  const eurRate = EXCHANGE_RATES.EUR_to_RUB;

  // Поддержка альтернативных имен свойств утильсбора и пошлины из панели администратора
  const recyclingFeeRUB = car.recyclingFeeRUB || (car as any).recyclingRUB || 5200;
  const customsDutyEUR = car.customsDutyEUR || (car as any).customsEUR || 0;

  // 4. Оформление документов
  const brokerFeeRUB = BROKER_FEE_RUB;

  // 5. Стоимость доставки (базовая + корректировка по городу)
  const baseDelivery = BASE_DELIVERY_KAZAN_RUB[car.country] || 160000;
  const cityObj = DELIVERY_CITIES.find(c => c.name === deliveryCityName);
  const deliveryAdjustment = cityObj ? cityObj.adjustmentRUB : 0;
  const deliveryFeeRUB = Math.round(baseDelivery + deliveryAdjustment);

  // 6. Наша комиссия
  const companyCommissionRUB = COMPANY_COMMISSION;

  // Если задана кастомная стоимость "под ключ", рассчитываем составляющие обратным методом
  if (customFinalPriceRUB && customFinalPriceRUB > 0) {
    const finalPriceRUB = customFinalPriceRUB;
    
    // Пошлина: если указана пошлина в EUR, используем её, иначе рассчитываем примерный процент
    const customsDutyRUB = customsDutyEUR && customsDutyEUR > 0
      ? Math.round(customsDutyEUR * eurRate)
      : Math.round((finalPriceRUB - deliveryFeeRUB) * 0.12);

    // Базовая цена автомобиля — остаток
    const carBasePriceRUB = Math.max(0, finalPriceRUB - customsDutyRUB - recyclingFeeRUB - brokerFeeRUB - deliveryFeeRUB - companyCommissionRUB);

    return {
      carBasePriceRUB,
      customsDutyRUB,
      recyclingFeeRUB,
      brokerFeeRUB,
      deliveryFeeRUB,
      companyCommissionRUB,
      finalPriceRUB,
    };
  }

  // 1. Базовая цена авто
  const carBasePriceRUB = Math.round(car.priceUSD * usdRate);

  // 2. Пошлина
  const customsDutyRUB = Math.round(customsDutyEUR * eurRate);

  // Итого
  const finalPriceRUB = carBasePriceRUB + customsDutyRUB + recyclingFeeRUB + brokerFeeRUB + deliveryFeeRUB + companyCommissionRUB;

  return {
    carBasePriceRUB,
    customsDutyRUB,
    recyclingFeeRUB,
    brokerFeeRUB,
    deliveryFeeRUB,
    companyCommissionRUB,
    finalPriceRUB,
  };
}

// Форматирование чисел в денежный формат (например, от 7 850 000 ₽)
export function formatCurrency(value: number, showOt: boolean = false): string {
  if (value === 0) {
    return 'Цена по запросу';
  }
  const formatted = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
  return showOt ? `от ${formatted}` : formatted;
}

// Получение чистых сырых изображений автомобиля из полей без кэш-бастера
export function getRawCarImages(car: any): string[] {
  if (!car) return [];
  
  let rawImages: string[] = [];
  if (Array.isArray(car.images)) {
    rawImages = car.images.filter(img => typeof img === 'string' && img.trim().length > 0);
  } else if (typeof car.images === 'string' && car.images.trim().length > 0) {
    rawImages = car.images.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
  } else {
    const fallback = car.image || car.photo;
    if (fallback && typeof fallback === 'string') {
      rawImages = [fallback];
    }
  }

  // Полностью очищаем любые параметры кэш-бастера (?cb=...) при возвращении raw-картинок
  return rawImages.map(img => img.split('?')[0]);
}

// Черная фирменная заглушка с логотипом DA!CAR
export const BLACK_PLACEHOLDER = '/cars/placeholder.svg';

// Список реально существующих локальных файлов фотографий в /public/cars/
export const VERIFIED_LOCAL_CAR_IMAGES = [
  '/cars/zeekr_001.jpg',
  '/cars/geely_monjaro.jpg',
  '/cars/li_l9.jpg',
  '/cars/toyota_highlander_1.jpg',
  '/cars/toyota_rav4_1.jpg',
  '/cars/vw_tharu_1.jpg'
];

// Автоматический поиск подходящей фотографии по бренду или возврат черной заглушки с логотипом DA!CAR
export function getBrandFallbackImage(brandName: string = '', index: number = 0): string {
  if (index === 0) {
    const b = (brandName || '').toLowerCase();
    if (b.includes('toyota') || b.includes('lexus')) return '/cars/toyota_highlander_1.jpg';
    if (b.includes('vw') || b.includes('volkswagen') || b.includes('jetta')) return '/cars/vw_tharu_1.jpg';
    if (b.includes('geely') || b.includes('changan') || b.includes('haval') || b.includes('chery') || b.includes('gac') || b.includes('byd')) return '/cars/geely_monjaro.jpg';
    if (b.includes('li') || b.includes('lixiang') || b.includes('voyah') || b.includes('aito')) return '/cars/li_l9.jpg';
    if (b.includes('zeekr') || b.includes('lotus') || b.includes('nio') || b.includes('xpeng')) return '/cars/zeekr_001.jpg';
  }
  
  // Для любых других позиций или ненайденных брендов — черная стильная заглушка с логотипом DA!CAR
  return BLACK_PLACEHOLDER;
}

// Безопасное получение списка изображений автомобиля (с подстановкой черной заглушки для отсутствующих файлов)
export function getCarImages(car: any): string[] {
  if (!car) return [BLACK_PLACEHOLDER];
  
  let rawImages = getRawCarImages(car);

  // Если список пуст, используем ротацию проверенного основного фото бренда + черная заглушка с логотипом
  if (rawImages.length === 0) {
    const primaryImg = getBrandFallbackImage(car.brand, 0);
    rawImages = [primaryImg, BLACK_PLACEHOLDER];
  }

  // Получаем кэш-бастер
  let buster = typeof window !== 'undefined' ? localStorage.getItem('dacar_cache_buster') : null;
  if (!buster) {
    buster = Math.floor(Date.now() / (3600 * 1000)).toString();
  }

  return rawImages.map((img, idx) => {
    if (!img) return BLACK_PLACEHOLDER;
    
    // Если это base64, blob или черная заглушка - возвращаем как есть
    if (img.startsWith('data:') || img.startsWith('blob:') || img.includes('placeholder.svg') || img.includes('black-placeholder')) {
      return img;
    }
    
    const cleanImg = img.split('?')[0];

    // Внешние HTTP/HTTPS ссылки
    if (cleanImg.includes('//')) {
      return cleanImg.includes('?') ? `${cleanImg}&cb=${buster}` : `${cleanImg}?cb=${buster}`;
    }

    // Относительный локальный путь вида /cars/...
    const normalized = cleanImg.startsWith('/') ? cleanImg : `/${cleanImg}`;
    
    // Проверяем, существует ли файл в локальной папке
    if (VERIFIED_LOCAL_CAR_IMAGES.includes(normalized)) {
      return `${normalized}?cb=${buster}`;
    }

    // Если локального файла физически нет (например /cars/vw_tharu_2.jpg), заменяем его на черную заглушку с логотипом DA!CAR
    const fallbackPath = getBrandFallbackImage(car.brand, idx);
    return fallbackPath.endsWith('.svg') || fallbackPath.startsWith('data:') 
      ? fallbackPath 
      : `${fallbackPath}?cb=${buster}`;
  });
}

// Универсальный обработчик ошибок загрузки изображений для <img>: моментально переключает на черную заглушку с логотипом DA!CAR
export function handleCarImageError(e: any, _index?: number) {
  const target = e?.currentTarget || e?.target;
  if (target && !target.src?.includes('placeholder.svg')) {
    target.src = BLACK_PLACEHOLDER;
  }
}

// Безопасное получение списка характеристик/опций
export function getCarFeatures(car: any): string[] {
  if (!car) return [];
  if (Array.isArray(car.features)) {
    return car.features.filter(f => typeof f === 'string' && f.trim().length > 0);
  } else if (typeof car.features === 'string' && car.features.trim().length > 0) {
    return car.features.split(/[,;]+/).map(f => f.trim()).filter(Boolean);
  }
  return [];
}
