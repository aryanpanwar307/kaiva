import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Generate a signed upload params object for the Cloudinary upload widget.
 * This is called server-side so the API secret is never exposed to the client.
 */
export function generateSignedUploadParams(folder: string = "kaiva/products") {
  const timestamp = Math.round(new Date().getTime() / 1000);

  const paramsToSign = {
    folder,
    timestamp,
    upload_preset: undefined as string | undefined,
  };

  // Remove undefined keys
  Object.keys(paramsToSign).forEach(
    (key) =>
      paramsToSign[key as keyof typeof paramsToSign] === undefined &&
      delete paramsToSign[key as keyof typeof paramsToSign]
  );

  const signature = cloudinary.utils.api_sign_request(
    { folder, timestamp },
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    timestamp,
    signature,
    api_key: process.env.CLOUDINARY_API_KEY!,
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    folder,
  };
}

/**
 * Delete an asset from Cloudinary by public_id (server-side only).
 */
export async function deleteCloudinaryAsset(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
