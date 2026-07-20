/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { Car, Order, OrderStatus, TrackingStep, AppTexts, ManagerContact } from '../types';
import { calculateFullCarPrice, getCarImages } from '../data/cars';
import CARS_DATA_JSON from '../../cars.json';
const CARS_DATA = CARS_DATA_JSON as Car[];
import { APP_CONFIG } from '../config';

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
  homepageBannerUrl: string;
  homepageBannerTitle: string;
  homepageBannerSubtitle: string;
  selectedCity: string;
  
  // Editable App Texts & Contacts
  appTexts: AppTexts;
  managerContacts: ManagerContact[];
  
  // Экшны
  setCurrentTab: (tab: 'home' | 'catalog' | 'favorites' | 'orders' | 'profile') => void;
  setActiveCarId: (id: string | null) => void;
  setActiveStoryCarId: (id: string | null) => void;
  setSelectedCity: (city: string) => void;
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
  editCar: (carId: string, updatedCar: Car) => void; // Редактирование автомобиля
  deleteCar: (carId: string) => void; // Удаление автомобиля
  setCars: (cars: Car[]) => void; // Массовое обновление автомобилей
  loadCarsFromServer: () => Promise<void>; // Динамическая загрузка автомобилей с сервера
  fetchCars: () => Promise<void>; // Динамическая загрузка cars.json из public
  updateOrderStatus: (orderId: string, status: OrderStatus) => void; // Обновление статуса CRM
  deleteOrder: (orderId: string) => void; // Удаление заказа/лида
  updateOrderNotes: (orderId: string, notes: string, budgetUSD?: number) => void; // Обновление комментов лида
  setHomepageBannerUrl: (url: string) => void;
  setHomepageBannerTitle: (title: string) => void;
  setHomepageBannerSubtitle: (sub: string) => void;
  
  // Custom setters for texts and contacts
  setAppTexts: (texts: Partial<AppTexts>) => void;
  addManagerContact: (contact: Omit<ManagerContact, 'id'>) => void;
  deleteManagerContact: (id: string) => void;
  updateManagerContact: (id: string, contact: Partial<ManagerContact>) => void;
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
  
  // Загрузка всех автомобилей (сохраняем в единую коллекцию, чтобы можно было редактировать любые!)
  const localAllCars = localStorage.getItem('dacar_all_cars');
  let loadedCars: Car[] = [];
  if (localAllCars) {
    try {
      loadedCars = JSON.parse(localAllCars);
    } catch (e) {
      loadedCars = CARS_DATA;
    }
  } else {
    loadedCars = CARS_DATA;
    localStorage.setItem('dacar_all_cars', JSON.stringify(CARS_DATA));
  }

  // Загрузка кастомизации баннера (по умолчанию — локальный премиум баннер бренда DA!CAR)
  let savedBannerUrl = localStorage.getItem('dacar_banner_url');
  const DEFAULT_BANNER_URL = '/banner-header.jpg';
  
  if (!savedBannerUrl || savedBannerUrl.includes('unsplash.com')) {
    savedBannerUrl = DEFAULT_BANNER_URL;
    localStorage.setItem('dacar_banner_url', DEFAULT_BANNER_URL);
  }
  const savedBannerTitle = localStorage.getItem('dacar_banner_title') || 'Автомобили из Азии';
  const savedBannerSubtitle = localStorage.getItem('dacar_banner_subtitle') || 'под ключ в РФ';

  // Демонстрационные заказы по умолчанию, чтобы приложение выглядело "живым" и готовым
  const sampleOrders: Order[] = [
    {
      id: 'order-sample-1',
      carId: 'zeekr-001-you-2024',
      carBrand: 'Zeekr',
      carModel: '001 YOU 100kWh',
      carImage: '/cars/zeekr_001.jpg',
      carYear: 2024,
      finalPriceRUB: calculateFullCarPrice(loadedCars.find(c => c.id === 'zeekr-001-you-2024') || (CARS_DATA as Car[])[1], 'Москва').finalPriceRUB,
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
      carImage: '/cars/hyundai_palisade_1.jpg',
      carYear: 2022,
      finalPriceRUB: calculateFullCarPrice(loadedCars.find(c => c.id === 'hyundai-palisade-2022') || (CARS_DATA as Car[])[2], 'Казань (Главный филиал)').finalPriceRUB,
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

  // Загрузка кастомизации текстов и контактов
  const savedHomeTitle = localStorage.getItem('dacar_home_title') || APP_CONFIG.DEFAULT_HOME_TITLE;
  const savedHomeSubtitle = localStorage.getItem('dacar_home_subtitle') || APP_CONFIG.DEFAULT_HOME_SUBTITLE;
  const savedShowroomAddress = localStorage.getItem('dacar_showroom_address') || APP_CONFIG.DEFAULT_SHOWROOM_ADDRESS;
  const savedOfficePhone = localStorage.getItem('dacar_office_phone') || APP_CONFIG.DEFAULT_OFFICE_PHONE;
  const savedWebsiteUrl = localStorage.getItem('dacar_website_url') || APP_CONFIG.DEFAULT_WEBSITE_URL;
  const savedLegalInfo = localStorage.getItem('dacar_legal_info') || APP_CONFIG.DEFAULT_LEGAL_INFO;

  const defaultContacts = APP_CONFIG.DEFAULT_MANAGER_CONTACTS;
  const localContacts = localStorage.getItem('dacar_manager_contacts');
  const parsedContacts = localContacts ? JSON.parse(localContacts) : defaultContacts;

  const savedCity = localStorage.getItem('dacar_delivery_city') || 'Казань (Главный филиал)';

  return {
    currentTab: 'home',
    activeCarId: null,
    activeStoryCarId: null,
    favorites: parsedFavorites,
    orders: parsedOrders,
    searchQuery: '',
    filters: initialFilters,
    cars: loadedCars,
    homepageBannerUrl: savedBannerUrl,
    homepageBannerTitle: savedBannerTitle,
    homepageBannerSubtitle: savedBannerSubtitle,
    selectedCity: savedCity,
    appTexts: {
      homeTitle: savedHomeTitle,
      homeSubtitle: savedHomeSubtitle,
      showroomAddress: savedShowroomAddress,
      officePhone: savedOfficePhone,
      websiteUrl: savedWebsiteUrl,
      legalInfo: savedLegalInfo,
    },
    managerContacts: parsedContacts,

    setCurrentTab: (tab) => set({ currentTab: tab }),
    
    setActiveCarId: (id) => set({ activeCarId: id }),

    setActiveStoryCarId: (id) => set({ activeStoryCarId: id }),

    setSelectedCity: (city) => {
      localStorage.setItem('dacar_delivery_city', city);
      set({ selectedCity: city });
    },

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
        carImage: getCarImages(car)[0],
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

      // SECURE TELEGRAM NOTIFICATION DISPATCH (VIA BACKEND)
      try {
        const leadMessage = `🔔 **НОВАЯ ЗАЯВКА НА АВТОМОБИЛЬ DA!CAR**\n\n` +
          `👤 **Имя клиента:** ${customerName}\n` +
          `📞 **Телефон:** ${customerPhone}\n` +
          `🚘 **Выбранный автомобиль:** ${car.brand} ${car.model} (${car.year} г.)\n` +
          `💰 **Стоимость под ключ:** ${finalPriceRUB.toLocaleString('ru-RU')} ₽\n` +
          `📍 **Город доставки:** ${customerCity}\n\n` +
          `⏳ *Менеджер уже получил уведомление и связывается с клиентом!*`;

        const channelId = localStorage.getItem('tg_channel_id') || APP_CONFIG.DEFAULT_TG_CHANNEL_ID;

        fetch('/api/telegram/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: leadMessage,
            chatId: channelId || undefined
          })
        })
        .then(async (res) => {
          if (!res.ok) {
            console.warn('Secure Telegram notification proxy returned error, attempting direct client fallback...');
            const botToken = localStorage.getItem('tg_bot_token') || APP_CONFIG.DEFAULT_TG_BOT_TOKEN;
            if (botToken && channelId) {
              fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: channelId,
                  text: leadMessage,
                  parse_mode: 'Markdown'
                })
              });
            }
          }
        })
        .catch(err => {
          console.error('Secure notification failed, attempting direct client fallback...', err);
          const botToken = localStorage.getItem('tg_bot_token') || APP_CONFIG.DEFAULT_TG_BOT_TOKEN;
          if (botToken && channelId) {
            fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: channelId,
                text: leadMessage,
                parse_mode: 'Markdown'
              })
            });
          }
        });
      } catch (err) {
        console.error('Telegram notification dispatch error:', err);
      }

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
      const updatedCars = [...get().cars, newCar];
      localStorage.setItem('dacar_all_cars', JSON.stringify(updatedCars));
      localStorage.setItem('dacar_cache_buster', Date.now().toString());
      set({ cars: updatedCars });
      fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCars)
      }).catch(err => console.error('Failed to sync added car to server:', err));
    },

    editCar: (carId, updatedCar) => {
      const updatedCars = get().cars.map((car) => {
        if (car.id === carId) {
          return { ...car, ...updatedCar };
        }
        return car;
      });
      localStorage.setItem('dacar_all_cars', JSON.stringify(updatedCars));
      localStorage.setItem('dacar_cache_buster', Date.now().toString());
      set({ cars: updatedCars });
      fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCars)
      }).catch(err => console.error('Failed to sync edited car to server:', err));
    },

    deleteCar: (carId) => {
      const updatedCars = get().cars.filter(c => c.id !== carId);
      localStorage.setItem('dacar_all_cars', JSON.stringify(updatedCars));
      localStorage.setItem('dacar_cache_buster', Date.now().toString());
      set({ cars: updatedCars });
      fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCars)
      }).catch(err => console.error('Failed to sync deleted car to server:', err));
    },

    setCars: (newCars) => {
      localStorage.setItem('dacar_all_cars', JSON.stringify(newCars));
      localStorage.setItem('dacar_cache_buster', Date.now().toString());
      set({ cars: newCars });
      fetch('/api/cars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCars)
      }).catch(err => console.error('Failed to sync updated cars to server:', err));
    },

    loadCarsFromServer: async () => {
      try {
        const res = await fetch('/api/cars');
        if (res.ok) {
          const fetchedCars = await res.json();
          if (Array.isArray(fetchedCars) && fetchedCars.length > 0) {
            localStorage.setItem('dacar_all_cars', JSON.stringify(fetchedCars));
            set({ cars: fetchedCars });
          }
        }
      } catch (err) {
        console.warn('Failed to load cars from server database:', err);
      }
    },

    fetchCars: async () => {
      try {
        const res = await fetch(`/public/cars.json?timestamp=${Date.now()}`);
        if (!res.ok) {
          // Fallback to /cars.json in case public directory content is mapped on root (Vite behavior)
          const fallbackRes = await fetch(`/cars.json?timestamp=${Date.now()}`);
          if (fallbackRes.ok) {
            const fetchedCars = await fallbackRes.json();
            if (Array.isArray(fetchedCars) && fetchedCars.length > 0) {
              localStorage.setItem('dacar_all_cars', JSON.stringify(fetchedCars));
              set({ cars: fetchedCars });
            }
            return;
          }
          throw new Error(`Failed to fetch cars.json: ${res.statusText}`);
        }
        const fetchedCars = await res.json();
        if (Array.isArray(fetchedCars) && fetchedCars.length > 0) {
          localStorage.setItem('dacar_all_cars', JSON.stringify(fetchedCars));
          set({ cars: fetchedCars });
        }
      } catch (err) {
        console.warn('Failed to fetch cars from public/cars.json:', err);
      }
    },

    updateOrderStatus: (orderId, status) => {
      const updatedOrders = get().orders.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status,
            timeline: generateTimeline(status, o.createdAt)
          };
        }
        return o;
      });
      localStorage.setItem('dacar_orders', JSON.stringify(updatedOrders));
      set({ orders: updatedOrders });
    },

    deleteOrder: (orderId) => {
      const updatedOrders = get().orders.filter(o => o.id !== orderId);
      localStorage.setItem('dacar_orders', JSON.stringify(updatedOrders));
      set({ orders: updatedOrders });
    },

    updateOrderNotes: (orderId, notes, budgetUSD) => {
      const updatedOrders = get().orders.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            notes,
            budgetUSD
          };
        }
        return o;
      });
      localStorage.setItem('dacar_orders', JSON.stringify(updatedOrders));
      set({ orders: updatedOrders });
    },

    setHomepageBannerUrl: (url) => {
      localStorage.setItem('dacar_banner_url', url);
      set({ homepageBannerUrl: url });
    },

    setHomepageBannerTitle: (title) => {
      localStorage.setItem('dacar_banner_title', title);
      set({ homepageBannerTitle: title });
    },

    setHomepageBannerSubtitle: (sub) => {
      localStorage.setItem('dacar_banner_subtitle', sub);
      set({ homepageBannerSubtitle: sub });
    },

    setAppTexts: (newTexts) => set((state) => {
      const updated = { ...state.appTexts, ...newTexts };
      if (updated.homeTitle !== undefined) localStorage.setItem('dacar_home_title', updated.homeTitle);
      if (updated.homeSubtitle !== undefined) localStorage.setItem('dacar_home_subtitle', updated.homeSubtitle);
      if (updated.showroomAddress !== undefined) localStorage.setItem('dacar_showroom_address', updated.showroomAddress);
      if (updated.officePhone !== undefined) localStorage.setItem('dacar_office_phone', updated.officePhone);
      if (updated.websiteUrl !== undefined) localStorage.setItem('dacar_website_url', updated.websiteUrl);
      if (updated.legalInfo !== undefined) localStorage.setItem('dacar_legal_info', updated.legalInfo);
      return { appTexts: updated };
    }),

    addManagerContact: (contact) => set((state) => {
      const newContact: ManagerContact = {
        ...contact,
        id: `mc-${Date.now()}`
      };
      const updated = [...state.managerContacts, newContact];
      localStorage.setItem('dacar_manager_contacts', JSON.stringify(updated));
      return { managerContacts: updated };
    }),

    deleteManagerContact: (id) => set((state) => {
      const updated = state.managerContacts.filter(c => c.id !== id);
      localStorage.setItem('dacar_manager_contacts', JSON.stringify(updated));
      return { managerContacts: updated };
    }),

    updateManagerContact: (id, updatedFields) => set((state) => {
      const updated = state.managerContacts.map(c => c.id === id ? { ...c, ...updatedFields } : c);
      localStorage.setItem('dacar_manager_contacts', JSON.stringify(updated));
      return { managerContacts: updated };
    })
  };
});
