import { useState, useEffect } from 'react';
import { api } from '../../config/api';

export default function FloorTableSelector({ selectedTable, onTableSelect, disabled }) {
  const [floors, setFloors] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [tables, setTables] = useState([]);
  const [tableOccupancy, setTableOccupancy] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFloors();
  }, []);

  useEffect(() => {
    if (selectedFloor) {
      loadTables(selectedFloor.id);
    }
  }, [selectedFloor]);

  const loadFloors = async () => {
    try {
      const response = await api.get('/cashier/floors?includeInactive=false');
      const activeFloors = response.data.data.filter(f => f.active).sort((a, b) => a.sequence - b.sequence);
      setFloors(activeFloors);
      if (activeFloors.length > 0) {
        setSelectedFloor(activeFloors[0]);
      }
    } catch (error) {
      console.error('Error loading floors:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async (floorId) => {
    try {
      const response = await api.get(`/cashier/floors/${floorId}/tables?includeInactive=false`);
      const activeTables = response.data.data.filter(t => t.active).sort((a, b) => a.number - b.number);
      setTables(activeTables);
      
      // Check occupancy for each table
      await checkTableOccupancy(activeTables);
    } catch (error) {
      console.error('Error loading tables:', error);
    }
  };

  const checkTableOccupancy = async (tablesToCheck) => {
    const occupancyMap = {};
    
    // Check each table for active orders
    await Promise.all(
      tablesToCheck.map(async (table) => {
        try {
          const response = await api.get(`/cashier/tables/${table.id}/active-order`);
          occupancyMap[table.id] = !!response.data.data;
        } catch (error) {
          occupancyMap[table.id] = false;
        }
      })
    );
    
    setTableOccupancy(occupancyMap);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-neutral-500">Loading tables...</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Floor Selector */}
      <div>
        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
          Select Floor
        </label>
        <select
          value={selectedFloor?.id || ''}
          onChange={(e) => {
            const floor = floors.find(f => f.id === e.target.value);
            setSelectedFloor(floor);
          }}
          disabled={disabled}
          className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-neutral-900 disabled:bg-neutral-100 disabled:cursor-not-allowed transition-all"
        >
          {floors.map(floor => (
            <option key={floor.id} value={floor.id}>
              {floor.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table Grid */}
      <div>
        <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
          Select Table
        </label>
        {tables.length === 0 ? (
          <div className="text-sm font-medium text-neutral-500 text-center py-12 bg-neutral-50 rounded-lg">
            No tables available
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {tables.map(table => {
              const isOccupied = tableOccupancy[table.id];
              const isSelected = selectedTable?.id === table.id;
              
              return (
                <button
                  key={table.id}
                  onClick={() => onTableSelect(table)}
                  disabled={disabled}
                  className={`p-5 rounded-xl border-2 transition-all text-left relative ${
                    isSelected
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-lg'
                      : isOccupied
                      ? 'border-amber-300 bg-amber-50 hover:border-amber-400 hover:shadow-md'
                      : 'border-neutral-200 bg-white hover:border-neutral-400 hover:shadow-md'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {/* Occupancy Indicator */}
                  {isOccupied && !isSelected && (
                    <div className="absolute top-3 right-3 w-3 h-3 bg-amber-600 rounded-full shadow-md"></div>
                  )}
                  
                  <div className="text-xl font-bold mb-1">Table {table.number}</div>
                  <div className={`text-xs font-medium mb-2 ${
                    isSelected 
                      ? 'text-neutral-300' 
                      : isOccupied 
                      ? 'text-amber-700'
                      : 'text-neutral-500'
                  }`}>
                    {table.seats} seats
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`inline-block text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${
                    isSelected
                      ? 'bg-white text-neutral-900'
                      : isOccupied
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-green-100 text-green-900 border border-green-300'
                  }`}>
                    {isSelected ? 'Selected' : isOccupied ? 'Occupied' : 'Free'}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
