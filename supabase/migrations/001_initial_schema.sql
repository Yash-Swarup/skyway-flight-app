-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── FLIGHTS ────────────────────────────────────────────────────────────────
CREATE TABLE flights (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flight_no     TEXT NOT NULL UNIQUE,
  origin        TEXT NOT NULL,
  destination   TEXT NOT NULL,
  departs_at    TIMESTAMPTZ NOT NULL,
  arrives_at    TIMESTAMPTZ NOT NULL,
  aircraft_type TEXT NOT NULL DEFAULT 'Boeing 737',
  status        TEXT NOT NULL DEFAULT 'scheduled'
                CHECK (status IN ('scheduled','boarding','departed','landed','cancelled')),
  base_price    NUMERIC(10,2) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SEATS ──────────────────────────────────────────────────────────────────
CREATE TABLE seats (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flight_id     UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  seat_number   TEXT NOT NULL,
  class         TEXT NOT NULL CHECK (class IN ('economy','business','first')),
  is_available  BOOLEAN NOT NULL DEFAULT true,
  extra_fee     NUMERIC(10,2) NOT NULL DEFAULT 0,
  UNIQUE(flight_id, seat_number)
);

-- ─── BOOKINGS ───────────────────────────────────────────────────────────────
CREATE TABLE bookings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flight_id     UUID NOT NULL REFERENCES flights(id),
  seat_id       UUID NOT NULL REFERENCES seats(id),
  status        TEXT NOT NULL DEFAULT 'confirmed'
                CHECK (status IN ('confirmed','rescheduled','cancelled')),
  booked_at     TIMESTAMPTZ DEFAULT NOW(),
  total_price   NUMERIC(10,2) NOT NULL,
  pnr_code      TEXT NOT NULL UNIQUE DEFAULT upper(substring(uuid_generate_v4()::text,1,6))
);

-- ─── PASSENGERS ─────────────────────────────────────────────────────────────
CREATE TABLE passengers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  passport_no   TEXT NOT NULL,
  nationality   TEXT NOT NULL,
  dob           DATE NOT NULL
);

-- ─── RESCHEDULES ────────────────────────────────────────────────────────────
CREATE TABLE reschedules (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  old_flight_id UUID NOT NULL REFERENCES flights(id),
  new_flight_id UUID NOT NULL REFERENCES flights(id),
  requested_at  TIMESTAMPTZ DEFAULT NOW(),
  fee_charged   NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────
ALTER TABLE flights     ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reschedules ENABLE ROW LEVEL SECURITY;

-- Flights & seats: anyone (including anon) can read
CREATE POLICY "flights_public_read"  ON flights  FOR SELECT USING (true);
CREATE POLICY "seats_public_read"    ON seats    FOR SELECT USING (true);

-- Bookings: owners only
CREATE POLICY "bookings_select" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookings_insert" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookings_update" ON bookings FOR UPDATE USING (auth.uid() = user_id);

-- Passengers: via booking ownership
CREATE POLICY "passengers_select" ON passengers FOR SELECT
  USING (EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.user_id = auth.uid()));
CREATE POLICY "passengers_insert" ON passengers FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.user_id = auth.uid()));

-- Reschedules: via booking ownership
CREATE POLICY "reschedules_select" ON reschedules FOR SELECT
  USING (EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.user_id = auth.uid()));
CREATE POLICY "reschedules_insert" ON reschedules FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.user_id = auth.uid()));

-- ─── SEAT RESERVATION RPC (prevents double-booking) ─────────────────────────
CREATE OR REPLACE FUNCTION reserve_seat(p_seat_id UUID, p_flight_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available BOOLEAN;
BEGIN
  -- Lock the row for update
  SELECT is_available INTO v_available
  FROM seats
  WHERE id = p_seat_id AND flight_id = p_flight_id
  FOR UPDATE;

  IF v_available IS NULL THEN
    RAISE EXCEPTION 'Seat not found';
  END IF;

  IF NOT v_available THEN
    RETURN FALSE;
  END IF;

  UPDATE seats SET is_available = false WHERE id = p_seat_id;
  RETURN TRUE;
END;
$$;

-- ─── CANCEL BOOKING RPC (atomic cancel + seat release) ──────────────────────
CREATE OR REPLACE FUNCTION cancel_booking(p_booking_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id   UUID;
  v_seat_id   UUID;
  v_departs   TIMESTAMPTZ;
  v_status    TEXT;
BEGIN
  SELECT b.user_id, b.seat_id, b.status, f.departs_at
  INTO v_user_id, v_seat_id, v_status, v_departs
  FROM bookings b
  JOIN flights f ON f.id = b.flight_id
  WHERE b.id = p_booking_id
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_status = 'cancelled' THEN
    RAISE EXCEPTION 'Booking already cancelled';
  END IF;

  -- Enforce 2-hour cancellation window at DB level
  IF v_departs - NOW() < INTERVAL '2 hours' THEN
    RAISE EXCEPTION 'Cancellation not allowed within 2 hours of departure';
  END IF;

  UPDATE bookings SET status = 'cancelled' WHERE id = p_booking_id;
  UPDATE seats SET is_available = true WHERE id = v_seat_id;

  RETURN TRUE;
END;
$$;

-- Enable Realtime on seats
ALTER PUBLICATION supabase_realtime ADD TABLE seats;
