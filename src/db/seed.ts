import "dotenv/config";

import { db } from "./index";
import { users, products, reviews } from "./schema";
import { hashPassword } from "../lib/password";
import { sql } from "drizzle-orm";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@dresses.pk";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Dresses@Admin1";

const P = (n: string) => `/images/products/${n}.jpg`;

const seedProducts = [
  {
    slug: "noor-velvet-ensemble",
    name: "Noor Velvet Ensemble",
    description:
      "A regal midnight-blue velvet two-piece with hand-set gold tilla along the neckline and cuffs. Fully lined, stitched to your measurements — perfect for winter mehndis and evening receptions.",
    fabric: "Micro Velvet 9000",
    category: "Formal",
    colors: ["Blue", "Gold"],
    price: 14500,
    compareAtPrice: 16800,
    images: [P("p01"), P("p06")],
    featured: true,
  },
  {
    slug: "mehr-ivory-luxe",
    name: "Mehr Ivory Luxe",
    description:
      "Soft ivory three-piece with delicate threadwork across the bodice and a flowing chiffon dupatta. Understated, luminous, endlessly re-wearable.",
    fabric: "Chiffon & Raw Silk",
    category: "Formal",
    colors: ["White", "Gold"],
    price: 12800,
    images: [P("p02"), P("p05")],
    featured: true,
  },
  {
    slug: "shabnam-black-embroidered",
    name: "Shabnam Black Embroidered",
    description:
      "Jet-black kameez with tonal resham embroidery and mirror accents — dramatic without shouting. A Lahore-studio favourite for festive evenings.",
    fabric: "Georgette",
    category: "Party",
    colors: ["Black", "Silver"],
    price: 11200,
    compareAtPrice: 12900,
    images: [P("p03"), P("p09")],
    featured: true,
  },
  {
    slug: "gul-bahaar-lawn-suit",
    name: "Gul Bahaar Lawn Suit",
    description:
      "Feather-light printed lawn two-piece for everyday grace — breathable, colourfast, and cut generously for hot afternoons.",
    fabric: "Premium Lawn",
    category: "Casual",
    colors: ["White", "Pink"],
    price: 6400,
    images: [P("p04")],
    featured: false,
  },
  {
    slug: "chandni-white-classic",
    name: "Chandni White Classic",
    description:
      "The crisp white classic every wardrobe needs — chikankari-inspired front panel, pearl buttons, and a silhouette that flatters every height.",
    fabric: "Cambric Cotton",
    category: "Casual",
    colors: ["White"],
    price: 5800,
    compareAtPrice: 6800,
    images: [P("p05"), P("p04")],
    featured: false,
  },
  {
    slug: "zardozi-velvet-royal",
    name: "Zardozi Velvet Royal",
    description:
      "Plush velvet with antique zardozi hand-embroidery — an heirloom-grade formal stitched over forty hours in our Narowal atelier.",
    fabric: "Silk Velvet",
    category: "Formal",
    colors: ["Maroon", "Gold"],
    price: 16900,
    images: [P("p06"), P("p01")],
    featured: true,
  },
  {
    slug: "sunehri-evening-gown",
    name: "Sunehri Evening Gown",
    description:
      "A soft-gold draped gown with east-meets-west tailoring — structured bodice, fluid skirt, concealed pockets (yes, pockets).",
    fabric: "Satin Silk",
    category: "Party",
    colors: ["Gold", "Brown"],
    price: 13400,
    images: [P("p07")],
    featured: false,
  },
  {
    slug: "laal-anarkali",
    name: "Laal Anarkali",
    description:
      "A show-stopping crimson Anarkali with twelve kalis of pure movement, gold gota edging and a dupatta that catches every light in the room.",
    fabric: "Chiffon & Net",
    category: "Party",
    colors: ["Red", "Gold"],
    price: 15600,
    compareAtPrice: 18000,
    images: [P("p08"), P("b14")],
    featured: true,
  },
  {
    slug: "raat-ki-rani",
    name: "Raat Ki Rani",
    description:
      "Midnight-black formal with silver zari vines climbing the hem — elegant, slimming, and impossibly photogenic under evening lights.",
    fabric: "Raw Silk",
    category: "Formal",
    colors: ["Black", "Silver"],
    price: 10900,
    images: [P("p09"), P("p03")],
    featured: false,
  },
  {
    slug: "phool-jhaadi",
    name: "Phool Jhaadi",
    description:
      "A garden-print casual suit in warm terracotta tones with lace finishing — the piece you'll reach for every single week.",
    fabric: "Khaddar Blend",
    category: "Casual",
    colors: ["Brown", "Pink"],
    price: 7200,
    images: [P("p10"), P("p04")],
    featured: false,
  },
  {
    slug: "sheesh-mahal-bridal",
    name: "Sheesh Mahal Bridal Lehenga",
    description:
      "The signature DRESSES bridal — a scarlet lehenga dense with hand embroidery, kora-dabka and mirrorwork, hung with tassels of gold. Includes dupatta setting and a fitting call before dispatch.",
    fabric: "Bridal Raw Silk",
    category: "Bridal",
    colors: ["Red", "Gold"],
    price: 68000,
    compareAtPrice: 78000,
    images: [P("p11"), P("b13"), P("p12")],
    featured: true,
  },
  {
    slug: "heer-ranjha-bridal",
    name: "Heer Ranjha Bridal",
    description:
      "Romantic red-and-gold bridal with heritage zardozi borders and a sweetheart-neckline choli — stitched to your dream and your measurements.",
    fabric: "Velvet & Net",
    category: "Bridal",
    colors: ["Red", "Maroon", "Gold"],
    price: 54500,
    images: [P("p12"), P("b14"), P("b13")],
    featured: false,
  },
];

const seedReviews = [
  {
    authorName: "Ayesha Khan",
    location: "Lahore",
    rating: 5,
    text: "My Sheesh Mahal bridal arrived three days early and fit like it was poured onto me. The PKR 1,000 advance made ordering so easy — balance on delivery, zero stress.",
    productSlug: "sheesh-mahal-bridal",
  },
  {
    authorName: "Fatima Raza",
    location: "Sialkot",
    rating: 5,
    text: "Sent my measurements through WhatsApp, chose the Laal Anarkali, and wore it to my cousin's mehndi. Three aunties asked for the number that night.",
    productSlug: "laal-anarkali",
  },
  {
    authorName: "Mahnoor Asif",
    location: "Narowal",
    rating: 5,
    text: "Being local I picked mine up — the finishing inside is as neat as the outside. True boutique quality from a home atelier.",
    productSlug: "zardozi-velvet-royal",
  },
  {
    authorName: "Zainab Tariq",
    location: "Karachi",
    rating: 4,
    text: "Ordered two casual suits. Stitching is excellent and tracking updates kept me informed at every stage. Sleeves took a day longer than quoted but worth it.",
    productSlug: "gul-bahaar-lawn-suit",
  },
  {
    authorName: "Iqra Nadeem",
    location: "Islamabad",
    rating: 5,
    text: "The AI assistant helped me pick between M and custom — went custom and the fit is unreal. Payment through JazzCash took thirty seconds.",
    productSlug: "mehr-ivory-luxe",
  },
  {
    authorName: "Hira Shahid",
    location: "Gujranwala",
    rating: 5,
    text: "Third order this year. The Chandni white is my Friday uniform now — fabric still crisp after a dozen washes.",
    productSlug: "chandni-white-classic",
  },
  {
    authorName: "Amna Yousaf",
    location: "Faisalabad",
    rating: 5,
    text: "Bridal maxi with my own reference photo — they matched the embroidery from a Pinterest screenshot. Cried a little when I opened the box.",
    productSlug: "heer-ranjha-bridal",
  },
  {
    authorName: "Khadija Mir",
    location: "Rawalpindi",
    rating: 4,
    text: "Shabnam black for a dinner — got compliments all evening. Delivery took 9 days exactly as promised. Will order the velvet next.",
    productSlug: "shabnam-black-embroidered",
  },
  {
    authorName: "Rabia Anwar",
    location: "Multan",
    rating: 5,
    text: "COD for the balance is such a relief when ordering from a new brand. Quality exceeded the price point by miles.",
    productSlug: null,
  },
  {
    authorName: "Sana Javed",
    location: "Narowal",
    rating: 5,
    text: "The size guide was spot on and the kameez length option meant no post-purchase alterations. This is how online tailoring should work.",
    productSlug: "phool-jhaadi",
  },
];

async function main() {
  console.log("Seeding DRESSES database…");

  // Admin user (single admin — the business owner)
  const existingAdmin = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`email = ${ADMIN_EMAIL}`)
    .limit(1);

  if (existingAdmin.length === 0) {
    await db.insert(users).values({
      email: ADMIN_EMAIL,
      name: "DRESSES Admin",
      passwordHash: hashPassword(ADMIN_PASSWORD),
      role: "admin",
      provider: "email",
      emailVerified: true,
    });
    console.log(`  ✓ admin user created (${ADMIN_EMAIL})`);
  } else {
    console.log("  • admin user exists, skipping");
  }

  // Products
  const existingProducts = await db.select({ id: products.id }).from(products).limit(1);
  if (existingProducts.length === 0) {
    const inserted = await db
      .insert(products)
      .values(
        seedProducts.map((p) => ({
          ...p,
          sizes: ["XS", "S", "M", "L", "XL", "XXL", "Custom"] as string[],
          rating: 47,
          reviewCount: 0,
        })),
      )
      .returning({ id: products.id, slug: products.slug });

    const bySlug = new Map(inserted.map((r) => [r.slug, r.id]));
    console.log(`  ✓ ${inserted.length} products seeded`);

    // Reviews
    await db.insert(reviews).values(
      seedReviews.map((r) => ({
        authorName: r.authorName,
        location: r.location,
        rating: r.rating,
        text: r.text,
        productId: r.productSlug ? bySlug.get(r.productSlug) : null,
        approved: true,
      })),
    );
    console.log(`  ✓ ${seedReviews.length} reviews seeded`);

    // Update denormalized rating counts per product
    for (const r of seedReviews) {
      if (!r.productSlug) continue;
      const id = bySlug.get(r.productSlug);
      if (!id) continue;
      await db.execute(sql`
        UPDATE products p SET
          review_count = (SELECT count(*) FROM reviews WHERE product_id = ${id}),
          rating = COALESCE((SELECT round(avg(rating) * 10) FROM reviews WHERE product_id = ${id}), 50)
        WHERE p.id = ${id}
      `);
    }
    console.log("  ✓ product ratings synced");
  } else {
    console.log("  • products exist, skipping");
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
