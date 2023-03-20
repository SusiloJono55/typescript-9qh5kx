import { Cmd, CmdIface, CmdTypes } from './command.model';
import {
    ChildConnector,
    ChildConnectorIface,
    ParentConnector,
    ParentConnectorIface,
} from './connection.model';
import { CmdSlots, Slot, SlotName, SlotType } from './query.model';

const cmdType: CmdTypes = 'CORRELATE';

interface CorrefSrcObj {
    table: string;
    cols: string;
}

interface CorrelateRefCmdProps {
    src: CorrefSrcObj;
    ref: CorrefSrcObj;
    into: string;
}

interface CorrelateRefCmdState {
    node_type: CmdTypes;
    props: CorrelateRefCmdProps;
}

class CorrelateRefCmd extends Cmd implements CmdIface {
    private state: CorrelateRefCmdState;
    private fromConnector: ChildConnectorIface;
    private refConnector: ChildConnectorIface;
    private intoConnector: ParentConnectorIface;

    constructor(state?: CorrelateRefCmdState) {
        super(cmdType);

        if (state) {
            this.state = state;
        } else {
            this.state = {
                node_type: cmdType,
                props: {
                    src: {
                        table: '',
                        cols: '',
                    },
                    ref: {
                        table: '',
                        cols: '',
                    },
                    into: '',
                },
            };
        }
        super.SetNewProp(this.state.props);

        this.intoConnector = new ParentConnector(
            "OUTPUT1",
            "",
            () => this.state.props.into,
            (newLabel: string) => {
                this.state.props.into = newLabel;
            },
            this
        );

        this.fromConnector = new ChildConnector(
            "INPUT1",
            "",
            (parentLabel: string) => {
                this.state.props.src.table = parentLabel;
                this.state.props.src.cols = '';
            },
            () => {
                this.state.props.src.table = '';
                this.state.props.src.cols = '';
            },
            (parentLabel: string) => {
                this.state.props.src.table = parentLabel;
            },
            this
        );

        this.refConnector = new ChildConnector(
            "INPUT2",
            "",
            (parentLabel: string) => {
                this.state.props.ref.table = parentLabel;
                this.state.props.ref.cols = '';
            },
            () => {
                this.state.props.ref.table = '';
                this.state.props.ref.cols = '';
            },
            (parentLabel: string) => {
                this.state.props.ref.table = parentLabel;
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
        switch (name) {
            case 'INPUT1': {
                return this.fromConnector;
            }
            case 'INPUT2': {
                return this.refConnector;
            }
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

export { CorrefSrcObj, CorrelateRefCmdState, CorrelateRefCmd };
