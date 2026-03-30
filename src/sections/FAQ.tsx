import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { faqConfig } from '../config';

gsap.registerPlugin(ScrollTrigger);

const FAQ = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const faqListRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = faqConfig.faqs;

  useEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const faqList = faqListRef.current;

    if (!section || !header || !faqList) return;

    const triggers: ScrollTrigger[] = [];

    // Header animation
    gsap.set(header.children, { opacity: 0, y: 30 });
    const headerTrigger = ScrollTrigger.create({
      trigger: header,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.to(header.children, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
        });
      },
    });
    triggers.push(headerTrigger);

    // FAQ items animation
    const faqItems = faqList.querySelectorAll('.faq-item');
    gsap.set(faqItems, { opacity: 0, y: 30 });
    const faqTrigger = ScrollTrigger.create({
      trigger: faqList,
      start: 'top 75%',
      once: true,
      onEnter: () => {
        gsap.to(faqItems, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
        });
      },
    });
    triggers.push(faqTrigger);

    return () => {
      triggers.forEach(t => t.kill());
    };
  }, []);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (!faqConfig.sectionTitle || faqs.length === 0) return null;

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="relative w-full bg-kaleo-cream py-20 md:py-32"
    >
      <div className="max-w-4xl mx-auto px-6 md:px-8 lg:px-12">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-kaleo-terracotta/10 mb-6">
            <HelpCircle className="w-8 h-8 text-kaleo-terracotta" />
          </div>
          <span className="font-body text-sm text-kaleo-terracotta uppercase tracking-[0.2em]">
            {faqConfig.sectionSubtitle}
          </span>
          <h2 className="font-display text-headline text-kaleo-earth mt-4">
            {faqConfig.sectionTitle}
          </h2>
          <p className="font-body text-body text-kaleo-earth/70 mt-4 max-w-2xl mx-auto">
            {faqConfig.description}
          </p>
        </div>

        {/* FAQ List */}
        <div ref={faqListRef} className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="faq-item bg-white rounded-2xl shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-kaleo-sand/50 transition-colors"
              >
                <span className="font-display text-lg text-kaleo-earth pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-kaleo-terracotta flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-6">
                  <p className="font-body text-body text-kaleo-earth/70 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-12 p-8 bg-kaleo-sand rounded-2xl">
          <p className="font-body text-kaleo-earth/70 mb-4">
            Still have questions?
          </p>
          <a
            href={faqConfig.ctaLink}
            className="inline-flex items-center gap-2 px-8 py-4 bg-kaleo-terracotta text-white rounded-full font-body text-sm uppercase tracking-wider hover:bg-kaleo-earth transition-colors"
          >
            {faqConfig.ctaText}
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
