const { assert } = require('chai');
const web3 = require('web3');

const DaiToken = artifacts.require('DaiToken');
const DappToken = artifacts.require('DappToken');
const TokenFarm = artifacts.require('TokenFarm');

require('chai')
  .use(require('chai-as-promised'))
  .should();

function tokens(n) {
  return web3.utils.toWei(n, 'Ether');
}

contract('TokenFarm', ([owner, investor]) => {
  // Write Test here...
  let daiToken, dappToken, tokenFarm;

  before(async () => {
    // Load all contracts
    daiToken = await DaiToken.new();
    dappToken = await DappToken.new();
    tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address);

    // Transfer all Dapp tokens to TokenFarm
    await dappToken.transfer(tokenFarm.address, tokens('1000000'));
    await daiToken.transfer(investor, tokens('100'), { from: owner });
  });

  describe('Mock DAI deployment', async () => {
    it('has a name', async () => {
      const name = await daiToken.name();
      assert.equal(name, 'Mock DAI Token');
    });
  });
  describe('Mock dapp deployment', async () => {
    it('has a name', async () => {
      const name = await dappToken.name();
      assert.equal(name, 'DApp Token');
    });
  });
  describe('TokenFarm deployment', async () => {
    it('has a name', async () => {
      const name = await tokenFarm.name();
      assert.equal(name, 'Hello to Daap token Farm');
    });
    it('contract has token', async () => {
      let balance = await dappToken.balanceOf(tokenFarm.address);
      assert.equal(balance.toString(), tokens('1000000'));
    });
  });

  describe('Farming Tokens', async () => {
    it('allow invistor to stake dai tokens', async () => {
      let result;
      //check the balance of the investor befor he/she stake
      result = await daiToken.balanceOf(investor); // it should be 100 dai
      assert.equal(
        result.toString(),
        tokens('100'),
        'incorrect initial balance for the invistor'
      );
      // allow tokenFarm contract to tansfer 100 token on behalf of the investor
      await daiToken.approve(tokenFarm.address, tokens('100'), {
        from: investor,
      });
      await tokenFarm.stakeTokens(tokens('100'), { from: investor });
      // Now let us check the balance of the invistor
      // as an owner of dai it should be now zero
      result = await daiToken.balanceOf(investor);
      assert.equal(
        result.toString(),
        tokens('0'),
        'incorrect balance for the invistor after invisting'
      );
      // Let us check the tokenFarm dai balance
      result = await daiToken.balanceOf(tokenFarm.address);
      assert.equal(
        result.toString(),
        tokens('100'),
        'incorrect balance for the token farm'
      );
      //let us check the balance the invistor from the tokenFarm
      result = await tokenFarm.stakingBalance(investor);
      assert.equal(
        result.toString(),
        tokens('100'),
        'incorrect balance for the invistor'
      );

      // now let us check if the investor is investing
      result = await tokenFarm.isStaking(investor);
      assert.equal(result, true, 'invistor should have the isStaking to true');
      // now let us check if the invistor has staked
      result = await tokenFarm.hasStaked(investor);
      assert.equal(result, true, 'invistor should have the hasStaked to true');

      // Issue tokens to the invistors
      tokenFarm.issueTokens({ from: owner });
      result = await dappToken.balanceOf(investor);
      assert.equal(
        result.toString(),
        tokens('100'),
        'incorrect balance for the invistor'
      );
      await tokenFarm.issueTokens({ from: investor }).should.be.rejected;

      await tokenFarm.unstakeTokens({ from: investor });

      result = await daiToken.balanceOf(investor);
      assert.equal(
        result.toString(),
        tokens('100'),
        'incorrect balance for the invistor'
      );
      result = await daiToken.balanceOf(tokenFarm.address);
      assert.equal(
        result.toString(),
        tokens('0'),
        'incorrect balance for the tokenFarm'
      );

      result = await tokenFarm.stakingBalance(investor);
      assert.equal(
        result.toString(),
        tokens('0'),
        'incorrect balance for the invistor'
      );
    });
  });
});
