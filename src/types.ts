/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CountryType = 'China' | 'South Korea' | 'Kyrgyzstan';
export type EngineType = 'gasoline' | 'diesel' | 'hybrid' | 'electric';
export type CarCondition = 'new' | 'used';
export type CarAvailability = 'in_stock' | 'on_order';

export interface Car {
  id: string;
  brand: string;
  model: string;
  generation: string;
  year: number;
  mileage: number;
  condition: CarCondition;
  country: CountryType;
  bodyType: string;
  engineType: EngineType;
  engineVolume: string; // e.g., "1.5L Turbo" or "Dual Motor"
  power: number; // horsepower (л.с.)
  driveType: 'AWD' | 'FWD' | 'RWD';
  transmission: 'Automatic' | 'Manual' | 'Robotic' | 'Single-speed';
  color: string;
  images: string[];
  priceUSD: number; // Base price at origin country in USD
  recyclingFeeRUB: number; // Утильсбор РФ
  customsDutyEUR: number; // Таможенная пошлина в EUR
  description: string;
  features: string[]; // Premium features list
  availability: CarAvailability;
  deliveryDays: number;
}

export type OrderStatus =
  | 'received'       // Заявка получена
  | 'searching'      // Подбор авто
  | 'selected'       // Автомобиль согласован
  | 'reserved'       // Зарезервирован
  | 'purchased'      // Выкуплен
  | 'export_prep'    // Подготовка экспорта
  | 'shipping'       // Транспортировка
  | 'customs'        // Таможня РФ
  | 'lab'            // СБКТС / ЭПТС
  | 'ready_pickup'   // Готов к выдаче (Казань или другой город)
  | 'completed';     // Передан клиенту

export interface TrackingStep {
  status: OrderStatus;
  label: string;
  desc: string;
  date?: string;
  completed: boolean;
  active: boolean;
}

export interface Order {
  id: string;
  carId: string;
  carBrand: string;
  carModel: string;
  carImage: string;
  carYear: number;
  finalPriceRUB: number;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  status: OrderStatus;
  createdAt: string;
  timeline: TrackingStep[];
}

export interface ExchangeRates {
  USD_to_RUB: number;
  EUR_to_RUB: number;
}
