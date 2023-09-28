import { exec } from 'child_process';
import { promisify } from 'util';
import * as semver from 'semver'
import {
  ApiTrustFact,
  PackageDetailsTransitiveDependencies,
  TrustFact,
  defaultPackage,
} from '../interfaces/api-interfaces';
import fetch from 'node-fetch';
export const execAsync = promisify(exec);

const baseUrlDlt = 'http://localhost:3000/api/dlt/';

export async function fetchTrustScore(
  packageName: string,
  version: string
): Promise<number | undefined> {
  const response = await fetch(`${baseUrlDlt}package/${packageName}/trust-score/${version}`);

  if (!response.ok) throw Error('Failed to fetch trust score');

  const data = await response.json();
    
  return typeof data === 'number' ? data : undefined;
}

export async function fetchTrustScoreMock(
  packageName: string,
  version?: string
): Promise<number> {
  await new Promise(resolve => setTimeout(resolve, 300));  // Adding 300ms delay
  return (Math.random() * 100) | 0;
}

export async function fetchTrustFacts(
  packageName: string,
  version?: string
): Promise<TrustFact[]> {
  const fetchUrl =  `${baseUrlDlt}trust-facts/${packageName}`;
  
  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch trust facts');
  }

  const data = await response.json() as { facts?: ApiTrustFact[] };

  if (!data.facts) {
    return [];
  }

  const versionFilter = (item: ApiTrustFact) => item.version === version;
  return data.facts
    .filter(versionFilter)
    .map((item: ApiTrustFact) => parseTrustFact(item));
}

export async function fetchTrustFactsMock(
  name: string,
  version?: string
): Promise<TrustFact[]> {
  const trustFacts = [];
  const count = Math.floor(((name.length + 10) % 20) * Math.random());
  for (let i = 0; i < count; i += 1) {
    trustFacts[i] = {
      type: 'github stars',
      value: (i + 1).toString(),
    };
  }
  return trustFacts;
}

export async function getTransitiveDependencies(
  packageName: string,
  version: string
): Promise<PackageDetailsTransitiveDependencies> {
  const resolvedVersion = semver.valid(semver.coerce(version));
  const packageVersion = resolvedVersion ? `@${resolvedVersion}` : '';
  const { stdout } = await execAsync(
    `npm view ${packageName}${packageVersion} version name dependencies --json`
  );

  const data = JSON.parse(stdout);

  return {
    version: data.version,
    name: data.name,
    dependencies: data.dependencies || {},
  };
}

const parseTrustFact = (data: ApiTrustFact): TrustFact => ({
  ...defaultPackage,
  type: data.fact,
  value: data.factData,
});
