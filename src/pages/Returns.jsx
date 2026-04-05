import React, { useEffect, useState } from "react";
import { getReturnsData } from "../services/api";
import "./GSTReturns.css";

function formatMoney(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`;
}

export default function Returns() {
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("gstr1");
  const [monthOptions, setMonthOptions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");

  const loadReturns = async (monthYear) => {
    try {
      const res = await getReturnsData(monthYear);
      setData(res.data);
      setMonthOptions(res.data.monthOptions || []);
      setSelectedMonth(res.data.selectedMonth || "");
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

  if (!data) {
    return <div style={{ padding: 40 }}>Loading GST data...</div>;
  }

  const summary = data.summary || {};
  const tables = data.tables || {};
  const b2b = tables.b2b || [];
  const b2c = tables.b2c || tables.b2c_small || [];
  const exportsTable = tables.exports || [];
  const hsn = tables.hsn || [];

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

          <button className="guide-link">View Filing Guide</button>
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
            <b className="green">Rs 0</b>
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
        <>
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
                  <tr><td colSpan="7">No data</td></tr>
                ) : (
                  b2b.map((invoice, index) => {
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
                  <tr><td colSpan="6">No data</td></tr>
                ) : (
                  b2c.map((row, index) => (
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
              Export invoices are grouped separately when detected from uploaded data.
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
                  <tr><td colSpan="4">No export data</td></tr>
                ) : (
                  exportsTable.map((row, index) => (
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
                  <th>Taxable Value</th>
                  <th>Total Tax</th>
                </tr>
              </thead>
              <tbody>
                {hsn.length === 0 ? (
                  <tr><td colSpan="5">No data</td></tr>
                ) : (
                  hsn.map((row, index) => (
                    <tr key={`${row.hsn}-${index}`}>
                      <td>{row.hsn}</td>
                      <td>{row.description}</td>
                      <td>{row.quantity}</td>
                      <td>{formatMoney(row.taxableValue)}</td>
                      <td>{formatMoney(Number(row.igst || 0) + Number(row.cgst || 0) + Number(row.sgst || 0))}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "gstr3b" && (
        <div className="gstr3b">
          <h2>GSTR-3B Summary</h2>
          <p>This section is auto-calculated from your aggregated GSTR-1 data</p>

          <div className="gstr3b-cards">
            <div>Total Outward Supplies: {formatMoney(summary.totalAmount)}</div>
            <div>Total Tax Liability: {formatMoney(summary.totalTax)}</div>
            <div className="green">ITC Available: Rs 0</div>
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
    </div>
  );
}
