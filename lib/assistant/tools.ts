import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  getProductBySlug,
  listProducts,
  type PublicProductPayload,
} from "@/lib/products-server";
import { SHIPPING_COST, VAT_RATE } from "@/lib/pricing";

export type ShownPart = Pick<
  PublicProductPayload,
  "slug" | "name" | "code" | "price" | "image" | "isAvailable"
>;

/** What the model sees for each part: enough to answer, nothing it could misuse. */
function summarize(product: PublicProductPayload) {
  return {
    slug: product.slug,
    name: product.name,
    technical_code: product.code,
    category: product.categoryName,
    car_brand: product.brand,
    compatible_cars: product.compatibleCars,
    price_rial: product.priceValue > 0 ? product.priceValue : null,
    in_stock: product.isAvailable,
    stock: product.stock,
    description: product.description || undefined,
  };
}

/**
 * Tools for one conversation turn. `shown` collects the parts the assistant
 * chose to display, so the page can render them as cards under its answer.
 */
export function createAssistantTools(shown: Map<string, ShownPart>) {
  const searchParts = betaZodTool({
    name: "search_parts",
    description:
      "Search the Parsilon catalogue. Use this for every question about which parts exist, their price or availability. " +
      "`car` must be an exact name from list_supported_cars; `query` is free text matched against part names and technical codes. " +
      "Returns at most 12 parts with live price and stock.",
    inputSchema: z.object({
      query: z
        .string()
        .max(100)
        .optional()
        .describe("Part name or technical code, e.g. 'دیسک ترمز' or '6010201'"),
      car: z
        .string()
        .max(60)
        .optional()
        .describe("Exact compatible car name, e.g. 'پراید'"),
      category: z
        .string()
        .max(60)
        .optional()
        .describe("Category slug from list_supported_cars, e.g. 'brake-parts'"),
      in_stock_only: z.boolean().optional(),
    }),
    run: async (input) => {
      const result = await listProducts({
        search: input.query,
        car: input.car,
        category: input.category,
        availableOnly: input.in_stock_only,
        limit: 12,
      });

      return JSON.stringify({
        total_matches: result.total,
        parts: result.products.map(summarize),
      });
    },
  });

  const getPart = betaZodTool({
    name: "get_part",
    description:
      "Get full details of one part by its slug (from search_parts). Use it before quoting a price or stock for a part discussed earlier in the conversation, since both change.",
    inputSchema: z.object({ slug: z.string().max(200) }),
    run: async ({ slug }) => {
      const product = await getProductBySlug(slug);
      return JSON.stringify(product ? summarize(product) : { error: "not_found" });
    },
  });

  const listSupportedCars = betaZodTool({
    name: "list_supported_cars",
    description:
      "List every car model the catalogue has parts for (with the number of parts each) and the part categories. Call this first when the customer names a car, to find the exact spelling used in the catalogue.",
    inputSchema: z.object({}),
    run: async () => {
      const [rows, categories] = await Promise.all([
        prisma.product.findMany({ select: { compatibleCars: true } }),
        prisma.category.findMany({
          where: { isActive: true },
          select: { name: true, slug: true },
        }),
      ]);

      const counts = new Map<string, number>();
      for (const row of rows) {
        for (const car of row.compatibleCars) {
          counts.set(car, (counts.get(car) ?? 0) + 1);
        }
      }

      return JSON.stringify({
        cars: [...counts].map(([name, parts]) => ({ name, parts })),
        categories,
      });
    },
  });

  const showParts = betaZodTool({
    name: "show_parts",
    description:
      "Display up to 4 parts to the customer as tappable cards under your answer. Call it once, with the parts you are recommending, after you have found them with search_parts.",
    inputSchema: z.object({
      slugs: z.array(z.string().max(200)).min(1).max(4),
    }),
    run: async ({ slugs }) => {
      const displayed: string[] = [];

      for (const slug of slugs) {
        const product = await getProductBySlug(slug);
        if (!product) continue;

        shown.set(product.slug, {
          slug: product.slug,
          name: product.name,
          code: product.code,
          price: product.price,
          image: product.image,
          isAvailable: product.isAvailable,
        });
        displayed.push(product.slug);
      }

      return JSON.stringify({ displayed });
    },
  });

  const getStorePolicies = betaZodTool({
    name: "get_store_policies",
    description:
      "Shipping costs, VAT and how ordering works. Use it for questions about delivery, payment or total cost.",
    inputSchema: z.object({}),
    run: async () =>
      JSON.stringify({
        shipping_rial: {
          normal_post_or_freight: SHIPPING_COST.NORMAL,
          express: SHIPPING_COST.EXPRESS,
        },
        vat_percent: VAT_RATE * 100,
        vat_applies_to: "parts subtotal plus shipping",
        ordering:
          "The customer adds parts to the cart and checks out in the app. Orders are reviewed by the sales team before shipping; there is no online payment yet.",
        wholesale: "Workshops and shops can submit a request at /wholesale.",
      }),
  });

  return [searchParts, getPart, listSupportedCars, showParts, getStorePolicies];
}
