import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { FieldShiftDemo } from '@/features/field-shift'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'fieldShift' })
  return { title: t('title'), description: t('metaDescription') }
}

export default async function FieldShiftPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)

  return <FieldShiftDemo />
}
