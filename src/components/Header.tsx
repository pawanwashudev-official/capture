import { Camera, Unlock as UnlockIcon, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="header">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <Camera size={24} color="#4f46e5" />
          <h1>NFCapture</h1>
        </div>
        <nav style={{ display: 'flex', gap: '1rem' }}>
           <button className="btn btn-outline" style={{ padding: '0.5rem', width: 'auto' }} onClick={() => navigate('/')} title="Home">
             <Home size={20} />
           </button>
           <button className="btn btn-outline" style={{ padding: '0.5rem', width: 'auto' }} onClick={() => navigate('/unlock')} title="Unlock Photo">
             <UnlockIcon size={20} />
           </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
