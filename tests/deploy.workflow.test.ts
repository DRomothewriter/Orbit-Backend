import os from 'os';
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
}

interface WorkflowJob {
  name?: string;
  needs?: string | string[];
  if?: string;
  environment?: string | { name?: string };
  permissions?: Record<string, string>;
  outputs?: Record<string, string>;
  steps?: WorkflowStep[];
}

interface ReleaseWorkflow {
  name?: string;
  on?: {
    push?: unknown;
    release?: { types?: string[] };
    workflow_dispatch?: {
      inputs?: Record<string, { required?: boolean; type?: string; default?: unknown }>;
    };
  };
  concurrency?: {
    group?: string;
    'cancel-in-progress'?: boolean;
  };
  permissions?: Record<string, string>;
  jobs?: Record<string, WorkflowJob>;
}

const getReleaseRaw = (): string => {
  const workflowPath = path.join(rootDir, '.github/workflows/release.yml');
  expect(actualFs.existsSync(workflowPath)).toBe(true);
  return actualFs.readFileSync(workflowPath, 'utf8');
};

const loadReleaseWorkflow = (): { raw: string; parsed: ReleaseWorkflow } => {
  const raw = getReleaseRaw();
  const parsed = parseYaml(raw) as ReleaseWorkflow;
  expect(parsed).toBeTruthy();
  return { raw, parsed };
};

const collectJobScripts = (job?: WorkflowJob): string =>
  (job?.steps ?? [])
    .map((step) => step.run ?? '')
    .filter(Boolean)
    .join('\n');

const normalizeWs = (value: string): string => value.replace(/\s+/g, ' ').trim();

describe('DevSecOps Release & Deployment Workflow (.github/workflows/release.yml)', () => {
  test('Legacy workflows deploy.yml, validate-pr-source.yml, and security.yaml are removed', () => {
    const legacyPaths = [
      '.github/workflows/deploy.yml',
      '.github/workflows/validate-pr-source.yml',
      '.github/workflows/security.yaml',
    ];

    for (const relPath of legacyPaths) {
      const fullPath = path.join(rootDir, relPath);
      expect(actualFs.existsSync(fullPath)).toBe(false);
    }
  });

  test('Workflow file .github/workflows/release.yml exists and is valid YAML', () => {
    const { parsed } = loadReleaseWorkflow();
    expect(parsed.jobs).toBeDefined();
  });

  test('Triggers on release published and workflow_dispatch with release_tag & deploy_to_production, and does NOT auto-deploy on push to main', () => {
    const { parsed } = loadReleaseWorkflow();

    expect(parsed.on?.push).toBeUndefined();
    expect(parsed.on?.release?.types).toEqual(expect.arrayContaining(['published']));

    const dispatchInputs = parsed.on?.workflow_dispatch?.inputs;
    expect(dispatchInputs).toBeDefined();
    expect(dispatchInputs?.release_tag?.required).toBe(true);
    expect(dispatchInputs?.deploy_to_production?.type).toBe('boolean');
  });

  test('Configures production concurrency guard without canceling in-progress deployments', () => {
    const { parsed } = loadReleaseWorkflow();

    expect(parsed.concurrency?.group).toBe('orbit-backend-production');
    expect(parsed.concurrency?.['cancel-in-progress']).toBe(false);
  });

  test('Enforces least-privilege permissions at workflow and job levels', () => {
    const { parsed } = loadReleaseWorkflow();

    expect(parsed.permissions?.contents).toBe('read');

    const buildJob = parsed.jobs?.['build-sign-attest'];
    expect(buildJob).toBeDefined();
    expect(buildJob?.permissions).toEqual(
      expect.objectContaining({
        'id-token': 'write',
        contents: 'write',
        attestations: 'write',
        packages: 'read',
      })
    );

    const deployJob = parsed.jobs?.['deploy-production'];
    expect(deployJob).toBeDefined();
    expect(deployJob?.permissions).toEqual(
      expect.objectContaining({
        'id-token': 'write',
        contents: 'read',
      })
    );
  });

  test('Does NOT contain static AWS keys, legacy SSH secrets, or PM2 commands', () => {
    const raw = getReleaseRaw();

    expect(raw).not.toMatch(/AWS_ACCESS_KEY_ID/i);
    expect(raw).not.toMatch(/AWS_SECRET_ACCESS_KEY/i);
    expect(raw).not.toMatch(/EC2_SSH_KEY/i);
    expect(raw).not.toMatch(/ssh-agent/i);
    expect(raw).not.toMatch(/StrictHostKeyChecking/i);
    expect(raw).not.toMatch(/\bpm2\b/i);
  });

  test('build-sign-attest verifies origin/main ancestor, SemVer tag, OIDC ECR push by @sha256 digest, Syft SBOM, and Grype gate', () => {
    const { parsed } = loadReleaseWorkflow();
    const buildJob = parsed.jobs?.['build-sign-attest'];
    expect(buildJob).toBeDefined();

    const steps = buildJob?.steps ?? [];
    const scripts = collectJobScripts(buildJob);
    const serializedJob = JSON.stringify(buildJob);

    expect(scripts).toMatch(/git\s+merge-base\s+--is-ancestor/);
    expect(scripts).toMatch(/origin\/main/);
    expect(scripts).toMatch(/\^v\[0-9\]\+/);

    const awsCredsStep = steps.find((s) =>
      s.uses?.startsWith('aws-actions/configure-aws-credentials@')
    );
    expect(awsCredsStep).toBeDefined();
    expect(String(awsCredsStep?.with?.['role-to-assume'] ?? '')).toContain('secrets.AWS_ROLE_ARN');

    const ecrLoginStep = steps.find((s) =>
      s.uses?.startsWith('aws-actions/amazon-ecr-login@')
    );
    expect(ecrLoginStep).toBeDefined();

    const buildPushStep = steps.find((s) =>
      s.uses?.startsWith('docker/build-push-action@')
    );
    expect(buildPushStep).toBeDefined();
    expect(buildPushStep?.with?.push).toBe(true);
    expect(serializedJob).toMatch(/outputs\.digest|@sha256/);

    const syftSteps = steps.filter((s) => s.uses?.startsWith('anchore/sbom-action'));
    const syftFormats = syftSteps.map((s) => s.with?.format);
    expect(syftFormats).toEqual(expect.arrayContaining(['cyclonedx-json', 'spdx-json']));

    const grypeStep = steps.find((s) => s.uses?.startsWith('anchore/scan-action'));
    expect(grypeStep).toBeDefined();
    expect(grypeStep?.with?.['severity-cutoff']).toBe('high');
    expect(grypeStep?.with?.['fail-build']).toBe(true);
  });

  test('build-sign-attest signs & verifies with Cosign Keyless OIDC, generates GitHub Attestations, SHA256SUMS.txt, 90-day artifact, and uploads to GitHub Release', () => {
    const { parsed } = loadReleaseWorkflow();
    const buildJob = parsed.jobs?.['build-sign-attest'];
    expect(buildJob).toBeDefined();

    const steps = buildJob?.steps ?? [];
    const scripts = normalizeWs(collectJobScripts(buildJob));

    expect(steps.some((s) => s.uses?.startsWith('sigstore/cosign-installer'))).toBe(true);
    expect(scripts).toMatch(/cosign\s+sign\b/);
    expect(scripts).toMatch(/cosign\s+attest\b/);
    expect(scripts).toMatch(/cosign\s+verify\b/);
    expect(scripts).toMatch(
      /--certificate-oidc-issuer[=\s]+["']?https:\/\/token\.actions\.githubusercontent\.com/
    );

    expect(steps.some((s) => s.uses?.startsWith('actions/attest-build-provenance@'))).toBe(true);
    expect(steps.some((s) => s.uses?.startsWith('actions/attest-sbom@'))).toBe(true);

    expect(scripts).toContain('SHA256SUMS.txt');
    expect(scripts).toMatch(/gh\s+release\s+upload/);

    const uploadBundleStep = steps.find(
      (s) =>
        s.uses?.startsWith('actions/upload-artifact@') &&
        /^release-supply-chain-bundle-/.test(String(s.with?.name ?? ''))
    );
    expect(uploadBundleStep).toBeDefined();
    expect(uploadBundleStep?.with?.['retention-days']).toBe(90);
  });

  test('deploy-production requires build-sign-attest, production environment approval, pre-deploy cosign verify, and AWS SSM deploy', () => {
    const { parsed } = loadReleaseWorkflow();
    const deployJob = parsed.jobs?.['deploy-production'];
    expect(deployJob).toBeDefined();

    const needs = deployJob?.needs;
    const dependsOnBuild = Array.isArray(needs)
      ? needs.includes('build-sign-attest')
      : needs === 'build-sign-attest';
    expect(dependsOnBuild).toBe(true);

    const envName =
      typeof deployJob?.environment === 'string'
        ? deployJob.environment
        : deployJob?.environment?.name;
    expect(envName).toBe('production');

    const condition = normalizeWs(deployJob?.if ?? '');
    expect(condition).toMatch(/github\.event_name\s*==\s*'release'/);
    expect(condition).toMatch(/inputs\.deploy_to_production\s*==\s*true/);

    const scripts = normalizeWs(collectJobScripts(deployJob));
    const serializedJob = JSON.stringify(deployJob);

    expect(scripts).toMatch(/cosign\s+verify\b/);
    expect(scripts).toMatch(
      /--certificate-oidc-issuer[=\s]+["']?https:\/\/token\.actions\.githubusercontent\.com/
    );

    expect(scripts).toMatch(/aws\s+ssm\s+send-command/);
    expect(scripts).toContain('AWS-RunShellScript');
    expect(scripts).toContain('/opt/orbit');
    expect(scripts).toContain('docker compose -f docker-compose.prod.yml');
    expect(serializedJob).toContain('secrets.EC2_INSTANCE_ID');
  });

  test('build-sign-attest job outputs wire image_ref and image_digest to valid step IDs consumed by deploy-production', () => {
    const { parsed } = loadReleaseWorkflow();
    const buildJob = parsed.jobs?.['build-sign-attest'];
    const deployJob = parsed.jobs?.['deploy-production'];
    expect(buildJob).toBeDefined();
    expect(deployJob).toBeDefined();

    const steps = buildJob?.steps ?? [];
    const stepIds = new Set(steps.map((s) => s.id).filter((id): id is string => Boolean(id)));

    expect(buildJob?.outputs?.image_ref).toBe('${{ steps.image-ref.outputs.image_ref }}');

    const imageRefStep = steps.find((s) => s.id === 'image-ref');
    expect(imageRefStep).toBeDefined();
    expect(imageRefStep?.run ?? '').toContain('image_ref=');

    const imageDigestOutput = buildJob?.outputs?.image_digest ?? '';
    const digestMatch = imageDigestOutput.match(
      /^\$\{\{\s*steps\.([A-Za-z0-9_-]+)\.outputs\.([A-Za-z0-9_-]+)\s*\}\}$/
    );
    expect(digestMatch).not.toBeNull();
    expect(stepIds.has(digestMatch![1])).toBe(true);
    expect(imageDigestOutput).toBe('${{ steps.build-push.outputs.digest }}');

    for (const [, outputExpr] of Object.entries(buildJob?.outputs ?? {})) {
      const match = String(outputExpr).match(/\$\{\{\s*steps\.([A-Za-z0-9_-]+)\.outputs\./);
      expect(match).not.toBeNull();
      expect(stepIds.has(match![1])).toBe(true);
    }

    const serializedDeploy = JSON.stringify(deployJob);
    expect(serializedDeploy).toContain('needs.build-sign-attest.outputs.image_ref');
    expect(serializedDeploy).toContain('needs.build-sign-attest.outputs.image_digest');
  });

  test('build-sign-attest does NOT pass --depth=1 to git fetch origin main so ancestor verification works for non-tip commits', () => {
    const { parsed } = loadReleaseWorkflow();
    const buildJob = parsed.jobs?.['build-sign-attest'];
    expect(buildJob).toBeDefined();

    const steps = buildJob?.steps ?? [];
    const checkoutStep = steps.find((s) => s.uses?.startsWith('actions/checkout@'));
    expect(checkoutStep?.with?.['fetch-depth']).toBe(0);

    const scripts = collectJobScripts(buildJob);
    expect(scripts).toMatch(/git\s+merge-base\s+--is-ancestor/);
    expect(scripts).toMatch(/origin\/main/);
    expect(scripts).not.toMatch(/git\s+fetch[^\n]*--depth(?:=|\s+)1\b/);
  });

  test('release.yml does NOT interpolate raw ${{ github.sha }} in run blocks and bounds deploy-production SSM --comment to <= 100 chars', () => {
    const { parsed } = loadReleaseWorkflow();

    for (const [, job] of Object.entries(parsed.jobs ?? {})) {
      for (const step of job.steps ?? []) {
        expect(step.run ?? '').not.toMatch(/\$\{\{\s*github\.sha\s*\}\}/);
      }
    }

    const deployJob = parsed.jobs?.['deploy-production'];
    expect(deployJob).toBeDefined();

    const ssmStep = (deployJob?.steps ?? []).find((s) =>
      (s.run ?? '').includes('aws ssm send-command')
    );
    expect(ssmStep).toBeDefined();

    const tmpDir = actualFs.mkdtempSync(path.join(os.tmpdir(), 'orbit-ssm-comment-'));
    const captureFile = path.join(tmpDir, 'comment.txt');

    try {
      const envVars: NodeJS.ProcessEnv = {
        PATH: process.env.PATH,
        CAPTURE_FILE: captureFile,
        GITHUB_SHA: '0123456789abcdef0123456789abcdef01234567',
      };

      for (const [key, val] of Object.entries(ssmStep?.env ?? {})) {
        const expr = String(val);
        if (expr.includes('github.sha')) {
          envVars[key] = '0123456789abcdef0123456789abcdef01234567';
        } else if (key === 'RELEASE_TAG' || expr.includes('release_tag')) {
          envVars[key] = 'v1.2.3-release-candidate.1';
        } else if (key === 'AWS_REGION') {
          envVars[key] = 'us-east-2';
        } else if (key === 'ECR_REGISTRY') {
          envVars[key] = '123456789012.dkr.ecr.us-east-2.amazonaws.com';
        } else if (key === 'INSTANCE_ID') {
          envVars[key] = 'i-0123456789abcdef0';
        } else {
          envVars[key] = 'stub-value';
        }
      }

      const harness = [
        'set -euo pipefail',
        'aws() {',
        '  if [ "$1" = "ssm" ] && [ "$2" = "send-command" ]; then',
        '    shift 2',
        '    while [ "$#" -gt 0 ]; do',
        '      if [ "$1" = "--comment" ]; then',
        '        printf "%s" "$2" > "$CAPTURE_FILE"',
        '        break',
        '      fi',
        '      shift',
        '    done',
        '    echo "cmd-123"',
        '    return 0',
        '  fi',
        '  if [ "$1" = "ssm" ] && [ "$2" = "get-command-invocation" ]; then',
        '    echo "Success"',
        '    return 0',
        '  fi',
        '  return 0',
        '}',
        ssmStep?.run ?? '',
      ].join('\n');

      const result = spawnSync('bash', ['-c', harness], {
        env: envVars,
        encoding: 'utf8',
      });

      expect(result.status).toBe(0);
      expect(actualFs.existsSync(captureFile)).toBe(true);
      const capturedComment = actualFs.readFileSync(captureFile, 'utf8');
      expect(capturedComment.length).toBeGreaterThan(0);
      expect(capturedComment.length).toBeLessThanOrEqual(100);
    } finally {
      actualFs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
