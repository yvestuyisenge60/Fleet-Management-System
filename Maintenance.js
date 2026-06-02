import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import Modal from '../components/Modal';
import './page.css';

const EMPTY = { VehicleID: '', ServiceDate: '', Cost: '', Description: '' };

export default function Maintenance() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    api.get('/maintenance').then((r) => { setData(r.data); setFiltered(r.data); }).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    api.get('/vehicles').then((r) => setVehicles(r.data)).catch(() => {});
  }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(data.filter((m) =>
      (m.PlateNumber || '').toLowerCase().includes(q) ||
      (m.Model || '').toLowerCase().includes(q) ||
      (m.Description || '').toLowerCase().includes(q)
    ));
  }, [search, data]);

  const openAdd = () => { setForm(EMPTY); setEditId(null); setErr(''); setModal('form'); };
  const openEdit = (row) => {
    setForm({
      VehicleID: row.VehicleID,
      ServiceDate: row.ServiceDate?.split('T')[0],
      Cost: row.Cost, Description: row.Description
    });
    setEditId(row.MaintenanceID); setErr(''); setModal('form');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this maintenance record?')) return;
    try { await api.delete(`/maintenance/${id}`); setMsg('Record deleted.'); load(); }
    catch { setErr('Delete failed.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      if (editId) { await api.put(`/maintenance/${editId}`, form); setMsg('Record updated.'); }
      else { await api.post('/maintenance', form); setMsg('Maintenance scheduled.'); }
      setModal(null); load();
    } catch (ex) { setErr(ex.response?.data?.message || 'Save failed.'); }
  };

  const totalCost = data.reduce((s, r) => s + parseFloat(r.Cost || 0), 0);

  const columns = [
    { key: 'MaintenanceID', label: '#' },
    { key: 'PlateNumber',   label: 'Vehicle' },
    { key: 'Model',         label: 'Model' },
    { key: 'ServiceDate',   label: 'Service Date', render: (r) => r.ServiceDate?.split('T')[0] },
    { key: 'Cost',          label: 'Cost ($)', render: (r) => `$${parseFloat(r.Cost).toFixed(2)}` },
    { key: 'Description',   label: 'Description', render: (r) => r.Description?.slice(0, 50) + (r.Description?.length > 50 ? '…' : '') },
    { key: 'actions', label: 'Actions', render: (r) => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-warning btn-sm" onClick={() => openEdit(r)}>✏️ Edit</button>
        <button className="btn btn-danger btn-sm"  onClick={() => handleDelete(r.MaintenanceID)}>🗑 Delete</button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader icon="🔧" title="Maintenance" subtitle="Schedule and track vehicle servicing"
        action={<button className="btn btn-primary" onClick={openAdd}>+ Schedule Maintenance</button>} />

      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-error">{err}</div>}

      <div className="page-card" style={{ display:'flex', gap:16, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:160, padding:'16px 20px', background:'#fff7ed', borderRadius:10 }}>
          <div style={{ fontSize:22, fontWeight:700, color:'#c2410c' }}>{data.length}</div>
          <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Total Services</div>
        </div>
        <div style={{ flex:1, minWidth:160, padding:'16px 20px', background:'#fef2f2', borderRadius:10 }}>
          <div style={{ fontSize:22, fontWeight:700, color:'#dc2626' }}>${totalCost.toFixed(2)}</div>
          <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>Total Maintenance Cost</div>
        </div>
      </div>

      <div className="page-card">
        <div className="search-bar">
          <input placeholder="🔍 Search by vehicle or description..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Table columns={columns} data={filtered} emptyMsg="No maintenance records found." />
      </div>

      {modal === 'form' && (
        <Modal title={editId ? 'Edit Maintenance' : 'Schedule Maintenance'} onClose={() => setModal(null)}>
          <form className="modal-form" onSubmit={handleSubmit}>
            {err && <div className="alert alert-error">{err}</div>}
            <div className="form-group">
              <label>Vehicle *</label>
              <select required value={form.VehicleID} onChange={(e) => setForm({ ...form, VehicleID: e.target.value })}>
                <option value="">-- Select Vehicle --</option>
                {vehicles.map((v) => <option key={v.VehicleID} value={v.VehicleID}>{v.PlateNumber} – {v.Model}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Service Date *</label>
                <input type="date" required value={form.ServiceDate}
                  onChange={(e) => setForm({ ...form, ServiceDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Cost ($)</label>
                <input type="number" min="0" step="0.01" value={form.Cost}
                  onChange={(e) => setForm({ ...form, Cost: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.Description} onChange={(e) => setForm({ ...form, Description: e.target.value })}
                placeholder="Describe the service or repairs..." />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-danger" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editId ? '💾 Update' : '🔧 Schedule'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
