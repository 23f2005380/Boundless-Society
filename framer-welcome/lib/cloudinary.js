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

  const result = await cloudinary.uploader.upload(imageData, {
    folder,
    resource_type: "image",
    timeout: 120000, // 2 minutes timeout for large files
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