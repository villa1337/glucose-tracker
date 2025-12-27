'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface GlucoseEntry {
  id: number
  value: number
  type: 'ayunas' | 'postprandial'
  date: string
  time: string
}

interface Medication {
  id: number
  name: string
  dosage: string
  frequency: string
  times: string[]
}

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export default function Home() {
  const [activeSection, setActiveSection] = useState<'glucose' | 'meds'>('glucose')
  const [glucoseView, setGlucoseView] = useState<'track' | 'historic'>('track')
  const [glucoseEntries, setGlucoseEntries] = useState<GlucoseEntry[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(false)
  
  const [newEntry, setNewEntry] = useState({
    value: '',
    type: 'ayunas' as 'ayunas' | 'postprandial'
  })

  // Fetch glucose entries from API
  const fetchGlucoseEntries = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/glucose`)
      if (response.ok) {
        const data = await response.json()
        setGlucoseEntries(data)
      }
    } catch (error) {
      console.error('Error fetching glucose entries:', error)
      // Fallback to localStorage if API fails
      const savedEntries = localStorage.getItem('glucoseEntries')
      if (savedEntries) {
        setGlucoseEntries(JSON.parse(savedEntries))
      }
    }
  }

  // Fetch medications from API
  const fetchMedications = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/medications`)
      if (response.ok) {
        const data = await response.json()
        setMedications(data)
      }
    } catch (error) {
      console.error('Error fetching medications:', error)
      // Fallback to default medications
      setMedications([
        {
          id: 1,
          name: 'Metformina',
          dosage: '500mg',
          frequency: 'Cada 12 horas',
          times: ['08:00', '20:00']
        },
        {
          id: 2,
          name: 'Insulina',
          dosage: '10 unidades',
          frequency: 'Antes de comidas',
          times: ['07:30', '12:30', '19:30']
        }
      ])
    }
  }

  useEffect(() => {
    fetchGlucoseEntries()
    fetchMedications()
  }, [])

  const saveGlucoseEntry = async () => {
    if (!newEntry.value || loading) return
    
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/glucose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: parseInt(newEntry.value),
          type: newEntry.type
        })
      })

      if (response.ok) {
        const savedEntry = await response.json()
        setGlucoseEntries(prev => [savedEntry, ...prev])
        setNewEntry({ value: '', type: 'ayunas' })
      } else {
        throw new Error('Failed to save entry')
      }
    } catch (error) {
      console.error('Error saving glucose entry:', error)
      // Fallback to localStorage
      const now = new Date()
      const entry: GlucoseEntry = {
        id: Date.now(),
        value: parseInt(newEntry.value),
        type: newEntry.type,
        date: now.toLocaleDateString('es-ES'),
        time: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      }
      
      const updated = [entry, ...glucoseEntries]
      setGlucoseEntries(updated)
      localStorage.setItem('glucoseEntries', JSON.stringify(updated))
      setNewEntry({ value: '', type: 'ayunas' })
    } finally {
      setLoading(false)
    }
  }

  const chartData = glucoseEntries.map((entry, index) => ({
    name: `${entry.date} ${entry.time}`,
    glucosa: entry.value,
    tipo: entry.type
  }))

  return (
    <div>
      <nav className="nav">
        <div className="container">
          <h1>Control de Glucosa</h1>
          <div className="nav-buttons">
            <button 
              className={`nav-button ${activeSection === 'glucose' ? 'active' : ''}`}
              onClick={() => setActiveSection('glucose')}
            >
              Control de Glucosa
            </button>
            <button 
              className={`nav-button ${activeSection === 'meds' ? 'active' : ''}`}
              onClick={() => setActiveSection('meds')}
            >
              Medicamentos
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        {activeSection === 'glucose' && (
          <div className="section">
            <h2>Control de Glucosa</h2>
            
            <div className="button-group">
              <button 
                className={`button ${glucoseView === 'track' ? '' : 'secondary'}`}
                onClick={() => setGlucoseView('track')}
              >
                Registrar Medición
              </button>
              <button 
                className={`button ${glucoseView === 'historic' ? '' : 'secondary'}`}
                onClick={() => setGlucoseView('historic')}
              >
                Ver Historial
              </button>
            </div>

            {glucoseView === 'track' && (
              <div className="form">
                <div className="form-group">
                  <label>Nivel de Glucosa (mg/dL)</label>
                  <input
                    type="number"
                    value={newEntry.value}
                    onChange={(e) => setNewEntry({...newEntry, value: e.target.value})}
                    placeholder="Ej: 120"
                  />
                </div>
                
                <div className="form-group">
                  <label>Tipo de Medición</label>
                  <select
                    value={newEntry.type}
                    onChange={(e) => setNewEntry({...newEntry, type: e.target.value as 'ayunas' | 'postprandial'})}
                  >
                    <option value="ayunas">En Ayunas</option>
                    <option value="postprandial">Después de Comer</option>
                  </select>
                </div>
                
                <button className="button" onClick={saveGlucoseEntry}>
                  Guardar Medición
                </button>
              </div>
            )}

            {glucoseView === 'historic' && (
              <div>
                {glucoseEntries.length > 0 && (
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="glucosa" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Glucosa (mg/dL)</th>
                      <th>Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {glucoseEntries.slice().reverse().map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.date}</td>
                        <td>{entry.time}</td>
                        <td>{entry.value}</td>
                        <td>{entry.type === 'ayunas' ? 'En Ayunas' : 'Después de Comer'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeSection === 'meds' && (
          <div className="section">
            <h2>Horario de Medicamentos</h2>
            
            {medications.map((med) => (
              <div key={med.id} className="med-card">
                <h3>{med.name}</h3>
                <p><strong>Dosis:</strong> {med.dosage}</p>
                <p><strong>Frecuencia:</strong> {med.frequency}</p>
                <p><strong>Horarios:</strong> {med.times.join(', ')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
