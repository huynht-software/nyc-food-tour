import { writeFile, mkdir } from "node:fs/promises";

const spots = [
  // --- From the photo roundup ---
  { name: "Little Myanmar", area: "East Village", borough: "Manhattan", address: "150 E 2nd St, New York, NY 10009", tags: ["asian", "burmese"], cuisine: "Burmese", dish: "Coconut chicken noodle soup", blurb: "Little Myanmar, big flavor. The coconut chicken noodle soup is the one from the photo roundup." },
  { name: "Little Myanmar", area: "Jackson Heights", borough: "Queens", address: "71-15 37th Ave, Jackson Heights, NY 11372", tags: ["asian", "burmese"], cuisine: "Burmese", dish: "Coconut chicken noodle soup", blurb: "The Jackson Heights location of this family-run Burmese restaurant." },
  { name: "Ravagh Persian Grill", area: "Koreatown", borough: "Manhattan", address: "11 E 30th St, New York, NY 10016", tags: ["middle-eastern", "persian"], cuisine: "Persian", dish: "Pomegranate fesenjan and cherry rice", blurb: "Fesenjan and cherry rice. A sit-down Persian grill." },
  { name: "El Budare Cafe", area: "Jackson Heights", borough: "Queens", address: "87-21 Roosevelt Ave, Jackson Heights, NY 11372", tags: ["latin", "venezuelan"], cuisine: "Venezuelan", dish: "Reina pepiada arepa and cachapas", blurb: "Arepas, including the reina pepiada, plus cachapas. On Roosevelt Avenue." },
  { name: "Saranrom Thai", area: "Elmhurst", borough: "Queens", address: "81-10 Broadway, Elmhurst, NY 11373", tags: ["asian", "thai"], cuisine: "Thai", dish: "Red curry and Thai iced tea", blurb: "Red curry and Thai iced tea. The post calls out the servers as much as the food." },
  { name: "Mei Lai Wah", area: "Chinatown", borough: "Manhattan", address: "64 Bayard St, New York, NY 10013", tags: ["asian", "chinese", "bakery"], cuisine: "Chinese bakery", dish: "Pineapple pork bun", blurb: "The pineapple bun, ideally the pork one, from the Chinatown bakery counter." },
  { name: "Pupusas Ridgewood", area: "Ridgewood", borough: "Queens", address: "71-20 Fresh Pond Rd, Ridgewood, NY 11385", tags: ["latin", "salvadoran"], cuisine: "Salvadoran", dish: "Pupusas", blurb: "Called out as one of the best pupusas the poster ever had." },
  { name: "Burmese Bites", area: "Elmhurst", borough: "Queens", address: "90-15 Queens Blvd, Elmhurst, NY 11373", tags: ["asian", "burmese"], cuisine: "Burmese", dish: "Keema palata", blurb: "Keema palata. Inside Queens Center mall." },
  { name: "Ella Spice", area: "", borough: "", q: "Ella Spice restaurant New York", tags: ["caribbean", "grenadian"], cuisine: "Grenadian", dish: "Breadfruit balls", blurb: "Grenadian cooking. The breadfruit balls were the dish in the photo." },
  { name: "Amar Peruvian Kitchen", area: "Forest Hills", borough: "Queens", address: "68-60 Austin St, Forest Hills, NY 11375", tags: ["latin", "peruvian"], cuisine: "Peruvian", dish: "Aji de gallina", blurb: "Aji de gallina in Forest Hills." },
  { name: "Tuscan Hills", area: "", borough: "", q: "Tuscan Hills restaurant New York", tags: ["italian"], cuisine: "Italian", dish: "Pollo parmigiana", blurb: "Pollo parmigiana. The post also praises the cocktails and service." },
  { name: "The Weekender", area: "Woodside", borough: "Queens", address: "41-46 54th St, Woodside, NY 11377", tags: ["asian", "bhutanese"], cuisine: "Bhutanese", dish: "Kewa datshi", blurb: "Bhutanese cooking inside a snooker hall. Kewa datshi is the dish to order." },
  { name: "Lhasa Snack Cafe", area: "Woodside", borough: "Queens", address: "69-11 Roosevelt Ave, Woodside, NY 11377", tags: ["asian", "tibetan"], cuisine: "Tibetan", dish: "Jhol momo", blurb: "Jhol momo, the soup dumplings, on Roosevelt Avenue." },
  { name: "Lenox Thai", area: "", borough: "", q: "Lenox Thai New York", tags: ["asian", "thai"], cuisine: "Thai", dish: "Drunken noodles", blurb: "Drunken noodles with a heavy hand on the beef. Friendly service." },
  { name: "Casa Adela", area: "East Village", borough: "Manhattan", address: "66 Avenue C, New York, NY 10009", tags: ["latin", "puerto-rican"], cuisine: "Puerto Rican", dish: "Mofongo", blurb: "A Loisaida institution. Come for the mofongo." },
  { name: "La Gran Uruguaya", area: "Jackson Heights", borough: "Queens", address: "85-06 37th Ave, Jackson Heights, NY 11372", tags: ["latin", "uruguayan", "bakery"], cuisine: "Uruguayan bakery", dish: "Dulce de leche medialuna", blurb: "Bakery case stop. The dulce de leche medialuna is the one from the post." },
  { name: "Queens Night Market", area: "Corona", borough: "Queens", address: "47-01 111th St, Corona, NY 11368", tags: ["market"], cuisine: "Night market", dish: "Ube flan, Kazakh samsa", blurb: "Seasonal weekend market by the Hall of Science. The post remembers a Filipino ube flan and samsa from Tastes of the Silk Road. Stands change, and it is not open year-round." },
  { name: "Birria-Landia", area: "Jackson Heights", borough: "Queens", address: "77-05 Roosevelt Ave, Jackson Heights, NY 11372", tags: ["mexican"], cuisine: "Mexican", dish: "Birria tacos and mulita", blurb: "The Jackson Heights truck, not the Manhattan one. The post calls it the best birria they have had, and says to get the mulita." },

  // --- Pizza ---
  { name: "L'industrie Pizzeria", area: "West Village", borough: "Manhattan", address: "104 Christopher St, New York, NY 10014", tags: ["pizza", "italian"], cuisine: "Pizza", dish: "Slice", blurb: "The West Village shop. A destination slice." },
  { name: "L'industrie Pizzeria", area: "Park Slope", borough: "Brooklyn", address: "254 5th Ave, Brooklyn, NY 11215", tags: ["pizza", "italian"], cuisine: "Pizza", dish: "Slice", blurb: "The original Brooklyn shop on Fifth Avenue." },
  { name: "Ace's Pizza", area: "Bushwick", borough: "Brooklyn", address: "423 Troutman St, Brooklyn, NY 11237", tags: ["pizza"], cuisine: "Pizza", dish: "Slice", blurb: "The Bushwick location called out on the list." },
  { name: "Mama's TOO", area: "Upper West Side", borough: "Manhattan", address: "2750 Broadway, New York, NY 10025", tags: ["pizza"], cuisine: "Pizza", dish: "Slice", blurb: "Upper West Side slice shop." },
  { name: "Bleecker Street Pizza", area: "West Village", borough: "Manhattan", address: "69 7th Ave S, New York, NY 10014", tags: ["pizza"], cuisine: "Pizza", dish: "Slice", blurb: "A Village slice, a short walk from the other famous corners." },
  { name: "Joe's Pizza", area: "Greenwich Village", borough: "Manhattan", address: "7 Carmine St, New York, NY 10014", tags: ["pizza"], cuisine: "Pizza", dish: "Slice", blurb: "The Carmine Street shop. Plain or pepperoni, eaten on the sidewalk." },
  { name: "Lucia Pizza", area: "Gravesend", borough: "Brooklyn", address: "2201 Avenue X, Brooklyn, NY 11235", tags: ["pizza", "italian"], cuisine: "Pizza", dish: "Plain or pepperoni slice", blurb: "The Brooklyn shop. Plain or pepperoni is the move." },
  { name: "Lucia Pizza", area: "SoHo", borough: "Manhattan", address: "375 Canal St, New York, NY 10013", tags: ["pizza", "italian"], cuisine: "Pizza", dish: "Plain or pepperoni slice", blurb: "Manhattan outpost of the Brooklyn slice shop." },
  { name: "Joe & Pat's", area: "Castleton Corners", borough: "Staten Island", address: "1758 Victory Blvd, Staten Island, NY 10314", tags: ["pizza", "italian"], cuisine: "Pizza", dish: "Vodka pie", blurb: "The Staten Island original. Worth the ferry if you are doing a pizza day." },
  { name: "Joe & Pat's", area: "East Village", borough: "Manhattan", q: "Joe and Pat's Pizzeria 1st Avenue New York", tags: ["pizza", "italian"], cuisine: "Pizza", dish: "Vodka pie", blurb: "The Manhattan outpost of the Staten Island pizzeria." },
  { name: "Paulie Gee's", area: "Greenpoint", borough: "Brooklyn", address: "60 Greenpoint Ave, Brooklyn, NY 11222", tags: ["pizza", "italian"], cuisine: "Pizza", dish: "Wood-fired pie", blurb: "Wood-fired pies in Greenpoint. More of a sit-down pie than a foldable slice." },
  { name: "Rosario's", area: "Astoria", borough: "Queens", address: "22-55 31st St, Astoria, NY 11105", tags: ["pizza", "italian", "deli"], cuisine: "Pizza", dish: "Slice", blurb: "An Astoria Italian deli with a serious slice in the back." },
  { name: "Jonny's Pizza", area: "", borough: "", q: "Jonny's Pizza New York", tags: ["pizza"], cuisine: "Pizza", dish: "Slice", blurb: "Neighborhood slice shop from the pizza list." },
  { name: "Best Pizza", area: "Williamsburg", borough: "Brooklyn", address: "33 Havemeyer St, Brooklyn, NY 11211", tags: ["pizza"], cuisine: "Pizza", dish: "Slice", blurb: "Williamsburg slice shop. The square and the round are both in play." },
  { name: "Scarr's Pizza", area: "Lower East Side", borough: "Manhattan", address: "22 Orchard St, New York, NY 10002", tags: ["pizza"], cuisine: "Pizza", dish: "Slice", blurb: "Milled-in-house flour, Lower East Side slice counter." },
  { name: "Leo", area: "", borough: "", q: "Leo pizzeria New York City", tags: ["pizza"], cuisine: "Pizza", dish: "Slice", blurb: "Listed under pizza. Confirm the shop when you get close — the name is short." },
  { name: "Vinnie's Pizzeria", area: "Upper West Side", borough: "Manhattan", address: "285 Amsterdam Ave, New York, NY 10023", tags: ["pizza"], cuisine: "Pizza", dish: "Slice", blurb: "Upper West Side slice." },
  { name: "Cello's Pizzeria", area: "East Village", borough: "Manhattan", address: "36 St Marks Pl, New York, NY 10003", tags: ["pizza"], cuisine: "Pizza", dish: "Slice", blurb: "St. Marks Place slice." },

  // --- Italian ---
  { name: "Casa Della Mozzarella", area: "Belmont", borough: "Bronx", address: "2219 Arthur Ave, Bronx, NY 10457", tags: ["italian", "sandwich", "deli"], cuisine: "Italian deli", dish: "The Casa sandwich", blurb: "Arthur Avenue shop. The Casa is the sandwich from the classics list." },
  { name: "Carmine's", area: "Times Square", borough: "Manhattan", address: "200 W 44th St, New York, NY 10036", tags: ["italian"], cuisine: "Italian", dish: "Family-style red sauce", blurb: "Family-style Italian in Times Square. Portions are built for a group." },
  { name: "Faicco's Italian Specialties", area: "West Village", borough: "Manhattan", address: "260 Bleecker St, New York, NY 10014", tags: ["italian", "sandwich", "deli"], cuisine: "Italian deli", dish: "Italian sandwiches", blurb: "Bleecker Street Italian shop. Sandwiches and imported groceries." },
  { name: "Veniero's", area: "East Village", borough: "Manhattan", address: "342 E 11th St, New York, NY 10003", tags: ["italian", "bakery"], cuisine: "Italian bakery", dish: "Pastries", blurb: "A century-old pasticceria. Go for something from the case." },
  { name: "John's of 12th Street", area: "East Village", borough: "Manhattan", address: "302 E 12th St, New York, NY 10003", tags: ["italian"], cuisine: "Italian", dish: "Red-sauce classics", blurb: "Old-school East Village red sauce, not a pizza counter." },
  { name: "Tony's Beechhurst Deli", area: "Beechhurst", borough: "Queens", q: "Tony's Beechhurst Deli Queens", tags: ["italian", "deli", "sandwich"], cuisine: "Italian deli", dish: "Italian sandwiches", blurb: "Far-north Queens Italian deli." },
  { name: "Emilio's Ballato", area: "SoHo", borough: "Manhattan", address: "55 E Houston St, New York, NY 10012", tags: ["italian"], cuisine: "Italian", dish: "Red-sauce classics", blurb: "Houston Street Italian. A reservations kind of room, not a slice." },
  { name: "Don Angie", area: "West Village", borough: "Manhattan", address: "103 Greenwich Ave, New York, NY 10014", tags: ["italian"], cuisine: "Italian", dish: "Chrysanthemum salad, pinwheel lasagna", blurb: "West Village Italian. Book ahead if you want a table." },
  { name: "All'Antico Vinaio", area: "", borough: "", q: "All'Antico Vinaio New York", tags: ["italian", "sandwich"], cuisine: "Italian sandwich", dish: "Schiacciata sandwich", blurb: "Florentine sandwich counter. There is often a line." },

  // --- Mexican ---
  { name: "Antojitos Charly", area: "Jackson Heights", borough: "Queens", address: "74-20 Roosevelt Ave, Jackson Heights, NY 11372", tags: ["mexican"], cuisine: "Mexican", dish: "Al pastor tacos", blurb: "Roosevelt Avenue taco stop in Jackson Heights." },
  { name: "Los Tacos No. 1", area: "Chelsea", borough: "Manhattan", address: "75 9th Ave, New York, NY 10011", tags: ["mexican"], cuisine: "Mexican", dish: "Adobada taco", blurb: "Inside Chelsea Market. Order at the counter." },
  { name: "Los Tacos No. 1", area: "Times Square", borough: "Manhattan", q: "Los Tacos No. 1 Times Square New York", tags: ["mexican"], cuisine: "Mexican", dish: "Adobada taco", blurb: "The Times Square counter, useful if you are already in Midtown." },
  { name: "Carnitas Ramirez", area: "", borough: "", q: "Carnitas Ramirez New York", tags: ["mexican"], cuisine: "Mexican", dish: "Carnitas", blurb: "Carnitas specialist from the taco list." },
  { name: "Nene's Taqueria", area: "Bushwick", borough: "Brooklyn", address: "14 Starr St, Brooklyn, NY 11237", tags: ["mexican"], cuisine: "Mexican", dish: "Birria", blurb: "Bushwick birria. Consomé on the side." },
  { name: "Tacos El Bronco", area: "Sunset Park", borough: "Brooklyn", address: "4323 4th Ave, Brooklyn, NY 11232", tags: ["mexican"], cuisine: "Mexican", dish: "Tacos", blurb: "Sunset Park taqueria. They also run trucks nearby." },
  { name: "Tacos Domingo", area: "", borough: "", q: "Tacos Domingo New York", tags: ["mexican"], cuisine: "Mexican", dish: "Tacos", blurb: "From the Mexican list." },
  { name: "Taqueria Ramirez", area: "Greenpoint", borough: "Brooklyn", address: "94 Franklin St, Brooklyn, NY 11222", tags: ["mexican"], cuisine: "Mexican", dish: "Suadero and tripa tacos", blurb: "Mexico City-style tacos in Greenpoint. Expect a sidewalk line." },
  { name: "Los Burritos Juarez", area: "", borough: "", q: "Los Burritos Juarez New York", tags: ["mexican"], cuisine: "Mexican", dish: "Burritos", blurb: "Burritos from the Mexican list." },
  { name: "Esse Taco", area: "", borough: "", q: "Esse Taco Brooklyn", tags: ["mexican"], cuisine: "Mexican", dish: "Tacos", blurb: "Brooklyn taco spot." },
  { name: "Santo Taco", area: "SoHo", borough: "Manhattan", q: "Santo Taco SoHo New York", tags: ["mexican"], cuisine: "Mexican", dish: "Tacos", blurb: "The SoHo location." },
  { name: "Mariscos El Submarino", area: "Jackson Heights", borough: "Queens", address: "88-05 Roosevelt Ave, Jackson Heights, NY 11372", tags: ["mexican", "seafood"], cuisine: "Mexican seafood", dish: "Shrimp and octopus tacos", blurb: "Seafood tacos and cocteles on Roosevelt Avenue." },
  { name: "El Jalapeño", area: "", borough: "", q: "El Jalapeño restaurant New York City", tags: ["mexican"], cuisine: "Mexican", dish: "Tacos", blurb: "From the Mexican list." },

  // --- Chinese ---
  { name: "Cheung Fun Cart", area: "Chinatown", borough: "Manhattan", q: "cheung fun cart Chinatown New York", tags: ["asian", "chinese"], cuisine: "Chinese", dish: "Cheung fun", blurb: "A Chinatown street cart. The corner can move, so check the block when you arrive." },
  { name: "Chongqing Lao Zao", area: "Flushing", borough: "Queens", address: "37-04 Prince St, Flushing, NY 11354", tags: ["asian", "chinese"], cuisine: "Sichuan", dish: "Chongqing hot pot", blurb: "Flushing hot pot. The spice level is the point." },
  { name: "New Kim Tuong", area: "", borough: "", q: "New Kim Tuong New York", tags: ["asian", "chinese"], cuisine: "Chinese", dish: "", blurb: "From the Chinese list." },
  { name: "Tasty Hand-Pulled Noodles", area: "Chinatown", borough: "Manhattan", address: "1 Doyers St, New York, NY 10013", tags: ["asian", "chinese"], cuisine: "Chinese", dish: "Hand-pulled noodles", blurb: "Noodles pulled to order on Doyers Street." },
  { name: "1915 Lanzhou Hand-Pulled Noodles", area: "", borough: "", q: "1915 Lanzhou Hand Pulled Noodles New York", tags: ["asian", "chinese"], cuisine: "Chinese", dish: "Lanzhou beef noodles", blurb: "Beef noodle shop. The list runs its name together with a Fuzhou place; this pin is the Lanzhou shop." },
  { name: "Supreme Restaurant", area: "", borough: "", q: "Supreme Restaurant Chinatown New York", tags: ["asian", "chinese"], cuisine: "Chinese", dish: "", blurb: "From the Chinese list." },
  { name: "Wo Hop", area: "Chinatown", borough: "Manhattan", address: "17 Mott St, New York, NY 10013", tags: ["asian", "chinese"], cuisine: "Chinese", dish: "Late-night Cantonese", blurb: "Downstairs on Mott Street. Open very late." },
  { name: "Jin Mei Dumpling", area: "", borough: "", q: "Jin Mei Dumpling New York", tags: ["asian", "chinese"], cuisine: "Chinese", dish: "Dumplings", blurb: "Dumpling shop from the Chinese list." },
  { name: "Double Crispy Bakery", area: "", borough: "", q: "Double Crispy Bakery New York", tags: ["asian", "chinese", "bakery"], cuisine: "Chinese bakery", dish: "Bakery counter", blurb: "Chinese bakery from the list." },
  { name: "Sky Pavilion", area: "", borough: "", q: "Sky Pavilion restaurant Flushing New York", tags: ["asian", "chinese"], cuisine: "Chinese", dish: "", blurb: "From the Chinese list." },
  { name: "Shu Jiao Fu Zhou", area: "Lower East Side", borough: "Manhattan", address: "118 Eldridge St, New York, NY 10002", tags: ["asian", "chinese"], cuisine: "Fuzhou", dish: "Peanut butter noodles and dumplings", blurb: "Fuzhou dumplings and peanut noodles on Eldridge Street." },

  // --- Thai ---
  { name: "Ugly Baby", area: "Carroll Gardens", borough: "Brooklyn", address: "407 Smith St, Brooklyn, NY 11231", tags: ["asian", "thai"], cuisine: "Thai", dish: "Southern Thai", blurb: "Southern Thai in Carroll Gardens. This restaurant closed — confirm before you make the trip." },
  { name: "Thai Diner", area: "Nolita", borough: "Manhattan", address: "186 Mott St, New York, NY 10012", tags: ["asian", "thai", "diner"], cuisine: "Thai diner", dish: "Thai diner plates", blurb: "A diner menu cooked with Thai flavors. On Mott Street." },
  { name: "Soothr", area: "East Village", borough: "Manhattan", address: "204 E 13th St, New York, NY 10003", tags: ["asian", "thai"], cuisine: "Thai", dish: "Boat noodles", blurb: "East Village Thai. Boat noodles are the dish people line up for." },
  { name: "Mommy Pai's", area: "Nolita", borough: "Manhattan", address: "203 Mott St, New York, NY 10012", tags: ["asian", "thai"], cuisine: "Thai", dish: "Thai chicken tenders", blurb: "Walk-up Thai chicken from the Thai Diner team, a few doors away." },

  // --- Delis and bagels ---
  { name: "Katz's Delicatessen", area: "Lower East Side", borough: "Manhattan", address: "205 E Houston St, New York, NY 10002", tags: ["deli", "sandwich"], cuisine: "Jewish deli", dish: "Pastrami sandwich", blurb: "Pastrami, hand-cut. Keep the ticket — they charge you from it on the way out." },
  { name: "Zabar's", area: "Upper West Side", borough: "Manhattan", address: "2245 Broadway, New York, NY 10024", tags: ["deli", "bakery"], cuisine: "Appetizing", dish: "Smoked fish and bagels", blurb: "Upper West Side market. Bagels, smoked fish, and the upstairs coffee counter." },
  { name: "Utopia Bagels", area: "Whitestone", borough: "Queens", address: "1909 Utopia Pkwy, Whitestone, NY 11357", tags: ["deli", "bakery"], cuisine: "Bagels", dish: "Everything bagel with scallion cream cheese and lox", blurb: "The Whitestone shop. Everything bagel, scallion cream cheese, sliced lox." },
  { name: "Frankel's Delicatessen", area: "", borough: "", q: "Frankel's Delicatessen Appetizing Brooklyn", tags: ["deli"], cuisine: "Jewish deli", dish: "Smoked fish", blurb: "Appetizing shop from the deli list." },
  { name: "Russ & Daughters", area: "Lower East Side", borough: "Manhattan", address: "179 E Houston St, New York, NY 10002", tags: ["deli"], cuisine: "Appetizing", dish: "Bagel and lox", blurb: "The classic appetizing counter on Houston. A short walk from Katz's, and a very different meal." },
  { name: "Barney Greengrass", area: "Upper West Side", borough: "Manhattan", address: "541 Amsterdam Ave, New York, NY 10024", tags: ["deli"], cuisine: "Appetizing", dish: "Sturgeon and eggs", blurb: "The Sturgeon King. Upper West Side, closed Mondays — check the day." },
  { name: "Tompkins Square Bagels", area: "East Village", borough: "Manhattan", address: "165 Avenue A, New York, NY 10009", tags: ["deli", "bakery"], cuisine: "Bagels", dish: "Bagel with scallion cream cheese", blurb: "East Village bagel shop with a long topping list." },
  { name: "2nd Ave Deli", area: "Murray Hill", borough: "Manhattan", address: "162 E 33rd St, New York, NY 10016", tags: ["deli", "sandwich"], cuisine: "Jewish deli", dish: "Pastrami and matzo ball soup", blurb: "The Murray Hill location of the old Second Avenue deli." },

  // --- Sandwiches ---
  { name: "Fedoroff's Roast Pork", area: "Williamsburg", borough: "Brooklyn", address: "178 N 10th St, Brooklyn, NY 11211", tags: ["sandwich"], cuisine: "Cheesesteak", dish: "Roast pork sandwich", blurb: "Philly-style roast pork and cheesesteaks in Williamsburg." },
  { name: "Mission Sandwich Social", area: "", borough: "", q: "Mission Sandwich Social New York", tags: ["sandwich"], cuisine: "Sandwiches", dish: "Sandwiches", blurb: "From the sandwich list." },
  { name: "Bodega Truck", area: "", borough: "", q: "Bodega Truck New York", tags: ["sandwich"], cuisine: "Sandwiches", dish: "Sandwiches", blurb: "A truck, so confirm where it is parked that day." },
  { name: "Haji's Famous Deli", area: "", borough: "", q: "Haji's Famous Deli chopped cheese New York", tags: ["sandwich", "deli"], cuisine: "Deli", dish: "Chopped cheese", blurb: "Chopped cheese stop from the sandwich list." },

  // --- Burgers ---
  { name: "Red Hook Tavern", area: "Red Hook", borough: "Brooklyn", address: "329 Van Brunt St, Brooklyn, NY 11231", tags: ["burger"], cuisine: "Burger", dish: "Tavern burger", blurb: "A dry-aged burger in Red Hook. Pair the walk with Hometown Bar-B-Que nearby." },
  { name: "Gotham Burger Social Club", area: "Lower East Side", borough: "Manhattan", address: "131 Essex St, New York, NY 10002", tags: ["burger"], cuisine: "Burger", dish: "Oklahoma onion burger", blurb: "Smashed onion burgers on Essex Street." },
  { name: "Hamburger America", area: "SoHo", borough: "Manhattan", address: "155 W Houston St, New York, NY 10014", tags: ["burger"], cuisine: "Burger", dish: "Counter burger", blurb: "George Motz's counter. A short menu and a stool." },
  { name: "Flat Out Burger", area: "Lower East Side", borough: "Manhattan", address: "139 Eldridge St, New York, NY 10002", tags: ["burger"], cuisine: "Burger", dish: "Smash burger", blurb: "Lower East Side smash burgers." },
  { name: "Flat Out Burger", area: "Bedford-Stuyvesant", borough: "Brooklyn", address: "199 Malcolm X Blvd, Brooklyn, NY 11221", tags: ["burger"], cuisine: "Burger", dish: "Smash burger", blurb: "The Bed-Stuy shop." },
  { name: "Burger Joint", area: "Midtown", borough: "Manhattan", address: "119 W 56th St, New York, NY 10019", tags: ["burger"], cuisine: "Burger", dish: "Burger and fries", blurb: "Hidden behind a curtain in the Le Parker Meridien lobby." },

  // --- Diners ---
  { name: "Court Square Diner", area: "Long Island City", borough: "Queens", address: "45-30 23rd St, Long Island City, NY 11101", tags: ["diner"], cuisine: "Diner", dish: "Diner classics", blurb: "A stainless-steel diner by the Court Square trains." },
  { name: "John's Coffee Shop", area: "", borough: "", q: "John's Coffee Shop diner New York", tags: ["diner"], cuisine: "Diner", dish: "Diner classics", blurb: "From the diner list." },
  { name: "Johnny's Luncheonette", area: "", borough: "", q: "Johnny's Luncheonette New York", tags: ["diner"], cuisine: "Diner", dish: "Diner classics", blurb: "From the diner list." },
  { name: "Zafi's Luncheonette", area: "", borough: "", q: "Zafi's Luncheonette New York", tags: ["diner"], cuisine: "Diner", dish: "Diner classics", blurb: "From the diner list." },
  { name: "S&P Lunch", area: "Flatiron", borough: "Manhattan", address: "174 5th Ave, New York, NY 10010", tags: ["diner", "sandwich"], cuisine: "Lunch counter", dish: "Tuna sandwich", blurb: "The old Flatiron lunch counter." },
  { name: "Tina's Place", area: "", borough: "", q: "Tina's Place diner New York", tags: ["diner"], cuisine: "Diner", dish: "Diner classics", blurb: "From the diner list." },
  { name: "La Bonbonniere", area: "West Village", borough: "Manhattan", address: "28 8th Ave, New York, NY 10014", tags: ["diner"], cuisine: "Diner", dish: "Eggs and home fries", blurb: "A tiny West Village diner. Cash is the safe assumption — check before you sit." },
  { name: "Old John's Luncheonette", area: "", borough: "", q: "Old John's Luncheonette New York", tags: ["diner"], cuisine: "Diner", dish: "Diner classics", blurb: "From the diner list." },

  // --- Korean ---
  { name: "Yoon Haeundae Galbi", area: "", borough: "", q: "Yoon Haeundae Galbi New York", tags: ["asian", "korean"], cuisine: "Korean", dish: "Galbi", blurb: "Korean barbecue from the list." },
  { name: "Jongro BBQ", area: "Koreatown", borough: "Manhattan", address: "22 W 32nd St, New York, NY 10001", tags: ["asian", "korean"], cuisine: "Korean", dish: "Galbi", blurb: "Second-floor Korean barbecue in Koreatown." },

  // --- Soul food ---
  { name: "Sylvia's", area: "Harlem", borough: "Manhattan", address: "328 Malcolm X Blvd, New York, NY 10027", tags: ["soul"], cuisine: "Soul food", dish: "Fried chicken and ribs", blurb: "Harlem soul food. The gospel brunch is a different scene from a weeknight dinner." },
  { name: "Charles Pan-Fried Chicken", area: "", borough: "", q: "Charles Pan-Fried Chicken Harlem", tags: ["soul", "fried-chicken"], cuisine: "Soul food", dish: "Pan-fried chicken", blurb: "Harlem pan-fried chicken." },
  { name: "Peaches HotHouse", area: "Bedford-Stuyvesant", borough: "Brooklyn", address: "415 Tompkins Ave, Brooklyn, NY 11216", tags: ["soul", "fried-chicken"], cuisine: "Soul food", dish: "Hot chicken", blurb: "Bed-Stuy hot chicken and sides." },

  // --- The rest of the second list ---
  { name: "Gray's Papaya", area: "Upper West Side", borough: "Manhattan", address: "2090 Broadway, New York, NY 10023", tags: ["hot-dog"], cuisine: "Hot dogs", dish: "Frank and papaya juice", blurb: "Recession special energy: a hot dog and a papaya drink at the Broadway shop." },
  { name: "Peter Luger", area: "Williamsburg", borough: "Brooklyn", address: "178 Broadway, Brooklyn, NY 11211", tags: ["steak"], cuisine: "Steakhouse", dish: "Porterhouse", blurb: "Williamsburg steakhouse. Cash or Peter Luger card — regular credit cards are not the plan. Reserve." },
  { name: "Margon", area: "Midtown", borough: "Manhattan", address: "136 W 46th St, New York, NY 10036", tags: ["latin", "cuban"], cuisine: "Cuban", dish: "Cuban lunch counter", blurb: "A Theater District Cuban counter. Fast and inexpensive relative to the block." },
  { name: "El Castillo de Jagua", area: "", borough: "", q: "El Castillo de Jagua restaurant New York", tags: ["latin", "dominican"], cuisine: "Dominican", dish: "Dominican classics", blurb: "Dominican restaurant from the list." },
  { name: "188 Bakery Cuchifritos", area: "", borough: "", q: "188 Bakery Cuchifritos New York", tags: ["latin", "puerto-rican", "bakery"], cuisine: "Puerto Rican bakery", dish: "Cuchifritos", blurb: "Puerto Rican bakery and cuchifritos." },
  { name: "Strange Delight", area: "", borough: "", q: "Strange Delight oyster New York", tags: ["seafood"], cuisine: "Seafood", dish: "Oyster happy hour", blurb: "Listed for the oyster happy hour." },
  { name: "Hometown Bar-B-Que", area: "Red Hook", borough: "Brooklyn", address: "454 Van Brunt St, Brooklyn, NY 11231", tags: ["bbq"], cuisine: "Barbecue", dish: "Brisket and ribs", blurb: "Red Hook barbecue. A short walk from Red Hook Tavern." },
  { name: "Punjabi Grocery & Deli", area: "East Village", borough: "Manhattan", address: "114 E 1st St, New York, NY 10009", tags: ["indian"], cuisine: "Indian", dish: "Veggie thali", blurb: "A tiny East Village counter. The vegetarian special is the order." },
  { name: "The Commodore", area: "Williamsburg", borough: "Brooklyn", address: "366 Metropolitan Ave, Brooklyn, NY 11211", tags: ["fried-chicken"], cuisine: "Fried chicken", dish: "Fried chicken", blurb: "A Williamsburg bar where the reason to go is the fried chicken." },
  { name: "Ursula", area: "Brooklyn", borough: "Brooklyn", q: "Ursula Brooklyn breakfast burrito", tags: ["mexican", "breakfast"], cuisine: "Breakfast burritos", dish: "Breakfast burrito", blurb: "Brooklyn breakfast burritos." },

  // --- Classics list ---
  { name: "J.G. Melon", area: "Upper East Side", borough: "Manhattan", address: "1291 3rd Ave, New York, NY 10021", tags: ["burger"], cuisine: "Burger", dish: "Cheeseburger", blurb: "The Upper East Side tavern burger. No substitutions culture — get the cheeseburger." },
  { name: "L&B Spumoni Gardens", area: "Bensonhurst", borough: "Brooklyn", address: "2725 86th St, Brooklyn, NY 11223", tags: ["pizza", "italian", "bakery"], cuisine: "Pizza", dish: "Square slice", blurb: "The upside-down square slice, sauce on top of the cheese, plus spumoni." },
  { name: "William Greenberg Desserts", area: "", borough: "", q: "William Greenberg Desserts New York", tags: ["bakery"], cuisine: "Bakery", dish: "Black-and-white cookie", blurb: "The black-and-white cookie stop." },
  { name: "Veselka", area: "East Village", borough: "Manhattan", address: "144 2nd Ave, New York, NY 10003", tags: ["eastern-european", "diner"], cuisine: "Ukrainian", dish: "Potato pierogi", blurb: "East Village Ukrainian diner. Potato pierogi, any hour you are likely to be awake." },
  { name: "Keens Steakhouse", area: "Herald Square", borough: "Manhattan", address: "72 W 36th St, New York, NY 10018", tags: ["steak"], cuisine: "Steakhouse", dish: "Mutton chop", blurb: "The mutton chop, under a ceiling of clay pipes. Reserve." },
  { name: "Le Bernardin", area: "Midtown", borough: "Manhattan", address: "155 W 51st St, New York, NY 10019", tags: ["seafood"], cuisine: "Seafood", dish: "Thinly pounded yellowfin tuna", blurb: "The tasting-menu seafood room. This is a special-occasion reservation, not a walk-in." },
  { name: "Fortunato Brothers", area: "Williamsburg", borough: "Brooklyn", address: "289 Manhattan Ave, Brooklyn, NY 11211", tags: ["italian", "bakery"], cuisine: "Italian bakery", dish: "Sfogliatella", blurb: "Williamsburg pastry shop. Get the sfogliatella." },
  { name: "Lexington Candy Shop", area: "Upper East Side", borough: "Manhattan", address: "1226 Lexington Ave, New York, NY 10028", tags: ["diner"], cuisine: "Luncheonette", dish: "Chocolate egg cream", blurb: "A 1920s luncheonette. The chocolate egg cream is the order from the classics list." },
  { name: "Renee's Kitchenette & Grille", area: "", borough: "", q: "Renee's Kitchenette Grille New York", tags: ["asian", "filipino"], cuisine: "Filipino", dish: "Chicken adobo", blurb: "Chicken adobo from the classics list." },
  { name: "La Morada", area: "Mott Haven", borough: "Bronx", address: "308 Willis Ave, Bronx, NY 10454", tags: ["mexican"], cuisine: "Mexican", dish: "Mole poblano", blurb: "Oaxacan mole in Mott Haven. The mole poblano is the dish." },
  { name: "Cho Dang Gol", area: "Koreatown", borough: "Manhattan", address: "55 W 35th St, New York, NY 10001", tags: ["asian", "korean"], cuisine: "Korean", dish: "Spicy kimchi tofu stew", blurb: "Tofu made in house. The kimchi soondubu is the bowl from the list." },
  { name: "Brennan & Carr", area: "Sheepshead Bay", borough: "Brooklyn", address: "3432 Nostrand Ave, Brooklyn, NY 11229", tags: ["sandwich"], cuisine: "Roast beef", dish: "Double-dip roast beef", blurb: "Roast beef dipped twice in gravy. A south-Brooklyn drive or a long subway ride." },
  { name: "Gino's of Bay Ridge", area: "Bay Ridge", borough: "Brooklyn", q: "Gino's Restaurant Bay Ridge Brooklyn", tags: ["italian"], cuisine: "Italian", dish: "Hot antipasto platter", blurb: "Bay Ridge Italian. The hot antipasto platter is the one on the classics list." },
  { name: "La Dinastia", area: "", borough: "", q: "La Dinastia restaurant New York", tags: ["latin", "dominican"], cuisine: "Dominican", dish: "Boneless chicken cracklings", blurb: "Boneless chicken cracklings." },
  { name: "Delmonico's", area: "Financial District", borough: "Manhattan", address: "56 Beaver St, New York, NY 10004", tags: ["steak"], cuisine: "Steakhouse", dish: "Delmonico ribeye", blurb: "The Financial District steakhouse. The namesake ribeye." },
  { name: "Kai Feng Fu Dumpling House", area: "", borough: "", q: "Kai Feng Fu Dumpling House Flushing", tags: ["asian", "chinese"], cuisine: "Chinese", dish: "Fried pork and chive dumplings", blurb: "Fried pork and chive dumplings." },
  { name: "Peter Pan Donut & Pastry Shop", area: "Greenpoint", borough: "Brooklyn", address: "727 Manhattan Ave, Brooklyn, NY 11222", tags: ["bakery"], cuisine: "Donuts", dish: "Sour cream donut", blurb: "Greenpoint donut shop. The sour cream donut is the one to get." },
  { name: "Ali's Roti Shop", area: "", borough: "", q: "Ali's Roti Shop New York doubles", tags: ["caribbean"], cuisine: "Trinidadian", dish: "Doubles", blurb: "Doubles and roti." },
  { name: "Lechonera La Isla", area: "", borough: "", q: "Lechonera La Isla New York", tags: ["latin", "puerto-rican"], cuisine: "Puerto Rican", dish: "Lechón", blurb: "Roast pork. Lechón is the order." },
];

const NYC = { minLat: 40.49, maxLat: 40.92, minLng: -74.3, maxLng: -73.68 };

function inNyc(lat, lng) {
  return lat >= NYC.minLat && lat <= NYC.maxLat && lng >= NYC.minLng && lng <= NYC.maxLng;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function census(address) {
  const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`;
  const res = await fetch(url, { headers: { "User-Agent": "nyc-food-tour personal trip map" } });
  if (!res.ok) throw new Error(`census ${res.status}`);
  const data = await res.json();
  const match = data?.result?.addressMatches?.[0];
  if (!match) return null;
  const lat = match.coordinates.y;
  const lng = match.coordinates.x;
  if (!inNyc(lat, lng)) return null;
  return { lat, lng, matched: match.matchedAddress };
}

async function nominatim(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=5&countrycodes=us&viewbox=-74.3,40.92,-73.68,40.49&bounded=0`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "nyc-food-tour/1.0 (personal NYC food trip planner)",
      "Accept-Language": "en",
    },
  });
  if (!res.ok) throw new Error(`nominatim ${res.status}`);
  const data = await res.json();
  const hit = data.find((item) => inNyc(Number(item.lat), Number(item.lon)));
  if (!hit) return null;
  return { lat: Number(hit.lat), lng: Number(hit.lon), matched: hit.display_name };
}

function slug(spot, index) {
  const base = `${spot.name} ${spot.area || ""}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${base}-${index}`;
}

const results = [];
const failures = [];

for (let i = 0; i < spots.length; i++) {
  const spot = spots[i];
  let geo = null;
  let via = "";
  try {
    if (spot.address) {
      geo = await census(spot.address);
      via = "census";
      await sleep(150);
    }
    if (!geo) {
      const q = spot.q || `${spot.name} ${spot.area} New York`;
      geo = await nominatim(q);
      via = "nominatim";
      await sleep(1100);
    }
  } catch (error) {
    failures.push({ name: spot.name, area: spot.area, error: String(error) });
    await sleep(1100);
  }

  if (!geo) {
    failures.push({ name: spot.name, area: spot.area, q: spot.q || spot.address });
    console.log(`MISS ${spot.name} (${spot.area})`);
    continue;
  }

  const { q, ...rest } = spot;
  results.push({
    id: slug(spot, i + 1),
    ...rest,
    lat: Math.round(geo.lat * 1e6) / 1e6,
    lng: Math.round(geo.lng * 1e6) / 1e6,
    matched: geo.matched,
    via,
  });
  console.log(`OK   ${spot.name} (${spot.area}) via ${via}`);
}

await mkdir(new URL("../data/", import.meta.url), { recursive: true });
await writeFile(new URL("../data/restaurants.json", import.meta.url), JSON.stringify({ results, failures }, null, 2));
console.log(`\n${results.length} placed, ${failures.length} missed`);
