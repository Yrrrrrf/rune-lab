import type { SettingsFieldSchema } from "rune-lab/core";
import type { SettingsSection } from "rune-lab/ui";

export interface FieldGroup {
	id: string;
	label: string;
	fields: SettingsFieldSchema[];
	pluginId?: string;
}

export interface SidebarEntry {
	id: string;
	label: string;
	icon: string;
}

export interface ModalModel {
	sidebar: SidebarEntry[];
	generalGroups: FieldGroup[];
	standalone: Map<string, SettingsSection>;
}

export function deriveModalModel(raw: SettingsSection[]): ModalModel {
	const generalGroups: FieldGroup[] = [];
	const standalone = new Map<string, SettingsSection>();

	for (const section of raw) {
		if (section.component) {
			standalone.set(section.id, section);
		} else if (section.fields && section.fields.length > 0) {
			generalGroups.push({
				id: section.id,
				label: section.label,
				fields: section.fields,
				pluginId: section.pluginId,
			});
		}
	}

	const sidebar: SidebarEntry[] = [
		{ id: "general", label: "General", icon: "⚙️" },
	];

	for (const [id, section] of standalone) {
		sidebar.push({
			id,
			label: section.label,
			icon: section.icon ?? "•",
		});
	}

	return {
		sidebar,
		generalGroups,
		standalone,
	};
}
