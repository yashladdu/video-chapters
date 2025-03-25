import React, { useEffect, useState } from 'react'
import Card from '../components/Card'
import axios from "axios";
import Post from '../components/Card';

function Home() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const fetchVideos = async () => {
      const res = await axios.get("http://localhost:4000/api/random")
      setVideos(res.data);
    }
    fetchVideos();
  }, [])

  return (
    <div className="main">
        <div className='home-grid'>
        {videos.map((video) => (
          <Card 
          key={video.id}
          id={video.id}
          title={video.title}
          description={video.description}
          thumbnail={video.thumbnail_url}
          video={video.video_url}
          />
        ))}
      </div>
      
    </div>
    
  )
}

export default Home