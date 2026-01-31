export default function FloorList({ 
  floors, 
  selectedFloorId, 
  onSelectFloor, 
  onAddFloor, 
  onEditFloor,
  onToggleFloorActive,
  loading 
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-sm text-neutral-500">Loading floors...</div>
      </div>
    );
  }

  // Sort floors by sequence
  const sortedFloors = [...floors].sort((a, b) => a.sequence - b.sequence);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-900">Floors</h3>
          <button
            onClick={onAddFloor}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
            title="Add floor"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Floor List */}
      <div className="flex-1 overflow-y-auto">
        {sortedFloors.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-neutral-500">No floors yet</p>
            <button
              onClick={onAddFloor}
              className="mt-2 text-sm text-neutral-700 hover:text-neutral-900 underline"
            >
              Add your first floor
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {sortedFloors.map(floor => {
              const isSelected = floor.id === selectedFloorId;
              const isActive = floor.active;
              const tableCount = floor._count?.tables || 0;

              return (
                <div
                  key={floor.id}
                  className={`group relative rounded-md transition-colors ${
                    isSelected
                      ? 'bg-neutral-900 text-white'
                      : isActive
                      ? 'hover:bg-neutral-100 text-neutral-900'
                      : 'text-neutral-500 hover:bg-neutral-50'
                  }`}
                >
                  <button
                    onClick={() => onSelectFloor(floor.id)}
                    className="w-full text-left px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {floor.name}
                        </div>
                        <div className={`text-xs mt-0.5 ${
                          isSelected ? 'text-neutral-300' : 'text-neutral-500'
                        }`}>
                          {tableCount} {tableCount === 1 ? 'table' : 'tables'}
                        </div>
                      </div>

                      {!isActive && (
                        <span className="text-xs px-1.5 py-0.5 bg-neutral-200 text-neutral-600 rounded ml-2">
                          Inactive
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Actions menu */}
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="relative">
                      <button className={`p-1 rounded hover:bg-neutral-200 ${
                        isSelected ? 'text-white hover:bg-neutral-800' : 'text-neutral-500'
                      }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>

                      {/* Dropdown */}
                      <div className="absolute right-0 mt-1 w-36 bg-white border border-neutral-200 rounded-md shadow-lg opacity-0 invisible hover:opacity-100 hover:visible transition-all z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditFloor(floor);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        >
                          Edit Floor
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFloorActive(floor);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
