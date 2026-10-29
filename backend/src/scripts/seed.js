require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const { connectDb } = require('../config/db');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { getSettings } = require('../services/settingsService');

function svgMockup(title, accent) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">
  <rect width="900" height="700" fill="#f8fafc"/>
  <rect x="180" y="90" width="540" height="480" rx="28" fill="#ffffff" stroke="#e5e7eb"/>
  <rect x="230" y="150" width="440" height="300" rx="16" fill="${accent}"/>
  <text x="450" y="300" text-anchor="middle" font-family="Georgia,serif" font-size="28" fill="#ffffff">${title}</text>
  <text x="450" y="340" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" fill="#dbeafe">Custom text prints here</text>
  <text x="450" y="540" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#334155">Craftagon sample mockup</text>
</svg>`;
}

async function run() {
  await connectDb();
  await getSettings();
  const uploads = path.join(__dirname, '../../uploads/products');
  fs.mkdirSync(uploads, { recursive: true });

  const cats = [
    { name: 'Customized Pens', slug: 'pens', sortOrder: 1, description: 'Metal and plastic pens with printed names.' },
    { name: 'Mugs', slug: 'mugs', sortOrder: 2, description: 'Ceramic mugs for gifting and offices.' },
    { name: 'Tumblers', slug: 'tumblers', sortOrder: 3, description: 'Insulated tumblers with custom text.' },
    { name: 'Diaries', slug: 'diaries', sortOrder: 4, description: 'Hardcover diaries with foil or print names.' },
    { name: 'Notebooks', slug: 'notebooks', sortOrder: 5, description: 'Softcover notebooks for teams and students.' },
    { name: 'Gifts', slug: 'gifts', sortOrder: 6, description: 'Ready gift sets and extras.' },
  ];
  const categoryDocs = {};
  for (const c of cats) {
    const doc = await Category.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, new: true });
    categoryDocs[c.slug] = doc;
  }

  const products = [
    {
      name: 'Classic Metal Pen',
      slug: 'classic-metal-pen',
      category: 'pens',
      price: 450,
      featured: true,
      bestseller: true,
      description: 'A slim metal ballpoint pen. We print a name or short line on the barrel.',
      accent: '#1d4ed8',
      preview: { textY: 48, fontSize: 18, color: '#ffffff' },
    },
    {
      name: 'Executive Roller Pen',
      slug: 'executive-roller-pen',
      category: 'pens',
      price: 890,
      featured: true,
      description: 'Heavier rollerball pen for corporate gifts. Custom text on the clip side.',
      accent: '#0f172a',
      preview: { textY: 50, fontSize: 16, color: '#f8fafc' },
    },
    {
      name: 'White Ceramic Mug 11oz',
      slug: 'white-ceramic-mug',
      category: 'mugs',
      price: 750,
      featured: true,
      bestseller: true,
      description: 'Glossy ceramic mug. Your text is printed on the front panel.',
      accent: '#2563eb',
      preview: { textY: 44, fontSize: 26, color: '#ffffff' },
    },
    {
      name: 'Color Pop Mug',
      slug: 'color-pop-mug',
      category: 'mugs',
      price: 850,
      description: 'Two-tone mug with a coloured handle. Best for names up to 16 characters.',
      accent: '#1e40af',
      customization: { maxLength: 16 },
      preview: { textY: 45, fontSize: 24, color: '#eff6ff' },
    },
    {
      name: 'Steel Travel Tumbler',
      slug: 'steel-travel-tumbler',
      category: 'tumblers',
      price: 1450,
      featured: true,
      bestseller: true,
      description: 'Double-wall steel tumbler. Custom text wraps the centre band.',
      accent: '#334155',
      preview: { textY: 46, fontSize: 22, color: '#ffffff' },
    },
    {
      name: 'Matte Black Tumbler',
      slug: 'matte-black-tumbler',
      category: 'tumblers',
      price: 1650,
      description: 'Matte finish tumbler with a clear lid. High-contrast white text.',
      accent: '#111827',
      preview: { textY: 47, fontSize: 20, color: '#ffffff' },
    },
    {
      name: 'A5 Hardcover Diary',
      slug: 'a5-hardcover-diary',
      category: 'diaries',
      price: 1200,
      stock: 50,
      featured: true,
      description: 'Dated diary with ruled pages. Name is printed on the cover.',
      accent: '#1e3a8a',
      preview: { textY: 40, fontSize: 28, color: '#dbeafe' },
    },
    {
      name: 'Leather-look Planner',
      slug: 'leather-look-planner',
      category: 'diaries',
      price: 1890,
      stock: 22,
      bestseller: true,
      description: 'PU leather planner. Short names look best on the lower cover.',
      accent: '#3b82f6',
      customization: { maxLength: 18 },
      preview: { textY: 58, fontSize: 22, color: '#0f172a' },
    },
    {
      name: 'Softcover Notebook',
      slug: 'softcover-notebook',
      category: 'notebooks',
      price: 550,
      stock: 90,
      featured: true,
      description: 'Lightweight notebook for teams. Print a name or department on the cover.',
      accent: '#60a5fa',
      preview: { textY: 42, fontSize: 24, color: '#1e3a8a' },
    },
    {
      name: 'Kraft Sketch Notebook',
      slug: 'kraft-sketch-notebook',
      category: 'notebooks',
      price: 620,
      stock: 40,
      description: 'Kraft brown cover with dotted pages.',
      accent: '#92400e',
      preview: { textY: 44, fontSize: 22, color: '#fff7ed' },
    },
    {
      name: 'Desk Gift Set',
      slug: 'desk-gift-set',
      category: 'gifts',
      price: 2490,
      salePrice: 2290,
      stock: 18,
      featured: true,
      description: 'Pen and notebook set in a kraft box. One custom line for the recipient.',
      accent: '#1d4ed8',
      preview: { textY: 50, fontSize: 20, color: '#ffffff' },
    },
    {
      name: 'Thank-You Gift Box',
      slug: 'thank-you-gift-box',
      category: 'gifts',
      price: 1990,
      stock: 25,
      bestseller: true,
      description: 'Mug and mini diary packed together. Custom text is printed on the mug.',
      accent: '#2563eb',
      preview: { textY: 46, fontSize: 22, color: '#eff6ff' },
    },
  ];

  for (const p of products) {
    const file = `${p.slug}.svg`;
    fs.writeFileSync(path.join(uploads, file), svgMockup(p.name, p.accent));
    await Product.findOneAndUpdate(
      { slug: p.slug },
      {
        name: p.name,
        slug: p.slug,
        description: p.description,
        category: categoryDocs[p.category]._id,
        images: [`/uploads/products/${file}`],
        price: p.price,
        salePrice: p.salePrice || null,
        stock: p.stock,
        active: true,
        featured: Boolean(p.featured),
        bestseller: Boolean(p.bestseller),
        customization: {
          enabled: true,
          required: true,
          label: 'Name / custom text',
          minLength: 1,
          maxLength: p.customization?.maxLength || 24,
        },
        preview: {
          enabled: true,
          textX: 50,
          textY: p.preview.textY,
          fontSize: p.preview.fontSize,
          fontFamily: 'Georgia, serif',
          color: p.preview.color,
          textAlign: 'center',
        },
      },
      { upsert: true, new: true }
    );
  }
  console.log('Seed complete: categories and sample products are ready.');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
