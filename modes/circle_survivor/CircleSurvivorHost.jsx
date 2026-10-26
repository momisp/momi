import { Link } from 'react-router-dom';
import CircleSurvivorGame from './CircleSurvivorGame.jsx';

export default function CircleSurvivorHost() {
  return (
    <div className="cs-host">
      <nav className="cs-host-nav">
        <Link to="/">← 流水线道台</Link>
      </nav>
      <CircleSurvivorGame onExit={() => { window.location.href = '/'; }} />
    </div>
  );
}
