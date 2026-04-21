// ─── 1. Types & Data Models ──────────────────────────────────────────────────

export type QuestionType = 'single' | 'multi' | 'info';
export type LegislationStatus = 'confirmed' | 'possible' | 'excluded' | 'not_evaluated';

export type Question = {
  id: string;
  block: string;
  type: QuestionType;
  label: string; // Actúa como 'question_text'
  visibleWhen: string | null;
  options: { value: string; label: string; flags: string[] }[];
};

export type Legislation = {
  id: number;
  reference: string;
  name: string;
  trigger_keys: string[];
  exclusion_keys: string[];
};

export type EvaluatedLegislation = Legislation & {
  status: LegislationStatus;
  reason: string | null;
};

export type Block = {
  id: string;
};

// Reflejando las reglas complejas de la Sección 6 del MD
export type MutualExclusion = {
  if_flag: string;
  exclude_ids?: number[];
  trigger_ids?: number[];
  exclude_partial?: number[]; // Para leyes absorbidas parcialmente (ej. RED sobre EMC)
  note?: string;
};

// Salida para el Agente AI (Sección 8 del MD)
export type OpenItem = {
  question_id: string;
  question_text: string;
  affectedCount: number;
  affects: string[]; // Referencias de las legislaciones afectadas
};

export type AgentContext = {
  confirmed_applicable: EvaluatedLegislation[];
  possibly_applicable: EvaluatedLegislation[];
  excluded: EvaluatedLegislation[];
  open_questions: OpenItem[];
  flags_set: string[];
};


// ─── 2. Evaluation Engine ────────────────────────────────────────────────────

/**
 * Reconstruye el Set de flags a partir de las respuestas actuales.
 */
export function buildFlags(
  answers: Record<string, string[]>, 
  questions: Question[]
): Set<string> {
  const flags = new Set<string>();
  
  for (const [qId, selectedValues] of Object.entries(answers)) {
    const question = questions.find(q => q.id === qId);
    if (!question) continue;
    
    for (const val of selectedValues) {
      const option = question.options.find(o => o.value === val);
      if (option) {
        option.flags.forEach(f => flags.add(f));
      }
    }
  }
  
  return flags;
}

/**
 * Evalúa el estado de las legislaciones basándose en los flags activos.
 */
export function evaluateLegislations(
  flags: Set<string>,
  legislations: Legislation[],
  mutualExclusions: MutualExclusion[]
): EvaluatedLegislation[] {
  
  const results: EvaluatedLegislation[] = legislations.map(leg => {
    // 1. Comprobar exclusiones directas primero
    for (const ex of leg.exclusion_keys) {
      if (flags.has(ex)) return { ...leg, status: 'excluded', reason: ex };
    }
    
    // 2. Comprobar triggers y propagación de "Unknown"
    let confirmed = 0;
    let unknown = 0;
    
    for (const tr of leg.trigger_keys) {
      if (flags.has(tr)) confirmed++;
      else if (flags.has(tr + '.unknown')) unknown++;
    }
    
    // 3. Asignar estado
    if (confirmed > 0) return { ...leg, status: 'confirmed', reason: null };
    if (unknown > 0) return { ...leg, status: 'possible', reason: null };
    
    return { ...leg, status: 'not_evaluated', reason: null };
  });

  // 4. Aplicar resolución de conflictos (Exclusiones Mutuas)
  for (const rule of mutualExclusions) {
    if (flags.has(rule.if_flag)) {
      
      // Aplicar exclusiones totales
      for (const id of (rule.exclude_ids || [])) {
        const r = results.find(l => l.id === id);
        if (r) { 
          r.status = 'excluded'; 
          r.reason = rule.if_flag; 
        }
      }
      
      // Aplicar triggers derivados de exclusiones mutuas (ej. Lifts -> Machinery)
      for (const id of (rule.trigger_ids || [])) {
        const r = results.find(l => l.id === id);
        if (r && r.status !== 'excluded') r.status = 'confirmed';
      }
      
      // Nota: `exclude_partial` no cambia el estado a 'excluded' ya que la 
      // legislación sigue aplicando para otros requisitos, pero podría usarse en la UI.
    }
  }

  return results;
}

/**
 * Devuelve las preguntas visibles según la evaluación de sus condicionales.
 */
export function getVisibleQuestions(flags: Set<string>, questions: Question[]): Question[] {
  return questions.filter(q => 
    q.visibleWhen === null || flags.has(q.visibleWhen)
  );
}

/**
 * Devuelve las preguntas visibles para un bloque específico.
 */
export function getBlockQuestions(blockId: string, flags: Set<string>, questions: Question[]): Question[] {
  return questions.filter(q => 
    q.block === blockId && (q.visibleWhen === null || flags.has(q.visibleWhen))
  );
}

/**
 * Calcula el progreso de un bloque.
 */
export function getBlockProgress(
  blockId: string, 
  flags: Set<string>, 
  answers: Record<string, string[]>,
  questions: Question[]
): { total: number; done: number } {
  const visible = getBlockQuestions(blockId, flags, questions);
  const answered = visible.filter(q => answers[q.id] != null && answers[q.id].length > 0);
  return { total: visible.length, done: answered.length };
}

/**
 * Encuentra preguntas abiertas que afectan a legislaciones y prepara el contexto
 * para el Agente AI ordenado por mayor impacto.
 */
export function getOpenQuestions(
  flags: Set<string>, 
  answers: Record<string, string[]>,
  questions: Question[],
  legislations: Legislation[]
): OpenItem[] {
  const open: OpenItem[] = [];

  for (const q of questions) {
    // Si ya está contestada, la omitimos
    if (answers[q.id] != null && answers[q.id].length > 0) continue;
    
    // Si no es visible con los flags actuales, la omitimos
    if (q.visibleWhen !== null && !flags.has(q.visibleWhen)) continue;

    // Recopilar flags potenciales de esta pregunta
    const allFlags = q.options.flatMap(o => o.flags);
    const affectedReferences: string[] = [];

    // Buscar qué legislaciones se verían afectadas si el usuario contesta esto
    for (const leg of legislations) {
      const isTrigger = leg.trigger_keys.some(tk => allFlags.includes(tk));
      const isExclusion = leg.exclusion_keys.some(ek => allFlags.includes(ek));
      
      if (isTrigger || isExclusion) {
        affectedReferences.push(leg.reference);
      }
    }

    if (affectedReferences.length > 0) {
      open.push({
        question_id: q.id,
        question_text: q.label,
        affectedCount: affectedReferences.length,
        affects: affectedReferences
      });
    }
  }

  // Ordenar por impacto descendente
  return open.sort((a, b) => b.affectedCount - a.affectedCount);
}

/**
 * Genera el payload estructurado final para inyectar en el Agente de IA.
 */
export function generateAgentContext(
  flags: Set<string>,
  answers: Record<string, string[]>,
  questions: Question[],
  legislations: Legislation[],
  mutualExclusions: MutualExclusion[]
): AgentContext {
  
  const evaluated = evaluateLegislations(flags, legislations, mutualExclusions);
  const openItems = getOpenQuestions(flags, answers, questions, legislations);

  return {
    confirmed_applicable: evaluated.filter(l => l.status === 'confirmed'),
    possibly_applicable: evaluated.filter(l => l.status === 'possible'),
    excluded: evaluated.filter(l => l.status === 'excluded'),
    open_questions: openItems,
    flags_set: Array.from(flags)
  };
}