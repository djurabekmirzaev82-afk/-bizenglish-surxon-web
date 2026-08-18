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
        <Link to="/writing">✍️ Writing</Link>
      </nav>
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/speaking" element={<SpeakingHome />} />
        <Route path="/speaking/:id" element={<TopicDetail />} />
        <Route path="/writing" element={<WritingHome />} />
      </Routes>
    </BrowserRouter>
  );
}

function Home() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🇺🇿 BizEnglish Surxon</h1>
      <p>IELTS ga tayyorlanish platformasi</p>
      <p>🔹 Yuqoridagi menyudan Speaking yoki Writing bo'limini tanlang</p>
    </div>
  );
}

// Hozircha WritingHome ni vaqtincha shunday qoldiramiz
function WritingHome() {
  return (
    <div style={{ padding: '20px' }}>
      <h2>✍️ Writing</h2>
      <p>Tez orada qo'shiladi...</p>
      <Link to="/">⬅️ Bosh sahifaga qaytish</Link>
    </div>
  );
}

export default App;
