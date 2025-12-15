/**
 * Script to download Vazir font files
 * Run: node scripts/download-vazir-font.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, '../public/fonts');

// Create fonts directory if it doesn't exist
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const fontFiles = [
  {
    url: 'https://github.com/rastikerdar/vazir-font/raw/master/dist/Vazir-Regular.woff2',
    filename: 'Vazir-Regular.woff2',
  },
  {
    url: 'https://github.com/rastikerdar/vazir-font/raw/master/dist/Vazir-Medium.woff2',
    filename: 'Vazir-Medium.woff2',
  },
  {
    url: 'https://github.com/rastikerdar/vazir-font/raw/master/dist/Vazir-Bold.woff2',
    filename: 'Vazir-Bold.woff2',
  },
];

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        return downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${path.basename(filepath)}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function downloadFonts() {
  console.log('Downloading Vazir font files...');
  
  for (const font of fontFiles) {
    const filepath = path.join(fontsDir, font.filename);
    try {
      await downloadFile(font.url, filepath);
    } catch (error) {
      console.error(`Failed to download ${font.filename}:`, error.message);
      console.log(`\nPlease download ${font.filename} manually from:`);
      console.log('https://github.com/rastikerdar/vazir-font/releases');
      console.log(`And place it in: ${fontsDir}\n`);
    }
  }
  
  console.log('\nFont download complete!');
}

downloadFonts();

