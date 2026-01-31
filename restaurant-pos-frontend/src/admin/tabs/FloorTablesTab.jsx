import { useState, useEffect } from 'react';
import { floorService, tableService } from '../../services/floor.service';
import FloorList from '../components/FloorList';
import TableGrid from '../components/TableGrid';
import FloorForm from '../components/FloorForm';
import TableForm from '../components/TableForm';

export default function FloorTablesTab() {
  const [floors, setFloors] = useState([]);
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [tables, setTables] = useState([]);
  
  const [loading, setLoading] = useState({ floors: true, tables: false });
  const [saving, setSaving] = useState(false);
  
  const [showFloorForm, setShowFloorForm] = useState(false);
  const [showTableForm, setShowTableForm] = useState(false);
  const [editingFloor, setEditingFloor] = useState(null);
  const [editingTable, setEditingTable] = useState(null);
  
  const [error, setError] = useState(null);

  // Fetch floors on mount
  useEffect(() => {
    fetchFloors();
  }, []);

  // Fetch tables when floor changes
  useEffect(() => {
    if (selectedFloorId) {
      fetchTables(selectedFloorId);
    }
  }, [selectedFloorId]);

  const fetchFloors = async () => {
    try {
      setLoading(prev => ({ ...prev, floors: true }));
      setError(null);
      const data = await floorService.getAll(true);
      setFloors(data);
      
      // Auto-select first active floor
      if (data.length > 0 && !selectedFloorId) {
        const firstActiveFloor = data.find(f => f.active) || data[0];
        setSelectedFloorId(firstActiveFloor.id);
      }
    } catch (err) {
      console.error('Error fetching floors:', err);
      setError('Failed to load floors');
    } finally {
      setLoading(prev => ({ ...prev, floors: false }));
    }
  };

  const fetchTables = async (floorId) => {
    try {
      setLoading(prev => ({ ...prev, tables: true }));
      setError(null);
      const data = await tableService.getByFloor(floorId, true);
      setTables(data);
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError('Failed to load tables');
    } finally {
      setLoading(prev => ({ ...prev, tables: false }));
    }
  };

  // Floor actions
  const handleAddFloor = () => {
    setEditingFloor(null);
    setShowFloorForm(true);
  };

  const handleEditFloor = (floor) => {
    setEditingFloor(floor);
    setShowFloorForm(true);
  };

  const handleFloorFormSubmit = async (formData) => {
    try {
      setSaving(true);
      setError(null);
      
      if (editingFloor) {
        await floorService.update(editingFloor.id, formData);
      } else {
        await floorService.create(formData);
      }
      
      await fetchFloors();
      setShowFloorForm(false);
      setEditingFloor(null);
    } catch (err) {
      console.error('Error saving floor:', err);
      setError(err.response?.data?.message || 'Failed to save floor');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFloorActive = async (floor) => {
    try {
      setSaving(true);
      setError(null);
      await floorService.update(floor.id, { active: !floor.active });
      await fetchFloors();
    } catch (err) {
      console.error('Error toggling floor:', err);
      setError('Failed to update floor status');
    } finally {
      setSaving(false);
    }
  };

  // Table actions
  const handleAddTable = () => {
    if (!selectedFloorId) {
      setError('Please select a floor first');
      return;
    }
    setEditingTable(null);
    setShowTableForm(true);
  };

  const handleEditTable = (table) => {
    setEditingTable(table);
    setShowTableForm(true);
  };

  const handleTableFormSubmit = async (formData) => {
    try {
      setSaving(true);
      setError(null);
      
      if (editingTable) {
        await tableService.update(editingTable.id, formData);
      } else {
        await tableService.create(selectedFloorId, formData);
      }
      
      await fetchTables(selectedFloorId);
      setShowTableForm(false);
      setEditingTable(null);
    } catch (err) {
      console.error('Error saving table:', err);
      setError(err.response?.data?.message || 'Failed to save table');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTableActive = async (table) => {
    try {
      setSaving(true);
      setError(null);
      await tableService.update(table.id, { active: !table.active });
      await fetchTables(selectedFloorId);
    } catch (err) {
      console.error('Error toggling table:', err);
      setError('Failed to update table status');
    } finally {
      setSaving(false);
    }
  };

  const selectedFloor = floors.find(f => f.id === selectedFloorId);

  return (
    <div className="flex h-[calc(100vh-180px)]">
      {/* Left Panel - Floor List */}
      <div className="w-72 bg-white border-r border-neutral-200 flex flex-col">
        <FloorList
          floors={floors}
          selectedFloorId={selectedFloorId}
          onSelectFloor={setSelectedFloorId}
          onAddFloor={handleAddFloor}
          onEditFloor={handleEditFloor}
          onToggleFloorActive={handleToggleFloorActive}
          loading={loading.floors}
        />
      </div>

      {/* Right Panel - Table Management */}
      <div className="flex-1 bg-neutral-50 overflow-y-auto">
        {selectedFloor ? (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900">
                  {selectedFloor.name}
                </h2>
                <p className="text-sm text-neutral-600 mt-1">
                  {tables.length} {tables.length === 1 ? 'table' : 'tables'}
                </p>
              </div>
              <button
                onClick={handleAddTable}
                disabled={saving}
                className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-800 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Table
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
                {error}
              </div>
            )}

            {/* Table Grid */}
            <TableGrid
              tables={tables}
              onEditTable={handleEditTable}
              onToggleTableActive={handleToggleTableActive}
              loading={loading.tables}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <svg className="w-20 h-20 text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-neutral-600 font-medium">Select a floor to manage tables</p>
              <p className="text-sm text-neutral-500 mt-1">
                {floors.length === 0 ? 'Create a floor to get started' : 'Choose a floor from the left panel'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Floor Form Modal */}
      {showFloorForm && (
        <FloorForm
          floor={editingFloor}
          onSubmit={handleFloorFormSubmit}
          onCancel={() => {
            setShowFloorForm(false);
            setEditingFloor(null);
          }}
          loading={saving}
        />
      )}

      {/* Table Form Modal */}
      {showTableForm && (
        <TableForm
          table={editingTable}
          onSubmit={handleTableFormSubmit}
          onCancel={() => {
            setShowTableForm(false);
            setEditingTable(null);
          }}
          loading={saving}
        />
      )}
    </div>
  );
}
