export interface PostBgPreset {
  id: string
  name: string
  class: string
  textColor: string
  previewGradient: string
}

export const POST_BG_PRESETS: PostBgPreset[] = [
  {
    id: 'none',
    name: 'Estándar',
    class: '',
    textColor: 'text-text-primary',
    previewGradient: 'bg-surface border border-divider',
  },
  {
    id: 'intimas',
    name: 'ÍNTIMAS Rose',
    class: 'bg-gradient-to-br from-[#E07A78] via-[#E88E8C] to-[#F4D8D5]',
    textColor: 'text-white font-extrabold text-h3 text-center tracking-tight drop-shadow-sm',
    previewGradient: 'bg-gradient-to-br from-[#E07A78] via-[#E88E8C] to-[#F4D8D5]',
  },
  {
    id: 'blush',
    name: 'Rubor Nude',
    class: 'bg-gradient-to-br from-[#F4D8D5] via-[#EAD0C4] to-[#F7DDDC]',
    textColor: 'text-[#3D1E24] font-extrabold text-h3 text-center tracking-tight',
    previewGradient: 'bg-gradient-to-br from-[#F4D8D5] via-[#EAD0C4] to-[#F7DDDC]',
  },
  {
    id: 'velvet',
    name: 'Bordó Elegante',
    class: 'bg-gradient-to-br from-[#4A1729] via-[#661E37] to-[#8C2C4A]',
    textColor: 'text-white font-extrabold text-h3 text-center tracking-tight drop-shadow-md',
    previewGradient: 'bg-gradient-to-br from-[#4A1729] via-[#661E37] to-[#8C2C4A]',
  },
  {
    id: 'sunset',
    name: 'Atardecer Coral',
    class: 'bg-gradient-to-br from-[#E07A78] via-[#E48B7B] to-[#F2B59C]',
    textColor: 'text-white font-extrabold text-h3 text-center tracking-tight drop-shadow-sm',
    previewGradient: 'bg-gradient-to-br from-[#E07A78] via-[#E48B7B] to-[#F2B59C]',
  },
  {
    id: 'sage',
    name: 'Menta Eucalipto',
    class: 'bg-gradient-to-br from-[#507D67] via-[#6A9A82] to-[#92BAA5]',
    textColor: 'text-white font-extrabold text-h3 text-center tracking-tight drop-shadow-sm',
    previewGradient: 'bg-gradient-to-br from-[#507D67] via-[#6A9A82] to-[#92BAA5]',
  },
  {
    id: 'champagne',
    name: 'Champagne Nude',
    class: 'bg-gradient-to-br from-[#C99878] via-[#DDB5A4] to-[#EAD0C4]',
    textColor: 'text-white font-extrabold text-h3 text-center tracking-tight drop-shadow-sm',
    previewGradient: 'bg-gradient-to-br from-[#C99878] via-[#DDB5A4] to-[#EAD0C4]',
  },
  {
    id: 'midnight',
    name: 'Noche Íntimas',
    class: 'bg-gradient-to-br from-[#2C131A] via-[#3E1624] to-[#591D32]',
    textColor: 'text-[#F4D8D5] font-extrabold text-h3 text-center tracking-tight drop-shadow-md',
    previewGradient: 'bg-gradient-to-br from-[#2C131A] via-[#3E1624] to-[#591D32]',
  },
]

export function parsePostBg(rawContent: string): { bgId: string; text: string; preset: PostBgPreset } {
  const match = rawContent.match(/^\[bg:([a-z0-9_-]+)\]\s*/i)
  if (match && match[1]) {
    const bgId = match[1]
    const preset = POST_BG_PRESETS.find((p) => p.id === bgId) ?? POST_BG_PRESETS.find((p) => p.id === 'intimas') ?? POST_BG_PRESETS[0]
    return {
      bgId,
      text: rawContent.slice(match[0].length),
      preset,
    }
  }
  return { bgId: 'none', text: rawContent, preset: POST_BG_PRESETS[0] }
}
