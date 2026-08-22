import React from 'react';
import { SidebarLayout } from '@/components/layout/Sidebar';
import { HelpCenter } from '@/components/help/HelpCenter';
import { HR_NAV } from '@/constants/navigation';

export default function HRHelpScreen() {
  return (
    <SidebarLayout>
      <HelpCenter />
    </SidebarLayout>
  );
}
