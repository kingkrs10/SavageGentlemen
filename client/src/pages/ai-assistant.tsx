import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, MessageSquare, Settings, Bot, Send, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AiProvider {
  name: string;
  models: string[];
}

interface AiConfig {
  id: number;
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  isActive: boolean;
  systemPrompt?: string;
  createdAt: string;
}

interface ChatSession {
  id: number;
  configId: number;
  title: string;
  context?: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: number;
  sessionId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokenCount?: number;
  cost?: number;
  processingTime?: number;
  createdAt: string;
}

export default function AiAssistant() {
  const [activeTab, setActiveTab] = useState<'chat' | 'configs'>('chat');
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch AI providers
  const { data: providers } = useQuery<AiProvider[]>({
    queryKey: ['/api/ai/providers'],
  });

  // Fetch AI configs
  const { data: configs } = useQuery<AiConfig[]>({
    queryKey: ['/api/ai/configs'],
  });

  // Fetch chat sessions
  const { data: sessions } = useQuery<ChatSession[]>({
    queryKey: ['/api/ai/sessions'],
  });

  // Fetch messages for selected session
  const { data: messages } = useQuery<ChatMessage[]>({
    queryKey: ['/api/ai/sessions', selectedSession, 'messages'],
    enabled: !!selectedSession,
  });

  // Create AI config mutation
  const createConfigMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/ai/configs', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/configs'] });
      setConfigDialogOpen(false);
      toast({ title: "AI configuration created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating AI configuration", description: error.message, variant: "destructive" });
    },
  });

  // Create chat session mutation
  const createSessionMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/ai/sessions', 'POST', data),
    onSuccess: (session: ChatSession) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/sessions'] });
      setSessionDialogOpen(false);
      setSelectedSession(session.id);
      toast({ title: "Chat session created successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error creating chat session", description: error.message, variant: "destructive" });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ sessionId, content }: { sessionId: number; content: string }) =>
      apiRequest(`/api/ai/sessions/${sessionId}/messages`, 'POST', { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/sessions', selectedSession, 'messages'] });
      setNewMessage('');
    },
    onError: (error: any) => {
      toast({ title: "Error sending message", description: error.message, variant: "destructive" });
    },
  });

  // Delete config mutation
  const deleteConfigMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/ai/configs/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/configs'] });
      toast({ title: "AI configuration deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting configuration", description: error.message, variant: "destructive" });
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/ai/sessions/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/sessions'] });
      if (selectedSession === id) {
        setSelectedSession(null);
      }
      toast({ title: "Chat session deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error deleting session", description: error.message, variant: "destructive" });
    },
  });

  const handleSendMessage = () => {
    if (!selectedSession || !newMessage.trim()) return;
    
    sendMessageMutation.mutate({ 
      sessionId: selectedSession, 
      content: newMessage.trim() 
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bot className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">AI Assistant</h1>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'chat' ? 'default' : 'outline'}
              onClick={() => setActiveTab('chat')}
              className="flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Chat
            </Button>
            <Button
              variant={activeTab === 'configs' ? 'default' : 'outline'}
              onClick={() => setActiveTab('configs')}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Configurations
            </Button>
          </div>
        </div>

        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Session Sidebar */}
            <Card className="lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Chat Sessions</CardTitle>
                <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      New
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Chat Session</DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        createSessionMutation.mutate({
                          configId: parseInt(formData.get('configId') as string),
                          title: formData.get('title') as string,
                          context: formData.get('context') as string,
                        });
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <Label htmlFor="configId">AI Configuration</Label>
                        <Select name="configId" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select configuration" />
                          </SelectTrigger>
                          <SelectContent>
                            {configs?.map((config) => (
                              <SelectItem key={config.id} value={config.id.toString()}>
                                {config.provider} - {config.model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="title">Session Title</Label>
                        <Input name="title" placeholder="Enter session title" required />
                      </div>
                      <div>
                        <Label htmlFor="context">Context (Optional)</Label>
                        <Textarea name="context" placeholder="Additional context for the session" />
                      </div>
                      <Button type="submit" disabled={createSessionMutation.isPending}>
                        {createSessionMutation.isPending ? 'Creating...' : 'Create Session'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {sessions?.map((session) => (
                    <div
                      key={session.id}
                      className={`p-3 rounded-lg cursor-pointer mb-2 flex items-center justify-between ${
                        selectedSession === session.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedSession(session.id)}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{session.title}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(session.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSessionMutation.mutate(session.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>
                  {selectedSession ? 
                    sessions?.find(s => s.id === selectedSession)?.title : 
                    'Select a chat session'
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSession ? (
                  <div className="space-y-4">
                    <ScrollArea className="h-96 border rounded-lg p-4">
                      {messages?.map((message) => (
                        <div
                          key={message.id}
                          className={`mb-4 ${
                            message.role === 'user' ? 'text-right' : 'text-left'
                          }`}
                        >
                          <div
                            className={`inline-block p-3 rounded-lg max-w-[80%] ${
                              message.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <p>{message.content}</p>
                            {message.tokenCount && (
                              <div className="text-xs mt-2 opacity-75">
                                {message.tokenCount} tokens
                                {message.processingTime && ` • ${message.processingTime}ms`}
                                {message.cost && ` • $${(message.cost / 100).toFixed(4)}`}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                    
                    <div className="flex gap-2">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1"
                        rows={3}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Select a chat session to start chatting with AI</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'configs' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">AI Configurations</h2>
              <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Configuration
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create AI Configuration</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      createConfigMutation.mutate({
                        provider: formData.get('provider') as string,
                        model: formData.get('model') as string,
                        apiKey: formData.get('apiKey') as string,
                        customEndpoint: formData.get('customEndpoint') as string,
                        systemPrompt: formData.get('systemPrompt') as string,
                        temperature: parseFloat(formData.get('temperature') as string),
                        maxTokens: parseInt(formData.get('maxTokens') as string),
                      });
                    }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="provider">Provider</Label>
                        <Select name="provider" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            {providers?.map((provider) => (
                              <SelectItem key={provider.name} value={provider.name}>
                                {provider.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="model">Model</Label>
                        <Input name="model" placeholder="e.g., gpt-4" required />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input name="apiKey" type="password" placeholder="Enter API key" required />
                    </div>
                    <div>
                      <Label htmlFor="customEndpoint">Custom Endpoint (Optional)</Label>
                      <Input name="customEndpoint" placeholder="https://api.example.com/v1" />
                    </div>
                    <div>
                      <Label htmlFor="systemPrompt">System Prompt (Optional)</Label>
                      <Textarea name="systemPrompt" placeholder="Enter system prompt" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="temperature">Temperature</Label>
                        <Input
                          name="temperature"
                          type="number"
                          step="0.1"
                          min="0"
                          max="2"
                          defaultValue="0.7"
                        />
                      </div>
                      <div>
                        <Label htmlFor="maxTokens">Max Tokens</Label>
                        <Input
                          name="maxTokens"
                          type="number"
                          defaultValue="1000"
                          min="1"
                          max="4000"
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={createConfigMutation.isPending}>
                      {createConfigMutation.isPending ? 'Creating...' : 'Create Configuration'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {configs?.map((config) => (
                <Card key={config.id}>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">{config.provider}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={config.isActive ? 'default' : 'secondary'}>
                        {config.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteConfigMutation.mutate(config.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p><strong>Model:</strong> {config.model}</p>
                      <p><strong>Temperature:</strong> {config.temperature}</p>
                      <p><strong>Max Tokens:</strong> {config.maxTokens}</p>
                      {config.systemPrompt && (
                        <p><strong>System Prompt:</strong> {config.systemPrompt.substring(0, 100)}...</p>
                      )}
                      <p className="text-sm text-gray-500">
                        Created: {new Date(config.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}