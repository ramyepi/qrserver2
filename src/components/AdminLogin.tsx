import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
interface AdminLoginProps {
  onLogin: () => void;
}
const AdminLogin: React.FC<AdminLoginProps> = ({
  onLogin
}) => {
  const [email, setEmail] = useState('admin@clinic-system.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const {
    toast
  } = useToast();
  const createAdminUser = async () => {
    setIsCreatingAdmin(true);
    try {
      console.log('AdminLogin: Creating admin user');

      // First try to sign up the admin user
      const {
        data: signUpData,
        error: signUpError
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`
        }
      });
      console.log('AdminLogin: SignUp response:', {
        signUpData,
        signUpError
      });
      if (signUpError) {
        // If user already exists, that's actually good for us
        if (signUpError.message.includes('already') || signUpError.message.includes('registered')) {
          toast({
            title: "المستخدم موجود بالفعل",
            description: "سيتم تحديث دور المستخدم إلى admin"
          });
          // Try to update existing user's role
          await ensureAdminRole(email);
          return;
        }
        throw signUpError;
      }
      if (signUpData.user) {
        console.log('AdminLogin: User created, ensuring admin role');
        await ensureAdminRole(email, signUpData.user.id);
        toast({
          title: "تم إنشاء حساب الإدارة",
          description: "يمكنك الآن تسجيل الدخول"
        });
      }
    } catch (error: any) {
      console.error('AdminLogin: Create admin error:', error);
      toast({
        title: "خطأ في إنشاء حساب الإدارة",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreatingAdmin(false);
    }
  };
  const ensureAdminRole = async (userEmail: string, userId?: string) => {
    try {
      // If we don't have userId, get it from profiles
      if (!userId) {
        const {
          data: profile
        } = await supabase.from('profiles').select('id').eq('email', userEmail).single();
        if (profile) {
          userId = profile.id;
        }
      }
      if (userId) {
        // Try to update existing profile
        const {
          error: updateError
        } = await supabase.from('profiles').update({
          role: 'admin'
        }).eq('id', userId);
        if (updateError) {
          console.log('Update failed, trying insert:', updateError);
          // If update fails, try to insert
          const {
            error: insertError
          } = await supabase.from('profiles').insert({
            id: userId,
            email: userEmail,
            role: 'admin'
          });
          if (insertError) {
            console.error('Profile insert failed:', insertError);
          }
        }
      }
    } catch (error) {
      console.error('Error ensuring admin role:', error);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('AdminLogin: Attempting login with email:', email);
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      console.log('AdminLogin: Auth response:', {
        data,
        error
      });
      if (error) {
        // If credentials are invalid, maybe the admin user doesn't exist
        if (error.message.includes('Invalid login credentials')) {
          console.log('AdminLogin: Invalid credentials, user might not exist');
          setIsLoading(false);
          toast({
            title: "بيانات الدخول غير صحيحة",
            description: "هل تريد إنشاء حساب الإدارة؟",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }
      if (data.user) {
        console.log('AdminLogin: User authenticated, ensuring admin role');

        // Make sure the user has admin role
        await ensureAdminRole(data.user.email || '', data.user.id);

        // Wait a moment for the role to be set
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if user has admin role
        const {
          data: profile,
          error: profileError
        } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
        console.log('AdminLogin: Profile check result:', {
          profile,
          profileError
        });
        if (profileError || profile?.role !== 'admin') {
          console.log('AdminLogin: User is not admin or profile missing');
          await supabase.auth.signOut();
          throw new Error('غير مصرح لك بالوصول لهذه الصفحة');
        }
        console.log('AdminLogin: Login successful, user is admin');
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بك في لوحة التحكم"
        });
        onLogin();
      }
    } catch (error: any) {
      console.error('AdminLogin: Login error:', error);
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message || "البريد الإلكتروني أو كلمة المرور غير صحيحة",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
            <Lock className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">تسجيل دخول الإدارة</CardTitle>
          <p className="text-gray-600">يرجى إدخال بيانات الدخول للوصول للوحة التحكم</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@clinic-system.com" className="pl-10" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="pl-10" required />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>

            
          </form>
          
          
        </CardContent>
      </Card>
    </div>;
};
export default AdminLogin;