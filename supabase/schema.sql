-- Digital Muse Supabase Database Schema

-- 1. Museums Registry Table
CREATE TABLE IF NOT EXISTS public.museums (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    vernacular_names JSONB,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    category TEXT NOT NULL,
    governance TEXT NOT NULL,
    opening_hours JSONB NOT NULL,
    entry_fee JSONB NOT NULL,
    accessibility_features TEXT[],
    contact JSONB,
    thumbnail_url TEXT,
    gallery_urls TEXT[],
    description TEXT NOT NULL,
    artifact_count_approx INTEGER,
    muse_collection_id TEXT,
    featured_artifacts TEXT[],
    source TEXT,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Artifacts & Claim Ledgers Table
CREATE TABLE IF NOT EXISTS public.artifacts (
    id TEXT PRIMARY KEY,
    museum_name TEXT NOT NULL,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    curator_alt_text TEXT,
    period TEXT NOT NULL,
    material TEXT NOT NULL,
    culture TEXT NOT NULL,
    provenance_line TEXT NOT NULL,
    canonical_text TEXT NOT NULL,
    sensitivity_flags TEXT[],
    content_notice_text TEXT,
    claims JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Roots & PIN Code Discoveries Table
CREATE TABLE IF NOT EXISTS public.user_roots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pincode TEXT NOT NULL,
    city TEXT,
    state TEXT,
    cultural_roots TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.museums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roots ENABLE ROW LEVEL SECURITY;

-- Allow public read access to museums and artifacts
CREATE POLICY "Public Read Museums" ON public.museums FOR SELECT USING (true);
CREATE POLICY "Public Read Artifacts" ON public.artifacts FOR SELECT USING (true);

-- Allow public insert to user_roots
CREATE POLICY "Public Insert User Roots" ON public.user_roots FOR INSERT WITH CHECK (true);
