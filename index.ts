// Import stylesheets
import { CmdIface, SetCmdProp } from './command.model';
import { ChildConnectorIface, ParentConnectorIface } from './connection.model';
import { SearchCmd } from './search.model';
import { ViewCmd } from './view.model';
import { Workspace } from './workspace.model';

function SetCmdPropTest() {
    interface ca {
        x: number,
        y: number
    }

    interface ab {
        a: string,
        b: ca[],
        c: ca,
        d: string[],
    }

    interface yoyo {
        props: ab
    }

    let asdf: ab = {
        a: "a",
        b: [
            { x: 1, y: 2 },
            { x: 3, y: 4 }
        ],
        c: { x: 5, y: 6 },
        d: ["b", "c"]
    }

    let y1: yoyo = {
        props: asdf
    }

    SetCmdProp(y1.props, "b[1].y", 88);
    console.log(y1.props.b)
    SetCmdProp(y1.props, "c.y", 88)
    console.log(y1)
    SetCmdProp(y1.props, "d[1]", "SKJDHSKD")
    console.log(y1)
}

SetCmdPropTest();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function demoWorkspace() {
    let workspace = new Workspace();

    let search_1 = workspace.NewSearchCmd();
    search_1.SetIntoLabel("search_1");
    let search_1_out_1 = search_1.GetOutConnector("OUTPUT1");

    let search_2 = workspace.NewSearchCmd();
    search_2.SetIntoLabel("search_2");
    let search_2_out_1 = search_2.GetOutConnector("OUTPUT1");

    let view_1 = workspace.NewViewCmd();
    view_1.SetIntoLabel("view_1");

    let view_2 = workspace.NewViewCmd();
    view_2.SetIntoLabel("view_2");
    let view_2_in_1 = view_2.GetInConnector("INPUT1");
    let view_2_out_1 = view_2.GetOutConnector("OUTPUT1");
    search_1_out_1.Connect(view_2_in_1);

    let view_3 = workspace.NewViewCmd();
    view_3.SetIntoLabel("view_3");
    let view_3_in_1 = view_3.GetInConnector("INPUT1");

    let correlate_1 = workspace.NewCorrelateRefCmd();
    correlate_1.SetIntoLabel("correlate_1");
    let correlate_1_in_1 = correlate_1.GetInConnector("INPUT1");
    let correlate_1_in_2 = correlate_1.GetInConnector("INPUT2");

    view_2_out_1.Connect(correlate_1_in_1);
    search_2_out_1.Connect(correlate_1_in_2);

    let correlate_1_out_1 = correlate_1.GetOutConnector("OUTPUT1");
    correlate_1_out_1.Connect(view_3_in_1);

    const wsState = workspace.GenerateState();
    console.log("Generated workspace's state :", wsState);
    console.log(JSON.stringify(wsState));

    let workspace_2 = new Workspace(wsState);
    const wsState_2 = workspace_2.GenerateState();
    console.log("Generated workspace_2's state :", wsState_2);
    console.log(JSON.stringify(wsState_2));

    let workspace_3 = new Workspace();
    workspace_3.LoadFromPayload(workspace.GetPayload());
    console.log(JSON.stringify(workspace.GetPayload()));
    console.log(JSON.stringify(workspace_3.GetPayload()));
}

demoWorkspace();

async function demo() {
    let searchCmd: CmdIface = new SearchCmd();
    console.log('SEARCH CMD created :', searchCmd);
    await sleep(100);
    searchCmd.SetIntoLabel('search_1');
    console.log('set INTO LABEL search_1 on SEARCH CMD :', searchCmd);
    await sleep(100);

    let viewCmd: CmdIface = new ViewCmd();
    console.log('VIEW CMD created :', viewCmd);
    await sleep(100);
    viewCmd.SetIntoLabel('view_1');
    console.log('set INTO LABEL search_1 on VIEW CMD :', viewCmd);
    await sleep(100);

    let searchCmdOut1Connector: ParentConnectorIface = searchCmd.GetOutConnector('OUTPUT1');
    let viewCmdIn1Connector: ChildConnectorIface = viewCmd.GetInConnector('INPUT1');
    const isConnected = searchCmdOut1Connector.Connect(viewCmdIn1Connector);
    console.log('SEARCH CMD connect to VIEW CMD :', isConnected);
    console.log('SEARCH CMD after connect to VIEW CMD :', searchCmd);
    console.log('VIEW CMD after connected to SEARCH CMD :', viewCmd);
    console.log("VIEW CMD 'from' after connected to SEARCH CMD :", viewCmd.GetProps()['from']);
    await sleep(100);

    searchCmd.SetIntoLabel('new_search_1');
    console.log("VIEW CMD 'from' after SEARCH CMD's label changed :", viewCmd.GetProps()['from']);
    await sleep(100);

    viewCmd.SetCoordinate(100, 200);
    viewCmd.SetProp("columns", "TESCOLUMN");
    console.log("VIEW CMD 'from' after columns updated via SETPROPS :", viewCmd.GetProps()["columns"])

    if (searchCmdOut1Connector.IsConnected()) {
        console.log("get VIEW CMD's coordinate from SEARCH CMD :", searchCmd.GetOutConnector('OUTPUT1').GetChildInfo().GetCoordinate());
        console.log("get VIEW CMD's uuid from SEARCH CMD :", searchCmd.GetOutConnector('OUTPUT1').GetChildInfo().GetID());
        searchCmdOut1Connector.Disconnect();
    }
    await sleep(100);

    console.log("VIEW CMD 'from' after disconnected from SEARCH CMD :", viewCmd.GetProps()['from']);

    let ws = new Workspace();
    ws.AddCmd(searchCmd.GetID(), searchCmd);
    ws.AddCmd(viewCmd.GetID(), viewCmd);
    console.log(ws.GetPayload(), ws.GetPayload().model[0])
}

demo();
