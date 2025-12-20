'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { useAuthStore } from '@/lib/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Save token and user to Zustand store
      setAuth(data.token, data.user);
      
      // Redirect to ERP dashboard
      router.push('/erp');
    } catch (err: any) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-[#1E40AF] via-[#1E3A8A] to-[#0F172A] p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-2xl">
              <Icons.Inventory />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">ERP System</h1>
              <p className="text-sm text-blue-200">Enterprise Resource Planning</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Streamline Your Business Operations
          </h2>
          <p className="text-lg text-blue-100">
            Manage inventory, purchasing, sales, and manufacturing all in one powerful platform.
          </p>
          
          {/* Features */}
          <div className="space-y-4 mt-8">
            {[
              { icon: <Icons.Inventory />, text: 'Real-time Inventory Tracking' },
              { icon: <Icons.Reports />, text: 'Advanced Analytics & Reporting' },
              { icon: <Icons.CheckCircle />, text: 'Automated Workflows' },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  {feature.icon}
                </div>
                <span className="text-lg">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-blue-200 text-sm">
          © 2026 ERP System. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-floor">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-linear-to-br from-[#1E40AF] to-[#0EA5E9] rounded-xl flex items-center justify-center shadow-lg">
                <Icons.Inventory />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">ERP System</h1>
                <p className="text-xs text-text-muted">Enterprise Solution</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-workspace rounded-2xl shadow-xl border border-border-default p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-text-primary mb-2">Welcome Back</h2>
              <p className="text-text-muted">Sign in to access your account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="bg-[#FEF2F2] border border-[#FEE2E2] text-[#EF4444] px-4 py-3 rounded-lg flex items-start gap-3 animate-fade-in">
                  <Icons.Alert />
                  <div className="flex-1 text-sm">{error}</div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="h-12"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-border-default text-[#1E40AF] focus:ring-[#1E40AF] focus:ring-offset-0"
                  />
                  <span className="text-sm text-text-body">Remember me</span>
                </label>
                <a href="#" className="text-sm font-medium text-[#1E40AF] hover:text-[#1E3A8A] transition-colors">
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full h-12 text-base font-semibold"
                loading={loading}
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-text-muted">
                Don't have an account?{' '}
                <a href="#" className="font-medium text-[#1E40AF] hover:text-[#1E3A8A] transition-colors">
                  Contact Administrator
                </a>
              </p>
            </div>

            {/* Divider */}
            <div className="mt-8 pt-6 border-t border-border-default">
              <p className="text-xs text-center text-text-muted">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-text-muted text-xs">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Secured with 256-bit SSL encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
