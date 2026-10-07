import fs from 'fs';
import path from 'path';

/**
 * Manually load .env.local since tsx doesn't auto-load Next.js env files.
 * This ensures MONGODB_URI with Atlas credentials is available.
 */
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
  console.log('📄 Loaded environment from .env.local');
}

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from '../server/models/User';
import { CaseModel } from '../server/models/Case';
import { TestimonyModel } from '../server/models/Testimony';

async function seed() {
  console.log('🕵️‍♂️ Initializing Bureau Database Seed...');
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/formflow';

  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to Bureau Vault (MongoDB Atlas/Local)');

    // 1. Clean existing seed data
    await UserModel.deleteMany({ email: 'detective@noir.com' });
    console.log('🧹 Purged previous demo detective records.');

    // 2. Hash default detective password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 3. Create Lead Detective User
    const detective = await UserModel.create({
      name: 'Detective Sam Spade',
      email: 'detective@noir.com',
      passwordHash,
      badgeNumber: 'BADGE-1947-007',
    });
    console.log(`👤 Created Lead Detective: ${detective.name} (${detective.email})`);

    // 4. Create Sample Case 1: The Maltese Falcon Heist
    const malteseCase = await CaseModel.create({
      userId: detective._id,
      title: 'The Maltese Falcon Heist',
      description: 'Sworn testimony gather regarding the stolen golden statuette from Pier 42.',
      status: 'published',
      shareId: 'maltese-falcon-1947',
      viewCount: 42,
      settings: {
        accentColor: '#f0b44c',
        thankYouMessage: 'Your testimony has been logged in official archives. Stand by for detective follow-up.',
        allowMultipleSubmissions: true,
      },
      clues: [
        {
          id: 'clue_name',
          type: 'text',
          label: 'Witness Full Name',
          helpText: 'Enter your legal identity or alias',
          required: true,
          placeholder: 'e.g. Samuel Spade',
        },
        {
          id: 'clue_email',
          type: 'email',
          label: 'Informant Secure Email',
          helpText: 'Where bureau agents can dispatch telegrams',
          required: true,
          placeholder: 'informant@shadows.com',
        },
        {
          id: 'clue_location',
          type: 'select',
          label: 'Sighting Location',
          helpText: 'Select where you last spotted suspect',
          required: true,
          options: ['Pier 42 Docks', 'The Black Cat Speakeasy', 'Hotel Grand Lobby', 'Chinatown Alley'],
        },
        {
          id: 'clue_threat',
          type: 'linearScale',
          label: 'Threat Level Assessment (1-5)',
          required: true,
          validation: { min: 1, max: 5 },
        },
        {
          id: 'clue_suspect_seen',
          type: 'radio',
          label: 'Did you spot the primary suspect in fedora?',
          required: true,
          options: ['Yes', 'No', 'Uncertain'],
        },
        {
          id: 'clue_hat_color',
          type: 'text',
          label: 'Describe Suspect Headwear & Coat',
          required: false,
          showIf: {
            fieldId: 'clue_suspect_seen',
            operator: 'equals',
            value: 'Yes',
          },
        },
        {
          id: 'clue_statement',
          type: 'textarea',
          label: 'Sworn Detailed Witness Statement',
          helpText: 'Provide chronological accounting of events observed',
          required: true,
          validation: { min: 10 },
        },
      ],
    });
    console.log(`📂 Created Case File: ${malteseCase.title} (ID: ${malteseCase._id})`);

    // 5. Populate Testimonies for Maltese Falcon Case across 7 days
    const now = new Date();
    const testimoniesData = [
      {
        name: 'Effie Perine',
        email: 'effie@spade-agency.com',
        location: 'The Black Cat Speakeasy',
        threat: 2,
        seen: 'Yes',
        hat: 'Dark charcoal fedora with red feather band',
        statement: 'A tall gentleman in a trench coat hurried out the back alley around 11:45 PM carrying a heavy leather briefcase.',
        daysAgo: 6,
      },
      {
        name: 'Joel Cairo',
        email: 'cairo@levante.org',
        location: 'Hotel Grand Lobby',
        threat: 4,
        seen: 'Yes',
        hat: 'Black silk top hat',
        statement: 'I observed Mr. Gutman negotiating with a strange vessel captain near the harbor entrance.',
        daysAgo: 4,
      },
      {
        name: 'Brigid O\'Shaughnessy',
        email: 'brigid@mystery.net',
        location: 'Pier 42 Docks',
        threat: 5,
        seen: 'Yes',
        hat: 'Wide brimmed black hat',
        statement: 'Gunshots echoed near berth 14. I saw two figures struggle over the crate before fleeing toward the docks.',
        daysAgo: 2,
      },
      {
        name: 'Miles Archer',
        email: 'miles@spade-agency.com',
        location: 'Chinatown Alley',
        threat: 3,
        seen: 'No',
        hat: '',
        statement: 'Found abandoned footsteps leading toward the warehouse district. No visual contact made with suspect.',
        daysAgo: 1,
      },
      {
        name: 'Kasper Gutman',
        email: 'gutman@fatman.com',
        location: 'The Black Cat Speakeasy',
        threat: 5,
        seen: 'Yes',
        hat: 'Standard brown fedora',
        statement: 'The bird is of paramount importance. High value contraband was moved prior to midnight.',
        daysAgo: 0,
      },
    ];

    for (const t of testimoniesData) {
      const submissionDate = new Date(now.getTime() - t.daysAgo * 24 * 60 * 60 * 1000);
      await TestimonyModel.create({
        caseId: malteseCase._id,
        answers: {
          clue_name: t.name,
          clue_email: t.email,
          clue_location: t.location,
          clue_threat: t.threat,
          clue_suspect_seen: t.seen,
          clue_hat_color: t.hat,
          clue_statement: t.statement,
        },
        submittedAt: submissionDate,
        createdAt: submissionDate,
      });
    }
    console.log(`📜 Seeded ${testimoniesData.length} sworn testimonies into Evidence Board.`);

    console.log('\n🎉 Bureau Seed Execution Complete!');
    console.log('--------------------------------------------------');
    console.log('Lead Detective Credentials:');
    console.log('Email: detective@noir.com');
    console.log('Password: password123');
    console.log('Demo Case Share URL: /c/maltese-falcon-1947');
    console.log('--------------------------------------------------\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Failed with Error:', error);
    process.exit(1);
  }
}

seed();
