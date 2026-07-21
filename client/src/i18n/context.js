import { createContext, useContext } from 'react'
import { DEFAULT_LANG, makeT } from './translate.js'

// The i18n context. Its default value is English-backed, so components rendered
// WITHOUT an <I18nProvider> (e.g. in unit tests) still get working English
// strings and don't need to be wrapped. No React component is exported here, so
// this stays a plain module (keeps fast-refresh lint happy).
export const I18nContext = createContext({
  lang: DEFAULT_LANG,
  setLang: () => {},
  t: makeT(DEFAULT_LANG),
})

// Hook: returns { lang, setLang, t }.
export const useI18n = () => useContext(I18nContext)
