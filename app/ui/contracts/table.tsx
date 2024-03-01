import { UpdateInvoice, DeleteInvoice } from '@/app/ui/contracts/buttons';
import { fetchFilteredContracts } from '@/app/lib/data';

export default async function ContractsTable({
  query,
  currentPage,
}: {
  query: string;
  currentPage: number;
}) {
  const contracts = await fetchFilteredContracts(query, currentPage);

  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">
          <div className="md:hidden">
            {contracts?.map((contract) => (
              <div
                key={contract.id}
                className="mb-2 w-full rounded-md bg-white p-4"
              >
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="mb-2 flex items-center">
                      {contract.vendor_id ? contract.vendor_id.name : 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="flex w-full items-center justify-between pt-4">
                  <div>
                    <p className="text-xl font-medium"></p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <UpdateInvoice id={contract.id} />
                    <DeleteInvoice id={contract.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Vendor
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Contract Ending
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Contract Amount (Yearly)
                </th>
                <th scope="col" className="relative py-3 pl-6 pr-3">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {contracts?.map((contract) => (
                <tr
                  key={contract.id}
                  className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg"
                >
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                      {contract.vendor_id ? contract.vendor_id.name : 'N/A'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">a</td>
                  <td className="whitespace-nowrap px-3 py-3">b</td>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex justify-end gap-3">
                      <UpdateInvoice id={contract.id} />
                      <DeleteInvoice id={contract.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
