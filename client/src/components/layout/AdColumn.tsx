import { Card } from "@/components/ui/card";

interface AdColumnProps {
    position: 'left' | 'right';
    className?: string;
}

export function AdColumn({ position, className = "" }: AdColumnProps) {
    return (
        <div className={`hidden xl:block w-[160px] flex-shrink-0 ${className}`}>
            <div className="sticky top-24 space-y-4">
                {/* Ad Container 160x600 */}
                <Card className="w-[160px] h-[600px] bg-black/40 border-primary/20 flex items-center justify-center overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50" />

                    <div className="text-center p-4 z-10">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Advertisement</span>
                        <div className="w-full h-px bg-primary/20 mb-4" />
                        <p className="text-xs text-muted-foreground/50">
                            Vertical Skyscraper<br />160x600
                        </p>
                    </div>

                    {/* Placeholder "Glow" effect */}
                    <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors duration-500" />
                </Card>
            </div>
        </div>
    );
}
