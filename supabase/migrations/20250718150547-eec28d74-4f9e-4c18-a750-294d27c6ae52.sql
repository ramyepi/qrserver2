
-- إنشاء جدول التخصصات
CREATE TABLE public.specializations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar text NOT NULL,
  name_en text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- إنشاء جدول إعدادات الموقع
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- تفعيل RLS للجداول الجديدة
ALTER TABLE public.specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للتخصصات
CREATE POLICY "Anyone can view active specializations" 
  ON public.specializations 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage specializations" 
  ON public.specializations 
  FOR ALL 
  USING (is_admin());

-- سياسات RLS لإعدادات الموقع
CREATE POLICY "Anyone can view site settings" 
  ON public.site_settings 
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage site settings" 
  ON public.site_settings 
  FOR ALL 
  USING (is_admin());

-- إدراج التخصصات الافتراضية
INSERT INTO public.specializations (name_ar, name_en, sort_order) VALUES
('طب الأسنان العام', 'General Dentistry', 1),
('جراحة الفم والوجه والفكين', 'Oral and Maxillofacial Surgery', 2),
('تقويم الأسنان', 'Orthodontics', 3),
('طب أسنان الأطفال', 'Pediatric Dentistry', 4),
('علاج الجذور', 'Endodontics', 5),
('أمراض اللثة', 'Periodontics', 6),
('تركيبات الأسنان', 'Prosthodontics', 7),
('جراحة الأسنان', 'Oral Surgery', 8),
('طب الأسنان التجميلي', 'Cosmetic Dentistry', 9),
('زراعة الأسنان', 'Dental Implants', 10),
('الطب العام', 'General Medicine', 11),
('طب الأطفال', 'Pediatrics', 12),
('أمراض النساء والتوليد', 'Obstetrics and Gynecology', 13),
('الجراحة العامة', 'General Surgery', 14),
('طب القلب', 'Cardiology', 15),
('أمراض الجهاز الهضمي', 'Gastroenterology', 16),
('طب العيون', 'Ophthalmology', 17),
('أنف وأذن وحنجرة', 'ENT', 18),
('جراحة العظام', 'Orthopedics', 19),
('الأمراض الجلدية', 'Dermatology', 20),
('الطب النفسي', 'Psychiatry', 21),
('طب الأعصاب', 'Neurology', 22),
('أمراض الكلى', 'Nephrology', 23),
('أمراض الرئة', 'Pulmonology', 24),
('الأشعة التشخيصية', 'Radiology', 25),
('التخدير', 'Anesthesia', 26),
('طب الطوارئ', 'Emergency Medicine', 27),
('الطب الباطني', 'Internal Medicine', 28);

-- إدراج إعدادات الفوتر الافتراضية
INSERT INTO public.site_settings (key, value, description) VALUES
('footer_title', 'نظام التحقق من تراخيص العيادات', 'عنوان النظام في الفوتر'),
('footer_description', 'نظام متطور للتحقق السريع والآمن من تراخيص عيادات الأسنان في الأردن', 'وصف النظام في الفوتر'),
('footer_features', '["• مسح رمز QR السريع", "• التحقق اليدوي من الترخيص", "• رفع ملفات Excel", "• إدارة شاملة للعيادات", "• تتبع عمليات التحقق"]', 'قائمة الميزات في الفوتر'),
('footer_developer_name', 'د. براء صادق', 'اسم المطور'),
('footer_developer_title', 'رئيس لجنة تكنولوجيا المعلومات', 'منصب المطور'),
('footer_organization', 'نقابة أطباء الأسنان الأردنية', 'اسم المنظمة'),
('footer_copyright', 'جميع الحقوق محفوظة © {year} نقابة أطباء الأسنان الأردنية', 'نص حقوق النشر');

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_specializations_updated_at 
  BEFORE UPDATE ON public.specializations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at 
  BEFORE UPDATE ON public.site_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
