
'use client';

import {useState, useRef, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Send, Camera, MapPin, Mic, StopCircle, Loader2} from 'lucide-react';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '../ui/tooltip';
import {useToast} from '@/hooks/use-toast';

interface ChatInputProps {
  onSendMessage: (text: string, file?: File) => void;
}

export default function ChatInput({onSendMessage}: ChatInputProps) {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAudioSupported, setIsAudioSupported] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const {toast} = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasMediaDevices = !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function');
      const hasMediaRecorder = typeof MediaRecorder !== 'undefined' || typeof (window as any).MediaRecorder !== 'undefined';
      if (hasMediaDevices && hasMediaRecorder) {
        setIsAudioSupported(true);
      }
    }
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onSendMessage('', file);
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleLocationClick = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Geolocation not supported',
        description: "Your browser doesn't support location sharing.",
      });
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        onSendMessage(mapsLink);
        setIsLoadingLocation(false);
      },
      error => {
        setIsLoadingLocation(false);
        console.warn('Location notice:', error.message || error);
        
        let errorMessage = 'Unable to retrieve location.';
        if (error.code === 1) {
          errorMessage = 'Location permission was denied. Please check your browser address bar (lock icon) to allow location access.';
        } else if (error.code === 2) {
          errorMessage = 'Position unavailable. Please ensure your device GPS/location service is enabled.';
        } else if (error.code === 3) {
          errorMessage = 'Location request timed out. Please try again.';
        }
        
        toast({
          variant: 'destructive',
          title: 'Location error',
          description: errorMessage,
        });
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 30000 }
    );
  };

  const handleMicClick = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
       toast({
        variant: 'destructive',
        title: 'Voice messages not supported',
        description: 'Your browser is blocking microphone access or you are not on a secure (HTTPS) connection.',
      });
      return;
    }
    
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      setIsRequestingMic(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
        
        // Find supported mime type for better mobile & iOS compatibility
        const mimeTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/aac',
          'audio/ogg;codecs=opus',
          'audio/wav'
        ];
        const supportedType = typeof MediaRecorder !== 'undefined' 
          ? (mimeTypes.find(type => {
              try {
                return MediaRecorder.isTypeSupported(type);
              } catch {
                return false;
              }
            }) || '')
          : '';
        
        const options = supportedType ? { mimeType: supportedType } : {};
        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;
        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = event => {
          if (event.data && event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const actualMimeType = mediaRecorder.mimeType || supportedType || 'audio/webm';
          const audioBlob = new Blob(audioChunks, {type: actualMimeType});
          const extension = actualMimeType.includes('mp4') || actualMimeType.includes('aac') ? 'mp4' : 'webm';
          const audioFile = new File([audioBlob], `voice-message.${extension}`, {type: actualMimeType});
          onSendMessage('', audioFile);
          stream.getTracks().forEach(track => track.stop()); // Stop microphone access
        };

        mediaRecorder.start(200); // Timeslice ensures data is pushed regularly
        setIsRecording(true);
      } catch (error: any) {
        console.warn('Microphone error:', error.name || error);
        
        const isDenied = error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError';
        
        toast({
          variant: 'destructive',
          title: 'Microphone access denied',
          description: isDenied 
            ? 'Permission was denied. Click the lock/site settings icon in your browser address bar to allow microphone access.' 
            : 'Could not start your microphone. Please check your device settings.',
        });
      } finally {
        setIsRequestingMic(false);
      }
    }
  };


  return (
    <form onSubmit={handleSend} className="p-4 border-t bg-background flex items-center gap-2">
      <Input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type a message..."
        autoComplete="off"
        disabled={isRecording || isRequestingMic}
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,video/*"
      />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" onClick={handleLocationClick} disabled={isLoadingLocation || isRecording}>
              {isLoadingLocation ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
              <span className="sr-only">Share Location</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share your live location</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" onClick={handleCameraClick} disabled={isRecording}>
              <Camera className="h-5 w-5" />
              <span className="sr-only">Send Photo/Video</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Send a photo or video</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={handleMicClick} 
              // Do not disable based on isAudioSupported, let the click handler show a toast if needed
              disabled={isRequestingMic}
            >
               {isRequestingMic ? (
                 <Loader2 className="h-5 w-5 animate-spin" />
               ) : isRecording ? (
                 <StopCircle className="h-5 w-5 text-red-500 animate-pulse" /> 
               ) : (
                 <Mic className="h-5 w-5" />
               )}
              <span className="sr-only">{isRecording ? 'Stop Recording' : 'Record Voice Message'}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
             {!isAudioSupported ? (
              <p>Voice messages might not be supported</p>
            ) : (
              <p>{isRecording ? 'Stop Recording' : 'Record Voice Message'}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Button type="submit" size="icon" disabled={isRecording || isRequestingMic || (!text.trim() && !isRecording)}>
        <Send className="h-5 w-5" />
        <span className="sr-only">Send</span>
      </Button>
    </form>
  );
}
