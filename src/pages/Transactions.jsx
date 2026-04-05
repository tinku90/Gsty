import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import {
  deleteTransactions,
  getTransactions,
  updateTransactions,
} from "../services/api";
import Filters from "../components/Filters";
import SummaryCards from "../components/SummaryCards";
import TransactionsTable, { getTransactionTypeLabel } from "../components/TransactionsTable";
import "../styles/transactions.css";

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

function buildEditState(row = {}) {
  return {
    invoiceDate: row.invoiceDate || row.date || "",
    party: row.party || "",
    gstin: row.gstin || "",
    type: row.type === "EXPORT" ? "Exports" : getTransactionTypeLabel(row),
    hsn: row.hsn || "",
    rate: row.rate ?? row.gstRate ?? "",
    amount: row.amount ?? "",
    taxAmount: row.taxAmount ?? row.tax ?? "",
  };
}

function normalizeEditPayload(formState, isBulk) {
  const nextType =
    formState.type === "Exports"
      ? "EXPORT"
      : formState.type === "B2B"
        ? "B2B"
        : formState.type === "B2C"
          ? "B2C"
          : "";

  const payload = {
    invoiceDate: formState.invoiceDate,
    party: formState.party,
    gstin: formState.gstin,
    type: nextType,
    hsn: formState.hsn,
    rate: formState.rate,
    amount: formState.amount,
    taxAmount: formState.taxAmount,
  };

  if (!isBulk) {
    return payload;
  }

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  );
}

function PaginationBar({ title, currentPage, totalPages, totalItems, pageSize, onPrev, onNext }) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="pagination-panel">
      <div className="pagination-panel__meta">
        <span className="pagination-panel__title">{title}</span>
        <span className="pagination-panel__count">
          Showing {start}-{end} of {totalItems}
        </span>
      </div>
      <div className="pagination-panel__controls">
        <button className="pagination-btn" type="button" disabled={currentPage === 1} onClick={onPrev}>
          Previous
        </button>
        <span className="pagination-pill">
          Page {currentPage} / {Math.max(totalPages, 1)}
        </span>
        <button
          className="pagination-btn pagination-btn--primary"
          type="button"
          disabled={currentPage === totalPages || totalItems === 0}
          onClick={onNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function Transactions() {
  const PAGE_SIZE = 10;
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [monthOptions, setMonthOptions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedIds, setSelectedIds] = useState([]);
  const [editModal, setEditModal] = useState({ open: false, mode: "single", row: null });
  const [editForm, setEditForm] = useState(buildEditState());
  const [deleteTargetIds, setDeleteTargetIds] = useState([]);
  const [salesPage, setSalesPage] = useState(1);
  const [returnsPage, setReturnsPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setSalesPage(1);
    setReturnsPage(1);
  }, [selectedType]);

  const fetchData = async (monthYear) => {
    try {
      const res = await getTransactions(monthYear);
      setSummary(res.data.summary || {});
      setTransactions(res.data.transactions || []);
      setMonthOptions(res.data.monthOptions || []);
      setSelectedMonth(res.data.selectedMonth || "");
      setSelectedIds([]);
      setSalesPage(1);
      setReturnsPage(1);
    } catch (err) {
      console.error("API ERROR:", err);
    }
  };

  const visibleTransactions = useMemo(
    () =>
      selectedType === "All Types"
        ? transactions
        : transactions.filter((row) => getTransactionTypeLabel(row) === selectedType),
    [selectedType, transactions]
  );

  const salesTransactions = useMemo(
    () => visibleTransactions.filter((row) => !row.isReturnRecord),
    [visibleTransactions]
  );

  const returnTransactions = useMemo(
    () => visibleTransactions.filter((row) => row.isReturnRecord),
    [visibleTransactions]
  );

  const paginatedSalesTransactions = useMemo(
    () => salesTransactions.slice((salesPage - 1) * PAGE_SIZE, salesPage * PAGE_SIZE),
    [salesPage, salesTransactions]
  );

  const paginatedReturnTransactions = useMemo(
    () => returnTransactions.slice((returnsPage - 1) * PAGE_SIZE, returnsPage * PAGE_SIZE),
    [returnTransactions, returnsPage]
  );

  const salesPageCount = Math.max(1, Math.ceil(salesTransactions.length / PAGE_SIZE));
  const returnsPageCount = Math.max(1, Math.ceil(returnTransactions.length / PAGE_SIZE));

  const toggleSelect = (recordId) => {
    setSelectedIds((prev) =>
      prev.includes(recordId) ? prev.filter((id) => id !== recordId) : [...prev, recordId]
    );
  };

  const toggleSelectAll = (rows) => {
    const rowIds = rows.map((row, index) => getRowId(row, index));
    const allSelected = rowIds.length > 0 && rowIds.every((id) => selectedIds.includes(id));
    setSelectedIds(allSelected ? [] : rowIds);
  };

  const openSingleEdit = (row) => {
    setEditModal({ open: true, mode: "single", row });
    setEditForm(buildEditState(row));
  };

  const openBulkEdit = () => {
    setEditModal({ open: true, mode: "bulk", row: null });
    setEditForm(buildEditState());
  };

  const closeEditModal = () => {
    setEditModal({ open: false, mode: "single", row: null });
    setEditForm(buildEditState());
  };

  const submitEdit = async () => {
    const recordIds =
      editModal.mode === "single" && editModal.row?.recordId
        ? [editModal.row.recordId]
        : selectedIds;

    if (!recordIds.length) {
      return;
    }

    try {
      await updateTransactions(
        recordIds,
        normalizeEditPayload(editForm, editModal.mode === "bulk"),
        editModal.mode
      );
      closeEditModal();
      await fetchData(selectedMonth);
    } catch (error) {
      console.error("Failed to update transactions:", error);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetIds.length) {
      return;
    }

    try {
      await deleteTransactions(deleteTargetIds);
      setDeleteTargetIds([]);
      await fetchData(selectedMonth);
    } catch (error) {
      console.error("Failed to delete transactions:", error);
    }
  };

  if (!summary) return <p>Loading...</p>;

  return (
    <div className="transactions-page">
      <div className="transactions-header">
        <div>
          <h1>Transactions</h1>
          <p>View and manage uploaded data</p>
        </div>

        <button className="export-btn">
          <Download size={16} />
          Export
        </button>
      </div>

      <div className="transactions-content">
        <Filters
          monthOptions={monthOptions}
          selectedMonth={selectedMonth}
          selectedType={selectedType}
          onMonthChange={(monthYear) => {
            setSelectedMonth(monthYear);
            fetchData(monthYear);
          }}
          onTypeChange={setSelectedType}
        />
        <SummaryCards summary={summary} />
      </div>

      {selectedIds.length > 0 && (
        <div className="bulk-actions-bar">
          <span>{selectedIds.length} transaction(s) selected</span>
          <div className="bulk-actions-buttons">
            <button className="bulk-btn" type="button" onClick={openBulkEdit}>
              Bulk Edit
            </button>
            <button
              className="bulk-btn bulk-btn--danger"
              type="button"
              onClick={() => setDeleteTargetIds(selectedIds)}
            >
              Bulk Remove
            </button>
            <button className="bulk-btn bulk-btn--secondary" type="button" onClick={() => setSelectedIds([])}>
              Clear Selection
            </button>
          </div>
        </div>
      )}

      <div className="transactions-section">
        <div className="transactions-section__header">
          <div>
            <h2>Sales Transactions</h2>
            <p>Primary sales records uploaded for this filing period.</p>
          </div>
        </div>

        <TransactionsTable
          data={paginatedSalesTransactions}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onEditRow={openSingleEdit}
          onDeleteRow={setDeleteTargetIds}
          emptyMessage="No sales transactions found for the current filters."
        />
        <PaginationBar
          title="Sales Pages"
          currentPage={salesPage}
          totalPages={salesPageCount}
          totalItems={salesTransactions.length}
          pageSize={PAGE_SIZE}
          onPrev={() => setSalesPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setSalesPage((prev) => Math.min(salesPageCount, prev + 1))}
        />
      </div>

      <div className="transactions-section transactions-section--returns">
        <div className="transactions-section__header">
          <div>
            <h2>Returns Related Transactions</h2>
            <p>These rows came from returns or cancellation uploads and are tracked separately for GST adjustment.</p>
          </div>
          <span className="transactions-section__badge">{returnTransactions.length} return rows</span>
        </div>

        <div className="transactions-note">
          Returns transactions are shown below for review and matching. They are not counted as outward sales in GST calculations once linked to the original sales records.
        </div>

        <TransactionsTable
          data={paginatedReturnTransactions}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onEditRow={openSingleEdit}
          onDeleteRow={setDeleteTargetIds}
          emptyMessage="No returns related transactions found for the current filters."
        />
        <PaginationBar
          title="Returns Pages"
          currentPage={returnsPage}
          totalPages={returnsPageCount}
          totalItems={returnTransactions.length}
          pageSize={PAGE_SIZE}
          onPrev={() => setReturnsPage((prev) => Math.max(1, prev - 1))}
          onNext={() => setReturnsPage((prev) => Math.min(returnsPageCount, prev + 1))}
        />
      </div>

      {salesTransactions.length > 0 && (
        <div className="file-gst-wrapper">
          <button
            className="file-gst-btn"
            type="button"
            onClick={() => {
              sessionStorage.setItem("showGstReturns", "true");
              window.dispatchEvent(new Event("uploadStateChanged"));
              navigate("/returns");
            }}
          >
            View GST Return ->
          </button>
        </div>
      )}

      {editModal.open && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2>{editModal.mode === "bulk" ? "Bulk Edit Transactions" : "Edit Transaction"}</h2>
            {editModal.mode === "bulk" && (
              <p className="modal-note">Fill only the fields you want to apply to all selected rows.</p>
            )}
            <div className="modal-grid">
              <label>
                Date
                <input
                  type="date"
                  value={editForm.invoiceDate}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, invoiceDate: event.target.value }))}
                />
              </label>
              <label>
                Party Name
                <input
                  type="text"
                  value={editForm.party}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, party: event.target.value }))}
                />
              </label>
              <label>
                GSTIN
                <input
                  type="text"
                  value={editForm.gstin}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, gstin: event.target.value }))}
                />
              </label>
              <label>
                Type
                <select
                  value={editForm.type}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, type: event.target.value }))}
                >
                  <option value="">Select</option>
                  <option value="B2B">B2B</option>
                  <option value="B2C">B2C</option>
                  <option value="Exports">Exports</option>
                </select>
              </label>
              <label>
                HSN
                <input
                  type="text"
                  value={editForm.hsn}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, hsn: event.target.value }))}
                />
              </label>
              <label>
                GST %
                <input
                  type="number"
                  value={editForm.rate}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, rate: event.target.value }))}
                />
              </label>
              <label>
                Amount
                <input
                  type="number"
                  value={editForm.amount}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, amount: event.target.value }))}
                />
              </label>
              <label>
                Tax
                <input
                  type="number"
                  value={editForm.taxAmount}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, taxAmount: event.target.value }))}
                />
              </label>
            </div>
            <div className="modal-actions">
              <button className="bulk-btn bulk-btn--secondary" type="button" onClick={closeEditModal}>
                Cancel
              </button>
              <button className="bulk-btn" type="button" onClick={submitEdit}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTargetIds.length > 0 && (
        <div className="modal-backdrop">
          <div className="modal-card modal-card--small">
            <h2>Delete Transactions</h2>
            <p className="modal-note">
              Are you sure you want to delete {deleteTargetIds.length} transaction(s)? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="bulk-btn bulk-btn--secondary"
                type="button"
                onClick={() => setDeleteTargetIds([])}
              >
                Cancel
              </button>
              <button className="bulk-btn bulk-btn--danger" type="button" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
