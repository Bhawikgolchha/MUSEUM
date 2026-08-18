import React from 'react';
import { notFound } from 'next/navigation';
import { getArtifactById, getAllArtifacts } from '@/lib/artifacts';
import ArtifactDetailClient from '@/components/ArtifactDetailClient';

interface ArtifactPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const artifacts = getAllArtifacts();
  return artifacts.map((art) => ({
    id: art.id,
  }));
}

export default async function ArtifactPage({ params }: ArtifactPageProps) {
  const { id } = await params;
  const artifact = getArtifactById(id);

  if (!artifact) {
    notFound();
  }

  return <ArtifactDetailClient artifact={artifact} />;
}
