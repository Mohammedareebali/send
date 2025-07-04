import { useEffect, useState } from 'react'

interface Message {
  from: string
  text: string
}

export function CommunicationPanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [socket, setSocket] = useState<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws')
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      setMessages((m) => [...m, msg])
    }
    setSocket(ws)
    return () => ws.close()
  }, [])

  const send = () => {
    if (!socket) return
    socket.send(JSON.stringify({ text: input }))
    setInput('')
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Communication</h2>
      <div className="border h-40 overflow-y-auto p-2 mb-2">
        {messages.map((m, idx) => (
          <div key={idx} className="text-sm">
            <span className="font-semibold mr-2">{m.from}:</span>
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex space-x-2">
        <input
          className="border flex-1 p-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={send}
        >
          Send
        </button>
      </div>
    </div>
  )
}
