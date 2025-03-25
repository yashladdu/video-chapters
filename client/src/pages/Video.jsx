import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer'
import axios from "axios";

function Video() {
    const [video, setVideo] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [seekTime, setSeekTime] = useState(null);  // ⬅ Store seek time here
    const [currentTime, setCurrentTime] = useState(0);
    const {id} = useParams();

    useEffect(() => {
        const fetchVideo = async () => {
            const res = await axios.get(`https://video-chapters.onrender.com/api/video/${id}`);
            setVideo(res.data);
        }

        const fetchChapters = async () => {
            const res = await axios.get(`https://video-chapters.onrender.com/api/chapters/${id}`);
            setChapters(res.data);
        }
        fetchVideo();
        fetchChapters();
    }, [id]);

    const activeChapterIndex = chapters.reduce((acc, ch, index) => {
        return ch.start_time <= currentTime ? index : acc;
    }, 0);

    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
      
        if (hrs > 0) {
          return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        } else {
          return `${mins}:${secs.toString().padStart(2, "0")}`;
        }
    };
    
  return (
    <div className="main">
        {video ? (
            <>
                <VideoPlayer 
                    videoUrl={video.video_url} 
                    thumbnailUrl={video.thumbnail_url} 
                    seekTime={seekTime}
                    currentTime={setCurrentTime}
                    chapters={chapters}
                />
                <h3 className='title'>{video.title}</h3>

                <div className="chapter-container">
                    <p>Chapters </p>
                    <div className="chapter-scroll" > 
                        {chapters.map((chapter, index) => (
                          <div key={index} className={`chapter-item ${index === (activeChapterIndex) ? "active" : ""}`} onClick={() => setSeekTime(chapter.start_time)}>
                            <Link>
                            <div className="chapter-thumbnail">
                                {chapter.thumbnail_url ? (
                                    <img src={chapter.thumbnail_url} alt={chapter.title} />
                                ) : (
                                    <img src={video.thumbnail_url} alt={chapter.title} /> 
                                )}
                                <span className="chapter-time">{formatTime(chapter.start_time)}</span>
                            </div>
                            <p className="chapter-title">{chapter.title}</p>
                            </Link>
                            </div> 
                        ))}
                    </div>     
                </div> 
            </>
            
        ) : (
            <p>Loading video...</p>
        )}
    </div>
  )
}

export default Video