type SlotName = 'INPUT1' | 'INPUT2' | 'OUTPUT1' | 'OUTPUT2';

interface Slot {
  name: SlotName;
  IsMulti: boolean;
  Type: string;
}

const CmdSlots: { [key: string]: Slot[] } = {
  SEARCH: [{ name: 'OUTPUT1', IsMulti: false, Type: 'OUT' }],
  VIEW: [
    { name: 'INPUT1', IsMulti: false, Type: 'IN' },
    { name: 'OUTPUT1', IsMulti: false, Type: 'OUT' },
  ],
  CORRELATE: [
    { name: 'INPUT1', IsMulti: false, Type: 'IN' },
    { name: 'INPUT2', IsMulti: false, Type: 'IN' },
    { name: 'OUTPUT1', IsMulti: false, Type: 'OUT' },
  ],
  MERGE: [
    { name: 'INPUT1', IsMulti: true, Type: 'IN' },
    { name: 'OUTPUT1', IsMulti: false, Type: 'OUT' },
  ],
};

export { Slot, CmdSlots, SlotName };
