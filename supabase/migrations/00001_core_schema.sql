
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================
-- ENUMS
-- =====================
CREATE TYPE public.user_role AS ENUM (
  'farmer', 'veterinary_officer', 'extension_officer', 'feedlot_operator',
  'abattoir_officer', 'insurance_officer', 'financial_officer', 'ministry_official',
  'admin', 'operations_team'
);

CREATE TYPE public.account_status AS ENUM ('active', 'pending_verification', 'suspended', 'inactive');
CREATE TYPE public.farm_status AS ENUM ('active', 'pending_verification', 'suspended', 'archived');
CREATE TYPE public.animal_status AS ENUM ('active', 'missing', 'sick', 'quarantined', 'sold', 'slaughtered', 'deceased');
CREATE TYPE public.microchip_status AS ENUM ('manufactured', 'received', 'in_inventory', 'issued', 'activated', 'in_use', 'recovered', 'retired');
CREATE TYPE public.device_status AS ENUM ('active', 'inactive', 'under_maintenance', 'faulty', 'retired');
CREATE TYPE public.claim_status AS ENUM ('submitted', 'under_review', 'approved', 'rejected', 'paid', 'closed');
CREATE TYPE public.payment_status AS ENUM ('pending', 'successful', 'failed', 'cancelled', 'refunded');
CREATE TYPE public.order_status AS ENUM ('placed', 'accepted', 'cancelled', 'completed');
CREATE TYPE public.listing_status AS ENUM ('active', 'sold', 'closed', 'expired');

-- =====================
-- PROFILES
-- =====================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  full_name text,
  mobile text UNIQUE,
  role public.user_role NOT NULL DEFAULT 'farmer',
  status public.account_status NOT NULL DEFAULT 'pending_verification',
  national_id text UNIQUE,
  district text,
  village text,
  physical_address text,
  language_preference text DEFAULT 'en',
  profile_photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper function for role checks
CREATE OR REPLACE FUNCTION get_user_role(uid uuid)
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = uid;
$$;

CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role IN ('admin', 'operations_team') FROM profiles WHERE id = uid;
$$;

-- Profiles policies
CREATE POLICY "Admins have full access to profiles" ON profiles
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role IS NOT DISTINCT FROM get_user_role(auth.uid()));

CREATE VIEW public.public_profiles AS
  SELECT id, full_name, role, status, district, village, profile_photo_url FROM profiles;

-- Auto-sync trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================
-- FARMERS
-- =====================
CREATE TABLE public.farmers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  farmer_code text UNIQUE NOT NULL,
  date_of_birth date,
  gender text,
  omang_number text UNIQUE,
  gps_lat numeric(10,7),
  gps_lng numeric(10,7),
  verified_at timestamptz,
  verified_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.farmers ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION gen_farmer_code() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.farmer_code := 'FRM-' || LPAD(NEXTVAL('farmer_code_seq')::text, 6, '0');
  RETURN NEW;
END;$$;
CREATE SEQUENCE farmer_code_seq START 1000;
CREATE TRIGGER set_farmer_code BEFORE INSERT ON farmers FOR EACH ROW EXECUTE FUNCTION gen_farmer_code();

CREATE POLICY "Admin full access farmers" ON farmers FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Farmers view own record" ON farmers FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "Extension officer view farmers" ON farmers FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) IN ('extension_officer', 'veterinary_officer', 'ministry_official', 'operations_team'));
CREATE POLICY "Farmers update own record" ON farmers FOR UPDATE TO authenticated USING (profile_id = auth.uid());

-- =====================
-- FARMS
-- =====================
CREATE TABLE public.farms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  farm_code text UNIQUE NOT NULL,
  farmer_id uuid NOT NULL REFERENCES public.farmers(id),
  farm_name text NOT NULL,
  farm_type text,
  farm_size_ha numeric(10,2),
  district text NOT NULL,
  village text,
  physical_address text,
  gps_lat numeric(10,7),
  gps_lng numeric(10,7),
  land_ownership_type text,
  status public.farm_status NOT NULL DEFAULT 'pending_verification',
  verified_at timestamptz,
  verified_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

CREATE SEQUENCE farm_code_seq START 1000;
CREATE OR REPLACE FUNCTION gen_farm_code() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.farm_code := 'FAM-' || LPAD(NEXTVAL('farm_code_seq')::text, 6, '0'); RETURN NEW; END;$$;
CREATE TRIGGER set_farm_code BEFORE INSERT ON farms FOR EACH ROW EXECUTE FUNCTION gen_farm_code();

CREATE POLICY "Admin full access farms" ON farms FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Farmers view own farms" ON farms FOR SELECT TO authenticated
  USING (farmer_id IN (SELECT id FROM farmers WHERE profile_id = auth.uid()));
CREATE POLICY "Farmers insert farms" ON farms FOR INSERT TO authenticated
  WITH CHECK (farmer_id IN (SELECT id FROM farmers WHERE profile_id = auth.uid()));
CREATE POLICY "Farmers update own farms" ON farms FOR UPDATE TO authenticated
  USING (farmer_id IN (SELECT id FROM farmers WHERE profile_id = auth.uid()));
CREATE POLICY "Officers view farms" ON farms FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) IN ('extension_officer','veterinary_officer','ministry_official','operations_team','feedlot_operator','abattoir_officer'));

-- =====================
-- ANIMALS (LIVESTOCK)
-- =====================
CREATE TABLE public.animals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_code text UNIQUE NOT NULL,
  farm_id uuid NOT NULL REFERENCES public.farms(id),
  farmer_id uuid NOT NULL REFERENCES public.farmers(id),
  species text NOT NULL,
  breed text,
  sex text,
  date_of_birth date,
  estimated_age_months int,
  coat_colour text,
  identification_marks text,
  microchip_id text UNIQUE,
  ear_tag_number text UNIQUE,
  weight_kg numeric(8,2),
  body_condition text,
  reproductive_status text,
  status public.animal_status NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;

CREATE SEQUENCE animal_code_seq START 10000;
CREATE OR REPLACE FUNCTION gen_animal_code() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.animal_code := 'LIV-' || LPAD(NEXTVAL('animal_code_seq')::text, 7, '0'); RETURN NEW; END;$$;
CREATE TRIGGER set_animal_code BEFORE INSERT ON animals FOR EACH ROW EXECUTE FUNCTION gen_animal_code();

CREATE POLICY "Admin full access animals" ON animals FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Farmers view own animals" ON animals FOR SELECT TO authenticated
  USING (farmer_id IN (SELECT id FROM farmers WHERE profile_id = auth.uid()));
CREATE POLICY "Farmers insert own animals" ON animals FOR INSERT TO authenticated
  WITH CHECK (farmer_id IN (SELECT id FROM farmers WHERE profile_id = auth.uid()));
CREATE POLICY "Farmers update own animals" ON animals FOR UPDATE TO authenticated
  USING (farmer_id IN (SELECT id FROM farmers WHERE profile_id = auth.uid()));
CREATE POLICY "Officers view animals" ON animals FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) IN ('extension_officer','veterinary_officer','ministry_official','operations_team','feedlot_operator','abattoir_officer'));

-- Animal movements
CREATE TABLE public.animal_movements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id uuid NOT NULL REFERENCES public.animals(id),
  movement_date date NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  reason text,
  authorized_by uuid REFERENCES public.profiles(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.animal_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access movements" ON animal_movements FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Officers insert movements" ON animal_movements FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('veterinary_officer','extension_officer','admin','operations_team','feedlot_operator','abattoir_officer'));
CREATE POLICY "Authorized view movements" ON animal_movements FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) != 'financial_officer');

-- =====================
-- MICROCHIPS
-- =====================
CREATE TABLE public.microchips (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  chip_code text UNIQUE NOT NULL,
  batch_number text,
  manufactured_date date,
  expiry_date date,
  status public.microchip_status NOT NULL DEFAULT 'in_inventory',
  animal_id uuid REFERENCES public.animals(id),
  farmer_id uuid REFERENCES public.farmers(id),
  farm_id uuid REFERENCES public.farms(id),
  ear_tag_number text,
  activated_at timestamptz,
  recovered_at timestamptz,
  location text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.microchips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access microchips" ON microchips FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Authorized view microchips" ON microchips FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin','operations_team','veterinary_officer','extension_officer','abattoir_officer','ministry_official'));
CREATE POLICY "Authorized update microchips" ON microchips FOR UPDATE TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin','operations_team','veterinary_officer','abattoir_officer'));

-- =====================
-- VETERINARY
-- =====================
CREATE TABLE public.veterinary_visits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_code text UNIQUE NOT NULL,
  farm_id uuid NOT NULL REFERENCES public.farms(id),
  vet_id uuid NOT NULL REFERENCES public.profiles(id),
  visit_date date NOT NULL,
  findings text,
  treatment_prescribed text,
  follow_up_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.veterinary_visits ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE vet_visit_code_seq START 1000;
CREATE OR REPLACE FUNCTION gen_vet_visit_code() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.visit_code := 'VET-' || LPAD(NEXTVAL('vet_visit_code_seq')::text, 6, '0'); RETURN NEW; END;$$;
CREATE TRIGGER set_vet_visit_code BEFORE INSERT ON veterinary_visits FOR EACH ROW EXECUTE FUNCTION gen_vet_visit_code();
CREATE POLICY "Admin full access vet visits" ON veterinary_visits FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Vets manage visits" ON veterinary_visits FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'veterinary_officer');
CREATE POLICY "Farmers view farm visits" ON veterinary_visits FOR SELECT TO authenticated
  USING (farm_id IN (SELECT id FROM farms WHERE farmer_id IN (SELECT id FROM farmers WHERE profile_id = auth.uid())));

CREATE TABLE public.vaccinations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  animal_id uuid NOT NULL REFERENCES public.animals(id),
  vaccine_type text NOT NULL,
  batch_number text,
  administered_date date NOT NULL,
  next_due_date date,
  administered_by uuid REFERENCES public.profiles(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access vaccinations" ON vaccinations FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Vets manage vaccinations" ON vaccinations FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) = 'veterinary_officer');
CREATE POLICY "Farmers view animal vaccinations" ON vaccinations FOR SELECT TO authenticated
  USING (animal_id IN (SELECT id FROM animals WHERE farmer_id IN (SELECT id FROM farmers WHERE profile_id = auth.uid())));

CREATE TABLE public.disease_cases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_code text UNIQUE NOT NULL,
  disease_name text NOT NULL,
  outbreak_area text,
  status text NOT NULL DEFAULT 'active',
  affected_animals_count int DEFAULT 0,
  reported_by uuid REFERENCES public.profiles(id),
  resolved_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.disease_cases ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE disease_code_seq START 1000;
CREATE OR REPLACE FUNCTION gen_disease_code() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.case_code := 'DIS-' || LPAD(NEXTVAL('disease_code_seq')::text, 6, '0'); RETURN NEW; END;$$;
CREATE TRIGGER set_disease_code BEFORE INSERT ON disease_cases FOR EACH ROW EXECUTE FUNCTION gen_disease_code();
CREATE POLICY "Authorized view disease cases" ON disease_cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Vets and admin manage disease cases" ON disease_cases FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) IN ('veterinary_officer','admin','operations_team','ministry_official','extension_officer'));

-- =====================
-- CROPS
-- =====================
CREATE TABLE public.crop_fields (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_code text UNIQUE NOT NULL,
  farm_id uuid NOT NULL REFERENCES public.farms(id),
  field_name text NOT NULL,
  field_size_ha numeric(10,2),
  crop_type text,
  gps_lat numeric(10,7),
  gps_lng numeric(10,7),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crop_fields ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE field_code_seq START 1000;
CREATE OR REPLACE FUNCTION gen_field_code() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.field_code := 'FLD-' || LPAD(NEXTVAL('field_code_seq')::text, 6, '0'); RETURN NEW; END;$$;
CREATE TRIGGER set_field_code BEFORE INSERT ON crop_fields FOR EACH ROW EXECUTE FUNCTION gen_field_code();
CREATE POLICY "Admin full access fields" ON crop_fields FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Farmers manage own fields" ON crop_fields FOR ALL TO authenticated
  USING (farm_id IN (SELECT id FROM farms WHERE farmer_id IN (SELECT id FROM farmers WHERE profile_id = auth.uid())));
CREATE POLICY "Officers view fields" ON crop_fields FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) IN ('extension_officer','veterinary_officer','ministry_official','operations_team'));

-- =====================
-- SENSORS
-- =====================
CREATE TABLE public.sensors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sensor_code text UNIQUE NOT NULL,
  device_type text NOT NULL,
  serial_number text UNIQUE,
  field_id uuid REFERENCES public.crop_fields(id),
  farm_id uuid REFERENCES public.farms(id),
  status public.device_status NOT NULL DEFAULT 'active',
  last_reading_at timestamptz,
  firmware_version text,
  installation_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sensors ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE sensor_code_seq START 1000;
CREATE OR REPLACE FUNCTION gen_sensor_code() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.sensor_code := 'SNS-' || LPAD(NEXTVAL('sensor_code_seq')::text, 6, '0'); RETURN NEW; END;$$;
CREATE TRIGGER set_sensor_code BEFORE INSERT ON sensors FOR EACH ROW EXECUTE FUNCTION gen_sensor_code();
CREATE POLICY "Admin full access sensors" ON sensors FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Authorized view sensors" ON sensors FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) != 'financial_officer');
CREATE POLICY "Authorized manage sensors" ON sensors FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) IN ('admin','operations_team','extension_officer'));

CREATE TABLE public.sensor_readings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sensor_id uuid NOT NULL REFERENCES public.sensors(id) ON DELETE CASCADE,
  reading_type text NOT NULL,
  value numeric NOT NULL,
  unit text,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authorized view readings" ON sensor_readings FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) != 'financial_officer');
CREATE POLICY "System insert readings" ON sensor_readings FOR INSERT TO authenticated
  WITH CHECK (get_user_role(auth.uid()) IN ('admin','operations_team','extension_officer'));

-- =====================
-- DEVICES (DAMS)
-- =====================
CREATE TABLE public.devices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_code text UNIQUE NOT NULL,
  device_type text NOT NULL,
  serial_number text UNIQUE,
  manufacturer text,
  model text,
  purchase_date date,
  warranty_expiry date,
  status public.device_status NOT NULL DEFAULT 'active',
  assigned_to uuid REFERENCES public.profiles(id),
  farm_id uuid REFERENCES public.farms(id),
  firmware_version text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE device_code_seq START 1000;
CREATE OR REPLACE FUNCTION gen_device_code() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.device_code := 'DEV-' || LPAD(NEXTVAL('device_code_seq')::text, 6, '0'); RETURN NEW; END;$$;
CREATE TRIGGER set_device_code BEFORE INSERT ON devices FOR EACH ROW EXECUTE FUNCTION gen_device_code();
CREATE POLICY "Admin full access devices" ON devices FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Authorized view devices" ON devices FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) != 'financial_officer');

-- =====================
-- MARKETPLACE
-- =====================
CREATE TABLE public.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_code text UNIQUE NOT NULL,
  seller_id uuid NOT NULL REFERENCES public.profiles(id),
  category text NOT NULL,
  title text NOT NULL,
  description text,
  quantity numeric,
  unit_price numeric(12,2),
  currency text DEFAULT 'BWP',
  location_district text,
  status public.listing_status NOT NULL DEFAULT 'active',
  images text[],
  animal_id uuid REFERENCES public.animals(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE listing_code_seq START 1000;
CREATE OR REPLACE FUNCTION gen_listing_code() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.listing_code := 'MKT-' || LPAD(NEXTVAL('listing_code_seq')::text, 6, '0'); RETURN NEW; END;$$;
CREATE TRIGGER set_listing_code BEFORE INSERT ON marketplace_listings FOR EACH ROW EXECUTE FUNCTION gen_listing_code();
CREATE POLICY "Public can view active listings" ON marketplace_listings FOR SELECT TO authenticated USING (status = 'active' OR seller_id = auth.uid() OR is_admin(auth.uid()));
CREATE POLICY "Sellers manage own listings" ON marketplace_listings FOR ALL TO authenticated
  USING (seller_id = auth.uid());
CREATE POLICY "Admin full access listings" ON marketplace_listings FOR ALL TO authenticated USING (is_admin(auth.uid()));

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_code text UNIQUE NOT NULL,
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id),
  buyer_id uuid NOT NULL REFERENCES public.profiles(id),
  quantity numeric,
  total_amount numeric(12,2),
  status public.order_status NOT NULL DEFAULT 'placed',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE order_code_seq START 1000;
CREATE OR REPLACE FUNCTION gen_order_code() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.order_code := 'ORD-' || LPAD(NEXTVAL('order_code_seq')::text, 7, '0'); RETURN NEW; END;$$;
CREATE TRIGGER set_order_code BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION gen_order_code();
CREATE POLICY "Buyers view own orders" ON orders FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR listing_id IN (SELECT id FROM marketplace_listings WHERE seller_id = auth.uid()) OR is_admin(auth.uid()));
CREATE POLICY "Buyers insert orders" ON orders FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Admin full access orders" ON orders FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- =====================
-- INSURANCE
-- =====================
CREATE TABLE public.insurance_policies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_number text UNIQUE NOT NULL,
  farmer_id uuid NOT NULL REFERENCES public.farmers(id),
  policy_type text NOT NULL,
  provider text NOT NULL,
  coverage_amount numeric(15,2),
  premium_amount numeric(12,2),
  effective_date date NOT NULL,
  expiry_date date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE policy_code_seq START 1000;
CREATE OR REPLACE FUNCTION gen_policy_code() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.policy_number := 'POL-' || LPAD(NEXTVAL('policy_code_seq')::text, 7, '0'); RETURN NEW; END;$$;
CREATE TRIGGER set_policy_code BEFORE INSERT ON insurance_policies FOR EACH ROW EXECUTE FUNCTION gen_policy_code();
CREATE POLICY "Admin full access policies" ON insurance_policies FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Farmers view own policies" ON insurance_policies FOR SELECT TO authenticated
  USING (farmer_id IN (SELECT id FROM farmers WHERE profile_id = auth.uid()));
CREATE POLICY "Insurance officers manage policies" ON insurance_policies FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) IN ('insurance_officer','admin','operations_team'));

CREATE TABLE public.insurance_claims (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_number text UNIQUE NOT NULL,
  policy_id uuid NOT NULL REFERENCES public.insurance_policies(id),
  claimant_id uuid NOT NULL REFERENCES public.profiles(id),
  claim_type text NOT NULL,
  incident_date date NOT NULL,
  description text,
  status public.claim_status NOT NULL DEFAULT 'submitted',
  compensation_amount numeric(15,2),
  assessed_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE claim_code_seq START 1000;
CREATE OR REPLACE FUNCTION gen_claim_code() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.claim_number := 'CLM-' || LPAD(NEXTVAL('claim_code_seq')::text, 7, '0'); RETURN NEW; END;$$;
CREATE TRIGGER set_claim_code BEFORE INSERT ON insurance_claims FOR EACH ROW EXECUTE FUNCTION gen_claim_code();
CREATE POLICY "Admin full access claims" ON insurance_claims FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Farmers view own claims" ON insurance_claims FOR SELECT TO authenticated
  USING (claimant_id = auth.uid());
CREATE POLICY "Farmers submit claims" ON insurance_claims FOR INSERT TO authenticated
  WITH CHECK (claimant_id = auth.uid());
CREATE POLICY "Insurance officers manage claims" ON insurance_claims FOR ALL TO authenticated
  USING (get_user_role(auth.uid()) IN ('insurance_officer','admin','operations_team'));

-- =====================
-- PAYMENTS
-- =====================
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_code text UNIQUE NOT NULL,
  payer_id uuid NOT NULL REFERENCES public.profiles(id),
  payee_id uuid REFERENCES public.profiles(id),
  amount numeric(15,2) NOT NULL,
  currency text DEFAULT 'BWP',
  payment_method text,
  status public.payment_status NOT NULL DEFAULT 'pending',
  reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE SEQUENCE payment_code_seq START 100000;
CREATE OR REPLACE FUNCTION gen_payment_code() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.transaction_code := 'TXN-' || LPAD(NEXTVAL('payment_code_seq')::text, 8, '0'); RETURN NEW; END;$$;
CREATE TRIGGER set_payment_code BEFORE INSERT ON payments FOR EACH ROW EXECUTE FUNCTION gen_payment_code();
CREATE POLICY "Admin full access payments" ON payments FOR ALL TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Users view own payments" ON payments FOR SELECT TO authenticated
  USING (payer_id = auth.uid() OR payee_id = auth.uid());
CREATE POLICY "Users insert payments" ON payments FOR INSERT TO authenticated
  WITH CHECK (payer_id = auth.uid());
CREATE POLICY "Financial officers view all payments" ON payments FOR SELECT TO authenticated
  USING (get_user_role(auth.uid()) = 'financial_officer');

-- =====================
-- NOTIFICATIONS
-- =====================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  is_read boolean NOT NULL DEFAULT false,
  action_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notifications" ON notifications FOR ALL TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Admin insert notifications" ON notifications FOR INSERT TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- =====================
-- AUDIT LOGS
-- =====================
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id),
  action text NOT NULL,
  table_name text,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin view audit logs" ON audit_logs FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "System insert audit logs" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- =====================
-- SEED DATA
-- =====================
INSERT INTO public.microchips (chip_code, batch_number, status) VALUES
('BSM-0000001', 'BATCH-2026-A', 'in_inventory'),
('BSM-0000002', 'BATCH-2026-A', 'in_inventory'),
('BSM-0000003', 'BATCH-2026-A', 'in_inventory'),
('BSM-0000004', 'BATCH-2026-A', 'in_inventory'),
('BSM-0000005', 'BATCH-2026-B', 'in_inventory'),
('BSM-0000006', 'BATCH-2026-B', 'in_inventory'),
('BSM-0000007', 'BATCH-2026-B', 'in_inventory'),
('BSM-0000008', 'BATCH-2026-B', 'in_inventory');
