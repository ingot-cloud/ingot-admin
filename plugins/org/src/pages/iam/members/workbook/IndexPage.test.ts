import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const dir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(resolve(dir, "IndexPage.vue"), "utf8");
const pickerSource = readFileSync(resolve(dir, "components/ExportScopePicker.vue"), "utf8");

describe("MemberWorkbookPage", () => {
  it("居中步骤页：分段选项、两张步骤卡、导入历史与范围导出", () => {
    expect(source).toContain("in-form-content");
    expect(source).toContain("export-scope-picker");
    expect(source).toContain("privateOpenScope");
    expect(source).not.toContain("BizIamMemberPickerDialog");
    expect(pickerSource).toContain("<department-mark");
    expect(pickerSource).not.toContain("ep:office-building");
    expect(source).toContain("导入新成员");
    expect(source).toContain("导出并修改成员信息");
    expect(source).toContain("你的导入历史");
    expect(source).toContain("noContentIllustration");
    expect(source).toContain("暂无数据");
    expect(source).toContain("我知道了");
    expect(source).toContain("编辑管理范围");
    expect(source).toContain("TenantMemberWorkbookImportAPI");
    expect(source).toContain("member-workbook-drop");
    expect(source).toContain("show-back");
    expect(source).toContain('<in-loading :loading="busy">');
    expect(source).toContain("width: max-content");
    expect(source).toContain(':loading="templateBusy" @in-click="privateDownloadTemplate"');
    expect(source).not.toContain(':loading="busy" @in-click="privateDownloadTemplate"');
    expect(source).not.toMatch(/:loading="busy"[\s\S]{0,80}@in-click="privateImport"/);
  });

  it("导出提交即返回，引导去「我的下载」而不是在页内轮询下载", () => {
    const exportBody = source.slice(
      source.indexOf("const privateExport"),
      source.indexOf("const privateImport"),
    );
    expect(exportBody).toContain("TenantMemberWorkbookExportAPI");
    expect(exportBody).toContain("router.push(DOWNLOAD_CENTER_PATH)");
    expect(exportBody).not.toContain("pollWorkbookTask");
    expect(exportBody).not.toContain("MemberWorkbookArtifact.WORKBOOK");
  });
});
