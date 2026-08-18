import artifactsData from '@/data/artifacts.json';
import { Artifact } from './types';

const artifacts: Artifact[] = artifactsData as Artifact[];

export function getAllArtifacts(): Artifact[] {
  return artifacts;
}

export function getArtifactById(id: string): Artifact | undefined {
  return artifacts.find((a) => a.id === id);
}
