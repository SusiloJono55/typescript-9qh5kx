import { CmdIface } from './command.model';
import { CorrelateRefCmd, CorrelateRefCmdState } from './correlateRef.model';
import { SearchCmd, SearchCmdState } from './search.model';
import { SelectCmd, SelectCmdState } from './select.model';
import { ViewCmd, ViewCmdState } from './view.model';

class Workspace {
  cmdMap: { [key: string]: CmdIface };

  constructor() {
    this.cmdMap = {};
  }

  AddCmd(ID: string, cmd: CmdIface) {
    this.cmdMap[ID] = cmd;
  }

  GetCmdByID(ID: string): CmdIface {
    return this.cmdMap[ID];
  }

  RemoveCmd(ID: string) {
    delete this.cmdMap[ID];
  }

  // NewSelectCmd(state?: SelectCmdState): SelectCmd {
  //   const cmd = new SelectCmd(state);
  //   this.AddCmd(cmd.GetID(), cmd);
  //   return cmd;
  // }

  NewSearchCmd(state?: SearchCmdState): SearchCmd {
    const cmd = new SearchCmd(state);
    this.AddCmd(cmd.GetID(), cmd);
    return cmd;
  }

  NewCorrelateRefCmd(state?: CorrelateRefCmdState): CorrelateRefCmd {
    const cmd = new CorrelateRefCmd(state);
    this.AddCmd(cmd.GetID(), cmd);
    return cmd;
  }

  NewViewCmd(state?: ViewCmdState): ViewCmd {
    const cmd = new ViewCmd(state);
    this.AddCmd(cmd.GetID(), cmd);
    return cmd;
  }
}

export { Workspace };
