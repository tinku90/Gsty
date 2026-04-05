import { Pencil, Trash2 } from "lucide-react";
import { formatMoney } from "../utils/format";

function getRowId(row, index = 0) {
  if (row.recordId) {
    return row.recordId;
  }

  return [
    row.uploadId || "upload",
    row.invoiceNumber || row.invoice || "invoice",
    row.invoiceDate || row.date || "date",
    row.party || "party",
    row.amount || 0,
    row.taxAmount ?? row.tax ?? 0,
    index,
  ].join("__");
}

function getSourceLabel(row) {
  if (row.sourceLabel) {
    return row.sourceLabel;
  }

  if (row.sourceType === "marketplace") {
    return row.marketplace || "marketplace";
  }

  if (row.sourceType === "b2b") {
    return "B2B";
  }

  if (row.sourceType === "b2c") {
    return "B2C";
  }

  if (row.sourceType === "exports" || row.sourceType === "export") {
    return "Exports";
  }

  return row.source || row.fileName || "N/A";
}

export function getTransactionTypeLabel(row) {
  const text = [
    row.type,
    row.sourceType,
    row.party,
    row.productName,
    row.placeOfSupplyName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (row.stateCode === "96" || row.placeOfSupply === "96" || text.includes("export")) {
    return "Exports";
  }

  const sourceType = String(row.sourceType || "").toLowerCase();
  const sourceLabel = String(row.sourceLabel || "").toLowerCase();
  const marketplace = String(row.marketplace || "").toLowerCase();
  const isMarketplaceUpload =
    sourceType === "marketplace" ||
    sourceLabel === "marketplace" ||
    ["amazon", "flipkart", "meesho", "myntra", "nykaa", "other"].includes(sourceLabel) ||
    ["amazon", "flipkart", "meesho", "myntra", "nykaa", "other"].includes(marketplace);

  if (sourceType === "b2b") {
    return "B2B";
  }

  if (sourceType === "b2c" || isMarketplaceUpload) {
    return "B2C";
  }

  return "B2C";
}

function getRateLabel(row) {
  const rate = row.rate ?? row.gstRate;
  return rate !== undefined && rate !== null && rate !== "" && rate !== "-"
    ? `${rate}%`
    : "-";
}

export default function TransactionsTable({
  data,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onEditRow,
  onDeleteRow,
  emptyMessage = "No transactions found.",
}) {
  const allSelected = data.length > 0 && data.every((row, index) => selectedIds.includes(getRowId(row, index)));
  const selectionMode = selectedIds.length > 0;

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => onToggleSelectAll?.(data)}
              />
            </th>
            <th>Source File</th>
            <th>Invoice No</th>
            <th>Date</th>
            <th>Party Name</th>
            <th>GSTIN</th>
            <th>Type</th>
            <th>HSN</th>
            <th>GST %</th>
            <th>Amount</th>
            <th>Tax</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {data?.length === 0 ? (
            <tr>
              <td colSpan="13">{emptyMessage}</td>
            </tr>
          ) : data?.map((row, index) => {
            const rowId = getRowId(row, index);
            return (
            <tr key={rowId} className={row.status !== "valid" ? "row-error" : ""}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(rowId)}
                  onChange={() => onToggleSelect?.(rowId)}
                />
              </td>
              <td>{getSourceLabel(row)}</td>
              <td>{row.invoiceNumber || row.invoice}</td>
              <td>{row.invoiceDate || row.date}</td>
              <td>{row.party}</td>
              <td>{row.gstin}</td>
              <td>
                <span className="transaction-type-badge">{getTransactionTypeLabel(row)}</span>
              </td>
              <td>{row.hsn}</td>
              <td>{getRateLabel(row)}</td>
              <td>{formatMoney(row.amount || row.total_invoice_value || 0)}</td>
              <td>{formatMoney(row.taxAmount || row.tax || 0)}</td>
              <td>
                <span className={`status ${row.status || "valid"}`}>
                  {row.status || "valid"}
                </span>
              </td>
              <td>
                {!selectionMode && (
                  <div className="transaction-actions">
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => onEditRow?.(row)}
                      aria-label="Edit transaction"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-button icon-button--danger"
                      type="button"
                      onClick={() => onDeleteRow?.([rowId])}
                      aria-label="Delete transaction"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </td>
            </tr>
          )})}
        </tbody>

      </table>
    </div>
  );
}
