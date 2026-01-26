const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
// icon-source.pngを優先、なければicon.pngを使用
const iconSourcePath = path.join(projectRoot, 'assets', 'icon-source.png');
const iconFallbackPath = path.join(projectRoot, 'assets', 'icon.png');
const iconSrc = fs.existsSync(iconSourcePath) ? iconSourcePath : iconFallbackPath;
const resDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');

// #region agent log
fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'fix-icon-after-prebuild.js:15',
    message: 'Fix icon script started',
    data: {
      iconSourceExists: fs.existsSync(iconSourcePath),
      iconFallbackExists: fs.existsSync(iconFallbackPath),
      iconSrc,
      resDirExists: fs.existsSync(resDir)
    },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'fix-icon',
    hypothesisId: 'B'
  })
}).catch(() => {});
// #endregion

if (!fs.existsSync(iconSrc)) {
  console.error('Icon source not found:', iconSrc);
  console.error('Please ensure assets/icon-source.png or assets/icon.png exists');
  process.exit(1);
}

// #region agent log
fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'fix-icon-after-prebuild.js:35',
    message: 'Using icon source',
    data: { iconSrc, isFallback: iconSrc === iconFallbackPath },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'fix-icon',
    hypothesisId: 'B'
  })
}).catch(() => {});
// #endregion

if (!fs.existsSync(resDir)) {
  console.error('Android res directory not found:', resDir);
  process.exit(1);
}

// Delete existing launcher files
const launcherFiles = [];
function findAndDeleteLauncherFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findAndDeleteLauncherFiles(filePath);
    } else if (file.includes('ic_launcher')) {
      launcherFiles.push(filePath);
      fs.unlinkSync(filePath);
    }
  });
}

// #region agent log
fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'fix-icon-after-prebuild.js:45',
    message: 'Deleting existing launcher files',
    data: { count: launcherFiles.length },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'fix-icon',
    hypothesisId: 'B'
  })
}).catch(() => {});
// #endregion

findAndDeleteLauncherFiles(resDir);

// Create mipmap directories
const mipmaps = ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi'];
mipmaps.forEach(density => {
  const mipmapDir = path.join(resDir, `mipmap-${density}`);
  if (!fs.existsSync(mipmapDir)) {
    fs.mkdirSync(mipmapDir, { recursive: true });
  }
});

const mipmapAnydpiDir = path.join(resDir, 'mipmap-anydpi-v26');
if (!fs.existsSync(mipmapAnydpiDir)) {
  fs.mkdirSync(mipmapAnydpiDir, { recursive: true });
}

// Generate icons using sips
const sizes = {
  mdpi: { launcher: 48, foreground: 108 },
  hdpi: { launcher: 72, foreground: 162 },
  xhdpi: { launcher: 96, foreground: 216 },
  xxhdpi: { launcher: 144, foreground: 324 },
  xxxhdpi: { launcher: 192, foreground: 432 }
};

let generatedCount = 0;
mipmaps.forEach(density => {
  const size = sizes[density];
  const mipmapDir = path.join(resDir, `mipmap-${density}`);
  
  try {
    execSync(`sips -z ${size.launcher} ${size.launcher} "${iconSrc}" --out "${path.join(mipmapDir, 'ic_launcher.png')}"`);
    execSync(`sips -z ${size.launcher} ${size.launcher} "${iconSrc}" --out "${path.join(mipmapDir, 'ic_launcher_round.png')}"`);
    execSync(`sips -z ${size.foreground} ${size.foreground} "${iconSrc}" --out "${path.join(mipmapDir, 'ic_launcher_foreground.png')}"`);
    generatedCount += 3;
  } catch (error) {
    console.error(`Error generating icons for ${density}:`, error.message);
  }
});

// #region agent log
fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'fix-icon-after-prebuild.js:85',
    message: 'Icons generated',
    data: { generatedCount },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'fix-icon',
    hypothesisId: 'B'
  })
}).catch(() => {});
// #endregion

// Create adaptive icon XML files
const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>`;

fs.writeFileSync(path.join(mipmapAnydpiDir, 'ic_launcher.xml'), adaptiveIconXml);
fs.writeFileSync(path.join(mipmapAnydpiDir, 'ic_launcher_round.xml'), adaptiveIconXml);

// Ensure colors.xml has ic_launcher_background
const valuesDir = path.join(resDir, 'values');
if (!fs.existsSync(valuesDir)) {
  fs.mkdirSync(valuesDir, { recursive: true });
}

const colorsXmlPath = path.join(valuesDir, 'colors.xml');
let colorsXml = '';
if (fs.existsSync(colorsXmlPath)) {
  colorsXml = fs.readFileSync(colorsXmlPath, 'utf8');
} else {
  colorsXml = '<resources>\n</resources>';
}

if (!colorsXml.includes('ic_launcher_background')) {
  colorsXml = colorsXml.replace('</resources>', '  <color name="ic_launcher_background">#FFFFFF</color>\n</resources>');
  fs.writeFileSync(colorsXmlPath, colorsXml);
}

// Ensure drawable/ic_launcher_background.xml exists
const drawableDir = path.join(resDir, 'drawable');
if (!fs.existsSync(drawableDir)) {
  fs.mkdirSync(drawableDir, { recursive: true });
}

const backgroundXmlPath = path.join(drawableDir, 'ic_launcher_background.xml');
if (!fs.existsSync(backgroundXmlPath)) {
  const backgroundXml = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="#FFFFFF"/>
</shape>`;
  fs.writeFileSync(backgroundXmlPath, backgroundXml);
}

// #region agent log
fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'fix-icon-after-prebuild.js:130',
    message: 'Icon fix completed',
    data: { generatedCount },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'fix-icon',
    hypothesisId: 'B'
  })
}).catch(() => {});
// #endregion

console.log(`✓ Fixed icons: generated ${generatedCount} icon files`);
