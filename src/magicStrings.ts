import { logger } from "bondage-club-bot-api";
import { format as util_format } from "util";

type MagicKeypath = string;
type MagicString = string | string[];
type MagicSomething = { [index: string]: MagicSomething | MagicString };
export type MagicRepository = Record<MagicKeypath, MagicSomething>;

/**
 * Global repository of human-readable strings
 *
 * This is used to provide a bit of variety to responses.
 *
 * Just one string:
 * 'key.path': "Greetings, %s",
 *
 * Provide multiple versions of a string:
 * 'key.multipath': [
 *     "This is a test string!",
 *     "This is another string!"
 * ],
 */
let globalRepository: MagicRepository | null = null;

export function load(repository: MagicRepository) {
	globalRepository = repository;
}

export function format(keypath: MagicKeypath, ...args: (string | number)[]) {
	if (!globalRepository) {
		logger.fatal("no translation strings loaded! You must provide them with MagicStrings.load.");
		return "";
	}

	let key;
	const keys = keypath.split('.');
	let value: MagicString | null = null;
	let current: MagicSomething = globalRepository;
	while ((key = keys.shift())) {
		if (Array.isArray(current[key]) || typeof current[key] === "string") {
			value = current[key] as MagicString;
			break;
		}

		if (!current[key])
			break;

		current = current[key] as MagicSomething;
	}

	if (value === undefined) {
		logger.fatal(`failed to resolve ${keypath}`);
		return "";
	}

	// logger.info(`located "${keypath}" in "${JSON.stringify(value)}"`);
	if (Array.isArray(value)) {
		value = value[Math.floor((Math.random() * value.length))];
	}
	// logger.info(`resolved "${keypath}" to "${value}", formatting with ${JSON.stringify(args)}`);
	return util_format(value, ...args);
}

const ord = new Intl.PluralRules('en-US', { type: 'ordinal' });

const suffixes = new Map([
	['one', 'st'],
	['two', 'nd'],
	['few', 'rd'],
	['other', 'th']
]);

export function ordinal(num: number): string {
	const rule = ord.select(num);
	const suffix = suffixes.get(rule);
	return `${num}${suffix}`;
}
