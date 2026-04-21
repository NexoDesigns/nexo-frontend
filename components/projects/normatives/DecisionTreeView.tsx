'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Group, Panel, Separator as PanelSeparator } from 'react-resizable-panels'
import { GripVertical, Loader2 } from 'lucide-react'

import { BlockNavigator } from './BlockNavigator'
import { QuestionPanel } from './QuestionPanel'
import { LegislationPanel } from './LegislationPanel'

import { decisionTreeApi, normativesApi } from '@/lib/api'
import {
  buildFlags,
  evaluateLegislations,
  getBlockQuestions,
} from '@/lib/nlf-decision-tree'
import type { Legislation, MutualExclusion, Question } from '@/lib/nlf-decision-tree'
import type { DecisionTreeAnswers, NormativeDocument } from '@/types'

import treeDataRaw from '@/data/nlf-decision-tree.json'

// ─── Local types matching JSON ────────────────────────────────────────────────

interface BlockData {
  id: string
  label: string
  icon: string
}

interface JSONLegislation {
  id: number
  code: string
  ref: string
  name: string
  trigger_keys: string[]
  exclusion_keys: string[]
}

// Augment with `reference` so the engine is satisfied (structural typing)
type EngineReady = JSONLegislation & { reference: string }

// ─── Props ────────────────────────────────────────────────────────────────────

interface DecisionTreeViewProps {
  projectId: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DecisionTreeView({ projectId }: DecisionTreeViewProps) {
  const queryClient = useQueryClient()

  // Cast JSON to typed structures
  const blocks = treeDataRaw.blocks as BlockData[]
  const questions = treeDataRaw.questions as unknown as Question[]
  const mutualExclusions = treeDataRaw.mutual_exclusions as MutualExclusion[]
  const legislationsRaw = treeDataRaw.legislations as JSONLegislation[]

  // Add `reference` field so engine functions accept these objects as Legislation[]
  const legislations: EngineReady[] = useMemo(
    () => legislationsRaw.map((l) => ({ ...l, reference: `${l.code} ${l.ref}` })),
    [legislationsRaw]
  )

  // ── UI state ────────────────────────────────────────────────────────────────
  const [answers, setAnswers] = useState<DecisionTreeAnswers>({})
  const [activeBlock, setActiveBlock] = useState<string>(blocks[0]?.id ?? 'A')
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [answersLoaded, setAnswersLoaded] = useState(false)

  // ── Load saved answers ───────────────────────────────────────────────────────
  const { data: savedAnswers, isLoading: loadingAnswers } = useQuery({
    queryKey: ['decision-tree-answers', projectId],
    queryFn: () => decisionTreeApi.get(projectId),
    retry: false,
  })

  // Populate answers once loaded (only on first load).
  // Filter defensively: keep only keys whose value is string[] — drops any
  // ghost keys like "answers: {}" left by older saves that wrapped incorrectly.
  useEffect(() => {
    if (savedAnswers && !answersLoaded) {
      // Backend returns { answers: { "A.1": [...], ... } } — unwrap the outer key
      const raw = savedAnswers as unknown as { answers?: DecisionTreeAnswers }
      setAnswers(raw.answers ?? {})
      setAnswersLoaded(true)
    }
  }, [savedAnswers, answersLoaded])

  // ── Save answers (debounced 800ms) ───────────────────────────────────────────
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const saveMutation = useMutation({
    mutationFn: (a: DecisionTreeAnswers) => decisionTreeApi.save(projectId, a),
  })

  const triggerSave = (nextAnswers: DecisionTreeAnswers) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveMutation.mutate(nextAnswers)
    }, 800)
  }

  // ── Engine: derive flags and evaluated legislations ──────────────────────────
  const flags = useMemo(
    () => buildFlags(answers, questions),
    [answers, questions]
  )

  const evaluated = useMemo(
    () => evaluateLegislations(flags, legislations as unknown as Legislation[], mutualExclusions),
    [flags, legislations, mutualExclusions]
  )

  // Cast back to full type for LegislationPanel (code + ref are present at runtime)
  const evaluatedWithMeta = evaluated as unknown as Array<
    (typeof legislations)[number] & { status: string; reason: string | null }
  >

  // ── Visible blocks (Block K gated on A.1.construction flag) ─────────────────
  const visibleBlocks = useMemo(
    () => blocks.filter((b) => b.id !== 'K' || flags.has('A.1.construction')),
    [blocks, flags]
  )

  // ── Active block questions ───────────────────────────────────────────────────
  const blockQuestions = useMemo(
    () => getBlockQuestions(activeBlock, flags, questions),
    [activeBlock, flags, questions]
  )

  // ── Project normatives (for "already added" check) ───────────────────────────
  const { data: projectNormatives = [] } = useQuery({
    queryKey: ['project-normatives', projectId],
    queryFn: () => normativesApi.getProjectNormatives(projectId),
  })

  // ── Update normatives mutation (for "Añadir" button) ────────────────────────
  const updateNormativesMutation = useMutation({
    mutationFn: (document_ids: string[]) =>
      normativesApi.updateProjectNormatives(projectId, { document_ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-normatives', projectId] })
    },
  })

  const handleAddLegislation = (code: string, _ref: string, _name: string) => {
    // Find matching normative document by standard_code metadata
    // For now, just refresh — the backend will resolve the match
    // TODO: wire up once backend exposes a search-by-code endpoint
    console.log('[DecisionTree] add legislation', code)
  }

  // ── Answer handlers ──────────────────────────────────────────────────────────
  const handleAnswer = (questionId: string, values: string[]) => {
    const next = { ...answers }
    if (values.length === 0) {
      delete next[questionId]
    } else {
      next[questionId] = values
    }
    setAnswers(next)
    triggerSave(next)
  }

  const handleUnknown = (questionId: string) => {
    const next = { ...answers, [questionId]: ['__unknown__'] }
    setAnswers(next)
    triggerSave(next)
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loadingAnswers) {
    return (
      <div className="flex items-center justify-center h-full gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p className="text-xs">Cargando respuestas guardadas…</p>
      </div>
    )
  }

  const activeBlockData = visibleBlocks.find((b) => b.id === activeBlock) ?? visibleBlocks[0]

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-hidden h-full">
      <Group orientation="horizontal" className="h-full">

        {/* ── Left: Block navigator (collapsible) ── */}
        <Panel
          defaultSize={leftCollapsed ? 5 : 200}
          minSize={leftCollapsed ? 50 : 160}
          maxSize={leftCollapsed ? 50 : 300}
          className="flex flex-col overflow-hidden border-r border-border"
        >
          <BlockNavigator
            visibleBlocks={visibleBlocks}
            activeBlock={activeBlock}
            onBlockChange={setActiveBlock}
            flags={flags}
            answers={answers}
            allQuestions={questions}
            collapsed={leftCollapsed}
            onToggle={() => setLeftCollapsed((v) => !v)}
          />
        </Panel>

        <PanelSeparator className="w-1.5 bg-border hover:bg-primary/40 transition-colors cursor-col-resize relative group flex items-center justify-center">
          <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </PanelSeparator>

        {/* ── Center: Questions ── */}
        <Panel
          defaultSize={rightCollapsed ? 350 : 150}
          minSize={200}
          className="flex flex-col overflow-hidden border-r border-border"
        >
          {activeBlockData && (
            <QuestionPanel
              activeBlock={activeBlockData}
              blockQuestions={blockQuestions}
              answers={answers}
              onAnswer={handleAnswer}
              onUnknown={handleUnknown}
              visibleBlocks={visibleBlocks}
              onBlockChange={setActiveBlock}
            />
          )}
        </Panel>

        <PanelSeparator className="w-1.5 bg-border hover:bg-primary/40 transition-colors cursor-col-resize relative group flex items-center justify-center">
          <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </PanelSeparator>

        {/* ── Right: Legislation panel (collapsible) ── */}
        <Panel
          defaultSize={rightCollapsed ? 155 : 250}
          minSize={rightCollapsed ? 50 : 180}
          maxSize={rightCollapsed ? 50 : 400}
          className="flex flex-col overflow-hidden"
        >
          <LegislationPanel
            evaluated={evaluatedWithMeta as Parameters<typeof LegislationPanel>[0]['evaluated']}
            projectNormatives={projectNormatives as NormativeDocument[]}
            onAdd={handleAddLegislation}
            collapsed={rightCollapsed}
            onToggle={() => setRightCollapsed((v) => !v)}
          />
        </Panel>

      </Group>
    </div>
  )
}
