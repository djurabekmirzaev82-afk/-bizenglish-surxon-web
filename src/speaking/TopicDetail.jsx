import React from 'react';
import { useParams, Link } from 'react-router-dom';

const TopicDetail = () => {
  const { id } = useParams();
  
  return (
    <div>
      <h1>📖 Mavzu #{id}</h1>
      <Link to="/speaking">⬅️ Barcha mavzular</Link>
    </div>
  );
};

export default TopicDetail;
