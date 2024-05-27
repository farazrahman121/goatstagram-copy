import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { ChatsBar } from '../components/ChatsBar.tsx';
import Navbar from '../components/Navbar';
import InviteBar from '../components/InviteBar.tsx';
import Conversations from '../components/Conversations.tsx';
import { Box, Typography } from '@mui/material';

export default function ChatHome() {
    const username = localStorage.getItem('username');
    const [friendList, setFriendList] = useState([]);
    const [openChat, setOpenChat] = useState(false);
    const rootURL = "http://localhost:8080";

    // Function to fetch friends
    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const response = await axios.get(`${rootURL}/${username}/friends`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('JWToken')}`
                    }
                });
                // Assuming the backend returns an array of objects with { username: 'friendName' }
                setFriendList(response.data.results.map(friend => friend.username));
            } catch (error) {
                console.error('Error fetching friends:', error);
            }
        };

        fetchFriends();
    }, [username]);

    return (
        <div className='w-screen h-screen'>
            <Navbar/>
            <div className='flex flex-col' style={{ height: 'calc(100vh - 64px)' }}>
            <Typography variant='h3' className='mt-10' sx={{ 
                mt: 4, 
                letterSpacing: '.1rem', 
                fontFamily: 'monospace', 
                fontWeight: 700, 
                color: 'black',
                textAlign: 'center',
                textTransform: 'uppercase'
            }}>Home</Typography>
                <Box>
                    <Typography variant='h4' className='text-center' sx={{ mt:2 }}>Chats</Typography>
                    <InviteBar friends={friendList}/>
                </Box>
                <Conversations/>
            </div>
        </div>
    );
}
