'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { uploadContractAction } from '@/app/lib/actions';

export default function Form() {
  const [contractDetails, setContractDetails] = useState(null);
  const [file, setFile] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }

    try {
      // No need to pass userId here
      const filePath = await uploadContractAction(file);
      console.log('File uploaded to:', filePath);
      // Optionally, update your state or UI based on the successful upload
    } catch (error) {
      alert(error.message);
    }
  };

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Upload Form */}
        <div className="mb-4">
          <label htmlFor="contract" className="mb-2 block text-sm font-medium">
            Contract
          </label>
          <input
            id="contract"
            name="contract"
            type="file"
            accept=".pdf"
            className="block w-full cursor-pointer rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none"
            onChange={handleFileChange}
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/invoices"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit">Upload Contract</Button>
      </div>
      {contractDetails && (
        <div className="mt-4">
          <h3 className="text-lg font-medium">Contract Details:</h3>
          <p>Licensor: {contractDetails.licensor}</p>
          <p>Contract Start Date: {contractDetails.contract_start_date}</p>
          {/* Display other details as needed */}
        </div>
      )}
    </form>
  );
}
