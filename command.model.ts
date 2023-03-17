import { v4 } from 'uuid';
import { ChildConnectorIface, ParentConnectorIface } from './connection.model';
import { Slot, SlotName, SlotType } from './query.model';

interface CmdBasicInfoIface {
    GetID(): string;
    GetCoordinate(): { x: Number; y: Number };
    SetCoordinate(x: Number, y: Number): void;
}

interface CmdIface extends CmdBasicInfoIface {
    Slots: Slot[];
    GetInConnector(name: SlotName, label?: SlotType): ChildConnectorIface;
    GetOutConnector(name: SlotName, label?: SlotType): ParentConnectorIface;
    SetIntoLabel(label: string): void;
    GenerateProps(): any;
}

class Cmd implements CmdBasicInfoIface {
    uuid: string;
    coordinate: { x: Number; y: Number };
    constructor() {
        this.uuid = v4();
        this.coordinate = { x: 0, y: 0 };
    }

    GetID(): string {
        return this.uuid;
    }

    GetCoordinate(): { x: Number; y: Number } {
        return this.coordinate;
    }

    SetCoordinate(x: Number, y: Number): void {
        this.coordinate.x = x;
        this.coordinate.y = y;
    }
}

export { Cmd, CmdBasicInfoIface, CmdIface };
