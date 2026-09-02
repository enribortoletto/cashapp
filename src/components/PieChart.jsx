import { useEffect, useRef } from 'react'

export default function PieChart({ segments, size = 192 }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2
    const R = Math.min(W, H) / 2 - 4
    const r = R * 0.52

    const total = segments.reduce((s, seg) => s + seg.amt, 0)
    if (total === 0) { ctx.clearRect(0, 0, W, H); return }

    const dur = 650, t0 = performance.now()

    function frame(now) {
      const p = Math.min((now - t0) / dur, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      ctx.clearRect(0, 0, W, H)

      let ang = -Math.PI / 2
      const target = Math.PI * 2 * ease
      let drawn = 0

      for (const seg of segments) {
        const sa = Math.PI * 2 * (seg.amt / total)
        const draw = Math.min(sa, Math.max(0, target - drawn))
        if (draw <= 0) break
        ctx.beginPath(); ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, R, ang, ang + draw); ctx.closePath()
        ctx.fillStyle = seg.color; ctx.fill()
        ang += sa; drawn += sa
      }

      if (p > 0.6 && segments.length > 1) {
        ctx.save()
        ctx.globalCompositeOperation = 'destination-out'
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2
        let a = -Math.PI / 2
        for (const seg of segments) {
          ctx.beginPath(); ctx.moveTo(cx, cy)
          ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); ctx.stroke()
          a += Math.PI * 2 * (seg.amt / total)
        }
        ctx.restore()
      }

      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
      ctx.restore()

      if (p < 1) animRef.current = requestAnimationFrame(frame)
      else animRef.current = null
    }

    if (animRef.current) cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(frame)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [segments, size])

  return <canvas ref={canvasRef} width={size} height={size} style={{ maxWidth: size, maxHeight: size }} />
}
