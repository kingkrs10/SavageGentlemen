"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, ChevronDown, ChevronUp, Wine, Sparkles, ShoppingBag, UtensilsCrossed, Gift } from "lucide-react";
import { useState } from "react";

export interface AddonData {
    _clientId: string;
    name: string;
    description: string;
    price: number;
    category: "vip" | "bottle_service" | "experience" | "merchandise" | "food";
    maxQuantity: number | undefined;
    bottleServiceMeta: {
        bottleType?: string;
        tableLocation?: string;
        maxGuests?: number;
        minSpend?: number;
        includesEntry?: boolean;
    };
}

const CATEGORY_OPTIONS = [
    { value: "vip", label: "VIP Package", icon: <Sparkles className="h-4 w-4" />, color: "#d4af37" },
    { value: "bottle_service", label: "Bottle Service", icon: <Wine className="h-4 w-4" />, color: "#c084fc" },
    { value: "experience", label: "Experience", icon: <Gift className="h-4 w-4" />, color: "#22d3ee" },
    { value: "merchandise", label: "Merchandise", icon: <ShoppingBag className="h-4 w-4" />, color: "#f97316" },
    { value: "food", label: "Food & Drink", icon: <UtensilsCrossed className="h-4 w-4" />, color: "#ef4444" },
] as const;

const BOTTLE_PRESETS = [
    { label: "Hennessy VS", price: 25000 },
    { label: "Hennessy VSOP", price: 35000 },
    { label: "Don Julio 1942", price: 45000 },
    { label: "Moët & Chandon", price: 30000 },
    { label: "Dom Pérignon", price: 55000 },
    { label: "Ciroc Vodka", price: 20000 },
    { label: "Casamigos Reposado", price: 32000 },
];

interface AddonRowProps {
    addon: AddonData;
    index: number;
    onChange: (index: number, addon: AddonData) => void;
    onRemove: (index: number) => void;
}

export function AddonRow({ addon, index, onChange, onRemove }: AddonRowProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const categoryInfo = CATEGORY_OPTIONS.find(c => c.value === addon.category) || CATEGORY_OPTIONS[0];

    const updateField = (field: keyof AddonData, value: any) => {
        onChange(index, { ...addon, [field]: value });
    };

    const updateBottleMeta = (field: string, value: any) => {
        onChange(index, {
            ...addon,
            bottleServiceMeta: { ...addon.bottleServiceMeta, [field]: value },
        });
    };

    const applyBottlePreset = (preset: typeof BOTTLE_PRESETS[0]) => {
        onChange(index, {
            ...addon,
            name: preset.label,
            price: preset.price,
            bottleServiceMeta: {
                ...addon.bottleServiceMeta,
                bottleType: preset.label,
            },
        });
    };

    return (
        <div className="border border-white/10 rounded-lg bg-black/30 overflow-hidden transition-all duration-200">
            {/* Header */}
            <div className="flex items-center gap-3 p-4">
                {/* Category Icon */}
                <div
                    className="flex items-center justify-center w-9 h-9 rounded-full shrink-0"
                    style={{ backgroundColor: categoryInfo.color + "30", color: categoryInfo.color }}
                >
                    {categoryInfo.icon}
                </div>

                {/* Name */}
                <Input
                    value={addon.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Add-on Name"
                    className="bg-black/40 border-white/10 text-white flex-1 max-w-[200px]"
                />

                {/* Price */}
                <div className="flex items-center gap-1">
                    <span className="text-white/40 text-sm">$</span>
                    <Input
                        type="number"
                        value={(addon.price / 100).toFixed(2)}
                        onChange={(e) => updateField("price", Math.round(parseFloat(e.target.value) * 100) || 0)}
                        className="bg-black/40 border-white/10 text-white w-24"
                        min={0}
                        step={0.01}
                    />
                </div>

                {/* Category */}
                <select
                    value={addon.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="bg-black/40 border border-white/10 text-white rounded-md px-3 py-2 text-sm"
                >
                    {CATEGORY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                {/* Max Qty */}
                <div className="flex items-center gap-1">
                    <span className="text-white/40 text-xs">MAX</span>
                    <Input
                        type="number"
                        value={addon.maxQuantity || ""}
                        onChange={(e) => updateField("maxQuantity", e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder="∞"
                        className="bg-black/40 border-white/10 text-white w-16"
                        min={1}
                    />
                </div>

                {/* Expand */}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-white/40 hover:text-white shrink-0"
                >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>

                {/* Delete */}
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(index)}
                    className="text-red-400/60 hover:text-red-400 hover:bg-red-400/10 shrink-0"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {/* Expanded Section */}
            {isExpanded && (
                <div className="border-t border-white/5 p-4 space-y-4 bg-white/[0.02]">
                    <Textarea
                        value={addon.description}
                        onChange={(e) => updateField("description", e.target.value)}
                        placeholder="Add-on description..."
                        className="bg-black/40 border-white/10 text-white min-h-[60px]"
                    />

                    {/* Bottle Service Specific Fields */}
                    {addon.category === "bottle_service" && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Wine className="h-4 w-4 text-purple-400" />
                                <span className="text-sm font-medium text-purple-400 uppercase tracking-wider">Bottle Service Details</span>
                            </div>

                            {/* Quick Bottle Presets */}
                            <div>
                                <label className="text-xs text-white/40 mb-2 block">Quick Select Bottle</label>
                                <div className="flex flex-wrap gap-2">
                                    {BOTTLE_PRESETS.map((preset) => (
                                        <button
                                            key={preset.label}
                                            type="button"
                                            onClick={() => applyBottlePreset(preset)}
                                            className="px-3 py-1.5 rounded-full text-xs border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/50 transition-colors"
                                        >
                                            {preset.label} — ${(preset.price / 100).toFixed(0)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-white/40 mb-1 block">Bottle Type</label>
                                    <Input
                                        value={addon.bottleServiceMeta.bottleType || ""}
                                        onChange={(e) => updateBottleMeta("bottleType", e.target.value)}
                                        placeholder="e.g., Hennessy VSOP"
                                        className="bg-black/40 border-white/10 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 mb-1 block">Table Location</label>
                                    <Input
                                        value={addon.bottleServiceMeta.tableLocation || ""}
                                        onChange={(e) => updateBottleMeta("tableLocation", e.target.value)}
                                        placeholder="e.g., VIP Section A, Poolside"
                                        className="bg-black/40 border-white/10 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 mb-1 block">Max Guests at Table</label>
                                    <Input
                                        type="number"
                                        value={addon.bottleServiceMeta.maxGuests || ""}
                                        onChange={(e) => updateBottleMeta("maxGuests", parseInt(e.target.value) || undefined)}
                                        placeholder="e.g., 8"
                                        className="bg-black/40 border-white/10 text-white"
                                        min={1}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/40 mb-1 block">Minimum Spend ($)</label>
                                    <Input
                                        type="number"
                                        value={addon.bottleServiceMeta.minSpend ? (addon.bottleServiceMeta.minSpend / 100).toFixed(2) : ""}
                                        onChange={(e) => updateBottleMeta("minSpend", Math.round(parseFloat(e.target.value) * 100) || undefined)}
                                        placeholder="e.g., 500.00"
                                        className="bg-black/40 border-white/10 text-white"
                                        min={0}
                                        step={0.01}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-3 rounded border border-white/10 bg-black/20">
                                <input
                                    type="checkbox"
                                    checked={addon.bottleServiceMeta.includesEntry || false}
                                    onChange={(e) => updateBottleMeta("includesEntry", e.target.checked)}
                                    className="rounded border-white/20"
                                />
                                <div>
                                    <span className="text-white text-sm">Includes Event Entry</span>
                                    <p className="text-white/40 text-xs">When enabled, purchasing this bottle service also grants event admission.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function createEmptyAddon(): AddonData {
    return {
        _clientId: crypto.randomUUID(),
        name: "",
        description: "",
        price: 0,
        category: "vip",
        maxQuantity: undefined,
        bottleServiceMeta: {},
    };
}

export function createBottleServiceAddon(): AddonData {
    return {
        _clientId: crypto.randomUUID(),
        name: "",
        description: "Premium bottle service with private table seating.",
        price: 0,
        category: "bottle_service",
        maxQuantity: undefined,
        bottleServiceMeta: {
            maxGuests: 8,
            includesEntry: true,
        },
    };
}
