import React from 'react'

const fmt = (s) => new Date(s).toLocaleString()

export default function DataTable({ rows, onEdit, onDelete }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Дата (UTC)</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Місто</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Параметр</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Значення</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Одиниці</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: 8 }}>Дії</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r._id}>
              <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{fmt(r.dateUtc)}</td>
              <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{r.city}</td>
              <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{r.parameter}</td>
              <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{r.value}</td>
              <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>{r.unit}</td>
              <td style={{ borderBottom: '1px solid #f0f0f0', padding: 8 }}>
                <button onClick={() => onEdit(r._id)} style={{ marginRight: 4 }}>✏️</button>
                <button onClick={() => onDelete(r._id)}>🗑️</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={6} style={{ padding: 12, textAlign: 'center' }}>Даних немає</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
