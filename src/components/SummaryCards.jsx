import { formatMoney } from "../utils/format";

export default function SummaryCards({ summary }) {
  return (
    <div className="summary-cards">
      <div className="card">
        <p>Total Transactions</p>
        <h2>{summary.totalTransactions || 0}</h2>
      </div>

      <div className="card">
        <p>Total Amount</p>
        <h2>{formatMoney(summary.totalAmount)}</h2>
      </div>

      <div className="card">
        <p>Total Tax</p>
        <h2>{formatMoney(summary.totalTax)}</h2>
      </div>

      <div className="card error">
        <p>Errors Found</p>
        <h2>{summary.errors || 0}</h2>
      </div>
    </div>
  );
}
