import fs from 'fs';
import path from 'path';

const publicCarsDir = path.join(process.cwd(), 'public', 'cars');
const outputFile = path.join(process.cwd(), 'src', 'data', 'cars_presets.json');

try {
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
      const cleanName = baseName
        .split(/[_-]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return {
        path: `/cars/${file}`,
        name: cleanName
      };
    });

  const dataDir = path.dirname(outputFile);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(presets, null, 2), 'utf-8');
  console.log(`Successfully generated ${presets.length} presets into ${outputFile}`);
} catch (err) {
  console.error('Error generating image presets:', err);
}
