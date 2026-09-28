import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { useTranslation } from '../../../context/LanguageContext';
import { Input, Button } from '../../../components/ui';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

const resetSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ['password_confirmation'],
});

type ResetSchemaType = z.infer<typeof resetSchema>;

export const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetSchemaType>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: email,
      password: '',
      password_confirmation: '',
    },
  });

  const onSubmit = async (data: ResetSchemaType) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      const response = await api.post('/reset-password', {
        ...data,
        token: token,
      });
      setSuccessMsg(response.data.message || 'Password reset successfully.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      const backendError = err.response?.data?.message || 
                           'We could not reset your password. The token may have expired.';
      setErrorMsg(backendError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex flex-col gap-2.5">
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
          {t('auth_reset_title', 'Reset Password')}
        </h2>
        <p className="text-sm text-slate-500">
          {t('auth_reset_sub', 'Enter your new password below to update your login credentials')}
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200/60 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-red-800 font-medium leading-relaxed">
            {errorMsg}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-800 font-medium leading-relaxed">
            {successMsg}
          </div>
        </div>
      )}

      {!token && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 font-medium">
          Warning: Reset token is missing from URL. Password reset might fail.
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

        <Input
          label={t('lbl_new_password', 'New Password')}
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label={t('lbl_confirm_password', 'Confirm Password')}
          type="password"
          placeholder="••••••••"
          error={errors.password_confirmation?.message}
          {...register('password_confirmation')}
        />

        <Button type="submit" className="w-full mt-2" isLoading={isSubmitting}>
          {t('btn_reset_password', 'Reset Password')}
        </Button>
      </form>

      <div className="text-center mt-2">
        <Link
          to="/login"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors hover:underline"
        >
          {t('auth_back_to_login', 'Back to Sign In')}
        </Link>
      </div>
    </div>
  );
};
export default ResetPasswordPage;
