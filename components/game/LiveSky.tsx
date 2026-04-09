'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DadLocation {
  lat: number;
  lon: number;
  city: string;
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
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  if (code >= 95) return '⛈️';
  return '☁️';
}

export function LiveSky() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [dadLoc, setDadLoc] = useState<DadLocation>({ lat: 45.64, lon: -122.66, city: 'Vancouver' });

  // Fetch Dad's location from the API (reads !location messages from Slack)
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch('/api/slack/location');
        const data = await res.json();
        if (data.ok) setDadLoc({ lat: data.lat, lon: data.lon, city: data.city });
      } catch {}
    };
    fetchLocation();
    const interval = setInterval(fetchLocation, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  // Fetch weather for Dad's location
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${dadLoc.lat}&longitude=${dadLoc.lon}&current=temperature_2m,is_day,weather_code&temperature_unit=fahrenheit&timezone=auto`
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
  }, [dadLoc.lat, dadLoc.lon]);

  const isDay = weather?.isDay ?? (new Date().getHours() > 6 && new Date().getHours() < 20);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Sky gradient — subtle and elegant */}
      <div
        className="absolute inset-0 transition-all duration-[3000ms]"
        style={{
          background: isDay
            ? 'linear-gradient(180deg, #c2dfe6 0%, #d4e8f0 50%, #e8f1f5 100%)'
            : 'linear-gradient(180deg, #0d0d2b 0%, #151540 50%, #1a1a3e 100%)',
          opacity: 0.85,
        }}
      />

      {/* Sun or Moon — small and subtle */}
      <motion.div
        className="absolute"
        style={{ top: '6%', right: '10%' }}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      >
        <span className="text-3xl opacity-60">{isDay ? '☀️' : '🌙'}</span>
      </motion.div>

      {/* Stars at night — gentle twinkle */}
      {!isDay && Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 h-0.5 bg-white/40 rounded-full"
          style={{ top: `${5 + Math.random() * 40}%`, left: `${Math.random() * 100}%` }}
          animate={{ opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
        />
      ))}

      {/* Gentle clouds — only when cloudy */}
      {weather && weather.weatherCode > 1 && (
        <motion.div
          className="absolute text-2xl opacity-20"
          style={{ top: '12%' }}
          animate={{ x: ['-5%', '105%'] }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        >
          ☁️
        </motion.div>
      )}

      {/* Weather badge — small, elegant */}
      {weather && (
        <div className="absolute top-2 right-2 bg-black/15 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
          <span className="text-sm">{getWeatherEmoji(weather.weatherCode, weather.isDay)}</span>
          <span className="text-[11px] text-white/50 font-medium">{weather.temp}°F {dadLoc.city}</span>
        </div>
      )}
    </div>
  );
}
