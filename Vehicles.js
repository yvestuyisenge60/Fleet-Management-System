import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import Modal from '../components/Modal';
import './page.css';

const EMPTY = { PlateNumber: '', Model: '', Year: '', Status: 'Available', Mileage: 0 };
const STATUSES = ['Available', 'On Trip', 'Under Maintenance', 'Out of Service'];

function statusBadge(s) {
  const map = { 'Available': 'badge-available', 'On Trip': 'badge-on-trip', 'Under Maintenance': 'badge-maintenance' };
  return <span className={`badge ${map[s] || 'badge-other'}`}>{s}</span>;
}

export default function Vehicles() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    api.get('/vehicles').then((r) => { setData(r.data); setFiltered(r.data); }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(data.filter((v) =>
      v.PlateNumber.toLowerCase().includes(q) ||
      v.Model.toLowerCase().includes(q) ||
      v.Status.toLowerCase().includes(q)
    ));
  }, [search, data]);

  const openAdd = () => { setForm(EMPTY); setEditId(null); setErr(''); setModal('form'); };
  const openEdit = (row) => { setForm({ ...row }); setEditId(row.VehicleID); setErr(''); setModal('form'); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      setMsg('Vehicle deleted.'); load();
    } catch { setErr('Delete failed.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      if (editId) {
        await api.put(`/vehicles/${editId}`, form);
        setMsg('Vehicle updated.');
      } else {
        await api.post('/vehicles', form);
        setMsg('Vehicle added.');
      }
      setModal(null); load();
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Save failed.');
    }
  };

  const columns = [
    { key: 'VehicleID', label: '#' },
    { key: 'PlateNumber', label: 'Plate Number' },
    { key: 'Model', label: 'Model' },
    { key: 'Year', label: 'Year' },
    { key: 'Mileage', label: 'Mileage (km)', render: (r) => r.Mileage.toLocaleString() },
    { key: 'Status', label: 'Status', render: (r) => statusBadge(r.Status) },
    { key: 'actions', label: 'Actions', render: (r) => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-warning btn-sm" onClick={() => openEdit(r)}>✏️ Edit</button>
        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.VehicleID)}>🗑 Delete</button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader icon="🚗" title="Vehicles" subtitle="Manage your fleet vehicles"
        action={<button className="btn btn-primary" onClick={openAdd}>+ Add Vehicle</button>} />

      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-error">{err}</div>}

      <div className="page-card">
        <div className="search-bar">
          <input placeholder="🔍 Search by plate, model or status..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Table columns={columns} data={filtered} emptyMsg="No vehicles found." />
      </div>

      {modal === 'form' && (
        <Modal title={editId ? 'Edit Vehicle' : 'Add Vehicle'} onClose={() => setModal(null)}>
          <form className="modal-form" onSubmit={handleSubmit}>
            {err && <div className="alert alert-error">{err}</div>}
            <div className="form-row">
              <div className="form-group">
                <label>Plate Number *</label>
                <input required value={form.PlateNumber} onChange={(e) => setForm({ ...form, PlateNumber: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Model *</label>
                <input required value={form.Model} onChange={(e) => setForm({ ...form, Model: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Year *</label>
                <input type="number" required min="2000" max="2030" value={form.Year}
                  onChange={(e) => setForm({ ...form, Year: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Mileage (km)</label>
                <input type="number" min="0" value={form.Mileage}
                  onChange={(e) => setForm({ ...form, Mileage: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.Status} onChange={(e) => setForm({ ...form, Status: e.target.value })}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
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
