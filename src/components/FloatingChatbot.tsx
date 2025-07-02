import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User,
  Minimize2,
  Maximize2
} from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your EventTix assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickActions = [
    "How do I buy tickets?",
    "Payment methods",
    "Event creation guide",
    "Technical support",
    "Refund policy"
  ];

  const sendToWebhook = async (message: string): Promise<string> => {
    try {
      console.log('Sending message to webhook:', message);
      
      // First, make a POST request
      const postResponse = await fetch('http://172.237.108.4:5678/webhook-test/b76789e8-26d6-4b4b-8d72-2cd85de257e3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          timestamp: new Date().toISOString(),
          source: 'eventtix-chatbot'
        })
      });

      console.log('POST response status:', postResponse.status);

      if (!postResponse.ok) {
        console.error('POST request failed - Status:', postResponse.status);
        return "I'm having trouble connecting right now. Please try again in a moment.";
      }

      // Wait for a moment before making the GET request
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

      // Then make a GET request to retrieve the response
      const getResponse = await fetch('http://172.237.108.4:5678/webhook-test/b76789e8-26d6-4b4b-8d72-2cd85de257e3', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('GET response status:', getResponse.status);

      if (getResponse.ok) {
        const responseText = await getResponse.text();
        console.log('GET response:', responseText);
        
        // If the webhook returns JSON, try to parse it
        try {
          const jsonResponse = JSON.parse(responseText);
          return jsonResponse.message || jsonResponse.response || responseText || "Thank you for your message! I'm here to help with EventTix.";
        } catch {
          // If it's not JSON, return the text response
          return responseText || "Thank you for your message! I'm here to help with EventTix.";
        }
      } else {
        console.error('GET request failed - Status:', getResponse.status);
        return "I'm having trouble getting a response right now. Please try again in a moment.";
      }
    } catch (error) {
      console.error('Webhook request error:', error);
      return "I'm having trouble connecting right now. Please try again in a moment.";
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    console.log('Sending message to webhook and waiting for response...');
    
    // Send to webhook and wait for response
    const webhookResponse = await sendToWebhook(currentMessage);

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: webhookResponse,
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
  };

  const handleQuickAction = async (action: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: action,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Send to webhook and wait for response
    const webhookResponse = await sendToWebhook(action);

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: webhookResponse,
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        <Badge className="absolute -top-2 -left-2 bg-green-500">
          Online
        </Badge>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`w-80 shadow-xl transition-all duration-300 ${
        isMinimized ? 'h-16' : 'h-96'
      }`}>
        <CardHeader className="flex flex-row items-center justify-between p-4 bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <CardTitle className="text-sm">EventTix Assistant</CardTitle>
            <Badge variant="secondary" className="bg-green-500 text-xs">
              Online
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white hover:bg-blue-700"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white hover:bg-blue-700"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-80">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.sender === 'bot' && (
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-3 w-3 text-blue-600" />
                      </div>
                    )}
                    <div
                      className={`max-w-[200px] rounded-lg p-2 text-sm ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.text}
                    </div>
                    {message.sender === 'user' && (
                      <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <User className="h-3 w-3 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3 w-3 text-blue-600" />
                    </div>
                    <div className="bg-gray-100 text-gray-900 max-w-[200px] rounded-lg p-2 text-sm ml-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick Actions */}
            {messages.length <= 1 && !isLoading && (
              <div className="p-3 border-t">
                <div className="text-xs text-gray-500 mb-2">Quick questions:</div>
                <div className="flex flex-wrap gap-1">
                  {quickActions.slice(0, 3).map((action) => (
                    <Button
                      key={action}
                      variant="outline"
                      size="sm"
                      className="text-xs h-6"
                      onClick={() => handleQuickAction(action)}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 h-8 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="h-8 w-8"
                  disabled={!inputMessage.trim() || isLoading}
                >
                  <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
