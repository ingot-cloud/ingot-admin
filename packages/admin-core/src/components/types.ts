export type InDensity = "compact" | "default";

export type InSurfaceVariant = "plain" | "bordered";

export type InNavigationMode = "expanded" | "collapsed" | "overlay";

export type InTableFeedback = "none" | "empty" | "no-result" | "error" | "unauthorized";

export type InDialogTone = "default" | "danger";

export type InPageScrollMode = "page" | "contained";

export type InPageSurface = "plain" | "workspace";

export type InTableActionKind = "detail" | "quick" | "default" | "danger";

export type InTableActionOverflow = "auto" | "never" | "always";

export type InTableActionConfirm = string | { title: string; description?: string };

export interface InTableAction<Row = unknown> {
  key: string;
  label: string;
  icon?: string;
  kind: InTableActionKind;
  permission?: string;
  disabled?: boolean;
  disabledReason?: string;
  group?: string;
  confirm?: InTableActionConfirm;
  priority?: number;
  overflow?: InTableActionOverflow;
  overflowGroup?: string;
  onSelect: (row: Row) => void;
}

export interface InAppBarUtilityAction {
  key: string;
  icon?: string;
  label: string;
  badge?: string | number;
  priority?: number;
  featureFlag?: boolean;
  onClick?: () => void;
}
