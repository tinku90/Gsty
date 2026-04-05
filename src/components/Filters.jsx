export default function Filters({
  monthOptions = [],
  selectedMonth = "",
  onMonthChange,
  selectedType = "All Types",
  onTypeChange,
}) {
  return (
    <div className="filters-bar">
      <select
        className="filter-dropdown"
        value={selectedMonth}
        onChange={(event) => onMonthChange?.(event.target.value)}
      >
        {monthOptions.length === 0 ? (
          <option value="">No month data</option>
        ) : (
          monthOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        )}
      </select>

      <input
        className="search-input"
        placeholder="Search by invoice, party name, or GSTIN..."
      />

      <select
        className="filter-dropdown"
        value={selectedType}
        onChange={(event) => onTypeChange?.(event.target.value)}
      >
        <option>All Types</option>
        <option>B2B</option>
        <option>B2C</option>
        <option>Exports</option>
      </select>
    </div>
  );
}
