import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { CARS_DATA } from './src/data/cars';

// Путь к файлу конфигурации Telegram и GitHub
const CONFIG_PATH = path.join(process.cwd(), 'telegram_config.json');
// Путь к файлу базы данных автомобилей
const CARS_FILE_PATH = path.join(process.cwd(), 'cars.json');

let lastGithubError = '';

interface TelegramConfig {
  telegramBotToken: string;
  githubToken: string;
  githubRepo: string;
  githubBranch: string;
  allowedChatIds: string; // Запятые или пробелы
  webhookRegistered: boolean;
}

const DEFAULT_CONFIG: TelegramConfig = {
  telegramBotToken: '',
  githubToken: '',
  githubRepo: '2507779/dacar16',
  githubBranch: 'main',
  allowedChatIds: '',
  webhookRegistered: false
};

function readConfig(): TelegramConfig {
  let config = { ...DEFAULT_CONFIG };
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
      config = { ...config, ...JSON.parse(content) };
    }
  } catch (e) {
    console.error('Error reading telegram config:', e);
  }

  // Fallback to environment variables if not present in the configuration file
  if (!config.telegramBotToken) {
    config.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_TOKEN || process.env.BOT_TOKEN || '';
  }
  if (!config.githubToken) {
    config.githubToken = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
  }
  
  return config;
}

function writeConfig(config: TelegramConfig) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing telegram config:', e);
  }
}

// Вспомогательная функция для выгрузки файлов в GitHub репозиторий
async function commitToGithub(filepath: string, contentBuffer: Buffer, commitMessage: string): Promise<boolean> {
  const config = readConfig();
  if (!config.githubToken || !config.githubRepo) {
    console.log('[GitHub Sync] GitHub Token or Repo is not configured, skipping sync.');
    lastGithubError = 'Токен GitHub или репозиторий не указаны в настройках';
    return false;
  }
  try {
    // Получаем относительный путь от корня проекта (например: public/cars/my_car.jpg или cars.json)
    const relativePath = path.relative(process.cwd(), filepath).replace(/\\/g, '/');
    const contentBase64 = contentBuffer.toString('base64');
    const gitUrl = `https://api.github.com/repos/${config.githubRepo}/contents/${relativePath}`;
    
    // Проверяем существование файла на GitHub (чтобы получить sha на перезапись)
    let sha: string | undefined = undefined;
    const checkRes = await fetch(gitUrl, {
      headers: {
        'Authorization': `token ${config.githubToken}`,
        'User-Agent': 'Dacar16-Integration',
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (checkRes.status === 200) {
      const checkData = await checkRes.json() as any;
      sha = checkData.sha;
    } else if (checkRes.status === 401) {
      lastGithubError = 'Ошибка авторизации GitHub (401 Bad credentials). Проверьте правильность токена.';
      console.error(`[GitHub Sync] checkRes 401: Unauthorized`);
      return false;
    } else if (checkRes.status === 403) {
      lastGithubError = 'Превышен лимит запросов или ограничен доступ (403 Forbidden). Проверьте права токена.';
      console.error(`[GitHub Sync] checkRes 403: Forbidden`);
      return false;
    } else if (checkRes.status === 404) {
      // Это нормально, если файла еще нет в репозитории, но это также может означать, что сам репозиторий не существует.
      // Не прерываем, так как PUT попробует создать файл.
    }

    const commitBody: any = {
      message: commitMessage,
      content: contentBase64,
      branch: config.githubBranch || 'main'
    };
    if (sha) {
      commitBody.sha = sha;
    }

    const commitRes = await fetch(gitUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${config.githubToken}`,
        'User-Agent': 'Dacar16-Integration',
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify(commitBody)
    });

    if (commitRes.ok) {
      console.log(`[GitHub Sync] Successfully committed "${relativePath}" to GitHub!`);
      lastGithubError = ''; // Сбрасываем ошибку при успешной записи
      return true;
    } else {
      const resText = await commitRes.text();
      console.error(`[GitHub Sync] Failed to commit "${relativePath}" to GitHub:`, resText);
      try {
        const resJson = JSON.parse(resText);
        lastGithubError = `GitHub API ошибка: ${resJson.message || resText}`;
      } catch (e) {
        lastGithubError = `GitHub код ${commitRes.status}: ${resText.slice(0, 150)}`;
      }
    }
  } catch (err: any) {
    console.error(`[GitHub Sync] Exception committing "${filepath}" to GitHub:`, err);
    lastGithubError = `Исключение сети при связи с GitHub: ${err.message || err}`;
  }
  return false;
}

// Вспомогательная функция для получения актуального cars.json из GitHub при запуске сервера
async function pullCarsFromGithub(): Promise<void> {
  const config = readConfig();
  if (!config.githubToken || !config.githubRepo) {
    console.log('[GitHub Sync] GitHub Token/Repo not configured, skipping startup pull.');
    return;
  }
  try {
    const branch = config.githubBranch || 'main';
    const gitUrl = `https://api.github.com/repos/${config.githubRepo}/contents/cars.json?ref=${branch}`;
    console.log(`[GitHub Sync] Fetching cars.json from GitHub: ${gitUrl}`);
    const res = await fetch(gitUrl, {
      headers: {
        'Authorization': `token ${config.githubToken}`,
        'User-Agent': 'Dacar16-Integration',
        'Accept': 'application/vnd.github.v3.raw'
      }
    });
    if (res.ok) {
      const content = await res.text();
      // Проверяем корректность JSON перед сохранением
      try {
        JSON.parse(content);
        fs.writeFileSync(CARS_FILE_PATH, content, 'utf-8');
        console.log('[GitHub Sync] Successfully pulled and updated cars.json from GitHub on startup!');
      } catch (jsonErr) {
        console.error('[GitHub Sync] Pulled content is not valid JSON, skipping write.', jsonErr);
      }
    } else {
      console.warn(`[GitHub Sync] Pull cars.json failed with status: ${res.status}`);
    }
  } catch (err) {
    console.error('[GitHub Sync] Exception pulling cars.json on startup:', err);
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
  return CARS_DATA;
}

// Запись списка автомобилей в базу данных
function writeCars(cars: any[]): boolean {
  try {
    fs.writeFileSync(CARS_FILE_PATH, JSON.stringify(cars, null, 2), 'utf-8');
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

// Инициализируем локальный cars.json дефолтными данными из src/data/cars.ts, если его ещё нет
try {
  if (!fs.existsSync(CARS_FILE_PATH)) {
    fs.writeFileSync(CARS_FILE_PATH, JSON.stringify(CARS_DATA, null, 2), 'utf-8');
    console.log('[Server] Successfully initialized cars.json from CARS_DATA');
  }
} catch (e) {
  console.error('[Server] Failed to initialize cars.json on startup:', e);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Попытка стянуть актуальную базу автомобилей из GitHub при запуске сервера
  await pullCarsFromGithub();

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
        webhookRegistered: currentConfig.webhookRegistered
      };

      writeConfig(updatedConfig);
      res.json({ success: true, message: 'Настройки сохранены!' });
    } catch (err) {
      console.error('Error saving config:', err);
      res.status(500).json({ error: 'Failed to save config' });
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
        
        // Превращаем слитые названия, camelCase, snake_case/kebab-case (например, toyotarav41) в красивое название
        let cleanName = baseName
          .replace(/([A-Z])/g, ' $1')    // Пробел перед заглавными буквами
          .replace(/([0-9]+)/g, ' $1')   // Пробел перед цифрами
          .trim()
          .split(/[_-]+/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
          .replace(/\s+/g, ' ');         // Убираем множественные пробелы

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
      return res.json(CARS_DATA);
    } catch (err) {
      console.error('Error reading cars database:', err);
      return res.json(CARS_DATA);
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
      console.log('[Server] Successfully saved cars.json locally.');

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

  // Прокси-маршрут для автоматической подгрузки фотографий автомобилей из GitHub, если их нет на текущем сервере (например, после перезапуска контейнера)
  app.get('/cars/:filename', async (req, res, next) => {
    try {
      const filename = req.params.filename;
      const localFilePath = path.join(process.cwd(), 'public', 'cars', filename);

      // Если файл физически есть на диске сервера, отдаем его сразу
      if (fs.existsSync(localFilePath)) {
        return res.sendFile(localFilePath);
      }

      // Если файла нет локально, проверяем конфигурацию GitHub
      const config = readConfig();
      if (!config.githubToken || !config.githubRepo) {
        console.log(`[Image Proxy] File ${filename} not found locally, and GitHub is not configured.`);
        return next();
      }

      const branch = config.githubBranch || 'main';
      const gitUrl = `https://api.github.com/repos/${config.githubRepo}/contents/public/cars/${filename}?ref=${branch}`;
      
      console.log(`[Image Proxy] File "${filename}" not found locally. Pulling from GitHub: ${gitUrl}`);
      
      const response = await fetch(gitUrl, {
        headers: {
          'Authorization': `token ${config.githubToken}`,
          'User-Agent': 'Dacar16-Integration',
          'Accept': 'application/vnd.github.v3.raw'
        }
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

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
        console.warn(`[Image Proxy] GitHub response failed for "${filename}" with status: ${response.status}`);
      }
    } catch (err) {
      console.error('[Image Proxy] Error fetching photo from GitHub:', err);
    }
    next();
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
