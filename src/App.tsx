import { HashRouter as Router, Routes, Route } from 'react-router-dom';
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
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'var(--text)', margin: '0 0 0.5rem 0' }}>NFCapture</h3>
            <p style={{ margin: 0 }}>100% Serverless. End-to-End Encrypted. No Database.</p>
          </div>
          
          <div className="footer-links">
            <a href="mailto:pawanwashudev@neubofy.in" className="footer-link">Email</a>
            <a href="https://instagram.com/pawan_washudev" target="_blank" className="footer-link">Instagram</a>
            <a href="https://t.me/pawanwashudev" target="_blank" className="footer-link">Telegram</a>
          </div>

          <div style={{ marginTop: '2rem', fontSize: '0.8rem' }}>
            <p style={{ margin: '0.25rem 0' }}>Developed by <strong>Pawan Washudev</strong></p>
            <p style={{ margin: '0.25rem 0' }}>Founder @ Neubofy</p>
            <p style={{ margin: '0.25rem 0' }}>Support: <a href="mailto:support@neubofy.in" style={{ color: 'inherit' }}>support@neubofy.in</a></p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
