import {
    subscribeForContractEvent,
    subscribeForContractEventHandler
} from "./handlers";
import {
    EnsRegisterContract,
    EnsNameRegisteredEventFilter,
    EnsNameRenewedEventFilter,
    EnsTransferEventFilter,
} from "./constants";

//=====================================Main====================================

async function Subscribe() {
    subscribeForContractEvent(
        {
            contract: EnsRegisterContract,
            eventFilter: EnsNameRegisteredEventFilter,
            eventName: "NameRegistered"
        }, subscribeForContractEventHandler
    );
    subscribeForContractEvent(
        {
            contract: EnsRegisterContract,
            eventFilter: EnsNameRenewedEventFilter,
            eventName: "NameRenewed"
        }, subscribeForContractEventHandler
    );
    subscribeForContractEvent(
        {
            contract: EnsRegisterContract,
            eventFilter: EnsTransferEventFilter,
            eventName: "Transfer"
        }, subscribeForContractEventHandler
    );
}

// Used only for testing.
async function main() {

    // Start subscribing events 
    console.log("⏳⏳⏳ Start subscribing...\n");

    Subscribe();
    
}

main();