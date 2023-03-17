// Import stylesheets
import { CmdIface } from './command.model';
import { ChildConnectorIface, ParentConnectorIface } from './connection.model';
import { SearchCmd } from './search.model';
import { ViewCmd } from './view.model';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function demo() {
    let searchCmd: CmdIface = new SearchCmd();
    console.log('SEARCH CMD created :', searchCmd);
    await sleep(1000);
    searchCmd.SetIntoLabel('search_1');
    console.log('set INTO LABEL search_1 on SEARCH CMD :', searchCmd);
    await sleep(1000);

    let viewCmd: CmdIface = new ViewCmd();
    console.log('VIEW CMD created :', viewCmd);
    await sleep(1000);
    viewCmd.SetIntoLabel('view_1');
    console.log('set INTO LABEL search_1 on VIEW CMD :', viewCmd);
    await sleep(1000);

    let searchCmdOut1Connector: ParentConnectorIface = searchCmd.GetOutConnector('OUTPUT1');
    let viewCmdIn1Connector: ChildConnectorIface = viewCmd.GetInConnector('INPUT1');
    const isConnected = searchCmdOut1Connector.Connect(viewCmdIn1Connector);
    console.log('SEARCH CMD connect to VIEW CMD :', isConnected);
    console.log('SEARCH CMD after connect to VIEW CMD :', searchCmd);
    console.log('VIEW CMD after connected to SEARCH CMD :', viewCmd);
    console.log("VIEW CMD 'from' after connected to SEARCH CMD :", viewCmd.GenerateProps()['from']);
    await sleep(1000);

    searchCmd.SetIntoLabel('new_search_1');
    console.log("VIEW CMD 'from' after SEARCH CMD's label changed :", viewCmd.GenerateProps()['from']);
    await sleep(1000);

    viewCmd.SetCoordinate(100, 200);

    if (searchCmdOut1Connector.IsConnected()) {
        console.log("get VIEW CMD's coordinate from SEARCH CMD :", searchCmd.GetOutConnector('OUTPUT1').GetChildInfo().GetCoordinate());
        console.log("get VIEW CMD's uuid from SEARCH CMD :", searchCmd.GetOutConnector('OUTPUT1').GetChildInfo().GetID());
        searchCmdOut1Connector.Disconnect();
    }
    await sleep(1000);

    console.log("VIEW CMD 'from' after disconnected from SEARCH CMD :", viewCmd.GenerateProps()['from']);
}

demo();
