import { useTranslation } from 'react-i18next';
import { supportedLanguages } from '@/i18n';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      style={{
        padding: '3px 6px',
        fontSize: 'var(--font-size-sm)',
        border: '1px solid #d1d5db',
        borderRadius: 4,
        background: '#fff',
        cursor: 'pointer',
        color: '#64748b',
      }}
      title="Language"
    >
      {supportedLanguages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.label}
        </option>
      ))}
    </select>
  );
}
