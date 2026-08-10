import { createClient } from '@supabase/supabase-js';

import { cookies } from 'next/headers';

let isSupabaseOffline = false;

export async function getSupabaseClient(useServiceRole = false): Promise<any> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const activeKey = useServiceRole && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

  if (isSupabaseOffline || !supabaseUrl || !activeKey || !supabaseUrl.startsWith('http')) {
    isSupabaseOffline = true;
    return new MockSupabaseClient();
  }

  // If using service role key, we do not append the user bearer token (to avoid auth conflict)
  if (useServiceRole) {
    return createClient(supabaseUrl, activeKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }

  let token: string | undefined;
  try {
    const cookieStore = await cookies();
    token = cookieStore.get('auth_token')?.value;
  } catch (e) {
    // If not in a request context, token will be undefined
  }

  if (token) {
    return createClient(supabaseUrl, activeKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }

  return createClient(supabaseUrl, activeKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

export interface RowData {
  id: string;
  [key: string]: any;
}

const mockLeads: RowData[] = [
  {
    id: 'lead-1',
    name_company: 'Sarah Jenkins / TechCorp Annual Conference',
    email: 'sarah.j@techcorp.com',
    phone: '+1 (555) 234-5678',
    lead_source: 'direct',
    check_in_date: '2026-08-15',
    check_out_date: '2026-08-18',
    rooms_or_event_details: JSON.stringify({
      eventRoom: 'Alexander',
      eventRoomRate: '600',
      guestRooms: [{ type: 'Deluxe King', count: '25', rate: '199' }],
      accessories: [{ name: 'Projector & Screen', price: '250' }],
      eventDetails: 'Annual leadership summit & banquet dinner.'
    }),
    revenue_potential: '18500',
    assigned_sales_manager_id: '3',
    status: 'proposal_sent',
    market_segment: 'corporate',
    created_at: '2026-07-28T10:00:00Z',
    updated_at: '2026-07-29T14:30:00Z'
  },
  {
    id: 'lead-2',
    name_company: 'Michael Chang / Global Pharma Retreat',
    email: 'm.chang@globalpharma.io',
    phone: '+1 (555) 987-6543',
    lead_source: 'sales_call',
    check_in_date: '2026-09-02',
    check_out_date: '2026-09-05',
    rooms_or_event_details: JSON.stringify({
      eventRoom: 'Lincoln',
      eventRoomRate: '500',
      guestRooms: [{ type: 'Double Queen', count: '15', rate: '179' }],
      accessories: [],
      eventDetails: 'Medical advisory board workshop.'
    }),
    revenue_potential: '11200',
    assigned_sales_manager_id: '1',
    status: 'negotiation',
    market_segment: 'corporate',
    created_at: '2026-07-25T09:15:00Z',
    updated_at: '2026-07-30T11:00:00Z'
  },
  {
    id: 'lead-3',
    name_company: 'Emily Davis / Davis & Miller Wedding',
    email: 'emily.davis@gmail.com',
    phone: '+1 (555) 456-7890',
    lead_source: 'OTA',
    check_in_date: '2026-08-22',
    check_out_date: '2026-08-24',
    rooms_or_event_details: JSON.stringify({
      eventRoom: 'Alexander 1',
      eventRoomRate: '750',
      guestRooms: [{ type: 'Suite', count: '5', rate: '299' }, { type: 'Deluxe King', count: '10', rate: '189' }],
      accessories: [{ name: 'Stage Lighting', price: '400' }],
      eventDetails: 'Wedding reception & Sunday farewell brunch.'
    }),
    revenue_potential: '14800',
    assigned_sales_manager_id: '2',
    status: 'confirmed',
    market_segment: 'leisure',
    created_at: '2026-07-20T14:22:00Z',
    updated_at: '2026-07-31T16:00:00Z'
  },
  {
    id: 'lead-4',
    name_company: 'Robert Taylor / Apex Financial Seminar',
    email: 'rtaylor@apexfin.com',
    phone: '+1 (555) 321-7654',
    lead_source: 'email',
    check_in_date: '2026-08-10',
    check_out_date: '2026-08-11',
    rooms_or_event_details: JSON.stringify({
      eventRoom: 'Lincoln',
      eventRoomRate: '500',
      guestRooms: [],
      accessories: [{ name: 'Catering Package B', price: '1200' }],
      eventDetails: 'Full day executive training session.'
    }),
    revenue_potential: '2100',
    assigned_sales_manager_id: '4',
    status: 'new',
    market_segment: 'group',
    created_at: '2026-08-01T08:30:00Z',
    updated_at: '2026-08-01T08:30:00Z'
  }
];

const mockTemplates: RowData[] = [
  { id: 'tpl-1', template_type: 'thank_you', content: 'Dear {{client_name}},\n\nThank you for reaching out to Leadflow regarding your upcoming event. We would be delighted to host {{company_name}} for your stay on {{check_in_date}}.\n\nPlease let us know if you have any questions.' },
  { id: 'tpl-2', template_type: 'follow_up_reminder', content: 'Dear {{client_name}},\n\nFollowing up on the proposal sent for your event on {{check_in_date}}. We would love to secure your preferred dates in {{event_room}}.' },
  { id: 'tpl-3', template_type: 'gentle_reminder', content: 'Dear {{client_name}},\n\nJust checking in regarding your contract for {{check_in_date}}. Let us know if you need any adjustments to room blocks or catering.' },
  { id: 'tpl-4', template_type: 'booking_confirmation', content: 'Dear {{client_name}},\n\nWe are thrilled to confirm your booking at Leadflow for {{check_in_date}} to {{check_out_date}}! Attached is your official confirmation.' },
  { id: 'tpl-5', template_type: 'feedback_request', content: 'Dear {{client_name}},\n\nThank you for considering Leadflow. We would appreciate any feedback on how we can better serve your event needs in the future.' }
];

const mockAppointments: RowData[] = [
  { id: 'app-1', lead_id: 'lead-1', agent_id: '3', type: 'Site Tour', appointment_date: '2026-08-05', appointment_time: '10:00 AM' },
  { id: 'app-2', lead_id: 'lead-2', agent_id: '1', type: 'Menu Tasting', appointment_date: '2026-08-08', appointment_time: '02:00 PM' }
];

const mockTasks: RowData[] = [
  { id: 'task-1', description: 'Send updated contract to Sarah Jenkins', assigned_to: '3', due_date: '2026-08-03T17:00', status: 'pending', lead_id: 'lead-1' },
  { id: 'task-2', description: 'Confirm AV equipment setup for Michael Chang', assigned_to: '1', due_date: '2026-08-04T12:00', status: 'pending', lead_id: 'lead-2' }
];

const memoryStore: Record<string, RowData[]> = {
  leads: mockLeads,
  email_templates: mockTemplates,
  appointments: mockAppointments,
  tasks: mockTasks,
  users: [
    { id: '1', name: 'Arzaan Shaikh', role: 'General Manager' },
    { id: '2', name: 'Rokeya Ahmed', role: 'Director of Sales' },
    { id: '3', name: 'Riham Mohammed Jehangir', role: 'Sales Manager' },
    { id: '4', name: 'Muntaqim Elahi', role: 'Front Desk Supervisor' }
  ]
};

class MockQueryBuilder {
  private tableName: string;
  private queryData: any[];
  private isSingle = false;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.queryData = JSON.parse(JSON.stringify(memoryStore[tableName] || []));
  }

  select(fields?: string) {
    this.queryData = this.queryData.map(item => {
      const copy = { ...item };
      
      // Emulate join for users (assignee)
      if (copy.assigned_to) {
        const user = memoryStore['users']?.find(u => u.id === copy.assigned_to);
        if (user) {
          copy.assignee = { name: user.name, role: user.role };
        }
      }
      
      // Emulate join for sales managers
      if (copy.assigned_sales_manager_id) {
        const user = memoryStore['users']?.find(u => u.id === copy.assigned_sales_manager_id);
        if (user) {
          copy.assigned_sales_manager = { name: user.name, role: user.role };
        }
      }

      // Emulate join for leads
      if (copy.lead_id) {
        const lead = memoryStore['leads']?.find(l => l.id === copy.lead_id);
        if (lead) {
          copy.lead = { name_company: lead.name_company };
        }
      }

      return copy;
    });

    return this;
  }

  insert(data: any | any[]) {
    const rows = Array.isArray(data) ? data : [data];
    const inserted = rows.map(row => {
      const newRow = {
        id: row.id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...row
      };
      if (!memoryStore[this.tableName]) {
        memoryStore[this.tableName] = [];
      }
      memoryStore[this.tableName].push(newRow);
      return newRow;
    });
    this.queryData = inserted;
    return this;
  }

  update(data: any) {
    this.queryData = this.queryData.map(item => {
      const updated = {
        ...item,
        ...data,
        updated_at: new Date().toISOString()
      };
      const idx = memoryStore[this.tableName]?.findIndex(x => x.id === item.id);
      if (idx !== -1 && idx !== undefined) {
        memoryStore[this.tableName][idx] = {
          ...memoryStore[this.tableName][idx],
          ...data,
          updated_at: new Date().toISOString()
        };
      }
      return updated;
    });
    return this;
  }

  delete() {
    this.queryData.forEach(item => {
      const idx = memoryStore[this.tableName]?.findIndex(x => x.id === item.id);
      if (idx !== -1 && idx !== undefined) {
        memoryStore[this.tableName].splice(idx, 1);
      }
    });
    this.queryData = [];
    return this;
  }

  eq(field: string, value: any) {
    this.queryData = this.queryData.filter(item => item[field] === value);
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    const asc = options?.ascending !== false;
    this.queryData.sort((a, b) => {
      if (a[field] < b[field]) return asc ? -1 : 1;
      if (a[field] > b[field]) return asc ? 1 : -1;
      return 0;
    });
    return this;
  }

  limit(num: number) {
    this.queryData = this.queryData.slice(0, num);
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    const result = {
      data: this.isSingle ? (this.queryData[0] || null) : this.queryData,
      error: null
    };
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }
}

class MockSupabaseClient {
  storage = {
    from(bucketName: string) {
      return {
        async upload(path: string, body: any, options?: any) {
          console.log(`[Mock Storage Upload] Bucket: ${bucketName}, Path: ${path}`);
          return { data: { path }, error: null };
        },
        getPublicUrl(path: string) {
          const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/mock-storage/${bucketName}/${path}`;
          return { data: { publicUrl } };
        }
      };
    }
  };

  from(tableName: string) {
    return new MockQueryBuilder(tableName);
  }
}


async function withTimeout<T = any>(promise: PromiseLike<T>, ms: number = 1000): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Supabase request timeout')), ms);
  });
  try {
    const result = await Promise.race([Promise.resolve(promise), timeoutPromise]);
    clearTimeout(timer!);
    return result;
  } catch (err) {
    clearTimeout(timer!);
    throw err;
  }
}

export async function getRows(tableName: string): Promise<RowData[]> {
  if (isSupabaseOffline) return memoryStore[tableName] || [];
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) {
      isSupabaseOffline = true;
      return memoryStore[tableName] || [];
    }
    
    const { data, error } = await withTimeout(supabase.from(tableName).select('*'), 1000);
    if (error) throw error;
    return data || [];
  } catch (error) {
    isSupabaseOffline = true;
    console.warn(`Supabase getRows offline for table ${tableName}. Using fallback data.`);
    return memoryStore[tableName] || [];
  }
}

export async function addRow(
  tableName: string, 
  data: Omit<RowData, 'id'> & Partial<Pick<RowData, 'id'>>
): Promise<RowData> {
  const id = data.id || crypto.randomUUID();
  const created_at = new Date().toISOString();
  const updated_at = created_at;
  const payload = { ...data, id, created_at, updated_at };

  if (isSupabaseOffline) {
    if (!memoryStore[tableName]) memoryStore[tableName] = [];
    memoryStore[tableName].unshift(payload);
    return payload;
  }

  try {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('No Supabase client');
    
    const { data: insertedData, error } = await withTimeout(
      supabase.from(tableName).insert(payload).select().single(), 
      1000
    );
    if (error) throw error;
    return insertedData;
  } catch (error) {
    isSupabaseOffline = true;
    console.warn(`Supabase addRow offline for ${tableName}. Saving to memory store.`);
    if (!memoryStore[tableName]) memoryStore[tableName] = [];
    memoryStore[tableName].unshift(payload);
    return payload;
  }
}

export async function updateRow(
  tableName: string, 
  id: string, 
  data: Partial<RowData>
): Promise<RowData> {
  const updated_at = new Date().toISOString();
  const payload = { ...data, updated_at };

  if (isSupabaseOffline) {
    if (memoryStore[tableName]) {
      const index = memoryStore[tableName].findIndex(r => r.id === id);
      if (index !== -1) {
        memoryStore[tableName][index] = { ...memoryStore[tableName][index], ...payload };
        return memoryStore[tableName][index];
      }
    }
    return { id, ...payload };
  }

  try {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('No Supabase client');

    const { data: updatedData, error } = await withTimeout(
      supabase.from(tableName).update(payload).eq('id', id).select().single(),
      1000
    );
    if (error) throw error;
    return updatedData;
  } catch (error) {
    isSupabaseOffline = true;
    console.warn(`Supabase updateRow offline for ${tableName}. Updating memory store.`);
    if (memoryStore[tableName]) {
      const index = memoryStore[tableName].findIndex(r => r.id === id);
      if (index !== -1) {
        memoryStore[tableName][index] = { ...memoryStore[tableName][index], ...payload };
        return memoryStore[tableName][index];
      }
    }
    return { id, ...payload };
  }
}

export async function deleteRow(tableName: string, id: string): Promise<void> {
  if (isSupabaseOffline) {
    if (memoryStore[tableName]) {
      memoryStore[tableName] = memoryStore[tableName].filter(r => r.id !== id);
    }
    return;
  }

  try {
    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('No Supabase client');
    
    const { error } = await withTimeout(
      supabase.from(tableName).delete().eq('id', id),
      1000
    );
    if (error) throw error;
  } catch (error) {
    isSupabaseOffline = true;
    console.warn(`Supabase deleteRow offline for ${tableName}. Deleting from memory store.`);
    if (memoryStore[tableName]) {
      memoryStore[tableName] = memoryStore[tableName].filter(r => r.id !== id);
    }
  }
}

export async function initDatabase(): Promise<string[]> {
  if (isSupabaseOffline) return [];
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) return [];
    await withTimeout(supabase.from('users').select('id').limit(1), 1000);
    return [];
  } catch (error) {
    isSupabaseOffline = true;
    console.warn('Database initialization warning: Supabase offline.');
    return [];
  }
}

export async function seedMockData(): Promise<void> {
  console.log('Seed mock data called');
  const supabase = await getSupabaseClient(true);
  if (!supabase || isSupabaseOffline) {
    console.warn('Cannot seed mock data: Supabase is offline or uninitialized.');
    return;
  }

  try {
    console.log('Seeding leads...');
    for (const lead of mockLeads) {
      const { error } = await supabase.from('leads').upsert(lead);
      if (error) console.error(`Error seeding lead ${lead.id}:`, error.message);
    }

    console.log('Seeding email templates...');
    for (const tpl of mockTemplates) {
      // Upsert resolving conflicts on template_type
      const { error } = await supabase.from('email_templates').upsert(tpl, { onConflict: 'template_type' });
      if (error) console.error(`Error seeding template ${tpl.id}:`, error.message);
    }

    console.log('Seeding appointments...');
    const appointmentsList = [
      { id: '00000000-0000-0000-0000-000000000001', lead_id: 'lead-1', agent_id: '3', type: 'Site Tour', appointment_date: '2026-08-05', appointment_time: '10:00 AM' },
      { id: '00000000-0000-0000-0000-000000000002', lead_id: 'lead-2', agent_id: '1', type: 'Menu Tasting', appointment_date: '2026-08-08', appointment_time: '02:00 PM' }
    ];
    for (const app of appointmentsList) {
      const { error } = await supabase.from('appointments').upsert(app);
      if (error) console.error(`Error seeding appointment ${app.id}:`, error.message);
    }

    console.log('Seeding tasks...');
    const tasksList = [
      { id: '00000000-0000-0000-0000-000000000003', description: 'Send updated contract to Sarah Jenkins', assigned_to: '3', due_date: '2026-08-03T17:00', status: 'pending', lead_id: 'lead-1' },
      { id: '00000000-0000-0000-0000-000000000004', description: 'Confirm AV equipment setup for Michael Chang', assigned_to: '1', due_date: '2026-08-04T12:00', status: 'pending', lead_id: 'lead-2' }
    ];
    for (const task of tasksList) {
      const { error } = await supabase.from('tasks').upsert(task);
      if (error) console.error(`Error seeding task ${task.id}:`, error.message);
    }

    console.log('Seeding users...');
    const now = new Date().toISOString();
    const usersList = [
      { id: '1', name: 'Arzaan Shaikh', role: 'General Manager', created_at: now, updated_at: now },
      { id: '2', name: 'Rokeya Ahmed', role: 'Director of Sales', created_at: now, updated_at: now },
      { id: '3', name: 'Riham Mohammed Jehangir', role: 'Sales Manager', created_at: now, updated_at: now },
      { id: '4', name: 'Muntaqim Elahi', role: 'Front Desk Supervisor', created_at: now, updated_at: now }
    ];
    for (const u of usersList) {
      const { error } = await supabase.from('users').upsert(u);
      if (error) console.error(`Error seeding user ${u.id}:`, error.message);
    }
  } catch (err) {
    console.error('Seed mock data error:', err);
  }
}
