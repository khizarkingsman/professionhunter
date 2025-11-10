
'use client';

import {useState, useRef, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Send, Camera, MapPin, Mic, StopCircle} from 'lucide-react';
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
  const {toast} = useToast();

  useEffect(() => {
    if (
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder
    ) {
      setIsAudioSupported(true);
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
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleLocationClick = () => {
    if (!navigator.geolocation) {
      toast({
        variant: 'destructive',
        title: 'Geolocation not supported',
        description: "Your browser doesn't support location sharing.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        onSendMessage(mapsLink);
      },
      error => {
        toast({
          variant: 'destructive',
          title: 'Location permission denied',
          description: 'Please enable location services in your browser settings.',
        });
      }
    );
  };

  const handleMicClick = async () => {
    if (!isAudioSupported) {
       toast({
        variant: 'destructive',
        title: 'Voice messages not supported',
        description: 'Your browser does not support audio recording.',
      });
      return;
    }
    
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({audio: true});
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = event => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, {type: 'audio/webm'});
          const audioFile = new File([audioBlob], 'voice-message.webm', {type: 'audio/webm'});
          onSendMessage('', audioFile);
          stream.getTracks().forEach(track => track.stop()); // Stop microphone access
        };

        mediaRecorder.start();
        setIsRecording(true);
        toast({
          title: 'Recording started',
          description: 'Click the stop button to send your voice message.',
        });
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast({
          variant: 'destructive',
          title: 'Microphone access denied',
          description: 'Please enable microphone permissions to send voice messages.',
        });
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
        disabled={isRecording}
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
            <Button type="button" variant="ghost" size="icon" onClick={handleLocationClick}>
              <MapPin className="h-5 w-5" />
              <span className="sr-only">Share Location</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share your live location</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" onClick={handleCameraClick}>
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
            <Button type="button" variant="ghost" size="icon" onClick={handleMicClick} disabled={!isAudioSupported}>
               {isRecording ? <StopCircle className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
              <span className="sr-only">{isRecording ? 'Stop Recording' : 'Record Voice Message'}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
             {!isAudioSupported ? (
              <p>Voice messages not supported on this browser</p>
            ) : (
              <p>{isRecording ? 'Stop Recording' : 'Record Voice Message'}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Button type="submit" size="icon" disabled={isRecording}>
        <Send className="h-5 w-5" />
        <span className="sr-only">Send</span>
      </Button>
    </form>
  );
}
