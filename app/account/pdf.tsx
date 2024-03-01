'use client';
import React, { useEffect, useState } from 'react';
import { Database } from '../database.types';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Image from 'next/image';
type Contracts = Database['public']['Tables']['contracts']['Row'];

export default function Contract({
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

  const uploadContract: React.ChangeEventHandler<HTMLInputElement> = async (
    event,
  ) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${uid}/contract_${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, file);

      const { data, error: insertError } = await supabase
        .from('contracts')
        .insert([
          {
            customer_id: uid as string,
            file_url: filePath,
            updated_at: new Date(),
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      setFileURL(filePath);

      if (uploadError) {
        throw uploadError;
      }

      onUpload(filePath);
    } catch (error) {
      alert('Error uploading contract!');
    } finally {
      setUploading(false);
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
          disabled={uploading}
        />
      </div>
    </div>
  );
}
