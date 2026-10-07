'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Stamp } from '@/components/ui/Stamp';
import { Card } from '@/components/ui/Card';

export default function LandingPage() {
  const [mousePos, setMousePos] = useState({ x: 500, y: 300 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-[80vh] flex flex-col justify-center">
      {/* Flashlight Spotlight Effect Layer */}
      <div
        className="pointer-events-none fixed inset-0 z-10 transition-opacity duration-300 hidden md:block"
        style={{
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(240, 180, 76, 0.12), transparent 80%)`,
        }}
      />

      {/* Hero Section */}
      <section className="relative z-20 text-center py-16 px-4">
        <div className="inline-block mb-4">
          <Stamp text="CONFIDENTIAL BUREAU FILES" variant="amber" rotation="left" size="md" />
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-extrabold tracking-tight text-aged-paper mb-6 max-w-4xl mx-auto leading-tight">
          Uncover the Truth Behind Every <span className="text-lamp-amber underline decoration-string-red/60 underline-offset-8">Inquiry</span>.
        </h1>

        <p className="font-sans text-base sm:text-xl text-fog-grey max-w-2xl mx-auto mb-10 leading-relaxed">
          Re-imagine generic forms as sworn <span className="text-lamp-amber font-semibold">Case Files</span>. Gather answers as <span className="text-lamp-amber font-semibold">Testimony</span>, interrogate informants with interactive <span className="text-lamp-amber font-semibold">Clues</span>, and analyze findings on your <span className="text-lamp-amber font-semibold">Evidence Board</span>.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            <Button variant="primary" size="lg" className="w-full sm:w-auto text-base">
              📁 Open a New Case
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="lg" className="w-full sm:w-auto text-base">
              🔍 Identify Yourself (Agent Login)
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="relative z-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-12">
        <Card tabTitle="CASE EDITOR">
          <div className="text-3xl mb-3">📁</div>
          <h3 className="font-serif text-lg font-bold text-lamp-amber mb-2">Investigative Case Files</h3>
          <p className="font-sans text-xs text-muted dark:text-fog-grey leading-relaxed">
            Construct forms with customizable clue types, required witness statements, and authentic paper aesthetics.
          </p>
        </Card>

        <Card tabTitle="TESTIMONY LOG">
          <div className="text-3xl mb-3">📜</div>
          <h3 className="font-serif text-lg font-bold text-lamp-amber mb-2">Sworn Testimony</h3>
          <p className="font-sans text-xs text-muted dark:text-fog-grey leading-relaxed">
            Receive responses formatted like official detective case depositions, complete with timestamps.
          </p>
        </Card>

        <Card tabTitle="EVIDENCE BOARD">
          <div className="text-3xl mb-3">📌</div>
          <h3 className="font-serif text-lg font-bold text-lamp-amber mb-2">Crime Scene Analytics</h3>
          <p className="font-sans text-xs text-muted dark:text-fog-grey leading-relaxed">
            Pin down trends, track testimony statistics over time, and export official case reports.
          </p>
        </Card>

        <Card tabTitle="AI BRIEFING">
          <div className="text-3xl mb-3">💡</div>
          <h3 className="font-serif text-lg font-bold text-lamp-amber mb-2">Brief the Detective</h3>
          <p className="font-sans text-xs text-muted dark:text-fog-grey leading-relaxed">
            Provide a short investigative prompt and watch AI automatically structure a complete Case File with Clues.
          </p>
        </Card>
      </section>

      {/* Detective Badges & Pricing Tier Section */}
      <section className="relative z-20 my-16 px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl font-bold text-aged-paper mb-3">
            Bureau Badges & Licensing Tiers
          </h2>
          <p className="font-sans text-sm text-fog-grey max-w-xl mx-auto">
            Choose the investigative operational tier suited to your bureau requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Tier 1 */}
          <div className="bg-desk-dark/90 border border-aged-paper/20 rounded-lg p-6 flex flex-col justify-between hover:border-aged-paper/50 transition-colors">
            <div>
              <div className="font-typewriter text-xs text-fog-grey mb-2">TIER I - ROOKIE</div>
              <h3 className="font-serif text-xl font-bold text-aged-paper mb-1">Junior Informant</h3>
              <div className="font-serif text-3xl font-bold text-lamp-amber my-4">$0 <span className="text-xs font-sans text-fog-grey">/ month</span></div>
              <ul className="space-y-3 font-sans text-xs text-aged-paper/80 mb-6">
                <li className="flex items-center gap-2">✓ Up to 3 Open Cases</li>
                <li className="flex items-center gap-2">✓ 100 Witness Testimonies / month</li>
                <li className="flex items-center gap-2">✓ Standard Evidence Board</li>
                <li className="flex items-center gap-2">✓ 17 Basic Clue Types</li>
              </ul>
            </div>
            <Link href="/signup">
              <Button variant="ghost" size="md" className="w-full">
                Issue Rookie Badge
              </Button>
            </Link>
          </div>

          {/* Tier 2 - Recommended */}
          <div className="bg-desk-dark/95 border-2 border-lamp-amber rounded-lg p-6 flex flex-col justify-between relative shadow-xl shadow-lamp-amber/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Stamp text="RECOMMENDED BADGE" variant="amber" size="sm" />
            </div>
            <div>
              <div className="font-typewriter text-xs text-lamp-amber mb-2 mt-2">TIER II - OPERATIONAL</div>
              <h3 className="font-serif text-2xl font-bold text-aged-paper mb-1">Private Eye</h3>
              <div className="font-serif text-4xl font-bold text-lamp-amber my-4">$19 <span className="text-xs font-sans text-fog-grey">/ month</span></div>
              <ul className="space-y-3 font-sans text-xs text-aged-paper/90 mb-6">
                <li className="flex items-center gap-2 text-lamp-amber">✓ Unlimited Active Cases</li>
                <li className="flex items-center gap-2">✓ 5,000 Witness Testimonies / month</li>
                <li className="flex items-center gap-2">✓ Brief the Detective (AI Generation)</li>
                <li className="flex items-center gap-2">✓ CSV & JSON Case Report Exports</li>
                <li className="flex items-center gap-2">✓ QR Code & Interrogation Embeds</li>
              </ul>
            </div>
            <Link href="/signup">
              <Button variant="primary" size="md" className="w-full font-bold">
                Acquire Investigator License
              </Button>
            </Link>
          </div>

          {/* Tier 3 */}
          <div className="bg-desk-dark/90 border border-aged-paper/20 rounded-lg p-6 flex flex-col justify-between hover:border-aged-paper/50 transition-colors">
            <div>
              <div className="font-typewriter text-xs text-fog-grey mb-2">TIER III - COMMAND</div>
              <h3 className="font-serif text-xl font-bold text-aged-paper mb-1">Bureau Chief</h3>
              <div className="font-serif text-3xl font-bold text-lamp-amber my-4">$49 <span className="text-xs font-sans text-fog-grey">/ month</span></div>
              <ul className="space-y-3 font-sans text-xs text-aged-paper/80 mb-6">
                <li className="flex items-center gap-2">✓ Unlimited Active Cases & Testimonies</li>
                <li className="flex items-center gap-2">✓ High-Capacity GridFS Evidence Locker</li>
                <li className="flex items-center gap-2">✓ Unlimited AI Briefings</li>
                <li className="flex items-center gap-2">✓ Custom Bureau Seal & Branding</li>
                <li className="flex items-center gap-2">✓ Priority Dispatch Support</li>
              </ul>
            </div>
            <Link href="/signup">
              <Button variant="ghost" size="md" className="w-full">
                Command Bureau
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
