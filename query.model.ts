type SlotName = "INPUT1" | "INPUT2" | "OUTPUT1" | "OUTPUT2" | null;
type SlotType = "IN" | "OUT"

interface Slot {
    name: SlotName,
    IsMulti: boolean,
    type: SlotType
}

const CmdSlots: {[key: string]: Slot[]} = {
    "SEARCH": [
        {name: "OUTPUT1", IsMulti: false, type: 'OUT'}
    ],
    "VIEW": [
        {name: "INPUT1", IsMulti: false, type: 'IN'},
        {name: "OUTPUT1", IsMulti: false, type: 'OUT'}
    ],
    "CORRELATEREF": [
        {name: "INPUT1", IsMulti: false, type: 'IN'},
        {name: "INPUT2", IsMulti: false, type: 'IN'},
        {name: "OUTPUT1", IsMulti: false, type: 'OUT'}
    ],
    "MERGE": [
        {name: "INPUT1", IsMulti: true, type: 'IN'},
        {name: "OUTPUT1", IsMulti: false, type: 'OUT'}
    ],
}

export { Slot, CmdSlots, SlotName, SlotType };
