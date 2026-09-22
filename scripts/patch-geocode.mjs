import { readFile, writeFile } from "node:fs/promises";

const file = new URL("../data/restaurants.json", import.meta.url);
const data = JSON.parse(await readFile(file, "utf8"));

const NYC = { minLat: 40.49, maxLat: 40.92, minLng: -74.3, maxLng: -73.68 };
const inNyc = (lat, lng) => lat >= NYC.minLat && lat <= NYC.maxLat && lng >= NYC.minLng && lng <= NYC.maxLng;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function census(address) {
  const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`;
  const res = await fetch(url, { headers: { "User-Agent": "nyc-food-tour personal trip map" } });
  if (!res.ok) throw new Error(`census ${res.status}`);
  const body = await res.json();
  const match = body?.result?.addressMatches?.[0];
  if (!match) return null;
  const lat = match.coordinates.y;
  const lng = match.coordinates.x;
  if (!inNyc(lat, lng)) return null;
  return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6, matched: match.matchedAddress };
}

async function nominatim(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=5&countrycodes=us`;
  const res = await fetch(url, { headers: { "User-Agent": "nyc-food-tour/1.0 (personal NYC food trip planner)" } });
  if (!res.ok) throw new Error(`nominatim ${res.status}`);
  const body = await res.json();
  await sleep(1100);
  return body
    .map((item) => ({ lat: Number(item.lat), lng: Number(item.lon), matched: item.display_name }))
    .filter((item) => inNyc(item.lat, item.lng));
}

data.results = data.results.filter((spot) => spot.name !== "Leo");

const scarrs = data.results.find((spot) => spot.name === "Scarr's Pizza");
const ginos = data.results.find((spot) => spot.name === "Gino's of Bay Ridge");

const updates = [
  [scarrs, "35 Orchard St, New York, NY 10002"],
  [ginos, "7414 5th Ave, Brooklyn, NY 11209"],
];

for (const [spot, address] of updates) {
  const geo = await census(address);
  await sleep(200);
  if (!geo) {
    console.log("UPDATE MISS", spot.name, address);
    continue;
  }
  spot.address = address;
  spot.lat = geo.lat;
  spot.lng = geo.lng;
  spot.matched = geo.matched;
  spot.via = "census";
  console.log("UPDATED", spot.name, geo.matched);
}

const additions = [
  { name: "Lenox Thai", area: "Lenox Hill", borough: "Manhattan", address: "1217 1st Ave, New York, NY 10065", tags: ["asian", "thai"], cuisine: "Thai", dish: "Drunken noodles", blurb: "Drunken noodles with a lot of beef. The post also mentions friendly service." },
  { name: "Esse Taco", area: "Williamsburg", borough: "Brooklyn", address: "219 Bedford Ave, Brooklyn, NY 11211", tags: ["mexican"], cuisine: "Mexican", dish: "Tacos", blurb: "Williamsburg taqueria on Bedford Avenue." },
  { name: "1915 Lanzhou Hand-Pulled Noodles", area: "Chinatown", borough: "Manhattan", address: "76 Mott St, New York, NY 10013", tags: ["asian", "chinese"], cuisine: "Chinese", dish: "Lanzhou beef noodles", blurb: "Beef noodle shop in Chinatown. The list ran this name together with a Fuzhou place." },
  { name: "1915 Lanzhou Hand-Pulled Noodles", area: "Kips Bay", borough: "Manhattan", address: "207 E 26th St, New York, NY 10016", tags: ["asian", "chinese"], cuisine: "Chinese", dish: "Lanzhou beef noodles", blurb: "The Kips Bay location of the Lanzhou noodle shop." },
  { name: "Sky Pavilion", area: "Times Square", borough: "Manhattan", address: "325 W 42nd St, New York, NY 10036", tags: ["asian", "chinese"], cuisine: "Chinese", dish: "Dim sum and Chinese plates", blurb: "From the Chinese list. This one is in Times Square, not Flushing." },
  { name: "188 Bakery Cuchifritos", area: "Fordham", borough: "Bronx", address: "158 E 188th St, Bronx, NY 10468", tags: ["latin", "puerto-rican", "bakery"], cuisine: "Puerto Rican bakery", dish: "Cuchifritos", blurb: "Bronx bakery counter. The 188 in the name is the street." },
  { name: "Strange Delight", area: "Fort Greene", borough: "Brooklyn", address: "63 Lafayette Ave, Brooklyn, NY 11217", tags: ["seafood"], cuisine: "Seafood", dish: "Oyster happy hour", blurb: "Fort Greene oyster bar. The list calls out the oyster happy hour." },
  { name: "Renee's Kitchenette & Grille", area: "Woodside", borough: "Queens", address: "69-14 Roosevelt Ave, Woodside, NY 11377", tags: ["asian", "filipino"], cuisine: "Filipino", dish: "Chicken adobo", blurb: "Little Manila staple under the 7 train. Chicken adobo is the dish from the classics list." },
  { name: "Zafi's Luncheonette", area: "Lower East Side", borough: "Manhattan", address: "500 Grand St, New York, NY 10002", tags: ["diner"], cuisine: "Diner", dish: "Diner classics", blurb: "A small Lower East Side luncheonette. The counter is the seat to take." },
  { name: "Ali's Roti Shop", area: "South Richmond Hill", borough: "Queens", address: "127-17 Liberty Ave, South Richmond Hill, NY 11419", tags: ["caribbean"], cuisine: "Trinidadian", dish: "Doubles", blurb: "Doubles and roti on Liberty Avenue. Some listings mark this shop closed, so check before the trip." },
  { name: "Lechonera La Isla", area: "East Harlem", borough: "Manhattan", address: "254 E 125th St, New York, NY 10035", tags: ["latin", "puerto-rican"], cuisine: "Puerto Rican", dish: "Lechón", blurb: "East Harlem roast pork. Lechón is the order." },
  { name: "Kai Feng Fu Dumpling House", area: "Sunset Park", borough: "Brooklyn", address: "4801 8th Ave, Brooklyn, NY 11220", tags: ["asian", "chinese"], cuisine: "Chinese", dish: "Fried pork and chive dumplings", blurb: "Sunset Park dumpling shop. Fried pork and chive dumplings." },
  { name: "Tony's Beechhurst Deli", area: "Whitestone", borough: "Queens", address: "11-18 154th St, Whitestone, NY 11357", tags: ["italian", "deli", "sandwich"], cuisine: "Italian deli", dish: "Italian sandwiches", blurb: "Italian deli in Whitestone, up by the Whitestone Bridge." },
  { name: "Tina's Place", area: "Bushwick", borough: "Brooklyn", address: "1002 Flushing Ave, Brooklyn, NY 11206", tags: ["diner"], cuisine: "Diner", dish: "Breakfast", blurb: "Bushwick diner. Strongest as a breakfast stop." },
  { name: "Johny's Luncheonette", area: "Chelsea", borough: "Manhattan", address: "124 W 25th St, New York, NY 10001", tags: ["diner"], cuisine: "Diner", dish: "Diner classics", blurb: "Chelsea luncheonette, spelled Johny's on the awning." },
  { name: "John's Coffee Shop", area: "Midtown East", borough: "Manhattan", address: "823 2nd Ave, New York, NY 10017", tags: ["diner"], cuisine: "Diner", dish: "Diner classics", blurb: "Midtown East coffee shop from the diner list." },
  { name: "Jonny's Pizza", area: "Lower East Side", borough: "Manhattan", address: "173 Orchard St, New York, NY 10002", tags: ["pizza"], cuisine: "Pizza", dish: "Slice", blurb: "Orchard Street slice shop." },
  { name: "Leo's Casa Calamari", area: "Bay Ridge", borough: "Brooklyn", address: "8502 3rd Ave, Brooklyn, NY 11209", tags: ["pizza", "italian"], cuisine: "Pizza", dish: "Slice", blurb: "The pizza list only says Leo. This is the Bay Ridge shop by that name." },
  { name: "Haji's Famous Deli", area: "East Harlem", borough: "Manhattan", address: "2135 1st Ave, New York, NY 10029", tags: ["sandwich", "deli"], cuisine: "Deli", dish: "Chopped cheese", blurb: "The East Harlem chopped cheese counter, also called Blue Sky Deli or Hajji's." },
];

let n = data.results.length;
for (const spot of additions) {
  const geo = await census(spot.address);
  await sleep(200);
  if (!geo) {
    console.log("ADD MISS", spot.name, spot.address);
    continue;
  }
  n += 1;
  data.results.push({
    id: `${spot.name} ${spot.area}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + `-${n}`,
    ...spot,
    lat: geo.lat,
    lng: geo.lng,
    matched: geo.matched,
    via: "census",
  });
  console.log("ADDED", spot.name, geo.matched);
}

for (const q of [
  "Ursula restaurant Brooklyn New York breakfast",
  "Joe & Pat's Pizzeria East Village New York",
  "Ella Spice Brooklyn",
  "El Jalapeño restaurant Manhattan",
  "Bodega Truck Brooklyn",
]) {
  const hits = await nominatim(q);
  console.log("\nQUERY", q);
  for (const hit of hits.slice(0, 3)) console.log(" -", hit.matched);
}

const placed = new Set(data.results.map((spot) => spot.name));
data.unplaced = [
  { name: "Ella Spice", cuisine: "Grenadian", dish: "Breadfruit balls", note: "Grenadian spot from the photo roundup. No reliable street address turned up." },
  { name: "Cheung Fun Cart", cuisine: "Chinese", dish: "Cheung fun", note: "A Chinatown street cart. The corner changes, so it is not pinned." },
  { name: "Bodega Truck", cuisine: "Sandwiches", dish: "Sandwiches", note: "A truck. Check where it is parked that day." },
  { name: "El Jalapeño", cuisine: "Mexican", dish: "Tacos", note: "Several places share this name, so it is not pinned." },
].filter((spot) => !placed.has(spot.name));

await writeFile(file, JSON.stringify(data, null, 2));
console.log("\nTotal", data.results.length);
