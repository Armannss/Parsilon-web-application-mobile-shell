import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { categories, products } from "../lib/data";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in .env.local or .env");
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

function parsePrice(price: string) {
  if (!price) return 0;
  if (price.includes("تماس")) return 0;

  const englishDigits = price
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[^\d]/g, "");

  return Number(englishDigits || 0);
}

function resolveStock(stock: string) {
  if (!stock) return { stock: 0, isAvailable: false };

  const normalized = stock.trim();

  if (normalized.includes("موجود")) {
    return { stock: 10, isAvailable: true };
  }

  if (normalized.includes("استعلام")) {
    return { stock: 0, isAvailable: false };
  }

  const englishDigits = normalized
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
    .replace(/[^\d]/g, "");

  const numericStock = Number(englishDigits || 0);

  return {
    stock: numericStock,
    isAvailable: numericStock > 0,
  };
}

function getBrandSlug(brandName: string) {
  if (brandName === "ایران‌خودرو") return "iran-khodro";
  if (brandName === "سایپا") return "saipa";

  return brandName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "");
}

async function seedCategories() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.title,
        isActive: true,
      },
      create: {
        name: category.title,
        slug: category.slug,
        isActive: true,
      },
    });

    console.log(`CATEGORY OK: ${category.title}`);
  }
}

async function seedBrands() {
  const uniqueBrands = Array.from(
    new Set(
      products
        .map((item) =>
          typeof item.brand === "string" ? item.brand.trim() : ""
        )
        .filter(Boolean)
    )
  );

  for (const brandName of uniqueBrands) {
    const brandSlug = getBrandSlug(brandName);

    await prisma.brand.upsert({
      where: { slug: brandSlug },
      update: {
        name: brandName,
        isActive: true,
      },
      create: {
        name: brandName,
        slug: brandSlug,
        logo: null,
        isActive: true,
      },
    });

    console.log(`BRAND OK: ${brandName}`);
  }
}

async function seedProducts() {
    for (const item of products) {
      const category = await prisma.category.findUnique({
        where: { slug: item.category },
        select: { id: true },
      });
  
      const brand = await prisma.brand.findUnique({
        where: { slug: getBrandSlug(item.brand) },
        select: { id: true },
      });
  
      const { stock, isAvailable } = resolveStock(item.stock);
      const price = parsePrice(item.price);
  
      const existingBySlug = await prisma.product.findUnique({
        where: { slug: item.slug },
        select: { id: true },
      });
  
      const existingByCode = await prisma.product.findUnique({
        where: { code: item.code },
        select: { id: true },
      });
  
      const existingProduct = existingBySlug || existingByCode;
  
      const productData = {
        name: item.name,
        slug: item.slug,
        code: item.code,
        description: item.description || item.shortDescription || null,
        image: item.image || null,
        price,
        stock,
        isAvailable,
        compatibleCars: Array.isArray(item.compatibleCars)
          ? item.compatibleCars
          : [],
        brandId: brand?.id || null,
        categoryId: category?.id || null,
      };
  
      if (existingProduct) {
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: productData,
        });
  
        console.log(`PRODUCT UPDATED: ${item.name}`);
      } else {
        await prisma.product.create({
          data: productData,
        });
  
        console.log(`PRODUCT CREATED: ${item.name}`);
      }
    }
  }

async function main() {
  console.log("Starting import...");

  await seedCategories();
  await seedBrands();
  await seedProducts();

  console.log("All categories, brands and products imported successfully.");
}

main()
  .catch((error) => {
    console.error("Import failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });