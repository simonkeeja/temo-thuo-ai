
-- FARMERS
INSERT INTO farmers (id, profile_id, farmer_code, omang_number, date_of_birth, gender, gps_lat, gps_lng, created_at, updated_at) VALUES
  ('f0000001-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000006','FMR-2024-001','523456789','1975-04-12','male',-22.3833,26.7167,NOW()-'120 days'::INTERVAL,NOW()),
  ('f0000002-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000007','FMR-2024-002','534567890','1981-08-22','female',-24.9667,25.3333,NOW()-'115 days'::INTERVAL,NOW()),
  ('f0000003-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000008','FMR-2024-003','545678901','1969-11-05','male',-24.4083,25.4833,NOW()-'110 days'::INTERVAL,NOW()),
  ('f0000004-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000009','FMR-2024-004','556789012','1990-03-17','male',-21.1667,27.5167,NOW()-'105 days'::INTERVAL,NOW()),
  ('f0000005-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000010','FMR-2024-005','567890123','1985-07-30','female',-21.7000,21.6500,NOW()-'100 days'::INTERVAL,NOW()),
  ('f0000006-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000015','FMR-2024-006','578901234','1972-12-01','male',-26.0333,22.4500,NOW()-'95 days'::INTERVAL,NOW())
ON CONFLICT (id) DO NOTHING;

-- FARMS
INSERT INTO farms (id, farmer_id, farm_code, farm_name, farm_type, farm_size_ha, district, village, physical_address, gps_lat, gps_lng, land_ownership_type, status, created_at, updated_at) VALUES
  ('fa000001-0000-0000-0000-000000000001','f0000001-0000-0000-0000-000000000001','FRM-2024-001','Motswagole Cattle Post','livestock',450.5,'Central','Serowe','Plot 45 Serowe Cattlepost',-22.3833,26.7167,'leasehold','active',NOW()-'119 days'::INTERVAL,NOW()),
  ('fa000002-0000-0000-0000-000000000002','f0000001-0000-0000-0000-000000000001','FRM-2024-002','Serowe Arable Plot','crop',12.0,'Central','Serowe','Block 4 Serowe',-22.3900,26.7200,'tribal','active',NOW()-'119 days'::INTERVAL,NOW()),
  ('fa000003-0000-0000-0000-000000000003','f0000002-0000-0000-0000-000000000002','FRM-2024-003','Seretse Mixed Farm','mixed',38.0,'Southern','Kanye','Farm Road 3 Kanye',-24.9667,25.3333,'tribal','active',NOW()-'114 days'::INTERVAL,NOW()),
  ('fa000004-0000-0000-0000-000000000004','f0000003-0000-0000-0000-000000000003','FRM-2024-004','Kgosi Heritage Farm','crop',25.0,'Kweneng','Molepolole','Section 3 Agricultural Area',-24.4083,25.4833,'tribal','active',NOW()-'109 days'::INTERVAL,NOW()),
  ('fa000005-0000-0000-0000-000000000005','f0000003-0000-0000-0000-000000000003','FRM-2024-005','Kgosi Livestock Unit','livestock',200.0,'Kweneng','Gabane','Gabane Grazing Block',-24.5500,25.7833,'leasehold','active',NOW()-'109 days'::INTERVAL,NOW()),
  ('fa000006-0000-0000-0000-000000000006','f0000004-0000-0000-0000-000000000004','FRM-2024-006','Ditlhare Poultry & Crop','mixed',8.5,'North East','Francistown','Francistown Agricultural Zone',-21.1667,27.5167,'freehold','active',NOW()-'104 days'::INTERVAL,NOW()),
  ('fa000007-0000-0000-0000-000000000007','f0000005-0000-0000-0000-000000000005','FRM-2024-007','Sithole Irrigation Farm','crop',15.0,'Ghanzi','Ghanzi Town','Farm 102 Ghanzi District',-21.7000,21.6500,'freehold','active',NOW()-'99 days'::INTERVAL,NOW()),
  ('fa000008-0000-0000-0000-000000000008','f0000005-0000-0000-0000-000000000005','FRM-2024-008','Sithole Goat Kraal','livestock',120.0,'Ghanzi','Ghanzi Town','Farm 102B Ghanzi District',-21.7100,21.6600,'leasehold','active',NOW()-'99 days'::INTERVAL,NOW()),
  ('fa000009-0000-0000-0000-000000000009','f0000006-0000-0000-0000-000000000006','FRM-2024-009','Bathusi Kalahari Ranch','livestock',850.0,'Kgalagadi','Tsabong','Tsabong Block 7',-26.0333,22.4500,'leasehold','active',NOW()-'94 days'::INTERVAL,NOW()),
  ('fa000010-0000-0000-0000-000000000010','f0000002-0000-0000-0000-000000000002','FRM-2024-010','Seretse Goat Unit','livestock',65.0,'Southern','Moshupa','Moshupa Ward 2',-24.7833,25.4667,'tribal','active',NOW()-'114 days'::INTERVAL,NOW())
ON CONFLICT (id) DO NOTHING;
