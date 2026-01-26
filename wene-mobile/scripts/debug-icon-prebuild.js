const fs = require('fs');
const path = require('path');

// #region agent log
fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'debug-icon-prebuild.js:8',
    message: 'Icon prebuild debug script started',
    data: { timestamp: Date.now() },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'prebuild-check',
    hypothesisId: 'A'
  })
}).catch(() => {});
// #endregion

const projectRoot = path.join(__dirname, '..');
const iconPath = path.join(projectRoot, 'assets', 'icon.png');
const adaptiveIconPath = path.join(projectRoot, 'assets', 'adaptive-icon.png');
const androidResPath = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');

// #region agent log
fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'debug-icon-prebuild.js:25',
    message: 'Checking icon file existence',
    data: {
      iconPath,
      iconExists: fs.existsSync(iconPath),
      adaptiveIconPath,
      adaptiveIconExists: fs.existsSync(adaptiveIconPath),
      androidResExists: fs.existsSync(androidResPath)
    },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'prebuild-check',
    hypothesisId: 'C'
  })
}).catch(() => {});
// #endregion

if (fs.existsSync(iconPath)) {
  const iconStats = fs.statSync(iconPath);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'debug-icon-prebuild.js:45',
      message: 'Icon file stats',
      data: {
        size: iconStats.size,
        mtime: iconStats.mtime.toISOString()
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'prebuild-check',
      hypothesisId: 'C'
    })
  }).catch(() => {});
  // #endregion
}

if (fs.existsSync(androidResPath)) {
  const launcherFiles = [];
  function findLauncherFiles(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        findLauncherFiles(filePath);
      } else if (file.includes('ic_launcher')) {
        launcherFiles.push(filePath);
      }
    });
  }
  findLauncherFiles(androidResPath);
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2e86959c-0542-444e-a106-629fb6908b3d', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'debug-icon-prebuild.js:75',
      message: 'Found launcher files in android res',
      data: {
        count: launcherFiles.length,
        files: launcherFiles.map(f => path.relative(androidResPath, f))
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'prebuild-check',
      hypothesisId: 'B'
    })
  }).catch(() => {});
  // #endregion
}
