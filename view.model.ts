import { Cmd, CmdIface } from './command.model';
import {
    ChildConnector,
    ChildConnectorIface,
    Connection,
    ConnectionIface,
    ParentConnector,
    ParentConnectorIface,
} from './connection.model';
import { CmdSlots, Slot, SlotName, SlotType } from './query.model';

interface ViewCmdProps {
    columns: string;
    from: string;
    into: string;
}

interface ViewCmdState {
    props: ViewCmdProps;
}

class ViewCmd extends Cmd implements CmdIface {
    private state: ViewCmdState;
    private fromConnector: ChildConnectorIface;
    private intoConnector: ParentConnectorIface;
    Slots: Slot[] = CmdSlots['VIEW'];

    constructor(state?: ViewCmdState) {
        super();

        if (state) {
            this.state = state;
        } else {
            this.state = {
                props: {
                    columns: '',
                    from: '',
                    into: '',
                },
            };
        }

        this.fromConnector = new ChildConnector(
            (parentLabel: string) => {
                this.state.props.from = parentLabel;
            },
            () => {
                this.state.props.from = '';
            },
            (parentLabel: string) => {
                this.state.props.from = parentLabel;
            },
            this
        );

        this.intoConnector = new ParentConnector(
            () => this.state.props.into,
            (newLabel: string) => {
                this.state.props.into = newLabel;
            },
            this
        );
    }

    SetIntoLabel(newLabel: string) {
        if (this.intoConnector.IsConnected()) {
            this.intoConnector.SetIntoLabel(newLabel);
        } else {
            this.state.props.into = newLabel;
        }
    }

    GetInConnector(name: SlotName, label?: SlotType): ChildConnectorIface {
        if (name === 'INPUT1') {
            return this.fromConnector;
        }
        return null;
    }

    GetOutConnector(name: SlotName, label?: SlotType): ParentConnectorIface {
        if (name === 'OUTPUT1') {
            return this.intoConnector;
        }
        return null;
    }

    GenerateProps(): any {
        return this.state.props;
    }
}

export { ViewCmdState, ViewCmd };
