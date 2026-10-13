import React, { useState, useRef, useEffect } from "react";
import { Sparkles, MessageSquare, Send, X, Bot, Ticket, Music, ShieldCheck, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAudioPlayer } from "@/context/AudioPlayerContext";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  card?: {
    title: string;
    tag: string;
    price: string;
    details: string[];
    actionLabel: string;
    actionPath: string;
    isTicket?: boolean;
  };
}

export const SavageConcierge = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [coordinatorData, setCoordinatorData] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "Wah gwan! I'm Savage Concierge, your autonomous 24/7 Caribbean Nightlife & VIP Event Coordinator. How can I assist you tonight?",
      card: {
        title: "MOVE YUH RASS • Early Bird Passes LIVE",
        tag: "🔥 TIER 1 ON SALE",
        price: "$20.00 (Limited 50 Passes)",
        details: [
          "Fri, Nov 27 • The Ainsworth, Hoboken",
          "Express entry line + 75 Soca Passport Credits",
          "Auto-tiering active: Next tier ($30) seeds upon sellout"
        ],
        actionLabel: "Lock In Early Bird ($20)",
        actionPath: "/events/4/move-yuh-rass",
        isTicket: true,
      }
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { playTrack } = useAudioPlayer();

  // Fetch real-time coordinator and live tier status
  useEffect(() => {
    fetch("/api/event-coordinator/status")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.activeEvent) {
          setCoordinatorData(data);
          const liveTier = data.liveTiers?.[0];
          const eventTitle = data.activeEvent.title;
          if (data.isLiveEnabled && liveTier) {
            setMessages([
              {
                id: "1",
                sender: "bot",
                text: `Wah gwan! I'm Savage Concierge, your autonomous 24/7 Caribbean Nightlife & VIP Event Coordinator. Tickets for ${eventTitle} are officially LIVE!`,
                card: {
                  title: `${eventTitle} • ${liveTier.name}`,
                  tag: `🔥 LIVE NOW • ${liveTier.remaining ?? liveTier.quantity} REMAINING`,
                  price: `${liveTier.priceFormatted} Each`,
                  details: [
                    "Fri, Nov 27 • The Ainsworth, Hoboken",
                    "75 Soca Passport Credits awarded upon entry",
                    "Auto-seed active: Next tier releases immediately upon sellout"
                  ],
                  actionLabel: `Claim ${liveTier.name} (${liveTier.priceFormatted})`,
                  actionPath: `/events/${data.activeEvent.id}`,
                  isTicket: true,
                }
              }
            ]);
          } else {
            setMessages([
              {
                id: "1",
                sender: "bot",
                text: `Wah gwan! I'm Savage Concierge, your autonomous 24/7 Caribbean Nightlife & VIP Event Coordinator. Tickets for ${eventTitle} are currently in staging mode and dropping soon!`,
                card: {
                  title: `${eventTitle} • Early Bird Drop`,
                  tag: `🔒 DROPPING SOON • STAGING`,
                  price: "$20.00 (Tier 1)",
                  details: [
                    "Fri, Nov 27 • The Ainsworth, Hoboken",
                    "Early Bird passes start at $20 (limited 50 passes)",
                    "Live tickets will unlock soon — stay ready!"
                  ],
                  actionLabel: `View Event Details`,
                  actionPath: `/events/${data.activeEvent.id}`,
                  isTicket: false,
                }
              }
            ]);
          }
        }
      })
      .catch((err) => {
        console.warn("[SavageConcierge] Status fetch note:", err);
      });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputMessage.trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");
    setIsTyping(true);

    setTimeout(() => {
      generateBotResponse(text.toLowerCase());
      setIsTyping(false);
    }, 800);
  };

  const generateBotResponse = (query: string) => {
    let reply: Message;

    const isLive = coordinatorData?.isLiveEnabled && !!coordinatorData?.liveTiers?.[0];
    const liveTier = coordinatorData?.liveTiers?.[0];
    const event = coordinatorData?.activeEvent;
    const tables = coordinatorData?.vipTablePackages || [];

    if (query.includes("ticket") || query.includes("tier") || query.includes("early bird") || query.includes("admission") || query.includes("event") || query.includes("move yuh")) {
      if (isLive && liveTier) {
        const tierName = liveTier.name;
        const tierPrice = liveTier.priceFormatted;
        const remaining = liveTier.remaining ?? liveTier.quantity ?? 50;

        reply = {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: `Official tickets for MOVE YUH RASS at The Ainsworth are LIVE! Current tier: ${tierName} at ${tierPrice}. Our autonomous coordinator monitors inventory in real-time — once this tier sells out, Tier 2 automatically seeds live and all ticket holders are notified.`,
          card: {
            title: `MOVE YUH RASS: ${tierName}`,
            tag: `⚡ ${remaining} TICKETS REMAINING`,
            price: `${tierPrice}`,
            details: [
              "Fri, Nov 27 • 10 PM - 2:30 AM • The Ainsworth, Hoboken",
              "Express Entry line + 75 Soca Passport Credits",
              "Next tier automatically goes live upon sellout"
            ],
            actionLabel: `Lock In ${tierName}`,
            actionPath: `/events/${event?.id || 4}`,
            isTicket: true,
          }
        };
      } else {
        reply = {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: `Tickets for ${event?.title || "MOVE YUH RASS"} are currently in staging mode and will go live shortly! Tier 1 Early Bird passes are set at $20.00 (limited 50 passes). Stay locked in — our autonomous coordinator will activate them and seed subsequent tiers automatically once live sales open.`,
          card: {
            title: `${event?.title || "MOVE YUH RASS"}: Early Bird Drop`,
            tag: `🔒 DROPPING SOON • STAGING`,
            price: `$20.00 Early Bird`,
            details: [
              "Fri, Nov 27 • 10 PM - 2:30 AM • The Ainsworth, Hoboken",
              "Express Entry line + 75 Soca Passport Credits",
              "Tickets will go live upon official announcement"
            ],
            actionLabel: `View Event Info`,
            actionPath: `/events/${event?.id || 4}`,
            isTicket: false,
          }
        };
      }
    } else if (query.includes("table") || query.includes("bottle") || query.includes("vip") || query.includes("cabana")) {
      reply = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "VIP Bottle Service table packages are officially LIVE for MOVE YUH RASS! Both Solo (1 Bottle + 2 Tickets) and Duo (2 Bottles + 4 Tickets) include reserved prime tables and dedicated bottle presentation.",
        card: {
          title: "MOVE YUH RASS • VIP Table Packages",
          tag: "👑 LIMITED 6 TABLES",
          price: "$250 (Solo) / $400 (Duo)",
          details: [
            "Includes Premium Bottles (Hennessy, Casamigos, Ciroc, D'Ussé)",
            "VIP Skip-the-Line Entry & Dedicated Cocktail Server",
            "150-250 Soca Passport Credits applied to account"
          ],
          actionLabel: "Reserve VIP Table",
          actionPath: `/events/${event?.id || 4}`,
          isTicket: true,
        }
      };
    } else if (query.includes("strategy") || query.includes("campaign") || query.includes("7-day") || query.includes("promo") || query.includes("code")) {
      const currentDay = coordinatorData?.strategyStatus?.currentActiveDay || 1;
      reply = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: `The Savage Gentlemen 7-Day Caribbean Strategy is currently running Day ${currentDay}! Our autonomous social engine dispatches viral Soca culture reels daily at 11:00 AM EST across Instagram, TikTok, and YouTube.`,
        card: {
          title: `7-Day Caribbean Strategy • Active Day ${currentDay}`,
          tag: "AUTONOMOUS MARKETING SUITE",
          price: "Code: CARIBBEAN10 (10% Off)",
          details: [
            "Automated multi-platform broadcasts to IG, TikTok & YouTube",
            "Featured: Savage Nocturne 480GSM French Terry Hoodie",
            "Daily ticket conversion loops & WhatsApp viral distribution"
          ],
          actionLabel: "View Streetwear Drop",
          actionPath: "/shop",
        }
      };
    } else if (query.includes("passport") || query.includes("credit") || query.includes("stamp")) {
      reply = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "Your Soca Passport awards you points and stamps every time you attend an event or check in via QR code! Event passes for MOVE YUH RASS award 75 credits (Premium Tier).",
        card: {
          title: "Soca Passport 1.0 Dashboard",
          tag: "ELITE STATUS AVAILABLE",
          price: "Free Activation",
          details: ["Earn 50-75 credits per fete", "Unlock country stamps for Trinidad, Barbados, Jamaica", "Redeem for $10 off passes and backstage wristbands"],
          actionLabel: "Open My Passport",
          actionPath: "/passport",
        }
      };
    } else if (query.includes("planner") || query.includes("carnival planner") || query.includes("itinerary") || query.includes("costume")) {
      reply = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "Looking for all-inclusive carnival concierge, bespoke fete schedules, and costume pickup? Visit our official luxury partner Carnival Planner!",
        card: {
          title: "Carnival Planner • Luxury Concierge",
          tag: "OFFICIAL PARTNER",
          price: "VIP Packages",
          details: ["All-inclusive fete schedules & VIP tickets", "Costume pickup & masquerader packages", "Trinidad, Barbados, Jamaica, Guyana & Miami"],
          actionLabel: "Visit Carnival-Planner.com",
          actionPath: "https://www.carnival-planner.com",
        }
      };
    } else if (query.includes("music") || query.includes("mix") || query.includes("stem") || query.includes("dj")) {
      reply = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "Streaming our latest Carnival Anthem preview mix right now! Full high-res downloads with isolated stems are available for $1.99.",
        card: {
          title: "Savage Vibes: Carnival Warmup 2026",
          tag: "HQ MASTER 320KBPS",
          price: "$1.99 Download",
          details: ["60-minute non-stop energetic Soca blend", "Tracklist cue sheet included", "Includes instrumental DJ intro edits"],
          actionLabel: "Listen & Purchase Mix",
          actionPath: "/media",
        }
      };
    } else {
      reply = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "I am your autonomous Event Coordinator and Caribbean Culture Connoisseur. I can help you claim Early Bird passes ($20), reserve VIP Bottle Service tables, check live ticket tiers, explore the 7-day marketing strategy, or plan carnival travel with Carnival Planner. How would you like to proceed?",
      };
    }

    setMessages((prev) => [...prev, reply]);
  };

  return (
    <>
      {/* Floating Concierge Launch Button */}
      <div className="fixed bottom-20 right-3 md:bottom-24 md:right-8 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative flex items-center gap-2 p-2 sm:px-4 sm:py-3 rounded-full glass-obsidian-strong border border-gold-500/40 shadow-2xl hover:scale-105 transition-all duration-300 hover:border-gold-400"
          aria-label="Toggle Savage Concierge AI"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gold-600 to-amber-400 flex items-center justify-center text-black font-bold shadow-md shadow-gold-500/30">
              <Bot className="w-4 h-4 text-black" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-black animate-pulse" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-[10px] uppercase tracking-widest text-gold-400 font-bold leading-tight">AI Coordinator</p>
            <p className="text-xs font-semibold text-white leading-tight">Event Connoisseur</p>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-gold-400 hidden sm:block animate-bounce-slow" />
        </button>
      </div>

      {/* Concierge Drawer Modal */}
      {isOpen && (
        <div className="fixed bottom-16 right-2 left-2 sm:left-auto sm:right-8 md:bottom-28 z-50 sm:w-[420px] max-h-[80vh] h-[540px] flex flex-col rounded-2xl glass-obsidian-strong border border-gold-500/30 shadow-2xl shadow-black/90 backdrop-blur-2xl overflow-hidden animate-fade-in-up">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-500 to-amber-600 flex items-center justify-center text-black font-bold shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  Savage Concierge
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                    AUTONOMOUS LIVE
                  </span>
                </h3>
                <p className="text-xs text-white/50">VIP Nightlife, Live Tiers & Strategy Bot</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar bg-white/[0.02]">
            <button
              onClick={() => handleSend("Tell me about MOVE YUH RASS tickets and live tiers")}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-gold-500/20 border border-white/10 hover:border-gold-500/40 text-white/80 whitespace-nowrap transition"
            >
              🎟️ Early Bird ($20)
            </button>
            <button
              onClick={() => handleSend("What VIP bottle service table packages are available?")}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-gold-500/20 border border-white/10 hover:border-gold-500/40 text-white/80 whitespace-nowrap transition"
            >
              🍾 VIP Tables ($250+)
            </button>
            <button
              onClick={() => handleSend("How does the 7-day Caribbean strategy work?")}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-gold-500/20 border border-white/10 hover:border-gold-500/40 text-white/80 whitespace-nowrap transition"
            >
              🔥 7-Day Strategy
            </button>
            <button
              onClick={() => handleSend("Soca Passport credits & stamps")}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-gold-500/20 border border-white/10 hover:border-gold-500/40 text-white/80 whitespace-nowrap transition"
            >
              🧭 Soca Passport
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-gold-600 to-amber-600 text-black font-semibold rounded-tr-none shadow-md"
                      : "bg-white/10 text-white border border-white/10 rounded-tl-none"
                  }`}
                >
                  {msg.text}
                </div>

                {msg.card && (
                  <div className="mt-2.5 w-full sm:max-w-[340px] rounded-xl border border-gold-500/40 bg-black/60 p-3.5 backdrop-blur-md shadow-xl text-left">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/30 font-mono tracking-wider">
                        {msg.card.tag}
                      </span>
                      <span className="text-xs font-extrabold text-gold-400">
                        {msg.card.price}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-2 leading-snug">
                      {msg.card.title}
                    </h4>

                    <ul className="space-y-1 mb-3">
                      {msg.card.details.map((detail, idx) => (
                        <li key={idx} className="text-[11px] text-white/70 flex items-start gap-1.5">
                          <span className="text-gold-400 font-bold">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => {
                        if (msg.card?.actionPath.startsWith("http")) {
                          window.open(msg.card.actionPath, "_blank");
                        } else {
                          navigate(msg.card?.actionPath || "/events");
                          setIsOpen(false);
                        }
                      }}
                      className="w-full h-8 text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-black shadow-md shadow-gold-500/20"
                    >
                      {msg.card.actionLabel}
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-gold-400 text-xs px-2 py-1">
                <Bot className="w-3.5 h-3.5 animate-spin" />
                <span>Savage Concierge is coordinating live availability...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-white/10 bg-black/40">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about live tickets, VIP tables, strategy..."
                className="h-9 text-xs bg-white/5 border-white/10 focus-visible:ring-gold-500/50 text-white placeholder:text-white/40"
              />
              <Button
                type="submit"
                size="sm"
                className="h-9 px-3 bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-black font-bold"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
