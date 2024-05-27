import { Button, Container, Divider, Grid, Typography, IconButton } from '@mui/material';
import React, { useState, useEffect } from 'react';
import CommentReplyBox from './CommentReplyBox';
import { Reply } from '@mui/icons-material';
import axios from 'axios';

const rootURL = "http://localhost:8080";

interface CommentProps {
    parent_id: string | undefined;
    post_id: string | undefined;
    comment_id: string | undefined;
    username: string;
    comment_text: string;
    isRoot: boolean;
}

export default function Comment({
    parent_id,
    post_id,
    comment_id,
    user,
    text,
    isRoot,
    postComment
} : {
    parent_id: string | undefined;
    post_id: string | undefined;
    comment_id: string | undefined;
    user: string;
    text: string;
    isRoot: boolean;
    postComment: (comment: string | undefined, postID: string | undefined, parentID: string| undefined) => void;
}){
    const [open, setOpen] = useState(false);
    const [children, setChildren] = useState<CommentProps[]>([]);

    async function fetchChildren() {
        try {
            const response = await axios.get(`${rootURL}/getCommentsFromParent`, {
            params: {
                parent_id: comment_id
            }
            });

            setChildren(response.data.results);
        } catch (error) {
            console.error('Error fetching comments', error);
        }
    }

    async function handleCommentSubmit(comment: string | undefined, postID: string | undefined, parentID: string | undefined) {
        postComment(comment, postID, parentID);

        fetchChildren();
    }

    useEffect(() => {
        fetchChildren();
    }, [])

    return (
        <Container>
            <Typography variant={"h6"}>{user}</Typography>
            <Typography variant={"body1"}>
                {text}
                <IconButton
                    onClick={() => setOpen(!open)}
                    sx={{ my: 0 }}
                >
                    <Reply/>
                </IconButton>
            </Typography>
            
            {open && (
                <CommentReplyBox
                    sendComment={postComment}
                    postID={post_id}
                    parentID={comment_id}
                    close={() => setOpen(false)}
                />
            )}
            <Divider sx={{ my: 1 }}/>
            <Grid>
                {/* children */}
                {children.map((child, id) => (
                    <Comment
                        key={id}
                        parent_id={comment_id}
                        comment_id={child.comment_id}
                        post_id={post_id}
                        user={child.username}
                        text={child.comment_text}
                        isRoot={false}
                        postComment={handleCommentSubmit}
                    />
                ))}
            </Grid>
        </Container>
    )
}