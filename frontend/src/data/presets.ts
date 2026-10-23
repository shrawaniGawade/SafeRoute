export interface AcidSquaresPreset {
  id: string;
  name: string;
  tagline: string;
  accentColor: string;
  secondaryColor: string;
  color: string;
  lighting: 'split' | 'backlit' | 'overhead';
  tileSize: number;
  gap: number;
  roundness: number;
  softness: number;
  bulge: number;
  rotation: number;
  gloss: number;
  waves: number;
  waveScale: number;
  speed: number;
  tilt: number;
  grain: number;
  shape: 'square' | 'round';
  hoverEffect: 'press' | 'lift' | 'none';
}

export const PRESETS: Record<string, AcidSquaresPreset> = {
  graphite: {
    id: 'graphite',
    name: 'Titanium Monolith',
    tagline: 'Pure monochromatic luxury. Cold titanium & slate reflections.',
    accentColor: '#ffffff',
    secondaryColor: '#64748b',
    color: '#08080a',
    lighting: 'backlit',
    tileSize: 1.05,
    gap: 0.1,
    roundness: 0.14,
    softness: 0.28,
    bulge: 0.08,
    rotation: 26,
    gloss: 0.92,
    waves: 0.45,
    waveScale: 1.0,
    speed: 0.4,
    tilt: 0.78,
    grain: 0.07,
    shape: 'square',
    hoverEffect: 'press',
  },
  saferoute: {
    id: 'saferoute',
    name: 'SafeRoute Guard',
    tagline: 'Verified illuminated corridors. Luminous emerald & cyan telemetry.',
    accentColor: '#10b981',
    secondaryColor: '#06b6d4',
    color: '#06110f',
    lighting: 'split',
    tileSize: 1.05,
    gap: 0.11,
    roundness: 0.18,
    softness: 0.32,
    bulge: 0.14,
    rotation: 24,
    gloss: 0.88,
    waves: 0.46,
    waveScale: 1.05,
    speed: 0.42,
    tilt: 0.75,
    grain: 0.07,
    shape: 'square',
    hoverEffect: 'press',
  },
  nightwalk: {
    id: 'nightwalk',
    name: 'Well-Lit Night Walk',
    tagline: 'High streetlamp illumination & active foot-traffic boulevards.',
    accentColor: '#f59e0b',
    secondaryColor: '#38bdf8',
    color: '#0a0d14',
    lighting: 'split',
    tileSize: 1.0,
    gap: 0.12,
    roundness: 0.2,
    softness: 0.35,
    bulge: 0.16,
    rotation: 28,
    gloss: 0.84,
    waves: 0.5,
    waveScale: 0.95,
    speed: 0.4,
    tilt: 0.72,
    grain: 0.06,
    shape: 'square',
    hoverEffect: 'press',
  },
  caution: {
    id: 'caution',
    name: 'Maximum Caution',
    tagline: 'Active radar sensitivity. Heightened crime suppression and hazard shielding.',
    accentColor: '#ef4444',
    secondaryColor: '#f59e0b',
    color: '#12080a',
    lighting: 'overhead',
    tileSize: 0.98,
    gap: 0.13,
    roundness: 0.16,
    softness: 0.28,
    bulge: 0.15,
    rotation: 18,
    gloss: 0.9,
    waves: 0.55,
    waveScale: 1.15,
    speed: 0.48,
    tilt: 0.7,
    grain: 0.08,
    shape: 'square',
    hoverEffect: 'lift',
  },
  commute: {
    id: 'commute',
    name: 'Direct Commute',
    tagline: 'Balanced daytime transit with optimal travel velocity and verified crossings.',
    accentColor: '#38bdf8',
    secondaryColor: '#10b981',
    color: '#080d14',
    lighting: 'split',
    tileSize: 1.0,
    gap: 0.11,
    roundness: 0.18,
    softness: 0.3,
    bulge: 0.12,
    rotation: 25,
    gloss: 0.86,
    waves: 0.44,
    waveScale: 1.0,
    speed: 0.44,
    tilt: 0.74,
    grain: 0.06,
    shape: 'square',
    hoverEffect: 'press',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Midnight Velvet',
    tagline: 'Deep cosmic twilight. Electric violet & deep indigo speculars.',
    accentColor: '#c084fc',
    secondaryColor: '#3b82f6',
    color: '#090710',
    lighting: 'split',
    tileSize: 1.0,
    gap: 0.11,
    roundness: 0.2,
    softness: 0.38,
    bulge: 0.14,
    rotation: 22,
    gloss: 0.82,
    waves: 0.42,
    waveScale: 1.05,
    speed: 0.38,
    tilt: 0.74,
    grain: 0.08,
    shape: 'square',
    hoverEffect: 'press',
  },
  glacier: {
    id: 'glacier',
    name: 'Glacier Optic',
    tagline: 'Crystalline optical glass. Frozen cyan highlights with overhead diffusion.',
    accentColor: '#a5f3fc',
    secondaryColor: '#3b82f6',
    color: '#06090e',
    lighting: 'overhead',
    tileSize: 0.95,
    gap: 0.14,
    roundness: 0.18,
    softness: 0.25,
    bulge: 0.12,
    rotation: 0,
    gloss: 0.88,
    waves: 0.48,
    waveScale: 1.1,
    speed: 0.4,
    tilt: 0.68,
    grain: 0.06,
    shape: 'square',
    hoverEffect: 'lift',
  },
  solstice: {
    id: 'solstice',
    name: 'Solar Solstice',
    tagline: 'Warm architectural twilight. Golden lamp glow with muted amber highlights.',
    accentColor: '#fde047',
    secondaryColor: '#fb7185',
    color: '#0d090a',
    lighting: 'split',
    tileSize: 1.1,
    gap: 0.1,
    roundness: 0.22,
    softness: 0.4,
    bulge: 0.2,
    rotation: 16,
    gloss: 0.78,
    waves: 0.45,
    waveScale: 1.2,
    speed: 0.35,
    tilt: 0.75,
    grain: 0.08,
    shape: 'square',
    hoverEffect: 'press',
  },
};

export const DEFAULT_PRESET_ID = 'graphite'; // Titanium Monolith as default

export const getDefaultPreset = (): AcidSquaresPreset => {
  try {
    const savedId = localStorage.getItem('saferoute_default_preset') || DEFAULT_PRESET_ID;
    const base = PRESETS[savedId] || PRESETS.graphite;
    const customConfig = localStorage.getItem(`saferoute_preset_config_${base.id}`);
    if (customConfig) {
      return { ...base, ...JSON.parse(customConfig) };
    }
    return base;
  } catch {
    return PRESETS.graphite;
  }
};

export const saveDefaultPreset = (preset: AcidSquaresPreset) => {
  try {
    localStorage.setItem('saferoute_default_preset', preset.id);
    localStorage.setItem(`saferoute_preset_config_${preset.id}`, JSON.stringify(preset));
    window.dispatchEvent(
      new CustomEvent('saferoute_default_preset_changed', { detail: preset })
    );
  } catch (e) {
    console.error('Failed to save default preset:', e);
  }
};
