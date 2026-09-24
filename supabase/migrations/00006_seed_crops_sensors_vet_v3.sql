
-- CROP FIELDS
INSERT INTO crop_fields (id, field_code, farm_id, field_name, field_size_ha, crop_type, gps_lat, gps_lng, status, created_at, updated_at) VALUES
  ('cf000001-0000-0000-0000-000000000001','FLD-2024-001','fa000002-0000-0000-0000-000000000002','Serowe North Field',6.0,'sorghum',-22.3850,26.7180,'active',NOW()-'118 days'::INTERVAL,NOW()),
  ('cf000002-0000-0000-0000-000000000002','FLD-2024-002','fa000002-0000-0000-0000-000000000002','Serowe South Field',6.0,'maize',-22.3920,26.7220,'active',NOW()-'118 days'::INTERVAL,NOW()),
  ('cf000003-0000-0000-0000-000000000003','FLD-2024-003','fa000003-0000-0000-0000-000000000003','Kanye Plot A',10.0,'sorghum',-24.9700,25.3300,'active',NOW()-'113 days'::INTERVAL,NOW()),
  ('cf000004-0000-0000-0000-000000000004','FLD-2024-004','fa000003-0000-0000-0000-000000000003','Kanye Plot B',8.0,'cowpea',-24.9720,25.3380,'active',NOW()-'113 days'::INTERVAL,NOW()),
  ('cf000005-0000-0000-0000-000000000005','FLD-2024-005','fa000004-0000-0000-0000-000000000004','Molepolole Heritage',25.0,'sorghum',-24.4100,25.4820,'active',NOW()-'108 days'::INTERVAL,NOW()),
  ('cf000006-0000-0000-0000-000000000006','FLD-2024-006','fa000006-0000-0000-0000-000000000006','Francistown Veg Garden',3.5,'mixed_vegetables',-21.1680,27.5190,'active',NOW()-'103 days'::INTERVAL,NOW()),
  ('cf000007-0000-0000-0000-000000000007','FLD-2024-007','fa000007-0000-0000-0000-000000000007','Ghanzi Pivot Block A',7.5,'maize',-21.7020,21.6480,'active',NOW()-'98 days'::INTERVAL,NOW()),
  ('cf000008-0000-0000-0000-000000000008','FLD-2024-008','fa000007-0000-0000-0000-000000000007','Ghanzi Pivot Block B',7.5,'watermelon',-21.7040,21.6520,'active',NOW()-'98 days'::INTERVAL,NOW())
ON CONFLICT (id) DO NOTHING;

-- SENSORS — device_status enum: active/inactive/faulty (online→active, offline→inactive, fault→faulty)
INSERT INTO sensors (id, sensor_code, device_type, serial_number, field_id, farm_id, status, last_reading_at, firmware_version, installation_date, notes, created_at) VALUES
  ('50000001-0000-0000-0000-000000000001','SNS-2024-001','soil_moisture','CG-SM-001','cf000001-0000-0000-0000-000000000001','fa000002-0000-0000-0000-000000000002','active',NOW()-'2 hours'::INTERVAL,'v2.1.3','2024-01-17','Installed at 30cm depth north field',NOW()-'117 days'::INTERVAL),
  ('50000002-0000-0000-0000-000000000002','SNS-2024-002','temperature_humidity','CG-TH-001','cf000001-0000-0000-0000-000000000001','fa000002-0000-0000-0000-000000000002','active',NOW()-'2 hours'::INTERVAL,'v2.0.8','2024-01-17','Weather station north field',NOW()-'117 days'::INTERVAL),
  ('50000003-0000-0000-0000-000000000003','SNS-2024-003','soil_moisture','CG-SM-002','cf000005-0000-0000-0000-000000000005','fa000004-0000-0000-0000-000000000004','active',NOW()-'3 hours'::INTERVAL,'v2.1.3','2024-02-03','Molepolole heritage field sensor',NOW()-'107 days'::INTERVAL),
  ('50000004-0000-0000-0000-000000000004','SNS-2024-004','temperature_humidity','CG-TH-002','cf000005-0000-0000-0000-000000000005','fa000004-0000-0000-0000-000000000004','active',NOW()-'3 hours'::INTERVAL,'v2.0.8','2024-02-03','Heritage field weather node',NOW()-'107 days'::INTERVAL),
  ('50000005-0000-0000-0000-000000000005','SNS-2024-005','soil_moisture','CG-SM-003','cf000007-0000-0000-0000-000000000007','fa000007-0000-0000-0000-000000000007','active',NOW()-'1 hour'::INTERVAL,'v2.1.5','2024-02-20','Ghanzi pivot block A sensor',NOW()-'97 days'::INTERVAL),
  ('50000006-0000-0000-0000-000000000006','SNS-2024-006','npk_soil','CG-NPK-001','cf000007-0000-0000-0000-000000000007','fa000007-0000-0000-0000-000000000007','active',NOW()-'4 hours'::INTERVAL,'v1.9.2','2024-02-20','NPK soil nutrient sensor Ghanzi',NOW()-'97 days'::INTERVAL),
  ('50000007-0000-0000-0000-000000000007','SNS-2024-007','soil_moisture','CG-SM-004','cf000008-0000-0000-0000-000000000008','fa000007-0000-0000-0000-000000000007','inactive',NOW()-'3 days'::INTERVAL,'v2.1.5','2024-02-20','Offline — battery replacement needed',NOW()-'97 days'::INTERVAL),
  ('50000008-0000-0000-0000-000000000008','SNS-2024-008','temperature_humidity','CG-TH-003','cf000003-0000-0000-0000-000000000003','fa000003-0000-0000-0000-000000000003','faulty',NOW()-'5 days'::INTERVAL,'v2.0.8','2024-01-22','Fault — comm error, logged for maintenance',NOW()-'112 days'::INTERVAL)
ON CONFLICT (id) DO NOTHING;

-- SENSOR READINGS
INSERT INTO sensor_readings (id, sensor_id, reading_type, value, unit, recorded_at) VALUES
  (gen_random_uuid(),'50000001-0000-0000-0000-000000000001','soil_moisture',28.4,'%',NOW()-'2 hours'::INTERVAL),
  (gen_random_uuid(),'50000001-0000-0000-0000-000000000001','soil_moisture',29.1,'%',NOW()-'6 hours'::INTERVAL),
  (gen_random_uuid(),'50000001-0000-0000-0000-000000000001','soil_moisture',27.8,'%',NOW()-'12 hours'::INTERVAL),
  (gen_random_uuid(),'50000002-0000-0000-0000-000000000002','temperature',32.5,'°C',NOW()-'2 hours'::INTERVAL),
  (gen_random_uuid(),'50000002-0000-0000-0000-000000000002','humidity',41.2,'%',NOW()-'2 hours'::INTERVAL),
  (gen_random_uuid(),'50000003-0000-0000-0000-000000000003','soil_moisture',22.1,'%',NOW()-'3 hours'::INTERVAL),
  (gen_random_uuid(),'50000003-0000-0000-0000-000000000003','soil_moisture',21.5,'%',NOW()-'9 hours'::INTERVAL),
  (gen_random_uuid(),'50000004-0000-0000-0000-000000000004','temperature',29.8,'°C',NOW()-'3 hours'::INTERVAL),
  (gen_random_uuid(),'50000004-0000-0000-0000-000000000004','humidity',38.6,'%',NOW()-'3 hours'::INTERVAL),
  (gen_random_uuid(),'50000005-0000-0000-0000-000000000005','soil_moisture',35.9,'%',NOW()-'1 hour'::INTERVAL),
  (gen_random_uuid(),'50000005-0000-0000-0000-000000000005','soil_moisture',35.2,'%',NOW()-'7 hours'::INTERVAL),
  (gen_random_uuid(),'50000006-0000-0000-0000-000000000006','nitrogen',42.0,'mg/kg',NOW()-'4 hours'::INTERVAL),
  (gen_random_uuid(),'50000006-0000-0000-0000-000000000006','phosphorus',18.5,'mg/kg',NOW()-'4 hours'::INTERVAL),
  (gen_random_uuid(),'50000006-0000-0000-0000-000000000006','potassium',95.3,'mg/kg',NOW()-'4 hours'::INTERVAL);

-- VETERINARY VISITS
INSERT INTO veterinary_visits (id, visit_code, farm_id, vet_id, visit_date, findings, treatment_prescribed, follow_up_date, notes, created_at) VALUES
  ('00b00001-0000-0000-0000-000000000001','VV-2024-001','fa000001-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004','2024-04-10','General herd inspection — 5 cattle checked. All in good condition. Minor tick burden noted on 2 animals.','Dipping with Amitraz. Administer Ivermectin to 2 animals.','2024-05-10','Seasonal dip recommended. Farmer advised on rotational grazing.',NOW()-'90 days'::INTERVAL),
  ('00b00002-0000-0000-0000-000000000002','VV-2024-002','fa000003-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000004','2024-05-02','Goat herd inspection — 3 does presenting with mild respiratory signs.','Oxytetracycline injection 3 animals. Isolate from main herd for 7 days.','2024-05-16','Monitor for recovery. If no improvement escalate to DVS.',NOW()-'68 days'::INTERVAL),
  ('00b00003-0000-0000-0000-000000000003','VV-2024-003','fa000005-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000004','2024-05-20','Simmental herd check prior to show. Bull in excellent condition. Cows body scores 4-4.5.','Vitamin B12 supplement. Booster vaccination for FMD.','2024-08-20','Pre-show health certificate issued.',NOW()-'50 days'::INTERVAL),
  ('00b00004-0000-0000-0000-000000000004','VV-2024-004','fa000009-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000004','2024-06-15','Kalahari ranch inspection — 2 cows with poor body condition. Possible mineral deficiency.','Mineral lick blocks. Phosphorus injection 2 animals. Worm dose all.','2024-07-15','Review grazing camp rotation.',NOW()-'24 days'::INTERVAL),
  ('00b00005-0000-0000-0000-000000000005','VV-2024-005','fa000008-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000004','2024-07-01','Goat kraal routine check. Kalahari Red buck excellent. 1 doe lame left foreleg.','Joint injection with Penicillin. Hoof trim and bandage.','2024-07-15','Monitor lameness. Rest doe from breeding.',NOW()-'8 days'::INTERVAL)
ON CONFLICT (id) DO NOTHING;

-- VACCINATIONS
INSERT INTO vaccinations (id, animal_id, vaccine_type, batch_number, administered_date, next_due_date, administered_by, notes, created_at) VALUES
  (gen_random_uuid(),'a2000001-0000-0000-0000-000000000001','FMD (Foot-and-Mouth)','FMD-BW-2024-001','2024-03-15','2025-03-15','00000000-0000-0000-0000-000000000004','Annual FMD vaccination — government programme',NOW()-'100 days'::INTERVAL),
  (gen_random_uuid(),'a2000002-0000-0000-0000-000000000002','FMD (Foot-and-Mouth)','FMD-BW-2024-001','2024-03-15','2025-03-15','00000000-0000-0000-0000-000000000004','Annual FMD vaccination',NOW()-'100 days'::INTERVAL),
  (gen_random_uuid(),'a2000003-0000-0000-0000-000000000003','FMD (Foot-and-Mouth)','FMD-BW-2024-001','2024-03-15','2025-03-15','00000000-0000-0000-0000-000000000004','Annual FMD vaccination',NOW()-'100 days'::INTERVAL),
  (gen_random_uuid(),'a2000004-0000-0000-0000-000000000004','Anthrax','ANTX-BW-2024-002','2024-04-01','2025-04-01','00000000-0000-0000-0000-000000000004','Annual anthrax — Central District programme',NOW()-'83 days'::INTERVAL),
  (gen_random_uuid(),'a2000005-0000-0000-0000-000000000005','Anthrax','ANTX-BW-2024-002','2024-04-01','2025-04-01','00000000-0000-0000-0000-000000000004','Annual anthrax',NOW()-'83 days'::INTERVAL),
  (gen_random_uuid(),'a2000009-0000-0000-0000-000000000009','FMD (Foot-and-Mouth)','FMD-BW-2024-003','2024-05-20','2025-05-20','00000000-0000-0000-0000-000000000004','Pre-show booster',NOW()-'50 days'::INTERVAL),
  (gen_random_uuid(),'a200000a-0000-0000-0000-000000000010','FMD (Foot-and-Mouth)','FMD-BW-2024-003','2024-05-20','2025-05-20','00000000-0000-0000-0000-000000000004','Pre-show booster',NOW()-'50 days'::INTERVAL),
  (gen_random_uuid(),'a2000006-0000-0000-0000-000000000006','PPR (Peste des Petits Ruminants)','PPR-BW-2024-001','2024-04-10','2026-04-10','00000000-0000-0000-0000-000000000004','PPR — 3-year interval',NOW()-'90 days'::INTERVAL),
  (gen_random_uuid(),'a2000007-0000-0000-0000-000000000007','PPR (Peste des Petits Ruminants)','PPR-BW-2024-001','2024-04-10','2026-04-10','00000000-0000-0000-0000-000000000004','PPR — 3-year interval',NOW()-'90 days'::INTERVAL),
  (gen_random_uuid(),'a200000e-0000-0000-0000-000000000014','Lumpy Skin Disease (LSD)','LSD-BW-2024-001','2024-06-01','2025-06-01','00000000-0000-0000-0000-000000000004','LSD vaccination — Kgalagadi campaign',NOW()-'38 days'::INTERVAL),
  (gen_random_uuid(),'a200000f-0000-0000-0000-000000000015','Lumpy Skin Disease (LSD)','LSD-BW-2024-001','2024-06-01','2025-06-01','00000000-0000-0000-0000-000000000004','LSD vaccination',NOW()-'38 days'::INTERVAL),
  (gen_random_uuid(),'a2000010-0000-0000-0000-000000000016','Lumpy Skin Disease (LSD)','LSD-BW-2024-001','2024-06-01','2025-06-01','00000000-0000-0000-0000-000000000004','LSD vaccination',NOW()-'38 days'::INTERVAL);

-- DISEASE CASES
INSERT INTO disease_cases (id, case_code, disease_name, outbreak_area, status, affected_animals_count, reported_by, resolved_at, notes, created_at, updated_at) VALUES
  ('dc000001-0000-0000-0000-000000000001','DC-2024-001','Lumpy Skin Disease (LSD)','Ghanzi District','contained',14,'00000000-0000-0000-0000-000000000004',NULL,'Containment ring vaccination in progress. 14 confirmed cases across 3 farms.',NOW()-'45 days'::INTERVAL,NOW()),
  ('dc000002-0000-0000-0000-000000000002','DC-2024-002','Foot-and-Mouth Disease (FMD)','Southern District','active',7,'00000000-0000-0000-0000-000000000004',NULL,'Early detection — 2 farms under quarantine. Movement restrictions in 20km radius.',NOW()-'12 days'::INTERVAL,NOW()),
  ('dc000003-0000-0000-0000-000000000003','DC-2024-003','Contagious Caprine Pleuropneumonia (CCPP)','Kweneng District','resolved',5,'00000000-0000-0000-0000-000000000004',NOW()-'30 days'::INTERVAL,'Resolved after 21-day treatment programme.',NOW()-'75 days'::INTERVAL,NOW()),
  ('dc000004-0000-0000-0000-000000000004','DC-2024-004','East Coast Fever (ECF)','North East District','under_investigation',3,'00000000-0000-0000-0000-000000000004',NULL,'Samples sent to NLIMS Gaborone. Tick vector control initiated.',NOW()-'5 days'::INTERVAL,NOW())
ON CONFLICT (id) DO NOTHING;
