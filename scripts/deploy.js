// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  
  // Deploy Token
  const Token = await hre.ethers.getContractFactory('Token')
  let psi = await Token.deploy('Psichedelic', 'PSI', '1000000000')
  await psi.deployed()
  console.log(`PSI Token deployed to: ${psi.address}\n`)

  const usd = await Token.deploy('USD Token', 'USD', '1000000000')
  await usd.deployed()
  console.log(`USD Token deployed to: ${usd.address}\n`)

  const AMM = await hre.ethers.getContractFactory('AMM')
  const amm = await AMM.deploy(psi.address, usd.address)


  console.log(`AMM cntract deployed to ${amm.address}\n`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
