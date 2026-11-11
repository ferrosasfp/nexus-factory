// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/PolizaParametrica.sol";

/// @dev Port 1:1 de contrato/test/PolizaParametrica.test.js del MVP Field Shift.
contract PolizaParametricaTest is Test {
    uint256 internal constant COBERTURA = 1 ether;
    uint256 internal constant PRIMA = 0.1 ether;
    bytes32 internal constant HASH = keccak256("datos-nasa-power-carumas-2026");

    PolizaParametrica public poliza;
    address public owner;
    address public oraculo;
    address public productorA;
    address public productorB;
    address public extrano;

    event IndiceReportado(uint256 indexed zonaId, uint16 indice, bool disparada, bytes32 hashDatos);

    function setUp() public {
        owner = address(this);
        oraculo = makeAddr("oraculo");
        productorA = makeAddr("productorA");
        productorB = makeAddr("productorB");
        extrano = makeAddr("extrano");

        poliza = new PolizaParametrica(oraculo);
        vm.deal(address(this), 10 ether);
        (bool ok, ) = payable(address(poliza)).call{value: 5 ether}("");
        require(ok, "deposito fallido");
        poliza.crearZona("Carumas", 450, COBERTURA, PRIMA);

        vm.deal(productorA, 1 ether);
        vm.deal(productorB, 1 ether);
    }

    function test_DescuentoRotacion() public view {
        assertEq(poliza.prima(0, false), PRIMA);
        assertEq(poliza.prima(0, true), 0.08 ether);
    }

    function test_RechazaPrimaIncorrectaYSegundaPoliza() public {
        vm.prank(productorA);
        vm.expectRevert(abi.encodeWithSelector(PolizaParametrica.PrimaIncorrecta.selector, 0.08 ether));
        poliza.comprarPoliza{value: PRIMA}(0, true);

        vm.prank(productorA);
        poliza.comprarPoliza{value: 0.08 ether}(0, true);

        vm.prank(productorA);
        vm.expectRevert(PolizaParametrica.YaAsegurado.selector);
        poliza.comprarPoliza{value: 0.08 ether}(0, true);
    }

    function test_SoloOraculoReporta() public {
        vm.prank(extrano);
        vm.expectRevert(PolizaParametrica.SoloOraculo.selector);
        poliza.reportarIndice(0, 300, HASH);
    }

    function test_PagaBajoUmbral() public {
        vm.prank(productorA);
        poliza.comprarPoliza{value: 0.08 ether}(0, true);

        vm.expectEmit(true, false, false, true, address(poliza));
        emit IndiceReportado(0, 380, true, HASH);
        vm.prank(oraculo);
        poliza.reportarIndice(0, 380, HASH);

        uint256 saldoA = productorA.balance;
        uint256 saldoPoliza = address(poliza).balance;
        vm.prank(productorA);
        poliza.reclamar(0);
        assertEq(productorA.balance, saldoA + COBERTURA);
        assertEq(address(poliza).balance, saldoPoliza - COBERTURA);

        // No puede cobrar dos veces, y quien no compró no cobra.
        vm.prank(productorA);
        vm.expectRevert(PolizaParametrica.SinPago.selector);
        poliza.reclamar(0);

        vm.prank(productorB);
        vm.expectRevert(PolizaParametrica.SinPago.selector);
        poliza.reclamar(0);
    }

    function test_NoPagaSobreUmbral() public {
        vm.prank(productorA);
        poliza.comprarPoliza{value: PRIMA}(0, false);

        vm.prank(oraculo);
        poliza.reportarIndice(0, 520, HASH);

        vm.prank(productorA);
        vm.expectRevert(PolizaParametrica.SinPago.selector);
        poliza.reclamar(0);
    }

    function test_NoVendeTrasReporte() public {
        vm.prank(oraculo);
        poliza.reportarIndice(0, 380, HASH);

        vm.prank(productorA);
        vm.expectRevert(PolizaParametrica.YaReportada.selector);
        poliza.comprarPoliza{value: PRIMA}(0, false);
    }
}
