# Scanning Repository 
This repository contains scripts for querying/subscribing to ENS events. 

## Table of Contents

## Environment Setup

### Install dependencies 
Run `yarn` in repository root directory

### Set RPC URL
1. Locate `.env.example`
2. Replace `INSERT_RPC_URL_HERE` with RPC URL
2. Fill in necessary env variables
3. Rename file to `.env`

## Instructions for running the server:**

1. Navigate to root directory of repository

2. Query historical ENS events
  
    Run `yarn run:query-data` to start querying script

    The data will be stored under `dump/` repo.
  
3. Subscribe ENS events 

    Run `yarn run:subscribe-data` to start subscribing data.
    
    The data will be printed in console.log, and returned as processed event.