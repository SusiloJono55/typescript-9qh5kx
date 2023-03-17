import { CmdBasicInfoIface } from './command.model';
import { v4 } from 'uuid';

interface ConnectorIface {
    GetID(): string;
    OnDisconnect(): void;
    IsConnected(): boolean;
    GetInfo(): CmdBasicInfoIface;
    GetOppositeInfo(): CmdBasicInfoIface;
    IsChecked(): boolean;
    SwitchToggle(): void;
    Disconnect(): void;
}

interface ParentConnectorIface extends ConnectorIface {
    Connect(child: ChildConnectorIface): boolean;
    SetIntoLabel(newLabel: string): void;
    GetIntoLabel(): string;
    GetChildInfo(): CmdBasicInfoIface;
}

interface ChildConnectorIface extends ConnectorIface {
    OnConnected(getParentIntoLabelCB: () => string, conn: ConnectionIface): void;
    SetLabelByParent(newLabel: string): void;
    GetParentInfo(): CmdBasicInfoIface;
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
}

class ParentConnector implements ParentConnectorIface {
    private uuid: string;
    private connection: ConnectionIface;
    private cmdGetIntoLabelCB: () => string;
    private cmdSetIntoLabelCB: (newLabel: string) => void;
    private basicInfo: CmdBasicInfoIface;
    private check: boolean;

    constructor(
        cmdGetIntoLabelCB: () => string,
        cmdSetIntoLabelCB: (newLabel: string) => void,
        basicInfo: CmdBasicInfoIface
    ) {
        this.uuid = v4();
        this.cmdGetIntoLabelCB = cmdGetIntoLabelCB;
        this.cmdSetIntoLabelCB = cmdSetIntoLabelCB;
        this.basicInfo = basicInfo;
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

    GetOppositeInfo(): CmdBasicInfoIface {
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

    GetChildInfo(): CmdBasicInfoIface {
        return this.connection.ChildInfo();
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

    constructor(
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

    GetOppositeInfo(): CmdBasicInfoIface {
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

    GetParentInfo(): CmdBasicInfoIface {
        return this.connection.ParentInfo();
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
