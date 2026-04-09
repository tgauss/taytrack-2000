export interface JournalEntry {
  date: string;
  day: number;
  title: string;
  emoji: string;
  voScript: string; // Voice-over script (optimized for spoken delivery)
  funDetail: string;
  sleepsLeft: number;
  audioKey: string; // Key for pre-generated audio lookup
}

export const journalEntries: JournalEntry[] = [
  {
    date: '2026-04-12',
    day: 1,
    title: 'Blast Off Day!',
    emoji: '✈️',
    voScript: "Day one! Dad woke up super early this morning, gave everyone the biggest hugs, and drove across the bridge to the airport. Then he got on a big airplane and flew all the way to a city called Tulsa in Oklahoma! He had to stop in Seattle first to change planes. Now he's at his hotel getting ready for his big conference tomorrow. And guess what? His hotel is near a magic circle where if you stand in the middle and shout, your voice echoes back super loud! But nobody next to you can hear it! How crazy is that? Dad misses you SO much already. Seven more sleeps until he comes home!",
    funDetail: "Dad's hotel is near the Center of the Universe — a magic echo circle!",
    sleepsLeft: 7,
    audioKey: 'journal-day1',
  },
  {
    date: '2026-04-13',
    day: 2,
    title: 'Conference Day 1',
    emoji: '🎭',
    voScript: "Day two! Dad went to his big conference today. Lots and lots of grown-ups are there talking about how to make towns and cities better places to live. He went to a really cool theater called the Tulsa Theater and listened to speakers all day. But here's the fun part. Did you know Tulsa has a giant golden man statue that's as tall as SEVEN giraffes stacked on top of each other? And his shoe size is three hundred and ninety three! That's not even a real shoe size! Nobody makes shoes that big! Oh and get this. Oklahoma has little animals called armadillos that ALWAYS have four identical babies. Every single time! And when they get scared they jump straight up in the air! Six more sleeps!",
    funDetail: "The Golden Driller's shoe size is 393DDD!",
    sleepsLeft: 6,
    audioKey: 'journal-day2',
  },
  {
    date: '2026-04-14',
    day: 3,
    title: 'Conference Day 2',
    emoji: '📚',
    voScript: "Day three! Another busy day at the conference. Dad got to walk around different parts of Tulsa today and see how people fixed up old buildings to make them beautiful again. And he walked on Route 66! That's the most famous road in ALL of America! It goes from Chicago all the way to California! You know what's really cool? The character Sally from the Cars movie was based on a REAL lady who runs a restaurant on Route 66 in Oklahoma! Oh and here's a silly one. Oklahoma made a law that says a watermelon is a vegetable. But everybody knows watermelons are fruit! Silly Oklahoma! Five more sleeps until Dad's home!",
    funDetail: "Sally from Cars is based on a real Oklahoma lady!",
    sleepsLeft: 5,
    audioKey: 'journal-day3',
  },
  {
    date: '2026-04-15',
    day: 4,
    title: 'Conference + Road Trip!',
    emoji: '🚗',
    voScript: "Day four and this was a BIG one! Dad finished his conference in the morning and then got in a car and drove a really really long way. Almost six hours! He drove through Kansas where the grass used to grow TEN FEET TALL! That's way taller than your house! The sky was SO big he could see for thirty miles in every direction. There were giant windmills spinning everywhere. And get this. Kansas is scientifically proven to be flatter than a pancake! Real scientists actually measured it! Oh and there's a tiny town in Kansas called Gas. And their motto is don't pass Gas, stop and enjoy it! Dad finally made it to Lincoln Nebraska late at night. Four more sleeps!",
    funDetail: "Kansas is literally flatter than a pancake — scientists proved it!",
    sleepsLeft: 4,
    audioKey: 'journal-day4',
  },
  {
    date: '2026-04-16',
    day: 5,
    title: 'Packing Day!',
    emoji: '📦',
    voScript: "Day five! Today Dad went to a big warehouse in a teeny tiny town called Roca. Only two hundred and one people live in the ENTIRE town! He spent all day packing boxes. One hundred and eighty boxes to ship to people! Then in the evening the very first customers came to pick up their orders. Everyone was so happy when they got their stuff! Dad's hotel is in a cool neighborhood called the Haymarket with old brick streets and ice cream shops. And there's a museum nearby with a giant mammoth skeleton named Archie who's fourteen feet tall. Guess how they found him? CHICKENS pecked his bones out of the ground! Three more sleeps!",
    funDetail: "Archie the mammoth was discovered by chickens!",
    sleepsLeft: 3,
    audioKey: 'journal-day5',
  },
  {
    date: '2026-04-17',
    day: 6,
    title: 'THE BIG DAY!',
    emoji: '🔥',
    voScript: "Day six! THE BIG DAY! This was the biggest busiest craziest day of the whole trip! The warehouse was PACKED with people coming to get their orders from morning until night. Ten whole hours! Dad helped carry boxes and check orders and make sure everyone got the right stuff. About seventy five people came today! Did you know Nebraska has THREE cows for every person? That's six million cows! Moo moo moo moo moo moo! And Kool-Aid was invented right here in Nebraska! Oh yeah! Dad's feet are super tired but he's really happy. Almost done! Two more sleeps!",
    funDetail: "Kool-Aid was invented in Nebraska! OH YEAH!",
    sleepsLeft: 2,
    audioKey: 'journal-day6',
  },
  {
    date: '2026-04-18',
    day: 7,
    title: 'Last Day at the Warehouse',
    emoji: '✅',
    voScript: "Day seven! Last pickup day! More customers came to get their stuff and then Dad helped clean everything up. They served three hundred and seventy nine customers total over the three days! That's amazing! Tonight Dad is driving to Omaha to get ready for his flight home tomorrow. Omaha has the best zoo in the whole WORLD with a desert inside a giant glass dome and a tunnel where SHARKS swim right over your head! And there's a bridge where you can stand in two states at the same time! One foot in Nebraska and one foot in Iowa! Also the biggest steam train in the world is parked there. It weighs as much as a HUNDRED elephants! Just ONE more sleep! Dad is almost home!",
    funDetail: "You can stand in two states at once on the Bob Kerrey Bridge!",
    sleepsLeft: 1,
    audioKey: 'journal-day7',
  },
  {
    date: '2026-04-19',
    day: 8,
    title: 'DAD COMES HOME!',
    emoji: '🏠',
    voScript: "Day eight! THE BEST DAY! Dad got on a plane in Omaha and flew all the way to Seattle. Then he had to wait at the airport for three and a half hours! Then he got on one more tiny plane from Seattle to Portland. And then he drove across the big bridge to Vancouver and pulled into your driveway! But here's the thing — Dad gets home really late tonight, after you are already asleep. So tomorrow morning when you open your eyes, DAD WILL BE THERE! He's going to make sprinkle pancakes with extra sprinkles and tell you all about his adventure. Eight whole days! And the very best part of the whole entire trip? Coming home to YOU!",
    funDetail: "Dad gets home late tonight — but tomorrow morning means SPRINKLE PANCAKES! 🥞",
    sleepsLeft: 0,
    audioKey: 'journal-day8',
  },
];

export function getTodayJournal(): JournalEntry | null {
  const today = new Date().toISOString().split('T')[0];
  return journalEntries.find(e => e.date === today) || null;
}

export function getAvailableEntries(): JournalEntry[] {
  const today = new Date().toISOString().split('T')[0];
  return journalEntries.filter(e => e.date <= today);
}

export function getSleepsUntilHome(): number {
  const now = new Date();
  const homeDate = new Date('2026-04-19T20:25:00');
  if (now >= homeDate) return 0;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfHomeDay = new Date(2026, 3, 19);
  const diffDays = Math.ceil((startOfHomeDay.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
