import {
  createContext,
  useCallback,
  useContext,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { packagesConfig } from '@/config';

type OpenOptions = { packageName?: string };

type BookingModalContextValue = {
  openBooking: (options?: OpenOptions) => void;
};

const BookingModalContext = createContext<BookingModalContextValue | null>(null);

export function useBookingModal() {
  const ctx = useContext(BookingModalContext);
  if (!ctx) {
    throw new Error('useBookingModal must be used within BookingModalProvider');
  }
  return ctx;
}

export function BookingModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [packageChoice, setPackageChoice] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setName('');
    setEmail('');
    setPhone('');
    setPackageChoice('');
    setNotes('');
    setSuccess(false);
    setSubmitting(false);
  }, []);

  const openBooking = useCallback((options?: OpenOptions) => {
    const pkg = options?.packageName ?? '';
    setPackageChoice(pkg);
    setSuccess(false);
    setSubmitting(false);
    setOpen(true);
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      resetForm();
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !packageChoice) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setSubmitting(false);
    setSuccess(true);
  };

  const packageOptions = packagesConfig.packages.map(p => p.name);

  const fieldClass =
    'rounded-xl border-kaleo-earth/20 bg-white text-kaleo-earth placeholder:text-kaleo-earth/40';

  return (
    <BookingModalContext.Provider value={{ openBooking }}>
      {children}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="sm:max-w-md rounded-3xl border-kaleo-sand bg-kaleo-cream p-6 md:p-8 gap-0"
          showCloseButton
        >
          {success ? (
            <div className="flex flex-col items-center text-center py-2 gap-5">
              <div className="rounded-full bg-kaleo-terracotta/15 p-4">
                <CheckCircle2 className="w-12 h-12 text-kaleo-terracotta" strokeWidth={1.75} />
              </div>
              <DialogHeader className="text-center sm:text-center gap-2 space-y-0">
                <DialogTitle className="font-display text-2xl text-kaleo-earth">
                  Booking request received
                </DialogTitle>
                <DialogDescription className="font-body text-kaleo-earth/70 text-base">
                  Thank you. Our team will contact you shortly to confirm your adventure.
                </DialogDescription>
              </DialogHeader>
              <Button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="rounded-full bg-kaleo-terracotta text-white hover:bg-kaleo-earth font-body uppercase tracking-wider text-xs px-8"
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl text-kaleo-earth">
                  Book your adventure
                </DialogTitle>
                <DialogDescription className="font-body text-kaleo-earth/60">
                  Fill in your details and we will get back to you to confirm availability.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="book-name" className="font-body text-kaleo-earth">
                    Full name *
                  </Label>
                  <Input
                    id="book-name"
                    name="name"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="book-email" className="font-body text-kaleo-earth">
                    Email *
                  </Label>
                  <Input
                    id="book-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="book-phone" className="font-body text-kaleo-earth">
                    Phone *
                  </Label>
                  <Input
                    id="book-phone"
                    name="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="book-package" className="font-body text-kaleo-earth">
                    Package *
                  </Label>
                  <select
                    id="book-package"
                    name="package"
                    required
                    value={packageChoice}
                    onChange={e => setPackageChoice(e.target.value)}
                    aria-label="Package"
                    className="h-9 w-full rounded-xl border border-kaleo-earth/20 bg-white px-3 font-body text-sm text-kaleo-earth outline-none focus-visible:ring-[3px] focus-visible:ring-kaleo-terracotta/40"
                  >
                    <option value="">Select a package</option>
                    {packageOptions.map(n => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="book-notes" className="font-body text-kaleo-earth">
                    Notes (optional)
                  </Label>
                  <Textarea
                    id="book-notes"
                    name="notes"
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className={fieldClass}
                    placeholder="Hotel, group size, preferred dates…"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-kaleo-terracotta text-white hover:bg-kaleo-earth font-body uppercase tracking-wider text-xs h-11"
                >
                  {submitting ? 'Sending…' : 'Submit request'}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </BookingModalContext.Provider>
  );
}
