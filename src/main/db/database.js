const path = require('path');
const Database = require('better-sqlite3');
const { app } = require('electron');

class AppDatabase {
  constructor() {
    const dbPath = path.join(app.getPath('userData'), 'soundcloud_client.db');
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.init();
  }

  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS favorites (
        track_id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        artist TEXT,
        webpage_url TEXT,
        duration INTEGER,
        thumbnail TEXT,
        raw_json TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS playlists_local (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        source TEXT NOT NULL DEFAULT 'local',
        external_id TEXT,
        external_url TEXT,
        imported_from TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS playlist_tracks (
        playlist_id INTEGER NOT NULL,
        track_id TEXT NOT NULL,
        title TEXT NOT NULL,
        artist TEXT,
        webpage_url TEXT,
        duration INTEGER,
        thumbnail TEXT,
        raw_json TEXT NOT NULL,
        added_at INTEGER NOT NULL,
        PRIMARY KEY (playlist_id, track_id)
      );

      CREATE TABLE IF NOT EXISTS recently_played (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id TEXT NOT NULL,
        title TEXT NOT NULL,
        artist TEXT,
        webpage_url TEXT,
        duration INTEGER,
        thumbnail TEXT,
        raw_json TEXT NOT NULL,
        played_at INTEGER NOT NULL
      );
    `);

    this.ensureColumn('playlists_local', 'source', "TEXT NOT NULL DEFAULT 'local'");
    this.ensureColumn('playlists_local', 'external_id', 'TEXT');
    this.ensureColumn('playlists_local', 'external_url', 'TEXT');
    this.ensureColumn('playlists_local', 'imported_from', 'TEXT');
    this.ensureColumn('playlists_local', 'updated_at', 'INTEGER');

    this.db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_playlists_local_source_external
      ON playlists_local(source, external_id)
      WHERE external_id IS NOT NULL;
    `);

    this.cleanupInvalidLibraryRows();
  }

  ensureColumn(tableName, columnName, definition) {
    const columns = this.db.prepare(`PRAGMA table_info(${tableName})`).all();
    if (columns.some((column) => column.name === columnName)) {
      return;
    }

    this.db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }

  isMalformedTrackRecord(row) {
    const title = String(row?.title || '').trim();
    const artist = String(row?.artist || '').trim();
    const webpageUrl = String(row?.webpage_url || '').trim();
    const thumbnail = String(row?.thumbnail || '').trim();
    const trackId = String(row?.track_id || '').trim();

    const hasPlaceholderText = title === 'Без названия' && artist === 'Неизвестный артист';
    const hasNoMediaLinks = !webpageUrl && !thumbnail;
    const suspiciousId = /^(free|[A-Za-z0-9_-]{20,})$/.test(trackId);

    return Boolean(hasPlaceholderText && hasNoMediaLinks && suspiciousId);
  }

  cleanupInvalidLibraryRows() {
    const favoriteRows = this.db.prepare(`
      SELECT track_id, title, artist, webpage_url, thumbnail
      FROM favorites
    `).all();

    favoriteRows.forEach((row) => {
      if (this.isMalformedTrackRecord(row)) {
        this.db.prepare('DELETE FROM favorites WHERE track_id = ?').run(String(row.track_id));
      }
    });

    const playlistRows = this.db.prepare(`
      SELECT playlist_id, track_id, title, artist, webpage_url, thumbnail
      FROM playlist_tracks
    `).all();

    playlistRows.forEach((row) => {
      if (this.isMalformedTrackRecord(row)) {
        this.db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?')
          .run(Number(row.playlist_id), String(row.track_id));
      }
    });
  }

  playlistExists(playlistId) {
    const row = this.db.prepare('SELECT id FROM playlists_local WHERE id = ?').get(Number(playlistId));
    return Boolean(row);
  }

  serializeTrack(track) {
    return JSON.stringify(track || {});
  }

  deserializeRow(row) {
    if (!row) return row;
    return {
      ...row,
      raw_json: row.raw_json ? JSON.parse(row.raw_json) : null,
    };
  }

  unwrapTrackPayload(track) {
    if (!track || typeof track !== 'object' || Array.isArray(track)) {
      return track;
    }

    if (track.track && typeof track.track === 'object' && !Array.isArray(track.track)) {
      return track.track;
    }

    return track;
  }

  normalizeTrack(track) {
    const source = this.unwrapTrackPayload(track) || {};
    return {
      id: String(source.id || track?.id || ''),
      title: track.title || 'Без названия',
      uploader: track.uploader || track.artist || 'Неизвестный артист',
      title: source.title || track.title || 'Без названия',
      uploader: source.uploader || source.artist || source.user?.username || source.user?.full_name || track.uploader || track.artist || 'Неизвестный артист',
      duration: Number(source.duration || track.duration || 0),
      thumbnail: source.thumbnail || source.artwork_url || source.user?.avatar_url || track.thumbnail || '',
      webpage_url: source.webpage_url || source.permalink_url || track.webpage_url || '',
      stream_url: source.stream_url || source.url || track.stream_url || '',
      description: source.description || track.description || '',
      genre: source.genre || track.genre || '',
      like_count: Number(source.like_count || source.likes_count || track.like_count || 0),
      view_count: Number(source.view_count || source.playback_count || track.view_count || 0),
      artist_id: String(source.artist_id || source.user?.id || track.artist_id || ''),
      kind: source.kind || track.kind || 'track',
      raw: source.raw || source,
    };
  }

  normalizeImportedPlaylist(playlist) {
    const tracks = Array.isArray(playlist?.tracks)
      ? playlist.tracks
      : Array.isArray(playlist?.entries)
        ? playlist.entries
        : [];

    return {
      externalId: String(playlist?.id || ''),
      name: String(playlist?.title || '').trim() || 'Импортированный плейлист',
      externalUrl: playlist?.webpage_url || '',
      importedFrom: playlist?.imported_from || '',
      tracks: tracks.map((track) => this.normalizeTrack(track)).filter((track) => track.id),
    };
  }

  getUniquePlaylistName(baseName, excludedId = null) {
    const cleanedBase = String(baseName || '').trim() || 'Плейлист';
    let attempt = cleanedBase;
    let suffix = 0;

    while (true) {
      const row = this.db.prepare(
        excludedId
          ? 'SELECT id FROM playlists_local WHERE LOWER(name) = LOWER(?) AND id != ?'
          : 'SELECT id FROM playlists_local WHERE LOWER(name) = LOWER(?)'
      ).get(...(excludedId ? [attempt, Number(excludedId)] : [attempt]));

      if (!row) {
        return attempt;
      }

      suffix += 1;
      attempt = `${cleanedBase} (импорт ${suffix})`;
    }
  }

  getImportedPlaylistByExternalId(externalId) {
    if (!externalId) return null;
    return this.db.prepare(
      'SELECT * FROM playlists_local WHERE source = ? AND external_id = ?'
    ).get('soundcloud-import', String(externalId));
  }

  saveFavorite(track, createdAt = Date.now()) {
    const item = this.normalizeTrack(track);
    this.db.prepare(`
      INSERT OR REPLACE INTO favorites
      (track_id, title, artist, webpage_url, duration, thumbnail, raw_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.id,
      item.title,
      item.uploader,
      item.webpage_url,
      item.duration,
      item.thumbnail,
      this.serializeTrack(item),
      createdAt
    );
    return item;
  }

  listFavorites() {
    const rows = this.db.prepare('SELECT * FROM favorites ORDER BY created_at DESC').all();
    return rows.map((row) => this.deserializeRow(row));
  }

  isFavorite(trackId) {
    const row = this.db.prepare('SELECT 1 FROM favorites WHERE track_id = ?').get(String(trackId));
    return Boolean(row);
  }

  addFavorite(track) {
    return this.saveFavorite(track, Date.now());
  }

  removeFavorite(trackId) {
    this.db.prepare('DELETE FROM favorites WHERE track_id = ?').run(String(trackId));
    return true;
  }

  addRecentlyPlayed(track) {
    const item = this.normalizeTrack(track);
    this.db.prepare('DELETE FROM recently_played WHERE track_id = ?').run(item.id);
    this.db.prepare(`
      INSERT INTO recently_played
      (track_id, title, artist, webpage_url, duration, thumbnail, raw_json, played_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.id,
      item.title,
      item.uploader,
      item.webpage_url,
      item.duration,
      item.thumbnail,
      this.serializeTrack(item),
      Date.now()
    );

    this.db.prepare(`
      DELETE FROM recently_played
      WHERE id NOT IN (
        SELECT id FROM recently_played ORDER BY played_at DESC LIMIT 30
      )
    `).run();
    return item;
  }

  listRecentlyPlayed() {
    const rows = this.db.prepare('SELECT * FROM recently_played ORDER BY played_at DESC LIMIT 30').all();
    return rows.map((row) => this.deserializeRow(row));
  }

  createPlaylist(name) {
    const cleaned = String(name || '').trim();
    if (!cleaned) throw new Error('Название плейлиста не может быть пустым');

    const exists = this.db.prepare(
      'SELECT id FROM playlists_local WHERE LOWER(name) = LOWER(?)'
    ).get(cleaned);

    if (exists) {
      throw new Error('Плейлист с таким названием уже существует');
    }

    const now = Date.now();
    this.db.prepare(
      'INSERT INTO playlists_local (name, source, created_at, updated_at) VALUES (?, ?, ?, ?)'
    ).run(cleaned, 'local', now, now);
    return this.listPlaylists().find((playlist) => playlist.name === cleaned);
  }

  listPlaylists() {
    return this.db.prepare(`
      SELECT
        p.id,
        p.name,
        p.source,
        p.external_id,
        p.external_url,
        p.imported_from,
        p.created_at,
        p.updated_at,
        COUNT(pt.track_id) AS track_count
      FROM playlists_local p
      LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
      GROUP BY
        p.id,
        p.name,
        p.source,
        p.external_id,
        p.external_url,
        p.imported_from,
        p.created_at,
        p.updated_at
      ORDER BY p.name COLLATE NOCASE
    `).all();
  }

  deletePlaylist(playlistId) {
    this.db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ?').run(Number(playlistId));
    this.db.prepare('DELETE FROM playlists_local WHERE id = ?').run(Number(playlistId));
    return true;
  }

  addTrackToPlaylist(playlistId, track) {
    if (!this.playlistExists(playlistId)) {
      throw new Error('Плейлист не найден');
    }

    const item = this.normalizeTrack(track);
    this.db.prepare(`
      INSERT OR REPLACE INTO playlist_tracks
      (playlist_id, track_id, title, artist, webpage_url, duration, thumbnail, raw_json, added_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      Number(playlistId),
      item.id,
      item.title,
      item.uploader,
      item.webpage_url,
      item.duration,
      item.thumbnail,
      this.serializeTrack(item),
      Date.now()
    );
    return item;
  }

  getPlaylistTracks(playlistId) {
    if (!this.playlistExists(playlistId)) {
      return [];
    }

    const rows = this.db.prepare(
      'SELECT * FROM playlist_tracks WHERE playlist_id = ? ORDER BY added_at DESC'
    ).all(Number(playlistId));
    return rows.map((row) => this.deserializeRow(row));
  }

  removeTrackFromPlaylist(playlistId, trackId) {
    if (!this.playlistExists(playlistId)) {
      throw new Error('Плейлист не найден');
    }

    this.db.prepare(
      'DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?'
    ).run(Number(playlistId), String(trackId));
    return true;
  }

  importSoundCloudProfile(payload = {}) {
    const profileTitle = String(payload?.profile?.title || 'SoundCloud');
    const profileUrl = String(payload?.profile?.webpage_url || '');
    const favoritesMode = String(payload?.favoritesMode || 'append').toLowerCase() === 'replace'
      ? 'replace'
      : 'append';
    const likes = Array.isArray(payload?.likes)
      ? payload.likes.map((track) => this.normalizeTrack(track)).filter((track) => track.id)
      : [];
    const playlists = Array.isArray(payload?.playlists)
      ? payload.playlists.map((playlist) => this.normalizeImportedPlaylist({
        ...playlist,
        imported_from: profileUrl,
      }))
      : [];

    const transaction = this.db.transaction(() => {
      const importedPlaylistIds = [];
      const summary = {
        profileTitle,
        profileUrl,
        favoritesMode,
        importedFavorites: likes.length,
        importedPlaylists: 0,
        updatedPlaylists: 0,
        importedPlaylistTracks: 0,
        playlistIds: importedPlaylistIds,
      };

      if (favoritesMode === 'replace') {
        this.db.prepare('DELETE FROM favorites').run();
      }

      const favoriteTimestampBase = Date.now() + likes.length + 1000;
      likes.forEach((track, index) => {
        this.saveFavorite(track, favoriteTimestampBase - index);
      });

      const now = Date.now();
      playlists.forEach((playlist, playlistIndex) => {
        const existing = this.getImportedPlaylistByExternalId(playlist.externalId);
        const preferredName = existing
          ? this.getUniquePlaylistName(playlist.name, existing.id)
          : this.getUniquePlaylistName(playlist.name);
        const updatedAt = now + playlistIndex;
        let playlistId = 0;

        if (existing) {
          this.db.prepare(`
            UPDATE playlists_local
            SET name = ?, external_url = ?, imported_from = ?, updated_at = ?
            WHERE id = ?
          `).run(
            preferredName,
            playlist.externalUrl,
            playlist.importedFrom,
            updatedAt,
            Number(existing.id)
          );
          this.db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ?').run(Number(existing.id));
          playlistId = Number(existing.id);
          summary.updatedPlaylists += 1;
        } else {
          const inserted = this.db.prepare(`
            INSERT INTO playlists_local
            (name, source, external_id, external_url, imported_from, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            preferredName,
            'soundcloud-import',
            playlist.externalId || null,
            playlist.externalUrl,
            playlist.importedFrom,
            updatedAt,
            updatedAt
          );
          playlistId = Number(inserted.lastInsertRowid);
          summary.importedPlaylists += 1;
        }

        importedPlaylistIds.push(playlistId);
        playlist.tracks.forEach((track, trackIndex) => {
          const addedAt = updatedAt + playlist.tracks.length - trackIndex;
          this.db.prepare(`
            INSERT OR REPLACE INTO playlist_tracks
            (playlist_id, track_id, title, artist, webpage_url, duration, thumbnail, raw_json, added_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            playlistId,
            track.id,
            track.title,
            track.uploader,
            track.webpage_url,
            track.duration,
            track.thumbnail,
            this.serializeTrack(track),
            addedAt
          );
          summary.importedPlaylistTracks += 1;
        });
      });

      const totalFavoritesRow = this.db.prepare('SELECT COUNT(*) AS count FROM favorites').get();
      const totalPlaylistsRow = this.db.prepare('SELECT COUNT(*) AS count FROM playlists_local').get();
      summary.totalFavorites = Number(totalFavoritesRow?.count || 0);
      summary.totalPlaylists = Number(totalPlaylistsRow?.count || 0);
      return summary;
    });

    return transaction();
  }
}

module.exports = { AppDatabase };
