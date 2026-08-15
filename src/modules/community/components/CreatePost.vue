<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCreatePost } from '@modules/community/composables/useCommunity'
import { postSchema } from '@modules/community/validators/community.schema'
import { useUiStore } from '@stores/ui.store'
import { useAuthStore } from '@stores/auth.store'
import {
  PaperAirplaneIcon,
  FaceSmileIcon,
  SwatchIcon,
  GlobeAmericasIcon,
  UserGroupIcon,
  LockClosedIcon,
  ChevronDownIcon,
  CheckIcon,
} from '@heroicons/vue/24/outline'
import { MOODS } from '@modules/community/constants/moods'
import { POST_BG_PRESETS, type PostBgPreset } from '@modules/community/constants/presets'
import AppAvatar from '@components/base/AppAvatar.vue'
import AppButton from '@components/base/AppButton.vue'
import MoodEmojiIcon from './MoodEmojiIcon.vue'

const emit = defineEmits<{ created: [] }>()

const auth = useAuthStore()
const ui = useUiStore()
const createPost = useCreatePost()

const content = ref('')
const mood = ref<string | null>(null)
const selectedBg = ref<PostBgPreset>(POST_BG_PRESETS[0])
const visibility = ref<'public' | 'ambassadors' | 'private'>('ambassadors')
const error = ref('')

const selectedMoodObj = computed(() => MOODS.find((m) => m.emoji === mood.value || m.label === mood.value || m.id === mood.value))

const showMoodPicker = ref(false)
const showBgPicker = ref(false)

const isVisibilityOpen = ref(false)
const visibilityMenuRef = ref<HTMLElement | null>(null)

const visibilityOptions = [
  { value: 'ambassadors' as const, label: 'Comunidad Embajadoras', description: 'Exclusivo para la red de embajadoras', icon: UserGroupIcon },
  { value: 'public' as const, label: 'Pública', description: 'Visible para todas las usuarias', icon: GlobeAmericasIcon },
  { value: 'private' as const, label: 'Privada (Solo yo)', description: 'Visible únicamente para ti', icon: LockClosedIcon },
]

const currentVisibilityObj = computed(() =>
  visibilityOptions.find((o) => o.value === visibility.value) ?? visibilityOptions[0]
)

function selectVisibility(val: 'ambassadors' | 'public' | 'private') {
  visibility.value = val
  isVisibilityOpen.value = false
}

function handleClickOutside(e: MouseEvent) {
  if (visibilityMenuRef.value && !visibilityMenuRef.value.contains(e.target as Node)) {
    isVisibilityOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Dinámica de límite de caracteres y escala de fuente
const maxChars = computed(() => (selectedBg.value.id !== 'none' ? 220 : 1000))
const charsLeft = computed(() => maxChars.value - content.value.length)

const dynamicBgFontSize = computed(() => {
  const len = content.value.length
  if (len < 50) return 'text-h2 font-editorial font-bold'
  if (len < 110) return 'text-h3 font-editorial font-bold'
  if (len < 170) return 'text-title font-editorial font-semibold'
  return 'text-body font-sans font-medium'
})

function selectMood(mId: string) {
  mood.value = mood.value === mId ? null : mId
  showMoodPicker.value = false
}

async function submit() {
  error.value = ''
  let fullContent = content.value.trim()
  if (selectedBg.value.id !== 'none') {
    fullContent = `[bg:${selectedBg.value.id}] ${fullContent}`
  }

  const result = postSchema.safeParse({ content: fullContent, visibility: visibility.value })
  if (!result.success) {
    error.value = result.error.errors[0]?.message ?? 'Error de validación'
    return
  }

  try {
    await createPost.mutateAsync({
      content: fullContent,
      mood: mood.value ?? undefined,
      visibility: visibility.value,
    })
    content.value = ''
    mood.value = null
    selectedBg.value = POST_BG_PRESETS[0]
    showMoodPicker.value = false
    showBgPicker.value = false
    ui.pushToast({ title: 'Publicación creada', variant: 'success' })
    emit('created')
  } catch (err: any) {
    error.value = err.message ?? 'Error al crear la publicación'
  }
}
</script>

<template>
  <form
    class="p-4 rounded-2xl bg-surface border border-divider shadow-sm transition-all"
    @submit.prevent="submit"
  >
    <!-- Header: User Avatar + Name + Custom Floating Visibility Selector -->
    <div class="flex items-center justify-between gap-3 mb-3">
      <div class="flex items-center gap-2.5">
        <AppAvatar
          :src="auth.profile?.photoUrl"
          :name="`${auth.profile?.firstName ?? ''} ${auth.profile?.lastName ?? ''}`"
          size="sm"
        />
        <div>
          <p class="text-caption font-bold text-text-primary">
            {{ auth.profile?.firstName }} {{ auth.profile?.lastName }}
          </p>

          <!-- Custom Popover Menu de Visibilidad -->
          <div ref="visibilityMenuRef" class="relative inline-block mt-0.5">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill bg-blush/60 hover:bg-blush text-accent text-[11px] font-bold transition-all active:scale-95 border border-accent/20"
              @click="isVisibilityOpen = !isVisibilityOpen"
            >
              <component :is="currentVisibilityObj.icon" class="w-3.5 h-3.5 shrink-0 text-accent" />
              <span>{{ currentVisibilityObj.label }}</span>
              <ChevronDownIcon class="w-3 h-3 text-accent/80 shrink-0" />
            </button>

            <!-- Menú Popover Desplegable -->
            <div
              v-if="isVisibilityOpen"
              class="absolute left-0 top-full mt-1.5 w-60 p-1.5 rounded-2xl bg-surface border border-divider shadow-elevation3 z-50 animate-in fade-in zoom-in-95 duration-150"
            >
              <div class="px-2.5 py-1 text-[10px] font-extrabold text-text-secondary uppercase tracking-wider">
                Audiencia de publicación
              </div>
              <button
                v-for="opt in visibilityOptions"
                :key="opt.value"
                type="button"
                class="w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between text-caption transition-colors gap-2"
                :class="visibility === opt.value ? 'bg-blush/70 text-accent font-bold' : 'hover:bg-background text-text-primary'"
                @click="selectVisibility(opt.value)"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <component :is="opt.icon" class="w-4 h-4 shrink-0" :class="visibility === opt.value ? 'text-accent' : 'text-text-secondary'" />
                  <div class="min-w-0">
                    <div class="text-[12px] leading-snug font-bold truncate">{{ opt.label }}</div>
                    <div class="text-[10px] text-text-secondary font-medium leading-tight truncate">{{ opt.description }}</div>
                  </div>
                </div>
                <CheckIcon v-if="visibility === opt.value" class="w-4 h-4 text-accent shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Selected mood indicator badge -->
      <span
        v-if="selectedMoodObj"
        class="px-2.5 py-1 rounded-full text-caption font-bold flex items-center gap-1.5 border"
        :class="selectedMoodObj.colorClass"
      >
        <MoodEmojiIcon :name="selectedMoodObj.id" size="sm" />
        <span>Me siento {{ selectedMoodObj.label }}</span>
      </span>
    </div>

    <!-- Textarea Canvas (Con Preview de Fondo Degradado si está seleccionado) -->
    <div
      class="relative rounded-2xl transition-all duration-300 overflow-hidden"
      :class="selectedBg.id !== 'none' ? `${selectedBg.class} p-6 sm:p-8 min-h-[180px] shadow-inner flex flex-col items-center justify-center` : 'bg-transparent min-h-[70px] block'"
    >
      <textarea
        v-model="content"
        rows="2"
        :maxlength="maxChars"
        placeholder="¿Qué tienes en mente hoy?"
        class="w-full bg-transparent resize-none focus:outline-none transition-all"
        :class="
          selectedBg.id !== 'none'
            ? 'text-white text-center drop-shadow-md my-auto self-center ' + dynamicBgFontSize
            : 'text-body text-text-primary placeholder:text-text-secondary/60 text-left'
        "
      />
    </div>

    <!-- Indicador de Caracteres Restantes -->
    <div class="flex justify-end mt-1 px-1">
      <span
        class="text-[11px] font-semibold transition-colors"
        :class="charsLeft < 20 ? 'text-error font-bold' : 'text-text-secondary/60'"
      >
        {{ content.length }}/{{ maxChars }}
      </span>
    </div>

    <p v-if="error" class="mt-2 text-caption text-error font-semibold">{{ error }}</p>

    <!-- Toolbar: Mood + Background selector + Submit -->
    <div class="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-divider">
      <div class="flex items-center gap-1.5">
        <!-- Mood Trigger Button -->
        <button
          type="button"
          class="px-3 py-1.5 rounded-full text-caption font-bold flex items-center gap-1.5 transition-all border active:scale-95"
          :class="showMoodPicker ? 'bg-accent/15 text-accent border-accent/40' : 'bg-background hover:bg-surface text-text-secondary border-divider'"
          @click="showMoodPicker = !showMoodPicker; showBgPicker = false"
        >
          <FaceSmileIcon class="w-4 h-4 text-accent" />
          <span>Estado de ánimo</span>
        </button>

        <!-- Background Preset Trigger Button -->
        <button
          type="button"
          class="px-3 py-1.5 rounded-full text-caption font-bold flex items-center gap-1.5 transition-all border active:scale-95"
          :class="selectedBg.id !== 'none' ? 'bg-accent text-white border-accent' : showBgPicker ? 'bg-accent/15 text-accent border-accent/40' : 'bg-background hover:bg-surface text-text-secondary border-divider'"
          @click="showBgPicker = !showBgPicker; showMoodPicker = false"
        >
          <SwatchIcon class="w-4 h-4" />
          <span>{{ selectedBg.id !== 'none' ? selectedBg.name : 'Fondo con estilo' }}</span>
        </button>
      </div>

      <AppButton
        type="submit"
        :loading="createPost.isPending.value"
        :disabled="!content.trim()"
      >
        <PaperAirplaneIcon class="w-4 h-4 mr-1.5 inline" />
        Publicar
      </AppButton>
    </div>

    <!-- Moods Vector SVG Picker -->
    <div v-if="showMoodPicker" class="mt-3 p-3 rounded-2xl bg-background/80 border border-divider">
      <div class="text-[11px] font-bold text-text-secondary mb-2 uppercase tracking-wider">
        ¿Cómo te sientes hoy?
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="m in MOODS"
          :key="m.id"
          type="button"
          class="px-3 py-1.5 rounded-full text-caption font-bold flex items-center gap-1.5 transition-all border active:scale-95"
          :class="mood === m.id || mood === m.emoji || mood === m.label ? 'bg-accent text-white border-accent shadow-sm' : m.colorClass + ' hover:opacity-80'"
          @click="selectMood(m.id)"
        >
          <MoodEmojiIcon :name="m.id" size="sm" />
          <span>{{ m.label }}</span>
        </button>
      </div>
    </div>

    <!-- Background Presets Selector -->
    <div v-if="showBgPicker" class="mt-3 p-3 rounded-2xl bg-background/80 border border-divider">
      <div class="text-[11px] font-bold text-text-secondary mb-2 uppercase tracking-wider">
        Elige un fondo con estilo:
      </div>
      <div class="flex items-center gap-2.5 overflow-x-auto pb-1">
        <button
          type="button"
          title="Sin fondo (Estándar)"
          class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all active:scale-95"
          :class="selectedBg.id === 'none' ? 'border-accent ring-2 ring-accent/30 bg-surface' : 'border-divider bg-surface hover:border-accent/40'"
          @click="selectedBg = POST_BG_PRESETS[0]"
        >
          <span class="text-caption font-bold text-text-secondary">✕</span>
        </button>

        <button
          v-for="bg in POST_BG_PRESETS.slice(1)"
          :key="bg.id"
          type="button"
          :title="bg.name"
          class="w-8 h-8 rounded-full shrink-0 transition-all active:scale-95 relative"
          :class="[
            bg.previewGradient,
            selectedBg.id === bg.id ? 'ring-2 ring-accent ring-offset-2 scale-110' : 'hover:scale-105 opacity-90 hover:opacity-100'
          ]"
          @click="selectedBg = bg"
        />
      </div>
    </div>
  </form>
</template>
