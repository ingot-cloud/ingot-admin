import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(dir, "IndexPage.vue"), "utf8");
const pickerSource = readFileSync(resolve(dir, "components/DepartmentScopePicker.vue"), "utf8");

describe("DepartmentWorkbookPage", () => {
  it("居中步骤页：分段选项、两张步骤卡、导入历史与范围导出", () => {
    expect(source).toContain("in-form-content");
    expect(source).toContain("department-scope-picker");
    expect(source).toContain("privateOpenScope");
    expect(source).not.toContain("ExportScopePicker");
    expect(source).not.toContain("BizIamMemberPickerDialog");
    expect(pickerSource).toContain("<department-mark");
    expect(pickerSource).toContain("dept-pick-node");
    expect(pickerSource).toContain("--el-tree-node-content-height: 48px");
    expect(pickerSource).toContain("TenantDepartmentTreeAPI");
    expect(pickerSource).not.toContain("loadMembers");
    expect(source).toContain("导入新部门");
    expect(source).toContain("导出并修改部门信息");
    expect(source).toContain("你的导入历史");
    expect(source).toContain("noContentIllustration");
    expect(source).toContain("暂无数据");
    expect(source).toContain("我知道了");
    expect(source).toContain("编辑管理范围");
    expect(source).toContain("部分部门");
    expect(source).toContain("TenantDepartmentWorkbookImportAPI");
    expect(source).toContain("dept-workbook-drop");
    expect(source).toContain("show-back");
    expect(source).toContain('<in-loading :loading="busy">');
    expect(source).toContain("width: max-content");
    expect(source).toContain(':loading="templateBusy" @in-click="privateDownloadTemplate"');
    expect(source).not.toContain(':loading="busy" @in-click="privateDownloadTemplate"');
    expect(source).toContain("statusEnum.getTagText");
    expect(source).toContain("成功 {{ result?.successCount ?? 0 }} 个部门");
    expect(source).not.toContain("passwordAvailable");
  });

  it("导出提交即返回，引导去「我的下载」而不是在页内轮询下载", () => {
    const exportBody = source.slice(
      source.indexOf("const privateExport"),
      source.indexOf("const privateImport"),
    );
    expect(exportBody).toContain("TenantDepartmentWorkbookExportAPI");
    expect(exportBody).toContain("router.push(DOWNLOAD_CENTER_PATH)");
    expect(exportBody).toContain("DOWNLOAD_CENTER_TITLE");
    expect(exportBody).not.toContain("pollWorkbookTask");
    expect(exportBody).not.toContain("MemberWorkbookArtifact.WORKBOOK");
  });

  it("部分范围未选时禁用确定，默认全部", () => {
    expect(source).toContain('scopeKind.value = "all"');
    expect(source).toContain(':disabled="scopeKind === \'partial\' && scopeDepartmentIds.length === 0"');
    expect(source).toContain("所选范围内没有可导出的部门");
  });
});
