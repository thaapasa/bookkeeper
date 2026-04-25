--
-- PostgreSQL database dump
--


-- Dumped from database version 18.3 (Debian 18.3-1.pgdg13+1)
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: expense_division_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.expense_division_type AS ENUM (
    'cost',
    'benefit',
    'income',
    'split',
    'transferor',
    'transferee'
);


--
-- Name: expense_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.expense_type AS ENUM (
    'expense',
    'income',
    'transfer'
);


--
-- Name: recurring_period; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.recurring_period AS ENUM (
    'months',
    'years',
    'weeks',
    'days',
    'quarters'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    parent_id integer,
    group_id integer NOT NULL,
    name text NOT NULL
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: expense_division; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_division (
    expense_id integer NOT NULL,
    user_id integer NOT NULL,
    type public.expense_division_type NOT NULL,
    sum numeric(10,2) NOT NULL
);


--
-- Name: expense_grouping_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_grouping_categories (
    id integer NOT NULL,
    created timestamp with time zone DEFAULT now() NOT NULL,
    expense_grouping_id integer,
    category_id integer
);


--
-- Name: expense_grouping_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expense_grouping_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expense_grouping_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expense_grouping_categories_id_seq OWNED BY public.expense_grouping_categories.id;


--
-- Name: expense_groupings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_groupings (
    id integer NOT NULL,
    created timestamp with time zone DEFAULT now() NOT NULL,
    updated timestamp with time zone DEFAULT now() NOT NULL,
    group_id integer NOT NULL,
    title text NOT NULL,
    start_date date,
    end_date date,
    image text,
    color text DEFAULT ''::text NOT NULL,
    tags text[] DEFAULT ARRAY[]::text[] NOT NULL,
    user_id integer NOT NULL,
    private boolean DEFAULT false NOT NULL,
    only_own boolean DEFAULT false NOT NULL
);


--
-- Name: expense_groupings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expense_groupings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expense_groupings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expense_groupings_id_seq OWNED BY public.expense_groupings.id;


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id integer NOT NULL,
    group_id integer NOT NULL,
    user_id integer NOT NULL,
    date date NOT NULL,
    created_by_id integer NOT NULL,
    created timestamp with time zone NOT NULL,
    receiver text,
    sum numeric(10,2) NOT NULL,
    title text,
    source_id integer NOT NULL,
    category_id integer NOT NULL,
    description text,
    confirmed boolean DEFAULT true NOT NULL,
    type public.expense_type DEFAULT 'expense'::public.expense_type NOT NULL,
    recurring_expense_id integer,
    template boolean DEFAULT false NOT NULL,
    grouping_id integer
);


--
-- Name: expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.expenses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.expenses_id_seq OWNED BY public.expenses.id;


--
-- Name: group_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_users (
    user_id integer NOT NULL,
    group_id integer NOT NULL,
    default_source_id integer
);


--
-- Name: groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.groups (
    id integer NOT NULL,
    name text
);


--
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.groups_id_seq OWNED BY public.groups.id;


--
-- Name: knex_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knex_migrations (
    id integer NOT NULL,
    name character varying(255),
    batch integer,
    migration_time timestamp with time zone
);


--
-- Name: knex_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.knex_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: knex_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.knex_migrations_id_seq OWNED BY public.knex_migrations.id;


--
-- Name: knex_migrations_lock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.knex_migrations_lock (
    index integer NOT NULL,
    is_locked integer
);


--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.knex_migrations_lock_index_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.knex_migrations_lock_index_seq OWNED BY public.knex_migrations_lock.index;


--
-- Name: recurring_expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recurring_expenses (
    id integer NOT NULL,
    template_expense_id integer NOT NULL,
    group_id integer NOT NULL,
    period_unit public.recurring_period NOT NULL,
    occurs_until date,
    next_missing date,
    period_amount smallint DEFAULT 1 NOT NULL
);


--
-- Name: recurring_expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recurring_expenses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recurring_expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recurring_expenses_id_seq OWNED BY public.recurring_expenses.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reports (
    id integer NOT NULL,
    group_id integer,
    user_id integer,
    title text NOT NULL,
    query jsonb NOT NULL
);


--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    token text NOT NULL,
    user_id integer NOT NULL,
    login_time timestamp with time zone NOT NULL,
    expiry_time timestamp with time zone NOT NULL,
    refresh_token text
);


--
-- Name: shortcuts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shortcuts (
    id integer NOT NULL,
    created timestamp with time zone DEFAULT now() NOT NULL,
    updated timestamp with time zone DEFAULT now() NOT NULL,
    group_id integer,
    user_id integer,
    sort_order integer DEFAULT 0,
    title text NOT NULL,
    icon text,
    background text,
    expense jsonb NOT NULL
);


--
-- Name: shortcuts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shortcuts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shortcuts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shortcuts_id_seq OWNED BY public.shortcuts.id;


--
-- Name: source_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.source_users (
    source_id integer NOT NULL,
    user_id integer NOT NULL,
    share integer
);


--
-- Name: sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sources (
    id integer NOT NULL,
    group_id integer NOT NULL,
    name text NOT NULL,
    abbreviation text,
    image text
);


--
-- Name: sources_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sources_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sources_id_seq OWNED BY public.sources.id;


--
-- Name: tracked_subjects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tracked_subjects (
    id integer NOT NULL,
    created timestamp with time zone DEFAULT now() NOT NULL,
    updated timestamp with time zone DEFAULT now() NOT NULL,
    group_id integer NOT NULL,
    user_id integer NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    title text NOT NULL,
    image text,
    tracking_data jsonb DEFAULT '{}'::jsonb NOT NULL
);


--
-- Name: tracked_subjects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tracked_subjects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tracked_subjects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tracked_subjects_id_seq OWNED BY public.tracked_subjects.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    first_name text,
    last_name text,
    default_group_id integer,
    image text,
    image_dark text
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: expense_grouping_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_grouping_categories ALTER COLUMN id SET DEFAULT nextval('public.expense_grouping_categories_id_seq'::regclass);


--
-- Name: expense_groupings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_groupings ALTER COLUMN id SET DEFAULT nextval('public.expense_groupings_id_seq'::regclass);


--
-- Name: expenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses ALTER COLUMN id SET DEFAULT nextval('public.expenses_id_seq'::regclass);


--
-- Name: groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups ALTER COLUMN id SET DEFAULT nextval('public.groups_id_seq'::regclass);


--
-- Name: knex_migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knex_migrations ALTER COLUMN id SET DEFAULT nextval('public.knex_migrations_id_seq'::regclass);


--
-- Name: knex_migrations_lock index; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knex_migrations_lock ALTER COLUMN index SET DEFAULT nextval('public.knex_migrations_lock_index_seq'::regclass);


--
-- Name: recurring_expenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expenses ALTER COLUMN id SET DEFAULT nextval('public.recurring_expenses_id_seq'::regclass);


--
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- Name: shortcuts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shortcuts ALTER COLUMN id SET DEFAULT nextval('public.shortcuts_id_seq'::regclass);


--
-- Name: sources id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sources ALTER COLUMN id SET DEFAULT nextval('public.sources_id_seq'::regclass);


--
-- Name: tracked_subjects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracked_subjects ALTER COLUMN id SET DEFAULT nextval('public.tracked_subjects_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: expense_grouping_categories expense_grouping_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_grouping_categories
    ADD CONSTRAINT expense_grouping_categories_pkey PRIMARY KEY (id);


--
-- Name: expense_groupings expense_groupings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_groupings
    ADD CONSTRAINT expense_groupings_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: knex_migrations_lock knex_migrations_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knex_migrations_lock
    ADD CONSTRAINT knex_migrations_lock_pkey PRIMARY KEY (index);


--
-- Name: knex_migrations knex_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.knex_migrations
    ADD CONSTRAINT knex_migrations_pkey PRIMARY KEY (id);


--
-- Name: recurring_expenses recurring_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT recurring_expenses_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (token);


--
-- Name: shortcuts shortcuts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shortcuts
    ADD CONSTRAINT shortcuts_pkey PRIMARY KEY (id);


--
-- Name: sources sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sources
    ADD CONSTRAINT sources_pkey PRIMARY KEY (id);


--
-- Name: tracked_subjects tracked_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracked_subjects
    ADD CONSTRAINT tracked_subjects_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: categories_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX categories_group_id ON public.categories USING btree (group_id);


--
-- Name: expenses_description_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX expenses_description_trgm ON public.expenses USING gin (description public.gin_trgm_ops);


--
-- Name: expenses_group_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX expenses_group_date ON public.expenses USING btree (group_id, template, date);


--
-- Name: expenses_receiver_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX expenses_receiver_trgm ON public.expenses USING gin (receiver public.gin_trgm_ops);


--
-- Name: expenses_title_trgm; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX expenses_title_trgm ON public.expenses USING gin (title public.gin_trgm_ops);


--
-- Name: group_users_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX group_users_user_id ON public.group_users USING btree (user_id);


--
-- Name: sessions_expiry; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_expiry ON public.sessions USING btree (expiry_time);


--
-- Name: sessions_refresh_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_refresh_token ON public.sessions USING btree (refresh_token);


--
-- Name: sessions_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_token ON public.sessions USING btree (token);


--
-- Name: source_users_source_id_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX source_users_source_id_user_id ON public.source_users USING btree (source_id, user_id);


--
-- Name: sources_group_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sources_group_id ON public.sources USING btree (group_id);


--
-- Name: users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_email ON public.users USING btree (email);


--
-- Name: categories categories_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id);


--
-- Name: expense_division expense_division_expense_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_division
    ADD CONSTRAINT expense_division_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.expenses(id) ON DELETE CASCADE;


--
-- Name: expense_division expense_division_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_division
    ADD CONSTRAINT expense_division_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: expense_grouping_categories expense_grouping_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_grouping_categories
    ADD CONSTRAINT expense_grouping_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: expense_grouping_categories expense_grouping_categories_expense_grouping_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_grouping_categories
    ADD CONSTRAINT expense_grouping_categories_expense_grouping_id_fkey FOREIGN KEY (expense_grouping_id) REFERENCES public.expense_groupings(id) ON DELETE CASCADE;


--
-- Name: expense_groupings expense_groupings_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_groupings
    ADD CONSTRAINT expense_groupings_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: expense_groupings expense_groupings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_groupings
    ADD CONSTRAINT expense_groupings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: expenses expenses_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: expenses expenses_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- Name: expenses expenses_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: expenses expenses_grouping_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_grouping_id_fkey FOREIGN KEY (grouping_id) REFERENCES public.expense_groupings(id) ON DELETE SET NULL;


--
-- Name: expenses expenses_recurring_expense_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_recurring_expense_id_fkey FOREIGN KEY (recurring_expense_id) REFERENCES public.recurring_expenses(id);


--
-- Name: expenses expenses_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id);


--
-- Name: expenses expenses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: group_users group_users_default_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_users
    ADD CONSTRAINT group_users_default_source_id_fkey FOREIGN KEY (default_source_id) REFERENCES public.sources(id);


--
-- Name: group_users group_users_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_users
    ADD CONSTRAINT group_users_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: group_users group_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_users
    ADD CONSTRAINT group_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: recurring_expenses recurring_expenses_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT recurring_expenses_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: recurring_expenses recurring_expenses_template_expense_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recurring_expenses
    ADD CONSTRAINT recurring_expenses_template_expense_id_fkey FOREIGN KEY (template_expense_id) REFERENCES public.expenses(id) ON DELETE CASCADE;


--
-- Name: reports reports_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: reports reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: shortcuts shortcuts_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shortcuts
    ADD CONSTRAINT shortcuts_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: shortcuts shortcuts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shortcuts
    ADD CONSTRAINT shortcuts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: source_users source_users_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.source_users
    ADD CONSTRAINT source_users_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id);


--
-- Name: source_users source_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.source_users
    ADD CONSTRAINT source_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: sources sources_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sources
    ADD CONSTRAINT sources_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.users(id);


--
-- Name: tracked_subjects tracked_subjects_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracked_subjects
    ADD CONSTRAINT tracked_subjects_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id);


--
-- Name: tracked_subjects tracked_subjects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tracked_subjects
    ADD CONSTRAINT tracked_subjects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_default_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_default_group_id_fkey FOREIGN KEY (default_group_id) REFERENCES public.groups(id);


--
-- PostgreSQL database dump complete
--


