
import React from 'react';
import { useSiteSetting } from '@/hooks/useSiteSettings';

const Footer: React.FC = () => {
  const { value: title } = useSiteSetting('footer_title');
  const { value: description } = useSiteSetting('footer_description');
  const { value: featuresJson } = useSiteSetting('footer_features');
  const { value: developerName } = useSiteSetting('footer_developer_name');
  const { value: developerTitle } = useSiteSetting('footer_developer_title');
  const { value: organization } = useSiteSetting('footer_organization');
  const { value: copyrightTemplate } = useSiteSetting('footer_copyright');

  // Parse features from JSON
  let features: string[] = [];
  try {
    features = featuresJson ? JSON.parse(featuresJson) : [];
  } catch (error) {
    console.error('Error parsing features JSON:', error);
    features = [
      '• مسح رمز QR السريع',
      '• التحقق اليدوي من الترخيص', 
      '• رفع ملفات Excel',
      '• إدارة شاملة للعيادات',
      '• تتبع عمليات التحقق'
    ];
  }

  // Replace {year} placeholder in copyright
  const copyright = copyrightTemplate?.replace('{year}', new Date().getFullYear().toString());

  return (
    <footer className="bg-gray-900 text-white py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {title || 'نظام التحقق من تراخيص العيادات'}
            </h3>
            <p className="text-gray-300 text-sm">
              {description || 'نظام متطور للتحقق السريع والآمن من تراخيص عيادات الأسنان في الأردن'}
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">الميزات</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              {features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">معلومات التطوير</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>تطوير: {developerName || 'د. براء صادق'}</p>
              <p>{developerTitle || 'رئيس لجنة تكنولوجيا المعلومات'}</p>
              <p>{organization || 'نقابة أطباء الأسنان الأردنية'}</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300 text-sm mb-2">
            {copyright || `جميع الحقوق محفوظة © ${new Date().getFullYear()} نقابة أطباء الأسنان الأردنية`}
          </p>
          <p className="text-gray-400 text-sm flex items-center justify-center gap-1">
            Built with ❤️ by {developerName || 'Dr. Bara Sadeq'}
            <br />
            {developerTitle || 'President of JDA IT Committee'}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
