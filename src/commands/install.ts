import { execSync } from 'child_process';
import { displayPackageDetails } from '../utils/table';
import { getNpmPackageVersion } from '../utils/npm';
import { fetchTrustScoreMock } from '../services/fetch-data';
import { THRESHOLD } from '../constants/global-constants';
import * as readline from 'readline';
import { checkPolicies } from '../utils/policy';
import { hyperlink } from '../utils/common';

async function install(packageName: string, version?: string): Promise<void> {
  const env = process.env.NODE_ENV || 'development';
  const policyFile = `policy.${env}.json`;

  if (
    !(await checkPolicies(packageName, policyFile)) &&
    !(await askUserToContinue())
  ) {
    return;
  }

  const resolvedVersion = version || getNpmPackageVersion(packageName);
  const trustScore = await fetchTrustScoreMock(packageName, resolvedVersion);

  await displayPackageDetails(packageName, resolvedVersion, trustScore);

  if (trustScore >= THRESHOLD) {
    execSync(`npm install ${packageName}@${resolvedVersion}`, {
      stdio: 'inherit',
    });
    return;
  }

  console.warn(
    `\u001b[33mWarning: The trust score for ${packageName}@${resolvedVersion} is low ${trustScore}/100. Check ${hyperlink(
      `http://${process.env.PORTAL_URL || 'localhost:3000'}`,
      'TrustSECO portal'
    )} for more details.\u001b[0m`
  );

  const userConfirmed = await askUserToContinue();

  if (!userConfirmed) {
    console.log('Installation aborted due to low trust score.');
    return;
  }

  execSync(`npm install ${packageName}@${resolvedVersion}`, {
    stdio: 'inherit',
  });
}

function askUserToContinue(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      'Do you still want to continue installing? (Y/N) ',
      (answer: string) => {
        rl.close();
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    );
  });
}

export default install;
