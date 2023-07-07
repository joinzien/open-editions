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

describe("Mint randomly", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;

  let artist: SignerWithAddress;
  let artistAddress: string;    

  let user: SignerWithAddress;
  let userAddress: string; 

  let dynamicSketch: DropCreator;
  let minterContract: OpenEditionsNFT;

  const nullAddress = "0x0000000000000000000000000000000000000000";

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
      10, true);

    const dropResult = await dynamicSketch.getDropAtId(0);   
    minterContract = (await ethers.getContractAt(
      "OpenEditionsNFT",
      dropResult
    )) as OpenEditionsNFT;

    const mintCost = ethers.utils.parseEther("0.1");
    await minterContract.setPricing(10, 500, mintCost, mintCost, 2, 1);   
  });

  it("Mint via purchase", async () => {
    await minterContract.setAllowedMinter(2);

    expect(await minterContract.purchase({ value: ethers.utils.parseEther("0.1") })).to.emit(minterContract, "EditionSold");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(0);  
  });

  it("Mint via mintEdition", async () => {
    await minterContract.setAllowedMinter(2);

    expect(await minterContract.mintEdition(signerAddress, { value: ethers.utils.parseEther("0.1") })).to.emit(minterContract, "EditionSold");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(0);  
  });

  it("Mint via mintEditions", async () => {
    await minterContract.setAllowedMinter(2);

    expect(await minterContract.mintEditions([signerAddress], { value: ethers.utils.parseEther("0.1") })).to.emit(minterContract, "EditionSold");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(0);  
  });

  it("Mint via mintMultipleEditions", async () => {
    await minterContract.setAllowedMinter(2);

    expect(await minterContract.mintMultipleEditions(signerAddress, 1, { value: ethers.utils.parseEther("0.1") })).to.emit(minterContract, "EditionSold");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(0);  
  });

  it("Can mint zero cost", async () => {
    const mintCost = ethers.utils.parseEther("0.0");
    await minterContract.setPricing(10, 500, mintCost, mintCost, 2, 1);   
    await minterContract.setAllowedMinter(2);

    expect(await minterContract.purchase({ value: mintCost })).to.emit(minterContract, "EditionSold");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(0);  
  });

  it("Minter only has payment", async () => {
    await minterContract.setAllowedMinter(2);

    const mintCost = ethers.utils.parseEther("0.1");
    expect(await minterContract.purchase({ value: mintCost })).to.emit(minterContract, "EditionSold");
    expect(await minterContract.totalSupply()).to.be.equal(1);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(0); 
  });

  it("Minter only has payment, does not match the mint price", async () => {
    await minterContract.setAllowedMinter(2);

    await expect(minterContract.mintEditions([signerAddress], { value: ethers.utils.parseEther("0.01") })).to.be.revertedWith("Wrong price");

    expect(await minterContract.totalSupply()).to.be.equal(0);
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(1);  
  });

  it("General public can not mint while the drop is not for sale", async () => {
    await minterContract.setAllowedMinter(0);

    await expect(minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.1") })).to.be.revertedWith("Needs to be an allowed minter");
  });

  it("General public can not mint when not on the allow list", async () => {
    await minterContract.setAllowedMinter(1);

    await expect(minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.1") })).to.be.revertedWith("Needs to be an allowed minter");
  });

  it("General public can mint when mint is open to everyone", async () => {
    await minterContract.setAllowedMinter(2);

    await expect(minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.1") })).to.emit(minterContract, "EditionSold");
  });

  it("An allow list member can not mint while the drop is not for sale", async () => {
    await minterContract.setAllowListMinters(1, [userAddress], [true])
    await minterContract.setAllowedMinter(0);

    await expect(minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.1") })).to.be.revertedWith("Needs to be an allowed minter");
  });

  it("An allow list member can mint when on the allow list", async () => {
    await minterContract.setAllowListMinters(1, [userAddress], [true])
    await minterContract.setAllowedMinter(1);

    await expect(minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.1") })).to.emit(minterContract, "EditionSold");
  });

  it("An allow list member can mint when mint is open to everyone", async () => {
    await minterContract.setAllowListMinters(1, [userAddress], [true])
    await minterContract.setAllowedMinter(2);

    await expect(minterContract.connect(user).mintEditions([signerAddress], { value: ethers.utils.parseEther("0.1") })).to.emit(minterContract, "EditionSold");
  });

   it("The owner can not mint while the drop is not for sale", async () => {
    await minterContract.setAllowedMinter(0);

    await expect(minterContract.mintEditions([signerAddress], { value: ethers.utils.parseEther("0.1") })).to.be.revertedWith("Needs to be an allowed minter");
  });

  it("The owner can not mint when not on the allow list", async () => {
    await minterContract.setAllowedMinter(1);

    await expect(minterContract.mintEditions([signerAddress], { value: ethers.utils.parseEther("0.1") })).to.be.revertedWith("Needs to be an allowed minter");
  });

  it("The owner list member can mint when on the allow list", async () => {
    await minterContract.setAllowListMinters(1, [signerAddress], [true])
    await minterContract.setAllowedMinter(1);

    await expect(minterContract.mintEditions([signerAddress], { value: ethers.utils.parseEther("0.1") })).to.emit(minterContract, "EditionSold");
  });  

  it("The owner can mint when mint is open to everyone", async () => {
    await minterContract.setAllowedMinter(2);

    await expect(minterContract.mintEditions([signerAddress], { value: ethers.utils.parseEther("0.1") })).to.emit(minterContract, "EditionSold");
  }); 

  it("General mint limit", async () => {
    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(0); 
    
    expect(await minterContract.canMint(signerAddress)).to.be.equal(false);  

    await expect(minterContract.purchase()).to.be.revertedWith("Needs to be an allowed minter");
    
    expect(
      await minterContract.setSalePrice(ethers.utils.parseEther("0.2"))
    ).to.emit(minterContract, "PriceChanged");

    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(1);    

    expect(await minterContract.canMint(signerAddress)).to.be.equal(true);  
 
    expect(
      await minterContract
        .purchase({ value: ethers.utils.parseEther("0.2") })
    ).to.emit(minterContract, "EditionSold");
    await expect(minterContract.purchase({ value: ethers.utils.parseEther("0.2") })).to.be.revertedWith( "Exceeded mint limit");
 
    expect(await minterContract.totalSupply()).to.be.equal(1);

    expect(await minterContract.getAllowListMintLimit()).to.be.equal(2);
    expect(await minterContract.getGeneralMintLimit()).to.be.equal(1);
    expect(await minterContract.getMintLimit(signerAddress)).to.be.equal(0);  

    expect(await minterContract.canMint(signerAddress)).to.be.equal(false);  

  });

  it("General user access control", async () => {
    await minterContract.setAllowedMinter(0);

    // Mint as a contract owner
    await expect(minterContract.connect(user).mintEdition(userAddress)).to.be.revertedWith("Needs to be an allowed minter");      

    await minterContract.setAllowedMinter(1);

    // Mint as a member of the allow list
    await expect(minterContract.connect(user).mintEdition(userAddress)).to.be.revertedWith("Needs to be an allowed minter");   

    await minterContract.setAllowedMinter(2);

    // Mint as the general public
    await expect(minterContract.connect(user).mintEdition(userAddress, {
      value: ethers.utils.parseEther("0.1")
    }))
      .to.emit(minterContract, "Transfer");
      
    expect(await minterContract.totalSupply()).to.be.equal(1);
  });  
});
