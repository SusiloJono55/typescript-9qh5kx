import { Cmd, CmdIface, CmdTypes } from './command.model';
import {
    ChildConnectorIface,
    ParentConnector,
    ParentConnectorIface,
} from './connection.model';
import { CmdSlots, Slot, SlotName, SlotType } from './query.model';

const cmdType: CmdTypes = 'SEARCH';

interface SearchCmdProps {
    search_str?: string;
    paths: string[];
    has_limit: boolean;
    has_offset: boolean;
    limit?: number;
    offset?: number;
    is_csv: boolean;
    is_folder: boolean;
    include_header: boolean;
    csv_separator?: string;
    csv_columns?: string;
    label: string;
}

interface SearchCmdState {
    node_type: CmdTypes;
    props: SearchCmdProps;
}

class SearchCmd extends Cmd implements CmdIface {
    private state: SearchCmdState;
    private outConnector: ParentConnectorIface;

    constructor(state?: SearchCmdState) {
        super(cmdType);

        if (state) {
            this.state = state;
        } else {
            this.state = {
                node_type: cmdType,
                props: {
                    paths: [],
                    has_limit: false,
                    has_offset: false,
                    is_csv: false,
                    is_folder: false,
                    include_header: false,
                    label: '',
                },
            };
        }        
        super.SetNewProp(this.state.props);


        this.outConnector = new ParentConnector(
            "OUTPUT1",
            "",
            () => this.state.props.label,
            (newLabel: string) => {
                this.state.props.label = newLabel;
            },
            this
        );
    }

    SetIntoLabel(label: string) {
        if (this.outConnector.IsConnected()) {
            this.outConnector.SetIntoLabel(label);
        } else {
            this.state.props.label = label;
        }
    }

    GetInConnector(name: SlotName, label?: string): ChildConnectorIface {
        return null;
    }

    GetOutConnector(name: SlotName, label?: string): ParentConnectorIface {
        if (name === 'OUTPUT1') {
            return this.outConnector;
        }
        return null;
    }
}

export { SearchCmdState, SearchCmd };
