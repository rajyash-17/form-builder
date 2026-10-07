import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Stamp } from '@/components/ui/Stamp';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-ink-black text-aged-paper flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background paper texture feel */}
      <div className="absolute inset-0 bg-[radial-gradient(#f0b44c_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="relative z-10 max-w-lg w-full bg-desk-dark/90 border border-aged-paper/20 rounded-lg p-8 shadow-2xl backdrop-blur-sm">
        <div className="flex justify-center mb-6">
          <Stamp variant="red" text="CASE GONE COLD" size="lg" />
        </div>

        <h1 className="font-serif text-3xl font-bold text-lamp-amber mb-3">
          404 - Case File Not Found
        </h1>

        <p className="font-sans text-aged-paper/80 mb-6 text-sm leading-relaxed">
          The clue or evidence record you are searching for has been mislaid in bureau archives or scrubbed from the active docket.
        </p>

        <div className="flex justify-center gap-4">
          <Link href="/dashboard">
            <Button variant="primary" size="md">
              Return to Case Files
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="md">
              Bureau Headquarters
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
