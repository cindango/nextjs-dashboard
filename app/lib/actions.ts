'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  // Prepare data for insertion into the database
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return {
      message: 'Database Error: Failed to Update Invoice.',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  throw new Error('Failed to Delete Invoice');

  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
  } catch (error) {
    return {
      message: 'Database Error: Failed to Delete Invoice.',
    };
  }
}

const supabaseClient = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
);

const ContractSchema = z.object({
  id: z.string(),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const UploadContract = ContractSchema.omit({ id: true, date: true });

export async function uploadContract(formData: FormData) {
  const validatedFields = UploadContract.safeParse({
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Upload Contract.',
    };
  }

  const { amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  const { data, error } = await supabaseClient
    .from('invoices')
    .insert([{ amount: amountInCents, status }])
    .select();

  if (error) {
    return {
      message: `Supabase Error: Failed to upload contract. ${error.message}`,
    };
  }

  revalidatePath('/dashboard/contracts');
  redirect('/dashboard/contracts');
}

export async function uploadContractPDF(file: File) {
  // Check if the file is a PDF
  if (file.type !== 'application/pdf') {
    return {
      message: 'Invalid file type. Please upload a PDF.',
    };
  }

  // Generate a unique file path for the PDF
  const filePath = `vendors/${Date.now()}-${file.name}`;

  // Upload the PDF to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabaseClient.storage
    .from('contracts')
    .upload(filePath, file);

  if (uploadError) {
    return {
      message: `Supabase Storage Error: Failed to upload PDF. ${uploadError.message}`,
    };
  }

  // Insert the contract details into the "contracts" table
  const uploadDate = new Date().toISOString();
  const { data: contractData, error: contractError } = await supabaseClient
    .from('contracts')
    .insert([
      {
        file_url: filePath,
        upload_date: uploadDate,
      },
    ]);

  if (contractError) {
    // If there was an error inserting the contract details, delete the uploaded file
    await supabaseClient.storage.from('vendor-contracts').remove([filePath]);

    return {
      message: `Database Error: Failed to record contract details. ${contractError.message}`,
    };
  }

  // If the upload and insert are successful, return the file path and contract details
  return {
    filePath: uploadData,
    contractDetails: contractData,
    message: 'PDF uploaded and contract details recorded successfully.',
  };
}
