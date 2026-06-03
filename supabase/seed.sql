-- Copa dos Amigos — Seed: Fase de Grupos Copa 2026
-- 72 jogos, 12 grupos (A-L), 4 times por grupo
-- Horários em BRT (UTC-3). MD3 = simultâneos dentro do grupo.
-- Execute SOMENTE se matches estiver vazia: DELETE FROM matches WHERE stage = 'Fase de Grupos';

INSERT INTO matches (home_team, away_team, home_iso, away_iso, match_date, stage, group_name, city, stadium) VALUES

-- ===================== GRUPO A =====================
-- México(mx), Coreia do Sul(kr), Rep. Tcheca(cz), África do Sul(za)
-- MD1
('México',       'Coreia do Sul', 'mx',     'kr', '2026-06-11T14:00:00-03:00', 'Fase de Grupos', 'A', 'Dallas',       'AT&T Stadium'),
('Rep. Tcheca',  'África do Sul', 'cz',     'za', '2026-06-11T18:00:00-03:00', 'Fase de Grupos', 'A', 'Kansas City',  'Arrowhead Stadium'),
-- MD2
('México',       'Rep. Tcheca',   'mx',     'cz', '2026-06-17T14:00:00-03:00', 'Fase de Grupos', 'A', 'Dallas',       'AT&T Stadium'),
('Coreia do Sul','África do Sul', 'kr',     'za', '2026-06-17T18:00:00-03:00', 'Fase de Grupos', 'A', 'Kansas City',  'Arrowhead Stadium'),
-- MD3 (simultâneos)
('México',       'África do Sul', 'mx',     'za', '2026-06-25T14:00:00-03:00', 'Fase de Grupos', 'A', 'Dallas',       'AT&T Stadium'),
('Rep. Tcheca',  'Coreia do Sul', 'cz',     'kr', '2026-06-25T14:00:00-03:00', 'Fase de Grupos', 'A', 'Kansas City',  'Arrowhead Stadium'),

-- ===================== GRUPO B =====================
-- Suíça(ch), Canadá(ca), Bósnia e Herz.(ba), Qatar(qa)
-- MD1
('Suíça',          'Canadá',        'ch', 'ca', '2026-06-11T21:00:00-03:00', 'Fase de Grupos', 'B', 'Vancouver', 'BC Place'),
('Bósnia e Herz.', 'Qatar',         'ba', 'qa', '2026-06-12T01:00:00-03:00', 'Fase de Grupos', 'B', 'Toronto',   'BMO Field'),
-- MD2
('Suíça',          'Bósnia e Herz.','ch', 'ba', '2026-06-17T21:00:00-03:00', 'Fase de Grupos', 'B', 'Vancouver', 'BC Place'),
('Canadá',         'Qatar',         'ca', 'qa', '2026-06-18T01:00:00-03:00', 'Fase de Grupos', 'B', 'Toronto',   'BMO Field'),
-- MD3 (simultâneos)
('Suíça',          'Qatar',         'ch', 'qa', '2026-06-25T17:00:00-03:00', 'Fase de Grupos', 'B', 'Vancouver', 'BC Place'),
('Canadá',         'Bósnia e Herz.','ca', 'ba', '2026-06-25T17:00:00-03:00', 'Fase de Grupos', 'B', 'Toronto',   'BMO Field'),

-- ===================== GRUPO C =====================
-- Brasil(br), Marrocos(ma), Escócia(gb-sct), Haiti(ht)
-- MD1
('Brasil',   'Marrocos', 'br',     'ma', '2026-06-12T14:00:00-03:00', 'Fase de Grupos', 'C', 'Los Angeles', 'SoFi Stadium'),
('Escócia',  'Haiti',    'gb-sct', 'ht', '2026-06-12T18:00:00-03:00', 'Fase de Grupos', 'C', 'Miami',       'Hard Rock Stadium'),
-- MD2
('Brasil',   'Escócia',  'br',     'gb-sct', '2026-06-18T14:00:00-03:00', 'Fase de Grupos', 'C', 'Los Angeles', 'SoFi Stadium'),
('Marrocos', 'Haiti',    'ma',     'ht',     '2026-06-18T18:00:00-03:00', 'Fase de Grupos', 'C', 'Miami',       'Hard Rock Stadium'),
-- MD3 (simultâneos)
('Brasil',  'Haiti',    'br',     'ht',     '2026-06-25T20:00:00-03:00', 'Fase de Grupos', 'C', 'Los Angeles', 'SoFi Stadium'),
('Escócia', 'Marrocos', 'gb-sct', 'ma',     '2026-06-25T20:00:00-03:00', 'Fase de Grupos', 'C', 'Miami',       'Hard Rock Stadium'),

-- ===================== GRUPO D =====================
-- Estados Unidos(us), Austrália(au), Turquia(tr), Paraguai(py)
-- MD1
('Estados Unidos', 'Austrália', 'us', 'au', '2026-06-12T21:00:00-03:00', 'Fase de Grupos', 'D', 'East Rutherford', 'MetLife Stadium'),
('Turquia',        'Paraguai',  'tr', 'py', '2026-06-13T01:00:00-03:00', 'Fase de Grupos', 'D', 'Foxborough',      'Gillette Stadium'),
-- MD2
('Estados Unidos', 'Turquia',   'us', 'tr', '2026-06-18T21:00:00-03:00', 'Fase de Grupos', 'D', 'East Rutherford', 'MetLife Stadium'),
('Austrália',      'Paraguai',  'au', 'py', '2026-06-19T01:00:00-03:00', 'Fase de Grupos', 'D', 'Foxborough',      'Gillette Stadium'),
-- MD3 (simultâneos)
('Estados Unidos', 'Paraguai',  'us', 'py', '2026-06-25T23:00:00-03:00', 'Fase de Grupos', 'D', 'East Rutherford', 'MetLife Stadium'),
('Turquia',        'Austrália', 'tr', 'au', '2026-06-25T23:00:00-03:00', 'Fase de Grupos', 'D', 'Foxborough',      'Gillette Stadium'),

-- ===================== GRUPO E =====================
-- Alemanha(de), Equador(ec), Costa do Marfim(ci), Curaçao(cw)
-- MD1
('Alemanha',       'Equador',        'de', 'ec', '2026-06-13T14:00:00-03:00', 'Fase de Grupos', 'E', 'Denver',  'Empower Field'),
('Costa do Marfim','Curaçao',        'ci', 'cw', '2026-06-13T18:00:00-03:00', 'Fase de Grupos', 'E', 'Houston', 'NRG Stadium'),
-- MD2
('Alemanha',       'Costa do Marfim','de', 'ci', '2026-06-19T14:00:00-03:00', 'Fase de Grupos', 'E', 'Denver',  'Empower Field'),
('Equador',        'Curaçao',        'ec', 'cw', '2026-06-19T18:00:00-03:00', 'Fase de Grupos', 'E', 'Houston', 'NRG Stadium'),
-- MD3 (simultâneos)
('Alemanha',       'Curaçao',        'de', 'cw', '2026-06-26T14:00:00-03:00', 'Fase de Grupos', 'E', 'Denver',  'Empower Field'),
('Costa do Marfim','Equador',        'ci', 'ec', '2026-06-26T14:00:00-03:00', 'Fase de Grupos', 'E', 'Houston', 'NRG Stadium'),

-- ===================== GRUPO F =====================
-- Países Baixos(nl), Japão(jp), Suécia(se), Tunísia(tn)
-- MD1
('Países Baixos', 'Japão',   'nl', 'jp', '2026-06-13T21:00:00-03:00', 'Fase de Grupos', 'F', 'Santa Clara', 'Levi''s Stadium'),
('Suécia',        'Tunísia', 'se', 'tn', '2026-06-14T01:00:00-03:00', 'Fase de Grupos', 'F', 'Pasadena',    'Rose Bowl'),
-- MD2
('Países Baixos', 'Suécia',  'nl', 'se', '2026-06-19T21:00:00-03:00', 'Fase de Grupos', 'F', 'Santa Clara', 'Levi''s Stadium'),
('Japão',         'Tunísia', 'jp', 'tn', '2026-06-20T01:00:00-03:00', 'Fase de Grupos', 'F', 'Pasadena',    'Rose Bowl'),
-- MD3 (simultâneos)
('Países Baixos', 'Tunísia', 'nl', 'tn', '2026-06-26T17:00:00-03:00', 'Fase de Grupos', 'F', 'Santa Clara', 'Levi''s Stadium'),
('Suécia',        'Japão',   'se', 'jp', '2026-06-26T17:00:00-03:00', 'Fase de Grupos', 'F', 'Pasadena',    'Rose Bowl'),

-- ===================== GRUPO G =====================
-- Bélgica(be), Irã(ir), Nova Zelândia(nz), Egito(eg)
-- MD1
('Bélgica',      'Irã',         'be', 'ir', '2026-06-14T14:00:00-03:00', 'Fase de Grupos', 'G', 'Dallas',  'AT&T Stadium'),
('Nova Zelândia','Egito',       'nz', 'eg', '2026-06-14T18:00:00-03:00', 'Fase de Grupos', 'G', 'Houston', 'NRG Stadium'),
-- MD2
('Bélgica',      'Nova Zelândia','be','nz', '2026-06-20T14:00:00-03:00', 'Fase de Grupos', 'G', 'Dallas',  'AT&T Stadium'),
('Irã',          'Egito',       'ir', 'eg', '2026-06-20T18:00:00-03:00', 'Fase de Grupos', 'G', 'Houston', 'NRG Stadium'),
-- MD3 (simultâneos)
('Bélgica',      'Egito',       'be', 'eg', '2026-06-26T20:00:00-03:00', 'Fase de Grupos', 'G', 'Dallas',  'AT&T Stadium'),
('Nova Zelândia','Irã',         'nz', 'ir', '2026-06-26T20:00:00-03:00', 'Fase de Grupos', 'G', 'Houston', 'NRG Stadium'),

-- ===================== GRUPO H =====================
-- Espanha(es), Uruguai(uy), Arábia Saudita(sa), Cabo Verde(cv)
-- MD1
('Espanha',       'Uruguai',       'es', 'uy', '2026-06-14T21:00:00-03:00', 'Fase de Grupos', 'H', 'Cidade do México', 'Estadio Azteca'),
('Arábia Saudita','Cabo Verde',    'sa', 'cv', '2026-06-15T01:00:00-03:00', 'Fase de Grupos', 'H', 'Guadalajara',      'Estadio Akron'),
-- MD2
('Espanha',       'Arábia Saudita','es', 'sa', '2026-06-20T21:00:00-03:00', 'Fase de Grupos', 'H', 'Cidade do México', 'Estadio Azteca'),
('Uruguai',       'Cabo Verde',    'uy', 'cv', '2026-06-21T01:00:00-03:00', 'Fase de Grupos', 'H', 'Guadalajara',      'Estadio Akron'),
-- MD3 (simultâneos)
('Espanha',       'Cabo Verde',    'es', 'cv', '2026-06-26T23:00:00-03:00', 'Fase de Grupos', 'H', 'Cidade do México', 'Estadio Azteca'),
('Arábia Saudita','Uruguai',       'sa', 'uy', '2026-06-26T23:00:00-03:00', 'Fase de Grupos', 'H', 'Guadalajara',      'Estadio Akron'),

-- ===================== GRUPO I =====================
-- França(fr), Senegal(sn), Noruega(no), Iraque(iq)
-- MD1
('França',   'Senegal', 'fr', 'sn', '2026-06-15T14:00:00-03:00', 'Fase de Grupos', 'I', 'Monterrey',  'Estadio BBVA'),
('Noruega',  'Iraque',  'no', 'iq', '2026-06-15T18:00:00-03:00', 'Fase de Grupos', 'I', 'Guadalajara','Estadio Akron'),
-- MD2
('França',   'Noruega', 'fr', 'no', '2026-06-21T14:00:00-03:00', 'Fase de Grupos', 'I', 'Monterrey',  'Estadio BBVA'),
('Senegal',  'Iraque',  'sn', 'iq', '2026-06-21T18:00:00-03:00', 'Fase de Grupos', 'I', 'Guadalajara','Estadio Akron'),
-- MD3 (simultâneos)
('França',   'Iraque',  'fr', 'iq', '2026-06-27T14:00:00-03:00', 'Fase de Grupos', 'I', 'Monterrey',  'Estadio BBVA'),
('Noruega',  'Senegal', 'no', 'sn', '2026-06-27T14:00:00-03:00', 'Fase de Grupos', 'I', 'Guadalajara','Estadio Akron'),

-- ===================== GRUPO J =====================
-- Argentina(ar), Áustria(at), Argélia(dz), Jordânia(jo)
-- MD1
('Argentina', 'Áustria',  'ar', 'at', '2026-06-15T21:00:00-03:00', 'Fase de Grupos', 'J', 'East Rutherford', 'MetLife Stadium'),
('Argélia',   'Jordânia', 'dz', 'jo', '2026-06-16T01:00:00-03:00', 'Fase de Grupos', 'J', 'Pasadena',        'Rose Bowl'),
-- MD2
('Argentina', 'Argélia',  'ar', 'dz', '2026-06-21T21:00:00-03:00', 'Fase de Grupos', 'J', 'East Rutherford', 'MetLife Stadium'),
('Áustria',   'Jordânia', 'at', 'jo', '2026-06-22T01:00:00-03:00', 'Fase de Grupos', 'J', 'Pasadena',        'Rose Bowl'),
-- MD3 (simultâneos)
('Argentina', 'Jordânia', 'ar', 'jo', '2026-06-27T17:00:00-03:00', 'Fase de Grupos', 'J', 'East Rutherford', 'MetLife Stadium'),
('Áustria',   'Argélia',  'at', 'dz', '2026-06-27T17:00:00-03:00', 'Fase de Grupos', 'J', 'Pasadena',        'Rose Bowl'),

-- ===================== GRUPO K =====================
-- Portugal(pt), Colômbia(co), Rep. Dem. Congo(cd), Uzbequistão(uz)
-- MD1
('Portugal',        'Colômbia',     'pt', 'co', '2026-06-16T14:00:00-03:00', 'Fase de Grupos', 'K', 'Filadélfia', 'Lincoln Financial Field'),
('Rep. Dem. Congo', 'Uzbequistão',  'cd', 'uz', '2026-06-16T18:00:00-03:00', 'Fase de Grupos', 'K', 'Santa Clara','Levi''s Stadium'),
-- MD2
('Portugal',        'Rep. Dem. Congo','pt','cd','2026-06-22T14:00:00-03:00', 'Fase de Grupos', 'K', 'Filadélfia', 'Lincoln Financial Field'),
('Colômbia',        'Uzbequistão',  'co', 'uz', '2026-06-22T18:00:00-03:00', 'Fase de Grupos', 'K', 'Santa Clara','Levi''s Stadium'),
-- MD3 (simultâneos)
('Portugal',        'Uzbequistão',  'pt', 'uz', '2026-06-27T20:00:00-03:00', 'Fase de Grupos', 'K', 'Filadélfia', 'Lincoln Financial Field'),
('Rep. Dem. Congo', 'Colômbia',     'cd', 'co', '2026-06-27T20:00:00-03:00', 'Fase de Grupos', 'K', 'Santa Clara','Levi''s Stadium'),

-- ===================== GRUPO L =====================
-- Inglaterra(gb-eng), Croácia(hr), Gana(gh), Panamá(pa)
-- MD1
('Inglaterra', 'Croácia', 'gb-eng', 'hr', '2026-06-16T21:00:00-03:00', 'Fase de Grupos', 'L', 'Los Angeles', 'SoFi Stadium'),
('Gana',       'Panamá',  'gh',     'pa', '2026-06-17T01:00:00-03:00', 'Fase de Grupos', 'L', 'Denver',      'Empower Field'),
-- MD2
('Inglaterra', 'Gana',    'gb-eng', 'gh', '2026-06-22T21:00:00-03:00', 'Fase de Grupos', 'L', 'Los Angeles', 'SoFi Stadium'),
('Croácia',    'Panamá',  'hr',     'pa', '2026-06-23T01:00:00-03:00', 'Fase de Grupos', 'L', 'Denver',      'Empower Field'),
-- MD3 (simultâneos)
('Inglaterra', 'Panamá',  'gb-eng', 'pa', '2026-06-27T23:00:00-03:00', 'Fase de Grupos', 'L', 'Los Angeles', 'SoFi Stadium'),
('Gana',       'Croácia', 'gh',     'hr', '2026-06-27T23:00:00-03:00', 'Fase de Grupos', 'L', 'Denver',      'Empower Field');

-- Verificação: deve retornar 72
-- SELECT COUNT(*) FROM matches WHERE stage = 'Fase de Grupos';
