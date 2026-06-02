import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import Modal from '../components/Modal';
import './page.css';

const EMPTY = { VehicleID: '', DriverID: '', FuelDate: '', Liters: '', CostPerLiter: '' };

export default function Fuel() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    api.get('/fuel').then((r) => { setData(r.data); setFiltered(r.data); }).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    api.get('/vehicles').then((r) => setVehicles(r.data)).catch(() => {});
    api.get('/drivers').then((r) => setDrivers(r.data)).catch(() => {});
  }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(data.filter((f) =>
      (f.PlateNumber || '').toLowerCase().includes(q) ||
      (f.DriverName || '').toLowerCase().includes(q)
    ));
  }, [search, data]);

  const openAdd = () => { setForm(EMPTY); setEditId(null); setErr(''); setModal('form'); };
  const openEdit = (row) => {
    setForm({
      VehicleID: row.VehicleID, DriverID: row.DriverID,
      FuelDate: row.FuelDate?.split('T')[0],
      Liters: row.Liters, CostPerLiter: row.CostPerLiter
    });
    setEditId(row.FuelID); setErr(''); setModal('form');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try { await api.delete(`/fuel/${id}`); setMsg('Record deleted.'); load(); }
    catch { setErr('Delete failed.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      if (editId) { await api.put(`/fuel/${editId}`, form); setMsg('Record updated.'); }
      else { await api.post('/fuel', form); setMsg('Fuel record added.'); }
      setModal(null); load();
    } catch (ex) { setErr(ex.response?.data?.message || 'Save failed.'); }
  };

  const total = data.reduce((s, r) => s + parseFloat(r.TotalCost || 0), 0);

  const columns = [
    { key: 'FuelID',      label: '#' },
    { key: 'PlateNumber', label: 'Vehicle' },
    { key: 'DriverName',  label: 'Driver' },
    { key: 'FuelDate',    label: 'Date', render: (r) => r.FuelDate?.split('T')[0] },
    { key: 'Liters',      label: 'Liters' },
    { key: 'CostPerLiter',label: 'Cost/L ($)' },
    { key: 'TotalCost',   label: 'Total ($)', render: (r) => `$${parseFloat(r.TotalCost).toFixed(2)}` },
    { key: 'actions', label: 'Actions', render: (r) => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-warning btn-sm" onClick={() => openEdit(r)}>✏️ Edit</button>
        <button className="btn btn-danger btn-sm"  onClick={() => handleDelete(r.FuelID)}>🗑 Delete</button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader icon="⛽" title="Fuel Management" subtitle="Track fuel purchases and consumption"
        action={<button className="btn btn-primary" onClick={openAdd}>+ Add Fuel Record</button>} />

      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-error">{err}</div>}

      <div className="page-card" style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:160, padding:'16px 20px', background:'#eff6ff', borderRadius:10 }}>
          <div style={{ fontSize:22, fontWeight:700, color:'#1d4ed8' }}>{data.length}</div>
          <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Total Records</div>
        </div>
        <div style={{ flex:1, minWidth:160, padding:'16px 20px', background:'#fefce8', borderRadius:10 }}>
          <div style={{ fontSize:22, fontWeight:700, color:'#b45309' }}>${total.toFixed(2)}</div>
          <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Total Fuel Cost</div>
        </div>
      </div>

      <div className="page-card">
        <div className="search-bar">
          <input placeholder="🔍 Search by vehicle or driver..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Table columns={columns} data={filtered} emptyMsg="No fuel records found." />
      </div>

      {modal === 'form' && (
        <Modal title={editId ? 'Edit Fuel Record' : 'Add Fuel Record'} onClose={() => setModal(null)}>
          <form className="modal-form" onSubmit={handleSubmit}>
            {err && <div className="alert alert-error">{err}</div>}
            <div className="form-row">
              <div className="form-group">
                <label>Vehicle *</label>
                <select required value={form.VehicleID} onChange={(e) => setForm({ ...form, VehicleID: e.target.value })}>
                  <option value="">-- Select Vehicle --</option>
                  {vehicles.map((v) => <option key={v.VehicleID} value={v.VehicleID}>{v.PlateNumber} – {v.Model}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Driver *</label>
                <select required value={form.DriverID} onChange={(e) => setForm({ ...form, DriverID: e.target.value })}>
                  <option value="">-- Select Driver --</option>
                  {drivers.map((d) => <option key={d.DriverID} value={d.DriverID}>{d.FullName}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Fuel Date *</label>
              <input type="date" required value={form.FuelDate} onChange={(e) => setForm({ ...form, FuelDate: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Liters *</label>
                <input type="number" min="0" step="0.01" required value={form.Liters}
                  onChange={(e) => setForm({ ...form, Liters: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Cost Per Liter ($) *</label>
                <input type="number" min="0" step="0.01" required value={form.CostPerLiter}
                  onChange={(e) => setForm({ ...form, CostPerLiter: e.target.value })} />
              </div>
            </div>
            {form.Liters && form.CostPerLiter && (
              <div className="alert alert-success" style={{ marginBottom:0 }}>
                Estimated Total: <strong>${(parseFloat(form.Liters) * parseFloat(form.CostPerLiter)).toFixed(2)}</strong>
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="btn btn-danger" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editId ? '💾 Update' : '➕ Add'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
