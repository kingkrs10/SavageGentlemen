import { Link } from "wouter";
import { Blocks, Languages, ArrowRight } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const apps = [
    {
        id: "language-sensei",
        name: "Language Sensei",
        icon: "⛩️",
        description: "Learn Japanese through AI-powered conversation. Messages appear in three layers: Japanese, Romaji, and English.",
        tags: ["AI", "Japanese", "Education"],
        path: "/apps/language-sensei",
        external: false,
        gradient: "from-red-900/40 to-amber-900/30",
        accentColor: "text-amber-400",
        borderColor: "border-red-800/30",
    },
    {
        id: "survival-map",
        name: "Survival Map Generator",
        icon: "🗺️",
        description: "Generate a personalized survival & emergency preparedness map for any location. Download as a printable PDF with gear recommendations.",
        tags: ["Survival", "Maps", "PDF"],
        path: "https://survival-map-36664345587.us-central1.run.app/",
        external: true,
        gradient: "from-emerald-900/40 to-teal-900/30",
        accentColor: "text-emerald-400",
        borderColor: "border-emerald-800/30",
    },
];

function AppCard({ app }: { app: typeof apps[number] }) {
    return (
        <div
            className={`group relative overflow-hidden rounded-2xl border ${app.borderColor} bg-gradient-to-br ${app.gradient} backdrop-blur-sm p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-red-900/20 cursor-pointer`}
        >
            <div className="text-4xl mb-4">{app.icon}</div>
            <h3 className="text-lg font-semibold tracking-wide text-white mb-2">{app.name}</h3>
            <p className="text-sm text-white/50 leading-relaxed mb-4">{app.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
                {app.tags.map((tag) => (
                    <span key={tag} className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/10 text-white/40 bg-white/5">
                        {tag}
                    </span>
                ))}
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${app.accentColor} group-hover:gap-2 transition-all duration-200`}>
                Open App
                <ArrowRight className="w-4 h-4" />
            </div>
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-red-500/5 blur-3xl group-hover:bg-red-500/10 transition-all duration-500" />
        </div>
    );
}

export default function Apps() {
    return (
        <>
            <SEOHead
                title="Apps"
                description="Explore mini-apps built by Savage Gentlemen. Language learning, tools, and more."
            />

            <div className="max-w-5xl mx-auto py-4">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs uppercase tracking-[0.2em] text-white/60 mb-4">
                        <Blocks className="w-3.5 h-3.5" />
                        App Gallery
                    </div>
                    <h1 className="text-3xl md:text-4xl font-heading tracking-widest uppercase text-white mb-3">
                        Apps
                    </h1>
                    <p className="text-white/50 max-w-md mx-auto text-sm">
                        Mini-apps and tools crafted for the community. Tap into something new.
                    </p>
                </div>

                {/* App Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {apps.map((app) =>
                        app.external ? (
                            <a key={app.id} href={app.path} target="_blank" rel="noopener noreferrer">
                                <AppCard app={app} />
                            </a>
                        ) : (
                            <Link key={app.id} href={app.path}>
                                <AppCard app={app} />
                            </Link>
                        )
                    )}

                    {/* Coming Soon placeholder */}
                    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-6 flex flex-col items-center justify-center text-center min-h-[220px]">
                        <div className="text-3xl mb-3 opacity-30">🚀</div>
                        <p className="text-sm text-white/20 uppercase tracking-widest font-semibold">
                            More Apps Coming Soon
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
