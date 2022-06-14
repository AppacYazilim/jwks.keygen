import inquirer from 'inquirer';

import { createSpinner } from 'nanospinner';

import * as jose from "jose";
import { v4 } from "uuid";
import fs from "fs";
import fetch from 'node-fetch';



function issuerToJWKS(issuer: string): string {
  return `https://${issuer}/.well-known/jwks.json`;
}


const pretty = true;


async function main() {


  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'domain',
      message: 'Enter the jwk issuer domain?',
      validate: (value: string) => {
        if (value.length) {
          return true;
        }
        return 'Please enter the domain';
      }
    }
  ])

  const issuer = answers.domain;

  const url = issuerToJWKS(issuer);

  const spinner = createSpinner('Checking the domain for jwks...').start();

  const result = await fetch(url).catch(err => {
    spinner.stop();
    console.error(err);
    process.exit(1);
    return null;
  });

  if (!result) {
    spinner.error({ text: 'Failed to fetch JWKS' });
  } else if (result.status !== 200) {
    spinner.error({ text: `The url ${url} returned the status code ${result.status}` });
  }

  let existingJWKS: any = {
    keys: []
  };

  if (result) {

    try {
      const jwks = await result.json();
      existingJWKS = jwks;
      spinner.success({ text: `Fetched existing jwks. ` });
    } catch {
      spinner.error({ text: `The url ${url} returned an invalid json` });
    }

  } else {
    console.log("Skip using existing JWKS");
  }

  const kid = v4();


  const keygenSpinner = createSpinner(`Creating a ES512 keypair with key id ${kid}...`).start();
  const keys = await jose.generateKeyPair('ES512', { extractable: true });

  const publicJwk = await jose.exportJWK(keys.publicKey);

  const jwks = await jose.exportJWK(keys.privateKey);


  const privKey = Buffer.from(JSON.stringify({ ...jwks, kid, "alg": "ES512", "use": "sig", "iss": issuer })).toString("base64");


  const pubOut = {
    keys: [
      ...existingJWKS.keys ,
      {
        ...publicJwk,
        "alg": "ES512",
        "use": "sig",
        "kid": kid,
      }
    ]
  };

  
  const jwksOut = JSON.stringify(pubOut, null, pretty ? 2 : 0);

  keygenSpinner.stop();
  fs.writeFileSync("jwks.json", jwksOut);
  console.log("Private Key is ");
  console.log();
  console.log(privKey);
  console.log();

  console.log(`Please host jwks.json file on https://${issuer}/.well-known/jwks.json`);
}

main();


// async function createRoot() {
//   const keys = await jose.generateKeyPair("ES512", { extractable: true });

//   const publicJwk = await jose.exportJWK(keys.publicKey);

//   const kid = v4();
//   const jwks = await jose.exportJWK(keys.privateKey);

//   const privKey = Buffer.from(JSON.stringify({ ...jwks, kid, "alg": "ES512", "use": "sig" })).toString("base64");

//   if (process.argv.length < 3) {
//     console.log("Usage: yarn keygen <issuer-domain>");
//     process.exit(1);
//   }
//   const issuer = process.argv[2];

//   console.log(issuer);

//   const pubOut = {
//     keys: [
//       {
//         ...publicJwk,
//         "alg": "ES512",
//         "use": "sig",
//         "kid": kid,
//       }
//     ]
//   };

//   const jwksOut = JSON.stringify(pubOut, null, 2);

//   fs.writeFileSync("jwks.json", jwksOut);
//   console.log("Private Key is ");
//   console.log();
//   console.log(privKey);
//   console.log();
//   console.log("Key Id is", kid);

//   console.log(`Please host this file on https://${issuer}/.well-known/jwks.json`);
// }


// createRoot();