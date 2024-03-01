import { fetchContractById, fetchContractDocumentsById } from '@/app/lib/data';
import { notFound } from 'next/navigation';
import PDFViewer from '@/app/ui/contracts/pdf-viewer';

export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  const [contract] = await Promise.all([fetchContractById(id)]);
  const [documentsWithSignedUrls] = await Promise.all([
    fetchContractDocumentsById(id),
  ]);

  console.log(contract);
  console.log(documentsWithSignedUrls);

  if (!contract) {
    notFound();
  }

  return (
    <main>
      <h1>Customer View</h1>
      {contract.vendor_id ? contract.vendor_id.name : 'Vendor Name'}
      <PDFViewer file={documentsWithSignedUrls[0].signedUrl} />
    </main>
  );
}
