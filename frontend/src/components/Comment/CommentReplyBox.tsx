import { Button, TextField } from "@mui/material";
import React, { useState } from "react";

export default function CommentReplyBox({
    sendComment,
    close,
    postID,
    parentID
} : {
    postID: string | undefined,
    parentID: string | undefined,
    sendComment: (comment: string | undefined, postID: string | undefined, parentID: string | undefined) => void;
    close: () => void;
}) {
    const [comment, setComment] = useState('');

    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setComment(e.target.value);
    }

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendComment(comment, postID, parentID);
        setComment('');
        close();
    }

    return (
        <form onSubmit={handleCommentSubmit}>
            <TextField
                id="outlined-multiline-static"
                label="Reply"
                multiline
                rows={4}
                value={comment}
                onChange={handleCommentChange}
            />
            <Button type="submit">Reply</Button>
        </form>
    )
}