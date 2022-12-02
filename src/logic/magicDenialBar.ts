import { AssetGet, BC_PermissionLevel, logger, VibratorIntensity } from "bondage-club-bot-api";
import _ from "lodash";

import { format, load, ordinal } from "../magicStrings";
import { wait } from "../utils";
import { AdministrationLogic } from "./administrationLogic";
import { dressLike, dressType, freeCharacter, lookUpTagInChatMessage, reapplyClothing } from "./magicSupport";

const permissionCost = 5;
const punishmentCost = 10;
const domLv2Cost = 10;
const adulationCost = 3;

/** The amount of time to wait for an order to be fulfilled */
const adulationMaxTime = 5 * 60 * 1000;

/** The amount of time to wait before bumping vibes up */
const orgasmMaxTime = 3 * 60 * 1000;

/** The amout of time to wait before automatically providing something to do */
const idleMaxTime = 5 * 60 * 1000;

/** The number of strikes that causes punishment to kick in */
const maxStrikes = 3;

/** The number of times to resist orgasms for punishment to stop */
const maxResist = 2;

load({
	greetings: {
		entry_1: "*[Welcome to the Denial Bar, where orgasms are prohibited. More info in %s's Bio. Please READ IT!]",
		entry_2: "*[Whisper '!leave' to %s and all the locks on you will be unlocked, but you will also be kicked out.]",
		known: [
			"Welcome back %s. Don't worry I didn't forget about you. Hihihi~",
			"Oh %s, you came back~. Well, you know what's going on around here!"
		],
		dom: [
			"Hello %s, and enjoy your time in the Denial Bar. You can earn !points by giving those cuties a good time. But be careful to not rush too much, or I will pass on rewarding you!",
			"Greetings %s, welcome to my special shop. You have now the possiblity to earn !points by… arousing other girls here. Then you will be able to use those point to !buy some of our particular offers. Just remember that I will not award any points if you rush too much, so take the time to play and arouse these nice girls~"
		],
		sub: [
			"%s, a dildo and a chastity belt have been locked on you, have fun! But not too much or I will punish you~",
			"Here's a dildo and chastity belt for you, %s. And don't forget, no cumming!~"
		],
		very_sub: [
			"Also, since you seems very submissive to me, I have decided to give you something else you may appreciate. A second vibrating dildo. Hihihi~",
			"Here's a little bonus for you, since you seem like a kinky girl! Hehe~"
		]
	},
	adulation: {
		failed: "I asked you something extremely easy and you were not able to do it, %s. %s",
		order: {
			kiss: "ORDER: Kiss %s's feet.",
			massage: "ORDER: Massage %s's back."
		},
		reward: {
			no_strike: {
				success: "",
				failure: [
					"One strike for you.",
					"I'm giving you a strike for that."
				]
			},
			orgasm: {
				success: "Here, you're allowed to cum once.",
				failure: "Too bad, you look like you could have enjoyed a bit of relief~"
			},
			lower_vibes: {
				success: "Here, I'll lower your vibes…",
				failure: "I guess you'll keep that dazed look for a bit longer!"
			}
		},
		success: {
			kiss: "You did good, %s. %s",
			massage: "Well done, %s, I bet she liked this!~ %s"
		},
		bought: "%s will take care of that. %s points remaining."
	},
	punishment: {
		too_many_strikes: "%d strikes, you need to be punished now.",
		begin: "You will now stay like this for a while. Try resisting a couple of orgasms and I may decide to free you again.",
		end: "Okay %s. I hope you have learned your lesson. You are free now.",
		no_bot: "Eheh, so you'd like to see me tied up? Soo nice of you. But my Mistress ordered me to manage this place… maybe another time?",
		bought: "Oh %s, it seems that %s would really enjoy to see you in our punishment outfit. And since she is a paying customer… Let her enjoy your struggles~",
		resist: "Would you look at that! It does seem you have a bit of self-control after all, %s~"
	},
	orgasm: {
		warn: "You had an orgasm without permission, %s. I am kind, but at the %s strike I WILL punish you.",
		punish: "%s, you had an orgasm without permission, again. You need to be punished.",
		lost: `*[One orgasm permission used. Orgasm permission remaining: %d]`,
		bought: "*%s has bought an orgasm permission for you. You have now %d orgasms allowed."
	},
	tampering: {
		warn: "%s! Do not mess with the vibrators, you are not allowed to do that. This is a strike for you!",
		reset: "*The vibrator automatically returns to the initial setting."
	},
	dom: {
		invalid_target: "Sorry, but no points will be awarded by playing with dominant girls or if they're being punished. Still, feel free to enjoy them!",
		points_awarded: "*Playing with %s netted you +%d points. Keep it up!"
	},
	vibes: {
		increase: "Hehe~ I see you're not enjoying yourself as much as I thought. Here's some motivation for you!",
		decrease: "Here, let me turn those toys down a bit…"
	}
});

const botDescription = `Welcome to the MAGIC DENIAL BAR !

FOR SUBMISSIVE CUSTOMERS:
To all our subs customer we provide a free vibrating dildo and chastity belt upon entering.
Those that demonstrate a solid submissive history will also receive a complementary anal vibrator!
Just remember that in our establishment you are prohibited to ever orgasm, unless explicitly authorized by one of our mistress customers.
Transgressors will be harshly punished.

FOR DOMINANT CUSTOMERS:
Our n̶a̶i̶v̶e̶ ̶s̶u̶b̶m̶i̶s̶s̶i̶v̶e̶ ̶d̶o̶l̶customers are here for your pleasure. Play with them, tease them and make them beg for your own amusement!
The more you arouse them the more points you will receive.
Use your hard earned points to buy new items to tease and reward your favorite play toy.

RULES:
- Orgasms are prohibited
- Messing with the vibrators is prohibited
You will receive one strike each time you break a rule. After ${maxStrikes} strikes you will be dollified.
To be released from your dollification predicament you have to demonstrate your obedience resisting ${maxResist} orgasms.

------------------------------------------------
SHOP:
In the shop you will be able to buy the following items:
- Orgasm permission (${permissionCost} points): give this permission to whoever you want (yourself included) to allow them to have a nice orgasm! A nice reward for a good girl.
- DomLv2 (${domLv2Cost} points): upgrade your status inside this bar, you will be given the authority to change the vibrators settings as you wish. But remember: turning them off is always prohibited!
- Adulation (${adulationCost} points): we want you to feel appreciated while you are here. You will get some lovely attentions.
- Punishment (${punishmentCost} points): applies our doll outfit to a girl of your choosing.

------------------------------------------------
COMMANDS: all commands must be whispered.

!leave - you will be freed and kicked out of the room.

Following commands are for dommes only.
!status - check your current status.
!buy - look at the available items in the shop.
!buy permission <name> - buy a permission for <name>.
!buy DomLv2 - upgrade your status in the room.
!buy adulation - someone will make you feel appreciated.
!buy punishment <name> - punish <name> by turning them into a doll.
`;


type MagicCharacterRole = "sub1" | "sub2" | "dom" | "dom2" | "";
type MagicReward = "no_strike" | "orgasm" | "lower_vibes";
type MagicOrderType = "kiss" | "massage";
type MagicOrders = {
	"adulation"?: {
		type: MagicOrderType;
		handle: NodeJS.Timeout;
		target: number;
		reward: MagicReward;
	}
};
export class MagicCharacter {
	character: API_Character;
	role: MagicCharacterRole = "";
	_points = 0;
	totalPointsGained = 0;
	lockCode = Math.floor(Math.random() * 9000 + 1000).toString();
	strike = 0;
	beingPunished = false;
	orgasmResisted = 0;
	allowedOrgasms = 0;
	_vibesIntensity = VibratorIntensity.LOW;
	lastActivity = 0;
	lastOrgasmTime = 0;
	rules: string[] = [];
	orders: MagicOrders = {};

	constructor(char: API_Character) {
		this.character = char;

		this.assignRole();
		this.applyRestraints();
	}

	public get name(): string {
		return this.character.VisibleName;
	}

	public get MemberNumber(): number {
		return this.character.MemberNumber;
	}

	public get points(): number {
		return this._points;
	}

	public set points(p: number) {
		this._points = p;
	}

	public changePoints(pointDiff: number) {
		pointDiff = Math.round(pointDiff);
		this._points = Math.max(0, this._points + pointDiff);
		if (pointDiff > 0)
			this.totalPointsGained += pointDiff;
	}

	public get vibesIntensity(): VibratorIntensity {
		return this._vibesIntensity;
	}

	public set vibesIntensity(v: VibratorIntensity) {
		// Cap the intensity. If denial is enabled, never allow them to be stopped
		if (v > VibratorIntensity.MAXIMUM) v = VibratorIntensity.MAXIMUM;
		const min = (this.rules.includes("denial") ? VibratorIntensity.LOW : VibratorIntensity.OFF);
		if (v <= min) v = min;

		const orgIntensity = this._vibesIntensity;
		this._vibesIntensity = v;

		// Update all vibes
		const vibes = ["ItemBreasts", "ItemVulva", "ItemButt"].map(group => this.character.Appearance.InventoryGet(group))
			.filter(i => i && i?.Vibrator && i.Vibrator.Intensity !== this._vibesIntensity);

		logger.debug(`found vibes ${vibes.length}, org: ${orgIntensity}, new: ${this._vibesIntensity}`);

		if (orgIntensity < this._vibesIntensity)
			this.character.Tell("Whisper", format("vibes.increase"));
		else if (orgIntensity > this._vibesIntensity)
			this.character.Tell("Whisper", format("vibes.decrease"));

		for (const item of vibes) {
			if (!item) continue;

			const inc = ((item.Vibrator?.Intensity ?? orgIntensity) < this._vibesIntensity);

			const Dict = [];
			Dict.push({ Tag: "DestinationCharacterName", Text: this.character.VisibleName, MemberNumber: this.MemberNumber });
			Dict.push({ Tag: "AssetName", AssetName: item.Name });

			this.character.connection.SendMessage("Action", `Vibe${inc ? "Increase" : "Decrease"}To${this._vibesIntensity}`, this.character.MemberNumber, Dict);

			item.Vibrator?.SetIntensity(this._vibesIntensity, false);
		}
	}

	toString() {
		return `${this.character}`;
	}

	assignRole() {

		if (this.character.Reputation.Dominant >= 50) {
			this.character.Tell("Chat", format('greetings.dom', this.name));
			this.role = 'dom';
			this.points = 5;
			return;
		}

		this.character.Tell("Chat", format('greetings.sub', this.name));
		this.role = 'sub1';
		this.rules.push("denial");

		if (this.character.Reputation.Dominant <= -50) {
			this.character.Tell("Chat", format('greetings.very_sub'));
			this.role = 'sub2';
		}
	}

	isDom() { return this.role.includes("dom"); }
	isSub() { return this.role.includes("sub"); }

	dressLike(type: dressType) {
		dressLike(this.character, type);
	}

	applyRestraints(force: boolean = false) {
		logger.info(`Applying restraints for ${this.role} to ${this}`);
		let item = null;
		if (this.role === "sub2") {
			const buttplug = AssetGet("ItemButt", "VibratingButtplug");
			item = this.character.Appearance.AddItem(buttplug);
			item?.Vibrator?.SetIntensity(this.vibesIntensity, false);
		}
		if (this.isSub() || force) {
			const dildo = AssetGet("ItemVulva", "VibratingDildo");
			item = this.character.Appearance.AddItem(dildo);
			item?.Vibrator?.SetIntensity(this.vibesIntensity, false);

			const belt = AssetGet("ItemPelvis", "PolishedChastityBelt");
			item = this.character.Appearance.AddItem(belt);
			item?.SetDifficulty(100);
			item?.Extended?.SetType("ClosedBack");

			// TODO: locks
			// InventoryLock(sender, InventoryGet(sender, "ItemPelvis"), { Asset: AssetGet("Female3DCG", "ItemMisc", "CombinationPadlock") })
			// InventoryGet(sender, "ItemPelvis").Property.CombinationNumber = customerList[sender.MemberNumber].lockCode;
		}
	}

	dollLock() {
		// TODO: locks
		// const lock = AssetGet("ItemMisc", "CombinationPadlock");
		// InventoryLock(sender, InventoryGet(sender, "ItemArms"), { Asset: assetLock })
		// InventoryGet(sender, "ItemArms").Property.CombinationNumber = customerList[sender.MemberNumber].lockCode;
		// InventoryLock(sender, InventoryGet(sender, "ItemHead"), { Asset: assetLock })
		// InventoryGet(sender, "ItemHead").Property.CombinationNumber = customerList[sender.MemberNumber].lockCode;
		// InventoryLock(sender, InventoryGet(sender, "ItemMouth3"), { Asset: assetLock })
		// InventoryGet(sender, "ItemMouth3").Property.CombinationNumber = customerList[sender.MemberNumber].lockCode;
	}

	completeAdulation(target: MagicCharacter, msg: string) {
		const data = this.orders.adulation;
		if (!data) return;

		if (target.MemberNumber !== this.orders.adulation?.target) return;

		if (!msg.includes("ChatOther")) return;

		let success = false;
		switch (data.type) {
			case "kiss":
				success = msg.includes("Kiss") && (msg.includes("ItemBoots") || msg.includes("ItemFeet"));
				break;

			case "massage":
				success = msg.includes("Massage") && (msg.includes("ItemTorso"));
				break;
		}

		if (!success) return;

		logger.info(`${this} performed adulation on ${target}`);

		const rewardMsg = format(`adulation.reward.${data.reward}.success`);

		this.character.Tell("Whisper", format(`adulation.success.${data.type}`, this.name, rewardMsg));

		switch (data.reward) {
			case "orgasm":
				this.allowedOrgasms += 1;
				break;

			default:
				break;
		}

		clearTimeout(this.orders.adulation?.handle);
		delete this.orders.adulation;
	}

	private adulationCheck() {
		logger.verbose(`checking adulation result of ${this}`);
		const data = this.orders.adulation;
		if (!data) {
			logger.error(`Spurious adulation check triggered for ${this}`);
			return;
		}

		const rewardMsg = format(`adulation.reward.${data.reward}.failure`);
		this.character.Tell("Whisper", format('adulation.failed', this.name, rewardMsg));

		switch (data.reward) {
			case "no_strike":
				this.giveStrike();
				break;

			default:
				break;
		}

		delete this.orders.adulation;
	}

	adulate(target: MagicCharacter, proposeReward?: MagicReward) {
		const orders: MagicOrderType[] = [];
		orders.push("kiss");

		if (this.character.CanInteract())
			orders.push("massage");

		const type = _.sample(orders) as MagicOrderType;

		const rewards: MagicReward[] = [];
		if (proposeReward) {
			rewards.push(proposeReward);
		} else {
			rewards.push("no_strike");
			rewards.push("orgasm");
			if (this.vibesIntensity > VibratorIntensity.LOW)
				rewards.push("lower_vibes");
		}
		const reward = _.sample(rewards) as MagicReward;

		this.orders = { "adulation": { type, reward, handle: setTimeout(this.adulationCheck.bind(this), adulationMaxTime), target: target.MemberNumber } };
		this.character.Tell("Whisper", format(`adulation.order.${type}`, target.name));
	}

	giveStrike() {
		this.strike += 1;
		if (this.strike >= maxStrikes) {
			this.character.Tell("Whisper", format("punishment.too_many_strikes", maxStrikes));
			this.applyPunishment();
		}
	}

	applyPunishment() {
		this.dressLike("doll");
		this.dollLock();
		this.applyRestraints(true);
		this.beingPunished = true;
		this.character.Tell("Chat", format('punishment.begin'));
	}

	liftPunishment() {
		this.strike = 0;
		this.beingPunished = false;
		freeCharacter(this.character);
		reapplyClothing(this.character);
		this.applyRestraints();
	}

	hasOrgasmedRecently() {
		if (this.lastOrgasmTime === 0) return false;

		return (Date.now() - this.lastOrgasmTime) < orgasmMaxTime;
	}

	private orgasmReaction() {
		this.strike += 1;
		if (this.strike < maxStrikes) {
			this.character.Tell("Chat", format('orgasm.warn', this.name, ordinal(maxStrikes)));
			return;
		}

		this.character.Tell("Chat", format('orgasm.punish', this.name));
		this.applyPunishment();
	}

	didResistOrgasm() {
		if (!this.rules.includes("denial")) return;

		this.lastOrgasmTime = Date.now();
		this.vibesIntensity = VibratorIntensity.LOW;

		if (this.beingPunished) {
			this.orgasmResisted += 1;

			if (this.orgasmResisted < maxResist) {
				this.character.Tell("Chat", format('punishment.resist', this.name));
				return;
			}

			this.character.Tell("Chat", format('punishment.end', this.name));
			this.orgasmResisted = 0;
			this.liftPunishment();
		}
	}

	didOrgasm() {
		if (!this.rules.includes("denial")) return;

		this.lastOrgasmTime = Date.now();
		this.vibesIntensity = VibratorIntensity.LOW;

		if (!this.beingPunished) {
			if (this.allowedOrgasms > 0) {
				this.allowedOrgasms -= 1;
				this.character.Tell("Emote", format('orgasm.lost', this.allowedOrgasms));
			} else {
				setTimeout(this.orgasmReaction.bind(this), 5 * 1000);
			}
		}
	}
}

export class MagicDenialBar extends AdministrationLogic {
	/** Our list of trusted patrons */
	customers: Map<number, MagicCharacter>;

	readonly connection: API_Connector;

	constructor(connection: API_Connector) {
		super({});
		this.connection = connection;
		this.customers = new Map();
		this.connection.Player.SetDescription(botDescription);
		this.connection.Player.SetInvisible(false);
		this.registerCommands();

		setInterval(this.update.bind(this), 10_000);
	}

	resetRoom() {
		this.customers = new Map();
	}

	getActiveCustomer(memberNumber: number) {
		const customer = this.customers.get(memberNumber);
		if (!customer) return null;

		if (!this.connection.chatRoom.characters.includes(customer.character))
			return null;

		return customer;
	}

	update() {
		if (this.connection.Player.ChatRoomPosition !== 0)
			void this.connection.Player.MoveToPos(0);

		// Bump the vibes up for anyone that hasn't orgasmed in a while
		this.customers.forEach((character) => {
			if (character.isSub() && !character.hasOrgasmedRecently())
				character.vibesIntensity++;
		});

		// Find the character that has been idle the most
		const charactersByActivity = this.findCandidatesForAdulation().sort((a, b) => b.lastActivity - a.lastActivity);
		const mostIdleCharacter = charactersByActivity.at(0);
		if (mostIdleCharacter && (Date.now() - mostIdleCharacter.lastActivity) > idleMaxTime) {
			// Find a dom that's not already targetted
			const targeted = charactersByActivity.map(c => c.orders.adulation?.target);
			const untargetedDoms = Array.from(this.customers).map(([n, c]) => c).filter(c => c.isDom() && !targeted.includes(c.MemberNumber));
			const selectedDom = _.sample(untargetedDoms);

			if (selectedDom)
				mostIdleCharacter.adulate(selectedDom);
		}
	}

	findCandidatesForAdulation() {
		const subList = [];
		for (const [idx, potentialTarget] of this.customers) {
			void idx;
			if (potentialTarget.isSub() && !potentialTarget.beingPunished && !("adulation" in potentialTarget.orders))
				subList.push(potentialTarget);
		}
		return subList;
	}

	registerCommands() {
		this.registerCommand("leave", (connection, args, sender) => {
			freeCharacter(sender);
			sender.Appearance.RemoveItem("ItemPelvis");
			sender.Appearance.RemoveItem("ItemVulva");
			sender.Appearance.RemoveItem("ItemButt");
			void sender.Kick();
		}, "Get freed and leave the room");

		this.registerCommand("status", this.onStatusCommand.bind(this), "Check your current status.");
		this.registerCommand("points", this.onStatusCommand.bind(this));

		this.registerCommandParsed("buy", this.onBuyCommand.bind(this), "Buy items from the shop");
		this.registerCommandParsed("shop", this.onBuyCommand.bind(this));

		this.registerSUCommand("role", (connection, args, sender) => {
			const customer = this.getActiveCustomer(sender);
			if (!customer) return;

			let target;
			let role;
			let char;

			logger.info("!su role", ...args);
			const arg1 = args.shift();
			const arg2 = args.shift();
			if (arg1 && ["sub1", "sub2", "dom", "dom2"].includes(arg1)) {
				role = arg1;
				target = customer;
			} else if (arg1 && (char = this.identifyPlayerInRoom(connection.chatRoom, arg1)) && (typeof char === "object")
				&& arg2 && ["sub1", "sub2", "dom", "dom2"].includes(arg2)) {
				target = this.getActiveCustomer(char.MemberNumber);
				role = arg2;
			}

			if (!target || !role) {
				customer.character.Tell("Whisper", "Missing target and/or role: !su role [member] [sub1|sub2|dom|dom2]");
				return;
			}

			logger.info(`about to op ${target} to ${role}`);
			customer.character.Tell("Whisper", `Role changed to ${role}`);
			target.role = role as MagicCharacterRole;
			target.applyRestraints();
			if (customer.MemberNumber !== target.MemberNumber) {
				target.character.Tell("Whisper", `Role changed to ${role} by ${customer}`);
			}
		});


		this.registerSUCommand("points", (connection, args, sender) => {
			const customer = this.getActiveCustomer(sender);
			if (!customer) return;

			logger.info("!su points", args);

			const arg = args.shift();
			if (!arg) {
				customer.character.Tell("Whisper", "Missing amount of points: !su points [amount]");
				return;
			}

			const amount = parseInt(arg, 10);

			customer.character.Tell("Whisper", `Added ${amount} points`);
			customer.changePoints(amount);
		});

		this.registerSUCommand("strike", (connection, args, sender) => {
			const customer = this.getActiveCustomer(sender);
			if (!customer) return;

			logger.info("!su strike");

			customer.character.Tell("Whisper", "Gave you one strike");
			customer.giveStrike();
		});
	}

	private onStatusCommand(connection: API_Connector, args: string, sender: API_Character) {
		const customer = this.getActiveCustomer(sender.MemberNumber);
		if (!customer) {
			logger.error(`Recieved "status" command from a non-customer: ${sender}`);
			return;
		}
		const m = [];
		if (customer.isSub()) {
			if (customer.beingPunished) {
				m.push(`You're a submissive currently being punished, and need to resist ${maxResist - customer.orgasmResisted} orgasms before being released.`);
			} else {
				m.push(`You're a submissive and currently have ${customer.strike} strikes and ${customer.allowedOrgasms} allowed orgasms.`);

				const adulation = customer.orders.adulation;
				if (adulation) {
					const target = this.getActiveCustomer(adulation.target);
					m.push(`---------`);
					m.push(`You have been ordered to ${adulation.type} ${target?.name}.`);
				}
			}
		} else if (customer.isDom()) {
			m.push(`Your role is ${customer.role}, and you have ${customer.points} points to use in the shop.`);
			m.push(`- ${customer.strike} strikes`);
		}

		sender.Tell("Whisper", m.join("\n"));
	}

	private onBuyCommand(connection: API_Connector, args: string[], sender: API_Character) {
		const customer = this.getActiveCustomer(sender.MemberNumber);
		if (!customer) {
			logger.error(`Recieved "buy" command from a non - customer: ${sender.VisibleName}, (${sender.MemberNumber})`);
			return;
		}

		if (!customer.isDom()) {
			sender.Tell("Whisper", "Only dominants can use the shop!");
			return;
		}

		const cmd = args.shift()?.toLowerCase();
		const id = args.shift();

		switch (cmd) {
			case "permission": {
				if (customer.points < permissionCost) {
					sender.Tell("Whisper", `You need ${permissionCost} points, and you only have ${customer.points}.`);
					return;
				}

				if (!id) {
					sender.Tell("Whisper", "You have to choose someone. !buy permission <name>. You can also name yourself.");
					return;
				}

				const target = this.identifyPlayerInRoom(this.connection.chatRoom, id);
				if (typeof target === "string") {
					sender.Tell("Whisper", target);
					return;
				}

				const targetCustomer = this.getActiveCustomer(target.MemberNumber);
				if (!targetCustomer) {
					logger.error(`Couldn't find ${id} in chatroom?`);
					return;
				}

				logger.info(`${customer} bought permission for ${targetCustomer}.`);
				customer.changePoints(-permissionCost);
				sender.Tell("Emote", `*Permission bought. Points remaining: ${customer.points}`);

				targetCustomer.allowedOrgasms += 1;
				target.Tell("Emote", format('orgasm.bought', customer.name, targetCustomer.allowedOrgasms));
			}
				break;

			case "punishment": {
				if (customer.points < punishmentCost) {
					sender.Tell("Whisper", `You need ${punishmentCost} points, and you only have ${customer.points}.`);
					return;
				}

				if (!id) {
					sender.Tell("Whisper", "You have to choose someone. !buy punishment <name>. You can also name yourself.");
					return;
				}

				const target = this.identifyPlayerInRoom(this.connection.chatRoom, id);
				if (typeof target === "string") {
					sender.Tell("Whisper", target);
					return;
				}

				const targetCustomer = this.getActiveCustomer(target.MemberNumber);
				if (!targetCustomer) {
					logger.error(`Couldn't find ${id} in chatroom?`);
					return;
				}

				if (targetCustomer.character.IsBot()) {
					sender.Tell("Whisper", format('punishment.no_bot'));
					return;
				}

				logger.info(`${customer} bought punishment for ${targetCustomer}.`);
				customer.changePoints(-punishmentCost);
				sender.Tell("Emote", `*Punishment bought. Points remaining: ${customer.points}`);

				target.Tell("Chat", format('punishment.bought', targetCustomer.name, customer.name));
				targetCustomer.applyPunishment();

			}
				break;

			case "adulation": {
				if (customer.points < adulationCost) {
					sender.Tell("Whisper", `You need ${adulationCost} points, and you only have ${customer.points}.`);
					return;
				}

				const subList = this.findCandidatesForAdulation();
				if (subList.length === 0) {
					sender.Tell("Whisper", "There are no available submissive customers at the moment. You cannot buy this item.");
					return;
				}

				const targetSub = subList[Math.floor(Math.random() * subList.length)];
				customer.changePoints(-adulationCost);
				logger.info(`${sender} bought adulation from ${targetSub.name}`);

				sender.Tell("Whisper", format('adulation.bought', targetSub.name, customer.points));
				targetSub.adulate(customer, "no_strike");
			}
				break;

			case "domlv2":
				if (customer.isDom()) {
					if (customer.points < domLv2Cost) {
						sender.Tell("Whisper", `You need ${domLv2Cost} points, and you only have ${customer.points}.`);
						return;
					}

					logger.info(`${sender} bought DomLv2.`);
					customer.changePoints(-domLv2Cost);
					sender.Tell("Emote", `*Level up bought. Points remaining: ${customer.points}`);

					customer.role = "dom2";
					sender.Tell("Whisper", "You can now freely change the vibrator settings. But remember that you can NEVER turn them off! Have fun.");
					break;
				}

			// eslint-disable-next-line no-fallthrough
			default: {
				const mess = [];
				mess.push(`You have ${customer.points} points at the moment. Here is a list of available items:`);
				mess.push("-----------------------------------");
				mess.push(`Permission (${permissionCost} pt)`);
				mess.push(`Adulation (${adulationCost} pt)`);
				mess.push(`Punishment (${punishmentCost} pt)`);

				if (customer.role === "dom") {
					mess.push(`DomLv2 (change vibrator settings) (${domLv2Cost} pt)`);
				}
				mess.push("-----------------------------------");
				mess.push("To buy an item say '!buy <item>.");

				sender.Tell("Whisper", mess.join("\n"));
			}
				break;
		}
	}

	protected onCharacterLeft(connection: API_Connector, character: API_Character, intentional: boolean): void {
		// this.customers.delete(character.MemberNumber);
	}

	protected async onCharacterEntered(connection: API_Connector, character: API_Character): Promise<void> {
		if (character.IsBot()) return;

		const kickReasons = [];
		if (character.ItemPermission > BC_PermissionLevel.OwnerLoverWhitelistDominant) {
			logger.info(`${character}): ${character.ItemPermission}`);
			kickReasons.push("Whitelist too high");
		}

		const itemsNeeded = [
			["ItemDevices", "SmallWoodenBox"],
			["ItemDevices", "LowCage"],
			["ItemArms", "BoxTieArmbinder"],
			["ItemMouth", "ClothStuffing"],
			["ItemMouth2", "HarnessPanelGag"],
			["ItemMouth3", "LatexPostureCollar"],
			["ItemHead", "LatexBlindfold"],
			["ItemFeet", "SpreaderMetal"],
			["ItemPelvis", "PolishedChastityBelt"],
			["ItemVulva", "VibratingDildo"]
		];

		for (const needed of itemsNeeded) {
			const asset = AssetGet(needed[0] as AssetGroupName, needed[1]);
			if (!character.IsItemPermissionAccessible(asset)) {
				logger.info(`${character}): missing ${needed[0]}:${needed[1]}`);
				kickReasons.push(`Needs access to ${asset.DynamicDescription(character)}`);
			}
		}

		if (!["Hybrid", "Automatic"].includes(character.UNSAFE_rawData?.ArousalSettings?.Active)) {
			logger.info(`${character}: ${character.UNSAFE_rawData?.ArousalSettings?.Active}`);
			kickReasons.push("Arousal must be either Hybrid or Automatic");
		}

		if (kickReasons.length > 0) {
			character.Tell("Emote", `*[The following is needed for that room to function:\n${kickReasons.map(s => " - " + s + ".").join("\n")}\n\nYou will be kicked in 10 seconds. You can change and comeback if you want.]`);
			if (character.IsRoomAdmin()) {
				character.Tell("Whisper", "[As you are a room admin, you will be allowed to stay.]");
				logger.info(`Not kicking room admin ${character}`);
				// } else if (!strict) {
				// 	character.Tell("Whisper", "[As you were already in the room when the bot started, you will be allowed to stay, but the bot will ignore you]");
				// 	logger.info(`Not kicking already present ${character}`);
				// 	return;
			} else {
				logger.info(`Kicking ${character}`);
				await wait(10_000);
				await character.Kick();
				return;
			}
		}

		character.Tell("Emote", format('greetings.entry_1', connection.Player.VisibleName));
		character.Tell("Emote", format('greetings.entry_2', connection.Player.VisibleName));

		await wait(5_000);

		let customer = this.customers.get(character.MemberNumber);
		if (customer) {
			customer.character = character;

			character.Tell("Chat", format('greetings.known', character.VisibleName));

			if (customer.beingPunished) {
				customer.dressLike("doll");
				customer.dollLock();
				customer.applyRestraints(true);
			} else {
				customer.applyRestraints();
			}
		} else {
			customer = new MagicCharacter(character);
			this.customers.set(character.MemberNumber, customer);
		}
	}

	protected async onMessage(connection: API_Connector, message: BC_Server_ChatRoomMessage, sender: API_Character): Promise<void> {
		if (sender.IsBot()) return;

		const customer = this.getActiveCustomer(sender.MemberNumber);
		if (!customer) return;

		const targetID = lookUpTagInChatMessage(message, "TargetMemberNumber");
		const target = targetID ? this.getActiveCustomer(targetID as number) : null;
		logger.info(`recieved message ${message.Content} from ${sender} targetting ${target} (${targetID})`);

		const msg = message.Content;
		if (message.Type === "Action") {
			// console.log("msg :" + msg)
			// console.log("Keys :" + Object.keys(data.Dictionary))
			// console.log("Dictionary 0 :" + data.Dictionary[0].MemberNumber)
			if ((msg.includes("Vibe") || msg.includes("Dildo") || msg.includes("Buttplug")) && (msg.includes("creaseTo-1") || ((msg.includes("creaseTo") || msg.includes("ModeChange")) && customer.role !== "dom2"))) {
				connection.SendMessage("Chat", format('tampering.warn', sender.VisibleName));

				await wait(2000);

				if (!target) {
					logger.error(`failed to find target of vibe change message ${JSON.stringify(message)}`);
				} else {
					const dildoAsset = target.character.Appearance.InventoryGet("ItemVulva");
					dildoAsset?.Vibrator?.SetIntensity(target.vibesIntensity, false);
					const buttAsset = target.character.Appearance.InventoryGet("ItemButt");
					buttAsset?.Vibrator?.SetIntensity(target.vibesIntensity, false);
				}
				connection.SendMessage("Emote", format('tampering.reset'));

				customer.giveStrike();
			}
		} else if (message.Type === "Activity") {
			logger.info(`Processing activity ${message.Content} from ${customer} to ${target}`);

			if (msg.startsWith("OrgasmResist")) {
				logger.info(`${sender} resisted her orgasm`);
				customer.didResistOrgasm();
				return;
			} else if (msg.startsWith("Orgasm")) {
				logger.info(`${sender} failed to resist her orgasm`);
				customer.didOrgasm();
				return;
			}

			if (!target) {
				logger.error(`failed to resolve message target: ${targetID}`);
				return;
			}

			if (customer.isDom()) {
				logger.info(`${customer} is Dom, checking activity effects`);
				const lastActivity = customer.lastActivity;
				customer.lastActivity = Date.now();

				if (lastActivity + Date.now() <= 30000) {
					logger.info(`${customer} too fast!`);
					return;
				}

				// let ActivityName = lookUpTagInChatMessage<string>(message, "ActivityName");
				// let ActivityGroup = lookUpTagInChatMessage<string>(message, "ActivityGroup");

				if (target.beingPunished || !target.isSub()) {
					sender.Tell("Whisper", format('dom.invalid_target'));
					return;
				}

				// TODO: BotAPI doesn't provide that
				// Converts from activity name to the activity object
				// if (typeof ActivityName === "string") ActivityName = AssetGetActivity(targetChar.AssetFamily, ActivityName);
				// if ((ActivityName == null) || (typeof ActivityName === "string")) return;

				// Calculates the next progress factor
				// var Factor = (PreferenceGetActivityFactor(targetChar, ActivityName.Name, (targetChar.ID == 0)) * 5) - 10; // Check how much the character likes the activity, from -10 to +10
				// Factor = Factor + (PreferenceGetZoneFactor(targetChar, ActivityGroup) * 5) - 10; // The zone used also adds from -10 to +10

				const settings = target.character.ArousalSettings;
				logger.verbose(`target ${target} arousal: ${settings?.Progress}, ${settings?.ProgressTimer}`);
				const startProgress = settings?.Progress || 0;
				const waitTime = Math.max((settings?.ProgressTimer || 0) * 1000, 8000);

				logger.verbose(`${customer} activity, scheduling arousal check in ${waitTime}`);

				await wait(waitTime);

				const stopSettings = target.character.ArousalSettings;
				const endProgress = stopSettings?.Progress || startProgress;
				logger.verbose(`target ${target} arousal: ${stopSettings?.Progress}, ${stopSettings?.ProgressTimer}`);
				const progressMade = endProgress - startProgress;
				if (progressMade <= 0) {
					logger.info(`${customer} activity, no progress made on ${target}! ${startProgress} → ${endProgress}`);
					return;
				}

				logger.verbose(`${customer} activity made ${target} arousal change by ${progressMade}, awarding points`);

				const pointsGained = Math.max(Math.floor(progressMade / 10), 0) + 1;
				customer.changePoints(pointsGained);

				sender.Tell("Emote", format('dom.points_awarded', target.name, pointsGained));
				logger.info(`${sender} gained ${pointsGained} points`);

			} else if (customer.isSub()) {
				customer.lastActivity = Date.now();

				customer.completeAdulation(target, msg);
			}
		}
	}
}
