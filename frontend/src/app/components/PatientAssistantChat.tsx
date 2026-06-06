import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Paperclip } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { api } from '../shared/api';
import { toast } from 'sonner';

export function PatientAssistantChat({ patientId, autoOpen = false }: { patientId: number, autoOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [history, setHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [history, isOpen]);

  const sendMessage = async () => {
    if (!message.trim() && !file) return;
    const userMessage = message;
    setMessage('');
    
    let msgContent = userMessage;
    if (file) msgContent += `\n📎 ${file.name}`;
    setHistory(prev => [...prev, { role: 'user', content: msgContent }]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', userMessage || "Here is the document.");
      if (file) {
        formData.append('file', file);
      }
      
      const res = await api.post(`/patients/${patientId}/chat`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setHistory(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
      if (res.data.action_taken) {
         toast.success(res.data.action_taken);
      }
      setFile(null);
    } catch (err) {
      toast.error('Failed to send message.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 shadow-lg shadow-violet-500/30 transition-transform z-40 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageSquare className="w-6 h-6 text-slate-900" />
      </Button>

      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-80 md:w-96 h-[500px] flex flex-col bg-white border-slate-200 shadow-2xl z-50 animate-in slide-in-from-bottom-5">
          <CardHeader className="p-4 border-b border-slate-800 bg-white flex flex-row items-center justify-between">
            <CardTitle className="text-slate-900 text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              Clinical Assistant
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {history.length === 0 && (
                <div className="text-center text-sm text-slate-500 mt-4">
                  Hello! I'm your AI Clinical Assistant. How can I help you today? You can ask questions, check symptoms, or request medication refills.
                </div>
              )}
              {history.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-cyan-600 text-slate-900 rounded-br-sm' : 'bg-slate-100 text-slate-200 rounded-bl-sm'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 text-slate-200 p-3 rounded-2xl rounded-bl-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 bg-slate-900 border-t border-slate-800">
              {file && (
                <div className="flex items-center gap-2 mb-2 text-xs text-cyan-400 bg-cyan-500/10 p-2 rounded-md">
                  <Paperclip className="w-3 h-3" />
                  {file.name}
                  <button onClick={() => setFile(null)} className="ml-auto hover:text-white" type="button"><X className="w-3 h-3" /></button>
                </div>
              )}
              <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-2">
                <input
                  type="file"
                  id="chat-file-upload"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-white" onClick={() => document.getElementById('chat-file-upload')?.click()}>
                  <Paperclip className="w-4 h-4" />
                </Button>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="flex-1 bg-slate-100 border-slate-200 text-sm text-slate-900 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <Button type="submit" disabled={isLoading || (!message.trim() && !file)} size="icon" className="h-9 w-9 rounded-full bg-cyan-600 hover:bg-cyan-700">
                  <Send className="w-4 h-4 text-white" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
