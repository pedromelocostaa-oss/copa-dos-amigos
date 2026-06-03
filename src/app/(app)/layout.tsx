import Navbar from '@/components/layout/Navbar'
import BottomNav from '@/components/layout/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      {/* pb-[76px] para deixar espaço pro BottomNav (60px) + safe area no mobile */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-5 pb-[88px] md:pb-8 md:max-w-6xl">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
