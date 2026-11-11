// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PolizaParametrica.sol";

/// @notice Despliega PolizaParametrica (Field Shift), crea la zona Carumas y le deposita fondos.
/// Solo Fuji y wallet de pruebas: el contrato es educativo y no está auditado.
/// Uso: npm run contracts:deploy:poliza:fuji  (PRIVATE_KEY en contracts/.env)
contract DeployPoliza is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // Para la demo, la misma cuenta hace de aseguradora y de oráculo (como en el MVP).
        PolizaParametrica poliza = new PolizaParametrica(deployer);

        // Umbral 0.450 de humedad del suelo; ajústalo con el backtest de la web app.
        poliza.crearZona("Carumas", 450, 0.05 ether, 0.01 ether);

        (bool ok, ) = payable(address(poliza)).call{value: 0.2 ether}("");
        require(ok, "Deposito de fondos fallido");

        vm.stopBroadcast();

        console.log("PolizaParametrica deployed at:", address(poliza));
        console.log("Oraculo y owner:", deployer);
        console.log("Copia esta direccion en NEXT_PUBLIC_FIELD_SHIFT_CONTRACT");
    }
}
