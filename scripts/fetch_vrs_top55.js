const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');
const cheerio = require('cheerio');

const countryToCode = {
  'Russia': 'RU', 'Russian Federation': 'RU',
  'Ukraine': 'UA',
  'Belarus': 'BY',
  'Denmark': 'DK',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Finland': 'FI',
  'Poland': 'PL',
  'Germany': 'DE',
  'France': 'FR',
  'United States': 'US', 'USA': 'US',
  'Canada': 'CA',
  'Brazil': 'BR',
  'Mongolia': 'MN',
  'Turkey': 'TR',
  'Israel': 'IL',
  'Bosnia and Herzegovina': 'BA',
  'Serbia': 'RS',
  'Slovakia': 'SK',
  'Czech Republic': 'CZ', 'Czechia': 'CZ',
  'United Kingdom': 'GB', 'Great Britain': 'GB',
  'Australia': 'AU',
  'New Zealand': 'NZ',
  'Argentina': 'AR',
  'Chile': 'CL',
  'Uruguay': 'UY',
  'Spain': 'ES',
  'Portugal': 'PT',
  'Netherlands': 'NL',
  'Belgium': 'BE',
  'Estonia': 'EE',
  'Latvia': 'LV',
  'Lithuania': 'LT',
  'Hungary': 'HU',
  'Romania': 'RO',
  'Bulgaria': 'BG',
  'Kazakhstan': 'KZ',
  'China': 'CN',
  'Japan': 'JP',
  'South Korea': 'KR', 'Korea': 'KR',
  'Thailand': 'TH',
  'Singapore': 'SG',
  'Indonesia': 'ID',
  'Malaysia': 'MY',
  'Philippines': 'PH',
  'Jordan': 'JO',
  'South Africa': 'ZA',
  'Kosovo': 'XK',
  'Montenegro': 'ME',
  'North Macedonia': 'MK',
  'Switzerland': 'CH',
  'Austria': 'AT',
  'Guatemala': 'GT'
};

async function fetchLiquipediaStandings() {
  console.log('📡 Fetching Valve Regional Standings from Liquipedia API...');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'liquipedia.net',
      path: '/counterstrike/api.php?action=parse&page=Valve_Regional_Standings&prop=text&format=json',
      headers: {
        'User-Agent': 'ProSettingsApp/1.0 (https://prosettings.example.com; contact@prosettings.example.com)',
        'Accept-Encoding': 'gzip, deflate'
      }
    };

    const req = https.get(options, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Liquipedia API returned status ${res.statusCode}`));
      }

      let chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const encoding = res.headers['content-encoding'];
        if (encoding === 'gzip') {
          zlib.gunzip(buffer, (err, decoded) => {
            if (err) return reject(err);
            resolve(JSON.parse(decoded.toString()));
          });
        } else if (encoding === 'deflate') {
          zlib.inflate(buffer, (err, decoded) => {
            if (err) return reject(err);
            resolve(JSON.parse(decoded.toString()));
          });
        } else {
          resolve(JSON.parse(buffer.toString()));
        }
      });
    });

    req.on('error', reject);
  });
}

async function parseTop55Teams() {
  try {
    const apiResult = await fetchLiquipediaStandings();
    const html = apiResult?.parse?.text?.['*'];
    if (!html) {
      throw new Error('No HTML content in parse response');
    }

    const $ = cheerio.load(html);
    
    // Find all rows with class containing table2__row--body
    const rows = $('tr[class*="table2__row--body"], tr[class*="table2&#95;&#95;row--body"]');
    console.log(`🔎 Total ranking rows found: ${rows.length}`);

    const teams = [];
    const allPlayers = [];

    rows.each((i, el) => {
      if (teams.length >= 55) return;

      const $row = $(el);
      
      // Rank and points
      const tds = $row.find('td');
      if (tds.length < 5) return;

      const rankText = $(tds[0]).text().trim();
      const pointsText = $(tds[1]).text().trim();
      
      const teamLink = $(tds[2]).find('.team-template-text a');
      if (!teamLink.length) return;

      const teamName = teamLink.text().trim();
      const teamUrl = teamLink.attr('href') ? `https://liquipedia.net${teamLink.attr('href')}` : null;
      
      // Team logo
      const teamImg = $(tds[2]).find('img').last();
      let teamLogo = teamImg.attr('src') ? `https://liquipedia.net${teamImg.attr('src')}` : null;

      // Region
      const region = $(tds[3]).text().trim();

      // Players
      const playerBlocks = $(tds[4]).find('.block-player');
      const roster = [];

      playerBlocks.each((j, pEl) => {
        const $p = $(pEl);
        const name = $p.find('.name').text().trim();
        const flagImg = $p.find('.flag img');
        const country = flagImg.attr('title') || flagImg.attr('alt') || '';
        const countryCode = countryToCode[country] || null;

        if (name) {
          const playerData = {
            username: name,
            team: teamName,
            nationality: country || null,
            country_code: countryCode,
            game: 'cs2'
          };
          roster.push(playerData);
          allPlayers.push(playerData);
        }
      });

      teams.push({
        rank: parseInt(rankText, 10) || (teams.length + 1),
        name: teamName,
        points: parseFloat(pointsText) || null,
        region,
        logo_url: teamLogo,
        liquipedia_url: teamUrl,
        players: roster
      });
    });

    console.log(`\n🏆 Successfully extracted ${teams.length} Teams (Top 55) with ${allPlayers.length} Players!`);

    // Ensure data directory exists
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const outputFilePath = path.join(dataDir, 'vrs-top55-cs2.json');
    fs.writeFileSync(outputFilePath, JSON.stringify({
      updated_at: new Date().toISOString(),
      source: 'https://liquipedia.net/counterstrike/Valve_Regional_Standings',
      total_teams: teams.length,
      total_players: allPlayers.length,
      teams
    }, null, 2), 'utf8');

    console.log(`💾 Saved Top 55 data to: ${outputFilePath}`);

    return { teams, allPlayers };
  } catch (err) {
    console.error('❌ Error parsing VRS standings:', err);
    throw err;
  }
}

// If executed directly
if (require.main === module) {
  parseTop55Teams().then(({ teams, allPlayers }) => {
    console.log('\n--- SAMPLE TOP 10 TEAMS ---');
    teams.slice(0, 10).forEach(t => {
      console.log(`#${t.rank.toString().padStart(2, ' ')} | ${t.name.padEnd(20, ' ')} [${t.region}] (${t.points} pts) -> Roster: ${t.players.map(p => `${p.username} (${p.country_code || p.nationality || '?'})`).join(', ')}`);
    });

    console.log('\n--- TEAMS #50 to #55 ---');
    teams.slice(49, 55).forEach(t => {
      console.log(`#${t.rank.toString().padStart(2, ' ')} | ${t.name.padEnd(20, ' ')} [${t.region}] (${t.points} pts) -> Roster: ${t.players.map(p => `${p.username} (${p.country_code || p.nationality || '?'})`).join(', ')}`);
    });
  });
}

module.exports = { parseTop55Teams };
