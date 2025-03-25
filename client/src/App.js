import './App.css';
import {BrowserRouter, Route, Routes} from "react-router-dom"
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Video from "./pages/Video"
import UploadVideo from './pages/UploadVideo';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path='/'/>
          <Route index element={<Home />} />
          <Route path="/upload" element={<UploadVideo />} />
          <Route path="/watch/:id" element={<Video />} />
      </Routes>
    </BrowserRouter>
    
  );
}

export default App;
