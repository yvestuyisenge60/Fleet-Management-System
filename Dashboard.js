import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts';
import api from '../api';
import Modal from '../components/Modal';
import Table from '../components/Table';
import './Dashboard.css';
import './page.css';

/* ─── helpers ─────────────────────────────────────────── */
const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

function statusBadge(s) {
  const map = {
    'Available':         'badge-available',
    'On Trip':           'badge-on-trip',
    'Under Maintenance': 'badge-maintenance',
  };
  return <span className={`badge ${map[s] || 'badge-out'}`}>{s}</span>;
}

function roleBadge(r) {
  const map = {
    'Administrator':       'badge-admin',
    'Fleet Manager':       'badge-manager',
    'Driver':              'badge-driver',
    'Maintenance Officer': 'badge-officer',
    'Management':          'badge-info',
  };
  return <span className={`badge ${map[r] || 'badge-out'}`}>{r}</span>;
}

function fmtDate(d) { return d ? String(d).split('T')[0] : '—'; }
function fmtMoney(v) { return '$' + parseFloat(v || 0).toFixed(2); }
function useConfirm() { return (msg) => window.confirm(msg); }

/* ─── CrudSection wrapper ──────────────────────────────── */
function CrudSection({ icon, title, color, count, toolbar, children }) {
  return (
    <div className="crud-card">
      <div className="crud-card-header">
        <div className="crud-card-icon" style={{ background: color + '18', color }}>{icon}</div>
        <span className="crud-card-title">{title}</span>
        <span className="crud-card-count">{count} records</span>
        {toolbar}
      </div>
      <div className="crud-card-body">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   VEHICLES CRUD
═══════════════════════════════════════════════════════ */
const V_STATUSES = ['Available', 'On Trip', 'Under Maintenance', 'Out of Service'];
const V_EMPTY = { PlateNumber: '', Model: '', Year: '', Status: 'Available', Mileage: 0 };

function VehiclesTable({ onRefreshStats }) {
  const [data,   setData]   = useState([]);
  const [search, setSearch] = useState('');
  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState(V_EMPTY);
  const [editId, setEditId] = useState(null);
  const [err,    setErr]    = useState('');
  const confirm = useConfirm();

  const load = useCallback(() => {
    api.get('/vehicles').then(r => setData(r.data)).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = data.filter(v =>
    v.PlateNumber.toLowerCase().includes(search.toLowerCase()) ||
    v.Model.toLowerCase().includes(search.toLowerCase()) ||
    v.Status.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => { setForm(V_EMPTY); setEditId(null); setErr(''); setModal(true); };
  const openEdit = (r) => { setForm({ ...r }); setEditId(r.VehicleID); setErr(''); setModal(true); };

  const handleDelete = async (id) => {
    if (!confirm('Delete this vehicle?')) return;
    try { await api.delete(`/vehicles/${id}`); load(); onRefreshStats(); }
    catch (ex) { alert(ex.response?.data?.message || 'Delete failed.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      if (editId) await api.put(`/vehicles/${editId}`, form);
      else        await api.post('/vehicles', form);
      setModal(false); load(); onRefreshStats();
    } catch (ex) { setErr(ex.response?.data?.message || 'Save failed.'); }
  };

  const cols = [
    { key: 'VehicleID',   label: '#' },
    { key: 'PlateNumber', label: 'Plate Number' },
    { key: 'Model',       label: 'Model' },
    { key: 'Year',        label: 'Year' },
    { key: 'Mileage',     label: 'Mileage (km)', render: r => r.Mileage?.toLocaleString() },
    { key: 'Status',      label: 'Status',       render: r => statusBadge(r.Status) },
    { key: 'act', label: 'Actions', render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-warning btn-sm" onClick={() => openEdit(r)}>✏️ Edit</button>
        <button className="btn btn-danger btn-sm"  onClick={() => handleDelete(r.VehicleID)}>🗑 Del</button>
      </div>
    )},
  ];

  return (
    <>
      <CrudSection icon="🚗" title="Vehicles" color="#3b82f6" count={data.length}
        toolbar={
          <div style={{ display:'flex', gap:8, flex:1, justifyContent:'flex-end', flexWrap:'wrap' }}>
            <div className="crud-search-wrap" style={{ maxWidth:220 }}>
              <input className="crud-search" placeholder="Search plate, model…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Vehicle</button>
          </div>
        }
      >
        <Table columns={cols} data={filtered} emptyMsg="No vehicles found." emptyIcon="🚗" />
      </CrudSection>

      {modal && (
        <Modal title={editId ? 'Edit Vehicle' : 'Add New Vehicle'} icon="🚗" onClose={() => setModal(false)}>
          <form className="modal-form" onSubmit={handleSubmit}>
            {err && <div className="alert alert-error">⚠️ {err}</div>}
            <div className="form-row">
              <div className="form-group">
                <label>Plate Number <span className="lbl-required">*</span></label>
                <input required placeholder="e.g. RAB 001A" value={form.PlateNumber}
                  onChange={e => setForm({ ...form, PlateNumber: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Model <span className="lbl-required">*</span></label>
                <input required placeholder="e.g. Toyota Hiace" value={form.Model}
                  onChange={e => setForm({ ...form, Model: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Year <span className="lbl-required">*</span></label>
                <input type="number" required min="2000" max="2035" placeholder="2024"
                  value={form.Year} onChange={e => setForm({ ...form, Year: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Mileage (km)</label>
                <input type="number" min="0" placeholder="0" value={form.Mileage}
                  onChange={e => setForm({ ...form, Mileage: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.Status} onChange={e => setForm({ ...form, Status: e.target.value })}>
                {V_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">
                {editId ? '💾 Update Vehicle' : '➕ Add Vehicle'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   DRIVERS CRUD
═══════════════════════════════════════════════════════ */
const D_EMPTY = { FullName: '', LicenseNumber: '', Phone: '', Address: '' };

function DriversTable({ onRefreshStats }) {
  const [data,   setData]   = useState([]);
  const [search, setSearch] = useState('');
  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState(D_EMPTY);
  const [editId, setEditId] = useState(null);
  const [err,    setErr]    = useState('');
  const confirm = useConfirm();

  const load = useCallback(() => {
    api.get('/drivers').then(r => setData(r.data)).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = data.filter(d =>
    d.FullName.toLowerCase().includes(search.toLowerCase()) ||
    d.LicenseNumber.toLowerCase().includes(search.toLowerCase()) ||
    (d.Phone || '').includes(search)
  );

  const openAdd  = () => { setForm(D_EMPTY); setEditId(null); setErr(''); setModal(true); };
  const openEdit = (r) => { setForm({ ...r }); setEditId(r.DriverID); setErr(''); setModal(true); };

  const handleDelete = async (id) => {
    if (!confirm('Delete this driver?')) return;
    try { await api.delete(`/drivers/${id}`); load(); onRefreshStats(); }
    catch (ex) { alert(ex.response?.data?.message || 'Delete failed.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      if (editId) await api.put(`/drivers/${editId}`, form);
      else        await api.post('/drivers', form);
      setModal(false); load(); onRefreshStats();
    } catch (ex) { setErr(ex.response?.data?.message || 'Save failed.'); }
  };

  const cols = [
    { key: 'DriverID',      label: '#' },
    { key: 'FullName',      label: 'Full Name' },
    { key: 'LicenseNumber', label: 'License #' },
    { key: 'Phone',         label: 'Phone' },
    { key: 'Address',       label: 'Address' },
    { key: 'act', label: 'Actions', render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-warning btn-sm" onClick={() => openEdit(r)}>✏️ Edit</button>
        <button className="btn btn-danger btn-sm"  onClick={() => handleDelete(r.DriverID)}>🗑 Del</button>
      </div>
    )},
  ];

  return (
    <>
      <CrudSection icon="👤" title="Drivers" color="#10b981" count={data.length}
        toolbar={
          <div style={{ display:'flex', gap:8, flex:1, justifyContent:'flex-end', flexWrap:'wrap' }}>
            <div className="crud-search-wrap" style={{ maxWidth:220 }}>
              <input className="crud-search" placeholder="Search name, license…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-success btn-sm" onClick={openAdd}>+ Add Driver</button>
          </div>
        }
      >
        <Table columns={cols} data={filtered} emptyMsg="No drivers found." emptyIcon="👤" />
      </CrudSection>

      {modal && (
        <Modal title={editId ? 'Edit Driver' : 'Add New Driver'} icon="👤" onClose={() => setModal(false)}>
          <form className="modal-form" onSubmit={handleSubmit}>
            {err && <div className="alert alert-error">⚠️ {err}</div>}
            <div className="form-group">
              <label>Full Name <span className="lbl-required">*</span></label>
              <input required placeholder="e.g. Jean Pierre Habimana" value={form.FullName}
                onChange={e => setForm({ ...form, FullName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>License Number <span className="lbl-required">*</span></label>
              <input required placeholder="e.g. LIC-001-2024" value={form.LicenseNumber}
                onChange={e => setForm({ ...form, LicenseNumber: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input placeholder="e.g. 0788123456" value={form.Phone}
                  onChange={e => setForm({ ...form, Phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input placeholder="e.g. Kigali, Rwanda" value={form.Address}
                  onChange={e => setForm({ ...form, Address: e.target.value })} />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-success">
                {editId ? '💾 Update Driver' : '➕ Add Driver'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   TRIPS CRUD
═══════════════════════════════════════════════════════ */
const T_EMPTY = { VehicleID: '', DriverID: '', StartLocation: '', Destination: '', TripDate: '', Distance: '' };

function TripsTable({ onRefreshStats }) {
  const [data,     setData]     = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers,  setDrivers]  = useState([]);
  const [search,   setSearch]   = useState('');
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState(T_EMPTY);
  const [editId,   setEditId]   = useState(null);
  const [err,      setErr]      = useState('');
  const confirm = useConfirm();

  const load = useCallback(() => {
    api.get('/trips').then(r => setData(r.data)).catch(() => {});
  }, []);
  useEffect(() => {
    load();
    api.get('/vehicles').then(r => setVehicles(r.data)).catch(() => {});
    api.get('/drivers').then(r => setDrivers(r.data)).catch(() => {});
  }, [load]);

  const filtered = data.filter(t =>
    (t.PlateNumber  || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.DriverName   || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.StartLocation|| '').toLowerCase().includes(search.toLowerCase()) ||
    (t.Destination  || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => { setForm(T_EMPTY); setEditId(null); setErr(''); setModal(true); };
  const openEdit = (r) => {
    setForm({
      VehicleID: r.VehicleID, DriverID: r.DriverID,
      StartLocation: r.StartLocation, Destination: r.Destination,
      TripDate: fmtDate(r.TripDate), Distance: r.Distance,
    });
    setEditId(r.TripID); setErr(''); setModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this trip?')) return;
    try { await api.delete(`/trips/${id}`); load(); onRefreshStats(); }
    catch (ex) { alert(ex.response?.data?.message || 'Delete failed.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      if (editId) await api.put(`/trips/${editId}`, form);
      else        await api.post('/trips', form);
      setModal(false); load(); onRefreshStats();
    } catch (ex) { setErr(ex.response?.data?.message || 'Save failed.'); }
  };

  const cols = [
    { key: 'TripID',        label: '#' },
    { key: 'PlateNumber',   label: 'Vehicle' },
    { key: 'DriverName',    label: 'Driver' },
    { key: 'StartLocation', label: 'From' },
    { key: 'Destination',   label: 'To' },
    { key: 'TripDate',      label: 'Date',      render: r => fmtDate(r.TripDate) },
    { key: 'Distance',      label: 'Dist. (km)' },
    { key: 'act', label: 'Actions', render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-warning btn-sm" onClick={() => openEdit(r)}>✏️ Edit</button>
        <button className="btn btn-danger btn-sm"  onClick={() => handleDelete(r.TripID)}>🗑 Del</button>
      </div>
    )},
  ];

  return (
    <>
      <CrudSection icon="🗺️" title="Trips" color="#8b5cf6" count={data.length}
        toolbar={
          <div style={{ display:'flex', gap:8, flex:1, justifyContent:'flex-end', flexWrap:'wrap' }}>
            <div className="crud-search-wrap" style={{ maxWidth:220 }}>
              <input className="crud-search" placeholder="Search vehicle, driver…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-sm" style={{ background:'#8b5cf6', color:'#fff' }} onClick={openAdd}>
              + Add Trip
            </button>
          </div>
        }
      >
        <Table columns={cols} data={filtered} emptyMsg="No trips recorded." emptyIcon="🗺️" />
      </CrudSection>

      {modal && (
        <Modal title={editId ? 'Edit Trip' : 'Add New Trip'} icon="🗺️" onClose={() => setModal(false)}>
          <form className="modal-form" onSubmit={handleSubmit}>
            {err && <div className="alert alert-error">⚠️ {err}</div>}
            <div className="form-row">
              <div className="form-group">
                <label>Vehicle <span className="lbl-required">*</span></label>
                <select required value={form.VehicleID}
                  onChange={e => setForm({ ...form, VehicleID: e.target.value })}>
                  <option value="">— Select Vehicle —</option>
                  {vehicles.map(v => (
                    <option key={v.VehicleID} value={v.VehicleID}>
                      {v.PlateNumber} – {v.Model}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Driver <span className="lbl-required">*</span></label>
                <select required value={form.DriverID}
                  onChange={e => setForm({ ...form, DriverID: e.target.value })}>
                  <option value="">— Select Driver —</option>
                  {drivers.map(d => (
                    <option key={d.DriverID} value={d.DriverID}>{d.FullName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Location <span className="lbl-required">*</span></label>
                <input required placeholder="e.g. Kigali" value={form.StartLocation}
                  onChange={e => setForm({ ...form, StartLocation: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Destination <span className="lbl-required">*</span></label>
                <input required placeholder="e.g. Butare" value={form.Destination}
                  onChange={e => setForm({ ...form, Destination: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Trip Date <span className="lbl-required">*</span></label>
                <input type="date" required value={form.TripDate}
                  onChange={e => setForm({ ...form, TripDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Distance (km)</label>
                <input type="number" min="0" step="0.1" placeholder="0" value={form.Distance}
                  onChange={e => setForm({ ...form, Distance: e.target.value })} />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-sm"
                style={{ background:'#8b5cf6', color:'#fff', padding:'10px 20px', borderRadius:10, fontWeight:600, border:'none', cursor:'pointer' }}>
                {editId ? '💾 Update Trip' : '➕ Add Trip'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   FUEL CRUD
═══════════════════════════════════════════════════════ */
const F_EMPTY = { VehicleID: '', DriverID: '', FuelDate: '', Liters: '', CostPerLiter: '' };

function FuelTable({ onRefreshStats }) {
  const [data,     setData]     = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers,  setDrivers]  = useState([]);
  const [search,   setSearch]   = useState('');
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState(F_EMPTY);
  const [editId,   setEditId]   = useState(null);
  const [err,      setErr]      = useState('');
  const confirm = useConfirm();

  const load = useCallback(() => {
    api.get('/fuel').then(r => setData(r.data)).catch(() => {});
  }, []);
  useEffect(() => {
    load();
    api.get('/vehicles').then(r => setVehicles(r.data)).catch(() => {});
    api.get('/drivers').then(r => setDrivers(r.data)).catch(() => {});
  }, [load]);

  const filtered = data.filter(f =>
    (f.PlateNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.DriverName  || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => { setForm(F_EMPTY); setEditId(null); setErr(''); setModal(true); };
  const openEdit = (r) => {
    setForm({
      VehicleID: r.VehicleID, DriverID: r.DriverID,
      FuelDate: fmtDate(r.FuelDate), Liters: r.Liters, CostPerLiter: r.CostPerLiter,
    });
    setEditId(r.FuelID); setErr(''); setModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this fuel record?')) return;
    try { await api.delete(`/fuel/${id}`); load(); onRefreshStats(); }
    catch (ex) { alert(ex.response?.data?.message || 'Delete failed.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      if (editId) await api.put(`/fuel/${editId}`, form);
      else        await api.post('/fuel', form);
      setModal(false); load(); onRefreshStats();
    } catch (ex) { setErr(ex.response?.data?.message || 'Save failed.'); }
  };

  const estimated = form.Liters && form.CostPerLiter
    ? (parseFloat(form.Liters) * parseFloat(form.CostPerLiter)).toFixed(2) : null;

  const cols = [
    { key: 'FuelID',       label: '#' },
    { key: 'PlateNumber',  label: 'Vehicle' },
    { key: 'DriverName',   label: 'Driver' },
    { key: 'FuelDate',     label: 'Date',      render: r => fmtDate(r.FuelDate) },
    { key: 'Liters',       label: 'Liters' },
    { key: 'CostPerLiter', label: 'Cost/L ($)' },
    { key: 'TotalCost',    label: 'Total ($)',  render: r => fmtMoney(r.TotalCost) },
    { key: 'act', label: 'Actions', render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-warning btn-sm" onClick={() => openEdit(r)}>✏️ Edit</button>
        <button className="btn btn-danger btn-sm"  onClick={() => handleDelete(r.FuelID)}>🗑 Del</button>
      </div>
    )},
  ];

  return (
    <>
      <CrudSection icon="⛽" title="Fuel Management" color="#f59e0b" count={data.length}
        toolbar={
          <div style={{ display:'flex', gap:8, flex:1, justifyContent:'flex-end', flexWrap:'wrap' }}>
            <div className="crud-search-wrap" style={{ maxWidth:220 }}>
              <input className="crud-search" placeholder="Search vehicle, driver…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-warning btn-sm" onClick={openAdd}>+ Add Fuel</button>
          </div>
        }
      >
        <Table columns={cols} data={filtered} emptyMsg="No fuel records found." emptyIcon="⛽" />
      </CrudSection>

      {modal && (
        <Modal title={editId ? 'Edit Fuel Record' : 'Add Fuel Record'} icon="⛽" onClose={() => setModal(false)}>
          <form className="modal-form" onSubmit={handleSubmit}>
            {err && <div className="alert alert-error">⚠️ {err}</div>}
            <div className="form-row">
              <div className="form-group">
                <label>Vehicle <span className="lbl-required">*</span></label>
                <select required value={form.VehicleID}
                  onChange={e => setForm({ ...form, VehicleID: e.target.value })}>
                  <option value="">— Select Vehicle —</option>
                  {vehicles.map(v => (
                    <option key={v.VehicleID} value={v.VehicleID}>
                      {v.PlateNumber} – {v.Model}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Driver <span className="lbl-required">*</span></label>
                <select required value={form.DriverID}
                  onChange={e => setForm({ ...form, DriverID: e.target.value })}>
                  <option value="">— Select Driver —</option>
                  {drivers.map(d => (
                    <option key={d.DriverID} value={d.DriverID}>{d.FullName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Fuel Date <span className="lbl-required">*</span></label>
              <input type="date" required value={form.FuelDate}
                onChange={e => setForm({ ...form, FuelDate: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Liters <span className="lbl-required">*</span></label>
                <input type="number" min="0" step="0.01" required placeholder="0.00"
                  value={form.Liters} onChange={e => setForm({ ...form, Liters: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Cost Per Liter ($) <span className="lbl-required">*</span></label>
                <input type="number" min="0" step="0.01" required placeholder="0.00"
                  value={form.CostPerLiter} onChange={e => setForm({ ...form, CostPerLiter: e.target.value })} />
              </div>
            </div>
            {estimated && (
              <div className="calc-preview">
                💰 Estimated Total Cost: <strong>${estimated}</strong>
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-warning">
                {editId ? '💾 Update Record' : '➕ Add Fuel Record'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   MAINTENANCE CRUD
═══════════════════════════════════════════════════════ */
const M_EMPTY = { VehicleID: '', ServiceDate: '', Cost: '', Description: '' };

function MaintenanceTable({ onRefreshStats }) {
  const [data,     setData]     = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [search,   setSearch]   = useState('');
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState(M_EMPTY);
  const [editId,   setEditId]   = useState(null);
  const [err,      setErr]      = useState('');
  const confirm = useConfirm();

  const load = useCallback(() => {
    api.get('/maintenance').then(r => setData(r.data)).catch(() => {});
  }, []);
  useEffect(() => {
    load();
    api.get('/vehicles').then(r => setVehicles(r.data)).catch(() => {});
  }, [load]);

  const filtered = data.filter(m =>
    (m.PlateNumber  || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.Model        || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.Description  || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => { setForm(M_EMPTY); setEditId(null); setErr(''); setModal(true); };
  const openEdit = (r) => {
    setForm({
      VehicleID: r.VehicleID, ServiceDate: fmtDate(r.ServiceDate),
      Cost: r.Cost, Description: r.Description,
    });
    setEditId(r.MaintenanceID); setErr(''); setModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this maintenance record?')) return;
    try { await api.delete(`/maintenance/${id}`); load(); onRefreshStats(); }
    catch (ex) { alert(ex.response?.data?.message || 'Delete failed.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      if (editId) await api.put(`/maintenance/${editId}`, form);
      else        await api.post('/maintenance', form);
      setModal(false); load(); onRefreshStats();
    } catch (ex) { setErr(ex.response?.data?.message || 'Save failed.'); }
  };

  const cols = [
    { key: 'MaintenanceID', label: '#' },
    { key: 'PlateNumber',   label: 'Vehicle' },
    { key: 'Model',         label: 'Model' },
    { key: 'ServiceDate',   label: 'Service Date', render: r => fmtDate(r.ServiceDate) },
    { key: 'Cost',          label: 'Cost ($)',      render: r => fmtMoney(r.Cost) },
    { key: 'Description',   label: 'Description',
      render: r => (r.Description || '').length > 45
        ? (r.Description || '').slice(0, 45) + '…'
        : (r.Description || '') },
    { key: 'act', label: 'Actions', render: r => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-warning btn-sm" onClick={() => openEdit(r)}>✏️ Edit</button>
        <button className="btn btn-danger btn-sm"  onClick={() => handleDelete(r.MaintenanceID)}>🗑 Del</button>
      </div>
    )},
  ];

  return (
    <>
      <CrudSection icon="🔧" title="Maintenance" color="#ef4444" count={data.length}
        toolbar={
          <div style={{ display:'flex', gap:8, flex:1, justifyContent:'flex-end', flexWrap:'wrap' }}>
            <div className="crud-search-wrap" style={{ maxWidth:220 }}>
              <input className="crud-search" placeholder="Search vehicle, description…"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-danger btn-sm" onClick={openAdd}>+ Schedule</button>
          </div>
        }
      >
        <Table columns={cols} data={filtered} emptyMsg="No maintenance records." emptyIcon="🔧" />
      </CrudSection>

      {modal && (
        <Modal title={editId ? 'Edit Maintenance' : 'Schedule Maintenance'} icon="🔧" onClose={() => setModal(false)}>
          <form className="modal-form" onSubmit={handleSubmit}>
            {err && <div className="alert alert-error">⚠️ {err}</div>}
            <div className="form-group">
              <label>Vehicle <span className="lbl-required">*</span></label>
              <select required value={form.VehicleID}
                onChange={e => setForm({ ...form, VehicleID: e.target.value })}>
                <option value="">— Select Vehicle —</option>
                {vehicles.map(v => (
                  <option key={v.VehicleID} value={v.VehicleID}>
                    {v.PlateNumber} – {v.Model}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Service Date <span className="lbl-required">*</span></label>
                <input type="date" required value={form.ServiceDate}
                  onChange={e => setForm({ ...form, ServiceDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Cost ($)</label>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={form.Cost}
                  onChange={e => setForm({ ...form, Cost: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea placeholder="Describe the service or repairs performed…"
                value={form.Description}
                onChange={e => setForm({ ...form, Description: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-danger">
                {editId ? '💾 Update Record' : '🔧 Schedule Service'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
═══════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [stats,       setStats]       = useState(null);
  const [vehicleUtil, setVehicleUtil] = useState([]);
  const [driverPerf,  setDriverPerf]  = useState([]);
  const [fuelRpt,     setFuelRpt]     = useState([]);
  const user = JSON.parse(localStorage.getItem('sw_user') || '{}');

  const loadStats = useCallback(() => {
    api.get('/reports/summary').then(r => setStats(r.data)).catch(() => {});
    api.get('/reports/vehicle-utilization').then(r => setVehicleUtil(r.data.slice(0, 6))).catch(() => {});
    api.get('/reports/driver-performance').then(r => setDriverPerf(r.data.slice(0, 5))).catch(() => {});
    api.get('/reports/fuel-consumption').then(r => setFuelRpt(r.data.slice(0, 6))).catch(() => {});
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  if (!stats) return (
    <div className="loading-dash">
      <div className="loading-spinner"></div>
      <p>Loading dashboard…</p>
    </div>
  );

  const statusPie = [
    { name: 'Available',   value: stats.availableVehicles   },
    { name: 'On Trip',     value: stats.onTripVehicles      },
    { name: 'Maintenance', value: stats.maintenanceVehicles },
  ];

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (user.fullName || 'Admin').split(' ')[0];

  const statCards = [
    { icon:'🚗', label:'Total Vehicles',     value: stats.totalVehicles,                                   color:'#3b82f6', bg:'#eff6ff' },
    { icon:'👤', label:'Total Drivers',      value: stats.totalDrivers,                                    color:'#10b981', bg:'#ecfdf5' },
    { icon:'🗺️',  label:'Total Trips',        value: stats.totalTrips,                                      color:'#8b5cf6', bg:'#f5f3ff' },
    { icon:'✅', label:'Available Vehicles', value: stats.availableVehicles,                               color:'#10b981', bg:'#ecfdf5' },
    { icon:'🔴', label:'On Trip Now',        value: stats.onTripVehicles,                                  color:'#3b82f6', bg:'#eff6ff' },
    { icon:'🔧', label:'In Maintenance',     value: stats.maintenanceVehicles,                             color:'#f59e0b', bg:'#fffbeb' },
    { icon:'⛽', label:'Total Fuel Cost',    value: '$' + stats.totalFuelCost.toFixed(2),                 color:'#f59e0b', bg:'#fffbeb' },
    { icon:'💰', label:'Maintenance Cost',   value: '$' + stats.totalMaintenanceCost.toFixed(2),          color:'#ef4444', bg:'#fef2f2' },
    { icon:'📍', label:'Total Distance',     value: stats.totalDistance.toFixed(0) + ' km',               color:'#06b6d4', bg:'#ecfeff' },
    { icon:'📊', label:'Avg Trip Dist.',     value: stats.totalTrips > 0 ? (stats.totalDistance / stats.totalTrips).toFixed(1) + ' km' : '0 km', color:'#8b5cf6', bg:'#f5f3ff' },
    { icon:'🏎️', label:'Fleet Utilization',  value: stats.totalVehicles > 0 ? Math.round(((stats.onTripVehicles + stats.maintenanceVehicles) / stats.totalVehicles) * 100) + '%' : '0%', color:'#3b82f6', bg:'#eff6ff' },
    { icon:'🛣️',  label:'Fleet Mileage',      value: vehicleUtil.reduce((s, v) => s + (v.Mileage || 0), 0).toLocaleString() + ' km', color:'#10b981', bg:'#ecfdf5' },
  ];

  return (
    <div className="dashboard">

      {/* ── Welcome banner ── */}
      <div className="dash-welcome">
        <div className="dash-welcome-left">
          <h1>👋 {greeting}, {firstName}!</h1>
          <p>Fleet overview for {now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
        <div className="dash-welcome-right">
          <span className="dash-time">
            🕐 {now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={loadStats}>🔄 Refresh</button>
        </div>
      </div>

      {/* ── 12 Stat Cards ── */}
      <div className="stat-grid">
        {statCards.map((c, i) => (
          <div className="stat-card" key={i} style={{ borderLeftColor: c.color }}>
            <div className="stat-icon-box" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
            <div className="stat-info">
              <div className="stat-value">{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts row 1 ── */}
      <div className="dash-charts">
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>🚦 Vehicle Status</h3>
            <span className="chart-badge">Live</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusPie} dataKey="value" nameKey="name"
                cx="50%" cy="50%" innerRadius={55} outerRadius={82}
                paddingAngle={3} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}>
                {statusPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={9} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <h3>🚗 Vehicle Utilization</h3>
            <span className="chart-badge">Top 6</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={vehicleUtil} margin={{ left: -15, right: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
              <XAxis dataKey="PlateNumber" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="TripCount"     name="Trips"      fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="TotalDistance" name="Dist. (km)" fill="#06b6d4" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <h3>⛽ Fuel by Vehicle</h3>
            <span className="chart-badge">Top 6</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fuelRpt} margin={{ left: -15, right: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
              <XAxis dataKey="PlateNumber" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="TotalLiters" name="Liters"    fill="#f59e0b" radius={[4,4,0,0]} />
              <Bar dataKey="TotalCost"   name="Cost ($)"  fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Charts row 2 ── */}
      <div className="chart-card" style={{ marginBottom: 30 }}>
        <div className="chart-card-header">
          <h3>👤 Driver Performance — Trips &amp; Distance</h3>
          <span className="chart-badge">Top 5</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={driverPerf} margin={{ left: -15, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
            <XAxis dataKey="FullName" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="TotalDistance" name="Distance (km)" fill="#10b981" radius={[4,4,0,0]} />
            <Bar dataKey="TripCount"     name="Trips"         fill="#8b5cf6" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ════ CRUD TABLES ════ */}

      <div className="dash-section">
        <div className="dash-section-icon" style={{ background:'#eff6ff', color:'#3b82f6' }}>🚗</div>
        <h2>Vehicles</h2>
        <div className="dash-section-line"></div>
      </div>
      <VehiclesTable onRefreshStats={loadStats} />

      <div className="dash-section">
        <div className="dash-section-icon" style={{ background:'#ecfdf5', color:'#10b981' }}>👤</div>
        <h2>Drivers</h2>
        <div className="dash-section-line"></div>
      </div>
      <DriversTable onRefreshStats={loadStats} />

      <div className="dash-section">
        <div className="dash-section-icon" style={{ background:'#f5f3ff', color:'#8b5cf6' }}>🗺️</div>
        <h2>Trips</h2>
        <div className="dash-section-line"></div>
      </div>
      <TripsTable onRefreshStats={loadStats} />

      <div className="dash-section">
        <div className="dash-section-icon" style={{ background:'#fffbeb', color:'#f59e0b' }}>⛽</div>
        <h2>Fuel Management</h2>
        <div className="dash-section-line"></div>
      </div>
      <FuelTable onRefreshStats={loadStats} />

      <div className="dash-section">
        <div className="dash-section-icon" style={{ background:'#fef2f2', color:'#ef4444' }}>🔧</div>
        <h2>Maintenance</h2>
        <div className="dash-section-line"></div>
      </div>
      <MaintenanceTable onRefreshStats={loadStats} />

    </div>
  );
}
