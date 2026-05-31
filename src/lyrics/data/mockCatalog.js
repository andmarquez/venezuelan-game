export const MOCK_SONGS = [
  {
    id: 'despecha',
    title: 'DESPECHÁ',
    artist: 'Bad Bunny',
    language: 'spa',
    languageLabel: 'Spanish',
    bpm: 128,
    energy: 0.85,
    palette: ['#ff006e', '#fb5607', '#ffbe0b'],
    lyrics: [
      'Yo no sé qué tú esperabas',
      'Si tú te vas, yo no te busco',
      'Después de toda la noche bailando',
      'La disco explota, el cuerpo en fuego',
      'No me llames cuando estés solo',
      'Esta noche brillo sin ti',
    ],
  },
  {
    id: 'motomami',
    title: 'MOTOMAMI',
    artist: 'Rosalía',
    language: 'spa',
    languageLabel: 'Spanish',
    bpm: 142,
    energy: 0.92,
    palette: ['#e63946', '#f1faee', '#1d3557'],
    lyrics: [
      'Motomami, motomami',
      'La pista tiembla cuando paso',
      'Fuego en la boca, hielo en la piel',
      'Nadie me para en el ritmo',
      'Sube el bajo, rompe el techo',
      'Cámara encendida, soy la leyenda',
    ],
  },
  {
    id: 'lux',
    title: 'LUX',
    artist: 'Rosalía',
    language: 'lat',
    languageLabel: 'Latin',
    bpm: 118,
    energy: 0.7,
    palette: ['#ffffff', '#c1121f', '#780000'],
    lyrics: [
      'Lux aeterna luceat eis',
      'Cor meum in pulsu vivit',
      'Vox noctis surgit alta',
      'Stella cadit super nos',
      'Ignis et gloria in nocte',
      'Cantus urbis resonat',
    ],
  },
  {
    id: 'midnight',
    title: 'MIDNIGHT PULSE',
    artist: 'Studio Live',
    language: 'eng',
    languageLabel: 'English',
    bpm: 124,
    energy: 0.78,
    palette: ['#00f5d4', '#9b5de5', '#f15bb5'],
    lyrics: [
      'Neon rivers on your skin tonight',
      'Bassline heartbeat in the dark',
      'We dissolve into the strobe',
      'Every syllable a spark',
      'Hold the drop inside your chest',
      'Let the typography explode',
    ],
  },
  {
    id: 'nuit',
    title: 'NUIT ÉLECTRIQUE',
    artist: 'Ensemble Paris',
    language: 'fra',
    languageLabel: 'French',
    bpm: 132,
    energy: 0.8,
    palette: ['#4895ef', '#4361ee', '#f72585'],
    lyrics: [
      'La nuit électrique nous prend',
      'Les mots dansent sur la peau',
      'Un éclair entre deux battements',
      'La foule devient un océan',
      'Chaque lettre brûle en neon',
      'On ne s’arrête plus jamais',
    ],
  },
  {
    id: 'saoko',
    title: 'SAOKO',
    artist: 'Rosalía',
    language: 'spa',
    languageLabel: 'Spanish',
    bpm: 138,
    energy: 0.88,
    palette: ['#ff4d6d', '#590d22', '#ff758f'],
    lyrics: [
      'Saoko, papi, saoko',
      'La calle canta mi nombre',
      'Perreo en la luna llena',
      'Rompo el silencio con un grito',
      'Tattoo en el aire, tinta viva',
      'Motomami en la pista otra vez',
    ],
  },
];

export function pickMockSong(bpm, energy) {
  const safeBpm = Number.isFinite(bpm) && bpm > 40 ? bpm : 120;
  const safeEnergy = Number.isFinite(energy) ? energy : 0.75;

  let best = MOCK_SONGS[0];
  let bestScore = Infinity;

  for (const song of MOCK_SONGS) {
    const score = Math.abs(song.bpm - safeBpm) * 1.4 + Math.abs(song.energy - safeEnergy) * 45;
    if (score < bestScore) {
      best = song;
      bestScore = score;
    }
  }

  return best;
}
