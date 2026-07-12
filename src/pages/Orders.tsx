/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore, ORDER_STATUSES } from '../store/useStore';
import { formatCurrency } from '../data/cars';
import { triggerHaptic } from '../utils/haptics';
import { Package, Truck, Calendar, MapPin, Play, CheckCircle2, ChevronRight, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Orders() {
  const { orders, advanceOrderProgress, setCurrentTab } = useStore();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const toggleExpandOrder = (id: string) => {
    triggerHaptic('light');
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const handleAdvanceProgress = (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation();
    triggerHaptic('success');
    advanceOrderProgress(orderId);
  };

  return (
    <div className="flex flex-col text-neutral-900 pb-12 select-none">
      
      {/* Шапка заказов */}
      <div className="px-4 pt-4 pb-3 border-b border-neutral-100 flex justify-between items-center bg-white/80 sticky top-0 backdrop-blur-md z-10">
        <div>
          <h2 className="font-display font-extrabold text-lg text-neutral-950">Мои заказы</h2>
          <p className="text-[10px] text-gray-400 mt-0.5">Всего заказов: {orders.length}</p>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {orders.length === 0 ? (
          /* Пустой список заказов */
          <div className="bg-white rounded-3xl p-8 border border-neutral-100 text-center flex flex-col items-center justify-center space-y-4 shadow-sm my-10">
            <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center text-amber-500 shadow-inner">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-neutral-800">Активных заказов нет</h4>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                Вы не оформили ни одного автомобиля. Перейдите в каталог, выберите подходящую модель, рассчитайте стоимость и отправьте заявку.
              </p>
            </div>
            <button
              onClick={() => {
                triggerHaptic('medium');
                setCurrentTab('catalog');
              }}
              className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold cursor-pointer active:scale-95 transition"
            >
              Открыть каталог
            </button>
          </div>
        ) : (
          /* Список заказов */
          orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const currentStatusObj = ORDER_STATUSES.find(s => s.status === order.status);
            
            // Нахождение индекса для прогресс-бара
            const totalStatuses = ORDER_STATUSES.length;
            const currentStatusIndex = ORDER_STATUSES.findIndex(s => s.status === order.status);
            const progressPercent = Math.round(((currentStatusIndex + 1) / totalStatuses) * 100);

            return (
              <div
                key={order.id}
                className={`bg-white border rounded-3xl overflow-hidden transition-all duration-300 shadow-[0_2px_12px_rgba(0,0,0,0.01)] ${
                  isExpanded ? 'border-amber-400 shadow-[0_8px_24px_rgba(0,0,0,0.03)]' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {/* Карточка заказа (Свернутая) */}
                <div
                  onClick={() => toggleExpandOrder(order.id)}
                  className="p-4 flex flex-col cursor-pointer"
                >
                  <div className="flex space-x-3">
                    <img
                      src={order.carImage}
                      alt={`${order.carBrand} ${order.carModel}`}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-2xl object-cover border border-neutral-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] text-gray-400 uppercase font-mono">ID: {order.id.slice(-8).toUpperCase()}</span>
                        <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {currentStatusObj?.label}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-sm text-neutral-900 mt-1 truncate">
                        {order.carBrand} {order.carModel} ({order.carYear})
                      </h3>
                      <p className="text-[11px] text-amber-600 font-extrabold font-display mt-0.5">
                        {formatCurrency(order.finalPriceRUB)}
                      </p>
                    </div>
                  </div>

                  {/* Горизонтальный экспресс прогресс-бар */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center text-[9px] text-gray-400 mb-1.5 font-semibold">
                      <span>Начало логистики</span>
                      <span>Прогресс: {progressPercent}%</span>
                      <span>Владелец</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 transition-all duration-500 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Быстрая информация в футере */}
                  <div className="mt-3.5 pt-3.5 border-t border-neutral-100 flex justify-between items-center text-[10px] text-neutral-500">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{order.customerCity}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>Создан: {new Date(order.createdAt).toLocaleDateString('ru-RU')}</span>
                    </span>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {/* Раскрытая детальная логистика с 11 шагами */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="border-t border-neutral-100 bg-neutral-50/50"
                    >
                      {/* Панель Админ-Симулятора */}
                      <div className="bg-amber-400/10 border-b border-amber-400/20 p-4 m-4 rounded-2xl">
                        <div className="flex items-start space-x-3">
                          <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                              Панель симуляции логистики (Demo)
                            </h4>
                            <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                              В реальной системе статус меняет менеджер через CRM или парсер транспортной компании. Нажмите кнопку ниже, чтобы переместить авто на следующий логистический этап!
                            </p>
                            {order.status !== 'completed' ? (
                              <button
                                onClick={(e) => handleAdvanceProgress(e, order.id)}
                                className="mt-3 px-4 py-2 bg-neutral-950 hover:bg-neutral-800 transition text-white rounded-xl text-[10px] font-bold flex items-center space-x-1.5 cursor-pointer active:scale-95"
                              >
                                <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                <span>Продвинуть на этап: {ORDER_STATUSES[currentStatusIndex + 1]?.label}</span>
                              </button>
                            ) : (
                              <div className="mt-3 text-[10px] font-bold text-emerald-600 flex items-center space-x-1">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Автомобиль успешно доставлен и передан клиенту!</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Вертикальный Таймлайн на 11 шагов */}
                      <div className="px-6 py-4">
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-5">
                          Детализация пути доставки
                        </h4>

                        <div className="relative border-l-2 border-neutral-200 pl-6 space-y-6 ml-2 text-xs">
                          {order.timeline.map((step, index) => {
                            const isStepCompleted = step.completed;
                            const isStepActive = step.active;

                            return (
                              <div key={index} className="relative">
                                {/* Иконка точки на линии */}
                                <span className={`absolute -left-[31px] top-0.5 rounded-full w-4 h-4 flex items-center justify-center border-2 transition-all duration-300 ${
                                  isStepCompleted
                                    ? 'bg-amber-400 border-amber-400 text-neutral-950 text-[8px] font-bold shadow-sm'
                                    : isStepActive
                                      ? 'bg-white border-amber-500 text-amber-500 shadow-[0_0_8px_rgba(245,166,35,0.4)] animate-pulse'
                                      : 'bg-white border-neutral-300 text-neutral-300'
                                }`}>
                                  {isStepCompleted && '✓'}
                                </span>

                                <div className="flex justify-between items-start">
                                  <div className="max-w-[80%]">
                                    <h5 className={`font-bold transition-colors ${
                                      isStepCompleted ? 'text-neutral-900' : isStepActive ? 'text-amber-600 font-extrabold' : 'text-neutral-400'
                                    }`}>
                                      {step.label}
                                    </h5>
                                    {isStepActive && (
                                      <p className="text-[10px] text-neutral-500 mt-1 leading-normal">
                                        {step.desc}
                                      </p>
                                    )}
                                  </div>
                                  
                                  {step.date && (
                                    <span className="text-[9px] font-mono text-gray-400 shrink-0 bg-neutral-100 px-1.5 py-0.5 rounded">
                                      {step.date.split(',')[0]}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
