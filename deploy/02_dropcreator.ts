module.exports = async ({ getNamedAccounts, deployments }: any) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const mintableAddress = (await deployments.get("OpenEditionsNFT"))
    .address;

  await deploy("DropCreator", {
    from: deployer,
    args: [mintableAddress],
    log: true,
  });
};
module.exports.tags = ["DropCreator"];
module.exports.dependencies = ["OpenEditionsNFT"];
