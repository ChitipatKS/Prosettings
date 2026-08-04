const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const TEAMS_DIR = path.join(__dirname, '../public/images/teams');

if (!fs.existsSync(TEAMS_DIR)) {
  fs.mkdirSync(TEAMS_DIR, { recursive: true });
}

// Map of slug to image source URLs (high resolution transparent SVG/PNG logos)
const LOGO_SOURCES = {
  'vitality': 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Team_Vitality_logo.svg',
  'navi': 'https://upload.wikimedia.org/wikipedia/en/a/ac/Natus_Vincere_logo.svg',
  'spirit': 'https://upload.wikimedia.org/wikipedia/commons/2/23/Team_Spirit_2021_logo.svg',
  'falcons': 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Team_Falcons_Logo.png',
  'furia': 'https://upload.wikimedia.org/wikipedia/en/3/30/FURIA_Esports_logo.svg',
  'mouz': 'https://upload.wikimedia.org/wikipedia/en/3/38/MOUZ_logo.svg',
  'g2': 'https://upload.wikimedia.org/wikipedia/en/1/1b/G2_Esports_logo.svg',
  'faze': 'https://upload.wikimedia.org/wikipedia/commons/4/43/FaZe_Clan.svg',
  'mongolz': 'https://upload.wikimedia.org/wikipedia/en/d/dc/The_Mongolz_logo.png',
  'astralis': 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Astralis_logo.svg',
  'liquid': 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Team_Liquid_logo_2020.svg',
  'nip': 'https://upload.wikimedia.org/wikipedia/en/c/c6/Ninjas_in_Pyjamas_logo_%282021%29.svg',
  'fut': 'https://upload.wikimedia.org/wikipedia/commons/d/df/FUT_Esports_logo.png',
  'gamerlegion': 'https://upload.wikimedia.org/wikipedia/en/9/9f/GamerLegion_logo.png',
  'legacy': 'https://upload.wikimedia.org/wikipedia/commons/3/38/Legacy_Esports_logo.png',
  'betboom': 'https://upload.wikimedia.org/wikipedia/commons/1/1a/BetBoom_Team_logo.png',
  'aurora': 'https://upload.wikimedia.org/wikipedia/commons/b/b4/Aurora_Gaming_logo.png',
  'parivision': 'https://upload.wikimedia.org/wikipedia/commons/7/7a/Parivision_logo.png',
  'mibr': 'https://upload.wikimedia.org/wikipedia/en/3/3e/MIBR_logo.svg',
  '9z': 'https://upload.wikimedia.org/wikipedia/commons/b/bd/9z_Team_logo.png',

  'paper-rex': 'https://upload.wikimedia.org/wikipedia/en/d/d3/Paper_Rex_logo.svg',
  'geng': 'https://upload.wikimedia.org/wikipedia/en/e/e0/Gen.G_logo.svg',
  'drx': 'https://upload.wikimedia.org/wikipedia/commons/b/be/DRX_logo.svg',
  't1': 'https://upload.wikimedia.org/wikipedia/commons/4/40/T1_logo.svg',
  'zeta': 'https://upload.wikimedia.org/wikipedia/commons/1/18/ZETA_DIVISION_logo.svg',
  'dfm': 'https://upload.wikimedia.org/wikipedia/en/6/6f/DetonatioN_FocusMe_logo.svg',
  'team-secret': 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Team_Secret_logo.svg',
  'global-esports': 'https://upload.wikimedia.org/wikipedia/commons/c/c9/Global_Esports_logo.png',
  'rrq': 'https://upload.wikimedia.org/wikipedia/commons/7/7d/RRQ_logo.png',
  'full-sense': 'https://upload.wikimedia.org/wikipedia/commons/9/90/Full_Sense_logo.png',
  'nongshim': 'https://upload.wikimedia.org/wikipedia/commons/3/37/Nongshim_RedForce_logo.svg',
  'varrel': 'https://upload.wikimedia.org/wikipedia/commons/2/2f/VARREL_logo.png',

  'sentinels': 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Sentinels_logo.svg',
  'loud': 'https://upload.wikimedia.org/wikipedia/commons/6/69/LOUD_logo.svg',
  'nrg': 'https://upload.wikimedia.org/wikipedia/commons/0/07/NRG_Esports_logo.svg',
  'leviatan': 'https://upload.wikimedia.org/wikipedia/commons/8/87/Leviat%C3%A1n_logo.png',
  '100-thieves': 'https://upload.wikimedia.org/wikipedia/commons/1/16/100_Thieves_logo.svg',
  'cloud9': 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Cloud9_logo.svg',
  'evil-geniuses': 'https://upload.wikimedia.org/wikipedia/commons/3/3b/Evil_Geniuses_logo.svg',
  'kru': 'https://upload.wikimedia.org/wikipedia/commons/c/cc/KR%C3%9C_Esports_logo.svg',
  'envy': 'https://upload.wikimedia.org/wikipedia/commons/b/be/Team_Envy_logo.svg',

  'fnatic': 'https://upload.wikimedia.org/wikipedia/en/4/43/Fnatic_logo.svg',
  'team-heretics': 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Team_Heretics_logo.svg',
  'karmine-corp': 'https://upload.wikimedia.org/wikipedia/commons/8/85/Karmine_Corp_logo.svg',
  'bbl': 'https://upload.wikimedia.org/wikipedia/commons/d/d4/BBL_Esports_logo.png',
  'giantx': 'https://upload.wikimedia.org/wikipedia/commons/a/a8/GiantX_logo.svg',
  'gentle-mates': 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Gentle_Mates_logo.png',
  'eternal-fire': 'https://upload.wikimedia.org/wikipedia/commons/5/52/Eternal_Fire_logo.svg',

  'edg': 'https://upload.wikimedia.org/wikipedia/commons/a/ab/EDward_Gaming_logo.svg',
  'bilibili': 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Bilibili_Gaming_logo.svg',
  'fpx': 'https://upload.wikimedia.org/wikipedia/commons/2/29/FunPlus_Phoenix_logo.svg',
  'trace-esports': 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Trace_Esports_logo.png',
  'tyloo': 'https://upload.wikimedia.org/wikipedia/en/e/eb/TyLoo_logo.png',
  'tec': 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Titan_Esports_Club_logo.png',
  'nova-esports': 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Nova_Esports_logo.png',
  'wolves': 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Wolves_Esports_logo.svg',
  'jdg': 'https://upload.wikimedia.org/wikipedia/commons/a/a1/JD_Gaming_logo.svg',
  'all-gamers': 'https://upload.wikimedia.org/wikipedia/commons/d/d1/All_Gamers_logo.png',
  'drg': 'https://upload.wikimedia.org/wikipedia/commons/9/91/Dragon_Ranger_Gaming_logo.png',
  'xlg': 'https://upload.wikimedia.org/wikipedia/commons/8/8c/XLG_Esports_logo.png'
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'ProSettingsEsportsBot/1.0 (https://prosettings.app; dev@prosettings.app) Node.js/18'
      }
    };
    const req = protocol.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed with status ${res.statusCode}`));
      }
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(true);
      });
    });
    req.on('error', (err) => reject(err));
  });
}

async function run() {
  console.log('Starting downloading Tier 1 team logos...');
  for (const [slug, url] of Object.entries(LOGO_SOURCES)) {
    const isSvg = url.endsWith('.svg');
    const ext = isSvg ? '.svg' : '.png';
    const filePath = path.join(TEAMS_DIR, `${slug}${ext}`);
    const pngPath = path.join(TEAMS_DIR, `${slug}.png`);

    console.log(`Downloading [${slug}] from ${url}...`);
    try {
      await downloadFile(url, filePath);
      console.log(`✓ Saved ${slug}${ext}`);
    } catch (err) {
      console.error(`✗ Error downloading ${slug}:`, err.message);
    }
    await delay(300); // 300ms delay to respect rate limits
  }
  console.log('Finished downloading team logos!');
}

run();
