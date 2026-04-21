'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { documentsApi } from '@/lib/api'
import { Header } from '@/components/layout/Header'
import { DocumentList } from '@/components/documents/DocumentList'

const QUERY_KEY = ['documents-global']

export default function KnowledgeBasePage() {
  const t = useTranslations('knowledgeBase')

  const { data: documents, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => documentsApi.list(),
  })

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <Header title={t('title')} description={t('description')} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <DocumentList
            documents={documents ?? []}
            isLoading={isLoading}
            queryKey={QUERY_KEY}
          />
        </div>
      </div>
    </div>
  )
}
