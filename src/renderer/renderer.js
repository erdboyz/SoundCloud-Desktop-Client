const state = {
  page: "home",
  searchTab: "tracks",
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
  shuffle: false,
  playerLoading: false,
  audioSourceMode: "idle",
  recoveringFromStreamError: false,
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
  topbarCreatePlaylistBtn: document.getElementById("topbarCreatePlaylistBtn"),
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
  searchInfo: document.getElementById("searchInfo"),
  searchTracks: document.getElementById("searchTracks"),
  searchPlaylists: document.getElementById("searchPlaylists"),
  searchAlbums: document.getElementById("searchAlbums"),
  searchArtists: document.getElementById("searchArtists"),
  loadMoreBtn: document.getElementById("loadMoreBtn"),
  createPlaylistBtn: document.getElementById("createPlaylistBtn"),
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
  audioPlayer: document.getElementById("audioPlayer"),
  coverImage: document.getElementById("coverImage"),
  playerCoverFallback: document.getElementById("playerCoverFallback"),
  playerTitle: document.getElementById("playerTitle"),
  playerArtist: document.getElementById("playerArtist"),
  playerSource: document.getElementById("playerSource"),
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
      ${image ? `<img src="${escapeHtml(image)}" alt="" onerror="this.classList.add('hidden')" />` : ""}
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
      const select = document.createElement("select");
      playlists.forEach((playlist) => {
        const option = document.createElement("option");
        option.value = String(playlist.id);
        option.textContent = `${playlist.name} (${playlist.track_count || 0})`;
        select.appendChild(option);
      });
      return { element: select, select };
    },
    onConfirm: ({ select }) => Number(select.value),
  });
}

function setButtonsDisabled(disabled) {
  document.querySelectorAll("[data-action]").forEach((button) => {
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

function setPage(page) {
  state.page = page;
  el.pages.forEach((node) => {
    node.classList.toggle("active", node.id === `page-${page}`);
  });
  el.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const meta = pageMeta[page] || pageMeta.home;
  el.pageEyebrow.textContent = meta.eyebrow;
  el.pageTitle.textContent = meta.title;
  el.pageSubtitle.textContent = meta.subtitle;
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

function updateActionVisibility(item) {
  const showTrackControls = Boolean(item && isTrack(item));
  const showCollectionControls = Boolean(item && (item.kind === "playlist" || item.kind === "album"));
  const showBrowserControl = Boolean(item?.webpage_url);

  document.querySelectorAll('[data-role="play-action"]').forEach((button) => {
    button.classList.toggle("hidden", !showTrackControls);
  });
  document.querySelectorAll('[data-role="collection-action"]').forEach((button) => {
    button.classList.toggle("hidden", !showCollectionControls);
  });
  document.querySelectorAll('[data-role="favorite-action"]').forEach((button) => {
    button.classList.toggle("hidden", !showTrackControls);
    button.textContent = showTrackControls && isTrackFavorite(item) ? "Убрать из избранного" : "В избранное";
  });
  document.querySelectorAll('[data-role="playlist-action"]').forEach((button) => {
    button.classList.toggle("hidden", !showTrackControls);
  });
  document.querySelectorAll('[data-role="download-action"]').forEach((button) => {
    button.classList.toggle("hidden", !showTrackControls);
  });
  document.querySelectorAll('[data-role="browser-action"]').forEach((button) => {
    button.classList.toggle("hidden", !showBrowserControl);
  });
  setButtonsDisabled(!item);
}

function renderDetailPanels() {
  const item = state.selectedItem;
  updateActionVisibility(item);

  el.detailPanels.forEach((panel) => {
    const cover = panel.querySelector('[data-field="cover"]');
    const type = panel.querySelector('[data-field="type"]');
    const title = panel.querySelector('[data-field="title"]');
    const meta = panel.querySelector('[data-field="meta"]');
    const text = panel.querySelector('[data-field="text"]');

    if (!item) {
      type.textContent = "Ничего не выбрано";
      title.textContent = "Выберите трек, плейлист или артиста";
      meta.textContent = "";
      text.textContent = detailText(null);
      cover.innerHTML = "<span>SC</span>";
      return;
    }

    type.textContent = kindLabel(item);
    title.textContent = item.title || item.name || "Без названия";
    meta.textContent = detailMeta(item);
    text.textContent = detailText(item);
    cover.innerHTML = `${getArtwork(item) ? `<img src="${escapeHtml(getArtwork(item))}" alt="" onerror="this.classList.add('hidden')" />` : ""}<span>${escapeHtml(itemInitials(item))}</span>`;
  });

  el.playlistControls.classList.toggle("hidden", !state.selectedPlaylist);
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
    showFavorite: false,
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
    onPrimary: openInBrowser,
    onSecondary: openInBrowser,
  });
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
  if (!item?.webpage_url) {
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
    setPage("search");

    if (data.kind === "playlist") {
      state.searchResults = {
        tracks: data.entries || [],
        playlists: [],
        albums: [],
        artists: [],
      };
      setSearchTab("tracks");
      renderSearchResults();
      el.searchInfo.textContent = `Открыт плейлист: ${data.title}`;
      selectItem({
        title: data.title,
        uploader: data.uploader,
        thumbnail: data.thumbnail,
        webpage_url: data.webpage_url,
        track_count: (data.entries || []).length,
        kind: "playlist",
      });
    } else if (data.track) {
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

async function openCollection(item) {
  if (!item?.webpage_url) {
    pushToast("У этого элемента нет ссылки", "info");
    return;
  }

  try {
    const response = await window.soundcloudAPI.resolveUrl(item.webpage_url);
    const data = unwrapResponse(response, "Не удалось открыть подборку");

    if (data.kind === "playlist") {
      state.searchResults.tracks = data.entries || [];
      setPage("search");
      setSearchTab("tracks");
      el.searchInfo.textContent = `Открыта подборка: ${data.title}`;
      selectItem({
        ...item,
        title: data.title,
        uploader: data.uploader,
        thumbnail: data.thumbnail || item.thumbnail,
        track_count: (data.entries || []).length,
      });
      renderSearchResults();
      pushToast(`Открыта подборка «${data.title}»`, "success");
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
  el.heroSearchBtn.addEventListener("click", () => {
    setPage("search");
    el.searchInput.focus();
  });

  el.createPlaylistBtn.addEventListener("click", createPlaylistFlow);
  el.topbarCreatePlaylistBtn.addEventListener("click", createPlaylistFlow);
  el.heroPlaylistBtn.addEventListener("click", createPlaylistFlow);
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

(async function init() {
  bindEvents();
  el.audioPlayer.volume = 0.7;
  updateRepeatButton();
  renderPlayerState();
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
