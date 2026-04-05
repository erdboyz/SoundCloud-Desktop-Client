const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const crypto = require('crypto');
const axios = require('axios');
const sanitize = require('sanitize-filename');
const { pathToFileURL } = require('url');
const YTDlpWrap = require('yt-dlp-wrap').default;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  Accept: '*/*',
  Referer: 'https://soundcloud.com/',
  Origin: 'https://soundcloud.com',
};

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
    this.ytDlp = new YTDlpWrap();
    this.cacheDir = path.join(os.tmpdir(), 'soundcloud-electron-client');
    this.playbackCacheDir = path.join(this.cacheDir, 'playback');
    this.streamTokens = new Map();
    this.streamServer = null;
    this.streamServerPort = null;
    this.streamServerPromise = null;
    fs.mkdirSync(this.cacheDir, { recursive: true });
    fs.mkdirSync(this.playbackCacheDir, { recursive: true });
  }

  async execYtDlp(args) {
    const output = await this.ytDlp.execPromise(args);
    return output;
  }

  async extractInfo(urlOrSearch, extraArgs = []) {
    const args = [
      '--dump-single-json',
      '--no-warnings',
      '--no-playlist',
      '--skip-download',
      '--add-header', `User-Agent:${HEADERS['User-Agent']}`,
      '--add-header', `Accept-Language:${HEADERS['Accept-Language']}`,
      ...extraArgs,
      urlOrSearch,
    ];
    const output = await this.execYtDlp(args);
    return JSON.parse(output);
  }

  normalizeTrack(info) {
    return {
      id: String(info.id || ''),
      title: info.title || 'Без названия',
      uploader: info.uploader || info.artist || 'Неизвестный артист',
      duration: Number(info.duration || 0),
      thumbnail: info.thumbnail || '',
      webpage_url: info.webpage_url || info.original_url || '',
      stream_url: info.url || '',
      description: info.description || '',
      genre: info.genre || '',
      view_count: Number(info.view_count || 0),
      like_count: Number(info.like_count || 0),
      kind: 'track',
      raw: info,
    };
  }

  async searchTracks(query, limit = 10) {
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

  async searchAll(query, limit = 10) {
    const [tracks, setsHtml, peopleHtml] = await Promise.all([
      this.searchTracks(query, limit),
      this.fetchHtml(`https://soundcloud.com/search/sets?q=${encodeURIComponent(query)}`).catch(() => ''),
      this.fetchHtml(`https://soundcloud.com/search/people?q=${encodeURIComponent(query)}`).catch(() => ''),
    ]);

    const { playlists, albums } = this.parseSets(setsHtml || '');
    const artists = this.parsePeople(peopleHtml || '');

    return { tracks, playlists, albums, artists };
  }

  async resolveUrl(url) {
    const data = await this.extractInfo(url, ['--flat-playlist', 'never']);
    if (data._type === 'playlist' || Array.isArray(data.entries)) {
      const entries = (data.entries || [])
        .filter((entry) => entry && entry._type !== 'url')
        .map((entry) => this.normalizeTrack(entry));
      return {
        kind: 'playlist',
        title: data.title || 'Плейлист',
        uploader: data.uploader || '',
        webpage_url: data.webpage_url || url,
        thumbnail: data.thumbnail || '',
        entries,
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
