import React from 'react';
import axios from 'axios';
import { Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const rootURL = 'http://localhost:8080';

export default function Invite({
    sender_id,
    sender_username,
    refresh
} : {
    sender_id: string,
    sender_username: string,
    refresh: () => void;
}) {

    const navigate = useNavigate();

    async function AcceptInvite() {
        console.log(sender_id, localStorage.getItem('userID'));

        try {
            const response = await axios.post(`${rootURL}/acceptInvite`, {
                senderID: sender_id,
                receiverID: localStorage.getItem('userID')
            });

            // refresh();

            navigate('/chat');
        } catch (error) {
            console.log(error);
        }
    }

    async function DeclineInvite() {
        try {
            const response = await axios.post(`${rootURL}/declineInvite`, {
                senderID: sender_id,
                receiverID: localStorage.getItem('userID')
            });
            console.log(response);
            refresh();
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <div className="flex">
            <Typography sx={{mx: 3}}> Chat with {sender_username}! </Typography>
            <Button 
                variant="outlined"
                onClick={() => AcceptInvite()}
            >
                Accept
            </Button>
            <Button
                variant="outlined"
                onClick={() => DeclineInvite()}
            >
                Decline
            </Button>
        </div>
    )
}