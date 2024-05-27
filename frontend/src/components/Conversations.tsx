import React from 'react';
import axios from 'axios';

const rootURL = 'http://localhost:8080';

import ChatInterface from './ChatInterface';
import { Box, Button, Grid, TextField, Typography } from '@mui/material';

export default function Conversations() {
    const [conversations, setConversations] = React.useState([] as any);
    const [chat, setChat] = React.useState([] as any);
    const [openChat, setOpenChat] = React.useState(false);
    const [currentConvo, setCurrentConvo] = React.useState('' as any);
    const [friendToInvite, setFriendToInvite] = React.useState('' as any);
    const userID = localStorage.getItem('userID');

    async function fetchConversations() {
        const response = await axios.get(`${rootURL}/getConversations`, {
            params: {
                userID: userID
            }
        });

        // this will output an array of conversation_ids, nothing particularly useful
        console.log(response.data);
        setConversations(response.data);
    }

    React.useEffect(() => {
        fetchConversations();
    }, []);

    // async function fetchChat(friendID: string) {
    //     const response = await axios.get(`${rootURL}/getChat`, {
    //         params: {
    //             userID: userID,
    //             friendID: friendID
    //         }
    //     });

    //     console.log(response.data);
    //     setChat(response.data);
    // }

    function handleChatChange(conversation_id: string, participants: string[]) {
        const otherID = participants.filter((participant: string) => participant !== userID);
        setCurrentConvo(conversation_id);
        setChat(otherID[1]);
        setOpenChat(true);
    }

    async function inviteFriend(friend_username: string, conversation_id: string)  {
        console.log(friend_username, conversation_id);
        try {
            const response = await axios.post(`${rootURL}/inviteToConversation`, {
                receiverUsername: friend_username,
                conversationID: conversation_id
            });

            console.log(response.data);
            setFriendToInvite('');
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <Box sx={{mx: 3}}>
            <Typography variant='h6' sx={{ mt: 3}}> Conversations </Typography>
            <Box sx={{mx: 3}}>
                {conversations.map((conversation: any) => {
                    const conversationID = conversation.conversation_id;
                    const members = conversation.participants;

                    const memberIDs = members.map((member: any) => member.username);
                    const participantString = memberIDs.join(", ");

                    return (
                        <div key={conversationID} className="w-[300px] flex justify-between">
                            <Box>
                            <Typography variant='body1'
                            sx={{ fontWeight: 'bold' }}>Conversation ID: {conversationID}</Typography>
                            <Typography variant='body2' 
                            sx={{ fontStyle: 'italic'}}>Participants: {participantString}</Typography>
                            </Box>
                            <Button
                                variant='outlined'
                                onClick={() => handleChatChange(conversationID, memberIDs)}
                            >Open</Button>
                        </div>
                    );
                })}
            </Box>
            <div className="mt-5">
                {openChat && 
                <div>
                    <Typography variant="h6">Chat</Typography>
                    you are talking with {chat}, you are {userID}
                    <Button 
                        variant="contained"
                        onClick={() => setOpenChat(false)}
                        sx={{mx: 2}}
                    >Leave Chat</Button>
                    <ChatInterface sender={userID ? userID : ""} conversation_id={currentConvo}/>
                    <Grid sx={{mt: 4}}>
                        <TextField
                            label="Invite a friend!"
                            variant="outlined"
                            value={friendToInvite}
                            onChange={(e) => setFriendToInvite(e.target.value)}
                        />
                        <Button
                            variant="contained"
                            onClick={() => inviteFriend(friendToInvite, currentConvo)}
                        >Invite</Button>
                    </Grid>
                </div>}
            </div>
        </Box>
    );
}