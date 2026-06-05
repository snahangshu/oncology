import { useState } from 'react';
import { Phone, X } from 'lucide-react';
import { api } from '../../shared/api';
import { toast } from 'sonner';

export default function VoiceAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWidgetUrl = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/ai/voice-widget');
      setIframeUrl(response.data.iframe_url);
      setIsOpen(true);
    } catch (err) {
      console.error("Failed to load voice assistant", err);
      toast.error("Failed to connect to the Care Coordinator. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      if (!iframeUrl) {
        fetchWidgetUrl();
      } else {
        setIsOpen(true);
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && iframeUrl && (
        <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)] mb-4 overflow-hidden animate-in slide-in-from-bottom-5 duration-300 w-[360px] h-[600px] flex flex-col">
          <div className="bg-slate-800/80 p-3 flex justify-between items-center border-b border-slate-700/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <Phone className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-white font-bold text-sm tracking-wide">Meenakshi</p>
                <p className="text-cyan-400 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Care Coordinator
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-slate-700/50 rounded-full text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <iframe 
            src={iframeUrl} 
            allow="microphone"
            className="w-full flex-1 bg-[#142744]"
            style={{ border: 'none' }}
          />
        </div>
      )}
      
      {!isOpen && (
        <button
          onClick={handleToggle}
          disabled={isLoading}
          className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center text-white hover:scale-110 transition-transform group relative overflow-hidden"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Phone className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-100 rounded-full transition-transform duration-300 origin-center" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
