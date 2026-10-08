-- Flower Business Supabase Schema Setup

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Products / Flowers Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    image_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Customer Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    delivery_address TEXT NOT NULL,
    delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 7. Policies: Anyone can view active categories and products
CREATE POLICY "Allow public read access on categories" 
    ON public.categories FOR SELECT USING (true);

CREATE POLICY "Allow public read access on products" 
    ON public.products FOR SELECT USING (true);

-- 8. Policies: Customers can view their own orders
CREATE POLICY "Allow users to view their own orders" 
    ON public.orders FOR SELECT 
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Allow public insert of orders" 
    ON public.orders FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow users to view their order items" 
    ON public.order_items FOR SELECT 
    USING (true);

CREATE POLICY "Allow public insert of order items" 
    ON public.order_items FOR INSERT 
    WITH CHECK (true);

-- 9. Sample Initial Seed Data
INSERT INTO public.categories (name, slug, description) VALUES
('Bouquets', 'bouquets', 'Handcrafted fresh floral arrangements for all occasions'),
('Roses', 'roses', 'Classic, elegant roses in vibrant colors'),
('Indoor Plants', 'indoor-plants', 'Potted plants, succulents, and greenery for home or office'),
('Occasions', 'occasions', 'Curated collections for birthdays, anniversaries, and weddings')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (category_id, name, slug, description, price, stock_quantity, image_url, is_featured)
SELECT 
    id, 
    'Royal Velvet Red Rose Bouquet', 
    'royal-velvet-red-rose-bouquet', 
    'A breathtaking arrangement of 24 premium long-stemmed red roses tied with satin ribbon.', 
    65.00, 
    25, 
    'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80', 
    true
FROM public.categories WHERE slug = 'roses'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (category_id, name, slug, description, price, stock_quantity, image_url, is_featured)
SELECT 
    id, 
    'Spring Sunburst Mixed Bouquet', 
    'spring-sunburst-mixed-bouquet', 
    'Bright sunflowers, yellow daisies, and seasonal wildflower accents bring instant warmth.', 
    48.50, 
    18, 
    'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80', 
    true
FROM public.categories WHERE slug = 'bouquets'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (category_id, name, slug, description, price, stock_quantity, image_url, is_featured)
SELECT 
    id, 
    'Pastel Orchid Elegance', 
    'pastel-orchid-elegance', 
    'Graceful white and soft pink Phalaenopsis orchids potted in a ceramic planter.', 
    55.00, 
    12, 
    'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=800&q=80', 
    true
FROM public.categories WHERE slug = 'indoor-plants'
ON CONFLICT (slug) DO NOTHING;
