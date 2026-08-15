export interface MoodOption {
  id: string
  label: string
  emoji: string
  colorClass: string
}

export const MOODS: MoodOption[] = [
  { id: 'feliz', label: 'Feliz', emoji: '😊', colorClass: 'text-amber-600 bg-amber-500/10 border-amber-500/30' },
  { id: 'motivada', label: 'Motivada', emoji: '🔥', colorClass: 'text-rose-600 bg-rose-500/10 border-rose-500/30' },
  { id: 'inspirada', label: 'Inspirada', emoji: '✨', colorClass: 'text-amber-600 bg-amber-400/10 border-amber-400/30' },
  { id: 'amorosa', label: 'Amorosa', emoji: '💖', colorClass: 'text-pink-600 bg-pink-500/10 border-pink-500/30' },
  { id: 'radiante', label: 'Radiante', emoji: '🌟', colorClass: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/30' },
  { id: 'fuerte', label: 'Fuerte', emoji: '💪', colorClass: 'text-purple-600 bg-purple-500/10 border-purple-500/30' },
  { id: 'agradecida', label: 'Agradecida', emoji: '🙏', colorClass: 'text-teal-600 bg-teal-500/10 border-teal-500/30' },
  { id: 'encantada', label: 'Encantada', emoji: '🥰', colorClass: 'text-rose-600 bg-rose-500/10 border-rose-500/30' },
  { id: 'tranquila', label: 'Tranquila', emoji: '😌', colorClass: 'text-cyan-600 bg-cyan-500/10 border-cyan-500/30' },
]
