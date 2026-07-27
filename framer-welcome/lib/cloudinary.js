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

  // Detect if the file is a document (PDF, Word, etc.) vs a plain image
  const isDocument =
    imageData.startsWith("data:application/pdf") ||
    imageData.startsWith("data:application/msword") ||
    imageData.startsWith("data:application/vnd.openxmlformats") ||
    imageData.startsWith("data:application/octet-stream");

  const result = await cloudinary.uploader.upload(imageData, {
    folder,
    // Use "raw" for documents so Cloudinary stores them as-is without any conversion
    resource_type: isDocument ? "raw" : "image",
    timeout: 120000,
  });

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