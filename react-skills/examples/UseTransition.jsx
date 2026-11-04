import { useState, useTransition } from 'react';

function SearchList() {
  const [input, setInput] = useState('');
  const [list, setList] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    setInput(e.target.value);

    startTransition(() => {
      const filteredList = Array(10000).fill(0).map((_, i) => ({
        id: i,
        name: `Item ${i} - ${e.target.value}`
      }));
      setList(filteredList);
    });
  };

  return (
    <div>
      <input 
        type="text" 
        value={input} 
        onChange={handleChange} 
        placeholder="Search items..."
      />
      {isPending && <p>Loading...</p>}
      <ul style={{ maxHeight: '300px', overflow: 'auto' }}>
        {list.map((item) => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}

export default SearchList;
