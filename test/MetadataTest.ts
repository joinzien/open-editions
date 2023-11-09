// Copyright Zien X Ltd

"use strict";

import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { ethers, deployments } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DropCreator,
  OpenEditionsNFT
} from "../typechain";

describe("Metadata", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;

  let artist: SignerWithAddress;
  let artistAddress: string;

  let dynamicSketch: DropCreator;

  let minterContract: OpenEditionsNFT;

  beforeEach(async () => {
    signer = (await ethers.getSigners())[0];
    signerAddress = await signer.getAddress();

    artist = (await ethers.getSigners())[1];
    artistAddress = await artist.getAddress();

    const { DropCreator } = await deployments.fixture([
      "DropCreator",
      "OpenEditionsNFT",
    ]);

    dynamicSketch = (await ethers.getContractAt(
      "DropCreator",
      DropCreator.address
    )) as DropCreator;


  });

  it("Update metadata, not as the owner", async () => {
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

    await expect(minterContract.connect(artist).updateMetadata(
      1, 10,
      ["http://example.com/token/01", "http://example.com/token/02",
        "http://example.com/token/03", "http://example.com/token/04",
        "http://example.com/token/05", "http://example.com/token/06",
        "http://example.com/token/07", "http://example.com/token/08",
        "http://example.com/token/09", "http://example.com/token/10"]
    )).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Update metadata below the starting index", async () => {
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

    await expect(minterContract.updateMetadata(
      0, 10,
      ["http://example.com/token/01", "http://example.com/token/02",
        "http://example.com/token/03", "http://example.com/token/04",
        "http://example.com/token/05", "http://example.com/token/06",
        "http://example.com/token/07", "http://example.com/token/08",
        "http://example.com/token/09", "http://example.com/token/10"]
    )).to.be.revertedWith("InvalidTokenId");
  });

  it("Update metadata over the ending index", async () => {
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

    await expect(minterContract.updateMetadata(
      2, 10,
      ["http://example.com/token/01", "http://example.com/token/02",
        "http://example.com/token/03", "http://example.com/token/04",
        "http://example.com/token/05", "http://example.com/token/06",
        "http://example.com/token/07", "http://example.com/token/08",
        "http://example.com/token/09", "http://example.com/token/10"]
    )).to.be.revertedWith("InvalidTokenId");
  });

  it("Update metadata", async () => {
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

    await minterContract.updateMetadata(
      1, 10,
      ["http://example.com/token/01", "http://example.com/token/02",
        "http://example.com/token/03", "http://example.com/token/04",
        "http://example.com/token/05", "http://example.com/token/06",
        "http://example.com/token/07", "http://example.com/token/08",
        "http://example.com/token/09", "http://example.com/token/10"]
    );
  });

  it("Update the base directory", async () => {
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

    expect(await minterContract.baseDir()).to.be.equal("http://example.com/token/");

    await minterContract.updateBaseDir("http://example.com/edition/");

    expect(await minterContract.baseDir()).to.be.equal("http://example.com/edition/");
  });

  it("Try updating the base directory not as the owner", async () => {
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

    expect(await minterContract.baseDir()).to.be.equal("http://example.com/token/");

    await expect(minterContract.connect(artist).updateBaseDir("http://example.com/edition/")).to.be.revertedWith("Ownable: caller is not the owner");

    expect(await minterContract.baseDir()).to.be.equal("http://example.com/token/");
  });

  it("Update multiple metadata chunks", async () => {
    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      "http://example.com/token/",
      20, 1, false);

    const dropResult = await dynamicSketch.getDropAtId(0);
    minterContract = (await ethers.getContractAt(
      "OpenEditionsNFT",
      dropResult
    )) as OpenEditionsNFT;

    await minterContract.updateMetadata(
      1, 10,
      ["http://example.com/token/01", "http://example.com/token/02",
        "http://example.com/token/03", "http://example.com/token/04",
        "http://example.com/token/05", "http://example.com/token/06",
        "http://example.com/token/07", "http://example.com/token/08",
        "http://example.com/token/09", "http://example.com/token/10"]
    );

    await minterContract.updateMetadata(
      11, 10,
      ["http://example.com/token/11", "http://example.com/token/12",
        "http://example.com/token/13", "http://example.com/token/14",
        "http://example.com/token/15", "http://example.com/token/16",
        "http://example.com/token/17", "http://example.com/token/18",
        "http://example.com/token/19", "http://example.com/token/20"]
    );
  });

  it("Override the metadata ", async () => {
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

    // Mint as the general public
    await expect(minterContract.mintEdition(signerAddress, {
      value: ethers.utils.parseEther("0.1")
    }))
      .to.emit(minterContract, "Transfer")
      .withArgs(
        "0x0000000000000000000000000000000000000000",
        signerAddress,
        1
      );

    expect(await minterContract.tokenURI(1)).to.be.equal("http://example.com/token/1.json");   

    await minterContract.updateMetadata(
      1, 1,
      ["http://example.com/edition/1.json"]
    );

    expect(await minterContract.tokenURI(1)).to.be.equal("http://example.com/edition/1.json");       
  });

  it("Overlapping metadata chunks", async () => {
    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      "http://example.com/token/",
      20, 1, false);

    const dropResult = await dynamicSketch.getDropAtId(0);
    minterContract = (await ethers.getContractAt(
      "OpenEditionsNFT",
      dropResult
    )) as OpenEditionsNFT;

    await minterContract.updateMetadata(
      1, 10,
      ["http://example.com/token/01", "http://example.com/token/02",
        "http://example.com/token/03", "http://example.com/token/04",
        "http://example.com/token/05", "http://example.com/token/06",
        "http://example.com/token/07", "http://example.com/token/08",
        "http://example.com/token/09", "http://example.com/token/10"]
    );

    await minterContract.updateMetadata(
      5, 10,
      ["http://example.com/token/05", "http://example.com/token/06",
        "http://example.com/token/07", "http://example.com/token/08",
        "http://example.com/token/09", "http://example.com/token/10",
        "http://example.com/token/11", "http://example.com/token/12",
        "http://example.com/token/13", "http://example.com/token/14"]
    );

    await minterContract.updateMetadata(
      11, 10,
      ["http://example.com/token/11", "http://example.com/token/12",
        "http://example.com/token/13", "http://example.com/token/14",
        "http://example.com/token/15", "http://example.com/token/16",
        "http://example.com/token/17", "http://example.com/token/18",
        "http://example.com/token/19", "http://example.com/token/20"]
    );
  });

  it("Try to update mismatched metadata", async () => {
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

    await expect(minterContract.updateMetadata(
      1, 5,
      ["http://example.com/token/01", "http://example.com/token/02",
        "http://example.com/token/03", "http://example.com/token/04",
        "http://example.com/token/05", "http://example.com/token/06",
        "http://example.com/token/07", "http://example.com/token/08",
        "http://example.com/token/09", "http://example.com/token/10"]
    )).to.be.revertedWith("SizeMismatch");
  });

  it("Update redeemed metadata, not as the owner", async () => {
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

    await expect(minterContract.connect(artist).updateRedeemedMetadata(
      1, "https://example.com/redeemed/0001"
    )).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Update redeemed metadata below the starting index", async () => {
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

    await expect(minterContract.updateRedeemedMetadata(
      0, "https://example.com/redeemed/0001"
    )).to.be.revertedWith("InvalidTokenId");
  });

  it("Update redeemed metadata over the ending index", async () => {
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

    await expect(minterContract.updateRedeemedMetadata(
      11, "https://example.com/redeemed/0001"
    )).to.be.revertedWith("InvalidTokenId");
  });

  it("Update redeemed metadata", async () => {
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

    await minterContract.updateRedeemedMetadata(
      1, "https://example.com/redeemed/0001"
    );
  });

  it("Get the metadata for a unknown tokenID", async () => {
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

    await expect(minterContract.tokenURI(0)).to.be.revertedWith("InvalidTokenId");
  });

  it("Check metadata values", async () => {
    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      "http://example.com/edition/",
      10, 3, false);

    const dropResult = await dynamicSketch.getDropAtId(0);
    minterContract = (await ethers.getContractAt(
      "OpenEditionsNFT",
      dropResult
    )) as OpenEditionsNFT;

    // Mint as the general public
    const mintCost = ethers.utils.parseEther("0.1");
    await minterContract.setPricing(10, 500, mintCost, mintCost, 10, 10);   
    await minterContract.setAllowedMinter(2);

    await expect(minterContract.mintMultipleEditions(signerAddress, 10, {
      value: ethers.utils.parseEther("1.0")
    }))
      .to.emit(minterContract, "Transfer")
      .withArgs(
        "0x0000000000000000000000000000000000000000",
        signerAddress,
        10
      );
      
    expect(await minterContract.totalSupply()).to.be.equal(10);
    expect(await minterContract.tokenURI(1)).to.be.equal("http://example.com/edition/1.json");   
    expect(await minterContract.tokenURI(2)).to.be.equal("http://example.com/edition/2.json");    
    expect(await minterContract.tokenURI(3)).to.be.equal("http://example.com/edition/3.json");    
    expect(await minterContract.tokenURI(4)).to.be.equal("http://example.com/edition/1.json");    
    expect(await minterContract.tokenURI(5)).to.be.equal("http://example.com/edition/2.json");  
    expect(await minterContract.tokenURI(6)).to.be.equal("http://example.com/edition/3.json");   
    expect(await minterContract.tokenURI(7)).to.be.equal("http://example.com/edition/1.json");    
    expect(await minterContract.tokenURI(8)).to.be.equal("http://example.com/edition/2.json");    
    expect(await minterContract.tokenURI(9)).to.be.equal("http://example.com/edition/3.json");    
    expect(await minterContract.tokenURI(10)).to.be.equal("http://example.com/edition/1.json");          
  });

});
