'use client';

import {useState, useEffect} from 'react';
import {users, professions} from '@/lib/data';
import type {User} from '@/lib/data';
import {Input} from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {WorkerCard} from '@/components/worker-card';
import {useAuth} from '@/context/auth-context';
import {useRouter} from 'next/navigation';

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfession, setSelectedProfession] = useState('all');
  const {user} = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.push('/login');
    }
  }, [user, router]);


  if (!user || user.role !== 'seeker') {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading or unauthorized...</p>
      </div>
    );
  }

  const workers = users.filter((u): u is User & {role: 'worker'} => u.role === 'worker');

  // Location based matching
  const localWorkers = workers.filter(worker => worker.city === user.city);

  const filteredWorkers = localWorkers.filter(worker => {
    const matchesSearch =
      worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.bio?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProfession = selectedProfession === 'all' || worker.profession === selectedProfession;
    return matchesSearch && matchesProfession;
  });

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold font-headline">
          Find a Professional in {user.city}
        </h1>
        <p className="text-muted-foreground">Browse our list of trusted local workers.</p>
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search by name or keyword..."
            className="max-w-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Select value={selectedProfession} onValueChange={setSelectedProfession}>
            <SelectTrigger className="w-full md:w-[280px]">
              <SelectValue placeholder="Filter by profession" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Professions</SelectItem>
              {professions.map(p => (
                <SelectItem key={p.name} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredWorkers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredWorkers.map(worker => (
            <WorkerCard key={worker.id} worker={worker} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-card-foreground">
          <h2 className="text-xl font-semibold">No workers found</h2>
          <p className="text-muted-foreground">Try adjusting your search or filter.</p>
        </div>
      )}
    </div>
  );
}
