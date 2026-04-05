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

function getTypeLabel(row) {
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

export default function TransactionsTable({ data }) {
  return (
    <div className="table-container">
      <table>

        <thead>
          <tr>
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
          {data?.map((row, index) => (
            <tr key={index} className={row.status !== "valid" ? "row-error" : ""}>

              <td>{getSourceLabel(row)}</td>
              <td>{row.invoiceNumber || row.invoice}</td>
              <td>{row.invoiceDate || row.date}</td>
              <td>{row.party}</td>
              <td>{row.gstin}</td>
              <td>
                <span className="transaction-type-badge">{getTypeLabel(row)}</span>
              </td>
              <td>{row.hsn}</td>
              <td>{getRateLabel(row)}</td>

             

              <td>₹{Number(row.amount || row.total_invoice_value || 0).toLocaleString()}</td>
<td>₹{Number(row.taxAmount || row.tax || 0).toLocaleString()}</td>



              <td>
                <span className={`status ${row.status || 'valid'}`}>
                  {row.status || 'valid'}
                </span>
              </td>

              <td>✏️</td>

            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}
