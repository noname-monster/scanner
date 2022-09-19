import fs from 'fs';
import { exit } from 'process';


export function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

//=============================Query retry helper==============================

const MAX_RETRY_ATTEMPT = 1000;
const DELAY_MS_BEFORE_NEXT_RETRY = 100;

export async function maybeRetry<T>(
  cb: () => Promise<T>,
  maxRetryAttempt = MAX_RETRY_ATTEMPT,
  delayMsBeforeNextRetry = DELAY_MS_BEFORE_NEXT_RETRY
): Promise<T> {
  let error: any;
  for (let i = 0; i < maxRetryAttempt; i++) {
    try {
      return await cb();
    } catch (e: any) {
      error = e;
      console.warn(`🚨 Failed call at attempt ${i + 1}. Retrying...`);
      await sleep(delayMsBeforeNextRetry);
    }
  }
  throw error;
}

//=============================File system helpers============================= 

export function checkDirectoryExists(pathName: string) {
  // Make sure configs directory exists
  if (!fs.existsSync(pathName)) {
    try {
      fs.mkdirSync(pathName);
    } catch (err) {
      console.log(`🚨 Error creating ${pathName}: `, err);
      console.log("❌ Canceling task");
      exit();
    }
  }
}

export function readJSON(destinationPath: string) {
  let jsonString = '';
  let outputJSON = {};
  try {
    jsonString = fs.readFileSync(destinationPath, 'utf-8');
  } catch (err) {
    console.log(`🚨 Error retrieving "${destinationPath}" :`, err);
    exit();
  }
  try {
    outputJSON = JSON.parse(jsonString);
  } catch (err) {
    console.log(`🚨 Error parsing "${destinationPath}" json: `, err);
    exit();
  }

  return outputJSON;
}

export function writeJSON(destinationPath: string, outputJSON: Object) {
  const jsonString = JSON.stringify(outputJSON, undefined, 2);
    try {
      fs.writeFileSync(destinationPath, jsonString);
    } catch (err) {
      console.log(`🚨 Error creating ${destinationPath}: `, err);
    }
}