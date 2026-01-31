import React from 'react';

const STATIONS = [
  { value: 'ALL', label: 'All Stations' },
  { value: 'GRILL', label: 'Grill' },
  { value: 'FRY', label: 'Fryer' },
  { value: 'DRINKS', label: 'Drinks' },
  { value: 'DESSERT', label: 'Dessert' },
  { value: 'GENERAL', label: 'General' },
];

/**
 * Station selector component for kitchen dashboard
 * Allows filtering orders by kitchen station
 */
export default function StationSelector({ selectedStation, onStationChange }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-neutral-700 uppercase tracking-wide">Station:</span>
      <div className="inline-flex gap-2 flex-wrap">
        {STATIONS.map((station) => (
          <button
            key={station.value}
            onClick={() => onStationChange(station.value)}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm uppercase tracking-wide transition-all ${
              selectedStation === station.value
                ? 'bg-neutral-900 text-white shadow-lg'
                : 'bg-white text-neutral-700 border-2 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            {station.label}
          </button>
        ))}
      </div>
    </div>
  );
}
