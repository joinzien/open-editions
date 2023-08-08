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

const max_uint256 = "115792089237316195423570985008687907853269984665640564039457584007913129639935";

describe("Drops", () => {
  let signer: SignerWithAddress;
  let signerAddress: string;

  let artist: SignerWithAddress;
  let artistAddress: string;

  let dynamicSketch: DropCreator;
  let editionImpl: OpenEditionsNFT;

  beforeEach(async () => {
    const { DropCreator, OpenEditionsNFT } = await deployments.fixture([
      "DropCreator",
      "OpenEditionsNFT",
    ]);

    dynamicSketch = (await ethers.getContractAt(
      "DropCreator",
      DropCreator.address
    )) as DropCreator;

    editionImpl = (await ethers.getContractAt(
      "OpenEditionsNFT",
      OpenEditionsNFT.address
    )) as OpenEditionsNFT;    

    signer = (await ethers.getSigners())[0];
    signerAddress = await signer.getAddress();

    artist = (await ethers.getSigners())[1];
    artistAddress = await signer.getAddress();

  });

  it("Does not allow re-initialization of the implementation contract", async () => {
    await expect(
      editionImpl.initialize(
        signerAddress,
        artistAddress,
        "test name",
        "SYM",
        "http://example.com/token/",
        12, 12, false
      )
    ).to.be.revertedWith("Initializable: contract is already initialized");
  });

  it("Creates a zero sized drop is unlimited", async () => {
    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      "http://example.com/token/",
      0, 1, false 
    );

    const dropResult = await dynamicSketch.getDropAtId(0);
    const minterContract = (await ethers.getContractAt(
      "OpenEditionsNFT",
      dropResult
    )) as OpenEditionsNFT;

    await minterContract.setPricing(10, 500, 0, 0, 10, 10);

    expect(await minterContract.name()).to.be.equal("Testing Token");
    expect(await minterContract.symbol()).to.be.equal("TEST");
    expect(await minterContract.dropSize()).to.be.equal(max_uint256);
    expect(await minterContract.owner()).to.be.equal(signerAddress);

  });

  it("Makes a new drop", async () => {
    await dynamicSketch.createDrop(
      artistAddress,
      "Testing Token",
      "TEST",
      "http://example.com/token/",
      10, 1, false
    );

    const dropResult = await dynamicSketch.getDropAtId(0);
    const minterContract = (await ethers.getContractAt(
      "OpenEditionsNFT",
      dropResult
    )) as OpenEditionsNFT;

    await minterContract.setPricing(10, 500, 0, 0, 10, 10);

    expect(await minterContract.name()).to.be.equal("Testing Token");
    expect(await minterContract.symbol()).to.be.equal("TEST");
    expect(await minterContract.dropSize()).to.be.equal(10);
    expect(await minterContract.owner()).to.be.equal(signerAddress);
  });

  describe("with an in order drop", () => {
    let signer1: SignerWithAddress;
    let minterContract: OpenEditionsNFT;
    beforeEach(async () => {
      signer1 = (await ethers.getSigners())[1];
      await dynamicSketch.createDrop(
        artistAddress,
        "Testing Token",
        "TEST",
        "http://example.com/token/",
        10, 10, false);

      const dropResult = await dynamicSketch.getDropAtId(0);
      minterContract = (await ethers.getContractAt(
        "OpenEditionsNFT",
        dropResult
      )) as OpenEditionsNFT;

      const mintCost = ethers.utils.parseEther("0.1");      

      await minterContract.setPricing(10, 500, mintCost, mintCost, 15, 15);
      await minterContract.setAllowedMinter(2);
    });

    it("creates a new drop", async () => {
      expect(await signer1.getBalance()).to.eq(
        ethers.utils.parseEther("10000")
      );

      // Mint first edition
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
      expect(await minterContract.totalSupply()).to.be.equal(1);
    });

    it("creates an authenticated edition", async () => {
      await minterContract.mintEdition(await signer1.getAddress(), {
        value: ethers.utils.parseEther("0.1")
      });
      expect(await minterContract.ownerOf(1)).to.equal(
        await signer1.getAddress()
      );
      expect(await minterContract.totalSupply()).to.be.equal(1);
    });

    it("does not allow re-initialization", async () => {
      await expect(
        minterContract.initialize(
          signerAddress,
          artistAddress,
          "test name",
          "SYM",
          "http://example.com/token/",
          12, 1, false)
      ).to.be.revertedWith("Initializable: contract is already initialized");
      await minterContract.mintEdition(await signer1.getAddress(), {
        value: ethers.utils.parseEther("0.1")
      });
      expect(await minterContract.ownerOf(1)).to.equal(
        await signer1.getAddress()
      );
      expect(await minterContract.totalSupply()).to.be.equal(1);
    });

    it("creates a set of editions", async () => {
      await minterContract.setPricing(10, 500, 0, 0, 10, 10);      
      await minterContract.setSalePrice(ethers.utils.parseEther("0.1"));
      await minterContract.setAllowedMinter(2);
      const [s1, s2, s3] = await ethers.getSigners();
      await minterContract.mintEditions([
        await s1.getAddress(),
        await s2.getAddress(),
        await s3.getAddress(),
      ], {
        value: ethers.utils.parseEther("0.3")
      });
      expect(await minterContract.ownerOf(1)).to.equal(await s1.getAddress());
      expect(await minterContract.ownerOf(2)).to.equal(await s2.getAddress());
      expect(await minterContract.ownerOf(3)).to.equal(await s3.getAddress());
      await minterContract.mintEditions([
        await s1.getAddress(),
        await s2.getAddress(),
        await s3.getAddress(),
        await s2.getAddress(),
        await s3.getAddress(),
        await s2.getAddress(),
        await s3.getAddress(),
      ], {
        value: ethers.utils.parseEther("0.7")
      });
      await expect(minterContract.mintEditions([signerAddress])).to.be.reverted;
      await expect(minterContract.mintEdition(signerAddress)).to.be.reverted;
      expect(await minterContract.totalSupply()).to.be.equal(10);
    });

    it("returns interfaces correctly", async () => {
      // ERC2891 interface
      expect(await minterContract.supportsInterface("0x2a55205a")).to.be.true;
      // ERC165 interface
      expect(await minterContract.supportsInterface("0x01ffc9a7")).to.be.true;
      // ERC721 interface
      expect(await minterContract.supportsInterface("0x80ac58cd")).to.be.true;
    });

    it("stops after editions are sold out", async () => {
      const [_, signer1] = await ethers.getSigners();

      expect(await minterContract.numberCanMint()).to.be.equal(10);
      expect(await minterContract.numberOfDifferentEdtions()).to.be.equal(10);

      // Mint first edition
      for (let i = 1; i <= 10; i++) {
        await expect(minterContract.mintEdition(await signer1.getAddress(), {
          value: ethers.utils.parseEther("0.1")
        }))
          .to.emit(minterContract, "Transfer")
          .withArgs(
            "0x0000000000000000000000000000000000000000",
            await signer1.getAddress(),
            i
          );
      }

      expect(await minterContract.numberCanMint()).to.be.equal(0);

      await expect(
        minterContract.mintEdition(signerAddress, {
          value: ethers.utils.parseEther("0.1")
        })
      ).to.be.revertedWith("Exceeded supply");

      expect(await minterContract.tokenURI(1)).to.be.equal("http://example.com/token/1.json");      
      expect(await minterContract.tokenURI(2)).to.be.equal("http://example.com/token/2.json");      
      expect(await minterContract.tokenURI(3)).to.be.equal("http://example.com/token/3.json");      
      expect(await minterContract.tokenURI(4)).to.be.equal("http://example.com/token/4.json");    
      expect(await minterContract.tokenURI(5)).to.be.equal("http://example.com/token/5.json");      
      expect(await minterContract.tokenURI(6)).to.be.equal("http://example.com/token/6.json");      
      expect(await minterContract.tokenURI(7)).to.be.equal("http://example.com/token/7.json");      
      expect(await minterContract.tokenURI(8)).to.be.equal("http://example.com/token/8.json");
      expect(await minterContract.tokenURI(9)).to.be.equal("http://example.com/token/9.json");      
      expect(await minterContract.tokenURI(10)).to.be.equal("http://example.com/token/10.json");  
      expect(await minterContract.totalSupply()).to.be.equal(10);
    });

    it("Change the number of edition mid mint", async () => {
      const [_, signer1] = await ethers.getSigners();

      expect(await minterContract.numberCanMint()).to.be.equal(10);
      expect(await minterContract.numberOfDifferentEdtions()).to.be.equal(10);

      // Mint first batch of editions
      for (let i = 0; i < 5; i++) {
        await expect(minterContract.mintEdition(await signer1.getAddress(), {
          value: ethers.utils.parseEther("0.1")
        }))
          .to.emit(minterContract, "Transfer")
          .withArgs(
            "0x0000000000000000000000000000000000000000",
            await signer1.getAddress(),
            1 + i
          );
      }

      expect(await minterContract.tokenURI(1)).to.be.equal("http://example.com/token/1.json");      
      expect(await minterContract.tokenURI(2)).to.be.equal("http://example.com/token/2.json");      
      expect(await minterContract.tokenURI(3)).to.be.equal("http://example.com/token/3.json");      
      expect(await minterContract.tokenURI(4)).to.be.equal("http://example.com/token/4.json");    
      expect(await minterContract.tokenURI(5)).to.be.equal("http://example.com/token/5.json");   

      expect(await minterContract.numberCanMint()).to.be.equal(5);
      expect(await minterContract.totalSupply()).to.be.equal(5);

      await minterContract.setNumberOfDifferentEdtions(3);

      expect(await minterContract.numberOfDifferentEdtions()).to.be.equal(3);

      // Mint second batch of editions
      for (let i = 0; i < 5; i++) {
        await expect(minterContract.mintEdition(await signer1.getAddress(), {
          value: ethers.utils.parseEther("0.1")
        }))
          .to.emit(minterContract, "Transfer")
          .withArgs(
            "0x0000000000000000000000000000000000000000",
            await signer1.getAddress(),
            1 + 5 + i
          );
      }

      expect(await minterContract.numberCanMint()).to.be.equal(0);

      await expect(
        minterContract.mintEdition(signerAddress, {
          value: ethers.utils.parseEther("0.1")
        })
      ).to.be.revertedWith("Exceeded supply");

      expect(await minterContract.tokenURI(1)).to.be.equal("http://example.com/token/1.json");      
      expect(await minterContract.tokenURI(2)).to.be.equal("http://example.com/token/2.json");      
      expect(await minterContract.tokenURI(3)).to.be.equal("http://example.com/token/3.json");      
      expect(await minterContract.tokenURI(4)).to.be.equal("http://example.com/token/4.json");    
      expect(await minterContract.tokenURI(5)).to.be.equal("http://example.com/token/5.json");      
      expect(await minterContract.tokenURI(6)).to.be.equal("http://example.com/token/3.json");      
      expect(await minterContract.tokenURI(7)).to.be.equal("http://example.com/token/1.json");      
      expect(await minterContract.tokenURI(8)).to.be.equal("http://example.com/token/2.json");
      expect(await minterContract.tokenURI(9)).to.be.equal("http://example.com/token/3.json");      
      expect(await minterContract.tokenURI(10)).to.be.equal("http://example.com/token/1.json");  

      expect(await minterContract.numberCanMint()).to.be.equal(0);
      expect(await minterContract.totalSupply()).to.be.equal(10);
    });

    it("Try to change the number of edition not as the owner", async () => {
      expect(await minterContract.numberOfDifferentEdtions()).to.be.equal(10);

      await expect(minterContract.connect(artist).setNumberOfDifferentEdtions(3)).to.be.revertedWith("Ownable: caller is not the owner");
    });    
  });
});
