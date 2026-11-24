/* Academy Awards data for the Explore "Oscars" section. TMDB has no awards data, so it is kept here: update it after each ceremony.
   Rows are [title, film release year, award label]. Source for the 98th ceremony (15 Mar 2026): Backstage / AMPAS winners list. */
const CEREMONY = "98th Academy Awards · 2026";
const WINNERS_2026 = [
  ["One Battle After Another", 2025, "Best Picture · Director · Supporting Actor"],
  ["Sinners", 2025, "Best Actor"],
  ["Hamnet", 2025, "Best Actress"],
  ["Weapons", 2025, "Best Supporting Actress"],
  ["Sentimental Value", 2025, "Best International Feature"],
  ["KPop Demon Hunters", 2025, "Best Animated Feature"],
];
const NOMINEES_2026 = [
  ["One Battle After Another", 2025, "Winner · Best Picture"], ["Sinners", 2025, "Best Picture nominee"], ["Hamnet", 2025, "Best Picture nominee"],
  ["Sentimental Value", 2025, "Best Picture nominee"], ["Frankenstein", 2025, "Best Picture nominee"], ["Marty Supreme", 2025, "Best Picture nominee"],
  ["Bugonia", 2025, "Best Picture nominee"], ["The Secret Agent", 2025, "Best Picture nominee"], ["Train Dreams", 2025, "Best Picture nominee"], ["F1", 2025, "Best Picture nominee"],
];
/* Best Picture winners, newest first: [title, film year, "Best Picture <ceremony year>"] */
const BEST_PICTURE = [
  ["One Battle After Another", 2025, 2026], ["Anora", 2024, 2025], ["Oppenheimer", 2023, 2024], ["Everything Everywhere All at Once", 2022, 2023], ["CODA", 2021, 2022],
  ["Nomadland", 2020, 2021], ["Parasite", 2019, 2020], ["Green Book", 2018, 2019], ["The Shape of Water", 2017, 2018], ["Moonlight", 2016, 2017],
  ["Spotlight", 2015, 2016], ["Birdman or (The Unexpected Virtue of Ignorance)", 2014, 2015], ["12 Years a Slave", 2013, 2014], ["Argo", 2012, 2013], ["The Artist", 2011, 2012],
  ["The King's Speech", 2010, 2011], ["The Hurt Locker", 2009, 2010], ["Slumdog Millionaire", 2008, 2009], ["No Country for Old Men", 2007, 2008], ["The Departed", 2006, 2007],
  ["Crash", 2005, 2006], ["Million Dollar Baby", 2004, 2005], ["The Lord of the Rings: The Return of the King", 2003, 2004], ["Chicago", 2002, 2003], ["A Beautiful Mind", 2001, 2002],
  ["Gladiator", 2000, 2001], ["American Beauty", 1999, 2000], ["Shakespeare in Love", 1998, 1999], ["Titanic", 1997, 1998], ["The English Patient", 1996, 1997],
  ["Braveheart", 1995, 1996], ["Forrest Gump", 1994, 1995], ["Schindler's List", 1993, 1994], ["Unforgiven", 1992, 1993], ["The Silence of the Lambs", 1991, 1992], ["Dances with Wolves", 1990, 1991],
].map((r) => [r[0], r[1], "Best Picture " + r[2]]);
module.exports = { CEREMONY, WINNERS_2026, NOMINEES_2026, BEST_PICTURE };
