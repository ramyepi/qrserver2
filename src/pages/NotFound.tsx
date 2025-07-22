
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Home, Search, AlertCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
      <div className="container mx-auto px-4">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-8 pb-8">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              الصفحة غير موجودة
            </h2>
            <p className="text-gray-600 mb-8">
              عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها
            </p>
            
            <div className="space-y-3">
              <Button asChild className="w-full">
                <a href="/" className="flex items-center justify-center gap-2">
                  <Home className="h-4 w-4" />
                  العودة للرئيسية
                </a>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <a href="/license-check" className="flex items-center justify-center gap-2">
                  <Search className="h-4 w-4" />
                  التحقق من الترخيص
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
