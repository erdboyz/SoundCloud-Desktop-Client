const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const crypto = require('crypto');
const axios = require('axios');
const sanitize = require('sanitize-filename');
const { pathToFileURL } = require('url');
const { app } = require('electron');
const YTDlpWrap = require('yt-dlp-wrap').default;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  Accept: '*/*',
  Referer: 'https://soundcloud.com/',
  Origin: 'https://soundcloud.com',
};

const API_BASE_URL = 'https://api.soundcloud.com';
const OAUTH_URL = 'https://secure.soundcloud.com/oauth/token';
const TOKEN_REFRESH_MARGIN_MS = 60 * 1000;
const PROXY_HEADER_WHITELIST = [
  'content-type',
  'content-length',
  'accept-ranges',
  'content-range',
  'cache-control',
  'etag',
  'last-modified',
];

class SoundCloudService {
  constructor() {
    this.ytDlpBinaryPath = this.resolveYtDlpBinaryPath();
    this.ytDlp = this.ytDlpBinaryPath ? new YTDlpWrap(this.ytDlpBinaryPath) : new YTDlpWrap();
    this.cacheDir = path.join(os.tmpdir(), 'soundcloud-electron-client');
    this.playbackCacheDir = path.join(this.cacheDir, 'playback');
    this.streamTokens = new Map();
    this.playlistDetailsCache = new Map();
    this.artistProfileCache = new Map();
    this.streamServer = null;
    this.streamServerPort = null;
    this.streamServerPromise = null;
    this.apiCredentials = this.loadApiCredentials();
    this.settingsPath = path.join(app?.getPath?.('userData') || process.cwd(), 'soundcloud-client-settings.json');
    this.clientSettings = this.loadClientSettings();
    this.tokenCachePath = path.join(app?.getPath?.('userData') || process.cwd(), 'soundcloud-app-token.json');
    this.tokenState = this.loadTokenState();
    this.tokenRequestPromise = null;

    fs.mkdirSync(this.cacheDir, { recursive: true });
    fs.mkdirSync(this.playbackCacheDir, { recursive: true });
  }

  resolveYtDlpBinaryPath() {
    if (!app?.isPackaged) {
      return '';
    }

    const candidates = [
      process.resourcesPath ? path.join(process.resourcesPath, 'bin', 'yt-dlp.exe') : '',
      app?.getAppPath?.() ? path.join(path.dirname(app.getAppPath()), 'bin', 'yt-dlp.exe') : '',
    ].filter(Boolean);

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    console.warn('Packaged yt-dlp.exe was not found in application resources.');
    return '';
  }

  normalizeCredentialValue(value) {
    const normalized = String(value || '').trim();
    if (!normalized) return '';
    if (/^(YOUR_|your_)/.test(normalized)) return '';
    return normalized;
  }

  mergeCredentials(base = {}, next = {}) {
    return {
      clientId: this.normalizeCredentialValue(next.clientId || next.client_id) || base.clientId || '',
      clientSecret: this.normalizeCredentialValue(next.clientSecret || next.client_secret) || base.clientSecret || '',
      redirectUri: this.normalizeCredentialValue(next.redirectUri || next.redirect_uri) || base.redirectUri || '',
    };
  }

  parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return {};
    const env = {};
    const content = fs.readFileSync(filePath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex <= 0) return;
      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      env[key] = rawValue.replace(/^["']|["']$/g, '');
    });
    return env;
  }

  loadApiCredentials() {
    let credentials = this.mergeCredentials({}, {
      clientId: process.env.SOUNDCLOUD_CLIENT_ID,
      clientSecret: process.env.SOUNDCLOUD_CLIENT_SECRET,
      redirectUri: process.env.SOUNDCLOUD_REDIRECT_URI,
    });

    const cwd = process.cwd();
    const appPath = app?.getAppPath?.() || cwd;
    const envCandidates = [
      path.join(cwd, '.env'),
      path.join(cwd, '.env.local'),
      path.join(appPath, '.env'),
      path.join(appPath, '.env.local'),
    ];

    envCandidates.forEach((filePath) => {
      try {
        const parsed = this.parseEnvFile(filePath);
        credentials = this.mergeCredentials(credentials, {
          clientId: parsed.SOUNDCLOUD_CLIENT_ID,
          clientSecret: parsed.SOUNDCLOUD_CLIENT_SECRET,
          redirectUri: parsed.SOUNDCLOUD_REDIRECT_URI,
        });
      } catch (error) {
        console.warn(`Failed to read env file ${filePath}:`, error.message);
      }
    });

    const configCandidates = [
      path.join(cwd, 'soundcloud.config.json'),
      path.join(cwd, 'soundcloud.config.local.json'),
      path.join(cwd, 'soundcloud.config.example.json'),
      path.join(appPath, 'soundcloud.config.json'),
      path.join(appPath, 'soundcloud.config.local.json'),
      path.join(appPath, 'soundcloud.config.example.json'),
    ];

    configCandidates.forEach((filePath) => {
      try {
        if (!fs.existsSync(filePath)) return;
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        credentials = this.mergeCredentials(credentials, raw);
      } catch (error) {
        console.warn(`Failed to read SoundCloud config from ${filePath}:`, error.message);
      }
    });

    return credentials;
  }

  hasOfficialApiConfig() {
    return Boolean(this.apiCredentials.clientId && this.apiCredentials.clientSecret);
  }

  normalizeBackendUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const withProtocol = /^https?:\/\//i.test(raw)
      ? raw
      : (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?/i.test(raw) ? `http://${raw}` : `https://${raw}`);
    return withProtocol.replace(/\/+$/, '');
  }

  normalizeClientSettings(settings = {}) {
    return {
      backendUrl: this.normalizeBackendUrl(settings.backendUrl || settings.backend_url),
      accessKey: this.normalizeCredentialValue(settings.accessKey || settings.access_key || settings.backendAccessKey),
    };
  }

  loadClientSettings() {
    try {
      if (!fs.existsSync(this.settingsPath)) {
        return this.normalizeClientSettings({});
      }
      return this.normalizeClientSettings(JSON.parse(fs.readFileSync(this.settingsPath, 'utf8')));
    } catch (error) {
      console.warn('Failed to read client settings:', error.message);
      return this.normalizeClientSettings({});
    }
  }

  getClientSettings() {
    return { ...this.clientSettings };
  }

  saveClientSettings(settings = {}) {
    this.clientSettings = this.normalizeClientSettings(settings);
    try {
      fs.mkdirSync(path.dirname(this.settingsPath), { recursive: true });
      fs.writeFileSync(this.settingsPath, JSON.stringify(this.clientSettings, null, 2), 'utf8');
    } catch (error) {
      console.warn('Failed to persist client settings:', error.message);
      throw new Error('Не удалось сохранить настройки клиента');
    }

    this.playlistDetailsCache.clear();
    this.artistProfileCache.clear();
    return this.getClientSettings();
  }

  hasProxyConfig() {
    return Boolean(this.clientSettings?.backendUrl);
  }

  buildProxyUrl(endpoint, params = {}) {
    if (!this.hasProxyConfig()) {
      throw new Error('Backend URL не настроен');
    }

    const base = new URL(this.clientSettings.backendUrl);
    const basePath = base.pathname.replace(/\/+$/, '').replace(/\/$/, '');
    let endpointPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    if (basePath.endsWith('/api') && endpointPath.startsWith('/api/')) {
      endpointPath = endpointPath.slice('/api'.length);
    }

    const url = new URL(`${basePath}${endpointPath}`, base.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'undefined' || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
    return url.toString();
  }

  async proxyGet(endpoint, params = {}) {
    const headers = { accept: 'application/json; charset=utf-8' };
    if (this.clientSettings.accessKey) {
      headers['X-App-Key'] = this.clientSettings.accessKey;
    }

    try {
      const response = await axios.get(this.buildProxyUrl(endpoint, params), {
        headers,
        timeout: 20000,
      });
      return response.data;
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || 'Proxy request failed';
      throw new Error(`Backend proxy: ${message}`);
    }
  }

  async testProxyConnection() {
    if (!this.hasProxyConfig()) {
      throw new Error('Укажите Backend URL перед проверкой');
    }

    const health = await this.proxyGet('/api/health');
    return {
      ...health,
      backendUrl: this.clientSettings.backendUrl,
      hasAccessKey: Boolean(this.clientSettings.accessKey),
    };
  }

  loadTokenState() {
    try {
      if (!fs.existsSync(this.tokenCachePath)) return null;
      const parsed = JSON.parse(fs.readFileSync(this.tokenCachePath, 'utf8'));
      if (!parsed?.accessToken) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  saveTokenState() {
    try {
      if (!this.tokenState) {
        if (fs.existsSync(this.tokenCachePath)) {
          fs.unlinkSync(this.tokenCachePath);
        }
        return;
      }
      fs.writeFileSync(this.tokenCachePath, JSON.stringify(this.tokenState, null, 2), 'utf8');
    } catch (error) {
      console.warn('Failed to persist SoundCloud token cache:', error.message);
    }
  }

  isTokenValid() {
    return Boolean(
      this.tokenState?.accessToken &&
      Number(this.tokenState.expiresAt || 0) > Date.now() + TOKEN_REFRESH_MARGIN_MS
    );
  }

  buildBasicAuthHeader() {
    const auth = `${this.apiCredentials.clientId}:${this.apiCredentials.clientSecret}`;
    return `Basic ${Buffer.from(auth).toString('base64')}`;
  }

  async requestClientCredentialsToken() {
    const params = new URLSearchParams();
    params.set('grant_type', 'client_credentials');

    const response = await axios.post(OAUTH_URL, params.toString(), {
      headers: {
        accept: 'application/json; charset=utf-8',
        'content-type': 'application/x-www-form-urlencoded',
        Authorization: this.buildBasicAuthHeader(),
      },
      timeout: 20000,
    });

    return response.data;
  }

  async refreshAccessToken(refreshToken) {
    const params = new URLSearchParams();
    params.set('grant_type', 'refresh_token');
    params.set('client_id', this.apiCredentials.clientId);
    params.set('client_secret', this.apiCredentials.clientSecret);
    params.set('refresh_token', refreshToken);

    const response = await axios.post(OAUTH_URL, params.toString(), {
      headers: {
        accept: 'application/json; charset=utf-8',
        'content-type': 'application/x-www-form-urlencoded',
      },
      timeout: 20000,
    });

    return response.data;
  }

  applyTokenPayload(payload) {
    this.tokenState = {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token || '',
      expiresAt: Date.now() + (Number(payload.expires_in || 3600) * 1000),
      scope: payload.scope || '',
    };
    this.saveTokenState();
  }

  async ensureApiToken() {
    if (!this.hasOfficialApiConfig()) {
      throw new Error('Не настроены SOUNDCLOUD_CLIENT_ID и SOUNDCLOUD_CLIENT_SECRET');
    }

    if (this.isTokenValid()) {
      return this.tokenState.accessToken;
    }

    if (this.tokenRequestPromise) {
      return this.tokenRequestPromise;
    }

    this.tokenRequestPromise = (async () => {
      try {
        let payload;
        if (this.tokenState?.refreshToken) {
          try {
            payload = await this.refreshAccessToken(this.tokenState.refreshToken);
          } catch (error) {
            payload = await this.requestClientCredentialsToken();
          }
        } else {
          payload = await this.requestClientCredentialsToken();
        }

        this.applyTokenPayload(payload);
        return this.tokenState.accessToken;
      } finally {
        this.tokenRequestPromise = null;
      }
    })();

    return this.tokenRequestPromise;
  }

  async apiGet(endpoint, params = {}) {
    const token = await this.ensureApiToken();
    const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
      params,
      headers: {
        accept: 'application/json; charset=utf-8',
        Authorization: `OAuth ${token}`,
      },
      timeout: 20000,
    });
    return response.data;
  }

  async execYtDlp(args) {
    try {
      const output = await this.ytDlp.execPromise(args);
      return output;
    } catch (error) {
      const message = String(error?.message || '');

      if (app?.isPackaged && (!this.ytDlpBinaryPath || /not found|ENOENT/i.test(message))) {
        throw new Error('Во встроенной версии приложения не найден yt-dlp.exe. Проверьте, что файл попал в resources/bin.');
      }

      throw error;
    }
  }

  async extractInfo(urlOrSearch, extraArgs = [], options = {}) {
    const args = [
      '--dump-single-json',
      '--no-warnings',
      '--skip-download',
      '--add-header', `User-Agent:${HEADERS['User-Agent']}`,
      '--add-header', `Accept-Language:${HEADERS['Accept-Language']}`,
    ];

    if (!options.allowPlaylist) {
      args.push('--no-playlist');
    }

    args.push(...extraArgs, urlOrSearch);
    const output = await this.execYtDlp(args);
    return JSON.parse(output);
  }

  normalizeDuration(value) {
    const duration = Number(value || 0);
    if (duration > 10000) {
      return Math.round(duration / 1000);
    }
    return duration;
  }

  unwrapTrackPayload(info) {
    if (!info || typeof info !== 'object' || Array.isArray(info)) {
      return info;
    }

    if (info.track && typeof info.track === 'object' && !Array.isArray(info.track)) {
      return info.track;
    }

    return info;
  }

  trackNeedsMetadataHydration(track = {}) {
    const title = String(track.title || '').trim();
    const uploader = String(track.uploader || track.artist || '').trim();
    return Boolean(
      track?.webpage_url &&
      (
        !title ||
        title === 'Без названия' ||
        !uploader ||
        uploader === 'Неизвестный артист' ||
        !track?.thumbnail
      )
    );
  }

  async hydrateTracksMetadata(tracks = []) {
    const normalizedTracks = this.normalizeTrackList(tracks);

    const hydrated = await Promise.all(normalizedTracks.map(async (track) => {
      if (!this.trackNeedsMetadataHydration(track)) {
        return track;
      }

      try {
        const resolved = await this.resolveUrl(track.webpage_url);
        if (resolved?.kind === 'track' && resolved.track) {
          return this.normalizeTrack({
            ...track,
            ...resolved.track,
          });
        }
      } catch {}

      return track;
    }));

    return this.normalizeTrackList(hydrated);
  }

  normalizeTrack(info) {
    const source = this.unwrapTrackPayload(info) || {};
    const artwork = source.thumbnail || source.artwork_url || source.user?.avatar_url || '';
    return {
      id: String(source.id || info?.id || ''),
      title: info.title || 'Без названия',
      uploader:
        source.uploader ||
        source.artist ||
        source.user?.username ||
        source.user?.full_name ||
        source.publisher_metadata?.artist ||
        'Неизвестный артист',
      title: source.title || info.title || 'Без названия',
      uploader: source.uploader || source.artist || source.user?.username || source.user?.full_name || info?.uploader || info?.artist || 'Неизвестный артист',
      duration: this.normalizeDuration(source.duration || source.full_duration),
      thumbnail: artwork ? artwork.replace('-large', '-t500x500') : '',
      webpage_url: source.webpage_url || source.permalink_url || source.original_url || '',
      stream_url: source.url || '',
      description: source.description || '',
      genre: source.genre || '',
      view_count: Number(source.view_count || source.playback_count || 0),
      like_count: Number(source.like_count || source.favoritings_count || source.likes_count || 0),
      artist_id: String(source.artist_id || source.user?.id || ''),
      kind: 'track',
      raw: source.raw || source,
    };
  }

  normalizePlaylist(info, options = {}) {
    const artwork = info.thumbnail || info.artwork_url || info.user?.avatar_url || '';
    const kind = options.kind || this.inferCollectionKind(info);
    return {
      id: String(info.id || ''),
      title: info.title || 'Без названия',
      uploader: info.uploader || info.artist || info.user?.username || info.user?.full_name || 'SoundCloud',
      webpage_url: info.webpage_url || info.permalink_url || '',
      thumbnail: artwork ? artwork.replace('-large', '-t500x500') : '',
      track_count: Number(info.track_count || (Array.isArray(info.tracks) ? info.tracks.length : 0)),
      description: info.description || '',
      kind,
      raw: info,
    };
  }

  normalizeArtist(info) {
    const artwork = info.thumbnail || info.avatar_url || '';
    const title = info.title || info.username || info.full_name || 'Без названия';
    return {
      id: String(info.id || ''),
      title,
      uploader: info.uploader || info.full_name || info.username || title || 'SoundCloud',
      webpage_url: info.webpage_url || info.permalink_url || '',
      thumbnail: artwork ? artwork.replace('-large', '-t500x500') : '',
      followers: Number(info.followers || info.followers_count || 0),
      description: info.description || '',
      kind: 'artist',
      raw: info,
    };
  }

  normalizeProxyCollection(info = {}) {
    const tracks = this.normalizeTrackList(info.tracks || info.entries || []);
    const normalized = this.normalizePlaylist(info, {
      kind: info.kind === 'album' ? 'album' : undefined,
    });

    return {
      ...normalized,
      track_count: Number(info.track_count || tracks.length || 0),
      tracks,
      entries: tracks,
    };
  }

  collectProxyCollections(data = {}) {
    return [
      ...(Array.isArray(data.playlists) ? data.playlists : []),
      ...(Array.isArray(data.albums) ? data.albums : []),
      ...(Array.isArray(data.collections) ? data.collections : []),
      ...(Array.isArray(data.sets) ? data.sets : []),
    ];
  }

  splitProxyCollections(items = [], limit = 10) {
    const safeLimit = Math.min(Math.max(Number(limit || 10), 1), 100);
    const playlists = [];
    const albums = [];
    const seen = new Set();

    items.forEach((item) => {
      const normalized = this.normalizeProxyCollection(item);
      const key = normalized.id || normalized.webpage_url || `${normalized.title}:${normalized.uploader}`;
      if (!key || seen.has(key)) return;
      seen.add(key);

      if (normalized.kind === 'album') {
        albums.push(normalized);
        return;
      }

      playlists.push(normalized);
    });

    return {
      playlists: playlists.slice(0, safeLimit),
      albums: albums.slice(0, safeLimit),
    };
  }

  normalizeProxySearchPayload(data = {}, limit = 10) {
    const collections = this.splitProxyCollections(this.collectProxyCollections(data), limit);
    return {
      tracks: this.normalizeTrackList(data.tracks || []).slice(0, limit),
      playlists: collections.playlists,
      albums: collections.albums,
      artists: (data.artists || []).map((item) => this.normalizeArtist(item)).filter((item) => item.id || item.webpage_url).slice(0, limit),
    };
  }

  normalizeProxyArtistProfile(data = {}, options = {}) {
    const trackLimit = Math.min(Math.max(Number(options.trackLimit || 25), 1), 100);
    const collectionLimit = Math.min(Math.max(Number(options.collectionLimit || 25), 1), 100);
    const collections = this.splitProxyCollections(this.collectProxyCollections(data), collectionLimit);

    return {
      ...this.normalizeArtist(data),
      tracks: this.normalizeTrackList(data.tracks || []).slice(0, trackLimit),
      playlists: collections.playlists,
      albums: collections.albums,
    };
  }

  normalizeProxyProfileImportPayload(data = {}) {
    const profile = this.normalizeArtist(data.profile || data.artist || {});
    const playlists = (Array.isArray(data.playlists) ? data.playlists : [])
      .map((item) => this.normalizeProxyCollection(item))
      .filter((item) => item?.kind === 'playlist');

    return {
      profile: {
        ...profile,
        kind: 'artist',
      },
      likes: this.normalizeTrackList(data.likes || data.tracks || []),
      playlists,
    };
  }

  normalizeProxyResolvedResource(data = {}, fallbackUrl = '') {
    if (data.kind === 'playlist' || data.kind === 'album') {
      const collection = this.normalizeProxyCollection(data);
      return {
        ...collection,
        webpage_url: collection.webpage_url || fallbackUrl,
      };
    }

    if (data.kind === 'artist') {
      return this.normalizeProxyArtistProfile(data);
    }

    if (data.kind === 'track') {
      return {
        kind: 'track',
        track: this.normalizeTrack({
          ...data,
          webpage_url: data.webpage_url || fallbackUrl,
        }),
      };
    }

    return data;
  }

  isAlbumPlaylist(info) {
    const source = info?.raw?.raw || info?.raw || info || {};
    const setType = String(info?.set_type || source?.set_type || '').toLowerCase();
    const displayDateType = String(info?.display_date_type || source?.display_date_type || '').toLowerCase();
    return Boolean(info?.is_album || source?.is_album || setType === 'album' || displayDateType === 'album');
  }

  inferCollectionKind(info) {
    if (this.isAlbumPlaylist(info)) {
      return 'album';
    }
    if (this.looksLikeAlbum(info)) {
      return 'album';
    }
    return 'playlist';
  }

  looksLikeAlbum(info) {
    const source = info?.raw?.raw || info?.raw || info || {};
    const tracks = Array.isArray(info?.tracks) ? info.tracks.filter(Boolean) : [];
    if (tracks.length < 2) {
      return false;
    }

    const title = String(info?.title || '').trim();
    if (/\b(selections?|mix|workout|radio|favorites?|favourites?|chart|best of|top \d+)\b/i.test(title)) {
      return false;
    }

    const ownerId = String(info?.user?.id || source?.user?.id || '');
    const ownedTracks = ownerId
      ? tracks.filter((track) => {
        const trackSource = track?.raw?.raw || track?.raw || track || {};
        return String(track?.user?.id || trackSource?.user?.id || '') === ownerId;
      }).length
      : 0;
    const ownedRatio = ownedTracks / tracks.length;

    const hasPlaylistReleaseDate = Boolean(
      info?.release_year ||
      info?.release_month ||
      info?.release_day ||
      source?.release_year ||
      source?.release_month ||
      source?.release_day
    );
    const tracksWithReleaseDate = tracks.filter((track) => (
      track?.release_year ||
      track?.release_month ||
      track?.release_day ||
      track?.raw?.release_year ||
      track?.raw?.release_month ||
      track?.raw?.release_day ||
      track?.raw?.raw?.release_year ||
      track?.raw?.raw?.release_month ||
      track?.raw?.raw?.release_day
    )).length;
    const hasTrackReleaseSignal = tracksWithReleaseDate >= Math.max(2, Math.ceil(tracks.length * 0.6));
    const hasTitleSignal = /\b(album|lp|ep)\b/i.test(title);

    return ownedRatio >= 0.8 && (hasPlaylistReleaseDate || hasTrackReleaseSignal || hasTitleSignal);
  }

  normalizeTrackList(entries = []) {
    const seen = new Set();
    const normalized = [];

    entries.forEach((entry) => {
      if (!entry) return;
      const track = this.normalizeTrack(entry);
      const key = track.id || track.webpage_url || `${track.title}:${track.uploader}`;
      if (!key || seen.has(key)) return;
      seen.add(key);
      normalized.push(track);
    });

    return normalized;
  }

  unwrapCollection(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.collection)) return data.collection;
    return [];
  }

  buildSearchVariants(query) {
    const trimmed = String(query || '').trim();
    if (!trimmed) return [];

    const parts = trimmed
      .split(/\s+/)
      .map((part) => part.trim())
      .filter((part) => part.length >= 3);

    const variants = [trimmed];
    [...new Set(parts)].forEach((part) => variants.push(part));
    return [...new Set(variants)];
  }

  async searchApiWithVariants(endpoint, query, limit, normalizer) {
    const variants = this.buildSearchVariants(query);
    const found = [];
    const seenIds = new Set();

    for (const variant of variants) {
      const data = await this.apiGet(endpoint, {
        q: variant,
        limit: Math.min(Math.max(Number(limit || 10), 1), 50),
      });

      this.unwrapCollection(data).forEach((item) => {
        const normalized = normalizer.call(this, item);
        if (!normalized?.id || seenIds.has(normalized.id)) return;
        seenIds.add(normalized.id);
        found.push(normalized);
      });

      if (found.length >= limit) {
        break;
      }
    }

    return found.slice(0, limit);
  }

  async searchTracksViaApi(query, limit = 10) {
    return this.searchApiWithVariants('/tracks', query, limit, this.normalizeTrack);
  }

  async searchPlaylistsViaApi(query, limit = 10) {
    return this.searchApiWithVariants('/playlists', query, limit, this.normalizePlaylist);
  }

  async searchArtistsViaApi(query, limit = 10) {
    return this.searchApiWithVariants('/users', query, limit, this.normalizeArtist);
  }

  async searchSetsViaApi(query, limit = 10) {
    const candidateLimit = Math.min(Math.max(Number(limit || 10) * 4, 12), 40);
    const candidates = await this.searchApiWithVariants('/playlists', query, candidateLimit, this.normalizePlaylist);
    const resolved = await Promise.all(
      candidates.map(async (item) => {
        try {
          return await this.getCollectionById(item.id);
        } catch {
          return item;
        }
      })
    );

    const playlists = [];
    const albums = [];
    const seen = new Set();

    resolved.forEach((item) => {
      if (!item?.id || seen.has(item.id)) return;
      seen.add(item.id);
      if (item.kind === 'album') {
        albums.push(item);
      } else {
        playlists.push(item);
      }
    });

    return {
      playlists: playlists.slice(0, limit),
      albums: albums.slice(0, limit),
    };
  }

  async getCollectionById(collectionId) {
    const cacheKey = String(collectionId || '').trim();
    if (!cacheKey) {
      throw new Error('Не удалось определить плейлист для открытия');
    }

    if (this.playlistDetailsCache.has(cacheKey)) {
      return this.playlistDetailsCache.get(cacheKey);
    }

    if (this.hasProxyConfig()) {
      const data = await this.proxyGet('/api/playlist', { id: cacheKey });
      const payload = this.normalizeProxyCollection(data);
      this.playlistDetailsCache.set(cacheKey, payload);
      return payload;
    }

    const data = await this.apiGet(`/playlists/${encodeURIComponent(cacheKey)}`);
    const tracks = this.normalizeTrackList(data.tracks || []);
    const payload = {
      ...this.normalizePlaylist(data),
      track_count: Number(data.track_count || tracks.length || 0),
      tracks,
    };

    this.playlistDetailsCache.set(cacheKey, payload);
    return payload;
  }

  async getArtistProfile(artistId, options = {}) {
    const trackLimit = Math.min(Math.max(Number(options.trackLimit || 25), 1), 100);
    const collectionLimit = Math.min(Math.max(Number(options.collectionLimit || 25), 1), 100);
    const normalizedArtistId = String(artistId || '').trim();
    const cacheKey = `${normalizedArtistId}:${trackLimit}:${collectionLimit}`;

    if (!normalizedArtistId) {
      throw new Error('Не удалось определить артиста для открытия');
    }

    if (this.artistProfileCache.has(cacheKey)) {
      return this.artistProfileCache.get(cacheKey);
    }

    if (this.hasProxyConfig()) {
      const data = await this.proxyGet('/api/artist', {
        id: normalizedArtistId,
        trackLimit,
        collectionLimit,
      });
      const payload = this.normalizeProxyArtistProfile(data, { trackLimit, collectionLimit });
      this.artistProfileCache.set(cacheKey, payload);
      return payload;
    }

    const [user, trackData, playlistData] = await Promise.all([
      this.apiGet(`/users/${encodeURIComponent(normalizedArtistId)}`),
      this.apiGet(`/users/${encodeURIComponent(normalizedArtistId)}/tracks`, { limit: trackLimit }),
      this.apiGet(`/users/${encodeURIComponent(normalizedArtistId)}/playlists`, { limit: collectionLimit }),
    ]);

    const tracks = this.normalizeTrackList(this.unwrapCollection(trackData));
    const rawCollections = this.unwrapCollection(playlistData)
      .map((item) => this.normalizePlaylist(item))
      .filter((item) => item?.id);

    const detailedCollections = await Promise.all(
      rawCollections.map(async (item) => {
        try {
          return await this.getCollectionById(item.id);
        } catch {
          return item;
        }
      })
    );

    const playlists = [];
    const albums = [];
    const seen = new Set();

    detailedCollections.forEach((item) => {
      if (!item?.id || seen.has(item.id)) return;
      seen.add(item.id);
      if (item.kind === 'album') {
        albums.push(item);
      } else {
        playlists.push(item);
      }
    });

    const payload = {
      ...this.normalizeArtist(user),
      tracks: tracks.slice(0, trackLimit),
      playlists: playlists.slice(0, collectionLimit),
      albums: albums.slice(0, collectionLimit),
    };

    this.artistProfileCache.set(cacheKey, payload);
    return payload;
  }

  async legacySearchTracks(query, limit = 10) {
    const data = await this.extractInfo(`scsearch${limit}:${query}`, ['--default-search', 'scsearch']);
    const entries = Array.isArray(data.entries) ? data.entries : [];
    return entries
      .filter((item) => item && item.extractor_key === 'Soundcloud' && item._type !== 'playlist' && item._type !== 'multi_video')
      .map((item) => this.normalizeTrack(item));
  }

  async fetchHtml(url) {
    const response = await axios.get(url, { headers: HEADERS, timeout: 20000 });
    return response.data;
  }

  extractHydration(html) {
    const marker = 'window.__sc_hydration';
    const idx = html.indexOf(marker);
    if (idx === -1) return [];
    const start = html.indexOf('[', idx);
    if (start === -1) return [];
    let depth = 0;
    for (let i = start; i < html.length; i += 1) {
      const ch = html[i];
      if (ch === '[') depth += 1;
      if (ch === ']') {
        depth -= 1;
        if (depth === 0) {
          try {
            return JSON.parse(html.slice(start, i + 1));
          } catch {
            return [];
          }
        }
      }
    }
    return [];
  }

  parseSets(html) {
    const hydration = this.extractHydration(html);
    const items = [];
    hydration.forEach((entry) => {
      const collection = entry?.data?.collection;
      if (!Array.isArray(collection)) return;
      collection.forEach((item) => {
        if (item.kind !== 'playlist') return;
        items.push({
          id: String(item.id || ''),
          title: item.title || '',
          uploader: item.user?.username || '',
          webpage_url: item.permalink_url || '',
          thumbnail: (item.artwork_url || '').replace('-large', '-t300x300'),
          track_count: Number(item.track_count || 0),
          is_album: Boolean(item.is_album),
          kind: 'playlist',
        });
      });
    });
    return {
      playlists: items.filter((item) => !item.is_album),
      albums: items.filter((item) => item.is_album),
    };
  }

  parsePeople(html) {
    const hydration = this.extractHydration(html);
    const items = [];
    hydration.forEach((entry) => {
      const collection = entry?.data?.collection;
      if (!Array.isArray(collection)) return;
      collection.forEach((item) => {
        if (item.kind !== 'user') return;
        items.push({
          id: String(item.id || ''),
          title: item.username || '',
          uploader: item.full_name || item.username || '',
          webpage_url: item.permalink_url || '',
          thumbnail: (item.avatar_url || '').replace('-large', '-t300x300'),
          followers: Number(item.followers_count || 0),
          description: item.description || '',
          kind: 'artist',
        });
      });
    });
    return items;
  }

  normalizeProfileUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) {
      throw new Error('Укажите ссылку на профиль SoundCloud');
    }

    let url;
    try {
      url = new URL(raw);
    } catch {
      throw new Error('Ссылка на профиль SoundCloud выглядит некорректно');
    }

    if (!/soundcloud\.com$/i.test(url.hostname)) {
      throw new Error('Нужна ссылка вида https://soundcloud.com/username');
    }

    const segments = url.pathname.split('/').filter(Boolean);
    if (!segments.length) {
      throw new Error('Не удалось определить профиль SoundCloud по этой ссылке');
    }

    const root = String(segments[0] || '').toLowerCase();
    const reserved = new Set([
      'discover',
      'search',
      'stream',
      'upload',
      'you',
      'charts',
      'stations',
      'genres',
      'people',
      'terms-of-use',
      'privacy',
    ]);

    if (reserved.has(root)) {
      throw new Error('Нужна прямая ссылка именно на профиль пользователя SoundCloud');
    }

    return `${url.origin}/${segments[0]}`;
  }

  parseProfileArtist(html, fallbackUrl = '') {
    const hydration = this.extractHydration(html);
    const candidates = [];
    const seen = new Set();

    const pushCandidate = (value) => {
      if (!value || value.kind !== 'user') return;
      const normalized = this.normalizeArtist({
        ...value,
        permalink_url: value.permalink_url || fallbackUrl,
      });
      const key = normalized.id || normalized.webpage_url || normalized.title;
      if (!key || seen.has(key)) return;
      seen.add(key);
      candidates.push(normalized);
    };

    hydration.forEach((entry) => {
      pushCandidate(entry?.data);
      pushCandidate(entry?.data?.user);

      const collection = entry?.data?.collection;
      if (Array.isArray(collection)) {
        collection.forEach(pushCandidate);
      }
    });

    return candidates[0] || null;
  }

  isTrackImportCandidate(entry) {
    const candidate = this.unwrapTrackPayload(entry);
    if (!candidate) return false;
    if (entry?._type === 'url') return false;
    if (candidate?._type === 'url') return false;

    const kind = String(candidate.kind || candidate?._type || '').toLowerCase();
    if (kind === 'playlist' || kind === 'album' || kind === 'user' || kind === 'artist') {
      return false;
    }

    if (candidate.tracks || candidate.track_count) {
      return false;
    }

    const hasLink = Boolean(candidate.webpage_url || candidate.permalink_url || candidate.original_url);
    const hasAuthor = Boolean(candidate.user?.username || candidate.user?.full_name || candidate.artist || candidate.uploader);
    const hasMedia = Boolean(candidate.duration || candidate.full_duration || candidate.media || candidate.streamable || candidate.artwork_url || candidate.thumbnail);
    const hasTitle = Boolean(String(candidate.title || '').trim());

    if (!candidate.id) {
      return false;
    }

    return Boolean(
      hasLink ||
      (hasTitle && hasAuthor) ||
      (hasTitle && hasMedia)
    );
  }

  extractLikedTracks(entries = []) {
    const tracks = [];
    const visited = new WeakSet();

    const visit = (value) => {
      if (!value) return;

      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }

      if (typeof value !== 'object') {
        return;
      }

      if (visited.has(value)) {
        return;
      }
      visited.add(value);

      const candidate = this.unwrapTrackPayload(value);
      if (this.isTrackImportCandidate(candidate)) {
        tracks.push(candidate);
      }

      Object.values(value).forEach(visit);
    };

    visit(entries);
    return this.normalizeTrackList(tracks);
  }

  parseProfilePlaylists(html) {
    const hydration = this.extractHydration(html);
    const playlists = [];
    const seen = new Set();
    const visited = new WeakSet();

    const visit = (value) => {
      if (!value) return;

      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }

      if (typeof value !== 'object') {
        return;
      }

      if (visited.has(value)) {
        return;
      }
      visited.add(value);

      if (value.kind === 'playlist') {
        const normalized = this.normalizePlaylist(value);
        if (normalized.kind === 'playlist') {
          const key = normalized.id || normalized.webpage_url || normalized.title;
          if (key && !seen.has(key)) {
            seen.add(key);
            playlists.push(normalized);
          }
        }
      }

      Object.values(value).forEach(visit);
    };

    visit(hydration);

    return playlists;
  }

  extractTracksFromResolvedResource(resource) {
    if (!resource) return [];

    if (resource.kind === 'track' && resource.track) {
      return this.normalizeTrackList([resource.track]);
    }

    if (Array.isArray(resource.tracks) || Array.isArray(resource.entries)) {
      return this.extractLikedTracks(resource.tracks || resource.entries || []);
    }

    return this.extractLikedTracks(resource);
  }

  dedupeCollections(collections = []) {
    const seen = new Set();
    const result = [];

    collections.forEach((item) => {
      if (!item) return;
      const key = item.id || item.webpage_url || item.title;
      if (!key || seen.has(key)) return;
      seen.add(key);
      result.push(item);
    });

    return result;
  }

  async resolveProfileArtist(profileUrl) {
    const normalizedUrl = this.normalizeProfileUrl(profileUrl);

    try {
      const resolved = await this.resolveUrl(normalizedUrl);
      if (resolved?.kind === 'artist' && resolved.id) {
        return {
          profileUrl: normalizedUrl,
          artist: {
            ...resolved,
            webpage_url: resolved.webpage_url || normalizedUrl,
          },
        };
      }
    } catch {}

    const html = await this.fetchHtml(normalizedUrl);
    const artist = this.parseProfileArtist(html, normalizedUrl);
    if (!artist?.id) {
      throw new Error('Не удалось определить профиль SoundCloud для импорта');
    }

    return {
      profileUrl: normalizedUrl,
      artist: {
        ...artist,
        webpage_url: artist.webpage_url || normalizedUrl,
      },
    };
  }

  async getProfileLikes(profileUrl, artistId = '') {
    const likesUrl = `${profileUrl.replace(/\/+$/, '')}/likes`;

    try {
      const html = await this.fetchHtml(likesUrl);
      const hydratedTracks = this.extractLikedTracks(this.extractHydration(html));
      if (hydratedTracks.length) {
        return this.hydrateTracksMetadata(hydratedTracks);
      }
    } catch {}

    try {
      const resolved = await this.resolveUrl(likesUrl);
      const resolvedTracks = this.extractTracksFromResolvedResource(resolved);
      if (resolvedTracks.length) {
        return this.hydrateTracksMetadata(resolvedTracks);
      }
    } catch {}

    if (artistId && this.hasOfficialApiConfig()) {
      try {
        const data = await this.apiGet(`/users/${encodeURIComponent(String(artistId))}/likes/tracks`, {
          access: 'playable,preview,blocked',
          limit: 200,
        });
        const apiTracks = this.extractLikedTracks(this.unwrapCollection(data));
        if (apiTracks.length) {
          return this.hydrateTracksMetadata(apiTracks);
        }
      } catch {}
    }

    const data = await this.extractInfo(likesUrl, [], { allowPlaylist: true });
    const entries = Array.isArray(data?.entries)
      ? data.entries
      : Array.isArray(data?.tracks)
        ? data.tracks
        : this.unwrapCollection(data);
    const extractedTracks = this.extractLikedTracks(entries);
    if (extractedTracks.length) {
      return this.hydrateTracksMetadata(extractedTracks);
    }

    throw new Error('Не удалось получить открытые лайки этого профиля');
  }

  async getProfilePlaylists(profileUrl, artistId) {
    try {
      const artist = await this.getArtistProfile(artistId, {
        trackLimit: 1,
        collectionLimit: 100,
      });

      const collections = await Promise.all(
        (artist.playlists || []).map(async (playlist) => {
          try {
            return await this.getCollectionById(playlist.id);
          } catch {
            return playlist;
          }
        })
      );

      return this.dedupeCollections(collections.filter((item) => item?.kind === 'playlist'));
    } catch {
      const html = await this.fetchHtml(`${profileUrl.replace(/\/+$/, '')}/sets`);
      const parsed = this.parseProfilePlaylists(html);
      const collections = await Promise.all(
        parsed.map(async (playlist) => {
          try {
            return await this.getCollectionById(playlist.id);
          } catch {
            return playlist;
          }
        })
      );
      return this.dedupeCollections(collections.filter((item) => item?.kind === 'playlist'));
    }
  }

  async importProfileLibrary(profileUrl, options = {}, reportProgress = null) {
    const notify = async (payload = {}) => {
      if (typeof reportProgress !== 'function') return;
      await Promise.resolve(reportProgress(payload));
    };

    const importMode = String(options.importMode || 'both').toLowerCase();
    const favoritesMode = String(options.favoritesMode || 'append').toLowerCase();
    const shouldImportLikes = importMode === 'likes' || importMode === 'both';
    const shouldImportPlaylists = importMode === 'playlists' || importMode === 'both';

    if (!shouldImportLikes && !shouldImportPlaylists) {
      throw new Error('Выберите, что нужно импортировать из профиля');
    }

    await notify({
      stage: 'resolve',
      progress: 12,
      message: 'Определяем профиль SoundCloud...',
    });

    const normalizedProfileUrl = this.normalizeProfileUrl(profileUrl);

    if (this.hasProxyConfig()) {
      await notify({
        stage: 'proxy-fetch',
        progress: 24,
        message: shouldImportLikes && shouldImportPlaylists
          ? 'Загружаем лайки и плейлисты через сервер...'
          : shouldImportLikes
            ? 'Загружаем лайки через сервер...'
            : 'Загружаем плейлисты через сервер...',
      });

      const proxyData = await this.proxyGet('/api/profile-import', {
        url: normalizedProfileUrl,
        importMode,
        likesLimit: 1000,
        playlistLimit: 100,
      });
      const proxyPayload = this.normalizeProxyProfileImportPayload(proxyData);
      const artist = proxyPayload.profile || {};
      const likes = shouldImportLikes ? proxyPayload.likes : [];
      const playlists = shouldImportPlaylists ? proxyPayload.playlists : [];

      await notify({
        stage: 'profile',
        progress: 40,
        message: `Профиль найден: ${artist.title || artist.uploader || 'SoundCloud'}`,
      });

      if (shouldImportLikes) {
        await notify({
          stage: 'likes-ready',
          progress: shouldImportPlaylists ? 62 : 84,
          message: likes.length
            ? `Найдено лайков: ${likes.length}`
            : 'Открытые лайки не найдены',
        });
      }

      if (shouldImportPlaylists) {
        await notify({
          stage: 'playlists-ready',
          progress: shouldImportLikes ? 82 : 76,
          message: playlists.length
            ? `Найдено плейлистов: ${playlists.length}`
            : 'Публичные плейлисты не найдены',
        });
      }

      await notify({
        stage: 'prepare-save',
        progress: 90,
        message: 'Подготавливаем сохранение в библиотеку...',
      });

      return {
        profile: {
          id: String(artist.id || ''),
          title: artist.title || artist.uploader || 'SoundCloud',
          webpage_url: artist.webpage_url || normalizedProfileUrl,
          thumbnail: artist.thumbnail || '',
        },
        importMode,
        favoritesMode: favoritesMode === 'replace' ? 'replace' : 'append',
        likes,
        playlists,
      };
    }

    const { artist, profileUrl: resolvedProfileUrl } = await this.resolveProfileArtist(normalizedProfileUrl);

    await notify({
      stage: 'profile',
      progress: 24,
      message: `Профиль найден: ${artist.title || artist.uploader || 'SoundCloud'}`,
    });

    let likes = [];
    let playlists = [];

    if (shouldImportLikes) {
      await notify({
        stage: 'likes',
        progress: shouldImportPlaylists ? 38 : 60,
        message: 'Загружаем открытые лайки...',
      });
      likes = await this.getProfileLikes(resolvedProfileUrl, artist.id);
      await notify({
        stage: 'likes-ready',
        progress: shouldImportPlaylists ? 56 : 84,
        message: likes.length
          ? `Найдено лайков: ${likes.length}`
          : 'Открытые лайки не найдены',
      });
    }

    if (shouldImportPlaylists) {
      await notify({
        stage: 'playlists',
        progress: shouldImportLikes ? 66 : 48,
        message: 'Загружаем публичные плейлисты...',
      });
      playlists = await this.getProfilePlaylists(resolvedProfileUrl, artist.id);
      await notify({
        stage: 'playlists-ready',
        progress: shouldImportLikes ? 84 : 78,
        message: playlists.length
          ? `Найдено плейлистов: ${playlists.length}`
          : 'Публичные плейлисты не найдены',
      });
    }

    await notify({
      stage: 'prepare-save',
      progress: 90,
      message: 'Подготавливаем сохранение в библиотеку...',
    });

    return {
      profile: {
        id: String(artist.id || ''),
        title: artist.title || artist.uploader || 'SoundCloud',
          webpage_url: artist.webpage_url || resolvedProfileUrl,
        thumbnail: artist.thumbnail || '',
      },
      importMode,
      favoritesMode: favoritesMode === 'replace' ? 'replace' : 'append',
      likes,
      playlists,
    };
  }

  async legacySearchAll(query, limit = 10) {
    const [tracks, setsHtml, peopleHtml] = await Promise.all([
      this.legacySearchTracks(query, limit),
      this.fetchHtml(`https://soundcloud.com/search/sets?q=${encodeURIComponent(query)}`).catch(() => ''),
      this.fetchHtml(`https://soundcloud.com/search/people?q=${encodeURIComponent(query)}`).catch(() => ''),
    ]);

    const { playlists, albums } = this.parseSets(setsHtml || '');
    const artists = this.parsePeople(peopleHtml || '');

    return { tracks, playlists, albums, artists };
  }

  async searchTracks(query, limit = 10) {
    if (this.hasProxyConfig()) {
      const data = await this.proxyGet('/api/search', { q: query, limit });
      return this.normalizeProxySearchPayload(data, limit).tracks;
    }

    if (this.hasOfficialApiConfig()) {
      return this.searchTracksViaApi(query, limit);
    }
    return this.legacySearchTracks(query, limit);
  }

  async searchAll(query, limit = 10) {
    if (this.hasProxyConfig()) {
      const data = await this.proxyGet('/api/search', { q: query, limit });
      return this.normalizeProxySearchPayload(data, limit);
    }

    if (this.hasOfficialApiConfig()) {
      const [tracks, setResults, artists] = await Promise.all([
        this.searchTracksViaApi(query, limit),
        this.searchSetsViaApi(query, limit),
        this.searchArtistsViaApi(query, limit),
      ]);

      return {
        tracks,
        playlists: setResults.playlists,
        albums: setResults.albums,
        artists,
      };
    }

    return this.legacySearchAll(query, limit);
  }

  async resolveUrl(url) {
    if (this.hasProxyConfig()) {
      const data = await this.proxyGet('/api/resolve', { url });
      return this.normalizeProxyResolvedResource(data, url);
    }

    const data = await this.extractInfo(url, [], { allowPlaylist: true });
    if (data._type === 'playlist' || Array.isArray(data.entries)) {
      const entries = this.normalizeTrackList(
        (data.entries || []).filter((entry) => entry && entry._type !== 'url')
      );
      const normalized = this.normalizePlaylist({
        ...data,
        track_count: Number(data.track_count || entries.length || 0),
      });
      return {
        ...normalized,
        title: data.title || 'Плейлист',
        webpage_url: normalized.webpage_url || url,
        entries,
        tracks: entries,
      };
    }

    return {
      kind: 'track',
      track: this.normalizeTrack(data),
    };
  }

  scoreAudioFormat(format) {
    let score = 0;
    const protocol = String(format.protocol || '');
    const formatId = String(format.format_id || '');
    const ext = String(format.ext || '');
    if (/^https?$/.test(protocol)) score += 1000;
    if (!/m3u8|hls|dash/i.test(protocol)) score += 500;
    if (!/m3u8|hls|dash/i.test(formatId)) score += 150;
    if (ext === 'mp3' || ext === 'm4a' || ext === 'opus' || ext === 'ogg') score += 80;
    score += Number(format.abr || format.tbr || 0);
    return score;
  }

  pickPreferredStream(info) {
    const formats = Array.isArray(info.formats) ? info.formats : [];
    const audioFormats = formats.filter((format) => {
      if (!format || !format.url) return false;
      if (format.vcodec && format.vcodec !== 'none') return false;
      if (format.acodec === 'none') return false;
      return true;
    });

    const sorted = [...audioFormats].sort((left, right) => this.scoreAudioFormat(right) - this.scoreAudioFormat(left));
    const direct = sorted.find((format) => !/m3u8|hls|dash/i.test(String(format.protocol || '')) && !/m3u8|hls|dash/i.test(String(format.format_id || '')));
    const selected = direct || sorted[0];

    if (!selected?.url) {
      return null;
    }

    return {
      remoteUrl: selected.url,
      headers: {
        ...(info.http_headers || {}),
        ...(selected.http_headers || {}),
      },
      isAdaptive: /m3u8|hls|dash/i.test(String(selected.protocol || '')) || /m3u8|hls|dash/i.test(String(selected.format_id || '')),
    };
  }

  buildProxyHeaders(extraHeaders = {}, requestRange) {
    const headers = {
      ...HEADERS,
      ...extraHeaders,
      Accept: '*/*',
    };
    if (requestRange) {
      headers.Range = requestRange;
    }
    return headers;
  }

  async ensureStreamServer() {
    if (this.streamServerPort) {
      return this.streamServerPort;
    }

    if (this.streamServerPromise) {
      return this.streamServerPromise;
    }

    this.streamServerPromise = new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        this.handleProxyRequest(req, res).catch((error) => {
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
          }
          res.end(JSON.stringify({ error: error?.message || 'Proxy stream failed' }));
        });
      });

      server.on('error', reject);
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        this.streamServer = server;
        this.streamServerPort = address.port;
        resolve(address.port);
      });
    });

    return this.streamServerPromise;
  }

  cleanupStreamTokens(maxAgeMs = 30 * 60 * 1000) {
    const now = Date.now();
    for (const [token, entry] of this.streamTokens.entries()) {
      if (now - entry.createdAt > maxAgeMs) {
        this.streamTokens.delete(token);
      }
    }
  }

  async createProxyUrl(remoteUrl, headers = {}) {
    const port = await this.ensureStreamServer();
    this.cleanupStreamTokens();
    const token = crypto.randomUUID();
    this.streamTokens.set(token, {
      remoteUrl,
      headers,
      createdAt: Date.now(),
    });
    return `http://127.0.0.1:${port}/stream/${token}`;
  }

  async handleProxyRequest(req, res) {
    const requestUrl = new URL(req.url, 'http://127.0.0.1');
    const [, token] = requestUrl.pathname.match(/^\/stream\/([^/]+)$/) || [];
    if (!token) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const entry = this.streamTokens.get(token);
    if (!entry) {
      res.writeHead(410);
      res.end('Stream expired');
      return;
    }

    const upstreamMethod = req.method === 'HEAD' ? 'head' : 'get';
    const upstream = await axios({
      method: upstreamMethod,
      url: entry.remoteUrl,
      responseType: upstreamMethod === 'head' ? 'text' : 'stream',
      headers: this.buildProxyHeaders(entry.headers, req.headers.range),
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: () => true,
      decompress: false,
    });

    res.statusCode = upstream.status;
    PROXY_HEADER_WHITELIST.forEach((headerName) => {
      if (upstream.headers[headerName]) {
        res.setHeader(headerName, upstream.headers[headerName]);
      }
    });
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (upstreamMethod === 'head') {
      res.end();
      return;
    }

    upstream.data.on('error', () => {
      if (!res.writableEnded) {
        res.destroy();
      }
    });

    req.on('close', () => {
      if (!upstream.data.destroyed) {
        upstream.data.destroy();
      }
    });

    upstream.data.pipe(res);
  }

  async getStream(trackUrl) {
    const info = await this.extractInfo(trackUrl, ['-f', 'bestaudio/best']);
    const track = this.normalizeTrack(info);
    const selectedStream = this.pickPreferredStream(info);

    if (!selectedStream || !selectedStream.remoteUrl || selectedStream.isAdaptive) {
      throw new Error('Не удалось подобрать прямой поток для этого трека');
    }

    const proxiedUrl = await this.createProxyUrl(selectedStream.remoteUrl, selectedStream.headers);

    return {
      ...track,
      stream_url: proxiedUrl,
      stream_source_url: selectedStream.remoteUrl,
    };
  }

  cleanupPlaybackCache(maxFiles = 20) {
    const files = fs.readdirSync(this.playbackCacheDir)
      .map((file) => path.join(this.playbackCacheDir, file))
      .filter((filePath) => fs.statSync(filePath).isFile())
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

    files.slice(maxFiles).forEach((filePath) => {
      try {
        fs.unlinkSync(filePath);
      } catch {}
    });
  }

  buildPlaybackMarker(track, title = 'track') {
    const safeName = sanitize(title || track.title || 'track') || 'track';
    const safeId = sanitize(String(track.id || 'track')) || 'track';
    return `${safeId}-${safeName}`;
  }

  findPlaybackCache(marker) {
    const files = fs.readdirSync(this.playbackCacheDir)
      .map((file) => path.join(this.playbackCacheDir, file))
      .filter((filePath) => path.basename(filePath).startsWith(marker))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

    return files[0] || null;
  }

  async preparePlayback(trackUrl, title = 'track') {
    const info = await this.extractInfo(trackUrl, ['-f', 'bestaudio/best']);
    const track = this.normalizeTrack(info);
    const marker = this.buildPlaybackMarker(track, title);
    const cachedFile = this.findPlaybackCache(marker);

    if (cachedFile) {
      return {
        ...track,
        local_file_path: cachedFile,
        local_file_url: pathToFileURL(cachedFile).href,
      };
    }

    const target = path.join(this.playbackCacheDir, `${marker}.%(ext)s`);

    await this.execYtDlp([
      '--no-warnings',
      '--no-part',
      '-f', 'bestaudio/best',
      '-o', target,
      '--add-header', `User-Agent:${HEADERS['User-Agent']}`,
      '--add-header', `Accept-Language:${HEADERS['Accept-Language']}`,
      trackUrl,
    ]);

    const downloadedFile = this.findPlaybackCache(marker);
    if (!downloadedFile) {
      throw new Error('Не удалось подготовить файл для воспроизведения');
    }

    this.cleanupPlaybackCache();

    return {
      ...track,
      local_file_path: downloadedFile,
      local_file_url: pathToFileURL(downloadedFile).href,
    };
  }

  async downloadTrack(trackUrl, title = 'track') {
    const safeName = sanitize(title) || 'track';
    const target = path.join(this.cacheDir, `${Date.now()}-${safeName}.%(ext)s`);

    await this.execYtDlp([
      '--no-warnings',
      '-f', 'bestaudio/best',
      '-o', target,
      '--add-header', `User-Agent:${HEADERS['User-Agent']}`,
      '--add-header', `Accept-Language:${HEADERS['Accept-Language']}`,
      trackUrl,
    ]);

    const files = fs.readdirSync(this.cacheDir)
      .map((file) => path.join(this.cacheDir, file))
      .filter((file) => file.includes(safeName))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);

    if (!files.length) {
      throw new Error('Файл не был скачан');
    }

    return files[0];
  }
}

module.exports = { SoundCloudService };
