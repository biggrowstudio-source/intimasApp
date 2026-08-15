import { supabase } from '~supabase/client'

export const MAX_AVATAR_SIZE_BYTES = 3 * 1024 * 1024 // 3 MB

export async function uploadAvatarFile(file: File, userId: string): Promise<string> {
  // 1. Validar tamaño (máximo 3MB)
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1)
    throw new Error(`La foto pesa ${sizeInMb} MB. El límite máximo permitido es de 3 MB.`)
  }

  // 2. Validar tipo de archivo (solo imágenes)
  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se permiten archivos de imagen (JPEG, PNG, WEBP, GIF).')
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpeg'
  const fileName = `avatar_${userId}_${Date.now()}.${ext}`
  const filePath = `user_avatars/${fileName}`

  // 3. Subir al bucket 'avatars'
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    // Si el bucket no existe en Supabase aún, intentar error instructivo o fallback
    if (uploadError.message.includes('bucket not found') || uploadError.message.includes('not found')) {
      throw new Error('El bucket "avatars" no ha sido creado en el panel de Supabase. Por favor ejecuta el script de schema.sql.')
    }
    throw uploadError
  }

  // 4. Obtener URL pública
  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
  return data.publicUrl
}
