'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// Dad's approximate location by trip date
function getDadLocation(): { lat: number; lon: number; city: string } {
  const today = new Date().toISOString().split('T')[0];
  if (today < '2026-04-12') return { lat: 45.64, lon: -122.66, city: 'Vancouver' };
  if (today === '2026-04-12') return { lat: 36.15, lon: -95.99, city: 'Tulsa' };
  if (today <= '2026-04-15') return { lat: 36.15, lon: -95.99, city: 'Tulsa' };
  if (today <= '2026-04-18') return { lat: 40.81, lon: -96.69, city: 'Lincoln' };
  if (today === '2026-04-19') return { lat: 41.26, lon: -95.93, city: 'Omaha' };
  return { lat: 45.64, lon: -122.66, city: 'Home' };
}

interface Weather {
  temp: number;
  isDay: boolean;
  weatherCode: number;
}

function getWeatherEmoji(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? '☀️' : '🌙';
  if (code <= 3) return isDay ? '⛅' : '☁️';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌧️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code <= 86) return '❄️';
  if (code >= 95) return '⛈️';
  return '☁️';
}

export function LiveSky() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const loc = getDadLocation();

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,is_day,weather_code&temperature_unit=fahrenheit&timezone=America/Chicago`
        );
        const data = await res.json();
        if (data.current) {
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            isDay: data.current.is_day === 1,
            weatherCode: data.current.weather_code,
          });
        }
      } catch {}
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // Every 10 min
    return () => clearInterval(interval);
  }, [loc.lat, loc.lon]);

  const isDay = weather?.isDay ?? (new Date().getHours() > 6 && new Date().getHours() < 20);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Sky gradient */}
      <div
        className="absolute inset-0 transition-colors duration-1000"
        style={{
          background: isDay
            ? 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 40%, #E0F4FF 100%)'
            : 'linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 40%, #2a1a3e 100%)',
        }}
      />

      {/* Sun or Moon */}
      <motion.div
        className="absolute"
        style={{ top: '8%', right: '15%' }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <span className="text-5xl drop-shadow-lg">{isDay ? '☀️' : '🌙'}</span>
      </motion.div>

      {/* Stars at night */}
      {!isDay && Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{ top: `${Math.random() * 50}%`, left: `${Math.random() * 100}%` }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
        />
      ))}

      {/* Clouds */}
      {weather && weather.weatherCode > 0 && (
        <>
          <motion.div
            className="absolute text-4xl"
            style={{ top: '15%' }}
            animate={{ x: ['0%', '110%'] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          >
            ☁️
          </motion.div>
          <motion.div
            className="absolute text-3xl"
            style={{ top: '25%' }}
            animate={{ x: ['-10%', '110%'] }}
            transition={{ duration: 40, repeat: Infinity, ease: 'linear', delay: 5 }}
          >
            ☁️
          </motion.div>
        </>
      )}

      {/* Weather info badge */}
      {weather && (
        <div className="absolute top-3 right-3 bg-black/20 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
          <span className="text-lg">{getWeatherEmoji(weather.weatherCode, weather.isDay)}</span>
          <span className="text-xs text-white/70 font-medium">{weather.temp}°F in {loc.city}</span>
        </div>
      )}
    </div>
  );
}
