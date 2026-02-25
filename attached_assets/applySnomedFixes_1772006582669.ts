#!/usr/bin/env ts-node
/**
 * applySnomedFixes.ts
 * 
 * Automated patch script for applying SNOMED CT code corrections
 * to the surgical logbook app source files.
 * 
 * Usage:
 *   npx ts-node applySnomedFixes.ts --dry-run              # Preview all changes
 *   npx ts-node applySnomedFixes.ts                         # Apply all changes
 *   npx ts-node applySnomedFixes.ts --priority critical     # Critical fixes only
 *   npx ts-node applySnomedFixes.ts --priority high         # Critical + high
 *   npx ts-node applySnomedFixes.ts --verify                # Verify codes via Ontoserver
 * 
 * IMPORTANT: Adjust SOURCE_DIR to point to your app's source directory.
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  criticalFixes,
  highFixes,
  mediumFixes,
  diagnosisFixes,
  displayFixes,
  crossMapFixes,
  burnsReplacementMap,
  bodyContouringReplacementMap,
  codesToVerify,
  getUpdateSummary,
} from './snomedCodeFixes';
import type { } from './snomedCodeFixes';

// ============================================================================
// CONFIGURATION — adjust these paths to match your project
// ============================================================================

const SOURCE_DIR = './src'; // <-- Set this to your app source root
const PROCEDURE_PICKLIST = path.join(SOURCE_DIR, 'data/procedurePicklist.ts');
const DIAGNOSIS_PICKLIST = path.join(SOURCE_DIR, 'data/diagnosisPicklist.ts');
const SKIN_CANCER_DX     = path.join(SOURCE_DIR, 'data/skinCancerDiagnoses.ts');
const SNOMED_CROSSMAP     = path.join(SOURCE_DIR, 'data/snomedCt.ts');

// ============================================================================
// CLI ARGUMENT PARSING
// ============================================================================

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const verifyMode = args.includes('--verify');
const priorityFlag = args.indexOf('--priority');
const maxPriority = priorityFlag >= 0 ? args[priorityFlag + 1] : 'medium';

// ============================================================================
// CORE PATCH LOGIC
// ============================================================================

interface PatchEntry {
  entryId: string;
  field: 'snomedCtCode' | 'snomedCtDisplay';
  oldValue: string;
  newValue: string;
  priority: string;
  description: string;
}

function buildPatchList(): PatchEntry[] {
  const patches: PatchEntry[] = [];
  const priorities = ['critical', 'high', 'medium'];
  const maxIdx = priorities.indexOf(maxPriority.toLowerCase());

  // Collect all applicable fixes based on priority
  const allFixes = [
    ...(maxIdx >= 0 ? criticalFixes : []),
    ...(maxIdx >= 1 ? highFixes : []),
    ...(maxIdx >= 2 ? mediumFixes : []),
    // Diagnosis fixes always included if at least HIGH
    ...(maxIdx >= 1 ? diagnosisFixes : []),
  ];

  for (const fix of allFixes) {
    const ids = Array.isArray(fix.entryId) ? fix.entryId : [fix.entryId];
    for (const id of ids) {
      // Check for burns-specific replacement
      if (id in burnsReplacementMap) {
        const replacement = burnsReplacementMap[id];
        patches.push({
          entryId: id,
          field: 'snomedCtCode',
          oldValue: fix.current.code,
          newValue: replacement.code,
          priority: fix.priority,
          description: fix.description,
        });
        patches.push({
          entryId: id,
          field: 'snomedCtDisplay',
          oldValue: fix.current.display,
          newValue: replacement.display,
          priority: fix.priority,
          description: `Display update for ${id}`,
        });
      }
      // Check for body contouring-specific replacement
      else if (id in bodyContouringReplacementMap) {
        const replacement = bodyContouringReplacementMap[id];
        patches.push({
          entryId: id,
          field: 'snomedCtCode',
          oldValue: fix.current.code,
          newValue: replacement.code,
          priority: fix.priority,
          description: fix.description,
        });
        patches.push({
          entryId: id,
          field: 'snomedCtDisplay',
          oldValue: fix.current.display,
          newValue: replacement.display,
          priority: fix.priority,
          description: `Display update for ${id}`,
        });
      }
      // Standard replacement
      else {
        patches.push({
          entryId: id,
          field: 'snomedCtCode',
          oldValue: fix.current.code,
          newValue: fix.replacement.code,
          priority: fix.priority,
          description: fix.description,
        });
        if (fix.current.display !== fix.replacement.display) {
          patches.push({
            entryId: id,
            field: 'snomedCtDisplay',
            oldValue: fix.current.display,
            newValue: fix.replacement.display,
            priority: fix.priority,
            description: `Display update for ${id}`,
          });
        }
      }
    }
  }

  // Add display-only fixes
  for (const df of displayFixes) {
    patches.push({
      entryId: df.entryId,
      field: 'snomedCtDisplay',
      oldValue: df.currentDisplay,
      newValue: df.correctDisplay,
      priority: 'MEDIUM',
      description: `Display mismatch: "${df.currentDisplay}" → "${df.correctDisplay}"`,
    });
  }

  return patches;
}

function applyPatchToFile(filePath: string, patches: PatchEntry[]): number {
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠️  File not found: ${filePath}`);
    return 0;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let applied = 0;

  for (const patch of patches) {
    // Match patterns like: id: 'entry_id' ... snomedCtCode: 'CODE'
    // This is a simplified regex — adjust to match your exact file format
    const entryRegex = new RegExp(
      `(id:\\s*['"\`]${patch.entryId}['"\`][^}]*?${patch.field}:\\s*['"\`])${escapeRegex(patch.oldValue)}(['"\`])`,
      'g'
    );

    const newContent = content.replace(entryRegex, `$1${patch.newValue}$2`);

    if (newContent !== content) {
      content = newContent;
      applied++;
      if (dryRun) {
        console.log(`  📝 [DRY RUN] ${patch.entryId}.${patch.field}: "${patch.oldValue}" → "${patch.newValue}"`);
      } else {
        console.log(`  ✅ ${patch.entryId}.${patch.field}: "${patch.oldValue}" → "${patch.newValue}"`);
      }
    }
  }

  if (!dryRun && applied > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  return applied;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// ONTOSERVER VERIFICATION
// ============================================================================

async function verifyCodesViaOntoserver() {
  const allCodes = Object.values(codesToVerify).flat();
  console.log(`\n🔍 Verifying ${allCodes.length} codes via Ontoserver...\n`);

  const baseUrl = 'https://r4.ontoserver.csiro.au/fhir/CodeSystem/$lookup';

  for (const code of allCodes) {
    try {
      const url = `${baseUrl}?system=http://snomed.info/sct&code=${code}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/fhir+json' },
      });
      const data = await response.json() as any;

      const displayParam = data.parameter?.find((p: any) => p.name === 'display');
      const display = displayParam?.valueString ?? 'NOT FOUND';

      if (response.ok) {
        console.log(`  ✅ ${code} → ${display}`);
      } else {
        console.log(`  ❌ ${code} → NOT FOUND / INACTIVE`);
      }
    } catch (err) {
      console.log(`  ⚠️  ${code} → Network error (is Ontoserver reachable?)`);
      break;
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   SNOMED CT Code Update — Surgical Logbook App  ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  if (verifyMode) {
    await verifyCodesViaOntoserver();
    return;
  }

  const summary = getUpdateSummary();
  console.log(`📊 Update summary:`);
  console.log(`   Critical fixes: ${summary.byPriority.critical} entries`);
  console.log(`   High fixes:     ${summary.byPriority.high} entries`);
  console.log(`   Medium fixes:   ${summary.byPriority.medium} entries`);
  console.log(`   Diagnosis fixes: ${summary.diagnosisFixCount} entries`);
  console.log(`   Display fixes:  ${summary.displayFixCount} entries`);
  console.log(`   Cross-map fixes: ${summary.crossMapFixCount} entries`);
  console.log(`   Pending verification: ${summary.codesToVerifyCount} codes\n`);

  if (dryRun) {
    console.log('🔄 DRY RUN MODE — no files will be modified\n');
  }

  console.log(`📌 Applying fixes up to priority: ${maxPriority.toUpperCase()}\n`);

  const patches = buildPatchList();
  console.log(`📋 ${patches.length} patches to apply\n`);

  // Apply to each target file
  const targets = [
    { path: PROCEDURE_PICKLIST, label: 'procedurePicklist.ts' },
    { path: DIAGNOSIS_PICKLIST, label: 'diagnosisPicklist.ts' },
    { path: SKIN_CANCER_DX,     label: 'skinCancerDiagnoses.ts' },
    { path: SNOMED_CROSSMAP,     label: 'snomedCt.ts' },
  ];

  let totalApplied = 0;

  for (const target of targets) {
    console.log(`\n📂 Processing ${target.label}...`);
    const applied = applyPatchToFile(target.path, patches);
    totalApplied += applied;
    console.log(`   → ${applied} patches applied`);
  }

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`✅ Total patches applied: ${totalApplied}`);

  if (dryRun) {
    console.log('ℹ️  Run without --dry-run to apply changes.');
  } else {
    console.log('ℹ️  Changes written to disk. Review with git diff.');
  }

  console.log(`\n⏭️  Next steps:`);
  console.log(`   1. Review changes with: git diff`);
  console.log(`   2. Run tests: npm test`);
  console.log(`   3. Verify codes via Ontoserver: npx ts-node applySnomedFixes.ts --verify`);
  console.log(`   4. Check ${summary.codesToVerifyCount} pending // VERIFY codes`);
}

main().catch(console.error);
