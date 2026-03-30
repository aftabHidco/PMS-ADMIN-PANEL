-- pgAdmin-ready reporting layer for the current PMS schema.
-- Safe to run multiple times: uses CREATE SCHEMA IF NOT EXISTS and CREATE OR REPLACE VIEW.

CREATE SCHEMA IF NOT EXISTS reporting;

CREATE OR REPLACE VIEW reporting.v_cancellation_policy_config AS
SELECT
  cp.id AS cancellation_policy_id,
  cp.name AS policy_name,
  cp.description AS policy_description,
  cp.deduction_percentage,
  CASE
    WHEN jsonb_typeof(cp.rules) = 'object'
      AND NULLIF(cp.rules ->> 'refund_window_days', '') IS NOT NULL
    THEN (cp.rules ->> 'refund_window_days')::integer
    ELSE NULL
  END AS refund_window_days,
  CASE
    WHEN jsonb_typeof(cp.rules) = 'object'
    THEN cp.rules -> 'applies_on_booking_status'
    ELSE NULL
  END AS applies_on_booking_status,
  cp.rules,
  cp.created_at,
  cp.updated_at
FROM pms_cancellation_policies cp;

CREATE OR REPLACE VIEW reporting.v_booking_register AS
WITH booking_guest_stats AS (
  SELECT
    bg.booking_id,
    COUNT(*) AS booking_document_rows,
    COUNT(DISTINCT COALESCE(bg.person_index::text, NULLIF(bg.person_name, ''))) AS documented_people_count,
    MAX(bg.created_at) AS latest_document_uploaded_at
  FROM pms_booking_guest bg
  GROUP BY bg.booking_id
)
SELECT
  b.booking_id,
  b.booking_code,
  b.created_at AS booking_created_at,
  b.updated_at AS booking_updated_at,
  b.property_id,
  p.property_name,
  p.property_code,
  p.city,
  p.state,
  b.user_id,
  u.full_name AS guest_name,
  u.email AS guest_email,
  u.phone AS guest_phone,
  b.checkin_date,
  b.checkout_date,
  GREATEST(b.checkout_date - b.checkin_date, 0) AS stay_nights,
  b.num_guests,
  b.status AS booking_status,
  b.source AS booking_source,
  b.notes,
  b.cancel_by,
  cancel_user.full_name AS cancelled_by_name,
  b.cancelled_at,
  b.cancellation_policy_id,
  cpc.policy_name AS cancellation_policy_name,
  cpc.deduction_percentage AS policy_deduction_percentage,
  cpc.refund_window_days,
  b.custom_cancellation_deduction_percentage,
  b.invoice,
  bi.item_id,
  bi.room_type_id,
  rt.room_type_code,
  rt.room_type_name,
  bi.quantity AS booked_room_qty,
  bi.unit_price,
  bi.amount AS room_line_amount,
  b.total_amount AS booking_total_amount,
  COALESCE(bgs.booking_document_rows, 0) AS booking_document_rows,
  COALESCE(bgs.documented_people_count, 0) AS documented_people_count,
  COALESCE(GREATEST(b.num_guests - bgs.documented_people_count, 0), b.num_guests) AS missing_guest_document_count,
  bgs.latest_document_uploaded_at
FROM pms_bookings b
LEFT JOIN pms_properties p
  ON p.property_id = b.property_id
LEFT JOIN pms_users u
  ON u.user_id = b.user_id
LEFT JOIN pms_users cancel_user
  ON cancel_user.user_id = b.cancel_by
LEFT JOIN pms_booking_items bi
  ON bi.booking_id = b.booking_id
LEFT JOIN pms_room_types rt
  ON rt.room_type_id = bi.room_type_id
LEFT JOIN reporting.v_cancellation_policy_config cpc
  ON cpc.cancellation_policy_id = b.cancellation_policy_id
LEFT JOIN booking_guest_stats bgs
  ON bgs.booking_id = b.booking_id;

CREATE OR REPLACE VIEW reporting.v_occupancy_inventory AS
SELECT
  ri.inventory_id,
  ri.inventory_date,
  ri.property_id,
  p.property_name,
  p.property_code,
  ri.room_type_id,
  rt.room_type_code,
  rt.room_type_name,
  rt.qty AS configured_room_qty,
  rt.inventory_mode,
  rt.base_occupancy,
  rt.max_occupancy,
  ri.total_units,
  ri.available_units,
  GREATEST(ri.total_units - ri.available_units, 0) AS booked_units,
  ROUND(
    (
      GREATEST(ri.total_units - ri.available_units, 0)::numeric
      / NULLIF(ri.total_units, 0)::numeric
    ) * 100,
    2
  ) AS occupancy_pct,
  ri.created_at,
  ri.updated_at
FROM pms_room_inventory ri
LEFT JOIN pms_properties p
  ON p.property_id = ri.property_id
LEFT JOIN pms_room_types rt
  ON rt.room_type_id = ri.room_type_id;

CREATE OR REPLACE VIEW reporting.v_payment_collection AS
SELECT
  pay.payment_id,
  pay.booking_id,
  b.booking_code,
  b.property_id,
  p.property_name,
  p.property_code,
  b.user_id,
  guest.full_name AS guest_name,
  guest.email AS guest_email,
  guest.phone AS guest_phone,
  b.checkin_date,
  b.checkout_date,
  b.status AS booking_status,
  pay.payment_mode,
  pay.payment_source,
  pay.payment_gateway,
  pay.provider,
  pay.transaction_id,
  pay.status AS payment_status,
  pay.currency,
  pay.base_amount,
  pay.tax_id,
  t.tax_name,
  t.tax_code,
  COALESCE(pay.tax_percentage, t.percentage) AS tax_percentage,
  pay.tax_amount,
  pay.amount AS gross_amount,
  pay.paid_by_user_id,
  paid_by.full_name AS paid_by_user_name,
  pay.paid_by_role,
  pay.created_at,
  pay.updated_at
FROM pms_payments pay
LEFT JOIN pms_bookings b
  ON b.booking_id = pay.booking_id
LEFT JOIN pms_properties p
  ON p.property_id = b.property_id
LEFT JOIN pms_users guest
  ON guest.user_id = b.user_id
LEFT JOIN pms_users paid_by
  ON paid_by.user_id = pay.paid_by_user_id
LEFT JOIN pms_taxes t
  ON t.tax_id = pay.tax_id;

CREATE OR REPLACE VIEW reporting.v_refund_register AS
SELECT
  r.refund_id,
  r.booking_id,
  b.booking_code,
  b.property_id,
  p.property_name,
  p.property_code,
  b.user_id,
  guest.full_name AS guest_name,
  guest.phone AS guest_phone,
  r.payment_id,
  pay.payment_mode,
  pay.payment_gateway,
  pay.provider,
  pay.transaction_id AS original_transaction_id,
  r.refund_amount,
  r.currency,
  r.refund_status,
  r.refund_reason,
  r.refund_mode,
  r.refund_gateway,
  r.refund_transaction_id,
  r.failure_reason,
  r.processed_at,
  r.created_at,
  r.updated_at
FROM pms_refunds r
LEFT JOIN pms_payments pay
  ON pay.payment_id = r.payment_id
LEFT JOIN pms_bookings b
  ON b.booking_id = r.booking_id
LEFT JOIN pms_properties p
  ON p.property_id = b.property_id
LEFT JOIN pms_users guest
  ON guest.user_id = b.user_id;

CREATE OR REPLACE VIEW reporting.v_cancellation_analysis AS
WITH payment_totals AS (
  SELECT
    pay.booking_id,
    SUM(
      CASE
        WHEN LOWER(COALESCE(pay.status, '')) IN ('success', 'paid', 'partial_refunded', 'refunded')
        THEN COALESCE(pay.amount, 0)
        ELSE 0
      END
    ) AS paid_amount
  FROM pms_payments pay
  GROUP BY pay.booking_id
),
refund_totals AS (
  SELECT
    r.booking_id,
    SUM(
      CASE
        WHEN LOWER(COALESCE(r.refund_status, '')) IN ('success', 'processed', 'completed')
        THEN COALESCE(r.refund_amount, 0)
        ELSE 0
      END
    ) AS refunded_amount
  FROM pms_refunds r
  GROUP BY r.booking_id
)
SELECT
  b.booking_id,
  b.booking_code,
  b.property_id,
  p.property_name,
  p.property_code,
  b.user_id,
  guest.full_name AS guest_name,
  guest.phone AS guest_phone,
  b.checkin_date,
  b.checkout_date,
  GREATEST(b.checkout_date - b.checkin_date, 0) AS stay_nights,
  b.status AS booking_status,
  b.cancelled_at,
  b.cancel_by,
  cancel_user.full_name AS cancelled_by_name,
  CASE
    WHEN b.cancelled_at IS NOT NULL
    THEN b.checkin_date - (b.cancelled_at AT TIME ZONE 'UTC')::date
    ELSE NULL
  END AS days_before_checkin_cancelled,
  b.cancellation_policy_id,
  cpc.policy_name AS cancellation_policy_name,
  cpc.deduction_percentage AS policy_deduction_percentage,
  cpc.refund_window_days,
  b.custom_cancellation_deduction_percentage,
  COALESCE(b.total_amount, 0) AS booking_total_amount,
  COALESCE(pt.paid_amount, 0) AS paid_amount,
  COALESCE(rt.refunded_amount, 0) AS refunded_amount,
  GREATEST(COALESCE(pt.paid_amount, 0) - COALESCE(rt.refunded_amount, 0), 0) AS retained_amount
FROM pms_bookings b
LEFT JOIN pms_properties p
  ON p.property_id = b.property_id
LEFT JOIN pms_users guest
  ON guest.user_id = b.user_id
LEFT JOIN pms_users cancel_user
  ON cancel_user.user_id = b.cancel_by
LEFT JOIN reporting.v_cancellation_policy_config cpc
  ON cpc.cancellation_policy_id = b.cancellation_policy_id
LEFT JOIN payment_totals pt
  ON pt.booking_id = b.booking_id
LEFT JOIN refund_totals rt
  ON rt.booking_id = b.booking_id
WHERE LOWER(COALESCE(b.status, '')) IN ('cancelled', 'canceled')
   OR b.cancelled_at IS NOT NULL;

CREATE OR REPLACE VIEW reporting.v_room_type_performance AS
SELECT
  b.booking_id,
  b.booking_code,
  b.created_at::date AS booking_created_date,
  b.checkin_date,
  b.checkout_date,
  b.property_id,
  p.property_name,
  p.property_code,
  bi.room_type_id,
  rt.room_type_code,
  rt.room_type_name,
  rt.qty AS configured_room_qty,
  rt.base_occupancy,
  rt.max_occupancy,
  b.user_id,
  u.full_name AS guest_name,
  b.status AS booking_status,
  bi.quantity AS rooms_sold,
  bi.unit_price,
  bi.amount AS room_revenue,
  b.total_amount AS booking_total_amount
FROM pms_booking_items bi
INNER JOIN pms_bookings b
  ON b.booking_id = bi.booking_id
LEFT JOIN pms_room_types rt
  ON rt.room_type_id = bi.room_type_id
LEFT JOIN pms_properties p
  ON p.property_id = b.property_id
LEFT JOIN pms_users u
  ON u.user_id = b.user_id;

CREATE OR REPLACE VIEW reporting.v_property_performance_daily AS
WITH date_spine AS (
  SELECT property_id, created_at::date AS report_date
  FROM pms_bookings
  UNION
  SELECT property_id, checkin_date AS report_date
  FROM pms_bookings
  UNION
  SELECT b.property_id, pay.created_at::date AS report_date
  FROM pms_payments pay
  INNER JOIN pms_bookings b
    ON b.booking_id = pay.booking_id
  UNION
  SELECT b.property_id, r.created_at::date AS report_date
  FROM pms_refunds r
  INNER JOIN pms_bookings b
    ON b.booking_id = r.booking_id
  UNION
  SELECT property_id, inventory_date AS report_date
  FROM pms_room_inventory
),
booking_created AS (
  SELECT
    property_id,
    created_at::date AS report_date,
    COUNT(*) AS bookings_created_count,
    SUM(COALESCE(total_amount, 0)) AS gross_booking_value
  FROM pms_bookings
  GROUP BY property_id, created_at::date
),
arrivals AS (
  SELECT
    property_id,
    checkin_date AS report_date,
    COUNT(*) AS arrivals_count
  FROM pms_bookings
  GROUP BY property_id, checkin_date
),
departures AS (
  SELECT
    property_id,
    checkout_date AS report_date,
    COUNT(*) AS departures_count
  FROM pms_bookings
  GROUP BY property_id, checkout_date
),
cancellations AS (
  SELECT
    property_id,
    cancelled_at::date AS report_date,
    COUNT(*) AS cancellations_count
  FROM pms_bookings
  WHERE cancelled_at IS NOT NULL
  GROUP BY property_id, cancelled_at::date
),
payments AS (
  SELECT
    b.property_id,
    pay.created_at::date AS report_date,
    SUM(
      CASE
        WHEN LOWER(COALESCE(pay.status, '')) IN ('success', 'paid', 'partial_refunded', 'refunded')
        THEN COALESCE(pay.amount, 0)
        ELSE 0
      END
    ) AS payments_collected
  FROM pms_payments pay
  INNER JOIN pms_bookings b
    ON b.booking_id = pay.booking_id
  GROUP BY b.property_id, pay.created_at::date
),
refunds AS (
  SELECT
    b.property_id,
    r.created_at::date AS report_date,
    SUM(
      CASE
        WHEN LOWER(COALESCE(r.refund_status, '')) IN ('success', 'processed', 'completed')
        THEN COALESCE(r.refund_amount, 0)
        ELSE 0
      END
    ) AS refunds_issued
  FROM pms_refunds r
  INNER JOIN pms_bookings b
    ON b.booking_id = r.booking_id
  GROUP BY b.property_id, r.created_at::date
),
inventory AS (
  SELECT
    property_id,
    inventory_date AS report_date,
    SUM(COALESCE(total_units, 0)) AS total_units,
    SUM(COALESCE(available_units, 0)) AS available_units,
    SUM(GREATEST(COALESCE(total_units, 0) - COALESCE(available_units, 0), 0)) AS booked_units
  FROM pms_room_inventory
  GROUP BY property_id, inventory_date
),
room_type_counts AS (
  SELECT
    rt.property_id,
    COUNT(*) AS room_type_count,
    SUM(COALESCE(rt.qty, 0)) AS configured_room_count
  FROM pms_room_types rt
  GROUP BY rt.property_id
)
SELECT
  ds.property_id,
  p.property_name,
  p.property_code,
  ds.report_date,
  COALESCE(rtc.room_type_count, 0) AS room_type_count,
  COALESCE(rtc.configured_room_count, 0) AS configured_room_count,
  COALESCE(bc.bookings_created_count, 0) AS bookings_created_count,
  COALESCE(bc.gross_booking_value, 0) AS gross_booking_value,
  COALESCE(a.arrivals_count, 0) AS arrivals_count,
  COALESCE(d.departures_count, 0) AS departures_count,
  COALESCE(c.cancellations_count, 0) AS cancellations_count,
  COALESCE(pay.payments_collected, 0) AS payments_collected,
  COALESCE(ref.refunds_issued, 0) AS refunds_issued,
  COALESCE(pay.payments_collected, 0) - COALESCE(ref.refunds_issued, 0) AS net_cash,
  COALESCE(inv.total_units, 0) AS total_units,
  COALESCE(inv.available_units, 0) AS available_units,
  COALESCE(inv.booked_units, 0) AS booked_units,
  ROUND(
    (
      COALESCE(inv.booked_units, 0)::numeric
      / NULLIF(COALESCE(inv.total_units, 0), 0)::numeric
    ) * 100,
    2
  ) AS occupancy_pct
FROM date_spine ds
LEFT JOIN pms_properties p
  ON p.property_id = ds.property_id
LEFT JOIN room_type_counts rtc
  ON rtc.property_id = ds.property_id
LEFT JOIN booking_created bc
  ON bc.property_id = ds.property_id
 AND bc.report_date = ds.report_date
LEFT JOIN arrivals a
  ON a.property_id = ds.property_id
 AND a.report_date = ds.report_date
LEFT JOIN departures d
  ON d.property_id = ds.property_id
 AND d.report_date = ds.report_date
LEFT JOIN cancellations c
  ON c.property_id = ds.property_id
 AND c.report_date = ds.report_date
LEFT JOIN payments pay
  ON pay.property_id = ds.property_id
 AND pay.report_date = ds.report_date
LEFT JOIN refunds ref
  ON ref.property_id = ds.property_id
 AND ref.report_date = ds.report_date
LEFT JOIN inventory inv
  ON inv.property_id = ds.property_id
 AND inv.report_date = ds.report_date;

CREATE OR REPLACE VIEW reporting.v_guest_document_compliance AS
WITH doc_stats AS (
  SELECT
    bg.booking_id,
    COUNT(*) AS document_rows,
    COUNT(DISTINCT COALESCE(bg.person_index::text, NULLIF(bg.person_name, ''))) AS documented_people_count,
    MAX(bg.created_at) AS latest_document_uploaded_at
  FROM pms_booking_guest bg
  GROUP BY bg.booking_id
)
SELECT
  b.booking_id,
  b.booking_code,
  b.property_id,
  p.property_name,
  p.property_code,
  b.user_id,
  u.full_name AS guest_name,
  u.phone AS guest_phone,
  b.checkin_date,
  b.checkout_date,
  b.num_guests,
  b.status AS booking_status,
  COALESCE(ds.document_rows, 0) AS document_rows,
  COALESCE(ds.documented_people_count, 0) AS documented_people_count,
  GREATEST(COALESCE(b.num_guests, 0) - COALESCE(ds.documented_people_count, 0), 0) AS missing_guest_document_count,
  (COALESCE(ds.document_rows, 0) > 0) AS has_any_documents,
  ds.latest_document_uploaded_at
FROM pms_bookings b
LEFT JOIN pms_properties p
  ON p.property_id = b.property_id
LEFT JOIN pms_users u
  ON u.user_id = b.user_id
LEFT JOIN doc_stats ds
  ON ds.booking_id = b.booking_id;

CREATE OR REPLACE VIEW reporting.v_pricing_matrix AS
SELECT
  rp.pricing_id,
  rt.property_id,
  p.property_name,
  p.property_code,
  rp.room_type_id,
  rt.room_type_code,
  rt.room_type_name,
  rt.qty AS configured_room_qty,
  rp.season_id,
  s.season_name,
  s.is_peak,
  s.start_date AS season_start_month,
  s.end_date AS season_end_month,
  rp.day_type,
  rp.price,
  rp.created_at,
  rp.updated_at
FROM pms_room_pricing rp
LEFT JOIN pms_room_types rt
  ON rt.room_type_id = rp.room_type_id
LEFT JOIN pms_properties p
  ON p.property_id = rt.property_id
LEFT JOIN pms_seasons s
  ON s.season_id = rp.season_id;

CREATE OR REPLACE VIEW reporting.v_tax_collection AS
SELECT
  pay.payment_id,
  pay.booking_id,
  b.booking_code,
  b.property_id,
  p.property_name,
  p.property_code,
  pay.tax_id,
  t.tax_name,
  t.tax_code,
  COALESCE(pay.tax_percentage, t.percentage) AS tax_percentage,
  pay.base_amount,
  pay.tax_amount,
  pay.amount AS gross_amount,
  pay.currency,
  pay.payment_mode,
  pay.status AS payment_status,
  pay.created_at,
  b.status AS booking_status,
  guest.full_name AS guest_name
FROM pms_payments pay
LEFT JOIN pms_taxes t
  ON t.tax_id = pay.tax_id
LEFT JOIN pms_bookings b
  ON b.booking_id = pay.booking_id
LEFT JOIN pms_properties p
  ON p.property_id = b.property_id
LEFT JOIN pms_users guest
  ON guest.user_id = b.user_id;

-- Example queries for pgAdmin:
-- SELECT * FROM reporting.v_booking_register ORDER BY booking_created_at DESC;
-- SELECT * FROM reporting.v_occupancy_inventory WHERE inventory_date BETWEEN DATE '2026-03-01' AND DATE '2026-03-31';
-- SELECT * FROM reporting.v_payment_collection WHERE payment_status = 'success';
-- SELECT * FROM reporting.v_refund_register ORDER BY created_at DESC;
-- SELECT * FROM reporting.v_cancellation_analysis ORDER BY cancelled_at DESC;
-- SELECT * FROM reporting.v_room_type_performance WHERE property_id = 1 ORDER BY checkin_date DESC;
-- SELECT * FROM reporting.v_property_performance_daily WHERE property_id = 1 ORDER BY report_date DESC;
-- SELECT * FROM reporting.v_guest_document_compliance WHERE missing_guest_document_count > 0;
-- SELECT * FROM reporting.v_pricing_matrix ORDER BY property_id, room_type_id, season_id NULLS FIRST, day_type;
-- SELECT * FROM reporting.v_tax_collection ORDER BY created_at DESC;
