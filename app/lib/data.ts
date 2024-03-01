import { sql } from '@vercel/postgres';
import { createClient } from '@supabase/supabase-js';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  User,
  Revenue,
  ContractsTable,
} from './definitions';
import { formatCurrency } from './utils';
import { unstable_noStore as noStore } from 'next/cache';

export async function fetchRevenue() {
  // Add noStore() here prevent the response from being cached.
  // This is equivalent to in fetch(..., {cache: 'no-store'}).
  noStore();

  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)

    console.log('Fetching revenue data...');
    await new Promise((resolve) => setTimeout(resolve, 0));

    const data = await sql<Revenue>`SELECT * FROM revenue`;

    console.log('Data fetch completed after 3 seconds.');

    return data.rows;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  noStore();
  try {
    const data = await sql<LatestInvoiceRaw>`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`;

    const latestInvoices = data.rows.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  noStore();
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = sql`SELECT COUNT(*) FROM invoices`;
    const customerCountPromise = sql`SELECT COUNT(*) FROM customers`;
    const invoiceStatusPromise = sql`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS "paid",
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS "pending"
         FROM invoices`;

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number(data[0].rows[0].count ?? '0');
    const numberOfCustomers = Number(data[1].rows[0].count ?? '0');
    const totalPaidInvoices = formatCurrency(data[2].rows[0].paid ?? '0');
    const totalPendingInvoices = formatCurrency(data[2].rows[0].pending ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const supabaseClient = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
);

const ITEMS_PER_PAGE = 6;

export async function fetchFilteredContracts(
  query: string,
  currentPage: number,
): Promise<ContractsTable[]> {
  noStore();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  let contracts: ContractsTable[] = []; // Initialize contracts as an empty array of ContractsTable type

  try {
    if (query) {
      // Fetch vendor IDs matching the query
      let { data: vendorIds, error: vendorError } = await supabaseClient
        .from('vendors')
        .select('id')
        .ilike('name', `%${query}%`);

      if (vendorError || !vendorIds || vendorIds.length === 0) {
        console.error('Supabase Error:', vendorError);
        return []; // Return an empty array if there's an error or no vendors found
      }

      // Fetch contracts for those vendor IDs
      let { data: matchingContracts, error: contractsError } =
        await supabaseClient
          .from('contracts')
          .select('id, vendor_id (name)')
          .in(
            'vendor_id',
            vendorIds.map((v) => v.id),
          )
          .order('updated_at', { ascending: false })
          .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (contractsError) {
        console.error('Supabase Error:', contractsError);
        return []; // Return an empty array if there's an error
      }

      if (matchingContracts) {
        contracts = matchingContracts.map((contract) => ({
          ...contract,
          vendor_id:
            contract.vendor_id.length > 0 ? contract.vendor_id[0] : null,
        }));
      } else {
        contracts = [];
      }
    } else {
      // Fetch all contracts if no query is specified
      let { data: allContracts, error } = await supabaseClient
        .from('contracts')
        .select('id, vendor_id (name)')
        .order('updated_at', { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (error) {
        console.error('Supabase Error:', error);
        return []; // Return an empty array if there's an error
      }

      contracts = allContracts
        ? allContracts.map((contract) => ({
            ...contract,
            vendor_id: contract.vendor_id ? contract.vendor_id[0] : null,
          }))
        : [];
    }
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return []; // Return an empty array in case of any unforeseen errors
  }

  return contracts; // Return the fetched contracts
}

export async function fetchContractsPages(query: string): Promise<number> {
  noStore();
  try {
    let { count } = await supabaseClient
      .from('contracts')
      .select('id', { count: 'exact', head: true });

    const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Supabase Error:', error);
    throw new Error(
      'Failed to fetch total number of invoice pages from Supabase.',
    );
  }
}

export async function fetchContractById(id: string) {
  noStore();
  try {
    let { data: contract, error } = await supabaseClient
      .from('contracts')
      .select('*, vendor_id (*)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase Error:', error);
      throw new Error('Failed to fetch contract from Supabase.');
    }

    return contract;
  } catch (error) {
    console.error('Supabase Error:', error);
    throw new Error('Failed to fetch contract by ID.');
  }
}

export async function fetchContractDocumentById(id: string) {
  noStore();
  try {
    const { data: contractDocuments, error } = await supabaseClient
      .from('contract_documents')
      .select('*')
      .eq('contract_id', id);

    if (error) {
      console.error('Supabase Error:', error);
      throw new Error('Failed to fetch contract document from Supabase.');
    }

    return contractDocuments;
  } catch (error) {
    console.error('Supabase Error:', error);
    throw new Error('Failed to fetch contract document by ID.');
  }
}

export async function fetchContractDocumentsById(id: string) {
  try {
    // Fetch contract document details
    const { data: contractDocuments, error: documentsError } =
      await supabaseClient
        .from('contract_documents')
        .select('*')
        .eq('contract_id', id);

    if (documentsError) {
      console.error('Error fetching contract documents:', documentsError);
      throw new Error('Failed to fetch contract documents from Supabase.');
    }

    // If no documents are found, return or handle appropriately
    if (!contractDocuments || contractDocuments.length === 0) {
      throw new Error('No contract documents found with the given ID.');
    }

    // Generate signed URLs for each document
    const documentsWithSignedUrls = await Promise.all(
      contractDocuments.map(async (document) => {
        const { data: signedUrlData, error: signedUrlError } =
          await supabaseClient.storage
            .from('contracts') // Replace with your actual bucket name
            .createSignedUrl(document.file_path, 60 * 60); // URL expiry time in seconds

        if (signedUrlError) {
          console.error('Error generating signed URL:', signedUrlError);
          return { ...document, signedUrl: null }; // Decide how you want to handle errors
        }

        return { ...document, signedUrl: signedUrlData.signedUrl };
      }),
    );

    return documentsWithSignedUrls;
  } catch (error) {
    console.error('Supabase Error:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
}

export async function fetchInvoicesPages(query: string) {
  noStore();
  try {
    const count = await sql`SELECT COUNT(*)
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
  `;

    const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  noStore();
  try {
    const data = await sql<InvoiceForm>`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ${id};
    `;

    const invoice = data.rows.map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  noStore();
  try {
    const data = await sql<CustomerField>`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `;

    const customers = data.rows;
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  noStore();
  try {
    const data = await sql<CustomersTableType>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

export async function getUser(email: string) {
  noStore();
  try {
    const user = await sql`SELECT * FROM users WHERE email=${email}`;
    return user.rows[0] as User;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}
