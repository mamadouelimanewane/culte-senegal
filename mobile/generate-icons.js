const sharp = require('sharp');
const path = require('path');

// Colors
const BG_COLOR = '#0a3d6b';       // Dark blue (existing brand color)
const ACCENT_COLOR = '#48cae4';    // Light cyan accent
const TEXT_COLOR = '#FFFFFF';      // White text

/**
 * Generate an SVG icon with "SC" initials
 */
function createIconSVG(size, options = {}) {
  const {
    isAdaptiveForeground = false,
    isMonochrome = false,
    isSplash = false
  } = options;

  const center = size / 2;

  if (isMonochrome) {
    // Monochrome version - just white SC on transparent
    const fontSize = size * 0.38;
    return Buffer.from(`
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <text x="${center}" y="${center + fontSize * 0.35}"
              font-family="Arial, Helvetica, sans-serif"
              font-size="${fontSize}"
              font-weight="900"
              fill="white"
              text-anchor="middle"
              letter-spacing="${size * 0.02}">SC</text>
      </svg>
    `);
  }

  if (isAdaptiveForeground) {
    // Adaptive foreground - SC with accent decoration on transparent bg
    const fontSize = size * 0.30;
    const circleR = size * 0.28;
    return Buffer.from(`
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${ACCENT_COLOR};stop-opacity:0.9"/>
            <stop offset="100%" style="stop-color:#0077b6;stop-opacity:0.9"/>
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="${size*0.008}" stdDeviation="${size*0.015}" flood-color="#000" flood-opacity="0.3"/>
          </filter>
        </defs>

        <!-- Circle background -->
        <circle cx="${center}" cy="${center}" r="${circleR}" fill="url(#circleGrad)" filter="url(#shadow)"/>

        <!-- Decorative ring -->
        <circle cx="${center}" cy="${center}" r="${circleR * 1.05}" fill="none" stroke="white" stroke-width="${size*0.005}" opacity="0.3"/>

        <!-- SC Text -->
        <text x="${center}" y="${center + fontSize * 0.35}"
              font-family="Arial, Helvetica, sans-serif"
              font-size="${fontSize}"
              font-weight="900"
              fill="white"
              text-anchor="middle"
              letter-spacing="${size * 0.015}"
              filter="url(#shadow)">SC</text>

        <!-- Small decorative dot -->
        <circle cx="${center + circleR * 0.65}" cy="${center - circleR * 0.65}" r="${size*0.02}" fill="white" opacity="0.7"/>
      </svg>
    `);
  }

  if (isSplash) {
    // Splash screen - larger, centered with subtle branding
    const fontSize = size * 0.15;
    const circleR = size * 0.12;
    const subtitleSize = size * 0.025;
    return Buffer.from(`
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#062a4a"/>
            <stop offset="50%" style="stop-color:${BG_COLOR}"/>
            <stop offset="100%" style="stop-color:#0d4f86"/>
          </linearGradient>
          <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${ACCENT_COLOR}"/>
            <stop offset="100%" style="stop-color:#0096c7"/>
          </linearGradient>
          <filter id="glow">
            <feDropShadow dx="0" dy="0" stdDeviation="${size*0.01}" flood-color="${ACCENT_COLOR}" flood-opacity="0.5"/>
          </filter>
        </defs>

        <rect width="${size}" height="${size}" fill="url(#bgGrad)"/>

        <!-- Circle -->
        <circle cx="${center}" cy="${center - size*0.03}" r="${circleR}" fill="url(#circleGrad)" filter="url(#glow)"/>
        <circle cx="${center}" cy="${center - size*0.03}" r="${circleR * 1.08}" fill="none" stroke="${ACCENT_COLOR}" stroke-width="${size*0.003}" opacity="0.4"/>

        <!-- SC -->
        <text x="${center}" y="${center - size*0.03 + fontSize * 0.35}"
              font-family="Arial, Helvetica, sans-serif"
              font-size="${fontSize}"
              font-weight="900"
              fill="white"
              text-anchor="middle"
              letter-spacing="${size * 0.01}">SC</text>

        <!-- Subtitle -->
        <text x="${center}" y="${center + circleR + size*0.05}"
              font-family="Arial, Helvetica, sans-serif"
              font-size="${subtitleSize}"
              font-weight="400"
              fill="${ACCENT_COLOR}"
              text-anchor="middle"
              letter-spacing="${size * 0.008}"
              opacity="0.9">SCENEWS</text>
      </svg>
    `);
  }

  // Default full icon (icon.png) - with background
  const fontSize = size * 0.35;
  const cornerRadius = size * 0.18;
  const circleR = size * 0.33;
  return Buffer.from(`
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#062a4a"/>
          <stop offset="50%" style="stop-color:${BG_COLOR}"/>
          <stop offset="100%" style="stop-color:#0d4f86"/>
        </linearGradient>
        <linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${ACCENT_COLOR};stop-opacity:0.25"/>
          <stop offset="100%" style="stop-color:#0077b6;stop-opacity:0.25"/>
        </linearGradient>
        <filter id="textShadow">
          <feDropShadow dx="0" dy="${size*0.01}" stdDeviation="${size*0.015}" flood-color="#000" flood-opacity="0.4"/>
        </filter>
        <clipPath id="roundRect">
          <rect width="${size}" height="${size}" rx="${cornerRadius}" ry="${cornerRadius}"/>
        </clipPath>
      </defs>

      <!-- Background -->
      <g clip-path="url(#roundRect)">
        <rect width="${size}" height="${size}" fill="url(#bgGrad)"/>

        <!-- Decorative circle -->
        <circle cx="${center}" cy="${center}" r="${circleR}" fill="url(#circleGrad)"/>
        <circle cx="${center}" cy="${center}" r="${circleR * 1.05}" fill="none" stroke="${ACCENT_COLOR}" stroke-width="${size*0.004}" opacity="0.2"/>

        <!-- Subtle top-left decoration -->
        <circle cx="${size * 0.15}" cy="${size * 0.15}" r="${size * 0.08}" fill="white" opacity="0.05"/>

        <!-- SC Text -->
        <text x="${center}" y="${center + fontSize * 0.35}"
              font-family="Arial, Helvetica, sans-serif"
              font-size="${fontSize}"
              font-weight="900"
              fill="white"
              text-anchor="middle"
              letter-spacing="${size * 0.02}"
              filter="url(#textShadow)">SC</text>

        <!-- Small accent dot -->
        <circle cx="${center + circleR * 0.6}" cy="${center - circleR * 0.6}" r="${size*0.018}" fill="${ACCENT_COLOR}" opacity="0.8"/>
      </g>
    </svg>
  `);
}

async function generateAllIcons() {
  const assetsDir = path.join(__dirname, 'assets');

  console.log('🎨 Generating SC icons...\n');

  // 1. Main icon (1024x1024)
  const iconSVG = createIconSVG(1024);
  await sharp(iconSVG).resize(1024, 1024).png().toFile(path.join(assetsDir, 'icon.png'));
  console.log('✅ icon.png (1024x1024)');

  // 2. Adaptive foreground (512x512)
  const fgSVG = createIconSVG(512, { isAdaptiveForeground: true });
  await sharp(fgSVG).resize(512, 512).png().toFile(path.join(assetsDir, 'android-icon-foreground.png'));
  console.log('✅ android-icon-foreground.png (512x512)');

  // 3. Adaptive background (512x512) - solid gradient bg
  const bgSVG = Buffer.from(`
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#062a4a"/>
          <stop offset="50%" style="stop-color:${BG_COLOR}"/>
          <stop offset="100%" style="stop-color:#0d4f86"/>
        </linearGradient>
      </defs>
      <rect width="512" height="512" fill="url(#bg)"/>
    </svg>
  `);
  await sharp(bgSVG).resize(512, 512).png().toFile(path.join(assetsDir, 'android-icon-background.png'));
  console.log('✅ android-icon-background.png (512x512)');

  // 4. Monochrome (432x432)
  const monoSVG = createIconSVG(432, { isMonochrome: true });
  await sharp(monoSVG).resize(432, 432).png().toFile(path.join(assetsDir, 'android-icon-monochrome.png'));
  console.log('✅ android-icon-monochrome.png (432x432)');

  // 5. Favicon (48x48)
  const faviconSVG = createIconSVG(256); // Generate at 256 then resize for quality
  await sharp(faviconSVG).resize(48, 48).png().toFile(path.join(assetsDir, 'favicon.png'));
  console.log('✅ favicon.png (48x48)');

  // 6. Splash icon (1024x1024)
  const splashSVG = createIconSVG(1024, { isSplash: true });
  await sharp(splashSVG).resize(1024, 1024).png().toFile(path.join(assetsDir, 'splash-icon.png'));
  console.log('✅ splash-icon.png (1024x1024)');

  console.log('\n🎉 All icons generated successfully!');
}

generateAllIcons().catch(console.error);
