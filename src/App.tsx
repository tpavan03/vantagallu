import { useEffect, useState } from 'react'
import KitchenApp from './components/KitchenApp'
import { recipeCatalog } from './data/recipes'
import { useCookingRuntime } from './client/useCookingRuntime'
import { isNativeApp } from './client/native'

export default function App() {
  const props = useCookingRuntime(recipeCatalog)
  const [update, setUpdate] = useState<ServiceWorker | null>(null)
  useEffect(() => {
    if (isNativeApp() || !import.meta.env.PROD || !('serviceWorker' in navigator)) return
    let disposed = false
    void navigator.serviceWorker.register('/sw.js').then(registration => {
      if (disposed) return
      if (registration.waiting) setUpdate(registration.waiting)
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller && !disposed) setUpdate(worker) })
      })
    }).catch(() => { /* ordinary online cooking still works without offline installation */ })
    return () => { disposed = true }
  }, [])
  function activateUpdate() {
    navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true })
    update?.postMessage({ type: 'ACTIVATE_UPDATE' })
  }
  return <>
    {update && <aside className="app-update" role="status">A new version is ready. Update between cooking steps. <button onClick={activateUpdate}>Update when ready</button></aside>}
    <KitchenApp {...props} />
  </>
}
