'use client'

import { use } from 'react'
import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { PipelineView } from '@/components/pipeline/PipelineView'
import { RequirementsView } from '@/components/projects/RequirementsView'
import { DescripcionView } from '@/components/projects/DescripcionView'
import { NormativasView } from '@/components/projects/NormativasView'
import { DocumentList } from '@/components/documents/DocumentList'
import { DocumentUpload } from '@/components/documents/DocumentUpload'
import { documentsApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/primitives'
import { Separator } from '@/components/ui/primitives'
import { Link } from '@/i18n/routing'
import { ArrowLeft, GitBranch, Settings2, FileText, Info, Shield } from 'lucide-react'

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'muted'> = {
  active: 'default',
  completed: 'success',
  archived: 'muted',
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { id } = use(params)
  const t = useTranslations('projects')
  const tPipeline = useTranslations('pipeline')
  const tStatus = useTranslations('status')
  const tCommon = useTranslations('common')
  const tDocuments = useTranslations('documents')
  const tDescripcion = useTranslations('descripcion')
  const tNormativas = useTranslations('normativas')
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id),
  })

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ['documents', id],
    queryFn: () => documentsApi.list({ project_id: id }),
  })

  if (projectLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
        <div className="space-y-3 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Proyecto no encontrado
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <Header
        title={project.name}
        description={project.client_name ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_VARIANT[project.status]}>
              {tStatus(project.status)}
            </Badge>
            <Link href="/projects">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" />
                {tCommon('back')}
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="pipeline" className="h-full flex flex-col">
          {/* Tab bar */}
          <div className="border-b border-border px-6 pt-3">
            <TabsList className="bg-transparent gap-0 h-auto p-0 rounded-none">
              <TabsTrigger
                value="descripcion"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2 text-xs gap-1.5"
              >
                <Info className="h-3.5 w-3.5" />
                {tDescripcion('title')}
              </TabsTrigger>
              <TabsTrigger
                value="pipeline"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2 text-xs gap-1.5"
              >
                <GitBranch className="h-3.5 w-3.5" />
                {tPipeline('title')}
              </TabsTrigger>
              <TabsTrigger
                value="requirements"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2 text-xs gap-1.5"
              >
                <Settings2 className="h-3.5 w-3.5" />
                {t('requirements')}
              </TabsTrigger>
              <TabsTrigger
                value="normativas"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2 text-xs gap-1.5"
              >
                <Shield className="h-3.5 w-3.5" />
                {tNormativas('title')}
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2 text-xs gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" />
                {tDocuments('title')}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Descripcion tab */}
          <TabsContent value="descripcion" className="flex-1 overflow-y-auto mt-0">
            <DescripcionView projectId={id} project={project} />
          </TabsContent>

          {/* Pipeline tab */}
          <TabsContent value="pipeline" className="flex-1 overflow-y-auto p-6 mt-0">
            <PipelineView projectId={id} />
          </TabsContent>

          {/* Requirements tab */}
          <TabsContent value="requirements" className="flex-1 overflow-hidden mt-0">
            <RequirementsView projectId={id} project={project} />
          </TabsContent>

          {/* Normativas tab */}
          <TabsContent value="normativas" className="flex-1 overflow-hidden mt-0">
            <NormativasView projectId={id} project={project} />
          </TabsContent>

          {/* Documents tab */}
          <TabsContent value="documents" className="flex-1 overflow-y-auto p-6 mt-0">
            <div className="max-w-2xl space-y-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  {tDocuments('upload')}
                </p>
                <DocumentUpload
                  projectId={id}
                  queryKey={['documents', id]}
                />
              </div>
              <Separator />
              <div>
                <DocumentList
                  documents={documents ?? []}
                  isLoading={docsLoading}
                  queryKey={['documents', id]}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
