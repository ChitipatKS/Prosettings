import os
import json
import urllib.request

TEAMS_DIR = os.path.join(os.path.dirname(__file__), '../public/images/teams')
os.makedirs(TEAMS_DIR, exist_ok=True)

# Direct transparent PNG/SVG URLs for Tier 1 teams from reliable CDNs (GitHub / Wikimedia uploads / Esports APIs)
DIRECT_LOGOS = {
    'vitality': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/Team%20Vitality/logo.png',
    'navi': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/Natus%20Vincere/logo.png',
    'spirit': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/Team%20Spirit/logo.png',
    'falcons': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Team_Falcons_Logo.png/500px-Team_Falcons_Logo.png',
    'furia': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/FURIA%20Esports/logo.png',
    'mouz': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/mousesports/logo.png',
    'g2': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/G2%20Esports/logo.png',
    'faze': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/FaZe%20Clan/logo.png',
    'mongolz': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/dc/The_Mongolz_logo.png/500px-The_Mongolz_logo.png',
    'astralis': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/Astralis/logo.png',
    'liquid': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/Team%20Liquid/logo.png',
    'nip': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/Ninjas%20in%20Pyjamas/logo.png',
    'fut': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/FUT_Esports_logo.png/500px-FUT_Esports_logo.png',
    'gamerlegion': 'https://upload.wikimedia.org/wikipedia/en/thumb/9/9f/GamerLegion_logo.png/500px-GamerLegion_logo.png',
    'legacy': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Legacy_Esports_logo.png/500px-Legacy_Esports_logo.png',
    'betboom': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/BetBoom_Team_logo.png/500px-BetBoom_Team_logo.png',
    'aurora': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Aurora_Gaming_logo.png/500px-Aurora_Gaming_logo.png',
    'parivision': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Parivision_logo.png/500px-Parivision_logo.png',
    'mibr': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/MIBR/logo.png',
    '9z': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/9z_Team_logo.png/500px-9z_Team_logo.png',

    'paper-rex': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/Paper%20Rex/logo.png',
    'geng': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/Gen.G/logo.png',
    'drx': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/DRX/logo.png',
    't1': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/T1/logo.png',
    'zeta': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/ZETA%20DIVISION/logo.png',
    'dfm': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/DetonatioN%20FocusMe/logo.png',
    'team-secret': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/Team%20Secret/logo.png',
    'global-esports': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Global_Esports_logo.png/500px-Global_Esports_logo.png',
    'rrq': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/RRQ_logo.png/500px-RRQ_logo.png',
    'full-sense': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Full_Sense_logo.png/500px-Full_Sense_logo.png',
    'nongshim': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/Nongshim%20RedForce/logo.png',
    'varrel': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/VARREL_logo.png/500px-VARREL_logo.png',

    'sentinels': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/Sentinels/logo.png',
    'loud': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/LOUD/logo.png',
    'nrg': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/NRG/logo.png',
    'leviatan': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/Leviat%C3%A1n/logo.png',
    '100-thieves': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/100%20Thieves/logo.png',
    'cloud9': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/Cloud9/logo.png',
    'evil-geniuses': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/Evil%20Geniuses/logo.png',
    'kru': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/KR%C3%9C%20Esports/logo.png',
    'envy': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/Envy/logo.png',

    'fnatic': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/Fnatic/logo.png',
    'team-heretics': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/Team%20Heretics/logo.png',
    'karmine-corp': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/Karmine%20Corp/logo.png',
    'bbl': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/BBL_Esports_logo.png/500px-BBL_Esports_logo.png',
    'giantx': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/GiantX_logo.svg/500px-GiantX_logo.svg.png',
    'gentle-mates': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Gentle_Mates_logo.png/500px-Gentle_Mates_logo.png',
    'eternal-fire': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Eternal_Fire_logo.svg/500px-Eternal_Fire_logo.svg.png',

    'edg': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/EDward%20Gaming/logo.png',
    'bilibili': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/Bilibili%20Gaming/logo.png',
    'fpx': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/FunPlus%20Phoenix/logo.png',
    'trace-esports': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Trace_Esports_logo.png/500px-Trace_Esports_logo.png',
    'tyloo': 'https://raw.githubusercontent.com/denolfe/esports-logos/master/logos/TYLOO/logo.png',
    'tec': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Titan_Esports_Club_logo.png/500px-Titan_Esports_Club_logo.png',
    'nova-esports': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Nova_Esports_logo.png/500px-Nova_Esports_logo.png',
    'wolves': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Wolves_Esports_logo.svg/500px-Wolves_Esports_logo.svg.png',
    'jdg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/JD_Gaming_logo.svg/500px-JD_Gaming_logo.svg.png',
    'all-gamers': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/All_Gamers_logo.png/500px-All_Gamers_logo.png',
    'drg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Dragon_Ranger_Gaming_logo.png/500px-Dragon_Ranger_Gaming_logo.png',
    'xlg': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/XLG_Esports_logo.png/500px-XLG_Esports_logo.png'
}

def download_file(url, dest_path):
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response, open(dest_path, 'wb') as f:
        f.write(response.read())

def run():
    print("Downloading direct transparent logos...")
    success = 0
    for slug, url in DIRECT_LOGOS.items():
        dest = os.path.join(TEAMS_DIR, f"{slug}.png")
        try:
            download_file(url, dest)
            size = os.path.getsize(dest)
            if size > 1000:
                print(f"[OK] {slug} ({size} bytes)")
                success += 1
            else:
                print(f"[WARN] {slug} file small ({size} bytes)")
        except Exception as e:
            print(f"[FAIL] {slug}: {e}")
    print(f"\nDone! {success}/{len(DIRECT_LOGOS)} downloaded.")

if __name__ == '__main__':
    run()
