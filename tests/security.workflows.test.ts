import path from 'path';
import { spawnSync } from 'child_process';
import { parse as parseYaml } from 'yaml';

const actualFs = jest.requireActual('fs') as typeof import('fs');
const rootDir = path.resolve(__dirname, '..');

interface WorkflowStep {
  id?: string;
  name?: string;
  uses?: string;
  run?: string;
  with?: Record<string, any>;
  env?: Record<string, any>;
  if?: string;
  'continue-on-error'?: boolean;
}

interface WorkflowJob {
  name?: string;
  needs?: string | string[];
  if?: string;
  permissions?: Record<string, string>;
  services?: Record<string, { image?: string; ports?: unknown[]; options?: string }>;
  steps?: WorkflowStep[];
}

interface GitHubWorkflow {
  name?: string;
  on?: {
    pull_request?: { branches?: string[]; types?: string[] };
    push?: { branches?: string[] };
    workflow_dispatch?: unknown;
  };
  permissions?: Record<string, string>;
  jobs?: Record<string, WorkflowJob>;
}

const readText = (relPath: string): string => {
  const fullPath = path.join(rootDir, relPath);
  expect(actualFs.existsSync(fullPath)).toBe(true);
  return actualFs.readFileSync(fullPath, 'utf8');
};

const readYaml = <T = any>(relPath: string): { raw: string; parsed: T } => {
  const raw = readText(relPath);
  const parsed = parseYaml(raw) as T;
  expect(parsed).toBeTruthy();
  return { raw, parsed };
};

const readJson = <T = any>(relPath: string): T => {
  const raw = readText(relPath);
  return JSON.parse(raw) as T;
};

const collectJobScripts = (job?: WorkflowJob): string =>
  (job?.steps ?? [])
    .map((s) => s.run ?? '')
    .filter(Boolean)
    .join('\n');

const findJobByName = (
  workflow: GitHubWorkflow,
  expectedName: string
): [string, WorkflowJob] | undefined =>
  Object.entries(workflow.jobs ?? {}).find(([, job]) => job.name === expectedName);

const normalizeWs = (value: string): string => value.replace(/\s+/g, ' ').trim();

describe('Workflow 1: CI Dev (.github/workflows/ci-dev.yml)', () => {
  const workflowRelPath = '.github/workflows/ci-dev.yml';

  test('Triggers on pull_request targeting dev and enforces minimal permissions', () => {
    const { parsed, raw } = readYaml<GitHubWorkflow>(workflowRelPath);

    expect(parsed.on?.pull_request?.branches).toEqual(expect.arrayContaining(['dev']));
    expect(raw).not.toMatch(/permissions:\s*write-all/i);

    expect(parsed.permissions).toEqual({ contents: 'read' });

    const jobs = parsed.jobs ?? {};
    expect(jobs['validate-and-build']?.permissions).toEqual({
      contents: 'read',
    });
    expect(jobs['secret-scanning']?.permissions).toEqual({
      contents: 'read',
      'pull-requests': 'read',
    });
    expect(jobs['sca-audit']?.permissions).toEqual({
      contents: 'read',
      'pull-requests': 'read',
      'security-events': 'write',
    });

    for (const job of Object.values(jobs)) {
      expect(job.permissions?.['id-token']).toBeUndefined();
    }
  });

  test('Validates source branch is not main, checks recommended branch prefix, and builds TypeScript', () => {
    const { parsed } = readYaml<GitHubWorkflow>(workflowRelPath);
    const entry = findJobByName(parsed, 'Validate Source Branch & TypeScript Build');
    expect(entry).toBeDefined();

    const [, job] = entry!;
    const scripts = collectJobScripts(job);
    const serialized = JSON.stringify(job);

    expect(serialized).toMatch(/head_ref/);
    expect(scripts).toMatch(/\bmain\b/);
    for (const prefix of ['feature/', 'bug/', 'fix/', 'docs/', 'chore/', 'refactor/', 'test/']) {
      expect(scripts).toContain(prefix);
    }
    expect(scripts).toMatch(/npm ci/);
    expect(scripts).toMatch(/npm run build/);
  });

  test('Runs TruffleHog secret scanning with --only-verified and archives results', () => {
    const { parsed } = readYaml<GitHubWorkflow>(workflowRelPath);
    const entry = findJobByName(parsed, 'Secret Scanning (TruffleHog)');
    expect(entry).toBeDefined();

    const [, job] = entry!;
    const steps = job.steps ?? [];
    const truffleStep = steps.find((s) => s.uses?.startsWith('trufflesecurity/trufflehog'));
    expect(truffleStep).toBeDefined();
    expect(String(truffleStep?.with?.extra_args ?? '')).toContain('--only-verified');
  });

  test('Runs SCA with dependency-review-action@v4, npm audit, Snyk SCA, SARIF upload, and 14-day artifact', () => {
    const { parsed } = readYaml<GitHubWorkflow>(workflowRelPath);
    const entry = findJobByName(parsed, 'SCA (npm audit, Dependency Review & Snyk)');
    expect(entry).toBeDefined();

    const [, job] = entry!;
    const steps = job.steps ?? [];
    const scripts = normalizeWs(collectJobScripts(job));
    const serialized = JSON.stringify(job);

    const depReviewStep = steps.find((s) =>
      s.uses?.startsWith('actions/dependency-review-action@')
    );
    expect(depReviewStep).toBeDefined();
    expect(depReviewStep?.with?.['fail-on-severity']).toBe('high');

    expect(scripts).toMatch(/npm audit --omit=dev --audit-level=high/);

    const snykStep = steps.find((s) => s.uses?.startsWith('snyk/actions/node'));
    expect(snykStep).toBeDefined();
    expect(String(snykStep?.with?.args ?? '')).toContain('--severity-threshold=high');
    expect(String(snykStep?.with?.args ?? '')).toContain('.sarif');
    expect(serialized).toContain('SNYK_TOKEN');

    const sarifStep = steps.find((s) =>
      s.uses?.startsWith('github/codeql-action/upload-sarif')
    );
    expect(sarifStep).toBeDefined();

    const allSteps = Object.values(parsed.jobs ?? {}).flatMap((j) => j.steps ?? []);
    const uploadStep = allSteps.find(
      (s) =>
        s.uses?.startsWith('actions/upload-artifact@') &&
        s.with?.name === 'dev-sca-secrets-reports'
    );
    expect(uploadStep).toBeDefined();
    expect(uploadStep?.with?.['retention-days']).toBe(14);
  });

  test('Does NOT contain legacy RetireJS or npm@6 tooling', () => {
    const { raw } = readYaml<GitHubWorkflow>(workflowRelPath);

    expect(raw).not.toMatch(/retire/i);
    expect(raw).not.toMatch(/RetireJS/i);
    expect(raw).not.toMatch(/npm@6/i);
  });

  test('TruffleHog extra_args uses --only-verified without conflicting --results=verified,unknown flag', () => {
    const { parsed } = readYaml<GitHubWorkflow>(workflowRelPath);
    const entry = findJobByName(parsed, 'Secret Scanning (TruffleHog)');
    expect(entry).toBeDefined();

    const [, job] = entry!;
    const truffleStep = (job.steps ?? []).find((s) =>
      s.uses?.startsWith('trufflesecurity/trufflehog')
    );
    expect(truffleStep).toBeDefined();

    const extraArgs = String(truffleStep?.with?.extra_args ?? '');
    expect(extraArgs).toContain('--only-verified');
    expect(extraArgs).not.toContain('--results=verified,unknown');
    expect(extraArgs).not.toMatch(/--results=/);
    expect(collectJobScripts(job)).not.toContain('--results=verified,unknown');
  });

  test('SCA job gates Snyk on dependabot[bot] without SNYK_TOKEN while keeping Dependency Review and npm audit active and README documents Dependabot SNYK_TOKEN', () => {
    const { parsed } = readYaml<GitHubWorkflow>(workflowRelPath);
    const entry = findJobByName(parsed, 'SCA (npm audit, Dependency Review & Snyk)');
    expect(entry).toBeDefined();

    const [, job] = entry!;
    const steps = job.steps ?? [];
    const serialized = JSON.stringify(job);

    const depReviewStep = steps.find((s) =>
      s.uses?.startsWith('actions/dependency-review-action@')
    );
    expect(depReviewStep).toBeDefined();
    expect(depReviewStep?.if).toBeUndefined();

    const npmAuditStep = steps.find((s) => (s.run ?? '').includes('npm audit'));
    expect(npmAuditStep).toBeDefined();
    expect(npmAuditStep?.if).toBeUndefined();

    const snykStep = steps.find((s) => s.uses?.startsWith('snyk/actions/node'));
    expect(snykStep).toBeDefined();
    expect(snykStep?.['continue-on-error']).not.toBe(true);
    expect(snykStep?.if).toBeTruthy();
    expect(serialized).toContain('dependabot[bot]');
    expect(serialized).toContain('SNYK_TOKEN');

    const readme = readText('README.md');
    expect(readme).toMatch(
      /dependabot\[bot\]|Dependabot\s+Secrets|Secrets\s+and\s+variables\s*(?:→|->)\s*Dependabot/i
    );
    expect(readme).toMatch(
      /(?:dependabot\[bot\]|Dependabot\s+Secrets|Secrets\s+and\s+variables\s*(?:→|->)\s*Dependabot)[\s\S]{0,300}SNYK_TOKEN|SNYK_TOKEN[\s\S]{0,300}(?:dependabot\[bot\]|Dependabot\s+Secrets|Secrets\s+and\s+variables\s*(?:→|->)\s*Dependabot)/i
    );
  });
});

describe('Workflow 2: Security Main (.github/workflows/security-main.yml)', () => {
  const workflowRelPath = '.github/workflows/security-main.yml';

  test('Triggers on PR to main, push to main, and workflow_dispatch without ECR push or EC2 SSM deploy', () => {
    const { raw, parsed } = readYaml<GitHubWorkflow>(workflowRelPath);

    expect(parsed.on?.pull_request?.branches).toEqual(expect.arrayContaining(['main']));
    expect(parsed.on?.push?.branches).toEqual(expect.arrayContaining(['main']));
    expect(parsed.on?.workflow_dispatch).toBeDefined();

    expect(raw).not.toMatch(/aws ssm send-command/i);
    expect(raw).not.toMatch(/deploy-production/);
    expect(raw).not.toMatch(/amazon-ecr-login/);
    expect(raw).not.toMatch(/docker push/);
  });

  test('Job "Verify PR originates from dev" runs on PRs and rejects non-dev head_ref', () => {
    const { parsed } = readYaml<GitHubWorkflow>(workflowRelPath);
    const entry = findJobByName(parsed, 'Verify PR originates from dev');
    expect(entry).toBeDefined();

    const [, job] = entry!;
    expect(job.if ?? '').toContain('pull_request');
    const serialized = JSON.stringify(job);
    expect(serialized).toMatch(/github\.head_ref\s*!=\s*['"]?dev/);
  });

  test('Job "Unit Tests & Coverage" executes npm run test:ci and uploads test-coverage-lcov (14 days)', () => {
    const { parsed } = readYaml<GitHubWorkflow>(workflowRelPath);
    const entry = findJobByName(parsed, 'Unit Tests & Coverage');
    expect(entry).toBeDefined();

    const [, job] = entry!;
    const scripts = collectJobScripts(job);
    expect(scripts).toMatch(/npm run test:ci/);

    const uploadStep = (job.steps ?? []).find(
      (s) =>
        s.uses?.startsWith('actions/upload-artifact@') &&
        s.with?.name === 'test-coverage-lcov'
    );
    expect(uploadStep).toBeDefined();
    expect(uploadStep?.with?.['retention-days']).toBe(14);
  });

  test('Job "SAST - SonarCloud Quality Gate" depends on unit tests, downloads coverage, and enforces qualitygate.wait=true', () => {
    const { parsed } = readYaml<GitHubWorkflow>(workflowRelPath);
    const unitEntry = findJobByName(parsed, 'Unit Tests & Coverage');
    const sonarEntry = findJobByName(parsed, 'SAST - SonarCloud Quality Gate');
    expect(unitEntry).toBeDefined();
    expect(sonarEntry).toBeDefined();

    const [unitJobId] = unitEntry!;
    const [, sonarJob] = sonarEntry!;

    const needs = Array.isArray(sonarJob.needs) ? sonarJob.needs : [sonarJob.needs];
    expect(needs).toContain(unitJobId);

    const downloadStep = (sonarJob.steps ?? []).find(
      (s) =>
        s.uses?.startsWith('actions/download-artifact') &&
        s.with?.name === 'test-coverage-lcov'
    );
    expect(downloadStep).toBeDefined();

    const sonarStep = (sonarJob.steps ?? []).find((s) =>
      s.uses?.startsWith('SonarSource/sonarqube-scan-action')
    );
    expect(sonarStep).toBeDefined();

    const serialized = JSON.stringify(sonarJob);
    expect(serialized).toContain('sonar.qualitygate.wait=true');
    expect(serialized).toContain('SONAR_TOKEN');
  });

  test('Job "SAST - CodeQL (javascript-typescript)" initializes v3 with security-extended and analyzes', () => {
    const { parsed } = readYaml<GitHubWorkflow>(workflowRelPath);
    const entry = findJobByName(parsed, 'SAST - CodeQL (javascript-typescript)');
    expect(entry).toBeDefined();

    const [, job] = entry!;
    const steps = job.steps ?? [];

    const initStep = steps.find((s) => s.uses?.startsWith('github/codeql-action/init@'));
    expect(initStep).toBeDefined();
    expect(initStep?.with?.languages).toContain('javascript-typescript');
    expect(initStep?.with?.queries).toContain('security-extended');

    const analyzeStep = steps.find((s) =>
      s.uses?.startsWith('github/codeql-action/analyze@')
    );
    expect(analyzeStep).toBeDefined();
  });

  test('Job "SAST & Container - Snyk Security" runs snyk code & container tests with high threshold, SARIF upload, and 30-day artifact', () => {
    const { parsed } = readYaml<GitHubWorkflow>(workflowRelPath);
    const entry = findJobByName(parsed, 'SAST & Container - Snyk Security');
    expect(entry).toBeDefined();

    const [, job] = entry!;
    const steps = job.steps ?? [];
    const serialized = JSON.stringify(job);

    expect(serialized).toContain('snyk code test');
    expect(serialized).toContain('snyk container test');
    expect(serialized).toContain('--severity-threshold=high');

    const sarifSteps = steps.filter((s) =>
      s.uses?.startsWith('github/codeql-action/upload-sarif')
    );
    expect(sarifSteps.length).toBeGreaterThanOrEqual(1);

    const uploadStep = steps.find(
      (s) =>
        s.uses?.startsWith('actions/upload-artifact@') &&
        s.with?.name === 'sast-snyk-reports'
    );
    expect(uploadStep).toBeDefined();
    expect(uploadStep?.with?.['retention-days']).toBe(30);
  });

  test('Job "Container - Hadolint, Syft SBOM & Grype" runs Hadolint, Syft (CycloneDX/SPDX), Grype high fail-build, SARIF, and 30-day artifact', () => {
    const { parsed } = readYaml<GitHubWorkflow>(workflowRelPath);
    const entry = findJobByName(parsed, 'Container - Hadolint, Syft SBOM & Grype');
    expect(entry).toBeDefined();

    const [, job] = entry!;
    const steps = job.steps ?? [];

    expect(steps.some((s) => s.uses?.startsWith('hadolint/hadolint-action'))).toBe(true);

    const syftSteps = steps.filter((s) => s.uses?.startsWith('anchore/sbom-action'));
    const formats = syftSteps.map((s) => s.with?.format);
    expect(formats).toEqual(expect.arrayContaining(['cyclonedx-json', 'spdx-json']));

    const grypeStep = steps.find((s) => s.uses?.startsWith('anchore/scan-action'));
    expect(grypeStep).toBeDefined();
    expect(grypeStep?.with?.['fail-build']).toBe(true);
    expect(grypeStep?.with?.['severity-cutoff']).toBe('high');

    expect(
      steps.some((s) => s.uses?.startsWith('github/codeql-action/upload-sarif'))
    ).toBe(true);

    const uploadStep = steps.find(
      (s) =>
        s.uses?.startsWith('actions/upload-artifact@') &&
        s.with?.name === 'sbom-and-grype-reports'
    );
    expect(uploadStep).toBeDefined();
    expect(uploadStep?.with?.['retention-days']).toBe(30);
  });

  test('Job "DAST - OWASP ZAP API Scan" uses mongo:7 service, checks /health and /swagger.json, runs zaproxy with .zap/rules.tsv, and always uploads zap-report.xml (30 days)', () => {
    const { parsed } = readYaml<GitHubWorkflow>(workflowRelPath);
    const entry = findJobByName(parsed, 'DAST - OWASP ZAP API Scan');
    expect(entry).toBeDefined();

    const [, job] = entry!;
    const services = Object.values(job.services ?? {});
    expect(services.some((svc) => String(svc.image ?? '').startsWith('mongo:7'))).toBe(true);

    const scripts = normalizeWs(collectJobScripts(job));
    const serialized = JSON.stringify(job);

    expect(scripts).toContain('/health');
    expect(scripts).toContain('/swagger.json');
    expect(serialized).toContain('zaproxy');
    expect(serialized).toContain('.zap/rules.tsv');
    expect(serialized).toContain('zap-report.xml');
    expect(serialized).toContain('zap-report.html');
    expect(serialized).toContain('zap-report.md');

    const uploadStep = (job.steps ?? []).find(
      (s) =>
        s.uses?.startsWith('actions/upload-artifact@') &&
        s.with?.name === 'dast-owasp-zap-xml'
    );
    expect(uploadStep).toBeDefined();
    expect(uploadStep?.if).toMatch(/always\(\)/);
    expect(uploadStep?.with?.['retention-days']).toBe(30);
  });

  test('Job "DAST - OWASP ZAP API Scan" fails closed on any unexpected non-zero ZAP/Docker exit code and treats only 0 and 2 (WARN) as non-failing', () => {
    const { parsed } = readYaml<GitHubWorkflow>(workflowRelPath);
    const entry = findJobByName(parsed, 'DAST - OWASP ZAP API Scan');
    expect(entry).toBeDefined();

    const [, job] = entry!;
    const zapStep = (job.steps ?? []).find((s) => (s.run ?? '').includes('zap-api-scan.py'));
    expect(zapStep).toBeDefined();

    // Neutralize any GHA expressions so the bash probe isolates the ZAP_EXIT gate logic.
    const sanitizedRun = (zapStep?.run ?? '').replace(/\$\{\{[^}]+\}\}/g, '/tmp/mock-workspace');

    const runWithMockExit = (mockExit: number) => {
      const envVars: NodeJS.ProcessEnv = {
        PATH: process.env.PATH,
        MOCK_ZAP_EXIT: String(mockExit),
      };
      for (const [key, val] of Object.entries(zapStep?.env ?? {})) {
        envVars[key] = String(val).includes('github.workspace') ? '/tmp/mock-workspace' : 'stub';
      }

      const harness = [
        'set -e',
        'docker() { return "$MOCK_ZAP_EXIT"; }',
        sanitizedRun,
      ].join('\n');

      return spawnSync('bash', ['-c', harness], {
        env: envVars,
        encoding: 'utf8',
      });
    };

    const passRes = runWithMockExit(0);
    expect(passRes.status).toBe(0);

    const warnRes = runWithMockExit(2);
    expect(warnRes.status).toBe(0);
    expect(warnRes.stdout + warnRes.stderr).toContain('::warning::');

    for (const failCode of [1, 3, 4, 125, 126, 127, 137]) {
      const failRes = runWithMockExit(failCode);
      expect(failRes.status).toBe(failCode);
      expect(failRes.stdout + failRes.stderr).toContain('::error::');
    }
  });

  test('Job "DAST - OWASP ZAP API Scan" binds github.workspace via env instead of interpolating raw ${{ github.workspace }} in run blocks', () => {
    const { parsed } = readYaml<GitHubWorkflow>(workflowRelPath);
    const entry = findJobByName(parsed, 'DAST - OWASP ZAP API Scan');
    expect(entry).toBeDefined();

    const [, job] = entry!;
    for (const step of job.steps ?? []) {
      expect(step.run ?? '').not.toMatch(/\$\{\{\s*github\.workspace\s*\}\}/);
    }

    const zapStep = (job.steps ?? []).find((s) => (s.run ?? '').includes('zap-api-scan.py'));
    expect(zapStep).toBeDefined();
    const envValues = Object.values(zapStep?.env ?? {}).map((v) => String(v));
    expect(envValues.some((v) => /\$\{\{\s*github\.workspace\s*\}\}/.test(v))).toBe(true);
  });

  test('Job "Container - Hadolint, Syft SBOM & Grype" gates "Export Grype JSON report" on Docker image build success instead of bare always()', () => {
    const { parsed } = readYaml<GitHubWorkflow>(workflowRelPath);
    const entry = findJobByName(parsed, 'Container - Hadolint, Syft SBOM & Grype');
    expect(entry).toBeDefined();

    const [, job] = entry!;
    const steps = job.steps ?? [];
    const buildStep = steps.find((s) => (s.run ?? '').includes('docker build'));
    expect(buildStep).toBeDefined();
    expect(buildStep?.id).toBeTruthy();

    const grypeJsonStep = steps.find((s) => s.name === 'Export Grype JSON report');
    expect(grypeJsonStep).toBeDefined();

    const grypeJsonIf = normalizeWs(String(grypeJsonStep?.if ?? ''));
    expect(grypeJsonIf).not.toBe('always()');
    expect(grypeJsonIf).toMatch(
      new RegExp(`steps\\.${buildStep!.id}\\.outcome\\s*==\\s*['"]success['"]`)
    );
  });

  test('Job "DAST - OWASP ZAP API Scan" passes writable HOME (-e HOME=/tmp or -e HOME=/zap/wrk) alongside -u "$(id -u):$(id -g)"', () => {
    const { parsed } = readYaml<GitHubWorkflow>(workflowRelPath);
    const entry = findJobByName(parsed, 'DAST - OWASP ZAP API Scan');
    expect(entry).toBeDefined();

    const [, job] = entry!;
    const zapStep = (job.steps ?? []).find((s) => (s.run ?? '').includes('zap-api-scan.py'));
    expect(zapStep).toBeDefined();

    const runScript = normalizeWs(zapStep?.run ?? '');
    expect(runScript).toMatch(/-u\s+["']?\$\(id -u\):\$\(id -g\)["']?/);
    expect(runScript).toMatch(/(?:-e|--env)\s+["']?HOME=(\/tmp|\/zap\/wrk)["']?(?:\s|\\|$)/);
    expect(runScript).toMatch(/JAVA_TOOL_OPTIONS=["']?-Duser\.home=\/tmp["']?/);
    expect(runScript).toMatch(/-z\s+["']-dir \/tmp\/\.ZAP["']/);
    expect(runScript).toMatch(/(?:-w|--workdir)\s+\/tmp\b/);
  });

  test('Job "DAST - OWASP ZAP API Scan" validates /swagger.json via temp file without piping curl into node', () => {
    const { parsed } = readYaml<GitHubWorkflow>(workflowRelPath);
    const entry = findJobByName(parsed, 'DAST - OWASP ZAP API Scan');
    expect(entry).toBeDefined();

    const [, job] = entry!;
    const scripts = collectJobScripts(job);
    expect(scripts).not.toMatch(/curl[^|\n]*\|\s*node/);
    expect(scripts).toContain('/tmp/swagger.json');
  });

  test('All GitHub Actions in ci-dev.yml, security-main.yml, and release.yml are pinned to full 40-char commit SHAs', () => {
    for (const file of [
      '.github/workflows/ci-dev.yml',
      '.github/workflows/security-main.yml',
      '.github/workflows/release.yml',
    ]) {
      const { parsed } = readYaml<GitHubWorkflow>(file);
      const steps = Object.values(parsed.jobs ?? {}).flatMap((j) => j.steps ?? []);
      const usesSteps = steps.filter((s) => Boolean(s.uses));
      expect(usesSteps.length).toBeGreaterThan(0);
      for (const step of usesSteps) {
        expect(step.uses).toMatch(/@[0-9a-f]{40}$/);
      }
    }
  });
});

describe('R3/R4 Security Configs, GitHub Policy Enforcement & Container Hardening', () => {
  test('.coderabbit.yaml is valid YAML configured for es-ES and auto-reviews dev and main', () => {
    const { parsed } = readYaml<any>('.coderabbit.yaml');

    expect(parsed.language).toBe('es-ES');
    expect(parsed.reviews?.auto_review?.base_branches).toEqual(
      expect.arrayContaining(['dev', 'main'])
    );
  });

  test('sonar-project.properties configures sources, tests, and lcov report path', () => {
    const content = readText('sonar-project.properties');

    expect(content).toMatch(/^sonar\.sources=src$/m);
    expect(content).toMatch(/^sonar\.tests=tests$/m);
    expect(content).toMatch(/^sonar\.typescript\.lcov\.reportPaths=coverage\/lcov\.info$/m);
  });

  test('.zap/rules.tsv exists, is non-empty, and defines tab-separated FAIL and WARN rules', () => {
    const content = readText('.zap/rules.tsv');
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    expect(lines.length).toBeGreaterThan(0);
    expect(lines.every((l) => l.includes('\t'))).toBe(true);

    const levels = lines.map((l) => l.split('\t')[1]?.trim());
    expect(levels).toContain('FAIL');
    expect(levels).toContain('WARN');
  });

  test('.github/CODEOWNERS protects critical security, workflow, and build files', () => {
    const content = readText('.github/CODEOWNERS');
    const expectedPatterns = [
      '.github/',
      'Dockerfile',
      'package*.json',
      '.zap/',
      '.coderabbit.yaml',
      'sonar-project.properties',
    ];

    for (const pattern of expectedPatterns) {
      expect(content).toContain(pattern);
    }
    expect(content).toMatch(/@[A-Za-z0-9_-]+/);

    const ruleLines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));
    expect(ruleLines.length).toBeGreaterThan(0);
    for (const line of ruleLines) {
      const owners = line.match(/@[A-Za-z0-9_-]+/g) ?? [];
      expect(new Set(owners).size).toBeGreaterThanOrEqual(2);
    }
  });

  test('.github/dependabot.yml configures version 2 updates for npm, docker, and github-actions targeting dev', () => {
    const { parsed } = readYaml<any>('.github/dependabot.yml');

    expect(parsed.version).toBe(2);
    expect(Array.isArray(parsed.updates)).toBe(true);

    const ecosystems = parsed.updates.map((u: any) => u['package-ecosystem']);
    expect(ecosystems).toEqual(
      expect.arrayContaining(['npm', 'docker', 'github-actions'])
    );

    for (const ecosystem of ['npm', 'docker', 'github-actions']) {
      const entry = parsed.updates.find((u: any) => u['package-ecosystem'] === ecosystem);
      expect(entry).toBeDefined();
      expect(entry['target-branch']).toBe('dev');
    }
  });

  test('.github/rulesets/*.json define valid active rulesets matching workflow check names', () => {
    const mainRuleset = readJson<any>('.github/rulesets/main-ruleset.json');
    const devRuleset = readJson<any>('.github/rulesets/dev-ruleset.json');
    const tagsRuleset = readJson<any>('.github/rulesets/tags-ruleset.json');

    const { parsed: securityMain } = readYaml<GitHubWorkflow>('.github/workflows/security-main.yml');
    const { parsed: ciDev } = readYaml<GitHubWorkflow>('.github/workflows/ci-dev.yml');

    // main-ruleset.json
    expect(mainRuleset.target).toBe('branch');
    expect(mainRuleset.enforcement).toBe('active');
    expect(mainRuleset.conditions?.ref_name?.include).toContain('refs/heads/main');

    const mainRules: any[] = mainRuleset.rules ?? [];
    expect(mainRules.some((r) => r.type === 'deletion')).toBe(true);
    expect(mainRules.some((r) => r.type === 'non_fast_forward')).toBe(true);

    const mainPrRule = mainRules.find((r) => r.type === 'pull_request');
    expect(mainPrRule).toBeDefined();
    expect(mainPrRule.parameters?.required_approving_review_count).toBeGreaterThanOrEqual(1);
    expect(mainPrRule.parameters?.require_code_owner_review).toBe(true);
    expect(mainPrRule.parameters?.dismiss_stale_reviews_on_push).toBe(true);
    expect(mainPrRule.parameters?.required_review_thread_resolution).toBe(true);

    const mainChecksRule = mainRules.find((r) => r.type === 'required_status_checks');
    expect(mainChecksRule).toBeDefined();
    const mainCheckContexts: string[] = (
      mainChecksRule.parameters?.required_status_checks ?? []
    ).map((c: any) => (typeof c === 'string' ? c : c.context));
    const securityMainJobNames = Object.values(securityMain.jobs ?? {}).map((j) => j.name);
    expect(mainCheckContexts).toEqual(
      expect.arrayContaining([
        'Verify PR originates from dev',
        'Unit Tests & Coverage',
        'SAST - SonarCloud Quality Gate',
        'SAST - CodeQL (javascript-typescript)',
        'SAST & Container - Snyk Security',
        'Container - Hadolint, Syft SBOM & Grype',
        'DAST - OWASP ZAP API Scan',
      ])
    );
    for (const ctx of mainCheckContexts) {
      expect(securityMainJobNames).toContain(ctx);
    }

    const codeScanningRule = mainRules.find((r) => r.type === 'code_scanning');
    expect(codeScanningRule).toBeDefined();
    expect(codeScanningRule.parameters?.code_scanning_tools).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          tool: 'CodeQL',
          alerts_threshold: 'errors',
          security_alerts_threshold: 'high_or_higher',
        }),
      ])
    );

    // dev-ruleset.json
    expect(devRuleset.target).toBe('branch');
    expect(devRuleset.enforcement).toBe('active');
    expect(devRuleset.conditions?.ref_name?.include).toContain('refs/heads/dev');

    const devRules: any[] = devRuleset.rules ?? [];
    expect(devRules.some((r) => r.type === 'deletion')).toBe(true);
    expect(devRules.some((r) => r.type === 'non_fast_forward')).toBe(true);

    const devChecksRule = devRules.find((r) => r.type === 'required_status_checks');
    expect(devChecksRule).toBeDefined();
    const devCheckContexts: string[] = (
      devChecksRule.parameters?.required_status_checks ?? []
    ).map((c: any) => (typeof c === 'string' ? c : c.context));
    const ciDevJobNames = Object.values(ciDev.jobs ?? {}).map((j) => j.name);
    expect(devCheckContexts).toEqual(
      expect.arrayContaining([
        'Validate Source Branch & TypeScript Build',
        'Secret Scanning (TruffleHog)',
        'SCA (npm audit, Dependency Review & Snyk)',
      ])
    );
    for (const ctx of devCheckContexts) {
      expect(ciDevJobNames).toContain(ctx);
    }

    // tags-ruleset.json
    expect(tagsRuleset.target).toBe('tag');
    expect(tagsRuleset.enforcement).toBe('active');
    expect(tagsRuleset.conditions?.ref_name?.include).toContain('refs/tags/v*');
    const tagRules: any[] = tagsRuleset.rules ?? [];
    expect(tagRules.some((r) => r.type === 'deletion')).toBe(true);
    expect(tagRules.some((r) => r.type === 'non_fast_forward')).toBe(true);
  });

  test('scripts/apply-github-policies.sh exists, is executable, and invokes gh api for rulesets and production environment', () => {
    const scriptPath = path.join(rootDir, 'scripts/apply-github-policies.sh');
    expect(actualFs.existsSync(scriptPath)).toBe(true);

    const stat = actualFs.statSync(scriptPath);
    expect(stat.mode & 0o111).not.toBe(0);

    const content = actualFs.readFileSync(scriptPath, 'utf8');
    expect(content).toMatch(/^#!\/(usr\/bin\/env bash|bin\/bash)/);
    expect(content).toContain('gh api');
    expect(content).toContain('rulesets');
    expect(content).toContain('environments/production');
    expect(content).toContain('deployment-branch-policies');
    expect(content).toMatch(/--method\s+DELETE/);
  });

  test('Dockerfile uses multi-stage node:22.23.5-alpine3.24 build, strips global npm/yarn in runtime, prunes devDependencies, runs as USER node, and defines dynamic-port HEALTHCHECK', () => {
    const dockerfile = readText('Dockerfile');

    expect(dockerfile).toMatch(/FROM\s+node:22\.23\.5-alpine3\.24\s+AS\s+builder/i);
    expect(dockerfile).toMatch(/FROM\s+node:22\.23\.5-alpine3\.24\s+AS\s+runtime/i);
    expect(dockerfile).toContain('CXXFLAGS="-include cstdint"');
    expect(dockerfile).toContain('npm ci --ignore-scripts');
    expect(dockerfile).toContain('cd node_modules/mediasoup && node npm-scripts.mjs postinstall');
    expect(dockerfile).toContain('apk upgrade --no-cache');
    expect(dockerfile).toContain('npm prune --omit=dev');
    expect(dockerfile).toContain('/usr/local/lib/node_modules/npm');
    expect(dockerfile).toMatch(/^\s*USER\s+node\s*$/m);
    expect(dockerfile).toMatch(/HEALTHCHECK\b[\s\S]*process\.env\.PORT\s*\|\|\s*3000[\s\S]*\/health/);
    expect(dockerfile).toContain('CMD ["node", "dist/src/index.js"]');
  });

  test('.dockerignore excludes CI, security configs, tests, scripts, and markdown docs from build context', () => {
    const dockerignore = readText('.dockerignore');
    const lines = dockerignore
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    const expectedExclusions = [
      '.github',
      '.zap',
      'tests',
      'scripts',
      '*.md',
      'jest.config.js',
      '.coderabbit.yaml',
      'sonar-project.properties',
    ];

    for (const item of expectedExclusions) {
      expect(lines).toContain(item);
    }
  });

  test('release.yml checks out exact tag commit on workflow_dispatch and uploads Grype report on gate failure', () => {
    const { parsed } = readYaml<GitHubWorkflow>('.github/workflows/release.yml');
    const buildJob = parsed.jobs?.['build-sign-attest'];
    expect(buildJob).toBeDefined();

    const scripts = collectJobScripts(buildJob);
    expect(scripts).toContain('git rev-list -n 1');
    expect(scripts).toContain('git checkout --detach');
    expect(scripts).toContain('target_sha=');

    const failureUploadStep = (buildJob?.steps ?? []).find(
      (s) =>
        s.uses?.startsWith('actions/upload-artifact@') &&
        String(s.if ?? '').includes('grype-release.outcome')
    );
    expect(failureUploadStep).toBeDefined();
    expect(String(failureUploadStep?.with?.path ?? '')).toContain('grype-release-');
  });

  test('README.md documents post-release main-to-dev synchronization via prefixed branch', () => {
    const readme = readText('README.md');
    expect(readme).toMatch(/feature\/sync-main/);
    expect(readme).toMatch(/strict_required_status_checks_policy|sincroniz/i);
  });
});
