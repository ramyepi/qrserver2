import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Building2, Stethoscope, Settings, BarChart3, QrCode, ChevronLeft, ChevronRight, Menu, X, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>
      
      <div 
        className={cn(
          'fixed inset-0 bg-black/50 z-40 md:hidden',
          mobileOpen ? 'block' : 'hidden'
        )}
        onClick={() => setMobileOpen(false)}
      />

      <aside 
        className={cn(
          'fixed md:sticky top-0 md:flex flex-col h-screen bg-white border-l transition-all duration-300 z-40',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'flex -translate-x-0' : '-translate-x-full md:translate-x-0',
          'left-0'
        )}
      >
      <div className="p-4 border-b flex items-center justify-between">
        {!collapsed && <h1 className="text-xl font-bold text-gray-900">لوحة التحكم</h1>}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    <nav className="flex-1 p-4 space-y-2">
          <NavLink
            to="/admin/analytics-report"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 p-3 rounded-lg transition-colors',
                isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
              )
            }
            onClick={() => setMobileOpen(false)}
          >
            <BarChart3 className="h-5 w-5" />
            {!collapsed && <span>التقارير والإحصائيات</span>}
          </NavLink>
          <NavLink
            to="/admin/clinic-management"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 p-3 rounded-lg transition-colors',
                isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
              )
            }
            onClick={() => setMobileOpen(false)}
          >
            <Building2 className="h-5 w-5" />
            {!collapsed && <span>إدارة العيادات</span>}
          </NavLink>
          <NavLink
            to="/admin/specialization-management"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 p-3 rounded-lg transition-colors',
                isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
              )
            }
            onClick={() => setMobileOpen(false)}
          >
            <Stethoscope className="h-5 w-5" />
            {!collapsed && <span>إدارة التخصصات</span>}
          </NavLink>
          <NavLink
            to="/admin/geography-management"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 p-3 rounded-lg transition-colors',
                isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
              )
            }
            onClick={() => setMobileOpen(false)}
          >
            <MapPin className="h-5 w-5" />
            {!collapsed && <span>الإدارة الجغرافية</span>}
          </NavLink>
          <NavLink
            to="/admin/site-settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 p-3 rounded-lg transition-colors',
                isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
              )
            }
            onClick={() => setMobileOpen(false)}
          >
            <Settings className="h-5 w-5" />
            {!collapsed && <span>إعدادات الموقع</span>}
          </NavLink>
          <NavLink
            to="/admin/qr-scan"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 p-3 rounded-lg transition-colors',
                isActive ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-700'
              )
            }
            onClick={() => setMobileOpen(false)}
          >
            <QrCode className="h-5 w-5" />
            {!collapsed && <span>مسح رمز QR</span>}
          </NavLink>
        </nav>
      </aside>
    </>
  );
};