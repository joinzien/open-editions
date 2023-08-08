// Copyright Zien X Ltd

"use strict";

import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { ethers, deployments } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DropCreator,
  OpenEditionsNFT,
} from "../typechain";

describe("Who Can Mint", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;
  let dynamicSketch: DropCreator;

  beforeEach(async () => {
    const { DropCreator } = await deployments.fixture([
      "DropCreator",
      "OpenEditionsNFT",
    ]);

    dynamicSketch = (await ethers.getContractAt(
      "DropCreator",
      DropCreator.address
    )) as DropCreator;

    signer = (await ethers.getSigners())[0];
    signerAddress = await signer.getAddress();
  });

  it("makes a new drop", async () => {
    const artist = (await ethers.getSigners())[1];
    const artistAddress = await artist.getAddress();

    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      "http://example.com/token/",
      10, 1, false);

    const dropResult = await dynamicSketch.getDropAtId(0);
    const minterContract = (await ethers.getContractAt(
      "OpenEditionsNFT",
      dropResult
    )) as OpenEditionsNFT;

    await minterContract.setPricing(10, 500, 10, 10, 1, 1);

    expect(await minterContract.getAllowedMinter()).to.be.equal(0);

    await minterContract.setAllowedMinter(2);

    expect(await minterContract.getAllowedMinter()).to.be.equal(2);
  });

  it("makes a new drop, not as the owner", async () => {
    const artist = (await ethers.getSigners())[1];
    const artistAddress = await artist.getAddress();

    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      "http://example.com/token/",
      10,1, false);

    const dropResult = await dynamicSketch.getDropAtId(0);
    const minterContract = (await ethers.getContractAt(
      "OpenEditionsNFT",
      dropResult
    )) as OpenEditionsNFT;

    await minterContract.setPricing(10, 500, 10, 10, 1, 1);

    expect(await minterContract.getAllowedMinter()).to.be.equal(0);

    await expect(minterContract.connect(artist).setAllowedMinter(2)).to.be.revertedWith("Ownable: caller is not the owner");  
  }); 
  
  it("Set an invalid minter", async () => {
    const artist = (await ethers.getSigners())[1];
    const artistAddress = await artist.getAddress();

    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      "http://example.com/token/",
      10, 1, false);

    const dropResult = await dynamicSketch.getDropAtId(0);
    const minterContract = (await ethers.getContractAt(
      "OpenEditionsNFT",
      dropResult
    )) as OpenEditionsNFT;

    await minterContract.setPricing(10, 500, 10, 10, 1, 1);

    expect(await minterContract.getAllowedMinter()).to.be.equal(0);

    await expect(minterContract.setAllowedMinter(3)).to.be.revertedWith("");
  });   
});
