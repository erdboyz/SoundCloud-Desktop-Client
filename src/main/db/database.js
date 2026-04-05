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

  normalizeTrack(track) {
    return {
      id: String(track.id || ''),
      title: track.title || 'Без названия',
      uploader: track.uploader || track.artist || 'Неизвестный артист',
      duration: Number(track.duration || 0),
      thumbnail: track.thumbnail || '',
      webpage_url: track.webpage_url || '',
      stream_url: track.stream_url || '',
      description: track.description || '',
      genre: track.genre || '',
      like_count: Number(track.like_count || 0),
      view_count: Number(track.view_count || 0),
      kind: track.kind || 'track',
      raw: track.raw || track,
    };
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
      Date.now()
    );
    return item;
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

    this.db.prepare('INSERT INTO playlists_local (name, created_at) VALUES (?, ?)').run(cleaned, Date.now());
    return this.listPlaylists().find((playlist) => playlist.name === cleaned);
  }

  listPlaylists() {
    return this.db.prepare(`
      SELECT
        p.id,
        p.name,
        p.created_at,
        COUNT(pt.track_id) AS track_count
      FROM playlists_local p
      LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
      GROUP BY p.id, p.name, p.created_at
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
}

module.exports = { AppDatabase };
