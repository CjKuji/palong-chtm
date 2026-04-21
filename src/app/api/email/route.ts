// src/app/api/email/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local or your deployment environment.'
  )
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function POST(req: NextRequest) {
  try {
    const { userId, newEmail } = await req.json();

    if (!userId || !newEmail) {
      return NextResponse.json({ error: 'Missing userId or newEmail' }, { status: 400 });
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: newEmail,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Email updated successfully' });
  } catch (err: any) {
    console.error('Email API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}