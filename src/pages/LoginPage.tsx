import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Leaf, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    navigate('/dashboard');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) { toast.error('Please accept the User Agreement and Privacy Policy.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    // Update full_name in profiles
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('profiles').update({ full_name: fullName }).eq('id', session.user.id);
      navigate('/dashboard');
    } else {
      toast.success('Registration successful! Please log in.');
      setTab('login');
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left panel — landscape */}
      <div className="hidden md:flex flex-col justify-between w-[55%] shrink-0 relative overflow-hidden bg-primary">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80')" }}
        />
        <div className="relative z-10 p-10 flex flex-col h-full justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-accent flex items-center justify-center">
              <Leaf size={20} className="text-accent-foreground" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">Temo-Thuo AI</p>
              <p className="text-xs text-white/60">National Agricultural OS</p>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-4">
              Botswana's National<br />Agricultural Operating System
            </h2>
            <p className="text-white/70 text-sm max-w-md">
              Connecting farmers, veterinary services, extension officers, financial institutions,
              and government agencies across the full agricultural value chain.
            </p>
            <div className="flex gap-6 mt-8">
              {[['10K+', 'Farmers'], ['50K+', 'Livestock'], ['21', 'Modules']].map(([num, label]) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-accent">{num}</p>
                  <p className="text-xs text-white/60">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-white/30">© 2026 SY-TECH AI SYSTEMS. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-card">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
              <Leaf size={16} className="text-accent-foreground" />
            </div>
            <p className="font-bold text-foreground">Temo-Thuo AI</p>
          </div>

          <h2 className="text-xl font-bold text-foreground mb-1">
            {tab === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {tab === 'login' ? 'Sign in to your account' : 'Register as a farmer'}
          </p>

          {/* Tab toggle */}
          <div className="flex gap-1 mb-6 bg-muted rounded p-1">
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 text-sm font-medium rounded transition-colors ${
                  tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={tab === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {tab === 'register' && (
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="Kabo Sithole" value={fullName}
                  onChange={e => setFullName(e.target.value)} required className="px-3" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="farmer@example.com" value={email}
                onChange={e => setEmail(e.target.value)} required className="px-3" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required className="px-3 pr-10" />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {tab === 'register' && (
              <div className="flex items-start gap-2">
                <Checkbox id="agree" checked={agreed} onCheckedChange={v => setAgreed(!!v)} className="mt-0.5" />
                <label htmlFor="agree" className="text-xs text-muted-foreground leading-relaxed">
                  I agree to the{' '}
                  <span className="text-accent underline cursor-pointer">User Agreement</span> and{' '}
                  <span className="text-accent underline cursor-pointer">Privacy Policy</span>
                </label>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 size={14} className="mr-2 animate-spin" />}
              {tab === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
          <p className="text-center text-xs text-muted-foreground mt-4">
            New farmer?{' '}
            <Link to="/register" className="text-accent hover:underline font-medium">
              Create a free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
