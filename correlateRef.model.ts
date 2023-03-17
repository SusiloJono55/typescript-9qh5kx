import { Cmd, CmdIface } from './command.model';
import {
  ChildConnector,
  ChildConnectorIface,
  ParentConnector,
  ParentConnectorIface,
} from './connection.model';
import { CmdSlots, Slot, SlotName } from './query.model';

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
  props: CorrelateRefCmdProps;
}

class CorrelateRefCmd extends Cmd implements CmdIface {
  private state: CorrelateRefCmdState;
  private fromConnector: ChildConnectorIface;
  private refConnector: ChildConnectorIface;
  private intoConnector: ParentConnectorIface;
  Slots: Slot[] = CmdSlots['CORRELATE'];

  constructor(state?: CorrelateRefCmdState) {
    super();

    if (state) {
      this.state = state;
    } else {
      this.state = {
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

    this.intoConnector = new ParentConnector(
      () => this.state.props.into,
      (newLabel: string) => {
        this.state.props.into = newLabel;
      },
      this
    );

    this.fromConnector = new ChildConnector(
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

  GenerateProps(): any {
    return this.state.props;
  }
}

export { CorrefSrcObj, CorrelateRefCmdState, CorrelateRefCmd };
