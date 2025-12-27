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

interface SleepEntry {
  id: number
  bedtime: string
  wake_time: string
  hours_slept: number
  quality: string
  date: string
  notes?: string
}

interface ActivityEntry {
  id: number
  type: string
  duration: number
  intensity: string
  date: string
  time: string
  notes?: string
}

interface Analytics {
  glucose_stats: Array<{type: string, average: number, count: number}>
  medication_adherence_rate: number
  sleep_quality: Array<{quality: string, count: number}>
  activity_summary: Array<{type: string, total_minutes: number, sessions: number}>
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://competition-practitioner-val-farmer.trycloudflare.com'

export default function HealthTracker() {
  const [activeTab, setActiveTab] = useState('glucose')
  const [glucoseEntries, setGlucoseEntries] = useState<GlucoseEntry[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([])
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
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
      const [glucoseRes, medsRes, sleepRes, activitiesRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}/api/glucose`),
        fetch(`${API_URL}/api/medications`),
        fetch(`${API_URL}/api/sleep`),
        fetch(`${API_URL}/api/activities`),
        fetch(`${API_URL}/api/analytics`)
      ])

      if (glucoseRes.ok) setGlucoseEntries(await glucoseRes.json())
      if (medsRes.ok) setMedications(await medsRes.json())
      if (sleepRes.ok) setSleepEntries(await sleepRes.json())
      if (activitiesRes.ok) setActivities(await activitiesRes.json())
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json())
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

  const logMedicationAdherence = async (medicationId: number, scheduledTime: string, status: string, reason?: string) => {
    try {
      await fetch(`${API_URL}/api/medications/adherence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medication_id: medicationId,
          scheduled_time: scheduledTime,
          status,
          reason: reason || null
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Sistema de Salud Integral
        </h1>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center mb-8 bg-white rounded-lg shadow-sm p-2">
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
              className={`px-6 py-3 m-1 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="text-xl text-gray-600">Cargando datos...</div>
          </div>
        )}

        {/* Glucose Tab */}
        {activeTab === 'glucose' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-semibold mb-4">Registrar Glucosa</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                  type="number"
                  placeholder="Valor de glucosa"
                  value={glucoseValue}
                  onChange={(e) => setGlucoseValue(e.target.value)}
                  className="p-3 border rounded-lg text-lg"
                />
                <select
                  value={glucoseType}
                  onChange={(e) => setGlucoseType(e.target.value)}
                  className="p-3 border rounded-lg text-lg"
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
                  className="p-3 border rounded-lg text-lg"
                />
                <button
                  onClick={addGlucoseEntry}
                  className="bg-blue-500 text-white p-3 rounded-lg text-lg font-medium hover:bg-blue-600"
                >
                  Agregar
                </button>
              </div>
            </div>

            {chartData.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-4">Tendencia de Glucosa</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-4">Registros Recientes</h3>
              <div className="space-y-2">
                {glucoseEntries.slice(0, 10).map(entry => (
                  <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-lg font-medium">{entry.value} mg/dL</span>
                    <span className="text-gray-600">{entry.type}</span>
                    <span className="text-gray-500">{entry.date} {entry.time}</span>
                    {entry.notes && <span className="text-sm text-gray-400">"{entry.notes}"</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Medications Tab */}
        {activeTab === 'medications' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-semibold mb-4">Medicamentos Programados</h2>
              <div className="space-y-4">
                {medications.map(med => (
                  <div key={med.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold">{med.name}</h3>
                        <p className="text-gray-600">{med.dosage} - {med.frequency}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {med.times.map(time => (
                        <div key={time} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                          <span className="font-medium">{time}</span>
                          <button
                            onClick={() => logMedicationAdherence(med.id, time, 'tomado')}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            Tomado
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Razón de omisión (opcional):')
                              logMedicationAdherence(med.id, time, 'omitido', reason || undefined)
                            }}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
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
          </div>
        )}

        {/* Sleep Tab */}
        {activeTab === 'sleep' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-semibold mb-4">Registrar Sueño</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <input
                  type="time"
                  placeholder="Hora de dormir"
                  value={bedtime}
                  onChange={(e) => setBedtime(e.target.value)}
                  className="p-3 border rounded-lg text-lg"
                />
                <input
                  type="time"
                  placeholder="Hora de despertar"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="p-3 border rounded-lg text-lg"
                />
                <select
                  value={sleepQuality}
                  onChange={(e) => setSleepQuality(e.target.value)}
                  className="p-3 border rounded-lg text-lg"
                >
                  <option value="buena">Buena</option>
                  <option value="regular">Regular</option>
                  <option value="mala">Mala</option>
                </select>
                <input
                  type="text"
                  placeholder="Notas (opcional)"
                  value={sleepNotes}
                  onChange={(e) => setSleepNotes(e.target.value)}
                  className="p-3 border rounded-lg text-lg"
                />
                <button
                  onClick={addSleepEntry}
                  className="bg-purple-500 text-white p-3 rounded-lg text-lg font-medium hover:bg-purple-600"
                >
                  Agregar
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-4">Registros de Sueño</h3>
              <div className="space-y-2">
                {sleepEntries.slice(0, 10).map(entry => (
                  <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-lg font-medium">{entry.hours_slept?.toFixed(1)}h</span>
                    <span className="text-gray-600">{entry.bedtime} - {entry.wake_time}</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      entry.quality === 'buena' ? 'bg-green-100 text-green-800' :
                      entry.quality === 'regular' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {entry.quality}
                    </span>
                    <span className="text-gray-500">{entry.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-semibold mb-4">Registrar Actividad</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="p-3 border rounded-lg text-lg"
                >
                  <option value="caminata">Caminata</option>
                  <option value="gimnasio">Gimnasio</option>
                  <option value="descanso">Descanso</option>
                  <option value="otro">Otro</option>
                </select>
                <input
                  type="number"
                  placeholder="Duración (minutos)"
                  value={activityDuration}
                  onChange={(e) => setActivityDuration(e.target.value)}
                  className="p-3 border rounded-lg text-lg"
                />
                <select
                  value={activityIntensity}
                  onChange={(e) => setActivityIntensity(e.target.value)}
                  className="p-3 border rounded-lg text-lg"
                >
                  <option value="ligero">Ligero</option>
                  <option value="moderado">Moderado</option>
                  <option value="intenso">Intenso</option>
                </select>
                <input
                  type="text"
                  placeholder="Notas (opcional)"
                  value={activityNotes}
                  onChange={(e) => setActivityNotes(e.target.value)}
                  className="p-3 border rounded-lg text-lg"
                />
                <button
                  onClick={addActivity}
                  className="bg-green-500 text-white p-3 rounded-lg text-lg font-medium hover:bg-green-600"
                >
                  Agregar
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-4">Actividades Recientes</h3>
              <div className="space-y-2">
                {activities.slice(0, 10).map(entry => (
                  <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-lg font-medium">{entry.type}</span>
                    <span className="text-gray-600">{entry.duration} min</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      entry.intensity === 'ligero' ? 'bg-blue-100 text-blue-800' :
                      entry.intensity === 'moderado' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {entry.intensity}
                    </span>
                    <span className="text-gray-500">{entry.date} {entry.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-4">Promedios de Glucosa (30 días)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.glucose_stats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="average" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-semibold mb-4">Calidad del Sueño</h3>
                <ResponsiveContainer width="100%" height={250}>
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
                      {analytics.sleep_quality.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-semibold mb-4">Resumen de Salud</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {analytics.medication_adherence_rate}%
                  </div>
                  <div className="text-gray-600">Adherencia a Medicamentos</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {analytics.activity_summary.reduce((sum, act) => sum + act.total_minutes, 0)}
                  </div>
                  <div className="text-gray-600">Minutos de Actividad</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">
                    {analytics.glucose_stats.reduce((sum, stat) => sum + stat.count, 0)}
                  </div>
                  <div className="text-gray-600">Mediciones de Glucosa</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
