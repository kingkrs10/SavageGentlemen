import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Ticket, TrendingUp, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import SEOHead from "@/components/SEOHead";

interface FreeTicketData {
  id: number;
  userId: number;
  eventId: number;
  ticketId: number;
  orderId: number;
  purchaseDate: string;
  price: string;
  status: string;
  attendeeEmail: string;
  attendeeName: string;
  username: string;
  displayName: string;
  eventTitle: string;
  ticketName: string;
}

interface FreeTicketSummary {
  totalFreeTickets: number;
  uniqueUsers: number;
  events: string[];
  recentPurchases: FreeTicketData[];
  userBreakdown: Record<string, number>;
}

export default function FreeTicketsDashboard() {
  const { data, isLoading, error } = useQuery<{
    summary: FreeTicketSummary;
    tickets: FreeTicketData[];
  }>({
    queryKey: ["/api/admin/free-tickets"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <LoadingSpinner />
          <p className="text-xs font-mono text-gray-400">Loading complimentary ticket metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-obsidian text-white p-6 max-w-7xl mx-auto">
        <Card className="glass-obsidian border-red-500/30">
          <CardContent className="pt-6">
            <p className="text-red-400 font-mono text-sm">Failed to load free ticket data. Please check database connectivity.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-obsidian text-white p-6 max-w-7xl mx-auto">
        <Card className="glass-obsidian border-gold-500/20">
          <CardContent className="pt-6">
            <p className="text-gray-400 font-mono text-sm">No ticket records found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { summary, tickets } = data;

  return (
    <>
      <SEOHead 
        title="Complimentary Tickets - Savage Gentlemen Admin" 
        description="Monitor promotional and complimentary ticket distributions across carnival events." 
      />
      <div className="min-h-screen bg-obsidian text-white py-8 px-4 md:px-8 max-w-7xl mx-auto space-y-8">
        {/* ── LUXURY HERO ── */}
        <div className="glass-obsidian-strong border border-gold-500/30 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-mono font-bold uppercase tracking-widest mb-2">
                <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                PROMOTIONAL TICKET TELEMETRY
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight text-white">
                Free Ticket Monitoring
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Track, audit, and monitor complimentary and influencer passes across all events.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Total Free Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-gold-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-extrabold text-gold-400">{summary.totalFreeTickets}</div>
            </CardContent>
          </Card>

          <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Unique Users</CardTitle>
              <Users className="h-4 w-4 text-gold-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-extrabold text-white">{summary.uniqueUsers}</div>
            </CardContent>
          </Card>

          <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Events Active</CardTitle>
              <Calendar className="h-4 w-4 text-gold-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-extrabold text-white">{summary.events.length}</div>
            </CardContent>
          </Card>

          <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">Avg. per User</CardTitle>
              <TrendingUp className="h-4 w-4 text-gold-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-heading font-extrabold text-amber-400">
                {summary.uniqueUsers > 0 ? (summary.totalFreeTickets / summary.uniqueUsers).toFixed(1) : "0"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Breakdown */}
        <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
          <CardHeader>
            <CardTitle className="text-xl font-heading text-gold-400">Free Tickets by User</CardTitle>
            <CardDescription className="text-gray-400 text-xs">Breakdown of complimentary ticket acquisitions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(summary.userBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([username, count]) => (
                  <div key={username} className="flex items-center justify-between p-3.5 bg-white/5 border border-white/10 rounded-xl hover:border-gold-500/30 transition-all">
                    <div className="font-semibold text-white text-sm">{username}</div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-gold-500/20 text-gold-300 border border-gold-500/30">
                      {count} {count === 1 ? "ticket" : "tickets"}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Purchases */}
        <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white">
          <CardHeader>
            <CardTitle className="text-xl font-heading text-gold-400">Recent Free Ticket Redemptions</CardTitle>
            <CardDescription className="text-gray-400 text-xs">Latest 10 complimentary ticket activations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.recentPurchases.map((ticket) => (
                <div key={ticket.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl gap-3 hover:border-gold-500/30 transition-all">
                  <div className="space-y-1">
                    <div className="font-semibold text-white">{ticket.displayName || ticket.username}</div>
                    <div className="text-xs font-mono text-gold-400">{ticket.eventTitle}</div>
                    <div className="text-xs text-gray-400">{ticket.ticketName}</div>
                  </div>
                  <div className="sm:text-right space-y-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                      ticket.status === 'valid' 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                        : 'bg-red-500/20 text-red-300 border-red-500/40'
                    }`}>
                      {ticket.status}
                    </span>
                    <div className="text-xs text-gray-400 font-mono">
                      {format(new Date(ticket.purchaseDate), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono">
                      Order #{ticket.orderId}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Free Tickets Table */}
        <Card className="glass-obsidian border border-gold-500/20 rounded-2xl shadow-xl text-white overflow-hidden">
          <CardHeader>
            <CardTitle className="text-xl font-heading text-gold-400">All Complimentary Tickets</CardTitle>
            <CardDescription className="text-gray-400 text-xs">Complete audit trail of all free ticket redemptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full border-collapse">
                <thead className="bg-white/5 border-b border-gold-500/20">
                  <tr>
                    <th className="text-left p-3.5 text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">User</th>
                    <th className="text-left p-3.5 text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Event</th>
                    <th className="text-left p-3.5 text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Ticket Type</th>
                    <th className="text-left p-3.5 text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Date</th>
                    <th className="text-left p-3.5 text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Status</th>
                    <th className="text-left p-3.5 text-gold-400 font-mono text-[11px] uppercase tracking-wider font-bold">Order</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors text-xs">
                      <td className="p-3.5">
                        <div>
                          <div className="font-semibold text-white">{ticket.displayName || ticket.username}</div>
                          {ticket.attendeeEmail && (
                            <div className="text-[11px] font-mono text-gray-400">{ticket.attendeeEmail}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-gray-200">{ticket.eventTitle}</td>
                      <td className="p-3.5 font-mono text-gold-300">{ticket.ticketName}</td>
                      <td className="p-3.5 text-gray-400 font-mono">
                        {format(new Date(ticket.purchaseDate), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                          ticket.status === 'valid' 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                            : 'bg-red-500/20 text-red-300 border-red-500/40'
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-gray-400">#{ticket.orderId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}