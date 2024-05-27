import { useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { CurrentUserContextType, useAuth } from '../context/AuthContext';

function CreatePostComponent(
  { updatePosts } 
  : 
  { updatePosts: () => void }) 
{
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const { username } = useParams();
  const [ error, setError ] = useState<string | null>("");
  const [image, setImage] = useState<File | null>(null);
  const rootURL = "http://localhost:8080";


  // ---- TEST THIS IN THE FUTURE ----
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImage(e.target.files[0]);
    }
  }

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    console.log("handleSubmit");
    e.preventDefault();
    try {
      if (!image) {
        setError("Image is required");
        return;
      }

      console.log("requesting upload url");

      const userID = localStorage.userID;
      const jwt = localStorage.JWToken;

      console.log(userID);
      console.log(jwt);
      
      
      // GET PRE-SIGNED URL FOR S3 UPLOAD
      const s3UploadResponse = await axios.post(`${rootURL}/getS3TempPostUrl`, {

        userID: userID,
        token: jwt
      }, { withCredentials: true });

      console.log(s3UploadResponse);

      const presignedUrl = s3UploadResponse.data.url;
      const key = s3UploadResponse.data.objectKey;

      const options = {
        headers: {
          'Content-Type': image.type // Ensures the content type matches the file type
        }
      };

      // UPLOAD TO S3 W PRE-SIGNED URL
      console.log("using upload url");
      const s3PutResponse = await axios.put(presignedUrl, image, options);
      console.log(s3PutResponse);

          
      // SEND POST INFO FOR DB -- FIXED
      console.log("uploading post to db");
      const createPostResponse = await axios.post(`${rootURL}/createPost`, {
        userID: userID,
        token: jwt,
        title: title,
        text: caption,
        s3_content_key: key
      }, { withCredentials: true });

      console.log(createPostResponse);

      if (createPostResponse.status === 201 || createPostResponse.status === 200) {
        // Clear input fields
        setTitle('');
        setCaption('');
        setImage(null);
        
        // Update posts
        updatePosts();
      }


    } catch (error : any) {
      console.error('Error creating post:', error);
      setError(error.response.data.error);
    }
  };

  return (
    <div className='flex justify-center'>
    <form>
      <div className='rounded-md bg-slate-50 p-6 space-y-2 w-full'>

        <div className='font-bold flex w-full justify-center text-2xl mb-4'>
          Create Post
        </div>


        <div className='flex space-x-4 items-center justify-between'>
          <label htmlFor="title" className='font-semibold'>Title</label>
          <input id="title" type="text" className='bg-white rounded-md border border-gray-300 p-2'
            value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className='flex space-x-4 items-center justify-between'>
          <label htmlFor="image" className='font-semibold'>Image</label>
          <input id="image" type="file" accept="image/*" onChange={handleImageChange} />
        </div>

        <div className='flex space-x-4 items-center justify-between'>
          <label htmlFor="content" className='font-semibold'>Caption</label>
            <textarea
          placeholder="Content"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="border border-gray-300 p-2 rounded-md mb-2"
          rows={4}
          required
        ></textarea>
        </div>
        
        <div className='w-full flex justify-center'>
          <button type="button" className='px-4 py-2 rounded-md bg-indigo-500 outline-none font-bold text-white'
            onClick={handleSubmit}>Create Post</button>
        </div>
        <div className='w-full flex justfy-center'>
            {error && <span className='text-red-500 whitespace-normal max-w-[200px]'>{error}</span>}
        </div>      
      </div>
    </form>
  </div>

   


  );
}

export default CreatePostComponent;
