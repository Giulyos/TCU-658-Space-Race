// Pure i18n logic (no React) — safe to import anywhere and unit-test directly.
// Language preference is persisted in localStorage, mirroring the mute-preference
// pattern in sound/sounds.js.
import en from './en.js'
import es from './es.js'

export const LANG_KEY = 'spacerace:lang'
export const DEFAULT_LANG = 'en'
export const SUPPORTED = ['en', 'es']

const CATALOGS = { en, es }

export const getLang = () => {
  try {
    const v = localStorage.getItem(LANG_KEY)
    return SUPPORTED.includes(v) ? v : DEFAULT_LANG
  } catch {
    return DEFAULT_LANG
  }
}

export const setLangPref = (lang) => {
  try {
    localStorage.setItem(LANG_KEY, SUPPORTED.includes(lang) ? lang : DEFAULT_LANG)
  } catch {
    // ignore storage failures (private mode, etc.) — language just won't persist
  }
}

const interpolate = (str, vars) =>
  String(str).replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? String(vars[k]) : m))

// Translate a key for a language. Falls back es -> en -> the key itself. Plural
// entries ({ one, other }) are selected by vars.count. {var} placeholders are
// interpolated from vars.
export const translate = (lang, key, vars) => {
  const entry = CATALOGS[lang]?.[key] ?? CATALOGS[DEFAULT_LANG][key] ?? key
  const str = entry && typeof entry === 'object' ? (vars?.count === 1 ? entry.one : entry.other) : entry
  return interpolate(str ?? key, vars)
}

// Bind translate() to a language, yielding a t(key, vars) function.
export const makeT = (lang) => (key, vars) => translate(lang, key, vars)
