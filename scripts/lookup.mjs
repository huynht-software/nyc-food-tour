const queries = [
  "500 Grand Street, Manhattan",
  "Zafi's Luncheonette",
  "387A Nostrand Avenue, Brooklyn",
  "Ella Spice",
  "El Jalapeno",
  "Joe and Pats",
];

for (const q of queries) {
  const url = `https://geosearch.planninglabs.nyc/v2/search?text=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  const body = await res.json();
  console.log("\n" + q);
  for (const feature of (body.features || []).slice(0, 4)) {
    const [lng, lat] = feature.geometry.coordinates;
    console.log(lat.toFixed(6), lng.toFixed(6), feature.properties.label);
  }
}
