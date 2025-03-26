import { v2 as cloudinary } from 'cloudinary';
import dotenv from "dotenv";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import fs from "fs";
import path from 'path';

// Ensure ffmpegStatic is correctly set
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
} else {
  console.error("❌ FFmpeg static binary not found");
}

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

// Generate Upload Signature
export const generateUploadSignature = (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, upload_preset: "ml_default" }, // ✅ Include upload_preset in signature
    process.env.CLOUDINARY_API_SECRET
  );

  res.json({
    timestamp,
    signature,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY, // Ensure API Key is sent to frontend
  });
};

// ✅ Generate Thumbnails Without Saving Locally
export const generateThumbnails = async (videoPath, chapters) => {
  const thumbnailUrls = [];

  for (let i = 0; i < chapters.length; i++) {
    const { start_time } = chapters[i];
    const tempThumbnailPath = `/tmp/thumbnail_${start_time}.jpg`; // ✅ Use /tmp for Render compatibility

    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: [start_time], 
          filename: tempThumbnailPath,
          size: "320x180",
        })
        .on("end", async () => {
          try {
            // ✅ Upload to Cloudinary Directly
            const result = await cloudinary.uploader.upload(tempThumbnailPath, {
              folder: "video-thumbnails",
              resource_type: "image",
            });

            thumbnailUrls.push({ start_time, url: result.secure_url });

            // ✅ Delete temporary file
            fs.unlinkSync(tempThumbnailPath);
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on("error", reject);
    });
  }
  return thumbnailUrls;
}