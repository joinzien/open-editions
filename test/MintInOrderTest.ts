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

describe("Mint in order", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;

  let artist: SignerWithAddress;
  let artistAddress: string;

  let user: SignerWithAddress;
  let userAddress: string;

  let dynamicSketch: DropCreator;
  let minterContract: OpenEditionsNFT;

  beforeEach(async () => {
    signer = (await ethers.getSigners())[0];
    signerAddress = await signer.getAddress();

    artist = (await ethers.getSigners())[1];
    artistAddress = await artist.getAddress();

    user = (await ethers.getSigners())[2];
    userAddress = await user.getAddress();

    const { DropCreator } = await deployments.fixture([
      "DropCreator",
      "OpenEditionsNFT",
    ]);

    dynamicSketch = (await ethers.getContractAt(
      "DropCreator",
      DropCreator.address
    )) as DropCreator;

    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      "http://example.com/token/",
      10, 1, false);

    const dropResult = await dynamicSketch.getDropAtId(0);
    minterContract = (await ethers.getContractAt(
      "OpenEditionsNFT",
      dropResult
    )) as OpenEditionsNFT;

    const mintCost = ethers.utils.parseEther("0.1");
    await minterContract.setPricing(10, 500, mintCost, mintCost, 2, 1);
  });

  it("Mint as not the owner with drop not on sale", async () => {
    await minterContract.setAllowedMinter(0);

    expect(await minterContract.canMint(userAddress)).to.be.equal(false);

    await expect(minterContract.connect(user).mintEdition(userAddress)).to.be.revertedWith("NotAllowedToMint");

    expect(await minterContract.totalSupply()).to.be.equal(0);
    expect(await minterContract.isRandomMint()).to.be.equal(false);
  });

  it("Mint as not the owner with drop limited to the allow list", async () => {
    await minterContract.setAllowedMinter(1);

    expect(await minterContract.canMint(userAddress)).to.be.equal(false);

    await expect(minterContract.connect(user).mintEdition(userAddress)).to.be.revertedWith("NotAllowedToMint");

    expect(await minterContract.totalSupply()).to.be.equal(0);
    expect(await minterContract.isRandomMint()).to.be.equal(false);
  });

  it("Mint as not the owner with drop omn general release", async () => {
    await minterContract.setAllowedMinter(2);

    expect(await minterContract.canMint(userAddress)).to.be.equal(true);

    await expect(minterContract.connect(user).mintEdition(userAddress, {
      value: ethers.utils.parseEther("0.1")
    }))
      .to.emit(minterContract, "Transfer")
      .withArgs(
        "0x0000000000000000000000000000000000000000",
        userAddress,
        1
      );

    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.isRandomMint()).to.be.equal(false);
  });

  it("Try to mint too many", async () => {
    await minterContract.setAllowedMinter(2);

    expect(await minterContract.canMint(userAddress)).to.be.equal(true);

    await expect(minterContract.connect(user).mintEdition(userAddress, {
      value: ethers.utils.parseEther("0.1")
    }))
      .to.emit(minterContract, "Transfer")
      .withArgs(
        "0x0000000000000000000000000000000000000000",
        userAddress,
        1
      );

    expect(await minterContract.totalSupply()).to.be.equal(1);

    await expect(minterContract.connect(user).mintEdition(userAddress, {
      value: ethers.utils.parseEther("0.1")
    })).to.be.revertedWith("MintingTooMany");

    expect(await minterContract.totalSupply()).to.be.equal(1);
  });

  it("Mint with the wrong payment amount", async () => {
    await minterContract.setAllowedMinter(2);

    expect(await minterContract.canMint(userAddress)).to.be.equal(true);

    await expect(minterContract.connect(user).mintEdition(userAddress)).to.be.revertedWith("WrongPrice");

    expect(await minterContract.totalSupply()).to.be.equal(0);
    expect(await minterContract.isRandomMint()).to.be.equal(false);
  });

  it("Mint as owner with drop not on sale", async () => {
    await minterContract.setAllowedMinter(0);

    expect(await minterContract.canMint(signerAddress)).to.be.equal(true);

    await expect(minterContract.mintEdition(userAddress, {
      value: ethers.utils.parseEther("0.0")
    }))
      .to.emit(minterContract, "Transfer")
      .withArgs(
        "0x0000000000000000000000000000000000000000",
        userAddress,
        1
      );

    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.isRandomMint()).to.be.equal(false);
  });

  it("Mint as the owner with drop limited to the allow list", async () => {
    await minterContract.setAllowedMinter(1);

    expect(await minterContract.canMint(signerAddress)).to.be.equal(true);

    await expect(minterContract.mintEdition(userAddress, {
      value: ethers.utils.parseEther("0.1")
    }))
      .to.emit(minterContract, "Transfer")
      .withArgs(
        "0x0000000000000000000000000000000000000000",
        userAddress,
        1
      );

    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.isRandomMint()).to.be.equal(false);
  });

  it("Mint as the owner with drop omn general release", async () => {
    await minterContract.setAllowedMinter(2);

    expect(await minterContract.canMint(signerAddress)).to.be.equal(true);

    await expect(minterContract.mintEdition(userAddress, {
      value: ethers.utils.parseEther("0.1")
    }))
      .to.emit(minterContract, "Transfer")
      .withArgs(
        "0x0000000000000000000000000000000000000000",
        userAddress,
        1
      );

    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.isRandomMint()).to.be.equal(false);
  });
});
