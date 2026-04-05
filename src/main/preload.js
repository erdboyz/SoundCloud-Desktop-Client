const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('soundcloudAPI', {
  searchAll: (query, limit) => ipcRenderer.invoke('sc:search-all', { query, limit }),
  searchTracks: (query, limit) => ipcRenderer.invoke('sc:search-tracks', { query, limit }),
  resolveUrl: (url) => ipcRenderer.invoke('sc:resolve-url', { url }),
  getStream: (trackUrl) => ipcRenderer.invoke('sc:get-stream', { trackUrl }),
  preparePlayback: (trackUrl, title) => ipcRenderer.invoke('sc:prepare-playback', { trackUrl, title }),
  downloadTrack: (trackUrl, title) => ipcRenderer.invoke('sc:download-track', { trackUrl, title }),
  library: {
    listFavorites: () => ipcRenderer.invoke('library:list-favorites'),
    addFavorite: (track) => ipcRenderer.invoke('library:add-favorite', { track }),
    removeFavorite: (trackId) => ipcRenderer.invoke('library:remove-favorite', { trackId }),
    isFavorite: (trackId) => ipcRenderer.invoke('library:is-favorite', { trackId }),
    addRecentlyPlayed: (track) => ipcRenderer.invoke('library:add-recent', { track }),
    listRecentlyPlayed: () => ipcRenderer.invoke('library:list-recent'),
    createPlaylist: (name) => ipcRenderer.invoke('library:create-playlist', { name }),
    listPlaylists: () => ipcRenderer.invoke('library:list-playlists'),
    deletePlaylist: (playlistId) => ipcRenderer.invoke('library:delete-playlist', { playlistId }),
    addTrackToPlaylist: (playlistId, track) => ipcRenderer.invoke('library:add-track-to-playlist', { playlistId, track }),
    getPlaylistTracks: (playlistId) => ipcRenderer.invoke('library:get-playlist-tracks', { playlistId }),
    removeTrackFromPlaylist: (playlistId, trackId) => ipcRenderer.invoke('library:remove-track-from-playlist', { playlistId, trackId }),
  },
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', { url }),
});
