import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const drawerSource = readFileSync(resolve(dir, "DetailDrawer.vue"), "utf8");
const wizardSource = readFileSync(resolve(dir, "CreateWizard.vue"), "utf8");
const editSource = readFileSync(resolve(dir, "EntitlementEditWizard.vue"), "utf8");
const panelSource = readFileSync(resolve(dir, "EntitlementDraftPanel.vue"), "utf8");
const pickerSource = readFileSync(resolve(dir, "ApplicationPickerDialog.vue"), "utf8");
const previewSource = readFileSync(resolve(dir, "EntitlementPreview.vue"), "utf8");
const apiSource = readFileSync(resolve(dir, "../../../../api/iam/tenants.ts"), "utf8");
const catalogSource = readFileSync(resolve(dir, "../../../../api/iam/catalog.ts"), "utf8");
const wizardHelper = readFileSync(resolve(dir, "../wizard.ts"), "utf8");

describe("platform iam tenant detail entitlements", () => {
  it("开通列表按分页信封收齐，不把 data 当数组 map", () => {
    expect(apiSource).toContain("IamPageResponse<ResourceDetail<EntitlementRecord>>");
    expect(apiSource).toContain("toIamListParams(page)");
    expect(drawerSource).toContain("collectIamPageRecords");
    expect(drawerSource).toContain("entitlementCollectionVersion");
    expect(drawerSource).not.toContain("entitlementRes.data ?? []");
  });

  it("详情使用身份抬头和两个 Tab，开通只读预览后进全屏编辑", () => {
    expect(drawerSource).toContain("#identity");
    expect(drawerSource).toContain("in-detail-identity");
    expect(drawerSource).toContain('title="基础信息"');
    expect(drawerSource).toContain('title="应用开通"');
    expect(drawerSource).not.toContain('title="所有者"');
    expect(drawerSource).toContain(':editable="false"');
    expect(drawerSource).toContain("entitlement-edit-wizard");
    expect(editSource).toContain('size="100%"');
    expect(editSource).toContain("ENTITLEMENT_WIZARD_STEPS");
  });

  it("创建组织使用全屏向导并上传头像", () => {
    expect(wizardSource).toContain('size="100%"');
    expect(wizardSource).toContain("CREATE_WIZARD_STEPS");
    expect(wizardSource).toContain("TENANT_AVATAR_DIR");
    expect(wizardSource).toContain("v-model:avatar");
  });

  it("创建与编辑开通共用套餐下拉、双栏选应用，并集走 preview", () => {
    expect(wizardHelper).toContain("选择套餐与自选应用");
    expect(wizardHelper).toContain("ENTITLEMENT_WIZARD_STEPS");
    expect(wizardSource).toContain("entitlement-draft-panel");
    expect(wizardSource).toContain("applications:");
    expect(editSource).toContain("entitlement-draft-panel");
    expect(editSource).toContain("extraSelectOptionsOf");
    expect(editSource).toContain("planId:");
    expect(editSource).not.toContain("请至少选择一个应用");
    expect(panelSource).toContain("PlatformPlanSummaryPageAPI");
    expect(panelSource).toContain("PlatformApplicationSummaryPageAPI");
    expect(panelSource).toContain("application-picker-dialog");
    expect(panelSource).not.toContain("applicationIds");
    expect(pickerSource).toContain('title="选择应用"');
    expect(pickerSource).toContain("全选本页");
    expect(pickerSource).not.toContain("in-avatar");
    expect(catalogSource).toContain("CatalogRecordView.SUMMARY");
    expect(drawerSource).toContain("planId: detail.value.record.planId");
    expect(wizardSource).toContain('v-show="step === 2"');
    expect(panelSource).toContain("locked-ids");
    expect(panelSource).toContain("不填则无限使用");
    expect(panelSource).toContain("请选择开通状态");
    expect(panelSource).toContain("isStatusEditable");
    expect(pickerSource).toContain("lockedIds");
    expect(wizardHelper).toContain("无限使用");
    expect(previewSource).toContain("--in-color-primary");
    expect(previewSource).toContain("--in-color-warning");
  });
});
