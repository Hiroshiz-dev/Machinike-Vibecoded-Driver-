const { app, BrowserWindow, session } = require('electron');
const path = require('node:path');

// Enable WebHID and Web Bluetooth APIs for Machenike USB, 2.4 GHz, and Bluetooth controllers
app.commandLine.appendSwitch('enable-experimental-web-platform-features');
app.commandLine.appendSwitch('enable-web-bluetooth');

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 960,
    minHeight: 680,
    title: 'Machenike Hub — Controlador de Recursos & Driver',
    backgroundColor: '#0C0E12',
    icon: path.join(__dirname, '..', 'public', 'pwa-512x512.png'),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Automatically approve HID / USB / Bluetooth device permissions for local desktop usage
  const ses = session.defaultSession;
  ses.setPermissionCheckHandler((_wc, permission) => {
    return ['hid', 'usb', 'bluetooth', 'bluetoothScanning', 'clipboard-sanitized-write'].includes(
      permission
    );
  });

  ses.setDevicePermissionHandler((details) => {
    return details.deviceType === 'hid' || details.deviceType === 'usb';
  });

  ses.on('select-hid-device', (event, details, callback) => {
    event.preventDefault();
    const list = details.deviceList || [];
    if (list.length === 0) {
      callback('');
      return;
    }
    const preferred =
      list.find((d) =>
        /machenike|g5|g6|g3|g1|2\.4g|controller|gamepad/i.test(d.name || '')
      ) || list[0];
    callback(preferred.deviceId);
  });

  win.webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
    event.preventDefault();
    if (!deviceList || deviceList.length === 0) {
      callback('');
      return;
    }
    const preferred =
      deviceList.find((d) =>
        /machenike|g5|g6|g3|g1|xbox|pro controller/i.test(d.deviceName || '')
      ) || deviceList[0];
    callback(preferred.deviceId);
  });

  const devUrl = process.env.ELECTRON_START_URL;
  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createMainWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
