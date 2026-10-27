import { Link } from 'react-router-dom';
import CircleSurvivorGame from './CircleSurvivorGame.jsx';

export default function CircleSurvivorHost() {
  return (
    <div className="cs-host">
      <nav className="cs-host-nav">
        <Link to="/">← 流水线道台</Link>
        <span className="cs-host-title">圆内幸存者 · 修仙试炼</span>
      </nav>
      <CircleSurvivorGame onExit={() => { window.location.href = '/'; }} />
    </div>
  );
}
