function Settings() {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Settings</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>User Settings</h3>
          <p style={{ color: '#64748b', margin: 0 }}>Profile, language, notifications</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>System Settings</h3>
          <p style={{ color: '#64748b', margin: 0 }}>System-wide configuration</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Security</h3>
          <p style={{ color: '#64748b', margin: 0 }}>Password, 2FA settings</p>
        </div>
      </div>
    </div>
  );
}

export default Settings;
