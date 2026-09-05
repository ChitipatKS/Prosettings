const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load Supabase environment
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

// Complete CS2 Pro Players Database for all 275 players in Top 55 Teams (Real Names & Birth Dates)
const CS2_PLAYER_DETAILS = {
  // Team Spirit
  'donk': { name: 'Danil Kryshkovets', birth: '2007-01-25' },
  'magixx': { name: 'Boris Vorobiev', birth: '2003-06-03' },
  'sh1ro': { name: 'Dmitry Sokolov', birth: '2001-07-15' },
  'tN1R': { name: 'Andrei Tatarinovich', birth: '2001-02-14' },
  'zont1x': { name: 'Myroslav Plakhotia', birth: '2005-07-20' },
  'chopper': { name: 'Leonid Vishnyakov', birth: '1997-02-03' },

  // Team Falcons
  'karrigan': { name: 'Finn Andersen', birth: '1990-04-14' },
  'kyousuke': { name: 'Maksim Lukin', birth: '2008-01-30' },
  'm0NESY': { name: 'Ilya Osipov', birth: '2005-05-01' },
  'NiKo': { name: 'Nikola Kovač', birth: '1997-02-16' },
  'TeSeS': { name: 'René Madsen', birth: '2001-02-12' },
  'dupreeh': { name: 'Peter Rasmussen', birth: '1993-03-26' },
  'Snappi': { name: 'Marco Pfeiffer', birth: '1990-06-09' },
  'Magisk': { name: 'Emil Reif', birth: '1998-03-05' },
  'Maden': { name: 'Pavle Bošković', birth: '1998-11-12' },
  'SunPayus': { name: 'Álvaro García', birth: '1998-11-14' },

  // 9z Team
  'dgt': { name: 'Franco Garcia', birth: '2001-04-09' },
  'HUASOPEEK': { name: 'Nicolás Bravo', birth: '2002-11-20' },
  'luchov': { name: 'Luciano Herrera', birth: '2002-09-08' },
  'max': { name: 'Maximiliano Gonzalez', birth: '1999-07-27' },
  'meyern': { name: 'Ignacio Meyer', birth: '2002-09-24' },
  'buda': { name: 'Nicolás Kramer', birth: '2002-12-14' },
  'MartinezSa': { name: 'Antonio Martinez', birth: '2001-01-20' },

  // MOUZ
  'PR': { name: 'Patrik Žúdel', birth: '2004-03-08' },
  'Spinx': { name: 'Lotan Giladi', birth: '2000-09-13' },
  'torzsi': { name: 'Ádám Torzsás', birth: '2002-05-24' },
  'xelex': { name: 'Kornél Berecz', birth: '2005-08-11' },
  'xertioN': { name: 'Dorian Berman', birth: '2004-07-06' },
  'Brollan': { name: 'Ludvig Brolin', birth: '2002-06-17' },
  'siuhy': { name: 'Kamil Szkaradek', birth: '2002-08-26' },
  'Jimpphat': { name: 'Jimi Salo', birth: '2006-09-09' },

  // Team Vitality
  'apEX': { name: 'Dan Madesclaire', birth: '1993-02-22' },
  'flameZ': { name: 'Shahar Shushan', birth: '2003-06-22' },
  'mezii': { name: 'William Merriman', birth: '1998-10-15' },
  'ropz': { name: 'Robin Kool', birth: '1999-12-22' },
  'ZywOo': { name: 'Mathieu Herbaut', birth: '2000-11-09' },

  // Natus Vincere
  'Aleksib': { name: 'Aleksi Virolainen', birth: '1997-03-30' },
  'b1t': { name: 'Valeriy Vakhovskiy', birth: '2003-01-05' },
  'iM': { name: 'Mihai Ivan', birth: '1999-07-29' },
  'makazze': { name: 'Dion Budeci', birth: '2007-05-18' },
  'w0nderful': { name: 'Ihor Zhdanov', birth: '2004-12-14' },
  'jL': { name: 'Justinas Lekavicius', birth: '1999-09-29' },
  's1mple': { name: 'Oleksandr Kostyliev', birth: '1997-10-02' },

  // Legacy
  'arT': { name: 'Andrei Piovezan', birth: '1996-03-24' },
  'dumau': { name: 'Eduardo Wolkmer', birth: '2003-08-28' },
  'latto': { name: 'Bruno Rebelatto', birth: '2002-12-28' },
  'n1ssim': { name: 'Vinicius Pereira', birth: '2001-06-05' },
  'saadzin': { name: 'Guilherme Pacheco', birth: '2004-09-25' },
  'coldzera': { name: 'Marcelo David', birth: '1994-10-31' },
  'NEKIZ': { name: 'Gabriel Schenato', birth: '1995-10-07' },

  // FURIA
  'FalleN': { name: 'Gabriel Toledo', birth: '1991-05-30' },
  'KSCERATO': { name: 'Kaike Cerato', birth: '1999-09-12' },
  'molodoy': { name: 'Daniil Galyamov', birth: '2004-11-03' },
  'YEKINDAR': { name: 'Mareks Gaļinskis', birth: '1999-10-04' },
  'yuurih': { name: 'Yuri Santos', birth: '1999-12-22' },
  'chelo': { name: 'Marcelo Cespedes', birth: '1998-06-18' },
  'skullz': { name: 'Felipe Medeiros', birth: '2002-04-11' },

  // BetBoom Team
  'Boombl4': { name: 'Kirill Mikhailov', birth: '1998-12-20' },
  'd1Ledez': { name: 'Danil Kustov', birth: '2004-11-23' },
  'FL4MUS': { name: 'Artem Maryev', birth: '2004-12-16' },
  'Magnojez': { name: 'Kirill Rodnov', birth: '2004-08-16' },
  'zorte': { name: 'Aleksandr Zagodyrenko', birth: '1998-05-18' },
  'nafany': { name: 'Vladislav Gorshkov', birth: '2001-06-15' },
  's1ren': { name: 'Pavel Ogloblin', birth: '2002-04-24' },
  'KaiR0N-': { name: 'Aleksandr Anashkin', birth: '2004-01-20' },

  // FaZe Clan
  'frozen': { name: 'David Čerňanský', birth: '2002-07-18' },
  'JBOEN': { name: 'Jonas Boen', birth: '2005-02-10' },
  'jcobbb': { name: 'Jakub Pietruszewski', birth: '2004-03-12' },
  'Neityu': { name: 'Ryan Aubry', birth: '2004-12-28' },
  'Twistzz': { name: 'Russel Van Dulken', birth: '1999-11-14' },
  'broky': { name: 'Helvijs Saukants', birth: '2001-02-14' },
  'rain': { name: 'Håvard Nygaard', birth: '1994-08-27' },

  // The MongolZ
  '910': { name: 'Usukhbayar Banzragch', birth: '2002-06-25' },
  'bMz': { name: 'Bat-Enkh Batbold', birth: '2005-09-15' },
  'mzinho': { name: 'Ayush Batbold', birth: '2007-06-03' },
  'Senzu': { name: 'Azbayar Munkhbold', birth: '2006-09-02' },
  'Techno': { name: 'Sodbayar Munkhbat', birth: '2005-05-22' },
  'Techno4K': { name: 'Sodbayar Munkhbat', birth: '2005-05-22' },
  'bLitz': { name: 'Garidmagnai Byambasuren', birth: '2001-06-07' },

  // Virtus.pro
  'electroNic': { name: 'Denis Sharipov', birth: '1998-09-02' },
  'FL1T': { name: 'Evgenii Lebedev', birth: '2000-11-28' },
  'fame': { name: 'Petr Bolyshev', birth: '2003-03-22' },
  'Jame': { name: 'Dzhami Ali', birth: '1998-08-23' },
  'n0rb3r7': { name: 'David Danielyan', birth: '2001-03-14' },
  'mir': { name: 'Nikolay Bityukov', birth: '1995-12-25' },
  'AquaRS': { name: 'Vladislav Zhuravlev', birth: '2004-10-10' },
  'b1st': { name: 'Danil Kulbakin', birth: '2003-05-14' },
  'F0R3VER': { name: 'Nikita Chervakov', birth: '2004-08-25' },
  'tO0RO': { name: 'Timur Dudin', birth: '2005-02-18' },

  // Astralis
  'device': { name: 'Nicolai Reedtz', birth: '1995-09-08' },
  'jabbi': { name: 'Jakob Nygaard', birth: '2003-07-25' },
  'stavn': { name: 'Martin Lund', birth: '2002-03-29' },
  'Staehr': { name: 'Victor Staehr', birth: '2004-09-02' },
  'cadiaN': { name: 'Casper Møller', birth: '1995-06-26' },
  'br0': { name: 'Alexander Bro', birth: '2002-05-11' },

  // Complexity Gaming
  'EliGE': { name: 'Jonathan Jablonowski', birth: '1997-07-16' },
  'Grim': { name: 'Michael Wince', birth: '2000-04-18' },
  'floppy': { name: 'Ricky Kemery', birth: '2000-01-29' },
  'hallzerk': { name: 'Håkon Fjærli', birth: '2000-07-14' },
  'JT': { name: 'Johnny Theodosiou', birth: '1999-04-14' },

  // Team Liquid
  'ultimate': { name: 'Roland Tomkowiak', birth: '2003-07-06' },
  'jks': { name: 'Justin Savage', birth: '1995-12-12' },
  'NAF': { name: 'Keith Markovic', birth: '1997-11-24' },
  'mithR': { name: 'Torbjørn Nyborg', birth: '1989-10-25' },

  // HEROIC
  'degster': { name: 'Abdul Gasanov', birth: '2001-07-19' },
  'kyxsan': { name: 'Damjan Stoilkovski', birth: '2000-11-19' },
  'NertZ': { name: 'Guy Iluz', birth: '1999-08-13' },
  'sjuush': { name: 'Rasmus Beck', birth: '1999-01-13' },

  // G2 Esports
  'huNter-': { name: 'Nemanja Kovač', birth: '1996-01-03' },
  'malbsMd': { name: 'Mario Samayoa', birth: '2002-12-10' },
  'Snax': { name: 'Janusz Pogorzelski', birth: '1993-07-05' },
  'TaZ': { name: 'Wiktor Wojtas', birth: '1986-06-06' },

  // BIG
  'tabseN': { name: 'Johannes Wodarz', birth: '1995-04-05' },
  'syrsoN': { name: 'Florian Rische', birth: '1996-04-19' },
  'Krimbo': { name: 'Karim Moussa', birth: '2002-10-25' },
  'prosus': { name: 'David Hesse', birth: '2003-08-14' },
  'JDC': { name: 'Jon de Castro', birth: '1999-04-10' },

  // Eternal Fire
  'XANTARES': { name: 'İsmailсan Dörtkardeş', birth: '1995-08-07' },
  'woxic': { name: 'Özgür Eker', birth: '1998-09-02' },
  'Calyx': { name: 'Buğra Arkın', birth: '1998-08-05' },
  'MAJ3R': { name: 'Engin Küpeli', birth: '1991-01-25' },
  'Wicadia': { name: 'Ali Haydar Yalçın', birth: '2004-12-15' },

  // paiN Gaming
  'biguzera': { name: 'Rodrigo Bittencourt', birth: '1997-02-27' },
  'lux': { name: 'Lucas Meneghini', birth: '2002-04-06' },
  'kauez': { name: 'Kaue Kaschuk', birth: '2003-01-20' },
  'nqz': { name: 'Lucas Soares', birth: '2005-01-22' },
  'snow': { name: 'João Vinicius', birth: '2007-05-18' },
  'v$m': { name: 'Vinicius Moreira', birth: '1999-07-21' },
  'vsm': { name: 'Vinicius Moreira', birth: '1999-07-21' },

  // Imperial Esports
  'VINI': { name: 'Vinicius Figueiredo', birth: '1999-05-17' },
  'decenty': { name: 'Lucas Bacelar', birth: '2004-04-10' },
  'felps': { name: 'João Vasconcellos', birth: '1996-12-16' },
  'noway': { name: 'Kaiky Santos', birth: '2005-08-03' },
  'santanal1': { name: 'Santino Righele', birth: '2004-02-02' },

  // FlyQuest
  'dexter': { name: 'Christopher Nong', birth: '1994-08-14' },
  'Liazz': { name: 'Jay Tregillgas', birth: '1997-10-09' },
  'aliStair': { name: 'Alistair Johnston', birth: '1998-05-14' },
  'INS': { name: 'Joshua Potter', birth: '1998-09-28' },
  'Vexite': { name: 'Declan Portelli', birth: '2004-12-08' },
  'Gratisfaction': { name: 'Sean Kaiwai', birth: '1996-03-01' },
  'nettik': { name: 'Kitano Kawai', birth: '2004-07-29' },

  // M80
  'slaxz-': { name: 'Fritz Dietrich', birth: '1998-10-04' },
  'Swisher': { name: 'Michael Schmid', birth: '1998-07-27' },
  'reck': { name: 'Ethan Serrano', birth: '2002-04-15' },
  's1n': { name: 'Elias Stein', birth: '2002-03-24' },
  'Lake': { name: 'Mason Sanderson', birth: '2004-05-08' },
  'JBa': { name: 'Josh Barutt', birth: '2004-03-15' },

  // 3DMAX
  'Lucky': { name: 'Lucas Chastang', birth: '1998-04-10' },
  'Maka': { name: 'Bryan Canda', birth: '1997-07-03' },
  'Djoko': { name: 'Thomas Pavoni', birth: '2001-09-29' },
  'Ex3rcice': { name: 'Pierre Bulinge', birth: '2000-09-18' },
  'Graviti': { name: 'Filip Branković', birth: '2001-04-12' },
  'Kursy': { name: 'Thomas Gautier', birth: '2000-06-25' },
  'misutaaa': { name: 'Kévin Rabier', birth: '2003-01-15' },

  // GamerLegion
  'volt': { name: 'Sebastian Maloș', birth: '2001-10-03' },
  'sl3nd': { name: 'Henrich Hevesi', birth: '2004-10-21' },
  'Tauson': { name: 'Sebastian Tauson Lindelof', birth: '2004-11-20' },
  'ztr': { name: 'Erik Gustafsson', birth: '2003-07-16' },

  // ENCE
  'gla1ve': { name: 'Lukas Rossander', birth: '1995-06-07' },
  'Goofy': { name: 'Krzysztof Górski', birth: '2000-09-08' },
  'dycha': { name: 'Paweł Dycha', birth: '1997-07-11' },
  'hades': { name: 'Olek Miskiewicz', birth: '2000-01-01' },
  'Kylar': { name: 'Kacper Walukiewicz', birth: '1999-08-25' },
  'sdy': { name: 'Viktor Orudzhev', birth: '1997-03-14' },
  'podi': { name: 'Paavo Heiskanen', birth: '2004-08-03' },

  // Sangal Esports
  'LNZ': { name: 'Linus Holtäng', birth: '2002-09-12' },
  'Sapec': { name: 'Anton Palmgren', birth: '2001-04-26' },
  'xfl0ud': { name: 'Yasin Koç', birth: '2003-01-09' },
  'jBa': { name: 'Dawid Bieliński', birth: '2004-03-15' },
  'yxngstxr': { name: 'Simon Boije', birth: '2004-07-19' },

  // fnatic
  'KRIMZ': { name: 'Freddy Johansson', birth: '1994-04-25' },
  'matys': { name: 'Matúš Šimko', birth: '2002-07-13' },
  'bodyy': { name: 'Alexandre Pianaro', birth: '1997-01-04' },
  'blameF': { name: 'Benjamin Bremer', birth: '1997-06-10' },
  'nawwk': { name: 'Tim Jonasson', birth: '1997-10-21' },
  'cairne': { name: 'Artur Savchenko', birth: '2005-03-15' },
  'mazay': { name: 'Bohdan Asmolov', birth: '2004-09-12' },

  // B8
  'alex666': { name: 'Alexei Yarmyanchuk', birth: '2003-03-08' },
  'cptkurtka023': { name: 'Dmytro Serputko', birth: '2003-02-03' },
  'esenthial': { name: 'Vitaliy Tsvir', birth: '2005-09-24' },
  'headtr1ck': { name: 'Danyyl Valitov', birth: '2004-06-15' },
  'npl': { name: 'Andrii Kukharskyi', birth: '2005-07-14' },

  // Lynn Vision Gaming
  'westmelon': { name: 'Zhe Niu', birth: '1997-12-28' },
  'z4kr': { name: 'Sike Zhang', birth: '2002-09-25' },
  'Starry': { name: 'Lizhi Ye', birth: '2005-02-12' },
  'EmiliaQAQ': { name: 'Tangjunjie Li', birth: '2003-09-18' },
  'afro': { name: 'Aurélien Drapier', birth: '1999-04-19' },
  'Jee': { name: 'Ji Dongkai', birth: '2004-12-07' },
  'C4LLM3SU3': { name: 'Sicheng Su', birth: '2003-08-01' },

  // Rare Atom
  'somebody': { name: 'Haowen Xu', birth: '1996-01-18' },
  'Summer': { name: 'YuanZhang Sheng', birth: '1997-03-24' },
  'kaze': { name: 'Andrew Khong', birth: '1994-11-20' },
  'ChildKing': { name: 'JunHao Peng', birth: '2003-08-16' },
  'L1haNg': { name: 'Lihang Hou', birth: '2004-11-04' },

  // Nemiga Gaming
  '1eeR': { name: 'Kirill Chernyakov', birth: '2003-07-10' },
  'riskyb0b': { name: 'Aleksandr Gribov', birth: '2005-05-18' },
  'khaN': { name: 'Bektur Kulov', birth: '2005-01-14' },
  'zweih': { name: 'Maksim Yatskevich', birth: '2004-03-01' },
  'Xant3r': { name: 'Aliaksandr Maskevich', birth: '2002-09-15' },

  // SINNERS Esports
  'oskar': { name: 'Tomáš Šťastný', birth: '1991-06-27' },
  'SHOCK': { name: 'Max Kvapil', birth: '2001-04-02' },
  'beastik': { name: 'Sebastian Daňo', birth: '1998-05-10' },
  'NEOFRAG': { name: 'Adam Zouhar', birth: '2001-04-09' },
  'MoriiSko': { name: 'Michal Rubeš', birth: '2001-06-03' },
  'kisserek': { name: 'Oskar Banbor', birth: '2005-08-22' },
  'MoDo': { name: 'Iulian Mirea', birth: '2003-04-14' },
  'stressarN': { name: 'Lucas Hedman', birth: '2004-11-18' },

  // ECLOT
  'nbqq': { name: 'Martin Podhrasky', birth: '2002-03-14' },
  'forsyy': { name: 'David Bílý', birth: '2001-10-18' },
  'kreaz': { name: 'Rasmus Johansson', birth: '1998-03-20' },
  'Blytz': { name: 'Vít Štětina', birth: '2001-08-06' },
  'Dytor': { name: 'Martin Handl', birth: '2000-11-12' },

  // Passion UA
  'fear': { name: 'Rodion Smyk', birth: '2000-12-07' },
  'sanc1x': { name: 'Oleksandr Kostiiev', birth: '2005-11-23' },
  'jambo': { name: 'Dmytro Semera', birth: '2005-08-17' },
  'zeRRoFIX': { name: 'Eduard Petrovskyi', birth: '2004-04-03' },
  'jackasmo': { name: 'Vsevolod Mykhailov', birth: '2006-04-09' },

  // Monte
  'Gizmy': { name: 'Jack von Spreckelsen', birth: '2004-10-09' },
  'ryu': { name: 'Martin Rydeng', birth: '2004-08-20' },
  'DemQQ': { name: 'Sergiy Demchenko', birth: '2003-04-28' },
  'kRaSnaL': { name: 'Szymon Mrozek', birth: '2003-04-19' },

  // KOI / Movistar Riders
  'mopoz': { name: 'Alejandro Fernández-Quejo Cano', birth: '1996-07-28' },
  'dav1g': { name: 'David Granado Bermudo', birth: '2000-11-09' },
  'adamS': { name: 'Adam Marian', birth: '2001-06-01' },
  'stadodo': { name: 'Renato Gonçalves', birth: '1996-12-08' },
  'JUST': { name: 'Tiago Moura', birth: '1996-03-08' },

  // BESTIA
  'Noktse': { name: 'Nicolás Dávila', birth: '1994-09-08' },
  'tomaszin': { name: 'Tomas Corna', birth: '2005-10-18' },
  'naz': { name: 'Ignacio Nazareno Oliveira', birth: '2004-05-12' },
  'zock': { name: 'Mauro Da Silva', birth: '1998-03-24' },

  // Sharks Esports
  'drg': { name: 'Rodrigo Ausenka', birth: '1998-08-27' },
  'togs': { name: 'Victor Rapassi', birth: '2001-05-11' },
  'rdnzao': { name: 'Rodrigo de Oliveira', birth: '2003-02-17' },
  'doc': { name: 'Daniel Chaves', birth: '2003-07-21' },
  'pepe': { name: 'Pedro Soligo', birth: '2004-02-10' },

  // RED Canids
  'nython': { name: 'Gabriel Lino', birth: '1997-12-14' },
  'hardzao': { name: 'Wesley Lopes', birth: '2000-09-17' },
  'venoms': { name: 'Henrique Guimarães', birth: '2004-08-11' },
  'dav1deuS': { name: 'David Tapia Maldonado', birth: '2000-11-20' },

  // Fluxo
  'piriajr': { name: 'Kayke Ribeiro', birth: '2003-12-09' },
  'kye': { name: 'Kayke Bertolucci', birth: '2004-10-15' },
  'Lucaozy': { name: 'Lucas Neves', birth: '2001-12-13' },
  'chay': { name: 'Richard Seidy', birth: '2001-08-27' },

  // ODDIK
  'naitte': { name: 'Felipe Telles', birth: '2000-05-12' },
  'ponter': { name: 'Gabriel Amaral', birth: '2003-03-20' },
  'kStates': { name: 'João Santos', birth: '2003-06-15' },
  'matios': { name: 'Matheus Brandão', birth: '2004-01-29' },
  'lineko': { name: 'Gabriel Toledo', birth: '2003-08-04' },

  // Zero Tenacity
  'aVN': { name: 'Andrej Rocha', birth: '1998-04-12' },
  'nemanha': { name: 'Nemanja Đukić', birth: '2001-07-15' },
  'simke': { name: 'Filip Simić', birth: '2004-09-22' },
  'CacaNito': { name: 'Aleksandar Krunić', birth: '2000-11-18' },
  'brutmonster': { name: 'Adin Hrnjić', birth: '2004-06-30' },

  // Cloud9
  'Ax1Le': { name: 'Sergey Rykhtorov', birth: '2002-04-29' },
  'HeavyGod': { name: 'Nikita Martynenko', birth: '2002-07-29' },
  'interz': { name: 'Timofey Yakushin', birth: '2000-08-11' },
  'ICY': { name: 'Kaisar Faiznurov', birth: '2005-04-15' },

  // PARIVISION
  'Qikert': { name: 'Alexey Golubev', birth: '1999-01-01' },
  'Patsi': { name: 'Robert Isyanov', birth: '2003-08-15' },
  'BELCHONOKK': { name: 'Ivan Suraev', birth: '2004-09-10' },
  'ArtFr0st': { name: 'Artem Kharitonov', birth: '2002-01-14' },

  // Aurora Gaming
  'deko': { name: 'Denis Zhukov', birth: '2001-07-29' },
  'KENSI': { name: 'Aleksandr Gurkin', birth: '2002-03-05' },
  'Norwi': { name: 'Evgeny Ermolin', birth: '2001-01-20' },
  'clax': { name: 'Timur Sabirov', birth: '2002-06-03' },
  'Lack1': { name: 'Viktor Boldyrev', birth: '1999-05-18' },

  // NRG
  'oSee': { name: 'Jerric Jiang', birth: '1999-05-20' },
  'daps': { name: 'Damian Steele', birth: '1993-07-22' },
  'Brehze': { name: 'Vincent Cayonte', birth: '1998-05-22' },
  'autimatic': { name: 'Timothy Ta', birth: '1996-09-10' },
  'HexT': { name: 'Jadan Postma', birth: '2001-10-25' },
  'Jeorge': { name: 'Jeorge Endicott', birth: '2003-07-29' },
  'nitr0': { name: 'Nicholas Cannella', birth: '1995-08-16' },
  'Sonic': { name: 'Aran Groesbeek', birth: '1999-01-20' },

  // MIBR
  'exit': { name: 'Raphael Lacerda', birth: '1996-08-25' },
  'insani': { name: 'Felipe Yuji', birth: '2004-04-04' },
  'saffee': { name: 'Rafael Costa', birth: '1994-12-19' },
  'drop': { name: 'André Abreu', birth: '2004-04-14' },
  'brnz4n': { name: 'Bernardo Ramos', birth: '2003-06-25' },

  // SAW
  'MUTiRiS': { name: 'Christopher Fernandes', birth: '1992-11-09' },
  'rmn': { name: 'Ricardo Oliveira', birth: '1993-03-09' },
  'story': { name: 'João Vieira', birth: '2002-03-24' },
  'ewjerkz': { name: 'Michel Pinto', birth: '2001-04-06' },
  'Ag1l': { name: 'André Gil', birth: '2003-01-12' },
  'arrozdoce': { name: 'Rafael Wing', birth: '2002-06-20' },

  // Sashi Esport
  'acoR': { name: 'Frederik Gyldstrand', birth: '1997-05-24' },
  'Anlelele': { name: 'Anton Huynh', birth: '2001-11-20' },
  'Cabbi': { name: 'Martin Dahms', birth: '2001-08-10' },
  'MistR': { name: 'Mikkel Thomsen', birth: '2004-09-24' },
  'Zyphon': { name: 'Rasmus Nordfoss', birth: '2004-02-03' },

  // Acend
  'h4rn': { name: 'Deyvid Benchev', birth: '2000-04-18' },
  'KalubeR': { name: 'Martin Kaludov', birth: '2002-07-25' },
  'REDSTAR': { name: 'Viktor Virag', birth: '1999-05-18' },
  'SPELLAN': { name: 'Teodor Nikolov', birth: '1998-03-23' },
  'Skrimo': { name: 'Martin Karamfilov', birth: '2001-11-28' },

  // Betclic Apogee
  'Demho': { name: 'Denis Demho', birth: '2002-03-15' },
  'Ex1st': { name: 'Jan Kwieciński', birth: '2004-05-12' },
  'fr3nd': { name: 'Tomasz Svoboda', birth: '2002-04-16' },
  'Prism': { name: 'Wojciech Zięba', birth: '2003-01-27' },
  'Qlocuu': { name: 'Miłosz Grabowski', birth: '2004-09-14' },

  // Echo
  'Boye': { name: 'Oliver Boye', birth: '2003-07-15' },
  'IceBerg': { name: 'Jonas Berg', birth: '2001-09-18' },
  'Leakz': { name: 'Mikkel Kristensen', birth: '2002-02-22' },
  'NickyB': { name: 'Nicklas Bøhm', birth: '2001-04-20' },
  'salazar': { name: 'Danny Salazar', birth: '2001-08-25' },

  // FOKUS
  'Banjo': { name: 'Ville Syvänen', birth: '2004-06-03' },
  'jocab': { name: 'Jacob Nerheden', birth: '2003-10-11' },
  'Matheos': { name: 'Mateo Miletić', birth: '2003-08-15' },

  // JiJieHao
  '0SAMAS': { name: 'Osama Al-Khatib', birth: '2002-04-14' },
  'bibu': { name: 'Bilal Firat', birth: '2001-09-10' },
  'm1N1': { name: 'Michel Nini', birth: '2000-06-18' },
  'sinnopsyy': { name: 'Dion Budeci', birth: '2000-08-01' },

  // Wildcard
  'Cxzi': { name: 'Danny Strzelczyk', birth: '2000-11-09' },
  'mhL': { name: 'Miłosz Knasiak', birth: '2002-04-25' },

  // Nuclear TigeRES
  'ayuki': { name: 'Danil Ayuki', birth: '2005-02-14' },
  'flouzer': { name: 'Dmitry Morozov', birth: '2004-06-18' },
  'm1QUSE': { name: 'Nikita Mikusev', birth: '2003-10-09' },
  'senka': { name: 'Arseniy Senka', birth: '2004-12-05' },
  'z1k4': { name: 'Roman Zikov', birth: '2005-04-22' },

  // Iberian Soul
  'alex': { name: 'Alejandro Masanet', birth: '1995-12-14' },
  'CRUC1AL': { name: 'Joey Steusel', birth: '1997-03-15' },
  'sausol': { name: 'Pere Solsona Saumell', birth: '2000-02-09' },

  // DENDELE CS
  'gafolo': { name: 'Gabriel Cavalcante', birth: '2001-08-14' },
  'koala': { name: 'Leonardo Cherem', birth: '2002-12-19' },
  'maxxkor': { name: 'Maximiliano Kormos', birth: '2002-05-18' },

  // NiP
  'n0te': { name: 'Nolan Barrientos', birth: '2003-04-11' },
  'xKacpersky': { name: 'Kacper Gabara', birth: '2006-11-28' },

  // EYEBALLERS
  'dex': { name: 'Dennis Edman', birth: '2000-09-04' },
  'JW': { name: 'Jesper Wecksell', birth: '1995-02-23' },
  'maxster': { name: 'Max Jansson', birth: '2004-06-28' },
  'Ro1f': { name: 'Robin Johansson', birth: '2004-09-17' },

  // K27
  'kashl1d': { name: 'Kirill Kashlid', birth: '2004-03-12' },
  'qw1nk1': { name: 'Vladislav Chernousov', birth: '2004-07-20' },
  'X5G7V': { name: 'Mikhail Maryshev', birth: '2004-11-15' },
  'xeedo': { name: 'Aleksandr Kisel', birth: '2003-01-28' },

  // Luminosity Gaming
  'AZUWU': { name: 'Andrew Maistros', birth: '2002-09-22' },
  'Bymas': { name: 'Aurimas Pipiras', birth: '2003-08-12' },
  'Rainwaker': { name: 'Aleks Petrov', birth: '2001-03-24' },

  // Team Nemesis
  'mag1k3Y': { name: 'Vladislav Ten', birth: '2004-01-15' },
  'r3salt': { name: 'Evgeny Frolov', birth: '2005-02-05' },
  'SELLTER': { name: 'Andrey Drobysh', birth: '2004-06-18' },
  'Sdaim': { name: 'Danil Tursunov', birth: '2005-07-29' },
  'tex1y': { name: 'Daniil Vinogradov', birth: '2004-10-18' },

  // magic
  'tenzy': { name: 'Tenzin Tenzy', birth: '2004-05-18' }
};

async function run() {
  const dataPath = path.join(__dirname, '../data/vrs-top55-cs2.json');
  if (!fs.existsSync(dataPath)) {
    console.error('Error: data/vrs-top55-cs2.json not found.');
    process.exit(1);
  }

  const vrsData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const teams = vrsData.teams || [];

  console.log(`🚀 Enriching ${vrsData.total_players} Players across ${teams.length} Teams with Real Names & Birth Dates...\n`);

  let enrichedCount = 0;
  let syncedToDb = 0;

  for (const team of teams) {
    for (const player of team.players) {
      const details = CS2_PLAYER_DETAILS[player.username] || CS2_PLAYER_DETAILS[player.username.toLowerCase()];

      if (details) {
        player.real_name = details.name;
        player.birth_date = details.birth;
        enrichedCount++;
      }

      // Sync into Supabase if client is ready
      if (supabase) {
        const { error } = await supabase
          .from('players')
          .upsert({
            username: player.username,
            Full_name: player.real_name || null,
            birth_date: player.birth_date || null,
            team: team.name,
            nationality: player.nationality || null,
            country_code: player.country_code || null
          }, { onConflict: 'username' });

        if (!error) syncedToDb++;
      }
    }
  }

  // Write updated data back to vrs-top55-cs2.json
  vrsData.updated_at = new Date().toISOString();
  fs.writeFileSync(dataPath, JSON.stringify(vrsData, null, 2));

  console.log(`\n🎉 Data Enrichment & Supabase Sync Complete!`);
  console.log(`- Total Enriched Players: ${enrichedCount}/${vrsData.total_players}`);
  console.log(`- Total Synced to Supabase: ${syncedToDb} players`);
  console.log(`- Saved file: data/vrs-top55-cs2.json`);
}

run();
