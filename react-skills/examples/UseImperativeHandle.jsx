import { useRef, useImperativeHandle, forwardRef } from 'react';

const CustomInput = forwardRef((props, ref) => {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    clear: () => {
      inputRef.current.value = '';
    },
    getValue: () => {
      return inputRef.current?.value || '';
    }
  }));

  return <input ref={inputRef} type="text" {...props} />;
});

function ImperativeHandleExample() {
  const inputRef = useRef(null);

  const handleFocus = () => {
    inputRef.current?.focus();
  };

  const handleClear = () => {
    inputRef.current?.clear();
  };

  const handleGetValue = () => {
    const value = inputRef.current?.getValue();
    alert(`Current value: ${value}`);
  };

  return (
    <div>
      <h3>useImperativeHandle Example</h3>
      <CustomInput ref={inputRef} placeholder="Type something..." />
      <div style={{ marginTop: '10px' }}>
        <button onClick={handleFocus}>Focus</button>
        <button onClick={handleClear}>Clear</button>
        <button onClick={handleGetValue}>Get Value</button>
      </div>
    </div>
  );
}

export default ImperativeHandleExample;
