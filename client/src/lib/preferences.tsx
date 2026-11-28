import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { dictionaries, isLang, type Lang, type TextKey } from './i18n';

type Preferences = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TextKey) => string;
  dark: boolean;
  toggleTheme: () => void;
};

const Context = createContext<Preferences | null>(null);

// localStorage может быть недоступен (например, в приватном режиме).
const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const save = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* выбор просто не сохранится */
  }
};

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = read('staybook.lang');
    return isLang(saved) ? saved : 'ru';
  });
  // Начальную тему уже выставил public/theme-init.js.
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

  const t = (key: TextKey) => dictionaries[lang][key];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = dictionaries[lang].pageTitle;
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const setLang = (next: Lang) => {
    setLangState(next);
    save('staybook.lang', next);
  };
  // Тему запоминаем только после явного выбора, до этого следуем настройке системы.
  const toggleTheme = () => {
    setDark(!dark);
    save('staybook.theme', dark ? 'light' : 'dark');
  };

  return <Context.Provider value={{ lang, setLang, t, dark, toggleTheme }}>{children}</Context.Provider>;
}

export function usePreferences(): Preferences {
  const value = useContext(Context);
  if (!value) throw new Error('Нужен PreferencesProvider');
  return value;
}
