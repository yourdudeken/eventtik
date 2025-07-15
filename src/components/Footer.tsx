import { Ticket, Mail, Phone, MapPin, MessageCircle, HelpCircle } from "lucide-react";
import { NewsletterSubscription } from "./NewsletterSubscription";

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12 mt-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Ticket className="h-6 w-6 text-blue-400" />
              <span className="text-xl font-bold">EventTix</span>
            </div>
            <p className="text-gray-400 text-sm">
              The easiest way to buy and sell event tickets in Kenya. 
              Instant payments with M-Pesa.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/" className="hover:text-white">Buy Tickets</a></li>
              <li><a href="/?view=creator" className="hover:text-white">Create Event</a></li>
              <li><a href="#how-it-works" className="hover:text-white">How it Works</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href="mailto:support@eventtix.co.ke" className="hover:text-white flex items-center gap-2">
                  <HelpCircle className="h-3 w-3" />
                  Help Center
                </a>
              </li>
              <li>
                <a href="mailto:support@eventtix.co.ke" className="hover:text-white flex items-center gap-2">
                  <MessageCircle className="h-3 w-3" />
                  Contact Support
                </a>
              </li>
              <li>
                <a href="tel:+254712345678" className="hover:text-white flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  Call Support
                </a>
              </li>
              <li><a href="#terms" className="hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Contact Info</h4>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:+254712345678" className="hover:text-white">+254 712 345 678</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:support@eventtix.co.ke" className="hover:text-white">support@eventtix.co.ke</a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Nairobi, Kenya</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <NewsletterSubscription />
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 EventTix. All rights reserved. | 
            <a href="mailto:support@eventtix.co.ke" className="hover:text-white ml-2">Need Help?</a>
          </p>
        </div>
      </div>
    </footer>
  );
};
