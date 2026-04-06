export interface FunFact {
  text: string;
  forKids: string; // Simplified version for voice narration
}

export interface HistoryFact {
  text: string;
  forKids: string;
  year?: string; // Optional year/era for display
  emoji: string; // Visual icon for the fact
}

export interface CityData {
  id: string;
  name: string;
  emoji: string;
  color: string;
  coordinates: { x: number; y: number }; // Percentage position on map (legacy)
  lngLat: { lng: number; lat: number }; // Real coordinates
  facts: FunFact[];
  historyFacts: HistoryFact[];
  landmarkImage?: string;
}

export const cityData: CityData[] = [
  {
    id: 'vancouver',
    name: 'Vancouver',
    emoji: '🏠',
    color: '#4ade80',
    coordinates: { x: 8, y: 25 },
    lngLat: { lng: -122.6587, lat: 45.6387 },
    facts: [
      {
        text: "This is where we live! Dad is starting his big adventure!",
        forKids: "This is home! Dad is starting his big adventure from here!"
      },
      {
        text: "We live in Vancouver, Washington - right across the Columbia River from Portland!",
        forKids: "We live in Vancouver, Washington! There's a huge river called the Columbia right by our house!"
      },
      {
        text: "Dad drives over the big bridge to get to the airport in Portland!",
        forKids: "Dad has to cross a big bridge over the Columbia River to get to the airport!"
      },
      {
        text: "You can see Mount Hood, Mount St. Helens, and Mount Adams from Vancouver!",
        forKids: "You can see THREE big snowy mountains from our town! Mount Hood, Mount St. Helens, and Mount Adams!"
      }
    ],
    historyFacts: [
      {
        text: "Vancouver was founded in 1825 as a fur trading post - it's actually older than Portland!",
        forKids: "Our city is really old! Vancouver was here before Portland was even born! People came here to trade fluffy beaver furs!",
        year: "1825",
        emoji: "🦫"
      },
      {
        text: "Lewis and Clark camped near here in 1805 on their famous journey to the Pacific Ocean!",
        forKids: "Two famous explorers named Lewis and Clark stopped right near our town on their big adventure to find the ocean!",
        year: "1805",
        emoji: "🗺️"
      },
      {
        text: "The Columbia River was a superhighway for Native Americans who fished salmon here for thousands of years!",
        forKids: "Native Americans lived here for thousands of years! They caught big salmon fish from the Columbia River! It was like their highway!",
        year: "Ancient",
        emoji: "🐟"
      },
      {
        text: "Fort Vancouver was one of the most important trading posts in the whole Pacific Northwest!",
        forKids: "A long time ago, there was a big fort right here where people from all over came to trade and get supplies!",
        year: "1825",
        emoji: "🏗️"
      }
    ]
  },
  {
    id: 'seattle',
    name: 'Seattle',
    emoji: '☕',
    color: '#60a5fa',
    coordinates: { x: 10, y: 18 },
    lngLat: { lng: -122.3321, lat: 47.6062 },
    facts: [
      {
        text: "Dad's plane is stopping here for a little break before flying to Tulsa!",
        forKids: "Dad's plane is stopping here for a little break before flying way far away!"
      },
      {
        text: "Seattle has a tower that looks like a spaceship! It's called the Space Needle and it's 605 feet tall!",
        forKids: "Seattle has a tower that looks like a spaceship! It's called the Space Needle! It's as tall as two hundred kids standing on each other's shoulders!"
      },
      {
        text: "This is where the very first Starbucks was! It opened in 1971!",
        forKids: "This is where the very first coffee shop called Starbucks was made! Mommy and Daddy's coffee came from here!"
      },
      {
        text: "At Pike Place Market, fish sellers THROW huge fish through the air to each other!",
        forKids: "There's a market in Seattle where people THROW big fish through the air! Whoosh! Splat! The fish fly!"
      }
    ],
    historyFacts: [
      {
        text: "Seattle is named after Chief Si'ahl, a leader of the Duwamish and Suquamish peoples!",
        forKids: "Seattle got its name from a really important Native American leader named Chief Sealth! The city was named to honor him!",
        year: "1853",
        emoji: "👤"
      },
      {
        text: "A big fire in 1889 burned down 25 blocks of the city, so they rebuilt it on TOP of the old one! You can still tour the underground city!",
        forKids: "A big fire burned the whole city! They built a brand new city ON TOP of the old one! There's still a secret city underground!",
        year: "1889",
        emoji: "🔥"
      },
      {
        text: "During the Gold Rush in 1897, Seattle was where people bought supplies before heading to Alaska to dig for gold!",
        forKids: "People used to come to Seattle to buy shovels and food before going to Alaska to dig for gold! They wanted to get rich!",
        year: "1897",
        emoji: "⛏️"
      }
    ]
  },
  {
    id: 'tulsa',
    name: 'Tulsa',
    emoji: '🤠',
    color: '#f97316',
    coordinates: { x: 55, y: 58 },
    lngLat: { lng: -95.9928, lat: 36.1540 },
    facts: [
      {
        text: "There's a magic circle downtown called the Center of the Universe where you can SHOUT and only YOU hear the echo! People right next to you hear nothing!",
        forKids: "There's a magic circle near Dad's hotel! If you stand in it and yell, your voice bounces back SUPER LOUD! But people next to you can't hear it! Nobody knows why!"
      },
      {
        text: "The Golden Driller statue is 76 feet tall with shoe size 393! That's as tall as 7 giraffes!",
        forKids: "Tulsa has a giant golden man statue! He's as tall as seven giraffes! And his shoes are size three hundred and ninety-three! Those are NOT real shoe sizes!"
      },
      {
        text: "A man built an 80-foot blue whale out of cement as a surprise anniversary gift for his wife!",
        forKids: "A man built a GIANT blue whale out of cement for his wife's birthday! It's eighty feet long and kids used to slide down it into a pond!"
      },
      {
        text: "Oklahoma has a lizard called a Mountain Boomer that runs on its BACK LEGS like a tiny dinosaur!",
        forKids: "Oklahoma has a lizard that runs on two legs like a tiny dinosaur! It's called a Mountain Boomer and it can go super fast!"
      },
      {
        text: "Oklahoma says a watermelon is a vegetable! It's the official state vegetable. But it's TOTALLY a fruit!",
        forKids: "Oklahoma made a SILLY law! They said a watermelon is a vegetable! But everybody knows watermelons are fruit! Silly Oklahoma!"
      },
      {
        text: "The Gathering Place playground in Tulsa has towers 46 feet tall, an elephant you can slide through, and pathways floating 20 feet in the air! And it's FREE!",
        forKids: "Tulsa has the COOLEST playground EVER! It has super tall towers, a giant elephant you slide through, and bridges way up in the sky! And it's totally free!"
      },
      {
        text: "Armadillos in Oklahoma always have four identical babies! Every time! And when they get scared, they JUMP 4 feet straight up in the air!",
        forKids: "Oklahoma has animals called armadillos with hard shells! They ALWAYS have four twin babies! And when they're scared, they JUMP super high like a bouncy ball!"
      }
    ],
    historyFacts: [
      {
        text: "Route 66, 'The Mother Road,' ran from Chicago to Los Angeles right through Tulsa! The character Sally in the Pixar movie Cars was based on a real lady who runs a restaurant on Route 66 in Oklahoma!",
        forKids: "The most famous road EVER goes through Tulsa! It's called Route 66! And you know Sally from the Cars movie? She was based on a REAL lady at a restaurant on this road!",
        year: "1926",
        emoji: "🛣️"
      },
      {
        text: "People found oil underground in Tulsa in 1901 and it made the city super rich! They called it the 'Oil Capital of the World!' The Golden Driller's hand rests on a REAL oil tower!",
        forKids: "People found black treasure under the ground in Tulsa! It's called oil and it made the city super duper rich! The giant golden statue man has his hand on a REAL oil tower!",
        year: "1901",
        emoji: "🛢️"
      },
      {
        text: "Tulsa's Greenwood District was once the wealthiest Black community in America, called 'Black Wall Street' - it had its own shops, movie theaters, restaurants, and hospital!",
        forKids: "There was a really special neighborhood in Tulsa called Greenwood! Black families built amazing shops, theaters, and schools there! It was one of the most successful communities ever!",
        year: "1920s",
        emoji: "🏘️"
      },
      {
        text: "Someone in Oklahoma invented the shopping cart in 1937 by putting wheels on a folding chair! And the parking meter was invented here too!",
        forKids: "Guess what was invented in Oklahoma? The SHOPPING CART! A man put wheels on a chair so people could carry more stuff! And the parking meter too!",
        year: "1937",
        emoji: "🛒"
      },
      {
        text: "Oklahoma had the widest tornado ever recorded on Earth - 2.6 miles across! And the fastest wind ever measured - 321 miles per hour!",
        forKids: "Oklahoma had the BIGGEST tornado EVER! It was as wide as a whole town! And the wind went three hundred miles per hour! That's faster than a race car!",
        year: "2013",
        emoji: "🌪️"
      }
    ]
  },
  {
    id: 'lincoln',
    name: 'Lincoln',
    emoji: '🌽',
    color: '#eab308',
    coordinates: { x: 52, y: 38 },
    lngLat: { lng: -96.6852, lat: 40.8136 },
    facts: [
      {
        text: "Nebraska has MORE than 3 COWS for every 1 person! Over 6 million cows! Moo!",
        forKids: "Nebraska has THREE cows for every person! There are six million cows! Moo moo moo moo moo moo! That's a LOT of moos!"
      },
      {
        text: "The State Capitol has a 400-foot tower with a 9.5-ton bronze man on top called The Sower throwing seeds! You can see it from 20 miles away!",
        forKids: "There's a super tall building with a golden farmer on top! He's throwing seeds and he weighs as much as TWO elephants! You can see him from twenty miles away!"
      },
      {
        text: "The football stadium has sold out EVERY game since 1962 - that's over 400 games in a row! On game day it becomes the 3rd biggest city in Nebraska!",
        forKids: "The football stadium has been totally FULL for EVERY game for more than sixty years! That's four hundred games in a row! When everyone comes, there are more people than in most towns!"
      },
      {
        text: "Kool-Aid was invented in Nebraska! A man named Edwin Perkins turned a liquid drink into powder in 1927! It's the official state drink!",
        forKids: "KOOL-AID was invented right here in Nebraska! OH YEAH! A man figured out how to turn juice into magic powder! And Nebraska made it their official state drink!"
      },
      {
        text: "A museum in Lincoln has a mammoth named Archie that's 14 feet tall - discovered when CHICKENS pecked his bones out of the ground!",
        forKids: "There's a museum with a GIANT woolly mammoth named Archie! He's taller than any room in your house! And guess who found him? CHICKENS! They pecked his bones right out of the dirt!"
      },
      {
        text: "92,003 people packed the football stadium to watch VOLLEYBALL - the biggest crowd ever at a women's sporting event IN THE WHOLE WORLD!",
        forKids: "Ninety-two THOUSAND people came to watch volleyball in the football stadium! That's the most people EVER at a women's game in the whole world! Nebraska loves volleyball!"
      }
    ],
    historyFacts: [
      {
        text: "Lincoln is named after President Abraham Lincoln, who was the tallest president ever at 6 feet 4 inches! He signed the Homestead Act giving free land to settlers!",
        forKids: "This city is named after Abraham Lincoln! He was the TALLEST president ever! He was a really good leader who helped make sure everyone was free!",
        year: "1867",
        emoji: "🎩"
      },
      {
        text: "The Homestead Act of 1862 gave 160 acres of free land to anyone who would farm it for 5 years! 10% of ALL U.S. land was claimed this way!",
        forKids: "A long time ago, the government said 'FREE land for anyone who wants to be a farmer!' So tons of families moved to Nebraska! They gave away land the size of TEN whole states!",
        year: "1862",
        emoji: "🌾"
      },
      {
        text: "Pioneer kids had to collect dried buffalo poop called 'buffalo chips' to burn for cooking because there were almost no trees on the plains!",
        forKids: "Pioneer kids had a really funny job. They had to pick up dried buffalo POOP and bring it home! Their families burned it to cook dinner because there were no trees for firewood! EWWW!",
        year: "1860s",
        emoji: "🦬"
      },
      {
        text: "Nebraska means 'flat water' in the Otoe language. Native Americans lived here for over 13,000 years, hunting bison on the Great Plains!",
        forKids: "Nebraska's name comes from a Native American word that means 'flat water!' Native people lived here for thirteen THOUSAND years! They hunted big bison on the giant flat grasslands!",
        year: "Ancient",
        emoji: "🏜️"
      },
      {
        text: "Lincoln was originally called Lancaster, and it was chosen as the capital partly because of salt flats in the ground - the land was salty like the ocean but in the middle of a prairie!",
        forKids: "Lincoln used to have a different name - Lancaster! And the ground here was SALTY like the ocean, but there's no ocean anywhere near here! That's why the baseball team is called the Saltdogs!",
        year: "1867",
        emoji: "🧂"
      }
    ]
  },
  {
    id: 'roca',
    name: 'Roca',
    emoji: '📦',
    color: '#a855f7',
    coordinates: { x: 54, y: 40 },
    lngLat: { lng: -96.6653, lat: 40.6481 },
    facts: [
      {
        text: "This is the special warehouse where Dad is helping pack boxes with cool stuff inside!",
        forKids: "This is the special warehouse! Dad is helping pack boxes with cool stuff inside! People are going to be SO happy!"
      },
      {
        text: "Dad has to pack about 180 boxes for shipping and 200 people are coming to pick up their orders in person!",
        forKids: "Dad has to pack one hundred and eighty boxes for shipping! AND two hundred people are driving to pick up their stuff! That is SO many boxes!"
      },
      {
        text: "Roca only has 201 people living here! Everybody knows everybody!",
        forKids: "Roca is SO tiny that only two hundred and one people live here! That's less than your whole school! Everybody knows everybody's name!"
      },
      {
        text: "Roca has a famous berry farm with a pumpkin patch, petting zoo with goats and bunnies, zip lines, and a jumping pillow!",
        forKids: "There's a farm near here with goats, bunnies, a pig, zip lines, and a giant pillow you can JUMP on! And pumpkins everywhere!"
      }
    ],
    historyFacts: [
      {
        text: "Roca means 'rock' in Spanish! It was named because there were stone quarries here - the rocks were used to build buildings in Lincoln!",
        forKids: "Roca means 'ROCK' in Spanish! They named it that because there were big rocks in the ground! Workers dug up the rocks and used them to build buildings in Lincoln!",
        year: "1870s",
        emoji: "🪨"
      },
      {
        text: "Czech and German immigrants sailed across the ocean and came all the way to tiny Roca to be farmers in the 1800s!",
        forKids: "People came all the way from countries called Czech Republic and Germany! They sailed across the big ocean and walked to this tiny town to grow food!",
        year: "1870s",
        emoji: "🚢"
      },
      {
        text: "Roca used to be bigger! It had a hotel, stores, and a mill - but fires destroyed the businesses in 1891 and 1910, and the town got tiny!",
        forKids: "Roca used to be bigger with a hotel and shops! But then fires burned them down and the town got really really small! Now only two hundred people live here!",
        year: "1891",
        emoji: "🔥"
      },
      {
        text: "The salt from nearby Lancaster County was so valuable that Native Americans and settlers traveled far to collect it - it was like finding treasure!",
        forKids: "Before people had refrigerators, they needed salt to keep food from going yucky! The salt near Roca was super valuable! Finding salt was like finding treasure!",
        year: "1800s",
        emoji: "🧂"
      }
    ]
  },
  {
    id: 'omaha',
    name: 'Omaha',
    emoji: '✈️',
    color: '#ec4899',
    coordinates: { x: 56, y: 42 },
    lngLat: { lng: -95.9345, lat: 41.2565 },
    facts: [
      {
        text: "The Henry Doorly Zoo has the world's largest indoor desert inside a giant glass dome that's 137 feet tall! And a shark tunnel where sharks swim OVER YOUR HEAD!",
        forKids: "The zoo has a DESERT inside a giant glass ball! And you can walk through a tunnel with SHARKS swimming right over your head! And there's a jungle with a fifty foot waterfall INSIDE a building!"
      },
      {
        text: "You can stand in TWO STATES at the same time on the Bob Kerrey Bridge! One foot in Nebraska and one foot in Iowa!",
        forKids: "There's a bridge where you can put one foot in Nebraska and one foot in Iowa at the SAME TIME! You're in two places at once!"
      },
      {
        text: "TV dinners were invented in Omaha because a company had 520,000 POUNDS of leftover turkey after Thanksgiving! That's ten whole train cars full of turkey!",
        forKids: "TV dinners were invented here because a company had TOO MUCH TURKEY after Thanksgiving! They had TEN train cars full of turkey and didn't know what to do with it!"
      },
      {
        text: "There's a ball made of 4.6 MILLION stamps at Boys Town that weighs 600 pounds - as much as a grizzly bear!",
        forKids: "There's a ball made of four million six hundred thousand STAMPS! It weighs as much as a grizzly bear! Somebody started making it in 1953 and it just kept getting bigger!"
      },
      {
        text: "The biggest steam train in the world is parked in Omaha! It weighs 1.2 million pounds - that's heavier than 100 elephants!",
        forKids: "The BIGGEST steam train in the WHOLE WORLD is parked right here! It weighs as much as ONE HUNDRED elephants! Choo choo! That's one heavy train!"
      },
      {
        text: "One of the richest people in the whole world lives in Omaha in the same regular house he bought in 1958 for $31,500! He could buy a castle but says he loves his house!",
        forKids: "One of the richest people in the WHOLE WORLD lives right here in a regular house! He's been there since 1958! He could buy a CASTLE but he says he loves his regular house!"
      }
    ],
    historyFacts: [
      {
        text: "Lewis and Clark held their very first meeting with Native Americans near here in 1804! They showed off an air gun, a magnet, a spyglass, and a pocket watch!",
        forKids: "The explorers Lewis and Clark had their FIRST meeting with Native Americans right here! They showed them cool things like a magic air gun, a magnet that sticks to metal, and a tiny clock!",
        year: "1804",
        emoji: "🧭"
      },
      {
        text: "The first railroad track that went ALL the way across America started right here in Omaha! Trains went from here to California!",
        forKids: "The very first train track that went ALL the way across America started right here! Imagine trains going from here all the way to the beach in California! Choo choo!",
        year: "1863",
        emoji: "🚂"
      },
      {
        text: "Omaha was called the 'Gateway to the West' - thousands of pioneer families with covered wagons stopped here to buy supplies before heading west on the Oregon Trail!",
        forKids: "Omaha was like a giant store for families going on adventures west! They'd stop here, buy food and supplies, load up their wagons, and head out on a really long trail!",
        year: "1840s",
        emoji: "🛻"
      },
      {
        text: "Omaha is named after the Omaha people, a Native American tribe. 'Omaha' means 'those going against the wind' or 'upstream people!'",
        forKids: "The city is named after the Omaha people, who are Native Americans! Their name means 'people who go against the wind!' That sounds really brave!",
        year: "Ancient",
        emoji: "🌬️"
      },
      {
        text: "The Durham Museum is inside a real 1930s train station where 10,000 people a day used to catch trains! It has an old-fashioned soda fountain where you can get treats!",
        forKids: "There's a museum inside a REAL old train station! Ten thousand people used to catch trains there EVERY DAY! And it has an old-time soda shop where you can get special drinks!",
        year: "1931",
        emoji: "🚉"
      }
    ]
  }
];

export const getCityById = (id: string): CityData | undefined => {
  return cityData.find(city => city.id === id);
};

export const getNextCity = (currentId: string): CityData | undefined => {
  const currentIndex = cityData.findIndex(city => city.id === currentId);
  if (currentIndex === -1 || currentIndex === cityData.length - 1) return undefined;
  return cityData[currentIndex + 1];
};

export const routeOrder = ['vancouver', 'seattle', 'tulsa', 'lincoln', 'roca', 'omaha', 'vancouver'] as const;

export type CityId = typeof routeOrder[number];
