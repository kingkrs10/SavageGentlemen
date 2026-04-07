"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Ad } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Megaphone, Link as LinkIcon, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AdminAdsPage() {
    const queryClient = useQueryClient();
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const { data: ads, isLoading } = useQuery<Ad[]>({
        queryKey: ['/api/admin/ads'],
        queryFn: () => apiRequest('GET', '/api/admin/ads').then(res => res.json())
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/ads/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/ads'] });
            setIsDeleting(null);
        },
        onError: (error) => {
            console.error("Failed to delete ad:", error);
            setIsDeleting(null);
            alert("Failed to delete ad. Please try again.");
        }
    });

    const toggleActiveMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) =>
            apiRequest('PUT', `/api/admin/ads/${id}`, { isActive }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/ads'] });
        },
        onError: (error) => {
            console.error("Failed to update ad status:", error);
            alert("Failed to update ad status.");
        }
    });

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this ad? This action cannot be undone.")) {
            setIsDeleting(id);
            deleteMutation.mutate(id);
        }
    };

    const handleToggleActive = (id: string, currentStatus: boolean) => {
        toggleActiveMutation.mutate({ id, isActive: !currentStatus });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-3xl font-heading tracking-widest uppercase text-white mb-2 flex items-center gap-3">
                        <Megaphone className="w-8 h-8 text-primary" />
                        Ads & Affiliates
                    </h1>
                    <p className="text-gray-400">Manage affiliate links and banner advertisements</p>
                </div>
                <Link href="/admin/ads/new">
                    <Button className="bg-primary hover:bg-primary/90 text-white font-medium tracking-wide">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Ad
                    </Button>
                </Link>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : ads?.length === 0 ? (
                <Card className="bg-black/40 border border-white/5 text-center py-16">
                    <CardContent className="flex flex-col items-center justify-center text-gray-400">
                        <Megaphone className="w-16 h-16 mb-4 opacity-20" />
                        <h3 className="text-xl font-heading tracking-widest text-white mb-2 uppercase">No Ads Found</h3>
                        <p className="mb-6 max-w-md mx-auto">You haven't created any affiliate ads yet. Create one to display on the site.</p>
                        <Link href="/admin/ads/new">
                            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                                Create Your First Ad
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ads?.map((ad) => (
                        <Card key={ad.id} className="bg-gray-900 border-white/10 overflow-hidden flex flex-col transition-all hover:border-white/20">
                            {ad.imageUrl ? (
                                <div className="relative w-full h-48 bg-black/50 group">
                                    <Image
                                        src={ad.imageUrl}
                                        alt={ad.title}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        className={`transition-opacity duration-300 ${!ad.isActive ? 'opacity-50 grayscale' : 'opacity-100'}`}
                                    />
                                    {!ad.isActive && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                            <span className="font-heading tracking-widest uppercase text-red-500 font-bold px-4 py-2 border-2 border-red-500 rounded-md rotate-[-10deg]">
                                                Inactive
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="w-full h-48 bg-black/50 flex flex-col items-center justify-center text-gray-500">
                                    <Megaphone className="w-10 h-10 mb-2 opacity-50" />
                                    <span className="text-xs uppercase tracking-widest">No Image</span>
                                </div>
                            )}

                            <CardContent className="p-5 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{ad.title}</h3>

                                <div className="flex items-center text-xs text-gray-400 bg-black/30 p-2 rounded border border-white/5 mb-4 group hover:bg-black/50 transition-colors">
                                    <LinkIcon className="w-3 h-3 mr-2 shrink-0 text-primary" />
                                    <span className="truncate flex-1">{ad.targetUrl}</span>
                                    <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-white/50 hover:text-white shrink-0">
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>

                                <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggleActive(ad.id, ad.isActive)}
                                        disabled={toggleActiveMutation.isPending}
                                        className={ad.isActive
                                            ? "border-green-500/50 text-green-500 hover:bg-green-500/10 hover:text-green-400"
                                            : "border-gray-500 text-gray-400 hover:bg-gray-800 hover:text-white"
                                        }
                                    >
                                        {toggleActiveMutation.isPending ? "Updating..." : ad.isActive ? "Active" : "Inactive"}
                                    </Button>

                                    <div className="flex gap-2">
                                        <Link href={`/admin/ads/${ad.id}`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                                                <Edit className="h-4 w-4" />
                                                <span className="sr-only">Edit</span>
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(ad.id)}
                                            disabled={isDeleting === ad.id}
                                            className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
