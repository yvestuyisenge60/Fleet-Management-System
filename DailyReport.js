import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import './DailyReport.css';
import './page.css';

/* ── small helpers ──────────────────────────────────── */
function fmt(d) { return d ? String(d).split('T')[0] : '—'; }
function money(v) { return '$' + parseFloat(v || 0).toFixed(2); }
function sum(arr, key) { return arr.reduce((s, r) => s + parseFloat(r[key] || 0), 0); }

function statusBadgeDoc(s) {
  const colors = {
    'Available':         '#059669',
    'On Trip':           '#1d4ed8',
    'Under Maintenance': '#b45309',
    'Out of Service':    '#6b7280',
  };
  return (
    <span style={{
      background: colors[s] ? colors[s] + '18' : '#f1f5f9',
      color: colors[s] || '#6b7280',
      padding: '2px 8px', borderRadius: 12,
      fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
    }}>{s}</span>
  );
}

/* ── The printable document ─────────────────────────── */
function PrintDocument({ date, data, generatedAt, user }) {
  const {
    trips = [], fuel = [], maintenance = [],
    vehicles = [], drivers = [],
    summary = {},
  } = data;

  const todayTrips  = trips.filter(t => fmt(t.TripDate)        === date);
  const todayFuel   = fuel.filter(f  => fmt(f.FuelDate)         === date);
  const todayMaint  = maintenance.filter(m => fmt(m.ServiceDate) === date);

  const totalDist    = sum(todayTrips, 'Distance');
  const totalFuel    = sum(todayFuel,  'TotalCost');
  const totalFuelL   = sum(todayFuel,  'Liters');
  const totalMaint   = sum(todayMaint, 'Cost');

  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="print-doc" id="print-area">

      {/* ── Header ── */}
      <div className="doc-header">
        <div className="doc-logo">🚀</div>
        <div className="doc-header-text">
          <h1>SwiftWheels Fleet Management</h1>
          <h2>Daily Operations Report</h2>
        </div>
        <div className="doc-header-meta">
          <p><strong>{displayDate}</strong></p>
          <p>Generated: {generatedAt}</p>
          <p>Prepared by: {user.fullName || 'Administrator'}</p>
          <p>Role: {user.role || 'Administrator'}</p>
        </div>
      </div>

      {/* ── Info strip ── */}
      <div className="doc-info-strip">
        <div className="doc-info-cell">
          <div className="dic-val">{todayTrips.length}</div>
          <div className="dic-lbl">Trips Today</div>
        </div>
        <div className="doc-info-cell">
          <div className="dic-val">{totalDist.toFixed(1)} km</div>
          <div className="dic-lbl">Distance Covered</div>
        </div>
        <div className="doc-info-cell">
          <div className="dic-val">{money(totalFuel)}</div>
          <div className="dic-lbl">Fuel Cost</div>
        </div>
        <div className="doc-info-cell">
          <div className="dic-val">{money(totalMaint)}</div>
          <div className="dic-lbl">Maintenance Cost</div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="doc-body">

        {/* 1 — Fleet Summary */}
        <div className="doc-section">
          <div className="doc-section-title"><span>🚗</span> Fleet Status Summary</div>
          <table className="doc-table">
            <thead>
              <tr>
                <th>#</th><th>Plate Number</th><th>Model</th><th>Year</th>
                <th>Status</th><th>Mileage (km)</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0
                ? <tr><td colSpan={6} className="doc-table-empty">No vehicles on record.</td></tr>
                : vehicles.map((v, i) => (
                  <tr key={v.VehicleID}>
                    <td>{i + 1}</td>
                    <td><strong>{v.PlateNumber}</strong></td>
                    <td>{v.Model}</td>
                    <td>{v.Year}</td>
                    <td>{statusBadgeDoc(v.Status)}</td>
                    <td>{(v.Mileage || 0).toLocaleString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* 2 — Trips */}
        <div className="doc-section">
          <div className="doc-section-title"><span>🗺️</span> Trips Recorded Today</div>
          <table className="doc-table">
            <thead>
              <tr>
                <th>#</th><th>Vehicle</th><th>Driver</th>
                <th>From</th><th>To</th><th>Date</th><th>Distance (km)</th>
              </tr>
            </thead>
            <tbody>
              {todayTrips.length === 0
                ? <tr><td colSpan={7} className="doc-table-empty">No trips recorded for this date.</td></tr>
                : todayTrips.map((t, i) => (
                  <tr key={t.TripID}>
                    <td>{i + 1}</td>
                    <td><strong>{t.PlateNumber}</strong></td>
                    <td>{t.DriverName}</td>
                    <td>{t.StartLocation}</td>
                    <td>{t.Destination}</td>
                    <td>{fmt(t.TripDate)}</td>
                    <td>{parseFloat(t.Distance || 0).toFixed(1)}</td>
                  </tr>
                ))}
              {todayTrips.length > 0 && (
                <tr className="doc-total-row">
                  <td colSpan={6}><strong>TOTAL DISTANCE</strong></td>
                  <td><strong>{totalDist.toFixed(1)} km</strong></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 3 — Fuel */}
        <div className="doc-section">
          <div className="doc-section-title"><span>⛽</span> Fuel Usage Today</div>
          <table className="doc-table">
            <thead>
              <tr>
                <th>#</th><th>Vehicle</th><th>Driver</th>
                <th>Date</th><th>Liters</th><th>Cost/Liter</th><th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {todayFuel.length === 0
                ? <tr><td colSpan={7} className="doc-table-empty">No fuel records for this date.</td></tr>
                : todayFuel.map((f, i) => (
                  <tr key={f.FuelID}>
                    <td>{i + 1}</td>
                    <td><strong>{f.PlateNumber}</strong></td>
                    <td>{f.DriverName}</td>
                    <td>{fmt(f.FuelDate)}</td>
                    <td>{parseFloat(f.Liters || 0).toFixed(1)} L</td>
                    <td>{money(f.CostPerLiter)}</td>
                    <td><strong>{money(f.TotalCost)}</strong></td>
                  </tr>
                ))}
              {todayFuel.length > 0 && (
                <tr className="doc-total-row">
                  <td colSpan={4}><strong>TOTALS</strong></td>
                  <td><strong>{totalFuelL.toFixed(1)} L</strong></td>
                  <td></td>
                  <td><strong>{money(totalFuel)}</strong></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4 — Maintenance */}
        <div className="doc-section">
          <div className="doc-section-title"><span>🔧</span> Maintenance Services Today</div>
          <table className="doc-table">
            <thead>
              <tr>
                <th>#</th><th>Vehicle</th><th>Model</th>
                <th>Service Date</th><th>Description</th><th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {todayMaint.length === 0
                ? <tr><td colSpan={6} className="doc-table-empty">No maintenance scheduled for this date.</td></tr>
                : todayMaint.map((m, i) => (
                  <tr key={m.MaintenanceID}>
                    <td>{i + 1}</td>
                    <td><strong>{m.PlateNumber}</strong></td>
                    <td>{m.Model}</td>
                    <td>{fmt(m.ServiceDate)}</td>
                    <td>{m.Description || '—'}</td>
                    <td><strong>{money(m.Cost)}</strong></td>
                  </tr>
                ))}
              {todayMaint.length > 0 && (
                <tr className="doc-total-row">
                  <td colSpan={5}><strong>TOTAL MAINTENANCE COST</strong></td>
                  <td><strong>{money(totalMaint)}</strong></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 5 — Drivers */}
        <div className="doc-section">
          <div className="doc-section-title"><span>👤</span> Active Drivers</div>
          <table className="doc-table">
            <thead>
              <tr>
                <th>#</th><th>Full Name</th><th>License Number</th>
                <th>Phone</th><th>Address</th>
              </tr>
            </thead>
            <tbody>
              {drivers.length === 0
                ? <tr><td colSpan={5} className="doc-table-empty">No drivers on record.</td></tr>
                : drivers.map((d, i) => (
                  <tr key={d.DriverID}>
                    <td>{i + 1}</td>
                    <td><strong>{d.FullName}</strong></td>
                    <td>{d.LicenseNumber}</td>
                    <td>{d.Phone || '—'}</td>
                    <td>{d.Address || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* 6 — Cost summary box */}
        <div className="doc-section">
          <div className="doc-section-title"><span>💰</span> Daily Cost Summary</div>
          <table className="doc-table" style={{ maxWidth: 420 }}>
            <tbody>
              <tr><td>Total Fuel Cost Today</td><td><strong>{money(totalFuel)}</strong></td></tr>
              <tr><td>Total Maintenance Cost Today</td><td><strong>{money(totalMaint)}</strong></td></tr>
              <tr className="doc-total-row">
                <td><strong>GRAND TOTAL (Today)</strong></td>
                <td><strong>{money(totalFuel + totalMaint)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="doc-sig">
          <div className="doc-sig-box">
            <div className="doc-sig-line"></div>
            <p>Fleet Manager</p>
          </div>
          <div className="doc-sig-box">
            <div className="doc-sig-line"></div>
            <p>Prepared By</p>
          </div>
          <div className="doc-sig-box">
            <div className="doc-sig-line"></div>
            <p>Management Approval</p>
          </div>
        </div>

      </div>

      {/* ── Doc Footer ── */}
      <div className="doc-footer">
        <p>© 2026 SwiftWheels Fleet Management System — <strong>Created By Yves Ty</strong></p>
        <p>Report Date: <strong>{displayDate}</strong> &nbsp;|&nbsp; Generated: {generatedAt}</p>
      </div>

    </div>
  );
}

/* ── Main page component ────────────────────────────── */
export default function DailyReport() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate]           = useState(today);
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [generatedAt, setGeneratedAt] = useState('');
  const printRef = useRef();
  const user = JSON.parse(localStorage.getItem('sw_user') || '{}');

  const loadData = useCallback(async (d) => {
    setLoading(true);
    try {
      const [trips, fuel, maintenance, vehicles, drivers, summary] = await Promise.all([
        api.get('/trips'),
        api.get('/fuel'),
        api.get('/maintenance'),
        api.get('/vehicles'),
        api.get('/drivers'),
        api.get('/reports/summary'),
      ]);
      setData({
        trips:       trips.data,
        fuel:        fuel.data,
        maintenance: maintenance.data,
        vehicles:    vehicles.data,
        drivers:     drivers.data,
        summary:     summary.data,
      });
      setGeneratedAt(new Date().toLocaleString('en-US', {
        year:'numeric', month:'short', day:'numeric',
        hour:'2-digit', minute:'2-digit', second:'2-digit',
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(date); }, [date, loadData]);

  /* ── Print handler ── */
  const handlePrint = () => { window.print(); };

  /* ── Download as HTML (save as PDF via browser) ── */
  const handleDownload = () => {
    const doc = document.getElementById('print-area');
    if (!doc) return;

    const styles = Array.from(document.styleSheets)
      .map(sheet => {
        try {
          return Array.from(sheet.cssRules).map(r => r.cssText).join('\n');
        } catch { return ''; }
      }).join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>SwiftWheels Daily Report – ${date}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', Arial, sans-serif; background:#fff; color:#0f172a; font-size:13px; }
    ${styles}
  </style>
</head>
<body>
  ${doc.outerHTML}
  <script>window.onload=()=>{ window.print(); }<\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `SwiftWheels_DailyReport_${date}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Derived counts for the top stat cards ── */
  const todayTrips = data ? data.trips.filter(t => fmt(t.TripDate) === date) : [];
  const todayFuel  = data ? data.fuel.filter(f  => fmt(f.FuelDate)  === date) : [];
  const todayMaint = data ? data.maintenance.filter(m => fmt(m.ServiceDate) === date) : [];

  const statCards = data ? [
    { icon:'🚗', label:'Total Vehicles',    value: data.vehicles.length,                            color:'#3b82f6', bg:'#eff6ff' },
    { icon:'👤', label:'Total Drivers',     value: data.drivers.length,                             color:'#10b981', bg:'#ecfdf5' },
    { icon:'🗺️',  label:"Today's Trips",     value: todayTrips.length,                               color:'#8b5cf6', bg:'#f5f3ff' },
    { icon:'⛽', label:'Fuel Cost Today',   value: '$' + sum(todayFuel,  'TotalCost').toFixed(2),   color:'#f59e0b', bg:'#fffbeb' },
    { icon:'🔧', label:'Maint. Cost Today', value: '$' + sum(todayMaint, 'Cost').toFixed(2),        color:'#ef4444', bg:'#fef2f2' },
    { icon:'📍', label:'Distance Today',    value: sum(todayTrips, 'Distance').toFixed(1) + ' km', color:'#06b6d4', bg:'#ecfeff' },
  ] : [];

  return (
    <div className="report-page">
      <PageHeader
        icon="📄"
        title="Daily Report"
        subtitle="Generate, preview, download and print today's fleet operations report"
        color="#2563eb"
      />

      {/* ── Controls bar ── */}
      <div className="report-controls">
        <label>📅 Report Date:</label>
        <input
          type="date"
          value={date}
          max={today}
          onChange={e => setDate(e.target.value)}
        />
        <button className="btn btn-ghost btn-sm" onClick={() => setDate(today)}>
          Today
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => {
          const d = new Date(date);
          d.setDate(d.getDate() - 1);
          setDate(d.toISOString().split('T')[0]);
        }}>◀ Previous</button>
        <button className="btn btn-ghost btn-sm" disabled={date === today} onClick={() => {
          const d = new Date(date);
          d.setDate(d.getDate() + 1);
          const next = d.toISOString().split('T')[0];
          if (next <= today) setDate(next);
        }}>Next ▶</button>

        <div className="report-controls-right">
          <button className="btn btn-ghost btn-sm" onClick={() => loadData(date)}>
            🔄 Refresh
          </button>
          <button className="btn btn-primary" onClick={handlePrint} disabled={loading}>
            🖨️ Print Report
          </button>
          <button className="btn btn-success" onClick={handleDownload} disabled={loading || !data}>
            ⬇️ Download
          </button>
        </div>
      </div>

      {/* ── Loading state ── */}
      {loading && (
        <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
          <div style={{ fontSize:32, marginBottom:8 }}>⏳</div>
          <p>Loading report data…</p>
        </div>
      )}

      {/* ── Stat cards ── */}
      {!loading && data && (
        <>
          <div className="report-stat-row">
            {statCards.map((c, i) => (
              <div className="report-stat" key={i} style={{ borderLeftColor: c.color }}>
                <div className="report-stat-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
                <div>
                  <div className="report-stat-val" style={{ color: c.color }}>{c.value}</div>
                  <div className="report-stat-lbl">{c.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Quick preview sections (screen only) ── */}
          {/* Trips today */}
          <div className="report-section">
            <div className="report-section-head">
              <div className="report-section-head-icon" style={{ background:'#f5f3ff', color:'#8b5cf6' }}>🗺️</div>
              <h3>Trips Today</h3>
              <span className="report-section-badge">{todayTrips.length} records</span>
            </div>
            {todayTrips.length === 0
              ? <div className="report-empty">No trips recorded for {date}.</div>
              : (
                <div style={{ overflowX:'auto' }}>
                  <table className="doc-table" style={{ fontSize:13 }}>
                    <thead><tr>
                      <th>#</th><th>Vehicle</th><th>Driver</th>
                      <th>From</th><th>To</th><th>Distance</th>
                    </tr></thead>
                    <tbody>
                      {todayTrips.map((t, i) => (
                        <tr key={t.TripID}>
                          <td>{i+1}</td>
                          <td><strong>{t.PlateNumber}</strong></td>
                          <td>{t.DriverName}</td>
                          <td>{t.StartLocation}</td>
                          <td>{t.Destination}</td>
                          <td>{parseFloat(t.Distance||0).toFixed(1)} km</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>

          {/* Fuel today */}
          <div className="report-section">
            <div className="report-section-head">
              <div className="report-section-head-icon" style={{ background:'#fffbeb', color:'#f59e0b' }}>⛽</div>
              <h3>Fuel Records Today</h3>
              <span className="report-section-badge">{todayFuel.length} records</span>
            </div>
            {todayFuel.length === 0
              ? <div className="report-empty">No fuel records for {date}.</div>
              : (
                <div style={{ overflowX:'auto' }}>
                  <table className="doc-table" style={{ fontSize:13 }}>
                    <thead><tr>
                      <th>#</th><th>Vehicle</th><th>Driver</th>
                      <th>Liters</th><th>Cost/L</th><th>Total</th>
                    </tr></thead>
                    <tbody>
                      {todayFuel.map((f, i) => (
                        <tr key={f.FuelID}>
                          <td>{i+1}</td>
                          <td><strong>{f.PlateNumber}</strong></td>
                          <td>{f.DriverName}</td>
                          <td>{parseFloat(f.Liters||0).toFixed(1)} L</td>
                          <td>{money(f.CostPerLiter)}</td>
                          <td><strong>{money(f.TotalCost)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>

          {/* Maintenance today */}
          <div className="report-section">
            <div className="report-section-head">
              <div className="report-section-head-icon" style={{ background:'#fef2f2', color:'#ef4444' }}>🔧</div>
              <h3>Maintenance Today</h3>
              <span className="report-section-badge">{todayMaint.length} records</span>
            </div>
            {todayMaint.length === 0
              ? <div className="report-empty">No maintenance scheduled for {date}.</div>
              : (
                <div style={{ overflowX:'auto' }}>
                  <table className="doc-table" style={{ fontSize:13 }}>
                    <thead><tr>
                      <th>#</th><th>Vehicle</th><th>Description</th><th>Cost</th>
                    </tr></thead>
                    <tbody>
                      {todayMaint.map((m, i) => (
                        <tr key={m.MaintenanceID}>
                          <td>{i+1}</td>
                          <td><strong>{m.PlateNumber}</strong></td>
                          <td>{m.Description || '—'}</td>
                          <td><strong>{money(m.Cost)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>

          {/* ── The actual printable document (always in DOM) ── */}
          <div ref={printRef}>
            <PrintDocument
              date={date}
              data={data}
              generatedAt={generatedAt}
              user={user}
            />
          </div>
        </>
      )}
    </div>
  );
}
