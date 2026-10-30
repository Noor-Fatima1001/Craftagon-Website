const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const env = require("../config/env");
const Category = require("../models/Category");
const Product = require("../models/Product");
const { getSettings } = require("../services/settingsService");

function svgMug(color, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <rect width="800" height="800" fill="#f8fafc"/>
    <ellipse cx="380" cy="620" rx="180" ry="28" fill="#e2e8f0"/>
    <path d="M220 240 h300 a20 20 0 0 1 20 20 v280 a80 80 0 0 1 -80 80 h-180 a80 80 0 0 1 -80 -80 v-280 a20 20 0 0 1 20 -20 z" fill="${color}"/>
    <path d="M540 300 h50 a70 70 0 0 1 0 160 h-50" fill="none" stroke="${color}" stroke-width="36"/>
    <rect x="250" y="300" width="240" height="180" rx="8" fill="#fff" opacity="0.35"/>
    <text x="370" y="400" text-anchor="middle" font-size="28" fill="#334155" font-family="Georgia, serif">${label}</text>
  </svg>`;
}

function svgPen(color, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <rect width="800" height="800" fill="#f8fafc"/>
    <rect x="160" y="360" width="480" height="70" rx="20" fill="${color}"/>
    <polygon points="640,360 700,395 640,430" fill="#1e293b"/>
    <rect x="250" y="372" width="220" height="46" rx="6" fill="#fff" opacity="0.4"/>
    <text x="360" y="404" text-anchor="middle" font-size="22" fill="#0f172a" font-family="Georgia, serif">${label}</text>
  </svg>`;
}

function svgBook(color, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <rect width="800" height="800" fill="#f8fafc"/>
    <rect x="230" y="150" width="340" height="500" rx="12" fill="${color}"/>
    <rect x="250" y="170" width="300" height="460" rx="8" fill="#fff8f0"/>
    <text x="400" y="400" text-anchor="middle" font-size="26" fill="#1e293b" font-family="Georgia, serif">${label}</text>
  </svg>`;
}

function svgTumbler(color, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <rect width="800" height="800" fill="#f8fafc"/>
    <path d="M300 160 h200 l30 480 h-260 z" fill="${color}"/>
    <rect x="310" y="140" width="180" height="40" rx="8" fill="#334155"/>
    <rect x="330" y="300" width="140" height="140" rx="8" fill="#fff" opacity="0.35"/>
    <text x="400" y="380" text-anchor="middle" font-size="22" fill="#0f172a" font-family="Georgia, serif">${label}</text>
  </svg>`;
}

function svgGift(color, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
    <rect width="800" height="800" fill="#f8fafc"/>
    <rect x="220" y="300" width="360" height="280" rx="16" fill="${color}"/>
    <rect x="380" y="300" width="40" height="280" fill="#fbbf24"/>
    <rect x="220" y="420" width="360" height="40" fill="#fbbf24"/>
    <text x="400" y="400" text-anchor="middle" font-size="22" fill="#fff" font-family="Georgia, serif">${label}</text>
  </svg>`;
}

async function writeSvg(name, content) {
  const dir = path.join(__dirname, "../../uploads/products");
  fs.mkdirSync(dir, { recursive: true });
  const file = `${name}.svg`;
  fs.writeFileSync(path.join(dir, file), content);
  return `/uploads/products/${file}`;
}

async function run() {
  await mongoose.connect(env.mongoUri);
  await getSettings();

  const cats = [
    { name: "Customized Pens", slug: "pens", description: "Name-printed pens for offices and gifts", sortOrder: 1 },
    { name: "Mugs", slug: "mugs", description: "Ceramic mugs with custom text", sortOrder: 2 },
    { name: "Tumblers", slug: "tumblers", description: "Travel tumblers with a personal line", sortOrder: 3 },
    { name: "Diaries", slug: "diaries", description: "Dated diaries with a name on the cover", sortOrder: 4 },
    { name: "Notebooks", slug: "notebooks", description: "Everyday notebooks, personalized", sortOrder: 5 },
    { name: "Gifts", slug: "gifts", description: "Ready gift sets with custom text", sortOrder: 6 },
  ];

  const catDocs = {};
  for (const c of cats) {
    catDocs[c.slug] = await Category.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, new: true });
  }

  const products = [
    {
      name: "Classic Name Mug",
      slug: "classic-name-mug",
      category: "mugs",
      price: 1290,
      salePrice: 990,
      stock: 40,
      featured: true,
      bestseller: true,
      description: "A white ceramic mug with your name printed on the front. Dishwasher-safe print.",
      make: () => svgMug("#2563eb", "Your Name"),
      preview: { x: 50, y: 48, fontSize: 28, color: "#1e3a8a", align: "center", maxWidth: 50 },
    },
    {
      name: "Office Coffee Mug",
      slug: "office-coffee-mug",
      category: "mugs",
      price: 1190,
      stock: 35,
      featured: true,
      description: "Matte navy mug for desks and gifting. Add a short name or title.",
      make: () => svgMug("#1e40af", "Name"),
      preview: { x: 50, y: 48, fontSize: 24, color: "#ffffff", align: "center", maxWidth: 48 },
    },
    {
      name: "Metal Name Pen",
      slug: "metal-name-pen",
      category: "pens",
      price: 650,
      stock: 80,
      bestseller: true,
      description: "Brushed metal ballpoint with laser-style name print on the barrel.",
      make: () => svgPen("#64748b", "Name"),
      preview: { x: 45, y: 49.5, fontSize: 16, color: "#0f172a", align: "center", maxWidth: 36, rotation: -1 },
    },
    {
      name: "Gift Set Pen",
      slug: "gift-set-pen",
      category: "pens",
      price: 890,
      salePrice: 750,
      stock: 50,
      featured: true,
      description: "Presentation-box pen. Personalize with a name up to 18 characters.",
      make: () => svgPen("#0f766e", "Gift"),
      customization: { maxLength: 18 },
      preview: { x: 45, y: 49.5, fontSize: 16, color: "#042f2e", align: "center", maxWidth: 34, rotation: -1 },
    },
    {
      name: "Steel Travel Tumbler",
      slug: "steel-travel-tumbler",
      category: "tumblers",
      price: 1890,
      stock: 28,
      featured: true,
      bestseller: true,
      description: "Double-wall tumbler. Your text sits on the front panel.",
      make: () => svgTumbler("#0ea5e9", "Name"),
      preview: { x: 50, y: 48, fontSize: 22, color: "#082f49", align: "center", maxWidth: 32 },
    },
    {
      name: "Matte Black Tumbler",
      slug: "matte-black-tumbler",
      category: "tumblers",
      price: 2090,
      stock: 22,
      description: "Black insulated tumbler with light custom lettering.",
      make: () => svgTumbler("#111827", "Name"),
      preview: { x: 50, y: 48, fontSize: 22, color: "#f8fafc", align: "center", maxWidth: 32 },
    },
    {
      name: "Year Planner Diary",
      slug: "year-planner-diary",
      category: "diaries",
      price: 1490,
      stock: 30,
      featured: true,
      description: "Hardcover diary. Name is printed on the cover panel.",
      make: () => svgBook("#1d4ed8", "Diary"),
      preview: { x: 50, y: 50, fontSize: 26, color: "#1e3a8a", align: "center", maxWidth: 40 },
    },
    {
      name: "Leather-look Diary",
      slug: "leather-look-diary",
      category: "diaries",
      price: 1790,
      stock: 18,
      description: "Soft-touch diary with gold-style custom text.",
      make: () => svgBook("#7c2d12", "Name"),
      preview: { x: 50, y: 50, fontSize: 24, color: "#b45309", align: "center", maxWidth: 40 },
    },
    {
      name: "Everyday Notebook",
      slug: "everyday-notebook",
      category: "notebooks",
      price: 690,
      stock: 60,
      bestseller: true,
      description: "A5 ruled notebook. Add a name or a short phrase.",
      make: () => svgBook("#2563eb", "Notes"),
      preview: { x: 50, y: 50, fontSize: 24, color: "#1e3a8a", align: "center", maxWidth: 42 },
    },
    {
      name: "Kraft Sketch Notebook",
      slug: "kraft-sketch-notebook",
      category: "notebooks",
      price: 790,
      stock: 40,
      description: "Kraft cover notebook for sketches and lists.",
      make: () => svgBook("#a16207", "Sketch"),
      preview: { x: 50, y: 50, fontSize: 22, color: "#422006", align: "center", maxWidth: 42 },
    },
    {
      name: "Desk Gift Set",
      slug: "desk-gift-set",
      category: "gifts",
      price: 2490,
      salePrice: 2190,
      stock: 15,
      featured: true,
      description: "Pen and notebook set. One custom name is printed across the set.",
      make: () => svgGift("#2563eb", "Gift"),
      preview: { x: 50, y: 48, fontSize: 22, color: "#ffffff", align: "center", maxWidth: 45 },
    },
    {
      name: "Thank You Gift Box",
      slug: "thank-you-gift-box",
      category: "gifts",
      price: 2990,
      stock: 12,
      bestseller: true,
      description: "Ready-to-gift box. Personalize the sleeve with a short message.",
      make: () => svgGift("#be123c", "Thanks"),
      customization: { maxLength: 20, label: "Message" },
      preview: { x: 50, y: 48, fontSize: 20, color: "#fff7ed", align: "center", maxWidth: 45 },
    },
  ];

  for (const p of products) {
    const image = await writeSvg(p.slug, p.make());
    await Product.findOneAndUpdate(
      { slug: p.slug },
      {
        name: p.name,
        slug: p.slug,
        description: p.description,
        category: catDocs[p.category]._id,
        images: [image],
        price: p.price,
        salePrice: p.salePrice,
        active: true,
        featured: Boolean(p.featured),
        bestseller: Boolean(p.bestseller),
        customization: {
          enabled: true,
          required: true,
          maxLength: 24,
          label: "Custom name or text",
          ...(p.customization || {}),
        },
        preview: { enabled: true, fontFamily: "Georgia, serif", ...(p.preview || {}) },
      },
      { upsert: true, new: true }
    );
  }

  console.log("Seeded categories, products, and store settings");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
