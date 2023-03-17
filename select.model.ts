import { Cmd, CmdBasicInfoIface } from './command.model';
import {
  ChildConnector,
  ChildConnectorIface,
  ConnectionIface,
  ParentConnector,
  ParentConnectorIface,
} from './connection.model';
import { CmdIface, Slot } from './query.model';

type SelectFromType = 'CSV' | 'GZ' | 'TABLE';
type SelectJoinType =
  | 'FULL OUTER JOIN'
  | 'LEFT OUTER JOIN'
  | 'RIGHT OUTER JOIN'
  | 'INNER JOIN';

interface FromTableObj {
  tables: string;
}

interface FromCSVObj {
  path: string;
  alias?: string;
}

interface FromGZObj {
  path: string;
  alias?: string;
}

interface FromFileObj {
  path: string;
}

interface JoinObj {
  type: SelectJoinType;
  target: string;
  expressions: string;
}

interface SelectCmdProps {
  selectors: string;
  from_type: SelectFromType;
  from_table?: FromTableObj;
  from_csv?: FromCSVObj;
  from_gz?: FromGZObj;
  from_file?: FromFileObj;
  join?: JoinObj[];
  where?: string;
  order_by?: string;
  has_limit: boolean;
  has_offset: boolean;
  limit?: Number;
  offset?: Number;
  group_by?: string;
  into: string;
}

interface SelectCmdState {
  props: SelectCmdProps;

  fromSrcMap: { [key: string]: Number };
}

class SelectCmd extends Cmd implements CmdIface {
  state: SelectCmdState;
  fromConnectors: { [key: string]: ChildConnectorIface };
  intoConnector: ParentConnectorIface;
  branchConnectors: { [key: string]: ParentConnectorIface };
  Slots: Slot[];

  constructor(state?: SelectCmdState) {
    super();

    if (state) {
      this.state = state;
    } else {
      this.state = {
        props: {
          selectors: '*',
          from_type: 'TABLE',
          from_table: {
            tables: '',
          },
          has_limit: false,
          has_offset: false,
          into: '',
        },
        fromSrcMap: {},
      };
    }

    this.intoConnector = new ParentConnector(
      () => this.state.props.into,
      (newLabel: string) => {
        this.state.props.into = newLabel;
      },
      this
    );

    this.fromConnectors = {};
    this.branchConnectors = {};
  }

  // SetAlias(alias: string) {
  //     if (this.node.from_type == "CSV" || this.node.from_type == "GZ") {
  //         this.SetNameOut2(alias);
  //     }
  // }

  ChangeFromType(newType: SelectFromType) {
    this.state.props.from_type = newType;
    switch (newType) {
      case 'TABLE': {
        this.state.fromSrcMap = {};
        this.fromConnectors = {};
        this.branchConnectors = {};
        this.state.props.from_table = {
          tables: '',
        };
        delete this.state.props.from_csv;
        delete this.state.props.from_gz;
        break;
      }
      case 'CSV': {
        this.state.fromSrcMap = {};
        this.fromConnectors = {};
        this.branchConnectors = {};
        this.state.props.from_csv = {
          path: '',
          alias: '',
        };
        delete this.state.props.from_table;
        delete this.state.props.from_gz;
        break;
      }
      case 'GZ': {
        this.state.fromSrcMap = {};
        this.fromConnectors = {};
        this.branchConnectors = {};
        this.state.props.from_gz = {
          path: '',
          alias: '',
        };
        delete this.state.props.from_csv;
        delete this.state.props.from_table;
        break;
      }
    }
  }

  // SetNameOut1(outName: string) {
  //     const preName = this.node.into;
  //     this.node.into = outName;
  //     // if (this.out1) {
  //     //     this.out1.UpdateSrcByParent(preName, outName);
  //     // }
  // }

  // SetNameOut2(outName: string) {
  //     if (this.node.from_type == "CSV" || this.node.from_type == "GZ") {
  //         const prevName: string = this.node.from_csv ? this.node.from_csv.alias : this.node.from_gz ? this.node.from_gz.alias : "";
  //         // if (this.out2) {
  //         //     this.out2.UpdateSrcByParent(prevName, outName);
  //         // }
  //     }
  // }

  // UpdateSrcByParent(prevName: string, newName: string) {
  //     if (this.node.from_type == "TABLE") {
  //         delete this.node.fromSrcMap[prevName];
  //         this.node.fromSrcMap[newName] = 1;
  //         let names = [];
  //         Object.entries(this.node.fromSrcMap).forEach(([key, value], index) => {
  //             names.push(key);
  //         })
  //         this.node.from_table.tables = names.join(", ");
  //     }
  // }

  GetIntoConnector(): ParentConnectorIface {
    return this.intoConnector;
  }

  GetFromConnector(label: string): ChildConnectorIface {
    if (this.state.props.from_type != 'TABLE') {
      return null;
    }

    if (label in this.fromConnectors) {
      return this.fromConnectors[label];
    }

    const conn = new fromConnector(
      (parentLabel: string) => {
        this.state.fromSrcMap[parentLabel] = 1;
        let names = [];
        Object.entries(this.state.fromSrcMap).forEach(([key, value], index) => {
          names.push(key);
        });
        this.state.props.from_table.tables = names.join(', ');
      },
      () => {
        let names = [];
        Object.entries(this.state.fromSrcMap).forEach(([key, value], index) => {
          names.push(key);
        });
        this.state.props.from_table.tables = names.join(', ');
      },
      (parentLabel: string) => {
        let names = [];
        Object.entries(this.state.fromSrcMap).forEach(([key, value], index) => {
          names.push(key);
        });
        this.state.props.from_table.tables = names.join(', ');
      },
      this,
      (label: string, connector: ChildConnectorIface) => {
        this.fromConnectors[label] = connector;
      },
      (label: string) => {
        delete this.state.fromSrcMap[label];
        delete this.fromConnectors[label];
      },
      (prevLabel: string, newLabel: string) => {
        delete this.state.fromSrcMap[prevLabel];
        const conn = this.fromConnectors[prevLabel];
        delete this.fromConnectors[prevLabel];

        this.state.fromSrcMap[newLabel] = 1;
        this.fromConnectors[newLabel] = conn;
      }
    );

    return conn;
  }
}

class fromConnector extends ChildConnector implements ChildConnectorIface {
  private label: string;
  private onConnectedCB2: (
    label: string,
    connector: ChildConnectorIface
  ) => void;
  private onDisconnectedCB2: (label: string) => void;
  private onSetSourcelabelCB2: (prevLabel: string, newLabel: string) => void;
  constructor(
    onConnectedCB: (parentLabel: string) => void,
    onDisconnectedCB: () => void,
    onSetSourcelabelCB: (parentLabel: string) => void,
    basicInfo: CmdBasicInfoIface,
    onConnectedCB2: (label: string, connector: ChildConnectorIface) => void,
    onDisconnectedCB2: (label: string) => void,
    onSetSourcelabelCB2: (prevLabel: string, newLabel: string) => void
  ) {
    super(onConnectedCB, onDisconnectedCB, onSetSourcelabelCB, basicInfo);
    this.onConnectedCB2 = onConnectedCB2;
    this.onDisconnectedCB2 = onDisconnectedCB2;
    this.onSetSourcelabelCB2 = onSetSourcelabelCB2;
  }

  override OnConnected(
    getParentIntoLabelCB: () => string,
    conn: ConnectionIface
  ) {
    super.OnConnected(getParentIntoLabelCB, conn);
    this.onConnectedCB2(getParentIntoLabelCB(), this);
    this.label = getParentIntoLabelCB();
  }

  override OnDisconnect(): void {
    this.onDisconnectedCB2(this.label);
    super.OnDisconnect();
  }

  override SetLabelByParent(newLabel: string): void {
    this.onSetSourcelabelCB2(this.label, newLabel);
    this.label = newLabel;
    super.SetLabelByParent(newLabel);
  }
}

export {
  SelectFromType,
  SelectJoinType,
  FromCSVObj,
  FromGZObj,
  FromFileObj,
  FromTableObj,
  SelectCmdState,
  SelectCmd,
};
