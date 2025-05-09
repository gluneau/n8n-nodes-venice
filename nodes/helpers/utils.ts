import { INodeProperties, NodeConnectionTypes } from 'n8n-workflow';

/**
 * Returns a notice field that shows information about what node types can be connected.
 */
export function getConnectionHintNoticeField(
	allowedOutputs: string[],
): INodeProperties {
	// Create a user-friendly string of the allowed output types
	const allowedOutputNames = [];
	for (const outputType of allowedOutputs) {
		if (outputType === NodeConnectionTypes.AiChain) {
			allowedOutputNames.push('AI Chain');
		} else if (outputType === NodeConnectionTypes.AiAgent) {
			allowedOutputNames.push('AI Agent');
		}
	}

	// Create the display string
	let displayString = 'Connect this to ';
	if (allowedOutputNames.length === 1) {
		displayString += `a ${allowedOutputNames[0]} node`;
	} else {
		// Multiple allowed connection types
		const lastOutputName = allowedOutputNames.pop();
		displayString += `${allowedOutputNames.join(', ')} or ${lastOutputName} nodes`;
	}

	return {
		displayName: displayString,
		name: 'connectionHint',
		type: 'notice',
		default: '',
	};
}
