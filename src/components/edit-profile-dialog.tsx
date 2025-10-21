'use client';
import {Button} from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {useAuth} from '@/context/auth-context';
import {User} from '@/lib/data';
import {useToast} from '@/hooks/use-toast';
import {Edit} from 'lucide-react';
import {useState} from 'react';

export default function EditProfileDialog({worker}: {worker: User}) {
  const [bio, setBio] = useState(worker.bio || '');
  const [photo, setPhoto] = useState<File | null>(null);
  const {updateUser} = useAuth();
  const {toast} = useToast();

  const handleSaveChanges = () => {
    let updatedUser = {...worker, bio};

    if (photo) {
      // In a real app, you would upload the file to a storage service
      // and get a URL. Here, we'll use URL.createObjectURL for a local preview.
      const photoUrl = URL.createObjectURL(photo);
      updatedUser = {...updatedUser, avatarUrl: photoUrl};
    }

    updateUser(updatedUser);

    toast({
      title: 'Profile Updated',
      description: 'Your profile has been successfully saved.',
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" /> Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="photo" className="text-right">
              Photo
            </Label>
            <Input
              id="photo"
              type="file"
              className="col-span-3"
              accept="image/*"
              onChange={e => setPhoto(e.target.files ? e.target.files[0] : null)}
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="bio" className="text-right pt-2">
              Bio
            </Label>
            <Textarea
              id="bio"
              className="col-span-3"
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="submit" onClick={handleSaveChanges}>
              Save changes
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
