
-- ──────────────────────────────────────────────────────────────────
-- SEED: Auth users + profiles
-- ──────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Auth users (fixed UUIDs, password = Temo2024!)
  INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
  VALUES
    ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin@temothuo.bw',crypt('Temo2024!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Simon Keeja","role":"admin"}',NOW()-'180 days'::INTERVAL,NOW(),'','','',''),
    ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ops@temothuo.bw',crypt('Temo2024!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Kagiso Moagi","role":"operations_team"}',NOW()-'170 days'::INTERVAL,NOW(),'','','',''),
    ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ministry@temothuo.bw',crypt('Temo2024!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Dr. Mpho Tlhagale","role":"ministry_official"}',NOW()-'160 days'::INTERVAL,NOW(),'','','',''),
    ('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','vet@temothuo.bw',crypt('Temo2024!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Dr. Onkabetse Sebego","role":"veterinary_officer"}',NOW()-'150 days'::INTERVAL,NOW(),'','','',''),
    ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ext@temothuo.bw',crypt('Temo2024!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Kefilwe Ntsimane","role":"extension_officer"}',NOW()-'140 days'::INTERVAL,NOW(),'','','',''),
    ('00000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-000000000000','authenticated','authenticated','farmer1@temothuo.bw',crypt('Temo2024!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Letsile Motswagole","role":"farmer"}',NOW()-'120 days'::INTERVAL,NOW(),'','','',''),
    ('00000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-000000000000','authenticated','authenticated','farmer2@temothuo.bw',crypt('Temo2024!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Gaone Seretse","role":"farmer"}',NOW()-'115 days'::INTERVAL,NOW(),'','','',''),
    ('00000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-000000000000','authenticated','authenticated','farmer3@temothuo.bw',crypt('Temo2024!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Tebogo Kgosi","role":"farmer"}',NOW()-'110 days'::INTERVAL,NOW(),'','','',''),
    ('00000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-000000000000','authenticated','authenticated','farmer4@temothuo.bw',crypt('Temo2024!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Obakeng Ditlhare","role":"farmer"}',NOW()-'105 days'::INTERVAL,NOW(),'','','',''),
    ('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000000','authenticated','authenticated','farmer5@temothuo.bw',crypt('Temo2024!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Boitumelo Sithole","role":"farmer"}',NOW()-'100 days'::INTERVAL,NOW(),'','','',''),
    ('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000000','authenticated','authenticated','insurance@temothuo.bw',crypt('Temo2024!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Naledi Moatlhodi","role":"insurance_officer"}',NOW()-'130 days'::INTERVAL,NOW(),'','','',''),
    ('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000000','authenticated','authenticated','finance@temothuo.bw',crypt('Temo2024!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Gorata Kgotlafetse","role":"financial_officer"}',NOW()-'125 days'::INTERVAL,NOW(),'','','',''),
    ('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000000','authenticated','authenticated','feedlot@temothuo.bw',crypt('Temo2024!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Moseki Phuthego","role":"feedlot_operator"}',NOW()-'120 days'::INTERVAL,NOW(),'','','',''),
    ('00000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000000','authenticated','authenticated','abattoir@temothuo.bw',crypt('Temo2024!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Phenyo Mokolopi","role":"abattoir_officer"}',NOW()-'120 days'::INTERVAL,NOW(),'','','',''),
    ('00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000000','authenticated','authenticated','farmer6@temothuo.bw',crypt('Temo2024!',gen_salt('bf')),NOW(),'{"provider":"email","providers":["email"]}','{"full_name":"Dikgang Bathusi","role":"farmer"}',NOW()-'95 days'::INTERVAL,NOW(),'','','','')
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Profiles (cast role to user_role enum)
INSERT INTO profiles (id,email,full_name,phone,role,status,district,village,physical_address,language_preference,created_at,updated_at) VALUES
  ('00000000-0000-0000-0000-000000000001','admin@temothuo.bw','Simon Keeja','+26771000001','admin'::user_role,'active','South East','Gaborone','Plot 1234 CBD, Gaborone','en',NOW()-'180 days'::INTERVAL,NOW()),
  ('00000000-0000-0000-0000-000000000002','ops@temothuo.bw','Kagiso Moagi','+26771000002','operations_team'::user_role,'active','South East','Gaborone','Plot 567 Phase 2, Gaborone','en',NOW()-'170 days'::INTERVAL,NOW()),
  ('00000000-0000-0000-0000-000000000003','ministry@temothuo.bw','Dr. Mpho Tlhagale','+26771000003','ministry_official'::user_role,'active','South East','Gaborone','Ministry of Lands, Gaborone','en',NOW()-'160 days'::INTERVAL,NOW()),
  ('00000000-0000-0000-0000-000000000004','vet@temothuo.bw','Dr. Onkabetse Sebego','+26771000004','veterinary_officer'::user_role,'active','Southern','Lobatse','DVS Lobatse Office','en',NOW()-'150 days'::INTERVAL,NOW()),
  ('00000000-0000-0000-0000-000000000005','ext@temothuo.bw','Kefilwe Ntsimane','+26771000005','extension_officer'::user_role,'active','Kweneng','Molepolole','DARES Kweneng Office','en',NOW()-'140 days'::INTERVAL,NOW()),
  ('00000000-0000-0000-0000-000000000006','farmer1@temothuo.bw','Letsile Motswagole','+26772100001','farmer'::user_role,'active','Central','Serowe','Plot 45 Serowe Village','en',NOW()-'120 days'::INTERVAL,NOW()),
  ('00000000-0000-0000-0000-000000000007','farmer2@temothuo.bw','Gaone Seretse','+26772100002','farmer'::user_role,'active','Southern','Kanye','Ward 5 Kanye','st',NOW()-'115 days'::INTERVAL,NOW()),
  ('00000000-0000-0000-0000-000000000008','farmer3@temothuo.bw','Tebogo Kgosi','+26772100003','farmer'::user_role,'active','Kweneng','Molepolole','Section 3 Molepolole','st',NOW()-'110 days'::INTERVAL,NOW()),
  ('00000000-0000-0000-0000-000000000009','farmer4@temothuo.bw','Obakeng Ditlhare','+26772100004','farmer'::user_role,'active','North East','Francistown','Old Location Francistown','en',NOW()-'105 days'::INTERVAL,NOW()),
  ('00000000-0000-0000-0000-000000000010','farmer5@temothuo.bw','Boitumelo Sithole','+26772100005','farmer'::user_role,'active','Ghanzi','Ghanzi Town','Farm 102 Ghanzi','en',NOW()-'100 days'::INTERVAL,NOW()),
  ('00000000-0000-0000-0000-000000000011','insurance@temothuo.bw','Naledi Moatlhodi','+26771000011','insurance_officer'::user_role,'active','South East','Gaborone','BAIC House Gaborone','en',NOW()-'130 days'::INTERVAL,NOW()),
  ('00000000-0000-0000-0000-000000000012','finance@temothuo.bw','Gorata Kgotlafetse','+26771000012','financial_officer'::user_role,'active','South East','Gaborone','BDC House Gaborone','en',NOW()-'125 days'::INTERVAL,NOW()),
  ('00000000-0000-0000-0000-000000000013','feedlot@temothuo.bw','Moseki Phuthego','+26771000013','feedlot_operator'::user_role,'active','Central','Mahalapye','Tswana Feedlot Mahalapye','en',NOW()-'120 days'::INTERVAL,NOW()),
  ('00000000-0000-0000-0000-000000000014','abattoir@temothuo.bw','Phenyo Mokolopi','+26771000014','abattoir_officer'::user_role,'active','South East','Lobatse','BMC Lobatse','en',NOW()-'120 days'::INTERVAL,NOW()),
  ('00000000-0000-0000-0000-000000000015','farmer6@temothuo.bw','Dikgang Bathusi','+26772100006','farmer'::user_role,'active','Kgalagadi','Tsabong','Ward 2 Tsabong','st',NOW()-'95 days'::INTERVAL,NOW())
ON CONFLICT (id) DO UPDATE SET
  full_name=EXCLUDED.full_name, phone=EXCLUDED.phone,
  role=EXCLUDED.role, status=EXCLUDED.status,
  district=EXCLUDED.district, village=EXCLUDED.village;
