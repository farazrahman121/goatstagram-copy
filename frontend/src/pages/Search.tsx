import { useState} from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import PostComponent from '../components/PostComponent';

const SearchPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            return;
        }
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`http://localhost:8080/searchPosts`, {
                query: searchQuery,
                userID: localStorage.getItem('userID'),
                token: localStorage.getItem('JWToken'),
            });

            console.log(response.data);

            setSearchResults(response.data.results); // Adjust according to your backend response structure
            setLoading(false);
        } catch (err) {
            console.error('Error searching posts:', err);
            setError('Failed to fetch search results.');
            setLoading(false);
        }
    };

    return (
        <div>
            <Navbar />
            <div className='flex flex-col items-center'>
                <div className='flex w-full max-w-[600px] p-4'>
                    <input
                        className='flex-grow outline-none border-2 border-gray-300 p-2 rounded-l-md'
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for posts..."
                    />
                    <button
                        className='bg-blue-500 text-white p-2 rounded-r-md'
                        onClick={handleSearch}
                    >
                        Search
                    </button>
                </div>
                {loading && <p>Loading...</p>}
                {error && <p className="text-red-500">{error}</p>}
                <div className='w-full p-4 '>

                    <div className='space-y-2 flex flex-col justify-center mx-auto items-center'>
                        {searchResults && searchResults.map((post, id) => (
                            <PostComponent 
                            key={id} 
                            title={post.title}
                            user={String(post.username)} 
                            text={post.text}
                            likes={post.likes} 
                            content_url={post.content_url} // fill this in once S3 is set up on backend
                            comments={post.comments}
                            postID={post.post_id}
                            />
                        ))}
                        {!searchResults && <p className="text-center">No results found</p>}
                        {/* {searchResults ? (

                            searchResults.map((result, index) => (
                                <div key={index} className='bg-white p-3 rounded-md shadow'>
                                    {result}
                                </div>
                            ))
                        ) : (
                            <p className="text-center">No results found</p>
                        )} */}
                    </div>
                </div>
            </div>
        </div>
    );    
};

export default SearchPage;
