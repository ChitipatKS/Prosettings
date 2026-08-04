import os
import json
import time
import urllib.request
import urllib.parse

TEAMS_DIR = os.path.join(os.path.dirname(__file__), '../public/images/teams')
os.makedirs(TEAMS_DIR, exist_ok=True)

# List of Tier 1 teams and search keywords / Wikipedia file titles
TEAM_TITLES = {
    'vitality': ['File:Team Vitality logo.svg', 'File:Team Vitality.svg'],
    'navi': ['File:Natus Vincere logo.svg', 'File:Natus Vincere logo 2021.svg'],
    'spirit': ['File:Team Spirit 2021 logo.svg', 'File:Team Spirit logo.svg'],
    'falcons': ['File:Team Falcons Logo.png', 'File:Team Falcons logo.svg'],
    'furia': ['File:FURIA Esports logo.svg', 'File:FURIA Esports logo.png'],
    'mouz': ['File:MOUZ logo.svg', 'File:Mousesports logo.svg'],
    'g2': ['File:G2 Esports logo.svg', 'File:G2 Esports logo.png'],
    'faze': ['File:FaZe Clan.svg', 'File:FaZe Clan logo.svg'],
    'mongolz': ['File:The Mongolz logo.png', 'File:The MongolZ logo.svg'],
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

    'sentinels': ['File:Sentinels logo.svg', 'File:Sentinels logo.png'],
    'loud': ['File:LOUD logo.svg', 'File:LOUD logo.png'],
    'nrg': ['File:NRG Esports logo.svg', 'File:NRG Esports logo 2021.svg'],
    'leviatan': ['File:Leviat%C3%A1n_logo.png', 'File:Leviatan logo.png'],
    '100-thieves': ['File:100 Thieves logo.svg', 'File:100 Thieves logo.png'],
    'cloud9': ['File:Cloud9 logo.svg', 'File:Cloud9.svg'],
    'evil-geniuses': ['File:Evil Geniuses logo.svg', 'File:Evil Geniuses logo 2020.svg'],
    'kru': ['File:KR%C3%9C_Esports_logo.svg', 'File:KRU Esports logo.png'],
    'envy': ['File:Team Envy logo.svg', 'File:Envy Gaming logo.svg'],

    'fnatic': ['File:Fnatic logo.svg', 'File:Fnatic logo 2020.svg'],
    'team-heretics': ['File:Team Heretics logo.svg', 'File:Team Heretics logo.png'],
    'karmine-corp': ['File:Karmine Corp logo.svg', 'File:Karmine Corp.svg'],
    'bbl': ['File:BBL Esports logo.png', 'File:BBL Esports logo.svg'],
    'giantx': ['File:GiantX logo.svg', 'File:GIANTX.svg'],
    'gentle-mates': ['File:Gentle Mates logo.png', 'File:Gentle Mates logo.svg'],
    'eternal-fire': ['File:Eternal Fire logo.svg', 'File:Eternal Fire logo.png'],

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
}

USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ProSettingsBot/1.0'

def get_wikimedia_url(file_title):
    api_url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(file_title)}&prop=imageinfo&iiprop=url&format=json"
    req = urllib.request.Request(api_url, headers={'User-Agent': USER_AGENT})
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            pages = data.get('query', {}).get('pages', {})
            for page_id, page in pages.items():
                if 'imageinfo' in page and len(page['imageinfo']) > 0:
                    return page['imageinfo'][0]['url']
    except Exception as e:
        pass
    return None

def download_image(url, dest_path):
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(req) as response, open(dest_path, 'wb') as out_file:
        out_file.write(response.read())

def run():
    print("Fetching Tier 1 team logos via MediaWiki API...")
    success_count = 0
    for slug, titles in TEAM_TITLES.items():
        found = False
        for title in titles:
            image_url = get_wikimedia_url(title)
            if image_url:
                ext = '.svg' if image_url.endswith('.svg') else '.png'
                dest_path = os.path.join(TEAMS_DIR, f"{slug}{ext}")
                png_dest = os.path.join(TEAMS_DIR, f"{slug}.png")
                try:
                    download_image(image_url, dest_path)
                    if ext == '.svg':
                        download_image(image_url, png_dest)
                    print(f"[OK] [{slug}] Downloaded from {title}")
                    found = True
                    success_count += 1
                    break
                except Exception as e:
                    print(f"[FAIL] [{slug}] Error saving: {e}")
            time.sleep(0.1)
        if not found:
            print(f"[MISSING] [{slug}] Logo not found on Wikimedia with titles")

    print(f"\nCompleted: {success_count}/{len(TEAM_TITLES)} logos fetched!")

if __name__ == '__main__':
    run()
