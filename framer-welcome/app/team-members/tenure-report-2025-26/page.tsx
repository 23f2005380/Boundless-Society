'use client';

import React from 'react';

export default function TenureReportPage() {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden">
      <iframe
        src="/team-members/tenure-report-2025-26/index.html"
        className="w-full h-full border-none"
        title="Tenure Report 2025-26"
      />
    </div>
  );
}
