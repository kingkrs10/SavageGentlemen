import React from 'react';
import { Helmet } from 'react-helmet';
import TicketManager from '@/components/admin/TicketManager';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

const TicketManagementPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Ticket Management | Savage Gentlemen Admin</title>
        <meta name="description" content="Manage event tickets and pricing" />
      </Helmet>

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Admin
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Ticket Management</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 md:p-6">
          <TicketManager />
        </div>
      </div>
    </>
  );
};

export default TicketManagementPage;