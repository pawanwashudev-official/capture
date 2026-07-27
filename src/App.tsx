import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ExternalLink, Camera, Send, Mail } from 'lucide-react';
import Home from './views/Home';
import Capture from './views/Capture';
import Unlock from './views/Unlock';
import SettingsView from './views/Settings';
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
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </main>
        
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>Capture</h3>
              <p>Restoring trust in photography through serverless end-to-end encryption.</p>
              <div className="footer-socials">
                <a href="https://github.com/pawanwashudev-official/NFCapture" target="_blank" rel="noopener noreferrer" title="GitHub"><ExternalLink size={20} /></a>
                <a href="https://instagram.com/pawan_washudev" target="_blank" rel="noopener noreferrer" title="Instagram"><Camera size={20} /></a>
                <a href="https://t.me/pawanwashudev" target="_blank" rel="noopener noreferrer" title="Telegram"><Send size={20} /></a>
                <a href="mailto:pawanwashudev@neubofy.in" title="Email"><Mail size={20} /></a>
              </div>
            </div>

            <div className="footer-info">
              <div className="founder-card">
                <p className="founder-name">Pawan Washudev</p>
                <p className="founder-title">Founder @ Neubofy</p>
                <a href="mailto:support@neubofy.in" className="support-link">support@neubofy.in</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            &copy; {new Date().getFullYear()} Capture. All rights reserved.
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
