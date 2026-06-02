import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import Modal from '../components/Modal';
import './page.css';

const EMPTY = { FullName: '', LicenseNumber: '', Phone: '', Address: '' };

export default function Drivers() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    api.get('/drivers').then((r) => { setData(r.data); setFiltered(r.data); }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(data.filter((d) =>
      d.FullName.toLowerCase().includes(q) ||
      d.LicenseNumber.toLowerCase().includes(q) ||
      (d.Phone || '').includes(q)
    ));
  }, [search, data]);

  const openAdd = () => { setForm(EMPTY); setEditId(null); setErr(''); setModal('form'); };
  const openEdit = (row) => { setForm({ ...row }); setEditId(row.DriverID); setErr(''); setModal('form'); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this driver?')) return;
    try { await api.delete(`/drivers/${id}`); setMsg('Driver deleted.'); load(); }
    catch { setErr('Delete failed.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      if (editId) { await api.put(`/drivers/${editId}`, form); setMsg('Driver updated.'); }
      else { await api.post('/drivers', form); setMsg('Driver added.'); }
      setModal(null); load();
    } catch (ex) { setErr(ex.response?.data?.message || 'Save failed.'); }
  };

  const columns = [
    { key: 'DriverID',      label: '#' },
    { key: 'FullName',      label: 'Full Name' },
    { key: 'LicenseNumber', label: 'License #' },
    { key: 'Phone',         label: 'Phone' },
    { key: 'Address',       label: 'Address' },
    { key: 'actions', label: 'Actions', render: (r) => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-warning btn-sm" onClick={() => openEdit(r)}>✏️ Edit</button>
        <button className="btn btn-danger btn-sm"  onClick={() => handleDelete(r.DriverID)}>🗑 Delete</button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader icon="👤" title="Drivers" subtitle="Manage driver records and assignments"
        action={<button className="btn btn-primary" onClick={openAdd}>+ Add Driver</button>} />

      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-error">{err}</div>}

      <div className="page-card">
        <div className="search-bar">
          <input placeholder="🔍 Search by name, license or phone..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Table columns={columns} data={filtered} emptyMsg="No drivers found." />
      </div>

      {modal === 'form' && (
        <Modal title={editId ? 'Edit Driver' : 'Add Driver'} onClose={() => setModal(null)}>
          <form className="modal-form" onSubmit={handleSubmit}>
            {err && <div className="alert alert-error">{err}</div>}
            <div className="form-group">
              <label>Full Name *</label>
              <input required value={form.FullName} onChange={(e) => setForm({ ...form, FullName: e.target.value })} />
            </div>
            <div className="form-group">
              <label>License Number *</label>
              <input required value={form.LicenseNumber} onChange={(e) => setForm({ ...form, LicenseNumber: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input value={form.Phone} onChange={(e) => setForm({ ...form, Phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input value={form.Address} onChange={(e) => setForm({ ...form, Address: e.target.value })} />
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
