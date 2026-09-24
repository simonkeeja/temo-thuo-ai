
-- MARKETPLACE LISTINGS (seller_id → profiles.id)
INSERT INTO marketplace_listings (id, listing_code, seller_id, category, title, description, quantity, unit_price, currency, location_district, status, created_at, updated_at) VALUES
  ('b1000001-0000-0000-0000-000000000001','LST-2024-001','00000000-0000-0000-0000-000000000006','livestock','5 Tswana Breeding Cows — Serowe','Excellent Tswana cows, ages 3-5 years. All vaccinated and microchipped. Ideal breeding stock.',5,4800.00,'BWP','Central','active',NOW()-'60 days'::INTERVAL,NOW()),
  ('b1000002-0000-0000-0000-000000000002','LST-2024-002','00000000-0000-0000-0000-000000000006','livestock','Brahman Weaner Bull — 280kg','Young Brahman bull ready for fattening. FMD and anthrax vaccinated.',1,5200.00,'BWP','Central','active',NOW()-'55 days'::INTERVAL,NOW()),
  ('b1000003-0000-0000-0000-000000000003','LST-2024-003','00000000-0000-0000-0000-000000000007','livestock','Boer Goats x12 (Mixed)','12 Boer goats — 4 bucks, 8 does. All PPR vaccinated and ear-tagged.',12,1200.00,'BWP','Southern','active',NOW()-'50 days'::INTERVAL,NOW()),
  ('b1000004-0000-0000-0000-000000000004','LST-2024-004','00000000-0000-0000-0000-000000000008','crop_produce','Sorghum — 500kg (White)','White sorghum from 2024 season. Cleaned and bagged. Good quality.',500,4.50,'BWP','Kweneng','active',NOW()-'45 days'::INTERVAL,NOW()),
  ('b1000005-0000-0000-0000-000000000005','LST-2024-005','00000000-0000-0000-0000-000000000010','crop_produce','Watermelons — 200 units','Ghanzi sweet watermelons, 5-8kg each. Irrigation-grown, excellent quality.',200,18.00,'BWP','Ghanzi','active',NOW()-'30 days'::INTERVAL,NOW()),
  ('b1000006-0000-0000-0000-000000000006','LST-2024-006','00000000-0000-0000-0000-000000000009','crop_produce','Mixed Vegetables Box — Weekly','Francistown mixed veg: tomatoes, spinach, cabbage, green pepper.',20,85.00,'BWP','North East','active',NOW()-'25 days'::INTERVAL,NOW()),
  ('b1000007-0000-0000-0000-000000000007','LST-2024-007','00000000-0000-0000-0000-000000000015','livestock','Nguni Cattle — 3 Head','Kalahari Nguni cattle, heat-adapted, disease-resistant. LSD vaccinated.',3,6500.00,'BWP','Kgalagadi','active',NOW()-'20 days'::INTERVAL,NOW()),
  ('b1000008-0000-0000-0000-000000000008','LST-2024-008','00000000-0000-0000-0000-000000000007','livestock','Champion Boer Buck — Show Quality','Top Boer buck, show champion 2023. Exceptional genetics.',1,9500.00,'BWP','Southern','active',NOW()-'15 days'::INTERVAL,NOW()),
  ('b1000009-0000-0000-0000-000000000009','LST-2024-009','00000000-0000-0000-0000-000000000010','crop_produce','Maize — 1000kg (Yellow)','Ghanzi irrigation maize. Fumigated and stored.',1000,5.20,'BWP','Ghanzi','sold',NOW()-'40 days'::INTERVAL,NOW()),
  ('b100000a-0000-0000-0000-000000000010','LST-2024-010','00000000-0000-0000-0000-000000000008','services','Tractor Ploughing Service — per hectare','Own equipment. Available May-Oct.',1,320.00,'BWP','Kweneng','active',NOW()-'10 days'::INTERVAL,NOW())
ON CONFLICT (id) DO NOTHING;

-- ORDERS (buyer_id → profiles.id, listing_id → marketplace_listings.id)
INSERT INTO orders (id, order_code, listing_id, buyer_id, quantity, total_amount, status, notes, created_at, updated_at) VALUES
  ('0e000001-0000-0000-0000-000000000001','ORD-2024-001','b1000003-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000009',6,7200.00,'completed','Collected at farm. Payment by EFT.',NOW()-'42 days'::INTERVAL,NOW()),
  ('0e000002-0000-0000-0000-000000000002','ORD-2024-002','b1000004-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000006',200,900.00,'completed','Delivered by seller transport.',NOW()-'38 days'::INTERVAL,NOW()),
  ('0e000003-0000-0000-0000-000000000003','ORD-2024-003','b1000009-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000008',1000,5200.00,'completed','Full load collected by buyer.',NOW()-'35 days'::INTERVAL,NOW()),
  ('0e000004-0000-0000-0000-000000000004','ORD-2024-004','b1000001-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000015',2,9600.00,'accepted','Payment received. Collection arranged.',NOW()-'18 days'::INTERVAL,NOW()),
  ('0e000005-0000-0000-0000-000000000005','ORD-2024-005','b1000005-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000009',50,900.00,'placed','Awaiting payment confirmation.',NOW()-'7 days'::INTERVAL,NOW())
ON CONFLICT (id) DO NOTHING;

-- PAYMENTS (payer_id, payee_id → profiles.id)
INSERT INTO payments (id, transaction_code, payer_id, payee_id, amount, currency, payment_method, status, reference, notes, created_at, updated_at) VALUES
  ('07000001-0000-0000-0000-000000000001','TXN-2024-001','00000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000007',7200.00,'BWP','eft','successful','ORD-2024-001','Boer goat purchase x6',NOW()-'41 days'::INTERVAL,NOW()),
  ('07000002-0000-0000-0000-000000000002','TXN-2024-002','00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000008',900.00,'BWP','mobile_money','successful','ORD-2024-002','Sorghum 200kg',NOW()-'37 days'::INTERVAL,NOW()),
  ('07000003-0000-0000-0000-000000000003','TXN-2024-003','00000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000010',5200.00,'BWP','eft','successful','ORD-2024-003','Maize 1000kg purchase',NOW()-'34 days'::INTERVAL,NOW()),
  ('07000004-0000-0000-0000-000000000004','TXN-2024-004','00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000006',9600.00,'BWP','bank_transfer','successful','ORD-2024-004','Tswana breeding cows x2',NOW()-'17 days'::INTERVAL,NOW()),
  ('07000005-0000-0000-0000-000000000005','TXN-2024-005','00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000011',1850.00,'BWP','eft','successful','PREM-2024-001','Livestock insurance premium Q3 2024',NOW()-'65 days'::INTERVAL,NOW()),
  ('07000006-0000-0000-0000-000000000006','TXN-2024-006','00000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000011',720.00,'BWP','mobile_money','successful','PREM-2024-002','Goat herd insurance premium Q3 2024',NOW()-'63 days'::INTERVAL,NOW()),
  ('07000007-0000-0000-0000-000000000007','TXN-2024-007','00000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000011',2200.00,'BWP','eft','successful','PREM-2024-003','Comprehensive farm insurance annual',NOW()-'60 days'::INTERVAL,NOW()),
  ('07000008-0000-0000-0000-000000000008','TXN-2024-008','00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000011',980.00,'BWP','mobile_money','pending','PREM-2024-004','Insurance premium — awaiting clearance',NOW()-'2 days'::INTERVAL,NOW())
ON CONFLICT (id) DO NOTHING;

-- INSURANCE CLAIMS (claimant_id → profiles.id, policy_id → insurance_policies.id)
-- farmer1=profile 006, farmer3=profile 008
INSERT INTO insurance_claims (id, claim_number, policy_id, claimant_id, claim_type, incident_date, description, status, compensation_amount, assessed_by, created_at, updated_at) VALUES
  ('b3000001-0000-0000-0000-000000000001','CLM-2024-001','b2000004-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000008','disease','2024-06-15','2 Simmental cows with LSD symptoms. Vet report attached. Productivity impacted.','approved',8500.00,'00000000-0000-0000-0000-000000000011',NOW()-'35 days'::INTERVAL,NOW()),
  ('b3000002-0000-0000-0000-000000000002','CLM-2024-002','b2000001-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000006','theft','2024-07-01','1 Tswana heifer missing from cattlepost. Police report BW/SRW/2024/123 attached.','under_review',NULL,'00000000-0000-0000-0000-000000000011',NOW()-'18 days'::INTERVAL,NOW()),
  ('b3000003-0000-0000-0000-000000000003','CLM-2024-003','b2000003-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000008','weather','2024-05-10','Hailstorm caused significant damage to sorghum crop. 30% yield loss.','paid',13500.00,'00000000-0000-0000-0000-000000000011',NOW()-'55 days'::INTERVAL,NOW())
ON CONFLICT (id) DO NOTHING;

-- NOTIFICATIONS (user_id → profiles.id)
INSERT INTO notifications (id, user_id, title, message, category, is_read, action_url, created_at) VALUES
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000006','Vaccination Due — ANM-2024-0004','Anthrax vaccination due 2025-04-01. Schedule with your veterinary officer.','health_reminder',FALSE,'/veterinary',NOW()-'3 days'::INTERVAL),
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000006','New Order — LST-2024-001','Dikgang Bathusi placed an order for 2 Tswana breeding cows. Total: BWP 9,600.','marketplace',FALSE,'/marketplace',NOW()-'18 days'::INTERVAL),
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000006','Insurance Premium Due','Q4 livestock insurance instalment BWP 1,850 due 2024-10-01.','payment',TRUE,'/insurance',NOW()-'25 days'::INTERVAL),
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000007','Disease Alert — FMD in Southern District','FMD confirmed in Southern District. Check with DVS before livestock movement.','livestock_alert',FALSE,'/ai-insights',NOW()-'12 days'::INTERVAL),
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000007','Vet Visit Complete — VV-2024-002','Visit to Seretse Mixed Farm 2024-05-02. 3 goats treated for respiratory illness.','health_reminder',TRUE,'/veterinary',NOW()-'68 days'::INTERVAL),
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000008','Sensor Alert — Low Soil Moisture','SNS-2024-003 reports 22.1% soil moisture — below 25% threshold. Consider irrigation.','livestock_alert',FALSE,'/sensors',NOW()-'1 day'::INTERVAL),
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000010','Insurance Claim Approved — CLM-2024-003','Crop damage claim approved. BWP 13,500 compensation within 10 business days.','payment',FALSE,'/insurance',NOW()-'55 days'::INTERVAL),
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000010','Buyer Inquiry — LST-2024-005','Buyer interested in 50 watermelons. Total: BWP 900.','marketplace',TRUE,'/marketplace',NOW()-'7 days'::INTERVAL),
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000004','Disease Report Submitted — DC-2024-002','FMD report Southern District logged as DC-2024-002.','livestock_alert',TRUE,'/ai-insights',NOW()-'12 days'::INTERVAL),
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000004','Vet Reminder — Bathusi Ranch','Follow-up due at Bathusi Kalahari Ranch 2024-07-15. Mineral deficiency cases.','health_reminder',FALSE,'/veterinary',NOW()-'8 days'::INTERVAL),
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000003','Monthly Dashboard Report','National stats July 2024: 6 farms, 20 animals, 4 active disease cases.','system',FALSE,'/situation-room',NOW()-'5 days'::INTERVAL),
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000001','New Farmer — FMR-2024-006','Dikgang Bathusi (FMR-2024-006) registered. Bathusi Kalahari Ranch (850ha).','system',TRUE,'/farmers',NOW()-'95 days'::INTERVAL);

-- ANIMAL MOVEMENTS
INSERT INTO animal_movements (id, animal_id, movement_date, origin, destination, reason, authorized_by, notes, created_at) VALUES
  (gen_random_uuid(),'a2000009-0000-0000-0000-000000000009','2024-05-18','Kgosi Livestock Unit, Gabane','Gaborone Agricultural Showgrounds','Agricultural Show','00000000-0000-0000-0000-000000000004','Health certificate issued VV-2024-003',NOW()-'52 days'::INTERVAL),
  (gen_random_uuid(),'a200000a-0000-0000-0000-000000000010','2024-05-18','Kgosi Livestock Unit, Gabane','Gaborone Agricultural Showgrounds','Agricultural Show','00000000-0000-0000-0000-000000000004','Health certificate issued VV-2024-003',NOW()-'52 days'::INTERVAL),
  (gen_random_uuid(),'a2000006-0000-0000-0000-000000000006','2024-04-20','Seretse Mixed Farm, Kanye','Seretse Goat Unit, Moshupa','Breeding Programme','00000000-0000-0000-0000-000000000004','Buck lent for 30-day breeding cycle',NOW()-'88 days'::INTERVAL),
  (gen_random_uuid(),'a2000014-0000-0000-0000-000000000020','2024-07-05','Ditlhare Farm, Francistown','Tswana Feedlot, Mahalapye','Sale — Fattening','00000000-0000-0000-0000-000000000004','Sold to feedlot operator, payment pending',NOW()-'14 days'::INTERVAL);
