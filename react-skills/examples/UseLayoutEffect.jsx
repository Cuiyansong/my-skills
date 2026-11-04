import { useState, useLayoutEffect, useRef } from 'react';

function Tooltip({ text, children }) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);
  const childRef = useRef(null);

  useLayoutEffect(() => {
    if (childRef.current && tooltipRef.current) {
      const childRect = childRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      setPosition({
        top: childRect.bottom + 5,
        left: childRect.left + (childRect.width - tooltipRect.width) / 2
      });
    }
  }, [text]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <span 
        ref={childRef}
        style={{ cursor: 'pointer', textDecoration: 'underline' }}
      >
        {children}
      </span>
      {text && (
        <div
          ref={tooltipRef}
          style={{
            position: 'absolute',
            top: position.top,
            left: position.left,
            backgroundColor: '#333',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '14px',
            whiteSpace: 'nowrap',
            zIndex: 1000
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}

function TooltipExample() {
  return (
    <div>
      <h3>useLayoutEffect Example</h3>
      <p>
        Hover over the text to see the tooltip:
        <Tooltip text="This is a tooltip!">this text</Tooltip>
      </p>
    </div>
  );
}

export default TooltipExample;
