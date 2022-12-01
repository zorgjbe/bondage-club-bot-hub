// -----------------------------------------------------------------------------------------------

import { AssetGet, JMod, logger } from "bondage-club-bot-api";

type MS_ChatRoomMessageDictionaryEntryType =
	| "SourceCharacter"
	| "DestinationCharacter"
	| "DestinationCharacterName"
	| "TargetCharacter"
	| "TargetCharacterName"
	| "AssetName";

interface MS_ChatRoomMessageDictionaryEntry {
	[k: string]: any;
	Tag?: MS_ChatRoomMessageDictionaryEntryType | string;
	Text?: string;
	MemberNumber?: number;
}

// -----------------------------------------------------------------------------------------------

// function freeAll() {
// 	for (var R = 0; R < ChatRoomCharacter.length; R++) {
// 		removeRestrains(R)
// 		reapplyClothing(ChatRoomCharacter[R])
// 		ChatRoomCharacterUpdate(ChatRoomCharacter[R])
// 	}
// 	ServerSend("ChatRoomChat", { Content: "*Everyone has been freed.", Type: "Emote" });
// }

export function removeRestraints(target: API_Character) {
	target.Appearance.RemoveItem("ItemVulva");
	target.Appearance.RemoveItem("ItemButt");
	target.Appearance.RemoveItem("ItemArms");
	target.Appearance.RemoveItem("ItemHands");
	target.Appearance.RemoveItem("ItemNeck");
	target.Appearance.RemoveItem("ItemMouth");
	target.Appearance.RemoveItem("ItemMouth2");
	target.Appearance.RemoveItem("ItemMouth3");
	target.Appearance.RemoveItem("ItemTorso");
	target.Appearance.RemoveItem("ItemLegs");
	target.Appearance.RemoveItem("ItemFeet");
	target.Appearance.RemoveItem("ItemBoots");
	target.Appearance.RemoveItem("ItemNipplesPiercings");
	target.Appearance.RemoveItem("ItemPelvis");
	target.Appearance.RemoveItem("ItemHead");
	target.Appearance.RemoveItem("ItemDevices");
}

function removeClothes(target: API_Character, removeUnderwear = true) {
	target.Appearance.RemoveItem("Cloth");
	target.Appearance.RemoveItem("ClothLower");
	target.Appearance.RemoveItem("ClothAccessory");
	target.Appearance.RemoveItem("Suit");
	target.Appearance.RemoveItem("SuitLower");
	target.Appearance.RemoveItem("Gloves");
	target.Appearance.RemoveItem("Shoes");
	target.Appearance.RemoveItem("Hat");
	if (removeUnderwear) {
		target.Appearance.RemoveItem("Socks");
		target.Appearance.RemoveItem("Bra");
		target.Appearance.RemoveItem("Panties");
	}
}

export function dollify(target: API_Character, mustKneel = false, mustStand = false) {
	dressLike(target, "doll");
	// TODO: BotAPI doesn't support pose change on others
	// if (mustKneel) { CharacterSetActivePose(ChatRoomCharacter[R], "Kneel") }
	// if (mustStand) { CharacterSetActivePose(ChatRoomCharacter[R], null) }
	//InventoryWear(ChatRoomCharacter[R], "OneBarPrison","ItemDevices",hairColor)
}

export type dressType = "doll" | "talkingDoll" | "maid" | "cow" | "pony" | "kitty" | "puppy" | "trainer" | "mistress";

export type dressLikeOpts = {
	dressColor?: string;
	removeUnderwear?: boolean;
	lockType?: AssetLockType;
	lockOpts?: API_Lock_Options;
};

export function dressLike(target: API_Character, dress: dressType, opts?: dressLikeOpts) {
	let dressColor = opts?.dressColor ?? "Default";
	const removeUnderwear = opts?.removeUnderwear ?? true;
	const lockType = opts?.lockType ?? null;
	const lockOpts = (lockType && opts?.lockOpts) ?? null;

	// TODO: backup appearance
	memorizeClothing(target);
	removeClothes(target, removeUnderwear);

	const shouldLock = (lockType && lockOpts);

	// Get the hair color
	if (dressColor === "hair" || dress === "doll" || dress === "talkingDoll") {
		const backHair = target.Appearance.InventoryGet("HairBack");
		const color = backHair?.Color;
		if (Array.isArray(color))
			dressColor = color[0];
		else
			dressColor = color || "Default";
	} else if (!dressColor.startsWith("#")) {
		dressColor = "Default";
	}

	let item: API_AppearanceItem | null;
	if (dress === "doll" || dress === "talkingDoll") {
		// remove all previous restrains
		removeRestraints(target);

		// Restrain
		item = target.Appearance.AddItem(AssetGet("Socks", "LatexSocks1"));
		item?.SetColor(dressColor);
		item = target.Appearance.AddItem(AssetGet("ItemTorso", "LatexCorset1"));
		item?.SetColor(dressColor);
		if (shouldLock) item?.AddLock(lockType, lockOpts);
		item = target.Appearance.AddItem(AssetGet("ItemBoots", "ThighHighLatexHeels"));
		item?.SetColor(dressColor);
		if (shouldLock) item?.AddLock(lockType, lockOpts);
		item = target.Appearance.AddItem(AssetGet("ItemArms", "BoxTieArmbinder"));
		item?.SetColor(dressColor);
		item?.SetDifficulty(100);
		if (shouldLock) item?.AddLock(lockType, lockOpts);
		if (dress !== "talkingDoll") {
			item = target.Appearance.AddItem(AssetGet("ItemMouth", "ClothStuffing"));
			item?.SetColor(dressColor);
			item = target.Appearance.AddItem(AssetGet("ItemMouth2", "HarnessPanelGag"));
			item?.SetColor(dressColor);
			item = target.Appearance.AddItem(AssetGet("ItemMouth3", "LatexPostureCollar"));
			item?.SetColor(dressColor);
			if (shouldLock) item?.AddLock(lockType, lockOpts);
		}
		item = target.Appearance.AddItem(AssetGet("ItemHead", "LatexBlindfold"));
		item?.SetColor(dressColor);
		if (shouldLock) item?.AddLock(lockType, lockOpts);
		item = target.Appearance.AddItem(AssetGet("ClothLower", "LatexSkirt1"));
		item?.SetColor(dressColor);

		item = target.Appearance.AddItem(AssetGet("ItemFeet", "SpreaderMetal"));
		item?.SetColor(dressColor);
		if (shouldLock) item?.AddLock(lockType, lockOpts);
		item = target.Appearance.AddItem(AssetGet("ItemLegs", "LeatherLegCuffs"));
		item?.SetColor(dressColor);
		if (shouldLock) item?.AddLock(lockType, lockOpts);

	} else if (dress === "maid") {
		item = target.Appearance.AddItem(AssetGet("Socks", "Socks5"));
		item?.SetColor("#d2d2d2");
		item = target.Appearance.AddItem(AssetGet("Shoes", "Shoes4"));
		item = target.Appearance.AddItem(AssetGet("Cloth", "MaidOutfit1"));
		item = target.Appearance.AddItem(AssetGet("ClothAccessory", "FrillyApron"));
		item = target.Appearance.AddItem(AssetGet("Hat", "MaidHairband1"));
		item = target.Appearance.AddItem(AssetGet("ItemNeck", "MaidCollar"));
	} else if (dress === "cow") {
		item = target.Appearance.AddItem(AssetGet("Panties", "CowPrintedPanties"));
		item = target.Appearance.AddItem(AssetGet("HairAccessory1", "Horns2"));
		item?.SetColor("#FFFFFF");
		item = target.Appearance.AddItem(AssetGet("ItemArms", "LeatherArmbinder"));
		item?.SetDifficulty(50);
		item = target.Appearance.AddItem(AssetGet("Shoes", "PonyBoots"));
		item = target.Appearance.AddItem(AssetGet("Socks", "CowPrintedSocks"));
		item = target.Appearance.AddItem(AssetGet("Gloves", "CowPrintedGloves"));
		item = target.Appearance.AddItem(AssetGet("ItemButt", "Cowtail"));
		item = target.Appearance.AddItem(AssetGet("ItemTorso", "LeatherStrapHarness"));
	} else if (dress === "pony") {
		item = target.Appearance.AddItem(AssetGet("ItemButt", "HorsetailPlug"));
		item?.SetColor(dressColor);
		item = target.Appearance.AddItem(AssetGet("ItemArms", "LeatherArmbinder"));
		item?.SetColor(dressColor);
		item?.SetDifficulty(50);
		item = target.Appearance.AddItem(AssetGet("ItemMouth", "HarnessPonyBits"));
		item?.SetColor(dressColor);
		item = target.Appearance.AddItem(AssetGet("Shoes", "PonyBoots"));
		item?.SetColor(dressColor);
		item = target.Appearance.AddItem(AssetGet("ItemTorso", "LeatherHarness"));
		item?.SetColor(dressColor);

	} else if (dress === "kitty") {
		item = target.Appearance.AddItem(AssetGet("ItemButt", "TailButtPlug"));
		item?.SetColor(dressColor);
		item = target.Appearance.AddItem(AssetGet("ItemArms", "BitchSuit"));
		item?.SetColor(dressColor);
		item = target.Appearance.AddItem(AssetGet("ItemMouth2", "KittyGag"));
		item?.SetColor(dressColor);
		item = target.Appearance.AddItem(AssetGet("ItemNeck", "LeatherChoker"));
		item = target.Appearance.AddItem(AssetGet("ItemNeckAccessories", "CollarBell"));
		//InventoryWear(ChatRoomCharacter[R], "HarnessBallGag","ItemMouth",dressColor)
		item = target.Appearance.AddItem(AssetGet("HairAccessory1", "Ears2"));
		item?.SetColor(dressColor);

	} else if (dress === "puppy") {
		item = target.Appearance.AddItem(AssetGet("TailStraps", "WolfTailStrap3"));
		item?.SetColor(dressColor);
		item = target.Appearance.AddItem(AssetGet("ItemArms", "BitchSuit"));
		item?.SetColor(dressColor);
		//InventoryWear(ChatRoomCharacter[R], "KittyGag","ItemMouth2",dressColor)
		//InventoryWear(ChatRoomCharacter[R], "DogMuzzleExposed","ItemMouth",dressColor)
		//InventoryWear(ChatRoomCharacter[R], "XLBoneGag","ItemMouth",dressColor)
		item = target.Appearance.AddItem(AssetGet("ItemNeck", "LeatherChoker"));
		item?.SetColor(dressColor);
		//InventoryWear(ChatRoomCharacter[R], "CollarBell","ItemNeckAccessories")
		//InventoryWear(ChatRoomCharacter[R], "HarnessBallGag","ItemMouth",dressColor)
		item = target.Appearance.AddItem(AssetGet("HairAccessory1", "PuppyEars1"));
		item?.SetColor(dressColor);

	} else if (dress === "trainer") {
		item = target.Appearance.AddItem(AssetGet("ClothLower", "Jeans1"));
		item?.SetColor("#bbbbbb");
		item = target.Appearance.AddItem(AssetGet("Shoes", "Boots1"));
		item?.SetColor("#3d0200");
		item = target.Appearance.AddItem(AssetGet("Gloves", "Gloves1"));
		item?.SetColor("#cccccc");
		item = target.Appearance.AddItem(AssetGet("Cloth", "TShirt1"));
		item?.SetColor("#aa8080");
		item = target.Appearance.AddItem(AssetGet("Hat", "Beret1"));
		item?.SetColor("#202020");

	} else if (dress === "mistress") {
		item = target.Appearance.AddItem(AssetGet("Shoes", "MistressBoots"));
		item?.SetColor(dressColor);
		item = target.Appearance.AddItem(AssetGet("Gloves", "MistressGloves"));
		item?.SetColor(dressColor);
		item = target.Appearance.AddItem(AssetGet("Cloth", "MistressTop"));
		item?.SetColor(dressColor);
		item = target.Appearance.AddItem(AssetGet("ClothLower", "MistressBottom"));
		item?.SetColor(dressColor);
	}
}

export function freeCharacter(target: API_Character, reapplyCloth = true): void {
	removeRestraints(target);
	if (reapplyCloth)
		reapplyClothing(target);
}

function InventoryDoItemsExposeGroup(C: API_Character, TargetGroup: AssetGroupName, GroupsToCheck: AssetGroupName[]): boolean {
	return GroupsToCheck.every((Group) => {
		const Item = C.Appearance.InventoryGet(Group);
		return !Item || Item.Asset.Expose.includes(TargetGroup);
	});
}

function InventoryDoItemsBlockGroup(C: API_Character, TargetGroup: AssetGroupItemName, GroupsToCheck: AssetGroupName[]): boolean {
	return GroupsToCheck.some((Group) => {
		const Item = C.Appearance.InventoryGet(Group);
		return Item && Item.Asset.Block && Item.Asset.Block.includes(TargetGroup);
	});
}

export function isExposed(C: API_Character, ignoreItemArray: string[] = []): boolean {
	return (
		InventoryDoItemsExposeGroup(C, "ItemBreast", ["Cloth"]) &&
		InventoryDoItemsExposeGroup(C, "ItemBreast", ["Bra"]) &&
		!InventoryDoItemsBlockGroup(C, "ItemVulva", ["Cloth", "Socks", "ItemPelvis", "ItemVulvaPiercings"]) &&
		InventoryDoItemsExposeGroup(C, "ItemVulva", ["ClothLower", "Panties"]) &&
		!customInventoryGroupIsBlocked(C, "ItemNipples") &&
		!customInventoryGroupIsBlocked(C, "ItemVulva", ignoreItemArray)
	);
}

export function customInventoryGroupIsBlocked(C: API_Character, GroupName: AssetGroupItemName, ignoreItemArray: string[] = []) {
	// in this case C is ChatRoomCharacter
	// Items can block each other (hoods blocks gags, belts blocks eggs, etc.)
	for (const E of C.Appearance.Appearance) {
		if (ignoreItemArray.includes(E.Asset.Name)) continue;
		if (!E.Asset.Group.Clothing && E.GetBlock().includes(GroupName)) return true;
	}

	// Nothing is preventing the group from being used
	return false;

}

//-------------------------------------------------------------------------------------------------------------------------

const clothMemoryList = new Map<number, string>();

export function memorizeClothing(char: API_Character) {
	// Do not lose saved outfits
	let app = clothMemoryList.get(char.MemberNumber);
	if (app) return;

	app = JMod.JMod_exportAppearanceBundle(char.Appearance.MakeAppearanceBundle());
	logger.verbose(`Saved outfit for ${char}`);
	clothMemoryList.set(char.MemberNumber, app);
}


export function reapplyClothing(char: API_Character) {
	const app = clothMemoryList.get(char.MemberNumber);
	if (!app) return;

	try {
		const bundle = JMod.JMod_importAppearanceBundle(app);
		if (!JMod.JMod_applyAppearanceBundle(char, bundle, undefined, undefined, true))
			logger.alert(`failed to restore appearance for ${char.VisibleName} (${char.MemberNumber})\n\t${bundle}`);
		logger.verbose(`Applied outfit for ${char}`);
		clothMemoryList.delete(char.MemberNumber);
	}
	catch {
		logger.alert(`failed to unpack appearance for ${char.VisibleName} (${char.MemberNumber})\n\t${app}`);
	}
}

export function lookUpTagInChatMessage(data: BC_Server_ChatRoomMessage, tag: string) {
	if (!data.Dictionary) return undefined;

	// logger.info(`${JSON.stringify(data.Dictionary)}`);
	for (const [_s, D] of Object.entries(data.Dictionary as MS_ChatRoomMessageDictionaryEntry[])) {
		// logger.info(`${JSON.stringify(D)}: ${D.Tag}`);
		if (tag === "TargetMemberNumber" && ["DestinationCharacter", "DestinationCharacterName", "TargetCharacter", "TargetCharacterName"].includes(D.Tag) && D.MemberNumber)
			return D.MemberNumber;

		if (["ActivityName", "ActivityGroup"].includes(tag) && D.Text) {
			if (tag === D.Tag) return D.Text;
		}
	}
	return undefined;
}
