import {useState, useEffect} from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';
import { useNavigate } from 'react-router-dom';
import { CurrentUserContextType, useAuth } from "../context/AuthContext.tsx";

import Navbar from '../components/Navbar.tsx';

import AddRemoveFriend from '../components/AddRemoveFriend.tsx'

const FriendComponent = ({ name, add=true/*, remove=true*/ }: { name: string, add: boolean|undefined, remove: boolean|undefined}) => {
    return (
        <div className='rounded-md bg-slate-100 p-3 flex space-x-2 items-center flex-auto justify-between'>
            <div className='font-semibold text-base'>
                { name }
            </div>
        </div>
    )
}

interface Friend {
    username: string;
}

export default function Friends() {

    const navigate = useNavigate(); 
    const { username } = useParams();
    const { isLoggedIn, logout } = useAuth() as CurrentUserContextType;
    const rootURL = config.serverRootURL;

    if (!isLoggedIn) {
        navigate("/login");
    } 
    
    // TODO: add state variables for friends and recommendations
    const [friends, setFriends] = useState<Friend[]>([]);
    const [recommendations, setRecommendations] = useState([]);

    const feed = () => {
        navigate('/' + username + '/home');
    };
    const chat = () => {
        navigate("/"+ username+"/chat");
    };

    const fetchData = async () => {
        // TODO: fetch posts data and set appropriate state variables 
        try {
          const friendsResponse = await axios.get(`${rootURL}/${username}/friends`);
          setFriends(friendsResponse.data.results);

          const recomendationsResponse = await axios.post(`${rootURL}/friends/recommendations`, {
            userID: localStorage.getItem('userID'),
            token: localStorage.getItem('JWToken')
          });

          setRecommendations(recomendationsResponse.data.results);
          //console.log(response.data.results);
        } catch (error) {
          console.error('Error fetching posts data:', error);
          // Handle error appropriately in a real app
          setRecommendations([]);
        }
    };

    useEffect(() => {
        fetchData();
    }, [username, rootURL]);

    // useEffect(() => {
    //     const fetchData = async () => {
    //         try {
    //             // TODO: fetch the friends and recommendations data and set the appropriate state variables 
    //             const friendsResponse = await axios.get(`${rootURL}/${username}/friends`);
    //             const recommendationsResponse = await axios.get(`${rootURL}/${username}/recommendations`);
                
    //             // Set the appropriate state variables
    //             setFriends(friendsResponse.data.results || []);
    //             setRecommendations(recommendationsResponse.data.results || []);
    //         } catch (error) {
    //             console.error('Error fetching data:', error);
    //         }
    //     };

    //     fetchData();
    // }, [username, rootURL]);
    
    return (
        <div>
            <Navbar/>
            <div className='h-full w-full mx-auto max-w-[1800px] flex space-x-4 p-3'>
                <div className='font-bold text-2xl'>
                    { `${ username }'s friends` }
                    <div className='space-y-2'>
                        {
                            // TODO: map each friend of the user to a FriendComponent 
                            friends.map((friend, id) => (
                                <FriendComponent 
                                  key={id} 
                                  name={friend.username}
                                  add={true}
                                  remove={true}
                                />
                            ))
                        }
                    </div>
                    <div className='mt-2'>
                        <AddRemoveFriend />
                    </div>
                </div>
                <div className='font-bold text-2xl'>
                    { `${ username }'s recommended friends:` }
                    <div className='space-y-2'>
                        {recommendations && recommendations.map((recommendation, index) => (
                            <FriendComponent 
                                key={index} 
                                name={recommendation.username}
                            />
                        ))}
                        { recommendations.length === 0 && <div>No recommendations</div>}
                    </div>
                </div>
            </div>
        </div>
    )
}
