const fs = require('fs');
const path = require('path');
const https = require('https');

const TEAMS_DIR = path.join(__dirname, '../public/images/teams');
if (!fs.existsSync(TEAMS_DIR)) {
  fs.mkdirSync(TEAMS_DIR, { recursive: true });
}

const TEAMS_MAP = {
  // CS2
  'vitality': ['File:Team Vitality logo.svg', 'File:Team Vitality.svg', 'File:Team_Vitality_logo.svg'],
  'navi': ['File:Natus Vincere logo.svg', 'File:Natus Vincere.svg', 'File:Natus Vincere logo 2021.svg', 'File:Natus_Vincere_logo.png'],
  'spirit': ['File:Team Spirit 2021 logo.svg', 'File:Team Spirit logo.svg', 'File:Team Spirit.png', 'File:Team_Spirit_logo.svg'],
  'falcons': ['File:Team Falcons Logo.png', 'File:Falcons Esports logo.svg', 'File:Team Falcons.png', 'File:Team Falcons logo.svg'],
  'furia': ['File:FURIA Esports logo.svg', 'File:FURIA Esports logo.png', 'File:FURIA Esports.svg', 'File:FURIA_Esports_logo.png'],
  'mouz': ['File:MOUZ logo.svg', 'File:Mousesports logo.svg', 'File:MOUZ.svg'],
  'g2': ['File:G2 Esports logo.svg', 'File:G2 Esports logo.png', 'File:G2 Esports.svg'],
  'faze': ['File:FaZe Clan.svg', 'File:FaZe Clan logo.svg', 'File:FaZe Clan logo.png'],
  'mongolz': ['File:The Mongolz logo.png', 'File:The MongolZ logo.png', 'File:The Mongolz.png'],
  'astralis': ['File:Astralis logo.svg', 'File:Astralis logo.png', 'File:Astralis.svg'],
  'liquid': ['File:Team Liquid logo 2020.svg', 'File:Team Liquid logo.svg', 'File:Team Liquid.svg'],
  'nip': ['File:Ninjas in Pyjamas logo (2021).svg', 'File:Ninjas in Pyjamas logo.svg', 'File:Ninjas in Pyjamas.svg'],
  'fut': ['File:FUT Esports logo.png', 'File:FUT Esports.png', 'File:FUT Esports logo.svg'],
  'gamerlegion': ['File:GamerLegion logo.png', 'File:GamerLegion logo.svg', 'File:GamerLegion.png'],
  'legacy': ['File:Legacy Esports logo.png', 'File:Legacy logo.png', 'File:Legacy Esports.png'],
  'betboom': ['File:BetBoom Team logo.png', 'File:BetBoom Team.png', 'File:BetBoom_Team_logo.png'],
  'aurora': ['File:Aurora Gaming logo.png', 'File:Aurora Gaming.png'],
  'parivision': ['File:Parivision logo.png', 'File:PARIVISION logo.png', 'File:Parivision.png'],
  'mibr': ['File:MIBR logo.svg', 'File:Made in Brazil logo.svg', 'File:MIBR.svg'],
  '9z': ['File:9z Team logo.png', 'File:9z Team.png', 'File:9z_Team_logo.png'],

  // VCT Pacific
  'paper-rex': ['File:Paper Rex logo.svg', 'File:Paper Rex logo.png', 'File:Paper Rex.svg'],
  'geng': ['File:Gen.G logo.svg', 'File:Gen.G logo.png', 'File:Gen.G_Esports_logo.svg'],
  'drx': ['File:DRX logo.svg', 'File:DRX logo.png', 'File:DRX_VS_logo.png'],
  't1': ['File:T1 logo.svg', 'File:T1 logo 2020.svg', 'File:T1.svg'],
  'zeta': ['File:ZETA DIVISION logo.svg', 'File:ZETA DIVISION.svg', 'File:ZETA DIVISION logo.png'],
  'dfm': ['File:DetonatioN FocusMe logo.svg', 'File:DetonatioN Gaming logo.svg', 'File:DetonatioN_FocusMe_logo.svg'],
  'team-secret': ['File:Team Secret logo.svg', 'File:Team Secret.svg', 'File:Team_Secret_logo.svg'],
  'global-esports': ['File:Global Esports logo.png', 'File:Global Esports.png'],
  'rrq': ['File:Rex Regum Qeon logo.png', 'File:RRQ logo.png', 'File:Rex Regum Qeon.png'],
  'full-sense': ['File:Full Sense logo.png', 'File:FULL SENSE logo.png', 'File:FULL_SENSE_logo.png'],
  'nongshim': ['File:Nongshim RedForce logo.svg', 'File:Nongshim RedForce.png', 'File:Nongshim_RedForce_logo.svg'],
  'varrel': ['File:VARREL logo.png', 'File:DONUTS VARREL logo.png'],

  // VCT Americas
  'sentinels': ['File:Sentinels logo.svg', 'File:Sentinels logo.png', 'File:Sentinels.svg'],
  'loud': ['File:LOUD logo.svg', 'File:LOUD logo.png', 'File:LOUD.svg'],
  'nrg': ['File:NRG Esports logo.svg', 'File:NRG Esports logo 2021.svg', 'File:NRG_Esports_logo.svg'],
  'leviatan': ['File:Leviatán logo.png', 'File:Leviatan logo.png', 'File:Leviatan Esports.png'],
  '100-thieves': ['File:100 Thieves logo.svg', 'File:100 Thieves logo.png', 'File:100_Thieves_logo.svg'],
  'cloud9': ['File:Cloud9 logo.svg', 'File:Cloud9.svg', 'File:Cloud9_logo.svg'],
  'evil-geniuses': ['File:Evil Geniuses logo.svg', 'File:Evil Geniuses logo 2020.svg', 'File:Evil_Geniuses_logo.svg'],
  'kru': ['File:KRÜ Esports logo.svg', 'File:KRU Esports logo.png', 'File:KRÜ_Esports_logo.png'],
  'envy': ['File:Team Envy logo.svg', 'File:Envy Gaming logo.svg', 'File:Team_Envy_logo.svg'],

  // VCT EMEA
  'fnatic': ['File:Fnatic logo.svg', 'File:Fnatic logo 2020.svg', 'File:Fnatic.svg'],
  'team-heretics': ['File:Team Heretics logo.svg', 'File:Team Heretics logo.png', 'File:Team_Heretics_logo.svg'],
  'karmine-corp': ['File:Karmine Corp logo.svg', 'File:Karmine Corp.svg', 'File:Karmine_Corp_logo.svg'],
  'bbl': ['File:BBL Esports logo.png', 'File:BBL Esports logo.svg', 'File:BBL_Esports.png'],
  'giantx': ['File:GiantX logo.svg', 'File:GIANTX.svg', 'File:GIANTX_logo.svg'],
  'gentle-mates': ['File:Gentle Mates logo.png', 'File:Gentle Mates logo.svg', 'File:Gentle_Mates.png'],
  'eternal-fire': ['File:Eternal Fire logo.svg', 'File:Eternal Fire logo.png', 'File:Eternal_Fire_logo.svg'],

  // VCT China
  'edg': ['File:EDward Gaming logo.svg', 'File:EDward Gaming logo.png', 'File:EDward_Gaming_logo.svg'],
  'bilibili': ['File:Bilibili Gaming logo.svg', 'File:Bilibili Gaming logo.png', 'File:Bilibili_Gaming_logo.svg'],
  'fpx': ['File:FunPlus Phoenix logo.svg', 'File:FunPlus Phoenix.svg', 'File:FunPlus_Phoenix_logo.svg'],
  'trace-esports': ['File:Trace Esports logo.png', 'File:Trace_Esports.png'],
  'tyloo': ['File:TyLoo logo.png', 'File:TYLOO logo.svg', 'File:TyLoo_logo.png'],
  'tec': ['File:Titan Esports Club logo.png', 'File:Titan_Esports_Club.png'],
  'nova-esports': ['File:Nova Esports logo.png', 'File:Nova_Esports.png'],
  'wolves': ['File:Wolves Esports logo.svg', 'File:Wolverhampton Wanderers F.C. logo.svg', 'File:Wolverhampton_Wanderers_FC_logo.svg'],
  'jdg': ['File:JD Gaming logo.svg', 'File:JD Gaming logo.png', 'File:JD_Gaming_logo.svg'],
  'all-gamers': ['File:All Gamers logo.png', 'File:AG SuperPlay logo.png', 'File:All_Gamers.png'],
  'drg': ['File:Dragon Ranger Gaming logo.png', 'File:Dragon_Ranger_Gaming.png'],
  'xlg': ['File:XLG Esports logo.png', 'File:XLG_Esports.png']
};

const delay = ms => new Promise(res => setTimeout(res, ms));

async function fetchWikiImage(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&format=json`;
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'ProSettingsBot/1.0 (https://prosettings.app; dev@prosettings.app)'
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const pages = json.query?.pages || {};
          for (const pid in pages) {
            const info = pages[pid].imageinfo;
            if (info && info.length > 0) return resolve(info[0].url);
          }
          resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function downloadFile(imgUrl, destPath) {
  return new Promise((resolve) => {
    https.get(imgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    }, (res) => {
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
  console.log('Downloading Tier 1 team logos via Wikipedia MediaWiki API...');
  let count = 0;
  for (const [slug, titles] of Object.entries(TEAMS_MAP)) {
    let success = false;
    for (const title of titles) {
      const url = await fetchWikiImage(title);
      if (url) {
        const isSvg = url.toLowerCase().endsWith('.svg');
        const mainPath = path.join(TEAMS_DIR, `${slug}.png`);
        const ok = await downloadFile(url, mainPath);
        if (ok) {
          if (isSvg) {
            const svgPath = path.join(TEAMS_DIR, `${slug}.svg`);
            await downloadFile(url, svgPath);
          }
          console.log(`✓ [${slug}] Downloaded from ${title}`);
          success = true;
          count++;
          break;
        }
      }
      await delay(100);
    }
    if (!success) {
      console.log(`- [${slug}] Pending / fallback initialized`);
    }
    await delay(150);
  }
  console.log(`\nFinished! Successfully fetched ${count}/${Object.keys(TEAMS_MAP).length} logos.`);
}

run();
