const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function scrapeGame(gameName, url) {
  console.log(`Fetching data for ${gameName} from ${url} ...`);
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(data);
    const table = $('table').first();
    if (!table.length) {
      console.log(`⚠️ No table found for ${gameName}`);
      return [];
    }

    const headers = [];
    table.find('thead th, tr th').each((i, th) => {
      headers.push($(th).text().trim().toLowerCase());
    });

    console.log(`Headers found for ${gameName}:`, headers.join(' | '));

    const players = [];
    table.find('tbody tr').each((i, tr) => {
      const rowData = { game: gameName.toLowerCase() };
      $(tr).find('td').each((j, td) => {
        const header = headers[j];
        if (header) {
          // If there is a link, we can extract the text
          rowData[header] = $(td).text().trim();
        }
      });
      // Only add if player name is present
      if (rowData['player']) {
        players.push(rowData);
      }
    });

    console.log(`✅ Scraped ${players.length} players for ${gameName}`);
    return players;
  } catch (e) {
    console.error(`❌ Error scraping ${gameName}:`, e.message);
    return [];
  }
}

async function run() {
  const games = [
    { name: 'VALORANT', url: 'https://prosettings.net/lists/valorant/' },
    { name: 'CS2', url: 'https://prosettings.net/lists/cs2/' }
  ];

  let allPlayers = [];

  for (let i = 0; i < games.length; i++) {
    if (i > 0) {
      console.log("Waiting 3 seconds to be polite to the server...");
      await delay(3000);
    }
    const players = await scrapeGame(games[i].name, games[i].url);
    allPlayers = allPlayers.concat(players);
  }

  // Create data directory if it doesn't exist
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const outputPath = path.join(dataDir, 'scraped-players.json');
  fs.writeFileSync(outputPath, JSON.stringify(allPlayers, null, 2), 'utf8');
  console.log(`\n🎉 Success! Saved ${allPlayers.length} total player records to ${outputPath}`);
}

run();
