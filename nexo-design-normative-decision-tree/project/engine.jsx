// ─── Evaluation Engine ─────────────────────────────────────────────────────
// Pure functions: flags in → legislation statuses out.

function evaluateLegislations(flags) {
  const results = LEGISLATIONS.map(leg => {
    // Check exclusions first
    for (const ex of leg.exclusion_keys) {
      if (flags.has(ex)) return { ...leg, status: 'excluded', reason: ex };
    }
    // Check triggers
    let confirmed = 0, unknown = 0;
    for (const tr of leg.trigger_keys) {
      if (flags.has(tr)) confirmed++;
      else if (flags.has(tr + '.unknown')) unknown++;
    }
    if (confirmed > 0) return { ...leg, status: 'confirmed', reason: null };
    if (unknown > 0) return { ...leg, status: 'possible', reason: null };
    return { ...leg, status: 'not_evaluated', reason: null };
  });

  // Apply mutual exclusions
  for (const rule of MUTUAL_EXCLUSIONS) {
    if (flags.has(rule.if_flag)) {
      for (const id of (rule.exclude_ids || [])) {
        const r = results.find(l => l.id === id);
        if (r) { r.status = 'excluded'; r.reason = rule.if_flag; }
      }
      for (const id of (rule.trigger_ids || [])) {
        const r = results.find(l => l.id === id);
        if (r && r.status !== 'excluded') r.status = 'confirmed';
      }
    }
  }

  return results;
}

function getVisibleQuestions(flags) {
  return QUESTIONS.filter(q => !q.visibleWhen || q.visibleWhen(flags));
}

function getBlockQuestions(blockId, flags) {
  return QUESTIONS.filter(q => q.block === blockId && (!q.visibleWhen || q.visibleWhen(flags)));
}

function getBlockProgress(blockId, flags, answers) {
  const visible = getBlockQuestions(blockId, flags);
  const answered = visible.filter(q => answers[q.id] != null);
  return { total: visible.length, done: answered.length };
}

// Determine which blocks are relevant (visible based on flags/routing)
function getVisibleBlocks(flags) {
  // K is only visible if A.1.construction is set
  return BLOCKS.filter(b => {
    if (b.id === 'K') return flags.has('A.1.construction');
    return true;
  });
}

// Find open questions that affect the most legislations (for "I don't know" prioritization)
function getOpenQuestions(flags, answers) {
  const open = [];
  for (const q of QUESTIONS) {
    if (answers[q.id] != null) continue;
    if (q.visibleWhen && !q.visibleWhen(flags)) continue;
    // Count legislations affected by this question's flags
    const allFlags = q.options.flatMap(o => o.flags);
    let affectedCount = 0;
    for (const leg of LEGISLATIONS) {
      if (leg.trigger_keys.some(tk => allFlags.includes(tk))) affectedCount++;
      if (leg.exclusion_keys.some(ek => allFlags.includes(ek))) affectedCount++;
    }
    if (affectedCount > 0) open.push({ question: q, affectedCount });
  }
  open.sort((a, b) => b.affectedCount - a.affectedCount);
  return open;
}

window.evaluateLegislations = evaluateLegislations;
window.getVisibleQuestions = getVisibleQuestions;
window.getBlockQuestions = getBlockQuestions;
window.getBlockProgress = getBlockProgress;
window.getVisibleBlocks = getVisibleBlocks;
window.getOpenQuestions = getOpenQuestions;
