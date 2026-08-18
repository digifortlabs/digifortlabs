"use client";

import React, { useEffect, useState } from 'react';
import { SmartTVQueueDisplay } from '@/components/opd/SmartTVQueueDisplay';

export default function SmartTVScreenPage() {
  const [doctorId, setDoctorId] = useState<number>(1);

  useEffect(() => {
    // Read optional doctor_id param from URL search query
    const params = new URLSearchParams(window.location.search);
    const docParam = params.get('doctor_id');
    if (docParam && !isNaN(Number(docParam))) {
      setDoctorId(Number(docParam));
    }
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950">
      <SmartTVQueueDisplay doctorId={doctorId} />
    </div>
  );
}
