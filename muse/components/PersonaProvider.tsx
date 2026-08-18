'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Audience, Depth, Persona } from '@/lib/types';
import { DEFAULT_PERSONA } from '@/lib/personas';

interface PersonaContextType {
  persona: Persona;
  setAudience: (audience: Audience) => void;
  setDepth: (depth: Depth) => void;
  toggleAccessibility: () => void;
  setPersona: React.Dispatch<React.SetStateAction<Persona>>;
  isContextSheetOpen: boolean;
  setIsContextSheetOpen: (open: boolean) => void;
  openContextSheet: () => void;
  closeContextSheet: () => void;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

const STORAGE_KEY = 'muse_persona';
const VISITED_KEY = 'muse_has_visited';

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersona] = useState<Persona>(DEFAULT_PERSONA);
  const [isContextSheetOpen, setIsContextSheetOpen] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPersona(JSON.parse(saved));
      }

      // Auto-open on first visit in this session
      const hasVisited = sessionStorage.getItem(VISITED_KEY);
      if (!hasVisited) {
        setIsContextSheetOpen(true);
        sessionStorage.setItem(VISITED_KEY, 'true');
      }
    } catch {
      // Fallback gracefully on storage error
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const updatePersona = (updater: (prev: Persona) => Persona) => {
    setPersona((prev) => {
      const next = updater(prev);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignored
      }
      return next;
    });
  };

  const setAudience = (audience: Audience) => {
    updatePersona((p) => ({ ...p, audience }));
  };

  const setDepth = (depth: Depth) => {
    updatePersona((p) => ({ ...p, depth }));
  };

  const toggleAccessibility = () => {
    updatePersona((p) => ({ ...p, accessibility: !p.accessibility }));
  };

  return (
    <PersonaContext.Provider
      value={{
        persona,
        setAudience,
        setDepth,
        toggleAccessibility,
        setPersona: (val) => updatePersona((p) => (typeof val === 'function' ? val(p) : val)),
        isContextSheetOpen,
        setIsContextSheetOpen,
        openContextSheet: () => setIsContextSheetOpen(true),
        closeContextSheet: () => setIsContextSheetOpen(false),
      }}
    >
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona() {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
}
