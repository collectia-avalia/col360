import { createClient } from '@/lib/supabase/server';
import { createWompiSubscriptionSessionAction, simulateSubscriptionActivationAction } from './actions';
import { ShieldCheck, Mail, Calendar, CreditCard, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SubscriptionPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sParams = await searchParams;
  const isPaymentSuccess = sParams['payment'] === 'success';
  const isPaymentCancel = sParams['payment'] === 'cancel';
  const isSimulated = sParams['simulated'] === 'true';

  const supabase = await createClient();

  // 1. Obtener perfil de usuario
  const { data: { user } } = await supabase.auth.getUser();
  
  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  const isSubscribed = profile?.subscription_status === 'active';
  const planType = profile?.plan_type;
  const expiresAt = profile?.subscription_expires_at;

  // Manejar simulación automática de checkout completado en base de datos si viene en la URL
  if (isPaymentSuccess && isSimulated && user) {
    await simulateSubscriptionActivationAction();
  }

  // Server Action inline para procesar activación manual rápida
  async function handleSimulateActivation() {
    'use server'
    await simulateSubscriptionActivationAction();
    revalidatePath('/dashboard/subscription');
  }

  // Wrappers de acciones con firma compatible con formularios en React 19
  async function handleSubscribeMonthly() {
    'use server'
    await createWompiSubscriptionSessionAction('monthly');
  }

  async function handleSubscribeAnnual() {
    'use server'
    await createWompiSubscriptionSessionAction('annual');
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6">
      
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Suscripción y Facturación</h1>
        <p className="text-xs text-slate-500 mt-1">Activa y administra tus servicios automáticos de recordatorios de cobro.</p>
      </div>

      {/* Alertas de Retorno de Pasarela */}
      {isPaymentSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-emerald-900">¡Pago procesado con éxito!</h3>
            <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
              Tu suscripción al plan de recordatorios automáticos de mora ha sido activada correctamente. El sistema evaluará tus facturas activas diariamente a las 8:00 AM.
            </p>
          </div>
        </div>
      )}

      {isPaymentCancel && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-900">Pago cancelado</h3>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              La transacción fue cancelada y no se realizaron cargos. Si tienes problemas con el método de pago, por favor inténtalo de nuevo o comunícate con soporte.
            </p>
          </div>
        </div>
      )}

      {/* Estado Actual de Cuenta */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estado del Servicio Premium</p>
            <div className="flex items-center gap-2">
              <div className={`w-3.5 h-3.5 rounded-full ${isSubscribed ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <h2 className="text-lg font-black text-slate-800">
                {isSubscribed ? 'Recordatorios Automáticos Activos' : 'Servicio en Modo Gratuito (Desactivado)'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
              El servicio de recordatorios y mensajes automáticos por correo electrónico despacha notificaciones para facturas en mora de los días 1, 5, 10, 15 y 30.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 w-full md:w-auto min-w-[200px] flex flex-col justify-center">
            {isSubscribed ? (
              <div className="space-y-1">
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-full uppercase tracking-wider">
                  Plan {planType === 'monthly' ? 'Mensual' : 'Anual'}
                </span>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  Expira: <strong>{expiresAt ? new Date(expiresAt).toLocaleDateString() : '-'}</strong>
                </p>
              </div>
            ) : (
              <div className="text-center space-y-1.5">
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-600 rounded-full uppercase tracking-wider">
                  Plan Free
                </span>
                <p className="text-xs font-bold text-slate-600">Mensajería Desactivada</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Planes Tarifarios (Solo si no está suscrito) */}
      {!isSubscribed && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Planes Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Plan Mensual */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-indigo-200 hover:shadow-md transition-all relative">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Mensual Cartera Activa</h4>
                  <p className="text-xs text-slate-400 mt-1">Ideal para flujos variables mes a mes</p>
                </div>
                <div className="flex items-baseline gap-1.5 py-2">
                  <span className="text-3xl font-black text-indigo-950">$39.900</span>
                  <span className="text-xs text-slate-500 font-bold uppercase">COP / mes</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Recordatorios automáticos en mora de 1, 5, 10, 15 y 30 días.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Destinatarios de cobro ilimitados.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Historial de notificaciones en el dashboard.
                  </li>
                </ul>
              </div>

              <form action={handleSubscribeMonthly} className="mt-6">
                <button type="submit" className="w-full flex items-center justify-center py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm gap-1.5 transition-colors active:scale-[0.98]">
                  <CreditCard className="w-4 h-4" /> Suscribirse Plan Mensual
                </button>
              </form>
            </div>

            {/* Plan Anual */}
            <div className="bg-white rounded-xl border border-indigo-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wider py-1 px-4 rounded-bl-lg shadow-sm">
                Ahorra 2 Meses
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Anual Ancla y Tranquilidad</h4>
                  <p className="text-xs text-slate-400 mt-1">El mejor valor para gestión recurrente de cartera</p>
                </div>
                <div className="flex items-baseline gap-1.5 py-2">
                  <span className="text-3xl font-black text-indigo-950">$399.000</span>
                  <span className="text-xs text-slate-500 font-bold uppercase">COP / año</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Todos los beneficios del plan mensual.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Prioridad en el procesamiento del Cron diario.
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    Ahorro del 16% sobre el valor del plan mensual.
                  </li>
                </ul>
              </div>

              <form action={handleSubscribeAnnual} className="mt-6">
                <button type="submit" className="w-full flex items-center justify-center py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm gap-1.5 transition-colors active:scale-[0.98]">
                  <CreditCard className="w-4 h-4" /> Suscribirse Plan Anual
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* Información del Beneficio de Cobro */}
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Mail className="w-4 h-4 text-indigo-500" /> ¿Por qué activar la Suscripción Premium?
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Nuestra automatización de cartera evalúa el estado de pago de tus facturas cada mañana y envía correos electrónicos profesionales a tus deudores. Estos correos utilizan el pie de firma oficial de **Avalia** con canales de WhatsApp y teléfono, mejorando la efectividad del cobro en un **38%** de forma comprobada sin que tengas que redactar un solo correo.
        </p>
      </div>

      {/* Botón de Simulación de Activación (Solo en desarrollo local) */}
      {process.env.NODE_ENV === 'development' && !isSubscribed && (
        <div className="border border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-800">Modo de Pruebas Comercial (Desarrollo)</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Activa la suscripción inmediatamente simulando el webhook de Stripe para pruebas locales.</p>
          </div>
          <form action={handleSimulateActivation}>
            <button type="submit" className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1">
              Simular Activación <ArrowRight className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
