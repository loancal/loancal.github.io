import fs from 'fs';
import sharp from 'sharp';

const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#EEE3CB"/>
  <rect x="60" y="60" width="1080" height="510" rx="28" fill="#D7C0AE" stroke="#B7C4CF" stroke-width="4"/>
  <circle cx="180" cy="180" r="56" fill="#967E76"/>
  <rect x="152" y="152" width="56" height="56" rx="12" fill="#EEE3CB"/>
  <text x="270" y="170" font-family="system-ui, -apple-system, sans-serif" font-size="58" font-weight="800" fill="#2C221E">LoanCal</text>
  <text x="270" y="210" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="600" fill="#967E76">Free Secure Loan &amp; EMI Calculator</text>
  <text x="120" y="325" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="700" fill="#2C221E">100% Client-Side Financial Precision</text>
  <text x="120" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="26" fill="#6B554F">Zero-server calculations • Instant amortization schedules • 100% Privacy</text>
  <rect x="120" y="440" width="340" height="64" rx="32" fill="#B7C4CF"/>
  <text x="155" y="482" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700" fill="#1E2B35">loancal.github.io</text>
</svg>`;

if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

sharp(Buffer.from(svg))
  .png()
  .toFile('public/og-image.png')
  .then(() => {
    console.log('public/og-image.png generated successfully.');
  })
  .catch((err) => {
    console.error('Error generating image:', err);
  });
