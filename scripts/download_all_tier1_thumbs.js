const fs = require('fs');
const path = require('path');
const https = require('https');

const TEAMS_DIR = path.join(__dirname, '../public/images/teams');
if (!fs.existsSync(TEAMS_DIR)) {
  fs.mkdirSync(TEAMS_DIR, { recursive: true });
}

const HEADERS = {
  'User-Agent': 'ProSettingsBot/1.0 (https://prosettings.app; dev@prosettings.app)'
};

const TEAMS_MAP = {
  // CS2
  'vitality': ['File:Team Vitality logo.svg', 'File:Team Vitality.svg'],
  'navi': ['File:Natus Vincere logo.svg', 'File:Natus Vincere.svg'],
  'spirit': ['File:Team Spirit 2021 logo.svg', 'File:Team Spirit logo.svg'],
  'falcons': ['File:Team Falcons Logo.png', 'File:Falcons Esports logo.svg'],
  'furia': ['File:FURIA Esports logo.svg', 'File:FURIA Esports logo.png'],
  'mouz': ['File:MOUZ logo.svg', 'File:Mousesports logo.svg'],
  'g2': ['File:G2 Esports logo.svg', 'File:G2 Esports logo.png'],
  'faze': ['File:FaZe Clan.svg', 'File:FaZe Clan logo.svg'],
  'mongolz': ['File:The Mongolz logo.png', 'File:The MongolZ logo.png'],
  'astralis': ['File:Astralis logo.svg', 'File:Astralis logo.png'],
  'liquid': ['File:Team Liquid logo 2020.svg', 'File:Team Liquid logo.svg'],
  'nip': ['File:Ninjas in Pyjamas logo (2021).svg', 'File:Ninjas in Pyjamas logo.svg'],
  'fut': ['File:FUT Esports logo.png', 'File:FUT Esports.png'],
  'gamerlegion': ['File:GamerLegion logo.png', 'File:GamerLegion logo.svg'],
  'legacy': ['File:Legacy Esports logo.png', 'File:Legacy logo.png'],
  'betboom': ['File:BetBoom Team logo.png', 'File:BetBoom Team.png'],
  'aurora': ['File:Aurora Gaming logo.png'],
  'parivision': ['File:Parivision logo.png', 'File:PARIVISION logo.png'],
  'mibr': ['File:MIBR logo.svg', 'File:Made in Brazil logo.svg'],
  '9z': ['File:9z Team logo.png', 'File:9z Team.png'],

  // VCT Pacific
  'paper-rex': ['File:Paper Rex logo.svg', 'File:Paper Rex logo.png'],
  'geng': ['File:Gen.G logo.svg', 'File:Gen.G logo.png'],
  'drx': ['File:DRX logo.svg', 'File:DRX logo.png'],
  't1': ['File:T1 logo.svg', 'File:T1 logo 2020.svg'],
  'zeta': ['File:ZETA DIVISION logo.svg', 'File:ZETA DIVISION.svg'],
  'dfm': ['File:DetonatioN FocusMe logo.svg', 'File:DetonatioN Gaming logo.svg'],
  'team-secret': ['File:Team Secret logo.svg', 'File:Team Secret.svg'],
  'global-esports': ['File:Global Esports logo.png'],
  'rrq': ['File:Rex Regum Qeon logo.png', 'File:RRQ logo.png'],
  'full-sense': ['File:Full Sense logo.png', 'File:FULL SENSE logo.png'],
  'nongshim': ['File:Nongshim RedForce logo.svg', 'File:Nongshim RedForce.png'],
  'varrel': ['File:VARREL logo.png', 'File:DONUTS VARREL logo.png'],

  // VCT Americas
  'sentinels': ['File:Sentinels logo.svg', 'File:Sentinels logo.png'],
  'loud': ['File:LOUD logo.svg', 'File:LOUD logo.png'],
  'nrg': ['File:NRG Esports logo.svg', 'File:NRG Esports logo 2021.svg'],
  'leviatan': ['File:Leviatán logo.png', 'File:Leviatan logo.png'],
  '100-thieves': ['File:100 Thieves logo.svg', 'File:100 Thieves logo.png'],
  'cloud9': ['File:Cloud9 logo.svg', 'File:Cloud9.svg'],
  'evil-geniuses': ['File:Evil Geniuses logo.svg', 'File:Evil Geniuses logo 2020.svg'],
  'kru': ['File:KRÜ Esports logo.svg', 'File:KRU Esports logo.png'],
  'envy': ['File:Team Envy logo.svg', 'File:Envy Gaming logo.svg'],

  // VCT EMEA
  'fnatic': ['File:Fnatic logo.svg', 'File:Fnatic logo 2020.svg'],
  'team-heretics': ['File:Team Heretics logo.svg', 'File:Team Heretics logo.png'],
  'karmine-corp': ['File:Karmine Corp logo.svg', 'File:Karmine Corp.svg'],
  'bbl': ['File:BBL Esports logo.png', 'File:BBL Esports logo.svg'],
  'giantx': ['File:GiantX logo.svg', 'File:GIANTX.svg'],
  'gentle-mates': ['File:Gentle Mates logo.png', 'File:Gentle Mates logo.svg'],
  'eternal-fire': ['File:Eternal Fire logo.svg', 'File:Eternal Fire logo.png'],

  // VCT China
  'edg': ['File:EDward Gaming logo.svg', 'File:EDward Gaming logo.png'],
  'bilibili': ['File:Bilibili Gaming logo.svg', 'File:Bilibili Gaming logo.png'],
  'fpx': ['File:FunPlus Phoenix logo.svg', 'File:FunPlus Phoenix.svg'],
  'trace-esports': ['File:Trace Esports logo.png'],
  'tyloo': ['File:TyLoo logo.png', 'File:TYLOO logo.svg'],
  'tec': ['File:Titan Esports Club logo.png'],
  'nova-esports': ['File:Nova Esports logo.png'],
  'wolves': ['File:Wolves Esports logo.svg', 'File:Wolverhampton Wanderers F.C. logo.svg'],
  'jdg': ['File:JD Gaming logo.svg', 'File:JD Gaming logo.png'],
  'all-gamers': ['File:All Gamers logo.png', 'File:AG SuperPlay logo.png'],
  'drg': ['File:Dragon Ranger Gaming logo.png'],
  'xlg': ['File:XLG Esports logo.png']
};

const delay = ms => new Promise(r => setTimeout(r, ms));

async function fetchWikiThumb(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&iiurlwidth=250&format=json`;
  return new Promise((resolve) => {
    https.get(url, { headers: HEADERS }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const pages = json.query?.pages || {};
          for (const pid in pages) {
            const info = pages[pid].imageinfo;
            if (info && info.length > 0) return resolve(info[0].thumburl || info[0].url);
          }
          resolve(null);
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function downloadFile(imgUrl, destPath) {
  return new Promise((resolve) => {
    https.get(imgUrl, { headers: HEADERS }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath).then(resolve);
      }
      if (res.statusCode !== 200) return resolve(false);
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(true);
      });
    }).on('error', () => resolve(false));
  });
}

async function run() {
  console.log('Downloading transparent 250px PNG logos for Tier 1 teams...');
  let count = 0;
  for (const [slug, titles] of Object.entries(TEAMS_MAP)) {
    let success = false;
    for (const title of titles) {
      const thumbUrl = await fetchWikiThumb(title);
      if (thumbUrl) {
        const dest = path.join(TEAMS_DIR, `${slug}.png`);
        const ok = await downloadFile(thumbUrl, dest);
        if (ok && fs.existsSync(dest) && fs.statSync(dest).size > 500) {
          console.log(`✓ [${slug}] Downloaded from ${title} (${fs.statSync(dest).size} bytes)`);
          success = true;
          count++;
          break;
        }
      }
      await delay(150);
    }
    if (!success) {
      console.log(`- [${slug}] Pending / fallback initial badge active`);
    }
    await delay(200);
  }
  console.log(`\nFinished! Successfully downloaded ${count}/${Object.keys(TEAMS_MAP).length} logos.`);
}

run();
