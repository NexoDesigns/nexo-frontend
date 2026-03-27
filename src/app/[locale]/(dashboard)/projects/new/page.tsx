'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useMutation } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api'
import { useRouter } from '@/i18n/routing'
import { Header } from '@/components/layout/Header'
import { RequirementsForm } from '@/components/projects/RequirementsForm'
import { Button } from '@/components/ui/button'
import { Input, Label, Textarea } from '@/components/ui/input'
import { Separator } from '@/components/ui/primitives'
import { ArrowLeft, Loader2, FolderPlus } from 'lucide-react'
import { Link } from '@/i18n/routing'

export default function NewProjectPage() {
  const t = useTranslations('projects')
  const router = useRouter()

  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [description, setDescription] = useState('')
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: () =>
      projectsApi.create({
        name: name.trim(),
        client_name: clientName.trim() || undefined,
        description: description.trim() || undefined,
      }),
    onSuccess: (project) => {
      setCreatedProjectId(project.id)
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createMutation.mutate()
  }

  // After project is created, show requirements form
  if (createdProjectId) {
    return (
      <div className="flex flex-col h-full animate-fade-in">
        <Header
          title="Requisitos del proyecto"
          description="Define los requisitos eléctricos. Puedes editarlos más adelante."
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/projects/${createdProjectId}`)}
            >
              Omitir por ahora
            </Button>
          }
        />
        <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
          <RequirementsForm
            projectId={createdProjectId}
            onSaved={() => router.push(`/projects/${createdProjectId}`)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <Header
        title={t('newProject')}
        actions={
          <Link href="/projects">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              {useTranslations('common')('back')}
            </Button>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg mx-auto">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">
                {t('projectName')}{' '}
                <span className="text-muted-foreground/60">*</span>
              </Label>
              <Input
                id="name"
                placeholder="DC-DC Converter 12V→5V"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="client">
                {t('clientName')}{' '}
                <span className="text-muted-foreground/60 text-[11px]">
                  ({useTranslations('common')('optional')})
                </span>
              </Label>
              <Input
                id="client"
                placeholder="Acme Corp"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">
                {t('description')}{' '}
                <span className="text-muted-foreground/60 text-[11px]">
                  ({useTranslations('common')('optional')})
                </span>
              </Label>
              <Textarea
                id="description"
                placeholder="Breve descripción del proyecto..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {createMutation.isError && (
              <p className="text-xs text-destructive">
                {createMutation.error instanceof Error
                  ? createMutation.error.message
                  : 'Error al crear el proyecto'}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={!name.trim() || createMutation.isPending}
                className="gap-1.5"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FolderPlus className="h-3.5 w-3.5" />
                )}
                {t('create')} proyecto
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
