export interface JournalEntry {
  date: string; // YYYY-MM-DD
  day: number;
  title: string;
  emoji: string;
  story: string; // For kids (TTS friendly)
  funDetail: string; // A specific fun detail from that day
  sleepsLeft: number;
}

export const journalEntries: JournalEntry[] = [
  {
    date: '2026-04-12',
    day: 1,
    title: 'Blast Off Day!',
    emoji: '✈️',
    story: "Today Dad woke up really early, gave everyone big hugs, and drove across the bridge to the airport! He flew on a big airplane all the way to a city called Tulsa in Oklahoma. That's really far! He had to change planes in Seattle. Now he's in his hotel room getting ready for his big conference tomorrow. He misses you already!",
    funDetail: "Dad's hotel is near a magic circle called the Center of the Universe where your voice echoes back super loud but people standing right next to you can't hear it!",
    sleepsLeft: 7,
  },
  {
    date: '2026-04-13',
    day: 2,
    title: 'Conference Day 1',
    emoji: '🎭',
    story: "Dad went to a big meeting today called a conference! Lots of grown-ups are there talking about how to make towns and cities better places to live. He went to a cool theater called the Tulsa Theater and listened to speakers. Did you know Tulsa has a giant golden man statue that's as tall as seven giraffes? His shoe size is three hundred and ninety-three!",
    funDetail: "Oklahoma has armadillos that always have four identical babies, and when they get scared, they jump four feet straight up in the air!",
    sleepsLeft: 6,
  },
  {
    date: '2026-04-14',
    day: 3,
    title: 'Conference Day 2',
    emoji: '📚',
    story: "Another busy day at the conference! Dad got to walk around different parts of Tulsa and see how people fixed up old buildings to make them beautiful again. He walked on Route 66 today - that's the most famous road in America! It goes all the way from Chicago to Los Angeles! Did you know the character Sally from the Cars movie was based on a real lady from an Oklahoma restaurant on Route 66?",
    funDetail: "Oklahoma says a watermelon is a vegetable. That's their actual law! But everybody knows it's a fruit. Silly Oklahoma!",
    sleepsLeft: 5,
  },
  {
    date: '2026-04-15',
    day: 4,
    title: 'Conference + Road Trip!',
    emoji: '🚗',
    story: "This was a big day! Dad finished the conference in the morning and then got in a rental car and drove a really long way - almost six hours! He drove through Kansas where the grass used to grow TEN FEET tall! That's taller than your house! The sky was SO big he could see for thirty miles in every direction. He might have even seen some controlled fires where farmers burn the old grass to help new grass grow! He finally got to Lincoln, Nebraska really late at night.",
    funDetail: "Kansas is scientifically proven to be flatter than a pancake! Real scientists measured it! And there's a town in Kansas called Gas whose motto is 'Don't Pass Gas, Stop and Enjoy It!'",
    sleepsLeft: 4,
  },
  {
    date: '2026-04-16',
    day: 5,
    title: 'Packing Day!',
    emoji: '📦',
    story: "Today Dad went to a big warehouse in a tiny town called Roca. Only two hundred and one people live there! He spent the whole day packing boxes! There are one hundred and eighty boxes to ship to people! Then in the evening, the first customers came to pick up their special orders. Everyone was so happy! Dad's hotel is in a cool old neighborhood called the Haymarket with brick streets!",
    funDetail: "A museum near Dad has a giant woolly mammoth named Archie that's fourteen feet tall. Guess how they found him? CHICKENS pecked his bones out of the ground!",
    sleepsLeft: 3,
  },
  {
    date: '2026-04-17',
    day: 6,
    title: 'THE BIG DAY!',
    emoji: '🔥',
    story: "This was the biggest, busiest day of the whole trip! The warehouse was packed with people coming to pick up their orders from morning until night - ten whole hours! Dad helped carry boxes, check orders, and make sure everyone got the right stuff. Nebraska has three cows for every person, and Kool-Aid was invented here! Dad's feet are tired but he's so happy!",
    funDetail: "Nebraska's football stadium has been sold out for EVERY game since 1962! That's over four hundred games in a row! And ninety-two thousand people came to watch VOLLEYBALL there!",
    sleepsLeft: 2,
  },
  {
    date: '2026-04-18',
    day: 7,
    title: 'Last Day at the Warehouse',
    emoji: '✅',
    story: "The last pickup day! A few more people came to get their stuff, and then Dad helped clean up and pack everything away. They served three hundred and seventy-nine customers total! Tonight he's driving to Omaha to get ready for his flight home tomorrow. Omaha has the best zoo in the whole world with a desert inside a giant glass dome and a tunnel where sharks swim over your head!",
    funDetail: "There's a bridge in Omaha where you can stand in TWO STATES at the same time! One foot in Nebraska and one foot in Iowa! And the biggest steam train in the world is parked there - it weighs as much as a hundred elephants!",
    sleepsLeft: 1,
  },
  {
    date: '2026-04-19',
    day: 8,
    title: 'DAD COMES HOME!',
    emoji: '🏠',
    story: "THE BEST DAY! Dad got on a plane in Omaha, flew to Seattle, and then flew home to us! Eight days of adventures! He went to a conference in Tulsa, drove through Kansas where the grass grows taller than a car, packed three hundred and seventy-nine orders in tiny Roca, Nebraska, and visited cities named after a president, after a rock, and after brave people who walk against the wind! But the best part? Coming home to YOU!",
    funDetail: "Dad traveled over three thousand miles! That's like driving from our house to the Statue of Liberty and back! Time for big hugs!",
    sleepsLeft: 0,
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
  const startOfHomeDay = new Date(2026, 3, 19); // April 19
  const diffDays = Math.ceil((startOfHomeDay.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}
