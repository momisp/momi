import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import GameDevPipeline from './GameDevPipeline.jsx';
import CircleSurvivorHost from '@modes/circle_survivor/CircleSurvivorHost.jsx';
import './GameDevPipeline.css';

function Home() {
  return (
    <div className="gdp-home">
      <h1>圆内幸存者 · 修仙试炼</h1>
      <p>多角色游戏流水线 + 模式五试玩入口</p>
      <nav className="gdp-home-links">
        <a href="/game-pipeline">进入流水线道台</a>
        <a href="/play/circle-survivor">开始试炼</a>
      </nav>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game-pipeline" element={<GameDevPipeline />} />
        <Route path="/play/circle-survivor" element={<CircleSurvivorHost />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
