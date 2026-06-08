'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    })
    if (error) { setError(error.message); setLoading(false) }
    else setDone(true)
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  if (done) return (
    <div className="min-h-screen bg-[#0d1520] flex items-center justify-center px-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center">
        <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-emerald-400 text-2xl">✓</span>
        </div>
        <h2 className="text-white font-semibold text-lg mb-2">Revisa tu correo</h2>
        <p className="text-slate-400 text-sm">Te enviamos un enlace de confirmación a <strong className="text-white">{email}</strong>. Confírmalo para entrar.</p>
        <button onClick={() => router.push('/login')} className="mt-6 text-emerald-400 text-sm hover:underline">Ir al login</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0d1520] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center font-bold text-white">M</div>
          <div>
            <p className="text-white font-bold leading-none">MoneyFlow</p>
            <p className="text-emerald-400 text-xs">DR</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h1 className="text-white font-semibold text-xl mb-1">Crear cuenta</h1>
          <p className="text-slate-500 text-sm mb-6">Gratis, sin tarjeta de crédito</p>

          <button onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2.5 text-white text-sm transition-colors mb-4">
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
            Continuar con Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-slate-500 text-xs">o</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleRegister} className="space-y-3">
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              placeholder="Tu nombre"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="Correo electrónico"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              placeholder="Contraseña (mín. 6 caracteres)"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium transition-colors">
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-4">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-emerald-400 hover:underline">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
