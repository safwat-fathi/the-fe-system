/**
 * Systems, Sections, and Screens Types
 * Types for the hierarchical structure: Systems → Sections → Screens
 */

export interface System {
  id: string;
  name: string;
  name_en?: string;
  icon?: string;
  color?: string;
  order: number;
  sections: Section[];
}

export interface Section {
  id: string;
  system_id: string;
  name: string;
  name_en?: string;
  icon?: string;
  order: number;
  screens: Screen[];
}

export interface Screen {
  id: string;
  section_id: string;
  system_id: string;
  name: string;
  name_en?: string;
  path: string;
  icon?: string;
  order: number;
  object_id?: number; // ID from objects table if exists
}

export interface SystemMap {
  systems: System[];
}

