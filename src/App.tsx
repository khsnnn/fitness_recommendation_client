import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from 'leaflet';
import { Club } from './Utils/types';
import ClubList from "./components/ClubList";



const API_BASE = "http://localhost:8000";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search?format=json&q=";


const userIcon = new L.Icon({
  iconUrl: 'https://files.softicons.com/download/business-icons/flatastic-icons-part-4-by-custom-icon-design/png/512x512/user-red.png', // Тут можешь вставить ссылку на изображение красного маркера
  iconSize: [32, 32], 
  iconAnchor: [16, 32], 
  popupAnchor: [0, -32],
});



export default function App() {
  const [address, setAddress] = useState("");
  const [minRating, setMinRating] = useState("");
  const [maxDistance, setMaxDistance] = useState("");
  const [clubsData, setClubsData] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClbs] = useState<Club[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Вычисление расстояния по формуле гаверсинусов (Haversine formula)
  // Вычисление кратчайшего расстояния между двумя точками на сфере
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Радиус Земли в километрах
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const searchClubs = async () => {
    if (!address) return alert("Введите адрес!");

    try {
      const response = await fetch(NOMINATIM_URL + encodeURIComponent("Тюмень, " + address));
      const data = await response.json();
      if (!data.length) return alert("Адрес не найден!");

      const { lat, lon } = data[0];
      setUserLocation([parseFloat(lat), parseFloat(lon)]);

      const clubsResponse = await fetch(`${API_BASE}/all-clubs`);
      const allClubsData = await clubsResponse.json();

      console.log("Полученные клубы:", allClubsData);

      if (!Array.isArray(allClubsData)) {
        console.error("Данные клубов не являются массивом:", allClubsData);
        return;
      }

      const clubsWithValidData = allClubsData.filter((club: any) => {
        console.log("Клуб перед фильтрацией:", club);
      
        const validLat = parseFloat(club["Координаты (lat)"]);  // Используем правильный ключ для lat
        const validLon = parseFloat(club["Координаты (lon)"]);  // Используем правильный ключ для lon
        const validRating = parseFloat(club["Рейтинг"]);  // Получаем рейтинг
      
        if (isNaN(validLat) || isNaN(validLon) || isNaN(validRating)) {
          console.error("Некорректный клуб (отсутствуют координаты или рейтинг):", club);
          return false;  
        }
      
        club.lat = validLat;
        club.lon = validLon;
        club.rating = validRating;
      
        console.log("Клуб с очищенными данными:", { lat: club.lat, lon: club.lon, rating: club.rating });
      
        return true;  // Если данные корректны, клуб проходит фильтрацию
      });
      
      setClubsData(clubsWithValidData);
      
      // Фильтруем клубы
      const filtered = clubsWithValidData.filter((club: Club) => {
        const distance = getDistance(lat, lon, club.lat, club.lon);
        console.log(`Клуб ${club.name}: Расстояние = ${distance} км, Рейтинг = ${club.rating}`);
      
        const isRatingValid = minRating ? club.rating >= parseFloat(minRating) : true;
        const isDistanceValid = maxDistance ? distance <= parseFloat(maxDistance) : true;
      
        console.log(`Клуб ${club.name}: подходит по рейтингу = ${isRatingValid}, по дистанции = ${isDistanceValid}`);
      
        return isRatingValid && isDistanceValid;
      });
      
      console.log("Отфильтрованные клубы:", filtered);
      setFilteredClbs(filtered);
      console.log("Отфильтрованные клубы:", filteredClubs);

    } catch (error) {
      console.error("Ошибка поиска клубов:", error);
    }
  };

  return (
    <div>
      <h1>Поиск спортивных клубов</h1>
      <div>
        <input
          type="text"
          placeholder="Введите ваш адрес"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <input
          type="number"
          placeholder="Минимальный рейтинг (0-5)"
          value={minRating}
          onChange={(e) => setMinRating(e.target.value)}
        />
        <input
          type="number"
          placeholder="Максимальная дистанция (км)"
          value={maxDistance}
          onChange={(e) => setMaxDistance(e.target.value)}
        />
        <button onClick={searchClubs}>Найти клубы</button>
      </div>

      <MapContainer center={[57.1522, 65.5272]} zoom={12} style={{ height: "500px", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>Ваше местоположение</Popup>
          </Marker>
          
        )}
        {filteredClubs.map((club, index) => {
          console.log("Клуб для рендера:", club);  // Проверяем структуру объекта
          return (
            <Marker key={index} position={[club.lat, club.lon]}>
              <Popup>
                {club["Название"]}<br /> {/* Используем правильное имя поля */}
                {club["Адрес"]}<br />
                Рейтинг: {club.rating}<br />
                Часы работы: {club["Часы работы"]}
              </Popup>
            </Marker>
          );
        })}

      </MapContainer>

      <ClubList clubs={filteredClubs} />
    </div>
  );
}
