import React from 'react';
import { Club } from '../Utils/types';

interface ClubListProps {
  clubs: Club[];
}

const ClubList: React.FC<ClubListProps> = ({ clubs }) => {
  return (
    <div style={{ padding: '20px' }}>
      <h3>Клубы:</h3>
      <ul>
        {clubs.map((club, index) => (
          <li key={index} style={{ marginBottom: '10px' }}>
            <h4>{club["Название"]}</h4>
            <p>Адрес: {club["Адрес"]}</p>
            <p>Рейтинг: {club.rating}</p>
            <p>Часы работы: {club["Часы работы"]}</p>
            <hr /> 
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClubList;
