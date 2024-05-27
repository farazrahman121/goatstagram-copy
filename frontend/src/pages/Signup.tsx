import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import config from '../../config.json';
import FaceMatchComponent from '../components/FaceMatchComponent.tsx';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Autocomplete from '@mui/material/Autocomplete';
import tagPresets from '../utils/tag-presets.tsx';

interface Hashtags {
    val: string[];
}

export default function Signup() {
    const navigate = useNavigate(); 
    
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [actor, setActor] = useState('');
    const [error, setError] = useState<string>('');
    const [hashtags, setHashtags] = useState<Hashtags>({ val: [] });
    const [topHashtags, setTopHashtags] = useState<string[]>([]);

    const rootURL = config.serverRootURL;

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;

        switch(name) {
            case "username":
                setUsername(value);
                break;
            case "firstName":
                setFirstName(value);
                break;
            case "lastName":
                setLastName(value);
                break;
            case "email":
                setEmail(value);
                break;
            case "password":
                setPassword(value);
                break;
            case "confirmPassword":
                setConfirmPassword(value);
                break;
            default:
                break;
        }
    };

    const handleSubmit = async (e : React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        try {
            const hashtagArray = hashtags ? hashtags.val : [];
            console.log(hashtagArray);

            // Send registration request to backend
            await axios.post(`${rootURL}/register`, {
                username: username,
                first_name: firstName,
                last_name: lastName,
                email: email,
                password: password,
                actorName: actor,
                hashtags: hashtags.val
            });

            // If registration is successful, just sends use to the log in page
            navigate("/login");
        } catch (error) {
            // If registration is unsuccessful, alert the user
            console.log(error);
            setError("Registration failed");
        }
    };

    async function getTopHashtags() {
        try {

            const response = await axios.get(`${rootURL}/getTopHashtags`);

            const tophash = response.data.results.map((item : any) => {
                return item.hashtag;
            });

            setTopHashtags(tophash);
          
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        getTopHashtags();
    }, []);

    return (
        <Container maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography variant="h4" align="center" sx={{mb: 3}}>
                    Sign Up to Goatstagram
                </Typography>
                <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={2} sx={{mb: 2}}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Username"
                                value={username}
                                name="username"
                                required
                                fullWidth
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="First Name"
                                value={firstName}
                                name="firstName"
                                required
                                fullWidth
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Last Name"
                                value={lastName}
                                name="lastName"
                                required
                                fullWidth
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Email"
                                value={email}
                                name="email"
                                required
                                fullWidth
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Password"
                                value={password}
                                name="password"
                                type="password"
                                required
                                fullWidth
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Confirm Password"
                                value={confirmPassword}
                                name="confirmPassword"
                                type="password"
                                required
                                fullWidth
                                onChange={handleInputChange}
                            />
                        </Grid>
                        <Grid item xs={12}>
                          <Autocomplete
                              multiple
                              id="tags-filled"
                              onChange={
                                (_, val) => {
                                    setHashtags(old => ({ ...old, val }));
                                }
                            }
                              options={topHashtags.map((option) => option)}
                              freeSolo
                              renderInput={(params) => (
                                  <TextField
                                      {...params}
                                      variant="outlined"
                                      label="Hashtags"
                                  />
                              )}
                          />
                          {/* {
              //TODO: Check that this stuff actually works
                            topHashtags.map((hashtag, id) => (
                                <Hashtag 
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
                            } */}
                      </Grid>
                    </Grid>
                    <FaceMatchComponent
                        selectedActor={actor}
                        setSelectedActor={setActor}
                    />
                    <Collapse in={error !== ""} sx={{ mt: 2}}>
                        <Alert
                            severity="error"
                            variant="outlined"
                            action={
                                <IconButton
                                    aria-label="close"
                                    color="inherit"
                                    size="small"
                                    onClick={() => {
                                        setError("");
                                    }}
                                >
                                    <CloseIcon fontSize="inherit" />
                                </IconButton>
                            }
                        >
                            {error}
                        </Alert>
                    </Collapse>
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 2, mb: 2 }}
                    >
                        Sign Up
                    </Button>
                </Box>
            </Box>
        </Container>
    );

    
}
