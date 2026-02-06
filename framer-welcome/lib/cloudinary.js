import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(imageData, options = {}) {
  const { folder = "uploads" } = options;

  const result = await cloudinary.uploader.upload(imageData, {
    folder,
    resource_type: "image",
    timeout: 120000,
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
  };
}

export async function uploadImages(images, options = {}) {
  const { folder = "uploads" } = options;

  const results = [];

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    const result = await uploadImage(image.data, { folder });
    results.push({
      ...result,
      sortOrder: i,
    });
  }

  return results;
}

export async function deleteImage(publicId) {
  const result = await cloudinary.uploader.destroy(publicId);
  return result;
}

export { cloudinary };
