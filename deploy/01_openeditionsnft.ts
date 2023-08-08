module.exports = async ({ getNamedAccounts, deployments }: any ) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("OpenEditionsNFT", {
    from: deployer,
    log: true,
  });
};

module.exports.tags = ["OpenEditionsNFT"];
