
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

  const quickActions = [
    "How do I buy tickets?",
    "Payment methods",
    "Event creation guide",
    "Technical support",
    "Refund policy"
  ];

  const botResponses: { [key: string]: string } = {
    "how do i buy tickets": "To buy tickets: 1) Browse events on the home page, 2) Click on an event you like, 3) Fill in your details, 4) Pay with M-Pesa. No account required!",
    "payment methods": "We accept M-Pesa payments. Simply enter your phone number and you'll receive an STK push to complete payment.",
    "event creation guide": "To create events: 1) Sign up for an account, 2) Click 'Create Event', 3) Fill in event details, 4) Set ticket price, 5) Publish your event!",
    "technical support": "For technical issues: 1) Check your internet connection, 2) Clear browser cache, 3) Try refreshing the page. If problems persist, contact our support team.",
    "refund policy": "Refunds are processed within 3-5 business days. Contact the event organizer directly for refund requests through your digital ticket.",
    "default": "I'm here to help with EventTix! You can ask me about buying tickets, creating events, payments, or general site navigation."
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Generate bot response
    setTimeout(() => {
      const lowerInput = inputMessage.toLowerCase();
      let response = botResponses.default;

      // Check for keyword matches
      for (const [key, value] of Object.entries(botResponses)) {
        if (key !== 'default' && lowerInput.includes(key)) {
          response = value;
          break;
        }
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    }, 1000);

    setInputMessage('');
  };

  const handleQuickAction = (action: string) => {
    setInputMessage(action);
    handleSendMessage();
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
              </div>
            </ScrollArea>

            {/* Quick Actions */}
            {messages.length <= 1 && (
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
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="h-8 w-8"
                  disabled={!inputMessage.trim()}
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
