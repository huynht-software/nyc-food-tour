import { readFile, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";

const data = JSON.parse(await readFile(new URL("../data/restaurants.json", import.meta.url), "utf8"));

const areaFixes = {
  "Tuscan Hills": ["Forest Hills", "Queens"],
  "All'Antico Vinaio": ["Upper East Side", "Manhattan"],
  "Carnitas Ramirez": ["East Village", "Manhattan"],
  "Tacos Domingo": ["East Village", "Manhattan"],
  "Los Burritos Juarez": ["Fort Greene", "Brooklyn"],
  "New Kim Tuong": ["Lower East Side", "Manhattan"],
  "Supreme Restaurant": ["Chinatown", "Manhattan"],
  "Jin Mei Dumpling": ["Two Bridges", "Manhattan"],
  "Double Crispy Bakery": ["Chinatown", "Manhattan"],
  "Frankel's Delicatessen": ["Greenpoint", "Brooklyn"],
  "Mission Sandwich Social": ["Williamsburg", "Brooklyn"],
  "Old John's Luncheonette": ["Upper West Side", "Manhattan"],
  "Yoon Haeundae Galbi": ["Koreatown", "Manhattan"],
  "Charles Pan-Fried Chicken": ["Harlem", "Manhattan"],
  "El Castillo de Jagua": ["Lower East Side", "Manhattan"],
  "William Greenberg Desserts": ["Upper East Side", "Manhattan"],
  "La Dinastia": ["Washington Heights", "Manhattan"],
};

function shortAddress(spot) {
  if (spot.address) return spot.address;
  const parts = (spot.matched || "").split(",").map((part) => part.trim());
  if (parts.length >= 3 && /^\d/.test(parts[1])) return `${parts[1].replace(/,$/, "")} ${parts[2]}`;
  return "";
}

const extras = [
  {
    name: "Zafi's Luncheonette",
    area: "Lower East Side",
    borough: "Manhattan",
    address: "500 Grand St, New York, NY 10002",
    tags: ["diner"],
    cuisine: "Diner",
    dish: "Diner classics",
    blurb: "A small Lower East Side luncheonette. The counter is the seat to take.",
    lat: 40.715454,
    lng: -73.98262,
  },
  {
    name: "Ursula",
    area: "Bedford-Stuyvesant",
    borough: "Brooklyn",
    address: "387A Nostrand Ave, Brooklyn, NY 11216",
    list: "4",
    tags: ["mexican", "breakfast"],
    cuisine: "Breakfast burritos",
    dish: "Breakfast burrito",
    blurb: "Brooklyn breakfast burritos, on Nostrand Avenue.",
    lat: 40.684479,
    lng: -73.950186,
  },
];

const spots = data.results.map((spot) => ({ ...spot }));
for (const extra of extras) {
  if (!spots.some((spot) => spot.name === extra.name && spot.address === extra.address)) spots.push(extra);
}

const used = new Set();
function slug(value) {
  const base = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "spot";
  let id = base;
  let n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

const placed = spots.map((spot) => {
  const fix = areaFixes[spot.name];
  const area = spot.area || fix?.[0] || "";
  const borough = spot.borough || fix?.[1] || "";
  let blurb = spot.blurb;
  if (spot.name === "Joe & Pat's" && area === "Castleton Corners") {
    blurb = "The Staten Island original. The list doesn't name a second shop, so this is the one on the map.";
  }
  return {
    id: slug(`${spot.name}-${area}`),
    name: spot.name,
    area,
    borough,
    address: shortAddress(spot),
    lat: spot.lat,
    lng: spot.lng,
    tags: spot.tags,
    cuisine: spot.cuisine,
    dish: spot.dish || "",
    blurb,
    ...(spot.list ? { list: spot.list } : {}),
  };
});

const unplaced = [
  {
    id: "ella-spice",
    name: "Ella Spice",
    area: "",
    borough: "",
    address: "",
    tags: ["caribbean"],
    cuisine: "Grenadian",
    dish: "Breadfruit balls",
    blurb: "Grenadian breadfruit balls from the photo roundup. No reliable street address turned up, so there is no pin.",
  },
  {
    id: "cheung-fun-cart",
    name: "Cheung Fun Cart",
    area: "Chinatown",
    borough: "Manhattan",
    address: "",
    tags: ["asian", "chinese"],
    cuisine: "Chinese",
    dish: "Cheung fun",
    blurb: "A Chinatown street cart. The corner changes, so it is not pinned.",
  },
  {
    id: "bodega-truck",
    name: "Bodega Truck",
    area: "",
    borough: "",
    address: "",
    tags: ["sandwich"],
    cuisine: "Sandwiches",
    dish: "Sandwiches",
    blurb: "A truck. Check where it is parked that day.",
  },
  {
    id: "el-jalapeno",
    name: "El Jalapeño",
    area: "",
    borough: "",
    address: "",
    tags: ["mexican"],
    cuisine: "Mexican",
    dish: "Tacos",
    blurb: "Several places share this name, so it is not pinned.",
  },
];

const all = [...placed, ...unplaced];
await writeFile(
  new URL("../restaurants.js", import.meta.url),
  `window.FOOD_SPOTS = ${JSON.stringify(all, null, 2)};\n`,
);

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, payload) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(payload.length);
  const body = Buffer.concat([Buffer.from(type), payload]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function icon(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const cx = (size - 1) / 2;
  const radius = size * 0.46;
  for (let y = 0; y < size; y++) {
    raw[(size * 4 + 1) * y] = 0;
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cx;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) continue;
      const index = (size * 4 + 1) * y + 1 + x * 4;
      const edge = dist > radius - 2;
      raw[index] = edge ? 122 : 196;
      raw[index + 1] = edge ? 32 : 55;
      raw[index + 2] = edge ? 14 : 26;
      raw[index + 3] = 255;
      if (dist < radius * 0.22) {
        raw[index] = 244;
        raw[index + 1] = 236;
        raw[index + 2] = 214;
      }
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

await writeFile(new URL("../icon.png", import.meta.url), icon(180));
await writeFile(new URL("../favicon.png", import.meta.url), icon(32));
console.log(`${placed.length} pins, ${unplaced.length} unplaced`);
