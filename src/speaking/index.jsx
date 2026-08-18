import React from 'react';
import { Link } from 'react-router-dom';

const SpeakingHome = () => {
  return (
    <div>
      <h1>🎯 IELTS Speaking Vocabulary</h1>
      <p>18 ta mavzu bo'yicha so'z boyligingizni oshiring!</p>
      <Link to="/">⬅️ Bosh sahifaga qaytish</Link>
    </div>
  );
};

export default SpeakingHome;
