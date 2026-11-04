import { useState, useDeferredValue } from 'react';

function SearchResults({ query }) {
  const deferredQuery = useDeferredValue(query);
  
  const results = Array(5000).fill(0).map((_, i) => ({
    id: i,
    text: `Result ${i} for "${deferredQuery}"`
  }));

  return (
    <div>
      <h3>Results for: {deferredQuery}</h3>
      <ul style={{ maxHeight: '300px', overflow: 'auto' }}>
        {results.map((item) => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>
    </div>
  );
}

function SearchApp() {
  const [query, setQuery] = useState('');

  return (
    <div>
      <input 
        type="text" 
        value={query} 
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Type to search..."
      />
      <SearchResults query={query} />
    </div>
  );
}

export default SearchApp;
