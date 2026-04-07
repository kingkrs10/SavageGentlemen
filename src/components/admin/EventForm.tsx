"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Loader2, Plus, Ticket, Wine, Sparkles, Zap, Crown } from "lucide-react";
import FileUploader from "@/components/ui/file-uploader";
import { TicketTierRow, TicketTierData, createEmptyTier } from "./TicketTierRow";
import { AddonRow, AddonData, createEmptyAddon, createBottleServiceAddon } from "./AddonRow";

type EventFormValues = z.infer<typeof insertEventSchema>;

interface EventFormProps {
    initialData?: any;
    isEditing?: boolean;
}

export function EventForm({ initialData, isEditing = false }: EventFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Ticket tiers state
    const [ticketTiers, setTicketTiers] = useState<TicketTierData[]>(
        initialData?.tickets?.map((t: any) => ({
            _clientId: crypto.randomUUID(),
            name: t.name || "",
            description: t.description || "",
            price: t.price || 0,
            quantity: t.quantity || t.availableQuantity || 100,
            tierLevel: t.tierLevel || "standard",
            badgeColor: t.badgeColor || "#3b82f6",
            benefits: t.benefits || [],
            includedItems: t.includedItems || [],
            salesStartDate: t.salesStartDate ? new Date(t.salesStartDate).toISOString().slice(0, 16) : "",
            salesEndDate: t.salesEndDate ? new Date(t.salesEndDate).toISOString().slice(0, 16) : "",
            maxPerPurchase: t.maxPerPurchase || 10,
            transferable: t.transferable ?? true,
            refundable: t.refundable ?? false,
            earlyAccess: t.earlyAccess ?? false,
        })) || []
    );

    // Add-ons state
    const [addons, setAddons] = useState<AddonData[]>(
        initialData?.addons?.map((a: any) => ({
            _clientId: crypto.randomUUID(),
            name: a.name || "",
            description: a.description || "",
            price: a.price || 0,
            category: a.category || "vip",
            maxQuantity: a.maxQuantity,
            bottleServiceMeta: a.bottleServiceMeta || {},
        })) || []
    );

    const defaultValues = initialData ? {
        ...initialData,
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
        price: initialData.price || 0,
        isSocaPassportEnabled: !!initialData.isSocaPassportEnabled,
        featured: !!initialData.featured,
    } : {
        title: "",
        description: "",
        date: undefined,
        time: "",
        location: "",
        price: 0,
        currency: "USD",
        imageUrl: "",
        category: "party",
        featured: false,
        organizerName: "Savage Gentlemen",
        isSocaPassportEnabled: false,
    };

    const form = useForm<EventFormValues>({
        resolver: zodResolver(insertEventSchema),
        defaultValues,
    });

    // Tier management
    const handleTierChange = (index: number, updatedTier: TicketTierData) => {
        const updated = [...ticketTiers];
        updated[index] = updatedTier;
        setTicketTiers(updated);
    };

    const handleRemoveTier = (index: number) => {
        setTicketTiers(ticketTiers.filter((_, i) => i !== index));
    };

    // Addon management
    const handleAddonChange = (index: number, updatedAddon: AddonData) => {
        const updated = [...addons];
        updated[index] = updatedAddon;
        setAddons(updated);
    };

    const handleRemoveAddon = (index: number) => {
        setAddons(addons.filter((_, i) => i !== index));
    };

    async function onSubmit(data: EventFormValues) {
        setIsSubmitting(true);
        try {
            const url = isEditing && initialData?.id
                ? `/api/events/${initialData.id}`
                : "/api/events";

            const method = isEditing ? "PUT" : "POST";

            // Prepare ticket tiers for API (strip client-only fields)
            const tiersPayload = ticketTiers.map(({ _clientId, ...tier }) => ({
                ...tier,
                salesStartDate: tier.salesStartDate ? new Date(tier.salesStartDate).toISOString() : null,
                salesEndDate: tier.salesEndDate ? new Date(tier.salesEndDate).toISOString() : null,
            }));

            // Prepare addons for API
            const addonsPayload = addons.map(({ _clientId, ...addon }) => addon);

            const payload = {
                ...data,
                ticketTiers: tiersPayload,
                addons: addonsPayload,
            };

            await apiRequest(method, url, payload);

            toast({
                title: isEditing ? "Event Updated" : "Event Created",
                description: `Successfully ${isEditing ? "updated" : "created"} the event${tiersPayload.length > 0 ? ` with ${tiersPayload.length} ticket tier(s)` : ""}.`,
            });

            router.push("/admin/events");
            router.refresh();
        } catch (error) {
            console.error("Form Error:", error);
            toast({
                title: "Error",
                description: "Failed to save event. Please check your inputs.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
                {/* ============================================================ */}
                {/* EVENT DETAILS SECTION */}
                {/* ============================================================ */}
                <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10">
                    <h2 className="text-lg font-semibold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1 h-5 bg-primary rounded-full" />
                        Event Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <FormLabel className="text-white">Event Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter event name" {...field} className="bg-black/40 border-white/10 text-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white">Date</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} className="bg-black/40 border-white/10 text-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="time"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white">Time</FormLabel>
                                    <FormControl>
                                        <Input type="time" placeholder="HH:MM" {...field} className="bg-black/40 border-white/10 text-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <FormLabel className="text-white">Location</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Venue name or address" {...field} className="bg-black/40 border-white/10 text-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <FormLabel className="text-white">Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Event details..." {...field} value={field.value || ""} className="min-h-[100px] bg-black/40 border-white/10 text-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white">Base Price (USD)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            {...field}
                                            value={field.value ?? 0}
                                            onChange={e => field.onChange(parseFloat(e.target.value))}
                                            className="bg-black/40 border-white/10 text-white"
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs text-white/40">
                                        Default price if no ticket tiers are set. Set to 0 for free events.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white">Category</FormLabel>
                                    <FormControl>
                                        <select
                                            {...field}
                                            value={field.value || ""}
                                            className="w-full bg-black/40 border border-white/10 text-white rounded-md px-3 py-2 text-sm"
                                        >
                                            <option value="party">Party</option>
                                            <option value="concert">Concert</option>
                                            <option value="festival">Festival</option>
                                            <option value="carnival">Carnival</option>
                                            <option value="brunch">Brunch</option>
                                            <option value="networking">Networking</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="imageUrl"
                            render={({ field }) => (
                                <FormItem className="col-span-2">
                                    <FormLabel className="text-white">Flyer / Banner Image</FormLabel>
                                    <FormControl>
                                        <FileUploader
                                            value={field.value || ""}
                                            onUpload={(url) => field.onChange(url)}
                                            folder="events"
                                        />
                                    </FormControl>
                                    <FormDescription className="text-xs text-white/40">Upload a promotional image.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="col-span-2 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                            <FormField
                                control={form.control}
                                name="featured"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-white/10 rounded-md bg-black/20">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="border-white/20 data-[state=checked]:bg-primary"
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-white">Featured Event</FormLabel>
                                            <FormDescription className="text-white/40 text-xs">
                                                Show prominently on homepage.
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="isSocaPassportEnabled"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-white/10 rounded-md bg-black/20">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="border-white/20 data-[state=checked]:bg-primary"
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-white">Soca Passport</FormLabel>
                                            <FormDescription className="text-white/40 text-xs">
                                                Enable digital stamp collecting.
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* TICKET TIERS SECTION */}
                {/* ============================================================ */}
                <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                            <div className="w-1 h-5 bg-blue-500 rounded-full" />
                            Ticket Tiers
                            {ticketTiers.length > 0 && (
                                <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{ticketTiers.length}</span>
                            )}
                        </h2>
                    </div>

                    {ticketTiers.length === 0 && (
                        <div className="text-center py-8 border border-dashed border-white/10 rounded-lg mb-4">
                            <Ticket className="h-8 w-8 text-white/20 mx-auto mb-2" />
                            <p className="text-white/40 text-sm mb-1">No ticket tiers configured</p>
                            <p className="text-white/30 text-xs">The event will use the base price above. Add tiers for multi-level pricing.</p>
                        </div>
                    )}

                    <div className="space-y-3 mb-4">
                        {ticketTiers.map((tier, index) => (
                            <TicketTierRow
                                key={tier._clientId}
                                tier={tier}
                                index={index}
                                onChange={handleTierChange}
                                onRemove={handleRemoveTier}
                            />
                        ))}
                    </div>

                    {/* Quick-add tier buttons */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setTicketTiers([...ticketTiers, createEmptyTier("early_bird")])}
                            className="border-green-500/30 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                        >
                            <Zap className="h-3.5 w-3.5 mr-1" /> Early Bird
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setTicketTiers([...ticketTiers, createEmptyTier("general")])}
                            className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                        >
                            <Ticket className="h-3.5 w-3.5 mr-1" /> General Admission
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setTicketTiers([...ticketTiers, createEmptyTier("vip")])}
                            className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300"
                        >
                            <Crown className="h-3.5 w-3.5 mr-1" /> VIP
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setTicketTiers([...ticketTiers, createEmptyTier("ultra_vip")])}
                            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                        >
                            <Sparkles className="h-3.5 w-3.5 mr-1" /> Ultra VIP
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setTicketTiers([...ticketTiers, createEmptyTier()])}
                            className="border-white/10 text-white/40 hover:text-white/60"
                        >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Custom
                        </Button>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* ADD-ONS & BOTTLE SERVICE SECTION */}
                {/* ============================================================ */}
                <div className="bg-gray-900/50 p-6 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                            <div className="w-1 h-5 bg-purple-500 rounded-full" />
                            Add-Ons & Bottle Service
                            {addons.length > 0 && (
                                <span className="ml-2 text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">{addons.length}</span>
                            )}
                        </h2>
                    </div>

                    {addons.length === 0 && (
                        <div className="text-center py-8 border border-dashed border-white/10 rounded-lg mb-4">
                            <Wine className="h-8 w-8 text-white/20 mx-auto mb-2" />
                            <p className="text-white/40 text-sm mb-1">No add-ons or bottle service</p>
                            <p className="text-white/30 text-xs">Add premium packages, bottle service, or experience upgrades.</p>
                        </div>
                    )}

                    <div className="space-y-3 mb-4">
                        {addons.map((addon, index) => (
                            <AddonRow
                                key={addon._clientId}
                                addon={addon}
                                index={index}
                                onChange={handleAddonChange}
                                onRemove={handleRemoveAddon}
                            />
                        ))}
                    </div>

                    {/* Quick-add addon buttons */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAddons([...addons, createBottleServiceAddon()])}
                            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                        >
                            <Wine className="h-3.5 w-3.5 mr-1" /> Bottle Service
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAddons([...addons, createEmptyAddon()])}
                            className="border-white/10 text-white/40 hover:text-white/60"
                        >
                            <Plus className="h-3.5 w-3.5 mr-1" /> Custom Add-On
                        </Button>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* SUBMIT */}
                {/* ============================================================ */}
                <div className="flex justify-end gap-4 pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => router.back()}
                        className="text-white/60 hover:text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-primary text-white hover:bg-primary/90 font-bold uppercase tracking-wider px-8"
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Save Changes" : "Create Event"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
