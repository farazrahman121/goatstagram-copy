import {useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios'; 

import PostComponent from '../components/PostComponent'
import CreatePostComponent from '../components/CreatePostComponent';
import Navbar from '../components/Navbar';
import UploadImages from '../components/UploadImages';

import { useNavigate } from 'react-router-dom';
import { CurrentUserContextType, useAuth } from "../context/AuthContext.tsx";

import Typography from '@mui/material/Typography';

type Comment = {
  comment_id: number;
  parent_id: number | null;
  user: string;
  text: string;
}

interface Post {
  title: string;
  username: string;
  user_id: number;
  post_id: number;
  text: string;
  post_date: string;
  content_url: string;
  likes: number;
  comments: any[];
}

export default function Explore() {
  const navigate = useNavigate(); 
  const { isLoggedIn, logout } = useAuth() as CurrentUserContextType;
  const [posts, setPosts] = useState<Post[]>([]);
  const rootURL = "http://localhost:8080";

  const username = localStorage.getItem('username');

  //NOTE ANYONE CAN GET TO THE "HOME" FEED OF ANY OTHER USER
  // THEY CANT DO OR SEE ANYTHING (i think) BUT THIS SHOULD STILL BE STOPPED

  // if not logged in, redirect to login page
  if (!isLoggedIn) {
    navigate("/login");
  } 
  //  TODO: THE USER NAME PARAM SHOULD BE REMOVED

  const fetchData = async () => {
    // TODO: fetch posts data and set appropriate state variables 
    try {
      const response = await axios.get(`${rootURL}/explore`);
      setPosts(response.data.results);
      console.log(response.data.results);
    } catch (error) {
      console.error('Error fetching posts data:', error);
      // Handle error appropriately in a real app
    }
  };

  useEffect(() => {
    fetchData();
  }, [username, rootURL]);

  const logOut = () =>  {
    console.log("is you logging out???");
    logout();
  }

  const login = () => {
    navigate("/");
  }

  return (
    <div className='w-screen h-screen'>
        <Navbar/>
        <div className='mx-auto max-w-[1800px] flex flex-col justify-center items-center'>
            <Typography variant='h3' className='mt-10' sx={{ 
        mt: 4, 
        letterSpacing: '.1rem', 
        fontFamily: 'monospace', 
        fontWeight: 700, 
        color: 'black',
        textAlign: 'center',
        textTransform: 'uppercase'
    }}>Explore</Typography>
            {
              //TODO: Check that this stuff actually works
              posts.map((post, id) => (
                <PostComponent 
                  key={id} 
                  title={post.title}
                  user={String(post.username)} 
                  text={post.text}
                  likes={post.likes} 
                  content_url={post.content_url} // fill this in once S3 is set up on backend
                  comments={post.comments}
                  postID={post.post_id}
                />
              ))
            }
        </div>
    </div>
  )
}

