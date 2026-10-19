// Flood preparedness guidance, built into the app so it works with no connection. General advice in plain language;
// it does not replace instructions from the authorities in your area.

export interface GuideSection {
  id: string;
  title: string;
  when: string;
  steps: string[];
}

export const EMERGENCY_NUMBERS = [
  { label: 'Emergency (police, fire, ambulance)', number: '999' },
  { label: 'Emergency from a mobile phone', number: '112' },
];

export const GUIDE: GuideSection[] = [
  {
    id: 'before',
    title: 'Before a flood',
    when: 'Heavy rain is forecast, or water is rising nearby',
    steps: [
      'Charge your phone and a power bank.',
      'Pack a go-bag (the checklist is below).',
      'Move documents, medicine and electrical items to a higher shelf.',
      'Know your nearest relief centre and two ways to get there.',
      'Agree with your family where to meet if you are apart.',
    ],
  },
  {
    id: 'leave',
    title: 'When you are told to leave',
    when: 'An evacuation order, or water entering your street',
    steps: [
      'Leave early. Do not wait for the water to reach your door.',
      'Switch off electricity at the main switch if you can do it safely and dry.',
      'Take your go-bag, and help older neighbours and children first.',
      'Tell your family where you are going.',
    ],
  },
  {
    id: 'water',
    title: 'Moving through flood water',
    when: 'You have no dry way out',
    steps: [
      'Never drive into flood water. 30 cm of moving water can float a car.',
      'Never walk in moving water above your knees.',
      'Keep away from drains, rivers and underpasses: the water is deeper and faster there.',
      'Watch for fallen power lines. Stay well away from them.',
      'If you are trapped, go to the highest floor or roof, and call 999 or 112.',
    ],
  },
  {
    id: 'after',
    title: 'After the water goes down',
    when: 'The authorities say it is safe to return',
    steps: [
      'Do not switch the power back on until it has been checked.',
      'Throw away food that touched flood water.',
      'Wear boots and gloves when cleaning. Flood water carries disease.',
      'Take photos of damage before you clean, for insurance or aid claims.',
    ],
  },
];

export const GO_BAG = [
  'Drinking water (3 litres per person)',
  'Food that keeps (2 days)',
  'Medicine and prescriptions',
  'Copies of ID cards and documents in a waterproof bag',
  'Phone, power bank and cables',
  'Torch and spare batteries',
  'Whistle',
  'First aid kit',
  'Change of clothes and a raincoat',
  'Some cash',
];
