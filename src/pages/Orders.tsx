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
    <div className="flex flex-col text-white pb-12 select-none">
      
      {/* Шапка заказов */}
      <div className="px-4 pt-4 pb-3 border-b border-white/[0.03] flex justify-between items-center bg-[#070709]/95 sticky top-0 backdrop-blur-md z-10">
        <div>
          <h2 className="font-display font-black text-base text-white tracking-tight">Мои заказы</h2>
          <p className="text-[10px] text-gray-500 mt-0.5 font-mono">Всего заказов: {orders.length}</p>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {orders.length === 0 ? (
          /* Пустой список заказов */
          <div className="bg-[#121215] rounded-3xl p-8 border border-white/[0.03] text-center flex flex-col items-center justify-center space-y-4 shadow-xl my-10">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-amber-400 shadow-inner">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-gray-100">Активных заказов нет</h4>
              <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                Вы еще не оформили ни одного автомобиля. Перейдите в каталог, выберите подходящую модель, рассчитайте стоимость и отправьте заявку.
              </p>
            </div>
            <button
              onClick={() => {
                triggerHaptic('medium');
                setCurrentTab('catalog');
              }}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-black rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-bezier"
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
                className={`bg-[#121215] border rounded-3xl overflow-hidden transition-bezier shadow-xl ${
                  isExpanded ? 'border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.06)]' : 'border-white/[0.03] hover:border-white/[0.08]'
                }`}
              >
                {/* Карточка заказа (Свернутая) */}
                <div
                  onClick={() => toggleExpandOrder(order.id)}
                  className="p-4 flex flex-col cursor-pointer bg-gradient-to-b from-[#121215] to-[#0e0e11]"
                >
                  <div className="flex space-x-3">
                    <img
                      src={order.carImage}
                      alt={`${order.carBrand} ${order.carModel}`}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-2xl object-cover border border-white/[0.03] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] text-gray-500 uppercase font-mono">ID: {order.id.slice(-8).toUpperCase()}</span>
                        <span className="text-[9px] bg-amber-400/10 text-amber-400 font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border border-amber-400/10">
                          {currentStatusObj?.label}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-xs text-gray-100 mt-1.5 truncate">
                        {order.carBrand} {order.carModel} ({order.carYear})
                      </h3>
                      <p className="text-[10px] text-amber-400 font-bold font-display mt-0.5">
                        {formatCurrency(order.finalPriceRUB)}
                      </p>
                    </div>
                  </div>

                  {/* Горизонтальный экспресс прогресс-бар */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center text-[9px] text-gray-400 mb-1.5 font-semibold">
                      <span>Начало логистики</span>
                      <span className="font-mono">Прогресс: {progressPercent}%</span>
                      <span>Владелец</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Быстрая информация в футере */}
                  <div className="mt-3.5 pt-3.5 border-t border-white/[0.03] flex justify-between items-center text-[10px] text-gray-400">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-500" />
                      <span>{order.customerCity}</span>
                    </span>
                    <span className="flex items-center space-x-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      <span>{new Date(order.createdAt).toLocaleDateString('ru-RU')}</span>
                    </span>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
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
                      className="border-t border-white/[0.03] bg-white/[0.01]"
                    >
                      {/* Панель Админ-Симулятора */}
                      <div className="bg-amber-400/5 border border-amber-400/10 p-4 m-4 rounded-2xl">
                        <div className="flex items-start space-x-3">
                          <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-xs font-bold text-gray-100 uppercase tracking-wide">
                              Панель симуляции логистики (Demo)
                            </h4>
                            <p className="text-[10px] text-neutral-400 mt-1 leading-normal">
                              В реальной системе статус меняет менеджер через CRM или парсер транспортной компании. Нажмите кнопку ниже, чтобы переместить авто на следующий логистический этап!
                            </p>
                            {order.status !== 'completed' ? (
                              <button
                                onClick={(e) => handleAdvanceProgress(e, order.id)}
                                className="mt-3.5 px-4 py-2 bg-amber-400 hover:bg-amber-500 transition text-black rounded-xl text-[10px] font-bold flex items-center space-x-1.5 cursor-pointer active:scale-95"
                              >
                                <Play className="w-3.5 h-3.5 text-neutral-950 fill-neutral-950" />
                                <span>Продвинуть на этап: {ORDER_STATUSES[currentStatusIndex + 1]?.label}</span>
                              </button>
                            ) : (
                              <div className="mt-3 text-[10px] font-bold text-emerald-400 flex items-center space-x-1 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1.5 rounded-lg w-max">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Автомобиль успешно доставлен и передан клиенту!</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Вертикальный Таймлайн на 11 шагов */}
                      <div className="px-6 py-4">
                        <h4 className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-5 font-mono">
                          Детализация пути доставки
                        </h4>

                        <div className="relative border-l border-white/[0.08] pl-6 space-y-6 ml-2 text-xs">
                          {order.timeline.map((step, index) => {
                            const isStepCompleted = step.completed;
                            const isStepActive = step.active;

                            return (
                              <div key={index} className="relative">
                                {/* Иконка точки на линии */}
                                <span className={`absolute -left-[30.5px] top-0.5 rounded-full w-4 h-4 flex items-center justify-center border-2 transition-all duration-300 ${
                                  isStepCompleted
                                    ? 'bg-amber-400 border-amber-400 text-neutral-950 text-[8px] font-black shadow-sm'
                                    : isStepActive
                                      ? 'bg-[#121215] border-amber-400 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.3)] animate-pulse'
                                      : 'bg-[#121215] border-white/15 text-neutral-600'
                                }`}>
                                  {isStepCompleted && '✓'}
                                </span>

                                <div className="flex justify-between items-start">
                                  <div className="max-w-[80%]">
                                    <h5 className={`font-bold transition-colors text-xs ${
                                      isStepCompleted ? 'text-gray-100 font-medium' : isStepActive ? 'text-amber-400 font-extrabold' : 'text-neutral-500'
                                    }`}>
                                      {step.label}
                                    </h5>
                                    {isStepActive && (
                                      <p className="text-[10px] text-neutral-400 mt-1 leading-normal font-sans">
                                        {step.desc}
                                      </p>
                                    )}
                                  </div>
                                  
                                  {step.date && (
                                    <span className="text-[9px] font-mono text-gray-500 shrink-0 bg-white/5 px-1.5 py-0.5 rounded">
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
