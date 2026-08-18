import React from 'react';
import SEOHead from "@/components/SEOHead";
import TicketManager from '@/components/admin/TicketManager';
import { ArrowLeft, Ticket, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

const TicketManagementPage: React.FC = () => {
  return (
    <>
      <SEOHead 
        title="Ticket & Tier Management - Savage Gentlemen Admin" 
        description="Configure ticket tiers, pricing curves, secret codes, and inventory." 
      />

      <div className="min-h-screen bg-obsidian text-white py-8 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
        {/* ── LUXURY HERO ── */}
        <div className="glass-obsidian-strong border border-gold-500/30 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="border-gold-500/30 text-gold-300 hover:bg-gold-500/10 rounded-xl text-xs font-mono">
                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                    Back to Admin
                  </Button>
                </Link>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-mono font-bold uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                  BOX OFFICE & INVENTORY
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight text-white flex items-center gap-3">
                <Ticket className="h-8 w-8 text-gold-400" />
                Ticket Management
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Configure VIP & Early Bird tiers, locked quantities, promotional discount codes, and live inventory.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-obsidian border border-gold-500/20 rounded-3xl p-6 md:p-8 shadow-xl">
          <TicketManager />
        </div>
      </div>
    </>
  );
};

export default TicketManagementPage;