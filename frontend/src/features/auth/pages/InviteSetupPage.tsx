import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../../services/api';
import { Input, Button } from '../../../components/ui';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

const passwordSetupSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string().min(1, 'Password confirmation is required'),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords don't match",
  path: ['password_confirmation'],
});

type PasswordSetupSchemaType = z.infer<typeof passwordSetupSchema>;

export const InviteSetupPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [invitedUser, setInvitedUser] = useState<any>(null);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userId = searchParams.get('user') || '';
  const expires = searchParams.get('expires') || '';
  const signature = searchParams.get('signature') || '';

  // 1. Verify Signed URL on Mount
  useEffect(() => {
    const verifyInvitation = async () => {
      if (!userId || !expires || !signature) {
        setVerificationError('The invitation link is incomplete or invalid.');
        setIsVerifying(false);
        return;
      }

      try {
        const response = await api.get('/invitation/verify', {
          params: { user: userId, expires, signature }
        });
        setInvitedUser(response.data.user);
      } catch (err: any) {
        const msg = err.response?.data?.message || 'The invitation link has expired or is invalid.';
        setVerificationError(msg);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyInvitation();
  }, [userId, expires, signature]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordSetupSchemaType>({
    resolver: zodResolver(passwordSetupSchema),
    defaultValues: {
      password: '',
      password_confirmation: '',
    },
  });

  // 2. Submit Setup Request
  const onSubmit = async (data: PasswordSetupSchemaType) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    try {
      const response = await api.post('/invitation/accept', {
        password: data.password,
        password_confirmation: data.password_confirmation,
      }, {
        params: { user: userId, expires, signature }
      });

      setSuccessMsg(response.data.message || 'Account activated successfully.');
      
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }

      // Update query client cache with the newly logged in user details
      queryClient.setQueryData(['auth-user'], response.data.user);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      const backendError = err.response?.data?.message || 'Failed to complete profile activation.';
      setErrorMsg(backendError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center p-6 gap-3">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500">Verifying secure signature...</span>
      </div>
    );
  }

  if (verificationError) {
    return (
      <div className="flex flex-col gap-5 w-full text-center">
        <div className="flex justify-center">
          <div className="bg-red-50 p-3 rounded-full text-red-600">
            <ShieldAlert className="w-8 h-8" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-slate-800">Invalid Link</h2>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            {verificationError} Please request a new invitation from your HR manager or system administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col gap-2.5">
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
          Welcome, {invitedUser?.first_name}!
        </h2>
        <p className="text-sm text-slate-500">
          Your account ({invitedUser?.email}) has been pre-configured. Let's secure it by establishing your new password.
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
            {successMsg} Logging in...
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input
          label="Set New Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          error={errors.password_confirmation?.message}
          {...register('password_confirmation')}
        />

        <Button type="submit" className="w-full mt-2" isLoading={isSubmitting}>
          Activate & Sign In
        </Button>
      </form>
    </div>
  );
};
export default InviteSetupPage;
