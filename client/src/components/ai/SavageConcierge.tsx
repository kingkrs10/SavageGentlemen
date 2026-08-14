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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "bot",
      text: "Wah gwan! I'm Savage Concierge, your autonomous 24/7 Caribbean Nightlife & VIP booking agent. How can I assist you tonight?",
      card: {
        title: "Soca Noir: Caribbean Nocturne VIP Cabana",
        tag: "🔥 2 Tables Left",
        price: "$450 (6 Guests)",
        details: [
          "1 Premium Bottle Service + Mixers",
          "Dedicated VIP Host & Fast-Track Entry",
          "Soca Passport Elite: -$50 Applied at checkout"
        ],
        actionLabel: "Reserve VIP Cabana",
        actionPath: "/events/1/soca-noir",
        isTicket: true,
      }
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { playTrack } = useAudioPlayer();

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
    }, 900);
  };

  const generateBotResponse = (query: string) => {
    let reply: Message;

    if (query.includes("ticket") || query.includes("event") || query.includes("soca noir") || query.includes("fete")) {
      reply = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "Here is our upcoming marquee event: Soca Noir Caribbean Nocturne! Tier 1 Early Bird passes are 85% claimed.",
        card: {
          title: "Soca Noir: Caribbean Nocturne",
          tag: "SAT, OCT 26 • 9 PM - 4 AM",
          price: "$35 General / $85 VIP",
          details: ["DJ Private Ryan, DJ Puffy, Lord Hype", "The Rooftop @ Skyline Venue", "Holographic Pass + 50 Soca Passport Credits"],
          actionLabel: "View Tickets & Passes",
          actionPath: "/events",
          isTicket: true,
        }
      };
    } else if (query.includes("passport") || query.includes("credit") || query.includes("tier") || query.includes("stamp")) {
      reply = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "Your Soca Passport is your key to the global carnival circuit! Check-in at events to unlock gold foil stamps, earn credits, and claim VIP discounts.",
        card: {
          title: "Soca Passport 1.0 Dashboard",
          tag: "ELITE STATUS AVAILABLE",
          price: "Free Activation",
          details: ["Earn 50-75 credits per fete", "Unlock country stamps for Trinidad, Barbados, Jamaica", "Redeem for $10 off passes and backstage wristbands"],
          actionLabel: "Open My Passport",
          actionPath: "/passport",
        }
      };
    } else if (query.includes("app") || query.includes("matrix") || query.includes("void") || query.includes("bot") || query.includes("decoder") || query.includes("riddim") || query.includes("soca")) {
      reply = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "Switch into 'The Void // Apps Matrix' mode or launch itsSOCA DECODER to isolate stems, recognize riddims, and sync DJ crates to Serato / Rekordbox.",
        card: {
          title: "itsSOCA DECODER",
          tag: "AUTONOMOUS SUITE",
          price: "Free / $29 mo",
          details: ["Demucs AI Stem Separation (Vocals vs Beat)", "RiddimDB Acoustic Fingerprinting", "1-Click Serato & Rekordbox .crate export"],
          actionLabel: "Launch itsSOCA Decoder",
          actionPath: "/apps/itssoca-decoder",
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
        text: "I can help you reserve VIP tickets, preview DJ mixes, claim Soca Passport rewards, or launch autonomous creator bots. What would you like to explore?",
      };
    }

    setMessages((prev) => [...prev, reply]);
  };

  return (
    <>
      {/* Floating Concierge Launch Button */}
      <div className="fixed bottom-24 right-4 md:bottom-24 md:right-8 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full glass-obsidian-strong border border-gold-500/40 shadow-2xl hover:scale-105 transition-all duration-300 hover:border-gold-400"
          aria-label="Toggle Savage Concierge AI"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gold-600 to-amber-400 flex items-center justify-center text-black font-bold shadow-md shadow-gold-500/30">
              <Bot className="w-4 h-4 text-black" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-black animate-pulse" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-[10px] uppercase tracking-widest text-gold-400 font-bold leading-tight">AI Concierge</p>
            <p className="text-xs font-semibold text-white leading-tight">Savage Assistant</p>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-gold-400 animate-bounce-slow" />
        </button>
      </div>

      {/* Concierge Drawer Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 md:bottom-28 md:right-8 z-50 w-[92vw] sm:w-[420px] max-h-[600px] h-[550px] flex flex-col rounded-2xl glass-obsidian-strong border border-gold-500/30 shadow-2xl shadow-black/90 backdrop-blur-2xl overflow-hidden animate-fade-in-up">
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
                    24/7 ONLINE
                  </span>
                </h3>
                <p className="text-xs text-white/50">VIP Nightlife & Autonomous Booking Agent</p>
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
              onClick={() => handleSend("Soca Noir VIP Tickets")}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-gold-500/20 border border-white/10 hover:border-gold-500/40 text-white/80 whitespace-nowrap transition"
            >
              🎟️ VIP Tickets
            </button>
            <button
              onClick={() => handleSend("Soca Passport credits & stamps")}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-gold-500/20 border border-white/10 hover:border-gold-500/40 text-white/80 whitespace-nowrap transition"
            >
              🧭 Soca Passport
            </button>
            <button
              onClick={() => handleSend("Creator AI bots & IslandLyric.bot")}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 hover:bg-gold-500/20 border border-white/10 hover:border-gold-500/40 text-white/80 whitespace-nowrap transition"
            >
              ⚡ Creator Bots
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

                {/* Rich Action Card */}
                {msg.card && (
                  <div className="mt-2.5 w-full max-w-[90%] rounded-xl glass-obsidian border border-gold-500/40 p-3 shadow-lg">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/30">
                        {msg.card.tag}
                      </span>
                      <span className="text-xs font-bold text-gold-400">{msg.card.price}</span>
                    </div>
                    <h4 className="text-xs font-bold text-white mb-2">{msg.card.title}</h4>
                    <ul className="space-y-1 mb-3">
                      {msg.card.details.map((detail, idx) => (
                        <li key={idx} className="text-[11px] text-white/70 flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-gold-400 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      size="sm"
                      onClick={() => {
                        setIsOpen(false);
                        navigate(msg.card!.actionPath);
                      }}
                      className="w-full bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-black font-bold uppercase tracking-wider text-xs py-1.5 h-8 rounded-lg shadow-md shadow-gold-500/20"
                    >
                      {msg.card.actionLabel}
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 text-xs text-gold-400 font-mono">
                <Bot className="w-4 h-4 animate-spin" />
                <span>Savage Concierge is analyzing availability...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 border-t border-white/10 bg-black/50 flex items-center gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Ask about VIP tables, tickets, passport..."
              className="bg-white/5 border-white/15 text-xs text-white placeholder:text-white/40 focus-visible:ring-gold-500 rounded-xl"
            />
            <Button
              size="icon"
              onClick={() => handleSend()}
              className="bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-black font-bold rounded-xl h-9 w-9 flex-shrink-0 shadow-md shadow-gold-500/20"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
