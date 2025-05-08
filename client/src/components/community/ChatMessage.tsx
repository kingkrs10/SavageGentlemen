import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ChatMessage as ChatMessageType } from "@/lib/types";

interface ChatMessageProps {
  message: ChatMessageType;
  isCurrentUser: boolean;
}

const ChatMessage = ({ message, isCurrentUser }: ChatMessageProps) => {
  return (
    <div className={cn(
      "mb-2 flex gap-2 items-start",
      isCurrentUser ? "flex-row-reverse" : ""
    )}>
      <Avatar className="w-8 h-8">
        <AvatarImage src={message.user.avatar} />
        <AvatarFallback>{message.user.displayName.charAt(0)}</AvatarFallback>
      </Avatar>
      
      <div className={cn(
        "chat-message px-3 py-2",
        isCurrentUser ? "user-message" : "other-message"
      )}>
        <div className="flex items-center">
          <span className={cn(
            "font-bold text-sm",
            isCurrentUser ? "text-white" : "text-accent"
          )}>
            {isCurrentUser ? "You" : message.user.displayName}
          </span>
          <span className="text-xs text-gray-400 ml-1">
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-sm">{message.content}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
