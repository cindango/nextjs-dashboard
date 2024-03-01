import Breadcrumbs from '@/app/ui/contracts/breadcrumbs';
import { fetchCustomers } from '@/app/lib/data';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/app/supabase';
import UploadContract from './upload';

export default async function Page() {
  const customers = await fetchCustomers();
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Loading...</div>; // or handle the null case appropriately
  }

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Contracts', href: '/dashboard/contracts' },
          {
            label: 'Upload Contracts',
            href: '/dashboard/contracts/upload',
            active: true,
          },
        ]}
      />
      <UploadContract uid={user.id} />
    </main>
  );
}
