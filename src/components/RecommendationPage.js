import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/recommendationPage.css';
import Header from './Header';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RecommendationPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const {
        recommendations = [],
        companion = '',
        transport = '',
        preferences = { nature: '', newPlaces: '' },
        purpose = '',
        startDate = '',
        endDate = '',
    } = location.state || {};

    const [currentDay, setCurrentDay] = useState(0);
    const [loading, setLoading] = useState(false);
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState([]);

    useEffect(() => {
        const mapContainer = document.getElementById('map');

        const initializeMap = () => {
            console.log(location.state);
            const latitude = location.state.latitude || 37.566826; // 기본 좌표
            const longitude = location.state.longitude || 126.9786567; // 기본 좌표
            const mapOption = {
                center: new window.kakao.maps.LatLng(latitude, longitude),
                level: 3
            };

            const map = new window.kakao.maps.Map(mapContainer, mapOption);

            setMap(map);
            console.log('Map initialized:', map);  // 맵 초기화 여부 확인
        };

        if (window.kakao && window.kakao.maps) {
            console.log('Kakao Maps script already loaded');
            initializeMap();
        } else {
            console.log('Loading Kakao Maps script...');
            const script = document.createElement('script');
            script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_APP_KEY&autoload=false&libraries=services`;
            script.onload = () => {
                console.log('Kakao Maps script loaded');
                window.kakao.maps.load(initializeMap);
            };
            document.head.appendChild(script);
        }
    }, [location.state]);

    useEffect(() => {
        if (!map) return;
    
        // 마커가 이미 존재할 경우 이전 마커를 지우고 새 마커를 추가
        markers.forEach(marker => marker.setMap(null));
        setMarkers([]);
    
        if (recommendations.length > 0) {
            const bounds = new window.kakao.maps.LatLngBounds();  // LatLngBounds 객체 생성
            const newMarkers = [];
    
            recommendations[currentDay].places.forEach((place, index) => {
                const markerPosition = new window.kakao.maps.LatLng(place.longitude, place.latitude);
    
                // 개선된 마커 디자인 (둥근 원 안에 숫자를 포함)
                const markerContent = `
                    <div style="
                        position: relative;
                        background-color: white;
                        border: 2px solid #4CAF50;
                        border-radius: 50%;
                        width: 36px;
                        height: 36px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                        font-weight: bold;
                        color: #4CAF50;
                        font-size: 14px;
                        ">
                        <span>${index + 1}</span>
                    </div>
                `;
    
                const marker = new window.kakao.maps.CustomOverlay({
                    position: markerPosition,
                    content: markerContent,
                    map: map
                });
    
                newMarkers.push(marker);
                bounds.extend(markerPosition);
            });
    
            map.setBounds(bounds);
            setMarkers(newMarkers);
            console.log('Markers and bounds set:', newMarkers);  // 마커 및 범위 설정 여부 확인
        }
    }, [currentDay, recommendations, map, markers]);  // markers 추가

    if (!recommendations.length) {
        return <p>추천 데이터를 가져오는 중 오류가 발생했습니다.</p>;
    }

    const handleNextDay = () => {
        setCurrentDay((prevDay) => Math.min(prevDay + 1, recommendations.length - 1));
    };

    const handlePreviousDay = () => {
        setCurrentDay((prevDay) => Math.max(prevDay - 1, 0));
    };

    const handleSelectSchedule = () => {
        const accessToken = localStorage.getItem('accessToken');
        const post_data = {
            recommendations: recommendations,
            startDate: startDate,
            endDate: endDate,
            latitude: location.state?.latitude,
            longitude: location.state?.longitude
        };

        if (!accessToken) {
            navigate(`/login?redirectUri=${encodeURIComponent(window.location.href)}`);
            return;
        }

        setLoading(true);

        axios.post(process.env.REACT_APP_PROXY + '/api/shortTrip/save', post_data, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })
        .then(response => {
            toast.success("일정이 성공적으로 저장되었습니다.", {
                position: "top-center",
                autoClose: 2000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            setTimeout(() => navigate('/myTravel'));
        })
        .catch(error => {
            console.error("일정 저장 중 오류 발생:", error);
            if (error.response && error.response.status === 401) {
                alert("인증이 필요합니다. 다시 로그인해주세요.");
                navigate(`/login?redirectUri=${encodeURIComponent(window.location.href)}`);
            } else {
                alert("일정 저장 중 오류가 발생했습니다. 다시 시도해 주세요.");
            }
        })
        .finally(() => {
            setLoading(false);
        });
    };

    const handleRetryRequest = () => {
        setLoading(true);

        const data = {
            companion: companion,
            transport: transport,
            preferences: preferences,
            gender: location.state.gender || '',
            ageGroup: location.state.ageGroup || '',
            location: location.state,
            travelPurpose: purpose
        };

        axios.post(process.env.REACT_APP_PROXY + '/api/shortTrip/submit', data)
        .then(response => {
            navigate('/recommendation', {
                state: {
                    recommendations: response.data,
                    companion: companion,
                    transport: transport,
                    preferences: preferences,
                    purpose: purpose,
                    startDate: startDate,
                    endDate: endDate
                }
            });
        })
        .catch(error => {
            console.error("일정 다시 추천받기 중 오류 발생:", error);
        })
        .finally(() => {
            setLoading(false);
        });
    };

    const getFormattedDate = (dateString, daysToAdd) => {
        const date = new Date(dateString);
        date.setDate(date.getDate() + daysToAdd);

        const options = { month: 'long', day: 'numeric', weekday: 'short' };
        const formattedDate = date.toLocaleDateString('ko-KR', options);

        return formattedDate;
    };

    const hashtags = [
        companion && `#${companion}`,
        transport && `#${transport}`,
        preferences.nature && `#${preferences.nature === 'nature' ? '자연' : '도심'}`,
        preferences.newPlaces && `#${preferences.newPlaces === 'new' ? '새로운 지역' : '익숙한 지역'}`,
    ].filter(Boolean).join(" ");

    return (
        <div>
            <Header />
            <div className="recommendation-header">
                <p className="hashtags">{hashtags}</p>
                <p className="shortTripTitle">Bami가 추천하는 일정</p>
            </div>
            <div>
                <div id="map"></div>{}
                <div className="day-plan">
                    <div className="day-header">
                        <h3>
                            {recommendations[currentDay].day}
                            <span className="date-text"> {getFormattedDate(startDate, currentDay)}</span>
                        </h3>
                        <button
                            className="retry-button"
                            onClick={handleRetryRequest}
                            disabled={loading}
                        >
                            일정 다시 추천받기
                        </button>
                    </div>
                    <div>
                        {recommendations[currentDay].places.map((place, index) => {
                            const circleClass =
                                index === 0
                                    ? "circle-number first"
                                    : index === recommendations[currentDay].places.length - 1
                                    ? "circle-number last"
                                    : "circle-number middle";

                            return (
                                <div key={index} className="place-info">
                                    <div className={circleClass}>{index + 1}</div>
                                    <div className="place-details">
                                        <h4>{place.name}</h4>
                                        <p>{place.city}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="navigation-buttons">
                        {currentDay > 0 && <button id="prevButton" onClick={handlePreviousDay}>이전</button>}
                        {currentDay < recommendations.length - 1 ? (
                            <button id="nextButton" onClick={handleNextDay}>다음</button>
                        ) : (
                            <button
                                id="selectButton"
                                onClick={handleSelectSchedule}
                                disabled={loading}
                            >
                                {loading ? "저장 중..." : "이 일정 선택하기"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RecommendationPage;