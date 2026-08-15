import { defineStore } from 'pinia'
import { ref } from 'vue'

interface Settings {
  notifications: boolean
  language: 'es' | 'en'
  theme: 'light' | 'dark'
  marketingEmails: boolean
}

const defaultSettings: Settings = {
  notifications: true,
  language: 'es',
  theme: 'light',
  marketingEmails: false,
}

const STORAGE_KEY = 'intimas_app_settings'

function loadFromStorage(): Settings {
  if (typeof window === 'undefined') return defaultSettings
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultSettings
    return { ...defaultSettings, ...JSON.parse(raw) }
  } catch {
    return defaultSettings
  }
}

function persist(settings: Settings) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore quota errors
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings>(loadFromStorage())

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    settings.value[key] = value
    persist(settings.value)
  }

  function reset() {
    settings.value = { ...defaultSettings }
    persist(settings.value)
  }

  return { settings, update, reset }
})
