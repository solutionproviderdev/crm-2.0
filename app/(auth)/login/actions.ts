'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export type LoginState = { error: string; isUnconfirmed?: boolean; email?: string }

export async function login(prevState: LoginState, formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  if (!data.email || !data.password) {
    return { error: 'Please enter both email and password' }
  }

  const { error, data: authData } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { 
      error: error.message,
      email: data.email, // Return email to allow resending if unconfirmed
      isUnconfirmed: error.message.includes('Email not confirmed')
    }
  }

  const redirectUrl = '/dashboard'
  
  if (authData.user) {
    revalidatePath('/', 'layout')
  }

  // Notice redirect must execute outside of any try/catch!
  redirect(redirectUrl)
}

export async function resendConfirmation(email: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`
    }
  })

  if (error) {
    return { success: false, message: error.message }
  }
  return { success: true, message: 'Confirmation specific email sent!' }
}
