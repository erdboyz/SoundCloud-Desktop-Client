# SoundCloud Desktop на Electron

Desktop-клиент для SoundCloud на Electron.js.

## Что уже есть

- поиск треков, плейлистов, альбомов и артистов;
- открытие трека или плейлиста по URL;
- встроенный аудиоплеер внизу окна;
- избранное;
- локальные плейлисты;
- история прослушивания;
- скачивание трека через `yt-dlp`;
- desktop UI на чистом Electron.

## Стек

- Electron
- better-sqlite3
- axios
- yt-dlp-wrap

## Установка

```bash
npm install
```

## Настройка SoundCloud API

Поиск по плейлистам, альбомам и артистам теперь может работать через официальный SoundCloud API без авторизации пользователя.

Нужны только:

- `client_id`
- `client_secret`

`redirect_uri` для этого режима не нужен. Он пригодится только если когда-нибудь понадобится login через аккаунт SoundCloud.

Есть два способа передать ключи:

1. Через переменные окружения:

```powershell
$env:SOUNDCLOUD_CLIENT_ID="your_client_id"
$env:SOUNDCLOUD_CLIENT_SECRET="your_client_secret"
npm start
```

2. Через локальный файл `soundcloud.config.json` в корне проекта:

```json
{
  "clientId": "your_client_id",
  "clientSecret": "your_client_secret"
}
```

Для удобства рядом лежит шаблон: `soundcloud.config.example.json`.

Если ключи не настроены, клиент откатится на старый способ поиска.

## Важно

Для стриминга и скачивания нужен установленный `yt-dlp` в системе.

Проверка:

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
