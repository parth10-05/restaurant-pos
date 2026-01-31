import TableCard from './TableCard';

export default function TableGrid({ tables, onEditTable, onToggleTableActive, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-500">Loading tables...</div>
      </div>
    );
  }

  if (!tables || tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <svg className="w-16 h-16 text-neutral-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <p className="text-neutral-600 font-medium">No tables yet</p>
        <p className="text-sm text-neutral-500 mt-1">Click "Add Table" to create your first table</p>
      </div>
    );
  }

  // Sort tables by seating capacity (ascending)
  const sortedTables = [...tables].sort((a, b) => a.seats - b.seats);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {sortedTables.map(table => (
        <TableCard
          key={table.id}
          table={table}
          onEdit={onEditTable}
          onToggleActive={onToggleTableActive}
        />
      ))}
    </div>
  );
}
