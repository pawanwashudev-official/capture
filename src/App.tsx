import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ExternalLink, Instagram, Send, Mail } from 'lucide-react';
import Home from './views/Home';
import Capture from './views/Capture';
import Unlock from './views/Unlock';
import Header from './components/Header';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/capture" element={<Capture />} />
            <Route path="/unlock" element={<Unlock />} />
          </Routes>
        </main>
        
        <footer className="footer">
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: 'var(--text)', margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 800 }}>NFCapture</h3>
            <p style={{ margin: 0, maxWidth: '300px', marginLeft: 'auto', marginRight: 'auto' }}>
              Restoring trust in photography through serverless cryptography.
            </p>
          </div>

          <a href="https://github.com/pawanwashudev-official/NFCapture" target="_blank" className="btn btn-github">
            <ExternalLink size={20} />
            Source Code
          </a>
          
          <div className="footer-links" style={{ marginTop: '2.5rem' }}>
            <a href="mailto:pawanwashudev@neubofy.in" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={16} /> Email
            </a>
            <a href="https://instagram.com/pawan_washudev" target="_blank" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Instagram size={16} /> Instagram
            </a>
            <a href="https://t.me/pawanwashudev" target="_blank" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Send size={16} /> Telegram
            </a>
          </div>

          <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', fontSize: '0.85rem' }}>
            <p style={{ margin: '0.25rem 0', color: 'var(--text)', fontWeight: 700 }}>Pawan Washudev</p>
            <p style={{ margin: '0.25rem 0' }}>Founder @ Neubofy</p>
            <p style={{ margin: '0.25rem 0' }}>Support: <a href="mailto:support@neubofy.in" style={{ color: 'var(--primary)', fontWeight: 600 }}>support@neubofy.in</a></p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
