# NLF Regulatory Scoping — Decision Tree: Implementation Details

**Document purpose:** Technical specification for implementing the NLF regulatory scoping intake form as an automated decision tree. Covers the logic behind each block, the mapping to the 30 NLF legislations, and pseudocode for the routing and evaluation engine.

---

## 1. Architecture Overview

The decision tree has three layers:

```
Layer 1 — Intake Form      : User answers structured questions
Layer 2 — Evaluation Engine: Pseudocode rules map answers to legislation flags
Layer 3 — Agent Context    : Flagged legislations + unanswered items → AI Agent
```

The evaluation engine runs immediately after each answer, progressively revealing or hiding sub-questions. At the end, it produces two lists:

- `CONFIRMED_APPLICABLE[]` — legislations that definitively apply
- `POSSIBLY_APPLICABLE[]` — legislations where one or more answers are still "I don't know yet"
- `CONFIRMED_NOT_APPLICABLE[]` — legislations definitively excluded

The AI Agent then receives only the legislations in `CONFIRMED_APPLICABLE` and `POSSIBLY_APPLICABLE` as context, plus the open "I don't know yet" items as flagged gaps to resolve with the user.

---

## 2. Data Model

Each legislation in the knowledge base is represented as:

```typescript
type Legislation = {
  id:             number         // 1–30
  reference:      string         // "Directive 2014/35/EU"
  name:           string         // "Low Voltage Directive (LVD)"
  trigger_keys:   string[]       // internal flags that APPLY this legislation
  exclusion_keys: string[]       // internal flags that EXCLUDE this legislation
  status:         "confirmed" | "possible" | "excluded" | "not_evaluated"
}
```

Each question answer sets one or more **flags** in a shared `flags: Set<string>` object. The engine evaluates each legislation against its `trigger_keys` and `exclusion_keys` after every answer.

---

## 3. Flag Taxonomy

Flags are namespaced strings set by each answer option. Convention:

```
{block}.{question}.{answer_key}
```

Examples:
```
A.1.consumer_product
A.1.toy_children
A.3.military_exclusive
B.1.has_electronics
B.2.voltage_50_1000_ac
B.4.has_radio
B.5.has_battery
B.5a.battery_portable
B.6a.has_ai
B.6b.has_connectivity
C.2.pressure_spvd_range
C.2.pressure_ped_range
C.2.pressure_transportable
E.1.worn_by_person
H.1.medical_device
H.1b.ivd_device
```

Special flag values:
```
*.unknown   → "I don't know yet" — triggers POSSIBLY_APPLICABLE instead of CONFIRMED
*.skip      → Block or question explicitly skipped (not applicable by prior routing)
```

---

## 4. Pseudocode — Evaluation Engine

```pseudocode
// ─────────────────────────────────────────────────────────────
// MAIN ENGINE
// ─────────────────────────────────────────────────────────────

STATE:
  flags          = Set<string>          // all flags set so far
  answered       = Set<questionId>      // questions answered
  visible        = Set<questionId>      // questions currently shown
  legislation[]  = load_knowledge_base()

FUNCTION evaluate_all_legislations():
  FOR each leg IN legislation[]:
    evaluate_legislation(leg)

FUNCTION evaluate_legislation(leg):

  // Step 1 — Check hard exclusions first
  FOR each ex_key IN leg.exclusion_keys:
    IF flags.has(ex_key):
      leg.status = "excluded"
      RETURN

  // Step 2 — Check if any trigger is confirmed
  confirmed_triggers = 0
  unknown_triggers   = 0

  FOR each tr_key IN leg.trigger_keys:
    IF flags.has(tr_key):
      confirmed_triggers += 1
    ELSE IF flags.has(tr_key + ".unknown"):
      unknown_triggers += 1

  // Step 3 — Assign status
  IF confirmed_triggers > 0:
    leg.status = "confirmed"
  ELSE IF unknown_triggers > 0:
    leg.status = "possible"
  ELSE:
    leg.status = "not_evaluated"

  RETURN leg.status


// ─────────────────────────────────────────────────────────────
// ROUTING ENGINE — reveals sub-questions based on answers
// ─────────────────────────────────────────────────────────────

FUNCTION on_answer(question_id, selected_options):

  // 1. Set flags for each selected option
  FOR each option IN selected_options:
    flags.add(option.flag_key)

  // 2. Reveal sub-questions based on routing rules
  apply_routing_rules(question_id, selected_options)

  // 3. Re-evaluate all legislations
  evaluate_all_legislations()

  // 4. Update visible question list
  update_visible_questions()


FUNCTION apply_routing_rules(question_id, selected_options):

  SWITCH question_id:

    // ── BLOCK A ──────────────────────────────────────────────

    CASE "A.1":
      IF "A.1.toy_children" IN selected_options:
        SHOW "A.1.a"
      IF "A.1.medical" IN selected_options:
        SHOW Block H
      IF "A.1.construction" IN selected_options:
        SHOW Block K
      IF "A.1.explosive_pyro" IN selected_options:
        SHOW Block F
      // All products continue to Block B–J as relevant

    CASE "A.3":
      IF "A.3.military_exclusive" OR "A.3.space_exclusive":
        // Hard exclusion — mark most legislations as excluded
        // Only show market question then end form
        SHOW "A.4"
        HIDE all remaining blocks EXCEPT A.4
        SET_GLOBAL_EXCLUSION("military_space")

    // ── BLOCK B ──────────────────────────────────────────────

    CASE "B.1":
      IF "B.1.yes":
        SHOW B.2, B.3, B.4, B.5, B.6
      IF "B.1.no":
        HIDE all B.* sub-questions

    CASE "B.4":
      IF "B.4.yes_*" (any radio technology):
        SHOW "B.4.a"

    CASE "B.5":
      IF "B.5.yes_*" (any chemistry):
        SHOW "B.5.a"

    CASE "B.6":
      IF "B.6.yes":
        SHOW "B.6.a", "B.6.b"

    CASE "B.6.a":
      IF "B.6.a.yes":
        SHOW "B.6.a.i"

    // ── BLOCK C ──────────────────────────────────────────────

    CASE "C.1":
      IF "C.1.yes":
        SHOW "C.1.a"
      IF "C.1.no":
        HIDE "C.1.a"

    CASE "C.3":
      IF "C.3.yes_*":
        SHOW "C.3.a"

    // ── BLOCK D ──────────────────────────────────────────────

    CASE "D.1":
      IF "D.1.vertical_lift":
        SHOW "D.1.a"
      IF "D.1.cableway":
        SHOW "D.1.b"

    // ── BLOCK E ──────────────────────────────────────────────

    CASE "E.1":
      IF "E.1.yes":
        SHOW "E.1.a"

    // ── BLOCK G ──────────────────────────────────────────────

    CASE "G.1":
      IF "G.1.commercial_ship":
        SHOW "G.1.a"
      IF "G.1.recreational_watercraft":
        SHOW "G.1.b"
      IF "G.1.drone":
        SHOW "G.1.c"

    // ── BLOCK H ──────────────────────────────────────────────

    CASE "H.1":
      IF "H.1.medical_condition":
        SHOW "H.1.a"
      IF "H.1.ivd":
        SHOW "H.1.b"

    // ── BLOCK I ──────────────────────────────────────────────

    CASE "I.1":
      IF "I.1.yes":
        SHOW "I.1.a"

    // ── BLOCK J ──────────────────────────────────────────────

    CASE "J.1":
      IF "J.1.yes":
        SHOW "J.1.a"

    // ── BLOCK K ──────────────────────────────────────────────

    CASE "K.1":
      IF "K.1.yes":
        SHOW "K.1.a"
```

---

## 5. Legislation Trigger & Exclusion Map

The following table defines the exact `trigger_keys` and `exclusion_keys` for each of the 30 NLF legislations. This is the core of the evaluation engine.

```pseudocode
LEGISLATION_RULES = [

  // ─── 1. Toy Safety Regulation (EU) 2025/2509 ───────────────
  {
    id: 1,
    trigger_keys:   ["A.1.a.yes_play_value"],
    exclusion_keys: ["A.1.a.no_no_play_value", "A.3.military_exclusive",
                     "A.3.space_exclusive"]
  },

  // ─── 2. TPED Directive 2010/35/EU ──────────────────────────
  {
    id: 2,
    trigger_keys:   ["C.2.pressure_transportable"],
    exclusion_keys: ["A.3.military_exclusive", "A.3.space_exclusive"]
  },

  // ─── 3. RoHS Directive 2011/65/EU ──────────────────────────
  {
    id: 3,
    trigger_keys:   ["B.1.yes"],
    exclusion_keys: [
      "J.1a.rohs_large_scale_industrial",
      "J.1a.rohs_active_implantable",
      "J.1a.rohs_photovoltaic",
      "J.1a.rohs_pipe_organ",
      "A.3.military_exclusive",
      "A.3.space_exclusive"
    ]
  },

  // ─── 4. Construction Products Regulation (EU) 305/2011 ─────
  {
    id: 4,
    trigger_keys:   ["K.1.yes", "K.1a.harmonised_standard_yes"],
    exclusion_keys: ["K.1a.harmonised_standard_no"]
  },

  // ─── 5. Pyrotechnic Articles Directive 2013/29/EU ──────────
  {
    id: 5,
    trigger_keys: [
      "F.2.firework_consumer",
      "F.2.firework_professional",
      "F.2.theatrical_pyro",
      "F.2.vehicle_airbag",
      "F.2.signal_flare"
    ],
    exclusion_keys: [
      "F.2.military_police_use",
      "F.2.percussion_cap_toy",   // → Toy Safety applies instead
      "F.2.aerospace_pyro"
    ]
  },

  // ─── 6. Recreational Craft Directive 2013/53/EU ─────────────
  {
    id: 6,
    trigger_keys: [
      "G.1b.motorboat_yacht",
      "G.1b.personal_watercraft"
    ],
    exclusion_keys: [
      "G.1b.racing_watercraft",
      "G.1b.canoe_kayak_pedalo",
      "G.1b.surfboard",
      "G.1b.historic_pre1950",
      "G.1b.submersible_hydrofoil"
    ]
  },

  // ─── 7. Civil Explosives Directive 2014/28/EU ───────────────
  {
    id: 7,
    trigger_keys: [
      "F.2.blasting_explosive",
      "F.2.detonator",
      "F.2.detonating_cord"
    ],
    exclusion_keys: ["F.2.military_police_use"]
  },

  // ─── 8. Simple Pressure Vessels Directive 2014/29/EU ────────
  {
    id: 8,
    trigger_keys:   ["C.2.pressure_spvd_range"],
    exclusion_keys: ["C.2.pressure_none", "C.2.pressure_below_0_5"]
  },

  // ─── 9. EMC Directive 2014/30/EU ────────────────────────────
  {
    id: 9,
    trigger_keys:   ["B.3.has_active_electronics"],
    exclusion_keys: [
      "B.4.has_radio",            // radio equipment → RED covers EMC instead
      "H.1a.medical_device",      // MDR covers EMC for medical devices
      "A.3.military_exclusive"
    ]
  },

  // ─── 10. NAWID 2014/31/EU ───────────────────────────────────
  {
    id: 10,
    trigger_keys: [
      "I.1a.non_auto_weighing_commercial",
      "I.1a.non_auto_weighing_medical",
      "I.1a.non_auto_weighing_pharma",
      "I.1a.non_auto_weighing_legal"
    ],
    exclusion_keys: ["I.1a.weighing_domestic_only"]
  },

  // ─── 11. MID 2014/32/EU ─────────────────────────────────────
  {
    id: 11,
    trigger_keys: [
      "I.1a.water_volume",
      "I.1a.gas_volume",
      "I.1a.electrical_energy",
      "I.1a.thermal_energy",
      "I.1a.liquid_flow",
      "I.1a.automatic_weighing",
      "I.1a.taximeter",
      "I.1a.length_materials",
      "I.1a.dimensional",
      "I.1a.exhaust_gas"
    ],
    exclusion_keys: ["I.1a.weighing_domestic_only"]
  },

  // ─── 12. Lifts Directive 2014/33/EU ─────────────────────────
  {
    id: 12,
    trigger_keys: [
      "D.1a.passenger_lift",
      "D.1a.goods_lift_accessible_fast",
      "D.1a.lift_safety_component"
    ],
    exclusion_keys: [
      "D.1a.goods_lift_slow",       // speed ≤0.15 m/s → Machinery instead
      "D.1a.construction_hoist",
      "D.1a.escalator_walkway"
    ]
  },

  // ─── 13. ATEX Directive 2014/34/EU ──────────────────────────
  {
    id: 13,
    trigger_keys: [
      "F.1.zone_0_20",
      "F.1.zone_1_21",
      "F.1.zone_2_22"
    ],
    exclusion_keys: [
      "A.3.military_exclusive",
      "H.1.medical_condition"       // medical devices excluded from ATEX
    ]
  },

  // ─── 14. RED 2014/53/EU ─────────────────────────────────────
  {
    id: 14,
    trigger_keys: ["B.4.has_radio"],
    exclusion_keys: [
      "G.1a.marine_equipment",      // marine equipment → MED instead
      "A.3.space_exclusive",
      "B.4a.amateur_radio_non_commercial"
    ]
  },

  // ─── 15. LVD 2014/35/EU ─────────────────────────────────────
  {
    id: 15,
    trigger_keys: [
      "B.2.voltage_50_1000_ac",
      "B.2.voltage_75_1500_dc",
      "B.2.voltage_mains_230",
      "B.2.voltage_mains_400",
      "B.2.voltage_battery_above_75dc",
      "B.2.voltage_mixed"
    ],
    exclusion_keys: [
      "B.2.voltage_below_50ac_75dc",
      "B.2.voltage_battery_below_75dc",
      "F.1.zone_0_20",              // ATEX covers LV equipment in Ex zones
      "H.1a.medical_device",        // MDR covers electrical requirements
      "A.3.military_exclusive"
    ]
  },

  // ─── 16. PED 2014/68/EU ─────────────────────────────────────
  {
    id: 16,
    trigger_keys:   ["C.2.pressure_ped_range"],
    exclusion_keys: [
      "C.2.pressure_none",
      "C.2.pressure_below_0_5",
      "C.2.pressure_spvd_range",    // SPVD and PED are mutually exclusive
      "C.2.pressure_transportable"  // TPED applies instead
    ]
  },

  // ─── 17. MED 2014/90/EU ─────────────────────────────────────
  {
    id: 17,
    trigger_keys: [
      "G.1a.lifesaving",
      "G.1a.fire_protection",
      "G.1a.navigation",
      "G.1a.communication",
      "G.1a.pollution_prevention"
    ],
    exclusion_keys: [
      "G.1b.motorboat_yacht",       // recreational craft → RCD instead
      "A.3.military_exclusive"
    ]
  },

  // ─── 18. Cableway Regulation (EU) 2016/424 ──────────────────
  {
    id: 18,
    trigger_keys: [
      "D.1b.ski_chair_drag",
      "D.1b.gondola_telecabine",
      "D.1b.funicular",
      "D.1b.aerial_ropeway"
    ],
    exclusion_keys: [
      "D.1b.agricultural_forestry",
      "D.1b.funfair_amusement",
      "D.1b.sport_racing"
    ]
  },

  // ─── 19. PPE Regulation (EU) 2016/425 ───────────────────────
  {
    id: 19,
    trigger_keys: [
      "E.1a.mechanical",
      "E.1a.thermal",
      "E.1a.chemical_biological",
      "E.1a.electrical",
      "E.1a.fall_height",
      "E.1a.respiratory",
      "E.1a.noise_hearing",
      "E.1a.radiation",
      "E.1a.drowning"
    ],
    exclusion_keys: [
      "E.1a.military_police_exclusive",
      "E.1a.private_rain_dishwashing"
    ]
  },

  // ─── 20. Gas Appliances Regulation (EU) 2016/426 ────────────
  {
    id: 20,
    trigger_keys:   ["C.3a.domestic_commercial_appliance"],
    exclusion_keys: [
      "C.3a.industrial_process",
      "C.3a.marine_aircraft",
      "C.3a.outdoor_barbecue",
      "C.3a.explosive_atmosphere"   // ATEX applies instead
    ]
  },

  // ─── 21. MDR (EU) 2017/745 ──────────────────────────────────
  {
    id: 21,
    trigger_keys: [
      "H.1.medical_condition",
      "H.1.annex_xvi_aesthetic"
    ],
    exclusion_keys: [
      "H.1b.ivd_device",            // IVD → IVDR instead
      "H.1.general_wellness"
    ]
  },

  // ─── 22. IVDR (EU) 2017/746 ─────────────────────────────────
  {
    id: 22,
    trigger_keys: [
      "H.1b.reagent_kit",
      "H.1b.lab_analyser",
      "H.1b.point_of_care",
      "H.1b.genetic_molecular"
    ],
    exclusion_keys: [
      "H.1b.general_lab_no_ivd_intent",
      "H.1b.invasive_sampling"
    ]
  },

  // ─── 23. EU Fertilising Products Regulation (EU) 2019/1009 ──
  {
    id: 23,
    trigger_keys:   ["A.1.fertiliser_biostimulant"],
    exclusion_keys: ["A.3.military_exclusive"]
  },

  // ─── 24. UAS Regulation (EU) 2019/945 ───────────────────────
  {
    id: 24,
    trigger_keys: [
      "G.1c.class_C0",
      "G.1c.class_C1",
      "G.1c.class_C2",
      "G.1c.class_C3",
      "G.1c.class_C4",
      "G.1c.class_C5_C6"
    ],
    exclusion_keys: [
      "G.1c.military_state",
      "G.1c.model_aircraft_club_only"
    ]
  },

  // ─── 25. Batteries Regulation (EU) 2023/1542 ────────────────
  {
    id: 25,
    trigger_keys: [
      "B.5a.battery_portable",
      "B.5a.battery_lmt",
      "B.5a.battery_sli",
      "B.5a.battery_industrial",
      "B.5a.battery_ev"
    ],
    exclusion_keys: ["B.5a.battery_military_space"]
  },

  // ─── 26. Machinery Regulation (EU) 2023/1230 ────────────────
  {
    id: 26,
    trigger_keys: [
      "C.1.yes",
      "C.1a.complete_machine",
      "C.1a.safety_component",
      "C.1a.lifting_accessory",
      "C.1a.chain_rope_webbing",
      "C.1a.transmission_device",
      "C.1a.partly_completed",
      "C.1a.interchangeable_equipment"
    ],
    exclusion_keys: [
      "C.1a.agricultural_tractor",
      "C.1a.motor_vehicle",
      "C.1a.fairground_ride",
      "A.3.military_exclusive"
    ]
  },

  // ─── 27. ESPR (EU) 2024/1781 ────────────────────────────────
  {
    id: 27,
    trigger_keys:   ["J.1.yes"],
    exclusion_keys: [
      "J.1a.food_feed",
      "J.1a.medicinal_veterinary",
      "J.1a.motor_vehicle",
      "J.1a.defence_security",
      "A.4.exclusively_outside_eu"
    ]
  },

  // ─── 28. AI Act (EU) 2024/1689 ──────────────────────────────
  {
    id: 28,
    trigger_keys: [
      "B.6a.yes",
      "B.6ai.biometric",
      "B.6ai.critical_infrastructure",
      "B.6ai.education",
      "B.6ai.employment",
      "B.6ai.essential_services",
      "B.6ai.law_enforcement",
      "B.6ai.migration",
      "B.6ai.justice",
      "B.6ai.general_purpose"
    ],
    exclusion_keys: [
      "B.6ai.military_defence_only",
      "A.4.exclusively_outside_eu"
    ]
  },

  // ─── 29. Cyber Resilience Act (EU) 2024/2847 ────────────────
  {
    id: 29,
    trigger_keys: [
      "B.6b.yes_always_connected",
      "B.6b.yes_occasionally"
    ],
    exclusion_keys: [
      "H.1.medical_condition",      // MDR/IVDR applies instead
      "C.1a.motor_vehicle",         // Reg 2019/2144 applies instead
      "B.6b.pure_saas",
      "B.6b.non_commercial_open_source",
      "A.3.military_exclusive"
    ]
  },

  // ─── 30. PPWR (EU) 2025/40 ──────────────────────────────────
  {
    id: 30,
    trigger_keys: [
      "J.2.consumer_packaging",
      "J.2.industrial_transport_packaging",
      "J.2.ecommerce_packaging"
    ],
    exclusion_keys: [
      "J.2.dangerous_goods_transport_only",
      "A.4.exclusively_outside_eu"
    ]
  }

]
```

---

## 6. Conflict Resolution Logic

Some legislations are mutually exclusive — where the product falls under one, the other explicitly does not apply. The engine handles these as **mutual exclusion pairs**:

```pseudocode
MUTUAL_EXCLUSIONS = [

  // Pressure equipment — three mutually exclusive regimes
  { if: "C.2.pressure_spvd_range",     exclude: [id:16, id:2] },  // SPVD → not PED, not TPED
  { if: "C.2.pressure_ped_range",      exclude: [id:8,  id:2] },  // PED  → not SPVD, not TPED
  { if: "C.2.pressure_transportable",  exclude: [id:8,  id:16]},  // TPED → not SPVD, not PED

  // Radio equipment — RED absorbs LVD and EMC safety/immunity requirements
  { if: "B.4.has_radio", exclude_partial: [id:15, id:9] },
  // Note: "exclude_partial" means the legislation still applies
  // for requirements NOT covered by RED (e.g. EMC emissions still covered by RED)
  // but RED is listed as the PRIMARY legislation for conformity assessment

  // Marine equipment — MED absorbs RED, EMC and LVD for shipboard equipment
  { if: "G.1a.marine_equipment", exclude_partial: [id:14, id:9, id:15] },

  // Medical devices — MDR absorbs EMC, LVD, AI Act assessment route
  // (AI Act still applies, but conformity assessment integrates into MDR route)
  { if: "H.1.medical_condition", note: "MDR is primary; EMC/LVD requirements
                                         addressed within MDR technical file" },

  // Lifts — slow goods hoists go to Machinery, not Lifts Directive
  { if: "D.1a.goods_lift_slow",   exclude: [id:12], trigger: [id:26] },

  // ATEX — GAR explicitly excluded if product in explosive atmosphere
  { if: "F.1.zone_*",             exclude: [id:20] }

]

FUNCTION apply_mutual_exclusions():
  FOR each rule IN MUTUAL_EXCLUSIONS:
    IF flags.has(rule.if):
      FOR each excluded_id IN rule.exclude:
        legislation[excluded_id].status = "excluded"
        legislation[excluded_id].exclusion_reason = rule.if
```

---

## 7. "I Don't Know Yet" Propagation

When a user selects "I don't know yet" on a question that is a trigger for one or more legislations, those legislations move to `POSSIBLY_APPLICABLE` rather than remaining `not_evaluated`.

```pseudocode
FUNCTION handle_unknown_answer(question_id):

  // Find all legislations triggered by this question
  affected_legislations = find_by_trigger_question(question_id)

  FOR each leg IN affected_legislations:
    IF leg.status == "not_evaluated":
      leg.status = "possible"
      leg.open_question = question_id

  // Add to the agent's follow-up list
  open_items.add({
    question_id:  question_id,
    question_text: get_question_text(question_id),
    affects:      affected_legislations.map(l => l.reference)
  })
```

The AI Agent receives the `open_items` list and is instructed to ask ONE of these questions at a time, starting with the one that affects the most legislations.

```pseudocode
FUNCTION prioritise_open_items():
  SORT open_items BY count(affects) DESC
  RETURN open_items[0]  // highest-impact unanswered question
```

---

## 8. Output Structure Sent to AI Agent

```pseudocode
FUNCTION generate_agent_context():

  RETURN {
    confirmed_applicable: legislation.filter(l => l.status == "confirmed"),
    possibly_applicable:  legislation.filter(l => l.status == "possible"),
    excluded:             legislation.filter(l => l.status == "excluded"),
    open_questions:       prioritise_open_items(),
    flags_set:            Array.from(flags),
    project_description:  form.answers["A.description"]
  }
```

The AI Agent system prompt instructs it to:
1. Present only `confirmed_applicable` as definitive results
2. Present `possibly_applicable` as conditional (pending one clarifying question)
3. Ask the **single highest-impact** open question from `open_questions`
4. Never reference any legislation not in the provided context

---

## 9. Block Dependency Map

The table below shows which blocks are always visible and which are gated by prior answers.

| Block | Always visible? | Gated by |
|-------|----------------|----------|
| **A** — Product Identity | ✅ Yes | — |
| **A.1.a** — Toy play value | ❌ No | A.1 = toy_children |
| **B** — Electrical entry (B.1) | ✅ Yes | — |
| **B.2–B.6** | ❌ No | B.1 = yes |
| **B.4.a** | ❌ No | B.4 = yes (any radio) |
| **B.5.a** | ❌ No | B.5 = yes (has battery) |
| **B.6.a** | ❌ No | B.6 = yes (has software) |
| **B.6.a.i** | ❌ No | B.6.a = yes (has AI) |
| **B.6.b** | ❌ No | B.6 = yes (has software) |
| **C.1** | ✅ Yes | — |
| **C.1.a** | ❌ No | C.1 = yes |
| **C.2** | ✅ Yes | — |
| **C.3** | ✅ Yes | — |
| **C.3.a** | ❌ No | C.3 = yes |
| **D.1** | ✅ Yes | — |
| **D.1.a** | ❌ No | D.1 = vertical_lift |
| **D.1.b** | ❌ No | D.1 = cableway |
| **E.1** | ✅ Yes | — |
| **E.1.a** | ❌ No | E.1 = yes |
| **F.1** | ✅ Yes | — |
| **F.1.a** | ❌ No | F.1 = yes |
| **F.2** | ✅ Yes | — |
| **G.1** | ✅ Yes | — |
| **G.1.a/b/c** | ❌ No | G.1 = specific type |
| **H** — Medical | ❌ No | A.1 = medical OR H.1 = yes |
| **H.1.a** | ❌ No | H.1 = medical_condition |
| **H.1.b** | ❌ No | H.1 = ivd |
| **I.1** | ✅ Yes | — |
| **I.1.a** | ❌ No | I.1 = yes |
| **J** — Sustainability | ✅ Yes | — |
| **J.1.a** | ❌ No | J.1 = yes |
| **K** — Construction | ❌ No | A.1 = construction |
| **K.1.a** | ❌ No | K.1 = yes |

---

## 10. Worked Example — Connected Industrial Sensor

**Product:** Industrial temperature sensor with WiFi connectivity, 24V DC supply, used in a Zone 2 hazardous area.

### Form answers → Flags set:

```
A.1   → industrial_professional
A.2   → complete_standalone_product
A.3   → no_military
A.4   → eu_eea

B.1   → yes
B.2   → voltage_below_50ac_75dc      (24V DC < 75V threshold)
B.3   → has_active_electronics
B.4   → yes_wifi
B.5   → no_battery
B.6   → yes_has_firmware
B.6a  → no_ai
B.6b  → yes_occasionally_connected

C.2   → pressure_none
C.3   → no_gas_fuel

F.1   → zone_2_22                     (Zone 2 hazardous area)

J.1   → yes_physical_product
J.1a  → none_of_exclusions
J.2   → yes_industrial_packaging
```

### Engine evaluation output:

| # | Legislation | Status | Reason |
|---|-------------|--------|--------|
| 3 | RoHS | ✅ Confirmed | B.1 = yes, no exclusions |
| 9 | EMC | ⚠️ Possible* | B.3 = active electronics, BUT B.4 = radio → RED absorbs EMC |
| 13 | ATEX | ✅ Confirmed | F.1 = zone_2_22 |
| 14 | RED | ✅ Confirmed | B.4 = yes_wifi |
| 15 | LVD | ❌ Excluded | B.2 = below_50ac_75dc (24V < 75V) |
| 27 | ESPR | ✅ Confirmed | J.1 = yes, no exclusions |
| 29 | CRA | ✅ Confirmed | B.6b = yes_occasionally |
| 30 | PPWR | ✅ Confirmed | J.2 = yes_industrial_packaging |

*EMC note: RED 2014/53/EU absorbs EMC immunity requirements; manufacturer still responsible for EMC emission requirements separately if RED harmonised standard does not fully cover them.

### Agent context delivered:

```json
{
  "confirmed_applicable": [3, 13, 14, 27, 29, 30],
  "possibly_applicable":  [],
  "excluded":             [15],
  "open_questions":       [],
  "flags_set":            ["B.1.yes", "B.4.yes_wifi", "F.1.zone_2_22", ...]
}
```

**Result:** 6 confirmed legislations, 0 follow-up questions needed.

---

## 11. Implementation Notes

- **Framework agnostic:** The pseudocode above can be implemented in any language (JavaScript/TypeScript for n8n, Python, etc.)
- **n8n implementation:** The evaluation engine runs in a Code node; flags are stored in `$workflow.staticData` or passed as JSON between nodes
- **Progressive disclosure:** In a web form, sub-questions are shown/hidden via conditional rendering based on the `visible` set
- **Audit trail:** The `flags_set` array is always included in the agent context so the reasoning is fully transparent and traceable
- **Extensibility:** Adding a new legislation requires only adding one entry to `LEGISLATION_RULES` with its `trigger_keys` and `exclusion_keys` — no other code changes needed
