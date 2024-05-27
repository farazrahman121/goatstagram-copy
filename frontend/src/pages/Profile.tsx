import {useState, useEffect} from 'react';
import axios from 'axios'; 
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import PostComponent from '../components/PostComponent'

import Grid from '@mui/material/Grid'; 
import Navbar from '../components/Navbar';
import { Avatar, Container, Typography, Stack, Button, Modal, Autocomplete, TextField, Chip, Box } from '@mui/material';
import Create from '@mui/icons-material/Create';
import CreatePostComponent from '../components/CreatePostComponent';
import tagPresets from '../utils/tag-presets';
import FaceMatchComponent from '../components/FaceMatchComponent';

interface Post {
    title: string;
    user: string | null;
    user_id: number;
    post_id: number;
    text: string;
    likes: number;
    content_url: string;
    comments: any[];
}

interface User {
    info: any;
    username: string;
    birthday: string; // Assuming you want to show the birthday
    posts: Post[];
}

interface Hashtags {
    val: string[];
}

export default function Profile() {
    const navigate = useNavigate();
    const { username } = useParams<{username: string}>();
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [hashtags, setHashtags] = useState<Hashtags>({ val: [] });
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [actor, setActor] = useState('');

    const rootURL = "http://localhost:8080";

    const handleClose = () => setAddModalOpen(false);

    const fetchUserData = () => {
        try {
            axios.get(`${rootURL}/${username}/profile/`)
            .then(response => {
                console.log(response.data);
                setUser(response.data); 
                setHashtags(response.data.info[0].hashtags);
            })
            .catch(error => {
                console.error("Error fetching profile data", error);
            });
        } catch (error) {
            console.error('Error fetching posts data:', error);
        }
    }

    const handleSubmitEmail = async () => {
        try {
            await axios.post(`${rootURL}/${username}/profile/changeEmail`, {email: email});
            setEmail('');
            console.log("email changed");
        } catch (error) {
          console.log("change email failed.");
        }
    };

    const handleSubmitPassword = async () => {
        try {
            await axios.post(`${rootURL}/${username}/profile/changePassword`, {password: password});
            setPassword('');
            console.log("password changed");
        } catch (error) {
          console.log("change password failed.");
        }
    }

    const handleSubmitHashtags = async () => {
        try {
            await axios.post(`${rootURL}/deleteUserHashtags`, 
            {
                userID: localStorage.getItem('userID')
            });

            console.log(hashtags.val);

            await axios.post(`${rootURL}/postUserHashtag`, 
            {
                userID: localStorage.getItem('userID'),
                hashtagList: hashtags.val ? hashtags.val : []
            });

            console.log("hashtags changed");
            setHashtags({ val: [] });
            fetchUserData();
        } catch (error) {
          console.log(error);
        }
    }

    const handleSubmitActor = async () => {
        if (actor === '') {
            return;
        }

        try {
            await axios.put(`${rootURL}/matchUserActor`, {
                user_id: localStorage.getItem('userID'),
                actor_name: actor
            });

            // make a post about the status change
            const userID = localStorage.userID;
            const jwt = localStorage.JWToken;
                
            // SEND POST INFO FOR DB -- FIXED
            console.log("uploading post to db");
            
            await axios.post(`${rootURL}/createPost`, {
                userID: userID,
                token: jwt,
                title: `${username} changed their actor to ${actor}!`,
                text: `They are now linked to actor ${actor}.`,
                s3_content_key: ""
            }, { withCredentials: true });

            console.log("actor changed");
            setActor('');
            
            fetchUserData();
        } catch (error) {
          console.log(error);
        }
    }

    const modalSubmit = () => {
        setAddModalOpen(false);
        fetchUserData();
    }

    useEffect(() => {
        fetchUserData();
    }, [username, navigate, rootURL]);

    if (!user) {
        return <div>Loading...</div>;
    }

    function OwnerFunctions() {
        return (
            <>
                <Button
                    onClick={() => {
                        setAddModalOpen(true);
                    }}
                    variant="contained"
                    disableElevation
                    sx={{ marginRight: 2, mt: 1}}
                    endIcon={<Create />}
                    >
                    Create post
                </Button>
                <Modal
                    open={addModalOpen}
                    onClose={handleClose}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                >
                    <div className="mt-[50px]">                        
                        <CreatePostComponent
                            updatePosts={modalSubmit}
                        />
                    </div>
                </Modal>
            </>
        )
    }

    return (
        <div>
            <Navbar />
            <div className='flex flex-col w-[725px] mx-auto'>
                <Container sx={{mt: 6, mb: 6}}>
                    <Stack direction="row" alignItems="center">
                        <Avatar
                            sx={{ width: 100, height: 100}}
                        >{username}
                        </Avatar>
                        <Typography variant="h4" sx={{ ml: 2}}>
                            {username}'s profile
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ mt: 2}}>
                        <Typography variant="subtitle1">
                            {`${user.info[0].first_name} 
                            ${user.info[0].last_name}`}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ fontStyle: 'italic'}}>
                            {user.info[0].email}
                        </Typography>
                    </Stack>
                    <Typography variant="subtitle1">
                        User linked to actor: {user.info[0].actor[0].actor_name}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        {user.info[0].hashtags.map((tag : any, id : number) => {
                            return (
                                <Chip 
                                    key={id}
                                    variant="outlined" 
                                    sx={{ fontStyle: 'italic'}}
                                    label={`#${tag.hashtag}`}
                                />
                            );
                        })}
                    </Stack>
                    {localStorage.getItem('username') === username && <OwnerFunctions/>}
                </Container>

                {localStorage.getItem('username') === username && 
                <div className="ml-5">
                    <Box>
                        <TextField
                            value={email}
                            label="Change Email"
                            variant="outlined"
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Button
                            variant='outlined'
                            sx={{ mt: 2}}
                            onClick={handleSubmitEmail}
                        >
                            Save
                        </Button>
                    </Box>
                    <Box sx={{ mt: 2}}>
                        <TextField
                            value={password}
                            label="Change Password"
                            variant="outlined"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <Button
                            variant='outlined'
                            sx={{ mt: 2}}
                            onClick={handleSubmitPassword}
                        >
                            Save
                        </Button>
                    </Box>
                    <Autocomplete
                        multiple
                        id="tags-filled"
                        onChange={
                            (_, val) => {
                                console.log(val);
                                setHashtags(old => ({ ...old, val }));
                            }
                        }
                        options={tagPresets.map((option) => option)}
                        freeSolo
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                label="Hashtags"
                            />
                        )}
                        sx={{mt: 2}}
                    />
                    <Button
                        variant='outlined'
                        sx={{ mt: 2}}
                        onClick={handleSubmitHashtags}
                    >
                        Save
                    </Button>
                    <FaceMatchComponent
                        selectedActor={actor}
                        setSelectedActor={setActor}
                    />
                    <Button
                        variant='outlined'
                        sx={{ mt: 2}}
                        onClick={handleSubmitActor}
                    >
                        Change Actor
                    </Button>
                </div>
                }

                <div className="flex grid grid-cols-2 w-[725px] justify-center mb-10">
                    {user.posts.map((post, id) => (
                        <Grid item xs={2} md={4} key={id}>
                            <PostComponent 
                                key={id} 
                                title={post.title}
                                user={username || ""} // Assign an empty string if username is undefined
                                text={post.text}
                                likes={post.likes} 
                                content_url={post.content_url} // fill this in once S3 is set up on backend
                                comments={post.comments}
                                postID={post.post_id}
                            />
                        </Grid>
                    ))}
                </div>
            </div>
        </div>
    );
}