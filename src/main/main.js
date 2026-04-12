const path = require('path');
const fs = require('fs');
const { app, BrowserWindow, ipcMain, shell, dialog, Menu } = require('electron');
const { SoundCloudService } = require('./services/soundcloud-service');
const { AppDatabase } = require('./db/database');

let mainWindow;
let sc;
let db;

const GITHUB_URL = 'https://github.com/erdboyz/SoundCloud-Desktop-Client';
const GITHUB_RELEASES_URL = `${GITHUB_URL}/releases`;

function navigateToPage(page) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow.focus();
  mainWindow.webContents.send('app:navigate', { page });
}

function buildAppMenu() {
  return Menu.buildFromTemplate([
    {
      label: 'Настройки',
      click: () => navigateToPage('settings'),
    },
    {
      label: 'О программе',
      click: () => {
        shell.openExternal(GITHUB_URL).catch(() => {});
      },
    },
    {
      label: 'Проверить обновления',
      click: () => {
        shell.openExternal(GITHUB_RELEASES_URL).catch(() => {});
      },
    },
    {
      label: 'Выход',
      role: 'quit',
    },
  ]);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1520,
    height: 940,
    minWidth: 1200,
    minHeight: 760,
    title: 'SoundCloud Desktop',
    backgroundColor: '#0b0f15',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

function handleError(error) {
  console.error(error);
  return {
    ok: false,
    error: error?.message || 'Неизвестная ошибка',
  };
}

function ok(data) {
  return { ok: true, data };
}

app.whenReady().then(() => {
  sc = new SoundCloudService();
  db = new AppDatabase();
  Menu.setApplicationMenu(buildAppMenu());
  createWindow();

  ipcMain.handle('sc:search-all', async (_, { query, limit = 10 }) => {
    try {
      return ok(await sc.searchAll(query, limit));
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('sc:search-tracks', async (_, { query, limit = 10 }) => {
    try {
      return ok(await sc.searchTracks(query, limit));
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('sc:resolve-url', async (_, { url }) => {
    try {
      return ok(await sc.resolveUrl(url));
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('sc:get-collection', async (_, { collectionId }) => {
    try {
      return ok(await sc.getCollectionById(collectionId));
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('sc:get-artist-profile', async (_, { artistId, trackLimit, collectionLimit }) => {
    try {
      return ok(await sc.getArtistProfile(artistId, { trackLimit, collectionLimit }));
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('settings:get', async () => {
    try {
      return ok(sc.getClientSettings());
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('settings:save', async (_, { settings }) => {
    try {
      return ok(sc.saveClientSettings(settings));
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('settings:test-proxy', async () => {
    try {
      return ok(await sc.testProxyConnection());
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('sc:get-stream', async (_, { trackUrl }) => {
    try {
      return ok(await sc.getStream(trackUrl));
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('sc:prepare-playback', async (_, { trackUrl, title }) => {
    try {
      return ok(await sc.preparePlayback(trackUrl, title));
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('sc:download-track', async (_, { trackUrl, title }) => {
    try {
      const tempFile = await sc.downloadTrack(trackUrl, title);
      const saveResult = await dialog.showSaveDialog(mainWindow, {
        defaultPath: path.basename(tempFile),
      });

      if (saveResult.canceled || !saveResult.filePath) {
        return ok({ canceled: true });
      }

      fs.copyFileSync(tempFile, saveResult.filePath);
      return ok({ canceled: false, filePath: saveResult.filePath });
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('library:list-favorites', async () => {
    try {
      return ok(db.listFavorites());
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('library:add-favorite', async (_, { track }) => {
    try {
      return ok(db.addFavorite(track));
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('library:remove-favorite', async (_, { trackId }) => {
    try {
      return ok(db.removeFavorite(trackId));
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('library:is-favorite', async (_, { trackId }) => {
    try {
      return ok(db.isFavorite(trackId));
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('library:add-recent', async (_, { track }) => {
    try {
      return ok(db.addRecentlyPlayed(track));
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('library:list-recent', async () => {
    try {
      return ok(db.listRecentlyPlayed());
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('library:create-playlist', async (_, { name }) => {
    try {
      return ok(db.createPlaylist(name));
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('library:list-playlists', async () => {
    try {
      return ok(db.listPlaylists());
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('library:delete-playlist', async (_, { playlistId }) => {
    try {
      return ok(db.deletePlaylist(playlistId));
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('library:add-track-to-playlist', async (_, { playlistId, track }) => {
    try {
      return ok(db.addTrackToPlaylist(playlistId, track));
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('library:get-playlist-tracks', async (_, { playlistId }) => {
    try {
      return ok(db.getPlaylistTracks(playlistId));
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('library:remove-track-from-playlist', async (_, { playlistId, trackId }) => {
    try {
      return ok(db.removeTrackFromPlaylist(playlistId, trackId));
    } catch (error) {
      return handleError(error);
    }
  });

  ipcMain.handle('library:import-soundcloud-profile', async (event, options = {}) => {
    const importId = String(options.importId || '');
    const sendImportStatus = (payload = {}) => {
      if (!importId) return;
      event.sender.send('library:import-status', {
        importId,
        ...payload,
      });
    };

    try {
      sendImportStatus({
        stage: 'start',
        progress: 4,
        message: 'Подготавливаем импорт...',
      });

      const payload = await sc.importProfileLibrary(options.profileUrl, options, sendImportStatus);

      sendImportStatus({
        stage: 'saving',
        progress: 92,
        message: 'Сохраняем импортированные треки и плейлисты...',
      });

      const result = db.importSoundCloudProfile(payload);

      sendImportStatus({
        stage: 'done',
        progress: 100,
        message: 'Импорт завершен',
        summary: result,
      });

      return ok(result);
    } catch (error) {
      sendImportStatus({
        stage: 'error',
        progress: 100,
        message: error?.message || 'Не удалось импортировать профиль SoundCloud',
      });
      return handleError(error);
    }
  });

  ipcMain.handle('shell:open-external', async (_, { url }) => {
    try {
      return ok(await shell.openExternal(url));
    } catch (error) {
      return handleError(error);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
