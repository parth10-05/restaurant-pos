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
    <div className="space-y-4">
      {/* Floor Selector */}
      <div>
        <label className="block text-xs font-medium text-neutral-700 mb-2">
          SELECT FLOOR
        </label>
        <select
          value={selectedFloor?.id || ''}
          onChange={(e) => {
            const floor = floors.find(f => f.id === e.target.value);
            setSelectedFloor(floor);
          }}
          disabled={disabled}
          className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:bg-neutral-100 disabled:cursor-not-allowed"
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
        <label className="block text-xs font-medium text-neutral-700 mb-2">
          SELECT TABLE
        </label>
        {tables.length === 0 ? (
          <div className="text-sm text-neutral-500 text-center py-8">
            No tables available
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {tables.map(table => {
              const isOccupied = tableOccupancy[table.id];
              const isSelected = selectedTable?.id === table.id;
              
              return (
                <button
                  key={table.id}
                  onClick={() => onTableSelect(table)}
                  disabled={disabled}
                  className={`p-4 rounded-lg border-2 transition-all text-left relative ${
                    isSelected
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : isOccupied
                      ? 'border-orange-400 bg-orange-50 hover:border-orange-500'
                      : 'border-neutral-200 bg-white hover:border-neutral-400'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {/* Occupancy Indicator */}
                  {isOccupied && !isSelected && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  )}
                  
                  <div className="text-lg font-bold">Table {table.number}</div>
                  <div className={`text-xs mt-1 ${
                    isSelected 
                      ? 'text-neutral-200' 
                      : isOccupied 
                      ? 'text-orange-700'
                      : 'text-neutral-500'
                  }`}>
                    {table.seats} seats
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`text-xs font-bold mt-2 ${
                    isSelected
                      ? 'text-white'
                      : isOccupied
                      ? 'text-orange-700'
                      : 'text-green-700'
                  }`}>
                    {isOccupied ? 'OCCUPIED' : 'FREE'}
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
