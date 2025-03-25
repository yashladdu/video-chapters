import React from 'react'
import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <header>
    <a href="/"><span>Video Player</span></a>
    {/* <div className="search-bar">
      <input type="text" placeholder='Search...'/>
    </div> */}
    <nav>
      <Link to="/upload"><button><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      Upload</button></Link>
    </nav>
  </header>
  )
}

export default Navbar