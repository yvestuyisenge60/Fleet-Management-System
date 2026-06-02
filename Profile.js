import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api';
import './Profile.css';
import './page.css';

/* ─── helpers ──────────────────────────────────────── */
function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'U';
}
function avatarColor(name = '') {
  const colors = ['#2563eb','#7c3aed','#059669','#dc2626','#d97706','#0891b2','#be185d'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}
function passwordStrength(pwd) {
  if (!pwd) return { label: '', color: '#e2e8f0', pct: 0 };
  let s = 0;
  if (pwd.length >= 6)  s++;
  if (pwd.length >= 10) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return [
    { label: '',           color: '#e2e8f0', pct: 0   },
    { label: 'Weak',       color: '#ef4444', pct: 20  },
    { label: 'Fair',       color: '#f59e0b', pct: 40  },
    { label: 'Good',       color: '#3b82f6', pct: 60  },
    { label: 'Strong',     color: '#10b981', pct: 80  },
    { label: 'Very Strong',color: '#059669', pct: 100 },
  ][s];
}
function getPermissions(role) {
  const all = ['View Dashboard','Manage Vehicles','Manage Drivers','Record Trips',
                'Track Fuel','Schedule Maintenance','Manage Users','View Reports','Daily Reports'];
  return ({
    'Administrator':       all,
    'Fleet Manager':       ['View Dashboard','Manage Vehicles','Manage Drivers','Record Trips','Track Fuel','Schedule Maintenance','View Reports','Daily Reports'],
    'Driver':              ['View Dashboard','Record Trips','Track Fuel','View Reports'],
    'Maintenance Officer': ['View Dashboard','Schedule Maintenance','View Reports'],
    'Management':          ['View Dashboard','View Reports','Daily Reports'],
  })[role] || ['View Dashboard'];
}
function Alert({ type, message, onClose }) {
  if (!message) return null;
  return (
    <div className={`pf-alert pf-alert-${type}`}>
      <span className="pf-alert-icon">{type === 'success' ? '✅' : '⚠️'}</span>
      <span style={{ flex:1 }}>{message}</span>
      {onClose && <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:'inherit',fontSize:16 }}>✕</button>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PHOTO UPLOAD COMPONENT
═══════════════════════════════════════════════════ */
function PhotoUpload({ profile, onPhotoChanged }) {
  const [preview,   setPreview]   = useState(null);
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing,  setRemoving]  = useState(false);
  const [ok,        setOk]        = useState('');
  const [err,       setErr]       = useState('');
  const fileRef = useRef();

  // Build current photo URL
  const currentPhoto = profile?.AvatarUrl
    ? `}`
    : null;

  const bgColor = avatarColor(profile?.FullName || '');

  const validateFile = (file) => {
    if (!file) return 'No file selected.';
    const allowed = ['image/jpeg','image/jpg','image/png','image/gif','image/webp'];
    if (!allowed.includes(file.type)) return 'Only JPG, PNG, GIF or WEBP images are allowed.';
    if (file.size > 3 * 1024 * 1024) return 'File size must be under 3 MB.';
    return null;
  };

  const handleFile = (file) => {
    const error = validateFile(file);
    if (error) { setErr(error); setPreview(null); return; }
    setErr('');
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleUpload = async () => {
    const file = fileRef.current?.files[0];
    if (!file) { setErr('Please select a photo first.'); return; }
    setErr(''); setOk(''); setUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await api.post('/profile/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setOk('Profile photo updated successfully!');
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      onPhotoChanged(res.data.avatarUrl);
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Upload failed. Please try again.');
    } finally { setUploading(false); }
  };

  const handleRemove = async () => {
    if (!window.confirm('Remove your profile photo?')) return;
    setErr(''); setOk(''); setRemoving(true);
    try {
      await api.delete('/profile/avatar');
      setOk('Profile photo removed.');
      setPreview(null);
      if (fileRef.current) fileRef.current.value = '';
      onPhotoChanged(null);
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Remove failed.');
    } finally { setRemoving(false); }
  };

  const handleCancel = () => {
    setPreview(null);
    setErr('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="panel-body">
      <Alert type="success" message={ok}  onClose={() => setOk('')}  />
      <Alert type="error"   message={err} onClose={() => setErr('')} />

      <div className="photo-upload-layout">

        {/* ── Left: current photo ── */}
        <div className="photo-current-wrap">
          <div className="photo-current-label">Current Photo</div>
          <div className="photo-current">
            {currentPhoto
              ? <img src={currentPhoto} alt="Profile" className="photo-current-img" />
              : <div className="photo-current-initials" style={{ background: bgColor }}>
                  {initials(profile?.FullName)}
                </div>
            }
          </div>
          <div className="photo-current-name">{profile?.FullName}</div>
          <div className="photo-current-role">{profile?.Role}</div>
          {currentPhoto && (
            <button className="btn btn-danger btn-sm" style={{ marginTop:14 }}
              onClick={handleRemove} disabled={removing}>
              {removing ? '⏳ Removing…' : '🗑️ Remove Photo'}
            </button>
          )}
        </div>

        {/* ── Right: upload area ── */}
        <div className="photo-upload-right">

          {/* Drag-and-drop zone */}
          <div
            className={`photo-dropzone ${dragging ? 'dragging' : ''} ${preview ? 'has-preview' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            {preview ? (
              <img src={preview} alt="Preview" className="photo-preview-img" />
            ) : (
              <div className="photo-dropzone-content">
                <div className="photo-drop-icon">📷</div>
                <p className="photo-drop-title">Click or drag photo here</p>
                <p className="photo-drop-sub">JPG, PNG, GIF, WEBP · Max 3 MB</p>
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            style={{ display:'none' }}
            onChange={handleInputChange}
          />

          {/* Action buttons */}
          <div className="photo-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()}>
              📁 Browse File
            </button>
            {preview && (
              <>
                <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
                  {uploading
                    ? <><span className="upload-spinner"></span> Uploading…</>
                    : '⬆️ Upload Photo'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={handleCancel}>
                  ✕ Cancel
                </button>
              </>
            )}
          </div>

          {/* Tips */}
          <div className="photo-tips">
            <p className="photo-tips-title">📌 Photo tips</p>
            <ul>
              <li>Use a square photo for best results</li>
              <li>Minimum recommended size: 200 × 200 px</li>
              <li>Maximum file size: 3 MB</li>
              <li>Supported formats: JPG, PNG, GIF, WEBP</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB: Edit Profile Info
═══════════════════════════════════════════════════ */
function TabProfile({ profile, onSaved }) {
  const [form, setForm] = useState({ FullName: '', Username: '' });
  const [ok,   setOk]   = useState('');
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) setForm({ FullName: profile.FullName || '', Username: profile.Username || '' });
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr(''); setOk(''); setBusy(true);
    try {
      const res = await api.put('/profile', form);
      const stored = JSON.parse(localStorage.getItem('sw_user') || '{}');
      localStorage.setItem('sw_user', JSON.stringify({
        ...stored, fullName: res.data.user.FullName, username: res.data.user.Username,
      }));
      setOk('Profile updated successfully!');
      onSaved(res.data.user);
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Update failed.');
    } finally { setBusy(false); }
  };

  return (
    <div className="panel-body">
      <Alert type="success" message={ok}  onClose={() => setOk('')}  />
      <Alert type="error"   message={err} onClose={() => setErr('')} />
      <form className="pf-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label><span className="lbl-icon">👤</span> Full Name <span style={{color:'var(--danger)'}}>*</span></label>
            <input required placeholder="Enter your full name" value={form.FullName}
              onChange={e => setForm({ ...form, FullName: e.target.value })} />
            <div className="input-hint">Appears in reports and the sidebar.</div>
          </div>
          <div className="form-group">
            <label><span className="lbl-icon">🔤</span> Username <span style={{color:'var(--danger)'}}>*</span></label>
            <input required placeholder="Enter username" value={form.Username}
              onChange={e => setForm({ ...form, Username: e.target.value.toLowerCase().replace(/\s/g,'') })} />
            <div className="input-hint">Used to log in. Lowercase only.</div>
          </div>
        </div>
        <div className="form-group">
          <label><span className="lbl-icon">🏷️</span> Role</label>
          <input disabled value={profile?.Role || ''} />
          <div className="input-hint">⚠️ Roles can only be changed by an Administrator.</div>
        </div>
        <div className="form-group">
          <label><span className="lbl-icon">📅</span> Member Since</label>
          <input disabled value={profile?.CreatedAt ? new Date(profile.CreatedAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}) : ''} />
        </div>
        <div className="pf-actions">
          <button type="button" className="btn btn-ghost"
            onClick={() => setForm({ FullName: profile?.FullName||'', Username: profile?.Username||'' })}>
            ↺ Reset
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? '⏳ Saving…' : '💾 Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB: Change Password
═══════════════════════════════════════════════════ */
function TabPassword() {
  const [form, setForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [show, setShow] = useState({ cur:false, nw:false, cn:false });
  const [ok,   setOk]   = useState('');
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);
  const strength = passwordStrength(form.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault(); setErr(''); setOk(''); setBusy(true);
    try {
      await api.put('/profile/password', form);
      setOk('Password changed successfully!');
      setForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch (ex) { setErr(ex.response?.data?.message || 'Password change failed.'); }
    finally { setBusy(false); }
  };

  const Eye = ({ f }) => (
    <button type="button" onClick={() => setShow(s => ({ ...s, [f]:!s[f] }))}
      style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',
               background:'none',border:'none',cursor:'pointer',fontSize:16,color:'var(--text-muted)',padding:0 }}>
      {show[f] ? '🙈' : '👁️'}
    </button>
  );

  return (
    <div className="panel-body">
      <Alert type="success" message={ok}  onClose={() => setOk('')}  />
      <Alert type="error"   message={err} onClose={() => setErr('')} />
      <form className="pf-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>🔒 Current Password <span style={{color:'var(--danger)'}}>*</span></label>
          <div style={{position:'relative'}}>
            <input required type={show.cur?'text':'password'} placeholder="Enter current password"
              value={form.currentPassword} onChange={e => setForm({...form,currentPassword:e.target.value})} style={{paddingRight:44}} />
            <Eye f="cur" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>🔑 New Password <span style={{color:'var(--danger)'}}>*</span></label>
            <div style={{position:'relative'}}>
              <input required type={show.nw?'text':'password'} placeholder="Min. 6 characters"
                value={form.newPassword} onChange={e => setForm({...form,newPassword:e.target.value})} style={{paddingRight:44}} />
              <Eye f="nw" />
            </div>
            {form.newPassword && (
              <div className="pwd-strength">
                <div className="pwd-strength-bar"><div className="pwd-strength-fill" style={{width:strength.pct+'%',background:strength.color}} /></div>
                <span className="pwd-strength-label" style={{color:strength.color}}>{strength.label}</span>
              </div>
            )}
          </div>
          <div className="form-group">
            <label>✅ Confirm New Password <span style={{color:'var(--danger)'}}>*</span></label>
            <div style={{position:'relative'}}>
              <input required type={show.cn?'text':'password'} placeholder="Repeat new password"
                value={form.confirmPassword} onChange={e => setForm({...form,confirmPassword:e.target.value})} style={{paddingRight:44}} />
              <Eye f="cn" />
            </div>
            {form.confirmPassword && (
              <div className="input-hint" style={{color:form.newPassword===form.confirmPassword?'var(--success)':'var(--danger)'}}>
                {form.newPassword===form.confirmPassword ? '✓ Passwords match' : '✗ Do not match'}
              </div>
            )}
          </div>
        </div>
        <div style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:10,padding:'12px 16px',marginBottom:18}}>
          <p style={{fontSize:12.5,fontWeight:600,color:'var(--text-muted)',marginBottom:8}}>Requirements:</p>
          {[
            { rule:form.newPassword.length>=6,          text:'At least 6 characters' },
            { rule:/[A-Z]/.test(form.newPassword),      text:'One uppercase letter' },
            { rule:/[0-9]/.test(form.newPassword),      text:'One number' },
            { rule:/[^A-Za-z0-9]/.test(form.newPassword),text:'One special character' },
          ].map((it,i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,fontSize:12.5,marginBottom:4,
              color:it.rule?'var(--success)':'var(--text-muted)'}}>
              <span>{it.rule?'✅':'⬜'}</span>{it.text}
            </div>
          ))}
        </div>
        <div className="pf-actions">
          <button type="button" className="btn btn-ghost"
            onClick={() => setForm({currentPassword:'',newPassword:'',confirmPassword:''})}>↺ Clear</button>
          <button type="submit" className="btn btn-danger" disabled={busy}>
            {busy ? '⏳ Changing…' : '🔑 Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   TAB: Overview
═══════════════════════════════════════════════════ */
function TabOverview({ profile }) {
  const roleColors = { 'Administrator':'#7c3aed','Fleet Manager':'#1d4ed8','Driver':'#059669','Maintenance Officer':'#b45309','Management':'#0e7490' };
  const color = roleColors[profile?.Role] || '#1d4ed8';
  const items = [
    { label:'Full Name',     value:profile?.FullName,  icon:'👤' },
    { label:'Username',      value:profile?.Username,  icon:'🔤' },
    { label:'Role',          value:profile?.Role,      icon:'🏷️' },
    { label:'User ID',       value:`#${profile?.UserID}`, icon:'🆔' },
    { label:'Member Since',  icon:'📅', value:profile?.CreatedAt ? new Date(profile.CreatedAt).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}) : '—' },
    { label:'Account Status',value:'Active', icon:'✅' },
  ];
  return (
    <div className="panel-body">
      <div style={{display:'flex',alignItems:'center',gap:14,background:color+'0f',border:`1px solid ${color}30`,borderRadius:12,padding:'14px 18px',marginBottom:20}}>
        <div style={{width:44,height:44,borderRadius:11,background:color+'18',color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>🏷️</div>
        <div>
          <div style={{fontWeight:700,fontSize:15,color}}>{profile?.Role||'—'}</div>
          <div style={{fontSize:12.5,color:'var(--text-muted)',marginTop:2}}>Your role determines what you can access.</div>
        </div>
      </div>
      <div className="info-grid">
        {items.map((it,i) => (
          <div className="info-cell" key={i}>
            <div className="info-cell-label">{it.icon} {it.label}</div>
            <div className="info-cell-value">{it.value||'—'}</div>
          </div>
        ))}
      </div>
      <div style={{marginTop:22}}>
        <div style={{fontWeight:700,fontSize:13.5,marginBottom:12,color:'var(--text)'}}>🔐 Your Permissions</div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
          {getPermissions(profile?.Role).map((p,i) => (
            <span key={i} style={{padding:'5px 12px',borderRadius:20,fontSize:12,fontWeight:600,
              background:color+'12',color,border:`1px solid ${color}25`}}>✓ {p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PROFILE PAGE
═══════════════════════════════════════════════════ */
export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [tab,     setTab]     = useState('overview');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/profile');
      setProfile(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (updatedUser) => {
    setProfile(prev => ({ ...prev, FullName: updatedUser.FullName, Username: updatedUser.Username }));
  };

  const handlePhotoChanged = (avatarUrl) => {
    setProfile(prev => ({ ...prev, AvatarUrl: avatarUrl }));
    // Also update localStorage so topbar avatar refreshes
    const stored = JSON.parse(localStorage.getItem('sw_user') || '{}');
    localStorage.setItem('sw_user', JSON.stringify({ ...stored, avatarUrl }));
  };

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'50vh',flexDirection:'column',gap:14}}>
      <div style={{width:44,height:44,border:'4px solid #e2e8f0',borderTopColor:'var(--primary)',borderRadius:'50%',animation:'spin .8s linear infinite'}}></div>
      <p style={{color:'var(--text-muted)'}}>Loading profile…</p>
    </div>
  );

  const bgColor    = avatarColor(profile?.FullName || '');
  const photoUrl   = profile?.AvatarUrl ? `http://localhost:5000${profile.AvatarUrl}` : null;

  const tabs = [
    { id:'overview', label:'Overview',        icon:'📋' },
    { id:'photo',    label:'Profile Photo',   icon:'📷' },
    { id:'edit',     label:'Edit Profile',    icon:'✏️'  },
    { id:'password', label:'Change Password', icon:'🔑' },
  ];

  return (
    <div className="profile-page">

      {/* ── Hero ── */}
      <div className="profile-hero">
        <div className="profile-hero-body">

          {/* Avatar — shows photo if exists, else initials */}
          <div className="profile-avatar-wrap">
            {photoUrl
              ? <img src={photoUrl} alt={profile?.FullName} className="profile-avatar profile-avatar-img" />
              : <div className="profile-avatar" style={{ background: bgColor }}>
                  <span className="avatar-initials">{initials(profile?.FullName)}</span>
                </div>
            }
            {/* Camera badge — clicking opens photo tab */}
            <button className="avatar-camera-btn" onClick={() => setTab('photo')} title="Change photo">
              📷
            </button>
          </div>

          <div className="profile-hero-info">
            <h2>{profile?.FullName || 'User'}</h2>
            <div className="hero-username">@{profile?.Username}</div>
            <div className="hero-role-wrap">
              <span className="hero-role-badge">{profile?.Role}</span>
              <span className="hero-since">
                Member since {profile?.CreatedAt
                  ? new Date(profile.CreatedAt).toLocaleDateString('en-US',{month:'short',year:'numeric'})
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          {tabs.map(t => (
            <button key={t.id}
              className={`profile-tab ${tab===t.id?'active':''}`}
              onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div className="profile-panel">
          <div className="panel-header">
            <div className="panel-header-icon" style={{background:'#eff6ff',color:'#2563eb'}}>📋</div>
            <div><h3>Account Overview</h3><p>Your account details and permissions at a glance.</p></div>
          </div>
          <TabOverview profile={profile} />
        </div>
      )}

      {/* ── Photo Upload ── */}
      {tab === 'photo' && (
        <div className="profile-panel">
          <div className="panel-header">
            <div className="panel-header-icon" style={{background:'#f5f3ff',color:'#7c3aed'}}>📷</div>
            <div>
              <h3>Profile Photo</h3>
              <p>Upload a photo so colleagues can recognise you. Max 3 MB · JPG, PNG, GIF, WEBP.</p>
            </div>
          </div>
          <PhotoUpload profile={profile} onPhotoChanged={handlePhotoChanged} />
        </div>
      )}

      {/* ── Edit Profile ── */}
      {tab === 'edit' && (
        <div className="profile-panel">
          <div className="panel-header">
            <div className="panel-header-icon" style={{background:'#ecfdf5',color:'#059669'}}>✏️</div>
            <div><h3>Edit Profile</h3><p>Update your name and username.</p></div>
          </div>
          <TabProfile profile={profile} onSaved={handleSaved} />
        </div>
      )}

      {/* ── Change Password ── */}
      {tab === 'password' && (
        <div className="profile-panel">
          <div className="panel-header">
            <div className="panel-header-icon" style={{background:'#fef2f2',color:'#dc2626'}}>🔑</div>
            <div><h3>Change Password</h3><p>Choose a strong password to keep your account secure.</p></div>
          </div>
          <TabPassword />
        </div>
      )}

      {/* ── Tips ── */}
      <div style={{background:'linear-gradient(135deg,#eff6ff,#e0f2fe)',border:'1px solid #bfdbfe',
        borderRadius:'var(--radius)',padding:'18px 22px',display:'flex',gap:14,alignItems:'flex-start'}}>
        <span style={{fontSize:24,flexShrink:0}}>💡</span>
        <div>
          <p style={{fontWeight:700,fontSize:14,color:'#1e40af',marginBottom:4}}>Profile Tips</p>
          <ul style={{fontSize:13,color:'#1d4ed8',paddingLeft:16,lineHeight:1.9}}>
            <li>Use a clear, square photo for the best display in the sidebar and reports.</li>
            <li>Your photo appears everywhere your name is shown in the system.</li>
            <li>Use your real full name so colleagues can identify you in reports.</li>
            <li>Pick a strong password with uppercase letters, numbers and symbols.</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
