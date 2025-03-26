import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {generateUploadSignature, generateThumbnails} from "./utils/cloudinary.js";
import db from "./db.js"
import axios from "axios"
import { exec } from "child_process";

dotenv.config();

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get("/api/cloudinary-signature", generateUploadSignature);


exec("ffmpeg -version", (err, stdout, stderr) => {
  if (err) {
    console.error("❌ FFmpeg not found:", err);
  } else {
    console.log("✅ FFmpeg is installed:", stdout);
  }
});



app.get("/api/random", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM videos");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/video", async (req, res) => {
    try {
        const { title, videoUrl, thumbnailUrl } = req.body;
   
        if (!videoUrl || !thumbnailUrl) {
            return res.status(400).json({ error: "Video or thumbnail URL is missing" });
          }

        const result = await db.query(
            "INSERT INTO videos (title, video_url, thumbnail_url) VALUES ($1, $2, $3) RETURNING *",
            [title, videoUrl, thumbnailUrl]
        );

        res.status(201).json({ message: "Video uploaded successfully!", video: result.rows[0] });
    } catch (error) {
        console.error("Error uploading video", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

//get a video
app.get("/api/video/:id", async (req, res) => {
  const {id} = req.params;
  const result = await db.query("SELECT * FROM videos WHERE id = $1", [id]);
  res.json(result.rows[0]);
})

// Add Manual Chapters
app.post("/api/chapters/add", async (req, res) => {
  try {
      const { video_id, videoUrl, chapters } = req.body;

      // Insert chapters into the database (without thumbnail URLs)
      const values = chapters.map(ch => `(${video_id}, ${ch.start_time}, '${ch.title}', NULL)`).join(",");
      const query = `INSERT INTO chapters (video_id, start_time, title, thumbnail_url) VALUES ${values} RETURNING *`;

      const result = await db.query(query);

      // ✅ Respond quickly
      res.status(201).json({ message: "Chapters added successfully!", chapters: result.rows });

      // ✅ Call thumbnail generation asynchronously
      axios.post("https://video-chapters.onrender.com/api/chapters/generate-thumbnails", { video_id, videoUrl })
          .catch(err => console.error("Thumbnail generation failed:", err));

  } catch (error) {
      console.error("Error adding chapters:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/api/chapters/generate-thumbnails", async (req, res) => {
  try {
      const { video_id, videoUrl } = req.body;

      // Fetch chapters for the given video_id
      const chaptersResult = await db.query("SELECT * FROM chapters WHERE video_id = $1", [video_id]);
      const chapters = chaptersResult.rows;

      if (!chapters.length) {
          return res.status(404).json({ error: "No chapters found for this video" });
      }

      // Generate thumbnails for each chapter
      const chapterThumbnails = await generateThumbnails(videoUrl, chapters);

      // Update chapters with the generated thumbnails
      for (const chapter of chapters) {
          const thumbnailUrl = chapterThumbnails.find(t => t.start_time === chapter.start_time)?.url;
        

          if (thumbnailUrl) {
              await db.query(
                  "UPDATE chapters SET thumbnail_url = $1 WHERE id = $2",
                  [thumbnailUrl, chapter.id]
              );
          }
      }

      res.status(200).json({ message: "Thumbnails generated and updated successfully!" });
  } catch (error) {
      console.error("Error generating thumbnails:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
});
  
  // Fetch Chapters for a Video
app.get("/api/chapters/:id", async (req, res) => {
    try {
      const { id } = req.params;
    
      const result = await db.query("SELECT * FROM chapters WHERE video_id = $1 ORDER BY start_time ASC", [id]);
  
      if (result.rows.length === 0) {
        return res.status(404).json({ message: "No chapters found for this video" });
      }
    
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching chapters:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
});
  
  // Generate Chapters Using AI (Calls Python API)
app.post("/api/generateChaptersAI", async (req, res) => {
    try {
      const { video_url, video_id } = req.body;
  
      // Call Python AI API to generate chapters
      const response = await axios.post("http://localhost:5001/generate-chapters", { video_url });
  
      if (!response.data.chapters) {
        return res.status(500).json({ error: "Failed to generate chapters" });
      }
  
      // Save AI-generated chapters to database
      const aiChapters = response.data.chapters;
      const values = aiChapters.map(ch => `(${video_id}, ${ch.start_time}, '${ch.title}')`).join(",");
      const query = `INSERT INTO chapters (video_id, start_time, title) VALUES ${values} RETURNING *`;
  
      const result = await db.query(query);
      res.status(201).json({ message: "AI-generated chapters added!", chapters: result.rows });
    } catch (error) {
      console.error("Error generating AI chapters:", error);
      res.status(500).json({ error: "AI Processing Failed" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
