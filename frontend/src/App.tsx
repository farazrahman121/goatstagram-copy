import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Friends from "./pages/Friends";
import ChatInterface from "./pages/ChatInterface";
import Profile from "./pages/Profile";
import NewsFeed from "./pages/NewsFeed"
import Search from "./pages/Search";
import ChatHome from "./pages/ChatHome";
import Post from "./pages/Post";
import Navbar from "./components/Navbar";
import Explore from "./pages/Explore";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path='/home' element={<Home />} />
          <Route path='/:username/friends' element={<Friends />} />
          <Route path="/:username/profile" element = {<Profile/>} />
          <Route path="/:username/news" element = {<NewsFeed/>} />
          <Route path="/" element={<Login />} />
          <Route path='/signup' element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path='/:postID' element={<Post/>}/>
          <Route path="/search" element = {<Search/>} />
          <Route path="/chat" element={<ChatHome/>} />
          <Route path="/explore" element={<Explore/>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
