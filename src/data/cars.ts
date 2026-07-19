/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Car, ExchangeRates } from '../types';

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
  const usdRate = EXCHANGE_RATES.USD_to_RUB;
  const eurRate = EXCHANGE_RATES.EUR_to_RUB;

  // Поддержка альтернативных имен свойств утильсбора и пошлины из панели администратора
  const recyclingFeeRUB = car.recyclingFeeRUB || (car as any).recyclingRUB || 5200;
  const customsDutyEUR = car.customsDutyEUR || (car as any).customsEUR || 0;
  const customFinalPriceRUB = car.customFinalPriceRUB || (car as any).customFinalPrice || 0;

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

// Форматирование чисел в денежный формат (например, 7 850 000 ₽)
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

// Безопасное получение списка изображений автомобиля (строго локальные пути по умолчанию)
export function getCarImages(car: any): string[] {
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

  if (rawImages.length === 0) {
    rawImages = [
      '/cars/zeekr_001.jpg',
      '/cars/geely_monjaro.jpg',
      '/cars/li_l9.jpg'
    ];
  }

  // Добавляем кэш-бастер при наличии в localStorage для предотвращения показа старых фото
  const buster = typeof window !== 'undefined' ? localStorage.getItem('dacar_cache_buster') : null;
  if (buster) {
    return rawImages.map(img => {
      if (img.startsWith('/') && !img.includes('?')) {
        return `${img}?cb=${buster}`;
      }
      return img;
    });
  }

  return rawImages;
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
