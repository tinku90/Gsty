import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTransactions } from "../services/api";
import Filters from "../components/Filters";
import SummaryCards from "../components/SummaryCards";
import TransactionsTable from "../components/TransactionsTable";
import "../styles/transactions.css";
import { Download } from "lucide-react";

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

export default function Transactions() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [monthOptions, setMonthOptions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (monthYear) => {
    try {
      const res = await getTransactions(monthYear);
      setSummary(res.data.summary || {});
      setTransactions(res.data.transactions || []);
      setMonthOptions(res.data.monthOptions || []);
      setSelectedMonth(res.data.selectedMonth || "");
    } catch (err) {
      console.error("API ERROR:", err);
    }
  };

  const visibleTransactions =
    selectedType === "All Types"
      ? transactions
      : transactions.filter((row) => getTypeLabel(row) === selectedType);

  if (!summary) return <p>Loading...</p>;

  return (
    <div className="transactions-page">

      {/* HEADER */}
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

      {/* FILTERS + SUMMARY */}
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

      {/* TABLE */}
      <TransactionsTable data={visibleTransactions} />

      {/* FILE GST */}
      {visibleTransactions.length > 0 && (
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
            View GST Return →
          </button>
        </div>
      )}

    </div>
  );
}
