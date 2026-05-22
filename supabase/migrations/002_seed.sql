-- ─── SEED FLIGHTS (8 flights, 4 routes) ─────────────────────────────────────
INSERT INTO flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price) VALUES
-- Route 1: DEL → BOM
('f1000000-0000-0000-0000-000000000001','SA101','Delhi','Mumbai',       NOW() + INTERVAL '2 days 6 hours',  NOW() + INTERVAL '2 days 8 hours',  'Airbus A320','scheduled', 3500),
('f1000000-0000-0000-0000-000000000002','SA102','Delhi','Mumbai',       NOW() + INTERVAL '3 days 14 hours', NOW() + INTERVAL '3 days 16 hours', 'Airbus A320','scheduled', 3200),
-- Route 2: BOM → DEL
('f1000000-0000-0000-0000-000000000003','SA201','Mumbai','Delhi',       NOW() + INTERVAL '2 days 9 hours',  NOW() + INTERVAL '2 days 11 hours', 'Boeing 737', 'scheduled', 3400),
('f1000000-0000-0000-0000-000000000004','SA202','Mumbai','Delhi',       NOW() + INTERVAL '4 days 7 hours',  NOW() + INTERVAL '4 days 9 hours',  'Boeing 737', 'scheduled', 3100),
-- Route 3: BLR → HYD
('f1000000-0000-0000-0000-000000000005','SA301','Bangalore','Hyderabad',NOW() + INTERVAL '1 day 8 hours',  NOW() + INTERVAL '1 day 9 hours',   'ATR 72',    'scheduled', 2200),
('f1000000-0000-0000-0000-000000000006','SA302','Bangalore','Hyderabad',NOW() + INTERVAL '5 days 13 hours',NOW() + INTERVAL '5 days 14 hours', 'ATR 72',    'scheduled', 2000),
-- Route 4: HYD → BLR
('f1000000-0000-0000-0000-000000000007','SA401','Hyderabad','Bangalore',NOW() + INTERVAL '2 days 10 hours',NOW() + INTERVAL '2 days 11 hours', 'ATR 72',    'scheduled', 2100),
('f1000000-0000-0000-0000-000000000008','SA402','Hyderabad','Bangalore',NOW() + INTERVAL '6 days 16 hours',NOW() + INTERVAL '6 days 17 hours', 'ATR 72',    'scheduled', 1900);

-- ─── HELPER: generate seat map for a flight ──────────────────────────────────
-- For ATR 72: 4 first (rows 1-2, A-B), 8 business (rows 3-4, A-D), rest economy
-- For A320/737: 6 first (rows 1-2, ABC), 12 business (rows 3-6, ABCDEF), rest economy

CREATE OR REPLACE FUNCTION seed_seats_for_flight(
  p_flight_id UUID,
  p_aircraft  TEXT
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  r INT; c TEXT; class TEXT; fee NUMERIC;
  cols TEXT[];
  max_rows INT;
BEGIN
  IF p_aircraft ILIKE '%ATR%' THEN
    cols := ARRAY['A','B','C','D'];
    max_rows := 18;
  ELSE
    cols := ARRAY['A','B','C','D','E','F'];
    max_rows := 30;
  END IF;

  FOR r IN 1..max_rows LOOP
    FOREACH c IN ARRAY cols LOOP
      IF p_aircraft ILIKE '%ATR%' THEN
        IF r <= 2   THEN class := 'first';    fee := 3000;
        ELSIF r <= 4 THEN class := 'business'; fee := 1500;
        ELSE              class := 'economy';  fee := 0;
        END IF;
      ELSE
        IF r <= 2   THEN class := 'first';    fee := 5000;
        ELSIF r <= 6 THEN class := 'business'; fee := 2500;
        ELSE              class := 'economy';  fee := 0;
        END IF;
      END IF;
      INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
      VALUES (p_flight_id, r::TEXT || c, class, true, fee)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;

-- Seed seats for all 8 flights
SELECT seed_seats_for_flight('f1000000-0000-0000-0000-000000000001','Airbus A320');
SELECT seed_seats_for_flight('f1000000-0000-0000-0000-000000000002','Airbus A320');
SELECT seed_seats_for_flight('f1000000-0000-0000-0000-000000000003','Boeing 737');
SELECT seed_seats_for_flight('f1000000-0000-0000-0000-000000000004','Boeing 737');
SELECT seed_seats_for_flight('f1000000-0000-0000-0000-000000000005','ATR 72');
SELECT seed_seats_for_flight('f1000000-0000-0000-0000-000000000006','ATR 72');
SELECT seed_seats_for_flight('f1000000-0000-0000-0000-000000000007','ATR 72');
SELECT seed_seats_for_flight('f1000000-0000-0000-0000-000000000008','ATR 72');

-- Mark a few seats as occupied for demo realism
UPDATE seats SET is_available = false
WHERE flight_id = 'f1000000-0000-0000-0000-000000000001'
  AND seat_number IN ('5A','5B','7C','12D','15F','20A','20B','22E');

UPDATE seats SET is_available = false
WHERE flight_id = 'f1000000-0000-0000-0000-000000000003'
  AND seat_number IN ('3A','4B','8C','9D','11F','18A','25B');
