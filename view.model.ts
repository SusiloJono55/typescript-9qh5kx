import { Cmd, CmdIface, CmdTypes } from './command.model';
import {
    ChildConnector,
    ChildConnectorIface,
    ParentConnector,
    ParentConnectorIface,
} from './connection.model';
import { CmdSlots, Slot, SlotName, SlotType } from './query.model';

const cmdType: CmdTypes = 'VIEW';

interface ViewCmdProps {
    columns: string;
    from: string;
    into: string;
}

interface ViewCmdState {
    node_type: CmdTypes;
    props: ViewCmdProps;
}

class ViewCmd extends Cmd implements CmdIface {
    private state: ViewCmdState;
    private fromConnector: ChildConnectorIface;
    private intoConnector: ParentConnectorIface;

    constructor(state?: ViewCmdState) {
        super(cmdType);

        if (state) {
            this.state = state;
        } else {
            this.state = {
                node_type: cmdType,
                props: {
                    columns: '',
                    from: '',
                    into: '',
                },
            };
        } 
        super.SetNewProp(this.state.props);


        this.fromConnector = new ChildConnector(
            "INPUT1",
            "",
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
            "OUTPUT1",
            "",
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

    GetInConnector(name: SlotName, label?: string): ChildConnectorIface {
        if (name === 'INPUT1') {
            return this.fromConnector;
        }
        return null;
    }

    GetOutConnector(name: SlotName, label?: string): ParentConnectorIface {
        if (name === 'OUTPUT1') {
            return this.intoConnector;
        }
        return null;
    }
}

export { ViewCmdState, ViewCmd };
