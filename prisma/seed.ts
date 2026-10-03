import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The seed script creates demo accounts; do not run it in production.");
  }

  const seedPassword = process.env.SEED_PASSWORD;

  if (!seedPassword || seedPassword.length < 8) {
    throw new Error(
      "Set SEED_PASSWORD (at least 8 characters) to choose the password of the seeded accounts."
    );
  }

  const adminPassword = await bcrypt.hash(seedPassword, 12);
  const userPassword = await bcrypt.hash(seedPassword, 12);

  const iranKhodro = await prisma.brand.upsert({
    where: { slug: "iran-khodro" },
    update: {
      name: "ایران‌خودرو",
      logo: "/images/brands/iran-khodro.png",
      isActive: true,
    },
    create: {
      name: "ایران‌خودرو",
      slug: "iran-khodro",
      logo: "/images/brands/iran-khodro.png",
      isActive: true,
    },
  });

  const saipa = await prisma.brand.upsert({
    where: { slug: "saipa" },
    update: {
      name: "سایپا",
      logo: "/images/brands/saipa.png",
      isActive: true,
    },
    create: {
      name: "سایپا",
      slug: "saipa",
      logo: "/images/brands/saipa.png",
      isActive: true,
    },
  });

  const mazda = await prisma.brand.upsert({
    where: { slug: "mazda" },
    update: {
      name: "مزدا",
      logo: "/images/brands/mazda.png",
      isActive: true,
    },
    create: {
      name: "مزدا",
      slug: "mazda",
      logo: "/images/brands/mazda.png",
      isActive: true,
    },
  });

  const renault = await prisma.brand.upsert({
    where: { slug: "renault" },
    update: {
      name: "رنو",
      logo: "/images/brands/renault.png",
      isActive: true,
    },
    create: {
      name: "رنو",
      slug: "renault",
      logo: "/images/brands/renault.png",
      isActive: true,
    },
  });

  const lada = await prisma.brand.upsert({
    where: { slug: "lada" },
    update: {
      name: "لادا",
      logo: "/images/brands/lada.png",
      isActive: true,
    },
    create: {
      name: "لادا",
      slug: "lada",
      logo: "/images/brands/lada.png",
      isActive: true,
    },
  });

  const brakeParts = await prisma.category.upsert({
    where: { slug: "brake-parts" },
    update: {
      name: "قطعات ترمز",
      isActive: true,
    },
    create: {
      name: "قطعات ترمز",
      slug: "brake-parts",
      isActive: true,
    },
  });

  const bearing = await prisma.category.upsert({
    where: { slug: "bearing" },
    update: {
      name: "بلبرینگ",
      isActive: true,
    },
    create: {
      name: "بلبرینگ",
      slug: "bearing",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { phone: "09000000000" },
    update: {
      fullName: "ادمین سیستم",
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      fullName: "ادمین سیستم",
      phone: "09000000000",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { phone: "09120000000" },
    update: {
      fullName: "کاربر تست",
      role: UserRole.USER,
      isActive: true,
    },
    create: {
      fullName: "کاربر تست",
      phone: "09120000000",
      passwordHash: userPassword,
      role: UserRole.USER,
      isActive: true,
    },
  });

  await prisma.product.upsert({
    where: { slug: "pars-disc-peugeot-405" },
    update: {
      name: "دیسک ترمز جلو پژو 405 پارسیلون",
      code: "6010101",
      description: "دیسک ترمز مناسب پژو 405",
      image: "/images/products/6010101.jpg",
      price: 13150000,
      stock: 12,
      isAvailable: true,
      compatibleCars: ["پژو 405", "پارس", "سمند"],
      brandId: iranKhodro.id,
      categoryId: brakeParts.id,
    },
    create: {
      name: "دیسک ترمز جلو پژو 405 پارسیلون",
      slug: "pars-disc-peugeot-405",
      code: "6010101",
      description: "دیسک ترمز مناسب پژو 405",
      image: "/images/products/6010101.jpg",
      price: 13150000,
      stock: 12,
      isAvailable: true,
      compatibleCars: ["پژو 405", "پارس", "سمند"],
      brandId: iranKhodro.id,
      categoryId: brakeParts.id,
    },
  });

  await prisma.product.upsert({
    where: { slug: "bearing-saipa-front" },
    update: {
      name: "بلبرینگ چرخ جلو سایپا",
      code: "7012201",
      description: "بلبرینگ چرخ جلو مناسب خودروهای سایپا",
      image: "/images/parsilon-logo-fa.jpg",
      price: 5600000,
      stock: 20,
      isAvailable: true,
      compatibleCars: ["پراید", "تیبا", "ساینا"],
      brandId: saipa.id,
      categoryId: bearing.id,
    },
    create: {
      name: "بلبرینگ چرخ جلو سایپا",
      slug: "bearing-saipa-front",
      code: "7012201",
      description: "بلبرینگ چرخ جلو مناسب خودروهای سایپا",
      image: "/images/parsilon-logo-fa.jpg",
      price: 5600000,
      stock: 20,
      isAvailable: true,
      compatibleCars: ["پراید", "تیبا", "ساینا"],
      brandId: saipa.id,
      categoryId: bearing.id,
    },
  });

  // نمونه محصول مزدا
  await prisma.product.upsert({
    where: { slug: "mazda-front-bearing" },
    update: {
      name: "بلبرینگ چرخ جلو مزدا",
      code: "8011101",
      description: "بلبرینگ چرخ جلو مناسب خودروهای مزدا",
      image: "/images/parsilon-logo-fa.jpg",
      price: 7200000,
      stock: 8,
      isAvailable: true,
      compatibleCars: ["مزدا 323", "مزدا 3"],
      brandId: mazda.id,
      categoryId: bearing.id,
    },
    create: {
      name: "بلبرینگ چرخ جلو مزدا",
      slug: "mazda-front-bearing",
      code: "8011101",
      description: "بلبرینگ چرخ جلو مناسب خودروهای مزدا",
      image: "/images/parsilon-logo-fa.jpg",
      price: 7200000,
      stock: 8,
      isAvailable: true,
      compatibleCars: ["مزدا 323", "مزدا 3"],
      brandId: mazda.id,
      categoryId: bearing.id,
    },
  });

  // نمونه محصول رنو
  await prisma.product.upsert({
    where: { slug: "renault-brake-disc-front" },
    update: {
      name: "دیسک ترمز جلو رنو",
      code: "9012101",
      description: "دیسک ترمز جلو مناسب خودروهای رنو",
      image: "/images/parsilon-logo-fa.jpg",
      price: 9800000,
      stock: 10,
      isAvailable: true,
      compatibleCars: ["ال 90", "ساندرو"],
      brandId: renault.id,
      categoryId: brakeParts.id,
    },
    create: {
      name: "دیسک ترمز جلو رنو",
      slug: "renault-brake-disc-front",
      code: "9012101",
      description: "دیسک ترمز جلو مناسب خودروهای رنو",
      image: "/images/parsilon-logo-fa.jpg",
      price: 9800000,
      stock: 10,
      isAvailable: true,
      compatibleCars: ["ال 90", "ساندرو"],
      brandId: renault.id,
      categoryId: brakeParts.id,
    },
  });

  // نمونه محصول لادا
  await prisma.product.upsert({
    where: { slug: "lada-rear-bearing" },
    update: {
      name: "بلبرینگ چرخ عقب لادا",
      code: "9910101",
      description: "بلبرینگ چرخ عقب مناسب خودروهای لادا",
      image: "/images/parsilon-logo-fa.jpg",
      price: 6100000,
      stock: 6,
      isAvailable: true,
      compatibleCars: ["لادا نiva", "لادا samara"],
      brandId: lada.id,
      categoryId: bearing.id,
    },
    create: {
      name: "بلبرینگ چرخ عقب لادا",
      slug: "lada-rear-bearing",
      code: "9910101",
      description: "بلبرینگ چرخ عقب مناسب خودروهای لادا",
      image: "/images/parsilon-logo-fa.jpg",
      price: 6100000,
      stock: 6,
      isAvailable: true,
      compatibleCars: ["لادا niva", "لادا samara"],
      brandId: lada.id,
      categoryId: bearing.id,
    },
  });

  console.log("Seed completed.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });