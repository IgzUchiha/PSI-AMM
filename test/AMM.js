const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('AMM', () => {
  let accounts, deployer,token1,token2, amm

  beforeEach(async () => {
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    liquidityProvider = accounts[1]

    const Token = await ethers.getContractFactory('Token')
    token1 = await Token.deploy('Psichedelic', 'PSI', '1000000000') // 1Billion
    token2 = await Token.deploy('USD Token', 'USD', '1000000000') // 1 Billion
    //send tokens to liquidity provider
    let transaction = await token1.connect(deployer).transfer(liquidityProvider.address, tokens(1000000))
    await transaction.wait()

   transaction = await token2.connect(deployer).transfer(liquidityProvider.address, tokens(1000000))
    await transaction.wait()

    const AMM = await ethers.getContractFactory('AMM')
    amm = await AMM.deploy(token1.address, token2.address)


})

  describe('Deployment', () => {
    // const name = 'Psichedelic'
    // const symbol = 'PSI'
    // const decimals = '18'
    // const totalSupply = tokens('1000000000')

    it('has an address', async () => {
      expect(await amm.address).to.not.equal(0x0)
    })
    it('tracks token1 address', async () => {
      expect(await amm.token1()).to.equal(token1.address)
    })
    it('tracks token2 address', async () => {
      expect(await amm.token2()).to.equal(token2.address)
    })
   

  })
  describe('Swapping Tokens', () => {
    let amount, transaction, result
    it('enables swaps', async () => {
      // enables 1million tokens
      amount = tokens(1000000)
      transaction = await token1.connect(deployer).approve(amm.address, amount)
      await transaction.wait()

      transaction = await token2.connect(deployer).approve(amm.address, amount)
      await transaction.wait()
      // adds liquidity
      transaction = await amm.connect(deployer).addLiquidity(amount, amount)
      await transaction.wait()

      expect(await token1.balanceOf(amm.address)).to.equal(amount)
      expect(await token2.balanceOf(amm.address)).to.equal(amount)
    })
  })
})