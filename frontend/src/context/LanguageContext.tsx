import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, languageOptions, type Language, type LanguageOption } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currentLanguageOption: LanguageOption;
  t: (key: string, defaultText?: string) => string;
  tRole: (role?: string | null) => string;
  tType: (type?: string | null) => string;
  tStatus: (status?: string | null) => string;
  isRtl: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('smartleave_lang') as Language;
    return saved && translations[saved] ? saved : 'en';
  });

  const currentLanguageOption = languageOptions.find((opt) => opt.code === language) || languageOptions[0];
  const isRtl = currentLanguageOption.dir === 'rtl';

  useEffect(() => {
    localStorage.setItem('smartleave_lang', language);
    document.documentElement.lang = language;
    document.documentElement.dir = currentLanguageOption.dir;
  }, [language, currentLanguageOption]);

  const setLanguage = (lang: Language) => {
    if (translations[lang]) {
      setLanguageState(lang);
    }
  };

  const t = (key: string, defaultText?: string): string => {
    const langDict = translations[language] || translations.en;
    if (langDict[key]) {
      return langDict[key];
    }
    const fallbackDict = translations.en;
    if (fallbackDict[key]) {
      return fallbackDict[key];
    }
    return defaultText || key;
  };

  const tRole = (role?: string | null): string => {
    if (!role) return '';
    const normalized = role.toLowerCase().trim();
    if (normalized === 'admin') return t('role_admin', 'Admin');
    if (normalized === 'hr') return t('role_hr', 'HR Staff');
    if (normalized === 'manager') return t('role_manager', 'Manager');
    if (normalized === 'employee') return t('role_employee', 'Employee');
    return t(`role_${normalized}`, role);
  };

  const tType = (type?: string | null): string => {
    if (!type) return '';
    const normalized = type.toLowerCase().replace(/[^a-z]/g, '');
    if (normalized === 'fulltime') return t('type_full_time', 'Full-time');
    if (normalized === 'parttime') return t('type_part_time', 'Part-time');
    if (normalized === 'contractor') return t('type_contractor', 'Contractor');
    if (normalized === 'intern') return t('type_intern', 'Intern');
    return t(`type_${normalized}`, type);
  };

  const tStatus = (status?: string | null): string => {
    if (!status) return '';
    const normalized = status.toLowerCase().trim();
    if (normalized === 'active') return t('status_active', 'Active');
    if (normalized === 'inactive') return t('status_inactive', 'Inactive');
    if (normalized === 'pending') return t('status_pending', 'Pending');
    if (normalized === 'approved') return t('status_approved', 'Approved');
    if (normalized === 'rejected') return t('status_rejected', 'Rejected');
    if (normalized === 'cancelled') return t('status_cancelled', 'Cancelled');
    return t(`status_${normalized}`, status);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currentLanguageOption, t, tRole, tType, tStatus, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
