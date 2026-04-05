export default function SummaryCards({ summary }) {
  return (
    <div className="summary-cards">

      <div className="card">
        <p>Total Transactions</p>
        <h2>₹{summary.totalTransactions}</h2>
      </div>

      <div className="card">
        <p>Total Amount</p>
        <h2>₹{summary.totalAmount.toLocaleString()}</h2>
      </div>

      <div className="card">
        <p>Total Tax</p>
        <h2>₹{summary.totalTax.toLocaleString()}</h2>
      </div>

      <div className="card error">
        <p>Errors Found</p>
        <h2>{summary.errors}</h2>
      </div>

    </div>
  );
}