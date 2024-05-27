import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { ChatsBar } from '../components/ChatsBar.tsx';
import Navbar from '../components/Navbar'; 
// import { CurrentUserContextType, useAuth } from "../context/AuthContext.tsx";

const MessageComponent = ({ sender, message }: { sender: string, message: string }) => {
    return (
        <div>
            <div className={`w-full flex ${sender === 'user' && 'justify-end'}`}>
                {sender}
            </div>
            <div className={`w-full flex ${sender === 'user' && 'justify-end'}`}>
                <div className={`text-left max-w-[70%] p-3 rounded-md break-words ${sender === 'user' ? 'bg-blue-100' : 'bg-slate-200'}`}>
                    {message}
                </div>
            </div>
        </div>
    );
};

export default function ChatInterface({
    sender,
    conversation_id
} : {
    sender: string
    conversation_id: string
}) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    //const { username, username2 } = useParams();
    const rootURL = "http://localhost:8080";

    async function getMessages() {
        console.log(conversation_id);
        const conversationID = conversation_id;
        try {
            console.log(conversationID);
            const response = await axios.get(`${rootURL}/getMessageHistory`, {
                params: {
                    conversation_id: conversationID
                }
            });

            // parse the data back so that it is somehow relevant...
            const messages = response.data.messages.map((message: any) => {
                return {
                    sender: message.sender_id == sender ? 'user' : message.sender_username,
                    message: message.message
                };
            })

            console.log(messages);

            setMessages(messages);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        getMessages();

        const intervalId = setInterval(getMessages, 5000);

        // Clean up the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, []);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { sender: 'user', message: input };

        setMessages(messages => [...messages, userMessage]);

        try {
            await axios.post(`${rootURL}/messages/send`, {
                sender: sender,
                conversation_id: conversation_id,
                message: input
            });

            setInput(''); 
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div>
            <div className='w-[75%] mt-4'>             
                <div className='flex' style={{ height: '40vh' }}>
                    <div className='flex-grow flex flex-col' style={{ height: '100%' }}>
                        <div className='flex-grow' style={{ minHeight: 0 }}>
                            <div className='bg-slate-100 p-3 overflow-hidden' style={{ height: 'calc(100% - 40px)' }}>
                                <div className='h-full overflow-auto'>
                                    <div className='space-y-2 p-2'>
                                        {messages.map((msg, index) => (
                                            <MessageComponent key={index} sender={msg.sender} message={msg.message} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className='w-full flex space-x-2 mt-2' style={{ height: '40px' }}>
                                <input className='w-full outline-none border-none px-3 py-1 rounded-md'
                                    placeholder='Type a message...'
                                    onChange={e => setInput(e.target.value)}
                                    value={input}
                                    onKeyDown={e => {
                                        e.key === 'Enter' && sendMessage();
                                    }}
                                />
                                <button className='outline-none px-3 py-1 rounded-md text-bold bg-indigo-600 text-white' onClick={sendMessage}>Send</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}