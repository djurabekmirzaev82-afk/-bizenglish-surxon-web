import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import SpeakingHome from './speaking/index';
import TopicDetail from './speaking/TopicDetail';

function App() {
  return (
    <BrowserRouter>
      <nav>
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
  return <h1>🇺🇿 BizEnglish Surxon</h1>;
}

export default App;
