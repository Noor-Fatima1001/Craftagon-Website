const fs = require("fs");
const path = require("path");
const multer = require("multer");
const AppError = require("../utils/AppError");
const { randomFileName } = require("../utils/ids");
const { v2: cloudinary } = require("cloudinary");

const useCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const root = path.join(__dirname, "../../uploads");
const dirs = {
  products: path.join(root, "products"),
  payments: path.join(root, "payments"),
  banners: path.join(root, "banners"),
};

Object.values(dirs).forEach((d) => {
  try {
    fs.mkdirSync(d, { recursive: true });
  } catch (err) {
    console.warn(`Could not create ${d}:`, err.message);
  }
});

const ALLOWED = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

function cloudinaryStorage(folder) {
  return {
    _handleFile(_req, file, cb) {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `craftagon/${folder}`, resource_type: "image" },
        (err, result) => {
          if (err) return cb(err);
          cb(null, { filename: result.secure_url, path: result.secure_url, size: result.bytes });
        }
      );
      file.stream.pipe(stream);
    },
    _removeFile(_req, _file, cb) {
      cb(null);
    },
  };
}

function storage(folder) {
  if (useCloudinary) return cloudinaryStorage(folder);
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
  if (/^https?:\/\//.test(filename)) return filename;
  return `/uploads/${folder}/${filename}`;
}

module.exports = {
  productUpload,
  bannerUpload,
  paymentUpload,
  publicUrl,
  dirs,
};
