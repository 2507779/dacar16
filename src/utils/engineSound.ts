/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Синтезатор звука двигателя автомобиля на базе Web Audio API.
 * Работает полностью на стороне клиента, без внешних аудиофайлов.
 */
export function playEngineStartupSound(type: 'v12' | 'v8' | 'inline6' | 'electric' = 'v12') {
  // Проверка пользовательских настроек звука
  const enabled = localStorage.getItem('dacar_settings_engine_sound');
  if (enabled === 'false') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // 1. СТАРТЕР (вращение стартера перед зажиганием)
    const playStarter = () => {
      const duration = 0.75;
      const starterOsc = ctx.createOscillator();
      const starterGain = ctx.createGain();
      starterOsc.type = 'sawtooth';
      starterOsc.frequency.setValueAtTime(130, ctx.currentTime);

      // LFO для симуляции компрессии цилиндров при вращении
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(11, ctx.currentTime); // 11 оборотов в секунду
      lfoGain.gain.setValueAtTime(25, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(starterOsc.frequency);

      const starterFilter = ctx.createBiquadFilter();
      starterFilter.type = 'bandpass';
      starterFilter.frequency.setValueAtTime(350, ctx.currentTime);
      starterFilter.Q.setValueAtTime(2.5, ctx.currentTime);

      starterOsc.connect(starterFilter);
      starterFilter.connect(starterGain);
      starterGain.connect(ctx.destination);

      starterGain.gain.setValueAtTime(0, ctx.currentTime);
      starterGain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
      starterGain.gain.setValueAtTime(0.25, ctx.currentTime + duration - 0.1);
      starterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

      lfo.start(ctx.currentTime);
      starterOsc.start(ctx.currentTime);
      lfo.stop(ctx.currentTime + duration);
      starterOsc.stop(ctx.currentTime + duration);
    };

    // 2. ЗАЖИГАНИЕ И ВСПЫШКА ОБОРОТОВ (Rev-up & Idle)
    const playIgnition = () => {
      const ignitionTime = ctx.currentTime + 0.70; // Начинается сразу после стартера

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator();

      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      const gain3 = ctx.createGain();

      const mainGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Параметры в зависимости от типа двигателя
      let baseFreq = 40; // Гц (базовый тон V12)
      let revFreq = 165; // Пик оборотов при запуске
      let idleFreq = 36;  // Холостой ход
      let filterFreqStart = 85;
      let filterFreqMax = 680;
      let filterFreqIdle = 135;

      if (type === 'v8') {
        baseFreq = 34;
        revFreq = 135;
        idleFreq = 29;
        filterFreqStart = 75;
        filterFreqMax = 520;
        filterFreqIdle = 115;
      } else if (type === 'inline6') {
        baseFreq = 46;
        revFreq = 185;
        idleFreq = 42;
        filterFreqStart = 95;
        filterFreqMax = 780;
        filterFreqIdle = 155;
      } else if (type === 'electric') {
        baseFreq = 55;
        revFreq = 390;
        idleFreq = 48;
        filterFreqStart = 160;
        filterFreqMax = 1100;
        filterFreqIdle = 95;
      }

      osc1.type = type === 'electric' ? 'sine' : 'sawtooth';
      osc2.type = type === 'electric' ? 'triangle' : 'sawtooth';
      osc3.type = type === 'electric' ? 'sine' : 'triangle';

      // Кривая частоты (Старт -> Вспышка -> Падение до холостых)
      osc1.frequency.setValueAtTime(baseFreq, ignitionTime);
      osc1.frequency.exponentialRampToValueAtTime(revFreq, ignitionTime + 0.3);
      osc1.frequency.exponentialRampToValueAtTime(idleFreq, ignitionTime + 1.6);

      osc2.frequency.setValueAtTime(baseFreq * 1.5, ignitionTime);
      osc2.frequency.exponentialRampToValueAtTime(revFreq * 1.48, ignitionTime + 0.3);
      osc2.frequency.exponentialRampToValueAtTime(idleFreq * 1.5, ignitionTime + 1.6);

      const mult = type === 'electric' ? 4 : 2.02;
      osc3.frequency.setValueAtTime(baseFreq * mult, ignitionTime);
      osc3.frequency.exponentialRampToValueAtTime(revFreq * mult, ignitionTime + 0.3);
      osc3.frequency.exponentialRampToValueAtTime(idleFreq * mult, ignitionTime + 1.6);

      osc1.connect(gain1);
      osc2.connect(gain2);
      osc3.connect(gain3);

      gain1.connect(filter);
      gain2.connect(filter);
      gain3.connect(filter);

      filter.connect(mainGain);
      mainGain.connect(ctx.destination);

      if (type === 'electric') {
        gain1.gain.setValueAtTime(0.35, ignitionTime);
        gain2.gain.setValueAtTime(0.20, ignitionTime);
        gain3.gain.setValueAtTime(0.12, ignitionTime);
      } else {
        gain1.gain.setValueAtTime(0.28, ignitionTime);
        gain2.gain.setValueAtTime(0.22, ignitionTime);
        gain3.gain.setValueAtTime(0.12, ignitionTime);
      }

      // Фильтр для имитации глушителя и выхлопной системы
      filter.type = type === 'electric' ? 'peaking' : 'lowpass';
      if (filter.type === 'peaking') {
        filter.Q.setValueAtTime(3.5, ignitionTime);
      } else {
        filter.Q.setValueAtTime(type === 'v8' ? 5.0 : 4.0, ignitionTime);
      }

      filter.frequency.setValueAtTime(filterFreqStart, ignitionTime);
      filter.frequency.exponentialRampToValueAtTime(filterFreqMax, ignitionTime + 0.25);
      filter.frequency.exponentialRampToValueAtTime(filterFreqIdle, ignitionTime + 1.5);

      // Белый шум для имитации потока выхлопных газов и турбулентности
      if (type !== 'electric') {
        const bufferSize = ctx.sampleRate * 2.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          channelData[i] = Math.random() * 2 - 1;
        }

        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(150, ignitionTime);
        noiseFilter.frequency.exponentialRampToValueAtTime(350, ignitionTime + 0.3);
        noiseFilter.frequency.exponentialRampToValueAtTime(75, ignitionTime + 1.6);
        noiseFilter.Q.setValueAtTime(1.2, ignitionTime);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, ignitionTime);
        noiseGain.gain.linearRampToValueAtTime(0.15, ignitionTime + 0.08); // резкий хлопок
        noiseGain.gain.exponentialRampToValueAtTime(0.03, ignitionTime + 0.7); // спад
        noiseGain.gain.setValueAtTime(0.03, ignitionTime + 2.0);
        noiseGain.gain.linearRampToValueAtTime(0, ignitionTime + 2.4);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(mainGain);

        noiseNode.start(ignitionTime);
        noiseNode.stop(ignitionTime + 2.4);
      }

      // Огибающая громкости для всего звука двигателя
      mainGain.gain.setValueAtTime(0, ctx.currentTime);
      mainGain.gain.setValueAtTime(0, ignitionTime);
      mainGain.gain.linearRampToValueAtTime(0.95, ignitionTime + 0.08); // Резкий взрыв
      mainGain.gain.exponentialRampToValueAtTime(0.55, ignitionTime + 0.45); // Падение до стабильных
      mainGain.gain.setValueAtTime(0.55, ignitionTime + 2.0); // Ровный холостой гул
      mainGain.gain.linearRampToValueAtTime(0, ignitionTime + 2.6); // Плавное затухание

      osc1.start(ignitionTime);
      osc2.start(ignitionTime);
      osc3.start(ignitionTime);

      const endTime = ignitionTime + 2.6;
      osc1.stop(endTime);
      osc2.stop(endTime);
      osc3.stop(endTime);

      setTimeout(() => {
        ctx.close();
      }, 4500);
    };

    if (type !== 'electric') {
      playStarter();
    }
    playIgnition();
  } catch (error) {
    console.error('Ошибка воспроизведения звука двигателя:', error);
  }
}

/**
 * Симулятор двигателя реального времени с регулируемыми оборотами.
 * Отлично подходит для симулятора виртуального тест-драйва.
 */
export class EngineSimulator {
  private ctx: AudioContext | null = null;
  private oscs: OscillatorNode[] = [];
  private gains: GainNode[] = [];
  private mainGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private isRunning: boolean = false;
  private baseFreq: number = 36;

  constructor(public type: 'v12' | 'v8' | 'inline6' | 'electric' = 'v12') {
    if (type === 'v8') this.baseFreq = 30;
    else if (type === 'inline6') this.baseFreq = 42;
    else if (type === 'electric') this.baseFreq = 50;
  }

  start() {
    if (this.isRunning) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      this.ctx = new AudioContextClass();
      
      this.mainGain = this.ctx.createGain();
      this.filter = this.ctx.createBiquadFilter();

      // Умеренная стартовая громкость
      this.mainGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      
      this.filter.type = this.type === 'electric' ? 'peaking' : 'lowpass';
      this.filter.Q.setValueAtTime(this.type === 'v8' ? 4.5 : 3.0, this.ctx.currentTime);
      this.filter.frequency.setValueAtTime(140, this.ctx.currentTime);

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const osc3 = this.ctx.createOscillator();

      osc1.type = this.type === 'electric' ? 'sine' : 'sawtooth';
      osc2.type = this.type === 'electric' ? 'triangle' : 'sawtooth';
      osc3.type = this.type === 'electric' ? 'sine' : 'triangle';

      const g1 = this.ctx.createGain();
      const g2 = this.ctx.createGain();
      const g3 = this.ctx.createGain();

      g1.gain.setValueAtTime(0.22, this.ctx.currentTime);
      g2.gain.setValueAtTime(0.18, this.ctx.currentTime);
      g3.gain.setValueAtTime(0.10, this.ctx.currentTime);

      osc1.connect(g1);
      osc2.connect(g2);
      osc3.connect(g3);

      g1.connect(this.filter);
      g2.connect(this.filter);
      g3.connect(this.filter);

      this.filter.connect(this.mainGain);
      this.mainGain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();
      osc3.start();

      this.oscs = [osc1, osc2, osc3];
      this.gains = [g1, g2, g3];
      this.isRunning = true;
      this.setRPM(800); // Начать с холостых 800 RPM
    } catch (e) {
      console.error('Ошибка запуска симулятора двигателя:', e);
    }
  }

  setRPM(rpm: number) {
    if (!this.isRunning || !this.ctx || this.oscs.length < 3) return;
    
    // Переводим RPM (800 - 7500) в частоты
    const factor = rpm / 800;
    const targetFreq = this.baseFreq * factor;

    const time = this.ctx.currentTime + 0.05; // Кроссфейд изменений

    // Частоты для 3 осцилляторов, формирующих сложный гармонический спектр
    this.oscs[0].frequency.exponentialRampToValueAtTime(targetFreq, time);
    this.oscs[1].frequency.exponentialRampToValueAtTime(targetFreq * 1.5, time);
    
    const mult = this.type === 'electric' ? 4.5 : 2.01;
    this.oscs[2].frequency.exponentialRampToValueAtTime(targetFreq * mult, time);

    // Модифицируем фильтр в зависимости от оборотов
    if (this.filter) {
      const filterFreq = this.type === 'electric' 
        ? 140 + (rpm * 0.22)
        : 90 + (rpm * 0.12);
      this.filter.frequency.exponentialRampToValueAtTime(filterFreq, time);
    }
  }

  stop() {
    if (!this.isRunning) return;
    try {
      this.mainGain?.gain.linearRampToValueAtTime(0, this.ctx!.currentTime + 0.15);
      setTimeout(() => {
        this.oscs.forEach(o => { try { o.stop(); } catch(e){} });
        this.ctx?.close();
        this.isRunning = false;
      }, 200);
    } catch(e){}
  }
}

/**
 * Синтезирует премиальный щелчок переключения интерфейса (как у дорогих механических кнопок).
 */
export function playInterfaceClickSound() {
  const enabled = localStorage.getItem('dacar_settings_clicks');
  if (enabled === 'false') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    // Начинаем с высокой частоты 1400 Гц и экспоненциально опускаем до 700 Гц за 30 мс
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.03);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.002); // Быстрый щелчок
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.035);
    
    setTimeout(() => {
      ctx.close();
    }, 100);
  } catch (e) {}
}
