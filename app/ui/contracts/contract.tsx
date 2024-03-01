'use client';
import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function UploadContract({ uid, onUpload }) {
  const supabase = createClientComponentClient();
  const [uploading, setUploading] = useState(false);

  const uploadPDF = async (event) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select a PDF to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      if (fileExt.toLowerCase() !== 'pdf') {
        throw new Error('The file must be a PDF.');
      }

      const filePath = `contracts/${uid}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      onUpload(filePath);
    } catch (error) {
      alert('Error uploading contract: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div>
        <label className="button primary block" htmlFor="single">
          {uploading ? 'Uploading ...' : 'Upload Contract'}
        </label>
        <input
          style={{
            visibility: 'hidden',
            position: 'absolute',
          }}
          type="file"
          id="single"
          accept=".pdf"
          onChange={uploadPDF}
          disabled={uploading}
        />
      </div>
    </div>
  );
}
