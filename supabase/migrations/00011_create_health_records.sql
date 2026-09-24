
-- ── Health Records ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.health_records (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id           uuid REFERENCES public.animals(id) ON DELETE CASCADE,
  farm_id             uuid REFERENCES public.farms(id) ON DELETE SET NULL,
  farmer_id           uuid REFERENCES public.farmers(id) ON DELETE SET NULL,
  recorded_by         uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Record classification
  record_type         text NOT NULL CHECK (record_type IN (
                        'vaccination','treatment','examination','surgery',
                        'deworming','vitamin_supplement','pregnancy_check','other'
                      )),
  title               text NOT NULL,
  description         text,

  -- Clinical data
  diagnosis           text,
  symptoms            text,
  prognosis           text CHECK (prognosis IN ('excellent','good','fair','poor','guarded') OR prognosis IS NULL),

  -- Treatment details
  medication_name     text,
  medication_dose     text,
  medication_route    text CHECK (medication_route IN ('oral','injection_im','injection_iv','injection_sc','topical','intranasal','other') OR medication_route IS NULL),
  withdrawal_days     integer CHECK (withdrawal_days >= 0),
  withdrawal_end_date date,

  -- Vaccination specific
  vaccine_name        text,
  vaccine_batch_no    text,
  next_due_date       date,

  -- Visit metadata
  visit_date          date NOT NULL DEFAULT CURRENT_DATE,
  visit_type          text NOT NULL DEFAULT 'routine' CHECK (visit_type IN ('routine','emergency','follow_up','preventive')),
  temperature_celsius numeric(4,1),
  weight_kg           numeric(6,2),
  body_condition_score integer CHECK (body_condition_score BETWEEN 1 AND 9),

  -- Outcome
  outcome             text CHECK (outcome IN ('recovered','improving','no_change','deteriorating','deceased','referred') OR outcome IS NULL),
  follow_up_required  boolean DEFAULT false,
  follow_up_date      date,
  follow_up_notes     text,

  -- Cost
  cost_pula           numeric(10,2),

  -- Attachments / notes
  notes               text,
  attachments         jsonb DEFAULT '[]',

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_health_records_animal_id   ON public.health_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_health_records_farm_id     ON public.health_records(farm_id);
CREATE INDEX IF NOT EXISTS idx_health_records_farmer_id   ON public.health_records(farmer_id);
CREATE INDEX IF NOT EXISTS idx_health_records_visit_date  ON public.health_records(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_records_record_type ON public.health_records(record_type);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_health_records_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE OR REPLACE TRIGGER trg_health_records_updated_at
  BEFORE UPDATE ON public.health_records
  FOR EACH ROW EXECUTE FUNCTION public.set_health_records_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

-- Vets, extension officers, admin, ops, ministry: full access
CREATE POLICY "hr_staff_all" ON public.health_records
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('veterinary_officer','extension_officer','admin','operations_team','ministry_official','abattoir_officer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('veterinary_officer','extension_officer','admin','operations_team','ministry_official','abattoir_officer')
    )
  );

-- Farmers: read their own animals' records
CREATE POLICY "hr_farmer_read_own" ON public.health_records
  FOR SELECT TO authenticated
  USING (
    farmer_id IN (
      SELECT id FROM public.farmers WHERE profile_id = auth.uid()
    )
  );
