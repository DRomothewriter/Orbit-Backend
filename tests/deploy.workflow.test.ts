import fs from 'fs';
import path from 'path';

describe('Orbit-0017: GitHub Actions Backend Deployment Workflow (.github/workflows/deploy.yml)', () => {
  const workflowPath = path.resolve(__dirname, '../.github/workflows/deploy.yml');

  test('Workflow file exists in .github/workflows/deploy.yml', () => {
    expect(fs.existsSync(workflowPath)).toBe(true);
  });

  const content = fs.existsSync(workflowPath) ? fs.readFileSync(workflowPath, 'utf8') : '';

  test('Workflow triggers on push to main and manual dispatch (workflow_dispatch)', () => {
    expect(content).toMatch(/branches:\s*\[?.*main/);
    expect(content).toMatch(/workflow_dispatch:/);
  });

  test('Configures least-privilege OIDC permissions (id-token: write, contents: read)', () => {
    expect(content).toMatch(/permissions:/);
    expect(content).toMatch(/id-token:\s*write/);
    expect(content).toMatch(/contents:\s*read/);
  });

  test('Does NOT contain static AWS keys or legacy SSH private key secrets', () => {
    expect(content).not.toMatch(/AWS_ACCESS_KEY_ID/i);
    expect(content).not.toMatch(/AWS_SECRET_ACCESS_KEY/i);
    expect(content).not.toMatch(/EC2_SSH_KEY/i);
    expect(content).not.toMatch(/ssh-agent/i);
    expect(content).not.toMatch(/StrictHostKeyChecking/i);
  });

  test('Authenticates to AWS using aws-actions/configure-aws-credentials with OIDC role assumption', () => {
    expect(content).toMatch(/uses:\s*aws-actions\/configure-aws-credentials@v4/);
    expect(content).toMatch(/role-to-assume:/);
  });

  test('Executes test suite before container build to ensure continuous quality', () => {
    expect(content).toMatch(/npm (test|run test)/);
  });

  test('Logs into Amazon ECR using official aws-actions/amazon-ecr-login', () => {
    expect(content).toMatch(/uses:\s*aws-actions\/amazon-ecr-login/);
  });

  test('Builds and pushes Docker image tagged with commit SHA and latest', () => {
    expect(content).toMatch(/docker build/);
    expect(content).toMatch(/docker push/);
    expect(content).toMatch(/github\.sha/);
    expect(content).toMatch(/:latest/);
  });

  test('Deploys to EC2 via AWS SSM Run Command targeting /opt/orbit with Docker Compose', () => {
    expect(content).toMatch(/aws ssm send-command/);
    expect(content).toMatch(/AWS-RunShellScript/);
    expect(content).toMatch(/\/opt\/orbit/);
    expect(content).toMatch(/docker compose.*pull/);
    expect(content).toMatch(/docker compose.*up/);
  });

  test('Does not contain legacy PM2 process manager commands', () => {
    expect(content).not.toMatch(/pm2 restart/i);
    expect(content).not.toMatch(/pm2 list/i);
  });
});
