import { redirect } from '@/i18n/routing'

// The project opens on its design pipeline.
export default async function ProjectIndexPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  redirect({ href: `/projects/${id}/pipeline`, locale })
}
