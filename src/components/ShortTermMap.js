import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/shortTermMap.css';
import Header from './Header';

const { kakao } = window;

const ShortTermMap = () => {
  const location = useLocation();
  
  // URLSearchParams를 사용해 쿼리 파라미터를 파싱
  const searchParams = new URLSearchParams(location.search);

  // 개별 파라미터 값 가져오기
  const isLongTerm = searchParams.get('longterm') === 'true';
  const gender = searchParams.get('gender');
  const ageGroup = searchParams.get('ageGroup');

  const [map, setMap] = useState(null);
  const [infowindow, setInfowindow] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [inputText, setInputText] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const mapContainer = document.getElementById('map');

    const initializeMap = async () => {
      const latitude = 37.566826;
      const longitude = 126.9786567;
      const mapOption = {
        center: new kakao.maps.LatLng(latitude, longitude),
        level: 3
      };

      const map = new kakao.maps.Map(mapContainer, mapOption);

      const infowindow = new kakao.maps.InfoWindow({ zIndex: 1 });

      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(latitude, longitude)
      });
      marker.setMap(map);
      setMap(map);
      setInfowindow(infowindow);

      
      if(isLongTerm) {
        kakao.maps.event.addListener(marker, 'click', () => {
          navigate('/travel-planner', { 
            state: { 
              gender: gender, 
              ageGroup: ageGroup,
              latitude: latitude,
              longitude: longitude
            }
          });
        });
      } else {
        kakao.maps.event.addListener(marker, 'click', () => {
          console.log(latitude, longitude);
          navigate('/travel-selectInfo', { state: { latitude, longitude } });
        });
      }

      kakao.maps.event.addListener(marker, 'mouseover', () => {
        infowindow.setContent(`<div style="padding:5px;font-size:12px;"> 서울 시청 </div>`);
        infowindow.open(map, marker);
      });

      kakao.maps.event.addListener(marker, 'mouseout', () => {
        infowindow.close();
      });
    };

    initializeMap();
  }, [navigate]);

  const handleSearch = () => {
    const keyword = document.getElementById('searchInput').value;
    const places = new kakao.maps.services.Places();

    if (!keyword.replace(/^\s+|\s+$/g, '')) {
      alert('키워드를 입력해주세요!');
      return false;
    }

    places.keywordSearch(keyword, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        const bounds = new kakao.maps.LatLngBounds();

        removeMarkers();

        for (let i = 0; i < result.length; i++) {
          displayMarker(result[i], i);
          bounds.extend(new kakao.maps.LatLng(result[i].y, result[i].x));
        }

        map.setBounds(bounds);
      } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        alert('검색 결과가 존재하지 않습니다.');
      } else if (status === kakao.maps.services.Status.ERROR) {
        alert('검색 결과 중 오류가 발생했습니다.');
      }
    });
  };

  const displayMarker = (place, idx) => {
    const marker = new kakao.maps.Marker({
      map: map,
      position: new kakao.maps.LatLng(place.y, place.x)
    });
  
    kakao.maps.event.addListener(marker, 'click', () => {
      console.log('Clicked marker position:', place.y, place.x);  // 로그 확인
      navigate('/travel-selectInfo', { state: { latitude: place.y, longitude: place.x } });
    });
  
    kakao.maps.event.addListener(marker, 'mouseover', () => {
      infowindow.setContent(`<div style="padding:5px;font-size:12px;">${place.place_name}</div>`);
      infowindow.open(map, marker);
    });
  
    kakao.maps.event.addListener(marker, 'mouseout', () => {
      infowindow.close();
    });
  
    setMarkers((prevMarkers) => [...prevMarkers, marker]);
  };

  const removeMarkers = () => {
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div>
      <Header />
      <p id="title">출발 위치를 검색하거나 지도를 움직여 설정해주세요</p>
      <div className="search-container">
        <input
          type="text"
          id="searchInput"
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
        />
        <button onClick={handleSearch}></button>
      </div>
      <hr id="horizontal-line"></hr>
      <div id="map" style={{ width: '100%', height: '660px', marginTop: '100px'}}>
      </div>
    </div>
  );
};

export default ShortTermMap;