import {
  createContext,
  useEffect,
  useCallback,
  useContext,
  useMemo,
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
import { apiRequest } from '@/lib/api';
import { fetchPublicPackages } from '@/lib/publicApi';

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
  const [successRef, setSuccessRef] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [packageChoice, setPackageChoice] = useState(''); // package name shown in UI
  const [partySize, setPartySize] = useState('1');
  const [preferredDate, setPreferredDate] = useState('');
  const [departureId, setDepartureId] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [packageOptions, setPackageOptions] = useState<Array<{ name: string; slug: string }>>([]);
  const [schedulingMode, setSchedulingMode] = useState<'FIXED_DEPARTURES' | 'FLEXIBLE_DATES'>(
    'FLEXIBLE_DATES',
  );
  const [departures, setDepartures] = useState<Array<{ id: number; date: string; spotsLeft?: number | null }>>([]);

  const resetForm = useCallback(() => {
    setName('');
    setEmail('');
    setPhone('');
    setPackageChoice('');
    setPartySize('1');
    setPreferredDate('');
    setDepartureId('');
    setNotes('');
    setSuccess(false);
    setSuccessRef('');
    setFormError('');
    setFieldErrors({});
    setSubmitting(false);
  }, []);

  const openBooking = useCallback((options?: OpenOptions) => {
    const pkg = options?.packageName ?? '';
    setPackageChoice(pkg);
    setSuccess(false);
    setSubmitting(false);
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoadingPackages(true);
    setFormError('');
    fetchPublicPackages({ limit: 100, offset: 0, sort: 'name_asc' })
      .then(({ packages }) => {
        if (!mounted) return;
        const next = packages.map(pkg => ({ name: pkg.name, slug: pkg.slug }));
        setPackageOptions(next);
      })
      .catch(() => {
        if (!mounted) return;
        setFormError('Unable to load packages right now. Please try again.');
      })
      .finally(() => {
        if (mounted) setLoadingPackages(false);
      });
    return () => {
      mounted = false;
    };
  }, [open]);

  const selectedPackageSlug = useMemo(() => {
    return packageOptions.find(p => p.name === packageChoice)?.slug ?? '';
  }, [packageChoice, packageOptions]);

  useEffect(() => {
    if (!selectedPackageSlug) {
      setSchedulingMode('FLEXIBLE_DATES');
      setDepartures([]);
      setDepartureId('');
      return;
    }
    let mounted = true;
    apiRequest<{
      package: {
        schedulingMode?: 'FIXED_DEPARTURES' | 'FLEXIBLE_DATES';
        departures?: Array<{ id: number; date: string; spotsLeft?: number | null }>;
      };
    }>(`/api/v1/packages/${encodeURIComponent(selectedPackageSlug)}`)
      .then(({ package: pkg }) => {
        if (!mounted) return;
        const mode = pkg.schedulingMode === 'FIXED_DEPARTURES' ? 'FIXED_DEPARTURES' : 'FLEXIBLE_DATES';
        setSchedulingMode(mode);
        setDepartures(Array.isArray(pkg.departures) ? pkg.departures : []);
        setDepartureId('');
      })
      .catch(() => {
        if (!mounted) return;
        setSchedulingMode('FLEXIBLE_DATES');
        setDepartures([]);
      });
    return () => {
      mounted = false;
    };
  }, [selectedPackageSlug]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      resetForm();
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Full name is required';
    if (!email.trim()) errors.email = 'Email is required';
    if (!phone.trim()) errors.phone = 'Phone is required';
    if (!packageChoice || !selectedPackageSlug) errors.package = 'Package is required';
    const parsedPartySize = Number(partySize);
    if (!Number.isFinite(parsedPartySize) || parsedPartySize < 1) {
      errors.partySize = 'Party size must be at least 1';
    }
    if (schedulingMode === 'FIXED_DEPARTURES' && !departureId) {
      errors.departureId = 'Please select a departure date';
    }
    if (schedulingMode === 'FLEXIBLE_DATES' && !preferredDate) {
      errors.preferredDate = 'Preferred date is required';
    }
    setFieldErrors(errors);
    setFormError('');
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    try {
      const response = await apiRequest<{ referenceCode?: string }>('/api/v1/enquiries', {
        method: 'POST',
        body: {
          fullName: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          packageSlug: selectedPackageSlug,
          partySize: parsedPartySize,
          preferredDate: schedulingMode === 'FLEXIBLE_DATES' ? preferredDate : undefined,
          departureId: schedulingMode === 'FIXED_DEPARTURES' ? Number(departureId) : undefined,
          notes: notes.trim(),
        },
      });
      setSuccessRef(response.referenceCode ?? '');
      setSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit request';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

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
                {successRef ? (
                  <p className="font-body text-sm text-kaleo-earth/80">Reference: {successRef}</p>
                ) : null}
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
                    onChange={e => {
                      setName(e.target.value);
                      if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                    }}
                    className={fieldClass}
                  />
                  {fieldErrors.name ? <p className="text-xs text-red-600">{fieldErrors.name}</p> : null}
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
                    onChange={e => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                    }}
                    className={fieldClass}
                  />
                  {fieldErrors.email ? <p className="text-xs text-red-600">{fieldErrors.email}</p> : null}
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
                    onChange={e => {
                      setPhone(e.target.value);
                      if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    className={fieldClass}
                  />
                  {fieldErrors.phone ? <p className="text-xs text-red-600">{fieldErrors.phone}</p> : null}
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
                    onChange={e => {
                      setPackageChoice(e.target.value);
                      if (fieldErrors.package) setFieldErrors(prev => ({ ...prev, package: '' }));
                    }}
                    aria-label="Package"
                    disabled={loadingPackages}
                    className="h-9 w-full rounded-xl border border-kaleo-earth/20 bg-white px-3 font-body text-sm text-kaleo-earth outline-none focus-visible:ring-[3px] focus-visible:ring-kaleo-terracotta/40"
                  >
                    <option value="">{loadingPackages ? 'Loading packages...' : 'Select a package'}</option>
                    {packageOptions.map(p => (
                      <option key={p.slug} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.package ? <p className="text-xs text-red-600">{fieldErrors.package}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="book-party-size" className="font-body text-kaleo-earth">
                    Party size *
                  </Label>
                  <Input
                    id="book-party-size"
                    name="partySize"
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={partySize}
                    onChange={e => {
                      setPartySize(e.target.value);
                      if (fieldErrors.partySize) setFieldErrors(prev => ({ ...prev, partySize: '' }));
                    }}
                    className={fieldClass}
                  />
                  {fieldErrors.partySize ? <p className="text-xs text-red-600">{fieldErrors.partySize}</p> : null}
                </div>
                {schedulingMode === 'FIXED_DEPARTURES' ? (
                  <div className="space-y-2">
                    <Label htmlFor="book-departure" className="font-body text-kaleo-earth">
                      Departure date *
                    </Label>
                    <select
                      id="book-departure"
                      name="departureId"
                      title="Departure date"
                      required
                      value={departureId}
                      onChange={e => {
                        setDepartureId(e.target.value);
                        if (fieldErrors.departureId) setFieldErrors(prev => ({ ...prev, departureId: '' }));
                      }}
                      className="h-9 w-full rounded-xl border border-kaleo-earth/20 bg-white px-3 font-body text-sm text-kaleo-earth outline-none focus-visible:ring-[3px] focus-visible:ring-kaleo-terracotta/40"
                    >
                      <option value="">Select a departure</option>
                      {departures.map(d => (
                        <option key={d.id} value={String(d.id)}>
                          {d.date}
                          {typeof d.spotsLeft === 'number' ? ` (${d.spotsLeft} spots left)` : ''}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.departureId ? <p className="text-xs text-red-600">{fieldErrors.departureId}</p> : null}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="book-preferred-date" className="font-body text-kaleo-earth">
                      Preferred date *
                    </Label>
                    <Input
                      id="book-preferred-date"
                      name="preferredDate"
                      type="date"
                      required
                      value={preferredDate}
                      onChange={e => {
                        setPreferredDate(e.target.value);
                        if (fieldErrors.preferredDate) setFieldErrors(prev => ({ ...prev, preferredDate: '' }));
                      }}
                      className={fieldClass}
                    />
                    {fieldErrors.preferredDate ? (
                      <p className="text-xs text-red-600">{fieldErrors.preferredDate}</p>
                    ) : null}
                  </div>
                )}
                {formError ? <p className="text-sm text-red-700">{formError}</p> : null}
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
