// Custom image loader to optimize Cloudinary images on the fly.
export default function cloudinaryLoader({ src, width, quality }) {
  if (src && src.includes("res.cloudinary.com")) {
    // Avoid double-applying transformations
    if (!src.includes("/image/upload/w_") && !src.includes("/image/upload/c_")) {
      const targetWidth = width || 400;
      const targetQuality = quality || 75;
      const transformation = `w_${targetWidth},c_scale,q_${targetQuality},f_auto`;
      return src.replace("/image/upload/", `/image/upload/${transformation}/`);
    }
  }
  return src;
}
