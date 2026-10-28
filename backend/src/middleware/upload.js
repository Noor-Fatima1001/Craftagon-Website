const fs = require("fs");
const path = require("path");
const multer = require("multer");
const AppError = require("../utils/AppError");
const { randomFileName } = require("../utils/ids");

const root = path.join(__dirname, "../../uploads");
const dirs = {
  products: path.join(root, "products"),
  payments: path.join(root, "payments"),
  banners: path.join(root, "banners"),
};

Object.values(dirs).forEach((d) => fs.mkdirSync(d, { recursive: true }));

const ALLOWED = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function storage(folder) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dirs[folder]),
    filename: (_req, file, cb) => {
      const ext = ALLOWED[file.mimetype] || path.extname(file.originalname).toLowerCase();
      cb(null, randomFileName(ext));
    },
  });
}

function fileFilter(_req, file, cb) {
  if (!ALLOWED[file.mimetype]) {
    return cb(new AppError("Only JPEG, PNG, or WebP images are allowed", 400));
  }
  cb(null, true);
}

function makeUploader(folder, maxBytes) {
  return multer({
    storage: storage(folder),
    fileFilter,
    limits: { fileSize: maxBytes, files: 6 },
  });
}

const productUpload = makeUploader("products", 4 * 1024 * 1024);
const bannerUpload = makeUploader("banners", 4 * 1024 * 1024);
const paymentUpload = makeUploader("payments", 5 * 1024 * 1024);

function publicUrl(folder, filename) {
  return `/uploads/${folder}/${filename}`;
}

module.exports = {
  productUpload,
  bannerUpload,
  paymentUpload,
  publicUrl,
  dirs,
};
