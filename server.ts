import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { commitToGithubWithOctokit, pullFromGithubWithOctokit, listGithubPhotosWithOctokit } from './src/utils/github';

// Путь к файлу конфигурации Telegram и GitHub
const CONFIG_PATH = path.join(process.cwd(), 'telegram_config.json');
// Путь к файлу секретов (токены), полностью вынесенному за пределы репозитория для безопасности и корректного экспорта в AI Studio
const SECRETS_PATH = path.join(process.cwd(), '..', 'telegram_secrets.json');
// Путь к файлу базы данных автомобилей
const CARS_FILE_PATH = path.join(process.cwd(), 'cars.json');
const PUBLIC_CARS_FILE_PATH = path.join(process.cwd(), 'public', 'cars.json');

let lastGithubError = '';

interface TelegramConfig {
  telegramBotToken: string;
  githubToken: string;
  githubRepo: string;
  githubBranch: string;
  allowedChatIds: string; // Запятые или пробелы
  webhookRegistered: boolean;
  telegramChannelId?: string;
}

const DEFAULT_CONFIG: TelegramConfig = {
  telegramBotToken: '',
  githubToken: '',
  githubRepo: '2507779/dacar16',
  githubBranch: 'main',
  allowedChatIds: '',
  webhookRegistered: false,
  telegramChannelId: ''
};

function cleanRepoString(repo: string): string {
  if (!repo) return '';
  let cleaned = repo.trim();
  // Remove https://github.com/ or http://github.com/ or github.com/
  cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '');
  // Remove trailing slash or .git
  cleaned = cleaned.replace(/\/$/, '').replace(/\.git$/i, '');
  return cleaned;
}

function readConfig(): TelegramConfig {
  let config = { ...DEFAULT_CONFIG };
  let configLoaded = false;
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
      config = { ...config, ...JSON.parse(content) };
      configLoaded = true;
    }
  } catch (e) {
    console.error('Error reading telegram config:', e);
  }

  // Считываем секреты из telegram_secrets.json, если они есть
  let secretsLoaded = false;
  try {
    if (fs.existsSync(SECRETS_PATH)) {
      const secretsContent = fs.readFileSync(SECRETS_PATH, 'utf-8');
      const secrets = JSON.parse(secretsContent);
      if (secrets.telegramBotToken) config.telegramBotToken = secrets.telegramBotToken;
      if (secrets.githubToken) config.githubToken = secrets.githubToken;
      secretsLoaded = true;
    }
  } catch (e) {
    console.error('Error reading telegram secrets:', e);
  }

  // Авто-миграция: если у нас есть секреты в telegram_config.json, но нет в telegram_secrets.json,
  // то сохраняем их в telegram_secrets.json и зачищаем в telegram_config.json
  if (configLoaded && !secretsLoaded && (config.telegramBotToken || config.githubToken)) {
    try {
      const sensitiveSecrets = {
        telegramBotToken: config.telegramBotToken,
        githubToken: config.githubToken
      };
      fs.writeFileSync(SECRETS_PATH, JSON.stringify(sensitiveSecrets, null, 2), 'utf-8');
      
      const nonSensitiveConfig = {
        githubRepo: config.githubRepo,
        githubBranch: config.githubBranch,
        allowedChatIds: config.allowedChatIds,
        webhookRegistered: config.webhookRegistered,
        telegramBotToken: '',
        githubToken: ''
      };
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(nonSensitiveConfig, null, 2), 'utf-8');
      console.log('[Auto-Migration] Successfully migrated credentials to telegram_secrets.json and cleared telegram_config.json');
    } catch (err) {
      console.error('[Auto-Migration] Failed to migrate credentials:', err);
    }
  }

  // Clean the repo string if it exists
  if (config.githubRepo) {
    config.githubRepo = cleanRepoString(config.githubRepo);
  }

  // Fallback to environment variables if not present in the configuration file
  if (!config.telegramBotToken) {
    config.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN || process.env.BOT_TOKEN || '';
  }
  if (!config.githubToken) {
    config.githubToken = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
  }
  if (!config.githubRepo || config.githubRepo === '2507779/dacar16') {
    config.githubRepo = cleanRepoString(process.env.GITHUB_REPO || process.env.GH_REPO || config.githubRepo || '2507779/dacar16');
  }
  if (!config.githubBranch || config.githubBranch === 'main') {
    config.githubBranch = process.env.GITHUB_BRANCH || process.env.GH_BRANCH || config.githubBranch || 'main';
  }
  if (!config.allowedChatIds) {
    config.allowedChatIds = process.env.ALLOWED_CHAT_IDS || process.env.TELEGRAM_ALLOWED_CHAT_IDS || '';
  }
  
  return config;
}

function writeConfig(config: TelegramConfig) {
  try {
    if (config.githubRepo) {
      config.githubRepo = cleanRepoString(config.githubRepo);
    }

    // Сохраняем нечувствительные поля в telegram_config.json
    const nonSensitiveConfig = {
      githubRepo: config.githubRepo,
      githubBranch: config.githubBranch,
      allowedChatIds: config.allowedChatIds,
      webhookRegistered: config.webhookRegistered,
      telegramChannelId: config.telegramChannelId || '',
      telegramBotToken: '', // заменяем на пустую строку в отслеживаемом файле
      githubToken: ''       // заменяем на пустую строку в отслеживаемом файле
    };

    // Сохраняем чувствительные токены в telegram_secrets.json (который игнорируется гитом)
    const sensitiveSecrets = {
      telegramBotToken: config.telegramBotToken,
      githubToken: config.githubToken
    };

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(nonSensitiveConfig, null, 2), 'utf-8');
    fs.writeFileSync(SECRETS_PATH, JSON.stringify(sensitiveSecrets, null, 2), 'utf-8');

    // Автоматически выгружаем обновленный telegram_config.json в GitHub репозиторий (без токенов и секретов)
    // Запускаем асинхронно, чтобы не задерживать ответ сервера
    setTimeout(() => {
      commitToGithub(CONFIG_PATH, Buffer.from(JSON.stringify(nonSensitiveConfig, null, 2), 'utf-8'), 'Update telegram_config.json settings via Admin Panel')
        .then(success => {
          if (success) {
            console.log('[GitHub Sync] Automatically pushed updated telegram_config.json to GitHub repository!');
          } else {
            console.warn('[GitHub Sync] Could not auto-push telegram_config.json to GitHub:', lastGithubError);
          }
        })
        .catch(err => {
          console.warn('[GitHub Sync] Exception in auto-pushing telegram_config.json:', err.message || err);
        });
    }, 100);
  } catch (e) {
    console.error('Error writing telegram config/secrets:', e);
  }
}

// Вспомогательная функция для выгрузки файлов в GitHub репозиторий с использованием Octokit
async function commitToGithub(filepath: string, contentBuffer: Buffer, commitMessage: string): Promise<boolean> {
  const config = readConfig();
  if (!config.githubToken || !config.githubRepo) {
    console.log('[GitHub Sync] GitHub Token or Repo is not configured, skipping sync.');
    lastGithubError = 'Токен GitHub или репозиторий не указаны в настройках';
    return false;
  }
  const relativePath = path.relative(process.cwd(), filepath).replace(/\\/g, '/');
  const result = await commitToGithubWithOctokit(
    config.githubRepo,
    config.githubBranch || 'main',
    config.githubToken,
    relativePath,
    contentBuffer,
    commitMessage
  );

  if (result.success) {
    lastGithubError = '';
    return true;
  } else {
    lastGithubError = result.error || 'Неизвестная ошибка синхронизации с GitHub';
    return false;
  }
}

// Вспомогательная функция для получения актуального cars.json из GitHub при запуске сервера с использованием Octokit
async function pullCarsFromGithub(): Promise<void> {
  const config = readConfig();
  if (!config.githubToken || !config.githubRepo) {
    console.log('[GitHub Sync] GitHub Token/Repo not configured, skipping startup pull.');
    return;
  }
  const branch = config.githubBranch || 'main';
  console.log(`[GitHub Sync] Fetching cars.json from GitHub using Octokit (branch: ${branch})`);
  const result = await pullFromGithubWithOctokit(
    config.githubRepo,
    branch,
    config.githubToken,
    'cars.json'
  );

  if (result.success && result.content) {
    try {
      JSON.parse(result.content);
      fs.writeFileSync(CARS_FILE_PATH, result.content, 'utf-8');
      fs.writeFileSync(PUBLIC_CARS_FILE_PATH, result.content, 'utf-8');
      console.log('[GitHub Sync] Successfully pulled and updated cars.json from GitHub on startup!');
      lastGithubError = '';
    } catch (jsonErr: any) {
      console.warn('[GitHub Sync] Pulled content is not valid JSON, skipping write.', jsonErr.message || jsonErr);
      lastGithubError = 'Ошибка: данные cars.json в репозитории GitHub повреждены (невалидный JSON)';
    }
  } else {
    console.warn(`[GitHub Sync] Pull cars.json failed: ${result.error}`);
    if (result.error && result.error.includes('404')) {
      console.log('[GitHub Sync] cars.json not found on GitHub. Initializing GitHub repository with local cars.json...');
      if (fs.existsSync(CARS_FILE_PATH)) {
        const fileContent = fs.readFileSync(CARS_FILE_PATH);
        const success = await commitToGithub(CARS_FILE_PATH, fileContent, 'Initialize cars.json from local database');
        if (success) {
          console.log('[GitHub Sync] Successfully initialized cars.json on GitHub!');
          lastGithubError = '';
        } else {
          console.warn('[GitHub Sync] Failed to initialize cars.json on GitHub.');
        }
      } else {
        lastGithubError = 'База cars.json отсутствует локально и не найдена на GitHub (404)';
      }
    } else {
      lastGithubError = result.error || 'Не удалось загрузить cars.json с GitHub.';
    }
  }
}

// Транслитерация кириллических названий в безопасные имена файлов
function transliterate(text: string): string {
  const rus = "абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
  const eng = [
    "a", "b", "v", "g", "d", "e", "yo", "zh", "z", "i", "y", "k", "l", "m", "n", "o", "p", "r", "s", "t", "u", "f", "kh", "ts", "ch", "sh", "shch", "", "y", "", "e", "yu", "ya",
    "A", "B", "V", "G", "D", "E", "Yo", "Zh", "Z", "I", "Y", "K", "L", "M", "N", "O", "P", "R", "S", "T", "u", "F", "Kh", "Ts", "Ch", "Sh", "Shch", "", "Y", "", "E", "Yu", "Ya"
  ];
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const index = rus.indexOf(char);
    if (index !== -1) {
      result += eng[index];
    } else {
      result += char;
    }
  }
  return result
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Чтение списка автомобилей из базы данных (cars.json или default)
function readCars(): any[] {
  try {
    if (fs.existsSync(CARS_FILE_PATH)) {
      const data = fs.readFileSync(CARS_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading cars file:', err);
  }
  return [];
}

// Запись списка автомобилей в базу данных
function writeCars(cars: any[]): boolean {
  try {
    const content = JSON.stringify(cars, null, 2);
    fs.writeFileSync(CARS_FILE_PATH, content, 'utf-8');
    fs.writeFileSync(PUBLIC_CARS_FILE_PATH, content, 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing cars file:', err);
    return false;
  }
}

// Парсинг деталей автомобиля из текста сообщения Telegram
function parseCarFromMessage(text: string): any | null {
  const lines = text.split('\n');
  const result: any = {};
  
  const fieldMapping: { [key: string]: { key: string; type: 'string' | 'number' | 'array' | 'availability' | 'condition' | 'country' | 'engine' | 'drive' } } = {
    'id': { key: 'id', type: 'string' },
    'марка': { key: 'brand', type: 'string' },
    'модель': { key: 'model', type: 'string' },
    'поколение': { key: 'generation', type: 'string' },
    'год': { key: 'year', type: 'number' },
    'пробег': { key: 'mileage', type: 'number' },
    'состояние': { key: 'condition', type: 'condition' },
    'страна': { key: 'country', type: 'country' },
    'кузов': { key: 'bodyType', type: 'string' },
    'двигатель': { key: 'engineType', type: 'engine' },
    'объем': { key: 'engineVolume', type: 'string' },
    'мощность': { key: 'power', type: 'number' },
    'привод': { key: 'driveType', type: 'drive' },
    'кпп': { key: 'transmission', type: 'string' },
    'цвет': { key: 'color', type: 'string' },
    'цена usd': { key: 'priceUSD', type: 'number' },
    'утиль rub': { key: 'recyclingFeeRUB', type: 'number' },
    'пошлина eur': { key: 'customsDutyEUR', type: 'number' },
    'цена rub': { key: 'customFinalPriceRUB', type: 'number' },
    'наличие': { key: 'availability', type: 'availability' },
    'доставка дней': { key: 'deliveryDays', type: 'number' },
    'фото': { key: 'images', type: 'array' },
    'описание': { key: 'description', type: 'string' }
  };

  let hasData = false;
  for (const line of lines) {
    if (!line.includes(':')) continue;
    const separatorIdx = line.indexOf(':');
    const label = line.slice(0, separatorIdx).trim().toLowerCase();
    const val = line.slice(separatorIdx + 1).trim();
    
    const mapping = fieldMapping[label];
    if (mapping) {
      hasData = true;
      if (mapping.type === 'number') {
        result[mapping.key] = parseFloat(val.replace(/[^0-9.-]/g, '')) || 0;
      } else if (mapping.type === 'array') {
        result[mapping.key] = val ? val.split(',').map(s => s.trim()).filter(Boolean) : [];
      } else if (mapping.type === 'condition') {
        const lowerVal = val.toLowerCase();
        result[mapping.key] = lowerVal.includes('use') || lowerVal.includes('б/у') || lowerVal.includes('бу') || lowerVal.includes('пробег') ? 'used' : 'new';
      } else if (mapping.type === 'availability') {
        const lowerVal = val.toLowerCase();
        result[mapping.key] = lowerVal.includes('order') || lowerVal.includes('зак') || lowerVal.includes('под') ? 'on_order' : 'in_stock';
      } else if (mapping.type === 'country') {
        const lowerVal = val.toLowerCase();
        if (lowerVal.includes('korea') || lowerVal.includes('корея')) {
          result[mapping.key] = 'South Korea';
        } else if (lowerVal.includes('kyrgyz') || lowerVal.includes('киргиз') || lowerVal.includes('кыргыз')) {
          result[mapping.key] = 'Kyrgyzstan';
        } else {
          result[mapping.key] = 'China';
        }
      } else if (mapping.type === 'engine') {
        const lowerVal = val.toLowerCase();
        if (lowerVal.includes('electr') || lowerVal.includes('электр')) {
          result[mapping.key] = 'electric';
        } else if (lowerVal.includes('hybrid') || lowerVal.includes('гибрид')) {
          result[mapping.key] = 'hybrid';
        } else if (lowerVal.includes('diesel') || lowerVal.includes('дизел')) {
          result[mapping.key] = 'diesel';
        } else {
          result[mapping.key] = 'gasoline';
        }
      } else if (mapping.type === 'drive') {
        const lowerVal = val.toUpperCase();
        if (lowerVal.includes('FWD') || lowerVal.includes('ПЕРЕД')) {
          result[mapping.key] = 'FWD';
        } else if (lowerVal.includes('RWD') || lowerVal.includes('ЗАДН')) {
          result[mapping.key] = 'RWD';
        } else {
          result[mapping.key] = 'AWD';
        }
      } else {
        result[mapping.key] = val;
      }
    }
  }

  return hasData ? result : null;
}

// Инициализируем локальный cars.json дефолтными данными, если его ещё нет
try {
  if (!fs.existsSync(CARS_FILE_PATH)) {
    fs.writeFileSync(CARS_FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    console.log('[Server] Successfully initialized empty cars.json');
  }
} catch (e) {
  console.error('[Server] Failed to initialize cars.json on startup:', e);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Попытка стянуть актуальную базу автомобилей из GitHub при запуске сервера (асинхронно, не блокируя запуск сервера)
  pullCarsFromGithub().catch(e => console.error('[Server] Failed to pull cars from github on startup:', e));

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API для конфигурации Telegram & GitHub
  app.get('/api/telegram/config', (req, res) => {
    const config = readConfig();
    // Скрываем токены для безопасности при выводе
    res.json({
      ...config,
      telegramBotToken: config.telegramBotToken ? `${config.telegramBotToken.slice(0, 6)}...${config.telegramBotToken.slice(-4)}` : '',
      githubToken: config.githubToken ? `${config.githubToken.slice(0, 4)}...${config.githubToken.slice(-4)}` : '',
      hasRawTokens: !!(config.telegramBotToken && config.githubToken),
      lastGithubError: lastGithubError
    });
  });

  app.post('/api/telegram/config', (req, res) => {
    try {
      const newConfig = req.body;
      const currentConfig = readConfig();

      // Если прислали маскированный токен, сохраняем старый сырой вариант
      const updatedConfig: TelegramConfig = {
        telegramBotToken: newConfig.telegramBotToken?.includes('...') ? currentConfig.telegramBotToken : (newConfig.telegramBotToken || ''),
        githubToken: newConfig.githubToken?.includes('...') ? currentConfig.githubToken : (newConfig.githubToken || ''),
        githubRepo: newConfig.githubRepo || '2507779/dacar16',
        githubBranch: newConfig.githubBranch || 'main',
        allowedChatIds: newConfig.allowedChatIds || '',
        webhookRegistered: currentConfig.webhookRegistered,
        telegramChannelId: newConfig.telegramChannelId || currentConfig.telegramChannelId || ''
      };

      writeConfig(updatedConfig);
      res.json({ success: true, message: 'Настройки сохранены!' });
    } catch (err) {
      console.error('Error saving config:', err);
      res.status(500).json({ error: 'Failed to save config' });
    }
  });

  // Secure proxy endpoint for sending Telegram notifications to the admin/channel
  app.post('/api/telegram/notify', async (req, res) => {
    try {
      const { text, chatId } = req.body;
      const config = readConfig();

      if (!config.telegramBotToken) {
        return res.status(400).json({ error: 'Telegram Bot Token не настроен на сервере!' });
      }

      const targets = new Set<string>();

      // 1. Если клиент явно прислал chatId, используем его
      if (chatId && typeof chatId === 'string' && chatId.trim() !== '' && chatId !== 'null' && chatId !== 'undefined') {
        targets.add(chatId.trim());
      }

      // 2. Канал по умолчанию из конфигурации
      if (config.telegramChannelId && typeof config.telegramChannelId === 'string' && config.telegramChannelId.trim() !== '') {
        targets.add(config.telegramChannelId.trim());
      }

      // 3. Список всех разрешенных ID менеджеров/каналов из allowedChatIds
      if (config.allowedChatIds) {
        const ids = config.allowedChatIds.split(/[\s,]+/).map(id => id.trim()).filter(Boolean);
        for (const rawId of ids) {
          let formattedId = rawId;
          if (!formattedId.startsWith('-')) {
            if (formattedId.startsWith('100')) {
              formattedId = `-${formattedId}`;
            } else if (formattedId.startsWith('200') || formattedId.startsWith('300')) {
              formattedId = `-${formattedId}`;
            }
          }
          targets.add(formattedId);
        }
      }

      const targetList = Array.from(targets);
      if (targetList.length === 0) {
        return res.status(400).json({ error: 'Целевой Chat ID или канал не настроен!' });
      }

      console.log(`[Telegram Notify] Sending message to targets: ${targetList.join(', ')}`);
      
      const results = [];
      let successCount = 0;

      for (const target of targetList) {
        try {
          const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: target,
              text: text,
              parse_mode: 'Markdown'
            })
          });

          const data = await response.json() as any;
          if (response.ok && data.ok) {
            successCount++;
            results.push({ target, success: true });
          } else {
            console.error(`[Telegram Notify Error] Failed for target ${target}:`, data);
            results.push({ target, success: false, error: data.description || 'API error' });
          }
        } catch (err: any) {
          console.error(`[Telegram Notify Exception] Failed for target ${target}:`, err);
          results.push({ target, success: false, error: err.message || 'Connection error' });
        }
      }

      if (successCount === 0) {
        return res.status(400).json({ 
          error: 'Ошибка отправки уведомления во все указанные адреса Telegram API', 
          details: results 
        });
      }

      res.json({ 
        success: true, 
        message: `Уведомление успешно отправлено! Доставлено: ${successCount}/${targetList.length}`, 
        details: results 
      });
    } catch (err: any) {
      console.error('[Telegram Notify Exception]:', err);
      res.status(500).json({ error: err.message || 'Внутренняя ошибка сервера' });
    }
  });

  // API для автоматической настройки Webhook в Telegram
  app.post('/api/telegram/register-webhook', async (req, res) => {
    try {
      const config = readConfig();
      if (!config.telegramBotToken) {
        return res.status(400).json({ error: 'Сначала укажите Telegram Bot Token!' });
      }

      // Определяем URL приложения динамически, если нет в ENV
      const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
      const webhookUrl = `${appUrl}/api/telegram-webhook`;

      console.log(`[Telegram Webhook] Registering: ${webhookUrl}`);

      const tgResponse = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl })
      });

      const tgData = await tgResponse.json() as any;

      if (tgData.ok) {
        config.webhookRegistered = true;
        writeConfig(config);
        res.json({ success: true, message: 'Webhook успешно зарегистрирован!', info: tgData });
      } else {
        res.status(400).json({ error: 'Ошибка Telegram API', details: tgData });
      }
    } catch (err: any) {
      console.error('Error registering webhook:', err);
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    }
  });

  // Точка входа для Webhook Telegram
  app.post('/api/telegram-webhook', async (req, res) => {
    try {
      const update = req.body;
      const config = readConfig();

      if (!config.telegramBotToken) {
        return res.status(200).send('Bot token not set');
      }

      // Нам нужны только сообщения с фотографиями
      const message = update.message || update.edited_message;
      if (!message) {
        return res.status(200).send('No message found');
      }

      const chatId = message.chat.id;
      const text = (message.text || message.caption || '').trim();
      
      // Проверка разрешенных Chat ID (если настроена)
      if (config.allowedChatIds) {
        const allowed = config.allowedChatIds.split(/[\s,]+/).map(id => id.trim());
        if (!allowed.includes(chatId.toString())) {
          // Отправляем вежливый отказ в Telegram
          await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: `⚠️ У вас нет доступа к управлению ботом. Ваш Chat ID: \`${chatId}\`. Укажите его в поле "Доступные Chat ID" в вашей панели администратора на сайте.`
            })
          });
          return res.status(200).send('Unauthorized chat id');
        }
      }

      // --- ОБРАБОТЧИК КОМАНД TELEGRAM ---

      // 1. Команда /start или /help
      if (text.startsWith('/start') || text.startsWith('/help')) {
        await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `🚗 *Панель управления каталогом Dacar16 через Telegram* 🚗\n\n` +
                  `Вы можете полноценно управлять списком автомобилей прямо из этого чата!\n\n` +
                  `📋 *Просмотр каталога:* \n` +
                  `/list или /cars — Показать все авто в каталоге с номерами для быстрого удаления/редактирования.\n\n` +
                  `➕ *Добавление авто:* \n` +
                  `/add — Получить шаблон с инструкцией для заполнения.\n\n` +
                  `📝 *Редактирование:* \n` +
                  `/edit <id_авто> — Получить заполненный шаблон для редактирования.\n` +
                  `Также можно просто кликнуть по быстрой ссылке вида \`/edit_номер\` в списке каталога.\n\n` +
                  `🗑️ *Удаление:* \n` +
                  `/del <id_авто> — Удалить авто по ID.\n` +
                  `Также можно кликнуть по ссылке \`/del_номер\` в списке каталога.\n\n` +
                  `💾 *Синхронизация:* \n` +
                  `/sync или /push — Вручную отправить базу автомобилей \`cars.json\` в GitHub.\n\n` +
                  `📸 *Загрузка фото:* \n` +
                  `Просто пришлите фото автомобиля (сжатым файлом), и я сохраню его. \n\n` +
                  `💡 *Лайфхак:* Вы можете прислать фотографию и добавить заполненный шаблон \`/save_car\` прямо в описание (caption) к фото — тогда авто создастся сразу с этой фотографией!`,
            parse_mode: 'Markdown'
          })
        });
        return res.status(200).send('Help message sent');
      }

      // 2. Команда /list или /cars
      if (text.startsWith('/list') || text.startsWith('/cars')) {
        const cars = readCars();
        if (cars.length === 0) {
          await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: `📭 Каталог автомобилей пуст. Используйте команду /add, чтобы добавить первый автомобиль!`
            })
          });
          return res.status(200).send('Cars list is empty');
        }

        let listText = `📋 *Каталог автомобилей (${cars.length} шт.):*\n\n`;
        cars.forEach((car, index) => {
          const num = index + 1;
          const conditionText = car.condition === 'new' ? '🆕 Новый' : '🚗 Б/У';
          const priceText = car.priceUSD ? `${car.priceUSD.toLocaleString()}$` : 'Не указана';
          const rubPrice = car.customFinalPriceRUB 
            ? `${car.customFinalPriceRUB.toLocaleString()} ₽` 
            : `${Math.round(car.priceUSD * 90).toLocaleString()} ₽ (расчет)`;
          
          listText += `${num}. *${car.brand} ${car.model}* (${car.year})\n`;
          listText += `   • ID: \`${car.id}\` | ${conditionText} | ${car.country}\n`;
          listText += `   • Цена: ${priceText} (~ ${rubPrice})\n`;
          listText += `   • Изменить: /edit_${num} | Удалить: /del_${num}\n\n`;
        });

        if (listText.length > 4000) {
          listText = listText.slice(0, 3900) + '\n\n... список усечен из-за ограничений Telegram. Используйте /edit <id> напрямую.';
        }

        await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: listText,
            parse_mode: 'Markdown'
          })
        });
        return res.status(200).send('Cars list sent');
      }

      // 3. Команда /add (шаблон для нового автомобиля)
      if (text.startsWith('/add')) {
        const template = `✍️ *Шаблон для добавления нового автомобиля:*\n\n` +
          `Скопируйте текст сообщения ниже, заполните поля и отправьте боту. \n` +
          `*Совет:* можно прикрепить фотографию автомобиля к этому сообщению — тогда она автоматически привяжется к новой машине!\n\n` +
          `\`\`\`\n` +
          `/save_car\n` +
          `ID: \n` +
          `Марка: Lixiang\n` +
          `Модель: L9 Ultra\n` +
          `Поколение: I\n` +
          `Год: 2024\n` +
          `Пробег: 0\n` +
          `Состояние: new\n` +
          `Страна: China\n` +
          `Кузов: Внедорожник\n` +
          `Двигатель: hybrid\n` +
          `Объем: 1.5L Turbo\n` +
          `Мощность: 449\n` +
          `Привод: AWD\n` +
          `КПП: Single-speed\n` +
          `Цвет: Зеленый\n` +
          `Цена USD: 58000\n` +
          `Утиль RUB: 306000\n` +
          `Пошлина EUR: 0\n` +
          `Цена RUB: 7200000\n` +
          `Наличие: in_stock\n` +
          `Доставка дней: 25\n` +
          `Фото: /cars/lixiang_l9.jpg\n` +
          `Описание: Роскошный гибридный внедорожник с роскошным салоном и запасом хода до 1300 км.\n` +
          `\`\`\``;

        await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: template,
            parse_mode: 'Markdown'
          })
        });
        return res.status(200).send('Add template sent');
      }

      // 4. Команда /edit (получить заполненный шаблон для редактирования)
      if (text.startsWith('/edit')) {
        const cars = readCars();
        let targetCar: any = null;

        if (text.startsWith('/edit_')) {
          const indexPart = text.split('_')[1];
          const index = parseInt(indexPart, 10);
          if (!isNaN(index) && index > 0 && index <= cars.length) {
            targetCar = cars[index - 1];
          }
        } else {
          const idPart = text.replace('/edit', '').trim();
          if (idPart) {
            targetCar = cars.find(c => c.id === idPart);
          }
        }

        if (!targetCar) {
          await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: `❌ Автомобиль не найден! Введите правильный ID (например: \`/edit zeekr-001\`) или кликните по ссылке из списка /list.`
            })
          });
          return res.status(200).send('Car to edit not found');
        }

        const template = `✍️ *Редактирование автомобиля ${targetCar.brand} ${targetCar.model} (${targetCar.year})*:\n\n` +
          `Скопируйте блок ниже, отредактируйте нужные значения и отправьте обратно боту:\n\n` +
          `\`\`\`\n` +
          `/save_car\n` +
          `ID: ${targetCar.id}\n` +
          `Марка: ${targetCar.brand}\n` +
          `Модель: ${targetCar.model}\n` +
          `Поколение: ${targetCar.generation || ''}\n` +
          `Год: ${targetCar.year || 2024}\n` +
          `Пробег: ${targetCar.mileage || 0}\n` +
          `Состояние: ${targetCar.condition || 'new'}\n` +
          `Страна: ${targetCar.country || 'China'}\n` +
          `Кузов: ${targetCar.bodyType || 'Внедорожник'}\n` +
          `Двигатель: ${targetCar.engineType || 'hybrid'}\n` +
          `Объем: ${targetCar.engineVolume || ''}\n` +
          `Мощность: ${targetCar.power || 0}\n` +
          `Привод: ${targetCar.driveType || 'AWD'}\n` +
          `КПП: ${targetCar.transmission || 'Automatic'}\n` +
          `Цвет: ${targetCar.color || ''}\n` +
          `Цена USD: ${targetCar.priceUSD || 0}\n` +
          `Утиль RUB: ${targetCar.recyclingFeeRUB || 0}\n` +
          `Пошлина EUR: ${targetCar.customsDutyEUR || 0}\n` +
          `Цена RUB: ${targetCar.customFinalPriceRUB || ''}\n` +
          `Наличие: ${targetCar.availability || 'in_stock'}\n` +
          `Доставка дней: ${targetCar.deliveryDays || 25}\n` +
          `Фото: ${(targetCar.images || []).join(', ')}\n` +
          `Описание: ${targetCar.description || ''}\n` +
          `\`\`\``;

        await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: template,
            parse_mode: 'Markdown'
          })
        });
        return res.status(200).send('Edit template sent');
      }

      // 5. Команда /del (удаление автомобиля)
      if (text.startsWith('/del')) {
        const cars = readCars();
        let targetIndex = -1;

        if (text.startsWith('/del_')) {
          const indexPart = text.split('_')[1];
          const index = parseInt(indexPart, 10);
          if (!isNaN(index) && index > 0 && index <= cars.length) {
            targetIndex = index - 1;
          }
        } else {
          const idPart = text.replace('/del', '').trim();
          if (idPart) {
            targetIndex = cars.findIndex(c => c.id === idPart);
          }
        }

        if (targetIndex === -1) {
          await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: `❌ Не удалось найти автомобиль для удаления! Проверьте ID или кликните ссылку из списка /list.`
            })
          });
          return res.status(200).send('Car to delete not found');
        }

        const deletedCar = cars[targetIndex];
        cars.splice(targetIndex, 1);
        writeCars(cars);
        
        // Синхронизируем с GitHub
        const contentString = JSON.stringify(cars, null, 2);
        const gitSuccess = await commitToGithub(
          CARS_FILE_PATH,
          Buffer.from(contentString, 'utf-8'),
          `🤖 Удален автомобиль ${deletedCar.brand} ${deletedCar.model} (${deletedCar.id}) через Telegram`
        );

        let replyText = `🗑️ *Автомобиль ${deletedCar.brand} ${deletedCar.model} успешно удален из базы!* \n\n`;
        if (gitSuccess) {
          replyText += `🐙 Изменения отправлены в GitHub репозиторий.`;
        } else {
          replyText += `⚠️ Сохранено локально на сервере, но не удалось синхронизировать с GitHub. Проверьте права доступа токена.`;
        }

        await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyText,
            parse_mode: 'Markdown'
          })
        });
        return res.status(200).send('Car deleted');
      }

      // 6. Команда /sync или /push (принудительный экспорт базы в GitHub)
      if (text.startsWith('/sync') || text.startsWith('/push')) {
        const cars = readCars();
        const contentString = JSON.stringify(cars, null, 2);
        
        await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendChatAction`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, action: 'typing' })
        });

        const gitSuccess = await commitToGithub(
          CARS_FILE_PATH,
          Buffer.from(contentString, 'utf-8'),
          `🤖 Ручная принудительная синхронизация каталога автомобилей с Telegram`
        );

        let replyText = '';
        if (gitSuccess) {
          replyText = `🐙 *Синхронизация с GitHub успешно завершена!* Все изменения каталога теперь зафиксированы в вашем репозитории.`;
        } else {
          replyText = `❌ Ошибка синхронизации с GitHub! Проверьте, настроен ли GitHub Token и репозиторий в панели администратора на сайте.`;
        }

        await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyText,
            parse_mode: 'Markdown'
          })
        });
        return res.status(200).send('Manual sync triggered');
      }

      // 7. Обработчик создания/сохранения автомобиля /save_car
      if (text.startsWith('/save_car')) {
        const parsedCar = parseCarFromMessage(text);
        if (!parsedCar) {
          await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: `❌ *Ошибка разбора шаблона!* \n\nПожалуйста, убедитесь, что вы скопировали шаблон правильно и заполнили поля в формате \`Поле: Значение\`. `
            })
          });
          return res.status(200).send('Failed to parse car message');
        }

        if (!parsedCar.brand || !parsedCar.model) {
          await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: `❌ *Пропущены обязательные поля!* \n\nВы должны указать \`Марка:\` и \`Модель:\` для создания или обновления автомобиля.`
            })
          });
          return res.status(200).send('Missing brand or model');
        }

        // Если к сообщению с шаблоном прикрепили фото, скачиваем его
        const photos = message.photo;
        let downloadedPhotoPath = '';
        if (photos && photos.length > 0) {
          try {
            await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendChatAction`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: chatId, action: 'upload_photo' })
            });

            const photo = photos[photos.length - 1];
            const fileId = photo.file_id;
            const fileRes = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/getFile?file_id=${fileId}`);
            const fileData = await fileRes.json() as any;

            if (fileData.ok) {
              const telegramFilePath = fileData.result.file_path;
              const fileUrl = `https://api.telegram.org/file/bot${config.telegramBotToken}/${telegramFilePath}`;
              const downloadRes = await fetch(fileUrl);
              
              if (downloadRes.ok) {
                const arrayBuffer = await downloadRes.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const safeName = transliterate(`${parsedCar.brand}_${parsedCar.model}_${Date.now()}`);
                const filename = `${safeName}.jpg`;

                const publicCarsDir = path.join(process.cwd(), 'public', 'cars');
                if (!fs.existsSync(publicCarsDir)) {
                  fs.mkdirSync(publicCarsDir, { recursive: true });
                }
                const localFilePath = path.join(publicCarsDir, filename);
                fs.writeFileSync(localFilePath, buffer);
                
                // Коммитим фото в GitHub
                await commitToGithub(
                  localFilePath,
                  buffer,
                  `🤖 Авто-загрузка фото для ${parsedCar.brand} ${parsedCar.model} через Telegram`
                );

                downloadedPhotoPath = `/cars/${filename}`;
              }
            }
          } catch (picErr) {
            console.error('Failed to auto-download photo during save_car:', picErr);
          }
        }

        const cars = readCars();
        let isUpdate = false;
        let finalId = (parsedCar.id || '').trim();

        if (finalId) {
          const existingIndex = cars.findIndex(c => c.id === finalId);
          if (existingIndex !== -1) {
            isUpdate = true;
            const origImages = cars[existingIndex].images || [];
            const newImages = downloadedPhotoPath 
              ? [downloadedPhotoPath] 
              : (parsedCar.images && parsedCar.images.length > 0 ? parsedCar.images : origImages);

            cars[existingIndex] = {
              ...cars[existingIndex],
              ...parsedCar,
              images: newImages,
              id: finalId
            };
            parsedCar.images = newImages;
          }
        }

        if (!isUpdate) {
          if (!finalId) {
            finalId = transliterate(`${parsedCar.brand}_${parsedCar.model}_${parsedCar.year || Date.now()}`);
            let uniqueId = finalId;
            let counter = 1;
            while (cars.some(c => c.id === uniqueId)) {
              uniqueId = `${finalId}_${counter}`;
              counter++;
            }
            finalId = uniqueId;
          }

          const newImages = downloadedPhotoPath 
            ? [downloadedPhotoPath] 
            : (parsedCar.images && parsedCar.images.length > 0 ? parsedCar.images : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80']);

          const fullNewCar = {
            id: finalId,
            brand: parsedCar.brand,
            model: parsedCar.model,
            generation: parsedCar.generation || 'I',
            year: parsedCar.year || new Date().getFullYear(),
            mileage: parsedCar.mileage || 0,
            condition: parsedCar.condition || 'new',
            country: parsedCar.country || 'China',
            bodyType: parsedCar.bodyType || 'Внедорожник',
            engineType: parsedCar.engineType || 'hybrid',
            engineVolume: parsedCar.engineVolume || '2.0L',
            power: parsedCar.power || 150,
            driveType: parsedCar.driveType || 'AWD',
            transmission: parsedCar.transmission || 'Automatic',
            color: parsedCar.color || 'Черный',
            images: newImages,
            priceUSD: parsedCar.priceUSD || 0,
            recyclingFeeRUB: parsedCar.recyclingFeeRUB || 0,
            customsDutyEUR: parsedCar.customsDutyEUR || 0,
            customFinalPriceRUB: parsedCar.customFinalPriceRUB || undefined,
            description: parsedCar.description || '',
            features: parsedCar.features || ['Premium sound', 'Panoramic roof', 'LED headlights'],
            availability: parsedCar.availability || 'in_stock',
            deliveryDays: parsedCar.deliveryDays || 25
          };

          cars.push(fullNewCar);
          parsedCar.id = finalId;
          parsedCar.images = newImages;
        }

        writeCars(cars);

        const contentString = JSON.stringify(cars, null, 2);
        const gitSuccess = await commitToGithub(
          CARS_FILE_PATH,
          Buffer.from(contentString, 'utf-8'),
          `🤖 ${isUpdate ? 'Обновлен' : 'Добавлен'} автомобиль ${parsedCar.brand} ${parsedCar.model} (${finalId}) через Telegram`
        );

        let responseText = `✅ *Автомобиль успешно ${isUpdate ? 'обновлен' : 'добавлен'}!* \n\n`;
        responseText += `🚘 *${parsedCar.brand} ${parsedCar.model}* (${parsedCar.year || 'н.д.'})\n`;
        responseText += `🆔 ID: \`${finalId}\`\n`;
        responseText += `💰 Цена: ${parsedCar.priceUSD?.toLocaleString() || 0} $\n`;
        if (parsedCar.customFinalPriceRUB) {
          responseText += `🔥 Цена под ключ: ${parsedCar.customFinalPriceRUB.toLocaleString()} ₽\n`;
        }
        responseText += `📍 Локация/страна: ${parsedCar.country || 'China'}\n`;
        responseText += `🖼️ Фото: \`${parsedCar.images?.[0] || 'нет'}\n\n`;

        if (gitSuccess) {
          responseText += `🐙 *Синхронизировано с GitHub!* Каталог обновлен и выгружен в ваш репозиторий.\n\n`;
        } else {
          responseText += `⚠️ Сохранено на сервере, но не удалось синхронизировать с GitHub. Проверьте права токена в админ-панели на сайте.\n\n`;
        }

        responseText += `Просмотреть список: /list`;

        await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: responseText,
            parse_mode: 'Markdown'
          })
        });

        return res.status(200).send('Car saved successfully');
      }

      // --- КОНЕЦ ОБРАБОТЧИКА КОМАНД ---

      const photos = message.photo;
      if (!photos || photos.length === 0) {
        // Если прислали просто текст
        await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `📸 Пожалуйста, отправьте мне *изображение (фотографию)*, или используйте одну из команд (например, /help).`
          })
        });
        return res.status(200).send('Not a photo');
      }

      // Отправляем статус "загрузки" пользователю
      await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendChatAction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, action: 'upload_photo' })
      });

      // Берем фото максимального разрешения (последнее в массиве)
      const photo = photos[photos.length - 1];
      const fileId = photo.file_id;

      // Получаем file_path от Telegram
      const fileRes = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/getFile?file_id=${fileId}`);
      const fileData = await fileRes.json() as any;

      if (!fileData.ok) {
        throw new Error('Не удалось получить файл из Telegram');
      }

      const telegramFilePath = fileData.result.file_path;
      const fileUrl = `https://api.telegram.org/file/bot${config.telegramBotToken}/${telegramFilePath}`;

      // Скачиваем файл в бинарный буфер
      const downloadRes = await fetch(fileUrl);
      if (!downloadRes.ok) {
        throw new Error('Ошибка скачивания файла с серверов Telegram');
      }
      const arrayBuffer = await downloadRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Генерируем красивое имя файла на основе подписи (caption)
      let customName = message.caption ? transliterate(message.caption) : '';
      if (!customName) {
        customName = `tg_car_${Date.now()}`;
      }
      const filename = `${customName}.jpg`;

      // 1. Сохраняем локально в public/cars/
      const publicCarsDir = path.join(process.cwd(), 'public', 'cars');
      if (!fs.existsSync(publicCarsDir)) {
        fs.mkdirSync(publicCarsDir, { recursive: true });
      }
      const localFilePath = path.join(publicCarsDir, filename);
      fs.writeFileSync(localFilePath, buffer);
      console.log(`[Telegram Bot] Saved photo locally to ${localFilePath}`);

      // 2. Отправляем в GitHub, если токен настроен
      let githubSuccess = false;
      let githubUrl = '';
      if (config.githubToken && config.githubRepo) {
        githubSuccess = await commitToGithub(
          localFilePath,
          buffer,
          `🤖 Загружено фото ${filename} через Telegram-бота от ChatID: ${chatId}`
        );
        if (githubSuccess) {
          githubUrl = `https://github.com/${config.githubRepo}/blob/${config.githubBranch || 'main'}/public/cars/${filename}`;
        }
      }

      // Отвечаем пользователю в Telegram
      let responseText = `🎉 *Фотография получена и обработана!*\n\n`;
      responseText += `📁 Имя файла: \`${filename}\`\n`;
      responseText += `📍 Локальный путь: \`/cars/${filename}\`\n\n`;

      if (githubSuccess) {
        responseText += `🐙 *Успешно выгружено в GitHub!*\n[Посмотреть в репозитории](${githubUrl})\n\n`;
      } else if (config.githubToken) {
        responseText += `⚠️ Фото сохранено локально, но произошла ошибка при загрузке в GitHub. Проверьте права токена в админ-панели.\n\n`;
      } else {
        responseText += `💡 *Примечание:* Для автоматической синхронизации с GitHub, укажите GitHub Token в вашей админ-панели.\n\n`;
      }

      responseText += `✨ Фотография уже доступна в выпадающем списке быстрого выбора в вашей админ-панели!`;

      await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: responseText,
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        })
      });

      res.status(200).send('OK');
    } catch (err: any) {
      console.error('[Telegram Bot Error]:', err);
      res.status(200).send('Error but handled');
    }
  });

  // API для динамического сканирования фотографий в папке public/cars (локально + из GitHub)
  app.get('/api/presets', async (req, res) => {
    try {
      const publicCarsDir = path.join(process.cwd(), 'public', 'cars');
      if (!fs.existsSync(publicCarsDir)) {
        fs.mkdirSync(publicCarsDir, { recursive: true });
      }

      // 1. Читаем локальные файлы
      const localFiles = fs.readdirSync(publicCarsDir);
      const presetMap = new Map<string, { path: string; name: string }>();

      const addPreset = (file: string) => {
        const ext = path.extname(file).toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.bmp'].includes(ext)) {
          return;
        }
        const baseName = path.basename(file, path.extname(file));
        
        const COMMON_BRANDS = [
          'toyota', 'lexus', 'zeekr', 'geely', 'changan', 'lixiang', 'bmw', 
          'mercedes', 'audi', 'porsche', 'hyundai', 'kia', 'byd', 'voyah', 
          'aito', 'honda', 'nissan', 'mazda', 'subaru', 'mitsubishi', 'tesla',
          'volkswagen', 'volvo', 'landrover', 'jaguar', 'chevrolet', 'ford'
        ];

        let fileLower = baseName.toLowerCase();
        let brandPrefix = '';
        for (const brand of COMMON_BRANDS) {
          if (fileLower.startsWith(brand)) {
            brandPrefix = brand;
            break;
          }
        }

        let rest = baseName;
        if (brandPrefix) {
          rest = baseName.substring(brandPrefix.length);
          // Убираем ведущие разделители, если они есть
          rest = rest.replace(/^[-_\s]+/, '');
        }

        const formattedBrand = brandPrefix 
          ? (brandPrefix === 'bmw' ? 'BMW' : brandPrefix === 'byd' ? 'BYD' : brandPrefix.charAt(0).toUpperCase() + brandPrefix.slice(1)) 
          : '';

        // Форматируем оставшуюся часть названия
        let cleanRest = rest
          .replace(/([A-Z])/g, ' $1')    // Пробел перед заглавными буквами
          .replace(/([0-9]+)/g, ' $1')   // Пробел перед цифрами
          .trim()
          .split(/[_-]+/)
          .map(word => {
            if (word.toLowerCase() === 'rav4') return 'RAV4';
            return word.charAt(0).toUpperCase() + word.slice(1);
          })
          .join(' ')
          .replace(/\s+/g, ' ');         // Убираем множественные пробелы

        let cleanName = formattedBrand ? `${formattedBrand} ${cleanRest}`.trim() : cleanRest;

        presetMap.set(file.toLowerCase(), {
          path: `/cars/${file}`,
          name: cleanName
        });
      };

      // Сначала добавляем локальные пресеты
      localFiles.forEach(addPreset);

      // 2. Если GitHub настроен, запрашиваем список файлов из GitHub API
      const config = readConfig();
      if (config.githubToken && config.githubRepo) {
        try {
          const branch = config.githubBranch || 'main';
          const gitUrl = `https://api.github.com/repos/${config.githubRepo}/contents/public/cars?ref=${branch}`;
          console.log(`[Presets Sync] Fetching dynamic presets list from GitHub: ${gitUrl}`);
          
          const githubRes = await fetch(gitUrl, {
            headers: {
              'Authorization': `token ${config.githubToken}`,
              'User-Agent': 'Dacar16-Integration'
            }
          });

          if (githubRes.ok) {
            const items = await githubRes.json();
            if (Array.isArray(items)) {
              items.forEach(item => {
                if (item.type === 'file' && item.name) {
                  // Добавляем пресет из гитхаба (если локально его еще нет, он запишется)
                  addPreset(item.name);
                }
              });
              console.log(`[Presets Sync] Successfully merged and loaded presets from GitHub! Total combined: ${presetMap.size}`);
            }
          } else {
            console.warn(`[Presets Sync] GitHub returned status ${githubRes.status} for presets fetch.`);
          }
        } catch (gitErr) {
          console.error('[Presets Sync] Failed to fetch presets from GitHub:', gitErr);
        }
      }

      // Превращаем Map в отсортированный массив пресетов
      const presets = Array.from(presetMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      res.json(presets);
    } catch (err) {
      console.error('Error scanning cars folder:', err);
      res.status(500).json({ error: 'Failed to read preset images' });
    }
  });

  // Получить текущий список автомобилей
  app.get('/api/cars', (req, res) => {
    try {
      if (fs.existsSync(CARS_FILE_PATH)) {
        const data = fs.readFileSync(CARS_FILE_PATH, 'utf-8');
        return res.json(JSON.parse(data));
      }
      return res.json([]);
    } catch (err) {
      console.error('Error reading cars database:', err);
      return res.json([]);
    }
  });

  // Сохранить/обновить список автомобилей (синхронизируется локально и с GitHub)
  app.post('/api/cars', async (req, res) => {
    try {
      const updatedCars = req.body;
      if (!Array.isArray(updatedCars)) {
        return res.status(400).json({ error: 'Data must be an array of cars' });
      }

      const contentString = JSON.stringify(updatedCars, null, 2);
      
      // 1. Сохраняем локально на сервере
      fs.writeFileSync(CARS_FILE_PATH, contentString, 'utf-8');
      fs.writeFileSync(PUBLIC_CARS_FILE_PATH, contentString, 'utf-8');
      console.log('[Server] Successfully saved cars.json locally and in public directory.');

      // 2. Синхронизируем с GitHub репозиторием
      const gitSuccess = await commitToGithub(
        CARS_FILE_PATH,
        Buffer.from(contentString, 'utf-8'),
        `🤖 Обновление каталога автомобилей dacar16 через Панель Администратора`
      );

      return res.json({ 
        success: true, 
        message: 'Каталог автомобилей успешно сохранен на сервере!', 
        syncedWithGithub: gitSuccess,
        lastGithubError: lastGithubError
      });
    } catch (err: any) {
      console.error('Error saving cars database:', err);
      return res.status(500).json({ error: err.message || 'Failed to save cars database' });
    }
  });

  // Ручная синхронизация базы с GitHub и умная очистка локального кэша изображений
  app.post('/api/cars/pull', async (req, res) => {
    try {
      // 1. Скачиваем актуальную версию cars.json из GitHub
      await pullCarsFromGithub();

      // Если в процессе скачивания возникла ошибка, прерываем и возвращаем её пользователю
      if (lastGithubError) {
        return res.status(400).json({ 
          success: false, 
          error: lastGithubError 
        });
      }

      // 2. По просьбе пользователя ("ты их не удаляй после обновления") МЫ НЕ УДАЛЯЕМ локальные фотографии!
      // Все локальные фотографии (включая загруженные через GitHub или админку) сохраняются на 100%.
      // Любые новые изображения будут подгружены прокси-сервером на лету при обращении к ним.
      console.log('[Cache Clear] Photo deletion skipped. All local photo cache is 100% preserved.');

      return res.json({ 
        success: true, 
        message: 'Данные каталога успешно синхронизированы с GitHub! Все локальные фотографии и кэш-файлы сохранены в полной безопасности.'
      });
    } catch (err: any) {
      console.error('Error pulling cars database:', err);
      return res.status(500).json({ error: err.message || 'Failed to pull cars database' });
    }
  });

  // Получить глобальный кэш-бастер на основе времени изменения cars.json
  app.get('/api/cache-buster', (req, res) => {
    try {
      let mtime = Date.now();
      if (fs.existsSync(CARS_FILE_PATH)) {
        mtime = fs.statSync(CARS_FILE_PATH).mtimeMs;
      }
      return res.json({ timestamp: Math.floor(mtime).toString() });
    } catch (err) {
      return res.json({ timestamp: Date.now().toString() });
    }
  });

  // Список всех фото из папки public/cars в репозитории GitHub
  app.get('/api/github/list-photos', async (req, res) => {
    try {
      const config = readConfig();
      if (!config.githubToken || !config.githubRepo) {
        return res.json({ success: false, files: [] });
      }
      
      const result = await listGithubPhotosWithOctokit(
        config.githubToken,
        config.githubRepo,
        config.githubBranch || 'main'
      );
      
      return res.json(result);
    } catch (err: any) {
      console.error('Error listing github photos:', err);
      return res.status(500).json({ error: err.message || 'Failed to list github photos' });
    }
  });

  // Скачивание конкретного файла из GitHub репозитория и сохранение его локально
  app.post('/api/github/sync-photo', async (req, res) => {
    try {
      const { filename, downloadUrl } = req.body;
      if (!filename || !downloadUrl) {
        return res.status(400).json({ error: 'Filename and downloadUrl are required' });
      }

      const publicCarsDir = path.join(process.cwd(), 'public', 'cars');
      if (!fs.existsSync(publicCarsDir)) {
        fs.mkdirSync(publicCarsDir, { recursive: true });
      }

      const localFilePath = path.join(publicCarsDir, filename);
      
      // Скачиваем файл по downloadUrl
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`Failed to download from GitHub: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(localFilePath, buffer);

      return res.json({ success: true, path: `/cars/${filename}` });
    } catch (err: any) {
      console.error('Error syncing photo from GitHub:', err);
      return res.status(500).json({ error: err.message || 'Failed to sync photo' });
    }
  });

  // Загрузка фото с мобильного или ПК из Панели Администратора с коммитом в GitHub
  app.post('/api/upload', async (req, res) => {
    try {
      const { filename, base64Data } = req.body;
      if (!filename || !base64Data) {
        return res.status(400).json({ error: 'Filename and base64Data are required' });
      }

      // Очищаем и делаем имя файла безопасным
      const ext = path.extname(filename).toLowerCase() || '.jpg';
      const cleanBaseName = transliterate(path.basename(filename, ext));
      const safeFilename = `${cleanBaseName}_${Date.now()}${ext}`;

      // Превращаем Base64 в Buffer
      let pureBase64 = base64Data;
      if (base64Data.includes(';base64,')) {
        pureBase64 = base64Data.split(';base64,')[1];
      }
      const buffer = Buffer.from(pureBase64, 'base64');

      // Сохраняем локально
      const publicCarsDir = path.join(process.cwd(), 'public', 'cars');
      if (!fs.existsSync(publicCarsDir)) {
        fs.mkdirSync(publicCarsDir, { recursive: true });
      }
      const localFilePath = path.join(publicCarsDir, safeFilename);
      fs.writeFileSync(localFilePath, buffer);
      console.log(`[Upload API] Saved photo locally to ${localFilePath}`);

      // Синхронизируем с GitHub
      const gitSuccess = await commitToGithub(
        localFilePath,
        buffer,
        `🤖 Загружено фото ${safeFilename} через Панель Администратора`
      );

      const imageUrl = `/cars/${safeFilename}`;

      return res.json({
        success: true,
        message: 'Фотография успешно сохранена!',
        url: imageUrl,
        syncedWithGithub: gitSuccess
      });
    } catch (err: any) {
      console.error('Error handling upload:', err);
      return res.status(500).json({ error: err.message || 'Failed to handle file upload' });
    }
  });

// Вспомогательная мап-таблица названий файлов в GitHub репозитории
const FILE_MAPPING_DB: Record<string, string> = {
  'audi_a3_used_1.jpg': 'audia31.jpg',
  'audi_a3_used_2.jpg': 'audia32.jpg',
  'audi_q3_1.jpg': 'audiq31.jpg',
  'audi_q3_2.jpg': 'audiq32.jpg',
  'audi_q3_used_1.jpg': 'audiq3used1.jpg',
  'audi_q3_used_2.jpg': 'audiq3used2.jpg',
  'audi_q5_1.jpg': 'audiq51.jpg',
  'audi_q5_2.jpg': 'audiq52.jpg',
  'bmw_x1_used_1.jpg': 'bmwx11.jpg',
  'bmw_x1_used_2.jpg': 'bmwx12.jpg',
  'bmw_x3_used_1.jpg': 'bmwx31.jpg',
  'bmw_x3_used_2.jpg': 'bmwx32.jpg',
  'bmw_x5_1.jpg': 'bmwx51.jpg',
  'bmw_x5_2.jpg': 'bmwx52.jpg',
  'citroen_c5x_1.jpg': 'c5x1.jpg',
  'citroen_c5x_2.jpg': 'c5x2.jpg',
  'gac_s7_1.jpg': 'gacs71.jpg',
  'gac_s7_2.jpg': 'gacs72.jpg',
  'geely_monjaro_2.jpg': 'monjaro2.jpg',
  'genesis_gv80_1.jpg': 'gv801.jpg',
  'genesis_gv80_2.jpg': 'gv802.jpg',
  'hyundai_palisade_1.jpg': 'palisade1.jpg',
  'hyundai_palisade_2.jpg': 'palisade2.jpg',
  'kia_carnival_1.jpg': 'carnival1.jpg',
  'kia_carnival_2.jpg': 'carnival2.jpg',
  'kia_kx1_1.jpg': 'kiakx11.jpg',
  'kia_kx1_2.jpg': 'kiakx12.jpg',
  'li_l9_2.jpg': 'lil92.jpg',
  'mazda_cx5_comfort_1.jpg': 'cx5comfort1.jpg',
  'mazda_cx5_comfort_2.jpg': 'cx5comfort2.jpg',
  'mazda_cx5_premium_1.jpg': 'cx5premium1.jpg',
  'mazda_cx5_premium_2.jpg': 'cx5premium2.jpg',
  'mercedes_a180_used_1.jpg': 'a1801.jpg',
  'mercedes_a180_used_2.jpg': 'a1802.jpg',
  'mercedes_e260l_used_1.jpg': 'eclass1.jpg',
  'mercedes_e260l_used_2.jpg': 'eclass2.jpg',
  'mercedes_glc_coupe_1.jpg': 'glccoupe1.jpg',
  'mercedes_glc_coupe_2.jpg': 'glccoupe2.jpg',
  'mercedes_gle_used_1.jpg': 'gle1.jpg',
  'mercedes_gle_used_2.jpg': 'gle2.jpg',
  'toyota_camry_1.jpg': 'camry1.jpg',
  'toyota_camry_2.jpg': 'camry2.jpg',
  'toyota_highlander_1.jpg': 'highlander1.jpg',
  'toyota_highlander_2.jpg': 'highlander2.jpg',
  'toyota_rav4_1.jpg': 'rav41.jpg',
  'toyota_rav4_2.jpg': 'rav42.jpg',
  'vw_golf_used_1.jpg': 'golf81.jpg',
  'vw_golf_used_2.jpg': 'golf82.jpg',
  'vw_tayron_used_1.jpg': 'tayron1.jpg',
  'vw_tayron_used_2.jpg': 'tayron2.jpg',
  'vw_tcross_used_1.jpg': 'tcross1.jpg',
  'vw_tcross_used_2.jpg': 'tcross2.jpg',
  'vw_tharu_xr_1.jpg': 'tharuxr1.jpg',
  'vw_tharu_xr_2.jpg': 'tharuxr2.jpg',
  'vw_tiguan_l_pro_1.jpg': 'tiguanlpro1.jpg',
  'vw_tiguan_l_pro_2.jpg': 'tiguanlpro2.jpg',
  'vw_troc_used_1.jpg': 'troc1.jpg',
  'vw_troc_used_2.jpg': 'troc2.jpg',
  'xiaomi_su7_max_1.jpg': 'su71.jpg',
  'xiaomi_su7_max_2.jpg': 'su72.jpg',
  'zeekr_001_2.jpg': 'zeekr0012.jpg'
};

function getCarInfoFromFilename(filename: string) {
  const base = filename.replace(/\.[^/.]+$/, "");
  let words = base.split(/[_-]+/).filter(Boolean);
  if (words.length > 1 && !isNaN(Number(words[words.length - 1]))) {
    words.pop();
  }
  words = words.filter(w => w !== 'used' && w !== 'new');
  if (words.length === 0) return { brand: 'DACAR', model: 'PREMIUM SELECTION' };
  const brand = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  const model = words.slice(1).map(w => w.toUpperCase()).join(' ') || 'SUV';
  return { brand, model };
}

function generateSVGPlaceholder(brand: string, model: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1E1B18" />
        <stop offset="100%" stop-color="#0F0E0D" />
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(197, 168, 128, 0.05)" stroke-width="1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)" />
    <rect width="100%" height="100%" fill="url(#grid)" />
    <rect x="20" y="20" width="760" height="460" rx="12" fill="none" stroke="rgba(197, 168, 128, 0.15)" stroke-width="1.5" />
    <path d="M 15 35 L 15 15 L 35 15" fill="none" stroke="#C5A880" stroke-width="2" />
    <path d="M 785 35 L 785 15 L 765 15" fill="none" stroke="#C5A880" stroke-width="2" />
    <path d="M 15 465 L 15 485 L 35 485" fill="none" stroke="#C5A880" stroke-width="2" />
    <path d="M 785 465 L 785 485 L 765 485" fill="none" stroke="#C5A880" stroke-width="2" />
    <g transform="translate(200, 110) scale(0.8)" opacity="0.85">
      <line x1="-50" y1="280" x2="550" y2="280" stroke="rgba(197, 168, 128, 0.3)" stroke-width="2" stroke-dasharray="5,5" />
      <path d="M 0 240 Q 20 200, 60 190 Q 90 190, 120 150 Q 180 90, 260 85 Q 360 80, 410 140 Q 450 160, 480 200 Q 510 220, 520 240 L 520 260 Q 510 265, 490 265 Q 450 215, 410 265 L 110 265 Q 70 215, 30 265 L 0 265 Z" fill="none" stroke="#C5A880" stroke-width="3.5" stroke-linejoin="round" />
      <circle cx="70" cy="265" r="40" fill="#131110" stroke="#C5A880" stroke-width="3" />
      <circle cx="70" cy="265" r="18" fill="none" stroke="#C5A880" stroke-width="2" />
      <circle cx="450" cy="265" r="40" fill="#131110" stroke="#C5A880" stroke-width="3" />
      <circle cx="450" cy="265" r="18" fill="none" stroke="#C5A880" stroke-width="2" />
      <path d="M 120 150 L 260 145 L 260 90 Z" fill="none" stroke="rgba(197, 168, 128, 0.5)" stroke-width="1.5" />
      <path d="M 280 90 L 280 145 L 390 145 Z" fill="none" stroke="rgba(197, 168, 128, 0.5)" stroke-width="1.5" />
      <line x1="260" y1="145" x2="280" y2="145" stroke="rgba(197, 168, 128, 0.5)" stroke-width="1.5" />
    </g>
    <text x="50" y="80" font-family="'Inter', system-ui, sans-serif" font-size="20" font-weight="600" fill="#C5A880" letter-spacing="4" opacity="0.6">DACAR PREMIUM</text>
    <text x="50" y="415" font-family="'Inter', system-ui, sans-serif" font-size="44" font-weight="700" fill="#FFFFFF" letter-spacing="1">${brand}</text>
    <text x="50" y="450" font-family="'Inter', system-ui, sans-serif" font-size="22" font-weight="400" fill="#C5A880" letter-spacing="1" opacity="0.9">${model}</text>
    <text x="750" y="450" font-family="'JetBrains Mono', monospace" font-size="12" fill="rgba(197, 168, 128, 0.4)" text-anchor="end" letter-spacing="1">PREMIUM SELECTION • SPECIFICATION BLUEPRINT</text>
  </svg>`;
}

  // Прокси-маршрут для автоматической подгрузки фотографий автомобилей из GitHub, если их нет на текущем сервере (например, после перезапуска контейнера)
  app.get('/cars/:filename', async (req, res, next) => {
    try {
      const filename = req.params.filename;
      const localFilePath = path.join(process.cwd(), 'public', 'cars', filename);

      // Если файл физически есть на диске сервера и он не пустой (size > 0), отдаем его сразу
      if (fs.existsSync(localFilePath)) {
        const stats = fs.statSync(localFilePath);
        if (stats.size > 0) {
          return res.sendFile(localFilePath);
        }
      }

      // Если файла нет локально или он пустой (0 байт), проверяем конфигурацию GitHub
      const config = readConfig();
      const gitFilename = FILE_MAPPING_DB[filename.toLowerCase()] || filename;
      let success = false;
      let buffer: Buffer | null = null;

      if (config.githubRepo) {
        const branch = config.githubBranch || 'main';
        const candidates = [gitFilename];
        if (gitFilename !== filename) {
          candidates.push(filename);
        }

        for (const targetName of candidates) {
          const rawUrl = `https://raw.githubusercontent.com/${config.githubRepo}/${branch}/public/cars/${targetName}`;
          const gitApiUrl = `https://api.github.com/repos/${config.githubRepo}/contents/public/cars/${targetName}?ref=${branch}`;
          
          console.log(`[Image Proxy] Attempting raw download from GitHub CDN for "${targetName}": ${rawUrl}`);
          try {
            const rawRes = await fetch(rawUrl, {
              headers: {
                'User-Agent': 'Dacar16-Integration'
              }
            });
            if (rawRes.ok) {
              const ab = await rawRes.arrayBuffer();
              const tempBuf = Buffer.from(ab);
              if (tempBuf.length > 0) {
                buffer = tempBuf;
                success = true;
                console.log(`[Image Proxy] Successfully fetched "${targetName}" from raw CDN!`);
                break;
              }
            }
          } catch (rawErr) {
            console.warn(`[Image Proxy] Raw fetch failed for "${targetName}":`, rawErr);
          }

          if (!success && config.githubToken) {
            console.log(`[Image Proxy] Trying authenticated API fetch for "${targetName}": ${gitApiUrl}`);
            try {
              const apiRes = await fetch(gitApiUrl, {
                headers: {
                  'Authorization': `token ${config.githubToken}`,
                  'User-Agent': 'Dacar16-Integration',
                  'Accept': 'application/vnd.github.v3.raw'
                }
              });
              if (apiRes.ok) {
                const ab = await apiRes.arrayBuffer();
                const tempBuf = Buffer.from(ab);
                if (tempBuf.length > 0) {
                  buffer = tempBuf;
                  success = true;
                  console.log(`[Image Proxy] Successfully fetched "${targetName}" via authenticated API!`);
                  break;
                }
              }
            } catch (apiErr) {
              console.error(`[Image Proxy] Authenticated API fetch failed for "${targetName}":`, apiErr);
            }
          }
        }
      }

      if (success && buffer && buffer.length > 0) {
        // Сохраняем скачанный файл на локальный диск сервера для быстродействия последующих запросов
        const publicCarsDir = path.dirname(localFilePath);
        if (!fs.existsSync(publicCarsDir)) {
          fs.mkdirSync(publicCarsDir, { recursive: true });
        }
        fs.writeFileSync(localFilePath, buffer);
        console.log(`[Image Proxy] Cached fetched photo locally: ${filename}`);

        // Устанавливаем корректные Content-Type заголовки
        const ext = path.extname(filename).toLowerCase();
        let contentType = 'image/jpeg';
        if (ext === '.png') contentType = 'image/png';
        if (ext === '.gif') contentType = 'image/gif';
        if (ext === '.webp') contentType = 'image/webp';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Браузерное кеширование на 1 год
        return res.send(buffer);
      } else {
        console.warn(`[Image Proxy] Could not fetch real image "${filename}". Falling back to premium SVG blueprint.`);
      }
    } catch (err) {
      console.error('[Image Proxy] Error fetching photo from GitHub:', err);
    }

    // --- ФИНАЛЬНЫЙ ФЭЛБЕК (FALLBACK) ---
    // Если изображение отсутствует или имеет размер 0 байт, динамически отдаем роскошный SVG-чертеж автомобиля
    try {
      const filename = req.params.filename;
      const { brand, model } = getCarInfoFromFilename(filename);
      const svgString = generateSVGPlaceholder(brand, model);
      const svgBuffer = Buffer.from(svgString, 'utf-8');

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Кеш 1 год
      return res.send(svgBuffer);
    } catch (fallbackErr) {
      console.error('[Image Proxy] Critical failure in fallback placeholder generation:', fallbackErr);
      next();
    }
  });

  // Настройка Vite middleware в режиме разработки
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // В продакшене отдаем статические файлы
    const distPath = path.join(process.cwd(), 'dist');
    const publicPath = path.join(process.cwd(), 'public');
    app.use(express.static(distPath));
    app.use(express.static(publicPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
