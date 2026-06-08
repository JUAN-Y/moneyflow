export default function AjustesPage() {
  return (
    <div className="max-w-xl space-y-6">
      <div className="bg-white/5 border border-white/5 rounded-2xl divide-y divide-white/5">
        <div className="p-5">
          <h3 className="text-white font-medium mb-1">Perfil</h3>
          <p className="text-slate-500 text-sm">Nombre y preferencias de cuenta</p>
        </div>
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium">Moneda</p>
            <p className="text-slate-500 text-xs">Peso Dominicano (RD$)</p>
          </div>
          <span className="text-emerald-400 text-sm">RD$</span>
        </div>
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium">Notificaciones</p>
            <p className="text-slate-500 text-xs">Alertas de presupuesto y metas</p>
          </div>
          <div className="w-10 h-5 bg-emerald-500 rounded-full" />
        </div>
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium">Tema</p>
            <p className="text-slate-500 text-xs">Oscuro</p>
          </div>
          <span className="text-slate-400 text-sm">Oscuro</span>
        </div>
      </div>

      <div className="bg-white/5 border border-white/5 rounded-2xl divide-y divide-white/5">
        <div className="p-5">
          <h3 className="text-white font-medium mb-1">Seguridad</h3>
          <p className="text-slate-500 text-sm">Tus datos están protegidos con RLS de Supabase</p>
        </div>
        <div className="p-5">
          <p className="text-white text-sm font-medium">Versión</p>
          <p className="text-slate-500 text-xs">MoneyFlow DR v1.0.0</p>
        </div>
      </div>
    </div>
  )
}
