import { v2 as cloudinary } from "cloudinary";

// 1. Robust Configuration
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Single Image Upload
export async function uploadImage(imageData, options = {}) {
  const { folder = "uploads" } = options;
  const isTemplate = folder === "consent_templates";
  const isTripReg = folder === "trip_registrations";

  const result = await cloudinary.uploader.upload(imageData, {
    folder,
    resource_type: (isTemplate || isTripReg) ? "raw" : "image",
    timeout: 120000, // 2 minutes timeout for large files
  });

  // If the uploaded file is a PDF (and not a template or registration doc), replace the .pdf extension with .jpg
  if (!isTemplate && !isTripReg) {
    if (result.secure_url && result.secure_url.toLowerCase().endsWith(".pdf")) {
      result.secure_url = result.secure_url.replace(/\.pdf$/i, ".jpg");
    }
    if (result.url && result.url.toLowerCase().endsWith(".pdf")) {
      result.url = result.url.replace(/\.pdf$/i, ".jpg");
    }
  }

  return result;
}

// 3. Multiple Images Upload (Returns Array of URLs)
export async function uploadImages(images, options = {}) {
  const uploadPromises = images.map((image) => uploadImage(image, options));

  // Wait for all uploads
  const results = await Promise.all(uploadPromises);

  // CRITICAL FIX: Map the results to just the 'secure_url' string
  // This ensures the frontend receives ["https://...", "https://..."]
  return results.map((result) => result.secure_url);
}