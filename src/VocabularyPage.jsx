import React from 'react';
import VocabularySpeaking from './components/vocabulary-speaking';

export default function VocabularyPage() {
  return (
    <div style={{ 
      background: '#f4f6fb', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      <VocabularySpeaking />
    </div>
  );
}
