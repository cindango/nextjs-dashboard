import Form from '@/app/ui/contracts/upload-form';
import Breadcrumbs from '@/app/ui/contracts/breadcrumbs';
import { fetchCustomers } from '@/app/lib/data';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '../database.types';
import UploadForm from './upload-form';

export default async function Page() {
  const customers = await fetchCustomers();
  const supabase = createServerComponentClient<Database>({ cookies });

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      <UploadForm user={user} />
    </main>
  );
}
