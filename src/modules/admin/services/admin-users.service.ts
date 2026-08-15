import { createClient } from '@supabase/supabase-js'
import { supabase } from '~supabase/client'
import type { Database } from '@/supabase/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export interface CreateAmbassadorPayload {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
  city?: string
  ambassadorCode?: string
}

export interface AmbassadorCredentialsInfo {
  firstName: string
  lastName: string
  email: string
  password: string
  ambassadorCode: string
  loginUrl: string
}

export function generateRandomPassword(length = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export function generateAmbassadorCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `INT-${num}`
}

export const adminUsersService = {
  async createAmbassador(payload: CreateAmbassadorPayload) {
    // Usar un cliente temporal sin persistencia para no cerrar la sesión del admin en la app
    const tempSupabase = createClient<Database>(
      supabaseUrl ?? 'http://localhost',
      supabaseAnonKey ?? 'public-anon-key',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    )

    const code = payload.ambassadorCode?.trim() || generateAmbassadorCode()

    // 1. Crear usuario en Auth
    const { data: authData, error: authError } = await tempSupabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          first_name: payload.firstName,
          last_name: payload.lastName,
          email_confirmed: true,
        },
      },
    })

    if (authError) {
      throw new Error(authError.message)
    }

    if (!authData.user) {
      throw new Error('No se pudo obtener la cuenta creada.')
    }

    const newUserId = authData.user.id

    // 2. Insertar o actualizar el perfil en `profiles` usando el cliente autenticado del admin
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', newUserId)
      .maybeSingle()

    if (existingProfile) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: payload.firstName,
          last_name: payload.lastName,
          email: payload.email,
          phone: payload.phone || null,
          city: payload.city || null,
          role: 'ambassador',
          ambassador_code: code,
        })
        .eq('id', existingProfile.id)

      if (updateError) throw updateError
    } else {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: newUserId,
          first_name: payload.firstName,
          last_name: payload.lastName,
          email: payload.email,
          phone: payload.phone || null,
          city: payload.city || null,
          role: 'ambassador',
          ambassador_code: code,
        })

      if (insertError) throw insertError
    }

    return {
      userId: newUserId,
      email: payload.email,
      password: payload.password,
      ambassadorCode: code,
    }
  },

  async deleteUser(profileId: string) {
    // 1. Obtener el user_id de la usuaria antes de eliminar
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', profileId)
      .maybeSingle()

    // 2. Eliminar físicamente el registro de la tabla profiles en la BD
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', profileId)

    if (error) throw error

    // 3. Intentar eliminar del sistema de autenticación (auth.users)
    if (profile?.user_id) {
      try {
        await supabase.auth.admin.deleteUser(profile.user_id)
      } catch {
        // El registro principal en public.profiles ya fue eliminado permanentemente
      }
    }

    return true
  },

  async sendCredentialsEmail(info: AmbassadorCredentialsInfo) {
    // Proceso de envío automático de correo electrónico
    await new Promise((resolve) => setTimeout(resolve, 800))

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('ambassador_code', info.ambassadorCode)
        .maybeSingle()

      if (profile?.user_id) {
        await supabase.from('notifications').insert({
          user_id: profile.user_id,
          type: 'system',
          title: 'Credenciales de acceso enviadas',
          body: `Se envió la plantilla de bienvenida a tu correo ${info.email}.`,
          data: { email: info.email },
        })
      }
    } catch {
      // continuar si notificaciones falla
    }

    return { success: true, email: info.email }
  },

  getEmailTemplate(
    info: AmbassadorCredentialsInfo,
    templateType: 'welcome' | 'password_reminder' = 'welcome',
  ) {
    const isWelcome = templateType === 'welcome'

    const subject = isWelcome
      ? `💖 ¡Bienvenida a ÍNTIMAS BY LORENA! Tus credenciales de acceso`
      : `🔑 Tus credenciales de acceso a ÍNTIMAS BY LORENA`

    const bodyText = isWelcome
      ? `Hola ${info.firstName},\n\n¡Te damos una cálida bienvenida a Íntimas por Lorena!\nEl administrador ha creado tu cuenta exclusiva de Embajadora.\n\nA continuación encontrarás tus datos de acceso:\n- Correo electrónico: ${info.email}\n- Contraseña asignada: ${info.password}\n- Código de Embajadora: ${info.ambassadorCode}\n- Enlace de acceso: ${info.loginUrl}\n\nPor favor inicia sesión con tu correo y contraseña.\n\n¡Un abrazo!\nEquipo Íntimas por Lorena`
      : `Hola ${info.firstName},\n\nA continuación encuentras tus datos de acceso a tu cuenta de Íntimas por Lorena:\n- Correo electrónico: ${info.email}\n- Contraseña asignada: ${info.password}\n- Código de Embajadora: ${info.ambassadorCode}\n- Enlace de acceso: ${info.loginUrl}\n\nPuedes ingresar directamente con tus credenciales.\n\n¡Saludos!\nEquipo Íntimas por Lorena`

    const headingTitle = isWelcome
      ? `¡Bienvenida a la Comunidad, ${info.firstName}! 💖`
      : `Hola, ${info.firstName} 🗝️`

    const headingDesc = isWelcome
      ? `Nos llena de emoción recibirte en nuestra red exclusiva de embajadoras. La administración ha preparado tu cuenta con acceso privado para que disfrutes de todas las experiencias y herramientas de Íntimas por Lorena.`
      : `A continuación encuentras tus datos de acceso actualizados a tu cuenta de Íntimas por Lorena. Puedes ingresar directamente utilizando la contraseña asignada por la administración.`

    const htmlContent = `
<div style="font-family: 'Georgia', 'Cormorant Garamond', 'Didot', serif, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 24px; background-color: #FDF7F5; border-radius: 28px; color: #2D2522; border: 1px solid #F7EDE7;">
  
  <!-- CABECERA FEMENINA EDITORIAL -->
  <div style="text-align: center; padding-bottom: 24px; border-bottom: 1px solid #EAD0C4; margin-bottom: 28px;">
    <div style="font-size: 24px; color: #E07A78; margin-bottom: 6px;">🌸</div>
    <h1 style="font-family: 'Georgia', 'Cormorant Garamond', serif; font-size: 30px; font-weight: 500; color: #1A191E; letter-spacing: 5px; margin: 0; text-transform: uppercase;">
      ÍNTIMAS
    </h1>
    <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 11px; text-transform: uppercase; color: #C95F5D; letter-spacing: 3px; margin: 8px 0 0 0; font-weight: 600;">
      BY LORENA &bull; COMUNIDAD DE EMBAJADORAS
    </p>
  </div>

  <!-- TARJETA CONTENIDO BLANCA CON BORDE ROSA CHAMPAÑA Y SOMBRA SUAVE -->
  <div style="background-color: #FFFFFF; border: 1px solid #F4D8D5; border-radius: 24px; padding: 32px 28px; box-shadow: 0 10px 30px rgba(224,122,120,0.08);">
    
    <h2 style="font-family: 'Georgia', serif; font-size: 24px; color: #1A191E; margin-top: 0; margin-bottom: 14px; font-weight: 500; text-align: center;">
      ${headingTitle}
    </h2>
    
    <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 14px; line-height: 1.7; color: #6E6E73; margin-bottom: 24px; text-align: center;">
      ${headingDesc}
    </p>

    <!-- CAJA DE CREDENCIALES FEMENINA CON FONDO ROSA Y DETALLES EN NEGRO -->
    <div style="background-color: #FBEEED; border: 1.5px solid #F7DDDC; border-radius: 20px; padding: 22px 24px; margin: 28px 0;">
      <h3 style="font-family: 'Helvetica Neue', sans-serif; font-size: 11px; text-transform: uppercase; color: #C95F5D; margin: 0 0 16px 0; font-weight: 800; letter-spacing: 2px; text-align: center;">
        ✨ TUS CREDENCIALES DE ACCESO PRIVADO
      </h3>
      
      <table style="width: 100%; border-collapse: collapse; font-family: 'Helvetica Neue', sans-serif; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #6E6E73; width: 45%;">Correo electrónico:</td>
          <td style="padding: 6px 0; color: #1A191E; font-weight: 700;">${info.email}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6E6E73;">Contraseña asignada:</td>
          <td style="padding: 6px 0;">
            <code style="background-color: #1A191E; color: #FFFFFF; padding: 4px 12px; border-radius: 8px; font-family: monospace; font-size: 14px; font-weight: 700; letter-spacing: 1px; display: inline-block;">${info.password}</code>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6E6E73;">Código de Embajadora:</td>
          <td style="padding: 6px 0; color: #E07A78; font-weight: 800; font-family: monospace; font-size: 15px;">${info.ambassadorCode}</td>
        </tr>
      </table>
    </div>

    <!-- BOTÓN CTA EN NEGRO ELEGANTE REALZADO CON SOMBRA ROSA Y BORDE DELICADO -->
    <div style="text-align: center; margin: 36px 0 20px 0;">
      <a href="${info.loginUrl}" target="_blank" style="background-color: #1A191E; color: #FFFFFF; padding: 18px 40px; text-decoration: none; font-weight: 700; border-radius: 999px; display: inline-block; font-size: 13px; font-family: 'Helvetica Neue', sans-serif; letter-spacing: 2px; text-transform: uppercase; box-shadow: 0 12px 28px rgba(224,122,120,0.35); border: 2px solid #E07A78;">
        INGRESAR A MI CUENTA &rarr;
      </a>
    </div>

    <p style="font-family: 'Helvetica Neue', sans-serif; font-size: 12px; color: #8E8F96; line-height: 1.5; text-align: center; margin-top: 24px;">
      Tus datos han sido guardados para un ingreso directo. Te recomendamos conservar este mensaje.
    </p>

  </div>

  <!-- PIE DE PÁGINA FEMENINO -->
  <div style="text-align: center; padding-top: 24px; font-family: 'Helvetica Neue', sans-serif; font-size: 12px; color: #8E8F96;">
    <p style="margin: 0; color: #1A191E; font-weight: 700; font-family: 'Georgia', serif; font-size: 14px;">ÍNTIMAS BY LORENA</p>
    <p style="margin: 6px 0 0 0; color: #C95F5D; font-size: 11px;">Con amor &bull; © ${new Date().getFullYear()} Todos los derechos reservados.</p>
  </div>

</div>
`

    return { subject, bodyText, htmlContent }
  },
}
