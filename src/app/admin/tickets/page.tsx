"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, QrCode } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Ticket {
    id: number;
    purchaseDate: string;
    status: string;
    ticketType: string;
    price: string;
    attendeeName: string;
    scanned: boolean;
    eventName: string;
    buyerName: string;
    qrCodeData: string;
}

export default function AdminTicketsPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const { data: tickets, isLoading } = useQuery<Ticket[]>({
        queryKey: ["/api/admin/tickets"],
        queryFn: () => apiRequest("GET", "/api/admin/tickets").then(res => res.json())
    });

    const filteredTickets = tickets?.filter(ticket =>
        ticket.attendeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.buyerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.qrCodeData?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-heading text-white tracking-wide uppercase">Ticket Sales</h1>
                    <p className="text-gray-400">View and validate purchased tickets.</p>
                </div>
                <Link href="/admin/tickets/scanner">
                    <Button className="bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wider h-12 px-6">
                        <QrCode className="w-5 h-5 mr-2" />
                        Open Scanner
                    </Button>
                </Link>
            </div>

            <div className="flex items-center gap-2 bg-gray-900 border border-white/10 rounded-lg px-4 py-2 max-w-md w-full">
                <Search className="w-5 h-5 text-gray-400" />
                <Input
                    placeholder="Search by name, event, or ticket ID..."
                    className="border-0 bg-transparent focus-visible:ring-0 text-white placeholder:text-gray-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-gray-900 border border-white/10 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-black/40">
                        <TableRow className="border-white/10 hover:bg-transparent">
                            <TableHead className="text-white/60 uppercase text-xs tracking-wider">ID</TableHead>
                            <TableHead className="text-white/60 uppercase text-xs tracking-wider">Attendee</TableHead>
                            <TableHead className="text-white/60 uppercase text-xs tracking-wider">Event</TableHead>
                            <TableHead className="text-white/60 uppercase text-xs tracking-wider">Type</TableHead>
                            <TableHead className="text-white/60 uppercase text-xs tracking-wider">Purchased</TableHead>
                            <TableHead className="text-white/60 uppercase text-xs tracking-wider">Status</TableHead>
                            <TableHead className="text-right text-white/60 uppercase text-xs tracking-wider">Verified</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-white/40">Loading tickets...</TableCell>
                            </TableRow>
                        ) : filteredTickets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-white/40">No tickets found.</TableCell>
                            </TableRow>
                        ) : (
                            filteredTickets.map((ticket) => (
                                <TableRow key={ticket.id} className="border-white/10 hover:bg-white/5 transition-colors">
                                    <TableCell className="font-mono text-white/40">#{ticket.id}</TableCell>
                                    <TableCell className="text-white font-medium">
                                        <div className="flex flex-col">
                                            <span>{ticket.attendeeName || "Guest"}</span>
                                            <span className="text-xs text-white/40">Buyer: {ticket.buyerName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-white/70">{ticket.eventName}</TableCell>
                                    <TableCell className="text-white/70 uppercase text-xs">{ticket.ticketType}</TableCell>
                                    <TableCell className="text-white/70 text-xs">
                                        {format(new Date(ticket.purchaseDate), "MMM d, h:mm a")}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`border-0 uppercase text-[10px] tracking-wider ${ticket.status === 'valid' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                                            }`}>
                                            {ticket.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline" className={`border-0 uppercase text-[10px] tracking-wider ${ticket.scanned ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-gray-400'
                                            }`}>
                                            {ticket.scanned ? "SCANNED" : "UNSCANNED"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
