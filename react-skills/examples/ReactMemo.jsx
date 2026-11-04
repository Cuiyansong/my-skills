import React from 'react';

const ExpensiveComponent = React.memo(function ExpensiveComponent({ data }) {
  return <div>{/* 复杂渲染逻辑 */}</div>;
});

export default ExpensiveComponent;