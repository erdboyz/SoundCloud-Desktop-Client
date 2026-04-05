# SoundCloud Desktop на Electron

Полноценный desktop-клиент для SoundCloud на Electron.js.

## Что уже есть

- поиск треков, плейлистов, альбомов и артистов;
- открытие трека или плейлиста по URL;
- встроенный аудиоплеер внизу окна;
- избранное;
- локальные плейлисты;
- история прослушивания;
- скачивание трека через `yt-dlp`;
- улучшенный UI по сравнению с монолитным PyQt-вариантом.

## Стек

- Electron
- better-sqlite3
- axios
- yt-dlp-wrap

## Установка

```bash
npm install
```

## Важно

Для работы стриминга и скачивания нужен установленный `yt-dlp` в системе.

Проверь так:

```bash
yt-dlp --version
```

Если команда не находится, установи `yt-dlp` и добавь его в `PATH`.

## Запуск

```bash
npm start
```

## Структура

```text
src/
  main/
    main.js
    preload.js
    db/database.js
    services/soundcloud-service.js
  renderer/
    index.html
    styles.css
    renderer.js
```

## Что стоит сделать дальше

- добавить toast-уведомления вместо `alert/prompt`;
- сделать drag-and-drop сортировку локальных плейлистов;
- добавить кеширование обложек и результатов поиска;
- перевести UI на React/Vue при желании;
- собрать `.exe` через `electron-builder`.
