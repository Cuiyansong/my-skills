import { useState, useCallback, useMemo } from 'react';

function ParentComponent() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);
  
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);
  
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.id - b.id);
  }, [items]);
  
  return <ChildComponent onClick={handleClick} items={sortedItems} />;
}

function ChildComponent({ onClick, items }) {
  return (
    <div>
      <button onClick={onClick}>Click me</button>
      <ul>
        {items.map(item => <li key={item.id}>{item.name}</li>)}
      </ul>
    </div>
  );
}

export default ParentComponent;