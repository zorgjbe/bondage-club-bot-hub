import { AssetGet, BC_PermissionLevel, logger, VibratorIntensity } from "bondage-club-bot-api";
import { AdministrationLogic } from "./administrationLogic";
import { dressLike, dressType, freeCharacter, reapplyClothing } from "./magicSupport";

const permissionCost = 5;
const punishmentCost = 10;
const domLv2Cost = 10;
const adulationCost = 3;

const botDescription = `Welcome to the MAGIC DENIAL BAR

FOR SUBMISSIVE CUSTOMERS:
To all our subs customer we provide a free vibrating dildo and chastity belt upon entering.
Those that demonstrate to have solid submissive history will also receive a complementary anal vibrator!
Just remember that in our establishment you are prohibited to have orgasms, unless properly authorized by one of our mistress customers.
Trasgressors will be harshly punished.

FOR DOMINANT CUSTOMERS:
Our naive submissive dol- customers are here for your pleasure. Play with them, tease them and make them beg for your own amusing!
The more you arouse them the more credit (points) you will receive.
Use your hard earned points to buy new items to tease and reward your favorite play toy.

RULES:
- Orgasms are prohibited
- Messing with the vibrators is prohibited
You will receive one strike each time you break a rule. After 3 strikes you will be dollified.
To be released from your dollification predicament you have to demonstrate your obedience resisting 2 orgasms.

------------------------------------------------
SHOP:
In the shop you will be able to buy the following items:
- Orgasm permission (${permissionCost} points): give this permission to whoever you want (yourself included) to allow them to have a nice orgasm! A nice reward for a good girl.
- DomLv2 (${domLv2Cost} points): upgrade your status inside this bar, you will be given the authority to change the vibrators settings as you wish. But remember: turning them off is always prohibited!
- Adulation (${adulationCost} points): we want you to feel appreciated while you are here. You will get some lovely attentions.

------------------------------------------------
COMMANDS: all commands must be whispered.

!leave - you will be freed and kicked out of the room.

Following commands are for dommes only.
!point - check how many points you have.
!shop - identical to !buy, read below.
!buy - look at the available items in the shop.
!buy permission <name> - buy a permission for <name>
!buy DomLv2 - upgrade your status in the room.
!buy adulation - someone will make you feel appreciated.
`;


type MagicCharacterRole = "sub1" | "sub2" | "dom" | "dom2" | "";

export class MagicCharacter {
	readonly character: API_Character;
	role: MagicCharacterRole = "";
	points = 0;
	totalPointsGained = 0;
	lockCode = Math.floor(Math.random() * 9000 + 1000).toString();
	strike = 0;
	beingPunished = false;
	orgasmResisted = 0;
	allowedOrgasms = 0;
	buttIntensity = VibratorIntensity.LOW;
	vulvaIntensity = VibratorIntensity.LOW;
	lastActivity = Date.now();
	rules: string[] = [];
	orders: any = {};

	constructor(char: API_Character) {
		this.character = char;

		this.rules.push("denial");
		this.assignRole();
		this.applyRestraints();
	}

	public get name(): string {
		return this.character.VisibleName;
	}

	public get MemberNumber(): number {
		return this.character.MemberNumber;
	}


	toString() {
		return `${this.character}`;
	}

	assignRole() {
		if (this.character.Reputation.Dominant < 50) {
			this.character.Tell("Chat", `${this.name}, a dildo and a chastity belt have been locked on you, have fun! But not too much or I will punish you.`);
			this.role = 'sub1';
		} else {
			this.character.Tell("Chat", `Greetings ${this.name}, welcome to my special shop. You have now the possiblity to earn !points by… arousing other girls here. Then you will be able to use those point to !buy some of our particular offers. Just remember that I will not award any points if you rush too much. Just take the time to play and arouse these nice girls.`);
			this.role = 'dom';
			this.points = 5;
		}

		if (this.character.Reputation.Dominant <= -50) {
			this.character.Tell("Chat", "Also, since you seems very submissive to me, I have decided to give you something else you may appreciate. A second vibrating dildo. Hihihi~");
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
			item?.Vibrator?.SetIntensity(this.buttIntensity, false);
		}
		if (this.isSub() || force) {
			const dildo = AssetGet("ItemVulva", "VibratingDildo");
			item = this.character.Appearance.AddItem(dildo);
			item?.Vibrator?.SetIntensity(this.vulvaIntensity, false);

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

	private adulationCheck() {
		const data = this.orders.adulation;
		if (!data) {
			logger.error(`Spurious adulation check triggered for ${this}`);
			return;
		}

		delete this.orders.adulation;
		this.character.Tell("Whisper", "I asked you something extremely easy and you were not able to do it. This is one strike for you.");
		this.giveStrike();
	}

	adulate(target: MagicCharacter) {
		this.orders = { "adulation": { timeoutHandle: setTimeout(this.adulationCheck.bind(this), 5 * 60 * 1000), adulationTarget: target.MemberNumber } };
		this.character.Tell("Whisper", `ORDER: Kiss ${target.name}'s feet or you will receive one strike.`);
	}

	giveStrike() {
		this.strike += 1;
		if (this.strike >= 3) {
			this.character.Tell("Whisper", "3 strikes, you need to be punished now.");
			/* FIXME: Original makes you punish yourself, and the bot isn't a customer */
			this.applyPunishment();
		}
	}

	applyPunishment() {
		this.dressLike("doll");
		this.dollLock();
		this.applyRestraints(true);
		this.beingPunished = true;
		this.character.Tell("Chat", "You will now stay like this for a while. Try resisting a couple of orgasms and I may decide to free you again.");
	}

	private orgasmReaction() {
		this.strike += 1;
		if (this.strike <= 2) {
			this.character.Tell("Chat", `${this.name}, you had an orgasm without permission. I am kind, but at the third strike I WILL punish you.`);
		} else {
			this.character.Tell("Chat", `${this.name}, you had an orgasm without permission, again. You need to be punished.`);
			this.applyPunishment();
		}
	}

	didOrgasm(successfully: boolean) {
		if (!successfully) {
			if (this.beingPunished) {
				this.orgasmResisted += 1;
				if (this.orgasmResisted >= 2) {
					this.character.Tell("Chat", `Okay ${this.name}. I hope you have learned your lesson. You are free now.`);
					this.orgasmResisted = 0;
					this.strike = 0;
					this.beingPunished = false;
					freeCharacter(this.character);
					reapplyClothing(this.character);
					this.applyRestraints();
				}
			}
			return;
		}

		if (this.rules.includes("denial") && !this.beingPunished) {
			if (this.allowedOrgasms > 0) {
				this.allowedOrgasms -= 1;
				this.character.Tell("Emote", `*[One orgasm permission used. Orgasm permission remaining: ${this.allowedOrgasms}]`);
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

	registerCommands() {
		this.registerCommand("leave", (connection, args, sender) => {
			freeCharacter(sender);
			sender.Appearance.RemoveItem("ItemPelvis");
			sender.Appearance.RemoveItem("ItemVulva");
			sender.Appearance.RemoveItem("ItemButt");
			void sender.Kick();
		}, "Get freed and leave the room");

		this.registerCommand("points", (connection, args, sender) => {
			const customer = this.getActiveCustomer(sender.MemberNumber);
			if (!customer) {
				logger.error(`Recieved "points" command from a non-customer: ${sender.VisibleName}, (${sender.MemberNumber})`);
				return;
			}
			sender.Tell("Whisper", `You have ${customer.points} points. Use them with !shop or !buy.`);
		}, "Show your current points balance");

		this.registerCommandParsed("buy", this.onBuyCommand.bind(this), "Buy items from the shop");
		this.registerCommandParsed("shop", this.onBuyCommand.bind(this), "Buy items from the shop");

		this.registerSUCommand("role", (connection, args, sender) => {
			const customer = this.getActiveCustomer(sender);
			if (!customer) return;

			logger.info("!su role", args[0]);

			if (args.length !== 1 || !["sub1", "sub2", "dom"].includes(args[0])) {
				customer.character.Tell("Whisper", "!su role [sub1|sub2|dom]");
				return;
			}

			customer.character.Tell("Whisper", "Role changed to " + args[0]);
			customer.role = args[0] as MagicCharacterRole;
			customer.applyRestraints();
		});


		this.registerSUCommand("points", (connection, args, sender) => {
			const customer = this.getActiveCustomer(sender);
			if (!customer) return;

			logger.info("!su points", args);

			const arg = args.shift();
			if (!arg) {
				customer.character.Tell("Whisper", "!su points [amount]");
				return;
			}

			const amount = parseInt(arg, 10);

			customer.character.Tell("Whisper", `Added ${amount} points`);
			customer.points += amount;
		});

		this.registerSUCommand("strike", (connection, args, sender) => {
			const customer = this.getActiveCustomer(sender);
			if (!customer) return;

			logger.info("!su strike");

			customer.character.Tell("Whisper", "Gave you one strike");
			customer.giveStrike();
		});
	}

	private onBuyCommand(connection: API_Connector, args: string[], sender: API_Character) {
		const customer = this.getActiveCustomer(sender.MemberNumber);
		if (!customer) {
			logger.error(`Recieved "buy" command from a non-customer: ${sender.VisibleName}, (${sender.MemberNumber})`);
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
				customer.points -= permissionCost;
				sender.Tell("Emote", `*Permission bought. Points remaining: ${customer.points}`);

				targetCustomer.allowedOrgasms += 1;
				target.Tell("Emote", `*${customer.name} has bought an orgasm permission for you. You have now ${targetCustomer.allowedOrgasms} permissions."`);
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
					sender.Tell("Whisper", "Eheh, so you'd like to see me tied up? Soo nice of you. But my Mistress ordered me to manage this place... maybe another time?");
					return;
				}

				logger.info(`${customer} bought punishment for ${targetCustomer}.`);
				customer.points -= punishmentCost;
				sender.Tell("Emote", `*Punishment bought. Points remaining: ${customer.points}`);

				target.Tell("Chat", `Oh ${targetCustomer.name}, it seems that ${customer.name} would really enjoy to see you in our punishment outfit. And since she is a paying customer… Let her enjoy your struggles.`);
				targetCustomer.applyPunishment();

			}
				break;

			case "adulation": {
				if (customer.points < adulationCost) {
					sender.Tell("Whisper", `You need ${adulationCost} points, and you only have ${customer.points}.`);
					return;
				}

				const subList = [];
				for (const [idx, potentialTarget] of this.customers) {
					if (potentialTarget.isSub() && !potentialTarget.beingPunished && !("adulation" in potentialTarget.orders))
						subList.push(potentialTarget);
				}

				if (subList.length === 0) {
					sender.Tell("Whisper", "There are no available submissive customers at the moment. You cannot buy this item.");
					return;
				}

				const targetSub = subList[Math.floor(Math.random() * subList.length)];
				customer.points -= adulationCost;
				logger.info(`${sender} bought adulation from ${targetSub.name}`);

				sender.Tell("Whisper", `${targetSub.name} will take care of that. ${customer.points} points remainining.`);
				targetSub.adulate(customer);
			}
				break;

			case "domlv2":
				if (customer.role === "dom") {
					if (customer.points < domLv2Cost) {
						sender.Tell("Whisper", `You need ${domLv2Cost} points, and you only have ${customer.points}.`);
						return;
					}

					logger.info(`${sender} bought DomLv2.`);
					customer.points -= domLv2Cost;
					sender.Tell("Emote", `*Level up bought. Points remaining: ${customer.points}`);

					customer.role = "dom2";
					sender.Tell("Whisper", "You can now freely change the vibrator settings. But remember that you can NEVER turn them off! Have fun.");
					break;
				}

			// eslint-disable-next-line no-fallthrough
			default: {
				const mess = [];
				mess.push("To buy an item say '!buy <item>. Here is a list of available items:");
				mess.push("-----------------------------------");
				mess.push(`Permission (${permissionCost} pt)`);
				mess.push(`Adulation (${adulationCost} pt)`);

				if (customer.role === "dom") {
					mess.push(`DomLv2 (change vibrator settings) (${domLv2Cost} pt)`);
				}
				mess.push("-----------------------------------");

				sender.Tell("Whisper", mess.join("\n"));
			}
				break;
		}
	}

	protected onCharacterLeft(connection: API_Connector, character: API_Character, intentional: boolean): void {
		// this.customers.delete(character.MemberNumber);
	}

	protected onCharacterEntered(connection: API_Connector, character: API_Character): void {
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

		if (!["Hybrid", "Automatic"].includes(character.rawData?.ArousalSettings?.Active)) {
			logger.info(`${character}: ${character.rawData?.ArousalSettings?.Active}`);
			kickReasons.push("Arousal must be either Hybrid or Automatic");
		}

		if (kickReasons.length > 0) {
			character.Tell("Emote", `*[The following is needed for that room to function:\n${kickReasons.map(s => " - " + s + ".").join("\n")}\n\nYou will be kicked in 10 seconds. You can change and comeback if you want.]`);
			if (character.IsRoomAdmin()) {
				character.Tell("Whisper", "[As you are a room admin, you will be allowed to stay.]");
				logger.info(`Not kicking room admin ${character})`);
				// } else if (!strict) {
				// 	character.Tell("Whisper", "[As you were already in the room when the bot started, you will be allowed to stay, but the bot will ignore you]");
				// 	logger.info(`Not kicking already present ${character}`);
				// 	return;
			} else {
				logger.info(`Kicking ${character}`);
				setTimeout(() => {
					void character.Kick();
				}, 10 * 1000);
				return;
			}
		}

		character.Tell("Emote", `*[ROOM EXPLANATION: orgasm are prohibited. More info in ${connection.Player.VisibleName} Bio. READ IT]`, character.MemberNumber);
		character.Tell("Emote", "*[Say or whisper '!leave' and all the locks on you will be unlocked, but you will also be kicked out.]");

		let customer = this.customers.get(character.MemberNumber);
		if (customer) {
			character.Tell("Chat", `Welcome back ${character.VisibleName}. Don't worry I didn't forget about you. Hihihi~`);

			if (customer.beingPunished) {
				customer.dressLike("doll");
				customer.dollLock();
				customer.applyRestraints(true);
			} else {
				customer.applyRestraints();
			}
		} else if (kickReasons.length === 0) {
			customer = new MagicCharacter(character);
			this.customers.set(character.MemberNumber, customer);
		}
	}

	protected onMessage(connection: API_Connector, message: BC_Server_ChatRoomMessage, sender: API_Character): void {
		if (sender.IsBot()) return;

		const customer = this.getActiveCustomer(sender.MemberNumber);
		if (!customer) return;

		const msg = message.Content;
		if (message.Type === "Action") {
			// console.log("msg :" + msg)
			// console.log("Keys :" + Object.keys(data.Dictionary))
			// console.log("Dictionary 0 :" + data.Dictionary[0].MemberNumber)
			if ((msg.includes("Vibe") || msg.includes("Dildo") || msg.includes("Buttplug")) && (msg.includes("creaseTo-1") || ((msg.includes("creaseTo") || msg.includes("ModeChange")) && customer.role !== "dom2"))) {
				connection.SendMessage("Chat", `${sender.VisibleName}! Do not mess with the vibrators, you are not allowed to do that. This is a strike for you!`);

				const target = this.getActiveCustomer(message.Dictionary[0].MemberNumber as number);
				if (!target) {
					logger.error(`failed to find target of vibe change message ${message}`);
				} else {
					const dildoAsset = target.character.Appearance.InventoryGet("ItemVulva");
					dildoAsset?.Vibrator?.SetIntensity(target.vulvaIntensity, false);
					const buttAsset = target.character.Appearance.InventoryGet("ItemButt");
					buttAsset?.Vibrator?.SetIntensity(target.buttIntensity, false);
				}
				connection.SendMessage("Emote", "*The vibrator automatically returns to the initial setting.");

				customer.giveStrike();
			}
		} else if (message.Type === "Activity") {
			if (msg.includes("OrgasmResist")) {
				logger.info(`${sender} resisted her orgasm`);
				customer.didOrgasm(false);
			} else if (msg.includes("Orgasm")) {
				logger.info(`${sender} failed to resist her orgasm`);
				customer.didOrgasm(true);
			}
		}
	}
}
