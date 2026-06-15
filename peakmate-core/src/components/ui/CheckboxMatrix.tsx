interface MatrixRow {
  id: number | string;
  label: string;
  permissions: Record<string, boolean>;
}

interface CheckboxMatrixProps {
  rows: MatrixRow[];
  permissionKeys: { key: string; label: string }[];
  onChange: (rowId: number | string, permKey: string, checked: boolean) => void;
  readOnly?: boolean;
}

export function CheckboxMatrix({ rows, permissionKeys, onChange, readOnly = false }: CheckboxMatrixProps) {
  return (
    <table className="mes-grid" style={{ width: '100%' }}>
      <thead>
        <tr>
          <th style={{ width: 200 }}>메뉴</th>
          {permissionKeys.map(pk => (
            <th key={pk.key} style={{ width: 80, textAlign: 'center' }}>{pk.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={permissionKeys.length + 1} className="loading">데이터가 없습니다</td>
          </tr>
        ) : (
          rows.map(row => (
            <tr key={row.id}>
              <td>{row.label}</td>
              {permissionKeys.map(pk => (
                <td key={pk.key} style={{ textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={row.permissions[pk.key] || false}
                    onChange={(e) => onChange(row.id, pk.key, e.target.checked)}
                    disabled={readOnly}
                  />
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
