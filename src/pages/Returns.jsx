import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeIndianRupee,
  CheckCircle2,
  FileText,
  Globe,
  Landmark,
  Layers3,
  NotebookPen,
  ReceiptText,
  ShieldCheck,
  Ship,
  Wallet,
  X,
} from "lucide-react";
import { getReturnsData } from "../services/api";
import { formatMoney } from "../utils/format";
import "./GSTReturns.css";

const UQC_OPTIONS = [
  "NOS",
  "PRS",
  "BOX",
  "SET",
  "KGS",
  "GMS",
  "MTR",
  "LTR",
];

function toNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getRate(row) {
  return toNumber(row.rate ?? row.gstRate);
}

function getTax(row) {
  const directTax = toNumber(row.taxAmount ?? row.tax);
  if (directTax > 0) {
    return directTax;
  }

  const taxable = toNumber(row.taxable);
  const rate = getRate(row);
  if (taxable > 0 && rate > 0) {
    return Number(((taxable * rate) / 100).toFixed(2));
  }

  return 0;
}

function containsAny(text, terms) {
  const normalized = String(text || "").toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function deriveNilRatedRows(transactions = []) {
  const nilRows = transactions.filter(
    (row) => row.type !== "EXPORT" && getRate(row) === 0
  );

  const grouped = new Map();
  nilRows.forEach((row) => {
    const key = row.stateCode || row.placeOfSupply || "NA";
    const current = grouped.get(key) || {
      placeOfSupply: key,
      description: "Nil rated / exempt outward supplies",
      taxableValue: 0,
      invoiceCount: 0,
    };

    current.taxableValue += toNumber(row.taxable ?? row.amount);
    current.invoiceCount += 1;
    grouped.set(key, current);
  });

  return Array.from(grouped.values());
}

function deriveNoteRows(transactions = []) {
  return transactions
    .filter((row) => {
      if (row.isReturnRecord) {
        return true;
      }

      const noteText = [
        row.documentType,
        row.noteType,
        row.invoiceNumber,
        row.invoice,
        row.productName,
        row.party,
      ]
        .filter(Boolean)
        .join(" ");

      return containsAny(noteText, ["credit note", "debit note", "cn", "dn"]);
    })
    .map((row, index) => ({
      id: row.recordId || `${row.invoiceNumber || row.invoice || "note"}-${index}`,
      noteType:
        row.isReturnRecord || containsAny(
          [row.documentType, row.noteType, row.invoiceNumber].filter(Boolean).join(" "),
          ["credit note", "cn", "return"]
        )
          ? "Credit Note"
          : "Debit Note",
      reference: row.invoiceNumber || row.invoice || "N/A",
      party: row.party || "N/A",
      taxableValue: toNumber(row.taxable),
      taxAmount: getTax(row),
    }));
}

function deriveAdvanceRows(transactions = []) {
  return transactions
    .filter((row) =>
      containsAny(
        [row.documentType, row.productName, row.party, row.invoiceNumber].filter(Boolean).join(" "),
        ["advance", "advance receipt"]
      )
    )
    .map((row, index) => ({
      id: row.recordId || `${row.invoiceNumber || "advance"}-${index}`,
      reference: row.invoiceNumber || row.invoice || "N/A",
      party: row.party || "N/A",
      taxableValue: toNumber(row.taxable),
      taxAmount: getTax(row),
    }));
}

function deriveAdjustmentRows(transactions = []) {
  return transactions
    .filter((row) =>
      containsAny(
        [row.documentType, row.productName, row.party, row.invoiceNumber].filter(Boolean).join(" "),
        ["adjustment", "adjusted", "set off", "setoff"]
      )
    )
    .map((row, index) => ({
      id: row.recordId || `${row.invoiceNumber || "adjustment"}-${index}`,
      reference: row.invoiceNumber || row.invoice || "N/A",
      description: row.productName || row.party || "Adjustment entry",
      taxableValue: toNumber(row.taxable),
      taxAmount: getTax(row),
    }));
}

function deriveDocumentsIssuedRows(transactions = []) {
  const grouped = new Map();

  transactions.forEach((row) => {
    if (row.isReturnRecord) {
      const creditNotes = grouped.get("Credit Notes") || {
        documentType: "Credit Notes",
        issuedCount: 0,
        cancelledCount: 0,
        netIssued: 0,
      };
      creditNotes.issuedCount += 1;
      creditNotes.netIssued = creditNotes.issuedCount - creditNotes.cancelledCount;
      grouped.set("Credit Notes", creditNotes);

      const invoices = grouped.get("Invoices") || {
        documentType: "Invoices",
        issuedCount: 0,
        cancelledCount: 0,
        netIssued: 0,
      };
      invoices.cancelledCount += 1;
      invoices.netIssued = invoices.issuedCount - invoices.cancelledCount;
      grouped.set("Invoices", invoices);
      return;
    }

    const documentText = [
      row.documentType,
      row.noteType,
      row.invoiceNumber,
      row.invoice,
      row.status,
      row.productName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    let documentType = "Invoices";
    if (containsAny(documentText, ["credit note", "cn"])) {
      documentType = "Credit Notes";
    } else if (containsAny(documentText, ["debit note", "dn"])) {
      documentType = "Debit Notes";
    }

    const isCancelled = containsAny(documentText, ["cancel", "cancelled", "canceled", "void"]);
    const current = grouped.get(documentType) || {
      documentType,
      issuedCount: 0,
      cancelledCount: 0,
      netIssued: 0,
    };

    current.issuedCount += 1;
    if (isCancelled) {
      current.cancelledCount += 1;
    }
    current.netIssued = current.issuedCount - current.cancelledCount;
    grouped.set(documentType, current);
  });

    const orderedTypes = ["Invoices", "Credit Notes", "Debit Notes"];
  return orderedTypes
    .map((type) => grouped.get(type) || {
      documentType: type,
      issuedCount: 0,
      cancelledCount: 0,
      netIssued: 0,
    });
}

function EmptyState({ title, message, hint }) {
  return (
    <div className="returns-empty">
      <div className="returns-empty__title">{title}</div>
      <p>{message}</p>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}

const FILING_STEPS = [
  {
    id: "portal",
    icon: Globe,
    eyebrow: "Step 1",
    title: "Go to GST Portal",
    tone: "sky",
    bullets: [
      "Open https://www.gst.gov.in",
      "Click on Login",
      "Enter your GSTIN, username, and password",
    ],
  },
  {
    id: "dashboard",
    icon: Landmark,
    eyebrow: "Step 2",
    title: "Open Returns Dashboard",
    tone: "violet",
    bullets: [
      "Go to Services -> Returns -> Returns Dashboard",
      "Select Financial Year",
      "Select Return Filing Period (Month)",
    ],
  },
  {
    id: "gstr1",
    icon: ReceiptText,
    eyebrow: "Step 3",
    title: "Start with GSTR-1",
    tone: "amber",
    bullets: [
      "Click on GSTR-1",
      "Click Prepare Online",
    ],
  },
  {
    id: "appdata",
    icon: FileText,
    eyebrow: "Step 4",
    title: "Use Data from This App",
    tone: "emerald",
    blocks: [
      {
        title: "B2B Sales (Table 4A / 4B / 6B)",
        points: [
          "Go to B2B Invoices in GST portal",
          "Add GSTIN of customer",
          "Add invoice number and date",
          "Add taxable value and GST amount",
          "Copy these directly from Transactions / GSTR tables",
        ],
      },
      {
        title: "B2C Sales (Table 7)",
        points: [
          "Go to B2C (Others)",
          "Enter total taxable value",
          "Enter GST amount",
          "Use the summarized values shown in our app",
        ],
      },
      {
        title: "HSN Summary (Table 12)",
        points: [
          "Go to HSN Summary",
          "Enter HSN code",
          "Enter total quantity when available",
          "Enter taxable value and tax amount",
          "Use the HSN table from our app",
        ],
      },
    ],
  },
  {
    id: "review",
    icon: CheckCircle2,
    eyebrow: "Step 5",
    title: "Review Before Filing",
    tone: "rose",
    bullets: [
      "Click Preview GSTR-1",
      "Download PDF if needed",
      "Check total sales, tax amounts, and missing invoices",
    ],
  },
  {
    id: "submit",
    icon: ShieldCheck,
    eyebrow: "Step 6-7",
    title: "Submit and File GSTR-1",
    tone: "slate",
    bullets: [
      "Click Submit to lock the data",
      "Click File GSTR-1",
      "Choose EVC (OTP) or DSC (Digital Signature)",
    ],
  },
  {
    id: "gstr3b",
    icon: Wallet,
    eyebrow: "Step 8-9",
    title: "File GSTR-3B",
    tone: "indigo",
    bullets: [
      "Go back to dashboard and open GSTR-3B",
      "Fill total sales, ITC (if applicable), and tax payable",
      "Use the summary shown in our app",
      "Click Submit, then File GSTR-3B, and complete with OTP",
    ],
  },
];

export default function Returns() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("gstr1");
  const [monthOptions, setMonthOptions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [hsnUqcOverrides, setHsnUqcOverrides] = useState({});
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [visibleRowCount, setVisibleRowCount] = useState(25);
  const loadMoreRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const loadReturns = async (monthYear) => {
    try {
      const res = await getReturnsData(monthYear);
      setData(res.data);
      setMonthOptions(res.data.monthOptions || []);
      setSelectedMonth(res.data.selectedMonth || "");
      setHsnUqcOverrides({});
      setVisibleRowCount(25);
    } catch (err) {
      console.error(err);
      setData({
        summary: {
          totalTransactions: 0,
          totalAmount: 0,
          totalTax: 0,
        },
        tables: {
          b2b: [],
          b2c: [],
          exports: [],
          hsn: [],
        },
      });
      setMonthOptions([]);
      setSelectedMonth("");
    }
  };

  useEffect(() => {
    loadReturns();
  }, []);

  useEffect(() => {
    if (!loadMoreRef.current || !scrollContainerRef.current || activeTab !== "gstr1") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setVisibleRowCount((prev) => prev + 25);
        }
      },
      { root: scrollContainerRef.current, rootMargin: "220px" }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [activeTab, data]);

  if (!data) {
    return <div style={{ padding: 40 }}>Loading GST data...</div>;
  }

  const summary = data.summary || {};
  const tables = data.tables || {};
  const transactions = data.transactions || [];
  const b2b = tables.b2b || [];
  const b2c = tables.b2c || tables.b2c_small || [];
  const exportsTable = tables.exports || [];
  const hsn = tables.hsn || [];
  const nilRated = deriveNilRatedRows(transactions);
  const notes = deriveNoteRows(transactions);
  const advances = deriveAdvanceRows(transactions);
  const adjustments = deriveAdjustmentRows(transactions);
  const documentsIssued = deriveDocumentsIssuedRows(transactions);
  const visibleB2B = b2b.slice(0, visibleRowCount);
  const visibleB2C = b2c.slice(0, visibleRowCount);
  const visibleExports = exportsTable.slice(0, visibleRowCount);
  const visibleHsn = hsn.slice(0, visibleRowCount);
  const visibleNilRated = nilRated.slice(0, visibleRowCount);
  const visibleNotes = notes.slice(0, visibleRowCount);
  const visibleAdvances = advances.slice(0, visibleRowCount);
  const visibleAdjustments = adjustments.slice(0, visibleRowCount);
  const visibleDocumentsIssued = documentsIssued.slice(0, visibleRowCount);
  const hasMoreRows = [
    b2b.length,
    b2c.length,
    exportsTable.length,
    hsn.length,
    nilRated.length,
    notes.length,
    advances.length,
    adjustments.length,
    documentsIssued.length,
  ].some((count) => count > visibleRowCount);

  return (
    <div className="returns-container">
      <div className="returns-header">
        <div>
          <h1>GST Returns</h1>
          <p>Review and file your GST returns in simple steps</p>
          <small className="subtext">Matches official GST format for easy filing</small>
        </div>

        <div className="header-actions">
          <select
            className="month-select"
            value={selectedMonth}
            onChange={(event) => {
              const monthYear = event.target.value;
              setSelectedMonth(monthYear);
              loadReturns(monthYear);
            }}
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

          <button className="guide-link" type="button" onClick={() => setIsGuideOpen(true)}>
            View Filing Guide
          </button>
        </div>
      </div>

      <div className="summary-grid">
        <div className="card">
          <h3>GSTR-1</h3>
          <p className="sub">Outward Supplies</p>

          <div className="row">
            <span>Total Invoices</span>
            <b>{summary.totalTransactions || 0}</b>
          </div>

          <div className="row">
            <span>Taxable Value</span>
            <b>{formatMoney(summary.totalAmount)}</b>
          </div>

          <div className="row">
            <span>Total Tax</span>
            <b>{formatMoney(summary.totalTax)}</b>
          </div>
        </div>

        <div className="card">
          <h3>GSTR-3B</h3>
          <p className="sub">Summary Return</p>

          <div className="row">
            <span>Tax Payable</span>
            <b>{formatMoney(summary.totalTax)}</b>
          </div>

          <div className="row">
            <span>ITC Available</span>
            <b className="green">{formatMoney(0)}</b>
          </div>

          <div className="row">
            <span>Net Tax</span>
            <b>{formatMoney(summary.totalTax)}</b>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={activeTab === "gstr1" ? "active" : ""}
          onClick={() => setActiveTab("gstr1")}
        >
          GSTR-1 Details
        </button>

        <button
          className={activeTab === "gstr3b" ? "active" : ""}
          onClick={() => setActiveTab("gstr3b")}
        >
          GSTR-3B Details
        </button>
      </div>

      {activeTab === "gstr1" && (
        <div className="returns-scroll-shell" ref={scrollContainerRef}>
          <div className="section-card">
            <div className="section-header">
              <span>B2B - Sales to Registered Businesses (Table 4A)</span>
            </div>

            <div className="info-box blue">
              Aggregated from all uploaded files and grouped by invoice.
            </div>

            <table>
              <thead>
                <tr>
                  <th>GSTIN</th>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Taxable Value</th>
                  <th>CGST</th>
                  <th>SGST</th>
                  <th>IGST</th>
                </tr>
              </thead>
              <tbody>
                {b2b.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <EmptyState
                        title="No B2B transactions found"
                        message="This section will populate when registered-customer invoices are detected."
                        hint="Upload B2B invoices or review transaction type mapping if you expected data here."
                      />
                    </td>
                  </tr>
                ) : (
                  visibleB2B.map((invoice, index) => {
                    const totals = (invoice.items || []).reduce(
                      (acc, item) => ({
                        taxableValue: acc.taxableValue + Number(item.taxableValue || 0),
                        cgst: acc.cgst + Number(item.cgst || 0),
                        sgst: acc.sgst + Number(item.sgst || 0),
                        igst: acc.igst + Number(item.igst || 0),
                      }),
                      { taxableValue: 0, cgst: 0, sgst: 0, igst: 0 }
                    );

                    return (
                      <tr key={`${invoice.invoiceNumber}-${index}`}>
                        <td>{invoice.gstin}</td>
                        <td>{invoice.invoiceNumber}</td>
                        <td>{invoice.invoiceDate}</td>
                        <td>{formatMoney(totals.taxableValue)}</td>
                        <td>{formatMoney(totals.cgst)}</td>
                        <td>{formatMoney(totals.sgst)}</td>
                        <td>{formatMoney(totals.igst)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="section-card">
            <div className="section-header">
              <span>B2C - Sales to Consumers (Table 7)</span>
            </div>

            <div className="info-box yellow">
              Aggregated by place of supply and GST rate from all uploaded files.
            </div>

            <table>
              <thead>
                <tr>
                  <th>State</th>
                  <th>GST Rate</th>
                  <th>Taxable Value</th>
                  <th>CGST</th>
                  <th>SGST</th>
                  <th>IGST</th>
                </tr>
              </thead>
              <tbody>
                {b2c.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <EmptyState
                        title="No B2C transactions found"
                        message="This section will populate when consumer sales or marketplace sales are present."
                        hint="Marketplace uploads map to B2C and will appear here after processing."
                      />
                    </td>
                  </tr>
                ) : (
                  visibleB2C.map((row, index) => (
                    <tr key={`${row.placeOfSupply}-${row.rate}-${index}`}>
                      <td>{row.placeOfSupplyName || row.placeOfSupply}</td>
                      <td>{row.rate}%</td>
                      <td>{formatMoney(row.taxableValue)}</td>
                      <td>{formatMoney(row.cgst)}</td>
                      <td>{formatMoney(row.sgst)}</td>
                      <td>{formatMoney(row.igst)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="section-card">
            <div className="section-header">
              <span>Exports (Table 6A)</span>
            </div>

            <div className="info-box green">
              Enter export invoices where goods or services are sold outside India.
            </div>

            <table>
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Taxable Value</th>
                  <th>IGST</th>
                </tr>
              </thead>
              <tbody>
                {exportsTable.length === 0 ? (
                  <tr>
                    <td colSpan="4">
                      <EmptyState
                        title="No export transactions found"
                        message="Export invoices will appear here when rows are detected as export transactions."
                        hint="We classify export rows when type is EXPORT or the transaction indicates overseas supply."
                      />
                    </td>
                  </tr>
                ) : (
                  visibleExports.map((row, index) => (
                    <tr key={`${row.invoiceNumber}-${index}`}>
                      <td>{row.invoiceNumber}</td>
                      <td>{row.invoiceDate}</td>
                      <td>{formatMoney(row.taxableValue)}</td>
                      <td>{formatMoney(row.igst)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="section-card">
            <div className="section-header">
              <span>HSN Summary (Table 12)</span>
            </div>

            <div className="info-box blue">
              HSN summary is aggregated across all uploaded files.
            </div>

            <table>
              <thead>
                <tr>
                  <th>HSN</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>QAS</th>
                  <th>Taxable Value</th>
                  <th>CGST</th>
                  <th>SGST</th>
                  <th>IGST</th>
                </tr>
              </thead>
              <tbody>
                {hsn.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <EmptyState
                        title="No HSN summary available"
                        message="HSN summary will appear once HSN-coded products are detected from uploaded transactions."
                        hint="If your file contains HSN and quantity columns, this section will auto-populate."
                      />
                    </td>
                  </tr>
                ) : (
                  visibleHsn.map((row, index) => (
                    <tr key={`${row.hsn}-${index}`}>
                      <td>{row.hsn}</td>
                      <td>{row.description}</td>
                      <td>{row.quantity}</td>
                      <td>
                        <select
                          className="uqc-select"
                          value={hsnUqcOverrides[row.hsn] || row.uqc || "NOS"}
                          onChange={(event) => {
                            const value = event.target.value;
                            setHsnUqcOverrides((prev) => ({
                              ...prev,
                              [row.hsn]: value,
                            }));
                          }}
                        >
                          {UQC_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{formatMoney(row.taxableValue)}</td>
                      <td>{formatMoney(row.cgst)}</td>
                      <td>{formatMoney(row.sgst)}</td>
                      <td>{formatMoney(row.igst)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="returns-section-grid">
            <div className="section-card">
              <div className="section-header section-header--stacked">
                <div>
                  <span>Nil Rated / Exempt / Non-GST (Table 8)</span>
                  <small>Show supplies where GST rate is 0%.</small>
                </div>
                <div className="section-chip section-chip--amber">
                  <Layers3 size={14} />
                  <span>{nilRated.length} buckets</span>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Place of Supply</th>
                    <th>Description</th>
                    <th>Invoice Count</th>
                    <th>Taxable Value</th>
                  </tr>
                </thead>
                <tbody>
                  {nilRated.length === 0 ? (
                    <tr>
                      <td colSpan="4">
                        <EmptyState
                          title="No nil rated or exempt supplies found"
                          message="This section stays visible so the filing structure remains complete."
                          hint="If you upload zero-rate sales, they will appear here automatically."
                        />
                      </td>
                    </tr>
                  ) : (
                    visibleNilRated.map((row) => (
                      <tr key={row.placeOfSupply}>
                        <td>{row.placeOfSupply}</td>
                        <td>{row.description}</td>
                        <td>{row.invoiceCount}</td>
                        <td>{formatMoney(row.taxableValue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="section-card">
              <div className="section-header section-header--stacked">
                <div>
                  <span>Credit / Debit Notes (Table 9B)</span>
                  <small>Capture note-based corrections against earlier invoices.</small>
                </div>
                <div className="section-chip section-chip--rose">
                  <NotebookPen size={14} />
                  <span>{notes.length} notes</span>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Note Type</th>
                    <th>Reference</th>
                    <th>Party</th>
                    <th>Taxable Value</th>
                    <th>Tax Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.length === 0 ? (
                    <tr>
                      <td colSpan="5">
                        <EmptyState
                          title="No credit or debit notes found"
                          message="This table will populate when uploaded records are identified as note transactions."
                          hint="If your files use renamed note columns, we can extend the smart detection for those headers."
                        />
                      </td>
                    </tr>
                  ) : (
                    visibleNotes.map((row) => (
                      <tr key={row.id}>
                        <td>{row.noteType}</td>
                        <td>{row.reference}</td>
                        <td>{row.party}</td>
                        <td>{formatMoney(row.taxableValue)}</td>
                        <td>{formatMoney(row.taxAmount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="returns-section-grid">
            <div className="section-card">
              <div className="section-header section-header--stacked">
                <div>
                  <span>Advances Received (Table 5)</span>
                  <small>Track advance receipts that are relevant for GST reporting.</small>
                </div>
                <div className="section-chip section-chip--sky">
                  <BadgeIndianRupee size={14} />
                  <span>{advances.length} entries</span>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Party</th>
                    <th>Taxable Value</th>
                    <th>Tax Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {advances.length === 0 ? (
                    <tr>
                      <td colSpan="4">
                        <EmptyState
                          title="No advances received found"
                          message="Advance entries are uncommon, but the section is shown for complete GSTR-1 coverage."
                          hint="If you start uploading advance receipt records, they will appear here."
                        />
                      </td>
                    </tr>
                  ) : (
                    visibleAdvances.map((row) => (
                      <tr key={row.id}>
                        <td>{row.reference}</td>
                        <td>{row.party}</td>
                        <td>{formatMoney(row.taxableValue)}</td>
                        <td>{formatMoney(row.taxAmount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="section-card">
              <div className="section-header section-header--stacked">
                <div>
                  <span>Adjustments (Table 11)</span>
                  <small>Use for GST-relevant adjustments and offsets detected from uploaded data.</small>
                </div>
                <div className="section-chip section-chip--indigo">
                  <Ship size={14} />
                  <span>{adjustments.length} entries</span>
                </div>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Description</th>
                    <th>Taxable Value</th>
                    <th>Tax Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {adjustments.length === 0 ? (
                    <tr>
                      <td colSpan="4">
                        <EmptyState
                          title="No adjustments found"
                          message="This section remains visible so users know nothing is missing from the filing layout."
                          hint="If you have adjustment records in a custom format, we can map those fields next."
                        />
                      </td>
                    </tr>
                  ) : (
                    visibleAdjustments.map((row) => (
                      <tr key={row.id}>
                        <td>{row.reference}</td>
                        <td>{row.description}</td>
                        <td>{formatMoney(row.taxableValue)}</td>
                        <td>{formatMoney(row.taxAmount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="section-card">
            <div className="section-header section-header--stacked">
              <div>
                <span>Documents Issued (Table 13)</span>
                <small>
                  Mandatory summary of invoices, credit notes, debit notes, and cancellations
                  during the filing period.
                </small>
              </div>
              <div className="section-chip section-chip--slate">
                <ReceiptText size={14} />
                <span>{documentsIssued.reduce((sum, row) => sum + row.issuedCount, 0)} documents</span>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Document Type</th>
                  <th>Total Issued</th>
                  <th>Cancelled</th>
                  <th>Net Issued</th>
                </tr>
              </thead>
              <tbody>
                {documentsIssued.every((row) => row.issuedCount === 0) ? (
                  <tr>
                    <td colSpan="4">
                      <EmptyState
                        title="No issued documents found"
                        message="This mandatory table stays visible even when no document summary is available yet."
                        hint="As invoices, notes, or cancelled documents are detected, their counts will appear here."
                      />
                    </td>
                  </tr>
                ) : (
                  visibleDocumentsIssued.map((row) => (
                    <tr key={row.documentType}>
                      <td>{row.documentType}</td>
                      <td>{row.issuedCount}</td>
                      <td>{row.cancelledCount}</td>
                      <td>{row.netIssued}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="returns-loadmore" ref={loadMoreRef}>
            <div className="returns-loadmore__pill">
              {hasMoreRows ? "Scroll to load more GST sections" : "You have reached the end of GST return data"}
            </div>
          </div>
        </div>
      )}

      {activeTab === "gstr3b" && (
        <div className="gstr3b">
          <h2>GSTR-3B Summary</h2>
          <p>This section is auto-calculated from your aggregated GSTR-1 data</p>

          <div className="gstr3b-cards">
            <div>Total Outward Supplies: {formatMoney(summary.totalAmount)}</div>
            <div>Total Tax Liability: {formatMoney(summary.totalTax)}</div>
            <div className="green">ITC Available: {formatMoney(0)}</div>
            <div>Net Tax Payable: {formatMoney(summary.totalTax)}</div>
          </div>
        </div>
      )}

      <div className="sticky-footer">
        <div className="status">
          Processed {summary.totalTransactions || 0} invoices. Ready to file.
        </div>

        <button className="primary">File GSTR-1</button>
      </div>

      {isGuideOpen && (
        <div className="guide-overlay" onClick={() => setIsGuideOpen(false)}>
          <div className="guide-panel" onClick={(event) => event.stopPropagation()}>
            <div className="guide-panel__header">
              <div>
                <span className="guide-panel__eyebrow">Filing Walkthrough</span>
                <h2>GST Return Filing Guide</h2>
                <p>Follow these steps on the GST portal while copying values from this app.</p>
              </div>
              <button
                className="guide-close"
                type="button"
                onClick={() => setIsGuideOpen(false)}
                aria-label="Close filing guide"
              >
                <X size={18} />
              </button>
            </div>

            <div className="guide-banner">
              <div className="guide-banner__portal">
                <Globe size={18} />
                <span>Portal: gst.gov.in</span>
              </div>
              <ArrowRight size={16} />
              <div className="guide-banner__portal">
                <ReceiptText size={18} />
                <span>Use this app for B2B, B2C, HSN, and summary values</span>
              </div>
            </div>

            <div className="guide-steps">
              {FILING_STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <section key={step.id} className={`guide-step guide-step--${step.tone}`}>
                    <div className="guide-step__icon">
                      <Icon size={20} />
                    </div>
                    <div className="guide-step__content">
                      <span className="guide-step__eyebrow">{step.eyebrow}</span>
                      <h3>{step.title}</h3>
                      {step.bullets && (
                        <ul className="guide-list">
                          {step.bullets.map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                      )}
                      {step.blocks && (
                        <div className="guide-blocks">
                          {step.blocks.map((block) => (
                            <div key={block.title} className="guide-block">
                              <h4>{block.title}</h4>
                              <ul className="guide-list">
                                {block.points.map((point) => (
                                  <li key={point}>{point}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
