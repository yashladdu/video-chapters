import React, {useState} from 'react'
import axios from "axios";
import { useNavigate } from "react-router-dom";
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import UploadIcon from '@mui/icons-material/Upload';

const UploadVideo = () => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [thumbnailUrl, setThumbnailUrl] = useState("");
    const [chapters, setChapters] = useState([{ start_time: "", title: "" }]);
    const [autoGenerate, setAutoGenerate] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState({ video: 0, thumbnail: 0 });
    const navigate = useNavigate();

    const timeToSeconds = (time) => {
      const parts = time.split(":").map(Number);
      if (parts.length === 3) {
          return parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
          return parts[0] * 60 + parts[1];
      }
      return 0; // Default if input is incorrect
    };
  
    const secondsToTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
    
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // ✅ Function to Remove Chapter
    const removeChapter = (index) => {
      const newChapters = chapters.filter((_, i) => i !== index);
      setChapters(newChapters);
    };
    

    const uploadToCloudinary = async (file, resourceType) => {
      if (!file) return;

      try {
        setUploading(prev => ({ ...prev, [resourceType]: true }));
        // Get Cloudinary upload signature
        const signatureRes = await axios.get("http://localhost:4000/api/cloudinary-signature");
        const {timestamp, signature, cloud_name, api_key} = signatureRes.data;

        // Prepare FormData for Cloudinary API
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", api_key);
        formData.append("timestamp", timestamp);
        formData.append("signature", signature);
        formData.append("resource_type", resourceType);
        formData.append("upload_preset", "ml_default");

        // Upload file to Cloudinary
        const cloudinaryRes = await axios.post(`https://api.cloudinary.com/v1_1/${cloud_name}/upload`, formData, {
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(prev => ({
              ...prev,
              [resourceType] : [percent]
            }));
          }
        });

        if (resourceType === "video") setVideoUrl(cloudinaryRes.data.secure_url);
        if (resourceType === "image") setThumbnailUrl(cloudinaryRes.data.secure_url);

      } catch (error) {
        console.error("Cloudinary upload error:", error);
      } finally {
        setUploading(prev => ({ ...prev, [resourceType]: false }));
      }
    }
    
    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!videoUrl || !thumbnailUrl) {
        alert("Please wait for uploads to complete.");
        return;
      }

      try {
        const videoResponse = await axios.post("http://localhost:4000/api/video", {
          title,
          description,
          videoUrl,
          thumbnailUrl,
        });

        const videoId = videoResponse.data.video.id;
  
        if (!autoGenerate) {
          await axios.post("http://localhost:4000/api/chapters/add", {
            video_id: videoId,
            videoUrl,
            chapters: chapters.filter(ch => ch.start_time !== "" && ch.title !== ""),
          });
        } else {
          // Call backend to generate chapters automatically
          await axios.post("http://localhost:4000/api/chapters/generate", { video_id: videoId });
        }
        alert("✅ Video uploaded successfully!");

        // ✅ Redirect User to the Video Page
        navigate(`/watch/${videoId}`);
  
      } catch (error) {
        console.error("Error uploading video:", error);
      }
    }
     
    return (
      <div className="main">
            <form onSubmit={handleSubmit} className='post-form'>
                <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                {/* <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required /> */}
                <label htmlFor="video">Video: </label>
                <input type="file" accept="video/*" name='video' onChange={(e) => uploadToCloudinary(e.target.files[0], "video")} required />
                {uploading.video && (
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress.video}%` }}></div>
                        <p>{progress.video}%</p>
                    </div>
                )}
                {videoUrl && <p>✅ Video Uploaded!</p>}
               
                <label htmlFor="video">Thumbnail: </label>            
                <input type="file" accept="image/*" onChange={(e) => uploadToCloudinary(e.target.files[0], "image")} required />
                {uploading.thumbnail && (
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress.thumbnail}%` }}></div>
                        <p>{progress.thumbnail}%</p>
                    </div>
                )}
                {thumbnailUrl && <p>✅ Thumbnail Uploaded!</p>}

                {/* <label>
                    <input type="checkbox" checked={autoGenerate} onChange={() => setAutoGenerate(!autoGenerate)} />
                    Auto-Generate Chapters
                </label> */}

                {!autoGenerate && (
                    <>
                        <h3>Manual Chapters</h3>
                        {chapters.map((chapter, index) => (
                            <div key={index} className="chapter-input">
                                <input
                                    type="text"
                                    placeholder="Start Time (MM:SS or HH:MM:SS)"
                                    value={secondsToTime(chapter.start_time)}
                                    onChange={(e) => {
                                        const newChapters = [...chapters];
                                        newChapters[index].start_time = timeToSeconds(e.target.value);
                                        setChapters(newChapters);
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="Chapter Title"
                                    value={chapter.title}
                                    onChange={(e) => {
                                        const newChapters = [...chapters];
                                        newChapters[index].title = e.target.value;
                                        setChapters(newChapters);
                                    }}
                                />
                                {/* ❌ Remove Button */}
                                <button type="button" onClick={() => setChapters([...chapters, { start_time: "", title: "" }])}><AddIcon /></button>
                                <button type="button" onClick={() => removeChapter(index)}><DeleteIcon /></button>
                            </div>
                        ))}
                        
                    </>
                )}

                <button className='post-btn' type="submit" disabled={!videoUrl || !thumbnailUrl || uploading.video || uploading.thumbnail}>
                    <UploadIcon />Post Video
                </button>
            </form>
        </div>
    );
  };
  
  export default UploadVideo;