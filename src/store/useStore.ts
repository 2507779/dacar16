/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { Car, Order, OrderStatus, TrackingStep } from '../types';
import { CARS_DATA, calculateFullCarPrice } from '../data/cars';

// Список всех статусов логистики по порядку
export const ORDER_STATUSES: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'received', label: 'Заявка принята', desc: 'Заявка обработана менеджером, параметры подбора зафиксированы.' },
  { status: 'searching', label: 'Подбор автомобиля', desc: 'Анализируем закрытые стоки дилеров и аукционы в стране-отправителе.' },
  { status: 'selected', label: 'Вариант согласован', desc: 'Автомобиль проверен выездным инспектором, отчет отправлен и одобрен вами.' },
  { status: 'reserved', label: 'Резерв на аукционе', desc: 'Внесен депозит, лот заблокирован за нашей компанией.' },
  { status: 'purchased', label: 'Выкуплен и оплачен', desc: 'Счет-инвойс оплачен. Автомобиль передан в логистическую службу.' },
  { status: 'export_prep', label: 'Экспортное оформление', desc: 'Снятие с учета, оформление экспортных деклараций, подготовка к отправке.' },
  { status: 'shipping', label: 'В процессе транспортировки', desc: 'Автомобиль в пути к границе РФ / загружен на паром во Владивосток.' },
  { status: 'customs', label: 'Таможня РФ', desc: 'Прибытие на СВХ. Подача декларации, списание пошлин, прохождение таможни.' },
  { status: 'lab', label: 'Лаборатория СБКТС & ЭПТС', desc: 'СБКТС получен, оформлен действующий статус ЭПТС в реестре Минпромторга.' },
  { status: 'ready_pickup', label: 'Готов к выдаче', desc: 'Автомобиль прибыл на автовозе в ваш город, прошел детейлинг и ждет вас.' },
  { status: 'completed', label: 'Передан владельцу', desc: 'Сделка завершена, ключи и полный пакет документов переданы клиенту.' }
];

// Генератор шагов таймлайна на основе текущего статуса
export function generateTimeline(currentStatus: OrderStatus, createdAtStr: string): TrackingStep[] {
  const currentIndex = ORDER_STATUSES.findIndex(s => s.status === currentStatus);
  const createdDate = new Date(createdAtStr);

  return ORDER_STATUSES.map((item, index) => {
    const isCompleted = index < currentIndex;
    const isActive = index === currentIndex;
    
    // Эмуляция дат для реализма
    let stepDateStr: string | undefined;
    if (index <= currentIndex) {
      const daysOffset = index * 3;
      const date = new Date(createdDate);
      date.setDate(date.getDate() + daysOffset);
      stepDateStr = date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    return {
      status: item.status,
      label: item.label,
      desc: item.desc,
      completed: isCompleted,
      active: isActive,
      date: stepDateStr
    };
  });
}

interface FilterState {
  country: string | null;
  condition: string | null;
  fuel: string | null;
  priceMax: number | null;
  brand: string | null;
}

interface AppStore {
  currentTab: 'home' | 'catalog' | 'favorites' | 'orders' | 'profile';
  activeCarId: string | null;
  activeStoryCarId: string | null;
  favorites: string[]; // Массив carId
  orders: Order[];
  searchQuery: string;
  filters: FilterState;
  cars: Car[]; // Динамический список автомобилей
  
  // Экшны
  setCurrentTab: (tab: 'home' | 'catalog' | 'favorites' | 'orders' | 'profile') => void;
  setActiveCarId: (id: string | null) => void;
  setActiveStoryCarId: (id: string | null) => void;
  toggleFavorite: (carId: string) => void;
  addOrder: (
    car: Car,
    customerName: string,
    customerPhone: string,
    customerCity: string
  ) => Order;
  setFilters: (filters: Partial<FilterState>) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
  advanceOrderProgress: (orderId: string) => void; // Симулятор движения заказа по таймлайну
  addCar: (car: Car) => void; // Добавление нового автомобиля
  deleteCar: (carId: string) => void; // Удаление автомобиля
}

const initialFilters: FilterState = {
  country: null,
  condition: null,
  fuel: null,
  priceMax: null,
  brand: null,
};

export const useStore = create<AppStore>((set, get) => {
  // Загрузка favorites и orders из localStorage при наличии
  const localFavorites = localStorage.getItem('dacar_favorites');
  const localOrders = localStorage.getItem('dacar_orders');
  const localCustomCars = localStorage.getItem('dacar_custom_cars');

  const customCars: Car[] = localCustomCars ? JSON.parse(localCustomCars) : [];
  const mergedCars = [...CARS_DATA, ...customCars];

  // Демонстрационные заказы по умолчанию, чтобы приложение выглядело "живым" и готовым
  const sampleOrders: Order[] = [
    {
      id: 'order-sample-1',
      carId: 'zeekr-001-you-2024',
      carBrand: 'Zeekr',
      carModel: '001 YOU 100kWh',
      carImage: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=800&q=80',
      carYear: 2024,
      finalPriceRUB: calculateFullCarPrice(mergedCars.find(c => c.id === 'zeekr-001-you-2024') || CARS_DATA[1], 'Москва').finalPriceRUB,
      customerName: 'Константин',
      customerPhone: '+7 (927) 444-11-22',
      customerCity: 'Москва',
      status: 'shipping', // В процессе транспортировки
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 дней назад
      timeline: []
    },
    {
      id: 'order-sample-2',
      carId: 'hyundai-palisade-2022',
      carBrand: 'Hyundai',
      carModel: 'Palisade Calligraphy',
      carImage: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80',
      carYear: 2022,
      finalPriceRUB: calculateFullCarPrice(mergedCars.find(c => c.id === 'hyundai-palisade-2022') || CARS_DATA[2], 'Казань (Главный филиал)').finalPriceRUB,
      customerName: 'Евгений',
      customerPhone: '+7 (917) 222-33-44',
      customerCity: 'Казань (Главный филиал)',
      status: 'lab', // СБКТС / ЭПТС
      createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(), // 24 дня назад
      timeline: []
    }
  ];

  // Сразу сгенерируем таймлайны для демо-заказов
  sampleOrders[0].timeline = generateTimeline(sampleOrders[0].status, sampleOrders[0].createdAt);
  sampleOrders[1].timeline = generateTimeline(sampleOrders[1].status, sampleOrders[1].createdAt);

  const parsedFavorites = localFavorites ? JSON.parse(localFavorites) : [];
  const parsedOrders = localOrders ? JSON.parse(localOrders) : sampleOrders;

  return {
    currentTab: 'home',
    activeCarId: null,
    activeStoryCarId: null,
    favorites: parsedFavorites,
    orders: parsedOrders,
    searchQuery: '',
    filters: initialFilters,
    cars: mergedCars,

    setCurrentTab: (tab) => set({ currentTab: tab }),
    
    setActiveCarId: (id) => set({ activeCarId: id }),

    setActiveStoryCarId: (id) => set({ activeStoryCarId: id }),

    toggleFavorite: (carId) => {
      const currentFavs = get().favorites;
      const isFav = currentFavs.includes(carId);
      const newFavs = isFav
        ? currentFavs.filter(id => id !== carId)
        : [...currentFavs, carId];

      localStorage.setItem('dacar_favorites', JSON.stringify(newFavs));
      set({ favorites: newFavs });
    },

    addOrder: (car, customerName, customerPhone, customerCity) => {
      const { finalPriceRUB } = calculateFullCarPrice(car, customerCity);
      const now = new Date().toISOString();
      
      const newOrder: Order = {
        id: `order-${Date.now()}`,
        carId: car.id,
        carBrand: car.brand,
        carModel: car.model,
        carImage: car.images[0],
        carYear: car.year,
        finalPriceRUB,
        customerName,
        customerPhone,
        customerCity,
        status: 'received',
        createdAt: now,
        timeline: []
      };

      newOrder.timeline = generateTimeline('received', now);

      const updatedOrders = [newOrder, ...get().orders];
      localStorage.setItem('dacar_orders', JSON.stringify(updatedOrders));
      set({ orders: updatedOrders });

      return newOrder;
    },

    setFilters: (newFilters) => set((state) => ({
      filters: { ...state.filters, ...newFilters }
    })),

    setSearchQuery: (query) => set({ searchQuery: query }),

    resetFilters: () => set({ filters: initialFilters, searchQuery: '' }),

    advanceOrderProgress: (orderId) => {
      const updatedOrders = get().orders.map((order) => {
        if (order.id !== orderId) return order;

        const currentStatusIndex = ORDER_STATUSES.findIndex(s => s.status === order.status);
        if (currentStatusIndex === -1 || currentStatusIndex >= ORDER_STATUSES.length - 1) {
          return order; // Уже completed или статус неизвестен
        }

        const nextStatus = ORDER_STATUSES[currentStatusIndex + 1].status;
        return {
          ...order,
          status: nextStatus,
          timeline: generateTimeline(nextStatus, order.createdAt)
        };
      });

      localStorage.setItem('dacar_orders', JSON.stringify(updatedOrders));
      set({ orders: updatedOrders });
    },

    addCar: (newCar) => {
      const currentCustom = localStorage.getItem('dacar_custom_cars');
      const parsedCustom: Car[] = currentCustom ? JSON.parse(currentCustom) : [];
      
      const updatedCustom = [...parsedCustom, newCar];
      localStorage.setItem('dacar_custom_cars', JSON.stringify(updatedCustom));
      
      set({ cars: [...CARS_DATA, ...updatedCustom] });
    },

    deleteCar: (carId) => {
      // 1. Из кастомных в localStorage
      const currentCustom = localStorage.getItem('dacar_custom_cars');
      const parsedCustom: Car[] = currentCustom ? JSON.parse(currentCustom) : [];
      const updatedCustom = parsedCustom.filter(c => c.id !== carId);
      localStorage.setItem('dacar_custom_cars', JSON.stringify(updatedCustom));

      // 2. Из общего списка в стейте (также фильтруем дефолтные, чтобы пользователь мог временно "скрыть" и дефолтные авто на своем устройстве!)
      const updatedCars = get().cars.filter(c => c.id !== carId);
      set({ cars: updatedCars });
    }
  };
});
