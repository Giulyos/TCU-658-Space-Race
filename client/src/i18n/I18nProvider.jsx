import { useCallback, useEffect, useMemo, useState } from 'react'
import { I18nContext } from './context.js'
import { DEFAULT_LANG, SUPPORTED, getLang, makeT, setLangPref } from './translate.js'

// Provides the active language + a bound t() to the tree, and persists the
// choice. The app navigates between screens with full page loads, so the
// provider re-initializes from localStorage on each load; the toggle only needs
// to live on the main menu. Only this component is exported (fast-refresh safe).
export function I18nProvider({ children }) {
  const [lang, setLang] = useState(getLang)

  // Keep <html lang> in sync for accessibility / correctness.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const changeLang = useCallback((next) => {
    const value = SUPPORTED.includes(next) ? next : DEFAULT_LANG
    setLangPref(value)
    setLang(value)
  }, [])

  const value = useMemo(() => ({ lang, setLang: changeLang, t: makeT(lang) }), [lang, changeLang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
