import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../context/LanguageContext';
import { languageOptions } from '../i18n/translations';
import { CalendarRange, Globe, Check } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { language, setLanguage, currentLanguageOption, t, isRtl } = useTranslation();
  const [isLangOpen, setIsLangOpen] = useState(false);

  // Redirect to dashboard if already authenticated
  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-slate-50 relative ${isRtl ? 'font-sans' : ''}`}>
      {/* Top Floating Language Selector */}
      <div className={`absolute top-6 ${isRtl ? 'left-6' : 'right-6'} z-50`}>
        <div className="relative">
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-xs hover:bg-white text-xs font-bold text-slate-700 cursor-pointer transition-all hover:shadow-md"
          >
            <span className="text-base">{currentLanguageOption.flag}</span>
            <span className="font-semibold">{currentLanguageOption.name}</span>
            <Globe className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isLangOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsLangOpen(false)} />
              <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-44 bg-white border border-slate-100 rounded-xl shadow-xl z-50 p-1 space-y-0.5 animate-in fade-in slide-in-from-top-2 duration-200`}>
                {languageOptions.map((opt) => (
                  <button
                    key={opt.code}
                    onClick={() => {
                      setLanguage(opt.code);
                      setIsLangOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                      language === opt.code
                        ? 'bg-brand-50 text-brand-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{opt.flag}</span>
                      <span>{opt.name}</span>
                    </div>
                    {language === opt.code && <Check className="w-3.5 h-3.5 text-brand-600" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Visual Branding Section - Hidden on Mobile */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Abstract Background Accents */}
        <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full bg-brand-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[100px]" />

        {/* Top Logo */}
        <div className="flex items-center gap-2.5 z-10">
          <div className="bg-brand-600 p-2 rounded-xl shadow-lg">
            <CalendarRange className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            SmartLeave
          </span>
        </div>

        {/* Testimonial / Value Prop */}
        <div className="z-10 max-w-lg mb-12">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
            {t('auth_brand_subtitle', 'Enterprise Leave Management')}
          </span>
          <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight mt-3 text-white">
            {t('auth_brand_title', 'Modernizing company culture through simplified workflows.')}
          </h1>
          <p className="text-slate-400 text-sm mt-4 leading-relaxed">
            {t('auth_brand_desc', 'Manage employee absences, streamline team calendars, and automate leave approvals with a premium enterprise SaaS dashboard.')}
          </p>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-500 z-10 flex justify-between">
          <span>&copy; {new Date().getFullYear()} SmartLeave Inc.</span>
          <span>{t('auth_all_rights_reserved', 'All rights reserved.')}</span>
        </div>
      </div>

      {/* Auth Content Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 relative pt-20 md:pt-12">
        <div className={`absolute top-6 ${isRtl ? 'right-6' : 'left-6'} md:hidden flex items-center gap-2`}>
          <div className="bg-brand-600 p-1.5 rounded-lg">
            <CalendarRange className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-slate-800 tracking-tight">SmartLeave</span>
        </div>

        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
export default AuthLayout;
