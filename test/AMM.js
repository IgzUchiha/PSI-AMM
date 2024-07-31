const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

const ether = tokens;

describe("AMM", () => {
  let accounts, deployer, liquidityProvider, investor1, investor2;

  let token1, token2, amm;

  beforeEach(async () => {
    accounts = await ethers.getSigners();
    deployer = accounts[0];
    liquidityProvider = accounts[1];
    investor1 = accounts[2];
    investor2 = accounts[3];

    const Token = await ethers.getContractFactory("Token");
    token1 = await Token.deploy("Psichedelic", "PSI", "1000000000"); // 1Billion
    token2 = await Token.deploy("USD Token", "USD", "1000000000"); // 1 Billion
    //send tokens to liquidity provider
    let transaction = await token1
      .connect(deployer)
      .transfer(liquidityProvider.address, tokens(1000000));
    await transaction.wait();

    transaction = await token2
      .connect(deployer)
      .transfer(liquidityProvider.address, tokens(1000000));
    await transaction.wait();

    //send token1 to investor1
    transaction = await token1
      .connect(deployer)
      .transfer(investor1.address, tokens(1000000));
    await transaction.wait();
    //send token2 to investor2
    transaction = await token2
      .connect(deployer)
      .transfer(investor2.address, tokens(1000000));
    await transaction.wait();
    //Deploy AMM
    const AMM = await ethers.getContractFactory("AMM");
    amm = await AMM.deploy(token1.address, token2.address);
  });

  describe("Deployment", () => {
    // const name = 'Psichedelic'
    // const symbol = 'PSI'
    // const decimals = '18'
    // const totalSupply = tokens('1000000000')

    it("has an address", async () => {
      expect(await amm.address).to.not.equal(0x0);
    });
    it("tracks token1 address", async () => {
      expect(await amm.token1()).to.equal(token1.address);
    });
    it("tracks token2 address", async () => {
      expect(await amm.token2()).to.equal(token2.address);
    });
  });
  describe("Swapping Tokens", () => {
    let amount, transaction, result, estimate, balance;
    it("enables swaps", async () => {
      // enables 1million tokens
      amount = tokens(1000000);
      transaction = await token1
        .connect(liquidityProvider)
        .approve(amm.address, amount);
      await transaction.wait();

      transaction = await token2
        .connect(liquidityProvider)
        .approve(amm.address, amount);
      await transaction.wait();
      // adds liquidity
      transaction = await amm
        .connect(liquidityProvider)
        .addLiquidity(amount, amount);
      await transaction.wait();
      //check we receive tokens
      expect(await token1.balanceOf(amm.address)).to.equal(amount);
      expect(await token2.balanceOf(amm.address)).to.equal(amount);

      expect(await amm.token1Balance()).to.equal(amount);
      expect(await amm.token2Balance()).to.equal(amount);

      // Check deployer has 1000 shares
      expect(await amm.shares(liquidityProvider.address)).to.equal(
        tokens(1000)
      ); //use tokens to calculate share
      //check pool has 1000 total shares
      expect(await amm.totalShares()).to.equal(tokens(1000));

      //investor 1  swaps
      //
      //check price before swapping
      console.log(`Price: ${await amm.token2Balance() / await amm.token1Balance()} \n`)
      //Investor1 approves all the tokens
      transaction = await token1
        .connect(investor1)
        .approve(amm.address, tokens(100000));
      await transaction.wait();

      //check investor1 balance before swap
      balance = await token2.balanceOf(investor1.address);
      console.log(
        `Investor1 Token2 balance before swap: ${ethers.utils.formatEther(
          balance
        )}\n`
      );

      //estimate amount of tokens investor1 will receive after swapping token1 include slippage
      estimate = await amm.calculateToken1Swap(tokens(1));
      console.log(
        `Token2 amount investor1 will receive after swap: ${ethers.utils.formatEther(
          estimate
        )}\n`
      );

      //investor1 swaps 1 token1
      transaction = await amm.connect(investor1).swapToken1(tokens(1));
      result = await transaction.wait();

      //check swap
      await expect(transaction)
        .to.emit(amm, "Swap")
        .withArgs(
          investor1.address,
          token1.address,

          tokens(1),
          token2.address,
          estimate,
          await amm.token1Balance(),
          await amm.token2Balance(),
          (
            await ethers.provider.getBlock(
              await ethers.provider.getBlockNumber()
            )
          ).timestamp
        );

      //Check investor1 balance after swap
      balance = await token2.balanceOf(investor1.address);
      console.log(
        `Investor1 Token2 balance after swap: ${ethers.utils.formatEther(
          balance
        )}\n`
      );
      expect(estimate).to.equal(balance);

      //Check AMM balances are in sync
      expect(await token1.balanceOf(amm.address)).to.equal(
        await amm.token1Balance()
      );
      expect(await token2.balanceOf(amm.address)).to.equal(
        await amm.token2Balance()
      );
       //check price after swapping
       console.log(`Price: ${await amm.token2Balance() / await amm.token1Balance()} \n`)




       //swap more tokens to see what happens
       balance = await token2.balanceOf(investor1.address)
       console.log(
        `Investor1 Token2 balance before swap: ${ethers.utils.formatEther(
          balance
        )}\n`
      );
      // estimate amount of tokens investor1 will receive after swapping token1: includes slippage
      estimate = await amm.calculateToken1Swap(tokens(1))
      console.log(`Token2 Amount investor1 will receieve after swap: ${ethers.utils.formatEther(estimate)}`)
      // Investor Swaps 1 token
      transaction = await amm.connect(investor1).swapToken1(tokens(1))
      await transaction.wait()
      // Check Investor1 balance after swap 
      balance = await token2.balanceOf(investor1.address)
      console.log(
        `Investor1 Token2 balance after swap: ${ethers.utils.formatEther(
          balance
        )}\n`
      );
         //Check AMM balances are in sync
      expect(await token1.balanceOf(amm.address)).to.equal(
          await amm.token1Balance()
        );
      expect(await token2.balanceOf(amm.address)).to.equal(
          await amm.token2Balance()
        );
       //check price after swapping
      console.log(`Price: ${await amm.token2Balance() / await amm.token1Balance()} \n`)
      //////////////////////////////////////////////////////////////////////////////////////
      //Investor1 Swaps Large amount
        // Swap more
       balance = await token2.balanceOf(investor1.address)
       console.log(
        `Investor1 Token2 balance before swap: ${ethers.utils.formatEther(
          balance
        )}\n`
      );
      // estimate amount of tokens investor1 will receive after swapping token1: includes slippage
      estimate = await amm.calculateToken1Swap(tokens(100))
      console.log(`Token2 Amount investor1 will receieve after swap: ${ethers.utils.formatEther(estimate)}`)
      // Investor Swaps 1 token
      transaction = await amm.connect(investor1).swapToken1(tokens(100))
      await transaction.wait()
      // Check Investor1 balance after swap 
      balance = await token2.balanceOf(investor1.address)
      console.log(
        `Investor1 Token2 balance after swap: ${ethers.utils.formatEther(
          balance
        )}\n`
      );
         //Check AMM balances are in sync
      expect(await token1.balanceOf(amm.address)).to.equal(
          await amm.token1Balance()
        );
      expect(await token2.balanceOf(amm.address)).to.equal(
          await amm.token2Balance()
        );
       //check price after swapping
      console.log(`Price: ${await amm.token2Balance() / await amm.token1Balance()} \n`)
       
        //////////////////////////////////////////////////////////////
        //Investor 2 Swaps 
        /////////////

        //Investor2 approves all tokens
        transaction = await token2.connect(investor2).approve(amm.address, tokens(100000))
        await transaction.wait()
        // check investor2 balance before swap
        balance = await token1.balanceOf(investor2.address)
        console.log(
          `Investor2 Token1 balance before swap: ${ethers.utils.formatEther(
            balance
          )}\n`
        );
        // estimate amount of tokens investor2 will receive after swapping token2: includes slippage
        estimate = await amm.calculateToken2Swap(tokens(1))
        console.log(`Token1 Amount investor2 will receive after swap: ${ethers.utils.formatEther(estimate)}`)

        //Investor2 swaps 1 token
        transaction = await amm.connect(investor2).swapToken2(tokens(1))
        await transaction.wait()
            // console.log(`made it to line 253`)
        // check swap event
        await expect(transaction).to.emit(amm, 'Swap')
        .withArgs(
          investor2.address, 
          token2.address,
          tokens(1),
          token1.address,
          estimate,
          await amm.token1Balance(),
          await amm.token2Balance(),
          (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
        )
        // console.log(`made it to line 266`)
        //check investor2 balance after swap
        balance = await token1.balanceOf(investor2.address)
        console.log(`Investor2 Token1 balance afterswap: ${ethers.utils.formatEther(balance)}\n`)
        expect(estimate).to.equal(balance)


        //check AMM tokens is in sync
        expect(await token1.balanceOf(amm.address)).to.equal(await amm.token1Balance())
        expect(await token2.balanceOf(amm.address)).to.equal(await amm.token2Balance())

        console.log(`Price: ${await amm.token2Balance() / await amm.token1Balance()}\n`)
    });
  });
});
