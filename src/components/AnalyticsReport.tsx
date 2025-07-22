
import React, { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClinicData } from '@/hooks/useClinicData';
import { Building2, AlertTriangle, CheckCircle, Clock, MapPin, Stethoscope, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { localDb } from '@/lib/localDb';

const AnalyticsReport: React.FC = () => {
  const { data: clinics = [], isLoading, error } = useClinicData();
  const [governorates, setGovernorates] = useState<{ id: string; name: string }[]>([]);
  const [selectedGov, setSelectedGov] = useState<string>('all');
  useEffect(() => {
    localDb.governorates.toArray().then(setGovernorates);
  }, []);

  const analytics = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Basic statistics
    const totalClinics = clinics.length;
    const activeClinics = clinics.filter(clinic => clinic.license_status === 'active').length;
    const expiredClinics = clinics.filter(clinic => clinic.license_status === 'expired').length;
    const pendingClinics = clinics.filter(clinic => clinic.license_status === 'pending').length;
    const suspendedClinics = clinics.filter(clinic => clinic.license_status === 'suspended').length;

    // Clinics expiring within 30 days
    const expiringClinics = clinics.filter(clinic => {
      if (!clinic.expiry_date || clinic.license_status !== 'active') return false;
      const expiryDate = new Date(clinic.expiry_date);
      return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
    });

    // Geographical distribution (by governorate and city)
    const governorateDistribution = clinics.reduce((acc, clinic) => {
      if (!clinic.governorate) return acc;
      acc[clinic.governorate] = (acc[clinic.governorate] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const cityDistribution = clinics.reduce((acc, clinic) => {
      if (!clinic.city) return acc;
      acc[clinic.city] = (acc[clinic.city] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const governorateData = Object.entries(governorateDistribution)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalClinics > 0 ? ((count / totalClinics) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.count - a.count);

    const cityData = Object.entries(cityDistribution)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalClinics > 0 ? ((count / totalClinics) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.count - a.count);

    // Specialization distribution
    const specializationDistribution = clinics.reduce((acc, clinic) => {
      const specialization = clinic.specialization || 'غير محدد';
      acc[specialization] = (acc[specialization] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const specializationData = Object.entries(specializationDistribution)
      .map(([specialization, count]) => ({
        specialization,
        count,
        percentage: totalClinics > 0 ? ((count / totalClinics) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.count - a.count);

    // Status distribution for chart
    const statusData = [
      { 
        name: 'صالح', 
        value: activeClinics, 
        color: '#10b981',
        percentage: totalClinics > 0 ? ((activeClinics / totalClinics) * 100).toFixed(1) : '0'
      },
      { 
        name: 'منتهي', 
        value: expiredClinics, 
        color: '#ef4444',
        percentage: totalClinics > 0 ? ((expiredClinics / totalClinics) * 100).toFixed(1) : '0'
      },
      { 
        name: 'قيد المراجعة', 
        value: pendingClinics, 
        color: '#f59e0b',
        percentage: totalClinics > 0 ? ((pendingClinics / totalClinics) * 100).toFixed(1) : '0'
      },
      { 
        name: 'معلق', 
        value: suspendedClinics, 
        color: '#6b7280',
        percentage: totalClinics > 0 ? ((suspendedClinics / totalClinics) * 100).toFixed(1) : '0'
      }
    ].filter(item => item.value > 0);

    return {
      totalClinics,
      activeClinics,
      expiredClinics,
      pendingClinics,
      suspendedClinics,
      expiringClinics: expiringClinics.length,
      expiringClinicsList: expiringClinics,
      geographicalData: governorateData,
      specializationData,
      statusData,
      governorateData,
      cityData
    };
  }, [clinics]);

  // Filtered city data by governorate
  const filteredCityData = useMemo(() => {
    if (selectedGov === 'all') return analytics.cityData;
    const govName = governorates.find(g => g.id === selectedGov)?.name;
    return analytics.cityData.filter(city => {
      // Find a clinic with this city and the selected governorate
      return clinics.some(clinic => clinic.city === city.name && clinic.governorate === govName);
    });
  }, [selectedGov, analytics.cityData, clinics, governorates]);

  if (isLoading) {
    return (
      <div className="text-center py-12" dir="rtl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">جاري تحميل التقارير...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600" dir="rtl">
        <p>خطأ في تحميل البيانات</p>
        <p className="text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // Custom label function for pie chart to prevent overlapping
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
        <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">التقارير والإحصائيات</h2>
        <p className="text-gray-600">تقرير شامل عن حالة العيادات والتراخيص</p>
      </div>

      {/* Key Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العيادات</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalClinics}</div>
            <p className="text-xs text-muted-foreground">عدد العيادات المسجلة</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العيادات الصالحة</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.activeClinics}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalClinics > 0 ? ((analytics.activeClinics / analytics.totalClinics) * 100).toFixed(1) : '0'}% من المجموع
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العيادات المنتهية</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics.expiredClinics}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalClinics > 0 ? ((analytics.expiredClinics / analytics.totalClinics) * 100).toFixed(1) : '0'}% من المجموع
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قريبة الانتهاء</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{analytics.expiringClinics}</div>
            <p className="text-xs text-muted-foreground">خلال 30 يوم القادمة</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* License Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              توزيع حالات التراخيص
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value} عيادة`, name]}
                    labelFormatter={() => ''}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {analytics.statusData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm">{item.name}: {item.value} ({item.percentage}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Specialization Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              توزيع التخصصات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.specializationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.specializationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} عيادة`, 'عدد العيادات']}
                    labelFormatter={(label) => `التخصص: ${label}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {analytics.specializationData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm">{item.specialization}: {item.count} ({item.percentage}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Geographical Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Governorate Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              توزيع العيادات حسب المحافظات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.governorateData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analytics.governorateData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} عيادة`, 'عدد العيادات']}
                    labelFormatter={(label) => `المحافظة: ${label}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {analytics.governorateData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm">{item.name}: {item.count} ({item.percentage}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* City Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              توزيع العيادات حسب المدن
            </CardTitle>
            <div className="mt-4 flex gap-2 items-center">
              <span className="text-sm">فلترة حسب المحافظة:</span>
              <select
                className="border rounded px-2 py-1"
                value={selectedGov}
                onChange={e => setSelectedGov(e.target.value)}
              >
                <option value="all">كل المحافظات</option>
                {governorates.map(gov => (
                  <option key={gov.id} value={gov.id}>{gov.name}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {filteredCityData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-lg">لا توجد بيانات لعرضها</div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                      data={filteredCityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                      {filteredCityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} عيادة`, 'عدد العيادات']}
                    labelFormatter={(label) => `المدينة: ${label}`}
                  />
                </PieChart>
              </ResponsiveContainer>
              )}
            </div>
            {/* Legend */}
            {filteredCityData.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {filteredCityData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-sm">{item.name}: {item.count} ({item.percentage}%)</span>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geographical Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              التوزيع الجغرافي للعيادات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.geographicalData.slice(0, 10).map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.count} عيادة</Badge>
                    <span className="text-sm text-gray-600">%{item.percentage}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Clinics Expiring Soon */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              العيادات قريبة الانتهاء (30 يوم)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {analytics.expiringClinicsList.length > 0 ? (
                analytics.expiringClinicsList.map((clinic) => (
                  <div key={clinic.id} className="flex justify-between items-center p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                    <div>
                      <p className="font-medium">{clinic.clinic_name}</p>
                      <p className="text-sm text-gray-600">{clinic.license_number}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-yellow-700">
                        {clinic.expiry_date ? new Date(clinic.expiry_date).toLocaleDateString('ar-JO') : 'غير محدد'}
                      </p>
                      <p className="text-xs text-gray-600">تاريخ الانتهاء</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>لا توجد عيادات قريبة الانتهاء</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Specialization Table */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل التوزيع التخصصات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-2">التخصص</th>
                    <th className="text-right p-2">عدد العيادات</th>
                    <th className="text-right p-2">النسبة المئوية</th>
                    <th className="text-right p-2">التمثيل المرئي</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.specializationData.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-medium">{item.specialization}</td>
                      <td className="p-2">{item.count}</td>
                      <td className="p-2">%{item.percentage}</td>
                      <td className="p-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsReport;
