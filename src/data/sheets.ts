export type SheetPiece = {
  id: string;
  title: string;
  detail: string;
  tempo: string;
  pdf: number;
  pages: number[];
};

export const pieces: SheetPiece[] = [
  {
    id: 'cary-pivot',
    title: 'Cary Pivot',
    detail: 'Bebop AABA head and written solo chorus. Written D, concert F.',
    tempo: 'Quarter = 224',
    pdf: require('../../assets/01_Cary_Pivot.pdf'),
    pages: [
      require('../../assets/pages/cary-pivot/001.jpg'),
      require('../../assets/pages/cary-pivot/002.jpg'),
      require('../../assets/pages/cary-pivot/003.jpg'),
      require('../../assets/pages/cary-pivot/004.jpg'),
      require('../../assets/pages/cary-pivot/005.jpg'),
      require('../../assets/pages/cary-pivot/006.jpg'),
      require('../../assets/pages/cary-pivot/007.jpg'),
      require('../../assets/pages/cary-pivot/008.jpg'),
    ],
  },
  {
    id: 'lowlight-pocket',
    title: 'Lowlight Pocket',
    detail: 'Easy modern-funk groove in E Dorian. Straight sixteenths.',
    tempo: 'Quarter = 98',
    pdf: require('../../assets/02_Lowlight_Pocket.pdf'),
    pages: [
      require('../../assets/pages/lowlight-pocket/001.jpg'),
      require('../../assets/pages/lowlight-pocket/002.jpg'),
      require('../../assets/pages/lowlight-pocket/003.jpg'),
      require('../../assets/pages/lowlight-pocket/004.jpg'),
    ],
  },
  {
    id: 'frogs-blues',
    title: "Frog's Blues",
    detail: '12-bar blues head. Swing eighths. Written G, concert Bb.',
    tempo: 'Quarter = 132',
    pdf: require('../../assets/03_Frogs_Blues.pdf'),
    pages: [
      require('../../assets/pages/frogs-blues/001.jpg'),
    ],
  },
  {
    id: 'glass-harbor',
    title: 'Glass Harbor',
    detail: 'Original modern-jazz etude. Up swing, 32 bars.',
    tempo: 'Quarter = 180',
    pdf: require('../../assets/04_Glass_Harbor.pdf'),
    pages: [
      require('../../assets/pages/glass-harbor/001.jpg'),
      require('../../assets/pages/glass-harbor/002.jpg'),
      require('../../assets/pages/glass-harbor/003.jpg'),
      require('../../assets/pages/glass-harbor/004.jpg'),
    ],
  },
  {
    id: 'cinder-grid',
    title: 'Cinder Grid',
    detail: 'Original up-swing etude. Thirds cycles and ii–V patterns.',
    tempo: 'Quarter = 280',
    pdf: require('../../assets/05_Cinder_Grid.pdf'),
    pages: [
      require('../../assets/pages/cinder-grid/001.jpg'),
      require('../../assets/pages/cinder-grid/002.jpg'),
      require('../../assets/pages/cinder-grid/003.jpg'),
      require('../../assets/pages/cinder-grid/004.jpg'),
    ],
  },
  {
    id: 'drift-logic',
    title: 'Drift Logic',
    detail: 'Original odd-meter etude.',
    tempo: 'Up swing',
    pdf: require('../../assets/06_Drift_Logic.pdf'),
    pages: [
      require('../../assets/pages/drift-logic/001.jpg'),
      require('../../assets/pages/drift-logic/002.jpg'),
      require('../../assets/pages/drift-logic/003.jpg'),
    ],
  },
  {
    id: 'sight-reading-etude-1',
    title: 'Sight-Reading Etude No. 1',
    detail: 'Original mixed-meter etude. Presto, the meter changes often.',
    tempo: 'Presto',
    pdf: require('../../assets/07_Sight_Reading_Etude_1.pdf'),
    pages: [
      require('../../assets/pages/sight-reading-etude-1/001.jpg'),
      require('../../assets/pages/sight-reading-etude-1/002.jpg'),
      require('../../assets/pages/sight-reading-etude-1/003.jpg'),
      require('../../assets/pages/sight-reading-etude-1/004.jpg'),
      require('../../assets/pages/sight-reading-etude-1/005.jpg'),
    ],
  },
  {
    id: 'phone-stand-pack',
    title: 'Phone Stand Pack',
    detail: 'The full landscape book: contents plus every chart, one page at a time.',
    tempo: 'Eb alto · written pitch',
    pdf: require('../../assets/Alto_Sax_Phone_Stand_Landscape.pdf'),
    pages: [
      require('../../assets/pages/phone-stand-pack/001.jpg'),
      require('../../assets/pages/phone-stand-pack/002.jpg'),
      require('../../assets/pages/phone-stand-pack/003.jpg'),
      require('../../assets/pages/phone-stand-pack/004.jpg'),
      require('../../assets/pages/phone-stand-pack/005.jpg'),
      require('../../assets/pages/phone-stand-pack/006.jpg'),
      require('../../assets/pages/phone-stand-pack/007.jpg'),
      require('../../assets/pages/phone-stand-pack/008.jpg'),
      require('../../assets/pages/phone-stand-pack/009.jpg'),
      require('../../assets/pages/phone-stand-pack/010.jpg'),
      require('../../assets/pages/phone-stand-pack/011.jpg'),
      require('../../assets/pages/phone-stand-pack/012.jpg'),
      require('../../assets/pages/phone-stand-pack/013.jpg'),
      require('../../assets/pages/phone-stand-pack/014.jpg'),
      require('../../assets/pages/phone-stand-pack/015.jpg'),
      require('../../assets/pages/phone-stand-pack/016.jpg'),
      require('../../assets/pages/phone-stand-pack/017.jpg'),
      require('../../assets/pages/phone-stand-pack/018.jpg'),
      require('../../assets/pages/phone-stand-pack/019.jpg'),
      require('../../assets/pages/phone-stand-pack/020.jpg'),
      require('../../assets/pages/phone-stand-pack/021.jpg'),
      require('../../assets/pages/phone-stand-pack/022.jpg'),
      require('../../assets/pages/phone-stand-pack/023.jpg'),
      require('../../assets/pages/phone-stand-pack/024.jpg'),
      require('../../assets/pages/phone-stand-pack/025.jpg'),
      require('../../assets/pages/phone-stand-pack/026.jpg'),
      require('../../assets/pages/phone-stand-pack/027.jpg'),
      require('../../assets/pages/phone-stand-pack/028.jpg'),
      require('../../assets/pages/phone-stand-pack/029.jpg'),
      require('../../assets/pages/phone-stand-pack/030.jpg'),
    ],
  },
];

export function findPiece(id: string): SheetPiece | undefined {
  return pieces.find((piece) => piece.id === id);
}
