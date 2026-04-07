import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();
import multer from "multer";
import multerS3 from "multer-s3";

if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
    console.warn("⚠️ AWS S3 credentials are not fully configured in the .env file. Logo uploads will fail.");
}

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

export const uploadLogo = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const fileExtension = file.originalname.split(".").pop();
            const fileName = `company-logo-${Date.now()}.${fileExtension}`;
            cb(null, `logos/${fileName}`);
        },
    }),
    limits: {
        fileSize: 2 * 1024 * 1024, // 2 MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/svg+xml") {
            cb(null, true);
        } else {
            cb(new Error("Only JPEG, PNG, and SVG images are allowed"));
        }
    },
});

export const uploadProductImage = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const fileExtension = file.originalname.split(".").pop();
            const fileName = `product-image-${Date.now()}.${fileExtension}`;
            cb(null, `products/${fileName}`);
        },
    }),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB limit for product images
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/webp") {
            cb(null, true);
        } else {
            cb(new Error("Only JPEG, PNG, and WEBP images are allowed"));
        }
    },
});

export const uploadOrderDocument = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const fileExtension = file.originalname.split(".").pop();
            const prefix = file.fieldname === "poDocument" ? "po" : "payment";
            const fileName = `${prefix}-${Date.now()}.${fileExtension}`;
            cb(null, `orders/${fileName}`);
        },
    }),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB limit for order documents
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPEG, PNG, WEBP, and PDF files are allowed"));
        }
    },
});

export const uploadWarrantyMedia = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const fileExtension = file.originalname.split(".").pop();
            const fileName = `warranty-${Date.now()}.${fileExtension}`;
            cb(null, `warranty/${fileName}`);
        },
    }),
    limits: {
        fileSize: 20 * 1024 * 1024, // 20 MB limit for warranty media (videos)
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4",
            "video/quicktime",
            "video/x-msvideo"
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPEG, PNG, WEBP images and MP4, MOV, AVI videos are allowed"));
        }
    },
});

export const uploadDealerKYC = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            const fileExtension = file.originalname.split(".").pop();
            const fileName = `kyc-${Date.now()}-${file.fieldname}.${fileExtension}`;
            cb(null, `kyc/${fileName}`);
        },
    }),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB limit for KYC documents
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPEG, PNG, WEBP, and PDF files are allowed"));
        }
    },
});
