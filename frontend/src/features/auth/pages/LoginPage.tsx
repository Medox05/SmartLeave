import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from '../../../context/LanguageContext';
import { Input, Button } from '../../../components/ui';
import { ShieldAlert } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDeactivated = searchParams.get('deactivated') === '1';
  const [errorMsg, setErrorMsg] = useState<string | null>(
    isDeactivated ? t('auth_account_deactivated', 'Your account has been deactivated. Please contact your administrator.') : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await login(data);
      navigate('/dashboard');
    } catch (err: any) {
      const emailErr = err.response?.data?.errors?.email?.[0];
      const generalMsg = err.response?.data?.message;

      if (emailErr) {
        setErrorMsg(emailErr);
      } else if (generalMsg) {
        setErrorMsg(generalMsg);
      } else if (err.response?.status === 500) {
        setErrorMsg('Database or server error (500). Please check MySQL status.');
      } else if (err.code === 'ECONNABORTED') {
        setErrorMsg('Connection timed out. Please check your network or server.');
      } else {
        setErrorMsg(t('auth_invalid_credentials', 'Invalid login credentials or connection error. Please try again.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2.5">
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
          {t('auth_welcome_back', 'Welcome back')}
        </h2>
        <p className="text-sm text-slate-500">
          {t('auth_login_sub', 'Enter your credentials to access your SmartLeave account')}
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200/60 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-red-800 font-medium leading-relaxed">
            {errorMsg}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label={t('lbl_email', 'Email Address')}
          type="email"
          placeholder={t('ph_email', 'name@company.com')}
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="flex flex-col gap-1.5">
          <Input
            label={t('prof_curr_pass', 'Password')}
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
        </div>

        <div className="flex items-center justify-between mt-1 select-none">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded-md border-slate-300 text-brand-600 focus:ring-brand-500/20 cursor-pointer"
              {...register('remember')}
            />
            <span className="text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors">
              {t('auth_remember_me', 'Remember me')}
            </span>
          </label>

          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors"
          >
            {t('auth_forgot_password', 'Forgot password?')}
          </Link>
        </div>

        <Button type="submit" className="w-full mt-2" isLoading={isSubmitting}>
          {t('auth_sign_in_btn', 'Sign In')}
        </Button>
      </form>
    </div>
  );
};
export default LoginPage;
