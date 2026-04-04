import { Link } from 'react-router-dom';
import { InteriorLayout } from '@/layouts/InteriorLayout';
import { Seo } from '@/components/Seo';
import { pageTitle } from '@/lib/site';
import { heroConfig, paymentsPublicConfig, siteConfig } from '@/config';

const CANONICAL_PATH = '/payments';

function cell(v: string) {
  const t = v.trim();
  return t.length ? t : '—';
}

export default function PaymentsInfoPage() {
  const title = pageTitle('Payments');
  const p = paymentsPublicConfig;

  const rows: { label: string; value: string }[] = [
    { label: 'M-Pesa till (Buy goods)', value: cell(p.mpesaTillNumber) },
    { label: 'M-Pesa paybill', value: cell(p.mpesaPaybillNumber) },
    { label: 'Pay bill account', value: p.mpesaPaybillAccountNote.trim() || '—' },
    { label: 'Registered name (M-Pesa)', value: cell(p.mpesaBusinessName) },
    { label: 'Bank', value: cell(p.bankName) },
    { label: 'Branch', value: cell(p.bankBranch) },
    { label: 'Account name', value: cell(p.bankAccountName) },
    { label: 'Account number', value: cell(p.bankAccountNumber) },
    { label: 'SWIFT / BIC', value: cell(p.swiftCode) },
  ];

  return (
    <InteriorLayout>
      <Seo
        title={title}
        description={`Official payment details for ${siteConfig.siteName}: M-Pesa till, paybill, and bank transfer.`}
        canonicalPath={CANONICAL_PATH}
        ogImage={heroConfig.backgroundImage}
        ogImageAlt={heroConfig.backgroundAlt}
      />
      <section className="relative overflow-hidden bg-gradient-to-b from-kaleo-sand to-[#f4f0e8] px-4 py-10 md:px-8 md:py-14">
        <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-kaleo-terracotta/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-10 h-56 w-56 rounded-full bg-kaleo-earth/10 blur-3xl" />
        <div className="relative mx-auto w-full max-w-5xl px-0 sm:px-2">
          <div className="mb-4 flex flex-wrap items-center gap-2 font-body text-xs uppercase tracking-[0.15em] text-kaleo-earth/55">
            <Link to="/" className="hover:text-kaleo-terracotta">
              Home
            </Link>
            <span aria-hidden> / </span>
            <span>Payments</span>
          </div>

          <div className="rounded-3xl border border-kaleo-earth/10 bg-white/95 p-6 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.35)] backdrop-blur-sm md:p-10 lg:p-12">
            <div className="flex flex-col gap-4 border-b border-kaleo-earth/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-2xl text-kaleo-earth sm:text-3xl">Payments</h1>
                <p className="mt-2 max-w-3xl font-body text-sm leading-relaxed text-kaleo-earth/70 sm:text-base">
                  After we confirm your trip, pay using the channels below. Always include the reference on your invoice or booking message so we can match your payment.
                </p>
              </div>
              <Link
                to="/packages"
                className="shrink-0 self-start rounded-full border border-kaleo-earth/20 px-4 py-2 font-body text-xs uppercase tracking-wider text-kaleo-earth transition hover:border-kaleo-terracotta hover:text-kaleo-terracotta"
              >
                Browse packages
              </Link>
            </div>

            <div className="mt-6 overflow-x-auto rounded-xl border border-kaleo-earth/10">
              <table className="w-full min-w-[480px] border-collapse text-left text-sm sm:min-w-0 sm:text-base">
                <thead>
                  <tr className="border-b border-kaleo-earth/10 bg-kaleo-sand/50">
                    <th scope="col" className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wider text-kaleo-earth/55">
                      Channel
                    </th>
                    <th scope="col" className="px-4 py-3 font-body text-xs font-medium uppercase tracking-wider text-kaleo-earth/55">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.label} className="border-b border-kaleo-earth/5 last:border-0">
                      <th
                        scope="row"
                        className="whitespace-nowrap px-4 py-3 font-body font-medium text-kaleo-earth align-top"
                      >
                        {row.label}
                      </th>
                      <td className="px-4 py-3 font-body text-kaleo-earth/85 align-top">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-6 font-body text-xs leading-relaxed text-kaleo-earth/55">
              Deposits and balance due dates are on your quote. Only use the numbers and names above (or exactly as repeated on your official invoice). Questions — use
              Book now or the footer contact form.
            </p>
          </div>
        </div>
      </section>
    </InteriorLayout>
  );
}
