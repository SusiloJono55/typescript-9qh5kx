import { v4 } from 'uuid';
import { ChildConnectorIface, ParentConnectorIface } from './connection.model';
import { CmdSlots, Slot, SlotName, SlotType } from './query.model';

type CmdTypes = "CORRELATE" | "SEARCH" | "VIEW" | "MERGE";

interface CmdBasicInfoIface {
    GetID(): string;
    GetCoordinate(): { x: Number; y: Number };
    Slots: Slot[];
    NodeType(): CmdTypes;
}

interface CmdIface extends CmdBasicInfoIface {
    SetID(ID: string): void;
    SetCoordinate(x: Number, y: Number): void;
    GetInConnector(name: SlotName, label?: string): ChildConnectorIface;
    GetOutConnector(name: SlotName, label?: string): ParentConnectorIface;
    SetIntoLabel(label: string): void;
    GetProps(): any;
    SetProp(key: string, value: null | string | number | boolean): boolean
}

class Cmd implements CmdBasicInfoIface {
    uuid: string;
    coordinate: { x: Number; y: Number };
    node_type: CmdTypes;
    props: any;
    Slots: Slot[];
    constructor(node_type: CmdTypes, props?: any) {
        this.uuid = v4();
        this.coordinate = { x: 0, y: 0 };
        this.node_type = node_type;
        this.props = props;
        this.Slots = CmdSlots[node_type];
    }

    SetNewProp(props: any) {
        this.props = props;
    }

    GetID(): string {
        return this.uuid;
    }

    SetID(ID: string) {
        this.uuid = ID;
    }

    GetCoordinate(): { x: Number; y: Number } {
        return this.coordinate;
    }

    SetCoordinate(x: Number, y: Number): void {
        this.coordinate.x = x;
        this.coordinate.y = y;
    }

    NodeType(): CmdTypes {
        return this.node_type;
    }

    GetProps(): any {
        return this.props;
    }

    SetProp(key: string, value: string | number | boolean): boolean {
        return SetCmdProp(this.props, key, value);
    }
}

function isContainer(a: any): boolean {
    return (!!a) && (a.constructor === Object || a.constructor === Array);
}

const PropRe = /([a-zA-Z_]+((\-*[a-zA-Z_0-9]+)|([a-zA-Z_0-9]))*)+|\[([0-9])+\]/g;
function SetCmdProp(prop: Object, key: string, value: string | number | boolean): boolean {
    const matches = key.matchAll(PropRe);
    let checked = prop;
    let match = matches.next();
    while (!match.done) {
        const element = match.value;
        if (element[1]) {
            if (element[1] in checked) {
                if (isContainer(checked[element[1]])) {
                    checked = checked[element[1]];
                } else {
                    checked[element[1]] = value;
                    return true;
                }
            } else {
                return false;
            }
        } else if (element[5]) {
            if (Array.isArray(checked)) {
                const numb = parseInt(element[5]);
                if (Array.from(checked).length <= numb) {
                    return false;
                } else {
                    if (isContainer(checked[numb])) {
                        checked = checked[numb];
                    } else {
                        checked[element[5]] = value;
                        return true;
                    }
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
        match = matches.next();
    }
    return false;
}

export { Cmd, CmdBasicInfoIface, CmdIface, SetCmdProp, CmdTypes };
