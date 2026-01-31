export default function TableCard({ table, onEdit, onToggleActive }) {
  const isActive = table.active;

  return (
    <div className={`border rounded-lg p-4 transition-colors ${
      isActive 
        ? 'bg-white border-neutral-200 hover:border-neutral-300' 
        : 'bg-neutral-50 border-neutral-300'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className={`text-lg font-semibold ${
              isActive ? 'text-neutral-900' : 'text-neutral-500'
            }`}>
              Table {table.number}
            </h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-neutral-200 text-neutral-600'
            }`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className={`text-sm mt-1 ${
            isActive ? 'text-neutral-600' : 'text-neutral-500'
          }`}>
            {table.seats} seats
          </p>
        </div>

        {/* Actions dropdown */}
        <div className="relative group">
          <button className="p-1 text-neutral-500 hover:text-neutral-900 rounded">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-1 w-40 bg-white border border-neutral-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <button
              onClick={() => onEdit(table)}
              className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Edit Table
            </button>
            <button
              onClick={() => onToggleActive(table)}
              className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              {isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
