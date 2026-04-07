// Point of Interest data for each city and drive route geometry
// Drive routes were fetched from Mapbox Directions API and baked in for zero runtime cost

export interface POI {
  id: string;
  cityId: string;
  name: string;
  emoji: string;
  lngLat: [number, number];
  funFact: string;
  color: string;
  // Rich content for landmark explorer
  imageUrl?: string; // Wikimedia Commons or public domain image
  youtubeId?: string; // YouTube video ID for kid-friendly video
  historyLesson: string; // Longer educational text for the explorer
  didYouKnow?: string; // Extra "did you know?" fact
  zoomLevel?: number; // Custom zoom for this POI (default: 16.5)
}

export interface DriveWaypoint {
  name: string;
  emoji: string;
  lngLat: [number, number];
  funFact: string;
}

export interface DriveRouteData {
  coordinates: [number, number][];
  interestPoints: DriveWaypoint[];
}

// ============================================================
// CITY POIs
// ============================================================

export const cityPOIs: Record<string, POI[]> = {
  tulsa: [
    {
      id: 'tulsa-center-universe',
      cityId: 'tulsa',
      name: 'Center of the Universe',
      emoji: '🔮',
      lngLat: [-95.9927, 36.1565],
      funFact: 'Stand in the magic circle and SHOUT — your voice echoes back super loud but people next to you hear nothing!',
      color: '#f97316',
      historyLesson: 'This is one of the weirdest places in America! It\'s a small concrete circle on a pedestrian bridge in downtown Tulsa. When you stand in the center and make ANY noise — talk, clap, stomp — your voice echoes back to you MUCH louder than you made it. But people standing just a few feet away hear almost nothing! Scientists think the surrounding walls bounce the sound waves back to the center like a mirror bounces light. But nobody is 100% sure why it works! It\'s free to visit and open all day and night.',
      didYouKnow: 'The circle is only about 8 feet wide — the size of a small trampoline! Step one foot outside and the magic stops.',
    },
    {
      id: 'tulsa-golden-driller',
      cityId: 'tulsa',
      name: 'Golden Driller',
      emoji: '🗽',
      lngLat: [-95.9214, 36.1289],
      funFact: 'This 76-foot golden statue has shoe size 393! He weighs 43,500 pounds!',
      color: '#f97316',
      historyLesson: 'The Golden Driller is the 7th tallest statue in all of America! He was built in 1952 to celebrate Tulsa\'s oil history. His right hand rests on a REAL oil derrick that was brought from a real oil field! He\'s 76 feet tall (as tall as 7 giraffes stacked up), weighs 43,500 pounds, and wears a hard hat size 112. His belt is 48 feet around — that\'s as long as a school bus! In 1979, Oklahoma made him the official state monument.',
      didYouKnow: 'His shoe size is 393DDD. That is NOT a real shoe size! Nobody makes shoes that big!',
    },
    {
      id: 'tulsa-blue-whale',
      cityId: 'tulsa',
      name: 'Blue Whale of Catoosa',
      emoji: '🐋',
      lngLat: [-95.7634, 36.2398],
      funFact: 'A man spent 2 years building this 80-foot whale out of cement as a surprise for his wife!',
      color: '#60a5fa',
      historyLesson: 'This giant blue whale was built by a man named Hugh Davis as a surprise anniversary gift for his wife Zelta in 1972! She loved collecting whale figurines, so he spent two years welding a frame and covering it with hand-mixed cement, one bucket at a time. The whale is 80 feet long and 20 feet tall! The mouth used to have a slide that shot kids into the swimming pond, and the tail had a diving platform. It\'s one of the most famous landmarks on all of Route 66!',
      didYouKnow: 'Hugh Davis was actually a zoologist (a scientist who studies animals)! He built the whale for their 34th wedding anniversary.',
    },
    {
      id: 'tulsa-gathering-place',
      cityId: 'tulsa',
      name: 'Gathering Place',
      emoji: '🎢',
      lngLat: [-95.9767, 36.1348],
      funFact: 'The coolest FREE playground ever! 46-foot towers, an elephant slide, and sky bridges!',
      color: '#4ade80',
      historyLesson: 'The Gathering Place cost 465 MILLION dollars to build — the largest private gift to a community park in all of American history! It opened in 2018 and expected 1 million visitors per year... but 3 million people came in the FIRST year! The playground has towers 46 feet tall, a giant elephant with a slide in its trunk, net climbing structures 20 feet in the air, a fairy forest for little kids, water play areas, and a 60-foot suspension bridge. TIME Magazine named it one of the World\'s 100 Greatest Places!',
      didYouKnow: 'The park is 66.5 acres — that\'s as big as 50 football fields! And everything is completely FREE!',
    },
    {
      id: 'tulsa-route66',
      cityId: 'tulsa',
      name: 'Route 66 Sign',
      emoji: '🛣️',
      lngLat: [-95.9846, 36.1493],
      funFact: 'Route 66 goes right through Tulsa! Sally from Cars is based on a real Oklahoma lady!',
      color: '#eab308',
      historyLesson: 'Route 66 is called "The Mother Road" and it\'s the most famous road in America! It was created in 1926 and goes from Chicago, Illinois all the way to Los Angeles, California — that\'s 2,448 miles! Route 66 runs 26 miles through Tulsa with special historical markers you can find. The coolest part? The character Sally in the Pixar movie Cars was inspired by a REAL woman named Dawn Welch who runs the Rock Cafe on Route 66 in Stroud, Oklahoma! There\'s also a giant 66-foot neon soda bottle sign nearby (66 feet for Route 66!).',
      didYouKnow: 'Near the old Route 66 bridge in Tulsa, there are replica neon signs from old 1950s motels that light up at night. It looks like going back in time!',
    },
  ],
  lincoln: [
    {
      id: 'lincoln-capitol',
      cityId: 'lincoln',
      name: 'State Capitol & The Sower',
      emoji: '🏛️',
      lngLat: [-96.6997, 40.8088],
      funFact: 'The 400-foot tower has a golden farmer on top who weighs as much as 2 elephants!',
      color: '#eab308',
      historyLesson: 'Nebraska\'s State Capitol was the FIRST state capitol in America to have a tower! The architect said "Nebraska is flat, so its capitol should have altitude!" The tower is 400 feet tall and you can see it from 20 miles away on the flat plains. On top sits "The Sower," a bronze statue of a barefoot man scattering seeds. He\'s 19.5 feet tall and weighs 9.5 tons (that\'s as heavy as 2 elephants!). He also works as the building\'s LIGHTNING ROD! The dome below him is covered in gold tiles. You can ride an elevator up to the 14th floor and look out over the whole city!',
      didYouKnow: 'When The Sower was raised to the top on April 24, 1930, thousands of people gathered to watch. The building took 10 years to build and cost $9.8 million (that would be about $180 million today!).',
    },
    {
      id: 'lincoln-stadium',
      cityId: 'lincoln',
      name: 'Memorial Stadium',
      emoji: '🏈',
      lngLat: [-96.7032, 40.8206],
      funFact: 'Every game sold out since 1962 — over 400 in a row! World record!',
      color: '#dc2626',
      historyLesson: 'Memorial Stadium holds 85,458 people and has been sold out for EVERY SINGLE GAME since 1962 — that\'s over 400 games in a row, an NCAA record! On game days, it becomes the 3rd largest "city" in all of Nebraska! But here\'s the wildest thing: on August 30, 2023, 92,003 people packed this FOOTBALL stadium to watch... VOLLEYBALL! They put a volleyball court in the middle and it set the WORLD RECORD for the largest attendance at a women\'s sporting event EVER! The stadium opened in 1923 — it\'s over 100 years old!',
      didYouKnow: 'The original stadium only held 31,080 people and cost $482,939 to build in 1923. Kids\' tickets for Volleyball Day were only $5!',
    },
    {
      id: 'lincoln-morrill',
      cityId: 'lincoln',
      name: 'Morrill Hall (Archie!)',
      emoji: '🦣',
      lngLat: [-96.7004, 40.8141],
      funFact: 'Archie the mammoth is 14 feet tall — discovered by CHICKENS!',
      color: '#92400e',
      historyLesson: 'Morrill Hall has one of the most amazing fossil collections in America — over 1 MILLION fossils! The star is "Archie," the world\'s largest fully mounted Columbian mammoth skeleton. Archie is 14 feet tall — taller than any ceiling in your house! Here\'s the funny part: in 1921, CHICKENS pecking at the ground on a ranch uncovered his bones! The museum has a whole "Elephant Hall" showing how elephants changed over millions of years. There\'s also a life-size mammoth sculpture named Fred outside the entrance!',
      didYouKnow: 'Columbian mammoths lived in North America during the Ice Age and went extinct about 11,000 years ago. They were even BIGGER than woolly mammoths!',
    },
    {
      id: 'lincoln-haymarket',
      cityId: 'lincoln',
      name: 'Haymarket District',
      emoji: '🍦',
      lngLat: [-96.7143, 40.8169],
      funFact: 'Old brick streets with ice cream shops and neon-lit alleys! Dad\'s hotel is right here!',
      color: '#f97316',
      historyLesson: 'The Haymarket is Lincoln\'s coolest neighborhood — it used to be an old warehouse district with brick streets! Now it has ice cream shops like Ivanna Cone and 402 Creamery, a Saturday farmers market with live music, and Gallery Alley that lights up with neon at night. The Lincoln Saltdogs (named after the salty ground Lincoln was built on!) play baseball at Haymarket Park right here. Dad\'s hotel, the Hyatt Place, is right in the middle of it all!',
      didYouKnow: 'The Saltdogs set a record of 8,325 fans at one game! Their mascot is a salt-covered hot dog!',
    },
    {
      id: 'lincoln-sunken-gardens',
      cityId: 'lincoln',
      name: 'Sunken Gardens',
      emoji: '🌸',
      lngLat: [-96.6701, 40.8247],
      funFact: 'This used to be a garbage dump! Now it has 30,000 flowers!',
      color: '#ec4899',
      historyLesson: 'Here\'s an amazing transformation: this beautiful garden used to be a GARBAGE DUMP! During the Great Depression in 1930, when lots of people didn\'t have jobs, the city hired unemployed workers to turn the dump into a garden. They were paid just $6.40 per WEEK! They built stone walls, waterfalls, and fountains. Today it has over 30,000 different flowers and is the ONLY Nebraska garden listed in National Geographic\'s "300 Best Gardens to Visit." And the best part? It\'s completely FREE!',
      didYouKnow: 'The workers who built it originally called it the "Rock Garden." In 2003, the city spent $1.7 million to fix it up and make it even more beautiful!',
    },
  ],
  roca: [
    {
      id: 'roca-berry-farm',
      cityId: 'roca',
      name: 'Roca Berry Farm',
      emoji: '🎃',
      lngLat: [-96.6570, 40.6380],
      funFact: 'Goats, bunnies, zip lines, and a giant pillow you can JUMP on!',
      color: '#f97316',
      historyLesson: 'Roca Berry Farm is the oldest and largest pumpkin patch in all of Lancaster County! The Schaefer family has been running it since 1980. It has a giant pumpkin patch, hay rack rides, a petting zoo with goats, pigs, a cow, and bunnies, zip lines, a jumping pillow (like a giant bouncy house on the ground!), balloon animals, and 9 different fun barns to explore. In the fall, they have a corn maze too!',
      didYouKnow: 'Roca is so tiny (201 people!) that the berry farm might be the most famous thing in town!',
    },
    {
      id: 'roca-warehouse',
      cityId: 'roca',
      name: 'Rare Goods Warehouse',
      emoji: '📦',
      lngLat: [-96.6653, 40.6481],
      funFact: 'Dad is packing 180 boxes! 379 customers total!',
      color: '#a855f7',
      historyLesson: 'This is where the Rare Goods magic happens! Dad and his business partner are here packing boxes full of special items. There are 180 boxes to ship to people\'s homes AND about 200 people are driving here in person to pick up their orders. That\'s 379 customers total! The warehouse is in tiny Roca, Nebraska where only 201 people live. Imagine — more customers are coming to this warehouse than there are people in the whole town!',
      didYouKnow: 'The biggest day is Friday April 17 — they\'ll be packing and handing out boxes for TEN HOURS straight from 10am to 8pm!',
    },
  ],
  omaha: [
    {
      id: 'omaha-zoo',
      cityId: 'omaha',
      name: 'Henry Doorly Zoo',
      emoji: '🦁',
      lngLat: [-95.9285, 41.2260],
      funFact: 'The BEST ZOO in the world with a desert dome, shark tunnel, and indoor jungle!',
      color: '#4ade80',
      historyLesson: 'TripAdvisor ranked this the #1 BEST ZOO in the whole world! It covers 160 acres with 17,000 animals. The Desert Dome is the world\'s largest glazed geodesic dome — 230 feet wide and 137 feet tall — with THREE real deserts recreated inside! Below it is the Kingdoms of the Night, the world\'s largest nocturnal exhibit where it\'s always dark so you can see animals that only come out at night. The Lied Jungle is an indoor rainforest 80 feet tall with a 50-foot waterfall. And the aquarium has a 70-foot shark tunnel — sharks, stingrays, and sea turtles swim RIGHT OVER YOUR HEAD!',
      didYouKnow: 'The zoo also has king, gentoo, and rockhopper PENGUINS in a snowy Antarctic habitat. And you can watch caterpillars turn into butterflies in the Chrysalis Hatching Room!',
      zoomLevel: 15,
    },
    {
      id: 'omaha-bridge',
      cityId: 'omaha',
      name: 'Bob Kerrey Bridge',
      emoji: '🌉',
      lngLat: [-95.9225, 41.2586],
      funFact: 'Stand in TWO STATES at the same time! One foot in Nebraska, one in Iowa!',
      color: '#60a5fa',
      historyLesson: 'This amazing bridge is 3,000 feet long — that\'s more than half a mile! It crosses the Missouri River and connects Nebraska to Iowa. The coolest thing? There\'s a state line marker on the bridge where you can put one foot in Nebraska and one foot in Iowa at the SAME TIME! The two towers reach 200 feet into the sky. The bridge even has its own social media personality called "Bob the Bridge" — it posts funny videos and tweets! In 2025, a little expansion bridge opened called "Baby Bob"!',
      didYouKnow: 'The Missouri River below is the LONGEST river in the entire United States at 2,341 miles! It starts in Montana and joins the Mississippi River in Missouri.',
    },
    {
      id: 'omaha-durham',
      cityId: 'omaha',
      name: 'Durham Museum',
      emoji: '🚂',
      lngLat: [-95.9370, 41.2522],
      funFact: 'A museum inside a REAL 1930s train station! It has an old-time soda fountain!',
      color: '#eab308',
      historyLesson: 'This museum is inside Omaha\'s Union Station, a gorgeous building that opened in 1931. At its busiest, 10,000 passengers caught trains here EVERY DAY and 64 trains passed through! The Great Hall is 160 feet long with a 60-foot ceiling covered in gold and silver. You can walk through REAL restored train cars and see what 1940s storefronts looked like. The best part for kids? There\'s an authentic old-fashioned soda fountain where you can sit at the counter and get a phosphate or malt — just like in an old movie!',
      didYouKnow: 'The last passenger train left Union Station in 1971. But the building was so beautiful they turned it into a museum instead of tearing it down!',
    },
    {
      id: 'omaha-old-market',
      cityId: 'omaha',
      name: 'Old Market',
      emoji: '🍬',
      lngLat: [-95.9312, 41.2558],
      funFact: 'Cobblestone streets with a vintage candy store and horse-drawn carriages!',
      color: '#f97316',
      historyLesson: 'The Old Market is Omaha\'s historic neighborhood with real cobblestone streets and old brick buildings. It has Hollywood Candy — a huge vintage candy store kids LOVE — Ted & Wally\'s famous scratch-made ice cream, horse-drawn carriage rides, street performers, and a hidden indoor alley called the Old Market Passageway full of tiny shops. There\'s even a year-round Christmas shop called Tannenbaum!',
      didYouKnow: 'There\'s a Garden of the Zodiac where kids can find their zodiac sign hidden in the decorations!',
    },
    {
      id: 'omaha-bigboy',
      cityId: 'omaha',
      name: 'Big Boy Train',
      emoji: '🚂',
      lngLat: [-95.9214, 41.2410],
      funFact: 'The BIGGEST steam train in the world — heavier than 100 elephants!',
      color: '#6b7280',
      historyLesson: 'At Kenefick Park, you can see Big Boy No. 4023 — the LARGEST steam locomotive in the world! It weighs 1.2 MILLION pounds (that\'s 600 tons — heavier than 100 elephants!). Next to it is the Centennial No. 6900, the largest and most powerful diesel-electric locomotive ever built. These massive machines helped connect America by carrying people and goods across the country. The Union Pacific Railroad started right here in Omaha in 1863, building the first railroad all the way across America!',
      didYouKnow: 'You can see Big Boy from the highway — it sits on a bluff above I-80. It\'s completely FREE to visit and walk around!',
    },
  ],
};

export function getPOIsForCity(cityId: string): POI[] {
  return cityPOIs[cityId] || [];
}

// ============================================================
// DRIVE ROUTE GEOMETRY (baked from Mapbox Directions API)
// ============================================================

// Tulsa → Lincoln via I-35 → Wichita → I-135 → Salina → US-81 (~350 miles)
const TULSA_LINCOLN_COORDS: [number, number][] = [
  [-95.992813,36.154023],[-95.995649,36.154088],[-96.000532,36.15181],[-96.00129,36.153541],[-96.000859,36.158567],[-96.005258,36.157008],[-96.010869,36.15578],[-96.017441,36.157007],[-96.025235,36.156665],[-96.038058,36.158709],[-96.052725,36.158537],[-96.058319,36.156194],[-96.066034,36.151876],[-96.075223,36.145629],[-96.101601,36.1382],[-96.117799,36.136967],[-96.131148,36.141711],[-96.145539,36.143311],[-96.167046,36.154009],[-96.212732,36.152138],[-96.239582,36.153159],[-96.251216,36.163644],[-96.285535,36.204354],[-96.295555,36.213871],[-96.309643,36.21632],[-96.38173,36.21686],[-96.406443,36.218845],[-96.434935,36.220071],[-96.559678,36.219749],[-96.573768,36.221532],[-96.596753,36.225252],[-96.695463,36.225051],[-96.765949,36.224853],[-96.796921,36.225478],[-96.849033,36.225178],[-96.888972,36.224901],[-96.905921,36.22784],[-96.925721,36.237614],[-96.945612,36.240502],[-96.960713,36.246296],[-96.969453,36.254514],[-96.983861,36.290016],[-96.993742,36.314888],[-97.015631,36.33381],[-97.029114,36.349952],[-97.039085,36.372663],[-97.052175,36.381346],[-97.067376,36.383664],[-97.082232,36.385374],[-97.111102,36.392171],[-97.211658,36.394116],[-97.244118,36.400576],[-97.261108,36.402394],[-97.278868,36.399093],[-97.312651,36.400061],[-97.326107,36.401841],[-97.326874,36.434242],[-97.327419,36.484422],[-97.3363,36.506828],[-97.338921,36.523647],[-97.344313,36.535804],[-97.345487,36.589579],[-97.345684,36.618395],[-97.345732,36.695559],[-97.345799,36.756029],[-97.342851,36.806342],[-97.342347,36.817318],[-97.34516,36.85667],[-97.353303,36.891609],[-97.349987,36.922308],[-97.34586,36.943756],[-97.345487,36.983565],[-97.340141,37.006798],[-97.338101,37.028079],[-97.338419,37.080394],[-97.339362,37.159508],[-97.340178,37.197635],[-97.338586,37.233522],[-97.338734,37.245983],[-97.340146,37.275942],[-97.340369,37.309804],[-97.338968,37.324967],[-97.323141,37.342963],[-97.321584,37.362839],[-97.322947,37.374472],[-97.324529,37.403444],[-97.32107,37.422329],[-97.322693,37.471761],[-97.323814,37.506195],[-97.32431,37.537213],[-97.325746,37.559462],[-97.325457,37.582463],[-97.323944,37.597376],[-97.323532,37.603371],[-97.327115,37.613191],[-97.327713,37.624223],[-97.317578,37.628552],[-97.307877,37.638059],[-97.310045,37.650054],[-97.312207,37.665202],[-97.312347,37.678861],[-97.312987,37.687673],[-97.316534,37.689943],[-97.330379,37.689727],[-97.326437,37.690743],[-97.316647,37.693497],[-97.317448,37.700934],[-97.321663,37.716973],[-97.31772,37.725244],[-97.317487,37.736525],[-97.31887,37.744825],[-97.32095,37.762665],[-97.32477,37.771272],[-97.325443,37.784426],[-97.328326,37.794984],[-97.326368,37.808861],[-97.326917,37.833006],[-97.326295,37.849254],[-97.326418,37.882665],[-97.326581,37.913107],[-97.327698,37.952018],[-97.32793,37.992332],[-97.327812,38.025075],[-97.323487,38.036412],[-97.322464,38.060368],[-97.327355,38.072351],[-97.34096,38.082431],[-97.369692,38.10018],[-97.403047,38.132842],[-97.420825,38.147721],[-97.439268,38.167972],[-97.461058,38.183417],[-97.486762,38.202622],[-97.517336,38.22953],[-97.531907,38.242539],[-97.566423,38.270926],[-97.611959,38.310272],[-97.620465,38.320351],[-97.621206,38.33997],[-97.620493,38.373742],[-97.62064,38.418124],[-97.620784,38.469291],[-97.61921,38.48268],[-97.619434,38.496897],[-97.619703,38.510586],[-97.620516,38.532695],[-97.621038,38.566333],[-97.621334,38.632195],[-97.621755,38.710503],[-97.618751,38.728699],[-97.617937,38.754606],[-97.616816,38.778577],[-97.617575,38.796716],[-97.630539,38.810076],[-97.639649,38.827233],[-97.644153,38.841707],[-97.626528,38.841648],[-97.612453,38.839719],[-97.612448,38.848871],[-97.612457,38.861775],[-97.612188,38.87611],[-97.642626,38.875399],[-97.64531,38.893685],[-97.643081,38.928822],[-97.640768,38.964582],[-97.641898,39.019113],[-97.645404,39.03648],[-97.6499,39.065483],[-97.65073,39.09875],[-97.663783,39.114312],[-97.668308,39.120519],[-97.668636,39.132178],[-97.667695,39.197922],[-97.667121,39.307157],[-97.665829,39.35667],[-97.666384,39.373953],[-97.666483,39.485909],[-97.657101,39.504351],[-97.657399,39.53932],[-97.657422,39.561513],[-97.657471,39.571583],[-97.659911,39.609766],[-97.660098,39.688344],[-97.660338,39.728447],[-97.652443,39.745566],[-97.65199,39.787495],[-97.645951,39.812647],[-97.638223,39.826359],[-97.627035,39.850512],[-97.614226,39.866073],[-97.613939,39.944399],[-97.612504,39.996288],[-97.610232,40.012538],[-97.61419,40.021752],[-97.613918,40.091938],[-97.613902,40.104964],[-97.60786,40.12618],[-97.602033,40.136169],[-97.588398,40.139328],[-97.571689,40.143016],[-97.570696,40.164021],[-97.574388,40.179386],[-97.576591,40.228174],[-97.576579,40.26351],[-97.57671,40.340155],[-97.577239,40.386814],[-97.579956,40.409159],[-97.591048,40.411645],[-97.596087,40.427963],[-97.595242,40.49918],[-97.591657,40.513155],[-97.584185,40.522961],[-97.586645,40.535698],[-97.58836,40.550311],[-97.595347,40.562878],[-97.595652,40.63344],[-97.59584,40.699794],[-97.596299,40.723896],[-97.604559,40.739262],[-97.603603,40.746516],[-97.597413,40.754887],[-97.597528,40.817241],[-97.576943,40.821821],[-97.498986,40.821824],[-97.442104,40.821744],[-97.387865,40.821224],[-97.337843,40.821416],[-97.283614,40.82202],[-97.216492,40.822326],[-97.13606,40.822142],[-97.100436,40.822011],[-97.065911,40.821904],[-97.039529,40.821045],[-97.008807,40.820855],[-96.964533,40.821258],[-96.925014,40.820965],[-96.862292,40.820862],[-96.824665,40.821555],[-96.785508,40.817166],[-96.759479,40.816243],[-96.755813,40.81502],[-96.753672,40.810586],[-96.747596,40.803313],[-96.745297,40.802567],[-96.742905,40.803621],[-96.741142,40.803867],[-96.731799,40.805107],[-96.713527,40.808941],[-96.706298,40.8092],[-96.702667,40.809197],[-96.696784,40.809185],[-96.693872,40.811912],[-96.69084,40.813565],[-96.685182,40.813548],[-96.685183,40.8136],
];

// Lincoln → Roca via US-77 south (~7 miles)
const LINCOLN_ROCA_COORDS: [number, number][] = [
  [-96.685183,40.8136],[-96.686948,40.813556],[-96.690827,40.813565],[-96.693655,40.813642],[-96.694127,40.812345],[-96.695326,40.81027],[-96.697515,40.810278],[-96.699853,40.810283],[-96.703104,40.810307],[-96.706404,40.810319],[-96.708876,40.81032],[-96.710419,40.810021],[-96.713764,40.808949],[-96.716549,40.80742],[-96.730232,40.805446],[-96.737525,40.80396],[-96.74064,40.803927],[-96.74175,40.804007],[-96.743013,40.803682],[-96.743761,40.803293],[-96.744403,40.802784],[-96.744401,40.802323],[-96.743912,40.802035],[-96.739851,40.800569],[-96.738498,40.798949],[-96.738092,40.794797],[-96.737012,40.792049],[-96.734746,40.790227],[-96.729128,40.786648],[-96.727921,40.785294],[-96.727327,40.783608],[-96.727354,40.77246],[-96.727011,40.765997],[-96.725341,40.761971],[-96.72231,40.756452],[-96.721467,40.749854],[-96.720429,40.746334],[-96.71733,40.739737],[-96.712307,40.728177],[-96.706398,40.703909],[-96.705856,40.700494],[-96.705689,40.69442],[-96.705215,40.690267],[-96.705074,40.683648],[-96.705485,40.661187],[-96.705941,40.656725],[-96.689257,40.653919],[-96.686254,40.655375],[-96.675563,40.658476],[-96.667755,40.65833],[-96.663754,40.656286],[-96.667122,40.655552],[-96.667455,40.650162],[-96.667091,40.647942],
];

// Roca → Omaha via US-77/I-80 (~60 miles)
const ROCA_OMAHA_COORDS: [number, number][] = [
  [-96.667091,40.647942],[-96.667122,40.655552],[-96.664937,40.657655],[-96.683251,40.657948],[-96.703056,40.654155],[-96.704812,40.685037],[-96.703857,40.691506],[-96.704906,40.695224],[-96.706141,40.70425],[-96.715359,40.736274],[-96.718279,40.743455],[-96.721186,40.749499],[-96.723639,40.75971],[-96.727108,40.770137],[-96.727413,40.784772],[-96.731323,40.788307],[-96.737586,40.793408],[-96.738638,40.799626],[-96.744425,40.802763],[-96.748114,40.803951],[-96.749941,40.805351],[-96.754761,40.813367],[-96.755273,40.816323],[-96.744639,40.833192],[-96.730096,40.848468],[-96.716642,40.861532],[-96.701083,40.870461],[-96.686615,40.882623],[-96.676712,40.889533],[-96.663261,40.896573],[-96.609973,40.896726],[-96.574875,40.897396],[-96.56442,40.894359],[-96.558513,40.893836],[-96.533283,40.901729],[-96.491505,40.909179],[-96.446067,40.929277],[-96.413289,40.954314],[-96.382206,40.975552],[-96.362543,40.989464],[-96.315556,41.0051],[-96.300786,41.022416],[-96.291325,41.035672],[-96.296299,41.055669],[-96.285308,41.071624],[-96.273684,41.083885],[-96.255353,41.093445],[-96.235868,41.103113],[-96.217525,41.116041],[-96.205556,41.121968],[-96.172206,41.134167],[-96.163292,41.141474],[-96.152776,41.152841],[-96.134525,41.164552],[-96.117257,41.179298],[-96.109056,41.185024],[-96.098324,41.192477],[-96.095899,41.195552],[-96.094105,41.204626],[-96.092162,41.210418],[-96.090702,41.213893],[-96.091187,41.219736],[-96.089605,41.222657],[-96.081755,41.223869],[-96.068297,41.222188],[-96.049681,41.222587],[-96.044833,41.223759],[-96.030265,41.223749],[-96.006985,41.223617],[-95.998525,41.223172],[-95.985276,41.222477],[-95.980428,41.223253],[-95.972157,41.225067],[-95.959048,41.226823],[-95.955631,41.228523],[-95.954895,41.230239],[-95.953899,41.235558],[-95.953511,41.245405],[-95.95347,41.254962],[-95.947649,41.256629],[-95.940838,41.256568],[-95.934539,41.256534],
];

// ============================================================
// DRIVE INTEREST POINTS (fun stops along Tulsa → Lincoln)
// ============================================================

const TULSA_LINCOLN_INTEREST: DriveWaypoint[] = [
  {
    name: 'Flint Hills',
    emoji: '🌾',
    lngLat: [-96.55, 38.35],
    funFact: 'This is the last tallgrass prairie on Earth! The grass grows 10 FEET tall with roots 15 feet deep! In April, ranchers set it on fire to help new grass grow!',
  },
  {
    name: 'Cassoday, KS',
    emoji: '🐔',
    lngLat: [-96.63, 38.04],
    funFact: 'The Prairie Chicken Capital of the World! Only 113 people live here but birds do a funny stomping dance with orange neck balloons!',
  },
  {
    name: 'Wichita',
    emoji: '✈️',
    lngLat: [-97.3301, 37.6872],
    funFact: 'The Air Capital of the World! They built 1,644 bomber planes here during World War II! It\'s the biggest city in Kansas!',
  },
  {
    name: 'Gas, Kansas',
    emoji: '⛽',
    lngLat: [-95.35, 37.92],
    funFact: 'The town motto is "Don\'t Pass Gas, Stop and Enjoy It!" It was named after a natural gas discovery in 1898!',
  },
];

export const driveRoutes: Record<string, DriveRouteData> = {
  'tulsa-lincoln': {
    coordinates: TULSA_LINCOLN_COORDS,
    interestPoints: TULSA_LINCOLN_INTEREST,
  },
  'lincoln-roca': {
    coordinates: LINCOLN_ROCA_COORDS,
    interestPoints: [],
  },
  'roca-omaha': {
    coordinates: ROCA_OMAHA_COORDS,
    interestPoints: [],
  },
};

// Tulsa Airport (TUL) to Holiday Inn Express Downtown
const TUL_AIRPORT_TO_HOTEL: [number, number][] = [
  [-95.887796,36.199424],[-95.890987,36.199613],[-95.893119,36.199685],[-95.894619,36.201131],[-95.89505,36.201889],[-95.894714,36.207557],[-95.895681,36.208468],[-95.898894,36.208112],[-95.904628,36.207186],[-95.904633,36.20455],[-95.904633,36.202015],[-95.904621,36.195499],[-95.904612,36.191835],[-95.90453,36.188007],[-95.90087,36.187405],[-95.893764,36.186872],[-95.891397,36.185181],[-95.889336,36.182652],[-95.8873,36.179538],[-95.886788,36.177249],[-95.886778,36.172644],[-95.886785,36.165718],[-95.886787,36.160927],[-95.886772,36.157679],[-95.886764,36.153684],[-95.886729,36.146537],[-95.886712,36.142116],[-95.888926,36.140711],[-95.8881,36.141584],
];

// Real airport coordinates
export const AIRPORTS: Record<string, { name: string; lngLat: [number, number] }> = {
  pdx: { name: 'Portland International Airport', lngLat: [-122.5975, 45.5886] },
  sea: { name: 'Seattle-Tacoma International Airport', lngLat: [-122.3088, 47.4502] },
  tul: { name: 'Tulsa International Airport', lngLat: [-95.8881, 36.1983] },
  oma: { name: 'Eppley Airfield', lngLat: [-95.8940, 41.3032] },
};

export function getDriveRoute(from: string, to: string): DriveRouteData | null {
  return driveRoutes[`${from}-${to}`] || null;
}

export function getAirportToHotelRoute(cityId: string): [number, number][] | null {
  if (cityId === 'tulsa') return TUL_AIRPORT_TO_HOTEL;
  return null;
}
