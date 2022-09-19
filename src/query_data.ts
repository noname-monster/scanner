import assert from "assert";
import { exit } from "process";
import { ethers } from "ethers";
import * as path from "path";
import { checkDirectoryExists, writeJSON, maybeRetry } from "./utils";
const promptInput = require("prompt-sync")();
import {
  CapturedEvent,
  EnsNameRegisteredEventsHandler,
  EnsNameRenewedEventsHandler,
  EnsTransferEventsHandler,
  queryBlockForContractEvent,
} from "./handlers";
import {
  EnsRegisterContract,
  EnsNameRegisteredEventFilter,
  EnsNameRenewedEventFilter,
  EnsTransferEventFilter,
  START_BLOCK_HEIGHT,
  END_BLOCK_HEIGHT
} from "./constants";

//=================================Config info=================================

const DUMP_DIRECTORY = "dump/";
const CONFIG = {
  scanStartBlock: START_BLOCK_HEIGHT as string, // inclusive, deliberately set to be earlier than rewardStartBlock.
  scanEndBlock: END_BLOCK_HEIGHT as string, // inclusive
  queryChunkBlockCount: 1000,
};
function validateConfig() {
  assert(
    CONFIG.scanStartBlock < CONFIG.scanEndBlock,
    "scanStartBlock has to be smaller than scanEndBlock"
  );
}

// List of batches of events to query
const EVENT_SCAN_CONFIG_BATCHES = [
  {
    batchName: "ENS .eth querying",
    batchFileName: "ENS-eth.json",
    batchStartScanBlock: CONFIG.scanStartBlock,
    maxConcurrency: 5,
    eventsToScan: [
      {
        name: "NameRegistered",
        contract: EnsRegisterContract,
        eventFilter: EnsNameRegisteredEventFilter,
        eventHandler: EnsNameRegisteredEventsHandler,
      },
      {
        name: "NameRenewed",
        contract: EnsRegisterContract,
        eventFilter: EnsNameRenewedEventFilter,
        eventHandler: EnsNameRenewedEventsHandler,
      },
      {
        name: "Transfer",
        contract: EnsRegisterContract,
        eventFilter: EnsTransferEventFilter,
        eventHandler: EnsTransferEventsHandler,
      },
    ],
  },
];

//=====================================Main====================================

interface ScannedChunk {
  startBlock: number;
  endBlock: number;
  events: CapturedEvent[];
}

async function main() {
  const scanStartBlock = CONFIG.scanStartBlock;
  const scanEndBlock = CONFIG.scanEndBlock;
  console.log({ scanStartBlock, scanEndBlock });
  // Pre-processes
  // validateConfig();
  checkDirectoryExists(DUMP_DIRECTORY);

  // Start scanning events
  console.log("⏳⏳⏳ Start scanning...\n");

  for (const batch of EVENT_SCAN_CONFIG_BATCHES) {
    // Iterate through each scanning batch

    console.log(`⏳⏳ Starting ${batch.batchName}...`);

    // Skip or run confirmation. (will run unless 'skip' is entered)
    const canSkipConfirmation = promptInput(
      `❓ Type 'run', 'skip', or 'end' (See README.md): `
    );
    if (canSkipConfirmation == "skip") {
      console.log(`👍 Skipping this section\n`);
      continue;
    } else if (canSkipConfirmation == "run") {
      console.log(`👍 Running this section`);
    } else if (canSkipConfirmation == "end") {
      console.log(`❌ Ending script`);
      break;
    } else {
      console.log(`🚨 Invalid response`);
      console.log(`❌ Ending script by default`);
      break;
    }

    // Global state
    let queriedState = [] as CapturedEvent[];

    // Local list of promised scanned chunks
    let scanConcurrencyPromises: Promise<ScannedChunk>[] = [];

    // Iterate through block range
    for (
      // let currBlock = batch.batchStartScanBlock;
      // currBlock <= CONFIG.scanEndBlock;
      let currBlock = parseInt(scanStartBlock, 10);
      currBlock <= parseInt(scanEndBlock, 10);
      currBlock += CONFIG.queryChunkBlockCount + 1
    ) {
      // Get iteration block range
      const chunkStartBlock = currBlock;
      const chunkEndBlock = Math.min(
        chunkStartBlock + CONFIG.queryChunkBlockCount,
        // CONFIG.scanEndBlock
        parseInt(scanEndBlock, 10)
      );

      console.log(
        `ℹ️  Scanning for block ${chunkStartBlock} - ${chunkEndBlock} for...`
      );

      // Scanner function
      const chunkScanHandler = async (): Promise<ScannedChunk> => {
        let eventCapturePromises: Promise<CapturedEvent[]>[] = [];

        for (const scanConfig of batch.eventsToScan) {
          eventCapturePromises.push(
            maybeRetry(async () => {
              const rawEvents = (await queryBlockForContractEvent({
                startBlock: chunkStartBlock,
                endBlock: chunkEndBlock,
                contract: scanConfig.contract,
                eventFilter: scanConfig.eventFilter,
                eventName: scanConfig.name,
              })) as ethers.Event[];
              const handledEvents = await scanConfig.eventHandler(rawEvents);
              return handledEvents;
            })
          );
        }

        // Parse events
        const eventGroups = await Promise.all(eventCapturePromises);
        let allEvents = eventGroups.reduce(
          (acc, group) => acc.concat(group),
          []
        );

        return {
          startBlock: chunkStartBlock,
          endBlock: chunkEndBlock,
          events: allEvents,
        };
      };

      scanConcurrencyPromises.push(chunkScanHandler()); // Get new queries

      if (scanConcurrencyPromises.length >= batch.maxConcurrency) {
        // Update state and JSON if enough queries
        const scannedChunks = await Promise.all(scanConcurrencyPromises);
        const capturedEvents = scannedChunks.reduce(
          (acc, chunk) => acc.concat(chunk.events),
          [] as CapturedEvent[]
        );
        queriedState = queriedState.concat(capturedEvents);
        writeJSON(`${DUMP_DIRECTORY}${batch.batchFileName}`, { queriedState });
        scanConcurrencyPromises = [];
      }
    }
    if (scanConcurrencyPromises.length >= 0) {
      // Update state and JSON at end of querying
      const scannedChunks = await Promise.all(scanConcurrencyPromises);
      const capturedEvents = scannedChunks.reduce(
        (acc, chunk) => acc.concat(chunk.events),
        [] as CapturedEvent[]
      );
      queriedState = queriedState.concat(capturedEvents);
      writeJSON(`${DUMP_DIRECTORY}${batch.batchFileName}`, { queriedState });
    }
    console.log(
      `... ✅ Finished ${batch.batchName} @ ${DUMP_DIRECTORY}${batch.batchFileName}`
    );
  }

  console.log("🏁 Scanning DONE 🏁");

  exit();
}

main();
