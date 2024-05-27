import {useState, useEffect} from 'react';
import axios from 'axios'; 
import { useParams } from 'react-router-dom';
import PostComponent from '../components/PostComponent'
import CreatePostComponent from '../components/CreatePostComponent';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { CurrentUserContextType, useAuth } from "../context/AuthContext.tsx";

type Comment = {
  comment_id: number;
  parent_id: number | null;
  username: string;
  text: string;
}
interface Post {
  title: string;
  username: string;
  attach: string;
  user_id: number;
  post_id: number;
  text: string;
  likes: number;
}

export default function NewsFeed() {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth() as CurrentUserContextType;
  const [posts, setPosts] = useState<Post[]>([]);
  const { username } = useParams();
  const rootURL = "http://localhost:8080";

  if (!isLoggedIn) {
    navigate("/login");
  }

  const fetchData = async () => {
    try {
      // '/news' is the endpoint to fetch general news feed
      const response = await axios.get(`${rootURL}/news`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('JWToken')}` }
      });

      setPosts(response.data.results);
      
      console.log("news posts fetched :)");
    } catch (error) {
      console.error('Error fetching news feed:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [rootURL]);

  const logOut = () => {
    logout();
  };

  const login = () => {
    navigate("/");
  };

  return (
    <div className='w-screen h-screen'>
      <Navbar/>
      <div className='mx-auto max-w-[1800px] flex flex-col justify-center items-center'>
        {
          posts.map((post, id) => (
            <PostComponent 
              key={id} 
              title={post.title}
              user={String(post.username)} 
              text={post.text}
              likes={post.likes} 
              content_url={post.attach}
              comments={[]}/>
          ))
        }
      </div>
    </div>

  );
}

