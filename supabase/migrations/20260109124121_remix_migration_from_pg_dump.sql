CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

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



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'manager',
    'member'
);


--
-- Name: get_user_workspace(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_workspace(_user_id uuid) RETURNS text
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT workspace_id
  FROM public.profiles
  WHERE id = _user_id
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, workspace_id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'workspace_id', 'default'),
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email)
  );
  -- Auto-assign 'member' role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: calendar_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_name text NOT NULL,
    contact_name text,
    email text,
    phone text,
    website text,
    address text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: calendar_posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendar_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    calendar_id uuid NOT NULL,
    month_name text NOT NULL,
    month_year integer NOT NULL,
    day_of_month integer,
    title text,
    copy text,
    image_source text DEFAULT 'none'::text,
    image_url text,
    post_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workspace_id text DEFAULT 'default'::text,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: competencia_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.competencia_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    beneficiary_name text NOT NULL,
    nif text,
    website_url text NOT NULL,
    report_date date DEFAULT CURRENT_DATE NOT NULL,
    period_start text,
    period_end text,
    status text DEFAULT 'draft'::text NOT NULL,
    report_data jsonb DEFAULT '{}'::jsonb,
    pdf_path text,
    word_path text
);


--
-- Name: content_calendar_edits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_calendar_edits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    calendar_id uuid NOT NULL,
    action text NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now(),
    performed_by text,
    template_name text,
    CONSTRAINT content_calendar_edits_action_check CHECK ((action = ANY (ARRAY['created'::text, 'updated'::text, 'pdf_generated'::text, 'status_changed'::text, 'note_added'::text, 'feedback_received'::text, 'feedback_reviewed'::text, 'email_sent'::text, 'calendar_sent'::text, 'email_error'::text])))
);


--
-- Name: content_calendar_responsibles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_calendar_responsibles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    calendar_id uuid NOT NULL,
    team_member_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: content_calendars; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_calendars (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    calendar_contact_id uuid NOT NULL,
    channel text NOT NULL,
    month_start date NOT NULL,
    month_end date NOT NULL,
    status text DEFAULT 'Pendiente de enviar'::text NOT NULL,
    pdf_url text,
    pdf_generated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    feedback_status text DEFAULT 'sin_feedback'::text,
    approval_status text DEFAULT 'pending'::text,
    approved_at timestamp with time zone,
    approved_via text,
    agencies text[] DEFAULT ARRAY['likearocket'::text] NOT NULL,
    CONSTRAINT content_calendars_status_check CHECK ((status = ANY (ARRAY['Pendiente de enviar'::text, 'Pendiente de aprobación'::text, 'Editado'::text, 'Aprobado'::text, 'Calendario publicado'::text])))
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    calendar_id uuid,
    content_json jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    visible_months text[]
);


--
-- Name: ecommerce_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ecommerce_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    beneficiary_name text NOT NULL,
    nif text,
    website_url text NOT NULL,
    report_date text DEFAULT to_char(now(), 'YYYY-MM-DD'::text) NOT NULL,
    service_start text,
    service_end text,
    period_start text,
    period_end text,
    status text DEFAULT 'draft'::text NOT NULL,
    report_data jsonb,
    pdf_path text,
    word_path text
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    workspace_id text DEFAULT 'default'::text NOT NULL,
    name text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: proposals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proposals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    token text NOT NULL,
    proposal_json jsonb DEFAULT '{}'::jsonb NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    submitted_at timestamp with time zone,
    notified_at timestamp with time zone
);


--
-- Name: seguimiento_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seguimiento_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    beneficiary_name text NOT NULL,
    nif text,
    website_url text NOT NULL,
    report_date date DEFAULT CURRENT_DATE NOT NULL,
    period_start text,
    period_end text,
    status text DEFAULT 'draft'::text NOT NULL,
    report_data jsonb,
    pdf_path text,
    word_path text
);


--
-- Name: seo_web_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.seo_web_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    site_url text NOT NULL,
    service_period text,
    report_date date,
    beneficiary text,
    case_key text,
    vision_report_id uuid,
    image_hash text,
    missing text[] DEFAULT '{}'::text[],
    pdf_path text,
    meta jsonb DEFAULT '{}'::jsonb,
    word_path text,
    CONSTRAINT seo_web_reports_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'ready'::text, 'exported'::text, 'error'::text])))
);


--
-- Name: share_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.share_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    document_id uuid NOT NULL,
    token text NOT NULL,
    can_view boolean DEFAULT true NOT NULL,
    can_propose boolean DEFAULT true NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: team_members_calendar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_members_calendar (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL
);


--
-- Name: vision_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vision_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_id text NOT NULL,
    report_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    missing text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: calendar_contacts calendar_contacts_company_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_contacts
    ADD CONSTRAINT calendar_contacts_company_name_key UNIQUE (company_name);


--
-- Name: calendar_contacts calendar_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_contacts
    ADD CONSTRAINT calendar_contacts_pkey PRIMARY KEY (id);


--
-- Name: calendar_posts calendar_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_posts
    ADD CONSTRAINT calendar_posts_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: competencia_reports competencia_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competencia_reports
    ADD CONSTRAINT competencia_reports_pkey PRIMARY KEY (id);


--
-- Name: content_calendar_edits content_calendar_edits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_calendar_edits
    ADD CONSTRAINT content_calendar_edits_pkey PRIMARY KEY (id);


--
-- Name: content_calendar_responsibles content_calendar_responsibles_calendar_id_team_member_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_calendar_responsibles
    ADD CONSTRAINT content_calendar_responsibles_calendar_id_team_member_id_key UNIQUE (calendar_id, team_member_id);


--
-- Name: content_calendar_responsibles content_calendar_responsibles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_calendar_responsibles
    ADD CONSTRAINT content_calendar_responsibles_pkey PRIMARY KEY (id);


--
-- Name: content_calendars content_calendars_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_calendars
    ADD CONSTRAINT content_calendars_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: ecommerce_reports ecommerce_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ecommerce_reports
    ADD CONSTRAINT ecommerce_reports_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: proposals proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_pkey PRIMARY KEY (id);


--
-- Name: seguimiento_reports seguimiento_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seguimiento_reports
    ADD CONSTRAINT seguimiento_reports_pkey PRIMARY KEY (id);


--
-- Name: seo_web_reports seo_web_reports_case_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_web_reports
    ADD CONSTRAINT seo_web_reports_case_key_key UNIQUE (case_key);


--
-- Name: seo_web_reports seo_web_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_web_reports
    ADD CONSTRAINT seo_web_reports_pkey PRIMARY KEY (id);


--
-- Name: share_links share_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.share_links
    ADD CONSTRAINT share_links_pkey PRIMARY KEY (id);


--
-- Name: share_links share_links_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.share_links
    ADD CONSTRAINT share_links_token_key UNIQUE (token);


--
-- Name: team_members_calendar team_members_calendar_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members_calendar
    ADD CONSTRAINT team_members_calendar_email_key UNIQUE (email);


--
-- Name: team_members_calendar team_members_calendar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members_calendar
    ADD CONSTRAINT team_members_calendar_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: vision_reports vision_reports_case_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_reports
    ADD CONSTRAINT vision_reports_case_id_unique UNIQUE (case_id);


--
-- Name: vision_reports vision_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vision_reports
    ADD CONSTRAINT vision_reports_pkey PRIMARY KEY (id);


--
-- Name: idx_calendar_posts_calendar_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendar_posts_calendar_id ON public.calendar_posts USING btree (calendar_id);


--
-- Name: idx_content_calendar_edits_performed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_calendar_edits_performed_by ON public.content_calendar_edits USING btree (performed_by);


--
-- Name: idx_content_calendars_agencies; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_calendars_agencies ON public.content_calendars USING gin (agencies);


--
-- Name: idx_content_calendars_approval_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_content_calendars_approval_status ON public.content_calendars USING btree (approval_status);


--
-- Name: idx_proposals_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proposals_document_id ON public.proposals USING btree (document_id);


--
-- Name: idx_proposals_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_proposals_token ON public.proposals USING btree (token);


--
-- Name: idx_seo_web_reports_case_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_web_reports_case_key ON public.seo_web_reports USING btree (case_key);


--
-- Name: idx_seo_web_reports_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_seo_web_reports_status ON public.seo_web_reports USING btree (status);


--
-- Name: idx_share_links_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_share_links_token ON public.share_links USING btree (token);


--
-- Name: idx_vision_reports_case_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vision_reports_case_id ON public.vision_reports USING btree (case_id);


--
-- Name: calendar_contacts update_calendar_contacts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_calendar_contacts_updated_at BEFORE UPDATE ON public.calendar_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: calendar_posts update_calendar_posts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_calendar_posts_updated_at BEFORE UPDATE ON public.calendar_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: competencia_reports update_competencia_reports_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_competencia_reports_updated_at BEFORE UPDATE ON public.competencia_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: content_calendars update_content_calendars_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_content_calendars_updated_at BEFORE UPDATE ON public.content_calendars FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: documents update_documents_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ecommerce_reports update_ecommerce_reports_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ecommerce_reports_updated_at BEFORE UPDATE ON public.ecommerce_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: proposals update_proposals_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seguimiento_reports update_seguimiento_reports_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seguimiento_reports_updated_at BEFORE UPDATE ON public.seguimiento_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: seo_web_reports update_seo_web_reports_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_seo_web_reports_updated_at BEFORE UPDATE ON public.seo_web_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: vision_reports update_vision_reports_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_vision_reports_updated_at BEFORE UPDATE ON public.vision_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: calendar_posts calendar_posts_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendar_posts
    ADD CONSTRAINT calendar_posts_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES public.content_calendars(id) ON DELETE CASCADE;


--
-- Name: content_calendar_edits content_calendar_edits_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_calendar_edits
    ADD CONSTRAINT content_calendar_edits_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES public.content_calendars(id) ON DELETE CASCADE;


--
-- Name: content_calendar_responsibles content_calendar_responsibles_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_calendar_responsibles
    ADD CONSTRAINT content_calendar_responsibles_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES public.content_calendars(id) ON DELETE CASCADE;


--
-- Name: content_calendar_responsibles content_calendar_responsibles_team_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_calendar_responsibles
    ADD CONSTRAINT content_calendar_responsibles_team_member_id_fkey FOREIGN KEY (team_member_id) REFERENCES public.team_members_calendar(id) ON DELETE CASCADE;


--
-- Name: content_calendars content_calendars_calendar_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_calendars
    ADD CONSTRAINT content_calendars_calendar_contact_id_fkey FOREIGN KEY (calendar_contact_id) REFERENCES public.calendar_contacts(id) ON DELETE RESTRICT;


--
-- Name: documents documents_calendar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_calendar_id_fkey FOREIGN KEY (calendar_id) REFERENCES public.content_calendars(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: proposals proposals_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: seo_web_reports seo_web_reports_vision_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.seo_web_reports
    ADD CONSTRAINT seo_web_reports_vision_report_id_fkey FOREIGN KEY (vision_report_id) REFERENCES public.vision_reports(id) ON DELETE SET NULL;


--
-- Name: share_links share_links_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.share_links
    ADD CONSTRAINT share_links_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: clients Admins and managers can delete clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and managers can delete clients" ON public.clients FOR DELETE TO authenticated USING (((workspace_id = public.get_user_workspace(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role))));


--
-- Name: clients Admins and managers can insert clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and managers can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (((workspace_id = public.get_user_workspace(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role))));


--
-- Name: clients Admins and managers can update clients; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins and managers can update clients" ON public.clients FOR UPDATE TO authenticated USING (((workspace_id = public.get_user_workspace(auth.uid())) AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role))));


--
-- Name: team_members_calendar Admins can manage team_members_calendar; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage team_members_calendar" ON public.team_members_calendar TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: proposals Anyone can create proposals with valid token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create proposals with valid token" ON public.proposals FOR INSERT TO anon WITH CHECK ((EXISTS ( SELECT 1
   FROM public.share_links sl
  WHERE ((sl.token = proposals.token) AND (sl.can_propose = true) AND ((sl.expires_at IS NULL) OR (sl.expires_at > now()))))));


--
-- Name: proposals Anyone can update own proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update own proposals" ON public.proposals FOR UPDATE TO anon USING ((EXISTS ( SELECT 1
   FROM public.share_links sl
  WHERE ((sl.token = proposals.token) AND (sl.can_propose = true) AND ((sl.expires_at IS NULL) OR (sl.expires_at > now()))))));


--
-- Name: content_calendars Anyone can view calendar approval via share link; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view calendar approval via share link" ON public.content_calendars FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.share_links sl
     JOIN public.documents d ON ((d.id = sl.document_id)))
  WHERE ((d.calendar_id = content_calendars.id) AND (sl.can_view = true) AND ((sl.expires_at IS NULL) OR (sl.expires_at > now()))))));


--
-- Name: calendar_posts Anyone can view calendar_posts via share link; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view calendar_posts via share link" ON public.calendar_posts FOR SELECT TO anon USING ((EXISTS ( SELECT 1
   FROM (public.documents d
     JOIN public.share_links sl ON ((sl.document_id = d.id)))
  WHERE ((d.calendar_id = calendar_posts.calendar_id) AND (sl.can_view = true) AND ((sl.expires_at IS NULL) OR (sl.expires_at > now()))))));


--
-- Name: documents Anyone can view documents via share link; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view documents via share link" ON public.documents FOR SELECT TO anon USING ((EXISTS ( SELECT 1
   FROM public.share_links sl
  WHERE ((sl.document_id = documents.id) AND (sl.can_view = true) AND ((sl.expires_at IS NULL) OR (sl.expires_at > now()))))));


--
-- Name: proposals Anyone can view proposals via token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view proposals via token" ON public.proposals FOR SELECT TO anon USING ((EXISTS ( SELECT 1
   FROM public.share_links sl
  WHERE ((sl.token = proposals.token) AND ((sl.expires_at IS NULL) OR (sl.expires_at > now()))))));


--
-- Name: share_links Anyone can view valid share_links by token; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view valid share_links by token" ON public.share_links FOR SELECT TO anon USING (((can_view = true) AND ((expires_at IS NULL) OR (expires_at > now()))));


--
-- Name: calendar_contacts Authenticated users can delete calendar_contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete calendar_contacts" ON public.calendar_contacts FOR DELETE TO authenticated USING (true);


--
-- Name: competencia_reports Authenticated users can delete competencia_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete competencia_reports" ON public.competencia_reports FOR DELETE TO authenticated USING (true);


--
-- Name: content_calendars Authenticated users can delete content_calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete content_calendars" ON public.content_calendars FOR DELETE TO authenticated USING (true);


--
-- Name: ecommerce_reports Authenticated users can delete ecommerce_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete ecommerce_reports" ON public.ecommerce_reports FOR DELETE TO authenticated USING (true);


--
-- Name: seguimiento_reports Authenticated users can delete seguimiento reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete seguimiento reports" ON public.seguimiento_reports FOR DELETE TO authenticated USING (true);


--
-- Name: seo_web_reports Authenticated users can delete seo_web_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can delete seo_web_reports" ON public.seo_web_reports FOR DELETE USING (true);


--
-- Name: calendar_contacts Authenticated users can insert calendar_contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert calendar_contacts" ON public.calendar_contacts FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: competencia_reports Authenticated users can insert competencia_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert competencia_reports" ON public.competencia_reports FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: content_calendar_edits Authenticated users can insert content_calendar_edits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert content_calendar_edits" ON public.content_calendar_edits FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: content_calendars Authenticated users can insert content_calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert content_calendars" ON public.content_calendars FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: ecommerce_reports Authenticated users can insert ecommerce_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert ecommerce_reports" ON public.ecommerce_reports FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: seguimiento_reports Authenticated users can insert seguimiento reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert seguimiento reports" ON public.seguimiento_reports FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: seo_web_reports Authenticated users can insert seo_web_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can insert seo_web_reports" ON public.seo_web_reports FOR INSERT WITH CHECK (true);


--
-- Name: calendar_posts Authenticated users can manage calendar_posts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage calendar_posts" ON public.calendar_posts TO authenticated USING (true) WITH CHECK (true);


--
-- Name: content_calendar_responsibles Authenticated users can manage content_calendar_responsibles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage content_calendar_responsibles" ON public.content_calendar_responsibles TO authenticated USING (true);


--
-- Name: documents Authenticated users can manage documents; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage documents" ON public.documents USING (true) WITH CHECK (true);


--
-- Name: proposals Authenticated users can manage proposals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage proposals" ON public.proposals TO authenticated USING (true) WITH CHECK (true);


--
-- Name: share_links Authenticated users can manage share_links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage share_links" ON public.share_links TO authenticated USING (true) WITH CHECK (true);


--
-- Name: vision_reports Authenticated users can manage vision_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can manage vision_reports" ON public.vision_reports USING (true) WITH CHECK (true);


--
-- Name: calendar_contacts Authenticated users can update calendar_contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update calendar_contacts" ON public.calendar_contacts FOR UPDATE TO authenticated USING (true);


--
-- Name: competencia_reports Authenticated users can update competencia_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update competencia_reports" ON public.competencia_reports FOR UPDATE TO authenticated USING (true);


--
-- Name: content_calendars Authenticated users can update content_calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update content_calendars" ON public.content_calendars FOR UPDATE TO authenticated USING (true);


--
-- Name: ecommerce_reports Authenticated users can update ecommerce_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update ecommerce_reports" ON public.ecommerce_reports FOR UPDATE TO authenticated USING (true);


--
-- Name: seguimiento_reports Authenticated users can update seguimiento reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update seguimiento reports" ON public.seguimiento_reports FOR UPDATE TO authenticated USING (true);


--
-- Name: seo_web_reports Authenticated users can update seo_web_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can update seo_web_reports" ON public.seo_web_reports FOR UPDATE USING (true);


--
-- Name: calendar_contacts Authenticated users can view calendar_contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view calendar_contacts" ON public.calendar_contacts FOR SELECT TO authenticated USING (true);


--
-- Name: competencia_reports Authenticated users can view competencia_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view competencia_reports" ON public.competencia_reports FOR SELECT TO authenticated USING (true);


--
-- Name: content_calendar_edits Authenticated users can view content_calendar_edits; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view content_calendar_edits" ON public.content_calendar_edits FOR SELECT TO authenticated USING (true);


--
-- Name: content_calendar_responsibles Authenticated users can view content_calendar_responsibles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view content_calendar_responsibles" ON public.content_calendar_responsibles FOR SELECT TO authenticated USING (true);


--
-- Name: content_calendars Authenticated users can view content_calendars; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view content_calendars" ON public.content_calendars FOR SELECT TO authenticated USING (true);


--
-- Name: ecommerce_reports Authenticated users can view ecommerce_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view ecommerce_reports" ON public.ecommerce_reports FOR SELECT TO authenticated USING (true);


--
-- Name: seguimiento_reports Authenticated users can view seguimiento reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view seguimiento reports" ON public.seguimiento_reports FOR SELECT TO authenticated USING (true);


--
-- Name: seo_web_reports Authenticated users can view seo_web_reports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view seo_web_reports" ON public.seo_web_reports FOR SELECT USING (true);


--
-- Name: team_members_calendar Authenticated users can view team_members_calendar; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view team_members_calendar" ON public.team_members_calendar FOR SELECT TO authenticated USING (true);


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id));


--
-- Name: clients Users can view clients in their workspace; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view clients in their workspace" ON public.clients FOR SELECT TO authenticated USING ((workspace_id = public.get_user_workspace(auth.uid())));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: calendar_contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calendar_contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: calendar_posts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.calendar_posts ENABLE ROW LEVEL SECURITY;

--
-- Name: clients; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

--
-- Name: competencia_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.competencia_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: content_calendar_edits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_calendar_edits ENABLE ROW LEVEL SECURITY;

--
-- Name: content_calendar_responsibles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_calendar_responsibles ENABLE ROW LEVEL SECURITY;

--
-- Name: content_calendars; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_calendars ENABLE ROW LEVEL SECURITY;

--
-- Name: documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

--
-- Name: ecommerce_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ecommerce_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: proposals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

--
-- Name: seguimiento_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seguimiento_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: seo_web_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.seo_web_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: share_links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

--
-- Name: team_members_calendar; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.team_members_calendar ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: vision_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vision_reports ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;