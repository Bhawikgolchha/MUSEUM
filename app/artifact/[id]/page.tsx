import React from 'react';
import type { Metadata } from 'next';
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

export async function generateMetadata({ params }: ArtifactPageProps): Promise<Metadata> {
  const { id } = await params;
  const artifact = getArtifactById(id);

  if (!artifact) {
    return {
      title: 'Artifact Not Found — Digital Muse',
      description: 'The requested Indian museum masterwork could not be located in the archival catalog.',
    };
  }

  return {
    title: `${artifact.title} · ${artifact.museumName} — Digital Muse`,
    description: `${artifact.title} (${artifact.period}) from ${artifact.museumName}. ${artifact.material}, ${artifact.culture}. Explore adaptive multi-persona interpretation with factual fidelity verification.`,
    openGraph: {
      title: `${artifact.title} — Digital Muse`,
      description: `Explore ${artifact.title} (${artifact.period}) from ${artifact.museumName} with verified factual audit.`,
      images: artifact.imageUrl ? [{ url: artifact.imageUrl, alt: artifact.curatorAltText || artifact.title }] : [],
    },
  };
}

export default async function ArtifactPage({ params }: ArtifactPageProps) {
  const { id } = await params;
  const artifact = getArtifactById(id);

  if (!artifact) {
    notFound();
  }

  // Schema.org CulturalHeritageObject / VisualArtwork Microdata
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: artifact.title,
    artform: artifact.material,
    dateCreated: artifact.period,
    temporalCoverage: artifact.period,
    description: artifact.canonicalText,
    image: artifact.imageUrl,
    contentLocation: {
      '@type': 'Place',
      name: artifact.museumName,
    },
    creator: {
      '@type': 'Organization',
      name: artifact.culture,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArtifactDetailClient artifact={artifact} />
    </>
  );
}
