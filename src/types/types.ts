export type UserRole =
  | 'farmer'
  | 'veterinary_officer'
  | 'extension_officer'
  | 'feedlot_operator'
  | 'abattoir_officer'
  | 'insurance_officer'
  | 'financial_officer'
  | 'ministry_official'
  | 'admin'
  | 'operations_team';

export type AccountStatus = 'active' | 'pending_verification' | 'suspended' | 'inactive';
export type FarmStatus = 'active' | 'pending_verification' | 'suspended' | 'archived';
export type AnimalStatus = 'active' | 'missing' | 'sick' | 'quarantined' | 'sold' | 'slaughtered' | 'deceased';
export type MicrochipStatus = 'manufactured' | 'received' | 'in_inventory' | 'issued' | 'activated' | 'in_use' | 'recovered' | 'retired';
export type DeviceStatus = 'active' | 'inactive' | 'under_maintenance' | 'faulty' | 'retired';
export type ClaimStatus = 'submitted' | 'under_review' | 'approved' | 'rejected' | 'paid' | 'closed';
export type PaymentStatus = 'pending' | 'successful' | 'failed' | 'cancelled' | 'refunded';
export type OrderStatus = 'placed' | 'accepted' | 'cancelled' | 'completed';
export type ListingStatus = 'active' | 'sold' | 'closed' | 'expired';

export interface Profile {
  id: string;
  email?: string;
  full_name?: string;
  mobile?: string;
  phone?: string;
  role: UserRole;
  status: AccountStatus;
  national_id?: string;
  district?: string;
  village?: string;
  physical_address?: string;
  language_preference?: string;
  profile_photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Farmer {
  id: string;
  profile_id: string;
  farmer_code: string;
  date_of_birth?: string;
  gender?: string;
  omang_number?: string;
  gps_lat?: number;
  gps_lng?: number;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Farm {
  id: string;
  farm_code: string;
  farmer_id: string;
  farm_name: string;
  farm_type?: string;
  farm_size_ha?: number;
  district: string;
  village?: string;
  physical_address?: string;
  gps_lat?: number;
  gps_lng?: number;
  land_ownership_type?: string;
  status: FarmStatus;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  farmers?: Farmer;
}

export interface Animal {
  id: string;
  animal_code: string;
  farm_id: string;
  farmer_id: string;
  species: string;
  breed?: string;
  sex?: string;
  date_of_birth?: string;
  estimated_age_months?: number;
  coat_colour?: string;
  identification_marks?: string;
  microchip_id?: string;
  ear_tag_number?: string;
  weight_kg?: number;
  body_condition?: string;
  reproductive_status?: string;
  status: AnimalStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  farms?: Farm;
  farmers?: Farmer;
}

export interface AnimalMovement {
  id: string;
  animal_id: string;
  movement_date: string;
  origin: string;
  destination: string;
  reason?: string;
  authorized_by?: string;
  notes?: string;
  created_at: string;
  animals?: Animal;
}

export interface Microchip {
  id: string;
  chip_code: string;
  batch_number?: string;
  manufactured_date?: string;
  expiry_date?: string;
  status: MicrochipStatus;
  animal_id?: string;
  farmer_id?: string;
  farm_id?: string;
  ear_tag_number?: string;
  activated_at?: string;
  recovered_at?: string;
  location?: string;
  created_at: string;
  updated_at: string;
  animals?: Animal;
  farmers?: Farmer;
}

export interface VeterinaryVisit {
  id: string;
  visit_code: string;
  farm_id: string;
  vet_id: string;
  visit_date: string;
  findings?: string;
  treatment_prescribed?: string;
  follow_up_date?: string;
  notes?: string;
  created_at: string;
  farms?: Farm;
  profiles?: Profile;
}

export interface Vaccination {
  id: string;
  animal_id: string;
  vaccine_type: string;
  batch_number?: string;
  administered_date: string;
  next_due_date?: string;
  administered_by?: string;
  notes?: string;
  created_at: string;
  animals?: Animal;
}

export interface DiseaseCase {
  id: string;
  case_code: string;
  disease_name: string;
  outbreak_area?: string;
  status: string;
  affected_animals_count?: number;
  reported_by?: string;
  resolved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CropField {
  id: string;
  field_code: string;
  farm_id: string;
  field_name: string;
  field_size_ha?: number;
  crop_type?: string;
  gps_lat?: number;
  gps_lng?: number;
  status: string;
  created_at: string;
  updated_at: string;
  farms?: Farm;
}

export interface Sensor {
  id: string;
  sensor_code: string;
  device_type: string;
  serial_number?: string;
  field_id?: string;
  farm_id?: string;
  status: DeviceStatus;
  last_reading_at?: string;
  firmware_version?: string;
  installation_date?: string;
  notes?: string;
  created_at: string;
  crop_fields?: CropField;
  farms?: Farm;
}

export interface SensorReading {
  id: string;
  sensor_id: string;
  reading_type: string;
  value: number;
  unit?: string;
  recorded_at: string;
}

export interface Device {
  id: string;
  device_code: string;
  device_type: string;
  serial_number?: string;
  manufacturer?: string;
  model?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  status: DeviceStatus;
  assigned_to?: string;
  farm_id?: string;
  firmware_version?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  farms?: Farm;
}

export interface MarketplaceListing {
  id: string;
  listing_code: string;
  seller_id: string;
  category: string;
  title: string;
  description?: string;
  quantity?: number;
  unit_price?: number;
  currency: string;
  location_district?: string;
  status: ListingStatus;
  images?: string[];
  animal_id?: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  animals?: Animal;
}

export interface Order {
  id: string;
  order_code: string;
  listing_id: string;
  buyer_id: string;
  quantity?: number;
  total_amount?: number;
  status: OrderStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  marketplace_listings?: MarketplaceListing;
  profiles?: Profile;
}

export interface InsurancePolicy {
  id: string;
  policy_number: string;
  farmer_id: string;
  policy_type: string;
  provider: string;
  coverage_amount?: number;
  premium_amount?: number;
  effective_date: string;
  expiry_date: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  farmers?: Farmer;
}

export interface InsuranceClaim {
  id: string;
  claim_number: string;
  policy_id: string;
  claimant_id: string;
  claim_type: string;
  incident_date: string;
  description?: string;
  status: ClaimStatus;
  compensation_amount?: number;
  assessed_by?: string;
  created_at: string;
  updated_at: string;
  insurance_policies?: InsurancePolicy;
  profiles?: Profile;
}

export interface Payment {
  id: string;
  transaction_code: string;
  payer_id: string;
  payee_id?: string;
  amount: number;
  currency: string;
  payment_method?: string;
  status: PaymentStatus;
  reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  payer?: Profile;
  payee?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  category: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
  profiles?: Profile;
}

export const BOTSWANA_DISTRICTS = [
  'Central', 'Chobe', 'Ghanzi', 'Kgalagadi', 'Kgatleng',
  'Kweneng', 'North East', 'North West', 'South East', 'Southern'
];

export const SPECIES_OPTIONS = ['Cattle', 'Sheep', 'Goat', 'Donkey', 'Horse', 'Pig', 'Chicken', 'Other'];

export const ROLE_LABELS: Record<UserRole, string> = {
  farmer: 'Farmer',
  veterinary_officer: 'Veterinary Officer',
  extension_officer: 'Extension Officer',
  feedlot_operator: 'Feedlot Operator',
  abattoir_officer: 'Abattoir Officer',
  insurance_officer: 'Insurance Officer',
  financial_officer: 'Financial Officer',
  ministry_official: 'Ministry Official',
  admin: 'Administrator',
  operations_team: 'Operations Team',
};
