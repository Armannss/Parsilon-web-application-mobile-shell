import "dotenv/config";
import { PrismaClient } from "@prisma/client";
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

const PRICE_UPDATES: Record<string, number> = {
  "6010101": 16879000,
  "6020101": 19055000,
  "6050101": 13650000,
  "6010301": 18560000,
  "6010302": 13969000,
  "6010701": 19169000,
  "6011010": 22566000,
  "6010501": 18174000,
  "6010401": 11135000,
  "6020401": 12767000,
  "6010801": 14035000,
  "6010802": 12767000,
  "6030202": 13797000,
  "6010201": 9681000,
  "6020203": 12013000,
  "6020201": 11613000,
  "6020202": 11613000,
  "6020204": 21102000,
  "6030201": 5493000,
  "6010601": 14800000,
  "6020601": 16991000,
  "6030101": 5970000,
  "6010901": 20997000,
  "6010902": 18809000,
  "6040101": 11160000,
  "6040102": 4560000,
  "6040105": 2860000,
  "6040104": 3590000,
  "6040106": 13980000,
  "6040201": 12190000,
  "6040103": 3250000,
};

async function main() {
  let updated = 0;
  const missing: string[] = [];

  for (const [code, price] of Object.entries(PRICE_UPDATES)) {
    const product = await prisma.product.findUnique({
      where: { code },
      select: { id: true, code: true, name: true, price: true },
    });

    if (!product) {
      missing.push(code);
      continue;
    }

    await prisma.product.update({
      where: { code },
      data: { price },
    });

    updated += 1;
    console.log(`UPDATED ${code} | ${product.name} | ${product.price} -> ${price}`);
  }

  console.log("UPDATED COUNT:", updated);
  console.log("MISSING CODES:", missing);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });