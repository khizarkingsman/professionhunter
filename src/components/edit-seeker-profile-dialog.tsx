
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
import {useAuth} from '@/context/auth-context';
import {User} from '@/lib/data';
import {useToast} from '@/hooks/use-toast';
import {Edit} from 'lucide-react';
import {useState} from 'react';

export function EditSeekerProfileDialog({user}: {user: User}) {
  const [photo, setPhoto] = useState<File | null>(null);
  const {updateUser} = useAuth();
  const {toast} = useToast();

  const handleSaveChanges = () => {
    let updatedUser = {...user};

    if (photo) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updatedUser = {...updatedUser, avatarUrl: base64String};
        updateUser(updatedUser);
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully saved.',
        });
      };
      reader.readAsDataURL(photo);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
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
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" onClick={handleSaveChanges}>
              Save changes
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
