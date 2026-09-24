-- ====================================================================
-- SPORTS STATION - SUPABASE DATABASE SCHEMA & SEED DATA
-- Panduan:
-- 1. Buka dashboard Supabase (https://supabase.com/dashboard)
-- 2. Pilih project kamu -> Klik menu "SQL Editor" di sidebar kiri
-- 3. Klik "New query" -> Paste seluruh isi file ini -> Klik "Run"
-- ====================================================================

-- 1. TABEL PRODUCTS (KATALOG PRODUK & STOK PER UKURAN)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    gender TEXT DEFAULT 'unisex',
    category TEXT NOT NULL,
    price BIGINT NOT NULL,
    original_price BIGINT,
    discount INTEGER DEFAULT 0,
    stock INTEGER DEFAULT 0,
    size_stock JSONB DEFAULT '{}'::jsonb,
    is_sale BOOLEAN DEFAULT false,
    tag TEXT DEFAULT '',
    rating NUMERIC(2,1) DEFAULT 4.8,
    reviews_count INTEGER DEFAULT 12,
    image TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_discount ON public.products(discount);
CREATE INDEX IF NOT EXISTS idx_products_tag ON public.products(tag);

-- 2. TABEL ORDERS (TRANSAKSI & MIDTRANS INTEGRATION)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    shipping_address TEXT,
    shipping_courier TEXT,
    tracking_number TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal BIGINT NOT NULL DEFAULT 0,
    shipping_cost BIGINT NOT NULL DEFAULT 0,
    total_amount BIGINT NOT NULL DEFAULT 0,
    payment_method TEXT DEFAULT 'Midtrans Payment Gateway',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    snap_token TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- 3. TABEL PROFILES (DATA PENGGUNA & ROLE)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    address TEXT,
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Products Policies
DROP POLICY IF EXISTS "Public can read products" ON public.products;
CREATE POLICY "Public can read products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert products" ON public.products;
CREATE POLICY "Allow insert products" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update products" ON public.products;
CREATE POLICY "Allow update products" ON public.products FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow delete products" ON public.products;
CREATE POLICY "Allow delete products" ON public.products FOR DELETE USING (true);

-- Orders Policies
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;
CREATE POLICY "Public can create orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can read orders" ON public.orders;
CREATE POLICY "Public can read orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can update orders" ON public.orders;
CREATE POLICY "Public can update orders" ON public.orders FOR UPDATE USING (true);

-- Profiles Policies
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Public can view profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can insert profiles" ON public.profiles;
CREATE POLICY "Public can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update profiles" ON public.profiles;
CREATE POLICY "Public can update profiles" ON public.profiles FOR UPDATE USING (true);

-- 5. FUNCTION TRIGGER AUTO-UPDATE updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON public.orders;
CREATE TRIGGER trigger_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ====================================================================
-- 6. SEED DATA: 52 PRODUK OTENTIK SPORTS STATION INDONESIA
-- ====================================================================
INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'nike-pegasus-plus',
    'Nike Pegasus Plus Men''s Road Running Shoes',
    'nike',
    'men',
    'running',
    2499000,
    2499000,
    0,
    48,
    '{"39":6,"40":10,"41":14,"42":12,"43":4,"44":2}'::jsonb,
    false,
    'NEW',
    'Asset/Sepatu/Nike/Men/Running/NIKE+PEGASUS+PLUS+2.avif',
    '2026-09-24T08:55:33.348Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'nike-zoom-fly-6',
    'Nike Zoom Fly 6 Men''s Road Racing Shoes',
    'nike',
    'men',
    'running',
    2699000,
    2699000,
    0,
    35,
    '{"39":5,"40":8,"41":10,"42":8,"43":4}'::jsonb,
    false,
    'NEW',
    'Asset/Sepatu/Nike/Men/Running/ZOOM+FLY+6.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'nike-vomero-plus-cm',
    'Nike Vomero Plus Men''s Running Shoes - Obsidian',
    'nike',
    'men',
    'running',
    1149500,
    2299000,
    50,
    14,
    '{"40":3,"41":6,"42":4,"43":1}'::jsonb,
    true,
    'SALE',
    'Asset/Sepatu/Nike/Men/Running/NIKE+VOMERO+PLUS+CM.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'nike-structure-plus',
    'Nike Structure Plus Men''s Road Running Shoes - Platinum',
    'nike',
    'men',
    'running',
    974500,
    1949000,
    50,
    10,
    '{"39":2,"40":4,"41":3,"42":1}'::jsonb,
    true,
    'SALE',
    'Asset/Sepatu/Nike/Men/Running/NIKE+STRUCTURE+PLUS.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'nike-alphafly-4',
    'Nike Alphafly 4 Men''s Marathon Racing Shoes',
    'nike',
    'men',
    'running',
    4099000,
    4099000,
    0,
    18,
    '{"40":4,"41":6,"42":5,"43":3}'::jsonb,
    false,
    'LIMITED',
    'Asset/Sepatu/Nike/Men/Running/Alphafly4.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'nike-w-pegasus-42',
    'W Nike Air Zoom Pegasus 42 Women''s Running Shoes',
    'nike',
    'women',
    'running',
    2099000,
    2099000,
    0,
    32,
    '{"36":4,"37":8,"38":10,"39":6,"40":4}'::jsonb,
    false,
    'NEW',
    'Asset/Sepatu/Nike/Woman/Running/W+NIKE+AIR+ZOOM+PEGASUS+42.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'nike-w-pegasus-easyon',
    'W Pegasus 42 EasyOn Women''s Running Shoes',
    'nike',
    'women',
    'running',
    1049500,
    2099000,
    50,
    16,
    '{"36":2,"37":4,"38":6,"39":3,"40":1}'::jsonb,
    true,
    'SALE',
    'Asset/Sepatu/Nike/Woman/Running/W+PEGASUS+42+EASYON.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'nike-w-vomero-18',
    'W Nike Vomero 18 Women''s Road Running Shoes',
    'nike',
    'women',
    'running',
    2299000,
    2299000,
    0,
    24,
    '{"36":3,"37":6,"38":8,"39":5,"40":2}'::jsonb,
    false,
    'NEW',
    'Asset/Sepatu/Nike/Woman/Running/W+NIKE+VOMERO+18.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'nike-court-vision-low',
    'Nike Court Vision Low Men''s Sneakers',
    'nike',
    'men',
    'lifestyle',
    719400,
    1199000,
    40,
    45,
    '{"39":8,"40":12,"41":14,"42":8,"43":3}'::jsonb,
    true,
    'BEST SELLER',
    'Asset/Sepatu/Nike/Men/Running/NIKE+PEGASUS+PLUS+2.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'jordan-stay-loyal-3',
    'Jordan Stay Loyal 3 Men''s Basketball Shoes',
    'nike',
    'men',
    'basketball',
    1799000,
    1799000,
    0,
    20,
    '{"40":4,"41":6,"42":6,"43":4}'::jsonb,
    false,
    'HOT',
    'Asset/Sepatu/Nike/Men/Running/ZOOM+FLY+6.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'nike-pro-sports-bra',
    'Nike Pro Dri-FIT Women''s Medium-Support Sports Bra',
    'nike',
    'women',
    'sports-bra',
    499000,
    499000,
    0,
    36,
    '{"XS":4,"S":10,"M":12,"L":7,"XL":3}'::jsonb,
    false,
    'BEST SELLER',
    'Asset/Logo/logo.png',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'nike-dri-fit-challenger-shorts',
    'Nike Dri-FIT Challenger Men''s 7" Running Shorts',
    'nike',
    'men',
    'shorts',
    429000,
    429000,
    0,
    40,
    '{"S":8,"M":14,"L":12,"XL":6}'::jsonb,
    false,
    'NEW',
    'Asset/Logo/logo.png',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'nike-club-fleece-jacket',
    'Nike Sportswear Club Fleece Full-Zip Jacket',
    'nike',
    'men',
    'jacket',
    849000,
    849000,
    0,
    22,
    '{"S":4,"M":8,"L":7,"XL":3}'::jsonb,
    false,
    'NEW',
    'Asset/Logo/logo.png',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'nike-heritage-backpack',
    'Nike Heritage Eugene Sport Backpack (23L)',
    'nike',
    'unisex',
    'bags',
    499000,
    499000,
    0,
    25,
    '{"All Size":25}'::jsonb,
    false,
    'NEW',
    'Asset/Logo/logo.png',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'nike-everyday-socks-3pack',
    'Nike Everyday Cushion Ankle Socks (3-Pack)',
    'nike',
    'unisex',
    'socks',
    199000,
    199000,
    0,
    45,
    '{"M":20,"L":25}'::jsonb,
    false,
    'BEST SELLER',
    'Asset/Logo/logo.png',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'skechers-arya-womens',
    'Skechers Arya Women''s Slip-On Shoes',
    'skechers',
    'women',
    'lifestyle',
    649500,
    1299000,
    50,
    28,
    '{"36":4,"37":8,"38":8,"39":5,"40":3}'::jsonb,
    true,
    'SALE',
    'Asset/Sepatu/Nike/Woman/Running/W+NIKE+AIR+ZOOM+PEGASUS+42.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'skechers-ultra-flex-sandal',
    'Skechers Ultra Flex 3.0 Women''s Comfort Sandals',
    'skechers',
    'women',
    'sandals',
    429500,
    859000,
    50,
    22,
    '{"36":3,"37":6,"38":7,"39":4,"40":2}'::jsonb,
    true,
    'SALE',
    'Asset/Sepatu/Nike/Woman/Running/W+PEGASUS+42+EASYON.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'skechers-bobs-squad-waves',
    'Skechers Bobs Squad Waves Women''s Sneakers - Taupe',
    'skechers',
    'women',
    'lifestyle',
    687200,
    859000,
    20,
    30,
    '{"36":4,"37":8,"38":10,"39":6,"40":2}'::jsonb,
    true,
    'NEW',
    'Asset/Sepatu/Nike/Woman/Running/W+NIKE+VOMERO+18.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'skechers-gowalk-max-men',
    'Skechers GOwalk Max Men''s Athletic Walking Shoes',
    'skechers',
    'men',
    'lifestyle',
    899000,
    899000,
    0,
    35,
    '{"39":4,"40":8,"41":12,"42":8,"43":3}'::jsonb,
    false,
    'BEST SELLER',
    'Asset/Sepatu/Nike/Men/Running/NIKE+VOMERO+PLUS.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'skechers-dynamatic-girls',
    'Skechers Dynamatic Girl''s Road Running Shoes',
    'skechers',
    'kids',
    'running',
    399000,
    399000,
    0,
    25,
    '{"30":4,"31":5,"32":6,"33":6,"34":4}'::jsonb,
    false,
    'NEW',
    'Asset/Sepatu/Nike/Woman/Running/W+PEGASUS+42+EASYON.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'skechers-backpack-unisex',
    'Skechers Sport Unisex Daily Backpack (20L)',
    'skechers',
    'unisex',
    'bags',
    399000,
    399000,
    0,
    30,
    '{"All Size":30}'::jsonb,
    false,
    'NEW',
    'Asset/Logo/logo.png',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'skechers-lowcut-socks-3pk',
    'Skechers Men 3-Pack Low Cut Performance Socks',
    'skechers',
    'men',
    'socks',
    79000,
    79000,
    0,
    60,
    '{"M":30,"L":30}'::jsonb,
    false,
    'NEW',
    'Asset/Logo/logo.png',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'adidas-treadmove-men',
    'Adidas Treadmove Men''s Road Running Shoes',
    'adidas',
    'men',
    'running',
    325000,
    650000,
    50,
    26,
    '{"39":4,"40":7,"41":8,"42":5,"43":2}'::jsonb,
    true,
    'SALE',
    'Asset/Sepatu/Nike/Men/Running/NIKE+STRUCTURE+PLUS.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'adidas-switch-move-men',
    'Adidas Switch Move Men''s Running Shoes - Core Black',
    'adidas',
    'men',
    'running',
    390000,
    650000,
    40,
    30,
    '{"40":6,"41":10,"42":10,"43":4}'::jsonb,
    true,
    'SALE',
    'Asset/Sepatu/Nike/Men/Running/ZOOM+FLY+6.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'adidas-runfalcon-5-womens',
    'Adidas Runfalcon 5 Women''s Running Shoes - Black',
    'adidas',
    'women',
    'running',
    490000,
    700000,
    30,
    28,
    '{"36":4,"37":7,"38":9,"39":5,"40":3}'::jsonb,
    true,
    'NEW',
    'Asset/Sepatu/Nike/Woman/Running/W+NIKE+AIR+ZOOM+PEGASUS+42.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'adidas-tiro-24-pants',
    'Adidas Tiro 24 Track Pants (Celana Training)',
    'adidas',
    'unisex',
    'pants',
    699000,
    699000,
    0,
    32,
    '{"S":6,"M":12,"L":10,"XL":4}'::jsonb,
    false,
    'BEST SELLER',
    'Asset/Logo/logo.png',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'adidas-essentials-3s-tee',
    'Adidas Essentials 3-Stripes Tee Men''s',
    'adidas',
    'men',
    'tshirt',
    349000,
    349000,
    0,
    40,
    '{"S":8,"M":16,"L":12,"XL":4}'::jsonb,
    false,
    'NEW',
    'Asset/Logo/logo.png',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'puma-interflex-modern',
    'Puma INTERFLEX Modern Men''s Running Shoes',
    'puma',
    'men',
    'running',
    299500,
    599000,
    50,
    20,
    '{"39":3,"40":6,"41":6,"42":4,"43":1}'::jsonb,
    true,
    'SALE',
    'Asset/Sepatu/Nike/Men/Running/NIKE+VOMERO+PLUS.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'puma-softride-clean-v2',
    'Puma Softride Clean V2 Men''s Cushion Running Shoes',
    'puma',
    'men',
    'running',
    349500,
    699000,
    50,
    18,
    '{"40":4,"41":6,"42":5,"43":3}'::jsonb,
    true,
    'SALE',
    'Asset/Sepatu/Nike/Men/Running/NIKE+PEGASUS+PLUS+2.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'puma-flyer-lite-3',
    'Puma Flyer Lite 3 Men''s Performance Running Shoes',
    'puma',
    'men',
    'running',
    479400,
    799000,
    40,
    25,
    '{"40":5,"41":8,"42":8,"43":4}'::jsonb,
    true,
    'HOT',
    'Asset/Sepatu/Nike/Men/Running/ZOOM+FLY+6.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'puma-classic-logo-tee',
    'Puma Classics Men''s Sport Logo T-Shirt',
    'puma',
    'men',
    'tshirt',
    299000,
    349000,
    14,
    50,
    '{"S":10,"M":18,"L":14,"XL":8}'::jsonb,
    true,
    'NEW',
    'Asset/Logo/logo.png',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'puma-tr-sport-bottle',
    'Puma Sport Training Water Bottle (750ml)',
    'puma',
    'unisex',
    'bottles',
    159000,
    159000,
    0,
    40,
    '{"All Size":40}'::jsonb,
    false,
    'NEW',
    'Asset/Logo/logo.png',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'nb-460-v4-men',
    'New Balance 460 v4 Men''s Road Running Shoes',
    'new-balance',
    'men',
    'running',
    549500,
    1099000,
    50,
    22,
    '{"39":3,"40":6,"41":7,"42":4,"43":2}'::jsonb,
    true,
    'SALE',
    'Asset/Sepatu/Nike/Men/Running/NIKE+STRUCTURE+PLUS.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'nb-411-v4-women',
    'New Balance 411v4 Women''s Running Shoes - Grey',
    'new-balance',
    'women',
    'running',
    719200,
    899000,
    20,
    26,
    '{"36":3,"37":7,"38":8,"39":5,"40":3}'::jsonb,
    true,
    'NEW',
    'Asset/Sepatu/Nike/Woman/Running/W+NIKE+VOMERO+18.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'nb-tektrel-trail',
    'New Balance Tektrel Trail Men''s Outdoor Running Shoes',
    'new-balance',
    'men',
    'running',
    749500,
    1499000,
    50,
    16,
    '{"40":3,"41":6,"42":5,"43":2}'::jsonb,
    true,
    'SALE',
    'Asset/Sepatu/Nike/Men/Running/NIKE+PEGASUS+PLUS+2.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'reebok-zig-dynamica-6',
    'Reebok Zig Dynamica 6 Men''s Performance Running Shoes',
    'reebok',
    'men',
    'running',
    649500,
    1299000,
    50,
    20,
    '{"39":2,"40":6,"41":7,"42":4,"43":1}'::jsonb,
    true,
    'SALE',
    'Asset/Sepatu/Reebok-Pulse-Core.png',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'reebok-mundo-men',
    'Reebok Mundo Men''s Road Running Shoes',
    'reebok',
    'men',
    'running',
    399500,
    799000,
    50,
    24,
    '{"40":5,"41":8,"42":8,"43":3}'::jsonb,
    true,
    'SALE',
    'Asset/Sepatu/Reebok-Pulse-Core.png',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'reebok-court-advance-vulc',
    'Reebok Court Advance Vulc Men''s Classic Sneakers',
    'reebok',
    'men',
    'lifestyle',
    419300,
    599000,
    30,
    35,
    '{"39":5,"40":10,"41":10,"42":7,"43":3}'::jsonb,
    true,
    'NEW',
    'Asset/Sepatu/Reebok-Pulse-Core.png',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'converse-day-one-platform',
    'Converse Day One Platform Women''s Lifestyle Sneakers',
    'converse',
    'women',
    'lifestyle',
    379500,
    759000,
    50,
    25,
    '{"36":4,"37":7,"38":8,"39":4,"40":2}'::jsonb,
    true,
    'SALE',
    'Asset/Sepatu/Nike/Woman/Running/W+PEGASUS+42+EASYON.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'converse-day-one-court',
    'Converse Day One Court Unisex Sneakers',
    'converse',
    'unisex',
    'lifestyle',
    299500,
    599000,
    50,
    30,
    '{"38":5,"39":8,"40":8,"41":6,"42":3}'::jsonb,
    true,
    'SALE',
    'Asset/Sepatu/Nike/Men/Running/NIKE+STRUCTURE+PLUS.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'converse-kids-go-bag',
    'Converse Kids Go Boy''s Sport Backpack',
    'converse',
    'kids',
    'bags',
    249500,
    499000,
    50,
    20,
    '{"All Size":20}'::jsonb,
    true,
    'SALE',
    'Asset/Logo/logo.png',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'diadora-rayna-men',
    'Diadora Rayna Men''s Road Running Shoes',
    'diadora',
    'men',
    'running',
    249500,
    499000,
    50,
    30,
    '{"39":5,"40":10,"41":8,"42":5,"43":2}'::jsonb,
    true,
    'SALE',
    'Asset/Sepatu/Nike/Men/Running/NIKE+PEGASUS+PLUS+2.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'diadora-niles-2-men',
    'Diadora Niles 2 Men''s Running Shoes - Dark Navy',
    'diadora',
    'men',
    'running',
    399500,
    799000,
    50,
    25,
    '{"40":6,"41":8,"42":7,"43":4}'::jsonb,
    true,
    'SALE',
    'Asset/Sepatu/Nike/Men/Running/ZOOM+FLY+6.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'diadora-spinta-men',
    'Diadora Spinta Performance Men''s Athletic Shoes',
    'diadora',
    'men',
    'running',
    447200,
    559000,
    20,
    28,
    '{"39":4,"40":8,"41":8,"42":5,"43":3}'::jsonb,
    true,
    'NEW',
    'Asset/Sepatu/Nike/Men/Running/NIKE+VOMERO+PLUS+CM.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'astec-nuclear-womens',
    'Astec Nuclear Women''s Badminton Shoes - White',
    'astec',
    'women',
    'badminton',
    479400,
    799000,
    40,
    24,
    '{"36":4,"37":6,"38":8,"39":4,"40":2}'::jsonb,
    true,
    'NEW',
    'Asset/Sepatu/Nike/Woman/Running/W+NIKE+AIR+ZOOM+PEGASUS+42.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'astec-mythos-womens',
    'Astec Mythos Women''s Badminton Shoes - Sky Blue',
    'astec',
    'women',
    'badminton',
    607200,
    759000,
    20,
    22,
    '{"36":3,"37":6,"38":7,"39":4,"40":2}'::jsonb,
    true,
    'NEW',
    'Asset/Sepatu/Nike/Woman/Running/W+NIKE+VOMERO+18.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'astec-nero-men',
    'Astec Nero Men''s Court Badminton Shoes',
    'astec',
    'men',
    'badminton',
    479200,
    599000,
    20,
    32,
    '{"39":4,"40":10,"41":10,"42":6,"43":2}'::jsonb,
    true,
    'BEST SELLER',
    'Asset/Sepatu/Nike/Men/Running/NIKE+STRUCTURE+PLUS.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'airwalk-galaxy-men',
    'Airwalk Galaxy Men''s Skateboard Lifestyle Shoes',
    'airwalk',
    'men',
    'lifestyle',
    391300,
    559000,
    30,
    35,
    '{"39":5,"40":10,"41":10,"42":7,"43":3}'::jsonb,
    true,
    'NEW',
    'Asset/Sepatu/Nike/Men/Running/NIKE+VOMERO+PLUS.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'airwalk-legian-sandals',
    'Airwalk Legian Men''s Casual Comfort Sandals',
    'airwalk',
    'men',
    'sandals',
    229000,
    329000,
    30,
    28,
    '{"39":5,"40":8,"41":8,"42":5,"43":2}'::jsonb,
    true,
    'NEW',
    'Asset/Sepatu/Nike/Men/Running/NIKE+PEGASUS+PLUS+2.avif',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'spalding-tf-150-ball',
    'Spalding TF-150 Outdoor Rubber Basketball (Size 7)',
    'spalding',
    'unisex',
    'basketball',
    359000,
    359000,
    0,
    30,
    '{"All Size":30}'::jsonb,
    false,
    'BEST SELLER',
    'Asset/Logo/logo.png',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'prince-tour-team-bag',
    'Prince Tour Team 6 Pack Performance Tennis Bag',
    'prince',
    'unisex',
    'bags',
    719200,
    899000,
    20,
    15,
    '{"All Size":15}'::jsonb,
    true,
    'NEW',
    'Asset/Logo/logo.png',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

INSERT INTO public.products (
    id, name, brand, gender, category, price, original_price, discount, stock, size_stock, is_sale, tag, image, created_at
) VALUES (
    'gildan-softstyle-tee',
    'Gildan Softstyle Unisex Sport T-Shirt',
    'gildan',
    'unisex',
    'tshirt',
    79000,
    79000,
    0,
    50,
    '{"S":10,"M":20,"L":15,"XL":5}'::jsonb,
    false,
    'NEW',
    'Asset/Logo/logo.png',
    '2026-09-24T08:55:33.349Z'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    gender = EXCLUDED.gender,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    discount = EXCLUDED.discount,
    stock = EXCLUDED.stock,
    size_stock = EXCLUDED.size_stock,
    is_sale = EXCLUDED.is_sale,
    tag = EXCLUDED.tag,
    image = EXCLUDED.image;

