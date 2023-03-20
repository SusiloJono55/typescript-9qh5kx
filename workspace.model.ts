import { CmdIface, CmdTypes } from './command.model';
import { CorrelateRefCmd, CorrelateRefCmdState } from './correlateRef.model';
import { SlotName } from './query.model';
import { SearchCmd, SearchCmdState } from './search.model';
// import { SelectCmd, SelectCmdState } from './select.model';
import { ViewCmd, ViewCmdState } from './view.model';

const primaryCmd: { [key: string]: null } = {
    "SEARCH": null,
};

interface cmdState {
    uuid: string;
    coordinate: { x: Number; y: Number };
    node_type: CmdTypes;
    props: any;
}

interface workspaceState {
    cmds: cmdState[],
    connections: { [key: string]: string[][] }
}

class Workspace {
    private cmdMap: { [key: string]: CmdIface };
    private primerCmd: { [key: string]: null };

    constructor(wsState?: workspaceState) {
        this.cmdMap = {};
        this.primerCmd = {};
        if (wsState) {
            for (let i = 0; i < wsState.cmds.length; i++) {
                let cmd: CmdIface;
                switch (wsState.cmds[i].node_type) {
                    case "SEARCH":
                        let searchState: SearchCmdState = {
                            node_type: wsState.cmds[i].node_type,
                            props: wsState.cmds[i].props
                        }
                        cmd = new SearchCmd(searchState);
                        break;
                    case "CORRELATE":
                        let corrState: CorrelateRefCmdState = {
                            node_type: wsState.cmds[i].node_type,
                            props: wsState.cmds[i].props
                        }
                        cmd = new CorrelateRefCmd(corrState);
                        break;
                    case "VIEW":
                        let viewState: ViewCmdState = {
                            node_type: wsState.cmds[i].node_type,
                            props: wsState.cmds[i].props
                        }
                        cmd = new ViewCmd(viewState);
                        break;
                }

                cmd.SetID(wsState.cmds[i].uuid);
                cmd.SetCoordinate(wsState.cmds[i].coordinate.x, wsState.cmds[i].coordinate.y);
                this.AddCmd(wsState.cmds[i].uuid, cmd);
            }

            for (const id in wsState.connections) {
                let cmd = this.cmdMap[id];
                for (let i = 0; i < wsState.connections[id].length; i++) {
                    let connector = cmd.GetOutConnector(wsState.connections[id][i][0] as SlotName, wsState.connections[id][i][1]);
                    let childCmd = this.cmdMap[wsState.connections[id][i][2]];
                    let childConnector = childCmd.GetInConnector(wsState.connections[id][i][3] as SlotName, wsState.connections[id][i][4]);
                    connector.Connect(childConnector);
                }
            }
        }
    }

    AddCmd(ID: string, cmd: CmdIface) {
        if (isPrimaryCmd(cmd)) {
            this.primerCmd[ID] = null;
        }
        this.cmdMap[ID] = cmd;
    }

    GetCmdByID(ID: string): CmdIface {
        return this.cmdMap[ID];
    }

    RemoveCmd(ID: string) {
        delete this.cmdMap[ID];
        delete this.primerCmd[ID];
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

    GetPayload(): { nodes: any, model: any } {
        let nodes: { [key: string]: any } = {};
        let model: Object[] = [];
        for (const id in this.primerCmd) {
            const node = this.cmdMap[id];
            this.visitNode(nodes, model, node);
        }

        return { nodes: nodes, model: model };
    }

    visitNode(nodes: { [key: string]: any }, model: Object[], node: CmdIface) {
        nodes[node.GetID()] = node.GetProps();
        let nodeModel = {
            "id": node.GetID()
        };
        model.push(nodeModel);
        for (let i = 0; i < node.Slots.length; i++) {
            if (node.Slots[i].type == "IN") {
                if (!("in" in nodeModel)) {
                    nodeModel["in"] = [];
                }

                const connector = node.GetInConnector(node.Slots[i].name);
                if (!connector.IsConnected()) {
                    nodeModel["in"].push(null);
                } else {
                    nodeModel["in"].push(connector.GetParentInfo().GetID());
                }

                continue
            }

            if (!("out" in nodeModel)) {
                nodeModel["out"] = [];
            }

            const connector = node.GetOutConnector(node.Slots[i].name);
            if (!connector.IsConnected()) {
                nodeModel["out"].push(null);
                continue
            }

            nodeModel["out"].push(connector.GetChildInfo().GetID());
            const childNode = this.cmdMap[connector.GetChildInfo().GetID()];
            this.visitNode(nodes, model, childNode);
        }
    }

    GenerateState(): workspaceState {
        let cmds = [];
        let connections = {};
        for (const id in this.cmdMap) {
            const cmd: cmdState = {
                uuid: this.cmdMap[id].GetID(),
                coordinate: this.cmdMap[id].GetCoordinate(),
                node_type: this.cmdMap[id].NodeType(),
                props: this.cmdMap[id].GetProps(),
            }

            let conns: string[][] = [];
            for (let i = 0; i < this.cmdMap[id].Slots.length; i++) {
                if (this.cmdMap[id].Slots[i].type == "OUT") {
                    const connector = this.cmdMap[id].GetOutConnector(this.cmdMap[id].Slots[i].name);
                    if (connector.IsConnected()) {
                        conns.push([connector.GetSlotName(), connector.GetLabel(), connector.GetChildInfo().GetID(), connector.GetOppSlotName(), connector.GetOppLabel()]);
                    }
                }
            }

            cmds.push(cmd);
            connections[id] = conns;
        }

        return { cmds: cmds, connections: connections };
    }
}

function isPrimaryCmd(cmd: CmdIface): boolean {
    return cmd.NodeType() in primaryCmd;
}

export { Workspace };
