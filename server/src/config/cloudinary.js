const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let resourceType = "auto";
    let folder = "university/materials";

    if (file.mimetype.startsWith("image/")) {
      folder = "university/images";
    } else if (file.mimetype === "application/pdf") {
      folder = "university/pdfs";
      resourceType = "raw";
    } else if (
      file.mimetype.includes("presentation") ||
      file.originalname.match(/\.pptx?$/)
    ) {
      folder = "university/presentations";
      resourceType = "raw";
    }

    return {
      folder,
      resource_type: resourceType,
      allowed_formats: [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "pdf",
        "ppt",
        "pptx",
        "doc",
        "docx",
      ],
    };
  },
});

const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

module.exports = { cloudinary, upload };
