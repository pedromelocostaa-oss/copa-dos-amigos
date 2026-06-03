// Static team data: FIFA ranking (April 2026), coach, key players
export const TEAMS: Record<string, {
  fifaRank: number
  coach: string
  players: string[]
  iso: string
  group: string
}> = {
  'Argentina':        { fifaRank: 1,  coach: 'Lionel Scaloni',    iso: 'ar', group: 'J', players: ['Lionel Messi','Emiliano Martínez','Rodrigo De Paul','Julián Álvarez','Enzo Fernández'] },
  'França':           { fifaRank: 2,  coach: 'Didier Deschamps',  iso: 'fr', group: 'I', players: ['Kylian Mbappé','Antoine Griezmann','Aurélien Tchouaméni','Mike Maignan','Marcus Thuram'] },
  'Espanha':          { fifaRank: 3,  coach: 'Luis de la Fuente', iso: 'es', group: 'H', players: ['Pedri','Rodri','Lamine Yamal','Dani Carvajal','Álvaro Morata'] },
  'Países Baixos':    { fifaRank: 4,  coach: 'Ronald Koeman',     iso: 'nl', group: 'F', players: ['Virgil van Dijk','Frenkie de Jong','Cody Gakpo','Xavi Simons','Memphis Depay'] },
  'Inglaterra':       { fifaRank: 5,  coach: 'Thomas Tuchel',     iso: 'gb-eng', group: 'L', players: ['Jude Bellingham','Harry Kane','Phil Foden','Bukayo Saka','Jordan Pickford'] },
  'Portugal':         { fifaRank: 6,  coach: 'Roberto Martínez',  iso: 'pt', group: 'K', players: ['Cristiano Ronaldo','Bernardo Silva','Rúben Dias','Bruno Fernandes','Diogo Costa'] },
  'Brasil':           { fifaRank: 7,  coach: 'Carlo Ancelotti',   iso: 'br', group: 'C', players: ['Vinícius Jr.','Rodrygo','Casemiro','Alisson','Marquinhos'] },
  'Bélgica':          { fifaRank: 8,  coach: 'Domenico Tedesco',  iso: 'be', group: 'G', players: ['Kevin De Bruyne','Romelu Lukaku','Thibaut Courtois','Yannick Carrasco','Axel Witsel'] },
  'Alemanha':         { fifaRank: 9,  coach: 'Julian Nagelsmann', iso: 'de', group: 'E', players: ['Florian Wirtz','Jamal Musiala','Manuel Neuer','Joshua Kimmich','Kai Havertz'] },
  'Uruguai':          { fifaRank: 10, coach: 'Marcelo Bielsa',    iso: 'uy', group: 'H', players: ['Federico Valverde','Darwin Núñez','Luis Suárez','Rodrigo Bentancur','Ronald Araújo'] },
  'Marrocos':         { fifaRank: 14, coach: 'Walid Regragui',    iso: 'ma', group: 'C', players: ['Achraf Hakimi','Hakim Ziyech','Yassine Bounou','Sofyan Amrabat','Youssef En-Nesyri'] },
  'Japão':            { fifaRank: 15, coach: 'Hajime Moriyasu',   iso: 'jp', group: 'F', players: ['Takumi Minamino','Takefusa Kubo','Ritsu Doan','Shuichi Gonda','Wataru Endo'] },
  'México':           { fifaRank: 16, coach: 'Javier Aguirre',    iso: 'mx', group: 'A', players: ['Hirving Lozano','Raúl Jiménez','Guillermo Ochoa','Edson Álvarez','Santiago Giménez'] },
  'Estados Unidos':   { fifaRank: 16, coach: 'Mauricio Pochettino',iso: 'us',group: 'D', players: ['Christian Pulisic','Tyler Adams','Matt Turner','Weston McKennie','Gio Reyna'] },
  'Croácia':          { fifaRank: 13, coach: 'Zlatko Dalić',      iso: 'hr', group: 'L', players: ['Luka Modrić','Ivan Perišić','Mateo Kovačić','Dominik Livaković','Joško Gvardiol'] },
  'Colômbia':         { fifaRank: 11, coach: 'Néstor Lorenzo',    iso: 'co', group: 'K', players: ['Luis Díaz','James Rodríguez','Jhon Córdoba','Yerry Mina','Davinson Sánchez'] },
  'Itália':           { fifaRank: 12, coach: 'Luciano Spalletti', iso: 'it', group: '-', players: ['Federico Chiesa','Gianluigi Donnarumma','Marco Verratti','Ciro Immobile','Leonardo Bonucci'] },
  'Suíça':            { fifaRank: 18, coach: 'Murat Yakin',       iso: 'ch', group: 'B', players: ['Granit Xhaka','Xherdan Shaqiri','Yann Sommer','Manuel Akanji','Breel Embolo'] },
  'Senegal':          { fifaRank: 19, coach: 'Aliou Cissé',       iso: 'sn', group: 'I', players: ['Sadio Mané','Édouard Mendy','Kalidou Koulibaly','Idrissa Gueye','Ismaïla Sarr'] },
  'Dinamarca':        { fifaRank: 20, coach: 'Brian Riemer',       iso: 'dk', group: '-', players: ['Christian Eriksen','Pierre-Emile Højbjerg','Kasper Schmeichel','Simon Kjær','Jonas Wind'] },
  'Equador':          { fifaRank: 24, coach: 'Sébastien Beccacece',iso: 'ec',group: 'E', players: ['Moisés Caicedo','Enner Valencia','Félix Torres','Piero Hincapié','Jeremy Sarmiento'] },
  'Austrália':        { fifaRank: 25, coach: 'Tony Popovic',       iso: 'au', group: 'D', players: ['Mathew Ryan','Aaron Mooy','Mitch Duke','Harry Souttar','Ajdin Hrustic'] },
  'Canadá':           { fifaRank: 26, coach: 'Jesse Marsch',       iso: 'ca', group: 'B', players: ['Alphonso Davies','Jonathan David','Cyle Larin','Milan Borjan','Stephen Eustáquio'] },
  'Coreia do Sul':    { fifaRank: 23, coach: 'Hong Myung-bo',      iso: 'kr', group: 'A', players: ['Heung-min Son','Lee Kang-in','Kim Min-jae','Hwang Hee-chan','Cho Gue-sung'] },
  'Arábia Saudita':   { fifaRank: 28, coach: 'Roberto Mancini',    iso: 'sa', group: 'H', players: ['Salem Al-Dawsari','Mohammed Al-Owais','Yasser Al-Shahrani','Firas Al-Buraikan','Sami Al-Najei'] },
  'Noruega':          { fifaRank: 21, coach: 'Ståle Solbakken',    iso: 'no', group: 'I', players: ['Erling Haaland','Martin Ødegaard','Alexander Sørloth','Ørjan Nyland','Sander Berge'] },
  'Escócia':          { fifaRank: 38, coach: 'Steve Clarke',        iso: 'gb-sct', group: 'C', players: ['Andrew Robertson','Kieran Tierney','Scott McTominay','Billy Gilmour','Che Adams'] },
  'Turquia':          { fifaRank: 29, coach: 'Vincenzo Montella',  iso: 'tr', group: 'D', players: ['Hakan Çalhanoğlu','Arda Güler','Kenan Yıldız','Mert Günok','Zeki Çelik'] },
  'Áustria':          { fifaRank: 22, coach: 'Ralf Rangnick',      iso: 'at', group: 'J', players: ['David Alaba','Marcel Sabitzer','Christoph Baumgartner','Patrick Pentz','Stefan Posch'] },
  'Paraguai':         { fifaRank: 52, coach: 'Gustavo Alfaro',     iso: 'py', group: 'D', players: ['Miguel Almirón','Gastón Giménez','Gustavo Gómez','Robert Rojas','Julio Enciso'] },
  'Argélia':          { fifaRank: 32, coach: 'Vladimir Petkovic',   iso: 'dz', group: 'J', players: ['Riyad Mahrez','Islam Slimani','Youcef Atal','Andy Delort','Houssem Aouar'] },
  'Rep. Tcheca':      { fifaRank: 34, coach: 'Ivan Hašek',          iso: 'cz', group: 'A', players: ['Tomáš Souček','Vladimír Coufal','Patrik Schick','Lukáš Hrádecký','Ondřej Duda'] },
  'Bósnia e Herz.':   { fifaRank: 59, coach: 'Sergej Barbarez',    iso: 'ba', group: 'B', players: ['Edin Džeko','Sead Kolašinac','Miralem Pjanić','Aleksandar Dragović','Anel Ahmedhodžić'] },
  'Qatar':            { fifaRank: 63, coach: 'Márquez López',       iso: 'qa', group: 'B', players: ['Akram Afif','Hassan Al-Haydos','Almoez Ali','Bassam Al-Rawi','Meshaal Barsham'] },
  'África do Sul':    { fifaRank: 59, coach: 'Hugo Broos',          iso: 'za', group: 'A', players: ['Percy Tau','Themba Zwane','Ronwen Williams','Bafana Bafana','Sipho Mbule'] },
  'Haiti':            { fifaRank: 87, coach: 'Marc Collat',         iso: 'ht', group: 'C', players: ['Duckens Nazon','Frantzdy Pierrot','Steeven Saba','Kévin Lafrance','Ricardo Ade'] },
  'Suécia':           { fifaRank: 35, coach: 'Jon Dahl Tomasson',   iso: 'se', group: 'F', players: ['Zlatan Ibrahimović','Viktor Gyökeres','Dejan Kulusevski','Alexander Isak','Emil Forsberg'] },
  'Tunísia':          { fifaRank: 29, coach: 'Faouzi Benzarti',     iso: 'tn', group: 'F', players: ['Wahbi Khazri','Youssef Msakni','Seifeddine Jaziri','Aymen Dahmen','Dylan Bronn'] },
  'Irã':              { fifaRank: 22, coach: 'Amir Ghalenoei',      iso: 'ir', group: 'G', players: ['Sardar Azmoun','Mehdi Taremi','Alireza Jahanbakhsh','Hossein Hosseini','Saman Ghoddos'] },
  'Nova Zelândia':    { fifaRank: 90, coach: 'Darren Bazeley',      iso: 'nz', group: 'G', players: ['Chris Wood','Clayton Lewis','Michael Boxall','Stefan Marinovic','Liberato Cacace'] },
  'Egito':            { fifaRank: 44, coach: 'Hossam El-Badry',     iso: 'eg', group: 'G', players: ['Mohamed Salah','Mostafa Mohamed','Ahmed El-Shenawy','Omar Marmoush','Trezeguet'] },
  'Cabo Verde':       { fifaRank: 41, coach: 'Pedro Brito',          iso: 'cv', group: 'H', players: ['Garry Rodrigues','Jovane Cabral','Lisandro','Ryan Mendes','Diney Borges'] },
  'Iraque':           { fifaRank: 68, coach: 'Jesús Casas',          iso: 'iq', group: 'I', players: ['Hussain Ali','Amjad Attwan','Jalal Hassan','Sherko Kareem','Ibrahim Bayesh'] },
  'Jordânia':         { fifaRank: 73, coach: 'Ammar Sabah',          iso: 'jo', group: 'J', players: ['Ahmad Hayel','Yazan Al-Naimat','Omar Al-Dardour','Baha Faisal','Mousa Al-Tamari'] },
  'Portugal (Rep. Dem. Congo)': { fifaRank: 55, coach: 'Sébastien Desabre', iso: 'cd', group: 'K', players: ['Cédric Bakambu','Chancel Mbemba','Gaël Kakuta','Glody Likonza','Marcel Tisserand'] },
  'Rep. Dem. Congo':  { fifaRank: 55, coach: 'Sébastien Desabre',   iso: 'cd', group: 'K', players: ['Cédric Bakambu','Chancel Mbemba','Gaël Kakuta','Glody Likonza','Marcel Tisserand'] },
  'Uzbequistão':      { fifaRank: 61, coach: 'Srecko Katanec',       iso: 'uz', group: 'K', players: ['Jaloliddin Masharipov','Eldor Shomurodov','Abbosbek Fayzullaev','Khojiakbar Alijonov','Bunyod Bakaev'] },
  'Costa do Marfim':  { fifaRank: 60, coach: 'Emerse Faé',           iso: 'ci', group: 'E', players: ['Sébastien Haller','Franck Kessié','Serge Aurier','Wilfried Zaha','Simon Deli'] },
  'Curaçao':          { fifaRank: 83, coach: 'Remko Bicentini',      iso: 'cw', group: 'E', players: ['Leandro Bacuna','Cuco Martina','Terrence Boyd','Charlton Vicento','Elson Hooi'] },
  'Gana':             { fifaRank: 53, coach: 'Otto Addo',             iso: 'gh', group: 'L', players: ['Thomas Partey','Mohammed Kudus','André Ayew','Jordan Ayew','Inaki Williams'] },
  'Panamá':           { fifaRank: 48, coach: 'Thomas Christiansen',  iso: 'pa', group: 'L', players: ['Rolando Blackburn','Édgar Bárcenas','César Yanis','Óscar Linton','Roderick Miller'] },
}

export function getTeamData(teamName: string) {
  return TEAMS[teamName] ?? null
}
