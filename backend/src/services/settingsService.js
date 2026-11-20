const StoreSettings = require("../models/StoreSettings");
const AppError = require("../utils/AppError");
const env = require("../config/env");

const rowFields = {
  cityRates: ["city", "province", "fee"],
  paymentAccounts: ["method", "holderName", "accountNumber", "instructions", "active"],
  banners: ["title", "subtitle", "image", "ctaText", "ctaLink", "active"],
  faqs: ["question", "answer"],
  policies: null,
};

function escapeField(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/\r\n?|\n/g, "\\n");
}

function splitRow(line, section) {
  const fields = [];
  let value = "";
  let escaped = false;
  for (const char of line) {
    if (escaped) {
      if (char === "n") value += "\n";
      else if (char === "|" || char === "\\") value += char;
      else value += `\\${char}`;
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (char === "|") {
      fields.push(value);
      value = "";
    } else {
      value += char;
    }
  }
  if (escaped) value += "\\";
  fields.push(value);
  if (section !== "policies" && fields.length !== rowFields[section].length) {
    throw new AppError(`Each ${section} line must contain ${rowFields[section].length} fields`, 400);
  }
  if (section === "policies" && fields.length !== 2) {
    throw new AppError("Each policy line must contain a key and a value", 400);
  }
  return fields;
}

function encodeRows(rows, section) {
  const fields = rowFields[section];
  if (!Array.isArray(rows)) throw new AppError(`${section} must be a list`, 400);
  return rows
    .map((row) => fields.map((field) => escapeField(row[field])).join("|"))
    .join("\n");
}

function encodePolicies(policies) {
  if (!policies || typeof policies !== "object" || Array.isArray(policies)) {
    throw new AppError("Policies must be an object", 400);
  }
  return Object.entries(policies)
    .map(([key, value]) => `${escapeField(key)}|${escapeField(value)}`)
    .join("\n");
}

function decodeRows(text, section) {
  if (typeof text !== "string") {
    throw new AppError(`${section} must be plain text`, 500);
  }
  const rows = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (section === "policies") {
    const policies = {};
    for (const line of rows) {
      const [key, value] = splitRow(line, section);
      if (!key.trim() || Object.hasOwn(policies, key)) {
        throw new AppError("Policy keys must be non-empty and unique", 400);
      }
      policies[key] = value;
    }
    return policies;
  }
  return rows.map((line) => {
    const values = splitRow(line, section);
    const row = Object.fromEntries(rowFields[section].map((field, index) => [field, values[index]]));
    if (section === "cityRates") {
      const fee = Number(row.fee);
      if (!row.city.trim() || !Number.isFinite(fee) || fee < 0) {
        throw new AppError("City rate lines need a city and a non-negative fee", 400);
      }
      row.fee = fee;
    }
    if (section === "paymentAccounts" || section === "banners") {
      if (!["true", "false"].includes(row.active.toLowerCase())) {
        throw new AppError(`${section} active values must be true or false`, 400);
      }
      row.active = row.active.toLowerCase() === "true";
    }
    return row;
  });
}

const defaults = {
  storeName: "Craftagon",
  tagline: "Personalized gifts, printed with care",
  email: "craftagoncustomercare@gmail.com",
  orderNotificationEmail: "",
  whatsappNumber: env.storeWhatsapp,
  banners: [
    {
      title: "Gifts they will keep",
      subtitle: "Custom names on pens, mugs, tumblers, diaries and more",
      image: "",
      ctaText: "Shop now",
      ctaLink: "/products",
      active: true,
    },
  ],
  faqs: [
    {
      question: "How does customization work?",
      answer: "Enter a name or short text on the product page and add it to your cart.",
    },
    {
      question: "How do I pay?",
      answer: "Place your order, transfer the advance amount using the bank, Easypaisa, or JazzCash details shown, then upload your payment screenshot.",
    },
  ],
  policies: {
    shipping: "Orders are packed after advance payment is verified. Delivery times vary by city.",
    returns: "Customized items cannot be returned unless they arrive damaged or with a printing error.",
    privacy: "We use your contact details only to fulfill and support your order.",
  },
  delivery: { nationwideFlat: 250, cityRates: [{ city: "Karachi", province: "Sindh", fee: 200 }] },
  advance: { type: "percent", amount: 50, minAdvance: 500, productRules: [] },
  paymentAccounts: [
    {
      method: "COD",
      holderName: "Cash on delivery",
      accountNumber: "Pay remaining / agreed amount in cash to the courier",
      instructions: "Choose COD if you will pay in cash. Advance still applies unless it is set to zero. Staff confirm COD manually.",
      active: true,
    },
    {
      method: "Easypaisa",
      holderName: "Craftagon (placeholder)",
      accountNumber: "03000000000",
      instructions: "Send the advance as a transfer, then submit the transaction ID.",
      active: true,
    },
    {
      method: "JazzCash",
      holderName: "Craftagon (placeholder)",
      accountNumber: "03000000000",
      instructions: "Send the advance as a transfer, then submit the transaction ID.",
      active: true,
    },
  ],
  paymentDeadlineHours: 48,
  autoCancelEnabled: true,
};

function storedDefaults() {
  return {
    ...defaults,
    banners: encodeRows(defaults.banners, "banners"),
    faqs: encodeRows(defaults.faqs, "faqs"),
    policies: encodePolicies(defaults.policies),
    delivery: {
      ...defaults.delivery,
      cityRates: encodeRows(defaults.delivery.cityRates, "cityRates"),
    },
    paymentAccounts: encodeRows(defaults.paymentAccounts, "paymentAccounts"),
  };
}

async function migrateLegacySettings() {
  const legacy = await StoreSettings.collection.findOne({ key: "default" });
  if (!legacy) return;

  const set = {};
  const migrate = (path, value, section, encoder) => {
    if (value === undefined || typeof value === "string") return;
    set[path] = encoder(value, section);
  };

  migrate("banners", legacy.banners, "banners", encodeRows);
  migrate("faqs", legacy.faqs, "faqs", encodeRows);
  migrate("policies", legacy.policies, "policies", encodePolicies);
  migrate("paymentAccounts", legacy.paymentAccounts, "paymentAccounts", encodeRows);
  if (legacy.delivery && legacy.delivery.cityRates !== undefined && typeof legacy.delivery.cityRates !== "string") {
    set["delivery.cityRates"] = encodeRows(legacy.delivery.cityRates, "cityRates");
  }
  if (Object.keys(set).length) {
    await StoreSettings.collection.updateOne({ _id: legacy._id }, { $set: set });
  }
}

async function getSettingsDocument() {
  await migrateLegacySettings();
  let doc = await StoreSettings.findOne({ key: "default" });
  if (!doc) doc = await StoreSettings.create({ key: "default", ...storedDefaults() });
  return doc;
}

async function getSettings() {
  const doc = await getSettingsDocument();
  const settings = doc.toObject();
  settings.banners = decodeRows(doc.banners || "", "banners");
  settings.faqs = decodeRows(doc.faqs || "", "faqs");
  settings.policies = decodeRows(doc.policies || "", "policies");
  settings.paymentAccounts = decodeRows(doc.paymentAccounts || "", "paymentAccounts");
  settings.delivery = {
    ...settings.delivery,
    cityRates: decodeRows(doc.delivery?.cityRates || "", "cityRates"),
  };
  return settings;
}

function publicSettings(doc) {
  return {
    storeName: doc.storeName,
    tagline: doc.tagline,
    email: doc.email,
    phone: doc.phone,
    whatsappNumber: doc.whatsappNumber,
    address: doc.address,
    about: doc.about || {},
    help: doc.help || {},
    banners: (doc.banners || []).filter((b) => b.active !== false),
    faqs: doc.faqs || [],
    policies: doc.policies || {},
    paymentAccounts: (doc.paymentAccounts || [])
      .filter((a) => a.active !== false)
      .map((a) => ({
        method: a.method,
        holderName: a.holderName,
        accountNumber: a.accountNumber,
        instructions: a.instructions,
      })),
    paymentDeadlineHours: doc.paymentDeadlineHours,
  };
}

module.exports = {
  getSettings,
  getSettingsDocument,
  publicSettings,
  defaults,
  encodeRows,
  encodePolicies,
  decodeRows,
};
