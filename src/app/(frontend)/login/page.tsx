import { Suspense } from 'react'
import LoginContent from './LoginContent'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-sm mx-auto px-4 py-12 text-center text-gray-400">載入中…</div>}>
      <LoginContent />
    </Suspense>
  )
}
