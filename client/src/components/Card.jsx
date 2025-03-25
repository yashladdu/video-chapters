import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import axios from "axios";
import { styled } from '@mui/material/styles';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';



function Post(props) {
  const [chapters, setChapters] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchChapter = async () => {
      const res = await axios.get(`https://video-chapters.onrender.com/api/chapters/${props.id}`);
      setChapters(res.data);
    }
    fetchChapter();
  }, [props.id]);

  const ExpandMore = styled((props) => {
    const { expand, ...other } = props;
    return <IconButton {...other} />;
  })(({ theme }) => ({
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
    variants: [
      {
        props: ({ expand }) => !expand,
        style: {
          transform: 'rotate(0deg)',
        },
      },
      {
        props: ({ expand }) => !!expand,
        style: {
          transform: 'rotate(180deg)',
        },
      },
    ],
  }));

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

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
    <div className={`card`}>
        <Link to={`/watch/${props.id}`} key={props.id}>
        <img src={props.thumbnail} alt="Thumbnail" />
        <div className="card-content">
            <h2>{props.title}</h2>   
        </div>
        
        </Link>
        <CardActions sx={{padding: "0px 10px"}}>
        <Typography 
          sx={{cursor: "pointer", fontSize: 14}}
          expand={expanded}
          onClick={handleExpandClick}>
          {!expanded ? `Chapters` : `${chapters.length} chapters in this video`}
        </Typography>

        <ExpandMore expand={expanded} onClick={handleExpandClick}>
          <ExpandMoreIcon />
        </ExpandMore>

        </CardActions>
        <Collapse in={expanded} timeout="auto" unmountOnExit >
          
        <CardContent sx={{paddingTop: 0,}}>
          <div className="chapter-container">
            <div className="chapter-scroll" > 
              {chapters.map((chapter, index) => (
                <Link to={`/watch/${props.id}?t=${chapter.start_time}`}>  <div key={index} className="chapter-item">
                    <div className="chapter-thumbnail">
                      {chapter.thumbnail_url ?  (
                        <img src={chapter.thumbnail_url} alt={chapter.title} />
                      ) : (
                        <img src={props.thumbnail} alt={chapter.title} />
                      )}
                      <span className="chapter-time">{formatTime(chapter.start_time)}</span>
                    </div>
                    <p className="chapter-title">{chapter.title}</p>
                  </div> 
                </Link>
                ))}
            </div>     
          </div>
         </CardContent>
       </Collapse>
     </div>
  )
}


export default Post