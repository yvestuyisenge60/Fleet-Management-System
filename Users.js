import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import PageHeader from '../components/PageHeader';
import Table from '../components/Table';
import Modal from '../components/Modal';
import './page.css';

const EMPTY = { Username: '', Password: '', FullName: '', Role: 'Driver' };
const ROLES = ['Administrator', 'Fleet Manager', 'Driver', 'Maintenance Officer', 'Management'];

function roleBadge(r) {
  const map = { 'Administrator':'badge-admin', 'Fleet Manager':'badge-manager', 'Driver':'badge-driver' };
  return <span className={`badge ${map[r] || 'badge-other'}`}>{r}</span>;
}

export default function Users() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const load = useCallback(() => {
    api.get('/users').then((r) => { setData(r.data); setFiltered(r.data); }).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(data.filter((u) =>
      u.FullName.toLowerCase().includes(q) ||
      u.Username.toLowerCase().includes(q) ||
      u.Role.toLowerCase().includes(q)
    ));
  }, [search, data]);

  const openAdd = () => { setForm(EMPTY); setEditId(null); setErr(''); setModal('form'); };
  const openEdit = (row) => {
    setForm({ Username: row.Username, FullName: row.FullName, Role: row.Role, Password: '' });
    setEditId(row.UserID); setErr(''); setModal('form');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try { await api.delete(`/users/${id}`); setMsg('User deleted.'); load(); }
    catch { setErr('Delete failed.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      if (editId) { await api.put(`/users/${editId}`, form); setMsg('User updated.'); }
      else { await api.post('/users', form); setMsg('User created.'); }
      setModal(null); load();
    } catch (ex) { setErr(ex.response?.data?.message || 'Save failed.'); }
  };

  const columns = [
    { key: 'UserID',    label: '#' },
    { key: 'FullName',  label: 'Full Name' },
    { key: 'Username',  label: 'Username' },
    { key: 'Role',      label: 'Role', render: (r) => roleBadge(r.Role) },
    { key: 'CreatedAt', label: 'Created', render: (r) => r.CreatedAt?.split('T')[0] },
    { key: 'actions', label: 'Actions', render: (r) => (
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-warning btn-sm" onClick={() => openEdit(r)}>✏️ Edit</button>
        <button className="btn btn-danger btn-sm"  onClick={() => handleDelete(r.UserID)}>🗑 Delete</button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader icon="🔑" title="User Management" subtitle="Manage system accounts and roles"
        action={<button className="btn btn-primary" onClick={openAdd}>+ Add User</button>} />

      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-error">{err}</div>}

      <div className="page-card">
        <div className="search-bar">
          <input placeholder="🔍 Search by name, username or role..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Table columns={columns} data={filtered} emptyMsg="No users found." />
      </div>

      {modal === 'form' && (
        <Modal title={editId ? 'Edit User' : 'Add User'} onClose={() => setModal(null)}>
          <form className="modal-form" onSubmit={handleSubmit}>
            {err && <div className="alert alert-error">{err}</div>}
            <div className="form-group">
              <label>Full Name *</label>
              <input required value={form.FullName} onChange={(e) => setForm({ ...form, FullName: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Username *</label>
                <input required value={form.Username} onChange={(e) => setForm({ ...form, Username: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Password {editId ? '(leave blank to keep)' : '*'}</label>
                <input type="password" required={!editId} value={form.Password}
                  onChange={(e) => setForm({ ...form, Password: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={form.Role} onChange={(e) => setForm({ ...form, Role: e.target.value })}>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-danger" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editId ? '💾 Update' : '➕ Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
