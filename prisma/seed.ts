import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱  Seeding database…");

  // ── 1. Categories ─────────────────────────────────────────────────────────

  // ── Parent categories ──────────────────────────────────────────────────────
  const catElectronics = await prisma.category.upsert({
    where: { slug: "electronics" },
    update: { icon: "📱" },
    create: { name: "Electronics", slug: "electronics", icon: "📱" },
  });
  const catCosmetics = await prisma.category.upsert({
    where: { slug: "cosmetics" },
    update: { icon: "💄" },
    create: { name: "Cosmetics", slug: "cosmetics", icon: "💄" },
  });
  const catClothes = await prisma.category.upsert({
    where: { slug: "clothes" },
    update: { icon: "👕" },
    create: { name: "Clothes", slug: "clothes", icon: "👕" },
  });
  const catMotors = await prisma.category.upsert({
    where: { slug: "motors" },
    update: {},
    create: { name: "Motors, Tools & DIY", slug: "motors", icon: "🔧" },
  });
  const catHome = await prisma.category.upsert({
    where: { slug: "home-living" },
    update: {},
    create: { name: "Home & Lifestyle", slug: "home-living", icon: "🏠" },
  });
  const catSports = await prisma.category.upsert({
    where: { slug: "sports" },
    update: {},
    create: { name: "Sports & Outdoor", slug: "sports", icon: "⚽" },
  });
  const catElecAcc = await prisma.category.upsert({
    where: { slug: "electronic-accessories" },
    update: {},
    create: { name: "Electronic Accessories", slug: "electronic-accessories", icon: "🔌" },
  });
  const catGroceries = await prisma.category.upsert({
    where: { slug: "groceries" },
    update: {},
    create: { name: "Groceries & Pets", slug: "groceries", icon: "🛒" },
  });
  const catTVAppliances = await prisma.category.upsert({
    where: { slug: "tv-appliances" },
    update: {},
    create: { name: "TV & Home Appliances", slug: "tv-appliances", icon: "📺" },
  });
  const catMensFashion = await prisma.category.upsert({
    where: { slug: "mens-fashion" },
    update: {},
    create: { name: "Men's Fashion", slug: "mens-fashion", icon: "👔" },
  });
  const catWatches = await prisma.category.upsert({
    where: { slug: "watches" },
    update: {},
    create: { name: "Watches & Accessories", slug: "watches", icon: "⌚" },
  });
  const catWomensFashion = await prisma.category.upsert({
    where: { slug: "womens-fashion" },
    update: {},
    create: { name: "Women's Fashion", slug: "womens-fashion", icon: "👗" },
  });
  const catHealthBeauty = await prisma.category.upsert({
    where: { slug: "health-beauty" },
    update: {},
    create: { name: "Health & Beauty", slug: "health-beauty", icon: "🌿" },
  });
  const catBabies = await prisma.category.upsert({
    where: { slug: "babies-toys" },
    update: {},
    create: { name: "Babies & Toys", slug: "babies-toys", icon: "🧸" },
  });

  // ── Sub-categories — Electronics ───────────────────────────────────────────
  await prisma.category.upsert({ where: { slug: "smartphones" }, update: {}, create: { name: "Smartphones", slug: "smartphones", parentId: catElectronics.id } });
  await prisma.category.upsert({ where: { slug: "laptops" },     update: {}, create: { name: "Laptops",     slug: "laptops",     parentId: catElectronics.id } });
  await prisma.category.upsert({ where: { slug: "tablets" },     update: {}, create: { name: "Tablets",     slug: "tablets",     parentId: catElectronics.id } });
  await prisma.category.upsert({ where: { slug: "audio" },       update: {}, create: { name: "Audio",       slug: "audio",       parentId: catElectronics.id } });
  await prisma.category.upsert({ where: { slug: "cameras" },     update: {}, create: { name: "Cameras",     slug: "cameras",     parentId: catElectronics.id } });
  await prisma.category.upsert({ where: { slug: "wearables" },   update: {}, create: { name: "Wearables",   slug: "wearables",   parentId: catElectronics.id } });
  await prisma.category.upsert({ where: { slug: "televisions" }, update: {}, create: { name: "Televisions", slug: "televisions", parentId: catElectronics.id } });
  await prisma.category.upsert({ where: { slug: "gaming" },      update: {}, create: { name: "Gaming",      slug: "gaming",      parentId: catElectronics.id } });

  // ── Sub-categories — Cosmetics ─────────────────────────────────────────────
  await prisma.category.upsert({ where: { slug: "skincare" },  update: {}, create: { name: "Skincare",  slug: "skincare",  parentId: catCosmetics.id } });
  await prisma.category.upsert({ where: { slug: "makeup" },    update: {}, create: { name: "Makeup",    slug: "makeup",    parentId: catCosmetics.id } });
  await prisma.category.upsert({ where: { slug: "haircare" },  update: {}, create: { name: "Hair Care", slug: "haircare",  parentId: catCosmetics.id } });
  await prisma.category.upsert({ where: { slug: "fragrance" }, update: {}, create: { name: "Fragrance", slug: "fragrance", parentId: catCosmetics.id } });

  // ── Sub-categories — Clothes ───────────────────────────────────────────────
  await prisma.category.upsert({ where: { slug: "menswear" },   update: {}, create: { name: "Menswear",   slug: "menswear",   parentId: catClothes.id } });
  await prisma.category.upsert({ where: { slug: "womenswear" }, update: {}, create: { name: "Womenswear", slug: "womenswear", parentId: catClothes.id } });
  await prisma.category.upsert({ where: { slug: "footwear" },   update: {}, create: { name: "Footwear",   slug: "footwear",   parentId: catClothes.id } });
  await prisma.category.upsert({ where: { slug: "accessories" },update: {}, create: { name: "Accessories",slug: "accessories",parentId: catClothes.id } });

  // ── Sub-categories — Motors, Tools & DIY ──────────────────────────────────
  await prisma.category.upsert({ where: { slug: "power-tools" }, update: {}, create: { name: "Power Tools",       slug: "power-tools", parentId: catMotors.id } });
  await prisma.category.upsert({ where: { slug: "hand-tools" },  update: {}, create: { name: "Hand Tools",        slug: "hand-tools",  parentId: catMotors.id } });
  await prisma.category.upsert({ where: { slug: "safety" },      update: {}, create: { name: "Safety & Security", slug: "safety",      parentId: catMotors.id } });
  await prisma.category.upsert({ where: { slug: "electrical" },  update: {}, create: { name: "Electrical",        slug: "electrical",  parentId: catMotors.id } });

  // ── Sub-categories — Home & Lifestyle ─────────────────────────────────────
  const catFurniture = await prisma.category.upsert({ where: { slug: "furniture" }, update: {}, create: { name: "Furniture", slug: "furniture", parentId: catHome.id } });
  await prisma.category.upsert({ where: { slug: "lighting" },  update: {}, create: { name: "Lighting",           slug: "lighting",  parentId: catHome.id } });
  await prisma.category.upsert({ where: { slug: "kitchen" },   update: {}, create: { name: "Kitchen Appliances", slug: "kitchen",   parentId: catHome.id } });
  await prisma.category.upsert({ where: { slug: "home-decor" },update: {}, create: { name: "Home Décor",         slug: "home-decor",parentId: catHome.id } });
  // Furniture children
  await prisma.category.upsert({ where: { slug: "sofas" },         update: {}, create: { name: "Sofas & Couches",  slug: "sofas",         parentId: catFurniture.id } });
  await prisma.category.upsert({ where: { slug: "beds" },          update: {}, create: { name: "Beds & Mattresses",slug: "beds",          parentId: catFurniture.id } });
  await prisma.category.upsert({ where: { slug: "dining" },        update: {}, create: { name: "Dining Sets",      slug: "dining",        parentId: catFurniture.id } });
  await prisma.category.upsert({ where: { slug: "office-chairs" }, update: {}, create: { name: "Office Chairs",    slug: "office-chairs", parentId: catFurniture.id } });

  // ── Sub-categories — Sports & Outdoor ─────────────────────────────────────
  await prisma.category.upsert({ where: { slug: "gym" },           update: {}, create: { name: "Gym & Fitness",  slug: "gym",           parentId: catSports.id } });
  await prisma.category.upsert({ where: { slug: "outdoor-sports" },update: {}, create: { name: "Outdoor Sports", slug: "outdoor-sports", parentId: catSports.id } });
  await prisma.category.upsert({ where: { slug: "cycling" },       update: {}, create: { name: "Cycling",        slug: "cycling",        parentId: catSports.id } });
  await prisma.category.upsert({ where: { slug: "team-sports" },   update: {}, create: { name: "Team Sports",    slug: "team-sports",    parentId: catSports.id } });

  // ── Sub-categories — Electronic Accessories ───────────────────────────────
  const catMobileAcc = await prisma.category.upsert({ where: { slug: "mobile-accessories" }, update: {}, create: { name: "Mobile Accessories", slug: "mobile-accessories", parentId: catElecAcc.id } });
  const catCompComp  = await prisma.category.upsert({ where: { slug: "computer-components"},  update: {}, create: { name: "Computer Components",slug: "computer-components",parentId: catElecAcc.id } });
  await prisma.category.upsert({ where: { slug: "console-accessories" }, update: {}, create: { name: "Console Accessories", slug: "console-accessories", parentId: catElecAcc.id } });
  await prisma.category.upsert({ where: { slug: "storage" },             update: {}, create: { name: "Storage",             slug: "storage",             parentId: catElecAcc.id } });
  await prisma.category.upsert({ where: { slug: "network" },             update: {}, create: { name: "Network Components",  slug: "network",             parentId: catElecAcc.id } });
  await prisma.category.upsert({ where: { slug: "computer-accessories" },update: {}, create: { name: "Computer Accessories",slug: "computer-accessories",parentId: catElecAcc.id } });
  // Mobile Accessories children
  await prisma.category.upsert({ where: { slug: "power-banks" },       update: {}, create: { name: "Power Banks",       slug: "power-banks",       parentId: catMobileAcc.id } });
  await prisma.category.upsert({ where: { slug: "phone-cases" },       update: {}, create: { name: "Phone Cases",       slug: "phone-cases",       parentId: catMobileAcc.id } });
  await prisma.category.upsert({ where: { slug: "screen-protectors" }, update: {}, create: { name: "Screen Protectors", slug: "screen-protectors", parentId: catMobileAcc.id } });
  await prisma.category.upsert({ where: { slug: "cables" },            update: {}, create: { name: "Cables & Converters",slug: "cables",            parentId: catMobileAcc.id } });
  await prisma.category.upsert({ where: { slug: "tablet-accessories" },update: {}, create: { name: "Tablet Accessories",slug: "tablet-accessories",parentId: catMobileAcc.id } });
  await prisma.category.upsert({ where: { slug: "wall-chargers" },     update: {}, create: { name: "Wall Chargers",     slug: "wall-chargers",     parentId: catMobileAcc.id } });
  await prisma.category.upsert({ where: { slug: "wireless-chargers" }, update: {}, create: { name: "Wireless Chargers", slug: "wireless-chargers", parentId: catMobileAcc.id } });
  // Computer Components children
  await prisma.category.upsert({ where: { slug: "memory" },         update: {}, create: { name: "Memory & Storage", slug: "memory",         parentId: catCompComp.id } });
  await prisma.category.upsert({ where: { slug: "graphics-cards" }, update: {}, create: { name: "Graphics Cards",   slug: "graphics-cards", parentId: catCompComp.id } });
  await prisma.category.upsert({ where: { slug: "processors" },     update: {}, create: { name: "Processors",       slug: "processors",     parentId: catCompComp.id } });

  // ── Sub-categories — Groceries & Pets ─────────────────────────────────────
  await prisma.category.upsert({ where: { slug: "fresh-food" },  update: {}, create: { name: "Fresh Food",  slug: "fresh-food",  parentId: catGroceries.id } });
  await prisma.category.upsert({ where: { slug: "dry-goods" },   update: {}, create: { name: "Dry Goods",   slug: "dry-goods",   parentId: catGroceries.id } });
  await prisma.category.upsert({ where: { slug: "pet-supplies" },update: {}, create: { name: "Pet Supplies",slug: "pet-supplies",parentId: catGroceries.id } });

  // ── Sub-categories — TV & Home Appliances ─────────────────────────────────
  await prisma.category.upsert({ where: { slug: "washing-machines" }, update: {}, create: { name: "Washing Machines", slug: "washing-machines", parentId: catTVAppliances.id } });
  await prisma.category.upsert({ where: { slug: "refrigerators" },    update: {}, create: { name: "Refrigerators",    slug: "refrigerators",    parentId: catTVAppliances.id } });
  await prisma.category.upsert({ where: { slug: "air-conditioners" }, update: {}, create: { name: "Air Conditioners", slug: "air-conditioners", parentId: catTVAppliances.id } });
  await prisma.category.upsert({ where: { slug: "tvs" },              update: {}, create: { name: "TVs & Monitors",   slug: "tvs",              parentId: catTVAppliances.id } });

  // ── Sub-categories — Men's Fashion ────────────────────────────────────────
  await prisma.category.upsert({ where: { slug: "mens-clothing" },   update: {}, create: { name: "Clothing",    slug: "mens-clothing",    parentId: catMensFashion.id } });
  await prisma.category.upsert({ where: { slug: "mens-shoes" },      update: {}, create: { name: "Shoes",       slug: "mens-shoes",       parentId: catMensFashion.id } });
  await prisma.category.upsert({ where: { slug: "mens-accessories" },update: {}, create: { name: "Accessories", slug: "mens-accessories", parentId: catMensFashion.id } });

  // ── Sub-categories — Watches & Accessories ────────────────────────────────
  await prisma.category.upsert({ where: { slug: "mens-watches" },   update: {}, create: { name: "Men's Watches",   slug: "mens-watches",   parentId: catWatches.id } });
  await prisma.category.upsert({ where: { slug: "womens-watches" }, update: {}, create: { name: "Women's Watches", slug: "womens-watches", parentId: catWatches.id } });
  await prisma.category.upsert({ where: { slug: "smartwatches" },   update: {}, create: { name: "Smartwatches",    slug: "smartwatches",   parentId: catWatches.id } });

  // ── Sub-categories — Women's Fashion ──────────────────────────────────────
  await prisma.category.upsert({ where: { slug: "womens-clothing" }, update: {}, create: { name: "Clothing",        slug: "womens-clothing", parentId: catWomensFashion.id } });
  await prisma.category.upsert({ where: { slug: "womens-shoes" },    update: {}, create: { name: "Shoes",           slug: "womens-shoes",    parentId: catWomensFashion.id } });
  await prisma.category.upsert({ where: { slug: "bags" },            update: {}, create: { name: "Bags & Wallets",  slug: "bags",            parentId: catWomensFashion.id } });

  // ── Sub-categories — Health & Beauty ──────────────────────────────────────
  await prisma.category.upsert({ where: { slug: "health-skincare" }, update: {}, create: { name: "Skincare",    slug: "health-skincare", parentId: catHealthBeauty.id } });
  await prisma.category.upsert({ where: { slug: "health-makeup" },   update: {}, create: { name: "Makeup",      slug: "health-makeup",   parentId: catHealthBeauty.id } });
  await prisma.category.upsert({ where: { slug: "health-haircare" }, update: {}, create: { name: "Hair Care",   slug: "health-haircare", parentId: catHealthBeauty.id } });
  await prisma.category.upsert({ where: { slug: "healthcare" },      update: {}, create: { name: "Health Care", slug: "healthcare",      parentId: catHealthBeauty.id } });

  // ── Sub-categories — Babies & Toys ────────────────────────────────────────
  await prisma.category.upsert({ where: { slug: "baby-clothing" }, update: {}, create: { name: "Baby Clothing", slug: "baby-clothing", parentId: catBabies.id } });
  await prisma.category.upsert({ where: { slug: "toys" },          update: {}, create: { name: "Toys & Games",  slug: "toys",          parentId: catBabies.id } });
  await prisma.category.upsert({ where: { slug: "baby-gear" },     update: {}, create: { name: "Baby Gear",     slug: "baby-gear",     parentId: catBabies.id } });

  console.log("✅  Categories seeded");

  // ── 2. Admin user ─────────────────────────────────────────────────────────

  const adminHash = await bcrypt.hash("Admin@12345", 12);
  await prisma.user.upsert({
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

  // ── 3. Seller user + profile ──────────────────────────────────────────────

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

  await prisma.seller.upsert({
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
      totalSales: 0,
    },
  });

  console.log("✅  Users seeded");

  // ── Summary ───────────────────────────────────────────────────────────────

  const [categoryCount, userCount, productCount] = await Promise.all([
    prisma.category.count(),
    prisma.user.count(),
    prisma.product.count(),
  ]);

  console.log("\n🎉  Seed complete!");
  console.log(`   Categories : ${categoryCount}`);
  console.log(`   Users      : ${userCount}`);
  console.log(`   Products   : ${productCount} (sellers add products via the dashboard)`);
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
