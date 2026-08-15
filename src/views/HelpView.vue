<script setup lang="ts">
import { ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { supabase } from '~supabase/client'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'

const search = ref('')

const { data: faqs } = useQuery({
  queryKey: ['help', 'faqs'],
  queryFn: async () => {
    const { data, error } = await supabase.from('help_faqs').select('*').order('order', { ascending: true })
    if (error) throw error
    return data ?? []
  },
})

const { data: articles } = useQuery({
  queryKey: ['help', 'articles'],
  queryFn: async () => {
    const { data, error } = await supabase.from('help_articles').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  },
})

const openFaq = ref<string | null>(null)
function toggle(id: string) {
  openFaq.value = openFaq.value === id ? null : id
}

const filteredFaqs = (faqs.value ?? []).filter((f) =>
  !search.value || f.question.toLowerCase().includes(search.value.toLowerCase()),
)
</script>

<template>
  <AppTopBar title="Centro de ayuda" />

  <div class="space-y-6">
    <AppSearch v-model="search" placeholder="Buscar en preguntas frecuentes..." />

    <section>
      <h2 class="text-title font-semibold mb-3">Preguntas frecuentes</h2>
      <div v-if="filteredFaqs.length === 0" class="text-center py-6 text-text-secondary text-small">
        No encontramos coincidencias.
      </div>
      <div class="rounded-lg bg-surface shadow-elevation1 overflow-hidden divide-y divide-divider">
        <div v-for="f in filteredFaqs" :key="f.id">
          <button
            class="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-background transition-colors"
            :aria-expanded="openFaq === f.id"
            @click="toggle(f.id)"
          >
            <span class="text-small font-medium text-text-primary flex-1">{{ f.question }}</span>
            <ChevronDownIcon
              :class="['shrink-0 w-4 h-4 transition-transform', openFaq === f.id ? 'rotate-180' : '']"
            />
          </button>
          <div v-if="openFaq === f.id" class="px-4 pb-4 text-small text-text-secondary whitespace-pre-wrap">
            {{ f.answer }}
          </div>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-title font-semibold mb-3">Tutoriales</h2>
      <div v-if="!articles || articles.length === 0" class="text-center py-6 text-text-secondary text-small">
        Próximamente publicaremos tutoriales.
      </div>
      <div v-else class="space-y-3">
        <article v-for="a in articles" :key="a.id" class="p-4 rounded-lg bg-surface shadow-elevation1">
          <h3 class="text-small font-semibold text-text-primary">{{ a.title }}</h3>
          <p class="text-caption text-text-secondary mt-1">{{ a.category }}</p>
          <p class="text-small text-text-secondary mt-2 line-clamp-3">{{ a.content }}</p>
        </article>
      </div>
    </section>

    <section class="p-5 rounded-lg bg-gradient-to-br from-secondary-100 to-accent-50 text-center">
      <h3 class="text-subtitle font-semibold text-text-primary">¿Necesitas más ayuda?</h3>
      <p class="text-small text-text-secondary mt-1 mb-4">Escríbenos y te responderemos pronto.</p>
      <a
        href="mailto:soporte@intimas.app"
        class="inline-flex items-center justify-center h-11 px-6 rounded-pill bg-primary text-white font-semibold hover:bg-primary-700 transition-colors"
      >
        Contactar soporte
      </a>
    </section>
  </div>
</template>
