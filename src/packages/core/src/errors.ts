import { Data } from "effect";

interface TaggedErrorInstance<Tag extends string> {
	readonly _tag: Tag;
}

type TaggedErrorConstructor<Tag extends string, Fields> = new (
	args: Fields,
) => TaggedErrorInstance<Tag> & Fields;

const MissingRequirementBase: TaggedErrorConstructor<
	"MissingRequirement",
	{ readonly pluginId: string; readonly requiredId: string }
> = Data.TaggedError("MissingRequirement");

export class MissingRequirement extends MissingRequirementBase {
	get message(): string {
		return `[Kernel] Missing requirement: Plugin "${this.pluginId}" requires "${this.requiredId}", but "${this.requiredId}" is not provided.`;
	}
}

const DuplicatePluginIdBase: TaggedErrorConstructor<
	"DuplicatePluginId",
	{ readonly pluginId: string }
> = Data.TaggedError("DuplicatePluginId");

export class DuplicatePluginId extends DuplicatePluginIdBase {
	get message(): string {
		return `[Kernel] Plugin "${this.pluginId}" was registered twice with two different plugin objects. Pass only one.`;
	}
}

const CircularPluginDependencyBase: TaggedErrorConstructor<
	"CircularPluginDependency",
	{ readonly cycle: string[] }
> = Data.TaggedError("CircularPluginDependency");

export class CircularPluginDependency extends CircularPluginDependencyBase {
	get message(): string {
		return `[Kernel] Circular dependency detected in plugins: ${this.cycle.join(
			" -> ",
		)}`;
	}
}

const CircularSlotDependencyBase: TaggedErrorConstructor<
	"CircularSlotDependency",
	{ readonly cycle: string[] }
> = Data.TaggedError("CircularSlotDependency");

export class CircularSlotDependency extends CircularSlotDependencyBase {
	get message(): string {
		return `[Kernel] Circular dependency detected in slots: ${this.cycle.join(
			" -> ",
		)}`;
	}
}

const UnresolvableSlotRefBase: TaggedErrorConstructor<
	"UnresolvableSlotRef",
	{ readonly ref: string; readonly declaringPluginId: string }
> = Data.TaggedError("UnresolvableSlotRef");

export class UnresolvableSlotRef extends UnresolvableSlotRefBase {
	get message(): string {
		return `[Kernel] Cannot resolve slot reference "${this.ref}" declared in plugin "${this.declaringPluginId}"`;
	}
}

const UndeclaredCrossPluginDependencyBase: TaggedErrorConstructor<
	"UndeclaredCrossPluginDependency",
	{
		readonly slotName: string;
		readonly pluginId: string;
		readonly dep: string;
		readonly targetPluginId: string;
	}
> = Data.TaggedError("UndeclaredCrossPluginDependency");

export class UndeclaredCrossPluginDependency extends UndeclaredCrossPluginDependencyBase {
	get message(): string {
		return `[Kernel] Invalid dependency: Slot "${this.slotName}" in plugin "${this.pluginId}" depends on "${this.dep}", but "${this.targetPluginId}" is not in the requires spec of "${this.pluginId}".`;
	}
}

const SlotConfigInvalidBase: TaggedErrorConstructor<
	"SlotConfigInvalid",
	{
		readonly pluginId: string;
		readonly slotName: string;
		readonly parseError: string;
	}
> = Data.TaggedError("SlotConfigInvalid");

export class SlotConfigInvalid extends SlotConfigInvalidBase {
	get message(): string {
		return `Config validation failed for plugin "${this.pluginId}", slot "${this.slotName}": ${this.parseError}`;
	}
}

const SlotInitFailedBase: TaggedErrorConstructor<
	"SlotInitFailed",
	{ readonly slotId: string; readonly cause: unknown }
> = Data.TaggedError("SlotInitFailed");

export class SlotInitFailed extends SlotInitFailedBase {
	get message(): string {
		return `[Kernel] Failed to initialize slot "${this.slotId}": ${
			this.cause instanceof Error ? this.cause.message : String(this.cause)
		}`;
	}
}

const SlotDisposeFailedBase: TaggedErrorConstructor<
	"SlotDisposeFailed",
	{ readonly slotId: string; readonly cause: unknown }
> = Data.TaggedError("SlotDisposeFailed");

export class SlotDisposeFailed extends SlotDisposeFailedBase {
	get message(): string {
		return `[Kernel] Error disposing store ${this.slotId}: ${
			this.cause instanceof Error ? this.cause.message : String(this.cause)
		}`;
	}
}
