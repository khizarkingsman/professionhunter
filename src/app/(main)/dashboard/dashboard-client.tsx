'use client';

import {useState, useEffect} from 'react';
import {professions} from '@/lib/data';
import type {User} from '@/lib/data';
import {Input} from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from '@/components/ui/card';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {WorkerCard} from '@/components/worker-card';
import {useAuth} from '@/context/auth-context';
import {useRouter, useSearchParams} from 'next/navigation';
import {EditSeekerProfileDialog} from '@/components/edit-seeker-profile-dialog';
import SubscriptionCardSeeker from '@/components/subscription-card-seeker';
import {useLanguage} from '@/context/language-context';
import {saudiLocations, getNeighborhoodsForCity, getCityLabel} from '@/lib/locations';
import {LoadingScreen} from '@/components/loading-screen';

export default function DashboardClient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfession, setSelectedProfession] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('all');
  const {user, loading, getAllUsers} = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {t} = useLanguage();

  const allUsers = getAllUsers();

  useEffect(() => {
    if (!loading && user === null) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.city && selectedCity === 'all') {
      setSelectedCity(user.city);
    }
  }, [user, selectedCity]);

  useEffect(() => {
    const professionFromUrl = searchParams.get('profession');
    if (professionFromUrl) {
      setSelectedProfession(professionFromUrl);
    }
  }, [searchParams]);

  if (loading || !user || user.role !== 'seeker') {
    return <LoadingScreen message="Finding skilled workers near you..." />;
  }

  const workers = allUsers.filter((u): u is User & {role: 'worker'} => u.role === 'worker');

  // Location based matching
  const localWorkers = workers.filter(worker => {
     const matchesCity = selectedCity === 'all' || worker.city === selectedCity;
     const matchesNeighborhood = selectedNeighborhood === 'all' || worker.neighborhood === selectedNeighborhood;
     return matchesCity && matchesNeighborhood;
  });

  const filteredWorkers = localWorkers.filter(worker => {
    // Filter out workers whose profession is Coming Soon
    const prof = professions.find(p => p.name === worker.profession);
    if (prof?.isComingSoon) {
      return false;
    }

    const matchesProfession = selectedProfession === 'all' || worker.profession === selectedProfession;
    
    // Explicit Paywall Logic:
    if (user.isSeekerPro) {
        // 1. Pro Seekers can view all workers (both Free and Pro)
        return matchesProfession;
    } else {
        // 2. Free Seekers: Hide 'Pro Workers' behind the paywall, but successfully fetch Free Workers
        if (worker.isPro) {
            return false;
        }
        return matchesProfession;
    }
  });

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
        <main className="w-full">
         <div className="mb-8">
            <SubscriptionCardSeeker />
          </div>
          <div className="space-y-4 mb-8">
            <h1 className="text-3xl font-bold font-headline">
              {t('findProIn')} {selectedCity === 'all' ? 'Saudi Arabia' : getCityLabel(selectedCity)}
            </h1>
            <p className="text-muted-foreground">{t('browseLocal')}</p>
            <div className="flex flex-col md:flex-row gap-4 flex-wrap">
              <Select value={selectedCity} onValueChange={(val) => { setSelectedCity(val); setSelectedNeighborhood('all'); }}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {saudiLocations.map(loc => (
                    <SelectItem key={loc.city.value} value={loc.city.value}>{loc.city.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedNeighborhood} onValueChange={setSelectedNeighborhood} disabled={selectedCity === 'all'}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Neighborhood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Neighborhoods</SelectItem>
                  {selectedCity !== 'all' && getNeighborhoodsForCity(selectedCity).map(hood => (
                    <SelectItem key={hood.value} value={hood.value}>{hood.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedProfession} onValueChange={setSelectedProfession}>
                <SelectTrigger className="w-full md:w-[280px]">
                  <SelectValue placeholder={t('filterByPro')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allProfessions')}</SelectItem>
                  {professions.map(p => {
                    const nameKey = `prof_${p.name}` as any;
                    return (
                      <SelectItem key={p.name} value={p.name} disabled={p.isComingSoon}>
                        {t(nameKey)}{p.isComingSoon ? ` (${t('comingSoon')})` : ''}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredWorkers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorkers.map(worker => (
                <WorkerCard key={worker.id} worker={worker} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-card-foreground">
              <h2 className="text-xl font-semibold">{t('noWorkersFound')}</h2>
              <p className="text-muted-foreground">
                { !user.isSeekerPro 
                  ? t('hiddenResults')
                  : t('adjustSearch')
                }
              </p>
            </div>
          )}
        </main>
    </div>
  );
}