
INSERT INTO insurance_policies (id, policy_number, farmer_id, policy_type, provider, coverage_amount, premium_amount, effective_date, expiry_date, status, notes, created_at, updated_at) VALUES
  ('b2000001-0000-0000-0000-000000000001','BAIC-LIV-2024-001','f0000001-0000-0000-0000-000000000001','livestock','BAIC',75000.00,1850.00,'2024-01-01','2024-12-31','active','Covers all 5 cattle against death, theft and disease',NOW()-'120 days'::INTERVAL,NOW()),
  ('b2000002-0000-0000-0000-000000000002','BAIC-LIV-2024-002','f0000002-0000-0000-0000-000000000002','livestock','BAIC',30000.00,720.00,'2024-01-15','2024-12-31','active','Boer goat herd — all registered animals',NOW()-'115 days'::INTERVAL,NOW()),
  ('b2000003-0000-0000-0000-000000000003','BAIC-FARM-2024-003','f0000003-0000-0000-0000-000000000003','crop','BAIC',45000.00,2200.00,'2024-02-01','2025-01-31','active','Sorghum and cowpea — drought and flood cover',NOW()-'110 days'::INTERVAL,NOW()),
  ('b2000004-0000-0000-0000-000000000004','BAIC-LIV-2024-004','f0000003-0000-0000-0000-000000000003','livestock','BAIC',120000.00,3400.00,'2024-02-01','2025-01-31','active','Simmental herd — comprehensive cover',NOW()-'110 days'::INTERVAL,NOW()),
  ('b2000005-0000-0000-0000-000000000005','BAIC-COMP-2024-005','f0000005-0000-0000-0000-000000000005','comprehensive','BAIC',95000.00,980.00,'2024-02-18','2025-02-17','active','Irrigation farm + goat kraal — all-risk policy',NOW()-'100 days'::INTERVAL,NOW()),
  ('b2000006-0000-0000-0000-000000000006','BAIC-LIV-2024-006','f0000006-0000-0000-0000-000000000006','livestock','BAIC',180000.00,4200.00,'2024-03-05','2025-03-04','active','Kalahari ranch — Nguni cattle and Boer goats',NOW()-'95 days'::INTERVAL,NOW())
ON CONFLICT (id) DO NOTHING;
