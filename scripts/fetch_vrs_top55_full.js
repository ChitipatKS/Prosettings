const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

// 1. Supabase setup
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, 'utf8');
  envText.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      if (key && val) process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

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

function fetchLiquipediaUrl(urlPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'liquipedia.net',
      path: urlPath,
      headers: {
        'User-Agent': 'ProSettingsApp/1.0 (https://prosettings.example.com; contact@prosettings.example.com)',
        'Accept-Encoding': 'gzip, deflate'
      }
    };

    const req = https.get(options, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }

      let chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const encoding = res.headers['content-encoding'];
        const processBody = (raw) => {
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(e);
          }
        };

        if (encoding === 'gzip') {
          zlib.gunzip(buffer, (err, decoded) => {
            if (err) return reject(err);
            processBody(decoded.toString());
          });
        } else if (encoding === 'deflate') {
          zlib.inflate(buffer, (err, decoded) => {
            if (err) return reject(err);
            processBody(decoded.toString());
          });
        } else {
          processBody(buffer.toString());
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

function cleanWikitext(raw) {
  if (!raw) return '';
  return raw
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function parseBirthDate(raw) {
  if (!raw) return null;
  const match = raw.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    const y = match[1];
    const m = match[2].padStart(2, '0');
    const d = match[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return null;
}

async function fetchPlayerPageDetails(pageTitle) {
  try {
    const json = await fetchLiquipediaUrl(`/counterstrike/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=wikitext&format=json`);
    const wikitext = json?.parse?.wikitext?.['*'] || '';
    if (!wikitext) return null;

    // Extract infobox fields
    const romNameMatch = wikitext.match(/\|\s*romanized_?name\s*=\s*([^|\n]+)/i);
    const nameMatch = wikitext.match(/\|\s*name\s*=\s*([^|\n]+)/i);
    const birthMatch = wikitext.match(/\|\s*birth_date\s*=\s*([^|\n]+)/i);
    const countryMatch = wikitext.match(/\|\s*country\s*=\s*([^|\n]+)/i);

    const romanized = cleanWikitext(romNameMatch ? romNameMatch[1] : '');
    const regular = cleanWikitext(nameMatch ? nameMatch[1] : '');
    const real_name = romanized || regular || null;
    const birth_date = parseBirthDate(birthMatch ? birthMatch[1] : null);
    const nationality = cleanWikitext(countryMatch ? countryMatch[1] : '');

    return {
      real_name,
      birth_date,
      nationality: nationality || null
    };
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('📡 Step 1: Fetching Valve Regional Standings from Liquipedia API...');
  const standingsData = await fetchLiquipediaUrl('/counterstrike/api.php?action=parse&page=Valve_Regional_Standings&prop=text&format=json');
  const html = standingsData?.parse?.text?.['*'];

  if (!html) {
    console.error('Error: Failed to fetch HTML from Liquipedia.');
    process.exit(1);
  }

  const $ = cheerio.load(html);
  const rows = $('table.standing-table tbody tr');

  console.log(`Found ${rows.length} total rows in standings table.`);

  const teams = [];
  const allPlayers = [];

  rows.each((i, el) => {
    if (teams.length >= 55) return false; // Stop strictly at Top 55

    const $row = $(el);
    const tds = $row.find('td');
    if (tds.length < 5) return;

    const rankText = $(tds[0]).text().trim().replace(/[^0-9]/g, '');
    const teamLink = $(tds[2]).find('a').last();
    const teamName = teamLink.text().trim();
    if (!teamName) return;

    const pointsText = $(tds[1]).text().trim();
    const teamImg = $(tds[2]).find('img').last();
    const teamLogo = teamImg.attr('src') ? `https://liquipedia.net${teamImg.attr('src')}` : null;
    const region = $(tds[3]).text().trim();

    const playerBlocks = $(tds[4]).find('.block-player');
    const roster = [];

    playerBlocks.each((j, pEl) => {
      const $p = $(pEl);
      const name = $p.find('.name').text().trim();
      const pLink = $p.find('.name a').attr('href') || '';
      const pageTitle = pLink ? decodeURIComponent(pLink.replace(/^\/counterstrike\//, '')) : name;

      const flagImg = $p.find('.flag img');
      const country = flagImg.attr('title') || flagImg.attr('alt') || '';
      const countryCode = countryToCode[country] || null;

      if (name) {
        const pObj = {
          username: name,
          page_title: pageTitle,
          team: teamName,
          nationality: country || null,
          country_code: countryCode,
          real_name: null,
          birth_date: null,
          game: 'cs2'
        };
        roster.push(pObj);
        allPlayers.push(pObj);
      }
    });

    teams.push({
      rank: parseInt(rankText, 10) || (teams.length + 1),
      name: teamName,
      points: parseFloat(pointsText) || null,
      region,
      logo_url: teamLogo,
      players: roster
    });
  });

  console.log(`\n🏆 Extracted Top 55 Teams with ${allPlayers.length} Players.`);
  console.log(`\n🚀 Step 2: Fetching Real Names and Birth Dates for each player...\n`);

  let fetchedNames = 0;
  let fetchedBirths = 0;

  for (let idx = 0; idx < allPlayers.length; idx++) {
    const player = allPlayers[idx];
    const details = await fetchPlayerPageDetails(player.page_title || player.username);

    if (details) {
      if (details.real_name) {
        player.real_name = details.real_name;
        fetchedNames++;
      }
      if (details.birth_date) {
        player.birth_date = details.birth_date;
        fetchedBirths++;
      }
      if (details.nationality && !player.nationality) {
        player.nationality = details.nationality;
        player.country_code = countryToCode[details.nationality] || player.country_code;
      }
    }

    console.log(`[${idx + 1}/${allPlayers.length}] ${player.username} (${player.team}) -> Name: ${player.real_name || '-'} | Born: ${player.birth_date || '-'}`);

    // Sync directly into Supabase
    if (supabase) {
      await supabase
        .from('players')
        .upsert({
          username: player.username,
          Full_name: player.real_name || null,
          birth_date: player.birth_date || null,
          team: player.team,
          nationality: player.nationality || null,
          country_code: player.country_code || null
        }, { onConflict: 'username' });
    }

    // Polite delay
    await new Promise(r => setTimeout(r, 200));
  }

  // Save enriched data to data/vrs-top55-cs2.json
  const outData = {
    total_teams: teams.length,
    total_players: allPlayers.length,
    updated_at: new Date().toISOString(),
    teams
  };

  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'vrs-top55-cs2.json'), JSON.stringify(outData, null, 2));

  console.log(`\n🎉 Completed Successfully!`);
  console.log(`- Total Players: ${allPlayers.length}`);
  console.log(`- Real Names Extracted: ${fetchedNames}`);
  console.log(`- Birth Dates Extracted: ${fetchedBirths}`);
  console.log(`- Saved to: data/vrs-top55-cs2.json & Supabase Database.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
