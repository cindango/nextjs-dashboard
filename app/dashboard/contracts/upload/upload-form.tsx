'use client';
import { useCallback, useEffect, useState } from 'react';
import { Database } from '../database.types';
import {
  User,
  createClientComponentClient,
} from '@supabase/auth-helpers-nextjs';
import UploadContract from './upload';

export default function UploadForm({ user }: { user: User | null }) {
  return (
    <div className="form-widget">
      <UploadContract uid={user.id} />
    </div>
  );
}
