'use client';
import React, { useEffect, useState } from 'react';
import { Database } from '../database.types';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
type Contracts = Database['public']['Tables']['contract_documents']['Row'];
import { useRouter } from 'next/navigation';

export default function UploadContract({
  uid,
  url,
  onUpload,
}: {
  uid: string;
  url: Contracts['file_url'];
  onUpload: (url: string) => void;
}) {
  const supabase = createClientComponentClient<Database>();
  const [fileURL, setFileURL] = useState<Contracts['file_url']>(url);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const uploadContract: React.ChangeEventHandler<HTMLInputElement> = async (
    event,
  ) => {
    try {
      setUploading(true);

      const files = event.target.files;
      if (!files || files.length === 0) {
        throw new Error('You must select at least one file to upload.');
      }

      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const filePath = `${uid}/contract_${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('contracts')
          .upload(filePath, file);
        if (uploadError) throw uploadError;

        let { data: contractData, error: contractInsertError } = await supabase
          .from('contracts')
          .insert([
            {
              user_id: uid,
              updated_at: new Date(),
            },
          ])
          .select('*');

        if (contractInsertError) {
          console.error('Contract insert error:', contractInsertError);
          throw contractInsertError;
        }

        if (!contractData) {
          throw new Error('No contract data returned from insert operation.');
        }

        const { error: documentInsertError } = await supabase
          .from('contract_documents')
          .insert([
            {
              user_id: uid,
              file_path: filePath,
              updated_at: new Date(),
              contract_id: contractData[0].id,
            },
          ]);
        if (documentInsertError) throw documentInsertError;

        return filePath;
      });

      const uploadedFilePaths = await Promise.all(uploadPromises);
    } catch (error) {
      console.log(error);
      alert('Error uploading contracts: ' + error.message);
    } finally {
      setUploading(false);
      router.push('/dashboard/contracts');
    }
  };

  return (
    <div>
      <div>
        <label className="button primary block" htmlFor="single">
          {uploading ? 'Uploading ...' : 'Upload'}
        </label>
        <input
          style={{
            visibility: 'hidden',
            position: 'absolute',
          }}
          type="file"
          id="single"
          accept=".doc,.docx,.pdf"
          onChange={uploadContract}
          multiple
          disabled={uploading}
        />
      </div>
    </div>
  );
}
