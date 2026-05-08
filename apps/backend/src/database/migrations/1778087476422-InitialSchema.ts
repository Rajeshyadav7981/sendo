import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline schema for every non-tracker table. Captures the state produced by
 * the old `synchronize: true` boot. Runs before AddTrackerTables1778087476423.
 *
 * Idempotent: on a database that already has these tables (legacy sync run),
 * the migration records itself as applied without re-running the DDL.
 */
export class InitialSchema1778087476422 implements MigrationInterface {
  name = 'InitialSchema1778087476422';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const existing: Array<{ name: string }> = await queryRunner.query(
      `SELECT table_name AS name FROM information_schema.tables WHERE table_schema = 'sendo' AND table_name = 'drivers'`,
    );
    if (existing.length > 0) {
      return;
    }

    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS "sendo"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(BASELINE_SQL);
  }

  public async down(): Promise<void> {
    throw new Error(
      'Refusing to revert InitialSchema — drops every table. If you really want to wipe the schema, run "DROP SCHEMA sendo CASCADE" manually.',
    );
  }
}

const BASELINE_SQL = `
CREATE TYPE sendo.attendances_status_enum AS ENUM (
    'Pending',
    'Approved',
    'Rejected'
);

CREATE TYPE sendo.driver_advances_approval_status_enum AS ENUM (
    'Pending',
    'Approved',
    'Rejected'
);

CREATE TYPE sendo.expenses_expense_type_enum AS ENUM (
    'Vehicle Expense',
    'Others'
);

CREATE TYPE sendo.expenses_payment_method_enum AS ENUM (
    'Cash',
    'Card',
    'Cheque',
    'UPI',
    'Bank Transfer'
);

CREATE TYPE sendo.leaves_status_enum AS ENUM (
    'Pending',
    'Approved',
    'Rejected'
);

CREATE TYPE sendo.spare_parts_part_category_enum AS ENUM (
    'Engine',
    'Brake',
    'Suspension',
    'Electrical'
);

CREATE TYPE sendo.truck_maintenances_maintenance_type_enum AS ENUM (
    'Regular Maintenance',
    'Oil Service',
    'Tyre Service',
    'Battery Service',
    'RTO / Document Expense',
    'Spare Parts Service',
    'Inventory Service',
    'Loan'
);

CREATE TYPE sendo.users_role_enum AS ENUM (
    'ADMIN',
    'MANAGER',
    'DRIVER'
);

CREATE TYPE sendo.vehicles_national_permit_enum AS ENUM (
    'Yes',
    'No'
);

CREATE TYPE sendo.vehicles_state_permit_enum AS ENUM (
    'Yes',
    'No'
);

CREATE TYPE sendo.vehicles_temporary_permit_enum AS ENUM (
    'Yes',
    'No'
);

CREATE TYPE sendo.vehicles_vehicle_type_enum AS ENUM (
    'Pickup Truck',
    '407 Truck',
    '17FT',
    '20FT',
    'Truck',
    'Bus',
    'Car',
    'Bike'
);

CREATE TYPE sendo.vendors_vender_site_code_enum AS ENUM (
    'Rental',
    'Adhoc'
);

CREATE TABLE sendo.agreements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_name character varying(200),
    vehicle_number character varying(32),
    agreement_type character varying(100),
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    rate_per_km numeric(12,2),
    fixed_rate numeric(12,2),
    payment_terms character varying(200),
    terms text,
    status character varying(50) DEFAULT 'Active'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.attendances (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    driver_id character varying(32) NOT NULL,
    driver_name character varying(200) NOT NULL,
    vehicle_number character varying(32) NOT NULL,
    start_time character varying(64) NOT NULL,
    stop_time character varying(64) NOT NULL,
    duration character varying(64) NOT NULL,
    status sendo.attendances_status_enum DEFAULT 'Pending'::sendo.attendances_status_enum NOT NULL,
    driver_shift_label character varying(100),
    shift_detail character varying(200),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.customer_invoices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    invoice_number character varying(100),
    customer_name character varying(200),
    vehicle_number character varying(32),
    trip_from character varying(200),
    trip_to character varying(200),
    invoice_date timestamp with time zone,
    due_date timestamp with time zone,
    amount numeric(12,2),
    gst_amount numeric(12,2),
    total_amount numeric(12,2),
    status character varying(50) DEFAULT 'Unpaid'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.customer_payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_name character varying(200),
    invoice_number character varying(100),
    invoice_amount numeric(12,2),
    amount_received numeric(12,2),
    balance_due numeric(12,2),
    payment_date timestamp with time zone,
    payment_mode character varying(50),
    utr_number character varying(100),
    remarks text,
    status character varying(50) DEFAULT 'Pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.customers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    company_name character varying(200) NOT NULL,
    address text NOT NULL,
    point_of_contact character varying(200) NOT NULL,
    state character varying(100) NOT NULL,
    phone_number character varying(32) NOT NULL,
    email_id character varying(200) NOT NULL,
    gst_number character varying(32) NOT NULL,
    rate_card text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.deductions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    date timestamp with time zone,
    driver_id character varying(32),
    driver_name character varying(200),
    driver_mobile character varying(32),
    vehicle_number character varying(32),
    loss_type character varying(100),
    location character varying(200),
    description text,
    amount numeric(12,2),
    recovery_status character varying(50),
    remarks text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.diesel_entries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    date timestamp with time zone,
    "time" character varying(20),
    vehicle_number character varying(32),
    vehicle_type character varying(50),
    owner_name character varying(200),
    driver_name character varying(200),
    vehicle_route character varying(200),
    pump_name character varying(200),
    fuel_type character varying(50),
    volume numeric(10,2),
    rate_per_liter numeric(10,2),
    total_amount numeric(12,2),
    amount numeric(12,2),
    start_km numeric(12,2),
    end_km numeric(12,2),
    total_km numeric(12,2),
    mileage numeric(10,2),
    payment_mode character varying(50),
    payment_type character varying(50),
    paid_by character varying(200),
    payment_reference character varying(200),
    remarks text,
    diesel_slip_photo text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.driver_advances (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    driver_id character varying(32) NOT NULL,
    driver_name character varying(200) NOT NULL,
    month character varying(32) NOT NULL,
    requested_amount numeric(12,2) NOT NULL,
    approved_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    approval_status sendo.driver_advances_approval_status_enum DEFAULT 'Pending'::sendo.driver_advances_approval_status_enum NOT NULL,
    requested_at timestamp without time zone DEFAULT now() NOT NULL,
    approved_at timestamp with time zone,
    approved_by character varying(200)
);

CREATE TABLE sendo.driver_payouts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    driver_id character varying(32) NOT NULL,
    month character varying(32) NOT NULL,
    total_days integer,
    daily_wage numeric(12,2),
    basic_payment numeric(12,2),
    total_working_days integer,
    total_holidays integer,
    earned_payment numeric(12,2),
    approved_amount numeric(12,2),
    deductions numeric(12,2),
    other_expenses numeric(12,2),
    payable_amount numeric(12,2),
    attendance_data jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.drivers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    driver_id character varying(32) NOT NULL,
    first_name character varying(100),
    second_name character varying(100),
    surname character varying(100),
    father_name character varying(200),
    address text,
    dob date,
    dl_number character varying(64),
    dl_valid_till date,
    dl_type character varying(50),
    joining_date date,
    basic_payment numeric(12,2),
    name_as_per_bank character varying(200),
    bank_account_number character varying(64),
    ifsc character varying(32),
    bank_name character varying(200),
    pan_no character varying(32),
    aadhar_number character varying(32),
    contact_number character varying(32),
    emergency_contact character varying(32),
    shift_type character varying(50),
    refer_by character varying(200),
    state character varying(100),
    shift_a boolean DEFAULT false NOT NULL,
    shift_b boolean DEFAULT false NOT NULL,
    is_driver boolean DEFAULT false NOT NULL,
    refer_by_driver_id character varying(32),
    refer_by_driver_name character varying(200),
    profile_picture text,
    aadhar_file text,
    pan_file text,
    dl_file text,
    bank_passbook_file text,
    is_draft boolean DEFAULT false NOT NULL,
    draft_data jsonb,
    referral_bonus numeric(12,2),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.expenses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    date timestamp with time zone,
    expense_type sendo.expenses_expense_type_enum,
    vehicle_number character varying(32),
    category character varying(100),
    vendor character varying(200),
    description text,
    amount numeric(12,2),
    requested_by character varying(200),
    paid_by character varying(200),
    payment_method sendo.expenses_payment_method_enum,
    payment_reference character varying(200),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.gst_entries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_name character varying(200),
    gst_number character varying(32),
    invoice_number character varying(100),
    invoice_date timestamp with time zone,
    taxable_amount numeric(12,2),
    cgst numeric(12,2),
    sgst numeric(12,2),
    igst numeric(12,2),
    total_gst numeric(12,2),
    total_amount numeric(12,2),
    filing_period character varying(50),
    filing_status character varying(50) DEFAULT 'Pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.leaves (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    driver_id character varying(32) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status sendo.leaves_status_enum DEFAULT 'Pending'::sendo.leaves_status_enum NOT NULL,
    leave_type character varying(50),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.oil_services (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    vehicle_number character varying(32),
    vehicle_type character varying(50),
    service_date timestamp with time zone,
    odometer_reading numeric(12,2),
    last_service_date timestamp with time zone,
    oil_type character varying(100),
    oil_brand character varying(100),
    oil_quantity numeric(10,2),
    oil_grade character varying(50),
    service_center_name character varying(200),
    service_center character varying(200),
    technician_name character varying(200),
    contact_number character varying(32),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.other_expenses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    category character varying(100),
    description text,
    date timestamp with time zone,
    amount numeric(12,2),
    paid_by character varying(200),
    payment_mode character varying(50),
    approved_by character varying(200),
    remarks text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.otp_users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    phone character varying(32) NOT NULL,
    otp character varying(16),
    otp_expires timestamp with time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.salary_payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    salary_month character varying(32) NOT NULL,
    driver_id character varying(32) NOT NULL,
    driver_name character varying(200) NOT NULL,
    no_of_days integer NOT NULL,
    basic_payment numeric(12,2) NOT NULL,
    per_day_payment numeric(12,2) NOT NULL,
    working_days integer NOT NULL,
    earned_payment numeric(12,2) NOT NULL,
    absent integer NOT NULL,
    referral_bonus numeric(12,2) NOT NULL,
    advance_deduction numeric(12,2) NOT NULL,
    other_deduction numeric(12,2) NOT NULL,
    payable_amount numeric(12,2) NOT NULL,
    approval_status character varying(50) NOT NULL,
    paid_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    paid_date timestamp with time zone,
    remarks text DEFAULT ''::text NOT NULL,
    approve boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.spare_parts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    vehicle_number character varying(32),
    spare_part_name character varying(200),
    part_number character varying(100),
    replacement_date timestamp with time zone,
    part_category sendo.spare_parts_part_category_enum,
    quantity integer,
    cost_per_part numeric(12,2),
    total_cost numeric(12,2),
    service_center_name character varying(200),
    technician_name character varying(200),
    contact_number character varying(32),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.timesheets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    driver_name character varying(200),
    vehicle_number character varying(32),
    date character varying(32),
    start_time character varying(32),
    end_time character varying(32),
    total_hours numeric(10,2),
    total_minutes numeric(10,2),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.trip_sheets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    trip_number character varying(100),
    vendor_name character varying(200),
    vehicle_number character varying(32),
    driver_name character varying(200),
    origin character varying(200),
    destination character varying(200),
    loading_date timestamp with time zone,
    unloading_date timestamp with time zone,
    material character varying(200),
    weight numeric(12,2),
    freight numeric(12,2),
    advance_paid numeric(12,2),
    balance_freight numeric(12,2),
    status character varying(50) DEFAULT 'Pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.trips (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    driver_id character varying(32) NOT NULL,
    vehicle_number character varying(32) NOT NULL,
    start_time timestamp with time zone NOT NULL,
    stop_time timestamp with time zone,
    is_running boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.truck_maintenances (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    maintenance_type sendo.truck_maintenances_maintenance_type_enum NOT NULL,
    truck_no character varying(32),
    kilometer numeric(12,2),
    expense_account character varying(200),
    payment_mode character varying(50) DEFAULT 'Cash'::character varying NOT NULL,
    bank_name character varying(200),
    account_number character varying(64),
    supplier_party_name character varying(200),
    amount numeric(12,2),
    date timestamp with time zone,
    driver character varying(200),
    next_alert_km numeric(12,2),
    next_alert_km_date timestamp with time zone,
    remarks text,
    material_description text,
    workshop_name character varying(200),
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    uploaded_documents jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.tyre_replacements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    vehicle_number character varying(32),
    vehicle_type character varying(50),
    model_name character varying(100),
    manufacturer character varying(100),
    tyre_number character varying(100),
    present_km numeric(12,2),
    expected_km numeric(12,2),
    tyre_brand character varying(100),
    tyre_size character varying(50),
    replacement_date timestamp with time zone,
    tyre_position character varying(50),
    quantity integer,
    cost_per_tyre numeric(12,2),
    total_cost numeric(12,2),
    warranty character varying(100),
    warranty_expiry timestamp with time zone,
    service_center_name character varying(200),
    service_center_address text,
    service_center_contact character varying(32),
    technician_name character varying(200),
    contact_number character varying(32),
    payment_method character varying(50),
    invoice_number character varying(100),
    total_amount numeric(12,2),
    payment_status character varying(50),
    additional_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    password character varying(255),
    role sendo.users_role_enum DEFAULT 'ADMIN'::sendo.users_role_enum NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.vehicle_history (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    vehicle_number character varying(32) NOT NULL,
    "time" character varying(64),
    location character varying(200),
    recorded_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.vehicle_locations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    vehicle_number character varying(32) NOT NULL,
    lat numeric(10,6),
    lng numeric(10,6),
    speed numeric(10,2),
    recorded_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.vehicle_parking (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    vehicle_number character varying(32) NOT NULL,
    "time" character varying(64),
    location character varying(200),
    recorded_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.vehicles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    vehicle_number character varying(32) NOT NULL,
    register_name character varying(200) NOT NULL,
    vehicle_type sendo.vehicles_vehicle_type_enum NOT NULL,
    gross_vehicle_weight character varying(50) NOT NULL,
    registration_date date NOT NULL,
    fitness_valid_upto date NOT NULL,
    tax_valid_upto date NOT NULL,
    insurance_valid_upto date NOT NULL,
    pollution_valid_upto date NOT NULL,
    state_permit_valid_upto date,
    national_permit sendo.vehicles_national_permit_enum NOT NULL,
    permit_upto date,
    temporary_permit sendo.vehicles_temporary_permit_enum DEFAULT 'No'::sendo.vehicles_temporary_permit_enum NOT NULL,
    state_permit sendo.vehicles_state_permit_enum DEFAULT 'No'::sendo.vehicles_state_permit_enum NOT NULL,
    temporary_permit_upto date,
    remarks text,
    chassis_number character varying(100),
    engine_number character varying(100),
    fuel_type character varying(50),
    schedule_date date,
    schedule_day character varying(20),
    schedule_interval integer,
    schedule_litres numeric(10,2),
    schedule_km_per_litre numeric(10,2),
    schedule_km_per_fill numeric(10,2),
    schedule_km_actual numeric(10,2),
    schedule_date_history jsonb DEFAULT '[]'::jsonb NOT NULL,
    registration_certificate text,
    insurance text,
    pollution_certificate text,
    road_tax text,
    fitness_certificate text,
    permit text,
    state_permit_doc text,
    temporary_permit_doc text,
    document_history jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.vendor_advances (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    vendor_name character varying(200),
    vehicle_number character varying(32),
    advance_type character varying(100),
    amount numeric(12,2),
    date timestamp with time zone,
    payment_mode character varying(50),
    reason text,
    status character varying(50) DEFAULT 'Pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.vendor_deductions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    vendor_name character varying(200),
    vehicle_number character varying(32),
    deduction_type character varying(100),
    amount numeric(12,2),
    date timestamp with time zone,
    description text,
    trip_number character varying(100),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.vendor_payments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    vendor_name character varying(200),
    vehicle_number character varying(32),
    invoice_number character varying(100),
    trip_number character varying(100),
    gross_amount numeric(12,2),
    deductions numeric(12,2),
    net_amount numeric(12,2),
    payment_date timestamp with time zone,
    payment_mode character varying(50),
    utr_number character varying(100),
    remarks text,
    status character varying(50) DEFAULT 'Pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE sendo.vendors (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    supplier_name character varying(200) NOT NULL,
    vender_site_code sendo.vendors_vender_site_code_enum NOT NULL,
    phone_number character varying(32) NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text,
    town_city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    pin_code character varying(10) NOT NULL,
    email_id character varying(200) NOT NULL,
    service_registration_number character varying(100) NOT NULL,
    service_tax character varying(100),
    pan_number character varying(20) NOT NULL,
    tds_rate_section character varying(100),
    beneficiary_name character varying(200) NOT NULL,
    account_number character varying(64) NOT NULL,
    ifsc_code character varying(20) NOT NULL,
    branch_name character varying(200) NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY sendo.agreements ADD CONSTRAINT "PK_01532f6c999d44c776e3d1fa4c8" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.customers ADD CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.vehicles ADD CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.oil_services ADD CONSTRAINT "PK_1ba29a4ffbf0b83f9e57cce4850" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.timesheets ADD CONSTRAINT "PK_1dc280b68c9353ecce41a34be71" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.diesel_entries ADD CONSTRAINT "PK_1ff3ea65349496b5c5d10ceeae1" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.vendor_advances ADD CONSTRAINT "PK_21324594b09f0cfa243209a1059" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.vendor_deductions ADD CONSTRAINT "PK_220d731279aa4f19746dcbdbf28" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.driver_advances ADD CONSTRAINT "PK_278835364503bfab1e55d6ce4db" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.customer_invoices ADD CONSTRAINT "PK_2d82e0a361dc40829f17a618c24" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.leaves ADD CONSTRAINT "PK_4153ec7270da3d07efd2e11e2a7" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.vehicle_locations ADD CONSTRAINT "PK_445c39fa5b18b0eb10ea136f5c7" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.attendances ADD CONSTRAINT "PK_483ed97cd4cd43ab4a117516b69" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.customer_payments ADD CONSTRAINT "PK_49f9fc4bd44d957db20148928d1" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.gst_entries ADD CONSTRAINT "PK_4c1165cfb58ecbd78bf9f9d0059" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.truck_maintenances ADD CONSTRAINT "PK_656e482c1e6ed20fe9cdfd5ba3a" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.tyre_replacements ADD CONSTRAINT "PK_6f54e36565babea03ecfe6422e4" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.spare_parts ADD CONSTRAINT "PK_6fe9b0bb96e021d248731580f1b" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.vendor_payments ADD CONSTRAINT "PK_90ac4c49a72f71adc03762add2d" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.otp_users ADD CONSTRAINT "PK_9232576be8f0211f5123977a29f" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.drivers ADD CONSTRAINT "PK_92ab3fb69e566d3eb0cae896047" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.expenses ADD CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.vendors ADD CONSTRAINT "PK_9c956c9797edfae5c6ddacc4e6e" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.users ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.vehicle_history ADD CONSTRAINT "PK_a6af096456ca2f37605e0d2d8a8" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.driver_payouts ADD CONSTRAINT "PK_ae4cf6e7912034426a12122aea9" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.deductions ADD CONSTRAINT "PK_bcf323939e22bf22386ecd4db7b" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.vehicle_parking ADD CONSTRAINT "PK_d1dadae550e1026409a32a7ff87" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.other_expenses ADD CONSTRAINT "PK_ddc0bb8afd8309d06bd718c0ba4" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.salary_payments ADD CONSTRAINT "PK_dde0dd5e8632eef035da694183a" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.trip_sheets ADD CONSTRAINT "PK_f4fc39d26a24c8780b81142a347" PRIMARY KEY (id);
ALTER TABLE ONLY sendo.trips ADD CONSTRAINT "PK_f71c231dee9c05a9522f9e840f5" PRIMARY KEY (id);

CREATE INDEX "IDX_1286f9a21db31a7b18fbcf3acc" ON sendo.diesel_entries USING btree (vehicle_number, date);
CREATE UNIQUE INDEX "IDX_1b63970c12f0501f5cf45b3702" ON sendo.vendors USING btree (pan_number);
CREATE INDEX "IDX_22953516473762d749ae9401cf" ON sendo.salary_payments USING btree (driver_id, salary_month);
CREATE UNIQUE INDEX "IDX_3cae879bc2730b1115c733ae66" ON sendo.driver_payouts USING btree (driver_id, month);
CREATE INDEX "IDX_4eb016f47aa0abe24987d213a8" ON sendo.vehicle_parking USING btree (vehicle_number, recorded_at);
CREATE INDEX "IDX_5013e9b5d84cee02d0b7ad857d" ON sendo.vehicle_history USING btree (vehicle_number, recorded_at);
CREATE INDEX "IDX_5114c65f21a8416e48669a7f5d" ON sendo.driver_advances USING btree (driver_id, approval_status, month);
CREATE UNIQUE INDEX "IDX_5f281c590f512b48626ed1c86a" ON sendo.drivers USING btree (driver_id);
CREATE INDEX "IDX_763ea5f8295378d54a526bb617" ON sendo.leaves USING btree (driver_id, status);
CREATE UNIQUE INDEX "IDX_90fdf9af713054dc6ec48edb50" ON sendo.vehicle_locations USING btree (vehicle_number);
CREATE INDEX "IDX_9412c46ab177df1914f6cb1284" ON sendo.trips USING btree (driver_id, is_running);
CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON sendo.users USING btree (email);
CREATE UNIQUE INDEX "IDX_97a57b7389989efc352bef8af3" ON sendo.vehicles USING btree (vehicle_number);
CREATE UNIQUE INDEX "IDX_bc91ce68a6575a98dbddacac49" ON sendo.otp_users USING btree (phone);
CREATE INDEX "IDX_be7ece643c799ed433c1c0bba7" ON sendo.attendances USING btree (driver_id, status);
CREATE UNIQUE INDEX "IDX_d3c0d824f1cc385d2c0c242261" ON sendo.drivers USING btree (contact_number) WHERE (contact_number IS NOT NULL);
CREATE INDEX "IDX_e2548696e1711e71872ae8abee" ON sendo.vehicle_locations USING btree (vehicle_number, recorded_at);
CREATE UNIQUE INDEX "IDX_fa9baeb5f6455cf82a8600345d" ON sendo.drivers USING btree (dl_number) WHERE (dl_number IS NOT NULL);
`;
