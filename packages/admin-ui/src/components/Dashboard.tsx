import { useEffect, useState } from 'react'

interface Run {
  id: string
  vehicle: string
  driver: string
  status: string
}

export function Dashboard() {
  const [runs, setRuns] = useState<Run[]>([])

  useEffect(() => {
    fetch('/api/runs?status=active')
      .then((res) => res.json())
      .then(setRuns)
      .catch(() => {
        // ignore errors in demo
      })
  }, [])

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Active Runs</h2>
      <ul className="space-y-2">
        {runs.map((run) => (
          <li key={run.id} className="p-2 border rounded">
            <div className="font-semibold">{run.vehicle}</div>
            <div className="text-sm text-gray-500">Driver: {run.driver}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}
