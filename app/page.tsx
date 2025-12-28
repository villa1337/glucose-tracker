'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://competition-practitioner-val-farmer.trycloudflare.com'

export default function HealthTracker() {
  const [activeTab, setActiveTab] = useState('glucose')
  const [glucoseEntries, setGlucoseEntries] = useState<any[]>([])
  const [medications, setMedications] = useState<any[]>([])
  const [sleepEntries, setSleepEntries] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [medicationStatus, setMedicationStatus] = useState<any>({})
  const [loading, setLoading] = useState(false)

  // Form states
  const [glucoseValue, setGlucoseValue] = useState('')
  const [glucoseType, setGlucoseType] = useState('ayuno')
  const [glucoseNotes, setGlucoseNotes] = useState('')
  
  const [bedtime, setBedtime] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [sleepQuality, setSleepQuality] = useState('buena')
  const [sleepNotes, setSleepNotes] = useState('')
  
  const [activityType, setActivityType] = useState('caminata')
  const [activityDuration, setActivityDuration] = useState('')
  const [activityIntensity, setActivityIntensity] = useState('moderado')
  const [activityNotes, setActivityNotes] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [glucoseRes, medsRes, sleepRes, activitiesRes, analyticsRes, adherenceRes] = await Promise.all([
        fetch(`${API_URL}/api/glucose`),
        fetch(`${API_URL}/api/medications`),
        fetch(`${API_URL}/api/sleep`),
        fetch(`${API_URL}/api/activities`),
        fetch(`${API_URL}/api/analytics`),
        fetch(`${API_URL}/api/medications/adherence`)
      ])

      if (glucoseRes.ok) setGlucoseEntries(await glucoseRes.json())
      if (medsRes.ok) setMedications(await medsRes.json())
      if (sleepRes.ok) setSleepEntries(await sleepRes.json())
      if (activitiesRes.ok) setActivities(await activitiesRes.json())
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json())
      
      // Process medication adherence for today
      if (adherenceRes.ok) {
        const adherenceData = await adherenceRes.json()
        // Use UTC date to match backend (Pi is in GMT)
        const now = new Date()
        const today = `${now.getUTCDate().toString().padStart(2, '0')}/${(now.getUTCMonth() + 1).toString().padStart(2, '0')}/${now.getUTCFullYear()}`
        const todayStatus: any = {}
        
        console.log('Today (UTC):', today)
        console.log('Adherence data:', adherenceData)
        
        adherenceData.forEach((entry: any) => {
          console.log('Entry date:', entry.date, 'matches today:', entry.date === today)
          if (entry.date === today) {
            const key = `${entry.medication_id}-${entry.scheduled_time}`
            todayStatus[key] = entry.status
            console.log('Added status:', key, entry.status)
          }
        })
        
        console.log('Final status:', todayStatus)
        setMedicationStatus(todayStatus)
      }
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

  const addSleepEntry = async () => {
    if (!bedtime || !wakeTime) return
    
    try {
      const response = await fetch(`${API_URL}/api/sleep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bedtime,
          wake_time: wakeTime,
          quality: sleepQuality,
          notes: sleepNotes || null
        })
      })

      if (response.ok) {
        setBedtime('')
        setWakeTime('')
        setSleepNotes('')
        loadData()
      }
    } catch (error) {
      console.error('Error adding sleep entry:', error)
    }
  }

  const addActivity = async () => {
    if (!activityDuration) return
    
    try {
      const response = await fetch(`${API_URL}/api/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activityType,
          duration: parseInt(activityDuration),
          intensity: activityIntensity,
          notes: activityNotes || null
        })
      })

      if (response.ok) {
        setActivityDuration('')
        setActivityNotes('')
        loadData()
      }
    } catch (error) {
      console.error('Error adding activity:', error)
    }
  }

  const logMedicationAdherence = async (medicationId: any, scheduledTime: any, status: any) => {
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
      
      // Update local state immediately for better UX
      const key = `${medicationId}-${scheduledTime}`
      setMedicationStatus((prev: any) => ({
        ...prev,
        [key]: status
      }))
      
      loadData()
    } catch (error) {
      console.error('Error logging medication adherence:', error)
    }
  }

  const chartData = glucoseEntries.slice(0, 20).reverse().map((entry: any) => ({
    time: `${entry.date} ${entry.time}`,
    date: entry.date,
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
              <div className="form-group">
                <input
                  type="number"
                  placeholder="Valor de glucosa"
                  value={glucoseValue}
                  onChange={(e) => setGlucoseValue(e.target.value)}
                />
              </div>
              <div className="form-group">
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
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Notas (opcional)"
                  value={glucoseNotes}
                  onChange={(e) => setGlucoseNotes(e.target.value)}
                />
              </div>
              <div className="form-group">
                <button
                  onClick={addGlucoseEntry}
                  className="button"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>

          {chartData.length > 0 && (
            <div className="section">
              <h2>Tendencia de Glucosa</h2>
              <div style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#6b7280' }}>
                <span style={{ background: '#d1fae5', padding: '2px 8px', borderRadius: '4px', marginRight: '10px' }}>
                  🏋️ Días de gimnasio
                </span>
                Días normales
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          const hasGym = activities.some((activity: any) => 
                            activity.date === data.date && activity.type === 'gimnasio'
                          )
                          return (
                            <div style={{ 
                              background: 'white', 
                              padding: '10px', 
                              border: '1px solid #ccc', 
                              borderRadius: '4px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}>
                              <p>{`${label}: ${payload[0].value} mg/dL`}</p>
                              <p style={{ color: '#6b7280' }}>{`Tipo: ${data.type}`}</p>
                              {hasGym && <p style={{ color: '#059669' }}>🏋️ Día de gimnasio</p>}
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      dot={(props: any) => {
                        const hasGym = activities.some((activity: any) => 
                          activity.date === props.payload.date && activity.type === 'gimnasio'
                        )
                        return (
                          <circle
                            cx={props.cx}
                            cy={props.cy}
                            r={hasGym ? 6 : 4}
                            fill={hasGym ? '#10b981' : '#2563eb'}
                            stroke={hasGym ? '#059669' : '#1d4ed8'}
                            strokeWidth={2}
                          />
                        )
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="section">
            <h2>Registros Recientes</h2>
            {glucoseEntries.slice(0, 10).map((entry: any) => (
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
            {medications.map((med: any) => (
              <div key={med.id} className="med-card">
                <h3>{med.name}</h3>
                <p style={{ marginBottom: '15px', color: '#6b7280' }}>{med.dosage} - {med.frequency}</p>
                <div className="button-group">
                  {med.times.map((time: any) => {
                    const key = `${med.id}-${time}`
                    const status = medicationStatus[key]
                    
                    return (
                    <div key={time} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <span style={{ fontWeight: '600', minWidth: '60px' }}>{time}</span>
                      
                      {status === 'tomado' ? (
                        <span className="badge green" style={{ padding: '8px 16px' }}>✓ Tomado</span>
                      ) : status === 'omitido' ? (
                        <span className="badge red" style={{ padding: '8px 16px' }}>✗ Omitido</span>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sleep Tab */}
      {activeTab === 'sleep' && (
        <div>
          <div className="section">
            <h2>Registrar Sueño</h2>
            <div className="form-grid">
              <div className="form-group">
                <input
                  type="time"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                />
              </div>
              <div className="form-group">
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                />
              </div>
              <div className="form-group">
                <select
                  value={sleepQuality}
                  onChange={(e) => setSleepQuality(e.target.value)}
                >
                  <option value="buena">Buena</option>
                  <option value="regular">Regular</option>
                  <option value="mala">Mala</option>
                </select>
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Notas (opcional)"
                  value={sleepNotes}
                  onChange={(e) => setSleepNotes(e.target.value)}
                />
              </div>
              <div className="form-group">
                <button
                  onClick={addSleepEntry}
                  className="button purple"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>

          <div className="section">
            <h2>Registros de Sueño</h2>
            {sleepEntries.slice(0, 10).map((entry: any) => (
              <div key={entry.id} className="record-item">
                <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>
                  {entry.hours_slept?.toFixed(1)}h
                </span>
                <span>{entry.bedtime} - {entry.wake_time}</span>
                <span className={`badge ${entry.quality === 'buena' ? 'green' : entry.quality === 'regular' ? 'yellow' : 'red'}`}>
                  {entry.quality}
                </span>
                <span style={{ color: '#6b7280' }}>{entry.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <div>
          <div className="section">
            <h2>Registrar Actividad</h2>
            <div className="form-grid">
              <div className="form-group">
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                >
                  <option value="caminata">Caminata</option>
                  <option value="gimnasio">Gimnasio</option>
                  <option value="descanso">Descanso</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div className="form-group">
                <input
                  type="number"
                  placeholder="Duración (minutos)"
                  value={activityDuration}
                  onChange={(e) => setActivityDuration(e.target.value)}
                />
              </div>
              <div className="form-group">
                <select
                  value={activityIntensity}
                  onChange={(e) => setActivityIntensity(e.target.value)}
                >
                  <option value="ligero">Ligero</option>
                  <option value="moderado">Moderado</option>
                  <option value="intenso">Intenso</option>
                </select>
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Notas (opcional)"
                  value={activityNotes}
                  onChange={(e) => setActivityNotes(e.target.value)}
                />
              </div>
              <div className="form-group">
                <button
                  onClick={addActivity}
                  className="button green"
                >
                  Agregar
                </button>
              </div>
            </div>
          </div>

          <div className="section">
            <h2>Actividades Recientes</h2>
            {activities.slice(0, 10).map((entry: any) => (
              <div key={entry.id} className="record-item">
                <span style={{ fontSize: '1.2rem', fontWeight: '600' }}>{entry.type}</span>
                <span>{entry.duration} min</span>
                <span className={`badge ${entry.intensity === 'ligero' ? 'blue' : entry.intensity === 'moderado' ? 'yellow' : 'red'}`}>
                  {entry.intensity}
                </span>
                <span style={{ color: '#6b7280' }}>{entry.date} {entry.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div>
          <div className="section">
            <h2>Resumen de Salud</h2>
            {analytics ? (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                  <div style={{ textAlign: 'center', padding: '20px', background: '#dbeafe', borderRadius: '12px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af' }}>
                      {analytics.medication_adherence_rate}%
                    </div>
                    <div style={{ color: '#6b7280' }}>Adherencia a Medicamentos</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '20px', background: '#d1fae5', borderRadius: '12px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#065f46' }}>
                      {analytics.activity_summary?.reduce((sum: any, act: any) => sum + act.total_minutes, 0) || 0}
                    </div>
                    <div style={{ color: '#6b7280' }}>Minutos de Actividad</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '20px', background: '#fef3c7', borderRadius: '12px' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#92400e' }}>
                      {analytics.glucose_stats?.reduce((sum: any, stat: any) => sum + stat.count, 0) || 0}
                    </div>
                    <div style={{ color: '#6b7280' }}>Mediciones de Glucosa</div>
                  </div>
                </div>
                
                {analytics.glucose_stats?.length > 0 && (
                  <div className="chart-container">
                    <h3>Promedios de Glucosa por Tipo</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.glucose_stats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="average" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {analytics.sleep_quality?.length > 0 && (
                  <div className="chart-container">
                    <h3>Calidad del Sueño</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics.sleep_quality}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({quality, count}) => `${quality}: ${count}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {analytics.sleep_quality.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28'][index % 3]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            ) : (
              <p>Cargando análisis...</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
