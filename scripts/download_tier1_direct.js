const fs = require('fs');
const path = require('path');
const https = require('https');

const TEAMS_DIR = path.join(__dirname, '../public/images/teams');
if (!fs.existsSync(TEAMS_DIR)) {
  fs.mkdirSync(TEAMS_DIR, { recursive: true });
}

// Known transparent logo URLs for Tier 1 teams
const DIRECT_URLS = {
  '100-thieves': 'https://upload.wikimedia.org/wikipedia/commons/1/16/100_Thieves_logo.svg',
  'paper-rex': 'https://upload.wikimedia.org/wikipedia/en/d/d3/Paper_Rex_logo.svg',
  'fnatic': 'https://upload.wikimedia.org/wikipedia/en/4/43/Fnatic_logo.svg',
  'sentinels': 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Sentinels_logo.svg',
  'g2': 'https://upload.wikimedia.org/wikipedia/en/1/1b/G2_Esports_logo.svg',
  'navi': 'https://upload.wikimedia.org/wikipedia/en/4/49/Natus_Vincere_logo.svg',
  'spirit': 'https://upload.wikimedia.org/wikipedia/commons/2/23/Team_Spirit_2021_logo.svg',
  'astralis': 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Astralis_logo.svg',
  'vitality': 'https://upload.wikimedia.org/wikipedia/en/4/49/Team_Vitality_logo.svg',
  't1': 'https://upload.wikimedia.org/wikipedia/commons/4/40/T1_logo.svg',
  'loud': 'https://upload.wikimedia.org/wikipedia/commons/6/69/LOUD_logo.svg',
  'drx': 'https://upload.wikimedia.org/wikipedia/commons/b/be/DRX_logo.svg',
  'geng': 'https://upload.wikimedia.org/wikipedia/en/e/e0/Gen.G_logo.svg',
  'edg': 'https://upload.wikimedia.org/wikipedia/commons/a/ab/EDward_Gaming_logo.svg',
  'fpx': 'https://upload.wikimedia.org/wikipedia/commons/2/29/FunPlus_Phoenix_logo.svg',
  'bilibili': 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Bilibili_Gaming_logo.svg',
  'nrg': 'https://upload.wikimedia.org/wikipedia/commons/0/07/NRG_Esports_logo.svg',
  'faze': 'https://upload.wikimedia.org/wikipedia/commons/4/43/FaZe_Clan.svg',
  'liquid': 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Team_Liquid_logo_2020.svg',
  'nip': 'https://upload.wikimedia.org/wikipedia/en/c/c6/Ninjas_in_Pyjamas_logo_%282021%29.svg',
  'mibr': 'https://upload.wikimedia.org/wikipedia/en/3/3e/MIBR_logo.svg',
  'cloud9': 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Cloud9_logo.svg',
  'kru': 'https://upload.wikimedia.org/wikipedia/commons/c/cc/KR%C3%9C_Esports_logo.svg',
  'envy': 'https://upload.wikimedia.org/wikipedia/commons/b/be/Team_Envy_logo.svg',
  'team-heretics': 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Team_Heretics_logo.svg',
  'karmine-corp': 'https://upload.wikimedia.org/wikipedia/commons/8/85/Karmine_Corp_logo.svg',
  'eternal-fire': 'https://upload.wikimedia.org/wikipedia/commons/5/52/Eternal_Fire_logo.svg',
  'zeta': 'https://upload.wikimedia.org/wikipedia/commons/1/18/ZETA_DIVISION_logo.svg',
  'team-secret': 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Team_Secret_logo.svg',
  'dfm': 'https://upload.wikimedia.org/wikipedia/en/6/6f/DetonatioN_FocusMe_logo.svg',
  'nongshim': 'https://upload.wikimedia.org/wikipedia/commons/3/37/Nongshim_RedForce_logo.svg',
  'furia': 'https://upload.wikimedia.org/wikipedia/en/3/30/FURIA_Esports_logo.svg',
  'mouz': 'https://upload.wikimedia.org/wikipedia/en/3/38/MOUZ_logo.svg'
};

async function download(url, dest) {
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve);
      }
      if (res.statusCode !== 200) return resolve(false);
      const stream = fs.createWriteStream(dest);
      res.pipe(stream);
      stream.on('finish', () => {
        stream.close();
        resolve(true);
      });
    }).on('error', () => resolve(false));
  });
}

async function run() {
  console.log('Downloading direct transparent logo files...');
  for (const [slug, url] of Object.entries(DIRECT_URLS)) {
    const isSvg = url.endsWith('.svg');
    const pngDest = path.join(TEAMS_DIR, `${slug}.png`);
    const svgDest = path.join(TEAMS_DIR, `${slug}.svg`);

    const ok = await download(url, isSvg ? svgDest : pngDest);
    if (ok && isSvg) {
      fs.copyFileSync(svgDest, pngDest);
    }
    console.log(`${ok ? '✓' : '✗'} ${slug}`);
  }
  console.log('Finished downloading direct team logos!');
}

run();
