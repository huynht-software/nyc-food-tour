const FILTERS = [
  ["all", "All", "#1c1714"],
  ["asian", "Asian", "#e25b2a"],
  ["mexican", "Mexican", "#d62828"],
  ["burger", "Burger", "#bc6c25"],
  ["pizza", "Pizza", "#c44900"],
  ["italian", "Italian", "#2d6a4f"],
  ["chinese", "Chinese", "#c1121f"],
  ["thai", "Thai", "#f77f00"],
  ["korean", "Korean", "#9b2226"],
  ["latin", "Latin", "#e09f3e"],
  ["deli", "Deli", "#7f4f24"],
  ["sandwich", "Sandwich", "#bb9457"],
  ["diner", "Diner", "#6d597a"],
  ["bakery", "Bakery", "#9d4edd"],
  ["seafood", "Seafood", "#1d7874"],
  ["steak", "Steak", "#6f1d1b"],
  ["bbq", "BBQ", "#ae2012"],
  ["soul", "Soul food", "#7f5539"],
  ["caribbean", "Caribbean", "#2a9d8f"],
  ["middle-eastern", "Persian", "#b08968"],
  ["indian", "Indian", "#e07a3d"],
  ["hot-dog", "Hot dog", "#e63946"],
  ["fried-chicken", "Chicken", "#ca6702"],
  ["eastern-european", "Ukrainian", "#457b9d"],
  ["market", "Market", "#577590"],
];

const BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
const COLOR = Object.fromEntries(FILTERS.map(([id, , color]) => [id, color]));
const EATEN_KEY = "nyc-food-eaten";

const state = {
  filter: "all",
  query: "",
  radius: "all",
  selectedId: null,
  sheet: "closed",
  follow: false,
  location: null,
  locationNote: "Turn on location to sort by what's around you.",
  hideEaten: false,
  eaten: new Set(JSON.parse(localStorage.getItem(EATEN_KEY) || "[]")),
};

const map = L.map("map", { zoomControl: false, attributionControl: true }).setView([40.735, -73.97], 12);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom: 19,
}).addTo(map);

if (window.innerWidth >= 900) {
  L.control.zoom({ position: "topright" }).addTo(map);
}

const cluster = L.markerClusterGroup({
  showCoverageOnHover: false,
  maxClusterRadius: 46,
  iconCreateFunction(group) {
    return L.divIcon({
      html: `<span>${group.getChildCount()}</span>`,
      className: "cluster",
      iconSize: [36, 36],
    });
  },
});
map.addLayer(cluster);

let userLayer = null;
let watchId = null;
let pinKey = "";

const filtersEl = document.getElementById("filters");
const sheet = document.getElementById("sheet");
const sheetBody = document.getElementById("sheet-body");
const statusEl = document.getElementById("status");
const locateBtn = document.getElementById("locate");
const searchInput = document.getElementById("search");

function colorFor(spot) {
  const tag = spot.tags.find((item) => COLOR[item]) || "all";
  return COLOR[tag];
}

function haversine(aLat, aLng, bLat, bLng) {
  const r = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2
    + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(s));
}

function inMetro(lat, lng) {
  return haversine(lat, lng, 40.74, -73.99) < 50000;
}

function distance(spot) {
  if (!state.location || spot.lat == null) return null;
  return haversine(state.location.lat, state.location.lng, spot.lat, spot.lng);
}

function formatDistance(meters) {
  if (meters == null) return "";
  const miles = meters / 1609.344;
  if (miles < 0.1) return `${Math.max(50, Math.round((miles * 5280) / 50) * 50)} ft`;
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}

function matchesQuery(spot) {
  if (!state.query) return true;
  const haystack = [spot.name, spot.area, spot.borough, spot.cuisine, spot.dish, spot.blurb, spot.address]
    .join(" ")
    .toLowerCase();
  return state.query.toLowerCase().split(/\s+/).every((word) => haystack.includes(word));
}

function matchesFilter(spot) {
  return state.filter === "all" || spot.tags.includes(state.filter);
}

function radiusMeters() {
  if (state.radius === "all") return Infinity;
  if (!state.location || !inMetro(state.location.lat, state.location.lng)) return Infinity;
  return Number(state.radius) * 1609.344;
}

function passesRadius(spot) {
  if (spot.lat == null) return state.radius === "all";
  const meters = distance(spot);
  if (meters == null) return true;
  return meters <= radiusMeters();
}

function visibleSpots() {
  return FOOD_SPOTS.filter((spot) => {
    if (state.hideEaten && state.eaten.has(spot.id)) return false;
    return matchesFilter(spot) && matchesQuery(spot) && passesRadius(spot);
  });
}

function sortingByDistance() {
  return Boolean(state.location && inMetro(state.location.lat, state.location.lng));
}

function orderedSpots() {
  const spots = visibleSpots();
  if (sortingByDistance()) {
    return spots.sort((a, b) => {
      if (a.lat == null) return 1;
      if (b.lat == null) return -1;
      return distance(a) - distance(b);
    });
  }
  return spots.sort((a, b) => {
    const borough = BOROUGHS.indexOf(a.borough) - BOROUGHS.indexOf(b.borough);
    if (borough) return borough;
    return `${a.area} ${a.name}`.localeCompare(`${b.area} ${b.name}`);
  });
}

function pinIcon(spot) {
  const selected = spot.id === state.selectedId;
  return L.divIcon({
    className: "pin-wrap",
    html: `<span class="pin${selected ? " is-selected" : ""}" style="background:${colorFor(spot)}"></span>`,
    iconSize: selected ? [22, 22] : [16, 16],
    iconAnchor: selected ? [11, 11] : [8, 8],
  });
}

function renderPins() {
  const spots = visibleSpots().filter((spot) => spot.lat != null);
  const key = spots.map((spot) => `${spot.id}:${spot.id === state.selectedId}`).join("|");
  if (key === pinKey) return;
  pinKey = key;
  cluster.clearLayers();
  for (const spot of spots) {
    const marker = L.marker([spot.lat, spot.lng], { icon: pinIcon(spot), title: spot.name });
    marker.on("click", () => select(spot.id));
    cluster.addLayer(marker);
  }
}

function drawUser() {
  if (userLayer) {
    map.removeLayer(userLayer);
    userLayer = null;
  }
  if (!state.location) return;
  userLayer = L.layerGroup([
    L.circle([state.location.lat, state.location.lng], {
      radius: state.location.accuracy || 30,
      color: "#1d6fe8",
      weight: 1,
      fillColor: "#1d6fe8",
      fillOpacity: 0.12,
    }),
    L.marker([state.location.lat, state.location.lng], {
      interactive: false,
      icon: L.divIcon({ className: "user-pin", html: '<span class="user-dot"></span>', iconSize: [16, 16] }),
    }),
  ]).addTo(map);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char]));
}

function cardHtml(spot) {
  const miles = sortingByDistance() ? formatDistance(distance(spot)) : "";
  const place = [spot.cuisine, spot.area || spot.borough].filter(Boolean).join(" · ");
  const dish = spot.dish ? ` · ${spot.dish}` : "";
  return `<button class="card${state.eaten.has(spot.id) ? " is-eaten" : ""}${spot.id === state.selectedId ? " is-selected" : ""}" type="button" data-id="${spot.id}">
    <span class="dot" style="background:${colorFor(spot)}"></span>
    <span class="name">${escapeHtml(spot.name)}</span>
    <span class="miles">${miles}</span>
    <span class="meta">${escapeHtml(place + dish)}</span>
  </button>`;
}

function detailHtml(spot) {
  const miles = sortingByDistance() ? formatDistance(distance(spot)) : "";
  const where = [spot.cuisine, spot.area, spot.borough, miles].filter(Boolean).join(" · ");
  const directions = spot.lat == null ? "" : `<a class="primary" href="${directionsUrl(spot)}" target="_blank" rel="noopener">Directions</a>`;
  const eaten = state.eaten.has(spot.id);
  return `<article class="detail">
    <button class="back" type="button" data-back>Back to the list</button>
    <p class="kicker">${escapeHtml(spot.cuisine)}</p>
    <h2>${escapeHtml(spot.name)}</h2>
    <p class="where">${escapeHtml(where)}</p>
    ${spot.dish ? `<p class="dish">${escapeHtml(spot.dish)}</p>` : ""}
    <p class="blurb">${escapeHtml(spot.blurb)}</p>
    ${spot.address ? `<p class="address">${escapeHtml(spot.address)}</p>` : ""}
    <div class="actions">
      ${directions}
      <button class="secondary${eaten ? " is-on" : ""}" type="button" data-eaten="${spot.id}">${eaten ? "Eaten" : "Mark eaten"}</button>
    </div>
  </article>`;
}

function directionsUrl(spot) {
  const apple = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (apple) {
    return `https://maps.apple.com/?daddr=${spot.lat},${spot.lng}&q=${encodeURIComponent(spot.name)}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;
}

function renderSheet() {
  const spots = orderedSpots();
  const placed = spots.filter((spot) => spot.lat != null);
  const loose = spots.filter((spot) => spot.lat == null);
  const nearest = sortingByDistance() ? placed[0] : null;
  const subtitle = nearest
    ? `Closest is ${nearest.name}, ${formatDistance(distance(nearest))}`
    : state.locationNote;

  const radii = [
    ["all", "Anywhere"],
    ["0.5", "½ mi"],
    ["1", "1 mi"],
    ["2", "2 mi"],
  ].map(([id, label]) => `<button type="button" data-radius="${id}" class="${state.radius === id ? "is-active" : ""}">${label}</button>`).join("");

  let list = "";
  if (!spots.length) {
    list = `<p class="empty">Nothing in this filter. Try All, or widen the distance.</p>`;
  } else if (state.selectedId && FOOD_SPOTS.some((spot) => spot.id === state.selectedId && matchesFilter(spot) && matchesQuery(spot))) {
    list = detailHtml(FOOD_SPOTS.find((spot) => spot.id === state.selectedId));
  } else if (sortingByDistance()) {
    list = placed.map(cardHtml).join("") + (loose.length ? `<h3 class="group-label">No fixed pin</h3>${loose.map(cardHtml).join("")}` : "");
  } else {
    const chunks = [];
    const otherBoroughs = [...new Set(placed.map((spot) => spot.borough).filter((borough) => borough && !BOROUGHS.includes(borough)))];
    for (const borough of [...BOROUGHS, ...otherBoroughs, ""]) {
      const group = placed.filter((spot) => (spot.borough || "") === borough);
      if (!group.length) continue;
      chunks.push(`<h3 class="group-label">${borough || "Other"}</h3>${group.map(cardHtml).join("")}`);
    }
    if (loose.length) chunks.push(`<h3 class="group-label">No fixed pin</h3>${loose.map(cardHtml).join("")}`);
    list = chunks.join("");
  }

  const showHome = !localStorage.getItem("nyc-food-home-note");
  sheetBody.innerHTML = `
    <div class="sheet-head">
      <div>
        <h2>${spots.length} spot${spots.length === 1 ? "" : "s"}</h2>
        <p>${escapeHtml(subtitle)}</p>
      </div>
      <label class="check"><input id="hide-eaten" type="checkbox" ${state.hideEaten ? "checked" : ""}> Hide eaten</label>
    </div>
    <div class="radii">${radii}</div>
    <div class="sheet-scroll">
      ${list}
      ${showHome ? `<p class="home-note" id="home-note">Add this page to your home screen so it opens full screen. On iPhone use Share, then Add to Home Screen. On Android use the browser menu, then Install app or Add to Home screen. <button type="button" data-dismiss-note>Got it</button></p>` : ""}
    </div>`;
}

function render() {
  const previousScroll = document.querySelector(".sheet-scroll")?.scrollTop || 0;
  statusEl.textContent = state.location && inMetro(state.location.lat, state.location.lng) ? "Location on" : "";
  locateBtn.classList.toggle("is-on", state.follow);
  locateBtn.setAttribute("aria-pressed", String(state.follow));
  filtersEl.querySelectorAll(".chip").forEach((chip) => {
    const active = chip.dataset.filter === state.filter;
    chip.classList.toggle("is-active", active);
    chip.setAttribute("aria-selected", String(active));
  });
  renderPins();
  renderSheet();
  sheet.dataset.size = window.innerWidth >= 900 ? "full" : state.sheet;
  const scroller = document.querySelector(".sheet-scroll");
  if (scroller && !state.selectedId) scroller.scrollTop = previousScroll;
}

function select(id) {
  state.selectedId = id;
  state.sheet = "half";
  const spot = FOOD_SPOTS.find((item) => item.id === id);
  render();
  if (spot?.lat != null) focusSpot(spot);
}

function focusSpot(spot) {
  const zoom = Math.max(map.getZoom(), 15);
  const point = map.project([spot.lat, spot.lng], zoom);
  const desktop = window.innerWidth >= 900;
  const sheetHeightPx = desktop ? 0 : sheet.getBoundingClientRect().height;
  const center = map.unproject(point.add([desktop ? -180 : 0, desktop ? 0 : Math.round(sheetHeightPx * 0.35)]), zoom);
  map.flyTo(center, zoom, { duration: 0.45 });
}

function toggleEaten(id) {
  if (state.eaten.has(id)) state.eaten.delete(id);
  else state.eaten.add(id);
  localStorage.setItem(EATEN_KEY, JSON.stringify([...state.eaten]));
  render();
}

function startLocation() {
  if (!navigator.geolocation) {
    state.locationNote = "This browser can't share your location.";
    render();
    return;
  }
  if (!window.isSecureContext) {
    state.locationNote = "Location needs a secure https page. Add the site to your home screen after it's hosted that way.";
    render();
    return;
  }
  state.follow = true;
  if (watchId != null) navigator.geolocation.clearWatch(watchId);
  watchId = navigator.geolocation.watchPosition(onPosition, onLocationError, {
    enableHighAccuracy: true,
    maximumAge: 4000,
    timeout: 12000,
  });
  render();
}

function onPosition(position) {
  const next = {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
  };
  const previous = state.location;
  const wasAway = !previous || !inMetro(previous.lat, previous.lng);
  const moved = !previous || haversine(previous.lat, previous.lng, next.lat, next.lng) > 12;
  state.location = next;
  if (inMetro(next.lat, next.lng)) {
    state.locationNote = "Sorted by distance from you.";
    if (state.follow && (wasAway || moved)) {
      const zoom = Math.max(map.getZoom(), wasAway ? 15 : map.getZoom());
      const point = map.project([next.lat, next.lng], zoom);
      const center = map.unproject(point.add([0, window.innerWidth >= 900 ? 0 : 90]), zoom);
      map.setView(center, zoom, { animate: true });
    }
  } else {
    state.locationNote = "You're outside New York, so the list stays grouped by borough until you arrive.";
    state.follow = false;
  }
  drawUser();
  render();
}

function onLocationError(error) {
  state.follow = false;
  if (error.code === 1) {
    state.locationNote = "Location is blocked. Allow it for this site in the phone settings, then try again.";
  } else {
    state.locationNote = "Couldn't get a location fix. Step outside or try again.";
  }
  render();
}

function buildFilters() {
  filtersEl.innerHTML = FILTERS.map(([id, label, color]) => `
    <button class="chip${id === "all" ? " is-active" : ""}" type="button" role="tab" data-filter="${id}" aria-selected="${id === "all"}">
      <i style="background:${color}"></i>${label}
    </button>`).join("");
}

filtersEl.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-filter]");
  if (!chip) return;
  state.filter = chip.dataset.filter;
  render();
});

searchInput.addEventListener("input", () => {
  state.query = searchInput.value.trim();
  render();
});

locateBtn.addEventListener("click", () => {
  if (state.follow) {
    state.follow = false;
    render();
    return;
  }
  startLocation();
});

map.on("dragstart", () => {
  if (!state.follow) return;
  state.follow = false;
  locateBtn.classList.remove("is-on");
  locateBtn.setAttribute("aria-pressed", "false");
});

sheetBody.addEventListener("change", (event) => {
  if (event.target.id !== "hide-eaten") return;
  state.hideEaten = event.target.checked;
  render();
});

sheetBody.addEventListener("click", (event) => {
  if (event.target.closest("[data-back]")) {
    state.selectedId = null;
    render();
    return;
  }
  const eaten = event.target.closest("[data-eaten]");
  if (eaten) {
    toggleEaten(eaten.dataset.eaten);
    return;
  }
  const radius = event.target.closest("[data-radius]");
  if (radius) {
    state.radius = radius.dataset.radius;
    if (state.radius !== "all" && (!state.location || !inMetro(state.location.lat, state.location.lng))) {
      state.locationNote = "The distance filter starts once your location is in New York.";
    }
    render();
    return;
  }
  if (event.target.closest("[data-dismiss-note]")) {
    localStorage.setItem("nyc-food-home-note", "1");
    render();
    return;
  }
  const card = event.target.closest("[data-id]");
  if (card) select(card.dataset.id);
});

const SHEET_SIZES = ["closed", "peek", "half", "full"];

function sheetHeight(size) {
  const viewport = window.innerHeight;
  if (size === "closed") return 72;
  if (size === "peek") return 108;
  if (size === "half") return Math.round(viewport * 0.4);
  return Math.round(viewport - 156);
}

function snapSheet(height, direction, startHeight) {
  const sizes = SHEET_SIZES.map((id) => ({ id, height: sheetHeight(id) }));
  const pool = direction > 0
    ? sizes.filter((item) => item.height > startHeight + 8)
    : sizes.filter((item) => item.height < startHeight - 8);
  const choices = pool.length ? pool : sizes;
  return choices.reduce((best, item) => (
    Math.abs(item.height - height) < Math.abs(best.height - height) ? item : best
  )).id;
}

let sheetDrag = null;

function finishSheetDrag(event) {
  if (!sheetDrag) return;
  const delta = sheetDrag.y - event.clientY;
  const height = sheet.getBoundingClientRect().height;
  const startHeight = sheetDrag.height;
  state.sheet = Math.abs(delta) < 14
    ? (state.sheet === "closed" || state.sheet === "peek" ? "half" : "closed")
    : snapSheet(height, delta > 0 ? 1 : -1, startHeight);
  sheetDrag = null;
  sheet.classList.remove("is-dragging");
  sheet.style.height = "";
  sheet.dataset.size = state.sheet;
}

sheet.addEventListener("pointerdown", (event) => {
  if (window.innerWidth >= 900) return;
  if (event.target.closest("input, label, a, button:not(#handle)")) return;
  const onHandle = event.target.closest("#handle");
  const onHead = event.target.closest(".sheet-head");
  if (!onHandle && !onHead) return;
  try { sheet.setPointerCapture(event.pointerId); } catch (error) { /* pointer may already be gone */ }
  sheetDrag = { y: event.clientY, height: sheet.getBoundingClientRect().height };
  sheet.classList.add("is-dragging");
});

sheet.addEventListener("pointermove", (event) => {
  if (!sheetDrag) return;
  const next = sheetDrag.height + (sheetDrag.y - event.clientY);
  const min = sheetHeight("closed");
  const max = sheetHeight("full");
  sheet.style.height = `${Math.min(max, Math.max(min, next))}px`;
});

sheet.addEventListener("pointerup", finishSheetDrag);
sheet.addEventListener("pointercancel", () => {
  if (!sheetDrag) return;
  sheetDrag = null;
  sheet.classList.remove("is-dragging");
  sheet.style.height = "";
  sheet.dataset.size = state.sheet;
});

const inNewYork = (spot) =>
  spot.lat != null && spot.lat >= 40.49 && spot.lat <= 40.92 && spot.lng >= -74.3 && spot.lng <= -73.68;
const bounds = L.latLngBounds(FOOD_SPOTS.filter(inNewYork).map((spot) => [spot.lat, spot.lng]));
const desktop = window.innerWidth >= 900;
map.fitBounds(bounds, {
  paddingTopLeft: desktop ? [430, 40] : [24, 188],
  paddingBottomRight: desktop ? [40, 40] : [24, 80],
});

buildFilters();
render();

window.addEventListener("resize", () => {
  sheet.dataset.size = window.innerWidth >= 900 ? "full" : state.sheet;
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
