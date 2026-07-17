import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// Путь к файлу конфигурации Telegram и GitHub
const CONFIG_PATH = path.join(process.cwd(), 'telegram_config.json');

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
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const content = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
    }
  } catch (e) {
    console.error('Error reading telegram config:', e);
  }
  return DEFAULT_CONFIG;
}

function writeConfig(config: TelegramConfig) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing telegram config:', e);
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API для конфигурации Telegram & GitHub
  app.get('/api/telegram/config', (req, res) => {
    const config = readConfig();
    // Скрываем токены для безопасности при выводе
    res.json({
      ...config,
      telegramBotToken: config.telegramBotToken ? `${config.telegramBotToken.slice(0, 6)}...${config.telegramBotToken.slice(-4)}` : '',
      githubToken: config.githubToken ? `${config.githubToken.slice(0, 4)}...${config.githubToken.slice(-4)}` : '',
      hasRawTokens: !!(config.telegramBotToken && config.githubToken)
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
      const text = message.text || '';
      
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
              text: `⚠️ У вас нет доступа к загрузке файлов. Ваш Chat ID: \`${chatId}\`. Укажите его в настройках админ-панели.`
            })
          });
          return res.status(200).send('Unauthorized chat id');
        }
      }

      // Если прислали команду /start или /help
      if (text.startsWith('/start') || text.startsWith('/help')) {
        await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `🚗 *Добро пожаловать в бота DA!CAR!* \n\nОтправьте мне любое фото автомобиля. \n\n*Совет:* укажите в подписи к фото (caption) название автомобиля на русском или английском (например, \`zeekr_001\` или \`зикр_001_вид_сбоку\`). Я автоматически назову файл красиво и сохраню его напрямую в ваш GitHub репозиторий *${config.githubRepo}*!`
          })
        });
        return res.status(200).send('Start message sent');
      }

      const photos = message.photo;
      if (!photos || photos.length === 0) {
        // Если прислали просто текст
        await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: `📸 Пожалуйста, отправьте мне *изображение (фотографию)*.`
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
        try {
          const contentBase64 = buffer.toString('base64');
          const gitUrl = `https://api.github.com/repos/${config.githubRepo}/contents/public/cars/${filename}`;
          
          // Проверяем существование файла на GitHub (чтобы получить sha на перезапись)
          let sha: string | undefined = undefined;
          const checkRes = await fetch(gitUrl, {
            headers: {
              'Authorization': `token ${config.githubToken}`,
              'User-Agent': 'Dacar16-Telegram-Integration',
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          
          if (checkRes.status === 200) {
            const checkData = await checkRes.json() as any;
            sha = checkData.sha;
          }

          const commitBody: any = {
            message: `🤖 Загружено фото ${filename} через Telegram-бота от ChatID: ${chatId}`,
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
              'User-Agent': 'Dacar16-Telegram-Integration',
              'Content-Type': 'application/json',
              'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(commitBody)
          });

          if (commitRes.ok) {
            githubSuccess = true;
            githubUrl = `https://github.com/${config.githubRepo}/blob/${config.githubBranch || 'main'}/public/cars/${filename}`;
            console.log(`[Telegram Bot] Committed photo successfully to GitHub: ${githubUrl}`);
          } else {
            console.error('[Telegram Bot] Failed to commit to GitHub:', await commitRes.text());
          }
        } catch (gitErr) {
          console.error('[Telegram Bot] Exception during GitHub commit:', gitErr);
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

  // API для динамического сканирования фотографий в папке public/cars
  app.get('/api/presets', (req, res) => {
    try {
      const publicCarsDir = path.join(process.cwd(), 'public', 'cars');
      if (!fs.existsSync(publicCarsDir)) {
        fs.mkdirSync(publicCarsDir, { recursive: true });
      }

      const files = fs.readdirSync(publicCarsDir);
      const presets = files
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.bmp'].includes(ext);
        })
        .map(file => {
          const baseName = path.basename(file, path.extname(file));
          // Превращаем snake_case/kebab-case в красивое название
          const cleanName = baseName
            .split(/[_-]+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          return {
            path: `/cars/${file}`,
            name: cleanName
          };
        });

      res.json(presets);
    } catch (err) {
      console.error('Error scanning cars folder:', err);
      res.status(500).json({ error: 'Failed to read preset images' });
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
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
