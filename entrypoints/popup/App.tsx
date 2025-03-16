import { useState, useCallback } from 'react';
import reactLogo from '@/assets/react.svg';
import wxtLogo from '/wxt.svg';
import './App.css';

const App = () => {
  const [count, setCount] = useState(0);

  const openWindowManager = useCallback(() => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('/manager.html'),
      pinned: true,
    });
  }, []);

  return (
    <>
      <div>
        <a href="https://wxt.dev" target="_blank" rel="noreferrer">
          <img src={wxtLogo} className="logo" alt="WXT logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>WXT + React</h1>
      <div className="card">
        <button onClick={openWindowManager}>
          Window Manager
        </button>
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the WXT and React logos to learn more
      </p>
    </>
  );
}

export default App;
