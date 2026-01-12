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
import { Loader2 } from "lucide-react";
import FileUploader from "@/components/ui/file-uploader";

// Infer type from schema but make some fields optional/coerced for form handling
type EventFormValues = z.infer<typeof insertEventSchema>;

interface EventFormProps {
    initialData?: any; // Using any for simplicity with Dates/Nulls, but ideally typed
    isEditing?: boolean;
}

export function EventForm({ initialData, isEditing = false }: EventFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Transform initial data dates to strings if needed or keep as Date objects
    // react-hook-form with date inputs usually expects YYYY-MM-DD string
    const defaultValues = initialData ? {
        ...initialData,
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
        price: initialData.price || 0,
        // Ensure booleans are false if undefined
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

    async function onSubmit(data: EventFormValues) {
        setIsSubmitting(true);
        try {
            const url = isEditing && initialData?.id
                ? `/api/events/${initialData.id}`
                : "/api/events";

            const method = isEditing ? "PUT" : "POST";

            // If price is 0 string, it might need to be number
            // Zod schema handles transformation usually, but check apiRequest payload

            await apiRequest(method, url, data);

            toast({
                title: isEditing ? "Event Updated" : "Event Created",
                description: `Successfully ${isEditing ? "updated" : "created"} the event.`,
            });

            router.push("/admin/events");
            router.refresh(); // Refresh server components
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl bg-gray-900/50 p-6 rounded-lg border border-white/10">
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
                                    <Textarea placeholder="Event details..." {...field} className="min-h-[100px] bg-black/40 border-white/10 text-white" />
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
                                <FormLabel className="text-white">Price (USD)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        {...field}
                                        onChange={e => field.onChange(parseFloat(e.target.value))}
                                        className="bg-black/40 border-white/10 text-white"
                                    />
                                </FormControl>
                                <FormDescription className="text-xs text-white/40">Set to 0 for free events.</FormDescription>
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
                                    <Input placeholder="e.g. Party, Concert" {...field} className="bg-black/40 border-white/10 text-white" />
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
                        className="bg-primary text-white hover:bg-primary/90 font-bold uppercase tracking-wider"
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Save Changes" : "Create Event"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
