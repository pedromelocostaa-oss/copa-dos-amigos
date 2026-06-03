'use client'

import { createContext, useCallback, useContext, useState } from 'react'

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

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  let counter = 0

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++counter
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const colors: Record<ToastType, string> = {
    success: 'bg-green-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-gray-800 text-white',
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none">
        {toasts.map(t => (
          <div key={t.id}
            className={`rounded-xl px-4 py-3 text-sm font-medium shadow-lg text-center animate-in fade-in slide-in-from-top-2 duration-200 ${colors[t.type]}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
