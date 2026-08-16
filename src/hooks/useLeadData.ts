'use client';

import useSWR from 'swr';
import { Lead, Template, Appointment, Task, User } from '@/types/crm';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Could not connect to database.');
  return res.json();
});

export function useLeadData(session: any) {
  const { data: leadsData, error: leadsError, mutate: mutateLeads } = useSWR<Lead[]>(
    session ? '/api/leads' : null, 
    fetcher, 
    { fallbackData: [] }
  );

  const { data: templatesData, mutate: mutateTemplates } = useSWR<Template[]>(
    session ? '/api/templates' : null, 
    fetcher, 
    { fallbackData: [] }
  );

  const { data: appData, mutate: mutateAppointments } = useSWR<{ appointments: Appointment[] }>(
    session ? '/api/appointments' : null, 
    fetcher, 
    { fallbackData: { appointments: [] } }
  );

  const { data: usersData, mutate: mutateUsers } = useSWR<User[]>(
    session ? '/api/users' : null, 
    fetcher, 
    { fallbackData: [] }
  );

  const { data: tasksData, mutate: mutateTasks } = useSWR<Task[]>(
    session ? '/api/tasks' : null, 
    fetcher, 
    { fallbackData: [] }
  );

  const leads: Lead[] = Array.isArray(leadsData) ? leadsData : [];
  const templates: Template[] = Array.isArray(templatesData) ? templatesData : [];
  const liveAppointments: Appointment[] = appData?.appointments || [];
  const users: User[] = Array.isArray(usersData) ? usersData : [];
  const tasks: Task[] = Array.isArray(tasksData) ? tasksData : [];

  const isLoading = session ? (!leadsData && !leadsError) : true;

  const setLeads = (newLeads: any) => mutateLeads(newLeads, false);

  const refreshAll = () => {
    mutateLeads();
    mutateTemplates();
    mutateAppointments();
    mutateUsers();
    mutateTasks();
  };

  return {
    leads,
    templates,
    liveAppointments,
    users,
    tasks,
    isLoading,
    leadsError,
    setLeads,
    mutateLeads,
    mutateTemplates,
    mutateAppointments,
    mutateUsers,
    mutateTasks,
    refreshAll
  };
}
