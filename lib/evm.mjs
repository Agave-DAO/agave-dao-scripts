import abi from 'web3-eth-abi';
import pkg from 'web3-utils';


function stripBytePrefix(bytes) {
	return bytes.substring(0, 2) === "0x" ? bytes.slice(2) : bytes;
}

export function createExecutorId(id) {
	return `0x${String(id).padStart(8, "0")}`;
}

// Encodes an array of actions ({ to: address, calldata: bytes }) into the EVM call script format
// Sets spec id and concatenates per call
//   [ 20 bytes (address) ] + [ 4 bytes (uint32: calldata length) ] + [ calldataLength bytes (payload) ]
// Defaults spec id to 1
export function encodeCallScript(actions, specId = 1) {
	return actions.reduce((script, { to, calldata }) => {
		const addr = abi.encodeParameter("address", to);
		const calldataBytes = stripBytePrefix(calldata.slice(2));
		const length = abi.encodeParameter("uint256", calldataBytes.length / 2);

		// Remove first 12 bytes of padding for addr and 28 bytes for uint32
		return (
			script +
			stripBytePrefix(addr).slice(24) +
			stripBytePrefix(length).slice(56) +
			calldataBytes
		);
	}, createExecutorId(specId));
}

/**
 * Encode ACT function call
 * @param {string} signature Function signature
 * @param {any[]} params
 */
export function encodeActCall(signature, params = []) {
	const sigBytes = abi.encodeFunctionSignature(signature);

	const types = signature.replace(")", "").split("(")[1];

	// No params, return signature directly
	if (types === "") {
		return sigBytes;
	}

	const paramBytes = abi.encodeParameters(types.split(","), params);

	return `${sigBytes}${paramBytes.slice(2)}`;
}

export const { keccak256 } = pkg;
export const EMPTY_CALLS_SCRIPT = createExecutorId(1);