import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function sku(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

// Placeholder product images from picsum (deterministic by seed id)
function images(seed: number, count = 2) {
  return Array.from({ length: count }, (_, i) => ({
    url: `https://picsum.photos/seed/${seed + i}/800/800`,
    alt: `Product image ${i + 1}`,
    order: i,
  }));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Seeding database…");

  // ── 1. Categories ────────────────────────────────────────────────────────────

  const catElectronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: {},
    create: { name: "Electronics", slug: "electronics", icon: "💻" },
  });

  const catCosmetics = await prisma.category.upsert({
    where: { slug: "cosmetics" },
    update: {},
    create: { name: "Cosmetics", slug: "cosmetics", icon: "💄" },
  });

  const catClothes = await prisma.category.upsert({
    where: { slug: "clothes" },
    update: {},
    create: { name: "Clothes", slug: "clothes", icon: "👗" },
  });

  // Sub-categories
  const subSmartphones = await prisma.category.upsert({
    where: { slug: "smartphones" },
    update: {},
    create: {
      name: "Smartphones",
      slug: "smartphones",
      icon: "📱",
      parentId: catElectronics.id,
    },
  });

  const subLaptops = await prisma.category.upsert({
    where: { slug: "laptops" },
    update: {},
    create: {
      name: "Laptops",
      slug: "laptops",
      icon: "💻",
      parentId: catElectronics.id,
    },
  });

  const subSkincare = await prisma.category.upsert({
    where: { slug: "skincare" },
    update: {},
    create: {
      name: "Skincare",
      slug: "skincare",
      icon: "🧴",
      parentId: catCosmetics.id,
    },
  });

  const subMakeup = await prisma.category.upsert({
    where: { slug: "makeup" },
    update: {},
    create: {
      name: "Makeup",
      slug: "makeup",
      icon: "💋",
      parentId: catCosmetics.id,
    },
  });

  const subMenswear = await prisma.category.upsert({
    where: { slug: "menswear" },
    update: {},
    create: {
      name: "Menswear",
      slug: "menswear",
      icon: "👔",
      parentId: catClothes.id,
    },
  });

  const subWomenswear = await prisma.category.upsert({
    where: { slug: "womenswear" },
    update: {},
    create: {
      name: "Womenswear",
      slug: "womenswear",
      icon: "👗",
      parentId: catClothes.id,
    },
  });

  console.log("✅  Categories created");

  // ── 2. Admin user ────────────────────────────────────────────────────────────

  const adminHash = await bcrypt.hash("Admin@12345", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@store.com" },
    update: {},
    create: {
      name: "Store Admin",
      firstName: "Store",
      lastName: "Admin",
      email: "admin@store.com",
      passwordHash: adminHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  // ── 3. Seller user + profile ─────────────────────────────────────────────────

  const sellerHash = await bcrypt.hash("Seller@12345", 12);
  const sellerUser = await prisma.user.upsert({
    where: { email: "seller@store.com" },
    update: {},
    create: {
      name: "Demo Seller",
      firstName: "Demo",
      lastName: "Seller",
      email: "seller@store.com",
      passwordHash: sellerHash,
      role: "SELLER",
      emailVerified: new Date(),
    },
  });

  const seller = await prisma.seller.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      storeName: "TechMart Nepal",
      storeSlug: "techmart-nepal",
      description: "Your one-stop shop for electronics, fashion, and beauty.",
      logo: "https://picsum.photos/seed/store/200/200",
      banner: "https://picsum.photos/seed/storebanner/1200/300",
      isVerified: true,
      rating: 4.5,
      totalSales: 320,
    },
  });

  console.log("✅  Users & seller created");
  console.log(`   Admin   → admin@store.com  / Admin@12345`);
  console.log(`   Seller  → seller@store.com / Seller@12345`);

  // ── 4. Products ──────────────────────────────────────────────────────────────
  // Helper to create a product with images and tags

  async function createProduct(data: {
    name: string;
    shortDesc: string;
    description: string;
    basePrice: number;
    comparePrice?: number;
    stock: number;
    isFlashSale?: boolean;
    isFeatured?: boolean;
    freeShipping?: boolean;
    isEco?: boolean;
    hasVariants?: boolean;
    categoryId: string;
    tags: string[];
    imageSeed: number;
    skuPrefix: string;
    skuNum: number;
    variants?: {
      name: string;
      price: number;
      comparePrice?: number;
      stock: number;
      attributes: Record<string, string>;
    }[];
  }) {
    const productSlug = slug(data.name);

    // Skip if already exists (idempotent re-runs)
    const existing = await prisma.product.findUnique({
      where: { slug: productSlug },
    });
    if (existing) return existing;

    return prisma.product.create({
      data: {
        name: data.name,
        slug: productSlug,
        shortDesc: data.shortDesc,
        description: data.description,
        basePrice: data.basePrice,
        comparePrice: data.comparePrice ?? null,
        currency: "NPR",
        stock: data.stock,
        sku: sku(data.skuPrefix, data.skuNum),
        isEco: data.isEco ?? false,
        isFlashSale: data.isFlashSale ?? false,
        flashSaleEndsAt: data.isFlashSale
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
          : null,
        freeShipping: data.freeShipping ?? false,
        isFeatured: data.isFeatured ?? false,
        isActive: true,
        hasVariants: data.hasVariants ?? false,
        averageRating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // 3.0–5.0
        totalReviews: Math.floor(Math.random() * 80 + 5),
        totalSales: Math.floor(Math.random() * 200 + 10),
        categoryId: data.categoryId,
        sellerId: seller.id,
        images: { create: images(data.imageSeed, 3) },
        tags: { create: data.tags.map((tag) => ({ tag })) },
        variants: data.variants
          ? {
              create: data.variants.map((v) => ({
                name: v.name,
                price: v.price,
                comparePrice: v.comparePrice ?? null,
                stock: v.stock,
                attributes: v.attributes,
              })),
            }
          : undefined,
      },
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  ELECTRONICS
  // ════════════════════════════════════════════════════════════════════════════

  // 1. In Stock — Smartphone
  await createProduct({
    name: "Samsung Galaxy S24 Ultra",
    shortDesc: "Flagship Android smartphone with 200MP camera",
    description:
      "Experience the pinnacle of mobile technology with the Samsung Galaxy S24 Ultra. Featuring a 6.8-inch Dynamic AMOLED 2X display, 200MP quad-camera system, built-in S Pen, and the powerful Snapdragon 8 Gen 3 processor.",
    basePrice: 185000,
    stock: 45,
    isFeatured: true,
    freeShipping: true,
    categoryId: subSmartphones.id,
    tags: ["smartphone", "samsung", "5g", "android", "flagship"],
    imageSeed: 10,
    skuPrefix: "ELEC",
    skuNum: 1,
    hasVariants: true,
    variants: [
      { name: "256GB Titanium Black", price: 185000, stock: 20, attributes: { storage: "256GB", color: "Titanium Black" } },
      { name: "512GB Titanium Gray", price: 205000, stock: 15, attributes: { storage: "512GB", color: "Titanium Gray" } },
      { name: "1TB Titanium Yellow", price: 235000, stock: 10, attributes: { storage: "1TB", color: "Titanium Yellow" } },
    ],
  });

  // 2. Sale — Smartphone
  await createProduct({
    name: "iPhone 15 Pro Max",
    shortDesc: "Apple's most powerful iPhone with titanium design",
    description:
      "The iPhone 15 Pro Max features a titanium frame, A17 Pro chip, 48MP main camera with 5× optical zoom, and USB 3 speeds via USB-C. Now on sale — don't miss out!",
    basePrice: 195000,
    comparePrice: 225000,
    stock: 30,
    isFlashSale: true,
    isFeatured: true,
    freeShipping: true,
    categoryId: subSmartphones.id,
    tags: ["smartphone", "iphone", "apple", "sale", "ios"],
    imageSeed: 20,
    skuPrefix: "ELEC",
    skuNum: 2,
    hasVariants: true,
    variants: [
      { name: "256GB Natural Titanium", price: 195000, comparePrice: 225000, stock: 10, attributes: { storage: "256GB", color: "Natural Titanium" } },
      { name: "512GB Black Titanium",   price: 215000, comparePrice: 245000, stock: 12, attributes: { storage: "512GB", color: "Black Titanium" } },
      { name: "1TB White Titanium",     price: 245000, comparePrice: 275000, stock: 8,  attributes: { storage: "1TB",   color: "White Titanium" } },
    ],
  });

  // 3. Out of Stock — Smartphone
  await createProduct({
    name: "Google Pixel 8 Pro",
    shortDesc: "Pure Android experience with AI-powered camera",
    description:
      "The Pixel 8 Pro brings Google's best AI features to your pocket. Features the Tensor G3 chip, 50MP triple camera, and 7 years of OS updates. Currently out of stock — add to wishlist!",
    basePrice: 145000,
    comparePrice: 160000,
    stock: 0,
    categoryId: subSmartphones.id,
    tags: ["smartphone", "google", "pixel", "android", "out-of-stock"],
    imageSeed: 30,
    skuPrefix: "ELEC",
    skuNum: 3,
  });

  // 4. New Arrival — Laptop
  await createProduct({
    name: "MacBook Pro 14 M4 Pro",
    shortDesc: "Apple silicon powerhouse for professionals",
    description:
      "Brand new arrival! The MacBook Pro 14-inch with M4 Pro chip delivers up to 24-core GPU performance, up to 64GB unified memory, and an incredible Liquid Retina XDR display. Perfect for developers, designers, and creators.",
    basePrice: 375000,
    stock: 15,
    isFeatured: true,
    freeShipping: true,
    categoryId: subLaptops.id,
    tags: ["laptop", "macbook", "apple", "m4", "new-arrival", "professional"],
    imageSeed: 40,
    skuPrefix: "ELEC",
    skuNum: 4,
    hasVariants: true,
    variants: [
      { name: "M4 Pro 24GB 512GB Silver",    price: 375000, stock: 5, attributes: { chip: "M4 Pro", ram: "24GB", storage: "512GB", color: "Silver" } },
      { name: "M4 Pro 24GB 1TB Space Black", price: 420000, stock: 5, attributes: { chip: "M4 Pro", ram: "24GB", storage: "1TB",   color: "Space Black" } },
      { name: "M4 Max 48GB 1TB Silver",      price: 550000, stock: 5, attributes: { chip: "M4 Max", ram: "48GB", storage: "1TB",   color: "Silver" } },
    ],
  });

  // 5. In Stock — Laptop (Sale)
  await createProduct({
    name: "Dell XPS 15 OLED",
    shortDesc: "Premium Windows laptop with stunning OLED display",
    description:
      "The Dell XPS 15 features a gorgeous 3.5K OLED touchscreen, Intel Core i9-13900H, NVIDIA GeForce RTX 4070, and 32GB DDR5 RAM. Ideal for creative professionals on Windows.",
    basePrice: 280000,
    comparePrice: 320000,
    stock: 8,
    isFlashSale: true,
    freeShipping: true,
    categoryId: subLaptops.id,
    tags: ["laptop", "dell", "xps", "oled", "windows", "sale"],
    imageSeed: 50,
    skuPrefix: "ELEC",
    skuNum: 5,
  });

  // 6. In Stock — Headphones
  await createProduct({
    name: "Sony WH-1000XM5 Headphones",
    shortDesc: "Industry-leading noise cancellation wireless headphones",
    description:
      "Sony's flagship noise-cancelling headphones with 30-hour battery, Auto NC Optimizer, and precise voice pickup for crystal-clear calls. Includes carrying case.",
    basePrice: 42000,
    comparePrice: 48000,
    stock: 60,
    freeShipping: true,
    categoryId: catElectronics.id,
    tags: ["headphones", "sony", "noise-cancelling", "wireless", "sale"],
    imageSeed: 60,
    skuPrefix: "ELEC",
    skuNum: 6,
    hasVariants: true,
    variants: [
      { name: "Black",  price: 42000, comparePrice: 48000, stock: 30, attributes: { color: "Black" } },
      { name: "Silver", price: 42000, comparePrice: 48000, stock: 30, attributes: { color: "Silver" } },
    ],
  });

  // 7. Out of Stock — Camera
  await createProduct({
    name: "Sony Alpha A7 IV Mirrorless",
    shortDesc: "Full-frame mirrorless camera for professionals",
    description:
      "The Sony Alpha 7 IV features a 33MP full-frame sensor, 4K 60p video, real-time tracking AF, and 5-axis in-body stabilization. Currently sold out due to high demand.",
    basePrice: 450000,
    stock: 0,
    categoryId: catElectronics.id,
    tags: ["camera", "sony", "mirrorless", "photography", "out-of-stock"],
    imageSeed: 70,
    skuPrefix: "ELEC",
    skuNum: 7,
  });

  // 8. New Arrival — Smart Watch
  await createProduct({
    name: "Apple Watch Ultra 2",
    shortDesc: "The most rugged and capable Apple Watch ever",
    description:
      "Just arrived! Apple Watch Ultra 2 features a titanium case, precision dual-frequency GPS, up to 60 hours battery, and the brightest Apple Watch display ever at 3000 nits. Built for extreme adventures.",
    basePrice: 135000,
    stock: 20,
    isFeatured: true,
    freeShipping: true,
    categoryId: catElectronics.id,
    tags: ["smartwatch", "apple", "watch", "new-arrival", "fitness"],
    imageSeed: 80,
    skuPrefix: "ELEC",
    skuNum: 8,
  });

  // 8b. In Stock — Tablet (direct Electronics parent)
  await createProduct({
    name: "iPad Pro 13 M4 Wi-Fi",
    shortDesc: "Apple's most powerful iPad with Ultra Retina XDR display",
    description:
      "The iPad Pro 13-inch with M4 chip features the world's most advanced display with nano-texture glass, Apple Pencil Pro support, and up to 16GB RAM. Ideal for creative professionals on the go.",
    basePrice: 215000,
    comparePrice: 235000,
    stock: 25,
    isFeatured: true,
    freeShipping: true,
    isFlashSale: true,
    categoryId: catElectronics.id,
    tags: ["tablet", "ipad", "apple", "m4", "sale", "new-arrival"],
    imageSeed: 85,
    skuPrefix: "ELEC",
    skuNum: 9,
    hasVariants: true,
    variants: [
      { name: "256GB Space Black", price: 215000, comparePrice: 235000, stock: 10, attributes: { storage: "256GB", color: "Space Black" } },
      { name: "512GB Silver",      price: 255000, comparePrice: 275000, stock: 10, attributes: { storage: "512GB", color: "Silver" } },
      { name: "1TB Space Black",   price: 320000, comparePrice: 350000, stock: 5,  attributes: { storage: "1TB",   color: "Space Black" } },
    ],
  });

  // 8c. In Stock — Smart TV (direct Electronics parent)
  await createProduct({
    name: 'Samsung 55" Neo QLED 4K Smart TV',
    shortDesc: "Quantum Matrix Technology with Neo Quantum Processor 4K",
    description:
      'The 55" Samsung Neo QLED 4K TV uses Quantum Mini LEDs for precise backlighting, delivering stunning contrast and vibrant colour. Features Object Tracking Sound+, HDR10+, and Tizen OS with all major streaming apps built in.',
    basePrice: 185000,
    comparePrice: 220000,
    stock: 12,
    isFlashSale: true,
    freeShipping: true,
    categoryId: catElectronics.id,
    tags: ["tv", "samsung", "4k", "qled", "smart-tv", "sale"],
    imageSeed: 87,
    skuPrefix: "ELEC",
    skuNum: 10,
  });

  console.log("✅  Electronics products created");

  // ════════════════════════════════════════════════════════════════════════════
  //  COSMETICS
  // ════════════════════════════════════════════════════════════════════════════

  // 9. In Stock — Skincare
  await createProduct({
    name: "CeraVe Moisturizing Cream 340g",
    shortDesc: "Rich moisturizer with ceramides and hyaluronic acid",
    description:
      "CeraVe Moisturizing Cream helps restore and maintain the skin's natural barrier with three essential ceramides, hyaluronic acid, and MVE technology for 24-hour hydration. Fragrance-free and non-comedogenic.",
    basePrice: 3200,
    stock: 200,
    isEco: true,
    categoryId: subSkincare.id,
    tags: ["skincare", "moisturizer", "cerave", "hydration", "sensitive-skin"],
    imageSeed: 90,
    skuPrefix: "COSM",
    skuNum: 1,
  });

  // 10. Sale — Skincare
  await createProduct({
    name: "The Ordinary Niacinamide 10% + Zinc 1%",
    shortDesc: "High-strength vitamin and mineral blemish formula",
    description:
      "This formula combines 10% Niacinamide with 1% Zinc to reduce the appearance of pores, blemishes, and irregular skin texture. Lightweight water-based serum suitable for all skin types.",
    basePrice: 1800,
    comparePrice: 2500,
    stock: 150,
    isFlashSale: true,
    isEco: true,
    categoryId: subSkincare.id,
    tags: ["skincare", "serum", "niacinamide", "sale", "blemish"],
    imageSeed: 100,
    skuPrefix: "COSM",
    skuNum: 2,
  });

  // 11. Out of Stock — Skincare
  await createProduct({
    name: "Laneige Lip Sleeping Mask Berry",
    shortDesc: "Overnight lip treatment for soft, smooth lips",
    description:
      "The Laneige Lip Sleeping Mask Berry provides intense overnight moisture with Vitamin C and antioxidants. Apply before bed for plump, smooth lips in the morning. Currently out of stock.",
    basePrice: 2800,
    stock: 0,
    categoryId: subSkincare.id,
    tags: ["skincare", "lip", "laneige", "overnight", "out-of-stock"],
    imageSeed: 110,
    skuPrefix: "COSM",
    skuNum: 3,
  });

  // 12. New Arrival — Skincare
  await createProduct({
    name: "Paula's Choice 2% BHA Liquid Exfoliant",
    shortDesc: "Exfoliating salicylic acid treatment for pores and blackheads",
    description:
      "Just arrived! Paula's Choice Skin Perfecting 2% BHA Liquid gently exfoliates inside pores to clear blackheads, minimise pore size, and smooth wrinkles. Fragrance-free and gentle enough for daily use.",
    basePrice: 4500,
    comparePrice: 5200,
    stock: 80,
    isFeatured: true,
    categoryId: subSkincare.id,
    tags: ["skincare", "exfoliant", "bha", "new-arrival", "pores"],
    imageSeed: 120,
    skuPrefix: "COSM",
    skuNum: 4,
  });

  // 13. In Stock — Makeup
  await createProduct({
    name: "MAC Velvet Teddy Lipstick",
    shortDesc: "Iconic matte lip colour in warm beige-pink",
    description:
      "MAC's bestselling Velvet Teddy is a deep-tone beige-pink matte lipstick that delivers rich, full coverage with a luxurious velvet finish. Long-wearing formula for all-day comfort.",
    basePrice: 3500,
    stock: 100,
    hasVariants: true,
    categoryId: subMakeup.id,
    tags: ["makeup", "lipstick", "mac", "matte", "bestseller"],
    imageSeed: 130,
    skuPrefix: "COSM",
    skuNum: 5,
    variants: [
      { name: "Velvet Teddy",  price: 3500, stock: 30, attributes: { shade: "Velvet Teddy" } },
      { name: "Ruby Woo",      price: 3500, stock: 30, attributes: { shade: "Ruby Woo" } },
      { name: "Lady Danger",   price: 3500, stock: 20, attributes: { shade: "Lady Danger" } },
      { name: "Brave",         price: 3500, stock: 20, attributes: { shade: "Brave" } },
    ],
  });

  // 14. Sale — Makeup
  await createProduct({
    name: "Charlotte Tilbury Pillow Talk Palette",
    shortDesc: "Bestselling eye shadow palette in nude-pink tones",
    description:
      "The Charlotte Tilbury Pillow Talk Eye Shadow Palette features 8 complementary shades from soft pink to deep rose gold. Perfect for day-to-night glamour looks. Limited-time sale price!",
    basePrice: 12000,
    comparePrice: 15000,
    stock: 35,
    isFlashSale: true,
    freeShipping: true,
    categoryId: subMakeup.id,
    tags: ["makeup", "eyeshadow", "palette", "sale", "charlotte-tilbury"],
    imageSeed: 140,
    skuPrefix: "COSM",
    skuNum: 6,
  });

  // 14b. In Stock — Gift Set (direct Cosmetics parent)
  await createProduct({
    name: "The Body Shop British Rose Gift Set",
    shortDesc: "Luxurious rose-scented body care gift collection",
    description:
      "A beautifully presented gift set featuring British Rose Body Lotion, Shower Gel, Body Butter, and Hand Cream. Infused with real rose petals for silky-smooth skin. Perfect as a gift or a treat for yourself.",
    basePrice: 6500,
    comparePrice: 8000,
    stock: 55,
    isFlashSale: true,
    freeShipping: true,
    isEco: true,
    categoryId: catCosmetics.id,
    tags: ["gift-set", "body-shop", "rose", "sale", "eco"],
    imageSeed: 145,
    skuPrefix: "COSM",
    skuNum: 9,
  });

  // 14c. New Arrival — Sunscreen (direct Cosmetics parent)
  await createProduct({
    name: "Anessa Perfect UV Sunscreen SPF50+",
    shortDesc: "Japan's No.1 sunscreen — waterproof with skincare benefits",
    description:
      "New arrival! Anessa Perfect UV Sunscreen SPF50+ PA++++ provides maximum sun protection while moisturising skin. Auto Booster technology strengthens protection on contact with sweat and water. Lightweight, non-greasy finish.",
    basePrice: 4200,
    stock: 90,
    isFeatured: true,
    isEco: false,
    categoryId: catCosmetics.id,
    tags: ["sunscreen", "anessa", "spf50", "new-arrival", "skincare"],
    imageSeed: 147,
    skuPrefix: "COSM",
    skuNum: 10,
  });

  // 14d. In Stock — Hair Care (direct Cosmetics parent)
  await createProduct({
    name: "Olaplex No.3 Hair Perfector 100ml",
    shortDesc: "At-home bond-building treatment for damaged hair",
    description:
      "Olaplex No.3 Hair Perfector is a weekly at-home treatment that reduces breakage and visibly strengthens hair by repairing damage from the inside out. Apply to towel-dried hair, leave for 10 minutes, then shampoo as normal.",
    basePrice: 5800,
    comparePrice: 6500,
    stock: 70,
    isFlashSale: true,
    categoryId: catCosmetics.id,
    tags: ["haircare", "olaplex", "bond-building", "sale", "treatment"],
    imageSeed: 149,
    skuPrefix: "COSM",
    skuNum: 11,
  });

  // 15. New Arrival — Perfume
  await createProduct({
    name: "Jo Malone Peony & Blush Suede Cologne",
    shortDesc: "Opulent floral cologne with suede undertones",
    description:
      "New in store! Jo Malone London's Peony & Blush Suede is an opulent floral fragrance of peony ruffled petals, red apple, and soft suede — a feminine, elegant scent for every occasion.",
    basePrice: 22000,
    stock: 25,
    isFeatured: true,
    freeShipping: true,
    categoryId: catCosmetics.id,
    tags: ["perfume", "fragrance", "jo-malone", "new-arrival", "floral"],
    imageSeed: 150,
    skuPrefix: "COSM",
    skuNum: 7,
  });

  // 16. Out of Stock — Foundation
  await createProduct({
    name: "NARS Sheer Glow Foundation",
    shortDesc: "Skin-perfecting luminous foundation",
    description:
      "NARS Sheer Glow Foundation delivers a natural, luminous finish with buildable medium coverage. Formulated with Hyaluronic Acid for hydration. Available in 30+ shades. Currently out of stock.",
    basePrice: 7500,
    stock: 0,
    categoryId: subMakeup.id,
    tags: ["makeup", "foundation", "nars", "out-of-stock", "luminous"],
    imageSeed: 160,
    skuPrefix: "COSM",
    skuNum: 8,
  });

  console.log("✅  Cosmetics products created");

  // ════════════════════════════════════════════════════════════════════════════
  //  CLOTHES
  // ════════════════════════════════════════════════════════════════════════════

  // 17. In Stock — Men's T-Shirt
  await createProduct({
    name: "Uniqlo AIRism Cotton T-Shirt Men",
    shortDesc: "Ultra-light breathable everyday t-shirt",
    description:
      "Uniqlo's AIRism Cotton T-Shirt combines natural cotton with AIRism technology for exceptional breathability and quick-drying performance. Perfect for warm weather and everyday wear.",
    basePrice: 1490,
    stock: 500,
    hasVariants: true,
    isEco: true,
    categoryId: subMenswear.id,
    tags: ["tshirt", "uniqlo", "men", "cotton", "casual"],
    imageSeed: 170,
    skuPrefix: "CLO",
    skuNum: 1,
    variants: [
      { name: "White S",   price: 1490, stock: 60, attributes: { color: "White", size: "S" } },
      { name: "White M",   price: 1490, stock: 80, attributes: { color: "White", size: "M" } },
      { name: "White L",   price: 1490, stock: 80, attributes: { color: "White", size: "L" } },
      { name: "Black M",   price: 1490, stock: 80, attributes: { color: "Black", size: "M" } },
      { name: "Navy L",    price: 1490, stock: 60, attributes: { color: "Navy",  size: "L" } },
      { name: "Grey XL",   price: 1490, stock: 40, attributes: { color: "Grey",  size: "XL" } },
      { name: "White XL",  price: 1490, stock: 100, attributes: { color: "White", size: "XL" } },
    ],
  });

  // 18. Sale — Men's Jeans
  await createProduct({
    name: "Levi's 511 Slim Fit Jeans",
    shortDesc: "Classic slim fit jeans with modern stretch",
    description:
      "Levi's 511 Slim Fit Jeans sit below the waist and are slim through the thigh and leg. Made with stretch denim for a comfortable fit all day long. Flash sale — limited time only!",
    basePrice: 7500,
    comparePrice: 9500,
    stock: 85,
    isFlashSale: true,
    hasVariants: true,
    categoryId: subMenswear.id,
    tags: ["jeans", "levis", "men", "slim-fit", "sale", "denim"],
    imageSeed: 180,
    skuPrefix: "CLO",
    skuNum: 2,
    variants: [
      { name: "Dark Wash 30x30", price: 7500, comparePrice: 9500, stock: 15, attributes: { wash: "Dark Wash",  waist: "30", length: "30" } },
      { name: "Dark Wash 32x30", price: 7500, comparePrice: 9500, stock: 20, attributes: { wash: "Dark Wash",  waist: "32", length: "30" } },
      { name: "Medium Wash 32x32", price: 7500, comparePrice: 9500, stock: 20, attributes: { wash: "Medium Wash", waist: "32", length: "32" } },
      { name: "Light Wash 34x32", price: 7500, comparePrice: 9500, stock: 15, attributes: { wash: "Light Wash", waist: "34", length: "32" } },
      { name: "Black 32x30",    price: 7500, comparePrice: 9500, stock: 15, attributes: { wash: "Black",       waist: "32", length: "30" } },
    ],
  });

  // 19. Out of Stock — Men's Jacket
  await createProduct({
    name: "North Face Thermoball Eco Jacket Men",
    shortDesc: "Lightweight insulated jacket made with recycled materials",
    description:
      "The North Face Thermoball Eco Jacket features 100% recycled PrimaLoft insulation and a recycled shell. Packable, warm, and eco-conscious. Sold out — notify me when back in stock!",
    basePrice: 32000,
    stock: 0,
    isEco: true,
    categoryId: subMenswear.id,
    tags: ["jacket", "north-face", "men", "eco", "out-of-stock", "insulated"],
    imageSeed: 190,
    skuPrefix: "CLO",
    skuNum: 3,
  });

  // 20. New Arrival — Women's Dress
  await createProduct({
    name: "Zara Floral Midi Wrap Dress",
    shortDesc: "Elegant floral wrap dress in flowing fabric",
    description:
      "Just arrived! This beautiful midi wrap dress features a vibrant floral print, V-neck, and adjustable wrap waist for a flattering silhouette. Made from lightweight woven fabric — perfect for any occasion.",
    basePrice: 5500,
    stock: 60,
    isFeatured: true,
    hasVariants: true,
    categoryId: subWomenswear.id,
    tags: ["dress", "zara", "women", "floral", "new-arrival", "midi"],
    imageSeed: 200,
    skuPrefix: "CLO",
    skuNum: 4,
    variants: [
      { name: "Blue Floral XS", price: 5500, stock: 10, attributes: { color: "Blue Floral", size: "XS" } },
      { name: "Blue Floral S",  price: 5500, stock: 15, attributes: { color: "Blue Floral", size: "S" } },
      { name: "Blue Floral M",  price: 5500, stock: 20, attributes: { color: "Blue Floral", size: "M" } },
      { name: "Pink Floral S",  price: 5500, stock: 10, attributes: { color: "Pink Floral", size: "S" } },
      { name: "Pink Floral M",  price: 5500, stock: 5,  attributes: { color: "Pink Floral", size: "M" } },
    ],
  });

  // 21. In Stock — Women's Blazer (Sale)
  await createProduct({
    name: "H&M Fitted Linen Blazer Women",
    shortDesc: "Tailored linen blazer for effortless smart-casual style",
    description:
      "This structured linen-blend blazer from H&M features padded shoulders, two-button closure, and functional welt pockets. Elevate any outfit from casual to boardroom-ready.",
    basePrice: 6800,
    comparePrice: 8500,
    stock: 40,
    isFlashSale: true,
    hasVariants: true,
    categoryId: subWomenswear.id,
    tags: ["blazer", "hm", "women", "linen", "sale", "formal"],
    imageSeed: 210,
    skuPrefix: "CLO",
    skuNum: 5,
    variants: [
      { name: "Beige XS", price: 6800, comparePrice: 8500, stock: 8,  attributes: { color: "Beige", size: "XS" } },
      { name: "Beige S",  price: 6800, comparePrice: 8500, stock: 12, attributes: { color: "Beige", size: "S" } },
      { name: "Black S",  price: 6800, comparePrice: 8500, stock: 10, attributes: { color: "Black", size: "S" } },
      { name: "Black M",  price: 6800, comparePrice: 8500, stock: 10, attributes: { color: "Black", size: "M" } },
    ],
  });

  // 22. Out of Stock — Women's Sneakers
  await createProduct({
    name: "New Balance 550 Women",
    shortDesc: "Retro-inspired court sneaker with premium leather",
    description:
      "The New Balance 550 features a heritage basketball design with premium leather upper, cushioned insole, and rubber outsole. A timeless silhouette that pairs with everything. Sold out!",
    basePrice: 18500,
    comparePrice: 21000,
    stock: 0,
    categoryId: subWomenswear.id,
    tags: ["sneakers", "new-balance", "women", "out-of-stock", "leather"],
    imageSeed: 220,
    skuPrefix: "CLO",
    skuNum: 6,
  });

  // 23. New Arrival — Men's Casual Shirt
  await createProduct({
    name: "Ralph Lauren Oxford Slim Shirt Men",
    shortDesc: "Classic Oxford cloth button-down in slim fit",
    description:
      "New arrival! Ralph Lauren's iconic Oxford cloth button-down shirt crafted from soft, breathable cotton oxford cloth. Features a point collar, chest pocket, and classic RL logo embroidery.",
    basePrice: 9500,
    stock: 70,
    isFeatured: true,
    hasVariants: true,
    categoryId: subMenswear.id,
    tags: ["shirt", "ralph-lauren", "men", "oxford", "new-arrival", "formal"],
    imageSeed: 230,
    skuPrefix: "CLO",
    skuNum: 7,
    variants: [
      { name: "White S",  price: 9500, stock: 10, attributes: { color: "White", size: "S" } },
      { name: "White M",  price: 9500, stock: 20, attributes: { color: "White", size: "M" } },
      { name: "Blue M",   price: 9500, stock: 15, attributes: { color: "Blue",  size: "M" } },
      { name: "Blue L",   price: 9500, stock: 15, attributes: { color: "Blue",  size: "L" } },
      { name: "Pink S",   price: 9500, stock: 10, attributes: { color: "Pink",  size: "S" } },
    ],
  });

  // 24. Featured In Stock — Women's Hoodie
  await createProduct({
    name: "Champion Reverse Weave Hoodie Women",
    shortDesc: "Iconic pullover hoodie with shrink-resistant fabric",
    description:
      "Champion's Reverse Weave Hoodie is engineered to resist shrinkage with its signature left-chest C logo, kangaroo pocket, and fleece-lined interior. A streetwear staple in every wardrobe.",
    basePrice: 8500,
    comparePrice: 10000,
    stock: 120,
    isFeatured: true,
    isFlashSale: true,
    freeShipping: true,
    hasVariants: true,
    categoryId: subWomenswear.id,
    tags: ["hoodie", "champion", "women", "streetwear", "sale", "fleece"],
    imageSeed: 240,
    skuPrefix: "CLO",
    skuNum: 8,
    variants: [
      { name: "Oxford Grey XS", price: 8500, comparePrice: 10000, stock: 20, attributes: { color: "Oxford Grey", size: "XS" } },
      { name: "Oxford Grey S",  price: 8500, comparePrice: 10000, stock: 30, attributes: { color: "Oxford Grey", size: "S" } },
      { name: "Oxford Grey M",  price: 8500, comparePrice: 10000, stock: 30, attributes: { color: "Oxford Grey", size: "M" } },
      { name: "Black S",        price: 8500, comparePrice: 10000, stock: 25, attributes: { color: "Black",       size: "S" } },
      { name: "Black M",        price: 8500, comparePrice: 10000, stock: 15, attributes: { color: "Black",       size: "M" } },
    ],
  });

  // 24b. In Stock — Belt (direct Clothes parent)
  await createProduct({
    name: "Fossil Leather Reversible Belt",
    shortDesc: "Classic reversible belt in black and brown genuine leather",
    description:
      "This Fossil genuine leather reversible belt switches from black to brown with a simple flip of the buckle — giving you two belts in one. Features a polished silver-tone buckle and adjustable length to fit waist sizes 28–44.",
    basePrice: 4500,
    comparePrice: 5500,
    stock: 80,
    isFlashSale: true,
    hasVariants: true,
    categoryId: catClothes.id,
    tags: ["belt", "fossil", "leather", "sale", "accessories"],
    imageSeed: 245,
    skuPrefix: "CLO",
    skuNum: 9,
    variants: [
      { name: "S (28-32)", price: 4500, comparePrice: 5500, stock: 25, attributes: { size: "S (28-32)" } },
      { name: "M (32-36)", price: 4500, comparePrice: 5500, stock: 30, attributes: { size: "M (32-36)" } },
      { name: "L (36-40)", price: 4500, comparePrice: 5500, stock: 25, attributes: { size: "L (36-40)" } },
    ],
  });

  // 24c. New Arrival — Cap (direct Clothes parent)
  await createProduct({
    name: "New Era 59FIFTY LA Dodgers Cap",
    shortDesc: "Iconic fitted baseball cap in wool blend",
    description:
      "Just arrived! The New Era 59FIFTY LA Dodgers fitted cap is the gold standard of baseball caps. Made from a premium wool blend with a structured crown, flat brim, and embroidered team logo. A streetwear essential.",
    basePrice: 5500,
    stock: 60,
    isFeatured: true,
    hasVariants: true,
    categoryId: catClothes.id,
    tags: ["cap", "new-era", "baseball", "new-arrival", "streetwear"],
    imageSeed: 247,
    skuPrefix: "CLO",
    skuNum: 10,
    variants: [
      { name: "Royal Blue 7 1/4",  price: 5500, stock: 15, attributes: { color: "Royal Blue", size: '7 1/4' } },
      { name: "Royal Blue 7 3/8",  price: 5500, stock: 20, attributes: { color: "Royal Blue", size: '7 3/8' } },
      { name: "Royal Blue 7 1/2",  price: 5500, stock: 15, attributes: { color: "Royal Blue", size: '7 1/2' } },
      { name: "Black 7 3/8",       price: 5500, stock: 10, attributes: { color: "Black",      size: '7 3/8' } },
    ],
  });

  // 24d. Out of Stock — Scarf (direct Clothes parent)
  await createProduct({
    name: "Burberry Classic Check Scarf",
    shortDesc: "Timeless heritage check pattern in cashmere",
    description:
      "The Burberry Classic Check Scarf is woven from pure cashmere in Scotland, featuring the house's iconic beige, black, red, and white check pattern. A luxurious wardrobe investment piece. Currently sold out.",
    basePrice: 45000,
    stock: 0,
    isEco: false,
    categoryId: catClothes.id,
    tags: ["scarf", "burberry", "cashmere", "out-of-stock", "luxury"],
    imageSeed: 249,
    skuPrefix: "CLO",
    skuNum: 11,
  });

  // 24e. In Stock — Socks (direct Clothes parent)
  await createProduct({
    name: "Nike Everyday Cushioned Crew Socks 6-Pack",
    shortDesc: "Comfortable cushioned crew socks for everyday wear",
    description:
      "Nike Everyday Cushioned Crew Socks feature Dri-FIT technology to wick away sweat, ribbed arch support for a secure fit, and cushioning underfoot for all-day comfort. Pack of 6 pairs in assorted neutral colours.",
    basePrice: 2200,
    stock: 300,
    freeShipping: false,
    hasVariants: true,
    categoryId: catClothes.id,
    tags: ["socks", "nike", "essentials", "in-stock", "sportswear"],
    imageSeed: 251,
    skuPrefix: "CLO",
    skuNum: 12,
    variants: [
      { name: "S (34-38)", price: 2200, stock: 80,  attributes: { size: "S (34-38)" } },
      { name: "M (38-42)", price: 2200, stock: 120, attributes: { size: "M (38-42)" } },
      { name: "L (42-46)", price: 2200, stock: 100, attributes: { size: "L (42-46)" } },
    ],
  });

  console.log("✅  Clothes products created");

  // ─── Summary ──────────────────────────────────────────────────────────────────

  const [productCount, categoryCount, userCount] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.user.count(),
  ]);

  console.log("\n🎉  Seed complete!");
  console.log(`   Categories : ${categoryCount}`);
  console.log(`   Products   : ${productCount}`);
  console.log(`   Users      : ${userCount}`);
  console.log("\n📋  Product breakdown by category:");
  console.log("   Electronics  → 10 products (parent: 5, Smartphones: 3, Laptops: 2)");
  console.log("   Cosmetics    → 12 products (parent: 4, Skincare: 4, Makeup: 3, Perfume: 1)");
  console.log("   Clothes      → 12 products (parent: 4, Menswear: 4, Womenswear: 4)");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
