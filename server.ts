import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
