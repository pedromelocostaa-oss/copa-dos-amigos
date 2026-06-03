'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

// Contador de módulo — nunca reinicializa entre renders
let moduleCounter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  // Referência estável mesmo que o componente re-renderize
  const counterRef = useRef(moduleCounter)

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    moduleCounter += 1
    counterRef.current = moduleCounter
    const id = counterRef.current

    setToasts(prev => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }, [])

  const config: Record<ToastType, { bg: string; icon: string }> = {
    success: { bg: 'bg-green-600', icon: '✓' },
    error:   { bg: 'bg-red-600',   icon: '✕' },
    info:    { bg: 'bg-gray-800',  icon: 'ℹ' },
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        role="region"
        aria-label="Notificações"
        aria-live="polite"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {toasts.map(t => (
          <div
            key={t.id}
            role="alert"
            className={`
              ${config[t.type].bg} text-white
              flex items-center gap-3
              rounded-xl px-4 py-3 text-sm font-medium shadow-xl
              opacity-0
            `}
            style={{
              animation: 'toastIn 0.22s ease forwards',
            }}
          >
            <span className="text-base leading-none shrink-0">{config[t.type].icon}</span>
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>

      {/* Animação CSS nativa — sem dependência externa */}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}
