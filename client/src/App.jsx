import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import DataTable from './components/DataTable.jsx'
// Переконайтесь, що створили файл DamageCalculator.jsx у папці components
import DamageCalculator from './components/DamageCalculator.jsx' 

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function App() {
  // Стан для перемикання вкладок: 'monitoring' або 'damage'
  const [activeTab, setActiveTab] = useState('monitoring')

  // --- Стани для Моніторингу ---
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [parameter, setParameter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [total, setTotal] = useState(0)
  const [token, setToken] = useState('test')
  const [fetching, setFetching] = useState(false)

  // Поля для створення нового запису моніторингу
  const [createCity, setCreateCity] = useState('Sumy')
  const [createParam, setCreateParam] = useState('pm2_5')
  const [createValue, setCreateValue] = useState('')
  const [createUnit, setCreateUnit] = useState('µg/m³')
  const [createDateUtc, setCreateDateUtc] = useState('')

  const query = useMemo(() => {
    const p = new URLSearchParams({ page, limit })
    if (parameter) p.set('parameter', parameter)
    if (dateFrom) p.set('dateFrom', dateFrom)
    if (dateTo) p.set('dateTo', dateTo)
    return p.toString()
  }, [page, limit, parameter, dateFrom, dateTo])

  async function load() {
    // Якщо ми не на вкладці моніторингу, не вантажимо дані
    if (activeTab !== 'monitoring') return

    setLoading(true)
    try {
      const { data } = await axios.get(`${API_BASE}/api/aq?${query}`)
      setRows(data.items || [])
      setTotal(data.total || 0)
    } catch (e) {
      alert('Помилка завантаження: ' + (e?.response?.data?.error || e.message))
    } finally {
      setLoading(false)
    }
  }

  async function triggerFetch() {
    setFetching(true)
    try {
      const { data } = await axios.post(`${API_BASE}/api/aq/fetch`, {}, { headers: { 'x-admin-token': token } })
      const { fetched, inserted, matched, modified, city, parameters } = data
      alert(`OK: fetched=${fetched}, inserted=${inserted}`)
      await load()
    } catch (e) {
      alert('Помилка fetch: ' + (e?.response?.data?.error || e.message))
    } finally {
      setFetching(false)
    }
  }

  async function deleteRow(id) {
    if (!confirm('Видалити запис?')) return
    try {
      await axios.delete(`${API_BASE}/api/aq/${id}`)
      setRows(rows.filter(r => r._id !== id))
      setTotal(t => Math.max(0, t - 1))
    } catch (e) {
      alert('Помилка: ' + e.message)
    }
  }

  async function editRow(id) {
    const newVal = prompt('Нове значення value:')
    if (newVal == null) return
    const parsed = parseFloat(newVal)
    if (Number.isNaN(parsed)) { alert('Введіть число'); return }
    try {
      const { data } = await axios.put(`${API_BASE}/api/aq/${id}`, { value: parsed })
      setRows(rows.map(r => r._id === id ? data : r))
    } catch (e) {
      alert('Помилка: ' + e.message)
    }
  }

  async function createRow(e) {
    e.preventDefault()
    if (!createDateUtc) { alert('Вкажіть дату/час'); return }
    const payload = {
      city: createCity, country: 'UA', parameter: createParam,
      value: parseFloat(createValue), unit: createUnit,
      dateUtc: new Date(createDateUtc).toISOString()
    }
    try {
      const { data } = await axios.post(`${API_BASE}/api/aq`, payload)
      setRows(prev => [data, ...prev])
      setTotal(t => t + 1); setCreateValue('')
    } catch (e) {
      alert('Помилка: ' + e.message)
    }
  }

  // Перезавантажувати дані при зміні фільтрів або вкладки
  useEffect(() => { load() }, [query, activeTab])

  return (
    <div style={{ fontFamily: 'ui-sans-serif,system-ui', padding: 16, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 8 }}>Eco Monitor System</h1>

      {/* Навігація (Вкладки) */}
      <div style={{ marginBottom: 20, borderBottom: '2px solid #eee', display: 'flex', gap: 10 }}>
        <button 
          onClick={() => setActiveTab('monitoring')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'monitoring' ? '#e0e0e0' : 'transparent',
            border: '1px solid #ccc',
            borderBottom: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'monitoring' ? 'bold' : 'normal'
          }}
        >
          Моніторинг якості повітря
        </button>
        <button 
          onClick={() => setActiveTab('damage')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'damage' ? '#e0e0e0' : 'transparent',
            border: '1px solid #ccc',
            borderBottom: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: activeTab === 'damage' ? 'bold' : 'normal'
          }}
        >
          Розрахунок збитків
        </button>
      </div>

      {/* Вміст вкладок */}
      {activeTab === 'monitoring' ? (
        <>
          {/* Фільтри та управління */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8, marginBottom: 12 }}>
            <div>
              <label>Limit</label>
              <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1) }} style={{ width: '100%', padding: 6 }}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div>
              <label>Параметр</label>
              <select value={parameter} onChange={e => setParameter(e.target.value)} style={{ width: '100%', padding: 6 }}>
                <option value="">(усі)</option>
                <option value="pm2_5">PM2.5</option>
                <option value="pm10">PM10</option>
                <option value="ozone">Ozone (O3)</option>
                <option value="nitrogen_dioxide">NO2</option>
                <option value="sulphur_dioxide">SO2</option>
                <option value="carbon_monoxide">CO</option>
              </select>
            </div>
            <div>
              <label>Дата від</label>
              <input type="datetime-local" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width: '100%', padding: 5 }} />
            </div>
            <div>
              <label>Дата до</label>
              <input type="datetime-local" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width: '100%', padding: 5 }} />
            </div>
          </div>

          {/* Пагінація і Fetch API */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <button onClick={load} disabled={loading} style={{ padding: '8px 12px' }}>{loading ? 'Оновлення…' : 'Оновити'}</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loading}>«</button>
            <span>Сторінка {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={loading || rows.length < limit}>»</button>
            
            <div style={{ marginLeft: 'auto' }} />
            
            <input placeholder="x-admin-token" value={token} onChange={e => setToken(e.target.value)} style={{ padding: 6 }} />
            <button onClick={triggerFetch} disabled={fetching} style={{ padding: '8px 12px' }}>{fetching ? 'Збір…' : 'Зібрати дані з API'}</button>
          </div>

          {/* Форма додавання */}
          <form onSubmit={createRow} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, padding: 12, border: '1px solid #eee', borderRadius: 8, marginBottom: 16 }}>
            <div><label>Місто</label><input value={createCity} onChange={e => setCreateCity(e.target.value)} style={{ width: '100%' }} /></div>
            <div>
              <label>Параметр</label>
              <select value={createParam} onChange={e => setCreateParam(e.target.value)} style={{ width: '100%' }}>
                <option value="pm2_5">pm2_5</option>
                <option value="pm10">pm10</option>
                <option value="co">co</option>
                <option value="no2">no2</option>
                <option value="so2">so2</option>
                <option value="o3">o3</option>
              </select>
            </div>
            <div><label>Value</label><input type="number" value={createValue} onChange={e => setCreateValue(e.target.value)} style={{ width: '100%' }} /></div>
            <div><label>Unit</label><input value={createUnit} onChange={e => setCreateUnit(e.target.value)} style={{ width: '100%' }} /></div>
            <div><label>Дата</label><input type="datetime-local" value={createDateUtc} onChange={e => setCreateDateUtc(e.target.value)} style={{ width: '100%' }} /></div>
            <button type="submit" style={{ marginTop: 'auto' }}>Додати</button>
          </form>

          {/* Таблиця */}
          <DataTable rows={rows} onEdit={editRow} onDelete={deleteRow} />
          <div style={{ marginTop: 8, color: '#666' }}>Всього записів: {total}</div>
        </>
      ) : (
        /* Вкладка калькулятора */
        <DamageCalculator />
      )}
    </div>
  )
}