
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Settings } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useClinicData } from '@/hooks/useClinicData';
import { Switch } from '@/components/ui/switch';
import { updateSupabaseConfig } from '@/integrations/supabase/client';

// Custom hook to manage data source preference
function useDataSourcePreference() {
  const [useLocalDb, setUseLocalDb] = React.useState(() => {
    const stored = localStorage.getItem('useLocalDb');
    return stored === null ? true : stored === 'true';
  });
  const setPreference = (val: boolean) => {
    setUseLocalDb(val);
    localStorage.setItem('useLocalDb', val ? 'true' : 'false');
  };
  return { useLocalDb, setPreference };
}

const CREATE_TABLES_SQL = `
create table if not exists clinics (
  id uuid primary key default uuid_generate_v4(),
  clinic_name text not null,
  license_number text not null,
  doctor_name text,
  specialization text not null,
  license_status text not null,
  phone text,
  governorate text not null,
  city text not null,
  address_details text,
  address text,
  issue_date date,
  expiry_date date,
  verification_count integer default 0,
  qr_code text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists site_settings (
  key text primary key,
  value text
);
`;

const SiteSettingsManagement: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings, isLoading, error } = useSiteSettings();
  const { syncWithSupabase } = useClinicData();
  const [syncing, setSyncing] = useState(false);
  
  // Initialize form data
  const [formData, setFormData] = useState<Record<string, string>>({});
  const { useLocalDb, setPreference } = useDataSourcePreference();

  // Supabase config state
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('supabase_url') || 'https://fxtonkqhvjbgrxagwcdu.supabase.co');
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem('supabase_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4dG9ua3FodmpiZ3J4YWd3Y2R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NzI3MzcsImV4cCI6MjA2ODI0ODczN30._bXNwSokGSYlEmPjnER135s9fPC5jI-ZMMjB00LGLvA');
  const [savingSupabase, setSavingSupabase] = useState(false);
  const [creatingTables, setCreatingTables] = useState(false);

  // --- MySQL Section State ---
  const [useMySQL, setUseMySQL] = useState(() => localStorage.getItem('useMySQL') === 'true');
  const [mysqlHost, setMysqlHost] = useState(() => localStorage.getItem('mysql_host') || 'localhost');
  const [mysqlPort, setMysqlPort] = useState(() => localStorage.getItem('mysql_port') || '3306');
  const [mysqlDatabase, setMysqlDatabase] = useState(() => localStorage.getItem('mysql_database') || '');
  const [mysqlUser, setMysqlUser] = useState(() => localStorage.getItem('mysql_user') || '');
  const [mysqlPassword, setMysqlPassword] = useState(() => localStorage.getItem('mysql_password') || '');
  const [savingMySQL, setSavingMySQL] = useState(false);
  const [creatingMySQLTables, setCreatingMySQLTables] = useState(false);

  // --- API Backend URL State ---
  const [apiBaseUrl, setApiBaseUrl] = useState(() => localStorage.getItem('api_base_url') || '');

  // Populate form data when settings are loaded
  React.useEffect(() => {
    if (settings && Object.keys(formData).length === 0) {
      const data: Record<string, string> = {};
      settings.forEach(setting => {
        data[setting.key] = setting.value || '';
      });
      setFormData(data);
    }
  }, [settings, formData]);

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: { key: string; value: string }[]) => {
      if (useMySQL) {
        const config = {
          host: mysqlHost,
          port: mysqlPort,
          database: mysqlDatabase,
          user: mysqlUser,
          password: mysqlPassword
        };
        const apiUrl = apiBaseUrl || localStorage.getItem('api_base_url') || '';
        const promises = updates.map(({ key, value }) =>
          fetch(`${apiUrl}/api/mysql/site-settings/${encodeURIComponent(key)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value, ...config })
          })
        );
        const results = await Promise.all(promises);
        for (const res of results) {
          if (!res.ok) throw new Error('فشل في حفظ إعدادات الموقع في MySQL');
        }
        return;
      }
      // Supabase logic
      const promises = updates.map(({ key, value }) =>
        supabase
          .from('site_settings')
          .update({ value })
          .eq('key', key)
      );
      const results = await Promise.all(promises);
      for (const result of results) {
        if (result.error) throw result.error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({
        title: "تم حفظ الإعدادات بنجاح",
        description: "تم تحديث إعدادات الموقع",
      });
    },
    onError: (error) => {
      console.error('Error updating settings:', error);
      toast({
        title: "خطأ في حفظ الإعدادات",
        description: "حدث خطأ أثناء تحديث الإعدادات",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const updates = Object.entries(formData).map(([key, value]) => ({
      key,
      value
    }));

    updateMutation.mutate(updates);
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSupabase = async () => {
    setSavingSupabase(true);
    try {
      updateSupabaseConfig(supabaseUrl, supabaseKey);
      localStorage.setItem('supabase_url', supabaseUrl);
      localStorage.setItem('supabase_key', supabaseKey);
      toast({ title: 'تم تحديث إعدادات Supabase', description: 'تم الاتصال بمشروع Supabase الجديد بنجاح' });
    } catch (e) {
      toast({ title: 'خطأ في الاتصال بـ Supabase', description: 'حدث خطأ أثناء تحديث إعدادات Supabase', variant: 'destructive' });
    } finally {
      setSavingSupabase(false);
    }
  };

  const handleCreateTables = async () => {
    if (!window.confirm('سيتم إنشاء الجداول الأساسية في قاعدة بيانات Supabase. هل أنت متأكد؟')) return;
    setCreatingTables(true);
    try {
      const { error } = await supabase.rpc('execute_sql', { sql: CREATE_TABLES_SQL });
      if (error) throw error;
      toast({ title: 'تم إنشاء الجداول بنجاح', description: 'تم إنشاء الجداول الأساسية في Supabase.' });
    } catch (e) {
      toast({ title: 'خطأ في إنشاء الجداول', description: 'حدث خطأ أثناء إنشاء الجداول في Supabase', variant: 'destructive' });
    } finally {
      setCreatingTables(false);
    }
  };

  const handleSaveMySQL = async () => {
    setSavingMySQL(true);
    try {
      localStorage.setItem('useMySQL', useMySQL ? 'true' : 'false');
      localStorage.setItem('mysql_host', mysqlHost);
      localStorage.setItem('mysql_port', mysqlPort);
      localStorage.setItem('mysql_database', mysqlDatabase);
      localStorage.setItem('mysql_user', mysqlUser);
      localStorage.setItem('mysql_password', mysqlPassword);
      toast({ title: 'تم حفظ إعدادات MySQL', description: 'تم حفظ إعدادات الاتصال بقاعدة بيانات MySQL بنجاح' });
    } catch (e) {
      toast({ title: 'خطأ في إعدادات MySQL', description: 'حدث خطأ أثناء حفظ إعدادات MySQL', variant: 'destructive' });
    } finally {
      setSavingMySQL(false);
    }
  };

  const handleCreateMySQLTables = async () => {
    if (!window.confirm('سيتم إنشاء الجداول الأساسية في قاعدة بيانات MySQL. هل أنت متأكد؟')) return;
    setCreatingMySQLTables(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/mysql/create-tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: mysqlHost,
          port: mysqlPort,
          database: mysqlDatabase,
          user: mysqlUser,
          password: mysqlPassword
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Unknown error');
      toast({ title: 'تم إنشاء الجداول بنجاح', description: 'تم إنشاء الجداول الأساسية في MySQL.' });
    } catch (e) {
      toast({ title: 'خطأ في إنشاء الجداول', description: e.message || 'حدث خطأ أثناء إنشاء الجداول في MySQL', variant: 'destructive' });
    } finally {
      setCreatingMySQLTables(false);
    }
  };

  const handleSaveApiBaseUrl = () => {
    localStorage.setItem('api_base_url', apiBaseUrl);
    toast({ title: 'تم حفظ رابط السيرفر الخلفي', description: apiBaseUrl });
  };

  if (error) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle>إعدادات الموقع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-600">
            <p>حدث خطأ في تحميل إعدادات الموقع:</p>
            <p className="mt-2">{error.message || error.toString()}</p>
            <button onClick={() => window.location.reload()} className="mt-4 underline text-blue-600">إعادة المحاولة</button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card dir="rtl">
        <CardHeader>
          <CardTitle>إعدادات الموقع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">جاري تحميل الإعدادات...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-end">
          <span>إعدادات الموقع</span>
          <Settings className="h-5 w-5" />
        </CardTitle>
        <CardDescription className="text-right">
          تخصيص محتوى الفوتر، معلومات النظام، إعدادات الاتصال، والمزامنة
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-10">
        {/* --- Site Info Section --- */}
        <section className="rounded-lg border p-6 bg-gray-50 space-y-6">
          <h2 className="text-lg font-bold mb-4 text-right border-b pb-2">معلومات النظام والفوتر</h2>
          <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2 text-right">عنوان النظام في الفوتر</label>
            <Input
              value={formData.footer_title || ''}
              onChange={(e) => handleInputChange('footer_title', e.target.value)}
              placeholder="نظام التحقق من تراخيص العيادات"
              className="text-right"
              dir="rtl"
            />
          </div>
          <div>
              <label className="block text-sm font-medium mb-2 text-right">اسم المنظمة</label>
              <Input
                value={formData.footer_organization || ''}
                onChange={(e) => handleInputChange('footer_organization', e.target.value)}
                placeholder="نقابة أطباء الأسنان الأردنية"
                className="text-right"
                dir="rtl"
              />
            </div>
            <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2 text-right">وصف النظام</label>
            <Textarea
              value={formData.footer_description || ''}
              onChange={(e) => handleInputChange('footer_description', e.target.value)}
              placeholder="نظام متطور للتحقق السريع والآمن من تراخيص عيادات الأسنان في الأردن"
              rows={3}
              className="text-right"
              dir="rtl"
            />
          </div>
            <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2 text-right">قائمة الميزات (JSON)</label>
            <Textarea
              value={formData.footer_features || ''}
              onChange={(e) => handleInputChange('footer_features', e.target.value)}
              placeholder='["• مسح رمز QR السريع", "• التحقق اليدوي من الترخيص"]'
              rows={4}
              className="text-right font-mono"
              dir="rtl"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              يرجى إدخال قائمة JSON صحيحة للميزات
            </p>
          </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-right">اسم المطور</label>
              <Input
                value={formData.footer_developer_name || ''}
                onChange={(e) => handleInputChange('footer_developer_name', e.target.value)}
                placeholder="د. براء صادق"
                className="text-right"
                dir="rtl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-right">منصب المطور</label>
              <Input
                value={formData.footer_developer_title || ''}
                onChange={(e) => handleInputChange('footer_developer_title', e.target.value)}
                placeholder="رئيس لجنة تكنولوجيا المعلومات"
                className="text-right"
                dir="rtl"
              />
            </div>
            <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2 text-right">نص حقوق النشر</label>
            <Input
              value={formData.footer_copyright || ''}
              onChange={(e) => handleInputChange('footer_copyright', e.target.value)}
              placeholder="جميع الحقوق محفوظة © {year} نقابة أطباء الأسنان الأردنية"
              className="text-right"
              dir="rtl"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              استخدم {`{year}`} لإدراج السنة الحالية تلقائياً
            </p>
          </div>
          </div>
        </section>

        {/* --- Supabase Section --- */}
        <section className="rounded-lg border p-6 bg-gray-50 space-y-6">
          <h2 className="text-lg font-bold mb-4 text-right border-b pb-2">إعدادات اتصال Supabase</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2 text-right">رابط المشروع (SUPABASE_URL)</label>
              <Input
                value={supabaseUrl}
                onChange={e => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="text-left font-mono"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-right">مفتاح API العام (SUPABASE_ANON_KEY)</label>
              <Input
                type="password"
                value={supabaseKey}
                onChange={e => setSupabaseKey(e.target.value)}
                placeholder="your-anon-key"
                className="text-left font-mono"
                dir="ltr"
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                يمكنك العثور على هذه المعلومات في لوحة تحكم Supabase تحت Settings {'>'} API
              </p>
            </div>
          </div>
          <div className="flex justify-start gap-4">
            <Button
              onClick={handleSaveSupabase}
              disabled={savingSupabase}
              className="flex items-center gap-2"
            >
              {savingSupabase ? 'جاري الحفظ...' : 'حفظ إعدادات الاتصال'}
            </Button>
            <Button
              variant="outline"
              onClick={handleCreateTables}
              disabled={creatingTables}
              className="flex items-center gap-2"
            >
              {creatingTables ? 'جاري الإنشاء...' : 'إنشاء جداول SQL في Supabase'}
            </Button>
          </div>
        </section>

        {/* --- Data Source & Sync Section --- */}
        <section className="rounded-lg border p-6 bg-gray-50 space-y-6">
          <h2 className="text-lg font-bold mb-4 text-right border-b pb-2">إعدادات قاعدة البيانات والمزامنة</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-right">رابط السيرفر الخلفي (API Backend URL)</label>
            <Input
              value={apiBaseUrl}
              onChange={e => setApiBaseUrl(e.target.value)}
              placeholder="https://your-app.onrender.com"
              className="text-left font-mono" dir="ltr"
            />
            <Button onClick={handleSaveApiBaseUrl} className="mt-2">حفظ رابط السيرفر الخلفي</Button>
            <p className="text-xs text-gray-500 mt-1 text-right">مثال: https://your-app.onrender.com (بدون /api في النهاية)</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:gap-8 gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">مصدر البيانات:</label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={useMySQL ? 'mysql' : useLocalDb ? 'local' : 'supabase'}
                onChange={e => {
                  if (e.target.value === 'mysql') {
                    setUseMySQL(true);
                    setPreference(false);
                  } else if (e.target.value === 'local') {
                    setUseMySQL(false);
                    setPreference(true);
                  } else {
                    setUseMySQL(false);
                    setPreference(false);
                  }
                }}
              >
                <option value="local">قاعدة البيانات المحلية (IndexedDB)</option>
                <option value="supabase">Supabase (سحابي)</option>
                <option value="mysql">MySQL (استضافة خارجية)</option>
              </select>
              <span className="text-xs text-gray-500">
                {useMySQL ? 'يتم استخدام MySQL (استضافة خارجية)' : useLocalDb ? 'يتم استخدام قاعدة البيانات المحلية (IndexedDB)' : 'يتم استخدام Supabase (سحابي)'}
              </span>
            </div>
            {!useMySQL && (
              <div className="flex justify-start">
                <Button
                  variant="outline"
                  onClick={async () => {
                    setSyncing(true);
                    try {
                      await syncWithSupabase();
                      toast({ title: 'تمت مزامنة العيادات', description: 'تم جلب بيانات العيادات من Supabase بنجاح' });
                    } catch (e) {
                      toast({ title: 'خطأ في المزامنة', description: 'حدث خطأ أثناء مزامنة العيادات', variant: 'destructive' });
                    } finally {
                      setSyncing(false);
                    }
                  }}
                  disabled={syncing}
                  className="flex items-center gap-2"
                >
                  {syncing ? 'جاري المزامنة...' : 'مزامنة العيادات مع Supabase'}
                </Button>
              </div>
            )}
          </div>
          {useMySQL && (
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">MySQL Host</label>
                  <Input value={mysqlHost} onChange={e => setMysqlHost(e.target.value)} placeholder="localhost" className="text-left font-mono" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">MySQL Port</label>
                  <Input value={mysqlPort} onChange={e => setMysqlPort(e.target.value)} placeholder="3306" className="text-left font-mono" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">MySQL Database</label>
                  <Input value={mysqlDatabase} onChange={e => setMysqlDatabase(e.target.value)} placeholder="database_name" className="text-left font-mono" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">MySQL Username</label>
                  <Input value={mysqlUser} onChange={e => setMysqlUser(e.target.value)} placeholder="username" className="text-left font-mono" dir="ltr" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-right">MySQL Password</label>
                  <Input type="password" value={mysqlPassword} onChange={e => setMysqlPassword(e.target.value)} placeholder="password" className="text-left font-mono" dir="ltr" />
                </div>
              </div>
              <div className="flex gap-4 mt-2">
                <Button onClick={handleSaveMySQL} disabled={savingMySQL} className="flex items-center gap-2">
                  {savingMySQL ? 'جاري الحفظ...' : 'حفظ إعدادات MySQL'}
                </Button>
                <Button variant="outline" onClick={handleCreateMySQLTables} disabled={creatingMySQLTables} className="flex items-center gap-2">
                  {creatingMySQLTables ? 'جاري الإنشاء...' : 'إنشاء جداول SQL في MySQL'}
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* --- Save Button --- */}
        <div className="flex justify-end pt-6">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-8 py-3 text-lg"
          >
            <Save className="h-5 w-5" />
            {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ جميع الإعدادات'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SiteSettingsManagement;
