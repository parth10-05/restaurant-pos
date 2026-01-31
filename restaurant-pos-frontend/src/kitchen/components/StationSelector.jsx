import React from 'react';

const STATIONS = [
  { value: 'ALL', label: 'All Stations', icon: '🍽️' },
  { value: 'GRILL', label: 'Grill', icon: '🔥' },
  { value: 'FRY', label: 'Fryer', icon: '🍟' },
  { value: 'DRINKS', label: 'Drinks', icon: '🥤' },
  { value: 'DESSERT', label: 'Dessert', icon: '🍰' },
  { value: 'GENERAL', label: 'General', icon: '👨‍🍳' },
];

/**
 * Station selector component for kitchen dashboard
 * Allows filtering orders by kitchen station
 */
export default function StationSelector({ selectedStation, onStationChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-neutral-700">Station:</span>
      {STATIONS.map((station) => (
        <button
          key={station.value}
          onClick={() => onStationChange(station.value)}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            selectedStation === station.value
              ? 'bg-neutral-900 text-white shadow-md'
              : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
          }`}
        >
          <span className="mr-2">{station.icon}</span>
          {station.label}
        </button>
      ))}
    </div>
  );
}
