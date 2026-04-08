const state = {
  page: "home",
  searchTab: "tracks",
  searchViewMode: "results",
  searchEntity: null,
  searchEntityTab: "tracks",
  searchEntityHistory: [],
  searchEntityInfo: "",
  libraryTab: "favorites",
  searchQuery: "",
  searchLimit: 10,
  searchResults: {
    tracks: [],
    playlists: [],
    albums: [],
    artists: [],
  },
  selectedItem: null,
  selectedPlaylist: null,
  favorites: [],
  recent: [],
  playlists: [],
  playlistTracks: [],
  currentQueue: [],
  currentQueueIndex: -1,
  currentTrack: null,
  repeatMode: 0,
  currentTrackRepeatPasses: 0,
  shuffle: false,
  playerLoading: false,
  audioSourceMode: "idle",
  recoveringFromStreamError: false,
  playerExpanded: false,
  queuePanelOpen: false,
  settings: {
    backendUrl: "",
    accessKey: "",
  },
};

const pageMeta = {
  home: {
    eyebrow: "SoundCloud Desktop",
    title: "Главная",
    subtitle: "Ритм, который хочется вернуть в один клик.",
  },
  search: {
    eyebrow: "Каталог",
    title: "Поиск",
    subtitle: "Ищи треки, альбомы, плейлисты и артистов в одном месте.",
  },
  library: {
    eyebrow: "Коллекция",
    title: "Библиотека",
    subtitle: "Ваше избранное и локальные плейлисты без лишней суеты.",
  },
  settings: {
    eyebrow: "Подключение",
    title: "Настройки",
    subtitle: "Здесь можно подключить приложение к серверу для поиска и открытия контента.",
  },
};

const el = {
  pages: document.querySelectorAll(".page"),
  navButtons: document.querySelectorAll(".nav-button[data-page]"),
  libraryShortcuts: document.querySelectorAll("[data-library-shortcut]"),
  searchTabButtons: document.querySelectorAll("[data-search-tab]"),
  libraryTabButtons: document.querySelectorAll("[data-library-tab]"),
  detailPanels: document.querySelectorAll("[data-detail-panel]"),
  pageEyebrow: document.getElementById("pageEyebrow"),
  pageTitle: document.getElementById("pageTitle"),
  pageSubtitle: document.getElementById("pageSubtitle"),
  globalSearchInput: document.getElementById("globalSearchInput"),
  topbarSearchBtn: document.getElementById("topbarSearchBtn"),
  sidebarPlaylistList: document.getElementById("sidebarPlaylistList"),
  sidebarFavoritesCount: document.getElementById("sidebarFavoritesCount"),
  sidebarRecentCount: document.getElementById("sidebarRecentCount"),
  sidebarPlaylistCount: document.getElementById("sidebarPlaylistCount"),
  heroRecentCount: document.getElementById("heroRecentCount"),
  heroFavoritesCount: document.getElementById("heroFavoritesCount"),
  heroPlaylistCount: document.getElementById("heroPlaylistCount"),
  heroSearchBtn: document.getElementById("heroSearchBtn"),
  heroPlaylistBtn: document.getElementById("heroPlaylistBtn"),
  refreshRecentBtn: document.getElementById("refreshRecentBtn"),
  homeRecentGrid: document.getElementById("homeRecentGrid"),
  homeMixGrid: document.getElementById("homeMixGrid"),
  homeQueueList: document.getElementById("homeQueueList"),
  searchInput: document.getElementById("searchInput"),
  searchBtn: document.getElementById("searchBtn"),
  openUrlBtn: document.getElementById("openUrlBtn"),
  searchStage: document.getElementById("searchStage"),
  searchResultsView: document.getElementById("searchResultsView"),
  searchEntityView: document.getElementById("searchEntityView"),
  searchInfo: document.getElementById("searchInfo"),
  searchTracks: document.getElementById("searchTracks"),
  searchPlaylists: document.getElementById("searchPlaylists"),
  searchAlbums: document.getElementById("searchAlbums"),
  searchArtists: document.getElementById("searchArtists"),
  loadMoreBtn: document.getElementById("loadMoreBtn"),
  entityBackBtn: document.getElementById("entityBackBtn"),
  entityCover: document.getElementById("entityCover"),
  entityCoverFallback: document.getElementById("entityCoverFallback"),
  entityType: document.getElementById("entityType"),
  entityTitle: document.getElementById("entityTitle"),
  entityMeta: document.getElementById("entityMeta"),
  entityText: document.getElementById("entityText"),
  entityPrimaryBtn: document.getElementById("entityPrimaryBtn"),
  entityBrowserBtn: document.getElementById("entityBrowserBtn"),
  entityStatsGrid: document.getElementById("entityStatsGrid"),
  entityTabs: document.getElementById("entityTabs"),
  entityTabButtons: document.querySelectorAll("[data-entity-tab]"),
  entityContentTitle: document.getElementById("entityContentTitle"),
  entityContentText: document.getElementById("entityContentText"),
  entityContentList: document.getElementById("entityContentList"),
  createPlaylistBtn: document.getElementById("createPlaylistBtn"),
  detailCreatePlaylistBtn: document.getElementById("detailCreatePlaylistBtn"),
  libraryModeKicker: document.getElementById("libraryModeKicker"),
  libraryModeTitle: document.getElementById("libraryModeTitle"),
  libraryModeText: document.getElementById("libraryModeText"),
  librarySectionTitle: document.querySelector("#page-library .section-head h3"),
  librarySectionText: document.querySelector("#page-library .section-head p"),
  libraryContentTitle: document.querySelector("#page-library .panel-head.spacing-top h3"),
  libraryContentText: document.querySelector("#page-library .panel-head.spacing-top p"),
  refreshLibraryBtn: document.getElementById("refreshLibraryBtn"),
  favoritesList: document.getElementById("favoritesList"),
  playlistsList: document.getElementById("playlistsList"),
  playlistTracksList: document.getElementById("playlistTracksList"),
  playlistControls: document.getElementById("playlistControls"),
  playPlaylistBtn: document.getElementById("playPlaylistBtn"),
  deletePlaylistBtn: document.getElementById("deletePlaylistBtn"),
  toastContainer: document.getElementById("toastContainer"),
  modalOverlay: document.getElementById("modalOverlay"),
  modalTitle: document.getElementById("modalTitle"),
  modalDescription: document.getElementById("modalDescription"),
  modalBody: document.getElementById("modalBody"),
  modalConfirmBtn: document.getElementById("modalConfirmBtn"),
  modalCancelBtn: document.getElementById("modalCancelBtn"),
  modalCloseBtn: document.getElementById("modalCloseBtn"),
  playerBar: document.getElementById("playerBar"),
  audioPlayer: document.getElementById("audioPlayer"),
  coverImage: document.getElementById("coverImage"),
  playerCover: document.getElementById("playerCover"),
  playerCoverFallback: document.getElementById("playerCoverFallback"),
  playerTitle: document.getElementById("playerTitle"),
  playerArtist: document.getElementById("playerArtist"),
  playerSource: document.getElementById("playerSource"),
  playerFavoriteBtn: document.getElementById("playerFavoriteBtn"),
  playerAddToPlaylistBtn: document.getElementById("playerAddToPlaylistBtn"),
  queueBtn: document.getElementById("queueBtn"),
  currentTime: document.getElementById("currentTime"),
  totalTime: document.getElementById("totalTime"),
  progressSlider: document.getElementById("progressSlider"),
  playPauseBtn: document.getElementById("playPauseBtn"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  repeatBtn: document.getElementById("repeatBtn"),
  shuffleBtn: document.getElementById("shuffleBtn"),
  muteBtn: document.getElementById("muteBtn"),
  volumeSlider: document.getElementById("volumeSlider"),
  playerFullscreen: document.getElementById("playerFullscreen"),
  collapsePlayerBtn: document.getElementById("collapsePlayerBtn"),
  fullscreenCoverImage: document.getElementById("fullscreenCoverImage"),
  fullscreenCoverFallback: document.getElementById("fullscreenCoverFallback"),
  fullscreenTitle: document.getElementById("fullscreenTitle"),
  fullscreenArtist: document.getElementById("fullscreenArtist"),
  fullscreenSource: document.getElementById("fullscreenSource"),
  fullscreenTrackMeta: document.getElementById("fullscreenTrackMeta"),
  fullscreenFavoriteBtn: document.getElementById("fullscreenFavoriteBtn"),
  fullscreenAddToPlaylistBtn: document.getElementById("fullscreenAddToPlaylistBtn"),
  fullscreenQueueBtn: document.getElementById("fullscreenQueueBtn"),
  fullscreenCurrentTime: document.getElementById("fullscreenCurrentTime"),
  fullscreenTotalTime: document.getElementById("fullscreenTotalTime"),
  fullscreenProgressSlider: document.getElementById("fullscreenProgressSlider"),
  fullscreenPlayPauseBtn: document.getElementById("fullscreenPlayPauseBtn"),
  fullscreenPrevBtn: document.getElementById("fullscreenPrevBtn"),
  fullscreenNextBtn: document.getElementById("fullscreenNextBtn"),
  fullscreenRepeatBtn: document.getElementById("fullscreenRepeatBtn"),
  fullscreenShuffleBtn: document.getElementById("fullscreenShuffleBtn"),
  fullscreenMuteBtn: document.getElementById("fullscreenMuteBtn"),
  fullscreenVolumeSlider: document.getElementById("fullscreenVolumeSlider"),
  playerQueuePanel: document.getElementById("playerQueuePanel"),
  playerQueueSummary: document.getElementById("playerQueueSummary"),
  playerQueueList: document.getElementById("playerQueueList"),
  clearQueueBtn: document.getElementById("clearQueueBtn"),
  closeQueueBtn: document.getElementById("closeQueueBtn"),
  settingsBackendUrlInput: document.getElementById("settingsBackendUrlInput"),
  settingsAccessKeyInput: document.getElementById("settingsAccessKeyInput"),
  settingsSaveBtn: document.getElementById("settingsSaveBtn"),
  settingsTestBtn: document.getElementById("settingsTestBtn"),
  settingsStatus: document.getElementById("settingsStatus"),
  settingsConnectionBadge: document.getElementById("settingsConnectionBadge"),
};

let modalResolver = null;
let modalContext = null;
let modalConfirmHandler = null;

function unwrapResponse(response, fallbackMessage = "Не удалось выполнить действие") {
  if (!response || response.ok === false) {
    throw new Error(response?.error || fallbackMessage);
  }
  return response.data;
}

function normalizeError(error, fallbackMessage = "Неизвестная ошибка") {
  return error?.message || fallbackMessage;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTime(seconds) {
  const total = Math.max(0, Number(seconds || 0));
  const mins = Math.floor(total / 60);
  const secs = Math.floor(total % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatCount(value) {
  const count = Number(value || 0);
  if (count >= 1000000) return `${(count / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(count);
}

function trackWord(count) {
  const value = Number(count || 0);
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return "трек";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "трека";
  return "треков";
}

function getArtist(item) {
  return item?.uploader || item?.artist || "Неизвестный артист";
}

function getArtwork(item) {
  return item?.thumbnail || "";
}

function deriveArtistUrl(trackUrl) {
  try {
    const url = new URL(trackUrl);
    const [slug] = url.pathname.split("/").filter(Boolean);
    return slug ? `${url.origin}/${slug}` : "";
  } catch {
    return "";
  }
}

function getTrackArtistProfile(track) {
  if (!track) return null;
  const rawUser = track?.raw?.user || {};
  const artwork = rawUser.avatar_url ? rawUser.avatar_url.replace("-large", "-t500x500") : (track?.thumbnail || "");
  const artistId = rawUser.id || track?.artist_id || track?.raw?.uploader_id || track?.raw?.channel_id || "";
  const webpageUrl = rawUser.permalink_url || rawUser.webpage_url || deriveArtistUrl(track?.webpage_url);
  const title = rawUser.username || rawUser.full_name || getArtist(track);
  if (!artistId && !webpageUrl) return null;
  return {
    id: artistId ? String(artistId) : "",
    title,
    uploader: rawUser.full_name || title || "SoundCloud",
    webpage_url: webpageUrl,
    thumbnail: artwork,
    followers: Number(rawUser.followers_count || 0),
    description: rawUser.description || "",
    kind: "artist",
    raw: rawUser,
  };
}

function getItemId(item) {
  return String(item?.track_id || item?.id || item?.webpage_url || item?.title || "");
}

function getItemKey(item) {
  return `${item?.kind || "track"}:${getItemId(item)}`;
}

function isSelectedItem(item) {
  return Boolean(state.selectedItem) && getItemKey(state.selectedItem) === getItemKey(item);
}

function toDisplayTrack(row) {
  return row?.raw_json || row;
}

function recentTracks() {
  return state.recent.map(toDisplayTrack);
}

function favoriteTracks() {
  return state.favorites.map(toDisplayTrack);
}

function favoriteIds() {
  return new Set(state.favorites.map((item) => String(item.track_id || item.id)));
}

function isTrackFavorite(item) {
  return favoriteIds().has(getItemId(item));
}

function isTrack(item) {
  return (item?.kind || "track") === "track";
}

function belongsToSelectedPlaylist(item) {
  return Boolean(
    state.selectedPlaylist &&
    state.playlistTracks.some((track) => getItemId(track) === getItemId(item))
  );
}

function playButtons() {
  return [el.playPauseBtn, el.fullscreenPlayPauseBtn].filter(Boolean);
}

function repeatButtons() {
  return [el.repeatBtn, el.fullscreenRepeatBtn].filter(Boolean);
}

function shuffleButtons() {
  return [el.shuffleBtn, el.fullscreenShuffleBtn].filter(Boolean);
}

function muteButtons() {
  return [el.muteBtn, el.fullscreenMuteBtn].filter(Boolean);
}

function volumeSliders() {
  return [el.volumeSlider, el.fullscreenVolumeSlider].filter(Boolean);
}

function progressSliders() {
  return [el.progressSlider, el.fullscreenProgressSlider].filter(Boolean);
}

function initialsFromText(value) {
  const words = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!words.length) return "SC";
  return words.map((word) => word[0]).join("").toUpperCase();
}

function itemInitials(item) {
  return initialsFromText(item?.title || item?.name || getArtist(item));
}

function artMarkup(item, className) {
  const image = getArtwork(item);
  return `
    <div class="${className}">
      ${image ? `<img class="cover-image" src="${escapeHtml(image)}" alt="" onerror="this.classList.add('hidden')" />` : ""}
      <span>${escapeHtml(itemInitials(item))}</span>
    </div>
  `;
}

function showEmptyState(target, text) {
  target.innerHTML = `<div class="empty-state">${escapeHtml(text)}</div>`;
  target.onclick = null;
  target.ondblclick = null;
}

function pushToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  el.toastContainer.appendChild(toast);
  window.setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(4px)";
    window.setTimeout(() => toast.remove(), 180);
  }, 3200);
}

function closeModal(result = null) {
  el.modalOverlay.classList.add("hidden");
  if (modalResolver) {
    modalResolver(result);
  }
  modalResolver = null;
  modalContext = null;
  modalConfirmHandler = null;
  el.modalBody.innerHTML = "";
  el.modalConfirmBtn.onclick = null;
}

function openModal({
  title,
  description = "",
  confirmText = "Подтвердить",
  cancelText = "Отмена",
  renderBody,
  onConfirm,
}) {
  if (modalResolver) {
    closeModal(null);
  }

  el.modalTitle.textContent = title;
  el.modalDescription.textContent = description;
  el.modalConfirmBtn.textContent = confirmText;
  el.modalCancelBtn.textContent = cancelText;

  modalConfirmHandler = onConfirm || null;
  modalContext = renderBody ? renderBody() : null;

  if (modalContext?.element instanceof HTMLElement) {
    el.modalBody.replaceChildren(modalContext.element);
  } else if (modalContext instanceof HTMLElement) {
    el.modalBody.replaceChildren(modalContext);
  } else {
    el.modalBody.innerHTML = "";
  }

  el.modalOverlay.classList.remove("hidden");

  return new Promise((resolve) => {
    modalResolver = resolve;
    el.modalConfirmBtn.onclick = async () => {
      if (!modalConfirmHandler) {
        closeModal(true);
        return;
      }
      const result = await modalConfirmHandler(modalContext);
      if (typeof result === "undefined") {
        return;
      }
      closeModal(result);
    };

    const focusable = el.modalBody.querySelector("input, select, button");
    if (focusable) {
      focusable.focus();
      if (focusable.select) focusable.select();
    }
  });
}

async function promptForText({
  title,
  description,
  placeholder,
  confirmText,
  initialValue = "",
}) {
  return openModal({
    title,
    description,
    confirmText,
    renderBody: () => {
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = placeholder;
      input.value = initialValue;
      return { element: input, input };
    },
    onConfirm: ({ input }) => {
      const value = input.value.trim();
      if (!value) {
        pushToast("Поле не должно быть пустым", "error");
        input.focus();
        return undefined;
      }
      return value;
    },
  });
}

async function confirmAction({ title, description, confirmText = "Подтвердить" }) {
  return openModal({
    title,
    description,
    confirmText,
    renderBody: () => {
      const block = document.createElement("div");
      block.className = "modal-choice";
      block.innerHTML = `<strong>Подтверждение</strong><span>${escapeHtml(description)}</span>`;
      return { element: block };
    },
    onConfirm: () => true,
  });
}

async function choosePlaylist(playlists) {
  return openModal({
    title: "Добавить в плейлист",
    description: "Выберите локальный плейлист, в который нужно отправить текущий трек.",
    confirmText: "Добавить",
    renderBody: () => {
      let selectedId = String(playlists[0]?.id || "");
      const list = document.createElement("div");
      list.className = "modal-choice-list";

      const applySelection = () => {
        list.querySelectorAll(".modal-choice-button").forEach((button) => {
          button.classList.toggle("selected", button.dataset.playlistId === selectedId);
        });
      };

      playlists.forEach((playlist) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "modal-choice modal-choice-button";
        button.dataset.playlistId = String(playlist.id);

        const title = document.createElement("strong");
        title.textContent = playlist.name || "Без названия";

        const subtitle = document.createElement("span");
        subtitle.textContent = `${playlist.track_count || 0} ${trackWord(playlist.track_count || 0)}`;

        button.appendChild(title);
        button.appendChild(subtitle);
        button.addEventListener("click", () => {
          selectedId = button.dataset.playlistId || "";
          applySelection();
        });

        list.appendChild(button);
      });

      applySelection();
      return {
        element: list,
        getSelectedId: () => Number(selectedId),
      };
    },
    onConfirm: ({ getSelectedId }) => getSelectedId(),
  });
}

function setButtonsDisabledForScope(scope, disabled) {
  scope.querySelectorAll("[data-action]").forEach((button) => {
    button.disabled = disabled;
  });
}

function setSearchInputValue(value, source = "") {
  if (source !== "global") {
    el.globalSearchInput.value = value;
  }
  if (source !== "page") {
    el.searchInput.value = value;
  }
}

function setSettingsStatus(message, type = "") {
  if (!el.settingsStatus) return;
  el.settingsStatus.textContent = message;
  el.settingsStatus.classList.toggle("success", type === "success");
  el.settingsStatus.classList.toggle("error", type === "error");
}

function readSettingsForm() {
  return {
    backendUrl: el.settingsBackendUrlInput?.value.trim() || "",
    accessKey: el.settingsAccessKeyInput?.value.trim() || "",
  };
}

function renderSettingsPage() {
  if (!el.settingsBackendUrlInput || !el.settingsAccessKeyInput) return;

  if (document.activeElement !== el.settingsBackendUrlInput) {
    el.settingsBackendUrlInput.value = state.settings.backendUrl || "";
  }
  if (document.activeElement !== el.settingsAccessKeyInput) {
    el.settingsAccessKeyInput.value = state.settings.accessKey || "";
  }

  const proxyEnabled = Boolean(state.settings.backendUrl);
  if (el.settingsConnectionBadge) {
    el.settingsConnectionBadge.textContent = proxyEnabled ? "Подключено" : "Не подключено";
    el.settingsConnectionBadge.classList.toggle("active", proxyEnabled);
  }

  if (!proxyEnabled) {
    setSettingsStatus("Сервер не подключен. Если у вас есть адрес сервера и ключ доступа, добавьте их здесь.", "");
  } else {
    setSettingsStatus(`Сервер подключен: ${state.settings.backendUrl}`, "success");
  }
}

async function loadSettingsState() {
  try {
    const response = await window.soundcloudAPI.getSettings();
    state.settings = unwrapResponse(response, "Не удалось загрузить настройки");
    renderSettingsPage();
  } catch (error) {
    setSettingsStatus(normalizeError(error, "Не удалось загрузить настройки"), "error");
  }
}

async function saveSettingsFlow() {
  try {
    const settings = readSettingsForm();
    const response = await window.soundcloudAPI.saveSettings(settings);
    state.settings = unwrapResponse(response, "Не удалось сохранить настройки");
    renderSettingsPage();
    pushToast("Настройки сохранены", "success");
  } catch (error) {
    const message = normalizeError(error, "Не удалось сохранить настройки");
    setSettingsStatus(message, "error");
    pushToast(message, "error");
  }
}

async function testProxyFlow() {
  try {
    const settings = readSettingsForm();
    const saveResponse = await window.soundcloudAPI.saveSettings(settings);
    state.settings = unwrapResponse(saveResponse, "Не удалось сохранить настройки");
    renderSettingsPage();

    const response = await window.soundcloudAPI.testProxy();
    const health = unwrapResponse(response, "Не удалось проверить подключение");
    const serverReady = Boolean(health.hasSoundCloudClientId && health.hasSoundCloudClientSecret);

    if (serverReady) {
      setSettingsStatus("Соединение работает. Приложение готово к поиску и открытию подборок.", "success");
      pushToast("Подключение установлено", "success");
      return;
    }

    setSettingsStatus("Сервер отвечает, но еще не готов к работе. Обратитесь к автору клиента.", "error");
    pushToast("Сервер пока не готов к работе", "error");
  } catch (error) {
    const message = normalizeError(error, "Не удалось подключиться к серверу");
    setSettingsStatus(message, "error");
    pushToast(message, "error");
  }
}

function libraryViewCopy() {
  if (state.libraryTab === "playlists") {
    return {
      sectionTitle: "РџР»РµР№Р»РёСЃС‚С‹",
      sectionText: "Р›РѕРєР°Р»СЊРЅС‹Рµ РїРѕРґР±РѕСЂРєРё СЃ С‚СЂРµРєР°РјРё, РєРѕС‚РѕСЂС‹Рµ РјРѕР¶РЅРѕ РґРµСЂР¶Р°С‚СЊ РїРѕРґ СЂСѓРєРѕР№ РІРЅСѓС‚СЂРё РєР»РёРµРЅС‚Р°.",
      modeKicker: "РџР»РµР№Р»РёСЃС‚С‹",
      modeTitle: state.selectedPlaylist ? state.selectedPlaylist.name : "РЎРѕР±РёСЂР°Р№С‚Рµ СЃРІРѕРё РїРѕРґР±РѕСЂРєРё",
      modeText: state.selectedPlaylist
        ? `Р’РЅСѓС‚СЂРё СЃРµР№С‡Р°СЃ ${state.playlistTracks.length} ${trackWord(state.playlistTracks.length)}. РњРѕР¶РЅРѕ Р·Р°РїСѓСЃС‚РёС‚СЊ РІРµСЃСЊ РїР»РµР№Р»РёСЃС‚ РёР»Рё РѕС‡РёСЃС‚РёС‚СЊ РµРіРѕ РїРѕ РѕРґРЅРѕРјСѓ С‚СЂРµРєСѓ.`
        : "РЎРѕР·РґР°Р№С‚Рµ Р»РѕРєР°Р»СЊРЅС‹Р№ РїР»РµР№Р»РёСЃС‚, РґРѕР±Р°РІР»СЏР№С‚Рµ РІ РЅРµРіРѕ С‚СЂРµРєРё РёР· РїРѕРёСЃРєР° Рё РІРєР»СЋС‡Р°Р№С‚Рµ РІСЃРµ СЃСЂР°Р·Сѓ.",
      contentTitle: "РўСЂРµРєРё РїР»РµР№Р»РёСЃС‚Р°",
      contentText: "Р—РґРµСЃСЊ РѕС‚РєСЂС‹РІР°РµС‚СЃСЏ РїРѕР»РЅРѕРµ СЃРѕРґРµСЂР¶РёРјРѕРµ РІС‹Р±СЂР°РЅРЅРѕРіРѕ Р»РѕРєР°Р»СЊРЅРѕРіРѕ РїР»РµР№Р»РёСЃС‚Р°.",
      pageTitle: "РџР»РµР№Р»РёСЃС‚С‹",
      pageSubtitle: state.selectedPlaylist
        ? `РћС‚РєСЂС‹С‚ Ռ»РѕРєР°Р»СЊРЅС‹Р№ РїР»РµР№Р»РёСЃС‚ В«${state.selectedPlaylist.name}В».`
        : "РЎРѕР·РґР°РІР°Р№С‚Рµ, РѕС‚РєСЂС‹РІР°Р№С‚Рµ Рё РЅР°РїРѕР»РЅСЏР№С‚Рµ Р»РѕРєР°Р»СЊРЅС‹Рµ РїР»РµР№Р»РёСЃС‚С‹.",
    };
  }

  return {
    sectionTitle: "РР·Р±СЂР°РЅРЅРѕРµ",
    sectionText: "Р’СЃРµ С‚СЂРµРєРё, РєРѕС‚РѕСЂС‹Рµ РІС‹ СѓР¶Рµ РѕС‚РјРµС‚РёР»Рё Рё С…РѕС‚РёС‚Рµ РґРµСЂР¶Р°С‚СЊ РїРѕР±Р»РёР·РѕСЃС‚Рё.",
    modeKicker: "РР·Р±СЂР°РЅРЅРѕРµ",
    modeTitle: "РЎРѕС…СЂР°РЅРµРЅРЅС‹Рµ С‚СЂРµРєРё",
    modeText: "Р—РґРµСЃСЊ Р¶РёРІСѓС‚ С‚СЂРµРєРё, РєРѕС‚РѕСЂС‹Рµ РІС‹ СѓР¶Рµ РІС‹Р±СЂР°Р»Рё. РњРѕР¶РЅРѕ Р±С‹СЃС‚СЂРѕ Р·Р°РїСѓСЃРєР°С‚СЊ РёС… РёР»Рё РѕС‚РїСЂР°РІР»СЏС‚СЊ РІ РїР»РµР№Р»РёСЃС‚.",
    contentTitle: "РЎРѕРґРµСЂР¶РёРјРѕРµ",
    contentText: "РџР»РµР№Р»РёСЃС‚С‹ РѕС‚РєСЂС‹РІР°СЋС‚СЃСЏ РІ РѕС‚РґРµР»СЊРЅРѕРј СЂРµР¶РёРјРµ Р±РёР±Р»РёРѕС‚РµРєРё.",
    pageTitle: "РР·Р±СЂР°РЅРЅРѕРµ",
    pageSubtitle: "Р‘С‹СЃС‚СЂС‹Р№ РґРѕСЃС‚СѓРї Рє Р»СЋР±РёРјС‹Рј С‚СЂРµРєР°Рј Р±РµР· Р»РёС€РЅРµР№ СЃСѓРµС‚С‹.",
  };
}

function libraryViewCopyFixed() {
  if (state.libraryTab === "playlists") {
    return {
      sectionTitle: "Плейлисты",
      sectionText: "Локальные подборки с треками, которые можно держать под рукой внутри клиента.",
      modeKicker: state.selectedPlaylist ? "Выбранный плейлист" : "Плейлисты",
      modeTitle: state.selectedPlaylist ? state.selectedPlaylist.name : "Собирайте свои подборки",
      modeText: state.selectedPlaylist
        ? `Внутри сейчас ${state.playlistTracks.length} ${trackWord(state.playlistTracks.length)}. Можно запустить весь плейлист или управлять его треками по одному.`
        : "Создайте локальный плейлист, добавляйте в него треки из поиска и храните любимые подборки отдельно от избранного.",
      contentTitle: "Треки плейлиста",
      contentText: "Здесь открывается полное содержимое выбранного локального плейлиста.",
      pageTitle: "Плейлисты",
      pageSubtitle: state.selectedPlaylist
        ? `Открыт локальный плейлист «${state.selectedPlaylist.name}».`
        : "Создавайте, открывайте и наполняйте локальные плейлисты внутри клиента.",
    };
  }

  return {
    sectionTitle: "Избранное",
    sectionText: "Все треки, которые вы уже отметили и хотите держать поблизости.",
    modeKicker: "Избранное",
    modeTitle: "Сохраненные треки",
    modeText: "Здесь живут треки, которые вы уже выбрали. Можно быстро запускать их или отправлять в локальный плейлист.",
    contentTitle: "Избранные треки",
    contentText: "Плейлисты открываются в отдельном режиме библиотеки, а здесь собраны только сохраненные треки.",
    pageTitle: "Избранное",
    pageSubtitle: "Быстрый доступ к любимым трекам без лишней суеты.",
  };
}

function getPageHeaderMeta() {
  if (state.page === "search" && state.searchViewMode === "entity" && state.searchEntity) {
    const entity = state.searchEntity;
    return {
      eyebrow: kindLabel(entity),
      title: entity.title || "РћС‚РєСЂС‹С‚С‹Р№ СЂР°Р·РґРµР»",
      subtitle: detailMeta(entity) || detailText(entity),
    };
  }

  if (state.page === "library") {
    const libraryCopy = libraryViewCopyFixed();
    return {
      eyebrow: pageMeta.library.eyebrow,
      title: libraryCopy.pageTitle,
      subtitle: libraryCopy.pageSubtitle,
    };
  }

  return pageMeta[state.page] || pageMeta.home;
}

function renderPageHeader() {
  const meta = getPageHeaderMeta();
  el.pageEyebrow.textContent = meta.eyebrow;
  el.pageTitle.textContent = meta.title;
  el.pageSubtitle.textContent = meta.subtitle;
}

function setPage(page) {
  state.page = page;
  el.pages.forEach((node) => {
    node.classList.toggle("active", node.id === `page-${page}`);
  });
  el.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.page === page);
  });
  if (page === "settings") {
    renderSettingsPage();
  }
  renderPageHeader();
}

function setSearchTab(tab) {
  state.searchTab = tab;
  el.searchTabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.searchTab === tab);
  });
  document.querySelectorAll(".search-panel").forEach((panel) => {
    panel.classList.remove("active");
  });
  document.getElementById(`search${tab[0].toUpperCase()}${tab.slice(1)}`)?.classList.add("active");
}

function setLibraryTab(tab) {
  state.libraryTab = tab;
  el.libraryTabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.libraryTab === tab);
  });
  document.querySelectorAll(".library-panel").forEach((panel) => {
    panel.classList.remove("active");
  });
  (tab === "favorites" ? el.favoritesList : el.playlistsList).classList.add("active");
  const libraryPage = document.getElementById("page-library");
  libraryPage?.classList.toggle("library-mode-favorites", tab === "favorites");
  libraryPage?.classList.toggle("library-mode-playlists", tab === "playlists");
  renderLibraryChrome();
  renderDetailPanels();
}

function renderLibraryChrome() {
  const copy = libraryViewCopyFixed();
  if (el.librarySectionTitle) {
    el.librarySectionTitle.textContent = copy.sectionTitle;
  }
  if (el.librarySectionText) {
    el.librarySectionText.textContent = copy.sectionText;
  }
  if (el.libraryModeKicker) {
    el.libraryModeKicker.textContent = copy.modeKicker;
  }
  if (el.libraryModeTitle) {
    el.libraryModeTitle.textContent = copy.modeTitle;
  }
  if (el.libraryModeText) {
    el.libraryModeText.textContent = copy.modeText;
  }
  if (el.libraryContentTitle) {
    el.libraryContentTitle.textContent = copy.contentTitle;
  }
  if (el.libraryContentText) {
    el.libraryContentText.textContent = copy.contentText;
  }

  if (el.createPlaylistBtn) {
    el.createPlaylistBtn.classList.add("hidden");
  }
  if (el.libraryCreatePlaylistBtn) {
    el.libraryCreatePlaylistBtn.textContent = "Создать плейлист";
    el.libraryCreatePlaylistBtn.classList.toggle(
      "hidden",
      state.libraryTab !== "playlists" || Boolean(state.selectedPlaylist)
    );
  }
  if (el.detailCreatePlaylistBtn) {
    el.detailCreatePlaylistBtn.textContent = "Новый плейлист";
    el.detailCreatePlaylistBtn.classList.toggle("hidden", state.libraryTab !== "playlists");
  }
  renderPageHeader();
}

function renderLibraryChrome() {
  const copy = libraryViewCopyFixed();

  if (el.librarySectionTitle) {
    el.librarySectionTitle.textContent = copy.sectionTitle;
  }
  if (el.librarySectionText) {
    el.librarySectionText.textContent = copy.sectionText;
  }
  if (el.libraryModeKicker) {
    el.libraryModeKicker.textContent = copy.modeKicker;
  }
  if (el.libraryModeTitle) {
    el.libraryModeTitle.textContent = copy.modeTitle;
  }
  if (el.libraryModeText) {
    el.libraryModeText.textContent = copy.modeText;
  }
  if (el.libraryContentTitle) {
    el.libraryContentTitle.textContent = copy.contentTitle;
  }
  if (el.libraryContentText) {
    el.libraryContentText.textContent = copy.contentText;
  }
  if (el.createPlaylistBtn) {
    el.createPlaylistBtn.classList.add("hidden");
  }
  if (el.detailCreatePlaylistBtn) {
    el.detailCreatePlaylistBtn.textContent = "Создать плейлист";
    el.detailCreatePlaylistBtn.classList.toggle("hidden", state.libraryTab !== "playlists");
  }

  renderPageHeader();
}

function getDefaultSearchEntityTab(entity) {
  if (entity?.kind !== "artist") {
    return "tracks";
  }
  if (entity.tracks?.length) return "tracks";
  if (entity.albums?.length) return "albums";
  if (entity.playlists?.length) return "playlists";
  return "tracks";
}

function buildSearchEntitySnapshot() {
  if (state.searchViewMode === "entity" && state.searchEntity) {
    return {
      type: "entity",
      entity: state.searchEntity,
      tab: state.searchEntityTab,
      info: state.searchEntityInfo,
    };
  }

  return {
    type: "results",
    tab: state.searchTab,
    selectedItem: state.selectedItem,
  };
}

function setSearchEntityTab(tab) {
  state.searchEntityTab = tab;
  el.entityTabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.entityTab === tab);
  });
  renderSearchEntity();
}

function openSearchEntity(entity, infoText) {
  state.searchEntityHistory.push(buildSearchEntitySnapshot());
  state.searchViewMode = "entity";
  state.searchEntity = entity;
  state.searchEntityInfo = infoText || "";
  state.searchEntityTab = getDefaultSearchEntityTab(entity);
  state.selectedItem = entity;
  setPage("search");
  renderHome();
  renderSearchResults();
  renderLibraryPanels();
  renderDetailPanels();
}

function closeSearchEntity() {
  const snapshot = state.searchEntityHistory.pop();
  if (!snapshot || snapshot.type === "results") {
    state.searchViewMode = "results";
    state.searchEntity = null;
    state.searchEntityInfo = "";
    if (snapshot?.tab) {
      setSearchTab(snapshot.tab);
    }
    state.selectedItem = snapshot?.selectedItem || null;
    renderHome();
    renderSearchResults();
    renderLibraryPanels();
    renderDetailPanels();
    return;
  }

  state.searchViewMode = "entity";
  state.searchEntity = snapshot.entity;
  state.searchEntityInfo = snapshot.info || "";
  state.searchEntityTab = snapshot.tab || getDefaultSearchEntityTab(snapshot.entity);
  state.selectedItem = snapshot.entity;
  renderHome();
  renderSearchResults();
  renderLibraryPanels();
  renderDetailPanels();
}

function renderSearchWorkspace() {
  const showEntity = state.searchViewMode === "entity" && state.searchEntity;
  el.searchStage?.classList.toggle("hidden", showEntity);
  el.searchResultsView?.classList.toggle("hidden", showEntity);
  el.searchEntityView?.classList.toggle("hidden", !showEntity);
  renderPageHeader();
}

function searchEntityStats(entity) {
  if (!entity) return [];

  if (entity.kind === "artist") {
    return [
      { label: "Треки", value: String(entity.tracks?.length || 0) },
      { label: "Альбомы", value: String(entity.albums?.length || 0) },
      { label: "Плейлисты", value: String(entity.playlists?.length || 0) },
      { label: "Подписчики", value: formatCount(entity.followers || 0) },
    ];
  }

  return [
    { label: "Треков", value: String(entity.tracks?.length || entity.track_count || 0) },
    { label: entity.kind === "album" ? "Формат" : "Тип", value: entity.kind === "album" ? "Альбом" : "Плейлист" },
    { label: "Автор", value: entity.uploader || "SoundCloud" },
  ];
}

function renderSearchEntity() {
  renderSearchWorkspace();
  if (state.searchViewMode !== "entity" || !state.searchEntity) {
    return;
  }

  const entity = state.searchEntity;
  const artwork = getArtwork(entity);
  el.entityCover.innerHTML = `${artwork ? `<img src="${escapeHtml(artwork)}" alt="" onerror="this.classList.add('hidden')" />` : ""}<span>${escapeHtml(itemInitials(entity))}</span>`;
  el.entityType.textContent = kindLabel(entity);
  el.entityTitle.textContent = entity.title || "Без названия";
  el.entityMeta.textContent = detailMeta(entity);
  el.entityText.textContent = detailText(entity);

  const stats = searchEntityStats(entity);
  el.entityStatsGrid.innerHTML = stats
    .map((stat) => `
      <article class="entity-stat-card">
        <strong>${escapeHtml(stat.value)}</strong>
        <span>${escapeHtml(stat.label)}</span>
      </article>
    `)
    .join("");

  const tracks = entity.tracks || entity.entries || [];
  const canPlay = tracks.length > 0;
  el.entityPrimaryBtn.classList.toggle("hidden", !canPlay);
  el.entityPrimaryBtn.textContent = entity.kind === "artist"
    ? "Слушать треки"
    : entity.kind === "album"
      ? "Слушать альбом"
      : "Слушать плейлист";
  el.entityPrimaryBtn.onclick = async () => {
    if (!tracks.length) return;
    await playTrack(tracks[0], tracks);
  };
  el.entityBrowserBtn.onclick = async () => openInBrowser(entity);

  const isArtist = entity.kind === "artist";
  el.entityTabs.classList.toggle("hidden", !isArtist);
  el.entityTabButtons.forEach((button) => {
    if (!isArtist) {
      button.classList.remove("active");
      return;
    }
    const tab = button.dataset.entityTab;
    const shouldShow =
      (tab === "tracks" && (entity.tracks?.length || 0) > 0) ||
      (tab === "albums" && (entity.albums?.length || 0) > 0) ||
      (tab === "playlists" && (entity.playlists?.length || 0) > 0);
    button.classList.toggle("hidden", !shouldShow);
    button.classList.toggle("active", state.searchEntityTab === tab);
  });

  if (!isArtist) {
    el.entityContentTitle.textContent = entity.kind === "album" ? "Треки альбома" : "Треки плейлиста";
    el.entityContentText.textContent = entity.kind === "album"
      ? "Полная раскладка альбома внутри клиента."
      : "Все треки выбранного плейлиста под рукой.";
    renderTrackRows(el.entityContentList, tracks, {
      emptyText: entity.kind === "album" ? "В этом альбоме пока нет доступных треков." : "В этом плейлисте пока нет доступных треков.",
      queue: tracks,
    });
    return;
  }

  if (state.searchEntityTab === "albums") {
    el.entityContentTitle.textContent = "Альбомы";
    el.entityContentText.textContent = "Релизы артиста, которые можно открывать и слушать внутри клиента.";
    renderCollectionRows(el.entityContentList, entity.albums || [], {
      emptyText: "Альбомы пока не найдены.",
      primaryLabel: "Открыть",
      onPrimary: openCollection,
      onSecondary: openInBrowser,
    });
    return;
  }

  if (state.searchEntityTab === "playlists") {
    el.entityContentTitle.textContent = "Плейлисты";
    el.entityContentText.textContent = "Подборки артиста, доступные для открытия внутри клиента.";
    renderCollectionRows(el.entityContentList, entity.playlists || [], {
      emptyText: "Плейлисты пока не найдены.",
      primaryLabel: "Открыть",
      onPrimary: openCollection,
      onSecondary: openInBrowser,
    });
    return;
  }

  el.entityContentTitle.textContent = "Треки";
  el.entityContentText.textContent = "Треки артиста, которые можно сразу запускать, добавлять в избранное и в локальные плейлисты.";
  renderTrackRows(el.entityContentList, entity.tracks || [], {
    emptyText: "У этого артиста пока нет доступных треков.",
    queue: entity.tracks || [],
  });
}

function playerSourceLabel() {
  if (state.playerLoading) return "Источник: подготовка";
  if (state.audioSourceMode === "stream") return "Источник: поток";
  if (state.audioSourceMode === "cache") return "Источник: локальный кэш";
  if (state.audioSourceMode === "error") return "Источник: ошибка";
  return "Источник: ожидание";
}

function updatePlayerProgress() {
  const current = el.audioPlayer.currentTime || 0;
  const duration = el.audioPlayer.duration || 0;
  el.currentTime.textContent = formatTime(current);
  el.totalTime.textContent = formatTime(duration);
  el.progressSlider.max = Math.max(1, duration);
  el.progressSlider.value = current;
}

function updatePlayerArtwork(item) {
  const artwork = getArtwork(item);
  if (artwork) {
    el.coverImage.src = artwork;
    el.coverImage.classList.remove("hidden");
  } else {
    el.coverImage.removeAttribute("src");
    el.coverImage.classList.add("hidden");
  }
  el.playerCoverFallback.textContent = item ? itemInitials(item) : "SC";
}

function renderPlayerState() {
  const track = state.currentTrack;
  if (!track) {
    el.playerTitle.textContent = "Ничего не играет";
    el.playerArtist.textContent = "Выберите трек для запуска";
    el.playerSource.textContent = playerSourceLabel();
    updatePlayerArtwork(null);
    el.playPauseBtn.textContent = state.playerLoading ? "…" : "▶";
    return;
  }

  el.playerTitle.textContent = track.title || "Без названия";
  el.playerArtist.textContent = getArtist(track);
  el.playerSource.textContent = playerSourceLabel();
  updatePlayerArtwork(track);
  el.playPauseBtn.textContent = state.playerLoading ? "…" : (el.audioPlayer.paused ? "▶" : "⏸");
}

function playerSourceLabel() {
  if (state.playerLoading) return "Источник: подготовка";
  if (state.audioSourceMode === "stream") return "Источник: поток";
  if (state.audioSourceMode === "cache") return "Источник: локальный кэш";
  if (state.audioSourceMode === "error") return "Источник: ошибка";
  return "Источник: ожидание";
}

function playerMetaText(track) {
  if (!track) {
    return "Запустите трек, чтобы открыть полноэкранный плеер, очередь и быстрые действия.";
  }
  return trackMetaText(track) || "Трек готов к воспроизведению.";
}

function syncPlayerChromeState() {
  if (!state.currentTrack) {
    state.playerExpanded = false;
  }
  document.body.classList.toggle("player-expanded", state.playerExpanded);
  el.playerFullscreen?.classList.toggle("hidden", !state.playerExpanded);
  el.playerQueuePanel?.classList.toggle("hidden", !state.queuePanelOpen);
}

function volumeIcon() {
  if (el.audioPlayer.muted || el.audioPlayer.volume <= 0) return "🔇";
  if (el.audioPlayer.volume < 0.45) return "🔉";
  return "🔊";
}

function updateVolumeControls() {
  const volumeValue = Math.round((el.audioPlayer.muted ? 0 : el.audioPlayer.volume) * 100);
  volumeSliders().forEach((slider) => {
    if (document.activeElement !== slider) {
      slider.value = volumeValue;
    }
  });
  muteButtons().forEach((button) => {
    button.textContent = volumeIcon();
    button.classList.toggle("active", el.audioPlayer.muted);
  });
}

function renderPlayerQueue() {
  syncPlayerChromeState();

  if (!el.playerQueueList || !el.playerQueueSummary || !el.clearQueueBtn) {
    return;
  }

  const queue = state.currentQueue;
  const currentIndex = state.currentQueueIndex >= 0 ? state.currentQueueIndex : 0;
  const upcomingCount = queue.length ? Math.max(queue.length - currentIndex - 1, 0) : 0;

  el.playerQueueSummary.textContent = queue.length
    ? `Сейчас ${Math.min(currentIndex + 1, queue.length)} из ${queue.length} • впереди ${upcomingCount}`
    : "Очередь появится после запуска первого трека.";
  el.clearQueueBtn.disabled = queue.length <= 1;

  if (!queue.length) {
    showEmptyState(el.playerQueueList, "Очередь пока пуста. Запустите трек, и он появится здесь.");
    return;
  }

  el.playerQueueList.innerHTML = queue
    .map((item, index) => `
      <article class="player-queue-item ${index === state.currentQueueIndex ? "active" : ""}" data-queue-index="${index}">
        ${artMarkup(item, "player-queue-art")}
        <div class="player-queue-copy">
          <div class="player-queue-title">${escapeHtml(item.title || "Без названия")}</div>
          <div class="player-queue-subtitle">${escapeHtml(getArtist(item))}</div>
          <div class="player-queue-meta">${escapeHtml(trackMetaText(item) || "Без дополнительных данных")}</div>
        </div>
        ${
          index === state.currentQueueIndex
            ? '<span class="player-queue-pill">Сейчас</span>'
            : '<button class="player-queue-remove" data-queue-action="remove" type="button">✕</button>'
        }
      </article>
    `)
    .join("");
}

function updatePlayerProgress() {
  const current = el.audioPlayer.currentTime || 0;
  const duration = el.audioPlayer.duration || 0;
  [el.currentTime, el.fullscreenCurrentTime].filter(Boolean).forEach((node) => {
    node.textContent = formatTime(current);
  });
  [el.totalTime, el.fullscreenTotalTime].filter(Boolean).forEach((node) => {
    node.textContent = formatTime(duration);
  });
  progressSliders().forEach((slider) => {
    slider.max = Math.max(1, duration);
    if (document.activeElement !== slider) {
      slider.value = current;
    }
  });
}

function updatePlayerArtwork(item) {
  const artwork = getArtwork(item);
  [el.coverImage, el.fullscreenCoverImage].filter(Boolean).forEach((image) => {
    if (artwork) {
      image.src = artwork;
      image.classList.remove("hidden");
    } else {
      image.removeAttribute("src");
      image.classList.add("hidden");
    }
  });
  [el.playerCoverFallback, el.fullscreenCoverFallback].filter(Boolean).forEach((fallback) => {
    fallback.textContent = item ? itemInitials(item) : "SC";
  });
}

function updateShuffleButtons() {
  shuffleButtons().forEach((button) => {
    button.classList.toggle("active", state.shuffle);
  });
}

function renderPlayerState() {
  const track = state.currentTrack;
  const hasTrack = Boolean(track && isTrack(track));
  const artistProfile = getTrackArtistProfile(track);
  const isFavorite = hasTrack && isTrackFavorite(track);
  const playLabel = state.playerLoading ? "…" : (el.audioPlayer.paused ? "▶" : "⏸");

  syncPlayerChromeState();
  updatePlayerProgress();
  updateVolumeControls();
  updateRepeatButton();
  updateShuffleButtons();
  renderPlayerQueue();

  playButtons().forEach((button) => {
    button.textContent = playLabel;
  });

  if (el.playerFavoriteBtn) {
    el.playerFavoriteBtn.textContent = isFavorite ? "♥" : "♡";
    el.playerFavoriteBtn.classList.toggle("active", isFavorite);
    el.playerFavoriteBtn.disabled = !hasTrack;
  }
  if (el.fullscreenFavoriteBtn) {
    el.fullscreenFavoriteBtn.textContent = isFavorite ? "В избранном" : "В избранное";
    el.fullscreenFavoriteBtn.classList.toggle("active", isFavorite);
    el.fullscreenFavoriteBtn.disabled = !hasTrack;
  }
  if (el.playerAddToPlaylistBtn) {
    el.playerAddToPlaylistBtn.disabled = !hasTrack;
  }
  if (el.fullscreenAddToPlaylistBtn) {
    el.fullscreenAddToPlaylistBtn.disabled = !hasTrack;
  }
  if (el.queueBtn) {
    el.queueBtn.textContent = "☰";
    el.queueBtn.classList.toggle("active", state.queuePanelOpen);
    el.queueBtn.disabled = !state.currentQueue.length;
  }
  if (el.fullscreenQueueBtn) {
    el.fullscreenQueueBtn.textContent = state.currentQueue.length ? `Очередь (${state.currentQueue.length})` : "Очередь";
    el.fullscreenQueueBtn.classList.toggle("active", state.queuePanelOpen);
    el.fullscreenQueueBtn.disabled = !state.currentQueue.length;
  }

  if (!track) {
    el.playerTitle.textContent = "Ничего не играет";
    el.playerArtist.textContent = "Выберите трек для запуска";
    el.playerArtist.title = "";
    el.playerArtist.setAttribute("tabindex", "-1");
    el.playerArtist.setAttribute("role", "note");
    el.playerSource.textContent = playerSourceLabel();
    if (el.fullscreenTitle) {
      el.fullscreenTitle.textContent = "Ничего не играет";
    }
    if (el.fullscreenArtist) {
      el.fullscreenArtist.textContent = "Выберите трек для запуска";
      el.fullscreenArtist.disabled = true;
    }
    if (el.fullscreenSource) {
      el.fullscreenSource.textContent = playerSourceLabel();
    }
    if (el.fullscreenTrackMeta) {
      el.fullscreenTrackMeta.textContent = playerMetaText(null);
    }
    updatePlayerArtwork(null);
    return;
  }

  el.playerTitle.textContent = track.title || "Без названия";
  el.playerArtist.textContent = getArtist(track);
  el.playerArtist.title = artistProfile ? "Открыть профиль исполнителя" : "";
  el.playerArtist.setAttribute("tabindex", artistProfile ? "0" : "-1");
  el.playerArtist.setAttribute("role", artistProfile ? "button" : "note");
  el.playerSource.textContent = playerSourceLabel();
  if (el.fullscreenTitle) {
    el.fullscreenTitle.textContent = track.title || "Без названия";
  }
  if (el.fullscreenArtist) {
    el.fullscreenArtist.textContent = getArtist(track);
    el.fullscreenArtist.disabled = !artistProfile;
  }
  if (el.fullscreenSource) {
    el.fullscreenSource.textContent = playerSourceLabel();
  }
  if (el.fullscreenTrackMeta) {
    el.fullscreenTrackMeta.textContent = playerMetaText(track);
  }
  updatePlayerArtwork(track);
}

function kindLabel(item) {
  if (!item) return "Ничего не выбрано";
  if (item.kind === "playlist-local") return "Локальный плейлист";
  if (item.kind === "playlist") return "Плейлист";
  if (item.kind === "album") return "Альбом";
  if (item.kind === "artist") return "Исполнитель";
  return "Трек";
}

function detailMeta(item) {
  if (!item) return "";
  const parts = [];
  if (item.kind === "playlist-local") {
    parts.push(`${item.track_count || state.playlistTracks.length || 0} ${trackWord(item.track_count || state.playlistTracks.length || 0)}`);
    parts.push("Локальная коллекция");
    return parts.join(" • ");
  }
  if (isTrack(item)) {
    parts.push(getArtist(item));
    if (item.duration) parts.push(formatTime(item.duration));
    if (item.genre) parts.push(item.genre);
    if (item.view_count) parts.push(`${formatCount(item.view_count)} прослуш.`);
    return parts.join(" • ");
  }
  if (item.kind === "playlist" || item.kind === "album") {
    parts.push(item.uploader || getArtist(item));
    if (item.track_count) parts.push(`${item.track_count} ${trackWord(item.track_count)}`);
    return parts.join(" • ");
  }
  if (item.kind === "artist") {
    parts.push(item.uploader || item.title || "Профиль");
    if (item.followers) parts.push(`${formatCount(item.followers)} подписчиков`);
    return parts.join(" • ");
  }
  return "";
}

function detailText(item) {
  if (!item) {
    return "Выберите трек, плейлист или артиста. Здесь появятся подробности и быстрые действия.";
  }
  if (item.kind === "playlist-local") {
    return "Локальный плейлист хранится только в вашем клиенте. Можно добавлять в него треки из поиска, избранного и недавно прослушанных.";
  }
  return item.description || item.webpage_url || "Описание пока недоступно.";
}

function getLibraryDetailItem() {
  if (state.libraryTab === "playlists") {
    if (!state.selectedPlaylist) return null;
    return normalizePlaylistSelection({
      ...state.selectedPlaylist,
      track_count: state.selectedPlaylist.track_count || state.playlistTracks.length,
    });
  }

  return isTrack(state.selectedItem) && isTrackFavorite(state.selectedItem) ? state.selectedItem : null;
}

function detailFallback(panelType) {
  if (panelType === "library" && state.libraryTab === "playlists") {
    return {
      type: "Плейлисты",
      title: "Выберите или создайте плейлист",
      text: "Откройте один из локальных плейлистов слева или соберите новую подборку, чтобы сразу наполнить ее треками.",
    };
  }

  if (panelType === "library") {
    return {
      type: "Избранное",
      title: "Выберите трек из избранного",
      text: "Слева показаны ваши сохраненные треки. Здесь можно быстро запустить их или отправить в локальный плейлист.",
    };
  }

  return {
    type: "Ничего не выбрано",
    title: "Выберите трек, плейлист или артиста",
    text: detailText(null),
  };
}

function updateActionVisibility(panel, item) {
  const showTrackControls = Boolean(item && isTrack(item));
  const showCollectionControls = Boolean(item && (item.kind === "playlist" || item.kind === "album" || item.kind === "artist"));
  const showBrowserControl = Boolean(item?.webpage_url);

  panel.querySelectorAll('[data-role="play-action"]').forEach((button) => {
    button.classList.toggle("hidden", !showTrackControls);
  });
  panel.querySelectorAll('[data-role="collection-action"]').forEach((button) => {
    button.classList.toggle("hidden", !showCollectionControls);
    if (!showCollectionControls) return;
    if (item.kind === "artist") {
      button.textContent = "Открыть профиль";
      return;
    }
    if (item.kind === "album") {
      button.textContent = "Открыть альбом";
      return;
    }
    button.textContent = "Открыть подборку";
  });
  panel.querySelectorAll('[data-role="favorite-action"]').forEach((button) => {
    button.classList.toggle("hidden", !showTrackControls);
    button.textContent = showTrackControls && isTrackFavorite(item) ? "Убрать из избранного" : "В избранное";
  });
  panel.querySelectorAll('[data-role="playlist-action"]').forEach((button) => {
    button.classList.toggle("hidden", !showTrackControls);
  });
  panel.querySelectorAll('[data-role="download-action"]').forEach((button) => {
    button.classList.toggle("hidden", !showTrackControls);
  });
  panel.querySelectorAll('[data-role="browser-action"]').forEach((button) => {
    button.classList.toggle("hidden", !showBrowserControl);
  });
  setButtonsDisabledForScope(panel, !item);
}

function renderDetailPanels() {
  el.detailPanels.forEach((panel) => {
    const panelType = panel.dataset.detailPanel;
    const item = panelType === "library" ? getLibraryDetailItem() : state.selectedItem;
    updateActionVisibility(panel, item);
    const cover = panel.querySelector('[data-field="cover"]');
    const type = panel.querySelector('[data-field="type"]');
    const title = panel.querySelector('[data-field="title"]');
    const meta = panel.querySelector('[data-field="meta"]');
    const text = panel.querySelector('[data-field="text"]');

    if (!item) {
      const fallback = detailFallback(panelType);
      type.textContent = "Ничего не выбрано";
      title.textContent = "Выберите трек, плейлист или артиста";
      meta.textContent = "";
      text.textContent = detailText(null);
      type.textContent = fallback.type;
      title.textContent = fallback.title;
      text.textContent = fallback.text;
      cover.innerHTML = "<span>SC</span>";
      return;
    }

    type.textContent = kindLabel(item);
    title.textContent = item.title || item.name || "Без названия";
    meta.textContent = detailMeta(item);
    text.textContent = detailText(item);
    cover.innerHTML = `${getArtwork(item) ? `<img src="${escapeHtml(getArtwork(item))}" alt="" onerror="this.classList.add('hidden')" />` : ""}<span>${escapeHtml(itemInitials(item))}</span>`;
  });

  const showPlaylistControls = state.libraryTab === "playlists" && Boolean(state.selectedPlaylist);
  el.playlistControls.classList.toggle("hidden", !showPlaylistControls);
  if (el.detailCreatePlaylistBtn) {
    el.detailCreatePlaylistBtn.classList.toggle("hidden", !showPlaylistControls);
  }
  if (el.playPlaylistBtn) {
    el.playPlaylistBtn.disabled = !state.playlistTracks.length;
  }
  if (el.deletePlaylistBtn) {
    el.deletePlaylistBtn.disabled = !state.selectedPlaylist;
  }
}

function renderDetailPanels() {
  el.detailPanels.forEach((panel) => {
    const panelType = panel.dataset.detailPanel;
    const item = panelType === "library" ? getLibraryDetailItem() : state.selectedItem;

    updateActionVisibility(panel, item);

    const cover = panel.querySelector('[data-field="cover"]');
    const type = panel.querySelector('[data-field="type"]');
    const title = panel.querySelector('[data-field="title"]');
    const meta = panel.querySelector('[data-field="meta"]');
    const text = panel.querySelector('[data-field="text"]');

    if (!item) {
      const fallback = detailFallback(panelType);
      type.textContent = fallback.type;
      title.textContent = fallback.title;
      meta.textContent = "";
      text.textContent = fallback.text;
      cover.innerHTML = "<span>SC</span>";
      return;
    }

    type.textContent = kindLabel(item);
    title.textContent = item.title || item.name || "Без названия";
    meta.textContent = detailMeta(item);
    text.textContent = detailText(item);
    cover.innerHTML = `${getArtwork(item) ? `<img src="${escapeHtml(getArtwork(item))}" alt="" onerror="this.classList.add('hidden')" />` : ""}<span>${escapeHtml(itemInitials(item))}</span>`;
  });

  const showPlaylistControls = state.libraryTab === "playlists";
  const hasSelectedPlaylist = Boolean(state.selectedPlaylist);

  el.playlistControls.classList.toggle("hidden", !showPlaylistControls);

  if (el.detailCreatePlaylistBtn) {
    el.detailCreatePlaylistBtn.classList.toggle("hidden", !showPlaylistControls);
  }
  if (el.playPlaylistBtn) {
    el.playPlaylistBtn.classList.toggle("hidden", !hasSelectedPlaylist);
    el.playPlaylistBtn.disabled = !state.playlistTracks.length;
  }
  if (el.deletePlaylistBtn) {
    el.deletePlaylistBtn.classList.toggle("hidden", !hasSelectedPlaylist);
    el.deletePlaylistBtn.disabled = !hasSelectedPlaylist;
  }
}

function trackMetaText(item) {
  const parts = [];
  if (item.duration) parts.push(formatTime(item.duration));
  if (item.genre) parts.push(item.genre);
  if (item.view_count) parts.push(`${formatCount(item.view_count)} прослуш.`);
  return parts.join(" • ");
}

function renderCoverCards(container, items, { onPrimary, onSecondary, secondaryLabel = "♥" }) {
  if (!items.length) {
    showEmptyState(container, "Пока пусто. Запустите трек, и он появится здесь.");
    return;
  }

  container.innerHTML = items
    .map((item, index) => {
      const subtitle = isTrack(item) ? getArtist(item) : detailMeta(item);
      return `
        <article class="cover-card ${isSelectedItem(item) ? "selected" : ""}" data-index="${index}">
          ${artMarkup(item, "cover-art")}
          <div class="cover-meta">
            <div class="cover-title">${escapeHtml(item.title || "Без названия")}</div>
            <div class="cover-subtitle">${escapeHtml(subtitle)}</div>
          </div>
          <div class="cover-actions">
            <button class="row-play-btn" data-cover-action="primary">${isTrack(item) ? "Слушать" : "Открыть"}</button>
            <button class="row-icon-btn ${secondaryLabel === "♥" && isTrack(item) && isTrackFavorite(item) ? "active" : ""}" data-cover-action="secondary">${escapeHtml(secondaryLabel)}</button>
          </div>
        </article>
      `;
    })
    .join("");

  container.onclick = async (event) => {
    const card = event.target.closest(".cover-card");
    if (!card) return;
    const item = items[Number(card.dataset.index)];
    const action = event.target.closest("[data-cover-action]")?.dataset.coverAction;

    if (!action) {
      selectItem(item);
      return;
    }

    if (action === "primary") {
      await onPrimary(item, items);
      return;
    }

    if (action === "secondary") {
      await onSecondary(item, items);
    }
  };
}

function renderTrackRows(
  container,
  tracks,
  {
    emptyText,
    queue,
    preservePlaylist = false,
    removable = false,
    onRemove,
    showFavorite = true,
    showQueueButton = true,
    primaryLabel = "Слушать",
  } = {}
) {
  if (!tracks.length) {
    showEmptyState(container, emptyText);
    return;
  }

  container.innerHTML = tracks
    .map((item, index) => `
      <article class="track-row ${isSelectedItem(item) ? "selected" : ""}" data-index="${index}">
        ${artMarkup(item, "track-art")}
        <div class="track-copy">
          <div class="track-title">${escapeHtml(item.title || "Без названия")}</div>
          <div class="track-subtitle">${escapeHtml(getArtist(item))}</div>
          <div class="track-meta">${escapeHtml(trackMetaText(item) || item.webpage_url || "Без дополнительных данных")}</div>
        </div>
        <div class="track-actions">
          ${showFavorite ? `<button class="row-icon-btn ${isTrackFavorite(item) ? "active" : ""}" data-row-action="favorite">♥</button>` : ""}
          ${removable ? '<button class="row-icon-btn" data-row-action="remove">−</button>' : ""}
          ${showQueueButton && !removable ? '<button class="row-icon-btn" data-row-action="queue">＋</button>' : ""}
          <button class="row-play-btn" data-row-action="play">${escapeHtml(primaryLabel)}</button>
        </div>
      </article>
    `)
    .join("");

  container.onclick = async (event) => {
    const row = event.target.closest(".track-row");
    if (!row) return;
    const item = tracks[Number(row.dataset.index)];
    const action = event.target.closest("[data-row-action]")?.dataset.rowAction;

    if (!action) {
      selectItem(item, { preservePlaylist });
      return;
    }

    if (action === "play") {
      await playTrack(item, queue || tracks, { preservePlaylist });
      return;
    }

    if (action === "favorite") {
      await toggleFavoriteForItem(item);
      return;
    }

    if (action === "queue") {
      queueTrack(item);
      return;
    }

    if (action === "remove" && onRemove) {
      await onRemove(item);
    }
  };

  container.ondblclick = async (event) => {
    const row = event.target.closest(".track-row");
    if (!row) return;
    const item = tracks[Number(row.dataset.index)];
    await playTrack(item, queue || tracks, { preservePlaylist });
  };
}

function renderCollectionRows(
  container,
  items,
  {
    emptyText,
    primaryLabel,
    onPrimary,
    onSecondary,
    secondaryLabel = "↗",
  }
) {
  if (!items.length) {
    showEmptyState(container, emptyText);
    return;
  }

  container.innerHTML = items
    .map((item, index) => {
      const subtitle = item.kind === "artist" ? (item.uploader || item.title || "Профиль") : (item.uploader || getArtist(item));
      const meta = item.kind === "artist"
        ? `${formatCount(item.followers || 0)} подписчиков`
        : `${item.track_count || 0} ${trackWord(item.track_count || 0)}`;

      return `
        <article class="track-row ${isSelectedItem(item) ? "selected" : ""}" data-index="${index}">
          ${artMarkup(item, "track-art")}
          <div class="track-copy">
            <div class="track-title">${escapeHtml(item.title || "Без названия")}</div>
            <div class="track-subtitle">${escapeHtml(subtitle)}</div>
            <div class="track-meta">${escapeHtml(meta)}</div>
          </div>
          <div class="track-actions">
            <button class="row-icon-btn" data-row-action="secondary">${escapeHtml(secondaryLabel)}</button>
            <button class="row-play-btn" data-row-action="primary">${escapeHtml(primaryLabel)}</button>
          </div>
        </article>
      `;
    })
    .join("");

  container.onclick = async (event) => {
    const row = event.target.closest(".track-row");
    if (!row) return;
    const item = items[Number(row.dataset.index)];
    const action = event.target.closest("[data-row-action]")?.dataset.rowAction;

    if (!action) {
      selectItem(item);
      return;
    }

    if (action === "primary") {
      await onPrimary(item);
      return;
    }

    if (action === "secondary" && onSecondary) {
      await onSecondary(item);
    }
  };

  container.ondblclick = async (event) => {
    const row = event.target.closest(".track-row");
    if (!row) return;
    const item = items[Number(row.dataset.index)];
    await onPrimary(item);
  };
}

function renderSidebar() {
  el.sidebarFavoritesCount.textContent = String(state.favorites.length);
  el.sidebarRecentCount.textContent = String(state.recent.length);
  el.sidebarPlaylistCount.textContent = String(state.playlists.length);
  el.heroFavoritesCount.textContent = String(state.favorites.length);
  el.heroRecentCount.textContent = String(state.recent.length);
  el.heroPlaylistCount.textContent = String(state.playlists.length);

  if (!state.playlists.length) {
    el.sidebarPlaylistList.innerHTML = '<div class="empty-state">Создайте первый плейлист</div>';
    return;
  }

  el.sidebarPlaylistList.innerHTML = state.playlists
    .slice(0, 6)
    .map((playlist) => `
      <button class="sidebar-playlist-btn ${state.selectedPlaylist?.id === playlist.id ? "active" : ""}" data-playlist-id="${playlist.id}">
        <span>${escapeHtml(playlist.name)}</span>
        <small>${playlist.track_count || 0}</small>
      </button>
    `)
    .join("");

  el.sidebarPlaylistList.querySelectorAll(".sidebar-playlist-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const playlist = state.playlists.find((item) => String(item.id) === button.dataset.playlistId);
      if (!playlist) return;
      setPage("library");
      setLibraryTab("playlists");
      await selectPlaylist(playlist);
    });
  });
}

function renderHome() {
  const recent = recentTracks().slice(0, 6);
  const favorites = favoriteTracks();
  const mix = [...favorites, ...recentTracks()]
    .filter((item, index, list) => list.findIndex((candidate) => getItemId(candidate) === getItemId(item)) === index)
    .slice(0, 6);

  const queuePreview = state.currentQueue.length
    ? state.currentQueue.slice(Math.max(0, state.currentQueueIndex), Math.max(0, state.currentQueueIndex) + 4)
    : recentTracks().slice(0, 4);

  renderCoverCards(el.homeRecentGrid, recent, {
    onPrimary: (item, queue) => playTrack(item, queue),
    onSecondary: (item) => toggleFavoriteForItem(item),
  });

  renderCoverCards(el.homeMixGrid, mix, {
    onPrimary: (item, queue) => playTrack(item, queue),
    onSecondary: (item) => queueTrack(item),
    secondaryLabel: "+",
  });

  renderTrackRows(el.homeQueueList, queuePreview, {
    emptyText: "Очередь пока пустая. Запустите любой трек, и он появится здесь.",
    queue: queuePreview,
    showFavorite: true,
    showQueueButton: false,
    primaryLabel: "Играть",
  });
}

function renderPlaylistsList() {
  if (!state.playlists.length) {
    showEmptyState(el.playlistsList, "Плейлистов пока нет. Создайте первый прямо из клиента.");
    return;
  }

  el.playlistsList.innerHTML = state.playlists
    .map((playlist, index) => `
      <article class="playlist-card ${state.selectedPlaylist?.id === playlist.id ? "selected" : ""}" data-index="${index}">
        <div class="playlist-art"><span>${escapeHtml(initialsFromText(playlist.name))}</span></div>
        <div class="playlist-copy">
          <div class="playlist-title">${escapeHtml(playlist.name)}</div>
          <div class="playlist-meta">Локальный плейлист</div>
          <div class="playlist-count">${playlist.track_count || 0} ${trackWord(playlist.track_count || 0)}</div>
        </div>
        <div class="playlist-actions">
          <button class="playlist-open-btn" data-playlist-action="open">Открыть</button>
          <button class="row-icon-btn" data-playlist-action="play">▶</button>
        </div>
      </article>
    `)
    .join("");

  el.playlistsList.onclick = async (event) => {
    const card = event.target.closest(".playlist-card");
    if (!card) return;
    const playlist = state.playlists[Number(card.dataset.index)];
    const action = event.target.closest("[data-playlist-action]")?.dataset.playlistAction;

    if (!action || action === "open") {
      await selectPlaylist(playlist);
      return;
    }

    if (action === "play") {
      await selectPlaylist(playlist);
      if (state.playlistTracks.length) {
        await playTrack(state.playlistTracks[0], state.playlistTracks, { preservePlaylist: true });
      } else {
        pushToast("В плейлисте пока нет треков", "info");
      }
    }
  };
}

function renderPlaylistTracks() {
  renderTrackRows(el.playlistTracksList, state.playlistTracks, {
    emptyText: "Выберите локальный плейлист, чтобы увидеть треки.",
    queue: state.playlistTracks,
    preservePlaylist: true,
    removable: true,
    onRemove: removeTrackFromSelectedPlaylist,
    showFavorite: false,
    showQueueButton: false,
    primaryLabel: "Играть",
  });
}

function renderLibraryPanels() {
  renderLibraryChrome();
  renderTrackRows(el.favoritesList, favoriteTracks(), {
    emptyText: "Избранное пока пустое. Отмечайте понравившиеся треки сердцем.",
    queue: favoriteTracks(),
  });
  renderPlaylistsList();
  renderPlaylistTracks();
}

function renderSearchResults() {
  renderTrackRows(el.searchTracks, state.searchResults.tracks, {
    emptyText: "По этому запросу треки пока не найдены.",
    queue: state.searchResults.tracks,
  });

  renderCollectionRows(el.searchPlaylists, state.searchResults.playlists, {
    emptyText: "Плейлисты не найдены.",
    primaryLabel: "Открыть",
    onPrimary: openCollection,
    onSecondary: openInBrowser,
  });

  renderCollectionRows(el.searchAlbums, state.searchResults.albums, {
    emptyText: "Альбомы не найдены.",
    primaryLabel: "Открыть",
    onPrimary: openCollection,
    onSecondary: openInBrowser,
  });

  renderCollectionRows(el.searchArtists, state.searchResults.artists, {
    emptyText: "Исполнители не найдены.",
    primaryLabel: "Профиль",
    onPrimary: openArtistProfile,
    onSecondary: openInBrowser,
  });

  renderSearchEntity();
}

function selectItem(item, { preservePlaylist = false } = {}) {
  state.selectedItem = item;
  if (!preservePlaylist && item?.kind !== "playlist-local") {
    state.selectedPlaylist = null;
  }
  renderHome();
  renderSearchResults();
  renderLibraryPanels();
  renderDetailPanels();
}

function normalizePlaylistSelection(playlist) {
  return {
    id: String(playlist.id),
    title: playlist.name,
    kind: "playlist-local",
    track_count: Number(playlist.track_count || 0),
    description: "Локальный плейлист, собранный прямо в desktop-клиенте.",
  };
}

async function loadLibraryState({ preservePlaylistId } = {}) {
  try {
    const [favoritesResp, recentResp, playlistsResp] = await Promise.all([
      window.soundcloudAPI.library.listFavorites(),
      window.soundcloudAPI.library.listRecentlyPlayed(),
      window.soundcloudAPI.library.listPlaylists(),
    ]);

    state.favorites = unwrapResponse(favoritesResp, "Не удалось загрузить избранное") || [];
    state.recent = unwrapResponse(recentResp, "Не удалось загрузить недавние треки") || [];
    state.playlists = unwrapResponse(playlistsResp, "Не удалось загрузить плейлисты") || [];

    const playlistId = preservePlaylistId ?? state.selectedPlaylist?.id;
    if (playlistId) {
      const playlist = state.playlists.find((item) => String(item.id) === String(playlistId));
      if (playlist) {
        state.selectedPlaylist = playlist;
        const tracksResp = await window.soundcloudAPI.library.getPlaylistTracks(playlist.id);
        state.playlistTracks = unwrapResponse(tracksResp, "Не удалось загрузить треки плейлиста").map(toDisplayTrack);

        if (state.selectedItem?.kind === "playlist-local") {
          state.selectedItem = normalizePlaylistSelection(playlist);
        }
      } else {
        state.selectedPlaylist = null;
        state.playlistTracks = [];
      }
    } else {
      state.playlistTracks = [];
    }

    renderSidebar();
    renderHome();
    renderSearchResults();
    renderLibraryPanels();
    renderDetailPanels();
  } catch (error) {
    pushToast(normalizeError(error, "Не удалось обновить библиотеку"), "error");
  }
}

async function selectPlaylist(playlist) {
  try {
    state.selectedPlaylist = playlist;
    const response = await window.soundcloudAPI.library.getPlaylistTracks(playlist.id);
    state.playlistTracks = unwrapResponse(response, "Не удалось загрузить треки плейлиста").map(toDisplayTrack);
    const updatedPlaylist = state.playlists.find((item) => String(item.id) === String(playlist.id)) || playlist;
    state.selectedItem = normalizePlaylistSelection({
      ...updatedPlaylist,
      track_count: updatedPlaylist.track_count || state.playlistTracks.length,
    });
    renderSidebar();
    renderHome();
    renderLibraryPanels();
    renderDetailPanels();
  } catch (error) {
    pushToast(normalizeError(error, "Не удалось открыть плейлист"), "error");
  }
}

async function createPlaylistFlow() {
  const name = await promptForText({
    title: "Новый плейлист",
    description: "Задайте имя для локального плейлиста. Его можно будет использовать для сохранения треков из поиска и библиотеки.",
    placeholder: "Например: Late Night Drive",
    confirmText: "Создать",
  });

  if (!name) return null;

  try {
    const response = await window.soundcloudAPI.library.createPlaylist(name);
    const playlist = unwrapResponse(response, "Не удалось создать плейлист");
    await loadLibraryState({ preservePlaylistId: playlist.id });
    setPage("library");
    setLibraryTab("playlists");
    await selectPlaylist(playlist);
    pushToast(`Плейлист «${playlist.name}» создан`, "success");
    return playlist;
  } catch (error) {
    pushToast(normalizeError(error, "Не удалось создать плейлист"), "error");
    return null;
  }
}

async function removeTrackFromSelectedPlaylist(item) {
  if (!state.selectedPlaylist) return;

  try {
    const confirmed = await confirmAction({
      title: "Удалить трек",
      description: `Убрать «${item.title}» из плейлиста «${state.selectedPlaylist.name}»?`,
      confirmText: "Удалить",
    });

    if (!confirmed) return;

    const response = await window.soundcloudAPI.library.removeTrackFromPlaylist(state.selectedPlaylist.id, item.id);
    unwrapResponse(response, "Не удалось удалить трек из плейлиста");
    await loadLibraryState({ preservePlaylistId: state.selectedPlaylist.id });
    pushToast("Трек удален из плейлиста", "success");
  } catch (error) {
    pushToast(normalizeError(error, "Не удалось удалить трек из плейлиста"), "error");
  }
}

function queueTrack(item) {
  if (!item?.id && !item?.webpage_url) {
    pushToast("Этот элемент нельзя добавить в очередь", "info");
    return;
  }

  const exists = state.currentQueue.some((track) => getItemKey(track) === getItemKey(item));
  if (!exists) {
    state.currentQueue.push(item);
    if (state.currentQueueIndex < 0) {
      state.currentQueueIndex = 0;
    }
  }

  renderHome();
  pushToast(`Добавлено в очередь: ${item.title}`, "success");
}

async function toggleFavoriteForItem(item = state.selectedItem) {
  if (!item || !isTrack(item)) {
    pushToast("Сначала выберите трек", "info");
    return;
  }

  try {
    if (isTrackFavorite(item)) {
      const response = await window.soundcloudAPI.library.removeFavorite(item.id);
      unwrapResponse(response, "Не удалось убрать трек из избранного");
      pushToast("Трек удален из избранного", "success");
    } else {
      const response = await window.soundcloudAPI.library.addFavorite(item);
      unwrapResponse(response, "Не удалось добавить трек в избранное");
      pushToast("Трек добавлен в избранное", "success");
    }

    await loadLibraryState({ preservePlaylistId: state.selectedPlaylist?.id });
    renderDetailPanels();
  } catch (error) {
    pushToast(normalizeError(error, "Не удалось обновить избранное"), "error");
  }
}

async function addSelectedToPlaylist(item = state.selectedItem) {
  if (!item || !isTrack(item)) {
    pushToast("Сначала выберите трек", "info");
    return;
  }

  let playlists = state.playlists;
  if (!playlists.length) {
    const created = await createPlaylistFlow();
    if (!created) return;
    playlists = state.playlists;
  }

  const playlistId = await choosePlaylist(playlists);
  if (!playlistId) return;

  try {
    const response = await window.soundcloudAPI.library.addTrackToPlaylist(playlistId, item);
    unwrapResponse(response, "Не удалось добавить трек в плейлист");
    await loadLibraryState({ preservePlaylistId: state.selectedPlaylist?.id || playlistId });
    pushToast(`Трек «${item.title}» добавлен в плейлист`, "success");
  } catch (error) {
    pushToast(normalizeError(error, "Не удалось добавить трек в плейлист"), "error");
  }
}

async function deleteCurrentPlaylist() {
  if (!state.selectedPlaylist) return;

  const confirmed = await confirmAction({
    title: "Удалить плейлист",
    description: `Удалить локальный плейлист «${state.selectedPlaylist.name}»? Это действие нельзя отменить.`,
    confirmText: "Удалить",
  });

  if (!confirmed) return;

  try {
    const response = await window.soundcloudAPI.library.deletePlaylist(state.selectedPlaylist.id);
    unwrapResponse(response, "Не удалось удалить плейлист");
    const deletedName = state.selectedPlaylist.name;
    state.selectedPlaylist = null;
    state.selectedItem = null;
    state.playlistTracks = [];
    await loadLibraryState();
    renderDetailPanels();
    pushToast(`Плейлист «${deletedName}» удален`, "success");
  } catch (error) {
    pushToast(normalizeError(error, "Не удалось удалить плейлист"), "error");
  }
}

async function executeSearch(reset = true) {
  const query = el.searchInput.value.trim();
  if (!query) {
    pushToast("Введите запрос для поиска", "info");
    return;
  }

  state.searchQuery = query;
  if (reset) {
    state.searchLimit = 10;
  }

  setSearchInputValue(query, "page");
  setPage("search");
  el.searchBtn.disabled = true;
  el.topbarSearchBtn.disabled = true;
  state.searchViewMode = "results";
  state.searchEntity = null;
  state.searchEntityTab = "tracks";
  state.searchEntityHistory = [];
  state.searchEntityInfo = "";
  el.searchInfo.textContent = "Ищу по SoundCloud...";

  try {
    const response = await window.soundcloudAPI.searchAll(query, state.searchLimit);
    const data = unwrapResponse(response, "Не удалось выполнить поиск");
    state.searchResults = data;
    state.selectedItem = null;
    state.selectedPlaylist = null;
    renderHome();
    renderLibraryPanels();
    renderSearchResults();
    renderDetailPanels();
    el.loadMoreBtn.disabled = data.tracks.length < state.searchLimit;
    el.searchInfo.textContent =
      `Треков: ${data.tracks.length} • Плейлистов: ${data.playlists.length} • ` +
      `Альбомов: ${data.albums.length} • Исполнителей: ${data.artists.length}`;
  } catch (error) {
    el.searchInfo.textContent = normalizeError(error, "Поиск не удался");
    pushToast(normalizeError(error, "Поиск не удался"), "error");
  } finally {
    el.searchBtn.disabled = false;
    el.topbarSearchBtn.disabled = false;
  }
}

async function loadMoreSearch() {
  if (!state.searchQuery) return;
  state.searchLimit += 10;
  await executeSearch(false);
}

function showRemoteCollection(collection, infoText) {
  state.selectedPlaylist = null;
  openSearchEntity(collection, infoText);
}

function showArtistProfile(profile, infoText) {
  state.selectedPlaylist = null;
  openSearchEntity(profile, infoText);
}

async function resolveUrlFlow() {
  const url = await promptForText({
    title: "Открыть ссылку",
    description: "Вставьте ссылку на трек или плейлист SoundCloud, чтобы быстро открыть его внутри клиента.",
    placeholder: "https://soundcloud.com/...",
    confirmText: "Открыть",
  });

  if (!url) return;

  try {
    const response = await window.soundcloudAPI.resolveUrl(url);
    const data = unwrapResponse(response, "Не удалось разобрать ссылку");
    if (data.kind === "playlist" || data.kind === "album") {
      const label = data.kind === "album" ? "Открыт альбом" : "Открыт плейлист";
      showRemoteCollection(data, `${label}: ${data.title}`);
      el.searchInfo.textContent = `${label}: ${data.title}`;
    } else if (data.kind === "artist") {
      showArtistProfile(data, `Профиль артиста: ${data.title}`);
      el.searchInfo.textContent = `Профиль артиста: ${data.title}`;
    } else if (data.track) {
      state.searchViewMode = "results";
      state.searchEntity = null;
      state.searchEntityInfo = "";
      state.searchEntityHistory = [];
      setPage("search");
      state.searchResults = {
        tracks: [data.track],
        playlists: [],
        albums: [],
        artists: [],
      };
      setSearchTab("tracks");
      renderSearchResults();
      el.searchInfo.textContent = "Трек открыт по ссылке";
      selectItem(data.track);
    }
  } catch (error) {
    pushToast(normalizeError(error, "Не удалось открыть ссылку"), "error");
  }
}

async function openArtistProfile(item) {
  if (!item?.id) {
    if (item?.webpage_url) {
      await openInBrowser(item);
      return;
    }
    pushToast("РЈ СЌС‚РѕРіРѕ Р°СЂС‚РёСЃС‚Р° РЅРµС‚ РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂР°", "info");
    return;
  }

  try {
    const response = await window.soundcloudAPI.getArtistProfile(item.id, 25, 25);
    const profile = unwrapResponse(response, "РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ РїСЂРѕС„РёР»СЊ Р°СЂС‚РёСЃС‚Р°");
    showArtistProfile(profile, `РџСЂРѕС„РёР»СЊ Р°СЂС‚РёСЃС‚Р°: ${profile.title}`);
    pushToast(`РћС‚РєСЂС‹С‚ РїСЂРѕС„РёР»СЊ В«${profile.title}В»`, "success");
  } catch (error) {
    pushToast(normalizeError(error, "РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ РїСЂРѕС„РёР»СЊ Р°СЂС‚РёСЃС‚Р°"), "error");
  }
}

async function openCollection(item) {
  if (!item?.id && !item?.webpage_url) {
    pushToast("У этого элемента нет ссылки", "info");
    return;
  }

  try {
    if (item?.kind === "artist") {
      await openArtistProfile(item);
      return;
    }

    if (item?.id) {
      const response = await window.soundcloudAPI.getCollection(item.id);
      const data = unwrapResponse(response, "РќРµ СѓРґР°Р»РѕСЃСЊ РѕС‚РєСЂС‹С‚СЊ РїРѕРґР±РѕСЂРєСѓ");
      const label = data.kind === "album" ? "Открыт альбом" : "Открыта подборка";
      showRemoteCollection(data, `${label}: ${data.title}`);
      pushToast(`${label}: ${data.title}`, "success");
      return;
    }

    const response = await window.soundcloudAPI.resolveUrl(item.webpage_url);
    const data = unwrapResponse(response, "Не удалось открыть подборку");

    if (data.kind === "playlist" || data.kind === "album") {
      const label = data.kind === "album" ? "Открыт альбом" : "Открыта подборка";
      showRemoteCollection(data, `${label}: ${data.title}`);
      el.searchInfo.textContent = `${label}: ${data.title}`;
      pushToast(`${label}: ${data.title}`, "success");
    }
  } catch (error) {
    pushToast(normalizeError(error, "Не удалось открыть подборку"), "error");
  }
}

async function openInBrowser(item = state.selectedItem) {
  if (!item?.webpage_url) {
    pushToast("У выбранного элемента нет ссылки", "info");
    return;
  }

  try {
    const response = await window.soundcloudAPI.openExternal(item.webpage_url);
    unwrapResponse(response, "Не удалось открыть ссылку в браузере");
  } catch (error) {
    pushToast(normalizeError(error, "Не удалось открыть ссылку в браузере"), "error");
  }
}

async function downloadSelectedTrack(item = state.selectedItem) {
  if (!item || !isTrack(item)) {
    pushToast("Скачивание доступно только для треков", "info");
    return;
  }

  try {
    const response = await window.soundcloudAPI.downloadTrack(item.webpage_url, item.title);
    const result = unwrapResponse(response, "Не удалось скачать трек");
    if (!result.canceled) {
      pushToast("Трек сохранен на диск", "success");
    }
  } catch (error) {
    pushToast(normalizeError(error, "Не удалось скачать трек"), "error");
  }
}

async function startAudioSource(sourceUrl) {
  el.audioPlayer.pause();
  el.audioPlayer.src = sourceUrl;
  el.audioPlayer.load();
  await el.audioPlayer.play();
}

function updateQueueState(item, queue) {
  const safeQueue = Array.isArray(queue) && queue.length ? [...queue] : [item];
  state.currentQueue = safeQueue;
  state.currentQueueIndex = Math.max(
    0,
    safeQueue.findIndex((candidate) => getItemId(candidate) === getItemId(item))
  );
}

async function playTrack(item, queue = [item], options = {}) {
  if (!item?.webpage_url) {
    pushToast("У этого элемента нет ссылки для воспроизведения", "error");
    return;
  }

  const preservePlaylist = Boolean(options.preservePlaylist);
  updateQueueState(item, queue);
  state.playerLoading = true;
  state.audioSourceMode = "idle";
  state.currentTrack = item;
  selectItem(item, { preservePlaylist });
  renderPlayerState();

  try {
    const streamResponse = await window.soundcloudAPI.getStream(item.webpage_url);
    const streamTrack = unwrapResponse(streamResponse, "Не удалось получить поток");
    await startAudioSource(streamTrack.stream_url);
    state.audioSourceMode = "stream";
    state.currentTrack = { ...item, ...streamTrack };
  } catch (streamError) {
    try {
      pushToast("Поток не открылся. Переключаюсь на локальный кэш.", "info");
      const cachedResponse = await window.soundcloudAPI.preparePlayback(item.webpage_url, item.title);
      const cachedTrack = unwrapResponse(cachedResponse, "Не удалось подготовить кэш");
      await startAudioSource(cachedTrack.local_file_url);
      state.audioSourceMode = "cache";
      state.currentTrack = { ...item, ...cachedTrack };
    } catch (cacheError) {
      state.playerLoading = false;
      state.audioSourceMode = "error";
      renderPlayerState();
      pushToast(normalizeError(cacheError, "Не удалось воспроизвести трек"), "error");
      return;
    }
  }

  state.playerLoading = false;
  state.currentQueue[state.currentQueueIndex] = state.currentTrack;
  selectItem(state.currentTrack, { preservePlaylist });
  renderPlayerState();

  try {
    const historyResponse = await window.soundcloudAPI.library.addRecentlyPlayed(state.currentTrack);
    unwrapResponse(historyResponse, "Не удалось обновить историю");
    await loadLibraryState({ preservePlaylistId: state.selectedPlaylist?.id });
  } catch (error) {
    pushToast(normalizeError(error, "Не удалось обновить историю"), "error");
  }
}

async function recoverFromStreamError() {
  if (
    state.recoveringFromStreamError ||
    state.audioSourceMode !== "stream" ||
    !state.currentTrack?.webpage_url
  ) {
    return;
  }

  state.recoveringFromStreamError = true;

  try {
    pushToast("Поток оборвался. Перехожу на локальный кэш.", "info");
    const response = await window.soundcloudAPI.preparePlayback(
      state.currentTrack.webpage_url,
      state.currentTrack.title
    );
    const cachedTrack = unwrapResponse(response, "Не удалось восстановить воспроизведение");
    await startAudioSource(cachedTrack.local_file_url);
    state.currentTrack = { ...state.currentTrack, ...cachedTrack };
    state.audioSourceMode = "cache";
    renderPlayerState();
  } catch (error) {
    state.audioSourceMode = "error";
    renderPlayerState();
    pushToast(normalizeError(error, "Воспроизведение прервано"), "error");
  } finally {
    state.recoveringFromStreamError = false;
  }
}

async function playByOffset(offset) {
  if (!state.currentQueue.length) return;

  let nextIndex = state.currentQueueIndex + offset;
  if (nextIndex < 0) nextIndex = state.currentQueue.length - 1;
  if (nextIndex >= state.currentQueue.length) nextIndex = 0;

  const nextTrack = state.currentQueue[nextIndex];
  const preservePlaylist = Boolean(
    state.selectedPlaylist &&
    state.playlistTracks.some((track) => getItemId(track) === getItemId(nextTrack))
  );

  state.currentQueueIndex = nextIndex;
  await playTrack(nextTrack, state.currentQueue, { preservePlaylist });
}

function shuffleQueue() {
  if (state.currentQueue.length <= 1) return;
  const current = state.currentQueue[state.currentQueueIndex];
  const others = state.currentQueue.filter((item) => getItemId(item) !== getItemId(current));
  for (let index = others.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [others[index], others[randomIndex]] = [others[randomIndex], others[index]];
  }
  state.currentQueue = current ? [current, ...others] : others;
  state.currentQueueIndex = 0;
}

function updateRepeatButton() {
  el.repeatBtn.classList.toggle("active", state.repeatMode > 0);
  el.repeatBtn.textContent = state.repeatMode === 2 ? "↺1" : "↺";
}

function queueTrack(item) {
  if (!item?.id && !item?.webpage_url) {
    pushToast("Этот элемент нельзя добавить в очередь", "info");
    return;
  }

  const exists = state.currentQueue.some((track) => getItemKey(track) === getItemKey(item));
  if (!exists) {
    state.currentQueue.push(item);
    if (state.currentQueueIndex < 0) {
      state.currentQueueIndex = 0;
    }
  }

  renderHome();
  renderPlayerState();
  pushToast(`Добавлено в очередь: ${item.title}`, "success");
}

function shuffleQueueItems(queue, currentItem) {
  if (!Array.isArray(queue) || queue.length <= 1) {
    return Array.isArray(queue) ? [...queue] : [];
  }
  const currentKey = getItemKey(currentItem);
  const current = queue.find((item) => getItemKey(item) === currentKey) || queue[0];
  const others = queue.filter((item) => getItemKey(item) !== getItemKey(current));
  for (let index = others.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [others[index], others[randomIndex]] = [others[randomIndex], others[index]];
  }
  return current ? [current, ...others] : others;
}

function updateQueueState(item, queue, options = {}) {
  const { preserveQueueOrder = false } = options;
  const fromCurrentQueue = queue === state.currentQueue;
  let safeQueue = Array.isArray(queue) && queue.length ? [...queue] : [item];

  if (state.shuffle && safeQueue.length > 1 && !fromCurrentQueue && !preserveQueueOrder) {
    safeQueue = shuffleQueueItems(safeQueue, item);
  }

  state.currentQueue = safeQueue;
  state.currentQueueIndex = Math.max(
    0,
    safeQueue.findIndex((candidate) => getItemId(candidate) === getItemId(item))
  );
}

async function playTrack(item, queue = [item], options = {}) {
  if (!item?.webpage_url) {
    pushToast("У этого элемента нет ссылки для воспроизведения", "error");
    return;
  }

  const preservePlaylist = Boolean(options.preservePlaylist);
  const preserveQueueOrder = Boolean(options.preserveQueueOrder);
  updateQueueState(item, queue, { preserveQueueOrder });
  state.playerLoading = true;
  state.audioSourceMode = "idle";
  state.currentTrack = item;
  state.currentTrackRepeatPasses = 0;
  selectItem(item, { preservePlaylist });
  renderPlayerState();

  try {
    const streamResponse = await window.soundcloudAPI.getStream(item.webpage_url);
    const streamTrack = unwrapResponse(streamResponse, "Не удалось получить поток");
    await startAudioSource(streamTrack.stream_url);
    state.audioSourceMode = "stream";
    state.currentTrack = { ...item, ...streamTrack };
  } catch (streamError) {
    try {
      pushToast("Поток не открылся. Переключаюсь на локальный кэш.", "info");
      const cachedResponse = await window.soundcloudAPI.preparePlayback(item.webpage_url, item.title);
      const cachedTrack = unwrapResponse(cachedResponse, "Не удалось подготовить кэш");
      await startAudioSource(cachedTrack.local_file_url);
      state.audioSourceMode = "cache";
      state.currentTrack = { ...item, ...cachedTrack };
    } catch (cacheError) {
      state.playerLoading = false;
      state.audioSourceMode = "error";
      renderPlayerState();
      pushToast(normalizeError(cacheError, "Не удалось воспроизвести трек"), "error");
      return;
    }
  }

  state.playerLoading = false;
  state.currentQueue[state.currentQueueIndex] = state.currentTrack;
  selectItem(state.currentTrack, { preservePlaylist });
  renderPlayerState();
  renderHome();

  try {
    const historyResponse = await window.soundcloudAPI.library.addRecentlyPlayed(state.currentTrack);
    unwrapResponse(historyResponse, "Не удалось обновить историю");
    await loadLibraryState({ preservePlaylistId: state.selectedPlaylist?.id });
  } catch (error) {
    pushToast(normalizeError(error, "Не удалось обновить историю"), "error");
  }
}

async function playByOffset(offset, options = {}) {
  const { wrap = true } = options;
  if (!state.currentQueue.length) return false;

  let nextIndex = state.currentQueueIndex + offset;
  if (wrap) {
    if (nextIndex < 0) nextIndex = state.currentQueue.length - 1;
    if (nextIndex >= state.currentQueue.length) nextIndex = 0;
  } else if (nextIndex < 0 || nextIndex >= state.currentQueue.length) {
    return false;
  }

  const nextTrack = state.currentQueue[nextIndex];
  state.currentQueueIndex = nextIndex;
  await playTrack(nextTrack, state.currentQueue, {
    preservePlaylist: belongsToSelectedPlaylist(nextTrack),
    preserveQueueOrder: true,
  });
  return true;
}

function shuffleQueue() {
  if (state.currentQueue.length <= 1) return;
  state.currentQueue = shuffleQueueItems(
    state.currentQueue,
    state.currentQueue[state.currentQueueIndex] || state.currentTrack
  );
  state.currentQueueIndex = 0;
  renderHome();
  renderPlayerState();
}

function updateRepeatButton() {
  const labels = {
    0: { text: "↺", title: "Повтор отключен" },
    1: { text: "↺", title: "Повторить трек еще один раз" },
    2: { text: "↺+1", title: "Повторить трек еще два раза" },
  };
  const current = labels[state.repeatMode] || labels[0];
  repeatButtons().forEach((button) => {
    button.classList.toggle("active", state.repeatMode > 0);
    button.textContent = current.text;
    button.title = current.title;
  });
}

function setPlayerExpanded(expanded) {
  state.playerExpanded = Boolean(expanded && state.currentTrack);
  renderPlayerState();
}

function toggleQueuePanel(force) {
  state.queuePanelOpen = typeof force === "boolean" ? force : !state.queuePanelOpen;
  renderPlayerState();
}

function clearUpcomingQueue() {
  if (!state.currentQueue.length) return;
  if (state.currentQueueIndex < 0) {
    state.currentQueue = [];
    state.currentQueueIndex = -1;
  } else {
    state.currentQueue = [state.currentQueue[state.currentQueueIndex]];
    state.currentQueueIndex = 0;
  }
  renderHome();
  renderPlayerState();
  pushToast("Очередь очищена", "success");
}

function removeQueuedTrack(index) {
  if (index < 0 || index >= state.currentQueue.length) return;
  if (index === state.currentQueueIndex) {
    pushToast("Сейчас играет этот трек", "info");
    return;
  }

  const [removed] = state.currentQueue.splice(index, 1);
  if (index < state.currentQueueIndex) {
    state.currentQueueIndex -= 1;
  }
  renderHome();
  renderPlayerState();
  if (removed?.title) {
    pushToast(`Убрано из очереди: ${removed.title}`, "success");
  }
}

async function playQueuedIndex(index) {
  const item = state.currentQueue[index];
  if (!item) return;
  state.currentQueueIndex = index;
  await playTrack(item, state.currentQueue, {
    preservePlaylist: belongsToSelectedPlaylist(item),
    preserveQueueOrder: true,
  });
}

async function openCurrentTrackArtist() {
  const artist = getTrackArtistProfile(state.currentTrack);
  if (!artist) {
    pushToast("Профиль артиста для этого трека не найден", "info");
    return;
  }
  await openArtistProfile(artist);
}

async function handlePlayPause() {
  if (state.playerLoading) return;
  if (!el.audioPlayer.src) {
    if (isTrack(state.selectedItem)) {
      await playTrack(state.selectedItem, [state.selectedItem], {
        preservePlaylist: belongsToSelectedPlaylist(state.selectedItem),
      });
    }
    return;
  }

  if (el.audioPlayer.paused) {
    await el.audioPlayer.play().catch(() => {});
  } else {
    el.audioPlayer.pause();
  }
  renderPlayerState();
}

function toggleShuffleMode() {
  state.shuffle = !state.shuffle;
  updateShuffleButtons();
  if (state.shuffle) {
    shuffleQueue();
  } else {
    renderPlayerState();
  }
}

function cycleRepeatMode() {
  state.repeatMode = (state.repeatMode + 1) % 3;
  state.currentTrackRepeatPasses = 0;
  updateRepeatButton();
  renderPlayerState();
}

function syncPlayerVolume(value) {
  el.audioPlayer.muted = false;
  el.audioPlayer.volume = Math.max(0, Math.min(100, Number(value || 0))) / 100;
  updateVolumeControls();
}

function toggleMuteState() {
  el.audioPlayer.muted = !el.audioPlayer.muted;
  updateVolumeControls();
}

async function handleTrackEnded() {
  if (state.currentTrackRepeatPasses < state.repeatMode) {
    state.currentTrackRepeatPasses += 1;
    el.audioPlayer.currentTime = 0;
    await el.audioPlayer.play().catch(() => {});
    renderPlayerState();
    return;
  }

  state.currentTrackRepeatPasses = 0;
  const moved = await playByOffset(1, { wrap: false });
  if (!moved) {
    renderPlayerState();
  }
}

function bindDetailActions() {
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.action;
      if (action === "play-selected") {
        if (isTrack(state.selectedItem)) {
          const preservePlaylist = Boolean(
            state.selectedPlaylist &&
            state.playlistTracks.some((track) => getItemId(track) === getItemId(state.selectedItem))
          );
          await playTrack(state.selectedItem, [state.selectedItem], { preservePlaylist });
        }
        return;
      }

      if (action === "open-selected-collection") {
        await openCollection(state.selectedItem);
        return;
      }

      if (action === "toggle-selected-favorite") {
        await toggleFavoriteForItem(state.selectedItem);
        return;
      }

      if (action === "add-selected-to-playlist") {
        await addSelectedToPlaylist(state.selectedItem);
        return;
      }

      if (action === "download-selected") {
        await downloadSelectedTrack(state.selectedItem);
        return;
      }

      if (action === "open-selected-browser") {
        await openInBrowser(state.selectedItem);
      }
    });
  });
}

function bindEvents() {
  el.navButtons.forEach((button) => {
    button.addEventListener("click", () => setPage(button.dataset.page));
  });

  el.libraryShortcuts.forEach((button) => {
    button.addEventListener("click", () => {
      setPage("library");
      setLibraryTab(button.dataset.libraryShortcut);
    });
  });

  el.searchTabButtons.forEach((button) => {
    button.addEventListener("click", () => setSearchTab(button.dataset.searchTab));
  });

  el.entityTabButtons.forEach((button) => {
    button.addEventListener("click", () => setSearchEntityTab(button.dataset.entityTab));
  });

  el.libraryTabButtons.forEach((button) => {
    button.addEventListener("click", () => setLibraryTab(button.dataset.libraryTab));
  });

  el.globalSearchInput.addEventListener("input", () => setSearchInputValue(el.globalSearchInput.value, "global"));
  el.searchInput.addEventListener("input", () => setSearchInputValue(el.searchInput.value, "page"));

  el.globalSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      setSearchInputValue(el.globalSearchInput.value, "global");
      executeSearch(true);
    }
  });

  el.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      executeSearch(true);
    }
  });

  document.querySelectorAll("[data-suggestion]").forEach((button) => {
    button.addEventListener("click", () => {
      const suggestion = button.dataset.suggestion || "";
      setSearchInputValue(suggestion);
      setPage("search");
      executeSearch(true);
    });
  });

  el.topbarSearchBtn.addEventListener("click", () => {
    setPage("search");
    executeSearch(true);
  });
  el.searchBtn.addEventListener("click", () => executeSearch(true));
  el.loadMoreBtn.addEventListener("click", loadMoreSearch);
  el.openUrlBtn.addEventListener("click", resolveUrlFlow);
  el.settingsSaveBtn?.addEventListener("click", saveSettingsFlow);
  el.settingsTestBtn?.addEventListener("click", testProxyFlow);
  [el.settingsBackendUrlInput, el.settingsAccessKeyInput].filter(Boolean).forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        saveSettingsFlow();
      }
    });
  });
  el.heroSearchBtn.addEventListener("click", () => {
    setPage("search");
    el.searchInput.focus();
  });

  el.createPlaylistBtn?.addEventListener("click", createPlaylistFlow);
  el.libraryCreatePlaylistBtn?.addEventListener("click", createPlaylistFlow);
  el.detailCreatePlaylistBtn?.addEventListener("click", createPlaylistFlow);
  el.heroPlaylistBtn.addEventListener("click", () => {
    setPage("library");
    setLibraryTab("playlists");
  });
  el.entityBackBtn.addEventListener("click", closeSearchEntity);
  el.refreshRecentBtn.addEventListener("click", () => loadLibraryState({ preservePlaylistId: state.selectedPlaylist?.id }));
  el.refreshLibraryBtn.addEventListener("click", () => loadLibraryState({ preservePlaylistId: state.selectedPlaylist?.id }));
  el.playPlaylistBtn.addEventListener("click", async () => {
    if (!state.playlistTracks.length) {
      pushToast("В плейлисте пока нет треков", "info");
      return;
    }
    await playTrack(state.playlistTracks[0], state.playlistTracks, { preservePlaylist: true });
  });
  el.deletePlaylistBtn.addEventListener("click", deleteCurrentPlaylist);

  bindDetailActions();

  el.modalCancelBtn.addEventListener("click", () => closeModal(null));
  el.modalCloseBtn.addEventListener("click", () => closeModal(null));
  el.modalOverlay.addEventListener("click", (event) => {
    if (event.target === el.modalOverlay) {
      closeModal(null);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el.modalOverlay.classList.contains("hidden")) {
      closeModal(null);
    }
  });

  el.playPauseBtn.addEventListener("click", async () => {
    if (state.playerLoading) return;
    if (!el.audioPlayer.src) {
      if (isTrack(state.selectedItem)) {
        await playTrack(state.selectedItem, [state.selectedItem], {
          preservePlaylist: Boolean(
            state.selectedPlaylist &&
            state.playlistTracks.some((track) => getItemId(track) === getItemId(state.selectedItem))
          ),
        });
      }
      return;
    }

    if (el.audioPlayer.paused) {
      await el.audioPlayer.play().catch(() => {});
    } else {
      el.audioPlayer.pause();
    }
    renderPlayerState();
  });

  el.prevBtn.addEventListener("click", () => playByOffset(-1));
  el.nextBtn.addEventListener("click", () => playByOffset(1));

  el.shuffleBtn.addEventListener("click", () => {
    state.shuffle = !state.shuffle;
    el.shuffleBtn.classList.toggle("active", state.shuffle);
    if (state.shuffle) {
      shuffleQueue();
    }
  });

  el.repeatBtn.addEventListener("click", () => {
    state.repeatMode = (state.repeatMode + 1) % 3;
    updateRepeatButton();
  });

  el.progressSlider.addEventListener("input", () => {
    el.audioPlayer.currentTime = Number(el.progressSlider.value || 0);
  });

  el.volumeSlider.addEventListener("input", () => {
    el.audioPlayer.volume = Number(el.volumeSlider.value || 100) / 100;
  });

  el.muteBtn.addEventListener("click", () => {
    el.audioPlayer.muted = !el.audioPlayer.muted;
    el.muteBtn.textContent = el.audioPlayer.muted ? "🔇" : "🔊";
  });

  el.audioPlayer.addEventListener("timeupdate", updatePlayerProgress);
  el.audioPlayer.addEventListener("loadedmetadata", updatePlayerProgress);
  el.audioPlayer.addEventListener("play", renderPlayerState);
  el.audioPlayer.addEventListener("pause", renderPlayerState);
  el.coverImage.addEventListener("error", () => {
    el.coverImage.classList.add("hidden");
  });
  el.audioPlayer.addEventListener("error", () => {
    recoverFromStreamError().catch(() => {});
  });
  el.audioPlayer.addEventListener("ended", async () => {
    if (state.repeatMode === 2) {
      el.audioPlayer.currentTime = 0;
      await el.audioPlayer.play().catch(() => {});
      return;
    }

    if (state.currentQueue.length > 1 || state.repeatMode === 1) {
      await playByOffset(1);
      return;
    }

    renderPlayerState();
  });
}

function bindEvents() {
  el.navButtons.forEach((button) => {
    button.addEventListener("click", () => setPage(button.dataset.page));
  });

  el.libraryShortcuts.forEach((button) => {
    button.addEventListener("click", () => {
      setPage("library");
      setLibraryTab(button.dataset.libraryShortcut);
    });
  });

  el.searchTabButtons.forEach((button) => {
    button.addEventListener("click", () => setSearchTab(button.dataset.searchTab));
  });

  el.entityTabButtons.forEach((button) => {
    button.addEventListener("click", () => setSearchEntityTab(button.dataset.entityTab));
  });

  el.libraryTabButtons.forEach((button) => {
    button.addEventListener("click", () => setLibraryTab(button.dataset.libraryTab));
  });

  el.globalSearchInput.addEventListener("input", () => setSearchInputValue(el.globalSearchInput.value, "global"));
  el.searchInput.addEventListener("input", () => setSearchInputValue(el.searchInput.value, "page"));

  el.globalSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      setSearchInputValue(el.globalSearchInput.value, "global");
      executeSearch(true);
    }
  });

  el.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      executeSearch(true);
    }
  });

  document.querySelectorAll("[data-suggestion]").forEach((button) => {
    button.addEventListener("click", () => {
      const suggestion = button.dataset.suggestion || "";
      setSearchInputValue(suggestion);
      setPage("search");
      executeSearch(true);
    });
  });

  el.topbarSearchBtn.addEventListener("click", () => {
    setPage("search");
    executeSearch(true);
  });
  el.searchBtn.addEventListener("click", () => executeSearch(true));
  el.loadMoreBtn.addEventListener("click", loadMoreSearch);
  el.openUrlBtn.addEventListener("click", resolveUrlFlow);
  el.settingsSaveBtn?.addEventListener("click", saveSettingsFlow);
  el.settingsTestBtn?.addEventListener("click", testProxyFlow);
  [el.settingsBackendUrlInput, el.settingsAccessKeyInput].filter(Boolean).forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
        saveSettingsFlow();
      }
    });
  });
  el.heroSearchBtn.addEventListener("click", () => {
    setPage("search");
    el.searchInput.focus();
  });

  el.createPlaylistBtn?.addEventListener("click", createPlaylistFlow);
  el.libraryCreatePlaylistBtn?.addEventListener("click", createPlaylistFlow);
  el.detailCreatePlaylistBtn?.addEventListener("click", createPlaylistFlow);
  el.heroPlaylistBtn.addEventListener("click", () => {
    setPage("library");
    setLibraryTab("playlists");
  });
  el.entityBackBtn.addEventListener("click", closeSearchEntity);
  el.refreshRecentBtn.addEventListener("click", () => loadLibraryState({ preservePlaylistId: state.selectedPlaylist?.id }));
  el.refreshLibraryBtn.addEventListener("click", () => loadLibraryState({ preservePlaylistId: state.selectedPlaylist?.id }));
  el.playPlaylistBtn.addEventListener("click", async () => {
    if (!state.playlistTracks.length) {
      pushToast("В плейлисте пока нет треков", "info");
      return;
    }
    await playTrack(state.playlistTracks[0], state.playlistTracks, {
      preservePlaylist: true,
      preserveQueueOrder: true,
    });
  });
  el.deletePlaylistBtn.addEventListener("click", deleteCurrentPlaylist);

  bindDetailActions();

  el.modalCancelBtn.addEventListener("click", () => closeModal(null));
  el.modalCloseBtn.addEventListener("click", () => closeModal(null));
  el.modalOverlay.addEventListener("click", (event) => {
    if (event.target === el.modalOverlay) {
      closeModal(null);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!el.modalOverlay.classList.contains("hidden")) {
        closeModal(null);
        return;
      }
      if (state.queuePanelOpen) {
        toggleQueuePanel(false);
        return;
      }
      if (state.playerExpanded) {
        setPlayerExpanded(false);
      }
    }

    if ((event.key === "Enter" || event.key === " ") && document.activeElement === el.playerArtist) {
      event.preventDefault();
      openCurrentTrackArtist().catch(() => {});
    }
  });

  el.playerBar?.addEventListener("dblclick", (event) => {
    if (!state.currentTrack) return;
    if (event.target.closest("button, input, a, [data-queue-action], #playerArtist")) return;
    setPlayerExpanded(true);
  });

  el.playerCover?.addEventListener("click", () => {
    if (!state.currentTrack) return;
    setPlayerExpanded(true);
  });

  el.playerTitle?.addEventListener("click", () => {
    if (!state.currentTrack) return;
    setPlayerExpanded(true);
  });

  document.addEventListener("click", (event) => {
    if (!state.queuePanelOpen) return;
    if (
      event.target.closest("#playerQueuePanel") ||
      event.target.closest("#queueBtn") ||
      event.target.closest("#fullscreenQueueBtn")
    ) {
      return;
    }
    toggleQueuePanel(false);
  });

  el.collapsePlayerBtn?.addEventListener("click", () => setPlayerExpanded(false));
  el.playerArtist?.addEventListener("click", () => openCurrentTrackArtist().catch(() => {}));
  el.fullscreenArtist?.addEventListener("click", () => openCurrentTrackArtist().catch(() => {}));

  el.playPauseBtn.addEventListener("click", handlePlayPause);
  el.fullscreenPlayPauseBtn?.addEventListener("click", handlePlayPause);
  el.prevBtn.addEventListener("click", () => playByOffset(-1));
  el.fullscreenPrevBtn?.addEventListener("click", () => playByOffset(-1));
  el.nextBtn.addEventListener("click", () => playByOffset(1));
  el.fullscreenNextBtn?.addEventListener("click", () => playByOffset(1));
  el.shuffleBtn.addEventListener("click", toggleShuffleMode);
  el.fullscreenShuffleBtn?.addEventListener("click", toggleShuffleMode);
  el.repeatBtn.addEventListener("click", cycleRepeatMode);
  el.fullscreenRepeatBtn?.addEventListener("click", cycleRepeatMode);
  el.playerFavoriteBtn?.addEventListener("click", () => toggleFavoriteForItem(state.currentTrack));
  el.fullscreenFavoriteBtn?.addEventListener("click", () => toggleFavoriteForItem(state.currentTrack));
  el.playerAddToPlaylistBtn?.addEventListener("click", () => addSelectedToPlaylist(state.currentTrack));
  el.fullscreenAddToPlaylistBtn?.addEventListener("click", () => addSelectedToPlaylist(state.currentTrack));
  el.queueBtn?.addEventListener("click", () => toggleQueuePanel());
  el.fullscreenQueueBtn?.addEventListener("click", () => toggleQueuePanel());
  el.clearQueueBtn?.addEventListener("click", clearUpcomingQueue);
  el.closeQueueBtn?.addEventListener("click", () => toggleQueuePanel(false));

  progressSliders().forEach((slider) => {
    slider.addEventListener("input", () => {
      el.audioPlayer.currentTime = Number(slider.value || 0);
    });
  });

  volumeSliders().forEach((slider) => {
    slider.addEventListener("input", () => {
      syncPlayerVolume(slider.value);
    });
  });

  muteButtons().forEach((button) => {
    button.addEventListener("click", toggleMuteState);
  });

  el.playerQueueList?.addEventListener("click", async (event) => {
    const removeBtn = event.target.closest("[data-queue-action='remove']");
    const itemNode = event.target.closest(".player-queue-item");
    if (!itemNode) return;
    const index = Number(itemNode.dataset.queueIndex);
    if (Number.isNaN(index)) return;

    if (removeBtn) {
      removeQueuedTrack(index);
      return;
    }

    await playQueuedIndex(index);
  });

  el.audioPlayer.addEventListener("timeupdate", updatePlayerProgress);
  el.audioPlayer.addEventListener("loadedmetadata", updatePlayerProgress);
  el.audioPlayer.addEventListener("volumechange", updateVolumeControls);
  el.audioPlayer.addEventListener("play", renderPlayerState);
  el.audioPlayer.addEventListener("pause", renderPlayerState);
  el.coverImage.addEventListener("error", () => {
    el.coverImage.classList.add("hidden");
  });
  el.fullscreenCoverImage?.addEventListener("error", () => {
    el.fullscreenCoverImage.classList.add("hidden");
  });
  el.audioPlayer.addEventListener("error", () => {
    recoverFromStreamError().catch(() => {});
  });
  el.audioPlayer.addEventListener("ended", handleTrackEnded);
}

async function openArtistProfile(item) {
  if (!item?.id) {
    if (item?.webpage_url) {
      await openInBrowser(item);
      return;
    }
    pushToast("У этого артиста нет идентификатора", "info");
    return;
  }

  try {
    const response = await window.soundcloudAPI.getArtistProfile(item.id, 25, 25);
    const profile = unwrapResponse(response, "Не удалось открыть профиль артиста");
    showArtistProfile(profile, `Профиль артиста: ${profile.title}`);
    pushToast(`Открыт профиль «${profile.title}»`, "success");
  } catch (error) {
    pushToast(normalizeError(error, "Не удалось открыть профиль артиста"), "error");
  }
}

(async function init() {
  bindEvents();
  if (typeof window.soundcloudAPI.onNavigate === "function") {
    window.soundcloudAPI.onNavigate((payload) => {
      const targetPage = typeof payload === "string" ? payload : payload?.page;
      if (!targetPage) return;
      setPage(targetPage);
    });
  }
  el.audioPlayer.volume = 0.7;
  updateRepeatButton();
  renderPlayerState();
  await loadSettingsState();
  setPage("home");
  setSearchTab("tracks");
  setLibraryTab("favorites");
  renderDetailPanels();
  showEmptyState(el.searchTracks, "Введите запрос, чтобы увидеть найденные треки.");
  showEmptyState(el.searchPlaylists, "Введите запрос, чтобы увидеть найденные плейлисты.");
  showEmptyState(el.searchAlbums, "Введите запрос, чтобы увидеть найденные альбомы.");
  showEmptyState(el.searchArtists, "Введите запрос, чтобы увидеть найденных исполнителей.");
  await loadLibraryState();
})();
