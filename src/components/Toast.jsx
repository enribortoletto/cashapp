import { useEffect, useRef } from 'react'

export default function Toast({ message, onDone }) {
  const timer = useRef(null)

  useEffect(() => {
    if (!message) return
    clearTimeout(timer.current)
    timer.current = setTimeout(onDone, 2200)
    return () => clearTimeout(timer.current)
  }, [message])

  return (
    <div className={`toast${message ? ' show' : ''}`}>{message}</div>
  )
}
