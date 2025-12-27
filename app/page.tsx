'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface GlucoseEntry {
  id: number
  value: number
  type: string
  date: string
  time: string
  notes?: string
}

interface Medication {
  id: number
  name: string
  dosage: string
  frequency: string
  times: string[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://competition-practitioner-val-farmer.trycloudflare.com'

export default function HealthTracker() {
  const [activeTab, setActiveTab] = useState('glucose')
  const [glucoseEntries, setGlucoseEntries] = useState<GlucoseEntry[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(false)

  // Form states
  const [glucoseValue, setGlucoseValue] = useState('')
  const [glucoseType, setGlucoseType] = useState('ayuno')
  const [glucoseNotes, setGlucoseNotes] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [glucoseRes, medsRes] = await Promise.all([
        fetch(`${API_URL}/api/glucose`),
        fetch(`${API_URL}/api/medications`)
      ])

      if (glucoseRes.ok) setGlucoseEntries(await glucoseRes.json())
      if (medsRes.ok) setMedications(await medsRes.json())
    } catch (error) {
      console.error('Error loading data:', error)
    }
    setLoading(false)
  }

  const addGlucoseEntry = async () => {
    if (!glucoseValue) return
    
    try {
      const response = await fetch(`${API_URL}/api/glucose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: parseInt(glucoseValue),
          type: glucoseType,
          notes: glucoseNotes || null
        })
      })

      if (response.ok) {
        setGlucoseValue('')
        setGlucoseNotes('')
        loadData()
      }
    } catch (error) {
      console.error('Error adding glucose entry:', error)
    }
  }

  const logMedicationAdherence = async (medicationId: number, scheduledTime: string, status: string) => {
    try {
      await fetch(`${API_URL}/api/medications/adherence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medication_id: medicationId,
          scheduled_time: scheduledTime,
          status
        })
      })
      loadData()
    } catch (error) {
      console.error('Error logging medication adherence:', error)
    }
  }

  const chartData = glucoseEntries.slice(0, 20).reverse().map(entry => ({
    time: `${entry.date} ${entry.time}`,
    value: entry.value,
    type: entry.type
  }))

  return (
    <div className="container">
      <div className="nav">
        <h1>Sistema de Salud Integral</h1>
        <div className="nav-buttons">
          {[
            { id: 'glucose', label: 'Glucosa' },
            { id: 'medications', label: 'Medicamentos' },
            { id: 'sleep', label: 'Sueño' },
            { id: 'activities', label: 'Actividades' },
            { id: 'analytics', label: 'Análisis' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="section">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '1.2rem', color: '#4a5568' }}>Cargando datos...</div>
          </div>
        </div>
      )}

      {/* Glucose Tab */}
      {activeTab === 'glucose' && (
        <div>
          <div className="section">
            <h2>Registrar Glucosa</h2>
            <div className="form-grid">
              <input
                type="number"
                placeholder="Valor de glucosa"
                value={glucoseValue}
                onChange={(e) => setGlucoseValue(e.target.value)}
              />
              <select
                value={glucoseType}
                onChange={(e) => setGlucoseType(e.target.value)}
              >
                <option value="ayuno">En Ayuno</option>
                <option value="desayuno">Después del Desayuno</option>
                <option value="comida">Después de la Comida</option>
                <option value="cena">Después de la Cena</option>
                <option value="antes-dormir">Antes de Dormir</option>
              </select>
              <input
                type="text"
                placeholder="Notas (opcional)"
                value={glucoseNotes}
                onChange={(e) => setGlucoseNotes(e.target.value)}
              />
              <button
                onClick={addGlucoseEntry}
                className="button"
              >
                Agregar
              </button>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="section">
              <h2>Tendencia de Glucosa</h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="section">
            <h2>Registros Recientes</h2>
            {glucoseEntries.slice(0, 10).map(entry => (
              <div key={entry.id} className="record-item">
                <span style={{ fontSize: '1.2rem', fontWeight: '600', color: '#2563eb' }}>
                  {entry.value} mg/dL
                </span>
                <span className="badge blue">{entry.type}</span>
                <span style={{ color: '#6b7280' }}>{entry.date} {entry.time}</span>
                {entry.notes && <span style={{ fontSize: '0.9rem', color: '#9ca3af' }}>"{entry.notes}"</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medications Tab */}
      {activeTab === 'medications' && (
        <div>
          <div className="section">
            <h2>Medicamentos Programados</h2>
            {medications.map(med => (
              <div key={med.id} className="med-card">
                <h3>{med.name}</h3>
                <p style={{ marginBottom: '15px', color: '#6b7280' }}>{med.dosage} - {med.frequency}</p>
                <div className="button-group">
                  {med.times.map(time => (
                    <div key={time} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span style={{ fontWeight: '600', minWidth: '60px' }}>{time}</span>
                      <button
                        onClick={() => logMedicationAdherence(med.id, time, 'tomado')}
                        className="button green"
                        style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                      >
                        Tomado
                      </button>
                      <button
                        onClick={() => logMedicationAdherence(med.id, time, 'omitido')}
                        className="button red"
                        style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                      >
                        Omitido
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other tabs placeholder */}
      {(activeTab === 'sleep' || activeTab === 'activities' || activeTab === 'analytics') && (
        <div className="section">
          <h2>Próximamente</h2>
          <p>Esta funcionalidad estará disponible pronto.</p>
        </div>
      )}
    </div>
  )
}
