-- V3: Seed responder data (Ghana-based locations — Accra, Kumasi, Takoradi)

-- Police Stations
INSERT INTO responders (id, name, responder_type, latitude, longitude, available) VALUES
(gen_random_uuid(), 'Accra Central Police Station',   'POLICE', 5.5502,  -0.2174, TRUE),
(gen_random_uuid(), 'Osu Police Station',             'POLICE', 5.5580,  -0.1802, TRUE),
(gen_random_uuid(), 'Tema Police Station',            'POLICE', 5.6698,  -0.0166, TRUE),
(gen_random_uuid(), 'Kumasi Central Police Station',  'POLICE', 6.6885,   1.6244, TRUE),
(gen_random_uuid(), 'Takoradi Police Station',        'POLICE', 4.8989,  -1.7577, TRUE);

-- Fire Service Stations
INSERT INTO responders (id, name, responder_type, latitude, longitude, available) VALUES
(gen_random_uuid(), 'Accra Fire Station',             'FIRE',   5.5480,  -0.2190, TRUE),
(gen_random_uuid(), 'Tema Fire Station',              'FIRE',   5.6710,  -0.0130, TRUE),
(gen_random_uuid(), 'Kumasi Fire Station',            'FIRE',   6.6870,   1.6230, TRUE),
(gen_random_uuid(), 'Takoradi Fire Station',          'FIRE',   4.9010,  -1.7560, TRUE),
(gen_random_uuid(), 'Sunyani Fire Station',           'FIRE',   7.3349,  -2.3284, TRUE);

-- Ambulances
INSERT INTO responders (id, name, responder_type, latitude, longitude, available) VALUES
(gen_random_uuid(), 'Korle Bu Ambulance Unit',        'AMBULANCE', 5.5333, -0.2197, TRUE),
(gen_random_uuid(), 'Ridge Hospital Ambulance',       'AMBULANCE', 5.5731, -0.1972, TRUE),
(gen_random_uuid(), 'NEMS Accra East Ambulance',      'AMBULANCE', 5.6069, -0.1633, TRUE),
(gen_random_uuid(), 'Komfo Anokye Ambulance Unit',    'AMBULANCE', 6.6903,  1.6283, TRUE),
(gen_random_uuid(), 'Effia Nkwanta Ambulance',       'AMBULANCE', 4.8940, -1.7524, TRUE);
