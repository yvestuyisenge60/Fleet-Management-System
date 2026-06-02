import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import Modal from '../components/Modal';
import './page.css';

const EMPTY = { VehicleID: '', DriverID: '', StartLocation: '', Destination: '', TripDate: '', Distance: '' };

export default function Trips() {
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
    api.get('/trips').then((r) => { setData(r.data); setFiltered(r.data); }).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    api.get('/vehicles').then((r) => setVehicles(r.data)).catch(() => {});
    api.get('/drivers').then((r) => setDrivers(r.data)).catch(() => {});
  }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(data.filter((t) =>
      (t.PlateNumber || '').toLowerCase().includes(q) ||
      (t.DriverName || '').toLowerCase().includes(q) ||
      (t.StartLocation || '').toLowerCase().includes(q) ||
      (t.Destination || '').toLowerCase().includes(q)
    ));
  }, [search, data]);

  const openAdd = () => { setForm(EMPTY); setEditId(null); setErr(''); setModal('form'); };
  const openEdit = (row) => {
    setForm({
      VehicleID: row.VehicleID, DriverID: row.DriverID,
      StartLocation: row.StartLocation, Destination: row.Destination,
      TripDate: row.TripDate?.split('T')[0], Distance: row.Distance
    });
    setEditId(row.TripID); setErr(''); setModal('form');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this trip?')) return;
    try { await api.delete(`/trips/${id}`); setMsg('Trip deleted.'); load(); }
    catch { setErr('Delete failed.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      if (editId) { await api.put(`/trips/${editId}`, form); setMsg('Trip updated.'); }
      else { await api.post('/trips', form); setMsg('Trip recorded.'); }
      setModal(null); load();
    } catch (ex) { setErr(ex.response?.data?.message || 'Save failed.'); }
  };

  const columns = [
    { key: 'TripID',        label: '#' },
    { key: 'PlateNumber',   label: 'Vehicle' },
    { key: 'DriverName',    label: 'Driver' },
    { key: 'StartLocation', label: 'From' },
    { key: 'Destination',   label: 'To' },
    { key: 'TripDate',      label: 'Date', render: (r) => r.TripDate?.split('T')[0] },
    { key: 'Distance',      label: 'Distance (km)' },
    { key: 'actions', label: 'Actions', render: (r) => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-warning btn-sm" onClick={() => openEdit(r)}>✏️ Edit</button>
        <button className="btn btn-danger btn-sm"  onClick={() => handleDelete(r.TripID)}>🗑 Delete</button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader icon="🗺️" title="Trips" subtitle="Record and manage vehicle trips"
        action={<button className="btn btn-primary" onClick={openAdd}>+ Add Trip</button>} />

      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-error">{err}</div>}

      <div className="page-card">
        <div className="search-bar">
          <input placeholder="🔍 Search by vehicle, driver, or location..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Table columns={columns} data={filtered} emptyMsg="No trips found." />
      </div>

      {modal === 'form' && (
        <Modal title={editId ? 'Edit Trip' : 'Add Trip'} onClose={() => setModal(null)}>
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
            <div className="form-row">
              <div className="form-group">
                <label>Start Location *</label>
                <input required value={form.StartLocation} onChange={(e) => setForm({ ...form, StartLocation: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Destination *</label>
                <input required value={form.Destination} onChange={(e) => setForm({ ...form, Destination: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Trip Date *</label>
                <input type="date" required value={form.TripDate} onChange={(e) => setForm({ ...form, TripDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Distance (km)</label>
                <input type="number" min="0" step="0.1" value={form.Distance}
                  onChange={(e) => setForm({ ...form, Distance: e.target.value })} />
              </div>
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
