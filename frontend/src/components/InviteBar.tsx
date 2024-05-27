import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Invite from './Invite.tsx';
import { Box, Button, Grid, Stack, Typography } from '@mui/material';

const rootURL = 'http://localhost:8080';

type InviteBarProps = {
    sender_id: string,
    sender_username: string,
}

export default function InviteBar({
    friends
} : {
    friends: string[]
}) {
    const [invites, setInvites] = useState<InviteBarProps[]>([]);
    
    async function getInvites() {
        const userID = localStorage.getItem('userID');

        // Get all invites for the user
        try {
            const response = await axios.get(`${rootURL}/getInvites`, 
                { params: { userID: userID } }
            );
            
            console.log(response.data);

            // Display the invites
            setInvites(response.data);
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        getInvites();
    }, []);

    async function inviteFriend(friend_username : string) {
        const userID = localStorage.getItem('userID');
        console.log(friend_username);

        //Send an invite to the user
        try {
            await axios.post(`${rootURL}/sendInvite`, {
                senderID: userID,
                receiver_username: friend_username
            });

            // Update the invites
            getInvites();
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <Box sx={{mx: 3}}>
            <Typography variant="h6">Invite users to talk to</Typography>
            <Stack>
                {friends && friends.map((friend, key) => {
                    return (
                        <Grid sx={{ flexDirection: 'row' }}>
                            <Typography>{friend}</Typography>
                            <Button
                                key={key}
                                onClick={() => inviteFriend(friend)}
                                variant="outlined"
                            >
                                Invite
                            </Button>
                        </Grid>
                    )
                })}
            </Stack>
            <Typography variant="h6" sx={{mt: 2}}>Conversation Requests</Typography>
            <div className="flex flex-col">
                {invites && invites.map((invite, key : number) => {
                    return (
                        <Invite 
                            key={key} 
                            sender_id={invite.sender_id}
                            sender_username={invite.sender_username}
                            refresh={getInvites}
                        />
                    )
                })}
            </div>
        </Box>
    )
}