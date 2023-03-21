import { CmdIface, CmdTypes } from './command.model';
import { ChildConnectorIface, ParentConnectorIface } from './connection.model';
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
    coordinate: { x: Number, y: Number };
    node_type: CmdTypes;
    props: any;
}

interface workspaceState {
    cmds: cmdState[],
    connections: { [key: string]: string[][] }
}

class Workspace {
    cmdMap: { [key: string]: CmdIface };
    private primerCmd: { [key: string]: null };

    constructor(wsState?: workspaceState) {
        this.cmdMap = {};
        this.primerCmd = {};
        if (wsState) {
            this.loadCmdFromState(wsState.cmds);

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

    LoadFromPayload(data: {nodes: { [key: string]: any }, model: Object[]}) {
        this.cmdMap = {};
        this.primerCmd = {};

        let cmds: cmdState[] = [];
        for (const id in data.nodes) {
            const cmd: cmdState = {
                uuid: id,
                coordinate: { x: 0, y: 0 },
                node_type: data.nodes[id].node_type as CmdTypes,
                props: data.nodes[id].props
            }
            cmds.push(cmd);
        }
        this.loadCmdFromState(cmds);

        const models = data.model;
        let modelsMap = {};
        for (let i = 0; i < models.length; i++) {
            modelsMap[models[i]["id"]] = models[i];
        }

        for (let i = 0; i < models.length; i++) {
            const model = models[i];
            if ("out" in model) {
                const node = this.cmdMap[model["id"]];
                const isMultipleOut = node.NodeType() == "SELECT" || node.NodeType() == "COPY" || node.NodeType() == "FILTER";
                const outArr = model["out"] as Array<string|null>;
                for (let j = 0; j < outArr.length; j++) {
                    if (outArr[j] === null) {
                        continue
                    }

                    let parentConnector: ParentConnectorIface;
                    let childConnector: ChildConnectorIface;
                    const childNode = this.cmdMap[outArr[j]];
                    const childModel = modelsMap[outArr[j]];
                    const inArr = childModel["in"] as Array<string|null>;
                    let inSlotName: SlotName = "INPUT1";
                    if (childNode.NodeType() === "CORRELATEREF") {
                        if (inArr[1] === model["id"]) {
                            inSlotName = "INPUT2";
                        }
                    }
                    console.log(childNode.NodeType(), inSlotName, inArr , outArr[j])
                    childConnector = childNode.GetInConnector(inSlotName);

                    let outSlotName: SlotName = "OUTPUT1";
                    if (isMultipleOut && j == outArr.length - 1) {
                        outSlotName = "OUTPUT2";
                    }
                    parentConnector = node.GetOutConnector(outSlotName); // TODO: untuk SELECT perlu didevelop lg
                    parentConnector.Connect(childConnector);
                }
            }
        }
    }

    private loadCmdFromState(cmds: cmdState[]) {
        for (let i = 0; i < cmds.length; i++) {
            let cmd: CmdIface;
            switch (cmds[i].node_type) {
                case "SEARCH":
                    let searchState: SearchCmdState = {
                        node_type: cmds[i].node_type,
                        props: cmds[i].props
                    }
                    cmd = new SearchCmd(searchState);
                    break;
                case "CORRELATEREF":
                    let corrState: CorrelateRefCmdState = {
                        node_type: cmds[i].node_type,
                        props: cmds[i].props
                    }
                    cmd = new CorrelateRefCmd(corrState);
                    break;
                case "VIEW":
                    let viewState: ViewCmdState = {
                        node_type: cmds[i].node_type,
                        props: cmds[i].props
                    }
                    cmd = new ViewCmd(viewState);
                    break;
            }

            cmd.SetID(cmds[i].uuid);
            cmd.SetCoordinate(cmds[i].coordinate.x, cmds[i].coordinate.y);
            this.AddCmd(cmds[i].uuid, cmd);
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

    GetPayload(): { nodes: { [key: string]: any }, model: Object[] } {
        let nodes: { [key: string]: any } = {};
        let model: Object[] = [];
        let stateMap: {} = {};
        for (const id in this.primerCmd) {
            const node = this.cmdMap[id];
            this.visitNode(nodes, model, node, stateMap);
        }

        return { nodes: nodes, model: model };
    }

    visitNode(nodes: { [key: string]: any }, model: Object[], node: CmdIface, stateMap: {}) {
        nodes[node.GetID()] = {
            "node_type": node.NodeType(),
            "props": node.GetProps()
        };
        let nodeModel = {
            "id": node.GetID()
        };
        for (let i = 0; i < node.Slots.length; i++) {
            if (node.Slots[i].type == "IN") {
                if (!("in" in nodeModel)) {
                    nodeModel["in"] = [];
                }

                const connector = node.GetInConnector(node.Slots[i].name);
                if (!connector.IsConnected()) {
                    nodeModel["in"].push(null);
                } else {
                    const parentID = connector.GetParentInfo().GetID();
                    if (!(parentID in stateMap)) {
                        break
                    }
                    nodeModel["in"].push(parentID);
                }

                continue
            }

            if (!(node.GetID() in stateMap)) {
                model.push(nodeModel);
                stateMap[node.GetID()] = 1;
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
            this.visitNode(nodes, model, childNode, stateMap);
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
