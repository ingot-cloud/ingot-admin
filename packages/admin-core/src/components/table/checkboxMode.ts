export type InTableCheckboxMode = "on" | "off" | "disabled";

export type InTableCheckboxSpec<Row = unknown> =
  | InTableCheckboxMode
  | {
      bivarianceHack(row: Row): InTableCheckboxMode;
    }["bivarianceHack"];

export type InTableRowPredicate<Row = unknown> = {
  bivarianceHack(row: Row): boolean;
}["bivarianceHack"];

export const asCheckboxMode = (
  value: InTableCheckboxMode | boolean | undefined,
  fallback: InTableCheckboxMode = "off",
): InTableCheckboxMode => {
  if (value === true || value === "on") {
    return "on";
  }
  if (value === false || value === "off") {
    return "off";
  }
  if (value === "disabled") {
    return "disabled";
  }
  return fallback;
};

export const isTreeCheckboxEnabled = (spec: InTableCheckboxSpec | undefined): boolean =>
  spec != null && spec !== "off";

export const resolveRowCheckboxMode = <Row>(
  spec: InTableCheckboxSpec<Row> | undefined,
  row: Row,
): InTableCheckboxMode => {
  if (spec == null) {
    return "off";
  }
  if (typeof spec === "function") {
    return spec(row);
  }
  return spec;
};
