import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { localDb } from '@/lib/localDb';
import { MapPin, Edit, Trash2, Plus } from 'lucide-react';
import { jordanGovernorates } from '@/data/jordan-locations';

interface City {
  id: string;
  name: string;
  governorateId: string;
}

interface Governorate {
  id: string;
  name: string;
}

const GeographyManagement: React.FC = () => {
  const { toast } = useToast();
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedGov, setSelectedGov] = useState<string | null>(null);
  const [newGovName, setNewGovName] = useState('');
  const [editGovId, setEditGovId] = useState<string | null>(null);
  const [editGovName, setEditGovName] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const [editCityId, setEditCityId] = useState<string | null>(null);
  const [editCityName, setEditCityName] = useState('');

  // Helper to check MySQL as data source
  const isMySQL = () => localStorage.getItem('useMySQL') === 'true';
  const getMySQLConfig = () => ({
    host: localStorage.getItem('mysql_host') || 'localhost',
    port: localStorage.getItem('mysql_port') || '3306',
    database: localStorage.getItem('mysql_database') || '',
    user: localStorage.getItem('mysql_user') || '',
    password: localStorage.getItem('mysql_password') || ''
  });
  // Helper to get API base URL
  const getApiBaseUrl = () => localStorage.getItem('api_base_url') || '';

  // MySQL CRUD helpers
  const fetchMySQLGovernorates = async () => {
    const config = getMySQLConfig();
    const params = new URLSearchParams(config).toString();
    const res = await fetch(`${getApiBaseUrl()}/api/mysql/governorates?${params}`);
    if (!res.ok) throw new Error('فشل في جلب المحافظات من MySQL');
    return await res.json();
  };
  const fetchMySQLCities = async () => {
    const config = getMySQLConfig();
    const params = new URLSearchParams(config).toString();
    const res = await fetch(`${getApiBaseUrl()}/api/mysql/cities?${params}`);
    if (!res.ok) throw new Error('فشل في جلب المدن من MySQL');
    return await res.json();
  };
  const addMySQLGovernorate = async (name: string) => {
    const config = getMySQLConfig();
    const res = await fetch(`${getApiBaseUrl()}/api/mysql/governorates`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, ...config })
    });
    if (!res.ok) throw new Error('فشل في إضافة المحافظة إلى MySQL');
    return await res.json();
  };
  const updateMySQLGovernorate = async (id: string, name: string) => {
    const config = getMySQLConfig();
    const res = await fetch(`${getApiBaseUrl()}/api/mysql/governorates/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, ...config })
    });
    if (!res.ok) throw new Error('فشل في تعديل المحافظة في MySQL');
    return await res.json();
  };
  const deleteMySQLGovernorate = async (id: string) => {
    const config = getMySQLConfig();
    const params = new URLSearchParams(config).toString();
    const res = await fetch(`${getApiBaseUrl()}/api/mysql/governorates/${id}?${params}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('فشل في حذف المحافظة من MySQL');
    return await res.json();
  };
  const addMySQLCity = async (name: string, governorateId: string) => {
    const config = getMySQLConfig();
    const res = await fetch(`${getApiBaseUrl()}/api/mysql/cities`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, governorate_id: governorateId, ...config })
    });
    if (!res.ok) throw new Error('فشل في إضافة المدينة إلى MySQL');
    return await res.json();
  };
  const updateMySQLCity = async (id: string, name: string, governorateId: string) => {
    const config = getMySQLConfig();
    const res = await fetch(`${getApiBaseUrl()}/api/mysql/cities/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, governorate_id: governorateId, ...config })
    });
    if (!res.ok) throw new Error('فشل في تعديل المدينة في MySQL');
    return await res.json();
  };
  const deleteMySQLCity = async (id: string) => {
    const config = getMySQLConfig();
    const params = new URLSearchParams(config).toString();
    const res = await fetch(`${getApiBaseUrl()}/api/mysql/cities/${id}?${params}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('فشل في حذف المدينة من MySQL');
    return await res.json();
  };

  // Load data from DB (IndexedDB or MySQL)
  useEffect(() => {
    const load = async () => {
      if (isMySQL()) {
        setGovernorates(await fetchMySQLGovernorates());
        setCities(await fetchMySQLCities());
      } else {
        const govs = await localDb.table('governorates').toArray();
        const cts = await localDb.table('cities').toArray();
        setGovernorates(govs);
        setCities(cts);
        // Import Jordan data if empty
        if (govs.length === 0 && cts.length === 0) {
          await importJordanData();
        }
      }
    };
    load();
  }, []);
  // Import Jordan data function
  const importJordanData = async () => {
    const govs = jordanGovernorates.map(gov => ({ id: String(gov.id), name: gov.name }));
    const cts = jordanGovernorates.flatMap(gov => gov.cities.map(city => ({ id: String(city.id), name: city.name, governorateId: String(gov.id) })));
    await localDb.governorates.bulkAdd(govs);
    await localDb.cities.bulkAdd(cts);
    setGovernorates(await localDb.governorates.toArray());
    setCities(await localDb.cities.toArray());
    toast({ title: 'تم استيراد محافظات ومدن الأردن' });
  };

  // Governorate CRUD
  const addGovernorate = async () => {
    if (!newGovName.trim()) return;
    if (isMySQL()) {
      const gov = await addMySQLGovernorate(newGovName.trim());
      setGovernorates([...governorates, { id: String(gov.id), name: gov.name }]);
      setNewGovName('');
      toast({ title: 'تمت إضافة المحافظة', description: gov.name });
      return;
    }
    const gov: Governorate = { id: crypto.randomUUID(), name: newGovName.trim() };
    await localDb.table('governorates').add(gov);
    setGovernorates([...governorates, gov]);
    setNewGovName('');
    toast({ title: 'تمت إضافة المحافظة', description: gov.name });
  };
  const updateGovernorate = async () => {
    if (!editGovId || !editGovName.trim()) return;
    if (isMySQL()) {
      await updateMySQLGovernorate(editGovId, editGovName.trim());
      setGovernorates(governorates.map(g => g.id === editGovId ? { ...g, name: editGovName.trim() } : g));
      setEditGovId(null); setEditGovName('');
      toast({ title: 'تم تعديل المحافظة' });
      return;
    }
    await localDb.table('governorates').update(editGovId, { name: editGovName.trim() });
    setGovernorates(governorates.map(g => g.id === editGovId ? { ...g, name: editGovName.trim() } : g));
    setEditGovId(null); setEditGovName('');
    toast({ title: 'تم تعديل المحافظة' });
  };
  const deleteGovernorate = async (id: string) => {
    if (isMySQL()) {
      await deleteMySQLGovernorate(id);
      setGovernorates(governorates.filter(g => g.id !== id));
      setCities(cities.filter(c => c.governorateId !== id));
      toast({ title: 'تم حذف المحافظة' });
      return;
    }
    await localDb.table('governorates').delete(id);
    setGovernorates(governorates.filter(g => g.id !== id));
    setCities(cities.filter(c => c.governorateId !== id));
    toast({ title: 'تم حذف المحافظة' });
  };

  // City CRUD
  const addCity = async () => {
    if (!selectedGov || !newCityName.trim()) return;
    if (isMySQL()) {
      const city = await addMySQLCity(newCityName.trim(), selectedGov);
      setCities([...cities, { id: String(city.id), name: city.name, governorateId: String(city.governorate_id) }]);
      setNewCityName('');
      toast({ title: 'تمت إضافة المدينة', description: city.name });
      return;
    }
    const city: City = { id: crypto.randomUUID(), name: newCityName.trim(), governorateId: selectedGov };
    await localDb.table('cities').add(city);
    setCities([...cities, city]);
    setNewCityName('');
    toast({ title: 'تمت إضافة المدينة', description: city.name });
  };
  const updateCity = async () => {
    if (!editCityId || !editCityName.trim()) return;
    const city = cities.find(c => c.id === editCityId);
    if (isMySQL() && city) {
      await updateMySQLCity(editCityId, editCityName.trim(), city.governorateId);
      setCities(cities.map(c => c.id === editCityId ? { ...c, name: editCityName.trim() } : c));
      setEditCityId(null); setEditCityName('');
      toast({ title: 'تم تعديل المدينة' });
      return;
    }
    await localDb.table('cities').update(editCityId, { name: editCityName.trim() });
    setCities(cities.map(c => c.id === editCityId ? { ...c, name: editCityName.trim() } : c));
    setEditCityId(null); setEditCityName('');
    toast({ title: 'تم تعديل المدينة' });
  };
  const deleteCity = async (id: string) => {
    if (isMySQL()) {
      await deleteMySQLCity(id);
      setCities(cities.filter(c => c.id !== id));
      toast({ title: 'تم حذف المدينة' });
      return;
    }
    await localDb.table('cities').delete(id);
    setCities(cities.filter(c => c.id !== id));
    toast({ title: 'تم حذف المدينة' });
  };

  return (
    <Card className="w-full max-w-5xl mx-auto mt-8" dir="rtl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          الإدارة الجغرافية (المحافظات والمدن)
          <Button variant="outline" size="sm" onClick={importJordanData} className="ml-auto">استيراد محافظات ومدن الأردن</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Governorates Section */}
        <div>
          <h2 className="text-lg font-bold mb-2">المحافظات</h2>
          <div className="flex gap-2 mb-4">
            <Input
              value={newGovName}
              onChange={e => setNewGovName(e.target.value)}
              placeholder="اسم المحافظة الجديدة"
              className="w-64"
            />
            <Button onClick={addGovernorate} className="gap-2"><Plus className="h-4 w-4" />إضافة</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {governorates.map(gov => (
              <div key={gov.id} className={`border rounded-lg px-4 py-2 flex items-center gap-2 ${selectedGov === gov.id ? 'bg-blue-50 border-blue-400' : ''}`}>
                {editGovId === gov.id ? (
                  <>
                    <Input value={editGovName} onChange={e => setEditGovName(e.target.value)} className="w-32" />
                    <Button size="sm" onClick={updateGovernorate}>حفظ</Button>
                    <Button size="sm" variant="outline" onClick={() => { setEditGovId(null); setEditGovName(''); }}>إلغاء</Button>
                  </>
                ) : (
                  <>
                    <span className="font-bold cursor-pointer" onClick={() => setSelectedGov(gov.id)}>{gov.name}</span>
                    <Button size="sm" variant="ghost" onClick={() => { setEditGovId(gov.id); setEditGovName(gov.name); }}><Edit className="h-4 w-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteGovernorate(gov.id)}><Trash2 className="h-4 w-4" /></Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Cities Section */}
        <div>
          <h2 className="text-lg font-bold mb-2">المدن التابعة للمحافظة</h2>
          {selectedGov ? (
            <>
              <div className="flex gap-2 mb-4">
                <Input
                  value={newCityName}
                  onChange={e => setNewCityName(e.target.value)}
                  placeholder="اسم المدينة الجديدة"
                  className="w-64"
                />
                <Button onClick={addCity} className="gap-2"><Plus className="h-4 w-4" />إضافة</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {cities.filter(c => c.governorateId === selectedGov).map(city => (
                  <div key={city.id} className="border rounded-lg px-4 py-2 flex items-center gap-2">
                    {editCityId === city.id ? (
                      <>
                        <Input value={editCityName} onChange={e => setEditCityName(e.target.value)} className="w-32" />
                        <Button size="sm" onClick={updateCity}>حفظ</Button>
                        <Button size="sm" variant="outline" onClick={() => { setEditCityId(null); setEditCityName(''); }}>إلغاء</Button>
                      </>
                    ) : (
                      <>
                        <span className="font-bold">{city.name}</span>
                        <Button size="sm" variant="ghost" onClick={() => { setEditCityId(city.id); setEditCityName(city.name); }}><Edit className="h-4 w-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteCity(city.id)}><Trash2 className="h-4 w-4" /></Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-gray-500">اختر محافظة لعرض وإدارة المدن التابعة لها.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GeographyManagement; 