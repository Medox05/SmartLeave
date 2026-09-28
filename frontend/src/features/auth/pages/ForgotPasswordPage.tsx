import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import api from '../../../services/api';
import { useTranslation } from '../../../context/LanguageContext';
import { Input, Button } from '../../../components/ui';
import { ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';

const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
});

type ForgotSchemaType = z.infer<typeof forgotSchema>;

export const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotSchemaType>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotSchemaType) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      const response = await api.post('/forgot-password', data);
      setSuccessMsg(response.data.message || 'Password reset link sent to your email.');
      reset();
    } catch (err: any) {
      const backendError = err.response?.data?.errors?.email?.[0] || 
                           err.response?.data?.message || 
                           'We could not process your request at this time.';
      setErrorMsg(backendError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex flex-col gap-2.5">
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
          {t('auth_forgot_title', 'Forgot Password?')}
        </h2>
        <p className="text-sm text-slate-500">
          {t('auth_forgot_sub', 'Enter your email address and we\'ll send you a link to reset your password.')}
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

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label={t('lbl_email', 'Email Address')}
          type="email"
          placeholder={t('ph_email', 'name@company.com')}
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" className="w-full mt-2" isLoading={isSubmitting}>
          {t('auth_send_reset_link', 'Send Reset Link')}
        </Button>
      </form>

      <div className="text-center mt-2">
        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('auth_back_to_login', 'Back to Sign In')}
        </Link>
      </div>
    </div>
  );
};
export default ForgotPasswordPage;
