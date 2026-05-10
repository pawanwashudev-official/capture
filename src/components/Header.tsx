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
        <nav style={{ display: 'flex', gap: '0.75rem' }}>
           <button className="btn btn-outline" style={{ padding: '0.5rem 0.75rem', width: 'auto', fontSize: '0.8rem' }} onClick={() => navigate('/')}>
             <Home size={18} />
             <span>Request</span>
           </button>
           <button className="btn btn-primary" style={{ padding: '0.5rem 0.75rem', width: 'auto', fontSize: '0.8rem' }} onClick={() => navigate('/unlock')}>
             <UnlockIcon size={18} />
             <span>Unlock</span>
           </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
