import { useState } from 'react';
import axios from 'axios';
import config from '../../config.json';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { CurrentUserContextType, useAuth } from '../context/AuthContext';

function AddRemoveFriend() {
  const navigate = useNavigate(); 
  const [friendName, setFriendName] = useState('');
  const { username } = useParams();
  const rootURL = config.serverRootURL;
  const [ error, setError ] = useState<string | null>("");

  const addFriend = async (e: { preventDefault: () => void; }) => {
    console.log("add friend");
    e.preventDefault();
    try {
      const response = await axios.post(`${rootURL}/${username}/friends/add`, {
        friendName: friendName,
      });

      window.location.reload();

      console.log('request sent');
    } catch (error : any) {
      console.error('Error adding friend:', error);
      setError(error.response.data.error);
    }
  };

  const removeFriend = async (e: { preventDefault: () => void; }) => {
    console.log("remove friend");
    e.preventDefault();
    try {
      const response = await axios.post(`${rootURL}/${username}/friends/remove`, {
        friendName: friendName,
      });

      window.location.reload();

      console.log('request sent');
    } catch (error : any) {
      console.error('Error adding friend', error);
      setError(error.response.data.error);
    }
  };

  return (
    <div className='flex justify-center'>
    <form>
      <div className='rounded-md bg-slate-50 p-6 space-y-4 w-full'>
        <div className='flex space-x-4 items-center justify-between'>
          <label htmlFor="title" className='font-semibold text-lg'>Friend Name</label>
          <input id="title" type="text" className='bg-white rounded-md border border-gray-300 p-2'
            value={friendName} onChange={(e) => setFriendName(e.target.value)} />
        </div>
        <div className='w-full flex gap-4 justify-center'>
          <button type="button" className='px-4 py-2 text-lg rounded-md bg-blue-500 outline-none font-bold text-white'
            onClick={addFriend}>Add Friend</button>
          <button type="button" className='px-4 py-2 text-lg rounded-md bg-blue-500 outline-none font-bold text-white'
            onClick={removeFriend}>Remove Friend</button>
        </div>
        <div className='w-full flex justfy-center'>
            {error && <span className='text-red-500 whitespace-normal max-w-[200px]'>{error}</span>}
        </div>      
      </div>
    </form>
  </div>

   


  );
}

export default AddRemoveFriend;
