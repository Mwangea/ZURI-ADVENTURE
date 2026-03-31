type Props = {
  title: string;
  description?: string;
};

export default function AdminPlaceholderPage({ title, description }: Props) {
  return (
    <section className="rounded-2xl border border-kaleo-earth/10 bg-white p-6">
      <h1 className="font-display text-3xl text-kaleo-earth">{title}</h1>
      <p className="mt-2 font-body text-sm text-kaleo-earth/60">
        {description ?? `${title} module is ready for next implementation pass.`}
      </p>
    </section>
  );
}
