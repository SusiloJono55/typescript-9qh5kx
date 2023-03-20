import { CmdBasicInfoIface } from './command.model';
import { v4 } from 'uuid';
import { Slot, SlotName } from './query.model';

interface ConnectorIface {
    GetID(): string;
    OnDisconnect(): void;
    IsConnected(): boolean;
    GetInfo(): CmdBasicInfoIface;
    GetOppositeInfo(): CmdBasicInfoIface | null;
    IsChecked(): boolean;
    SwitchToggle(): void;
    Disconnect(): void;
    GetSlotName(): SlotName;
    GetOppSlotName(): SlotName | null;
    GetLabel(): string;
    GetOppLabel(): string | null;
}

interface ParentConnectorIface extends ConnectorIface {
    Connect(child: ChildConnectorIface): boolean;
    SetIntoLabel(newLabel: string): void;
    GetIntoLabel(): string;
    GetChildInfo(): CmdBasicInfoIface | null;
}

interface ChildConnectorIface extends ConnectorIface {
    OnConnected(getParentIntoLabelCB: () => string, conn: ConnectionIface): void;
    SetLabelByParent(newLabel: string): void;
    GetParentInfo(): CmdBasicInfoIface | null;
}

interface ConnectionIface {
    GetID(): string;
    Cancel(): void;
    Connect(): void;
    State(): boolean;
    SetChildLabel(newLabel: string): void;
    Disconnect(): void;
    ParentInfo(): CmdBasicInfoIface;
    ChildInfo(): CmdBasicInfoIface;
    ParentSlotName(): SlotName;
    ParentLabel(): string;
    ChildSlotName(): SlotName;
    ChildLabel(): string;
}

class Connection implements ConnectionIface {
    private uuid: string;
    private state: boolean;
    private getParentIntoLabelCB: () => string;
    private parentOnDisconnectCB: () => void;
    private childOnConnectedCB: (
        connGetLabelCB: () => string,
        conn: ConnectionIface
    ) => void;
    private setChildSourceLabelCB: (newLabel: string) => void;
    private childOnDisconnectCB: () => void;
    private parentInfo: CmdBasicInfoIface;
    private childInfo: CmdBasicInfoIface;
    private parentSlotName: SlotName;
    private childSlotName: SlotName;
    private parentLabel: string;
    private childLabel: string;

    constructor(parent: ParentConnectorIface, child: ChildConnectorIface) {
        this.uuid = v4();
        this.getParentIntoLabelCB = () => parent.GetIntoLabel();
        this.parentOnDisconnectCB = () => parent.OnDisconnect();
        this.childOnConnectedCB = (
            connGetLabelCB: () => string,
            conn: ConnectionIface
        ) => {
            child.OnConnected(connGetLabelCB, conn);
        };
        this.setChildSourceLabelCB = (newLabel: string) =>
            child.SetLabelByParent(newLabel);
        this.childOnDisconnectCB = () => child.OnDisconnect();
        this.state = false;
        this.parentInfo = parent.GetInfo();
        this.childInfo = child.GetInfo();
        this.parentSlotName = parent.GetSlotName();
        this.childSlotName = child.GetSlotName();
    }

    GetID(): string {
        return this.uuid;
    }

    Cancel() {
        this.getParentIntoLabelCB = () => '';
        this.parentOnDisconnectCB = () => { };
        this.childOnConnectedCB = (connGetLabelCB: () => string) => { };
        this.setChildSourceLabelCB = (newLabel: string) => { };
        this.childOnDisconnectCB = () => { };
        this.state = false;
    }

    Connect() {
        this.childOnConnectedCB(this.getParentIntoLabelCB, this);
        this.state = true;
    }

    SetChildLabel(newLabel: string) {
        this.setChildSourceLabelCB(newLabel);
    }

    State(): boolean {
        return this.state;
    }

    Disconnect() {
        this.childOnDisconnectCB();
        this.parentOnDisconnectCB();
    }

    ParentInfo(): CmdBasicInfoIface {
        return this.parentInfo;
    }

    ChildInfo(): CmdBasicInfoIface {
        return this.childInfo;
    }

    ParentSlotName(): SlotName {
        return this.parentSlotName;
    }

    ChildSlotName(): SlotName {
        return this.childSlotName;
    }

    ParentLabel(): string {
        return this.parentLabel;
    }

    ChildLabel(): string {
        return this.childLabel;
    }
}

class ParentConnector implements ParentConnectorIface {
    private uuid: string;
    private connection: ConnectionIface;
    private cmdGetIntoLabelCB: () => string;
    private cmdSetIntoLabelCB: (newLabel: string) => void;
    private basicInfo: CmdBasicInfoIface;
    private check: boolean;
    private slotName: SlotName;
    private label: string;

    constructor(
        slotName: SlotName,
        label: string,
        cmdGetIntoLabelCB: () => string,
        cmdSetIntoLabelCB: (newLabel: string) => void,
        basicInfo: CmdBasicInfoIface
    ) {
        this.uuid = v4();
        this.cmdGetIntoLabelCB = cmdGetIntoLabelCB;
        this.cmdSetIntoLabelCB = cmdSetIntoLabelCB;
        this.basicInfo = basicInfo;
        this.slotName = slotName;
        this.label = label;
    }

    GetID(): string {
        return this.uuid;
    }

    OnDisconnect(): void {
        this.connection = null;
    }

    IsConnected(): boolean {
        return this.connection && this.connection.State();
    }

    GetInfo(): CmdBasicInfoIface {
        return this.basicInfo;
    }

    GetOppositeInfo(): CmdBasicInfoIface | null {
        if (!this.IsConnected()) {
            return null;
        }
        return this.connection.ChildInfo();
    }

    IsChecked(): boolean {
        return this.check;
    }

    SwitchToggle(): void {
        this.check = !this.check;
    }

    Disconnect(): void {
        if (this.IsConnected()) {
            this.connection.Disconnect();
        }
    }

    Connect(child: ChildConnectorIface): boolean {
        if (this.IsConnected() || child.IsConnected()) {
            return false;
        }
        let connection = new Connection(this, child);
        connection.Connect();
        this.connection = connection;
        return true;
    }

    SetIntoLabel(newLabel: string): void {
        if (this.IsConnected()) {
            this.cmdSetIntoLabelCB(newLabel);
            this.connection.SetChildLabel(newLabel);
        }
    }

    GetIntoLabel(): string {
        return this.cmdGetIntoLabelCB();
    }

    GetChildInfo(): CmdBasicInfoIface | null {
        if (!this.connection) {
            return null;
        }
        return this.connection.ChildInfo();
    }

    GetSlotName(): SlotName {
        return this.slotName;
    }

    GetOppSlotName(): SlotName | null {
        if (!this.connection) {
            return null;
        }

        return this.connection.ChildSlotName();
    }

    GetLabel(): string {
        return this.label;
    }

    GetOppLabel(): string | null {
        if (!this.connection) {
            return null;
        }

        return this.connection.ChildLabel();
    }
}

class ChildConnector implements ChildConnectorIface {
    private uuid: string;
    private connection: ConnectionIface;
    private onConnectedCB: (parentLabel: string) => void;
    private onDisconnectedCB: () => void;
    private onSetSourcelabelCB: (parentLabel: string) => void;
    private basicInfo: CmdBasicInfoIface;
    private check: boolean;
    private slotName: SlotName;
    private label: string;

    constructor(
        slotName: SlotName,
        label: string,
        onConnectedCB: (parentLabel: string) => void,
        onDisconnectedCB: () => void,
        onSetSourcelabelCB: (parentLabel: string) => void,
        basicInfo: CmdBasicInfoIface
    ) {
        this.uuid = v4();
        this.onConnectedCB = onConnectedCB;
        this.onDisconnectedCB = onDisconnectedCB;
        this.onSetSourcelabelCB = onSetSourcelabelCB;
        this.basicInfo = basicInfo;
        this.slotName = slotName;
        this.label = label;
    }

    GetID(): string {
        return this.uuid;
    }

    OnDisconnect() {
        this.onDisconnectedCB();
        this.connection = null;
    }

    IsConnected(): boolean {
        return this.connection && this.connection.State();
    }

    GetInfo(): CmdBasicInfoIface {
        return this.basicInfo;
    }

    GetOppositeInfo(): CmdBasicInfoIface | null {
        if (!this.connection) {
            return null;
        }
        return this.connection.ParentInfo();
    }

    IsChecked(): boolean {
        return this.check;
    }

    SwitchToggle(): void {
        this.check = !this.check;
    }

    Disconnect(): void {
        if (this.IsConnected()) {
            this.connection.Disconnect();
        }
    }

    OnConnected(getParentIntoLabelCB: () => string, conn: ConnectionIface) {
        this.onConnectedCB(getParentIntoLabelCB());
        this.connection = conn;
    }

    SetLabelByParent(newLabel: string): void {
        if (this.IsConnected()) {
            this.onSetSourcelabelCB(newLabel);
        }
    }

    GetParentInfo(): CmdBasicInfoIface | null {
        if (!this.connection) {
            return null;
        }
        return this.connection.ParentInfo();
    }

    GetSlotName(): SlotName {
        return this.slotName;
    }

    GetOppSlotName(): SlotName | null {
        if (!this.connection) {
            return null;
        }

        return this.connection.ParentSlotName();
    }

    GetLabel(): string {
        return this.label;
    }

    GetOppLabel(): string | null {
        if (!this.connection) {
            return null;
        }

        return this.connection.ParentLabel();
    }
}

export {
    ChildConnectorIface,
    ParentConnectorIface,
    ConnectionIface,
    Connection,
    ParentConnector,
    ChildConnector,
};
