import { BigNumber, ethers } from "ethers";
import {
  ZERO_ADDRESS
} from "./constants";

//================================Block querying / subscription helper=================================

type QueryBlockForContractEventOptions = {
  startBlock: number;
  endBlock: number;
  contract: ethers.Contract;
  eventFilter: ethers.EventFilter;
  eventName: string;
}

type SubscribeForContractEventOptions = {
  contract: ethers.Contract;
  eventFilter: ethers.EventFilter;
  eventName: string;
}

export const queryBlockForContractEvent = async (options: QueryBlockForContractEventOptions, eventsHandler?: (result: ethers.Event[]) => Promise<any | void>) => {
  const { startBlock, endBlock, contract, eventFilter, eventName } = options;
  console.log(`🔍 ... Query from ${startBlock} to ${endBlock} for ${eventName}`);

  const eventsStartToEnd = await contract.queryFilter(
    eventFilter,
    startBlock,
    endBlock
  );

  if (eventsHandler) {
    return await eventsHandler(eventsStartToEnd);
  } else {
    return eventsStartToEnd;
  }
}

export const subscribeForContractEvent = async (options: SubscribeForContractEventOptions, eventHandler: (result: ethers.Event) => any|void) => {
  const { contract, eventFilter, eventName } = options;
  console.log(`🔍 ... Subscribe ${eventName} from contract ${contract.address}`);
  switch (eventName) {
    case "NameRegistered": {
      contract.on(eventFilter, (tokenId, owner, expires, event) => {
        console.log("tx hash :", event.transactionHash);
        console.log("event :", event.event);
        console.log("tokenId :", BigNumber.from(event.args.id).toString());
        console.log("owner :", event.args.owner);
        console.log("expires :", BigNumber.from(event.args.expires).toNumber());
        console.log("blockheight :", event.blockNumber);
        console.log("--------------------");
        if (eventHandler) {
          return eventHandler(event);
        } else {
          return event;
        }
      });
      break;
    }
    case "NameRenewed": {
      contract.on(eventFilter, (tokenId, expires, event) => {
        console.log("tx hash :", event.transactionHash);
        console.log("event :", event.event);
        console.log("tokenId :", BigNumber.from(event.args.id).toString());
        console.log("expires :", BigNumber.from(event.args.expires).toNumber());
        console.log("blockheight :", event.blockNumber);
        console.log("--------------------");
      });
      break;
    }
    case "Transfer": {
      contract.on(eventFilter, (from, to, tokenId, event) => {
        if (event.args.from != ZERO_ADDRESS) {
          console.log("tx hash :", event.transactionHash);
          console.log("event :", event.event);
          console.log("tokenId :", BigNumber.from(event.args.tokenId).toString());
          console.log("from :", event.args.from);
          console.log("to :", event.args.to);
          console.log("blockheight :", event.blockNumber);
          console.log("--------------------");
        }
      });
      break;
    }
  }
}

export const subscribeForContractEventHandler =  (event: ethers.Event): any|undefined  => {
  if (!event) {
    return event;
  }
  switch (event.event) {
    case "NameRegistered": {
      return {
        "tx_hash": event.transactionHash,
        "event_name": event.event,
        "token_id": BigNumber.from(event.args?.id).toString(),
        "owner": event.args?.owner,
        "expires": BigNumber.from(event.args?.expires).toNumber(),
        "block_height": event.blockNumber
      };
    }
    case "NameRenewed": {
      return {
        "tx_hash": event.transactionHash,
        "event_name": event.event,
        "token_id": BigNumber.from(event.args?.id).toString(),
        "expires": BigNumber.from(event.args?.expires).toNumber(),
        "block_height": event.blockNumber
      };
    }
    case "Transfer": {
      return {
        "tx_hash": event.transactionHash,
        "event_name": event.event,
        "token_id": BigNumber.from(event.args?.id).toString(),
        "from": event.args?.from,
        "to": event.args?.to,
        "block_height": event.blockNumber
      };
    }
  }
  return undefined;
}

//================================Event Handlers=================================

export type CapturedEvent =
  EnsNameRegisteredEventsHandlerResults |
  EnsNameRenewedEventsHandlerResults |
  EnsTransferEventsHandlerResults;

export type EnsNameRegisteredEventsHandlerResults = {
  event: string,
  block: number,
  tokenId: string,
  owner: string,
  expires: number
};

export async function EnsNameRegisteredEventsHandler(events: ethers.Event[]): Promise<CapturedEvent[]> {
  const eventResults: EnsNameRegisteredEventsHandlerResults[] = [];
  for (const event of events) {
    if (!event.args) {
      continue;
    }
    const eventName = event.event;
    const block = event.blockNumber;
    const tokenId = BigNumber.from(event.args.id).toString();
    const owner = event.args.owner;
    const expires = BigNumber.from(event.args.expires).toNumber();

    eventResults.push({
      event: eventName == undefined ? "no name" : eventName,
      block,
      tokenId,
      owner,
      expires
    });

  };
  return eventResults;
}

export type EnsNameRenewedEventsHandlerResults = {
  event: string,
  block: number,
  tokenId: string,
  expires: number
};

export function EnsNameRenewedEventsHandler(events: ethers.Event[]): CapturedEvent[] {
  const eventResults: EnsNameRenewedEventsHandlerResults[] = [];
  for (const event of events) {
    if (!event.args) {
      continue;
    }
    const eventName = event.event;
    const block = event.blockNumber;
    const tokenId = BigNumber.from(event.args.id).toString();
    const expires = BigNumber.from(event.args.expires).toNumber();

    eventResults.push({
      event: eventName == undefined ? "no name" : eventName,
      block,
      tokenId,
      expires
    });

  };
  return eventResults;
}

export type EnsTransferEventsHandlerResults = {
  event: string,
  block: number,
  from: string,
  to: string,
  tokenId: string
};

export function EnsTransferEventsHandler(events: ethers.Event[]): CapturedEvent[] {
  const eventResults: EnsTransferEventsHandlerResults[] = [];
  for (const event of events) {
    if (!event.args) {
      continue;
    }
    const eventName = event.event;
    const block = event.blockNumber;
    const from = event.args.from;
    const to = event.args.to;
    const tokenId = BigNumber.from(event.args.tokenId).toString();

    eventResults.push({
      event: eventName == undefined ? "no name" : eventName,
      block,
      from,
      to,
      tokenId
    });

  };
  return eventResults;
}