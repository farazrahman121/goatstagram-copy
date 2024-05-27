import './App.css';
import React, {useState} from 'react';
import SearchForm from './components/SearchFormComponent.jsx';
import ActorCardComponent from './components/ActorCardComponent.jsx';
import axios from 'axios';
import config from './config.json';

function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState(null);

  const rootURL = config.serverRootURL;

  const handleSearch = async (searchParams) => {
    try {
      const response = await axios.get(`${rootURL}/query`, {params: searchParams}); // Refactoring root url to config
      setSearchResults(response.data);
      setError('');
    } catch (err) {
      setSearchResults([]);
      setError(err.response ? err.response.data.error : 'An error occurred');
    }
  };

  return (
    <div className="page-container">
      <div className="heading">IMDB Actor Search</div>
      <SearchForm onSearch={handleSearch}/>
      {error && <div className="error">{error}</div>}
      <div className="results">
        {searchResults && searchResults.map((img, idx) => (
          <ActorCardComponent key={idx} imagePath={img}/>
        ))}
      </div>
    </div>
  );
}

export default App;
