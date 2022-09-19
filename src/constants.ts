import EnsRegisterABI from "../ABI/ENS-Register.json";
import { ethers } from "ethers";
// import * as dotenv from "dotenv";
import * as path from "path";

require("dotenv").config();

export const provider = new ethers.providers.WebSocketProvider(
  process.env.RPC_URL as string
);

//=================================Misc.=======================================

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const START_BLOCK_HEIGHT = process.env.START_BLOCK_HEIGHT;
export const END_BLOCK_HEIGHT = process.env.END_BLOCK_HEIGHT;

//==================================Contracts==================================

export const EnsRegisterContract = new ethers.Contract(
  process.env.REGISTER_ADDRESSES as string,
  new ethers.utils.Interface(EnsRegisterABI),
  provider
);

//================================Event filters================================

export const EnsNameRegisteredEventFilter =
  EnsRegisterContract.filters.NameRegistered(null, null, null);

export const EnsNameRenewedEventFilter =
  EnsRegisterContract.filters.NameRenewed(null, null);

export const EnsTransferEventFilter =
  EnsRegisterContract.filters.Transfer(null, null, null);
