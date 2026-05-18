import { Permission } from "@guidora/contracts";

export type PermissionedNavItem = {
  title: string;
  url: string;
  requiredPermission?: Permission;
  items?: PermissionedNavItem[];
};

export type PermissionedNavGroup<TItem extends PermissionedNavItem = PermissionedNavItem> = {
  label: string;
  items: TItem[];
};

export function hasPermission(
  permissions: readonly string[],
  requiredPermission: Permission
): boolean {
  return permissions.includes(requiredPermission);
}

export function filterNavGroupsByPermissions<TItem extends PermissionedNavItem>(
  groups: PermissionedNavGroup<TItem>[],
  permissions: readonly string[]
): PermissionedNavGroup<TItem>[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .map((item) => filterNavItem(item, permissions))
        .filter((item): item is TItem => Boolean(item))
    }))
    .filter((group) => group.items.length > 0);
}

function filterNavItem<TItem extends PermissionedNavItem>(
  item: TItem,
  permissions: readonly string[]
): TItem | null {
  if (item.requiredPermission && !hasPermission(permissions, item.requiredPermission)) {
    return null;
  }

  if (!item.items?.length) {
    return item;
  }

  const children = item.items
    .map((child) => filterNavItem(child, permissions))
    .filter((child): child is PermissionedNavItem => Boolean(child));

  if (children.length === 0 && item.url === "#") {
    return null;
  }

  return {
    ...item,
    items: children
  };
}
