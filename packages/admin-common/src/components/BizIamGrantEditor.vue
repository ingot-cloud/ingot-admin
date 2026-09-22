<template>
  <div class="flex flex-col gap-16px">
    <div class="flex flex-col gap-8px">
      <div class="text-sm">操作</div>
      <div
        v-for="(item, index) in model.grants"
        :key="`grant-${index}`"
        class="flex flex-col gap-8px rounded-4px p-12px b b-solid b-[var(--el-border-color)]"
      >
        <template v-if="loadApplications && loadActions">
          <in-page-select
            v-model="applicationIds[index]"
            class="w-full"
            value-field="id"
            label-field="name"
            placeholder="请选择应用"
            :load-data="loadApplicationsOf"
            @change="privateOnApplicationChange(index)"
          />
          <in-page-select
            v-if="applicationIds[index]"
            :key="`${index}-${applicationIds[index]}`"
            v-model="item.actionId"
            class="w-full"
            value-field="id"
            label-field="name"
            placeholder="请选择操作"
            :load-data="loadActionsOf(index)"
            @change="privateTouch"
          />
        </template>
        <el-input v-else v-model="item.actionId" placeholder="请输入操作 ID" @change="privateTouch" />
        <biz-iam-scope-editor v-model="item.scopes" />
        <div>
          <in-button type="danger" @in-click="privateRemoveGrant(index)">删除</in-button>
        </div>
      </div>
      <in-button @in-click="privateAddGrant">添加操作</in-button>
    </div>
    <div v-if="allowDeltas" class="flex flex-col gap-8px">
      <div class="text-sm">租户差异</div>
      <biz-iam-delta-tags :items="model.deltas" />
      <div
        v-for="(item, index) in model.deltas"
        :key="`delta-${index}`"
        class="flex flex-col gap-8px rounded-4px p-12px b b-solid b-[var(--el-border-color)]"
      >
        <div class="flex flex-wrap items-center gap-8px">
          <el-input v-model="item.actionId" placeholder="请输入操作 ID" class="w-200px" @change="privateTouch" />
          <el-select v-model="item.operation" class="w-140px" placeholder="请选择差异类型" @change="privateTouch">
            <el-option
              v-for="option in deltaOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <in-button type="danger" @in-click="privateRemoveDelta(index)">删除</in-button>
        </div>
        <biz-iam-scope-editor v-if="needsDeltaScopes(item.operation)" v-model="item.scopes" />
      </div>
      <in-button @in-click="privateAddDelta">添加差异</in-button>
    </div>
    <div class="flex flex-col gap-8px">
      <div class="text-sm">命名参数</div>
      <div
        v-for="(item, index) in model.parameterDefinitions"
        :key="`param-${index}`"
        class="flex flex-wrap items-center gap-8px"
      >
        <el-input v-model="item.key" placeholder="请输入参数键" class="w-160px" @change="privateTouch" />
        <el-select v-model="item.kind" class="w-160px" placeholder="请选择参数类型" @change="privateTouch">
          <el-option
            v-for="option in bindingOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <in-button type="danger" @in-click="privateRemoveParameter(index)">删除</in-button>
      </div>
      <in-button @in-click="privateAddParameter">添加参数</in-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LoadDataParams, Page } from "@ingot/admin-core";
import BizIamDeltaTags from "./BizIamDeltaTags.vue";
import BizIamScopeEditor from "./BizIamScopeEditor.vue";
import {
  RoleDeltaOperation,
  ScopeBindingKind,
  ScopeKind,
  useRoleDeltaOperationEnum,
  useScopeBindingKindEnum,
  type IamSelectOption,
  type RoleDefinitionDraft,
} from "../models/iam";

defineOptions({ name: "BizIamGrantEditor" });

const props = withDefaults(
  defineProps<{
    allowDeltas?: boolean;
    loadApplications?: (params: LoadDataParams) => Promise<Page<IamSelectOption>>;
    loadActions?: (applicationId: string, params: LoadDataParams) => Promise<Page<IamSelectOption>>;
    initialApplicationIds?: string[];
    applicationNames?: Record<string, string>;
    actionNames?: Record<string, string>;
  }>(),
  {
    allowDeltas: false,
    initialApplicationIds: () => [],
    applicationNames: () => ({}),
    actionNames: () => ({}),
  },
);

const applicationIds = ref<string[]>([]);
const previousApplicationIds = ref<string[]>([]);

const model = defineModel<RoleDefinitionDraft>({
  default: () => ({ grants: [], deltas: [], parameterDefinitions: [] }),
});
const deltaOptions = useRoleDeltaOperationEnum().getOptions();
const bindingOptions = useScopeBindingKindEnum().getOptions();

const privateTouch = (): void => {
  model.value = {
    grants: [...model.value.grants],
    deltas: [...model.value.deltas],
    parameterDefinitions: [...model.value.parameterDefinitions],
    metadataOverrides: model.value.metadataOverrides,
  };
};

const needsDeltaScopes = (operation: RoleDeltaOperation): boolean =>
  operation === RoleDeltaOperation.ADD || operation === RoleDeltaOperation.REPLACE_SCOPE;

const syncApplications = (): void => {
  applicationIds.value = model.value.grants.map(
    (_, index) => props.initialApplicationIds[index] ?? applicationIds.value[index] ?? "",
  );
  previousApplicationIds.value = [...applicationIds.value];
};

const loadApplicationsOf = async (params: LoadDataParams): Promise<Page<IamSelectOption>> => {
  const page = await props.loadApplications!(params);
  if (params.current !== 1 || params.query) {
    return page;
  }
  const present = new Set((page.records ?? []).map((item) => item.id));
  const extra = applicationIds.value
    .filter((id, index, ids) => id && !present.has(id) && ids.indexOf(id) === index)
    .map((id) => ({ id, name: props.applicationNames[id] || id }));
  if (!extra.length) {
    return page;
  }
  return { ...page, records: [...extra, ...(page.records ?? [])] };
};

const loadActionsOf = (index: number) => async (params: LoadDataParams): Promise<Page<IamSelectOption>> => {
  const page = await props.loadActions!(applicationIds.value[index], params);
  const actionId = model.value.grants[index]?.actionId;
  const name = actionId ? props.actionNames[actionId] : "";
  if (
    params.current === 1 &&
    !params.query &&
    actionId &&
    name &&
    !(page.records ?? []).some((item) => item.id === actionId)
  ) {
    return { ...page, records: [{ id: actionId, name }, ...(page.records ?? [])] };
  }
  return page;
};

const privateOnApplicationChange = (index: number): void => {
  const next = applicationIds.value[index] ?? "";
  const previous = previousApplicationIds.value[index] ?? "";
  previousApplicationIds.value[index] = next;
  if (!previous || previous === next) {
    privateTouch();
    return;
  }
  model.value = {
    ...model.value,
    grants: model.value.grants.map((item, itemIndex) =>
      itemIndex === index ? { ...item, actionId: "" } : item,
    ),
  };
};

const privateAddGrant = (): void => {
  applicationIds.value = [...applicationIds.value, ""];
  previousApplicationIds.value = [...previousApplicationIds.value, ""];
  model.value = {
    ...model.value,
    grants: [...model.value.grants, { actionId: "", scopes: [{ kind: ScopeKind.ALL }] }],
  };
};

const privateRemoveGrant = (index: number): void => {
  applicationIds.value = applicationIds.value.filter((_, itemIndex) => itemIndex !== index);
  previousApplicationIds.value = previousApplicationIds.value.filter((_, itemIndex) => itemIndex !== index);
  model.value = {
    ...model.value,
    grants: model.value.grants.filter((_, itemIndex) => itemIndex !== index),
  };
};

syncApplications();
watch(() => props.initialApplicationIds.join("|"), syncApplications);
watch(
  () => model.value.grants.length,
  (length) => {
    if (props.loadApplications && props.loadActions && length === 0) {
      privateAddGrant();
    }
  },
  { immediate: true },
);

const privateAddDelta = (): void => {
  model.value = {
    ...model.value,
    deltas: [
      ...model.value.deltas,
      { actionId: "", operation: RoleDeltaOperation.ADD, scopes: [{ kind: ScopeKind.ALL }] },
    ],
  };
};

const privateRemoveDelta = (index: number): void => {
  model.value = {
    ...model.value,
    deltas: model.value.deltas.filter((_, itemIndex) => itemIndex !== index),
  };
};

const privateAddParameter = (): void => {
  model.value = {
    ...model.value,
    parameterDefinitions: [
      ...model.value.parameterDefinitions,
      { key: "", kind: ScopeBindingKind.DEPARTMENTS },
    ],
  };
};

const privateRemoveParameter = (index: number): void => {
  model.value = {
    ...model.value,
    parameterDefinitions: model.value.parameterDefinitions.filter((_, itemIndex) => itemIndex !== index),
  };
};
</script>
