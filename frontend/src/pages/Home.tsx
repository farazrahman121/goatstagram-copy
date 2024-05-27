import {useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios'; 

import PostComponent from '../components/PostComponent'
import CreatePostComponent from '../components/CreatePostComponent';
import Navbar from '../components/Navbar';
import UploadImages from '../components/UploadImages';

import { useNavigate } from 'react-router-dom';
import { CurrentUserContextType, useAuth } from "../context/AuthContext.tsx";

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

export default function Home() {
  
  const navigate = useNavigate(); 
  const { isLoggedIn, logout } = useAuth() as CurrentUserContextType;
  const [posts, setPosts] = useState<Post[]>([]);
  const [actorMatch, setActorMatch] = useState<string>('');
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
      const response = await axios.post(`${rootURL}/feed`, {
        userID: localStorage.getItem('userID'),
        token: localStorage.getItem('JWToken')
      });
      setPosts(response.data.results);
      console.log(response.data.results);

      const actorData = await axios.get(`${rootURL}/getActor`, 
        {params: {
          username: username
        }}
      )

      console.log(actorData.data.actor[0]);
      setActorMatch(actorData.data.actor[0].actor_name);

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
            {/* <PostComponent 
                key={0} 
                title={'ball'}
                user={'user1'} 
                text={'blender bsdf'}
                likes={0} 
                content_url={'https://i.imgur.com/crywdJl.png'} // fill this in once S3 is set up on backend
                comments={[
                  {comment_id: 1, parent_id: null, user: 'dpat', text: 'This is a comment.'},
                  {comment_id: 2, parent_id: 1, user: 'majanand', text: 'This is a reply.'}
                ]}
                postID={1}
            />
            <PostComponent 
                key={1} 
                title={'ball'}
                user={'user1'} 
                text={'blender bsdf'}
                likes={0} 
                content_url={'https://i.imgur.com/crywdJl.png'} // fill this in once S3 is set up on backend
                comments={[
                  {comment_id: 1, parent_id: null, user: 'dpat', text: 'This is a comment.'},
                  {comment_id: 2, parent_id: 1, user: 'majanand', text: 'This is a reply.'}
                ]}
                postID={1}
            /> */}
        </div>
    </div>
  )
}

