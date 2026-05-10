import { Camera, Unlock as UnlockIcon, Home, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="header-content">
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', minHeight: '48px' }} 
          onClick={() => navigate('/')}
          role="button"
          aria-label="NFCapture Home"
        >
          <Camera size={26} color="var(--primary)" />
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text)' }}>NFCapture</h1>
        </div>
        <nav style={{ display: 'flex', gap: '0.4rem' }}>
           <button 
             className="btn btn-outline" 
             style={{ padding: '0.75rem', width: 'auto', border: 'none', background: 'transparent', minWidth: '48px', minHeight: '48px' }} 
             title="Home" 
             aria-label="Home"
             onClick={() => navigate('/')}
           >
             <Home size={22} />
           </button>
           <button 
             className="btn btn-outline" 
             style={{ padding: '0.75rem', width: 'auto', border: 'none', background: 'transparent', minWidth: '48px', minHeight: '48px' }} 
             title="Unlock Photo" 
             aria-label="Unlock Photo"
             onClick={() => navigate('/unlock')}
           >
             <UnlockIcon size={22} />
           </button>
           <button 
             className="btn btn-outline" 
             style={{ padding: '0.75rem', width: 'auto', border: 'none', background: 'transparent', minWidth: '48px', minHeight: '48px' }} 
             title="Settings" 
             aria-label="Settings"
             onClick={() => navigate('/settings')}
           >
             <Settings size={22} />
           </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;

