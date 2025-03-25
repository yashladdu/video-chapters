import React, { useRef, useEffect } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import "./vsg-skin.css";
import "../video.css";
import { useSearchParams } from 'react-router-dom';

const VideoPlayer = ({ videoUrl, thumbnailUrl, seekTime, currentTime, chapters }) => {
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    const chapterMarkersRef = useRef([]);
    const chapterSegmentsRef = useRef([]);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (!playerRef.current) {
            const videoElement = document.createElement("video-js");
            videoElement.classList.add("vjs-big-play-centered");

            videoRef.current.appendChild(videoElement);

            // ✅ Initialize Video.js Player
            const player = playerRef.current = videojs(videoElement, {
                controls: true,
                autoplay: true,
                preload: "auto",
                fluid: true,
                sources: [{ src: videoUrl, type: "video/mp4" }],
            });

            player.ready(() => {
              console.log("✅ Video.js Player Ready");
          
              player.on("timeupdate", () => {
                  currentTime(player.currentTime());
                  highlightActiveChapter();
              });
          
              player.on("loadedmetadata", () => {  // ✅ Wait for metadata
                  console.log("🎬 Video metadata loaded, duration:", player.duration());
          
                  addChapterMarkersAndSegments();  // ✅ Call function after duration is available
          
                  const startTime = parseFloat(searchParams.get("t"));
                  if (!isNaN(startTime)) {
                      player.currentTime(startTime);
                  }
              });
          });
         
        } else {
            // ✅ Update Source if Video Changes
            const player = playerRef.current;
            player.src([{ src: videoUrl, type: "video/mp4" }]);
        }

        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, [videoUrl, thumbnailUrl, currentTime, chapters]);

    // ✅ Handle Seeking
    useEffect(() => {
        if (playerRef.current && seekTime !== null) {
            playerRef.current.currentTime(seekTime);
        }
    }, [seekTime]);

    function addChapterMarkersAndSegments() {
      if (!playerRef.current) return;

      const progressBar =  playerRef.current.controlBar.progressControl.seekBar.el();
      console.log("📌 ProgressBar:", progressBar);
      if (!progressBar) return;

      // Clear existing markers and segments
      chapterMarkersRef.current.forEach(marker => marker.remove());
      chapterSegmentsRef.current.forEach(segment => segment.remove());
      chapterMarkersRef.current = [];
      chapterSegmentsRef.current = [];

      const duration = playerRef.current.duration();

      chapters.forEach((chapter, index) => {
        const start_time = chapter.start_time;
        const end_time = index < chapters.length - 1 ? chapters[index + 1].start_time : duration; // Next chapter’s start OR video end

        // 📌 Add Chapter Marker (small vertical line)
        const marker = document.createElement("div");
        marker.className = "chapter-marker";
        marker.dataset.index = index;
        marker.style.left = `${(start_time / duration) * 100}%`;

        progressBar.appendChild(marker);
        chapterMarkersRef.current.push(marker);

        // 📏 Add Chapter Segment (highlight bar)
        const segment = document.createElement("div");
        segment.className = "chapter-segment";
        segment.dataset.index = index;

        // Calculate position & width percentage
        const startPercent = (start_time / duration) * 100;
        const widthPercent = ((end_time - start_time) / duration) * 100;

        segment.style.left = `${startPercent}%`;
        console.log(`Marker ${index}: Start=${start_time}, Duration=${duration}, Left=${(start_time / duration) * 100}%`);
        segment.style.width = `${widthPercent}%`;

        progressBar.appendChild(segment);
        chapterSegmentsRef.current.push(segment);
      });
    }

    function highlightActiveChapter() {
      if (!playerRef.current) return;

      const activeIndex = getActiveChapterIndex();

      chapterSegmentsRef.current.forEach((segment, index) => {
          segment.classList.toggle("active", index === activeIndex);
      });
  }

    function getActiveChapterIndex() {
      const duration = playerRef.current.duration();

      return chapters.reduce((acc, ch, index) => {
          const start_time = ch.start_time;
          const end_time = index < chapters.length - 1 ? chapters[index + 1].start_time : duration;

          return (start_time <= playerRef.current.currentTime() && playerRef.current.currentTime() < end_time) ? index : acc;
      }, 0);
    }
    return (
        <div data-vjs-player>
            <div ref={videoRef} className="video-js " />
            
        </div>
    );
  };

export default VideoPlayer
