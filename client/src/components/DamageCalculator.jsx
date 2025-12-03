import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function DamageCalculator() {
  const [calcRows, setCalcRows] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Поля форми
  const [formData, setFormData] = useState({
    pollutant: 'SO2',
    massInput: '',
    unit: 't',
    baseRate: '',
    kT: '',
    kR: '1',
    kSeason: '1'
  });

  // Завантаження даних
  const fetchData = async () => {
    try {
      const [resRows, resConfig] = await Promise.all([
        axios.get(`${API_BASE}/api/damage`),
        axios.get(`${API_BASE}/api/damage/config`)
      ]);
      setCalcRows(resRows.data);
      setConfig(resConfig.data);
    } catch (e) {
      alert('Error fetching data');
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Автозаповнення коефіцієнтів
  useEffect(() => {
    if (config && config.pollutants && config.pollutants[formData.pollutant]) {
      const pData = config.pollutants[formData.pollutant];
      setFormData(prev => ({
        ...prev,
        baseRate: pData.baseRate,
        kT: pData.kT
      }));
    }
  }, [formData.pollutant, config]);

  const handleCalcSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/api/damage`, {
        ...formData,
        kOther: [parseFloat(formData.kSeason)]
      });
      fetchData();
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/api/damage/generate`, { count: 5 });
      await fetchData();
      alert('Згенеровано 5 синтетичних записів');
    } catch (e) {
      alert('Error generating');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
      if(!confirm("Видалити?")) return;
      await axios.delete(`${API_BASE}/api/damage/${id}`);
      setCalcRows(prev => prev.filter(x => x._id !== id));
  }

  const saveConfig = async () => {
      try {
        const newConfig = JSON.parse(document.getElementById('configArea').value);
        await axios.put(`${API_BASE}/api/damage/config`, newConfig);
        setConfig(newConfig);
        setShowConfig(false);
        alert("Довідник оновлено!");
      } catch(e) {
          alert("Невірний формат JSON");
      }
  }

  return (
    <div style={{ marginTop: 20, borderTop: '2px solid #ccc', paddingTop: 20 }}>
      <h2>Модуль розрахунку екологічних збитків</h2>
      
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* Форма розрахунку */}
        <form onSubmit={handleCalcSubmit} style={{ border: '1px solid #ddd', padding: 15, borderRadius: 8, width: '300px' }}>
            <h3>Новий розрахунок</h3>
            
            <label>Речовина:</label>
            <select 
              value={formData.pollutant} 
              onChange={e => setFormData({...formData, pollutant: e.target.value})}
              style={{width: '100%', marginBottom: 10}}
            >
                {['SO2', 'NOx', 'CO', 'PM10', 'VOC'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <label>Маса викиду (Mi_excess):</label>
            <div style={{display:'flex', gap: 5, marginBottom: 10}}>
                <input type="number" step="0.01" required value={formData.massInput} onChange={e => setFormData({...formData, massInput: e.target.value})} style={{flex:1}} />
                <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                    <option value="t">т</option>
                    <option value="kg">кг</option>
                </select>
            </div>

            <label>Базова ставка (грн/т):</label>
            <input type="number" step="0.01" required value={formData.baseRate} onChange={e => setFormData({...formData, baseRate: e.target.value})} style={{width:'100%', marginBottom: 10}} />

            <label>Kt (Токсичність):</label>
            <input type="number" step="0.01" required value={formData.kT} onChange={e => setFormData({...formData, kT: e.target.value})} style={{width:'100%', marginBottom: 10}} />

            <label>Kr (Регіон):</label>
            <input type="number" step="0.01" required value={formData.kR} onChange={e => setFormData({...formData, kR: e.target.value})} style={{width:'100%', marginBottom: 10}} />

            <label>K (Сезонний/Інше):</label>
            <input type="number" step="0.01" required value={formData.kSeason} onChange={e => setFormData({...formData, kSeason: e.target.value})} style={{width:'100%', marginBottom: 10}} />

            <button type="submit" style={{width:'100%', padding: 8, backgroundColor: '#4CAF50', color: 'white', border:'none'}}>Розрахувати</button>
        </form>

        <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 20 }}>
                <button onClick={handleGenerate} disabled={loading} style={{ padding: '10px 20px', marginRight: 10 }}>
                    {loading ? 'Генерація...' : 'Згенерувати синтетичні дані (5 шт.)'}
                </button>
                <button onClick={() => setShowConfig(!showConfig)} style={{ padding: '10px 20px' }}>
                    {showConfig ? 'Сховати довідник' : 'Редагувати довідник (JSON)'}
                </button>
            </div>

            {showConfig && config && (
                <div style={{ marginBottom: 20 }}>
                    <textarea 
                        id="configArea"
                        defaultValue={JSON.stringify(config, null, 2)} 
                        style={{ width: '100%', height: '200px', fontFamily: 'monospace' }}
                    />
                    <button onClick={saveConfig} style={{marginTop: 5}}>Зберегти зміни у JSON</button>
                </div>
            )}

            {/* Таблиця результатів */}
            <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{backgroundColor: '#f2f2f2'}}>
                        <th>Дата</th>
                        <th>Джерело</th>
                        <th>Речовина</th>
                        <th>Наднорм. маса (т)</th>
                        <th>Сума збитків (грн)</th>
                        <th>Дії</th>
                    </tr>
                </thead>
                <tbody>
                    {calcRows.map(row => (
                        <tr key={row._id}>
                            <td>{new Date(row.dateCalculated).toLocaleString()}</td>
                            <td>{row.sourceId}</td>
                            <td><b>{row.pollutant}</b></td>
                            <td>
                                {row.massExcess.toFixed(4)} <br/>
                                <span style={{fontSize: '0.8em', color: '#666'}}>
                                    (Вхід: {row.calculationPassport?.originalMass} {row.calculationPassport?.inputUnit})
                                </span>
                            </td>
                            <td><b>{row.total.toFixed(2)}</b></td>
                            <td><button onClick={() => handleDelete(row._id)}>x</button></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}