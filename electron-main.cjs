const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'dist', 'favicon.ico')
  });

  // 隐藏菜单栏
  win.setMenuBarVisibility(false);

  // 加载打包后的 index.html
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  console.log(`Loading index from: ${indexPath}`);
  
  win.loadFile(indexPath).catch(err => {
    console.error('Failed to load index.html:', err);
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  // 如果需要调试，可以取消注释
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
