--
-- PostgreSQL database dump
--

\restrict pxiYXdOiDmUR5FJIaRqgczSpDNafMZ8lyz1rZPxCTgRpzPoaz0l7mnmAZFgalvO

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: ink_base_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ink_base_type_enum AS ENUM (
    'Dye',
    'Pigment',
    'Toner',
    'Eco-Solvent',
    'UV'
);


ALTER TYPE public.ink_base_type_enum OWNER TO postgres;

--
-- Name: ink_compatibility_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.ink_compatibility_enum AS ENUM (
    'OEM',
    'Compatible'
);


ALTER TYPE public.ink_compatibility_enum OWNER TO postgres;

--
-- Name: paper_format_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.paper_format_enum AS ENUM (
    'Sheet',
    'Roll'
);


ALTER TYPE public.paper_format_enum OWNER TO postgres;

--
-- Name: printer_category_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.printer_category_enum AS ENUM (
    'Inkjet',
    'Laser',
    'Thermal',
    'Dot Matrix',
    'MFP',
    'Plotter'
);


ALTER TYPE public.printer_category_enum OWNER TO postgres;

--
-- Name: printer_color_scheme_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.printer_color_scheme_enum AS ENUM (
    'Monochrome',
    'CMYK',
    'Photo',
    'Custom'
);


ALTER TYPE public.printer_color_scheme_enum OWNER TO postgres;

--
-- Name: printer_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.printer_status_enum AS ENUM (
    'In Use',
    'Spare',
    'Under Repair',
    'Retired'
);


ALTER TYPE public.printer_status_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bank_transaction_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bank_transaction_logs (
    id integer NOT NULL,
    order_id character varying(100) NOT NULL,
    qr_payload text,
    trans_ref character varying(100),
    amount numeric(12,4) NOT NULL,
    status character varying(50) NOT NULL,
    verified_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    raw_response jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.bank_transaction_logs OWNER TO postgres;

--
-- Name: bank_transaction_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bank_transaction_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.bank_transaction_logs_id_seq OWNER TO postgres;

--
-- Name: bank_transaction_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bank_transaction_logs_id_seq OWNED BY public.bank_transaction_logs.id;


--
-- Name: couriers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.couriers (
    id character varying(64) NOT NULL,
    name character varying(255) NOT NULL,
    short_name character varying(100),
    logo_url text,
    fee numeric(12,2) DEFAULT 0,
    eta character varying(100) DEFAULT '1-2 ວັນ'::character varying,
    free_above numeric(12,2) DEFAULT 0,
    color character varying(30) DEFAULT '#2563eb'::character varying,
    is_active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.couriers OWNER TO postgres;

--
-- Name: currency_rates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.currency_rates (
    currency_code character varying(10) NOT NULL,
    rate_to_lak numeric(15,4) NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.currency_rates OWNER TO postgres;

--
-- Name: customer_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_categories (
    id character varying(50) NOT NULL,
    name character varying(150) NOT NULL,
    description text DEFAULT ''::text,
    color character varying(50) DEFAULT 'sky'::character varying,
    is_default boolean DEFAULT false,
    is_system boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customer_categories OWNER TO postgres;

--
-- Name: customer_vip_tiers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_vip_tiers (
    id character varying(50) NOT NULL,
    name_lo character varying(150) NOT NULL,
    name_en character varying(150) NOT NULL,
    discount_percent numeric(5,2) DEFAULT 0.00 NOT NULL,
    min_spend_lak numeric(15,2) DEFAULT 0.00 NOT NULL,
    min_orders integer DEFAULT 0 NOT NULL,
    badge_color character varying(50) DEFAULT 'amber'::character varying,
    perks text[] DEFAULT '{}'::text[],
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.customer_vip_tiers OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    phone character varying(100),
    email character varying(100),
    address text,
    credit_limit numeric(15,2) DEFAULT 1000000.00,
    payment_terms character varying(50) DEFAULT 'Net 30'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    instagram character varying(100),
    line_id character varying(100),
    facebook character varying(255),
    whatsapp character varying(100),
    province character varying(100),
    district character varying(100),
    village character varying(255),
    branch_code character varying(100),
    tax_id character varying(100),
    notes text,
    total_spent_lak numeric(15,2) DEFAULT 0,
    total_orders_count integer DEFAULT 0,
    tier character varying(50) DEFAULT 'RETAIL'::character varying,
    preferred_courier character varying(100)
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: delivery_dispatches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.delivery_dispatches (
    id character varying(100) NOT NULL,
    order_id character varying(100) NOT NULL,
    order_number character varying(100),
    customer_name character varying(255),
    courier_id character varying(100) NOT NULL,
    courier_name character varying(255) NOT NULL,
    tracking_code character varying(100),
    shipping_fee_lak numeric(15,2) DEFAULT 0,
    status character varying(50) DEFAULT 'PENDING_PICKUP'::character varying,
    dispatched_at timestamp with time zone,
    delivered_at timestamp with time zone,
    driver_phone character varying(100),
    pod_image_url text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.delivery_dispatches OWNER TO postgres;

--
-- Name: equipment_specs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.equipment_specs (
    id integer NOT NULL,
    equipment_id character varying(100) NOT NULL,
    maintenance_interval_impressions integer DEFAULT 50000,
    last_serviced_meter integer DEFAULT 0,
    current_meter integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.equipment_specs OWNER TO postgres;

--
-- Name: equipment_specs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.equipment_specs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.equipment_specs_id_seq OWNER TO postgres;

--
-- Name: equipment_specs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.equipment_specs_id_seq OWNED BY public.equipment_specs.id;


--
-- Name: inbound_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inbound_transactions (
    id character varying(100) DEFAULT public.uuid_generate_v4() NOT NULL,
    po_number character varying(100),
    inbound_date date DEFAULT CURRENT_DATE NOT NULL,
    sku_code character varying(100) NOT NULL,
    item_name character varying(255) NOT NULL,
    supplier_name character varying(255),
    category character varying(50) NOT NULL,
    quantity numeric(12,2) DEFAULT 1 NOT NULL,
    unit character varying(50),
    total_price numeric(15,2) DEFAULT 0 NOT NULL,
    payment_method character varying(50) DEFAULT 'TRANSFER'::character varying,
    origin character varying(10) DEFAULT 'TH'::character varying,
    tariff_fee numeric(15,2) DEFAULT 0,
    freight_fee numeric(15,2) DEFAULT 0,
    product_image_url text,
    receipt_slip_url text,
    technical_specs jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.inbound_transactions OWNER TO postgres;

--
-- Name: ink_master_catalog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ink_master_catalog (
    ink_code character varying(100) NOT NULL,
    color_name character varying(100) NOT NULL,
    color_group character varying(50) NOT NULL,
    volume character varying(50) NOT NULL,
    stock_quantity integer DEFAULT 0 NOT NULL,
    unit_price numeric(15,2) NOT NULL,
    ink_base_type public.ink_base_type_enum NOT NULL,
    is_compatible_ink public.ink_compatibility_enum NOT NULL,
    technical_specs jsonb DEFAULT '{}'::jsonb,
    product_image_url text,
    receipt_invoice_url text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ink_master_catalog OWNER TO postgres;

--
-- Name: lao_districts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lao_districts (
    id integer NOT NULL,
    province_id integer NOT NULL,
    name_la character varying(150) NOT NULL,
    name_en character varying(150) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.lao_districts OWNER TO postgres;

--
-- Name: lao_districts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lao_districts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.lao_districts_id_seq OWNER TO postgres;

--
-- Name: lao_districts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lao_districts_id_seq OWNED BY public.lao_districts.id;


--
-- Name: lao_provinces; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lao_provinces (
    id integer NOT NULL,
    name_la character varying(150) NOT NULL,
    name_en character varying(150) NOT NULL,
    label character varying(250) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.lao_provinces OWNER TO postgres;

--
-- Name: lao_provinces_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lao_provinces_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.lao_provinces_id_seq OWNER TO postgres;

--
-- Name: lao_provinces_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lao_provinces_id_seq OWNED BY public.lao_provinces.id;


--
-- Name: machine_downtime_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.machine_downtime_logs (
    id character varying(100) NOT NULL,
    machine_id character varying(100) NOT NULL,
    machine_name character varying(255) NOT NULL,
    status character varying(50) NOT NULL,
    reason text,
    technician_id character varying(100),
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    duration_minutes integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.machine_downtime_logs OWNER TO postgres;

--
-- Name: maintenance_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_tickets (
    id character varying(100) NOT NULL,
    equipment_id character varying(100) NOT NULL,
    trigger_reason text NOT NULL,
    status character varying(50) DEFAULT 'OPEN'::character varying NOT NULL,
    scheduled_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.maintenance_tickets OWNER TO postgres;

--
-- Name: materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.materials (
    id character varying(100) NOT NULL,
    sku character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(50) NOT NULL,
    stock_qty numeric(12,2) DEFAULT 0.00 NOT NULL,
    consumption_unit character varying(50) DEFAULT 'Unit'::character varying NOT NULL,
    purchase_unit character varying(50) DEFAULT 'Pack'::character varying NOT NULL,
    purchase_multiplier numeric(12,2) DEFAULT 1.00 NOT NULL,
    cost_per_purchase_unit numeric(15,2) DEFAULT 0.00 NOT NULL,
    cost_per_consumption_unit numeric(15,2) DEFAULT 0.00 NOT NULL,
    reorder_threshold numeric(12,2) DEFAULT 10.00 NOT NULL,
    technical_specs jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_active boolean DEFAULT true,
    min_stock_alert numeric(14,4) DEFAULT 10.0000,
    stock_status character varying(30) DEFAULT 'IN_STOCK'::character varying,
    specification_meta jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.materials OWNER TO postgres;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id character varying(100) NOT NULL,
    order_id character varying(100) NOT NULL,
    job_name character varying(255) NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price_snapshot numeric(15,2) DEFAULT 0.00 NOT NULL,
    cost_price_snapshot numeric(15,2) DEFAULT 0.00 NOT NULL,
    specs jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    item_name character varying(255),
    page_count integer DEFAULT 1,
    paper_size character varying(50) DEFAULT 'A5'::character varying,
    cover_paper_id character varying(100),
    inner_paper_id character varying(100),
    cover_file_url text,
    inner_file_url text,
    binding_type character varying(50) DEFAULT 'NONE'::character varying,
    spine_width_mm numeric(8,2) DEFAULT 0.00,
    current_step character varying(50) DEFAULT 'PENDING'::character varying,
    avg_cov_c numeric(8,4) DEFAULT 0.0000,
    avg_cov_m numeric(8,4) DEFAULT 0.0000,
    avg_cov_y numeric(8,4) DEFAULT 0.0000,
    avg_cov_k numeric(8,4) DEFAULT 0.0000,
    unit_cost_lak numeric(15,2) DEFAULT 0.00,
    unit_price_lak numeric(15,2) DEFAULT 0.00,
    total_price_lak numeric(15,2) DEFAULT 0.00,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_preflight_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_preflight_reports (
    id integer NOT NULL,
    order_id character varying(100) NOT NULL,
    file_name character varying(255) NOT NULL,
    total_pages integer DEFAULT 1 NOT NULL,
    color_space character varying(50) DEFAULT 'CMYK'::character varying NOT NULL,
    has_rgb boolean DEFAULT false,
    is_standard_cmyk boolean DEFAULT true,
    dpi_estimate integer DEFAULT 300,
    bleed_mm numeric(5,2) DEFAULT 0.00,
    has_sufficient_bleed boolean DEFAULT true,
    tac_max_percent numeric(5,2) DEFAULT 0.00,
    tac_warning boolean DEFAULT false,
    avg_cov_c numeric(5,2) DEFAULT 0.00,
    avg_cov_m numeric(5,2) DEFAULT 0.00,
    avg_cov_y numeric(5,2) DEFAULT 0.00,
    avg_cov_k numeric(5,2) DEFAULT 0.00,
    status character varying(50) DEFAULT 'PASSED'::character varying,
    report_json jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.order_preflight_reports OWNER TO postgres;

--
-- Name: order_preflight_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_preflight_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_preflight_reports_id_seq OWNER TO postgres;

--
-- Name: order_preflight_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_preflight_reports_id_seq OWNED BY public.order_preflight_reports.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id character varying(100) NOT NULL,
    order_number character varying(100) NOT NULL,
    customer_name character varying(255) NOT NULL,
    customer_phone character varying(100),
    status character varying(50) DEFAULT 'WAITING_DEPOSIT'::character varying NOT NULL,
    deposit_amount numeric(15,2) DEFAULT 0.00,
    total_price numeric(15,2) DEFAULT 0.00 NOT NULL,
    total_cost numeric(15,2) DEFAULT 0.00 NOT NULL,
    google_drive_link text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    order_no character varying(100),
    customer_id character varying(100),
    total_amount_lak numeric(15,2) DEFAULT 0.00,
    deposit_lak numeric(15,2) DEFAULT 0.00,
    remaining_lak numeric(15,2) DEFAULT 0.00,
    overall_status character varying(50) DEFAULT 'PENDING'::character varying,
    delivery_date character varying(50),
    deposit_percentage numeric(18,4) DEFAULT 30.0,
    tax_mode character varying(50) DEFAULT 'EXCLUDED'::character varying,
    tax_rate numeric(18,4) DEFAULT 0.07,
    internal_tracking_code character varying(100),
    courier_name character varying(100) DEFAULT 'Som-Sing Express'::character varying,
    pod_image_url text,
    slip_verified_at timestamp with time zone,
    slip_trans_ref character varying(100),
    proof_url text,
    proof_approved_at timestamp with time zone,
    proof_rejected_at timestamp with time zone,
    proof_signature_ip character varying(100),
    proof_rejection_reason text,
    stock_deducted_at timestamp with time zone,
    branch_code character varying(100),
    idempotency_key character varying(255),
    tracking_code character varying(100),
    courier_id character varying(100),
    customer_email character varying(255),
    customer_address text,
    digital_proof_url text,
    proof_version integer DEFAULT 1,
    proof_status character varying(32) DEFAULT 'NOT_SUBMITTED'::character varying,
    proof_feedback text,
    proof_action_at timestamp with time zone,
    prepress_notes text,
    payment_slip_url text
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: paper_price_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.paper_price_versions (
    id integer NOT NULL,
    supplier_name character varying(255) NOT NULL,
    effective_date date DEFAULT CURRENT_DATE NOT NULL,
    version_code character varying(100) NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.paper_price_versions OWNER TO postgres;

--
-- Name: paper_price_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.paper_price_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.paper_price_versions_id_seq OWNER TO postgres;

--
-- Name: paper_price_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.paper_price_versions_id_seq OWNED BY public.paper_price_versions.id;


--
-- Name: paper_specs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.paper_specs (
    id integer NOT NULL,
    paper_code character varying(100) NOT NULL,
    paper_name character varying(255) NOT NULL,
    paper_type character varying(100) NOT NULL,
    gsm integer DEFAULT 80 NOT NULL,
    sheet_width_mm numeric(10,2) DEFAULT 0.00,
    sheet_height_mm numeric(10,2) DEFAULT 0.00,
    sheets_per_ream integer DEFAULT 500,
    cost_per_ream numeric(12,4) DEFAULT 0.0000,
    cost_per_sheet numeric(12,4) DEFAULT 0.0000,
    price_version_id integer,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.paper_specs OWNER TO postgres;

--
-- Name: paper_specs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.paper_specs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.paper_specs_id_seq OWNER TO postgres;

--
-- Name: paper_specs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.paper_specs_id_seq OWNED BY public.paper_specs.id;


--
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_methods (
    id character varying(64) NOT NULL,
    bank_name character varying(255) NOT NULL,
    account_name character varying(255) NOT NULL,
    account_number character varying(100) NOT NULL,
    branch character varying(255),
    qr_code_url text,
    logo_url text,
    promptpay_name character varying(255),
    is_active boolean DEFAULT true,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payment_methods OWNER TO postgres;

--
-- Name: printer_color_link; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.printer_color_link (
    link_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    asset_id character varying(50) NOT NULL,
    ink_code character varying(100) NOT NULL,
    slot_position character varying(50) NOT NULL,
    iso_page_yield_a4 integer NOT NULL,
    oem_standard_volume_ml numeric(10,2),
    oem_standard_iso_yield_a4 integer,
    base_consumption_rate_ml numeric(12,6),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.printer_color_link OWNER TO postgres;

--
-- Name: product_discount_tiers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_discount_tiers (
    id integer NOT NULL,
    product_id integer NOT NULL,
    min_quantity integer NOT NULL,
    discount_percentage numeric(5,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.product_discount_tiers OWNER TO postgres;

--
-- Name: product_discount_tiers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_discount_tiers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.product_discount_tiers_id_seq OWNER TO postgres;

--
-- Name: product_discount_tiers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_discount_tiers_id_seq OWNED BY public.product_discount_tiers.id;


--
-- Name: public_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.public_categories (
    id integer NOT NULL,
    slug character varying(100) NOT NULL,
    name_lo character varying(200) NOT NULL,
    name_en character varying(200) NOT NULL,
    tagline_lo text DEFAULT ''::text,
    tagline_en text DEFAULT ''::text,
    description_lo text DEFAULT ''::text,
    description_en text DEFAULT ''::text,
    icon character varying(50) DEFAULT 'folder'::character varying NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.public_categories OWNER TO postgres;

--
-- Name: public_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.public_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.public_categories_id_seq OWNER TO postgres;

--
-- Name: public_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.public_categories_id_seq OWNED BY public.public_categories.id;


--
-- Name: public_product_options; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.public_product_options (
    id integer NOT NULL,
    product_id integer NOT NULL,
    option_type character varying(50) NOT NULL,
    label character varying(100) NOT NULL,
    value character varying(100) NOT NULL,
    is_default boolean DEFAULT false,
    extra_cost_rate numeric(10,4) DEFAULT 0.0000,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    label_lo character varying(150),
    label_en character varying(150),
    hint_lo character varying(255),
    hint_en character varying(255),
    material_sku character varying(100),
    paper_code character varying(100),
    add_price numeric(15,2) DEFAULT 0.00,
    machine_id character varying(100),
    machine_name character varying(255)
);


ALTER TABLE public.public_product_options OWNER TO postgres;

--
-- Name: public_product_options_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.public_product_options_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.public_product_options_id_seq OWNER TO postgres;

--
-- Name: public_product_options_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.public_product_options_id_seq OWNED BY public.public_product_options.id;


--
-- Name: public_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.public_products (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    category character varying(100) NOT NULL,
    description text,
    features text[] DEFAULT '{}'::text[],
    thumbnail_url text,
    gallery_urls text[] DEFAULT '{}'::text[],
    min_quantity integer DEFAULT 1,
    lead_time_days integer DEFAULT 2,
    is_active boolean DEFAULT true,
    is_archived boolean DEFAULT false,
    deleted_at timestamp with time zone,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    category_id integer,
    name_lo character varying(255),
    name_en character varying(255),
    description_lo text,
    description_en text,
    pricing_model character varying(50) DEFAULT 'STANDARD_FLAT'::character varying,
    base_price numeric(15,2) DEFAULT 0.00,
    unit character varying(50) DEFAULT 'ຊິ້ນ'::character varying,
    bestseller boolean DEFAULT false,
    spec_groups jsonb DEFAULT '[]'::jsonb,
    features_config jsonb DEFAULT '{}'::jsonb,
    is_on_demand boolean DEFAULT false,
    target_margin_percent numeric(5,2) DEFAULT 35.00,
    default_machine_id character varying(100),
    default_machine_name character varying(255),
    info_tabs jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.public_products OWNER TO postgres;

--
-- Name: public_products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.public_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.public_products_id_seq OWNER TO postgres;

--
-- Name: public_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.public_products_id_seq OWNED BY public.public_products.id;


--
-- Name: quotation_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotation_items (
    item_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    quotation_id uuid NOT NULL,
    asset_id character varying(50),
    paper_code character varying(100),
    job_width_mm numeric(8,2),
    job_length_mm numeric(8,2),
    coverage_k_percent numeric(5,2) DEFAULT 0.00,
    coverage_c_percent numeric(5,2) DEFAULT 0.00,
    coverage_m_percent numeric(5,2) DEFAULT 0.00,
    coverage_y_percent numeric(5,2) DEFAULT 0.00,
    ink_cost numeric(15,2) DEFAULT 0.00,
    machine_cost numeric(15,2) DEFAULT 0.00,
    paper_cost numeric(15,2) DEFAULT 0.00,
    labor_cost numeric(15,2) DEFAULT 0.00,
    finishing_cost numeric(15,2) DEFAULT 0.00,
    waste_percent numeric(5,2) DEFAULT 5.00,
    unit_cost_total numeric(15,2) DEFAULT 0.00,
    unit_selling_price numeric(15,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.quotation_items OWNER TO postgres;

--
-- Name: quotations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quotations (
    quotation_id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    customer_name character varying(150) NOT NULL,
    total_cost numeric(15,2) DEFAULT 0.00 NOT NULL,
    total_selling_price numeric(15,2) DEFAULT 0.00 NOT NULL,
    overall_profit_percent numeric(5,2) DEFAULT 0.00 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    deposit_percentage numeric(18,4) DEFAULT 30.0,
    tax_mode character varying(50) DEFAULT 'EXCLUDED'::character varying,
    tax_rate numeric(18,4) DEFAULT 0.07,
    id character varying(100),
    quotation_no character varying(100),
    title character varying(255),
    status character varying(50) DEFAULT 'Draft'::character varying,
    customer_phone character varying(100),
    customer_address text,
    notes text,
    items_json jsonb DEFAULT '[]'::jsonb,
    discount_percent numeric(5,2) DEFAULT 0.00,
    setup_fee numeric(15,2) DEFAULT 0.00,
    packaging_cost numeric(15,2) DEFAULT 0.00,
    shipping_fee numeric(15,2) DEFAULT 0.00,
    expiry_date character varying(50)
);


ALTER TABLE public.quotations OWNER TO postgres;

--
-- Name: stock_movements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stock_movements (
    id character varying(64) NOT NULL,
    material_id character varying(64) NOT NULL,
    order_id character varying(64),
    order_item_id character varying(64),
    movement_type character varying(32) NOT NULL,
    quantity numeric(15,4) NOT NULL,
    unit_cost numeric(15,4) DEFAULT 0.00,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(64) DEFAULT 'SYSTEM'::character varying
);


ALTER TABLE public.stock_movements OWNER TO postgres;

--
-- Name: technician_earnings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.technician_earnings (
    id character varying(100) NOT NULL,
    employee_id character varying(100) NOT NULL,
    employee_name character varying(255) NOT NULL,
    order_id character varying(100) NOT NULL,
    order_number character varying(100),
    customer_name character varying(255),
    step_id character varying(100) NOT NULL,
    step_name character varying(255) NOT NULL,
    impressions integer DEFAULT 0,
    rate_per_impression numeric(10,2) DEFAULT 0,
    earned_amount_lak numeric(15,2) NOT NULL,
    recorded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.technician_earnings OWNER TO postgres;

--
-- Name: bank_transaction_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_transaction_logs ALTER COLUMN id SET DEFAULT nextval('public.bank_transaction_logs_id_seq'::regclass);


--
-- Name: equipment_specs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment_specs ALTER COLUMN id SET DEFAULT nextval('public.equipment_specs_id_seq'::regclass);


--
-- Name: lao_districts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lao_districts ALTER COLUMN id SET DEFAULT nextval('public.lao_districts_id_seq'::regclass);


--
-- Name: lao_provinces id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lao_provinces ALTER COLUMN id SET DEFAULT nextval('public.lao_provinces_id_seq'::regclass);


--
-- Name: order_preflight_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_preflight_reports ALTER COLUMN id SET DEFAULT nextval('public.order_preflight_reports_id_seq'::regclass);


--
-- Name: paper_price_versions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_price_versions ALTER COLUMN id SET DEFAULT nextval('public.paper_price_versions_id_seq'::regclass);


--
-- Name: paper_specs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_specs ALTER COLUMN id SET DEFAULT nextval('public.paper_specs_id_seq'::regclass);


--
-- Name: product_discount_tiers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_discount_tiers ALTER COLUMN id SET DEFAULT nextval('public.product_discount_tiers_id_seq'::regclass);


--
-- Name: public_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_categories ALTER COLUMN id SET DEFAULT nextval('public.public_categories_id_seq'::regclass);


--
-- Name: public_product_options id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_product_options ALTER COLUMN id SET DEFAULT nextval('public.public_product_options_id_seq'::regclass);


--
-- Name: public_products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_products ALTER COLUMN id SET DEFAULT nextval('public.public_products_id_seq'::regclass);


--
-- Data for Name: bank_transaction_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bank_transaction_logs (id, order_id, qr_payload, trans_ref, amount, status, verified_at, raw_response, created_at) FROM stdin;
\.


--
-- Data for Name: couriers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.couriers (id, name, short_name, logo_url, fee, eta, free_above, color, is_active, is_default, created_at, updated_at) FROM stdin;
anousith_express	Anousith Express (ອະນຸສິດ ເອັກສະເປຣັສ)	Anousith	http://localhost:8080/api/v1/orders/files/logo_1787469269594481000.png	15000.00	1-2 ວັນ (1-2 Days)	300000.00	#d97706	t	t	2026-09-04 19:10:49.637188+00	2026-09-04 19:10:49.637188+00
hal_logistics	HAL Logistics (ຮົງອາລຸນ ຂົນສົ່ງ)	HAL	http://localhost:8080/api/v1/orders/files/logo_1787469280059372000.png	20000.00	1-2 ວັນ (1-2 Days)	350000.00	#2563eb	t	f	2026-09-04 19:10:49.637958+00	2026-09-04 19:10:49.637958+00
\.


--
-- Data for Name: currency_rates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.currency_rates (currency_code, rate_to_lak, updated_at) FROM stdin;
\.


--
-- Data for Name: customer_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_categories (id, name, description, color, is_default, is_system, created_at, updated_at) FROM stdin;
RETAIL	ລູກຄ້າໜ້າຮ້ານ (Walk-in)	ລູກຄ້າທົ່ວໄປທີ່ມາຕິດຕໍ່ໜ້າຮ້ານ	sky	t	t	2026-09-04 17:15:27.407859+00	2026-09-04 17:15:27.407859+00
ONLINE	ລູກຄ້າຊ່ອງທາງອອນລາຍ (Online)	ລູກຄ້າທີ່ສັ່ງຊື້ຜ່ານ Facebook, Line, WhatsApp, Website	violet	f	t	2026-09-04 17:15:27.407859+00	2026-09-04 17:15:27.407859+00
CORPORATE	ລູກຄ້າອົງກອນ / ບໍລິສັດ (Corporate)	ບໍລິສັດ, ອົງການຈັດຕັ້ງ, ໂຮງຮຽນ ຫຼື ໜ່ວຍງານລັດ	emerald	f	t	2026-09-04 17:15:27.407859+00	2026-09-04 17:15:27.407859+00
CONTRACT_PARTNER	ລູກຄ້າຄູ່ສັນຍາ (Contract Partner)	ຄູ່ຄ້າທີ່ມີສັນຍາຮ່ວມມືພິເສດ ຫຼື MOU	amber	f	t	2026-09-04 17:15:27.407859+00	2026-09-04 17:15:27.407859+00
\.


--
-- Data for Name: customer_vip_tiers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_vip_tiers (id, name_lo, name_en, discount_percent, min_spend_lak, min_orders, badge_color, perks, is_active, sort_order, created_at, updated_at) FROM stdin;
STANDARD	ສະມາຊິກທົ່ວໄປ (Standard Member)	Standard Member	0.00	0.00	0	slate	{"ສັ່ງພິມຊ້ຳ 1 ຄລິກ (1-Click Re-order)","ບັນທຶກທີ່ຢູ່ຈັດສົ່ງ ແລະ ສາຂາຂົນສົ່ງອັດຕະໂນມັດ","ກວດໄຟລ໌ Digital Proof ມາດຕະຖານ","ຕິດຕາມສະຖານະງານພິມ Real-time"}	t	1	2026-09-04 19:17:12.990964+00	2026-09-04 19:17:12.990964+00
SILVER	ຊິລເວີ VIP (Silver Tier)	Silver VIP	5.00	3000000.00	3	cyan	{"ສ່ວນຫຼຸດພິເສດ 5% ທຸກງານພິມ","ກວດໄຟລ໌ Proof ດ່ວນພາຍໃນ 2 ຊົ່ວໂມງ","ຄັງເກັບໄຟລ໌ Artwork ສ່ວນຕົວ (Cloud Vault)","ສັ່ງພິມຊ້ຳ 1 ຄລິກ"}	t	2	2026-09-04 19:17:12.990964+00	2026-09-04 19:17:12.990964+00
GOLD	ໂກລ VIP (Gold Tier)	Gold VIP	10.00	10000000.00	10	amber	{"ສ່ວນຫຼຸດພິເສດ 10% ທຸກງານພິມ","ລຳດັບຄິວຜະລິດດ່ວນ Fast-Track 24 ຊມ.","ຜູ້ດູແລງານພິມສ່ວນຕົວ VIP Concierge","ຟຣີ ຄ່າຈັດສົ່ງໃນນະຄອນຫຼວງວຽງຈັນ (ຍອດ 500,000 ₭ ຂຶ້ນໄປ)"}	t	3	2026-09-04 19:17:12.990964+00	2026-09-04 19:17:12.990964+00
PLATINUM	ແພລຕິນໍາ VIP (Platinum Corporate)	Platinum Corporate	15.00	25000000.00	25	purple	{"ສ່ວນຫຼຸດສູງສຸດ 15% ທຸກງານພິມ","ສິດທິເຄຣດິດ/ມັດຈຳພິເສດ B2B Partner","ພິມຕົວຢ່າງສີຈິງ (Hard Proof) ຟຣີ","ຄິວຜະລິດດ່ວນພິເສດ Ultra Fast-Track"}	t	4	2026-09-04 19:17:12.990964+00	2026-09-04 19:17:12.990964+00
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, phone, email, address, credit_limit, payment_terms, created_at, updated_at, instagram, line_id, facebook, whatsapp, province, district, village, branch_code, tax_id, notes, total_spent_lak, total_orders_count, tier, preferred_courier) FROM stdin;
CUST-VIP-001	Som Sing Phim VIP Atelier	020 55889988	customer@gmail.com	ຮ່ອມ 5, ບ້ານໂພນພະເນົາ, ໃກ້ສູນການຄ້າລາວ-ໄອເຕັກ	5000000.00	Net 30	2026-09-04 19:17:12.992338+00	2026-09-04 19:17:12.992338+00	\N	\N	\N	\N	ນະຄອນຫຼວງວຽງຈັນ	ໄຊເສດຖາ	ໂພນພະເນົາ	AN-VTE-02	\N	ລູກຄ້າ VIP ປະຈຳ ສັ່ງພິມສະຕິກເກີ ແລະ ນາມບັດຕໍ່ເນື່ອງ	12500000.00	12	GOLD	\N
\.


--
-- Data for Name: delivery_dispatches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.delivery_dispatches (id, order_id, order_number, customer_name, courier_id, courier_name, tracking_code, shipping_fee_lak, status, dispatched_at, delivered_at, driver_phone, pod_image_url, created_at) FROM stdin;
\.


--
-- Data for Name: equipment_specs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.equipment_specs (id, equipment_id, maintenance_interval_impressions, last_serviced_meter, current_meter, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: inbound_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inbound_transactions (id, po_number, inbound_date, sku_code, item_name, supplier_name, category, quantity, unit, total_price, payment_method, origin, tariff_fee, freight_fee, product_image_url, receipt_slip_url, technical_specs, created_at) FROM stdin;
INB-7909	INB-7909	2026-08-14	PAP-8458	Double A4	Supplier	PAPER	2.00	ແຜ່ນ	165000.00	TRANSFER	TH	0.00	0.00	data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E		{"brand": "Double A", "paperCode": "PAP-8458", "paperCore": null, "rollWidthM": null, "coatingTech": null, "grammageGsm": "80", "paperFormat": "Sheet", "rollLengthM": null, "paperSurface": "Plain Paper", "standardSize": "A4", "customWidthMm": null, "packagingType": "Ream", "sheetsPerPack": 500, "surfaceFinish": null, "customLengthMm": null, "printableSides": null, "compatibilities": ["dye", "pigment"], "rollWidthPreset": null, "sheets_per_pack": 500, "sheets_per_ream": 500}	2026-08-14 17:42:27.952082+00
INB-9221	INB-9221	2026-08-25	INK-0093	LC-462XL-C (Cyan)		INK	1.00	ຂວດ	430000.00	TRANSFER	TH	0.00	0.00	data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E		{"volume": 16.6, "inkCode": "INK-0093", "colorName": "LC-462XL-C", "colorGroup": "Cyan", "inkBaseType": "Dye", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-25 20:30:59.23247+00
INB-8693	INB-8693	2026-08-25	INK-1160	LC-462XL-M (Magenta)		INK	1.00	ຂວດ	430000.00	TRANSFER	TH	0.00	0.00	data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E		{"volume": 16.6, "inkCode": "INK-1160", "colorName": "LC-462XL-M", "colorGroup": "Magenta", "inkBaseType": "Dye", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-25 20:31:18.707343+00
INB-3773	INB-3773	2026-08-25	INK-3389	LC-462XL-Y (Yellow)		INK	1.00	ຂວດ	430000.00	TRANSFER	TH	0.00	0.00	data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E		{"volume": 16.6, "inkCode": "INK-3389", "colorName": "LC-462XL-Y", "colorGroup": "Yellow", "inkBaseType": "Dye", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-25 20:31:43.792839+00
INB-7089	INB-7089	2026-08-26	PAP-6071	Idea Paper A4 - 80gsm (Sheet)		PAPER	5.00	ແຜ່ນ	460000.00	TRANSFER	TH	0.00	0.00	data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E		{"brand": "Idea Paper", "paperCode": "PAP-6071", "paperCore": null, "rollWidthM": null, "coatingTech": null, "grammageGsm": "80", "paperFormat": "Sheet", "rollLengthM": null, "paperSurface": "Plain Paper", "standardSize": "A4", "customWidthMm": null, "packagingType": "Ream", "sheetsPerPack": 500, "surfaceFinish": null, "customLengthMm": null, "printableSides": null, "compatibilities": ["dye", "pigment"], "rollWidthPreset": null, "sheets_per_pack": 500, "sheets_per_ream": 500}	2026-08-26 21:27:37.115611+00
INB-4169	INB-4169	2026-08-27	PAP-1983	Double A Paper A4 package - 80gsm (Sheet)		PAPER	1.00	ແຜ່ນ	81200.00	TRANSFER	TH	0.00	0.00	data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E		{"brand": "Double A", "paperCode": "PAP-1983", "paperCore": null, "rollWidthM": null, "coatingTech": null, "grammageGsm": "80", "paperFormat": "Sheet", "rollLengthM": null, "paperSurface": "Glossy", "standardSize": "A4", "customWidthMm": null, "packagingType": "Ream", "sheetsPerPack": 500, "surfaceFinish": null, "customLengthMm": null, "printableSides": null, "compatibilities": ["dye", "pigment"], "rollWidthPreset": null, "sheets_per_pack": 500, "sheets_per_ream": 500}	2026-08-27 19:34:14.174567+00
INB-RESTOCK-2415-795	INB-RESTOCK-2415-795	2026-08-28	PAP-4100	Green Read Paper	Restock Supplier	PAPER	2.00	แพ็ก	100000.00	TRANSFER	TH	0.00	0.00	data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E		{"id": "INB-RESTOCK-2415-795", "sku": "PAP-4100", "docs": {"paymentSlip": "", "productPhoto": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E"}, "name": "Green Read Paper", "unit": "แพ็ก", "specs": {"id": "INB-RESTOCK-2415-795", "sku": "PAP-4100", "docs": {"paymentSlip": "", "productPhoto": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E"}, "name": "Green Read Paper", "unit": "แพ็ก", "specs": {"id": "INB-RESTOCK-2415-795", "sku": "PAP-4100", "docs": {"paymentSlip": "", "productPhoto": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E"}, "name": "Green Read Paper", "unit": "แพ็ก", "specs": {"sku": "PAP-4100", "skuCode": "PAP-4100", "isRestock": true, "unitPrice": 85000, "materialId": "PAP-4100", "restockQty": 1, "sheets_per_pack": 500, "sheets_per_ream": 500}, "origin": "TH", "skuCode": "PAP-4100", "subUnit": "(1 แพ็ก)", "category": "PAPER", "itemName": "Green Read Paper", "poNumber": "INB-RESTOCK-2415-795", "supplier": "Restock Supplier", "isRestock": true, "unitPrice": 85000, "currentQty": 1, "initialQty": 1, "materialId": "PAP-4100", "receiptUrl": "", "restockQty": 1, "totalPrice": 85000, "receiptDate": "2026-08-28", "categoryPill": "PAPER", "paymentMethod": "TRANSFER", "purchase_link": "", "supplier_phone": "", "sheets_per_pack": 500, "sheets_per_ream": 500}, "origin": "TH", "skuCode": "PAP-4100", "subUnit": "(1 แพ็ก)", "category": "PAPER", "itemName": "Green Read Paper", "poNumber": "INB-RESTOCK-2415-795", "supplier": "Restock Supplier", "isRestock": true, "unitPrice": 85000, "currentQty": 1, "initialQty": 1, "materialId": "PAP-4100", "receiptUrl": "", "restockQty": 1, "totalPrice": 95000, "receiptDate": "2026-08-28", "categoryPill": "PAPER", "paymentMethod": "TRANSFER", "purchase_link": "", "supplier_phone": "", "sheets_per_pack": 500, "sheets_per_ream": 500}, "origin": "TH", "skuCode": "PAP-4100", "subUnit": "(1 แพ็ก)", "category": "PAPER", "itemName": "Green Read Paper", "poNumber": "INB-RESTOCK-2415-795", "supplier": "Restock Supplier", "isRestock": true, "unitPrice": 85000, "currentQty": 1, "initialQty": 1, "materialId": "PAP-4100", "receiptUrl": "", "restockQty": 1, "totalPrice": 100000, "receiptDate": "2026-08-28", "categoryPill": "PAPER", "paymentMethod": "TRANSFER", "purchase_link": "", "supplier_phone": "", "sheets_per_pack": 500, "sheets_per_ream": 500}	2026-08-28 18:05:42.437201+00
INB-5266	INB-5266	2026-08-27	PRN-9614	Epson L15150	Supplier	PRINTER	1.00	ເຄື່ອງ	18000000.00	TRANSFER	TH	0.00	0.00	data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E		{"id": "INB-5266", "sku": "PRN-9614", "docs": {"paymentSlip": "", "productPhoto": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E"}, "name": "Epson L15150", "unit": "ເຄື່ອງ", "brand": "Epson", "model": "L15150", "specs": {"brand": "Epson", "model": "L15150", "location": "Main Dept", "color_config": {"slots": [{"id": "k", "code": "K", "name": "Black", "hexColor": "#000000"}, {"id": "c", "code": "C", "name": "Cyan", "hexColor": "#00FFFF"}, {"id": "m", "code": "M", "name": "Magenta", "hexColor": "#FF00FF"}, {"id": "y", "code": "Y", "name": "Yellow", "hexColor": "#FFFF00"}], "colorScheme": "CMYK"}, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "colorSchemeType": "CMYK", "oemBaselineInks": [{"colorGroup": "Black", "oemInkCode": "EPSON-008-BK", "slotPosition": "Slot 1 (K - Black)", "oemStandardVolumeMl": 127, "oemStandardIsoYieldA4": 7500}, {"colorGroup": "Cyan", "oemInkCode": "EPSON-008-C", "slotPosition": "Slot 2 (C - Cyan)", "oemStandardVolumeMl": 70, "oemStandardIsoYieldA4": 6000}, {"colorGroup": "Magenta", "oemInkCode": "EPSON-008-M", "slotPosition": "Slot 3 (M - Magenta)", "oemStandardVolumeMl": 70, "oemStandardIsoYieldA4": 6000}, {"colorGroup": "Yellow", "oemInkCode": "EPSON-008-Y", "slotPosition": "Slot 4 (Y - Yellow)", "oemStandardVolumeMl": 70, "oemStandardIsoYieldA4": 6000}], "printerCategory": "Laser", "totalColorSlots": 4, "expectedLifeA4Pages": 200000, "maintenanceRatePercent": 20, "warrantyExpirationYear": 2028}, "origin": "TH", "skuCode": "PRN-9614", "subUnit": "(1 ແຜ່ນ)", "category": "PRINTER", "itemName": "Epson L15150", "location": "Main Dept", "poNumber": "INB-5266", "supplier": "Supplier", "currentQty": 1, "initialQty": 1, "materialId": "PRN-9614", "receiptUrl": "", "totalPrice": 18000000, "receiptDate": "2026-08-27", "categoryPill": "PRINTER", "color_config": {"slots": [{"id": "k", "code": "K", "name": "Black", "hexColor": "#000000"}, {"id": "c", "code": "C", "name": "Cyan", "hexColor": "#00FFFF"}, {"id": "m", "code": "M", "name": "Magenta", "hexColor": "#FF00FF"}, {"id": "y", "code": "Y", "name": "Yellow", "hexColor": "#FFFF00"}], "colorScheme": "CMYK"}, "payment_slip": "", "actual_images": [], "paymentMethod": "TRANSFER", "purchase_link": "", "supplier_phone": "", "colorSchemeType": "CMYK", "oemBaselineInks": [{"colorGroup": "Black", "oemInkCode": "EPSON-008-BK", "slotPosition": "Slot 1 (K - Black)", "oemStandardVolumeMl": 127, "oemStandardIsoYieldA4": 7500}, {"colorGroup": "Cyan", "oemInkCode": "EPSON-008-C", "slotPosition": "Slot 2 (C - Cyan)", "oemStandardVolumeMl": 70, "oemStandardIsoYieldA4": 6000}, {"colorGroup": "Magenta", "oemInkCode": "EPSON-008-M", "slotPosition": "Slot 3 (M - Magenta)", "oemStandardVolumeMl": 70, "oemStandardIsoYieldA4": 6000}, {"colorGroup": "Yellow", "oemInkCode": "EPSON-008-Y", "slotPosition": "Slot 4 (Y - Yellow)", "oemStandardVolumeMl": 70, "oemStandardIsoYieldA4": 6000}], "printerCategory": "Laser", "totalColorSlots": 4, "expectedLifeA4Pages": 200000, "maintenanceRatePercent": 20, "warrantyExpirationYear": 2028}	2026-08-28 21:18:14.73336+00
INB-1397	INB-1397	2026-08-27	PAP-7124	Idea Paper A5 - 80gsm (Sheet)	Supplier	PAPER	1.00	ແຜ່ນ	95000.00	TRANSFER	TH	0.00	0.00	data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E		{"brand": "Idea ", "paperCode": "PAP-7124", "paperCore": null, "rollWidthM": null, "coatingTech": null, "grammageGsm": "80", "paperFormat": "Sheet", "rollLengthM": null, "paperSurface": "Plain Paper", "standardSize": "A4", "customWidthMm": null, "packagingType": "Ream", "sheetsPerPack": 500, "surfaceFinish": null, "customLengthMm": null, "printableSides": null, "compatibilities": ["dye", "pigment"], "rollWidthPreset": null, "sheets_per_pack": 500, "sheets_per_ream": 500}	2026-08-28 21:38:15.246569+00
INB-7677	INB-7677	2026-08-27	INB-7677	Epson-008-BK (Black)	Supplier	INK	1.00	ຂວດ	95000.00	TRANSFER	TH	0.00	0.00	data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E		{"id": "INB-7677", "sku": "INK-9826", "docs": {"paymentSlip": "", "productPhoto": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E"}, "name": "Epson-008-BK (Black)", "unit": "ຂວດ", "specs": {"volume": 127, "inkCode": "INK-9826", "colorName": "Epson-008-BK", "colorGroup": "Black", "inkBaseType": "Pigment", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}, "volume": 127, "inkCode": "INK-9826", "subUnit": "(1 ຂວດ)", "category": "INK", "itemName": "Epson-008-BK (Black)", "poNumber": "INB-7677", "supplier": "", "colorName": "Epson-008-BK", "colorGroup": "Black", "currentQty": 1, "initialQty": 1, "receiptUrl": "", "totalPrice": 18000000, "inkBaseType": "Pigment", "receiptDate": "2026-08-27", "categoryPill": "INK", "isCompatible": false, "payment_slip": "", "actual_images": [], "paymentMethod": "TRANSFER", "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-28 21:38:15.253062+00
INB-8929	INB-8929	2026-08-27	INK-8713	Epson-008-C (Cyan)	Supplier	INK	1.00	ຂວດ	95000.00	TRANSFER	TH	0.00	0.00	data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E		{"volume": 70, "inkCode": "INK-8713", "colorName": "Epson-008-C", "colorGroup": "Cyan", "inkBaseType": "Pigment", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-28 21:38:15.262401+00
INB-7782	INB-7782	2026-08-27	INK-6588	Epson-008-Y (Yellow)	Supplier	INK	1.00	ຂວດ	95000.00	TRANSFER	TH	0.00	0.00	data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E		{"id": "INB-7782", "sku": "INK-6588", "docs": {"paymentSlip": "", "productPhoto": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E"}, "name": "Epson-008-M (Magenta)", "unit": "ຂວດ", "specs": {"volume": 70, "inkCode": "INK-6588", "colorName": "Epson-008-Y", "colorGroup": "Yellow", "inkBaseType": "Pigment", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}, "origin": "TH", "volume": 70, "inkCode": "INK-6588", "subUnit": "(1 ຂວດ)", "category": "INK", "itemName": "Epson-008-M (Magenta)", "poNumber": "INB-7782", "supplier": "Supplier", "colorName": "Epson-008-Y", "colorGroup": "Yellow", "currentQty": 1, "initialQty": 1, "receiptUrl": "", "totalPrice": 95000, "inkBaseType": "Pigment", "receiptDate": "2026-08-27", "categoryPill": "INK", "isCompatible": false, "payment_slip": "", "actual_images": [], "paymentMethod": "TRANSFER", "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-28 21:38:15.256998+00
INB-5313	INB-5313	2026-08-27	INK-0365	Epson-008-M (Magenta)	Supplier	INK	1.00	ຂວດ	95000.00	TRANSFER	TH	0.00	0.00	data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E		{"volume": 70, "inkCode": "INK-0365", "colorName": "Epson-008-M", "colorGroup": "Magenta", "inkBaseType": "Pigment", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-28 21:38:15.259629+00
INB-8371	INB-8371	2026-08-25	INK-1788	EPSON-001-Y (Yellow)	Supplier	INK	1.00	ຂວດ	80000.00	TRANSFER	TH	0.00	0.00	data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E		{"volume": 70, "inkCode": "INK-1788", "colorName": "EPSON-001-Y", "colorGroup": "Yellow", "inkBaseType": "Dye", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-28 21:38:15.271047+00
INB-6915	INB-6915	2026-08-25	INK-6618	EPSON-001- BK (Cyan)	Supplier	INK	1.00	ຂວດ	80000.00	TRANSFER	TH	0.00	0.00	data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E		{"id": "INB-6915", "sku": "INK-6618", "docs": {"paymentSlip": "", "productPhoto": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E"}, "name": "EPSON-001- BK (Cyan)", "unit": "ຂວດ", "specs": {"volume": 127, "inkCode": "INK-6618", "colorName": "EPSON-001- BK", "colorGroup": "Black", "inkBaseType": "Dye", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}, "volume": 127, "inkCode": "INK-6618", "subUnit": "(1 ຂວດ)", "category": "INK", "itemName": "EPSON-001- BK (Cyan)", "poNumber": "INB-6915", "supplier": "", "colorName": "EPSON-001- BK", "colorGroup": "Black", "currentQty": 1, "initialQty": 1, "receiptUrl": "", "totalPrice": 80000, "inkBaseType": "Dye", "receiptDate": "2026-08-25", "categoryPill": "INK", "isCompatible": false, "payment_slip": "", "actual_images": [], "paymentMethod": "TRANSFER", "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-28 21:38:15.274602+00
INB-3699	INB-3699	2026-08-25	INK-8306	LC-462XL-BK (Cyan)	Supplier	INK	1.00	ຂວດ	430000.00	TRANSFER	TH	0.00	0.00	data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E		{"id": "INB-3699", "sku": "INK-8306", "docs": {"paymentSlip": "", "productPhoto": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E"}, "name": "LC-462XL-BK (Cyan)", "unit": "ຂວດ", "specs": {"volume": 57.5, "inkCode": "INK-8306", "colorName": "LC-462XL-BK", "colorGroup": "Black", "inkBaseType": "Dye", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}, "volume": 57.5, "inkCode": "INK-8306", "subUnit": "(1 ຂວດ)", "category": "INK", "itemName": "LC-462XL-BK (Cyan)", "poNumber": "INB-3699", "supplier": "", "colorName": "LC-462XL-BK", "colorGroup": "Black", "currentQty": 1, "initialQty": 1, "receiptUrl": "", "totalPrice": 430000, "inkBaseType": "Dye", "receiptDate": "2026-08-25", "categoryPill": "INK", "isCompatible": false, "payment_slip": "", "actual_images": [], "paymentMethod": "TRANSFER", "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-28 21:38:15.266361+00
INB-5937	INB-5937	2026-08-25	INK-0798	EPSON-001-M (Magenta)	Supplier	INK	1.00	ຂວດ	80000.00	TRANSFER	TH	0.00	0.00	data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E		{"volume": 70, "inkCode": "INK-0798", "colorName": "EPSON-001-M", "colorGroup": "Magenta", "inkBaseType": "Dye", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-28 21:38:15.269081+00
INB-9838	INB-9838	2026-08-25	INK-4590	EPSON-001-C (Cyan)	Supplier	INK	1.00	ຂວດ	80000.00	TRANSFER	TH	0.00	0.00	data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E		{"volume": 70, "inkCode": "INK-4590", "colorName": "EPSON-001-C", "colorGroup": "Cyan", "inkBaseType": "Dye", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-28 21:38:15.27271+00
INB-5465	INB-5465	2026-08-25	PRN-6317	Brother MFC-J2740DW	Supplier	PRINTER	1.00	ແຜ່ນ	7000000.00	TRANSFER	TH	0.00	0.00	data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E		{"brand": "Brother", "model": "MFC-J2740DW", "location": "Main Dept", "color_config": {"slots": [{"id": "k", "code": "K", "name": "Black", "hexColor": "#000000"}, {"id": "c", "code": "C", "name": "Cyan", "hexColor": "#00FFFF"}, {"id": "m", "code": "M", "name": "Magenta", "hexColor": "#FF00FF"}, {"id": "y", "code": "Y", "name": "Yellow", "hexColor": "#FFFF00"}], "colorScheme": "CMYK"}, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "colorSchemeType": "CMYK", "oemBaselineInks": [{"colorGroup": "Black", "oemInkCode": "LC462XL-BK", "slotPosition": "Slot 1 (K - Black)", "oemStandardVolumeMl": 65, "oemStandardIsoYieldA4": 1500}, {"colorGroup": "Cyan", "oemInkCode": "LC462XL-C", "slotPosition": "Slot 2 (C - Cyan)", "oemStandardVolumeMl": 19, "oemStandardIsoYieldA4": 1500}, {"colorGroup": "Magenta", "oemInkCode": "LC462XL-M", "slotPosition": "Slot 3 (M - Magenta)", "oemStandardVolumeMl": 19, "oemStandardIsoYieldA4": 1500}, {"colorGroup": "Yellow", "oemInkCode": "LC462XL-Y", "slotPosition": "Slot 4 (Y - Yellow)", "oemStandardVolumeMl": 19, "oemStandardIsoYieldA4": 1500}], "printerCategory": "Inkjet", "totalColorSlots": 4, "expectedLifeA4Pages": 150000, "maintenanceRatePercent": 20, "warrantyExpirationYear": 2028}	2026-08-28 21:38:15.276526+00
INB-3125	INB-3125	2026-08-23	INB-3125	Double A A4 - 80gsm (Sheet)	Supplier	PAPER	10.00	ແຜ່ນ	930000.00	TRANSFER	TH	0.00	0.00	data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E		{"id": "INB-3125", "sku": "PAP-8952", "docs": {"paymentSlip": "", "productPhoto": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E"}, "name": "Double A A4 - 80gsm (Sheet)", "unit": "ແຜ່ນ", "brand": "Double A", "specs": {"id": "INB-3125", "sku": "PAP-8952", "docs": {"paymentSlip": "", "productPhoto": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E"}, "name": "Double A A4 - 80gsm (Sheet)", "unit": "ແຜ່ນ", "brand": "Double A", "specs": {"brand": "Double A", "paperCode": "PAP-8952", "paperCore": null, "rollWidthM": null, "coatingTech": null, "grammageGsm": "80", "paperFormat": "Sheet", "rollLengthM": null, "paperSurface": "Plain Paper", "standardSize": "A4", "customWidthMm": null, "packagingType": "Ream", "sheetsPerPack": 500, "surfaceFinish": null, "customLengthMm": null, "printableSides": null, "compatibilities": ["dye", "pigment"], "rollWidthPreset": null, "sheets_per_pack": 500, "sheets_per_ream": 500}, "origin": "TH", "subUnit": "(5 ແຜ່ນ)", "category": "PAPER", "itemName": "Double A A4 - 80gsm (Sheet)", "poNumber": "INB-3125", "supplier": "Supplier", "paperCode": "PAP-8952", "paperCore": null, "currentQty": 5, "initialQty": 5, "receiptUrl": "", "rollWidthM": null, "totalPrice": 460000, "coatingTech": null, "grammageGsm": "80", "paperFormat": "Sheet", "receiptDate": "2026-08-23", "rollLengthM": null, "categoryPill": "PAPER", "paperSurface": "Plain Paper", "standardSize": "A4", "customWidthMm": null, "packagingType": "Ream", "paymentMethod": "TRANSFER", "purchase_link": "", "sheetsPerPack": 500, "surfaceFinish": null, "customLengthMm": null, "printableSides": null, "supplier_phone": "", "compatibilities": ["dye", "pigment"], "rollWidthPreset": null, "sheets_per_pack": 500, "sheets_per_ream": 500}, "origin": "TH", "subUnit": "(5 ແຜ່ນ)", "category": "PAPER", "itemName": "Double A A4 - 80gsm (Sheet)", "poNumber": "INB-3125", "supplier": "Supplier", "paperCode": "PAP-8952", "paperCore": null, "currentQty": 5, "initialQty": 5, "receiptUrl": "", "rollWidthM": null, "totalPrice": 465000, "coatingTech": null, "grammageGsm": "80", "paperFormat": "Sheet", "receiptDate": "2026-08-23", "rollLengthM": null, "categoryPill": "PAPER", "paperSurface": "Plain Paper", "standardSize": "A4", "customWidthMm": null, "packagingType": "Ream", "paymentMethod": "TRANSFER", "purchase_link": "", "sheetsPerPack": 500, "surfaceFinish": null, "customLengthMm": null, "printableSides": null, "supplier_phone": "", "compatibilities": ["dye", "pigment"], "rollWidthPreset": null, "sheets_per_pack": 500, "sheets_per_ream": 500}	2026-08-28 21:38:15.278427+00
INB-RESTOCK-4712-607	INB-RESTOCK-4712-607	2026-08-28	PAP-4100	Green Read Paper	Restock Supplier	PAPER	1.00	แพ็ก	85000.00	TRANSFER	TH	0.00	0.00			{"sku": "PAP-4100", "skuCode": "PAP-4100", "isRestock": true, "unitPrice": 85000, "materialId": "PAP-4100", "restockQty": 1, "sheets_per_pack": 1, "sheets_per_ream": 1}	2026-08-28 22:15:54.734427+00
\.


--
-- Data for Name: ink_master_catalog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ink_master_catalog (ink_code, color_name, color_group, volume, stock_quantity, unit_price, ink_base_type, is_compatible_ink, technical_specs, product_image_url, receipt_invoice_url, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: lao_districts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lao_districts (id, province_id, name_la, name_en, created_at) FROM stdin;
1	1	ຈັນທະບູລີ	Chanthabuly	2026-08-25 20:29:06.522753+00
2	1	ສີໂຄດຕະບອງ	Sikhottabong	2026-08-25 20:29:06.522753+00
3	1	ໄຊເສດຖາ	Xaysetha	2026-08-25 20:29:06.522753+00
4	1	ສີສັດຕະນາກ	Sisattanak	2026-08-25 20:29:06.522753+00
5	1	ນາຊາຍທອງ	Naxaithong	2026-08-25 20:29:06.522753+00
6	1	ໄຊທານີ	Xaythany	2026-08-25 20:29:06.522753+00
7	1	ຫາດຊາຍຟອງ	Hadxayfong	2026-08-25 20:29:06.522753+00
8	1	ສັງທອງ	Sangthong	2026-08-25 20:29:06.522753+00
9	1	ປາກງື່ມ	Pakngum	2026-08-25 20:29:06.522753+00
10	2	ໂພນໂຮງ	Phonhong	2026-08-25 20:29:06.522753+00
11	2	ທຸລະຄົມ	Thoulakhom	2026-08-25 20:29:06.522753+00
12	2	ແກ້ວອຸດົມ	Keooudom	2026-08-25 20:29:06.522753+00
13	2	ກາສີ	Kasy	2026-08-25 20:29:06.522753+00
14	2	ວັງວຽງ	Vangvieng	2026-08-25 20:29:06.522753+00
15	2	ເຟືອງ	Feuang	2026-08-25 20:29:06.522753+00
16	2	ຊະນະຄາມ	Xanakham	2026-08-25 20:29:06.522753+00
17	2	ແມດ	Mad	2026-08-25 20:29:06.522753+00
18	2	ຫີນເຫີບ	Hinheup	2026-08-25 20:29:06.522753+00
19	2	ໝື່ນ	Meun	2026-08-25 20:29:06.522753+00
20	2	ຮົ່ມ	Hom	2026-08-25 20:29:06.522753+00
21	2	ໄຊສົມບູນ	Xaisomboun	2026-08-25 20:29:06.522753+00
22	3	ຫຼວງພະບາງ	Luangprabang	2026-08-25 20:29:06.522753+00
23	3	ຊຽງເງິນ	Xiengngeun	2026-08-25 20:29:06.522753+00
24	3	ນານ	Nan	2026-08-25 20:29:06.522753+00
25	3	ປາກອູ	Pak Ou	2026-08-25 20:29:06.522753+00
26	3	ນ້ຳບາກ	Nambak	2026-08-25 20:29:06.522753+00
27	3	ງອຍ	Ngoy	2026-08-25 20:29:06.522753+00
28	3	ປາກແຊງ	Pak Xeng	2026-08-25 20:29:06.522753+00
29	3	ໂພນໄຊ	Phonxay	2026-08-25 20:29:06.522753+00
30	3	ຈອມເພັດ	Chomphet	2026-08-25 20:29:06.522753+00
31	3	ວຽງຄຳ	Viengkham	2026-08-25 20:29:06.522753+00
32	3	ພູຄູນ	Phoukhoun	2026-08-25 20:29:06.522753+00
33	3	ໂພນທອງ	Phonthong	2026-08-25 20:29:06.522753+00
34	4	ປາກເຊ	Pakse	2026-08-25 20:29:06.522753+00
35	4	ຊະນະສົມບູນ	Sanasomboun	2026-08-25 20:29:06.522753+00
36	4	ບາຈຽງຈະເລີນສຸກ	Bachiangchaleunsook	2026-08-25 20:29:06.522753+00
37	4	ປາກຊ່ອງ	Paksong	2026-08-25 20:29:06.522753+00
38	4	ປະທຸມພອນ	Pathoumphone	2026-08-25 20:29:06.522753+00
39	4	ໂພນທອງ	Phonthong	2026-08-25 20:29:06.522753+00
40	4	ໂຊ້ງ	Santhong	2026-08-25 20:29:06.522753+00
41	4	ສຸຂຸມາ	Sukhuma	2026-08-25 20:29:06.522753+00
42	4	ມູນລະປະໂມກ	Moonlapamok	2026-08-25 20:29:06.522753+00
43	4	ໂຂງ	Khong	2026-08-25 20:29:06.522753+00
44	5	ໄກສອນ ພົມວິຫານ	Kaysone Phomvihane	2026-08-25 20:29:06.522753+00
45	5	ອຸທຸມພອນ	Outhoumphone	2026-08-25 20:29:06.522753+00
46	5	ອາດສະພັງທອງ	Atsaphangthong	2026-08-25 20:29:06.522753+00
47	5	ພີນ	Phine	2026-08-25 20:29:06.522753+00
48	5	ເຊໂປນ	Sepone	2026-08-25 20:29:06.522753+00
49	5	ໜອງ	Nong	2026-08-25 20:29:06.522753+00
50	5	ທ່າປາງທອງ	Thapangthong	2026-08-25 20:29:06.522753+00
51	5	ສອງຄອນ	Songkhone	2026-08-25 20:29:06.522753+00
52	5	ຈຳພອນ	Chamonphone	2026-08-25 20:29:06.522753+00
53	5	ຊົນບູລີ	Xonbuly	2026-08-25 20:29:06.522753+00
54	5	ໄຊບູລີ	Xaybuly	2026-08-25 20:29:06.522753+00
55	5	ວິລະບູລີ	Vilabuly	2026-08-25 20:29:06.522753+00
56	5	ອາດສະພອນ	Assaphone	2026-08-25 20:29:06.522753+00
57	5	ໄຊພູທອງ	Xonkhone	2026-08-25 20:29:06.522753+00
58	5	ພະລານໄຊ	Phouthong	2026-08-25 20:29:06.522753+00
59	6	ທ່າແຂກ	Thakhek	2026-08-25 20:29:06.522753+00
60	6	ມະຫາໄຊ	Mahaxay	2026-08-25 20:29:06.522753+00
61	6	ໜອງບົກ	Nongbok	2026-08-25 20:29:06.522753+00
62	6	ຫີນບູນ	Hinboun	2026-08-25 20:29:06.522753+00
63	6	ຍົມມະລາດ	Nhommalath	2026-08-25 20:29:06.522753+00
64	6	ບົວລະພາ	Bualapha	2026-08-25 20:29:06.522753+00
65	6	ນາກາຍ	Nakai	2026-08-25 20:29:06.522753+00
66	6	ເຊບັ້ງໄຟ	Xebangfai	2026-08-25 20:29:06.522753+00
67	6	ໄຊຈຳພອນ	Saihoum	2026-08-25 20:29:06.522753+00
68	7	ປາກຊັນ	Pakxan	2026-08-25 20:29:06.522753+00
69	7	ທ່າພະບາດ	Thaphabath	2026-08-25 20:29:06.522753+00
70	7	ປາກກະດິງ	Pakkading	2026-08-25 20:29:06.522753+00
71	7	ບໍລິຄັນ	Borikhan	2026-08-25 20:29:06.522753+00
72	7	ຄຳເກີດ	Khamkeut	2026-08-25 20:29:06.522753+00
73	7	ວຽງທອງ	Viengthong	2026-08-25 20:29:06.522753+00
74	7	ໄຊຈຳພອນ	Xaychamphone	2026-08-25 20:29:06.522753+00
75	8	ໄຊ	Xay	2026-08-25 20:29:06.522753+00
76	8	ຫຼາ	La	2026-08-25 20:29:06.522753+00
77	8	ນ້ຳໝໍ້	Nambor	2026-08-25 20:29:06.522753+00
78	8	ງາ	Nga	2026-08-25 20:29:06.522753+00
79	8	ແບ່ງ	Beng	2026-08-25 20:29:06.522753+00
80	8	ຮຸນ	Houn	2026-08-25 20:29:06.522753+00
81	8	ປາກແບ່ງ	Pakbeng	2026-08-25 20:29:06.522753+00
82	9	ໄຊຍະບູລີ	Xayaboury	2026-08-25 20:29:06.522753+00
83	9	ຄອບ	Khop	2026-08-25 20:29:06.522753+00
84	9	ຫົງສາ	Hongsa	2026-08-25 20:29:06.522753+00
85	9	ເງິນ	Ngeun	2026-08-25 20:29:06.522753+00
86	9	ຊຽງຮ່ອນ	Xienghone	2026-08-25 20:29:06.522753+00
87	9	ພຽງ	Phiang	2026-08-25 20:29:06.522753+00
88	9	ປາກລາຍ	Parklai	2026-08-25 20:29:06.522753+00
89	9	ແກ່ນທ້າວ	Kenethao	2026-08-25 20:29:06.522753+00
90	9	ບໍ່ແຕນ	Botene	2026-08-25 20:29:06.522753+00
91	9	ທົ່ງມີໄຊ	Thongmyxay	2026-08-25 20:29:06.522753+00
92	9	ໄຊສະຖານ	Xaisathan	2026-08-25 20:29:06.522753+00
93	10	ແປກ	Pek	2026-08-25 20:29:06.522753+00
94	10	ຄຳ	Kham	2026-08-25 20:29:06.522753+00
95	10	ໜອງແຮດ	Nonghet	2026-08-25 20:29:06.522753+00
96	10	ຄູນ	Khoun	2026-08-25 20:29:06.522753+00
97	10	ທ່າໂທມ	Thathom	2026-08-25 20:29:06.522753+00
98	10	ພູກູດ	Phookoot	2026-08-25 20:29:06.522753+00
99	10	ຜາໄຊ	Phaxay	2026-08-25 20:29:06.522753+00
100	11	ຊຳເໜືອ	Xamneua	2026-08-25 20:29:06.522753+00
101	11	ຊຽງຄໍ້	Xiengkhor	2026-08-25 20:29:06.522753+00
102	11	ຮ້ຽມ	Hiam	2026-08-25 20:29:06.522753+00
103	11	ວຽງໄຊ	Viengxay	2026-08-25 20:29:06.522753+00
104	11	ຫົວເມືອງ	Huameuang	2026-08-25 20:29:06.522753+00
105	11	ຊຳໃຕ້	Samtay	2026-08-25 20:29:06.522753+00
106	11	ສົບເບົາ	Sop Bao	2026-08-25 20:29:06.522753+00
107	11	ແອດ	Et	2026-08-25 20:29:06.522753+00
108	11	ໂກນ	Kone	2026-08-25 20:29:06.522753+00
109	11	ຊ່ອນ	Xon	2026-08-25 20:29:06.522753+00
110	12	ຫຼວງນ້ຳທາ	Luangnamtha	2026-08-25 20:29:06.522753+00
111	12	ສິງ	Sing	2026-08-25 20:29:06.522753+00
112	12	ລອງ	Long	2026-08-25 20:29:06.522753+00
113	12	ວຽງພູຄາ	Viengphoukha	2026-08-25 20:29:06.522753+00
114	12	ນາແລ	Na Le	2026-08-25 20:29:06.522753+00
115	13	ຫ້ວຍຊາຍ	Houayxay	2026-08-25 20:29:06.522753+00
116	13	ຕົ້ນເຜິ້ງ	Tonpheung	2026-08-25 20:29:06.522753+00
117	13	ເມິງ	Meung	2026-08-25 20:29:06.522753+00
118	13	ຜາອຸດົມ	Pha Oudom	2026-08-25 20:29:06.522753+00
119	13	ປາກທາ	Paktha	2026-08-25 20:29:06.522753+00
120	14	ຜົ້ງສາລີ	Phongsaly	2026-08-25 20:29:06.522753+00
121	14	ໃໝ່	May	2026-08-25 20:29:06.522753+00
122	14	ຂວາ	Khoua	2026-08-25 20:29:06.522753+00
123	14	ສຳພັນ	Samphanh	2026-08-25 20:29:06.522753+00
124	14	ບຸນເໜືອ	Boun Neua	2026-08-25 20:29:06.522753+00
125	14	ຍອດອູ	Yot Ou	2026-08-25 20:29:06.522753+00
126	14	ບຸນໃຕ້	Boun Tay	2026-08-25 20:29:06.522753+00
127	15	ສາລະວັນ	Salavan	2026-08-25 20:29:06.522753+00
128	15	ຕະໂອ້ຍ	Ta-Oy	2026-08-25 20:29:06.522753+00
129	15	ຕຸ້ມລານ	To vanity	2026-08-25 20:29:06.522753+00
130	15	ລະຄອນເພັງ	Lakhonepheng	2026-08-25 20:29:06.522753+00
131	15	ວາປີ	Vapi	2026-08-25 20:29:06.522753+00
132	15	ຄົງເຊໂດນ	Khongxedone	2026-08-25 20:29:06.522753+00
133	15	ເລົ່າງາມ	Lao Ngam	2026-08-25 20:29:06.522753+00
134	15	ສະໝ້ວຍ	Samouay	2026-08-25 20:29:06.522753+00
135	16	ລະມາມ	Lamam	2026-08-25 20:29:06.522753+00
136	16	ກະລຶມ	Kaleum	2026-08-25 20:29:06.522753+00
137	16	ດັກຈຶງ	Dakcheung	2026-08-25 20:29:06.522753+00
138	16	ທ່າແຕງ	Tha Teng	2026-08-25 20:29:06.522753+00
139	17	ໄຊເສດຖາ	Xaysetha	2026-08-25 20:29:06.522753+00
140	17	ສາມັກຄີໄຊ	Samakkhixay	2026-08-25 20:29:06.522753+00
141	17	ສະໜາມໄຊ	Sanamxay	2026-08-25 20:29:06.522753+00
142	17	ພູວົງ	Phouvong	2026-08-25 20:29:06.522753+00
143	17	ສານໄຊ	Sanxay	2026-08-25 20:29:06.522753+00
144	18	ອານຸວົງ	Anouvong	2026-08-25 20:29:06.522753+00
145	18	ລອງແຈ້ງ	Longchaeng	2026-08-25 20:29:06.522753+00
146	18	ທ່າໂທມ	Thathom	2026-08-25 20:29:06.522753+00
147	18	ລອງຊານ	Longxan	2026-08-25 20:29:06.522753+00
148	18	ຮົ່ມ	Hom	2026-08-25 20:29:06.522753+00
\.


--
-- Data for Name: lao_provinces; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lao_provinces (id, name_la, name_en, label, created_at) FROM stdin;
1	ນະຄອນຫຼວງວຽງຈັນ	Vientiane Capital	ນະຄອນຫຼວງວຽງຈັນ (Vientiane Capital)	2026-08-25 20:29:06.522753+00
2	ແຂວງວຽງຈັນ	Vientiane Province	ແຂວງວຽງຈັນ (Vientiane Province)	2026-08-25 20:29:06.522753+00
3	ຫຼວງພະບາງ	Luangprabang	ຫຼວງພະບາງ (Luangprabang)	2026-08-25 20:29:06.522753+00
4	ຈຳປາສັກ	Champasak	ຈຳປາສັກ (Champasak)	2026-08-25 20:29:06.522753+00
5	ສະຫວັນນະເຂດ	Savannakhet	ສະຫວັນນະເຂດ (Savannakhet)	2026-08-25 20:29:06.522753+00
6	ຄຳມ່ວນ	Khammouane	ຄຳມ່ວນ (Khammouane)	2026-08-25 20:29:06.522753+00
7	ບໍລິຄຳໄຊ	Borikhamxay	ບໍລິຄຳໄຊ (Borikhamxay)	2026-08-25 20:29:06.522753+00
8	ອຸດົມໄຊ	Oudomxay	ອຸດົມໄຊ (Oudomxay)	2026-08-25 20:29:06.522753+00
9	ໄຊຍະບູລີ	Xayaboury	ໄຊຍະບູລີ (Xayaboury)	2026-08-25 20:29:06.522753+00
10	ຊຽງຂວາງ	Xiengkhouang	ຊຽງຂວາງ (Xiengkhouang)	2026-08-25 20:29:06.522753+00
11	ຫົວພັນ	Houaphanh	ຫົວພັນ (Houaphanh)	2026-08-25 20:29:06.522753+00
12	ຫຼວງນ້ຳທາ	Luangnamtha	ຫຼວງນ້ຳທາ (Luangnamtha)	2026-08-25 20:29:06.522753+00
13	ບໍ່ແກ້ວ	Bokeo	ບໍ່ແກ້ວ (Bokeo)	2026-08-25 20:29:06.522753+00
14	ຜົ້ງສາລີ	Phongsaly	ຜົ້ງສາລີ (Phongsaly)	2026-08-25 20:29:06.522753+00
15	ສາລະວັນ	Salavan	ສາລະວັນ (Salavan)	2026-08-25 20:29:06.522753+00
16	ເຊກອງ	Sekong	ເຊກອງ (Sekong)	2026-08-25 20:29:06.522753+00
17	ອັດຕະປື	Attapeu	ອັດຕະປື (Attapeu)	2026-08-25 20:29:06.522753+00
18	ໄຊສົມບູນ	Xaysomboun	ໄຊສົມບູນ (Xaysomboun)	2026-08-25 20:29:06.522753+00
\.


--
-- Data for Name: machine_downtime_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.machine_downtime_logs (id, machine_id, machine_name, status, reason, technician_id, start_time, end_time, duration_minutes, created_at) FROM stdin;
\.


--
-- Data for Name: maintenance_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance_tickets (id, equipment_id, trigger_reason, status, scheduled_date, resolved_at, created_at) FROM stdin;
\.


--
-- Data for Name: materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.materials (id, sku, name, category, stock_qty, consumption_unit, purchase_unit, purchase_multiplier, cost_per_purchase_unit, cost_per_consumption_unit, reorder_threshold, technical_specs, created_at, updated_at, is_active, min_stock_alert, stock_status, specification_meta) FROM stdin;
PAP-8458	PAP-8458	Double A4	Paper	1.00	ແຜ່ນ	ແຜ່ນ	1.00	95000.00	95000.00	10.00	{"brand": "Double A", "paperCode": "PAP-8458", "paperCore": null, "rollWidthM": null, "coatingTech": null, "grammageGsm": "80", "paperFormat": "Sheet", "rollLengthM": null, "paperSurface": "Plain Paper", "standardSize": "A4", "customWidthMm": null, "packagingType": "Ream", "sheetsPerPack": 500, "surfaceFinish": null, "customLengthMm": null, "printableSides": null, "compatibilities": ["dye", "pigment"], "rollWidthPreset": null, "sheets_per_pack": 500, "sheets_per_ream": 500}	2026-08-14 17:42:27.952069+00	2026-08-14 17:42:27.952069+00	t	10.0000	IN_STOCK	{}
INK-0093	INK-0093	ໝຶກ LC-462XL-C (Dye)	Ink	17.60	ຂວດ	ຂວດ	16.60	430000.00	25903.61	50.00	{"volume": 16.6, "inkCode": "INK-0093", "colorName": "LC-462XL-C", "colorGroup": "Cyan", "inkBaseType": "Dye", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-25 20:30:59.235251+00	2026-08-25 20:30:59.23247+00	t	10.0000	IN_STOCK	{}
INK-1160	INK-1160	ໝຶກ LC-462XL-M (Dye)	Ink	17.60	ຂວດ	ຂວດ	16.60	430000.00	25903.61	50.00	{"volume": 16.6, "inkCode": "INK-1160", "colorName": "LC-462XL-M", "colorGroup": "Magenta", "inkBaseType": "Dye", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-25 20:31:18.713528+00	2026-08-25 20:31:18.707343+00	t	10.0000	IN_STOCK	{}
INK-3389	INK-3389	ໝຶກ LC-462XL-Y (Dye)	Ink	17.60	ຂວດ	ຂວດ	16.60	430000.00	25903.61	50.00	{"volume": 16.6, "inkCode": "INK-3389", "colorName": "LC-462XL-Y", "colorGroup": "Yellow", "inkBaseType": "Dye", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-25 20:31:43.796242+00	2026-08-25 20:31:43.792839+00	t	10.0000	IN_STOCK	{}
PAP-6071	PAP-6071	Idea Paper A4	Paper	5000.00	แผ่น	แพ็ก	500.00	92000.00	184.00	50.00	{"brand": "Idea Paper", "paperCode": "PAP-6071", "paperCore": null, "rollWidthM": null, "coatingTech": null, "grammageGsm": "80", "paperFormat": "Sheet", "rollLengthM": null, "paperSurface": "Plain Paper", "standardSize": "A4", "customWidthMm": null, "packagingType": "Ream", "sheetsPerPack": 500, "surfaceFinish": null, "customLengthMm": null, "printableSides": null, "compatibilities": ["dye", "pigment"], "rollWidthPreset": null, "sheets_per_pack": 500, "sheets_per_ream": 500}	2026-08-26 21:27:37.112592+00	2026-08-26 21:27:37.115611+00	t	10.0000	IN_STOCK	{}
PAP-1983	PAP-1983	Double A Paper A4 package	Paper	1000.00	แผ่น	แพ็ก	500.00	81200.00	162.40	50.00	{"brand": "Double A", "paperCode": "PAP-1983", "paperCore": null, "rollWidthM": null, "coatingTech": null, "grammageGsm": "80", "paperFormat": "Sheet", "rollLengthM": null, "paperSurface": "Glossy", "standardSize": "A4", "customWidthMm": null, "packagingType": "Ream", "sheetsPerPack": 500, "surfaceFinish": null, "customLengthMm": null, "printableSides": null, "compatibilities": ["dye", "pigment"], "rollWidthPreset": null, "sheets_per_pack": 500, "sheets_per_ream": 500}	2026-08-27 19:34:14.178516+00	2026-08-27 19:34:14.174567+00	t	10.0000	IN_STOCK	{}
PAP-4100	PAP-4100	Green Read Paper	PAPER	6.00	แพ็ก	แพ็ก	1.00	85000.00	85000.00	50.00	{"brand": "Green Read", "paperCode": "PAP-4100", "paperCore": null, "rollWidthM": null, "coatingTech": null, "grammageGsm": "80", "paperFormat": "Sheet", "rollLengthM": null, "paperSurface": "Plain Paper", "standardSize": "A4", "customWidthMm": null, "packagingType": "Ream", "sheetsPerPack": 500, "surfaceFinish": null, "customLengthMm": null, "printableSides": null, "compatibilities": ["dye", "pigment"], "rollWidthPreset": null, "sheets_per_pack": 500, "sheets_per_ream": 500}	2026-08-14 19:17:50.030461+00	2026-08-28 22:15:54.76769+00	t	10.0000	IN_STOCK	{}
PRN-9614	PRN-9614	Epson L15150	PRINTER	2.00	Unit	ເຄື່ອງ	1.00	18000000.00	18000000.00	50.00	{"id": "INB-5266", "sku": "PRN-9614", "docs": {"paymentSlip": "", "productPhoto": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E"}, "name": "Epson L15150", "unit": "ເຄື່ອງ", "brand": "Epson", "model": "L15150", "specs": {"brand": "Epson", "model": "L15150", "location": "Main Dept", "color_config": {"slots": [{"id": "k", "code": "K", "name": "Black", "hexColor": "#000000"}, {"id": "c", "code": "C", "name": "Cyan", "hexColor": "#00FFFF"}, {"id": "m", "code": "M", "name": "Magenta", "hexColor": "#FF00FF"}, {"id": "y", "code": "Y", "name": "Yellow", "hexColor": "#FFFF00"}], "colorScheme": "CMYK"}, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "colorSchemeType": "CMYK", "oemBaselineInks": [{"colorGroup": "Black", "oemInkCode": "EPSON-008-BK", "slotPosition": "Slot 1 (K - Black)", "oemStandardVolumeMl": 127, "oemStandardIsoYieldA4": 7500}, {"colorGroup": "Cyan", "oemInkCode": "EPSON-008-C", "slotPosition": "Slot 2 (C - Cyan)", "oemStandardVolumeMl": 70, "oemStandardIsoYieldA4": 6000}, {"colorGroup": "Magenta", "oemInkCode": "EPSON-008-M", "slotPosition": "Slot 3 (M - Magenta)", "oemStandardVolumeMl": 70, "oemStandardIsoYieldA4": 6000}, {"colorGroup": "Yellow", "oemInkCode": "EPSON-008-Y", "slotPosition": "Slot 4 (Y - Yellow)", "oemStandardVolumeMl": 70, "oemStandardIsoYieldA4": 6000}], "printerCategory": "Laser", "totalColorSlots": 4, "expectedLifeA4Pages": 200000, "maintenanceRatePercent": 20, "warrantyExpirationYear": 2028}, "origin": "TH", "skuCode": "PRN-9614", "subUnit": "(1 ແຜ່ນ)", "category": "PRINTER", "itemName": "Epson L15150", "location": "Main Dept", "poNumber": "INB-5266", "supplier": "Supplier", "currentQty": 1, "initialQty": 1, "materialId": "PRN-9614", "receiptUrl": "", "totalPrice": 18000000, "receiptDate": "2026-08-27", "categoryPill": "PRINTER", "color_config": {"slots": [{"id": "k", "code": "K", "name": "Black", "hexColor": "#000000"}, {"id": "c", "code": "C", "name": "Cyan", "hexColor": "#00FFFF"}, {"id": "m", "code": "M", "name": "Magenta", "hexColor": "#FF00FF"}, {"id": "y", "code": "Y", "name": "Yellow", "hexColor": "#FFFF00"}], "colorScheme": "CMYK"}, "payment_slip": "", "actual_images": [], "paymentMethod": "TRANSFER", "purchase_link": "", "supplier_phone": "", "colorSchemeType": "CMYK", "oemBaselineInks": [{"colorGroup": "Black", "oemInkCode": "EPSON-008-BK", "slotPosition": "Slot 1 (K - Black)", "oemStandardVolumeMl": 127, "oemStandardIsoYieldA4": 7500}, {"colorGroup": "Cyan", "oemInkCode": "EPSON-008-C", "slotPosition": "Slot 2 (C - Cyan)", "oemStandardVolumeMl": 70, "oemStandardIsoYieldA4": 6000}, {"colorGroup": "Magenta", "oemInkCode": "EPSON-008-M", "slotPosition": "Slot 3 (M - Magenta)", "oemStandardVolumeMl": 70, "oemStandardIsoYieldA4": 6000}, {"colorGroup": "Yellow", "oemInkCode": "EPSON-008-Y", "slotPosition": "Slot 4 (Y - Yellow)", "oemStandardVolumeMl": 70, "oemStandardIsoYieldA4": 6000}], "printerCategory": "Laser", "totalColorSlots": 4, "expectedLifeA4Pages": 200000, "maintenanceRatePercent": 20, "warrantyExpirationYear": 2028}	2026-08-28 21:18:14.73336+00	2026-08-28 21:18:14.733149+00	t	10.0000	IN_STOCK	{}
PAP-7124	PAP-7124	Idea Paper A5 - 80gsm (Sheet)	PAPER	1000.00	แผ่น	ແຜ່ນ	500.00	95000.00	190.00	50.00	{"brand": "Idea ", "paperCode": "PAP-7124", "paperCore": null, "rollWidthM": null, "coatingTech": null, "grammageGsm": "80", "paperFormat": "Sheet", "rollLengthM": null, "paperSurface": "Plain Paper", "standardSize": "A4", "customWidthMm": null, "packagingType": "Ream", "sheetsPerPack": 500, "surfaceFinish": null, "customLengthMm": null, "printableSides": null, "compatibilities": ["dye", "pigment"], "rollWidthPreset": null, "sheets_per_pack": 500, "sheets_per_ream": 500}	2026-08-28 21:38:15.246569+00	2026-08-28 21:38:15.246543+00	t	10.0000	IN_STOCK	{}
INB-7677	INB-7677	Epson-008-BK (Black)	INK	254.00	ml	ຂວດ	127.00	95000.00	748.03	50.00	{"id": "INB-7677", "sku": "INK-9826", "docs": {"paymentSlip": "", "productPhoto": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E"}, "name": "Epson-008-BK (Black)", "unit": "ຂວດ", "specs": {"volume": 127, "inkCode": "INK-9826", "colorName": "Epson-008-BK", "colorGroup": "Black", "inkBaseType": "Pigment", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}, "volume": 127, "inkCode": "INK-9826", "subUnit": "(1 ຂວດ)", "category": "INK", "itemName": "Epson-008-BK (Black)", "poNumber": "INB-7677", "supplier": "", "colorName": "Epson-008-BK", "colorGroup": "Black", "currentQty": 1, "initialQty": 1, "receiptUrl": "", "totalPrice": 18000000, "inkBaseType": "Pigment", "receiptDate": "2026-08-27", "categoryPill": "INK", "isCompatible": false, "payment_slip": "", "actual_images": [], "paymentMethod": "TRANSFER", "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-28 21:38:15.253062+00	2026-08-28 21:38:15.254851+00	t	10.0000	IN_STOCK	{}
INK-0365	INK-0365	Epson-008-M (Magenta)	INK	140.00	ml	ຂວດ	70.00	95000.00	1357.14	50.00	{"volume": 70, "inkCode": "INK-0365", "colorName": "Epson-008-M", "colorGroup": "Magenta", "inkBaseType": "Pigment", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-28 21:38:15.259629+00	2026-08-28 21:38:15.261351+00	t	10.0000	IN_STOCK	{}
INK-8306	INK-8306	LC-462XL-BK (Cyan)	INK	115.00	ml	ຂວດ	57.50	430000.00	7478.26	50.00	{"id": "INB-3699", "sku": "INK-8306", "docs": {"paymentSlip": "", "productPhoto": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E"}, "name": "LC-462XL-BK (Cyan)", "unit": "ຂວດ", "specs": {"volume": 57.5, "inkCode": "INK-8306", "colorName": "LC-462XL-BK", "colorGroup": "Black", "inkBaseType": "Dye", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}, "volume": 57.5, "inkCode": "INK-8306", "subUnit": "(1 ຂວດ)", "category": "INK", "itemName": "LC-462XL-BK (Cyan)", "poNumber": "INB-3699", "supplier": "", "colorName": "LC-462XL-BK", "colorGroup": "Black", "currentQty": 1, "initialQty": 1, "receiptUrl": "", "totalPrice": 430000, "inkBaseType": "Dye", "receiptDate": "2026-08-25", "categoryPill": "INK", "isCompatible": false, "payment_slip": "", "actual_images": [], "paymentMethod": "TRANSFER", "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-28 21:38:15.266361+00	2026-08-28 21:38:15.266358+00	t	10.0000	IN_STOCK	{}
INK-1788	INK-1788	EPSON-001-Y (Yellow)	INK	140.00	ml	ຂວດ	70.00	80000.00	1142.86	50.00	{"volume": 70, "inkCode": "INK-1788", "colorName": "EPSON-001-Y", "colorGroup": "Yellow", "inkBaseType": "Dye", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-28 21:38:15.271047+00	2026-08-28 21:38:15.271799+00	t	10.0000	IN_STOCK	{}
INK-6588	INK-6588	Epson-008-Y (Yellow)	INK	140.00	ml	ຂວດ	70.00	95000.00	1357.14	50.00	{"id": "INB-7782", "sku": "INK-6588", "docs": {"paymentSlip": "", "productPhoto": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E"}, "name": "Epson-008-M (Magenta)", "unit": "ຂວດ", "specs": {"volume": 70, "inkCode": "INK-6588", "colorName": "Epson-008-Y", "colorGroup": "Yellow", "inkBaseType": "Pigment", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}, "origin": "TH", "volume": 70, "inkCode": "INK-6588", "subUnit": "(1 ຂວດ)", "category": "INK", "itemName": "Epson-008-M (Magenta)", "poNumber": "INB-7782", "supplier": "Supplier", "colorName": "Epson-008-Y", "colorGroup": "Yellow", "currentQty": 1, "initialQty": 1, "receiptUrl": "", "totalPrice": 95000, "inkBaseType": "Pigment", "receiptDate": "2026-08-27", "categoryPill": "INK", "isCompatible": false, "payment_slip": "", "actual_images": [], "paymentMethod": "TRANSFER", "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-28 21:38:15.256998+00	2026-08-28 21:38:15.257491+00	t	10.0000	IN_STOCK	{}
INK-8713	INK-8713	Epson-008-C (Cyan)	INK	140.00	ml	ຂວດ	70.00	95000.00	1357.14	50.00	{"volume": 70, "inkCode": "INK-8713", "colorName": "Epson-008-C", "colorGroup": "Cyan", "inkBaseType": "Pigment", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-28 21:38:15.262401+00	2026-08-28 21:38:15.263996+00	t	10.0000	IN_STOCK	{}
INK-0798	INK-0798	EPSON-001-M (Magenta)	INK	140.00	ml	ຂວດ	70.00	80000.00	1142.86	50.00	{"volume": 70, "inkCode": "INK-0798", "colorName": "EPSON-001-M", "colorGroup": "Magenta", "inkBaseType": "Dye", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-28 21:38:15.269081+00	2026-08-28 21:38:15.270174+00	t	10.0000	IN_STOCK	{}
INK-4590	INK-4590	EPSON-001-C (Cyan)	INK	140.00	ml	ຂວດ	70.00	80000.00	1142.86	50.00	{"volume": 70, "inkCode": "INK-4590", "colorName": "EPSON-001-C", "colorGroup": "Cyan", "inkBaseType": "Dye", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-28 21:38:15.27271+00	2026-08-28 21:38:15.273216+00	t	10.0000	IN_STOCK	{}
PRN-6317	PRN-6317	Brother MFC-J2740DW	PRINTER	2.00	Unit	ແຜ່ນ	1.00	7000000.00	7000000.00	50.00	{"brand": "Brother", "model": "MFC-J2740DW", "location": "Main Dept", "color_config": {"slots": [{"id": "k", "code": "K", "name": "Black", "hexColor": "#000000"}, {"id": "c", "code": "C", "name": "Cyan", "hexColor": "#00FFFF"}, {"id": "m", "code": "M", "name": "Magenta", "hexColor": "#FF00FF"}, {"id": "y", "code": "Y", "name": "Yellow", "hexColor": "#FFFF00"}], "colorScheme": "CMYK"}, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "colorSchemeType": "CMYK", "oemBaselineInks": [{"colorGroup": "Black", "oemInkCode": "LC462XL-BK", "slotPosition": "Slot 1 (K - Black)", "oemStandardVolumeMl": 65, "oemStandardIsoYieldA4": 1500}, {"colorGroup": "Cyan", "oemInkCode": "LC462XL-C", "slotPosition": "Slot 2 (C - Cyan)", "oemStandardVolumeMl": 19, "oemStandardIsoYieldA4": 1500}, {"colorGroup": "Magenta", "oemInkCode": "LC462XL-M", "slotPosition": "Slot 3 (M - Magenta)", "oemStandardVolumeMl": 19, "oemStandardIsoYieldA4": 1500}, {"colorGroup": "Yellow", "oemInkCode": "LC462XL-Y", "slotPosition": "Slot 4 (Y - Yellow)", "oemStandardVolumeMl": 19, "oemStandardIsoYieldA4": 1500}], "printerCategory": "Inkjet", "totalColorSlots": 4, "expectedLifeA4Pages": 150000, "maintenanceRatePercent": 20, "warrantyExpirationYear": 2028}	2026-08-28 21:38:15.276526+00	2026-08-28 21:38:15.278334+00	t	10.0000	IN_STOCK	{}
INK-6618	INK-6618	EPSON-001- BK (Cyan)	INK	254.00	ml	ຂວດ	127.00	80000.00	629.92	50.00	{"id": "INB-6915", "sku": "INK-6618", "docs": {"paymentSlip": "", "productPhoto": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E"}, "name": "EPSON-001- BK (Cyan)", "unit": "ຂວດ", "specs": {"volume": 127, "inkCode": "INK-6618", "colorName": "EPSON-001- BK", "colorGroup": "Black", "inkBaseType": "Dye", "isCompatible": false, "payment_slip": "", "actual_images": [], "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}, "volume": 127, "inkCode": "INK-6618", "subUnit": "(1 ຂວດ)", "category": "INK", "itemName": "EPSON-001- BK (Cyan)", "poNumber": "INB-6915", "supplier": "", "colorName": "EPSON-001- BK", "colorGroup": "Black", "currentQty": 1, "initialQty": 1, "receiptUrl": "", "totalPrice": 80000, "inkBaseType": "Dye", "receiptDate": "2026-08-25", "categoryPill": "INK", "isCompatible": false, "payment_slip": "", "actual_images": [], "paymentMethod": "TRANSFER", "purchase_link": "", "supplier_phone": "", "targetPrinterId": ""}	2026-08-28 21:38:15.274602+00	2026-08-28 21:38:15.27647+00	t	10.0000	IN_STOCK	{}
INB-3125	INB-3125	Double A A4 - 80gsm (Sheet)	PAPER	10000.00	แผ่น	ແຜ່ນ	500.00	93000.00	186.00	50.00	{"id": "INB-3125", "sku": "PAP-8952", "docs": {"paymentSlip": "", "productPhoto": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E"}, "name": "Double A A4 - 80gsm (Sheet)", "unit": "ແຜ່ນ", "brand": "Double A", "specs": {"id": "INB-3125", "sku": "PAP-8952", "docs": {"paymentSlip": "", "productPhoto": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2364748b'%3EProduct Photo%3C/text%3E%3C/svg%3E"}, "name": "Double A A4 - 80gsm (Sheet)", "unit": "ແຜ່ນ", "brand": "Double A", "specs": {"brand": "Double A", "paperCode": "PAP-8952", "paperCore": null, "rollWidthM": null, "coatingTech": null, "grammageGsm": "80", "paperFormat": "Sheet", "rollLengthM": null, "paperSurface": "Plain Paper", "standardSize": "A4", "customWidthMm": null, "packagingType": "Ream", "sheetsPerPack": 500, "surfaceFinish": null, "customLengthMm": null, "printableSides": null, "compatibilities": ["dye", "pigment"], "rollWidthPreset": null, "sheets_per_pack": 500, "sheets_per_ream": 500}, "origin": "TH", "subUnit": "(5 ແຜ່ນ)", "category": "PAPER", "itemName": "Double A A4 - 80gsm (Sheet)", "poNumber": "INB-3125", "supplier": "Supplier", "paperCode": "PAP-8952", "paperCore": null, "currentQty": 5, "initialQty": 5, "receiptUrl": "", "rollWidthM": null, "totalPrice": 460000, "coatingTech": null, "grammageGsm": "80", "paperFormat": "Sheet", "receiptDate": "2026-08-23", "rollLengthM": null, "categoryPill": "PAPER", "paperSurface": "Plain Paper", "standardSize": "A4", "customWidthMm": null, "packagingType": "Ream", "paymentMethod": "TRANSFER", "purchase_link": "", "sheetsPerPack": 500, "surfaceFinish": null, "customLengthMm": null, "printableSides": null, "supplier_phone": "", "compatibilities": ["dye", "pigment"], "rollWidthPreset": null, "sheets_per_pack": 500, "sheets_per_ream": 500}, "origin": "TH", "subUnit": "(5 ແຜ່ນ)", "category": "PAPER", "itemName": "Double A A4 - 80gsm (Sheet)", "poNumber": "INB-3125", "supplier": "Supplier", "paperCode": "PAP-8952", "paperCore": null, "currentQty": 5, "initialQty": 5, "receiptUrl": "", "rollWidthM": null, "totalPrice": 465000, "coatingTech": null, "grammageGsm": "80", "paperFormat": "Sheet", "receiptDate": "2026-08-23", "rollLengthM": null, "categoryPill": "PAPER", "paperSurface": "Plain Paper", "standardSize": "A4", "customWidthMm": null, "packagingType": "Ream", "paymentMethod": "TRANSFER", "purchase_link": "", "sheetsPerPack": 500, "surfaceFinish": null, "customLengthMm": null, "printableSides": null, "supplier_phone": "", "compatibilities": ["dye", "pigment"], "rollWidthPreset": null, "sheets_per_pack": 500, "sheets_per_ream": 500}	2026-08-28 21:38:15.278427+00	2026-08-28 21:38:15.281098+00	t	10.0000	IN_STOCK	{}
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (id, order_id, job_name, quantity, unit_price_snapshot, cost_price_snapshot, specs, created_at, item_name, page_count, paper_size, cover_paper_id, inner_paper_id, cover_file_url, inner_file_url, binding_type, spine_width_mm, current_step, avg_cov_c, avg_cov_m, avg_cov_y, avg_cov_k, unit_cost_lak, unit_price_lak, total_price_lak, updated_at) FROM stdin;
item-order-001-1	order-001	HSK-1-Textbook	1	28751.15	28751.15	{"paper_setup": {"gsm": 70, "category_id": "paper", "cost_per_sheet": 500, "inventory_material_id": "paper-a4-plain-70g"}, "unfolded_width_mm": 210, "unfolded_height_mm": 297}	2026-08-29 15:47:05.9783+00	HSK-1-Textbook	1	A5						0.00	READY_FOR_PICKUP	0.0000	0.0000	0.0000	0.0000	28751.15	28751.15	28751.15	2026-08-29 21:41:26.677789+00
ITEM-VIP-DEMO-01	ORD-VIP-DEMO-01	ສະຕິກເກີ PP ຂາວເງົາກັນນ້ຳ 100% (Waterproof PP Sticker)	500	0.00	0.00	{"size": "4x4 cm", "coating": "Glossy UV", "cutting": "Kiss Cut 100%", "material": "PP Glossy White"}	2026-09-04 19:17:12.994858+00	ສະຕິກເກີ PP ຂາວເງົາກັນນ້ຳ 100%	1	A3+	\N	\N	\N	\N	NONE	0.00	PENDING	0.0000	0.0000	0.0000	0.0000	0.00	500.00	250000.00	2026-09-04 19:17:12.994858+00
ITEM-VIP-DEMO-02	ORD-VIP-DEMO-01	ນາມບັດພຣີມຽມ Art Card 350g (Double-sided)	2	0.00	0.00	{"paper": "Art Card 350gsm", "corner": "Round 4 corners", "coating": "Matte Lamination"}	2026-09-04 19:17:12.994858+00	ນາມບັດພຣີມຽມ Art Card 350g	1	9x5.4 cm	\N	\N	\N	\N	NONE	0.00	PENDING	0.0000	0.0000	0.0000	0.0000	0.00	50000.00	100000.00	2026-09-04 19:17:12.994858+00
\.


--
-- Data for Name: order_preflight_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_preflight_reports (id, order_id, file_name, total_pages, color_space, has_rgb, is_standard_cmyk, dpi_estimate, bleed_mm, has_sufficient_bleed, tac_max_percent, tac_warning, avg_cov_c, avg_cov_m, avg_cov_y, avg_cov_k, status, report_json, created_at, updated_at) FROM stdin;
1	ORD-TMP-251047	Final-Inthira-Group-300x157.jpg	1	RGB (Requires CMYK Conversion)	t	f	120	0.00	f	249.90	f	3.01	6.22	6.05	7.45	ERROR	{"has_rgb": true, "bleed_mm": 0, "file_url": "/api/v1/orders/files/orders/temp_order/item1_inner_Final-Inthira-Group-300x157.jpg", "avg_cov_c": 3.01, "avg_cov_k": 7.45, "avg_cov_m": 6.22, "avg_cov_y": 6.05, "file_name": "Final-Inthira-Group-300x157.jpg", "file_type": "IMAGE", "color_space": "RGB (Requires CMYK Conversion)", "diagnostics": {"dpi": "ERROR", "tac": "PASS", "bleed": "ERROR", "colorSpace": "ERROR"}, "image_width": 300, "tac_warning": false, "total_pages": 1, "dpi_estimate": 120, "image_height": 157, "is_simulated": false, "low_dpi_error": true, "suggested_paper": "Sticker / Small", "tac_avg_percent": 22.7, "tac_max_percent": 249.9, "execution_notice": "Image GCR Analyzed (300x157 px | TAC: 249.9%)", "is_standard_cmyk": false, "status_badge_lao": "⚠️ ພົບຈຸດທີ່ຕ້ອງກວດສອບ (RGB / Bleed / DPI)", "warning_message_lao": "ໄຟລ໌ເປັນ Color Space RGB (ຕ້ອງແປງເປັນ CMYK ກ່ອນສັ່ງພິມ) · ໄລຍະຕັດຕົກ (Bleed) 0mm ບໍ່ຮອດ 3mm (ສ່ຽງຂອບຂາວ) · ຄວາມລະອຽດ 120 DPI ຕ່ຳກວ່າ 300 DPI", "has_sufficient_bleed": false}	2026-08-26 20:30:51.066559+00	2026-08-26 20:30:51.066559+00
2	ORD-TMP-415744	438241734_122139752432121147_7668789427629325326_n.jpg	1	RGB (Requires CMYK Conversion)	t	f	200	0.00	f	207.90	f	12.58	3.90	3.87	6.28	ERROR	{"has_rgb": true, "bleed_mm": 0, "file_url": "/api/v1/orders/files/orders/temp_order/item1_inner_438241734_122139752432121147_7668789427629325326_n.jpg", "avg_cov_c": 12.58, "avg_cov_k": 6.28, "avg_cov_m": 3.9, "avg_cov_y": 3.87, "file_name": "438241734_122139752432121147_7668789427629325326_n.jpg", "file_type": "IMAGE", "color_space": "RGB (Requires CMYK Conversion)", "diagnostics": {"dpi": "ERROR", "tac": "PASS", "bleed": "ERROR", "colorSpace": "ERROR"}, "image_width": 1500, "tac_warning": false, "total_pages": 1, "dpi_estimate": 200, "image_height": 1500, "is_simulated": false, "low_dpi_error": true, "suggested_paper": "A5", "tac_avg_percent": 26.6, "tac_max_percent": 207.9, "execution_notice": "Image GCR Analyzed (1500x1500 px | TAC: 207.9%)", "is_standard_cmyk": false, "status_badge_lao": "⚠️ ພົບຈຸດທີ່ຕ້ອງກວດສອບ (RGB / Bleed / DPI)", "warning_message_lao": "ໄຟລ໌ເປັນ Color Space RGB (ຕ້ອງແປງເປັນ CMYK ກ່ອນສັ່ງພິມ) · ໄລຍະຕັດຕົກ (Bleed) 0mm ບໍ່ຮອດ 3mm (ສ່ຽງຂອບຂາວ) · ຄວາມລະອຽດ 200 DPI ຕ່ຳກວ່າ 300 DPI", "has_sufficient_bleed": false}	2026-08-26 20:33:35.751123+00	2026-08-26 20:33:35.751123+00
3	ORD-TMP-978845	616178294_1413147610823095_6546995608485066302_n.jpg	1	RGB (Requires CMYK Conversion)	t	f	120	0.00	f	210.90	f	83.43	46.66	20.88	7.05	ERROR	{"has_rgb": true, "bleed_mm": 0, "file_url": "/api/v1/orders/files/orders/temp_order/item1_inner_616178294_1413147610823095_6546995608485066302_n.jpg", "avg_cov_c": 83.43, "avg_cov_k": 7.05, "avg_cov_m": 46.66, "avg_cov_y": 20.88, "file_name": "616178294_1413147610823095_6546995608485066302_n.jpg", "file_type": "IMAGE", "color_space": "RGB (Requires CMYK Conversion)", "diagnostics": {"dpi": "ERROR", "tac": "PASS", "bleed": "ERROR", "colorSpace": "ERROR"}, "image_width": 1280, "tac_warning": false, "total_pages": 1, "dpi_estimate": 120, "image_height": 1280, "is_simulated": false, "low_dpi_error": true, "suggested_paper": "Sticker / Small", "tac_avg_percent": 158, "tac_max_percent": 210.9, "execution_notice": "Image GCR Analyzed (1280x1280 px | TAC: 210.9%)", "is_standard_cmyk": false, "status_badge_lao": "⚠️ ພົບຈຸດທີ່ຕ້ອງກວດສອບ (RGB / Bleed / DPI)", "warning_message_lao": "ໄຟລ໌ເປັນ Color Space RGB (ຕ້ອງແປງເປັນ CMYK ກ່ອນສັ່ງພິມ) · ໄລຍະຕັດຕົກ (Bleed) 0mm ບໍ່ຮອດ 3mm (ສ່ຽງຂອບຂາວ) · ຄວາມລະອຽດ 120 DPI ຕ່ຳກວ່າ 300 DPI", "has_sufficient_bleed": false}	2026-08-26 21:32:58.857848+00	2026-08-26 21:32:58.857848+00
4	ORD-TMP-290741	HSK-1-Textbook.pdf	150	RGB / CMYK Mixed	t	f	300	182.80	t	265.00	f	3.06	6.41	12.14	2.00	ERROR	{"has_rgb": true, "bleed_mm": 182.8, "file_url": "/api/v1/orders/files/orders/temp_order/item1_inner_HSK-1-Textbook.pdf", "avg_cov_c": 3.06, "avg_cov_k": 2, "avg_cov_m": 6.41, "avg_cov_y": 12.14, "file_name": "HSK-1-Textbook.pdf", "file_type": "PDF", "color_space": "RGB / CMYK Mixed", "diagnostics": {"dpi": "PASS", "tac": "PASS", "bleed": "PASS", "colorSpace": "ERROR"}, "tac_warning": false, "total_pages": 150, "dpi_estimate": 300, "is_simulated": false, "low_dpi_error": false, "suggested_paper": "A5 (80gsm)", "tac_avg_percent": 23.6, "tac_max_percent": 265, "execution_notice": "PDF.js Real Canvas Rendered (150 ໜ້າ | Bleed: 182.8mm | TAC: 265.0%)", "is_standard_cmyk": false, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "warning_message_lao": "ພົບ Object ໂໝດສີ RGB ໃນ PDF (ຕ້ອງແປງເປັນ CMYK)", "has_sufficient_bleed": true}	2026-08-27 19:34:50.743663+00	2026-08-27 19:34:50.743663+00
5	ORD-TMP-222347	Screenshot 2569-08-28 at 18.08.10.png	1	RGB (Requires CMYK Conversion)	t	f	350	0.00	f	298.50	f	17.00	10.25	6.17	2.17	ERROR	{"has_rgb": true, "bleed_mm": 0, "file_url": "/api/v1/orders/files/orders/temp_order/item1_inner_Screenshot 2569-08-28 at 18.08.10.png", "avg_cov_c": 17, "avg_cov_k": 2.17, "avg_cov_m": 10.25, "avg_cov_y": 6.17, "file_name": "Screenshot 2569-08-28 at 18.08.10.png", "file_type": "IMAGE", "color_space": "RGB (Requires CMYK Conversion)", "diagnostics": {"dpi": "PASS", "tac": "PASS", "bleed": "ERROR", "colorSpace": "ERROR"}, "image_width": 3806, "tac_warning": false, "total_pages": 1, "dpi_estimate": 350, "image_height": 2158, "is_simulated": false, "low_dpi_error": false, "suggested_paper": "A3", "tac_avg_percent": 35.6, "tac_max_percent": 298.5, "execution_notice": "Image GCR Analyzed (3806x2158 px | TAC: 298.5%)", "is_standard_cmyk": false, "status_badge_lao": "ພົບຈຸດທີ່ຕ້ອງກວດສອບ (RGB / Bleed / DPI)", "warning_message_lao": "ໄຟລ໌ເປັນ Color Space RGB (ຕ້ອງແປງເປັນ CMYK ກ່ອນສັ່ງພິມ) · ໄລຍະຕັດຕົກ (Bleed) 0mm ບໍ່ຮອດ 3mm (ສ່ຽງຂອບຂາວ)", "has_sufficient_bleed": false}	2026-08-28 15:50:22.356079+00	2026-08-28 15:50:22.356079+00
6	ORD-TMP-712505	Screenshot 2569-08-28 at 02.03.10.png	1	CMYK (Full Color)	f	t	300	0.00	f	237.40	f	26.31	25.54	25.59	81.31	ERROR	{"has_rgb": false, "bleed_mm": 0, "file_url": "/api/v1/orders/files/orders/temp_order/item1_inner_Screenshot 2569-08-28 at 02.03.10.png", "avg_cov_c": 26.31, "avg_cov_k": 81.31, "avg_cov_m": 25.54, "avg_cov_y": 25.59, "file_name": "Screenshot 2569-08-28 at 02.03.10.png", "file_type": "IMAGE", "color_mode": "CMYK", "color_space": "CMYK (Full Color)", "diagnostics": {"dpi": "PASS", "tac": "PASS", "bleed": "WARN", "colorSpace": "PASS"}, "image_width": 3834, "tac_warning": false, "total_pages": 1, "dpi_estimate": 300, "image_height": 2160, "is_simulated": false, "low_dpi_error": false, "suggested_paper": "A4", "tac_avg_percent": 158.7, "tac_max_percent": 237.4, "target_width_mm": 210, "execution_notice": "Canvas Client Analysis (3834x2160px | TAC: 237.4%)", "is_standard_cmyk": true, "mono_pages_avg_k": 0, "mono_pages_count": 0, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 297, "color_pages_avg_c": 26.31, "color_pages_avg_k": 81.31, "color_pages_avg_m": 25.54, "color_pages_avg_y": 25.59, "color_pages_count": 1, "target_paper_size": "A4", "warning_message_lao": "ໄລຍະຕັດຕົກ (Bleed) 0mm ບໍ່ຮອດ 3mm", "has_sufficient_bleed": false}	2026-08-28 15:58:32.513754+00	2026-08-28 15:58:32.513754+00
7	ORD-TMP-747518	HSK-1-Textbook.pdf	150	RGB / CMYK Mixed	t	f	300	31.30	t	283.20	f	3.68	4.48	5.27	1.54	ERROR	{"has_rgb": true, "bleed_mm": 31.3, "file_url": "/api/v1/orders/files/orders/temp_order/item1_inner_HSK-1-Textbook.pdf", "avg_cov_c": 3.68, "avg_cov_k": 1.54, "avg_cov_m": 4.48, "avg_cov_y": 5.27, "file_name": "HSK-1-Textbook.pdf", "file_type": "PDF", "color_mode": "CMYK", "color_space": "RGB / CMYK Mixed", "diagnostics": {"dpi": "PASS", "tac": "PASS", "bleed": "PASS", "colorSpace": "ERROR"}, "tac_warning": false, "total_pages": 150, "dpi_estimate": 300, "is_simulated": false, "low_dpi_error": false, "suggested_paper": "A4", "tac_avg_percent": 15, "tac_max_percent": 283.2, "target_width_mm": 210, "execution_notice": "PDF.js Full-Scan Complete (150 ໜ້າ | ສີ: 150 ໜ້າ, ຂາວດຳ: 0 ໜ້າ | Bleed: 31.3mm)", "is_standard_cmyk": false, "mono_pages_avg_k": 1.54, "mono_pages_count": 0, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 297, "color_pages_avg_c": 3.68, "color_pages_avg_k": 1.54, "color_pages_avg_m": 4.48, "color_pages_avg_y": 5.27, "color_pages_count": 150, "target_paper_size": "A4", "warning_message_lao": "ພົບ Object ໂໝດສີ RGB ໃນ PDF (ຕ້ອງແປງເປັນ CMYK)", "has_sufficient_bleed": true}	2026-08-28 15:59:07.524335+00	2026-08-28 15:59:07.524335+00
8	ORD-TMP-972087	HSK-1-Textbook.pdf	150	RGB / CMYK Mixed	t	f	300	31.30	t	283.20	f	3.68	4.48	5.27	1.54	ERROR	{"has_rgb": true, "bleed_mm": 31.3, "avg_cov_c": 3.68, "avg_cov_k": 1.54, "avg_cov_m": 4.48, "avg_cov_y": 5.27, "file_name": "HSK-1-Textbook.pdf", "file_type": "PDF", "color_mode": "CMYK", "color_space": "RGB / CMYK Mixed", "diagnostics": {"dpi": "PASS", "tac": "PASS", "bleed": "PASS", "colorSpace": "ERROR"}, "tac_warning": false, "total_pages": 150, "dpi_estimate": 300, "is_simulated": false, "low_dpi_error": false, "suggested_paper": "A4", "tac_avg_percent": 15, "tac_max_percent": 283.2, "target_width_mm": 210, "execution_notice": "PDF.js Full-Scan Complete (150 ໜ້າ | ສີ: 143 ໜ້າ, ຂາວດຳ: 7 ໜ້າ | Bleed: 31.3mm)", "is_standard_cmyk": false, "mono_pages_avg_k": 0.26, "mono_pages_count": 7, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 297, "color_pages_avg_c": 3.83, "color_pages_avg_k": 1.61, "color_pages_avg_m": 4.67, "color_pages_avg_y": 5.5, "color_pages_count": 143, "target_paper_size": "A4", "warning_message_lao": "ພົບ Object ໂໝດສີ RGB ໃນ PDF (ຕ້ອງແປງເປັນ CMYK)", "has_sufficient_bleed": true}	2026-08-28 16:02:52.094082+00	2026-08-28 16:02:52.094082+00
9	ORD-TMP-981006	HSK-1-Textbook.pdf	150	RGB / CMYK Mixed	t	f	300	31.30	t	283.20	f	3.68	4.48	5.27	1.54	ERROR	{"has_rgb": true, "bleed_mm": 31.3, "avg_cov_c": 3.68, "avg_cov_k": 1.54, "avg_cov_m": 4.48, "avg_cov_y": 5.27, "file_name": "HSK-1-Textbook.pdf", "file_type": "PDF", "color_mode": "CMYK", "color_space": "RGB / CMYK Mixed", "diagnostics": {"dpi": "PASS", "tac": "PASS", "bleed": "PASS", "colorSpace": "ERROR"}, "tac_warning": false, "total_pages": 150, "dpi_estimate": 300, "is_simulated": false, "low_dpi_error": false, "suggested_paper": "A5", "tac_avg_percent": 15, "tac_max_percent": 283.2, "target_width_mm": 148, "execution_notice": "PDF.js Full-Scan Complete (150 ໜ້າ | ສີ: 143 ໜ້າ, ຂາວດຳ: 7 ໜ້າ | Bleed: 31.3mm)", "is_standard_cmyk": false, "mono_pages_avg_k": 0.26, "mono_pages_count": 7, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 210, "color_pages_avg_c": 3.83, "color_pages_avg_k": 1.61, "color_pages_avg_m": 4.67, "color_pages_avg_y": 5.5, "color_pages_count": 143, "target_paper_size": "A5", "warning_message_lao": "ພົບ Object ໂໝດສີ RGB ໃນ PDF (ຕ້ອງແປງເປັນ CMYK)", "has_sufficient_bleed": true}	2026-08-28 16:03:01.019973+00	2026-08-28 16:03:01.019973+00
10	ORD-TMP-002577	HSK-1-Textbook.pdf	150	RGB / CMYK Mixed	t	f	300	31.30	t	283.20	f	3.68	4.48	5.27	1.54	ERROR	{"has_rgb": true, "bleed_mm": 31.3, "avg_cov_c": 3.68, "avg_cov_k": 1.54, "avg_cov_m": 4.48, "avg_cov_y": 5.27, "file_name": "HSK-1-Textbook.pdf", "file_type": "PDF", "color_mode": "CMYK", "color_space": "RGB / CMYK Mixed", "diagnostics": {"dpi": "PASS", "tac": "PASS", "bleed": "PASS", "colorSpace": "ERROR"}, "tac_warning": false, "total_pages": 150, "dpi_estimate": 300, "is_simulated": false, "low_dpi_error": false, "suggested_paper": "A4", "tac_avg_percent": 15, "tac_max_percent": 283.2, "target_width_mm": 210, "execution_notice": "PDF.js Full-Scan Complete (150 ໜ້າ | ສີ: 143 ໜ້າ, ຂາວດຳ: 7 ໜ້າ | Bleed: 31.3mm)", "is_standard_cmyk": false, "mono_pages_avg_k": 0.26, "mono_pages_count": 7, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 297, "color_pages_avg_c": 3.83, "color_pages_avg_k": 1.61, "color_pages_avg_m": 4.67, "color_pages_avg_y": 5.5, "color_pages_count": 143, "target_paper_size": "A4", "warning_message_lao": "ພົບ Object ໂໝດສີ RGB ໃນ PDF (ຕ້ອງແປງເປັນ CMYK)", "has_sufficient_bleed": true}	2026-08-28 16:03:22.587211+00	2026-08-28 16:03:22.587211+00
11	ORD-TMP-020417	HSK-1-Textbook.pdf	150	RGB / CMYK Mixed	t	f	300	31.30	t	283.20	f	3.68	4.48	5.27	1.54	ERROR	{"has_rgb": true, "bleed_mm": 31.3, "avg_cov_c": 3.68, "avg_cov_k": 1.54, "avg_cov_m": 4.48, "avg_cov_y": 5.27, "file_name": "HSK-1-Textbook.pdf", "file_type": "PDF", "color_mode": "CMYK", "color_space": "RGB / CMYK Mixed", "diagnostics": {"dpi": "PASS", "tac": "PASS", "bleed": "PASS", "colorSpace": "ERROR"}, "tac_warning": false, "total_pages": 150, "dpi_estimate": 300, "is_simulated": false, "low_dpi_error": false, "suggested_paper": "A5", "tac_avg_percent": 15, "tac_max_percent": 283.2, "target_width_mm": 148, "execution_notice": "PDF.js Full-Scan Complete (150 ໜ້າ | ສີ: 143 ໜ້າ, ຂາວດຳ: 7 ໜ້າ | Bleed: 31.3mm)", "is_standard_cmyk": false, "mono_pages_avg_k": 0.26, "mono_pages_count": 7, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 210, "color_pages_avg_c": 3.83, "color_pages_avg_k": 1.61, "color_pages_avg_m": 4.67, "color_pages_avg_y": 5.5, "color_pages_count": 143, "target_paper_size": "A5", "warning_message_lao": "ພົບ Object ໂໝດສີ RGB ໃນ PDF (ຕ້ອງແປງເປັນ CMYK)", "has_sufficient_bleed": true}	2026-08-28 16:03:40.432658+00	2026-08-28 16:03:40.432658+00
12	ORD-TMP-028816	HSK-1-Textbook.pdf	150	RGB / CMYK Mixed	t	f	300	31.30	t	283.20	f	3.68	4.48	5.27	1.54	ERROR	{"has_rgb": true, "bleed_mm": 31.3, "avg_cov_c": 3.68, "avg_cov_k": 1.54, "avg_cov_m": 4.48, "avg_cov_y": 5.27, "file_name": "HSK-1-Textbook.pdf", "file_type": "PDF", "color_mode": "CMYK", "color_space": "RGB / CMYK Mixed", "diagnostics": {"dpi": "PASS", "tac": "PASS", "bleed": "PASS", "colorSpace": "ERROR"}, "tac_warning": false, "total_pages": 150, "dpi_estimate": 300, "is_simulated": false, "low_dpi_error": false, "suggested_paper": "A4", "tac_avg_percent": 15, "tac_max_percent": 283.2, "target_width_mm": 210, "execution_notice": "PDF.js Full-Scan Complete (150 ໜ້າ | ສີ: 143 ໜ້າ, ຂາວດຳ: 7 ໜ້າ | Bleed: 31.3mm)", "is_standard_cmyk": false, "mono_pages_avg_k": 0.26, "mono_pages_count": 7, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 297, "color_pages_avg_c": 3.83, "color_pages_avg_k": 1.61, "color_pages_avg_m": 4.67, "color_pages_avg_y": 5.5, "color_pages_count": 143, "target_paper_size": "A4", "warning_message_lao": "ພົບ Object ໂໝດສີ RGB ໃນ PDF (ຕ້ອງແປງເປັນ CMYK)", "has_sufficient_bleed": true}	2026-08-28 16:03:48.821105+00	2026-08-28 16:03:48.821105+00
13	ORD-TMP-036537	HSK-1-Textbook.pdf	150	RGB / CMYK Mixed	t	f	300	31.30	t	283.20	f	3.68	4.48	5.27	1.54	ERROR	{"has_rgb": true, "bleed_mm": 31.3, "avg_cov_c": 3.68, "avg_cov_k": 1.54, "avg_cov_m": 4.48, "avg_cov_y": 5.27, "file_name": "HSK-1-Textbook.pdf", "file_type": "PDF", "color_mode": "CMYK", "color_space": "RGB / CMYK Mixed", "diagnostics": {"dpi": "PASS", "tac": "PASS", "bleed": "PASS", "colorSpace": "ERROR"}, "tac_warning": false, "total_pages": 150, "dpi_estimate": 300, "is_simulated": false, "low_dpi_error": false, "suggested_paper": "A5", "tac_avg_percent": 15, "tac_max_percent": 283.2, "target_width_mm": 148, "execution_notice": "PDF.js Full-Scan Complete (150 ໜ້າ | ສີ: 143 ໜ້າ, ຂາວດຳ: 7 ໜ້າ | Bleed: 31.3mm)", "is_standard_cmyk": false, "mono_pages_avg_k": 0.26, "mono_pages_count": 7, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 210, "color_pages_avg_c": 3.83, "color_pages_avg_k": 1.61, "color_pages_avg_m": 4.67, "color_pages_avg_y": 5.5, "color_pages_count": 143, "target_paper_size": "A5", "warning_message_lao": "ພົບ Object ໂໝດສີ RGB ໃນ PDF (ຕ້ອງແປງເປັນ CMYK)", "has_sufficient_bleed": true}	2026-08-28 16:03:56.551939+00	2026-08-28 16:03:56.551939+00
14	ORD-TMP-348651	HSK-1-Textbook.pdf	150	RGB / CMYK Mixed	t	f	300	31.30	t	283.20	f	3.68	4.48	5.27	1.54	ERROR	{"has_rgb": true, "bleed_mm": 31.3, "avg_cov_c": 3.68, "avg_cov_k": 1.54, "avg_cov_m": 4.48, "avg_cov_y": 5.27, "file_name": "HSK-1-Textbook.pdf", "file_type": "PDF", "color_mode": "CMYK", "color_space": "RGB / CMYK Mixed", "diagnostics": {"dpi": "PASS", "tac": "PASS", "bleed": "PASS", "colorSpace": "ERROR"}, "tac_warning": false, "total_pages": 150, "dpi_estimate": 300, "is_simulated": false, "low_dpi_error": false, "suggested_paper": "A4", "tac_avg_percent": 15, "tac_max_percent": 283.2, "target_width_mm": 210, "execution_notice": "PDF.js Full-Scan Complete (150 ໜ້າ | ສີ: 143 ໜ້າ, ຂາວດຳ: 7 ໜ້າ | Bleed: 31.3mm)", "is_standard_cmyk": false, "mono_pages_avg_k": 0.26, "mono_pages_count": 7, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 297, "color_pages_avg_c": 3.83, "color_pages_avg_k": 1.61, "color_pages_avg_m": 4.67, "color_pages_avg_y": 5.5, "color_pages_count": 143, "target_paper_size": "A4", "warning_message_lao": "ພົບ Object ໂໝດສີ RGB ໃນ PDF (ຕ້ອງແປງເປັນ CMYK)", "has_sufficient_bleed": true}	2026-08-28 16:09:08.671112+00	2026-08-28 16:09:08.671112+00
15	ORD-TMP-671037	HSK-1-Textbook.pdf	150	RGB / CMYK Mixed	t	f	300	31.30	t	283.20	f	3.68	4.48	5.27	1.54	ERROR	{"has_rgb": true, "bleed_mm": 31.3, "avg_cov_c": 3.68, "avg_cov_k": 1.54, "avg_cov_m": 4.48, "avg_cov_y": 5.27, "file_name": "HSK-1-Textbook.pdf", "file_type": "PDF", "color_mode": "CMYK", "color_space": "RGB / CMYK Mixed", "diagnostics": {"dpi": "PASS", "tac": "PASS", "bleed": "PASS", "colorSpace": "ERROR"}, "tac_warning": false, "total_pages": 150, "dpi_estimate": 300, "is_simulated": false, "low_dpi_error": false, "suggested_paper": "A4", "tac_avg_percent": 15, "tac_max_percent": 283.2, "target_width_mm": 210, "execution_notice": "PDF.js Full-Scan Complete (150 ໜ້າ | ສີ: 143 ໜ້າ, ຂາວດຳ: 7 ໜ້າ | Bleed: 31.3mm)", "is_standard_cmyk": false, "mono_pages_avg_k": 0.26, "mono_pages_count": 7, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 297, "color_pages_avg_c": 3.83, "color_pages_avg_k": 1.61, "color_pages_avg_m": 4.67, "color_pages_avg_y": 5.5, "color_pages_count": 143, "target_paper_size": "A4", "warning_message_lao": "ພົບ Object ໂໝດສີ RGB ໃນ PDF (ຕ້ອງແປງເປັນ CMYK)", "has_sufficient_bleed": true}	2026-08-28 16:14:31.064984+00	2026-08-28 16:14:31.064984+00
16	ORD-TMP-889760	Final-Inthira-Group-300x157.jpg	1	CMYK (Full Color)	f	t	29	3.00	t	249.90	f	3.01	6.22	6.05	7.45	ERROR	{"has_rgb": false, "bleed_mm": 3, "avg_cov_c": 3.01, "avg_cov_k": 7.45, "avg_cov_m": 6.22, "avg_cov_y": 6.05, "file_name": "Final-Inthira-Group-300x157.jpg", "file_type": "IMAGE", "color_mode": "CMYK", "color_space": "CMYK (Full Color)", "diagnostics": {"dpi": "WARN", "tac": "PASS", "bleed": "PASS", "colorSpace": "PASS"}, "image_width": 300, "tac_warning": false, "total_pages": 1, "dpi_estimate": 29, "image_height": 157, "is_simulated": false, "low_dpi_error": true, "suggested_paper": "A4", "tac_avg_percent": 22.7, "tac_max_percent": 249.9, "target_width_mm": 210, "execution_notice": "Canvas Client Analysis (300x157px | TAC: 249.9%)", "is_standard_cmyk": true, "mono_pages_avg_k": 0, "mono_pages_count": 0, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 297, "color_pages_avg_c": 3.01, "color_pages_avg_k": 7.45, "color_pages_avg_m": 6.22, "color_pages_avg_y": 6.05, "color_pages_count": 1, "target_paper_size": "A4", "warning_message_lao": "ຄວາມລະອຽດພາບ 29 DPI ຕ່ຳກວ່າ 300 DPI", "has_sufficient_bleed": true}	2026-08-28 16:18:09.826095+00	2026-08-28 16:18:09.826095+00
17	ORD-TMP-894418	Final-Inthira-Group-300x157.jpg	1	CMYK (Full Color)	f	t	29	3.00	t	249.90	f	3.01	6.22	6.05	7.45	ERROR	{"has_rgb": false, "bleed_mm": 3, "avg_cov_c": 3.01, "avg_cov_k": 7.45, "avg_cov_m": 6.22, "avg_cov_y": 6.05, "file_name": "Final-Inthira-Group-300x157.jpg", "file_type": "IMAGE", "color_mode": "CMYK", "color_space": "CMYK (Full Color)", "diagnostics": {"dpi": "WARN", "tac": "PASS", "bleed": "PASS", "colorSpace": "PASS"}, "image_width": 300, "tac_warning": false, "total_pages": 1, "dpi_estimate": 29, "image_height": 157, "is_simulated": false, "low_dpi_error": true, "suggested_paper": "A3", "tac_avg_percent": 22.7, "tac_max_percent": 249.9, "target_width_mm": 297, "execution_notice": "Canvas Client Analysis (300x157px | TAC: 249.9%)", "is_standard_cmyk": true, "mono_pages_avg_k": 0, "mono_pages_count": 0, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 420, "color_pages_avg_c": 3.01, "color_pages_avg_k": 7.45, "color_pages_avg_m": 6.22, "color_pages_avg_y": 6.05, "color_pages_count": 1, "target_paper_size": "A3", "warning_message_lao": "ຄວາມລະອຽດພາບ 29 DPI ຕ່ຳກວ່າ 300 DPI", "has_sufficient_bleed": true}	2026-08-28 16:18:14.42897+00	2026-08-28 16:18:14.42897+00
18	ORD-TMP-897179	Final-Inthira-Group-300x157.jpg	1	CMYK (Full Color)	f	t	29	3.00	t	249.90	f	3.01	6.22	6.05	7.45	ERROR	{"has_rgb": false, "bleed_mm": 3, "avg_cov_c": 3.01, "avg_cov_k": 7.45, "avg_cov_m": 6.22, "avg_cov_y": 6.05, "file_name": "Final-Inthira-Group-300x157.jpg", "file_type": "IMAGE", "color_mode": "CMYK", "color_space": "CMYK (Full Color)", "diagnostics": {"dpi": "WARN", "tac": "PASS", "bleed": "PASS", "colorSpace": "PASS"}, "image_width": 300, "tac_warning": false, "total_pages": 1, "dpi_estimate": 29, "image_height": 157, "is_simulated": false, "low_dpi_error": true, "suggested_paper": "A5", "tac_avg_percent": 22.7, "tac_max_percent": 249.9, "target_width_mm": 148, "execution_notice": "Canvas Client Analysis (300x157px | TAC: 249.9%)", "is_standard_cmyk": true, "mono_pages_avg_k": 0, "mono_pages_count": 0, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 210, "color_pages_avg_c": 3.01, "color_pages_avg_k": 7.45, "color_pages_avg_m": 6.22, "color_pages_avg_y": 6.05, "color_pages_count": 1, "target_paper_size": "A5", "warning_message_lao": "ຄວາມລະອຽດພາບ 29 DPI ຕ່ຳກວ່າ 300 DPI", "has_sufficient_bleed": true}	2026-08-28 16:18:17.18637+00	2026-08-28 16:18:17.18637+00
19	ORD-TMP-897936	Final-Inthira-Group-300x157.jpg	1	CMYK (Full Color)	f	t	29	3.00	t	249.90	f	3.01	6.22	6.05	7.45	ERROR	{"has_rgb": false, "bleed_mm": 3, "avg_cov_c": 3.01, "avg_cov_k": 7.45, "avg_cov_m": 6.22, "avg_cov_y": 6.05, "file_name": "Final-Inthira-Group-300x157.jpg", "file_type": "IMAGE", "color_mode": "CMYK", "color_space": "CMYK (Full Color)", "diagnostics": {"dpi": "WARN", "tac": "PASS", "bleed": "PASS", "colorSpace": "PASS"}, "image_width": 300, "tac_warning": false, "total_pages": 1, "dpi_estimate": 29, "image_height": 157, "is_simulated": false, "low_dpi_error": true, "suggested_paper": "A4", "tac_avg_percent": 22.7, "tac_max_percent": 249.9, "target_width_mm": 210, "execution_notice": "Canvas Client Analysis (300x157px | TAC: 249.9%)", "is_standard_cmyk": true, "mono_pages_avg_k": 0, "mono_pages_count": 0, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 297, "color_pages_avg_c": 3.01, "color_pages_avg_k": 7.45, "color_pages_avg_m": 6.22, "color_pages_avg_y": 6.05, "color_pages_count": 1, "target_paper_size": "A4", "warning_message_lao": "ຄວາມລະອຽດພາບ 29 DPI ຕ່ຳກວ່າ 300 DPI", "has_sufficient_bleed": true}	2026-08-28 16:18:17.94468+00	2026-08-28 16:18:17.94468+00
20	ORD-TMP-898716	Final-Inthira-Group-300x157.jpg	1	CMYK (Full Color)	f	t	29	3.00	t	249.90	f	3.01	6.22	6.05	7.45	ERROR	{"has_rgb": false, "bleed_mm": 3, "avg_cov_c": 3.01, "avg_cov_k": 7.45, "avg_cov_m": 6.22, "avg_cov_y": 6.05, "file_name": "Final-Inthira-Group-300x157.jpg", "file_type": "IMAGE", "color_mode": "CMYK", "color_space": "CMYK (Full Color)", "diagnostics": {"dpi": "WARN", "tac": "PASS", "bleed": "PASS", "colorSpace": "PASS"}, "image_width": 300, "tac_warning": false, "total_pages": 1, "dpi_estimate": 29, "image_height": 157, "is_simulated": false, "low_dpi_error": true, "suggested_paper": "A3", "tac_avg_percent": 22.7, "tac_max_percent": 249.9, "target_width_mm": 297, "execution_notice": "Canvas Client Analysis (300x157px | TAC: 249.9%)", "is_standard_cmyk": true, "mono_pages_avg_k": 0, "mono_pages_count": 0, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 420, "color_pages_avg_c": 3.01, "color_pages_avg_k": 7.45, "color_pages_avg_m": 6.22, "color_pages_avg_y": 6.05, "color_pages_count": 1, "target_paper_size": "A3", "warning_message_lao": "ຄວາມລະອຽດພາບ 29 DPI ຕ່ຳກວ່າ 300 DPI", "has_sufficient_bleed": true}	2026-08-28 16:18:18.722532+00	2026-08-28 16:18:18.722532+00
21	ORD-TMP-902338	Final-Inthira-Group-300x157.jpg	1	CMYK (Full Color)	f	t	29	3.00	t	249.90	f	3.01	6.22	6.05	7.45	ERROR	{"has_rgb": false, "bleed_mm": 3, "avg_cov_c": 3.01, "avg_cov_k": 7.45, "avg_cov_m": 6.22, "avg_cov_y": 6.05, "file_name": "Final-Inthira-Group-300x157.jpg", "file_type": "IMAGE", "color_mode": "CMYK", "color_space": "CMYK (Full Color)", "diagnostics": {"dpi": "WARN", "tac": "PASS", "bleed": "PASS", "colorSpace": "PASS"}, "image_width": 300, "tac_warning": false, "total_pages": 1, "dpi_estimate": 29, "image_height": 157, "is_simulated": false, "low_dpi_error": true, "suggested_paper": "A5", "tac_avg_percent": 22.7, "tac_max_percent": 249.9, "target_width_mm": 148, "execution_notice": "Canvas Client Analysis (300x157px | TAC: 249.9%)", "is_standard_cmyk": true, "mono_pages_avg_k": 0, "mono_pages_count": 0, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 210, "color_pages_avg_c": 3.01, "color_pages_avg_k": 7.45, "color_pages_avg_m": 6.22, "color_pages_avg_y": 6.05, "color_pages_count": 1, "target_paper_size": "A5", "warning_message_lao": "ຄວາມລະອຽດພາບ 29 DPI ຕ່ຳກວ່າ 300 DPI", "has_sufficient_bleed": true}	2026-08-28 16:18:22.344127+00	2026-08-28 16:18:22.344127+00
22	ORD-TMP-903179	Final-Inthira-Group-300x157.jpg	1	CMYK (Full Color)	f	t	29	3.00	t	249.90	f	3.01	6.22	6.05	7.45	ERROR	{"has_rgb": false, "bleed_mm": 3, "avg_cov_c": 3.01, "avg_cov_k": 7.45, "avg_cov_m": 6.22, "avg_cov_y": 6.05, "file_name": "Final-Inthira-Group-300x157.jpg", "file_type": "IMAGE", "color_mode": "CMYK", "color_space": "CMYK (Full Color)", "diagnostics": {"dpi": "WARN", "tac": "PASS", "bleed": "PASS", "colorSpace": "PASS"}, "image_width": 300, "tac_warning": false, "total_pages": 1, "dpi_estimate": 29, "image_height": 157, "is_simulated": false, "low_dpi_error": true, "suggested_paper": "A4", "tac_avg_percent": 22.7, "tac_max_percent": 249.9, "target_width_mm": 210, "execution_notice": "Canvas Client Analysis (300x157px | TAC: 249.9%)", "is_standard_cmyk": true, "mono_pages_avg_k": 0, "mono_pages_count": 0, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 297, "color_pages_avg_c": 3.01, "color_pages_avg_k": 7.45, "color_pages_avg_m": 6.22, "color_pages_avg_y": 6.05, "color_pages_count": 1, "target_paper_size": "A4", "warning_message_lao": "ຄວາມລະອຽດພາບ 29 DPI ຕ່ຳກວ່າ 300 DPI", "has_sufficient_bleed": true}	2026-08-28 16:18:23.18656+00	2026-08-28 16:18:23.18656+00
23	ORD-TMP-906620	Final-Inthira-Group-300x157.jpg	1	CMYK (Full Color)	f	t	29	3.00	t	249.90	f	3.01	6.22	6.05	7.45	ERROR	{"has_rgb": false, "bleed_mm": 3, "avg_cov_c": 3.01, "avg_cov_k": 7.45, "avg_cov_m": 6.22, "avg_cov_y": 6.05, "file_name": "Final-Inthira-Group-300x157.jpg", "file_type": "IMAGE", "color_mode": "CMYK", "color_space": "CMYK (Full Color)", "diagnostics": {"dpi": "WARN", "tac": "PASS", "bleed": "PASS", "colorSpace": "PASS"}, "image_width": 300, "tac_warning": false, "total_pages": 1, "dpi_estimate": 29, "image_height": 157, "is_simulated": false, "low_dpi_error": true, "suggested_paper": "A5", "tac_avg_percent": 22.7, "tac_max_percent": 249.9, "target_width_mm": 148, "execution_notice": "Canvas Client Analysis (300x157px | TAC: 249.9%)", "is_standard_cmyk": true, "mono_pages_avg_k": 0, "mono_pages_count": 0, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 210, "color_pages_avg_c": 3.01, "color_pages_avg_k": 7.45, "color_pages_avg_m": 6.22, "color_pages_avg_y": 6.05, "color_pages_count": 1, "target_paper_size": "A5", "warning_message_lao": "ຄວາມລະອຽດພາບ 29 DPI ຕ່ຳກວ່າ 300 DPI", "has_sufficient_bleed": true}	2026-08-28 16:18:26.632955+00	2026-08-28 16:18:26.632955+00
24	ORD-TMP-907115	Final-Inthira-Group-300x157.jpg	1	CMYK (Full Color)	f	t	29	3.00	t	249.90	f	3.01	6.22	6.05	7.45	ERROR	{"has_rgb": false, "bleed_mm": 3, "avg_cov_c": 3.01, "avg_cov_k": 7.45, "avg_cov_m": 6.22, "avg_cov_y": 6.05, "file_name": "Final-Inthira-Group-300x157.jpg", "file_type": "IMAGE", "color_mode": "CMYK", "color_space": "CMYK (Full Color)", "diagnostics": {"dpi": "WARN", "tac": "PASS", "bleed": "PASS", "colorSpace": "PASS"}, "image_width": 300, "tac_warning": false, "total_pages": 1, "dpi_estimate": 29, "image_height": 157, "is_simulated": false, "low_dpi_error": true, "suggested_paper": "A3", "tac_avg_percent": 22.7, "tac_max_percent": 249.9, "target_width_mm": 297, "execution_notice": "Canvas Client Analysis (300x157px | TAC: 249.9%)", "is_standard_cmyk": true, "mono_pages_avg_k": 0, "mono_pages_count": 0, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 420, "color_pages_avg_c": 3.01, "color_pages_avg_k": 7.45, "color_pages_avg_m": 6.22, "color_pages_avg_y": 6.05, "color_pages_count": 1, "target_paper_size": "A3", "warning_message_lao": "ຄວາມລະອຽດພາບ 29 DPI ຕ່ຳກວ່າ 300 DPI", "has_sufficient_bleed": true}	2026-08-28 16:18:27.122605+00	2026-08-28 16:18:27.122605+00
25	ORD-TMP-936095	HSK-1-Textbook.pdf	150	RGB / CMYK Mixed	t	f	300	31.30	t	283.20	f	3.68	4.48	5.27	1.54	ERROR	{"has_rgb": true, "bleed_mm": 31.3, "avg_cov_c": 3.68, "avg_cov_k": 1.54, "avg_cov_m": 4.48, "avg_cov_y": 5.27, "file_name": "HSK-1-Textbook.pdf", "file_type": "PDF", "color_mode": "CMYK", "color_space": "RGB / CMYK Mixed", "diagnostics": {"dpi": "PASS", "tac": "PASS", "bleed": "PASS", "colorSpace": "ERROR"}, "tac_warning": false, "total_pages": 150, "dpi_estimate": 300, "is_simulated": false, "low_dpi_error": false, "suggested_paper": "A3", "tac_avg_percent": 15, "tac_max_percent": 283.2, "target_width_mm": 297, "execution_notice": "PDF.js Full-Scan Complete (150 ໜ້າ | ສີ: 143 ໜ້າ, ຂາວດຳ: 7 ໜ້າ | Bleed: 31.3mm)", "is_standard_cmyk": false, "mono_pages_avg_k": 0.26, "mono_pages_count": 7, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 420, "color_pages_avg_c": 3.83, "color_pages_avg_k": 1.61, "color_pages_avg_m": 4.67, "color_pages_avg_y": 5.5, "color_pages_count": 143, "target_paper_size": "A3", "warning_message_lao": "ພົບ Object ໂໝດສີ RGB ໃນ PDF (ຕ້ອງແປງເປັນ CMYK)", "has_sufficient_bleed": true}	2026-08-28 16:18:56.118844+00	2026-08-28 16:18:56.118844+00
26	ORD-TMP-170312	HSK-1-Textbook.pdf	150	RGB / CMYK Mixed	t	f	300	31.30	t	283.20	f	3.68	4.48	5.27	1.54	ERROR	{"has_rgb": true, "bleed_mm": 31.3, "avg_cov_c": 3.68, "avg_cov_k": 1.54, "avg_cov_m": 4.48, "avg_cov_y": 5.27, "file_name": "HSK-1-Textbook.pdf", "file_type": "PDF", "color_mode": "CMYK", "color_space": "RGB / CMYK Mixed", "diagnostics": {"dpi": "PASS", "tac": "PASS", "bleed": "PASS", "colorSpace": "ERROR"}, "tac_warning": false, "total_pages": 150, "dpi_estimate": 300, "is_simulated": false, "low_dpi_error": false, "suggested_paper": "A4", "tac_avg_percent": 15, "tac_max_percent": 283.2, "target_width_mm": 210, "execution_notice": "PDF.js Full-Scan Complete (150 ໜ້າ | ສີ: 143 ໜ້າ, ຂາວດຳ: 7 ໜ້າ | Bleed: 31.3mm)", "is_standard_cmyk": false, "mono_pages_avg_k": 0.26, "mono_pages_count": 7, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 297, "color_pages_avg_c": 3.83, "color_pages_avg_k": 1.61, "color_pages_avg_m": 4.67, "color_pages_avg_y": 5.5, "color_pages_count": 143, "target_paper_size": "A4", "warning_message_lao": "ພົບ Object ໂໝດສີ RGB ໃນ PDF (ຕ້ອງແປງເປັນ CMYK)", "has_sufficient_bleed": true}	2026-08-28 16:22:50.333514+00	2026-08-28 16:22:50.333514+00
27	ORD-TMP-105128	ບົດລາຍງານ ອັບເກຮດ Linux Server ທ ສົມພະວັດ ດວງສະຫວັນ ຫ້ອງ 4IT2.pdf	15	RGB / CMYK Mixed	t	f	300	31.00	t	236.40	f	1.74	1.68	1.61	1.28	ERROR	{"has_rgb": true, "bleed_mm": 31, "avg_cov_c": 1.74, "avg_cov_k": 1.28, "avg_cov_m": 1.68, "avg_cov_y": 1.61, "file_name": "ບົດລາຍງານ ອັບເກຮດ Linux Server ທ ສົມພະວັດ ດວງສະຫວັນ ຫ້ອງ 4IT2.pdf", "file_type": "PDF", "color_mode": "CMYK", "color_space": "RGB / CMYK Mixed", "diagnostics": {"dpi": "PASS", "tac": "PASS", "bleed": "PASS", "colorSpace": "ERROR"}, "tac_warning": false, "total_pages": 15, "dpi_estimate": 300, "is_simulated": false, "low_dpi_error": false, "suggested_paper": "A4", "tac_avg_percent": 6.3, "tac_max_percent": 236.4, "target_width_mm": 210, "execution_notice": "PDF.js Full-Scan Complete (15 ໜ້າ | ສີ: 13 ໜ້າ, ຂາວດຳ: 2 ໜ້າ | Bleed: 31mm)", "is_standard_cmyk": false, "mono_pages_avg_k": 0.58, "mono_pages_count": 2, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 297, "color_pages_avg_c": 1.93, "color_pages_avg_k": 1.39, "color_pages_avg_m": 1.86, "color_pages_avg_y": 1.77, "color_pages_count": 13, "target_paper_size": "A4", "warning_message_lao": "ພົບ Object ໂໝດສີ RGB ໃນ PDF (ຕ້ອງແປງເປັນ CMYK)", "has_sufficient_bleed": true}	2026-08-28 16:38:25.134792+00	2026-08-28 16:38:25.134792+00
28	ORD-TMP-025676	HSK-1-Textbook.pdf	150	RGB / CMYK Mixed	t	f	300	31.30	t	283.20	f	3.68	4.48	5.27	1.54	ERROR	{"has_rgb": true, "bleed_mm": 31.3, "avg_cov_c": 3.68, "avg_cov_k": 1.54, "avg_cov_m": 4.48, "avg_cov_y": 5.27, "file_name": "HSK-1-Textbook.pdf", "file_type": "PDF", "color_mode": "CMYK", "color_space": "RGB / CMYK Mixed", "diagnostics": {"dpi": "PASS", "tac": "PASS", "bleed": "PASS", "colorSpace": "ERROR"}, "tac_warning": false, "total_pages": 150, "dpi_estimate": 300, "is_simulated": false, "low_dpi_error": false, "suggested_paper": "A4", "tac_avg_percent": 15, "tac_max_percent": 283.2, "target_width_mm": 210, "execution_notice": "PDF.js Full-Scan Complete (150 ໜ້າ | ສີ: 143 ໜ້າ, ຂາວດຳ: 7 ໜ້າ | Bleed: 31.3mm)", "is_standard_cmyk": false, "mono_pages_avg_k": 0.26, "mono_pages_count": 7, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 297, "color_pages_avg_c": 3.83, "color_pages_avg_k": 1.61, "color_pages_avg_m": 4.67, "color_pages_avg_y": 5.5, "color_pages_count": 143, "target_paper_size": "A4", "warning_message_lao": "ພົບ Object ໂໝດສີ RGB ໃນ PDF (ຕ້ອງແປງເປັນ CMYK)", "has_sufficient_bleed": true}	2026-08-28 16:53:45.702481+00	2026-08-28 16:53:45.702481+00
29	ORD-TMP-759207	HSK-1-Textbook.pdf	150	RGB / CMYK Mixed	t	f	300	31.30	t	283.20	f	3.68	4.48	5.27	1.54	ERROR	{"has_rgb": true, "bleed_mm": 31.3, "avg_cov_c": 3.68, "avg_cov_k": 1.54, "avg_cov_m": 4.48, "avg_cov_y": 5.27, "file_name": "HSK-1-Textbook.pdf", "file_type": "PDF", "color_mode": "CMYK", "color_space": "RGB / CMYK Mixed", "diagnostics": {"dpi": "PASS", "tac": "PASS", "bleed": "PASS", "colorSpace": "ERROR"}, "tac_warning": false, "total_pages": 150, "dpi_estimate": 300, "is_simulated": false, "low_dpi_error": false, "suggested_paper": "A4", "tac_avg_percent": 15, "tac_max_percent": 283.2, "target_width_mm": 210, "execution_notice": "PDF.js Full-Scan Complete (150 ໜ້າ | ສີ: 143 ໜ້າ, ຂາວດຳ: 7 ໜ້າ | Bleed: 31.3mm)", "is_standard_cmyk": false, "mono_pages_avg_k": 0.26, "mono_pages_count": 7, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 297, "color_pages_avg_c": 3.83, "color_pages_avg_k": 1.61, "color_pages_avg_m": 4.67, "color_pages_avg_y": 5.5, "color_pages_count": 143, "target_paper_size": "A4", "warning_message_lao": "ພົບ Object ໂໝດສີ RGB ໃນ PDF (ຕ້ອງແປງເປັນ CMYK)", "has_sufficient_bleed": true}	2026-08-28 17:05:59.234469+00	2026-08-28 17:05:59.234469+00
30	ORD-TMP-411894	HSK-1-Textbook.pdf	150	RGB / CMYK Mixed	t	f	300	31.30	t	283.20	f	3.68	4.48	5.27	1.54	ERROR	{"has_rgb": true, "bleed_mm": 31.3, "file_url": "data:image/jpeg;base64,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/qC78mdBpqa+aXNxoblNU1NUKhznBhbHhgdsNLdrZaX7huxgHK7ly0hLPpql0jbtQaVtrrXb+pJpW1pLhM10j3yc2WbLDJGXF2CCDO8nb5phNqRaC0dFnmtP0bAWPYQ0EDDxh3T0jO/wleptC6Rmc50lhpHOc7acSDlxwG79+/cAEBWOr9F0+qNR099ob1pm21EEdPR01RDUskmt5ilhfI6I82NpzHxtjaCRls7sloww3dDIyaFksUjJGPaHNew5a4HgQe4o7DoLSERJjsVMMtc3BLiAHDBABO4FSKnijp4I4IWhkcbQxjR0ADACA9oiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAIiIAiIgCIiAgfXHg70yemHuTrjwd6ZPTD3Ku0XHOduK+8+WHwOg8hUPsd78SxOuPB3pk9MPcnXHg70yemHuVdonO3FfefLD4DkKh9jvfiWJ1x4O9Mnph7k648HemT0w9yrtE524r7z5YfAchUPsd78SxOuPB3pk9MPcnXHg70yemHuVdonO3FfefLD4DkKh9jvfiWJ1x4O9Mnph7k648HemT0w9yrtE524r7z5YfAchUPsd78SxOuPB3pk9MPcnXHg70yemHuVdonO3FfefLD4DkKh9jvfiWJ1x4O9Mnph7k648HemT0w9yrtE524r7z5YfAchUPsd78SxOuPB3pk9MPcnXHg70yemHuVdonO3FfefLD4DkKh9jvfiWJ1x4O9Mnph7k648HemT0w9yrtE524r7z5YfAchUPsd78SxOuPB3pk9MPcnXHg70yemHuVdonO3FfefLD4DkKh9jvfiWJ1x4O9Mnph7k648HemT0w9yrtE524r7z5YfAchUPsd78SxOuPB3pk9MPcnXHg70yemHuVdonO3FfefLD4DkKh9jvfiWJ1x4O9Mnph7k648HemT0w9yrtE524r7z5YfAchUPsd78SxOuPB3pk9MPcnXHg70yemHuVdonO3FfefLD4DkKh9jvfiWJ1x4O9Mnph7k648HemT0w9yrtE524r7z5YfAchUPsd78SxOuPB3pk9MPcnXHg70yemHuVdonO3FfefLD4DkKh9jvfiWJ1x4O9Mnph7k648HemT0w9yrtE524r7z5YfAchUPsd78SxOuPB3pk9MPcnXHg70yemHuVdonO3FfefLD4DkKh9jvfiWJ1x4O9Mnph7k648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", "avg_cov_c": 3.68, "avg_cov_k": 1.54, "avg_cov_m": 4.48, "avg_cov_y": 5.27, "file_name": "HSK-1-Textbook.pdf", "file_type": "PDF", "color_mode": "CMYK", "color_space": "RGB / CMYK Mixed", "diagnostics": {"dpi": "PASS", "tac": "PASS", "bleed": "PASS", "colorSpace": "ERROR"}, "tac_warning": false, "total_pages": 150, "dpi_estimate": 300, "is_simulated": false, "low_dpi_error": false, "suggested_paper": "A4", "tac_avg_percent": 15, "tac_max_percent": 283.2, "target_width_mm": 210, "execution_notice": "PDF.js Full-Scan Complete (150 ໜ້າ | ສີ: 143 ໜ້າ, ຂາວດຳ: 7 ໜ້າ | Bleed: 31.3mm)", "is_standard_cmyk": false, "mono_pages_avg_k": 0.26, "mono_pages_count": 7, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 297, "color_pages_avg_c": 3.83, "color_pages_avg_k": 1.61, "color_pages_avg_m": 4.67, "color_pages_avg_y": 5.5, "color_pages_count": 143, "target_paper_size": "A4", "warning_message_lao": "ພົບ Object ໂໝດສີ RGB ໃນ PDF (ຕ້ອງແປງເປັນ CMYK)", "has_sufficient_bleed": true}	2026-08-28 22:33:31.928277+00	2026-08-28 22:33:31.928277+00
31	ORD-TMP-450418	ບົດລາຍງານ ອັບເກຮດ Linux Server ທ ສົມພະວັດ ດວງສະຫວັນ ຫ້ອງ 4IT2.pdf	15	RGB / CMYK Mixed	t	f	300	31.00	t	236.40	f	1.74	1.68	1.61	1.28	ERROR	{"has_rgb": true, "bleed_mm": 31, "file_url": "data:image/jpeg;base64,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", "avg_cov_c": 1.74, "avg_cov_k": 1.28, "avg_cov_m": 1.68, "avg_cov_y": 1.61, "file_name": "ບົດລາຍງານ ອັບເກຮດ Linux Server ທ ສົມພະວັດ ດວງສະຫວັນ ຫ້ອງ 4IT2.pdf", "file_type": "PDF", "color_mode": "CMYK", "color_space": "RGB / CMYK Mixed", "diagnostics": {"dpi": "PASS", "tac": "PASS", "bleed": "PASS", "colorSpace": "ERROR"}, "tac_warning": false, "total_pages": 15, "dpi_estimate": 300, "is_simulated": false, "low_dpi_error": false, "suggested_paper": "A4", "tac_avg_percent": 6.3, "tac_max_percent": 236.4, "target_width_mm": 210, "execution_notice": "PDF.js Full-Scan Complete (15 ໜ້າ | ສີ: 13 ໜ້າ, ຂາວດຳ: 2 ໜ້າ | Bleed: 31mm)", "is_standard_cmyk": false, "mono_pages_avg_k": 0.58, "mono_pages_count": 2, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 297, "color_pages_avg_c": 1.93, "color_pages_avg_k": 1.39, "color_pages_avg_m": 1.86, "color_pages_avg_y": 1.77, "color_pages_count": 13, "target_paper_size": "A4", "warning_message_lao": "ພົບ Object ໂໝດສີ RGB ໃນ PDF (ຕ້ອງແປງເປັນ CMYK)", "has_sufficient_bleed": true}	2026-08-28 22:34:10.452008+00	2026-08-28 22:34:10.452008+00
32	ORD-TMP-518139	ບົດລາຍງານ ອັບເກຮດ Linux Server ທ ສົມພະວັດ ດວງສະຫວັນ ຫ້ອງ 4IT2.pdf	15	RGB / CMYK Mixed	t	f	300	31.00	t	231.70	f	0.18	0.13	0.07	2.51	ERROR	{"has_rgb": true, "bleed_mm": 31, "file_url": "data:image/jpeg;base64,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", "avg_cov_c": 0.18, "avg_cov_k": 2.51, "avg_cov_m": 0.13, "avg_cov_y": 0.07, "file_name": "ບົດລາຍງານ ອັບເກຮດ Linux Server ທ ສົມພະວັດ ດວງສະຫວັນ ຫ້ອງ 4IT2.pdf", "file_type": "PDF", "color_mode": "CMYK", "color_space": "RGB / CMYK Mixed", "diagnostics": {"dpi": "PASS", "tac": "PASS", "bleed": "PASS", "colorSpace": "ERROR"}, "tac_warning": false, "total_pages": 15, "dpi_estimate": 300, "is_simulated": false, "low_dpi_error": false, "suggested_paper": "A4", "tac_avg_percent": 2.9, "tac_max_percent": 231.7, "target_width_mm": 210, "execution_notice": "PDF.js Full-Scan Complete (15 ໜ້າ | ສີ: 1 ໜ້າ, ຂາວດຳ: 14 ໜ້າ | Bleed: 31mm)", "is_standard_cmyk": false, "mono_pages_avg_k": 2.47, "mono_pages_count": 14, "status_badge_lao": "ພົບຈຸດແຈ້ງເຕືອນ (ກວດສອບລາຍລະອຽດ)", "target_height_mm": 297, "color_pages_avg_c": 2.74, "color_pages_avg_k": 3.07, "color_pages_avg_m": 1.95, "color_pages_avg_y": 1.01, "color_pages_count": 1, "target_paper_size": "A4", "warning_message_lao": "ພົບ Object ໂໝດສີ RGB ໃນ PDF (ຕ້ອງແປງເປັນ CMYK)", "has_sufficient_bleed": true}	2026-08-28 22:35:18.153333+00	2026-08-28 22:35:18.153333+00
33	ORD-TMP-524538	Quotation_Customer_QT-019294.pdf	1	CMYK Full Color	f	t	300	31.00	t	236.20	f	1.17	1.04	0.67	1.19	PASSED	{"has_rgb": false, "bleed_mm": 31, "file_url": "data:image/jpeg;base64,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7nVfzemx3J1psdAi5jDc11NdidHRjLGNUjaiaWN81TEwMjEbSS4lrnb3WAva4NwvPh2djV4jhmHyYJXUtTVaDMJ7N4LW2QtAF7ucTE/ZYWaxzjbYC602OvREWVEREBFQ1eZWQYvPhrMIxSokglijfJFBdlnsLtVyRdotY25yAqtueKhkVJwuUcyPkqWSPAjo2gM0OIAdd9mk22XO7bzq9amx2SLjqbPElU+Hg8q5jgY6LhpHT0OnQNLnaLar69gFhcXI+qLHc64nS8K3DMs1NW9mGmt0Sl7H30FzYtLWOIc4+a2+wlrxs0i9607R2yLl4c21MkEjxlbHdUbWWBhYA8uA3DVfYXAG46SL2Nt5M0zR4w2iOAYo+J1NHKJmQOID3WLmE2DdgLdziSbiwttnWmx0qLl484amQudlzHI+Hnhhja+Fgc50jC/dquA0CzjzHpsV5avO1VDh3Gf8L4rG4ROlcZ2hsbA1oLtTgSW79l2i9ieZXrTY7JERZUVLU8ok7Z8VdKlqeUSds+K3wSram5PH2B4KRR03J4+wPBSLFUREQavijfIyR0bHPZfQ4i5bfYbHmWyIgLAa0EuDQC7eQN6yiAsBrQ8vDRqIALrbSBew+896yiAiIgIiIC1fHG8tL2NcWm7SRex6QtkQYIBcHEC43FZREBERAWrWMa9z2saHPtqIG11ulbIgIiICIiDUMYJDIGNDyA0uttIF7C/1nvWyIgIiICIiDBAJBIBINx7FlEQEREBUtTyiTtnxV0qWp5RJ2z4rfBKtqbk8fYHgpFHTcnj7A8FIsVRERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQFS1PKJO2fFXSpanlEnbPit8Eq2puTx9geCkUdNyePsDwUixVEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAVLU8ok7Z8VdKlqeUSds+K3wSram5PH2B4KRR03J4+wPBSLFUREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBUtTyiTtnxV0qWp5RJ2z4rfBKtqbk8fYHgpFHTcnj7A8FIsVRERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQFS1PKJO2fFXSpanlEnbPit8Eq2puTx9geCkUdNyePsDwUixVEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAVLU8ok7Z8VdKlqeUSds+K3wSram5PH2B4KRR03J4+wPBSLFUREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBUtTyiTtnxV0qWp5RJ2z4rfBKtqbk8fYHgpFHTcnj7A8FIsVRERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQFS1PKJO2fFXSpanlEnbPit8Er1RV2iJjeCvZoHpLfj/zX4v2RFcibTj/zX4v2Tj/zX4v2RE6w2nH/AJr8X7Jx/wCa/F+yInWG04/81+L9k4/81+L9kROsNpx/5r8X7Jx/5r8X7IidYbTj/wA1+L9k4/8ANfi/ZETrDacf+a/F+ycf+a/F+yInWG04/wDNfi/ZOP8AzX4v2RE6w2nH/mvxfsnH/mvxfsiJ1htOP/Nfi/ZOP/Nfi/ZETrDacf8AmvxfsnH/AJr8X7IidYbTj/zX4v2Tj/zX4v2RE6w2nH/mvxfsnH/mvxfsiJ1htOP/ADX4v2Tj/wA1+L9kROsNpx/5r8X7Jx/5r8X7IidYbTj/AM1+L9k4/wDNfi/ZETrDacf+a/F+ycf+a/F+yInWG04/81+L9k4/81+L9kROsNpx/wCa/F+yr5X65Xuta7iURJMTX//Z", "avg_cov_c": 1.17, "avg_cov_k": 1.19, "avg_cov_m": 1.04, "avg_cov_y": 0.67, "file_name": "Quotation_Customer_QT-019294.pdf", "file_type": "PDF", "color_mode": "CMYK", "color_space": "CMYK Full Color", "diagnostics": {"dpi": "PASS", "tac": "PASS", "bleed": "PASS", "colorSpace": "PASS"}, "tac_warning": false, "total_pages": 1, "dpi_estimate": 300, "is_simulated": false, "low_dpi_error": false, "suggested_paper": "A4", "tac_avg_percent": 4.1, "tac_max_percent": 236.2, "target_width_mm": 210, "execution_notice": "PDF.js Full-Scan Complete (1 ໜ້າ | ສີ: 1 ໜ້າ, ຂາວດຳ: 0 ໜ້າ | Bleed: 31mm)", "is_standard_cmyk": true, "mono_pages_avg_k": 1.19, "mono_pages_count": 0, "status_badge_lao": "ໄຟລ໌ CMYK ມາດຕະຖານພ້ອມພິມ", "target_height_mm": 297, "color_pages_avg_c": 1.17, "color_pages_avg_k": 1.19, "color_pages_avg_m": 1.04, "color_pages_avg_y": 0.67, "color_pages_count": 1, "target_paper_size": "A4", "warning_message_lao": "", "has_sufficient_bleed": true}	2026-08-29 21:38:44.55999+00	2026-08-29 21:38:44.55999+00
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (id, order_number, customer_name, customer_phone, status, deposit_amount, total_price, total_cost, google_drive_link, created_at, updated_at, order_no, customer_id, total_amount_lak, deposit_lak, remaining_lak, overall_status, delivery_date, deposit_percentage, tax_mode, tax_rate, internal_tracking_code, courier_name, pod_image_url, slip_verified_at, slip_trans_ref, proof_url, proof_approved_at, proof_rejected_at, proof_signature_ip, proof_rejection_reason, stock_deducted_at, branch_code, idempotency_key, tracking_code, courier_id, customer_email, customer_address, digital_proof_url, proof_version, proof_status, proof_feedback, proof_action_at, prepress_notes, payment_slip_url) FROM stdin;
order-001	ORD-202608-001	Joun	+8562058866339	REQUIRES_MANAGER_APPROVAL	0.00	28751.15	28751.15		2026-08-29 15:47:05.974576+00	2026-08-29 15:47:05.974576+00	ORD-202608-001		28751.15	0.00	28751.15	REQUIRES_MANAGER_APPROVAL		30.0000	EXCLUDED	0.0700	\N	Som-Sing Express	\N	\N	\N		\N	\N			\N	\N	\N	\N	\N	\N	\N	\N	1	NOT_SUBMITTED	\N	\N	\N	\N
ORD-VIP-DEMO-01	SSP-2026-8801	Som Sing Phim VIP Atelier	020 55889988	COMPLETED	350000.00	350000.00	0.00	\N	2026-09-01 19:17:12.993493+00	2026-09-03 19:17:12.993493+00	SSP-2026-8801	CUST-VIP-001	350000.00	350000.00	0.00	COMPLETED	\N	30.0000	EXCLUDED	0.0700	\N	Anousith Express	\N	\N	\N	\N	\N	\N	\N	\N	\N	AN-VTE-02	\N	TRK-SSP-8801	\N	customer@gmail.com	ຮ່ອມ 5, ບ້ານໂພນພະເນົາ, ໄຊເສດຖາ, ນະຄອນຫຼວງວຽງຈັນ (AN-VTE-02)	\N	1	NOT_SUBMITTED	\N	\N	\N	\N
\.


--
-- Data for Name: paper_price_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.paper_price_versions (id, supplier_name, effective_date, version_code, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: paper_specs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.paper_specs (id, paper_code, paper_name, paper_type, gsm, sheet_width_mm, sheet_height_mm, sheets_per_ream, cost_per_ream, cost_per_sheet, price_version_id, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payment_methods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_methods (id, bank_name, account_name, account_number, branch, qr_code_url, logo_url, promptpay_name, is_active, is_default, created_at, updated_at) FROM stdin;
bcel_one	BCEL (ທະນາຄານການຄ້າຕ່າງປະເທດລາວ ມະຫາຊົນ)	Som-Sing Phim Printing Shop	160-12-00-01234567-001	Vientiane Head Office	/assets/images/bcel-qr-placeholder.png		Som-Sing Phim	t	t	2026-09-04 19:10:49.636856+00	2026-09-04 19:10:49.636856+00
ldb_trust	LDB (ທະນາຄານ ພັດທະນາລາວ)	Som-Sing Phim Printing Shop	010-00-11-98765432-001	Lane Xang Branch	/assets/images/bcel-qr-placeholder.png		Som-Sing Phim	t	f	2026-09-04 19:10:49.637878+00	2026-09-04 19:10:49.637878+00
\.


--
-- Data for Name: printer_color_link; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.printer_color_link (link_id, asset_id, ink_code, slot_position, iso_page_yield_a4, oem_standard_volume_ml, oem_standard_iso_yield_a4, base_consumption_rate_ml, created_at) FROM stdin;
\.


--
-- Data for Name: product_discount_tiers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_discount_tiers (id, product_id, min_quantity, discount_percentage, created_at) FROM stdin;
91	1	500	5.00	2026-09-02 17:51:17.140367+00
92	1	1000	10.00	2026-09-02 17:51:17.140367+00
93	1	5000	20.00	2026-09-02 17:51:17.140367+00
94	1	500	5.00	2026-09-04 17:15:27.355256+00
95	1	1000	10.00	2026-09-04 17:15:27.355256+00
96	1	5000	20.00	2026-09-04 17:15:27.355256+00
97	1	500	5.00	2026-09-04 19:10:10.42956+00
98	1	1000	10.00	2026-09-04 19:10:10.42956+00
99	1	5000	20.00	2026-09-04 19:10:10.42956+00
52	1	500	5.00	2026-08-26 21:07:25.455394+00
53	1	500	5.00	2026-08-26 21:07:25.455394+00
54	1	1000	10.00	2026-08-26 21:07:25.455394+00
55	1	1000	10.00	2026-08-26 21:07:25.455394+00
56	1	5000	20.00	2026-08-26 21:07:25.455394+00
57	1	5000	20.00	2026-08-26 21:07:25.455394+00
61	1	500	5.00	2026-08-27 19:32:32.181758+00
62	1	1000	10.00	2026-08-27 19:32:32.181758+00
63	1	5000	20.00	2026-08-27 19:32:32.181758+00
64	1	500	5.00	2026-08-28 15:15:26.222601+00
65	1	1000	10.00	2026-08-28 15:15:26.222601+00
66	1	5000	20.00	2026-08-28 15:15:26.222601+00
67	1	500	5.00	2026-08-28 16:52:40.362151+00
68	1	1000	10.00	2026-08-28 16:52:40.362151+00
69	1	5000	20.00	2026-08-28 16:52:40.362151+00
70	1	500	5.00	2026-08-28 17:42:57.691731+00
71	1	1000	10.00	2026-08-28 17:42:57.691731+00
72	1	5000	20.00	2026-08-28 17:42:57.691731+00
73	1	500	5.00	2026-08-28 20:26:49.230686+00
74	1	1000	10.00	2026-08-28 20:26:49.230686+00
75	1	5000	20.00	2026-08-28 20:26:49.230686+00
76	1	500	5.00	2026-08-29 14:32:24.7567+00
77	1	1000	10.00	2026-08-29 14:32:24.7567+00
78	1	5000	20.00	2026-08-29 14:32:24.7567+00
79	1	500	5.00	2026-08-29 16:19:20.307563+00
80	1	1000	10.00	2026-08-29 16:19:20.307563+00
81	1	5000	20.00	2026-08-29 16:19:20.307563+00
82	1	500	5.00	2026-08-29 21:23:27.591919+00
83	1	1000	10.00	2026-08-29 21:23:27.591919+00
84	1	5000	20.00	2026-08-29 21:23:27.591919+00
85	1	500	5.00	2026-08-30 08:57:20.1525+00
86	1	1000	10.00	2026-08-30 08:57:20.1525+00
87	1	5000	20.00	2026-08-30 08:57:20.1525+00
88	9	100	5.00	2026-08-30 09:20:57.100533+00
89	9	500	10.00	2026-08-30 09:20:57.100533+00
90	9	1000	15.00	2026-08-30 09:20:57.100533+00
\.


--
-- Data for Name: public_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.public_categories (id, slug, name_lo, name_en, tagline_lo, tagline_en, description_lo, description_en, icon, sort_order, is_active, created_at, updated_at) FROM stdin;
1	documents	ງານເອກະສານ & ປຶ້ມ	Documents & Books	ກັອບປີ້ເອກະສານທົ່ວໄປ, ເຂົ້າເລັ້ມສັນກາວ, ສັນຫ່ວງ, ປຶ້ມ & ລາຍງານ	Document copying, glue binding, wire-o, books & corporate reports	ບໍລິການກັອບປີ້ເອກະສານຂາວດຳ-ສີ, ເຂົ້າເລັ້ມປຶ້ມສັນກາວຮ້ອນ, ສັນຫ່ວງກະດູກງູ, ເຢັບມຸມ, ລາຍງານປະຈຳປີ ແລະ ເອກະສານສຳມະນາຄຸນນະພາບສູງ.	High-speed document printing and copying, perfect glue binding, wire-o booklets, catalogs, and training manuals.	book	1	t	2026-08-26 19:05:53.423473+00	2026-08-26 19:05:53.423473+00
2	photos	ງານພິມຮູບພາບພຣີມ້ຽມ	Premium Photo Prints	ພິມຮູບພາບຄຸນນະພາບສູງ, ໂຟໂຕ້ບຸກ, ອັນບັ້ມຮູບ & ກອບອາຄຣີລິກ	High-definition photo prints, photobooks, albums & acrylic frames	ງານພິມຮູບພາບຄວາມລະອຽດສູງລະດັບແກເລີຣີ, ອັນບັ້ມຮູບປົກແຂງ Layflat 180°, ມິນິໂຟໂຕ້ບຸກ ແລະ ກອບຮູບອາຄຣີລິກຕັ້ງໂຕະຄົມຊັດສີສັນສົດໃສ.	Gallery-grade photo printing, luxury hardcover photobooks, compact mini albums, and crystal clear acrylic photo blocks.	photo	2	t	2026-08-26 19:05:53.423473+00	2026-08-26 19:05:53.423473+00
3	stickers	ສະຕິກເກີ & ສະຫຼາກສິນຄ້າ	Stickers & Labels	ສະຕິກເກີກັນນ້ຳ PP, ໄດຄັດ 50%/100%, ສະຕິກເກີໂຮໂລແກຣມ & ຄຣາຟ	Waterproof PP stickers, kiss-cut, die-cut, holographic & kraft labels	ສະຕິກເກີໄດຄັດພ້ອມແປະ PP ຂາວເງົາ, ຂາວດ້ານ, ເນື້ອໃສກັນນ້ຳ 100% ແຊ່ເຢັນໄດ້, ສະຕິກເກີຟອຍທອງ, ໂຮໂລແກຣມ ແລະ ສະຕິກເກີບາໂຄ້ດສຳລັບຕິດຜະລິດຕະພັນ.	Die-cut waterproof PP stickers, glossy, matte, clear, gold foil, holographic security labels, and commercial roll stickers.	sticker	3	t	2026-08-26 19:05:53.423473+00	2026-08-26 19:05:53.423473+00
4	business_cards	ນາມບັດ & ບັດສະມາຊິກ	Business Cards & Tags	ນາມບັດພຣີມ້ຽມ 350 ແກຣມ, ເຄືອບດ້ານ Soft-touch, ປ້ຳທອງ & ມຸມມົນ	Premium 350gsm business cards, soft-touch matte, foil stamping & rounded corners	ນາມບັດຄົມຊັດລະດັບໂຮງພິມ, ກະດາດອາດກາດ 350gsm, ບັດສະມາຊິກ PVC, ປ້າຍຫ້ອຍສິນຄ້າ (Hang Tags) ແລະ ບັດຂອບຄຸນ.	Professional business cards, thick 350gsm art cards, PVC member cards, garment hang tags, and thank-you cards.	card	4	t	2026-08-26 19:05:53.423473+00	2026-08-26 19:05:53.423473+00
5	marketing	ແຜ່ນພັບ & ໂບຣຊົວ	Brochures & Flyers	ໃບປິວໂຄສະນາ, ແຜ່ນພັບ 2 ພັບ 3 ຕອນ, ໂປສເຕີ A3/A4 ຄົມຊັດສີສົດ	Marketing flyers, tri-fold brochures, company profiles, high-res posters	ໃບປິວ ແລະ ແຜ່ນພັບປະຊາສຳພັນ, ກະດາດອາດມັນ 130-160gsm ພັບສຳເລັດຮູບ, ໂປສເຕີຂະໜາດ A3/A2 ສຳລັບງານອີເວັ້ນ.	Promotional leaflets, folded brochures, menus, and vibrant exhibition posters.	flyer	5	t	2026-08-26 19:05:53.423473+00	2026-08-26 19:05:53.423473+00
6	packaging	ກ່ອງບັນຈຸພັນ & ຖົງເຈ້ຍ	Packaging & Paper Bags	ກ່ອງເຄືອບຟິມ, ກ່ອງເຄື່ອງສຳອາງ, ຖົງເຈ້ຍພຣີມ້ຽມພ້ອມຫູຫິ້ວ	Custom packaging boxes, cosmetic boxes, branded kraft & art paper bags	ກ່ອງບັນຈຸພັນສິນຄ້າ, ກ່ອງລັອກກົ້ນ, ຖົງເຈ້ຍພຣີມ້ຽມພິມໂລໂກ້ ສຳລັບຮ້ານຄ້າ ແລະ ແບຣນສິນຄ້າ.	Custom packaging boxes, cosmetic folding cartons, and luxury shopping bags.	box	6	t	2026-08-26 19:05:53.423473+00	2026-08-26 19:05:53.423473+00
7	general	ງານພິມທົ່ວໄປ & ບໍລິການອື່ນໆ	General Print & Services	ຕາຢາງ, ໃບບິນ, ຊອງຈົດໝາຍ, ປ້າຍໄວນິລ & ບໍລິການພິມຕາມສັ່ງ	Rubber stamps, receipts, envelopes, banners & custom printing	ບໍລິການພິມບິນຮັບເງິນ, ໃບສົ່ງເຄື່ອງ, ຕາຢາງໝຶກໃນໂຕ, ຊອງຈົດໝາຍບໍລິສັດ ແລະ ປ້າຍໄວນິລອິ້ງເຈັ້ດ.	Custom rubber stamps, invoices, company envelopes, vinyl banners, and custom printing services.	printer	7	t	2026-08-26 19:05:53.423473+00	2026-08-26 19:05:53.423473+00
\.


--
-- Data for Name: public_product_options; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.public_product_options (id, product_id, option_type, label, value, is_default, extra_cost_rate, created_at, label_lo, label_en, hint_lo, hint_en, material_sku, paper_code, add_price, machine_id, machine_name) FROM stdin;
77	1	printing_mode	ພິມ 4 ສີ (Full Color CMYK)	cmyk_4c	t	1250.0000	2026-08-26 21:07:25.455394+00	ພິມ 4 ສີ (Full Color CMYK)	Full Color CMYK					0.00	PRN-FUJI-V180	Fuji Xerox Versant 180 Press
78	1	printing_mode	ພິມຂາວດຳ (Monochrome K)	mono_k	f	280.0000	2026-08-26 21:07:25.455394+00	ພິມຂາວດຳ (Monochrome K)	Monochrome Black & White					0.00	PRN-FUJI-V180	Fuji Xerox Versant 180 Press
79	1	material	Green Read Paper	green_read_paper	t	200.0000	2026-08-26 21:07:25.455394+00	Green Read Paper (ເຈ້ຍຖະໜອມສາຍຕາ)	Green Read Paper			PAP-4108		0.00		
80	1	material	Green Read Paper	green_read_paper	t	200.0000	2026-08-26 21:07:25.455394+00	Green Read Paper (ເຈ້ຍຖະໜອມສາຍຕາ)	Green Read Paper			PAP-4108		0.00		
90	1	material	PP ขาวเงา (Glossy White PP)	pp_glossy_white	t	0.0000	2026-08-27 19:32:32.181758+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
91	1	material	PP ขาวด้าน (Matte White PP)	pp_matte_white	f	0.0500	2026-08-27 19:32:32.181758+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
92	1	material	PP ใส (Clear Transparent PP)	pp_clear	f	0.1000	2026-08-27 19:32:32.181758+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
93	1	cutting	ไดคัท 50% กึ่งสำเร็จ (Kiss Cut)	kiss_cut	t	0.0000	2026-08-27 19:32:32.181758+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
94	1	cutting	ไดคัท 100% แยกชิ้น (Die Cut Single)	die_cut_single	f	0.1500	2026-08-27 19:32:32.181758+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
100	1	material	PP ขาวเงา (Glossy White PP)	pp_glossy_white	t	0.0000	2026-08-28 16:52:40.362151+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
101	1	material	PP ขาวด้าน (Matte White PP)	pp_matte_white	f	0.0500	2026-08-28 16:52:40.362151+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
102	1	material	PP ใส (Clear Transparent PP)	pp_clear	f	0.1000	2026-08-28 16:52:40.362151+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
103	1	cutting	ไดคัท 50% กึ่งสำเร็จ (Kiss Cut)	kiss_cut	t	0.0000	2026-08-28 16:52:40.362151+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
104	1	cutting	ไดคัท 100% แยกชิ้น (Die Cut Single)	die_cut_single	f	0.1500	2026-08-28 16:52:40.362151+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
110	1	material	PP ขาวเงา (Glossy White PP)	pp_glossy_white	t	0.0000	2026-08-28 20:26:49.230686+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
111	1	material	PP ขาวด้าน (Matte White PP)	pp_matte_white	f	0.0500	2026-08-28 20:26:49.230686+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
112	1	material	PP ใส (Clear Transparent PP)	pp_clear	f	0.1000	2026-08-28 20:26:49.230686+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
113	1	cutting	ไดคัท 50% กึ่งสำเร็จ (Kiss Cut)	kiss_cut	t	0.0000	2026-08-28 20:26:49.230686+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
114	1	cutting	ไดคัท 100% แยกชิ้น (Die Cut Single)	die_cut_single	f	0.1500	2026-08-28 20:26:49.230686+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
115	1	material	PP ขาวเงา (Glossy White PP)	pp_glossy_white	t	0.0000	2026-08-29 14:32:24.7567+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
116	1	material	PP ขาวด้าน (Matte White PP)	pp_matte_white	f	0.0500	2026-08-29 14:32:24.7567+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
117	1	material	PP ใส (Clear Transparent PP)	pp_clear	f	0.1000	2026-08-29 14:32:24.7567+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
118	1	cutting	ไดคัท 50% กึ่งสำเร็จ (Kiss Cut)	kiss_cut	t	0.0000	2026-08-29 14:32:24.7567+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
119	1	cutting	ไดคัท 100% แยกชิ้น (Die Cut Single)	die_cut_single	f	0.1500	2026-08-29 14:32:24.7567+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
125	1	material	PP ขาวเงา (Glossy White PP)	pp_glossy_white	t	0.0000	2026-08-29 21:23:27.591919+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
126	1	material	PP ขาวด้าน (Matte White PP)	pp_matte_white	f	0.0500	2026-08-29 21:23:27.591919+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
127	1	material	PP ใส (Clear Transparent PP)	pp_clear	f	0.1000	2026-08-29 21:23:27.591919+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
128	1	cutting	ไดคัท 50% กึ่งสำเร็จ (Kiss Cut)	kiss_cut	t	0.0000	2026-08-29 21:23:27.591919+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
129	1	cutting	ไดคัท 100% แยกชิ้น (Die Cut Single)	die_cut_single	f	0.1500	2026-08-29 21:23:27.591919+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
135	9	printing_mode	ພິມ 4 ສີ (Full Color CMYK)	cmyk_4c	t	344.0000	2026-08-30 09:20:57.100533+00	ພິມ 4 ສີ (Full Color CMYK)	Full Color CMYK					0.00	PRN-2276	Epson  L4260
136	9	printing_mode	ພິມຂາວດຳ (Monochrome K)	mono_k	f	1691.0000	2026-08-30 09:20:57.100533+00	ພິມຂາວດຳ (Monochrome K)	Monochrome Black & White					0.00	PRN-6317	Brother MFC-J2740DW
137	9	material	Green Read Paper	art_260	t	200.0000	2026-08-30 09:20:57.100533+00	Green Read Paper	260gsm Art Card			PAP-4100		0.00		
138	9	finishing	✂️ ຕັດຊື່ແບ່ງແຜ່ນ A3+ (Straight Cut)	straight_cut	t	28.3000	2026-08-30 09:20:57.100533+00	✂️ ຕັດຊື່ແບ່ງແຜ່ນ A3+	Straight Cut Sheet					0.00	MAC-CUTTER-920	QZYK920 Hydraulic Paper Guillotine
139	9	finishing	✨ ໄດຄັດລອກເປັນດວງ (Kiss-Cut Sheet)	kiss_cut	f	28.0000	2026-08-30 09:20:57.100533+00	✨ ໄດຄັດລອກເປັນດວງ (Kiss-Cut)	Kiss-Cut Sheet					0.00	MAC-CUTTER-920	QZYK920 Hydraulic Paper Guillotine
140	9	finishing	🌟 ໄດຄັດຂາດແຍກດວງ (Die-Cut Individual)	die_cut_individual	f	250.0000	2026-08-30 09:20:57.100533+00	🌟 ໄດຄັດຂາດແຍກດວງ (Die-Cut Individual)	Die-Cut Individual					0.00	MAC-CUTTER-920	QZYK920 Hydraulic Paper Guillotine
144	1	material	PP ขาวเงา (Glossy White PP)	pp_glossy_white	t	0.0000	2026-09-02 17:51:17.140367+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
145	1	material	PP ขาวด้าน (Matte White PP)	pp_matte_white	f	0.0500	2026-09-02 17:51:17.140367+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
146	1	material	PP ใส (Clear Transparent PP)	pp_clear	f	0.1000	2026-09-02 17:51:17.140367+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
147	1	cutting	ไดคัท 50% กึ่งสำเร็จ (Kiss Cut)	kiss_cut	t	0.0000	2026-09-02 17:51:17.140367+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
148	1	cutting	ไดคัท 100% แยกชิ้น (Die Cut Single)	die_cut_single	f	0.1500	2026-09-02 17:51:17.140367+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
149	1	material	PP ขาวเงา (Glossy White PP)	pp_glossy_white	t	0.0000	2026-09-04 17:15:27.355256+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
150	1	material	PP ขาวด้าน (Matte White PP)	pp_matte_white	f	0.0500	2026-09-04 17:15:27.355256+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
151	1	material	PP ใส (Clear Transparent PP)	pp_clear	f	0.1000	2026-09-04 17:15:27.355256+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
152	1	cutting	ไดคัท 50% กึ่งสำเร็จ (Kiss Cut)	kiss_cut	t	0.0000	2026-09-04 17:15:27.355256+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
153	1	cutting	ไดคัท 100% แยกชิ้น (Die Cut Single)	die_cut_single	f	0.1500	2026-09-04 17:15:27.355256+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
95	1	material	PP ขาวเงา (Glossy White PP)	pp_glossy_white	t	0.0000	2026-08-28 15:15:26.222601+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
96	1	material	PP ขาวด้าน (Matte White PP)	pp_matte_white	f	0.0500	2026-08-28 15:15:26.222601+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
97	1	material	PP ใส (Clear Transparent PP)	pp_clear	f	0.1000	2026-08-28 15:15:26.222601+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
98	1	cutting	ไดคัท 50% กึ่งสำเร็จ (Kiss Cut)	kiss_cut	t	0.0000	2026-08-28 15:15:26.222601+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
99	1	cutting	ไดคัท 100% แยกชิ้น (Die Cut Single)	die_cut_single	f	0.1500	2026-08-28 15:15:26.222601+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
105	1	material	PP ขาวเงา (Glossy White PP)	pp_glossy_white	t	0.0000	2026-08-28 17:42:57.691731+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
106	1	material	PP ขาวด้าน (Matte White PP)	pp_matte_white	f	0.0500	2026-08-28 17:42:57.691731+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
107	1	material	PP ใส (Clear Transparent PP)	pp_clear	f	0.1000	2026-08-28 17:42:57.691731+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
108	1	cutting	ไดคัท 50% กึ่งสำเร็จ (Kiss Cut)	kiss_cut	t	0.0000	2026-08-28 17:42:57.691731+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
109	1	cutting	ไดคัท 100% แยกชิ้น (Die Cut Single)	die_cut_single	f	0.1500	2026-08-28 17:42:57.691731+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
120	1	material	PP ขาวเงา (Glossy White PP)	pp_glossy_white	t	0.0000	2026-08-29 16:19:20.307563+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
121	1	material	PP ขาวด้าน (Matte White PP)	pp_matte_white	f	0.0500	2026-08-29 16:19:20.307563+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
122	1	material	PP ใส (Clear Transparent PP)	pp_clear	f	0.1000	2026-08-29 16:19:20.307563+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
123	1	cutting	ไดคัท 50% กึ่งสำเร็จ (Kiss Cut)	kiss_cut	t	0.0000	2026-08-29 16:19:20.307563+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
124	1	cutting	ไดคัท 100% แยกชิ้น (Die Cut Single)	die_cut_single	f	0.1500	2026-08-29 16:19:20.307563+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
130	1	material	PP ขาวเงา (Glossy White PP)	pp_glossy_white	t	0.0000	2026-08-30 08:57:20.1525+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
131	1	material	PP ขาวด้าน (Matte White PP)	pp_matte_white	f	0.0500	2026-08-30 08:57:20.1525+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
132	1	material	PP ใส (Clear Transparent PP)	pp_clear	f	0.1000	2026-08-30 08:57:20.1525+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
133	1	cutting	ไดคัท 50% กึ่งสำเร็จ (Kiss Cut)	kiss_cut	t	0.0000	2026-08-30 08:57:20.1525+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
134	1	cutting	ไดคัท 100% แยกชิ้น (Die Cut Single)	die_cut_single	f	0.1500	2026-08-30 08:57:20.1525+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
141	9	finishing	ບໍ່ເຄືອບຟິล์ມ (No Coating)	no_lam	t	0.0000	2026-08-30 09:20:57.100533+00	ບໍ່ເຄືອບຟິล์ມ (No Coating)	No Coating					0.00		
142	9	finishing	🛡️ ເຄືອບຟິล์ມເງົາ (Glossy Lamination)	gloss_lam	f	27.5000	2026-08-30 09:20:57.100533+00	🛡️ ເຄືອບຟິล์ມເງົາ (Glossy)	Glossy Lamination					0.00	MAC-LAM-FM360	FM-360 Roll Laminator Hot & Cold
143	9	finishing	✨ ເຄືອບຟິล์ມດ້ານ (Matte Lamination)	matte_lam	f	27.5000	2026-08-30 09:20:57.100533+00	✨ ເຄືອບຟິล์ມດ້ານ (Matte)	Matte Lamination					0.00	MAC-LAM-FM360	FM-360 Roll Laminator Hot & Cold
154	1	material	PP ขาวเงา (Glossy White PP)	pp_glossy_white	t	0.0000	2026-09-04 19:10:10.42956+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
155	1	material	PP ขาวด้าน (Matte White PP)	pp_matte_white	f	0.0500	2026-09-04 19:10:10.42956+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
156	1	material	PP ใส (Clear Transparent PP)	pp_clear	f	0.1000	2026-09-04 19:10:10.42956+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
157	1	cutting	ไดคัท 50% กึ่งสำเร็จ (Kiss Cut)	kiss_cut	t	0.0000	2026-09-04 19:10:10.42956+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
158	1	cutting	ไดคัท 100% แยกชิ้น (Die Cut Single)	die_cut_single	f	0.1500	2026-09-04 19:10:10.42956+00	\N	\N	\N	\N	\N	\N	0.00	\N	\N
\.


--
-- Data for Name: public_products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.public_products (id, name, slug, category, description, features, thumbnail_url, gallery_urls, min_quantity, lead_time_days, is_active, is_archived, deleted_at, sort_order, created_at, updated_at, category_id, name_lo, name_en, description_lo, description_en, pricing_model, base_price, unit, bestseller, spec_groups, features_config, is_on_demand, target_margin_percent, default_machine_id, default_machine_name, info_tabs) FROM stdin;
9	ກ໋ອບປີ້ເອກະສານ	d	documents	Lerd	{"ພິມລະອຽດສູງ Ultra HD","ກັນນ້ຳ 100%"}	/api/v1/orders/files/products/prod_1787777945729935888_ee7c48ef838de8c91f98c5c77688673f.jpg	{}	1	2	t	f	\N	0	2026-08-26 19:11:47.326308+00	2026-08-30 09:20:57.100533+00	1	ກ໋ອບປີ້ເອກະສານ	Copy Document	Lerd		STANDARD_FLAT	100.00	ແຜ່ນ	f	[{"id": "group_print_mode", "options": [{"id": 0, "label": "ພິມ 4 ສີ (Full Color CMYK)", "value": "cmyk_4c", "hintEn": "", "hintLo": "", "labelEn": "Full Color CMYK", "labelLo": "ພິມ 4 ສີ (Full Color CMYK)", "addPrice": 0, "createdAt": "0001-01-01T00:00:00Z", "isDefault": true, "machineId": "PRN-2276", "paperCode": "", "productId": 0, "optionType": "printing_mode", "machineName": "Epson  L4260", "materialSku": "", "extraCostRate": 344}, {"id": 0, "label": "ພິມຂາວດຳ (Monochrome K)", "value": "mono_k", "hintEn": "", "hintLo": "", "labelEn": "Monochrome Black & White", "labelLo": "ພິມຂາວດຳ (Monochrome K)", "addPrice": 0, "createdAt": "0001-01-01T00:00:00Z", "isDefault": false, "machineId": "PRN-6317", "paperCode": "", "productId": 0, "optionType": "printing_mode", "machineName": "Brother MFC-J2740DW", "materialSku": "", "extraCostRate": 1691}], "titleEn": "Print Color Mode", "titleLo": "ໂໝດສີການພິມ (Print Color Mode)", "groupType": "printing_mode", "displayType": "cards"}, {"id": "group_artcard_2609", "options": [{"id": 0, "label": "Green Read Paper", "value": "art_260", "hintEn": "", "hintLo": "", "labelEn": "260gsm Art Card", "labelLo": "Green Read Paper", "addPrice": 0, "createdAt": "0001-01-01T00:00:00Z", "isDefault": true, "paperCode": "", "productId": 0, "optionType": "material", "materialSku": "PAP-4100", "extraCostRate": 200}], "titleEn": "Art Card Paper Stock", "titleLo": "ກະດາດອາດກາດ (Art Card Paper)", "groupType": "material", "displayType": "cards"}, {"id": "group_cut_8211", "options": [{"id": 0, "label": "✂️ ຕັດຊື່ແບ່ງແຜ່ນ A3+ (Straight Cut)", "value": "straight_cut", "hintEn": "", "hintLo": "", "labelEn": "Straight Cut Sheet", "labelLo": "✂️ ຕັດຊື່ແບ່ງແຜ່ນ A3+", "addPrice": 0, "createdAt": "0001-01-01T00:00:00Z", "isDefault": true, "machineId": "MAC-CUTTER-920", "paperCode": "", "productId": 0, "optionType": "finishing", "machineName": "QZYK920 Hydraulic Paper Guillotine", "materialSku": "", "extraCostRate": 28.3}, {"id": 0, "label": "✨ ໄດຄັດລອກເປັນດວງ (Kiss-Cut Sheet)", "value": "kiss_cut", "hintEn": "", "hintLo": "", "labelEn": "Kiss-Cut Sheet", "labelLo": "✨ ໄດຄັດລອກເປັນດວງ (Kiss-Cut)", "addPrice": 0, "createdAt": "0001-01-01T00:00:00Z", "isDefault": false, "machineId": "MAC-CUTTER-920", "paperCode": "", "productId": 0, "optionType": "finishing", "machineName": "QZYK920 Hydraulic Paper Guillotine", "materialSku": "", "extraCostRate": 28}, {"id": 0, "label": "🌟 ໄດຄັດຂາດແຍກດວງ (Die-Cut Individual)", "value": "die_cut_individual", "hintEn": "", "hintLo": "", "labelEn": "Die-Cut Individual", "labelLo": "🌟 ໄດຄັດຂາດແຍກດວງ (Die-Cut Individual)", "addPrice": 0, "createdAt": "0001-01-01T00:00:00Z", "isDefault": false, "machineId": "MAC-CUTTER-920", "paperCode": "", "productId": 0, "optionType": "finishing", "machineName": "QZYK920 Hydraulic Paper Guillotine", "materialSku": "", "extraCostRate": 250}], "titleEn": "Cutting Method", "titleLo": "ຮູບແບບການຕັດ (Cutting & Die-Cut)", "groupType": "finishing", "displayType": "cards"}, {"id": "group_lam_8211", "options": [{"id": 0, "label": "ບໍ່ເຄືອບຟິล์ມ (No Coating)", "value": "no_lam", "hintEn": "", "hintLo": "", "labelEn": "No Coating", "labelLo": "ບໍ່ເຄືອບຟິล์ມ (No Coating)", "addPrice": 0, "createdAt": "0001-01-01T00:00:00Z", "isDefault": true, "paperCode": "", "productId": 0, "optionType": "finishing", "materialSku": "", "extraCostRate": 0}, {"id": 0, "label": "🛡️ ເຄືອບຟິล์ມເງົາ (Glossy Lamination)", "value": "gloss_lam", "hintEn": "", "hintLo": "", "labelEn": "Glossy Lamination", "labelLo": "🛡️ ເຄືອບຟິล์ມເງົາ (Glossy)", "addPrice": 0, "createdAt": "0001-01-01T00:00:00Z", "isDefault": false, "machineId": "MAC-LAM-FM360", "paperCode": "", "productId": 0, "optionType": "finishing", "machineName": "FM-360 Roll Laminator Hot & Cold", "materialSku": "", "extraCostRate": 27.5}, {"id": 0, "label": "✨ ເຄືອບຟິล์ມດ້ານ (Matte Lamination)", "value": "matte_lam", "hintEn": "", "hintLo": "", "labelEn": "Matte Lamination", "labelLo": "✨ ເຄືອບຟິล์ມດ້ານ (Matte)", "addPrice": 0, "createdAt": "0001-01-01T00:00:00Z", "isDefault": false, "machineId": "MAC-LAM-FM360", "paperCode": "", "productId": 0, "optionType": "finishing", "machineName": "FM-360 Roll Laminator Hot & Cold", "materialSku": "", "extraCostRate": 27.5}], "titleEn": "Lamination Finish", "titleLo": "ການເຄືອບຟິล์ມກັນຮອຍ (Lamination Coating)", "groupType": "cover_lamination", "displayType": "cards"}]	{"hasCustomDim": false, "hasSpineCalc": false, "breakdownMode": "custom", "hasCoverUpload": true, "hasInnerUpload": false, "uploadWorkflow": "artwork_preflight", "allowedFileTypes": ["pdf", "ai", "psd", "png", "jpg"], "hasPreflightCheck": true, "customBreakdownRows": [{"id": "row_print_paper", "titleEn": "Print & Paper Rate", "titleLo": "ຄ່າພິມ + ເນື້ອເຈ້ຍ (Print & Paper Rate)", "includePrintCost": true, "includeMaterialCost": true, "includeFinishingCost": false}, {"id": "custom_row_7115", "titleEn": "Custom Service", "titleLo": "ງານຕັດ", "includePrintCost": false, "includeMaterialCost": false, "includeFinishingCost": true}], "hasGeneralDocUpload": true, "baselineCoveragePercent": 15}	f	35.00	PRN-2276	Epson  L4260	[]
3	สมุดและแคตตาล็อกเข้าเล่ม (Books & Catalogs)	book-catalog-binding	book	พิมพ์สมุด แคตตาล็อกสินค้า รายงานประจำปี เข้าเล่มสันห่วง สันกาว หรือเย็บมุงหลังคา คุณภาพมาตรฐานโรงพิมพ์	{เลือกวิธีเข้าเล่มได้หลากหลาย,กระดาษเนื้อในถนอมสายตา/อาร์ตมัน,ปกแข็งเคลือบฟิล์มกันรอย,"พิมพ์ได้ทั้ง 4 สี และ 1 สี"}	/images/products/catalog-book.jpg	{}	10	3	t	t	2026-08-26 21:09:05.895184+00	3	2026-08-26 19:05:47.274998+00	2026-08-26 19:05:47.274998+00	1	\N	\N	\N	\N	STANDARD_FLAT	0.00	ຊິ້ນ	f	[]	{}	f	35.00	\N	\N	[]
1	สติกเกอร์ PP กันน้ำ (Waterproof PP Sticker)	waterproof-pp-sticker	sticker	สติกเกอร์เนื้อพลาสติก PP ฉีกไม่ขาด กันน้ำ 100% เหมาะสำหรับติดขวดน้ำ แก้วกาแฟ ถุงขนม และสินค้าแช่เย็น	{"กันน้ำ 100%",แช่เย็น/แช่ฟรีซได้,"ไดคัทคมชัด พร้อมลอกแปะ",หมึกแท้คมชัดระดับพรีเมียม}	/api/v1/orders/files/products/prod_1787778430287523834_HIM_Business_School_logo.svg	{}	50	2	t	f	\N	0	2026-08-26 19:05:47.274998+00	2026-08-26 21:07:25.455394+00	3	สติกเกอร์ PP กันน้ำ (Waterproof PP Sticker)	l	สติกเกอร์เนื้อพลาสติก PP ฉีกไม่ขาด กันน้ำ 100% เหมาะสำหรับติดขวดน้ำ แก้วกาแฟ ถุงขนม และสินค้าแช่เย็น		STANDARD_FLAT	2538.00	ແຜ່ນ	f	[{"id": "group_print_mode", "options": [{"id": 0, "label": "ພິມ 4 ສີ (Full Color CMYK)", "value": "cmyk_4c", "hintEn": "", "hintLo": "", "labelEn": "Full Color CMYK", "labelLo": "ພິມ 4 ສີ (Full Color CMYK)", "addPrice": 0, "createdAt": "0001-01-01T00:00:00Z", "isDefault": true, "machineId": "PRN-FUJI-V180", "paperCode": "", "productId": 0, "optionType": "printing_mode", "machineName": "Fuji Xerox Versant 180 Press", "materialSku": "", "extraCostRate": 1250}, {"id": 0, "label": "ພິມຂາວດຳ (Monochrome K)", "value": "mono_k", "hintEn": "", "hintLo": "", "labelEn": "Monochrome Black & White", "labelLo": "ພິມຂາວດຳ (Monochrome K)", "addPrice": 0, "createdAt": "0001-01-01T00:00:00Z", "isDefault": false, "machineId": "PRN-FUJI-V180", "paperCode": "", "productId": 0, "optionType": "printing_mode", "machineName": "Fuji Xerox Versant 180 Press", "materialSku": "", "extraCostRate": 280}], "titleEn": "Print Color Mode", "titleLo": "ລະບົບການພິມ / ໂໝດສີ (Print Color Mode)", "groupType": "printing_mode", "displayType": "cards"}, {"id": "group_mat_default", "options": [{"id": 0, "label": "Green Read Paper", "value": "green_read_paper", "hintEn": "", "hintLo": "", "labelEn": "Green Read Paper", "labelLo": "Green Read Paper (ເຈ້ຍຖະໜອມສາຍຕາ)", "addPrice": 0, "createdAt": "0001-01-01T00:00:00Z", "isDefault": true, "paperCode": "", "productId": 0, "optionType": "material", "materialSku": "PAP-4108", "extraCostRate": 200}], "titleEn": "Paper Material Stock", "titleLo": "ເນື້ອເຈ້ຍ / ວັດສະດຸພື້ນຖານ (Paper Stock)", "groupType": "material", "displayType": "cards"}, {"id": "group_mat_default", "options": [{"id": 0, "label": "Green Read Paper", "value": "green_read_paper", "hintEn": "", "hintLo": "", "labelEn": "Green Read Paper", "labelLo": "Green Read Paper (ເຈ້ຍຖະໜອມສາຍຕາ)", "addPrice": 0, "createdAt": "0001-01-01T00:00:00Z", "isDefault": true, "paperCode": "", "productId": 0, "optionType": "material", "materialSku": "PAP-4108", "extraCostRate": 200}], "titleEn": "Paper Material Stock", "titleLo": "ເນື້ອເຈ້ຍ / ວັດສະດຸພື້ນຖານ (Paper Stock)", "groupType": "material", "displayType": "cards"}]	{"hasCustomDim": false, "hasSpineCalc": false, "hasCoverUpload": false, "hasInnerUpload": false, "hasPreflightCheck": false, "baselineCoveragePercent": 15}	f	35.00	PRN-FUJI-V180	Fuji Xerox Versant 180 Press	[]
2	นามบัตรพรีเมียม 350 แกรม (Premium Business Cards)	premium-business-card	business_card	นามบัตรกระดาษอาร์ตการ์ด 350 แกรม หนาแน่น พิมพ์ 2 หน้า คมชัดระดับโฟโต้ พร้อมเคลือบด้าน/เงา	{"กระดาษหนา 350 แกรม","พิมพ์ 2 หน้าสีสดใส","เคลือบด้าน Soft-touch หรูหรา",ขอบมนหรือตัดตรงมาตรฐาน}	/images/products/business-card.jpg	{}	100	2	t	t	2026-08-26 21:10:32.441125+00	2	2026-08-26 19:05:47.274998+00	2026-08-26 19:05:47.274998+00	4	\N	\N	\N	\N	STANDARD_FLAT	0.00	ຊິ້ນ	f	[]	{}	f	35.00	\N	\N	[]
\.


--
-- Data for Name: quotation_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotation_items (item_id, quotation_id, asset_id, paper_code, job_width_mm, job_length_mm, coverage_k_percent, coverage_c_percent, coverage_m_percent, coverage_y_percent, ink_cost, machine_cost, paper_cost, labor_cost, finishing_cost, waste_percent, unit_cost_total, unit_selling_price, created_at) FROM stdin;
\.


--
-- Data for Name: quotations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quotations (quotation_id, customer_name, total_cost, total_selling_price, overall_profit_percent, created_at, updated_at, deposit_percentage, tax_mode, tax_rate, id, quotation_no, title, status, customer_phone, customer_address, notes, items_json, discount_percent, setup_fee, packaging_cost, shipping_fee, expiry_date) FROM stdin;
\.


--
-- Data for Name: stock_movements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stock_movements (id, material_id, order_id, order_item_id, movement_type, quantity, unit_cost, notes, created_at, created_by) FROM stdin;
\.


--
-- Data for Name: technician_earnings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.technician_earnings (id, employee_id, employee_name, order_id, order_number, customer_name, step_id, step_name, impressions, rate_per_impression, earned_amount_lak, recorded_at) FROM stdin;
\.


--
-- Name: bank_transaction_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bank_transaction_logs_id_seq', 1, false);


--
-- Name: equipment_specs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.equipment_specs_id_seq', 1, false);


--
-- Name: lao_districts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lao_districts_id_seq', 148, true);


--
-- Name: lao_provinces_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lao_provinces_id_seq', 18, true);


--
-- Name: order_preflight_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_preflight_reports_id_seq', 33, true);


--
-- Name: paper_price_versions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.paper_price_versions_id_seq', 1, false);


--
-- Name: paper_specs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.paper_specs_id_seq', 1, false);


--
-- Name: product_discount_tiers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_discount_tiers_id_seq', 99, true);


--
-- Name: public_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.public_categories_id_seq', 91, true);


--
-- Name: public_product_options_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.public_product_options_id_seq', 158, true);


--
-- Name: public_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.public_products_id_seq', 45, true);


--
-- Name: bank_transaction_logs bank_transaction_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_transaction_logs
    ADD CONSTRAINT bank_transaction_logs_pkey PRIMARY KEY (id);


--
-- Name: couriers couriers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.couriers
    ADD CONSTRAINT couriers_pkey PRIMARY KEY (id);


--
-- Name: currency_rates currency_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.currency_rates
    ADD CONSTRAINT currency_rates_pkey PRIMARY KEY (currency_code);


--
-- Name: customer_categories customer_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_categories
    ADD CONSTRAINT customer_categories_pkey PRIMARY KEY (id);


--
-- Name: customer_vip_tiers customer_vip_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_vip_tiers
    ADD CONSTRAINT customer_vip_tiers_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: delivery_dispatches delivery_dispatches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.delivery_dispatches
    ADD CONSTRAINT delivery_dispatches_pkey PRIMARY KEY (id);


--
-- Name: equipment_specs equipment_specs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment_specs
    ADD CONSTRAINT equipment_specs_pkey PRIMARY KEY (id);


--
-- Name: inbound_transactions inbound_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inbound_transactions
    ADD CONSTRAINT inbound_transactions_pkey PRIMARY KEY (id);


--
-- Name: ink_master_catalog ink_master_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ink_master_catalog
    ADD CONSTRAINT ink_master_catalog_pkey PRIMARY KEY (ink_code);


--
-- Name: lao_districts lao_districts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lao_districts
    ADD CONSTRAINT lao_districts_pkey PRIMARY KEY (id);


--
-- Name: lao_provinces lao_provinces_name_la_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lao_provinces
    ADD CONSTRAINT lao_provinces_name_la_key UNIQUE (name_la);


--
-- Name: lao_provinces lao_provinces_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lao_provinces
    ADD CONSTRAINT lao_provinces_pkey PRIMARY KEY (id);


--
-- Name: machine_downtime_logs machine_downtime_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.machine_downtime_logs
    ADD CONSTRAINT machine_downtime_logs_pkey PRIMARY KEY (id);


--
-- Name: maintenance_tickets maintenance_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_tickets
    ADD CONSTRAINT maintenance_tickets_pkey PRIMARY KEY (id);


--
-- Name: materials materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);


--
-- Name: materials materials_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_sku_key UNIQUE (sku);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: order_preflight_reports order_preflight_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_preflight_reports
    ADD CONSTRAINT order_preflight_reports_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: paper_price_versions paper_price_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_price_versions
    ADD CONSTRAINT paper_price_versions_pkey PRIMARY KEY (id);


--
-- Name: paper_price_versions paper_price_versions_version_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_price_versions
    ADD CONSTRAINT paper_price_versions_version_code_key UNIQUE (version_code);


--
-- Name: paper_specs paper_specs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_specs
    ADD CONSTRAINT paper_specs_pkey PRIMARY KEY (id);


--
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- Name: printer_color_link printer_color_link_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.printer_color_link
    ADD CONSTRAINT printer_color_link_pkey PRIMARY KEY (link_id);


--
-- Name: product_discount_tiers product_discount_tiers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_discount_tiers
    ADD CONSTRAINT product_discount_tiers_pkey PRIMARY KEY (id);


--
-- Name: public_categories public_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_categories
    ADD CONSTRAINT public_categories_pkey PRIMARY KEY (id);


--
-- Name: public_categories public_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_categories
    ADD CONSTRAINT public_categories_slug_key UNIQUE (slug);


--
-- Name: public_product_options public_product_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_product_options
    ADD CONSTRAINT public_product_options_pkey PRIMARY KEY (id);


--
-- Name: public_products public_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_products
    ADD CONSTRAINT public_products_pkey PRIMARY KEY (id);


--
-- Name: public_products public_products_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_products
    ADD CONSTRAINT public_products_slug_key UNIQUE (slug);


--
-- Name: quotation_items quotation_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_items
    ADD CONSTRAINT quotation_items_pkey PRIMARY KEY (item_id);


--
-- Name: quotations quotations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT quotations_pkey PRIMARY KEY (quotation_id);


--
-- Name: stock_movements stock_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stock_movements
    ADD CONSTRAINT stock_movements_pkey PRIMARY KEY (id);


--
-- Name: technician_earnings technician_earnings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.technician_earnings
    ADD CONSTRAINT technician_earnings_pkey PRIMARY KEY (id);


--
-- Name: printer_color_link unique_asset_slot; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.printer_color_link
    ADD CONSTRAINT unique_asset_slot UNIQUE (asset_id, slot_position);


--
-- Name: quotations unique_quotations_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotations
    ADD CONSTRAINT unique_quotations_id UNIQUE (id);


--
-- Name: lao_districts uq_province_district; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lao_districts
    ADD CONSTRAINT uq_province_district UNIQUE (province_id, name_la);


--
-- Name: idx_bank_trans_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_trans_order_id ON public.bank_transaction_logs USING btree (order_id);


--
-- Name: idx_bank_trans_ref; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_trans_ref ON public.bank_transaction_logs USING btree (trans_ref);


--
-- Name: idx_bank_trans_ref_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_bank_trans_ref_unique ON public.bank_transaction_logs USING btree (trans_ref) WHERE ((trans_ref IS NOT NULL) AND ((trans_ref)::text <> ''::text));


--
-- Name: idx_bank_trans_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bank_trans_status ON public.bank_transaction_logs USING btree (status);


--
-- Name: idx_customers_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_email ON public.customers USING btree (email);


--
-- Name: idx_customers_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_name ON public.customers USING btree (name);


--
-- Name: idx_customers_phone; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_customers_phone ON public.customers USING btree (phone);


--
-- Name: idx_deliveries_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_deliveries_order ON public.delivery_dispatches USING btree (order_id);


--
-- Name: idx_downtime_machine; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_downtime_machine ON public.machine_downtime_logs USING btree (machine_id);


--
-- Name: idx_inbound_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inbound_date ON public.inbound_transactions USING btree (inbound_date);


--
-- Name: idx_inbound_sku; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inbound_sku ON public.inbound_transactions USING btree (sku_code);


--
-- Name: idx_ink_base_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ink_base_type ON public.ink_master_catalog USING btree (ink_base_type);


--
-- Name: idx_ink_color_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ink_color_group ON public.ink_master_catalog USING btree (color_group);


--
-- Name: idx_lao_districts_province_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lao_districts_province_id ON public.lao_districts USING btree (province_id);


--
-- Name: idx_materials_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_materials_category ON public.materials USING btree (category);


--
-- Name: idx_materials_sku; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_materials_sku ON public.materials USING btree (sku);


--
-- Name: idx_order_items_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_order ON public.order_items USING btree (order_id);


--
-- Name: idx_order_preflight_reports_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_preflight_reports_created ON public.order_preflight_reports USING btree (created_at DESC);


--
-- Name: idx_order_preflight_reports_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_preflight_reports_order_id ON public.order_preflight_reports USING btree (order_id);


--
-- Name: idx_orders_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_customer ON public.orders USING btree (customer_name);


--
-- Name: idx_orders_customer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_customer_id ON public.orders USING btree (customer_id);


--
-- Name: idx_orders_idempotency_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_orders_idempotency_key ON public.orders USING btree (idempotency_key) WHERE ((idempotency_key IS NOT NULL) AND ((idempotency_key)::text <> ''::text));


--
-- Name: idx_orders_proof_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_proof_status ON public.orders USING btree (proof_status);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_orders_tracking_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_tracking_code ON public.orders USING btree (tracking_code);


--
-- Name: idx_paper_price_versions_eff_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_paper_price_versions_eff_date ON public.paper_price_versions USING btree (effective_date DESC);


--
-- Name: idx_paper_price_versions_supplier; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_paper_price_versions_supplier ON public.paper_price_versions USING btree (supplier_name);


--
-- Name: idx_paper_specs_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_paper_specs_code ON public.paper_specs USING btree (paper_code);


--
-- Name: idx_paper_specs_price_version; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_paper_specs_price_version ON public.paper_specs USING btree (price_version_id);


--
-- Name: idx_pcl_asset_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pcl_asset_id ON public.printer_color_link USING btree (asset_id);


--
-- Name: idx_pcl_ink_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pcl_ink_code ON public.printer_color_link USING btree (ink_code);


--
-- Name: idx_product_discount_tiers_pid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_product_discount_tiers_pid ON public.product_discount_tiers USING btree (product_id);


--
-- Name: idx_public_categories_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_public_categories_active ON public.public_categories USING btree (is_active);


--
-- Name: idx_public_categories_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_public_categories_slug ON public.public_categories USING btree (slug);


--
-- Name: idx_public_product_options_pid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_public_product_options_pid ON public.public_product_options USING btree (product_id);


--
-- Name: idx_public_products_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_public_products_active ON public.public_products USING btree (is_active) WHERE (deleted_at IS NULL);


--
-- Name: idx_public_products_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_public_products_category ON public.public_products USING btree (category);


--
-- Name: idx_public_products_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_public_products_slug ON public.public_products USING btree (slug);


--
-- Name: idx_quotation_items_quotation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quotation_items_quotation ON public.quotation_items USING btree (quotation_id);


--
-- Name: idx_quotations_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quotations_created_at ON public.quotations USING btree (created_at);


--
-- Name: idx_quotations_customer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_quotations_customer ON public.quotations USING btree (customer_name);


--
-- Name: idx_stock_movements_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stock_movements_created ON public.stock_movements USING btree (created_at DESC);


--
-- Name: idx_stock_movements_material; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stock_movements_material ON public.stock_movements USING btree (material_id);


--
-- Name: idx_stock_movements_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_stock_movements_order ON public.stock_movements USING btree (order_id);


--
-- Name: idx_tech_earnings_emp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tech_earnings_emp ON public.technician_earnings USING btree (employee_id);


--
-- Name: idx_tech_earnings_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tech_earnings_order ON public.technician_earnings USING btree (order_id);


--
-- Name: bank_transaction_logs bank_transaction_logs_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_transaction_logs
    ADD CONSTRAINT bank_transaction_logs_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: lao_districts lao_districts_province_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lao_districts
    ADD CONSTRAINT lao_districts_province_id_fkey FOREIGN KEY (province_id) REFERENCES public.lao_provinces(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: paper_specs paper_specs_price_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.paper_specs
    ADD CONSTRAINT paper_specs_price_version_id_fkey FOREIGN KEY (price_version_id) REFERENCES public.paper_price_versions(id) ON DELETE SET NULL;


--
-- Name: printer_color_link printer_color_link_ink_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.printer_color_link
    ADD CONSTRAINT printer_color_link_ink_code_fkey FOREIGN KEY (ink_code) REFERENCES public.ink_master_catalog(ink_code) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: product_discount_tiers product_discount_tiers_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_discount_tiers
    ADD CONSTRAINT product_discount_tiers_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.public_products(id) ON DELETE CASCADE;


--
-- Name: public_product_options public_product_options_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_product_options
    ADD CONSTRAINT public_product_options_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.public_products(id) ON DELETE CASCADE;


--
-- Name: public_products public_products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.public_products
    ADD CONSTRAINT public_products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.public_categories(id) ON DELETE SET NULL;


--
-- Name: quotation_items quotation_items_quotation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quotation_items
    ADD CONSTRAINT quotation_items_quotation_id_fkey FOREIGN KEY (quotation_id) REFERENCES public.quotations(quotation_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict pxiYXdOiDmUR5FJIaRqgczSpDNafMZ8lyz1rZPxCTgRpzPoaz0l7mnmAZFgalvO

