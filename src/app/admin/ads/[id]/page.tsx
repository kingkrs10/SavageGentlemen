"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Ad } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, ArrowLeft, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";

export default function EditAdPage() {
    const router = useRouter();
    const params = useParams();
    const adId = params.id as string;
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        title: "",
        imageUrl: "",
        targetUrl: "",
        isActive: true
    });

    const { data: ad, isLoading } = useQuery<Ad>({
        queryKey: [`/api/admin/ads/${adId}`],
        queryFn: () => apiRequest('GET', `/api/admin/ads/${adId}`).then(res => res.json()),
        enabled: !!adId
    });

    useEffect(() => {
        if (ad) {
            setFormData({
                title: ad.title || "",
                imageUrl: ad.imageUrl || "",
                targetUrl: ad.targetUrl || "",
                isActive: ad.isActive ?? true
            });
        }
    }, [ad]);

    const updateAdMutation = useMutation({
        mutationFn: (data: typeof formData) => apiRequest('PUT', `/api/admin/ads/${adId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/admin/ads'] });
            queryClient.invalidateQueries({ queryKey: [`/api/admin/ads/${adId}`] });
            router.push('/admin/ads');
        },
        onError: (error) => {
            console.error("Failed to update ad:", error);
            alert("Failed to update ad. Please ensure all fields are correct.");
        }
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, isActive: checked }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateAdMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/ads">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-heading tracking-widest uppercase text-white flex items-center gap-3">
                        <Megaphone className="w-6 h-6 text-primary" />
                        Edit Ad
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Update affiliate banner details</p>
                </div>
            </div>

            <Card className="bg-gray-900 border-white/10 shadow-xl">
                <CardContent className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-white/80 uppercase tracking-widest text-xs font-bold">Ad Title / Name</Label>
                            <Input
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="bg-black/50 border-white/10 text-white focus:border-primary"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="targetUrl" className="text-white/80 uppercase tracking-widest text-xs font-bold flex items-center gap-2">
                                <LinkIcon className="w-3 h-3" />
                                Target Affiliate URL
                            </Label>
                            <Input
                                id="targetUrl"
                                name="targetUrl"
                                type="url"
                                value={formData.targetUrl}
                                onChange={handleChange}
                                required
                                className="bg-black/50 border-white/10 text-white focus:border-primary"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="imageUrl" className="text-white/80 uppercase tracking-widest text-xs font-bold flex items-center gap-2">
                                <ImageIcon className="w-3 h-3" />
                                Banner Image URL
                            </Label>
                            <Input
                                id="imageUrl"
                                name="imageUrl"
                                type="url"
                                value={formData.imageUrl}
                                onChange={handleChange}
                                required
                                className="bg-black/50 border-white/10 text-white focus:border-primary"
                            />

                            {formData.imageUrl && (
                                <div className="mt-4 border border-white/10 rounded-md overflow-hidden bg-black relative aspect-[21/9] flex items-center justify-center">
                                    <img
                                        src={formData.imageUrl}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=Invalid+Image+URL';
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-white/5">
                            <div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-widest">Active Status</h4>
                                <p className="text-xs text-gray-400">If inactive, this ad will not be shown on the frontend.</p>
                            </div>
                            <Switch
                                checked={formData.isActive}
                                onCheckedChange={handleSwitchChange}
                                className="data-[state=checked]:bg-primary"
                            />
                        </div>

                        <div className="pt-6 border-t border-white/10 flex justify-end gap-4">
                            <Link href="/admin/ads">
                                <Button type="button" variant="ghost" className="text-gray-400 hover:text-white">
                                    Cancel
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={updateAdMutation.isPending}
                                className="bg-primary hover:bg-primary/90 text-white font-medium tracking-wide min-w-[120px]"
                            >
                                {updateAdMutation.isPending ? "Saving..." : "Update Ad"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
