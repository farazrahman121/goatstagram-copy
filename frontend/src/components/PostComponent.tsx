import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  CardContent, 
  Card, 
  CardHeader, 
  CardMedia, 
  Typography,
  CardActions,
  IconButton,
  Divider
} from '@mui/material';

import FavoriteIcon from '@mui/icons-material/Favorite';
import { ChatBubble } from '@mui/icons-material';
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

export default function PostComponent({
  title='Post title',
  user='arnavchopra',
  text='Lorem ipsum dolor sit amet consectetur adipisicing elit. Rem porro consequatur impedit dolor, soluta rerum mollitia ut eos fugiat! Amet nam voluptate quos delectus rem enim veritatis eius iste! Et.',
  likes=0,
  // THIS IS A TEMP URL FOR TESTING AND SHUOLD BE REPLACED BY GENERATING A NEW ONE ON S3
  content_url = 'https://publicgoatedbucket.s3.us-east-1.amazonaws.com/goatedpost.png?response-content-disposition=inline&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEIH%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCXVzLWVhc3QtMSJHMEUCIQCa5UzP6VvGdTpvtl935AjYYuLm7lW4jbs%2FK6ZJgXvWwAIgCSL5sciRbWSCGu4vz9HjsyaZG%2BXkPaC%2Bin1MmidvLPUq7QII2v%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARACGgwxNDYzMjcyMTcwODUiDFmLbkJokh27abuxQSrBAhzhUoYwlAcQFYoN%2Fu1KsZa1D89GC9kHgXKpFL0%2BGrKkj2IO5Vma01B4%2F5VdfNaYcXeIUGcQbsy6cGBvwlXDMHCuMmReZH2o0VB2%2BIJKYRwhcvwcYDOLC9K8SF2b1cTpFe9wcUaEnFMQs3%2BYvi3jIeMHmzNWbu%2FkxNzU0T0wnIavEpEWS9PU5%2FSvULt8QeQHGb1sCaUvLoYWrDT%2FpTjT7e4quTIBducbZQvKamQQq2MIT99b03eBnuovBSN688OfTFwYQP56FwCHfDsVG%2BDdykEtx9rQq6FIbU1oD1H427Ktzld1cqU0M5dFYoDHU9A4Hk9EUT4y7TA1W1d2nWXx%2FJPsaa6%2BqnBMJuUA6Jlz1Zz9zMPwSqKQ%2FI6BR4xAlocOdxQLuKLwHxBdbDd949fzUyr6yB36xc6SjPqByOXwChl%2FVTCOgemxBjqHAuUjtdSJ%2BUaXwpu8jH9QLTG7LaoSV5%2FiuRCfcf9IgJh0MU8bZNQ%2B1iziwMUZUN8vFOC9BIOig78OCCgDJ1ciPYKhQT1xhzVpq7v6pXsorN8UDmw05qcu2MtbN88WFvWkAuJXOb%2BBEgveZnqmEDRhoPCMKGxQPs5kjYiiZNKt6cX4xJbssaybAlNxNAPO8qAqi5k%2FnUHWsbanQ8zZexDzKvTYfxMebZ8nPtmPN4ZgXpAtT5TbHKJWlB1EGRgdvmf03iLHZfJS%2B0zo9TKjxsXiFxEiPQQPuT5hMaCRnWtkNJs4ysV8sNesWdn9RZa8QuvuyLigc2r2P25hY4DJL%2FO9S1yaKtlOsssQ&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240507T171509Z&X-Amz-SignedHeaders=host&X-Amz-Expires=43200&X-Amz-Credential=ASIASEEOIEO6ZSAXJ6PQ%2F20240507%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=86fd62c17b1eb515bb5a3de8d49476350696b7c012b74e9d70c51e216999c59b', 
  // TODO: ADJUST THE POST COMPONENT TO SHOW NESTER COMMENTS ALONG WITH USERNAMES
  // ALTERNATIVE TODO: CREATE A NEW COMPONENT FOR COMMENTS (like how on insta you click the comments button to be able to scroll through all of the comments)
  viewID=0,
  postID=0
} : {
  title: string,
  user: string,
  text: string,
  likes: number,
  content_url: string,
  comments: string[],
  // array of JSONs that containt comment text, username, coment_id, parent_id.
  isLiked?: boolean,
  viewID?: number,
  postID?: number
}) {
  const [isLiked, setIsLiked] = useState(false);
  const userID = viewID;
  const rootURL = "http://localhost:8080";
  const navigate = useNavigate();

  useEffect(() => {
    // check if the user has already liked the post
    if (localStorage.getItem('userID')) {
      axios.get(`${rootURL}/isLikedPost/`, {
        params: {
          postID: postID,
          userID: localStorage.getItem('userID'),
        }
      })
      .then(response => {
        console.log(response.data.isLiked);
        setIsLiked(response.data.isLiked);
      })
      .catch(error => {
        console.error('Error fetching like status', error);
      });
    }
    //fetchComments();
  }, []);

  async function setLikeStatus() {
    try {
      // check if the user has already liked the post
      const route = isLiked ? 'unlikePost' : 'likePost';
      console.log(userID, postID, localStorage.getItem('JWToken'));

      const response = await axios.post(`${rootURL}/${route}`, {
        postID: postID,
        userID: localStorage.getItem('userID'),
        token: localStorage.getItem('JWToken'),
      });
      setIsLiked(response.data.like);

    } catch (error) {
      console.error('Error setting like status', error);
    }
  }

  return (
    <Card sx={{ width: 350, mt: 2}}>
      <CardHeader
        title={title}
        subheader={`@${user}`}
      />
      <CardMedia
        component="img"
        image={content_url}
        alt=""
        sx={{ height: 350, width: 350 }}
      />
      <CardActions disableSpacing>
        <IconButton 
        aria-label="add to favorites"
        onClick={setLikeStatus}
        >
          {
            isLiked ? 
            <FavoriteIcon color="error"/> : 
            <FavoriteIcon />
          }
        </IconButton>
        {/* <Typography variant="body2" color="text.secondary">
          Number of likes: {likes}
        </Typography> */}
      </CardActions>
      <CardContent>
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
      <Divider sx={{ mt: 1, mb:2 }}/>
      <CardActions disableSpacing>
        <Typography variant="body2" color="text.secondary">
          Comments
        </Typography>
        <IconButton 
          aria-label="add to favorites"
          onClick={() => navigate(`/${postID}`)}
        >
          <ChatBubble />
        </IconButton>
      </CardActions>
      </CardContent>
    </Card>
  );
}
