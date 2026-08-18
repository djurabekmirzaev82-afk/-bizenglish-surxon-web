// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import SpeakingHome from './speaking/index';
import TopicDetail from './speaking/TopicDetail';

function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: '10px', background: '#f0f0f0', display: 'flex', gap: '20px' }}>
        <Link to="/">🏠 Bosh sahifa</Link>
        <Link to="/speaking">🎤 Speaking</Link>
      </nav>
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/speaking" element={<SpeakingHome />} />
        <Route path="/speaking/:id" element={<TopicDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

function Home() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>🇺🇿 BizEnglish Surxon</h1>
      <p>IELTS ga tayyorlanish platformasi</p>
    </div>
  );
}

export default App;
