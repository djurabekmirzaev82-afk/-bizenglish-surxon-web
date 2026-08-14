// src/VocabularyPage.jsx
import React from 'react';
import VocabularySpeaking from './components/vocabulary-speaking';

export default function VocabularyPage() {
  return (
    <div style={{ 
      background: '#f8faff', 
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif'
    }}>
      <VocabularySpeaking />
    </div>
  );
}
