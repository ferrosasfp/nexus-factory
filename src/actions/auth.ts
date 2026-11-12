'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { locales } from '@/i18n/routing'
import { rateLimitServerAction } from '@/lib/rate-limit'
import { z } from 'zod'

const localeSchema = z.enum(locales).default('en')

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    locale: localeSchema,
})

const signupSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    locale: localeSchema,
})

const resetPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
    locale: localeSchema,
})

const TOO_MANY_REQUESTS = 'Too many attempts. Please wait a minute and try again.'

/** Brute-force guard for unauthenticated auth actions (10 req/min per IP and action). */
async function isRateLimited(scope: string): Promise<boolean> {
    const { success } = await rateLimitServerAction('auth', scope, await headers())
    return !success
}

/** Public base URL used in emails/OAuth redirects. Prefer the configured site URL over request headers. */
async function getSiteUrl(): Promise<string> {
    if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
    const headersList = await headers()
    return headersList.get('origin') ?? 'http://localhost:3000'
}

const updatePasswordSchema = z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    locale: localeSchema,
})

const updateProfileSchema = z.object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
})

export async function login(formData: FormData) {
    const validatedFields = loginSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
        locale: formData.get('locale'),
    })

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message }
    }

    const { email, password, locale } = validatedFields.data
    if (await isRateLimited('login')) {
        return { error: TOO_MANY_REQUESTS }
    }
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect(`/${locale}/dashboard`)
}

export async function signup(formData: FormData) {
    const validatedFields = signupSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
        locale: formData.get('locale'),
    })

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message }
    }

    const { email, password, locale } = validatedFields.data
    if (await isRateLimited('signup')) {
        return { error: TOO_MANY_REQUESTS }
    }
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect(`/${locale}/check-email`)
}

export async function signout(locale: string = 'en') {
    const validated = localeSchema.safeParse(locale)
    if (!validated.success) {
        return { error: 'Invalid locale' }
    }

    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect(`/${validated.data}/login`)
}

export async function resetPassword(formData: FormData) {
    const validatedFields = resetPasswordSchema.safeParse({
        email: formData.get('email'),
        locale: formData.get('locale') ?? undefined,
    })

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message }
    }

    const { email, locale } = validatedFields.data
    if (await isRateLimited('reset-password')) {
        return { error: TOO_MANY_REQUESTS }
    }
    const supabase = await createClient()

    // The email link must go through /callback so the recovery code is exchanged for a
    // session before /update-password calls updateUser().
    const next = encodeURIComponent(`/${locale}/update-password`)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${await getSiteUrl()}/${locale}/callback?next=${next}`,
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}

export async function updatePassword(formData: FormData) {
    const validatedFields = updatePasswordSchema.safeParse({
        password: formData.get('password'),
        locale: formData.get('locale'),
    })

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message }
    }

    const { password, locale } = validatedFields.data
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect(`/${locale}/dashboard`)
}

export async function updateProfile(formData: FormData) {
    const validatedFields = updateProfileSchema.safeParse({
        full_name: formData.get('full_name'),
    })

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message }
    }

    const { full_name } = validatedFields.data
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('profiles')
        .update({
            full_name,
            updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}

export async function signInWithGoogle(locale: string) {
    const validated = localeSchema.safeParse(locale)
    if (!validated.success) {
        return { error: 'Invalid locale' }
    }

    if (await isRateLimited('oauth')) {
        return { error: TOO_MANY_REQUESTS }
    }
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${await getSiteUrl()}/${validated.data}/callback`,
        },
    })

    if (error) {
        return { error: error.message }
    }

    if (data.url) {
        redirect(data.url)
    }

    return { error: 'Failed to get OAuth URL' }
}
