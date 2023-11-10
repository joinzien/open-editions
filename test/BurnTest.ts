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

describe("Burn", () => {
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
    artistAddress = await signer.getAddress();   
    
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
    await minterContract.setAllowedMinter(2);   
  });

  it("Allows user burn", async () => {
    await minterContract.mintEdition(await signer.getAddress(), {
      value: ethers.utils.parseEther("0.1")
    });
    expect(await minterContract.ownerOf(1)).to.equal(
      await signer.getAddress()
    );

    await minterContract.connect(signer).burn(1);
    await expect(minterContract.ownerOf(1)).to.be.revertedWith("ERC721: invalid token ID");
    expect(await minterContract.totalSupply()).to.be.equal(1);
  });

  it("Try to burn not as the owner", async () => {
    await minterContract.mintEdition(await signer.getAddress(), {
      value: ethers.utils.parseEther("0.1")
    });
    expect(await minterContract.ownerOf(1)).to.equal(
      await signer.getAddress()
    );
    await expect(minterContract.connect(artist).burn(1)).to.be.revertedWith("NotApproved");
  });
});