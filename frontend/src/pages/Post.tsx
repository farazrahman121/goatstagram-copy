import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    CardMedia, Divider, 
    Snackbar, 
    Typography, 
    Slide,
    SlideProps
} from '@mui/material';

import Comment from '../components/Comment/Comment';

const rootURL = "http://localhost:8080";

type CommentType = {
    comment_id: string,
    parent_id: string,
    post_id: string,
    user: string,
    comment_text: string
}

export default function Post() {
    const { postID } = useParams<{postID: string}>();
    const [postData, setPostData] = useState({
        title: '',
        user: '',
        content_url: '',
        text: ''
    });
    const [rootComment, setRootComment] = useState<CommentType>();
    const [state, setState] = React.useState({
        open: false,
        Transition: Slide,
    });
    const [snackMsg, setSnackMsg] = useState('');

    function SlideTransition(props: JSX.IntrinsicAttributes & SlideProps) {
    return <Slide {...props} direction="up" />;
    }

    const handleClick = (Transition: (props: any) => JSX.Element) => () => {
        setState({
            open: true,
            Transition,
        });
    };

    const handleClose = () => {
        setState({
          ...state,
          open: false,
        });
    };

    async function postComment(comment: string | undefined, postID: string | undefined, parentID: string | undefined) {
        //console.log(comment, postID, parentID);
        try {
            await axios.post(`${rootURL}/postComment`, {
                post_id: postID,
                parent_id: parentID,
                comment_text: comment,
                userID: localStorage.getItem('userID'),
                token: localStorage.getItem('JWToken')
            });


            fetchPostData();
            fetchRootComment();
            handleClick(SlideTransition)();
            setSnackMsg('Comment posted!');
            
            //if nothing else works we use this:
            //im sorry professor ives
            window.location.reload();
        } catch (error) {
            console.error('Error posting comment', error);
            setSnackMsg('Error posting comment');
        }
    }

    async function fetchRootComment() {
        console.log('fetching data');
        try {
            const response = await axios.get(`${rootURL}/getRootComment`, {
            params: {
                post_id: postID
            }
            });
            setRootComment({
                comment_id: response.data.results[0].comment_id,
                parent_id: response.data.results[0].parent_id,
                post_id: response.data.results[0].post_id,
                user: response.data.results[0].username,
                comment_text: response.data.results[0].comment_text
            });
            console.log('finished');
        } catch (error) {
            console.error('Error fetching comments', error);
        }
    }

    async function fetchPostData() {
        try {
            const response = await axios.get(`${rootURL}/getPost`, {
            params: {
                post_id: postID
            }
            });

            setPostData({
                title: response.data.results[0].title,
                user: response.data.results[0].username,
                content_url: response.data.results[0].content_url,
                text: response.data.results[0].text
            });
        } catch (error) {
            console.error('Error fetching post data', error);
        }
    }

    useEffect(() => {
        fetchPostData();
        fetchRootComment();
    }, []);

    return (
        <div>
            <Navbar/>
            <div className="flex flex-col justify-center">
                <div className="mx-auto">
                    <Card sx={{ width: 350, mt: 2}}>
                        <CardHeader
                            title={postData.title}
                            subheader={`@${postData.user}`}
                        />
                        <CardMedia
                            component="img"
                            image={postData.content_url}
                            alt=""
                            sx={{ height: 350, width: 350 }}
                        />
                        <CardContent>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                {postData.text}
                            </Typography>
                        </CardContent>
                    </Card>
                </div>
                <Divider sx={{ my: 2}}/>
                {rootComment && 
                <>
                    {}
                    <Comment
                        parent_id={postID}
                        post_id={postID}
                        comment_id={rootComment.comment_id}
                        user={rootComment.user}
                        isRoot={true}
                        text={rootComment.comment_text}
                        postComment={postComment}
                    />
                </>}
                <Divider sx={{ mt: 2, mb: 20}}/>
            </div>
            <Snackbar
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                open={state.open}
                onClose={handleClose}
                TransitionComponent={state.Transition}
                message={snackMsg}
                key={state.Transition.name}
                autoHideDuration={1200}
            />
        </div>
    );
}